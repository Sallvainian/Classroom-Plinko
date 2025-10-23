/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	activeClassId,
	classesCache,
	syncStatus,
	activeClass,
	classLeaderboard,
	canDrop,
	updateClassInCache,
	setActiveClassByName,
	getClassPeriod
} from '../classroom';
import type { Class } from '../../types/classroom';

describe('classroom stores', () => {
	const mockClasses: Class[] = [
		{
			id: 'class-1',
			name: 'Period 1',
			total_points: 100,
			chips_remaining: 5,
			last_reset_at: '2024-01-01T00:00:00Z',
			created_at: '2024-01-01T00:00:00Z'
		},
		{
			id: 'class-2',
			name: 'Period 2',
			total_points: 250,
			chips_remaining: 3,
			last_reset_at: '2024-01-01T00:00:00Z',
			created_at: '2024-01-01T00:00:00Z'
		},
		{
			id: 'class-3',
			name: 'Period 3',
			total_points: 50,
			chips_remaining: 0,
			last_reset_at: '2024-01-01T00:00:00Z',
			created_at: '2024-01-01T00:00:00Z'
		}
	];

	beforeEach(() => {
		// Reset stores
		classesCache.set([]);
		activeClassId.set(null);
		syncStatus.set('offline');
	});

	describe('activeClass derived store', () => {
		it('should return null when no active class is set', () => {
			classesCache.set(mockClasses);
			const active = get(activeClass);
			expect(active).toBeNull();
		});

		it('should return active class when set', () => {
			classesCache.set(mockClasses);
			activeClassId.set('class-1');
			const active = get(activeClass);
			expect(active).toEqual(mockClasses[0]);
		});

		it('should return null when active class ID not found', () => {
			classesCache.set(mockClasses);
			activeClassId.set('nonexistent');
			const active = get(activeClass);
			expect(active).toBeNull();
		});
	});

	describe('classLeaderboard derived store', () => {
		it('should sort classes by total_points descending', () => {
			classesCache.set(mockClasses);
			const leaderboard = get(classLeaderboard);
			expect(leaderboard[0].total_points).toBe(250); // Period 2
			expect(leaderboard[1].total_points).toBe(100); // Period 1
			expect(leaderboard[2].total_points).toBe(50); // Period 3
		});

		it('should return empty array when no classes', () => {
			const leaderboard = get(classLeaderboard);
			expect(leaderboard).toEqual([]);
		});
	});

	describe('canDrop derived store', () => {
		it('should return false when no active class', () => {
			classesCache.set(mockClasses);
			expect(get(canDrop)).toBe(false);
		});

		it('should return true when active class has chips', () => {
			classesCache.set(mockClasses);
			activeClassId.set('class-1');
			expect(get(canDrop)).toBe(true);
		});

		it('should return false when active class has no chips', () => {
			classesCache.set(mockClasses);
			activeClassId.set('class-3'); // chips_remaining = 0
			expect(get(canDrop)).toBe(false);
		});
	});

	describe('updateClassInCache', () => {
		it('should update class properties', () => {
			classesCache.set(mockClasses);
			updateClassInCache('class-1', { total_points: 200 });
			const classes = get(classesCache);
			const updatedClass = classes.find((c) => c.id === 'class-1');
			expect(updatedClass?.total_points).toBe(200);
		});

		it('should only update specified class', () => {
			classesCache.set(mockClasses);
			updateClassInCache('class-1', { total_points: 200 });
			const classes = get(classesCache);
			const otherClass = classes.find((c) => c.id === 'class-2');
			expect(otherClass?.total_points).toBe(250); // unchanged
		});

		it('should update multiple properties', () => {
			classesCache.set(mockClasses);
			updateClassInCache('class-1', {
				total_points: 200,
				chips_remaining: 3
			});
			const classes = get(classesCache);
			const updatedClass = classes.find((c) => c.id === 'class-1');
			expect(updatedClass?.total_points).toBe(200);
			expect(updatedClass?.chips_remaining).toBe(3);
		});
	});

	describe('setActiveClassByName', () => {
		it('should set active class by name', () => {
			classesCache.set(mockClasses);
			setActiveClassByName('Period 2');
			const activeId = get(activeClassId);
			expect(activeId).toBe('class-2');
		});

		it('should handle non-existent class name', () => {
			classesCache.set(mockClasses);
			setActiveClassByName('Nonexistent');
			const activeId = get(activeClassId);
			// Should not throw, just not set anything
			expect(activeId).toBeNull();
		});
	});

	describe('getClassPeriod', () => {
		it('should extract period number from class name', () => {
			expect(getClassPeriod('Period 1')).toBe(1);
			expect(getClassPeriod('Period 6')).toBe(6);
		});

		it('should return null for invalid format', () => {
			expect(getClassPeriod('Class A')).toBeNull();
			expect(getClassPeriod('Period')).toBeNull();
		});

		it('should return null for out of range periods', () => {
			expect(getClassPeriod('Period 0')).toBeNull();
			expect(getClassPeriod('Period 7')).toBeNull();
		});
	});

	describe('syncStatus store', () => {
		it('should start as offline', () => {
			expect(get(syncStatus)).toBe('offline');
		});

		it('should update to online', () => {
			syncStatus.set('online');
			expect(get(syncStatus)).toBe('online');
		});

		it('should update to syncing', () => {
			syncStatus.set('syncing');
			expect(get(syncStatus)).toBe('syncing');
		});
	});
});
