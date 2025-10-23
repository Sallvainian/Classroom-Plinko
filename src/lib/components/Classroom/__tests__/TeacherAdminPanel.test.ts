/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TeacherAdminPanel from '../TeacherAdminPanel.svelte';
import { classesCache, syncStatus } from '$lib/stores/classroom';
import type { Class } from '$lib/types/classroom';

// Mock services
vi.mock('$lib/services/supabase', () => ({
	adjustClassChips: vi.fn().mockResolvedValue(undefined),
	resetAllChips: vi.fn().mockResolvedValue(undefined),
	getClassDropHistory: vi.fn().mockResolvedValue([])
}));

vi.mock('$lib/services/offlineQueue', () => ({
	queueOperation: vi.fn().mockResolvedValue('op-id')
}));

describe('TeacherAdminPanel', () => {
	const mockClasses: Class[] = [
		{
			id: 'class-1',
			name: 'Period 1',
			total_points: 100,
			chips_remaining: 3,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		},
		{
			id: 'class-2',
			name: 'Period 2',
			total_points: 200,
			chips_remaining: 5,
			last_reset_at: '2024-01-01',
			created_at: '2024-01-01'
		}
	];

	beforeEach(() => {
		classesCache.set(mockClasses);
		syncStatus.set('online');
		vi.clearAllMocks();
	});

	it('renders collapsed by default', () => {
		render(TeacherAdminPanel);

		const controlsHeader = screen.getByText('Teacher Controls');
		expect(controlsHeader).toBeInTheDocument();

		// Panel content should not be visible initially
		const chipAdjustHeader = screen.queryByText('Adjust Chips');
		expect(chipAdjustHeader).not.toBeInTheDocument();
	});

	it('expands panel when header clicked', async () => {
		render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		expect(screen.getByText('Adjust Chips')).toBeInTheDocument();
	});

	it('displays +/- buttons for each class (AC9)', async () => {
		render(TeacherAdminPanel);

		// Expand panel
		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		// Check for Period 1 controls
		const period1Row = screen.getByText('Period 1').closest('div');
		expect(period1Row).toBeInTheDocument();

		// Should have +1 and -1 buttons
		const buttons = screen.getAllByRole('button');
		const plusButtons = buttons.filter((btn) => btn.textContent === '+1');
		const minusButtons = buttons.filter((btn) => btn.textContent === '-1');

		expect(plusButtons).toHaveLength(2); // One for each class
		expect(minusButtons).toHaveLength(2);
	});

	it('disables -1 button when chips = 0', async () => {
		classesCache.set([
			{
				id: 'class-1',
				name: 'Period 1',
				total_points: 100,
				chips_remaining: 0,
				last_reset_at: '2024-01-01',
				created_at: '2024-01-01'
			}
		]);

		render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		const period1Row = screen.getByText('Period 1').closest('div');
		const minusButton = period1Row?.querySelector('button.bg-red-500');

		expect(minusButton).toBeDisabled();
	});

	it('displays "Reset All Chips" button (AC10)', async () => {
		render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		expect(screen.getByText('Reset All Chips')).toBeInTheDocument();
	});

	it('shows confirmation dialog when reset button clicked (AC10)', async () => {
		render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		const resetButton = screen.getByText('Reset All Chips');
		await fireEvent.click(resetButton);

		// Confirmation dialog should appear
		expect(screen.getByText('Reset all chips to 5? This cannot be undone.')).toBeInTheDocument();
	});

	it('displays sync status indicator (AC12)', async () => {
		const { container } = render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		// Check for sync status text
		expect(screen.getByText('Sync Status:')).toBeInTheDocument();

		// SyncStatusIndicator component should be rendered
		const indicator = container.querySelector('[class*="sync"]') || screen.queryByText(/online|offline|syncing/i);
		expect(indicator).toBeTruthy();
	});

	it('displays undo button (AC11)', async () => {
		render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		expect(screen.getByText('Undo Last Drop')).toBeInTheDocument();
	});

	it('updates sync status color based on store', async () => {
		const { component } = render(TeacherAdminPanel);

		const headerButton = screen.getByText('Teacher Controls').closest('button');
		await fireEvent.click(headerButton!);

		// Change sync status
		syncStatus.set('offline');
		await component.$set({});

		// SyncStatusIndicator should reflect the change
		// (actual indicator color test would be in SyncStatusIndicator.test.ts)
		expect(screen.getByText('Sync Status:')).toBeInTheDocument();
	});
});
