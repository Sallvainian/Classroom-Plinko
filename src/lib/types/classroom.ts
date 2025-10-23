/**
 * Classroom Types
 * Type definitions for multi-class competition system
 */

/**
 * Class period identifier (1-9)
 */
export type ClassPeriod = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Class entity representing a period/section
 */
export interface Class {
	id: string;
	name: string;
	total_points: number;
	chips_remaining: number;
	last_reset_at: string;
	created_at: string;
}

/**
 * Drop record entity for point history tracking
 */
export interface DropRecord {
	id: string;
	class_id: string;
	points_earned: number;
	slot_index: number;
	timestamp: string;
}

/**
 * Queue operation types for offline sync
 */
export type QueueOperationType = 'add_points' | 'subtract_chip' | 'reset_chips' | 'undo';

/**
 * Queued operation for offline mode
 */
export interface QueuedOperation {
	id?: string;
	operation: QueueOperationType;
	class_id: string;
	payload: {
		points?: number;
		slot_index?: number;
	};
	timestamp: string;
	retry_count: number;
	synced: boolean;
}

/**
 * Sync status indicator
 */
export type SyncStatus = 'online' | 'syncing' | 'offline';

/**
 * Sync result from sync operation
 */
export interface SyncResult {
	success: boolean;
	synced_count: number;
	failed_count: number;
	errors: Array<{ operation_id: string; error: string }>;
}
