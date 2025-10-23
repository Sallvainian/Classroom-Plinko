import { test, expect } from '@playwright/test';

test.describe('Classroom UI - Class Period Selector & Leaderboard', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for app to load
		await page.waitForLoadState('networkidle');
	});

	test('AC1: Class period selector displays 6 buttons', async ({ page }) => {
		const period1 = page.getByRole('button', { name: 'Period 1' });
		const period2 = page.getByRole('button', { name: 'Period 2' });
		const period3 = page.getByRole('button', { name: 'Period 3' });
		const period4 = page.getByRole('button', { name: 'Period 4' });
		const period5 = page.getByRole('button', { name: 'Period 5' });
		const period6 = page.getByRole('button', { name: 'Period 6' });

		await expect(period1).toBeVisible();
		await expect(period2).toBeVisible();
		await expect(period3).toBeVisible();
		await expect(period4).toBeVisible();
		await expect(period5).toBeVisible();
		await expect(period6).toBeVisible();
	});

	test('AC2: Active class highlighted with visual indicator (blue ring)', async ({ page }) => {
		const period2Button = page.getByRole('button', { name: 'Period 2' });

		// Click to activate
		await period2Button.click();

		// Check for ring-2 ring-blue-500 classes
		const classes = await period2Button.getAttribute('class');
		expect(classes).toContain('ring-2');
		expect(classes).toContain('ring-blue-500');
	});

	test('AC3: Class selection persists in sessionStorage', async ({ page }) => {
		// Select Period 3
		await page.getByRole('button', { name: 'Period 3' }).click();

		// Check sessionStorage
		const storedId = await page.evaluate(() => sessionStorage.getItem('activeClassId'));
		expect(storedId).toBeTruthy();

		// Reload page
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Verify selection persisted
		const period3Button = page.getByRole('button', { name: 'Period 3' });
		const classes = await period3Button.getAttribute('class');
		expect(classes).toContain('ring-2');
	});

	test('AC4: Leaderboard sidebar always visible (not collapsible)', async ({ page }) => {
		const leaderboard = page.getByRole('heading', { name: 'Leaderboard' });
		await expect(leaderboard).toBeVisible();

		// Verify no collapse button exists
		const collapseButton = page.locator('button:has-text("Collapse")');
		await expect(collapseButton).not.toBeVisible();
	});

	test('AC5: Leaderboard shows 3 columns: Class Name, Total Points, Chips Remaining', async ({
		page
	}) => {
		// Check for column headers
		await expect(page.getByRole('columnheader', { name: 'Class' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Points' })).toBeVisible();
		await expect(page.getByRole('columnheader', { name: 'Chips' })).toBeVisible();

		// Verify data format
		const firstRow = page.locator('tbody tr').first();
		await expect(firstRow).toBeVisible();

		// Check for chips format "X/5"
		await expect(firstRow.locator('td').nth(3)).toContainText('/5');
	});

	test('AC6: Leaderboard sorted by total points descending (highest first)', async ({ page }) => {
		// Get all point values from the leaderboard
		const pointCells = page.locator('tbody tr td:nth-child(3)');
		const count = await pointCells.count();

		const points: number[] = [];
		for (let i = 0; i < count; i++) {
			const text = await pointCells.nth(i).textContent();
			const value = parseInt(text!.replace(/,/g, ''), 10);
			points.push(value);
		}

		// Verify descending order
		for (let i = 0; i < points.length - 1; i++) {
			expect(points[i]).toBeGreaterThanOrEqual(points[i + 1]);
		}
	});

	test('AC7: Active class highlighted in leaderboard (background color)', async ({ page }) => {
		// Select Period 1
		await page.getByRole('button', { name: 'Period 1' }).click();

		// Find the row containing Period 1 in leaderboard
		const period1Row = page.locator('tbody tr:has-text("Period 1")');

		// Check for bg-blue-100 class
		const classes = await period1Row.getAttribute('class');
		expect(classes).toContain('bg-blue-100');
	});

	test('AC8: Leaderboard updates in real-time when points/chips change', async ({ page }) => {
		// This test requires real-time subscription setup
		// We'll test reactivity by triggering a chip drop and verifying update

		// Select a class
		await page.getByRole('button', { name: 'Period 1' }).click();

		// Get initial chip count from leaderboard
		const period1Row = page.locator('tbody tr:has-text("Period 1")');
		const initialChips = await period1Row.locator('td:nth-child(4)').textContent();

		// Click Drop Chip button
		const dropButton = page.getByRole('button', { name: /Drop Chip/ });
		await dropButton.click();

		// Wait for animation/update (200ms as per spec)
		await page.waitForTimeout(300);

		// Verify chips decreased
		const updatedChips = await period1Row.locator('td:nth-child(4)').textContent();
		expect(updatedChips).not.toBe(initialChips);
	});

	test('Integration: Complete flow - select class, drop chip, verify updates', async ({
		page
	}) => {
		// Select Period 2
		await page.getByRole('button', { name: 'Period 2' }).click();

		// Verify leaderboard highlights Period 2
		const period2Row = page.locator('tbody tr:has-text("Period 2")');
		const rowClasses = await period2Row.getAttribute('class');
		expect(rowClasses).toContain('bg-blue-100');

		// Drop a chip
		const dropButton = page.getByRole('button', { name: /Drop Chip/ });
		await dropButton.click();

		// Wait for updates
		await page.waitForTimeout(500);

		// Verify leaderboard still shows Period 2 highlighted
		const updatedRow = page.locator('tbody tr:has-text("Period 2")');
		await expect(updatedRow).toHaveClass(/bg-blue-100/);
	});
});
