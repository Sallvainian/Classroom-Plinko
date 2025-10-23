/**
 * Supabase Service
 * Client configuration and database operations
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Class, DropRecord, ClassPeriod } from '../types/classroom';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase environment variables. Please check your .env file.'
	);
}

/**
 * Singleton Supabase client instance
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all classes from database
 */
export async function getAllClasses(): Promise<Class[]> {
	const { data, error } = await supabase
		.from('classes')
		.select('*')
		.order('name', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch classes: ${error.message}`);
	}

	return data || [];
}

/**
 * Fetch a single class by ID
 */
export async function getClassById(classId: string): Promise<Class | null> {
	const { data, error } = await supabase
		.from('classes')
		.select('*')
		.eq('id', classId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// Not found
			return null;
		}
		throw new Error(`Failed to fetch class: ${error.message}`);
	}

	return data;
}

/**
 * Update class points (add points from a drop)
 */
export async function addClassPoints(
	classId: string,
	points: number,
	slotIndex: number
): Promise<void> {
	// Start a transaction-like operation: update class points and record drop
	const classData = await getClassById(classId);
	if (!classData) {
		throw new Error(`Class not found: ${classId}`);
	}

	const newPoints = classData.total_points + points;

	// Update class total_points
	const { error: updateError } = await supabase
		.from('classes')
		.update({ total_points: newPoints })
		.eq('id', classId);

	if (updateError) {
		throw new Error(`Failed to update class points: ${updateError.message}`);
	}

	// Record drop in history
	const { error: recordError } = await supabase.from('drop_records').insert({
		class_id: classId,
		points_earned: points,
		slot_index: slotIndex
	});

	if (recordError) {
		throw new Error(`Failed to record drop: ${recordError.message}`);
	}
}

/**
 * Subtract a chip from class
 */
export async function subtractClassChip(classId: string): Promise<void> {
	const classData = await getClassById(classId);
	if (!classData) {
		throw new Error(`Class not found: ${classId}`);
	}

	if (classData.chips_remaining <= 0) {
		throw new Error(`No chips remaining for class ${classData.name}`);
	}

	const { error } = await supabase
		.from('classes')
		.update({ chips_remaining: classData.chips_remaining - 1 })
		.eq('id', classId);

	if (error) {
		throw new Error(`Failed to subtract chip: ${error.message}`);
	}
}

/**
 * Adjust class chips by delta (can be positive or negative)
 */
export async function adjustClassChips(classId: string, delta: number): Promise<void> {
	const classData = await getClassById(classId);
	if (!classData) {
		throw new Error(`Class not found: ${classId}`);
	}

	const newChipCount = Math.max(0, classData.chips_remaining + delta);

	const { error } = await supabase
		.from('classes')
		.update({ chips_remaining: newChipCount })
		.eq('id', classId);

	if (error) {
		throw new Error(`Failed to adjust chips: ${error.message}`);
	}
}

/**
 * Reset class chips to initial count (5)
 */
export async function resetClassChips(classId: string): Promise<void> {
	const { error } = await supabase
		.from('classes')
		.update({
			chips_remaining: 5,
			last_reset_at: new Date().toISOString()
		})
		.eq('id', classId);

	if (error) {
		throw new Error(`Failed to reset chips: ${error.message}`);
	}
}

/**
 * Reset all classes' chips to initial count (5)
 */
export async function resetAllChips(): Promise<void> {
	const { error } = await supabase
		.from('classes')
		.update({
			chips_remaining: 5,
			last_reset_at: new Date().toISOString()
		})
		.neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

	if (error) {
		throw new Error(`Failed to reset all chips: ${error.message}`);
	}
}

/**
 * Adjust class points by delta (can be positive or negative)
 * This is for manual point adjustments by teachers
 */
export async function adjustClassPoints(classId: string, delta: number): Promise<void> {
	const classData = await getClassById(classId);
	if (!classData) {
		throw new Error(`Class not found: ${classId}`);
	}

	const newPoints = Math.max(0, classData.total_points + delta);

	const { error } = await supabase
		.from('classes')
		.update({ total_points: newPoints })
		.eq('id', classId);

	if (error) {
		throw new Error(`Failed to adjust points: ${error.message}`);
	}

	// Optionally record manual adjustment in drop_records with slot_index = -1
	if (delta !== 0) {
		await supabase.from('drop_records').insert({
			class_id: classId,
			points_earned: delta,
			slot_index: -1 // -1 indicates manual adjustment
		});
	}
}

/**
 * Get drop history for a class
 */
export async function getClassDropHistory(classId: string): Promise<DropRecord[]> {
	const { data, error } = await supabase
		.from('drop_records')
		.select('*')
		.eq('class_id', classId)
		.order('timestamp', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch drop history: ${error.message}`);
	}

	return data || [];
}

/**
 * Subscribe to real-time changes on classes table
 */
export function subscribeToClasses(
	callback: (payload: { new: Class; old: Class; eventType: string }) => void
) {
	const channel = supabase
		.channel('classes-changes')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'classes'
			},
			(payload: any) => {
				callback({
					new: payload.new,
					old: payload.old,
					eventType: payload.eventType
				});
			}
		)
		.subscribe();

	return () => {
		supabase.removeChannel(channel);
	};
}
