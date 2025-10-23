/**
 * Classroom Stores
 * Reactive state management for multi-class competition
 */

import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { Class, SyncStatus, ClassPeriod } from '../types/classroom';

/**
 * Active class ID (currently selected class for dropping chips)
 */
export const activeClassId: Writable<string | null> = writable(null);

/**
 * Local cache of all classes (updated from Supabase)
 */
export const classesCache: Writable<Class[]> = writable([]);

/**
 * Sync status indicator
 */
export const syncStatus: Writable<SyncStatus> = writable('offline');

/**
 * Derived: Currently active class
 */
export const activeClass: Readable<Class | null> = derived(
	[activeClassId, classesCache],
	([$activeClassId, $classesCache]) => {
		if (!$activeClassId) return null;
		return $classesCache.find((c) => c.id === $activeClassId) || null;
	}
);

/**
 * Derived: Leaderboard (classes sorted by total_points DESC)
 */
export const classLeaderboard: Readable<Class[]> = derived(classesCache, ($classesCache) => {
	return [...$classesCache].sort((a, b) => b.total_points - a.total_points);
});

/**
 * Derived: Can current active class drop a chip?
 */
export const canDrop: Readable<boolean> = derived(activeClass, ($activeClass) => {
	if (!$activeClass) return false;
	return $activeClass.chips_remaining > 0;
});

/**
 * Helper: Get class period number from class name
 */
export function getClassPeriod(className: string): ClassPeriod | null {
	const match = className.match(/Period (\d)/);
	if (!match) return null;
	const period = parseInt(match[1], 10);
	if (period >= 1 && period <= 9) {
		return period as ClassPeriod;
	}
	return null;
}

/**
 * Helper: Update a class in cache (optimistic UI)
 */
export function updateClassInCache(classId: string, updates: Partial<Class>): void {
	classesCache.update((classes) => {
		return classes.map((c) => (c.id === classId ? { ...c, ...updates } : c));
	});
}

/**
 * Helper: Set active class by name (e.g., "Period 1")
 */
export function setActiveClassByName(className: string): void {
	classesCache.subscribe((classes) => {
		const foundClass = classes.find((c) => c.name === className);
		if (foundClass) {
			activeClassId.set(foundClass.id);
		}
	})();
}
