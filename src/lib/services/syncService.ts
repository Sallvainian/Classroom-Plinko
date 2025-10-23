/**
 * Sync Service
 * Orchestrates offline queue sync with exponential backoff retry
 */

import {
	getQueuedOperations,
	markSynced,
	incrementRetryCount,
	cleanupSyncedOperations
} from './offlineQueue';
import {
	addClassPoints,
	subtractClassChip,
	resetClassChips,
	getAllClasses,
	subscribeToClasses
} from './supabase';
import { classesCache, syncStatus } from '../stores/classroom';
import type { QueuedOperation, SyncResult } from '../types/classroom';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 16000; // 16 seconds
const AUTO_SYNC_INTERVAL_MS = 60000; // 60 seconds

let autoSyncInterval: ReturnType<typeof setInterval> | null = null;
let realtimeUnsubscribe: (() => void) | null = null;

/**
 * Process a single queued operation
 */
async function processOperation(operation: QueuedOperation): Promise<void> {
	const { operation: opType, class_id, payload } = operation;

	switch (opType) {
		case 'add_points':
			if (typeof payload.points !== 'number' || typeof payload.slot_index !== 'number') {
				throw new Error('Invalid payload for add_points operation');
			}
			await addClassPoints(class_id, payload.points, payload.slot_index);
			break;

		case 'subtract_chip':
			await subtractClassChip(class_id);
			break;

		case 'reset_chips':
			await resetClassChips(class_id);
			break;

		case 'undo':
			// Future implementation: undo last drop
			throw new Error('Undo operation not yet implemented');

		default:
			throw new Error(`Unknown operation type: ${opType}`);
	}
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(retryCount: number): number {
	const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
	return delay;
}

/**
 * Sync all queued operations to Supabase
 */
export async function syncQueuedOperations(): Promise<SyncResult> {
	const operations = await getQueuedOperations();

	if (operations.length === 0) {
		return {
			success: true,
			synced_count: 0,
			failed_count: 0,
			errors: []
		};
	}

	syncStatus.set('syncing');

	let synced_count = 0;
	let failed_count = 0;
	const errors: Array<{ operation_id: string; error: string }> = [];

	for (const operation of operations) {
		try {
			// Check retry limit
			if (operation.retry_count >= MAX_RETRIES) {
				failed_count++;
				errors.push({
					operation_id: operation.id!,
					error: `Max retries (${MAX_RETRIES}) exceeded`
				});
				continue;
			}

			// Process operation
			await processOperation(operation);

			// Mark as synced
			await markSynced(operation.id!);
			synced_count++;
		} catch (error) {
			failed_count++;
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			errors.push({
				operation_id: operation.id!,
				error: errorMessage
			});

			// Increment retry count
			const newRetryCount = await incrementRetryCount(operation.id!);

			// Schedule retry with exponential backoff
			if (newRetryCount < MAX_RETRIES) {
				const delay = calculateBackoffDelay(newRetryCount);
				console.log(
					`Operation ${operation.id} failed. Retry ${newRetryCount}/${MAX_RETRIES} scheduled in ${delay}ms`
				);
				setTimeout(() => syncQueuedOperations(), delay);
			}
		}
	}

	// Refresh cache after sync
	await refreshClassesCache();

	// Update sync status
	const hasFailures = failed_count > 0;
	syncStatus.set(navigator.onLine ? (hasFailures ? 'syncing' : 'online') : 'offline');

	return {
		success: synced_count > 0 && failed_count === 0,
		synced_count,
		failed_count,
		errors
	};
}

/**
 * Refresh classes cache from Supabase
 */
export async function refreshClassesCache(): Promise<void> {
	try {
		const classes = await getAllClasses();
		classesCache.set(classes);
	} catch (error) {
		console.error('Failed to refresh classes cache:', error);
	}
}

/**
 * Start automatic sync every 60 seconds
 */
export function startAutoSync(): void {
	// Stop any existing interval
	stopAutoSync();

	// Initial sync
	syncQueuedOperations();

	// Auto-sync every 60 seconds
	autoSyncInterval = setInterval(() => {
		if (navigator.onLine) {
			syncQueuedOperations();
		}
	}, AUTO_SYNC_INTERVAL_MS);

	// Cleanup old synced operations weekly
	setInterval(
		() => {
			cleanupSyncedOperations(7);
		},
		24 * 60 * 60 * 1000
	); // Daily
}

/**
 * Stop automatic sync
 */
export function stopAutoSync(): void {
	if (autoSyncInterval) {
		clearInterval(autoSyncInterval);
		autoSyncInterval = null;
	}
}

/**
 * Initialize sync service with online/offline listeners
 */
export function initializeSyncService(): void {
	// Initial cache refresh
	refreshClassesCache();

	// Start auto-sync
	startAutoSync();

	// Browser online event - trigger immediate sync
	window.addEventListener('online', () => {
		console.log('Browser online - triggering sync');
		syncStatus.set('online');
		syncQueuedOperations();
	});

	// Browser offline event - update status
	window.addEventListener('offline', () => {
		console.log('Browser offline');
		syncStatus.set('offline');
	});

	// Set initial sync status
	syncStatus.set(navigator.onLine ? 'online' : 'offline');
}

/**
 * Subscribe to real-time updates from Supabase
 */
export function enableRealtimeSync(): void {
	realtimeUnsubscribe = subscribeToClasses((payload) => {
		console.log('Real-time update received:', payload.eventType);
		// Refresh cache when changes occur
		refreshClassesCache();
	});
}

/**
 * Disable real-time sync
 */
export function disableRealtimeSync(): void {
	if (realtimeUnsubscribe) {
		realtimeUnsubscribe();
		realtimeUnsubscribe = null;
	}
}

/**
 * Cleanup sync service
 */
export function cleanupSyncService(): void {
	stopAutoSync();
	disableRealtimeSync();
}
