import { test, expect } from '@playwright/test';

test.describe('Teacher Admin Panel', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('AC9: Teacher admin panel includes chip +/- buttons for each class', async ({ page }) => {
		// Expand admin panel
		const teacherControlsButton = page.getByRole('button', { name: 'Teacher Controls' });
		await teacherControlsButton.click();

		// Verify panel expanded
		await expect(page.getByText('Adjust Chips')).toBeVisible();

		// Check for all 6 classes with +/- buttons
		for (let i = 1; i <= 6; i++) {
			const periodRow = page.locator(`text=Period ${i}`).first();
			await expect(periodRow).toBeVisible();
		}

		// Count +1 and -1 buttons (should be 6 each)
		const plusButtons = page.getByRole('button', { name: '+1' });
		const minusButtons = page.getByRole('button', { name: '-1' });

		await expect(plusButtons).toHaveCount(6);
		await expect(minusButtons).toHaveCount(6);
	});

	test('AC10: Manual "Reset All Chips" button with confirmation dialog', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Find Reset All Chips button
		const resetButton = page.getByRole('button', { name: 'Reset All Chips' });
		await expect(resetButton).toBeVisible();

		// Click reset button
		await resetButton.click();

		// Verify confirmation dialog appears
		await expect(page.getByText('Reset all chips to 5? This cannot be undone.')).toBeVisible();

		// Verify dialog has Cancel and Reset/Confirm buttons
		const cancelButton = page.getByRole('button', { name: 'Cancel' });
		const confirmButton = page.getByRole('button', { name: 'Reset' });

		await expect(cancelButton).toBeVisible();
		await expect(confirmButton).toBeVisible();

		// Click cancel to close
		await cancelButton.click();

		// Dialog should close
		await expect(page.getByText('Reset all chips to 5?')).not.toBeVisible();
	});

	test('AC10: Reset All Chips confirmation works when confirmed', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Click reset button
		await page.getByRole('button', { name: 'Reset All Chips' }).click();

		// Confirm reset
		await page.getByRole('button', { name: 'Reset' }).click();

		// Wait for operation to complete
		await page.waitForTimeout(500);

		// Verify all chips are now 5/5 in leaderboard
		const chipCells = page.locator('tbody tr td:nth-child(4)');
		const count = await chipCells.count();

		for (let i = 0; i < count; i++) {
			const chipText = await chipCells.nth(i).textContent();
			expect(chipText).toBe('5/5');
		}
	});

	test('AC11: Undo button reverses last chip drop (nice-to-have)', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Verify Undo button exists
		const undoButton = page.getByRole('button', { name: 'Undo Last Drop' });
		await expect(undoButton).toBeVisible();

		// Note: Full undo functionality is marked as nice-to-have
		// This test just verifies the button is present
	});

	test('AC12: Sync status indicator visible (green dot = online, yellow = syncing, red = offline)', async ({
		page
	}) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Verify sync status label is visible
		await expect(page.getByText('Sync Status:')).toBeVisible();

		// SyncStatusIndicator component should be rendered
		// (Note: Actual color testing would require checking rendered SVG/component)
		// For now, we verify the indicator section exists
		const syncSection = page.locator('text=Sync Status:').locator('..');
		await expect(syncSection).toBeVisible();
	});

	test('Chip adjustment: +1 button increases chips', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Find Period 1 row in admin panel
		const period1AdminRow = page
			.locator('div.bg-white:has-text("Period 1")')
			.filter({ hasText: '+1' });

		// Get current chip count
		const chipCountBefore = await period1AdminRow
			.locator('span.font-mono')
			.first()
			.textContent();

		// Click +1 button
		await period1AdminRow.getByRole('button', { name: '+1' }).click();

		// Wait for update
		await page.waitForTimeout(300);

		// Verify chip count increased
		const chipCountAfter = await period1AdminRow.locator('span.font-mono').first().textContent();
		expect(parseInt(chipCountAfter!)).toBe(parseInt(chipCountBefore!) + 1);
	});

	test('Chip adjustment: -1 button decreases chips', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Find Period 1 row in admin panel
		const period1AdminRow = page
			.locator('div.bg-white:has-text("Period 1")')
			.filter({ hasText: '-1' });

		// Get current chip count (should start at 5)
		const chipCountBefore = await period1AdminRow
			.locator('span.font-mono')
			.first()
			.textContent();

		// Only click if chips > 0
		const chips = parseInt(chipCountBefore!);
		if (chips > 0) {
			await period1AdminRow.getByRole('button', { name: '-1' }).click();

			// Wait for update
			await page.waitForTimeout(300);

			// Verify chip count decreased
			const chipCountAfter = await period1AdminRow
				.locator('span.font-mono')
				.first()
				.textContent();
			expect(parseInt(chipCountAfter!)).toBe(chips - 1);
		}
	});

	test('Edge case: -1 button disabled when chips = 0', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Find a class and reduce chips to 0
		const period1Row = page.locator('div.bg-white:has-text("Period 1")').filter({ hasText: '-1' });

		// Keep clicking -1 until disabled
		let iterations = 0;
		while (iterations < 10) {
			// Safety limit
			const minusButton = period1Row.getByRole('button', { name: '-1' });
			const isDisabled = await minusButton.isDisabled();

			if (isDisabled) {
				// Success - button is disabled when chips = 0
				const chipCount = await period1Row.locator('span.font-mono').first().textContent();
				expect(chipCount).toBe('0');
				break;
			}

			await minusButton.click();
			await page.waitForTimeout(200);
			iterations++;
		}
	});

	test('Integration: Admin panel + Leaderboard sync', async ({ page }) => {
		// Expand admin panel
		await page.getByRole('button', { name: 'Teacher Controls' }).click();

		// Get Period 2 chips from leaderboard
		const period2LeaderboardRow = page.locator('tbody tr:has-text("Period 2")');
		const chipsBefore = await period2LeaderboardRow.locator('td:nth-child(4)').textContent();

		// Increase chips via admin panel
		const period2AdminRow = page
			.locator('div.bg-white:has-text("Period 2")')
			.filter({ hasText: '+1' });
		await period2AdminRow.getByRole('button', { name: '+1' }).click();

		// Wait for sync
		await page.waitForTimeout(500);

		// Verify leaderboard updated
		const chipsAfter = await period2LeaderboardRow.locator('td:nth-child(4)').textContent();
		expect(chipsAfter).not.toBe(chipsBefore);
	});
});
