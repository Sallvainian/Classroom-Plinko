/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import ClassPeriodSelector from '../ClassPeriodSelector.svelte';
import { classesCache, activeClassId } from '$lib/stores/classroom';
import type { Class } from '$lib/types/classroom';

describe('ClassPeriodSelector', () => {
	const mockClasses: Class[] = [
		{
			id: 'class-1',
			name: 'Period 1',
			total_points: 100,
			chips_remaining: 5,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-2',
			name: 'Period 2',
			total_points: 200,
			chips_remaining: 3,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-3',
			name: 'Period 3',
			total_points: 150,
			chips_remaining: 4,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-4',
			name: 'Period 4',
			total_points: 50,
			chips_remaining: 2,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-5',
			name: 'Period 5',
			total_points: 300,
			chips_remaining: 5,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-6',
			name: 'Period 6',
			total_points: 75,
			chips_remaining: 1,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		}
	];

	beforeEach(() => {
		// Reset stores
		classesCache.set(mockClasses);
		activeClassId.set(null);

		// Clear sessionStorage
		sessionStorage.clear();
	});

	it('renders 6 period buttons (AC1)', () => {
		render(ClassPeriodSelector);

		expect(screen.getByText('Period 1')).toBeInTheDocument();
		expect(screen.getByText('Period 2')).toBeInTheDocument();
		expect(screen.getByText('Period 3')).toBeInTheDocument();
		expect(screen.getByText('Period 4')).toBeInTheDocument();
		expect(screen.getByText('Period 5')).toBeInTheDocument();
		expect(screen.getByText('Period 6')).toBeInTheDocument();
	});

	it('highlights active class with ring (AC2)', async () => {
		render(ClassPeriodSelector);

		const period1Button = screen.getByText('Period 1').closest('button');
		expect(period1Button).not.toHaveClass('ring-2');

		// Click to select
		await fireEvent.click(period1Button!);

		expect(period1Button).toHaveClass('ring-2', 'ring-blue-500');
		expect(get(activeClassId)).toBe('class-1');
	});

	it('persists selection in sessionStorage (AC3)', async () => {
		render(ClassPeriodSelector);

		const period2Button = screen.getByText('Period 2').closest('button');
		await fireEvent.click(period2Button!);

		const stored = sessionStorage.getItem('activeClassId');
		expect(stored).toBe('class-2');
	});

	it('restores selection from sessionStorage on mount', () => {
		sessionStorage.setItem('activeClassId', 'class-3');

		render(ClassPeriodSelector);

		expect(get(activeClassId)).toBe('class-3');
	});

	it('updates activeClassId store when button clicked', async () => {
		render(ClassPeriodSelector);

		const period4Button = screen.getByText('Period 4').closest('button');
		await fireEvent.click(period4Button!);

		expect(get(activeClassId)).toBe('class-4');
	});

	it('displays blue background and white text (visual styling)', () => {
		render(ClassPeriodSelector);

		const button = screen.getByText('Period 1').closest('button');
		expect(button).toHaveClass('bg-blue-500', 'text-white');
	});

	it('renders in 2-column grid layout', () => {
		const { container } = render(ClassPeriodSelector);

		const gridContainer = container.querySelector('.grid-cols-2');
		expect(gridContainer).toBeInTheDocument();
	});
});
