/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Leaderboard from '../Leaderboard.svelte';
import { classesCache, activeClassId, classLeaderboard } from '$lib/stores/classroom';
import type { Class } from '$lib/types/classroom';

describe('Leaderboard', () => {
	const mockClasses: Class[] = [
		{
			id: 'class-1',
			name: 'Period 1',
			total_points: 300,
			chips_remaining: 5,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-2',
			name: 'Period 2',
			total_points: 500,
			chips_remaining: 3,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-3',
			name: 'Period 3',
			total_points: 100,
			chips_remaining: 4,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		}
	];

	beforeEach(() => {
		classesCache.set(mockClasses);
		activeClassId.set(null);
	});

	it('renders table with correct column headers (AC5)', () => {
		render(Leaderboard);

		expect(screen.getByText('Rank')).toBeInTheDocument();
		expect(screen.getByText('Class')).toBeInTheDocument();
		expect(screen.getByText('Points')).toBeInTheDocument();
		expect(screen.getByText('Chips')).toBeInTheDocument();
	});

	it('displays classes sorted by points descending (AC6)', () => {
		render(Leaderboard);

		// Verify leaderboard store is sorted correctly
		const leaderboard = get(classLeaderboard);
		expect(leaderboard[0].total_points).toBe(500); // Period 2
		expect(leaderboard[1].total_points).toBe(300); // Period 1
		expect(leaderboard[2].total_points).toBe(100); // Period 3

		// Verify DOM rendering
		const rows = screen.getAllByRole('row');
		expect(rows[1]).toHaveTextContent('Period 2'); // First data row
		expect(rows[2]).toHaveTextContent('Period 1');
		expect(rows[3]).toHaveTextContent('Period 3');
	});

	it('highlights active class row (AC7)', () => {
		activeClassId.set('class-2');
		const { container } = render(Leaderboard);

		const rows = container.querySelectorAll('tr');
		const period2Row = Array.from(rows).find((row) => row.textContent?.includes('Period 2'));

		expect(period2Row).toHaveClass('bg-blue-100');
	});

	it('formats points with commas (AC5)', () => {
		classesCache.set([
			{
				id: 'class-1',
				name: 'Period 1',
				total_points: 12345,
				chips_remaining: 5,
				last_reset_at: '2024-01-01',
				created_at: '2024-01-01'
			}
		]);

		render(Leaderboard);

		expect(screen.getByText('12,345')).toBeInTheDocument();
	});

	it('displays chips in "X/5" format (AC5)', () => {
		render(Leaderboard);

		expect(screen.getByText('5/5')).toBeInTheDocument();
		expect(screen.getByText('3/5')).toBeInTheDocument();
		expect(screen.getByText('4/5')).toBeInTheDocument();
	});

	it('updates reactively when classesCache changes (AC8)', async () => {
		const { component } = render(Leaderboard);

		// Initial state
		expect(screen.getByText('500')).toBeInTheDocument();

		// Update points
		classesCache.update((classes) =>
			classes.map((c) => (c.id === 'class-2' ? { ...c, total_points: 600 } : c))
		);

		// Should re-render with new points
		await component.$set({});
		expect(screen.getByText('600')).toBeInTheDocument();
	});

	it('displays rank numbers correctly', () => {
		render(Leaderboard);

		const rows = screen.getAllByRole('row');
		expect(rows[1]).toHaveTextContent('#1'); // Highest points
		expect(rows[2]).toHaveTextContent('#2');
		expect(rows[3]).toHaveTextContent('#3');
	});

	it('is always visible (AC4 - no collapse button)', () => {
		const { container } = render(Leaderboard);

		const collapseButton = container.querySelector('[aria-label*="collapse"]');
		expect(collapseButton).not.toBeInTheDocument();
	});
});
