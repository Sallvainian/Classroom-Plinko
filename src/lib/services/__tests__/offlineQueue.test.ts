/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
	queueOperation,
	getQueuedOperations,
	markSynced,
	getPendingCount,
	incrementRetryCount,
	clearAllOperations
} from '../offlineQueue';
import type { QueuedOperation } from '../../types/classroom';

describe('offlineQueue', () => {
	beforeEach(async () => {
		// Clear all operations before each test
		await clearAllOperations();
	});

	describe('queueOperation', () => {
		it('should add operation to queue', async () => {
			const operation: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(operation);
			expect(id).toBeDefined();
			expect(typeof id).toBe('string');
		});

		it('should store multiple operations', async () => {
			const op1: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const op2: Omit<QueuedOperation, 'id'> = {
				operation: 'subtract_chip',
				class_id: 'test-class-1',
				payload: {},
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			await queueOperation(op1);
			await queueOperation(op2);

			const operations = await getQueuedOperations();
			expect(operations).toHaveLength(2);
		});
	});

	describe('getQueuedOperations', () => {
		it('should return only unsynced operations', async () => {
			const op1: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(op1);
			await markSynced(id);

			const operations = await getQueuedOperations();
			expect(operations).toHaveLength(0);
		});

		it('should return operations sorted by timestamp', async () => {
			const timestamp1 = new Date('2024-01-01T10:00:00Z').toISOString();
			const timestamp2 = new Date('2024-01-01T11:00:00Z').toISOString();

			const op1: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: timestamp2,
				retry_count: 0,
				synced: false
			};

			const op2: Omit<QueuedOperation, 'id'> = {
				operation: 'subtract_chip',
				class_id: 'test-class-1',
				payload: {},
				timestamp: timestamp1,
				retry_count: 0,
				synced: false
			};

			await queueOperation(op1);
			await queueOperation(op2);

			const operations = await getQueuedOperations();
			expect(operations[0].timestamp).toBe(timestamp1);
			expect(operations[1].timestamp).toBe(timestamp2);
		});
	});

	describe('markSynced', () => {
		it('should mark operation as synced', async () => {
			const operation: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(operation);
			await markSynced(id);

			const operations = await getQueuedOperations();
			expect(operations).toHaveLength(0);
		});
	});

	describe('getPendingCount', () => {
		it('should return count of unsynced operations', async () => {
			const op1: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const op2: Omit<QueuedOperation, 'id'> = {
				operation: 'subtract_chip',
				class_id: 'test-class-1',
				payload: {},
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			await queueOperation(op1);
			await queueOperation(op2);

			const count = await getPendingCount();
			expect(count).toBe(2);
		});

		it('should not count synced operations', async () => {
			const operation: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(operation);
			await markSynced(id);

			const count = await getPendingCount();
			expect(count).toBe(0);
		});
	});

	describe('incrementRetryCount', () => {
		it('should increment retry count', async () => {
			const operation: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(operation);
			const newRetryCount = await incrementRetryCount(id);
			expect(newRetryCount).toBe(1);

			const operations = await getQueuedOperations();
			expect(operations[0].retry_count).toBe(1);
		});

		it('should increment multiple times', async () => {
			const operation: Omit<QueuedOperation, 'id'> = {
				operation: 'add_points',
				class_id: 'test-class-1',
				payload: { points: 100, slot_index: 4 },
				timestamp: new Date().toISOString(),
				retry_count: 0,
				synced: false
			};

			const id = await queueOperation(operation);
			await incrementRetryCount(id);
			await incrementRetryCount(id);
			const finalCount = await incrementRetryCount(id);
			expect(finalCount).toBe(3);
		});
	});
});
