/**
 * Offline Queue Service
 * IndexedDB-based queue for offline operation persistence using Dexie
 */

import Dexie, { type Table } from 'dexie';
import type { QueuedOperation } from '../types/classroom';

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * ClassroomDB - Dexie database wrapper
 */
class ClassroomDB extends Dexie {
	queue!: Table<QueuedOperation, string>;

	constructor() {
		super('ClassroomPlinko');

		this.version(1).stores({
			queue: 'id, operation, class_id, timestamp'
		});
	}
}

// Singleton instance
const db = new ClassroomDB();

/**
 * Add operation to queue
 */
export async function queueOperation(operation: Omit<QueuedOperation, 'id'>): Promise<string> {
	const id = generateUUID();
	await db.queue.add({ ...operation, id } as QueuedOperation);
	return id;
}

/**
 * Get all unsynced operations sorted by timestamp
 */
export async function getQueuedOperations(): Promise<QueuedOperation[]> {
	return await db.queue
		.orderBy('timestamp')
		.filter((op) => !op.synced)
		.toArray();
}

/**
 * Mark operation as synced
 */
export async function markSynced(operationId: string): Promise<void> {
	await db.queue.update(operationId, { synced: true });
}

/**
 * Delete synced operations older than specified days
 */
export async function cleanupSyncedOperations(daysOld: number = 7): Promise<number> {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);
	const cutoffTimestamp = cutoffDate.toISOString();

	const oldSynced = await db.queue
		.filter((op) => op.synced && op.timestamp < cutoffTimestamp)
		.toArray();

	if (oldSynced.length === 0) return 0;

	await db.queue.bulkDelete(oldSynced.map((op) => op.id!));
	return oldSynced.length;
}

/**
 * Get count of pending (unsynced) operations
 */
export async function getPendingCount(): Promise<number> {
	return await db.queue.filter((op) => !op.synced).count();
}

/**
 * Clear all operations (use with caution!)
 */
export async function clearAllOperations(): Promise<void> {
	await db.queue.clear();
}

/**
 * Increment retry count for an operation
 */
export async function incrementRetryCount(operationId: string): Promise<number> {
	const operation = await db.queue.get(operationId);
	if (!operation) {
		throw new Error(`Operation not found: ${operationId}`);
	}

	const newRetryCount = operation.retry_count + 1;
	await db.queue.update(operationId, { retry_count: newRetryCount });
	return newRetryCount;
}

export { db as queueDB };
