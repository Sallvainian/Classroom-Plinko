/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ConfirmDialog from '../ConfirmDialog.svelte';

describe('ConfirmDialog', () => {
	it('renders when open is true', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Test Title',
				message: 'Test Message',
				onConfirm: vi.fn()
			}
		});

		expect(screen.getByText('Test Title')).toBeInTheDocument();
		expect(screen.getByText('Test Message')).toBeInTheDocument();
	});

	it('does not render when open is false', () => {
		render(ConfirmDialog, {
			props: {
				open: false,
				title: 'Test Title',
				message: 'Test Message',
				onConfirm: vi.fn()
			}
		});

		expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
	});

	it('calls onConfirm when confirm button clicked', async () => {
		const onConfirm = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm',
				message: 'Are you sure?',
				onConfirm
			}
		});

		const confirmButton = screen.getByText('Confirm');
		await fireEvent.click(confirmButton);

		expect(onConfirm).toHaveBeenCalledOnce();
	});

	it('calls onCancel when cancel button clicked', async () => {
		const onCancel = vi.fn();

		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm',
				message: 'Are you sure?',
				onConfirm: vi.fn(),
				onCancel
			}
		});

		const cancelButton = screen.getByText('Cancel');
		await fireEvent.click(cancelButton);

		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('uses custom button text when provided', () => {
		render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Delete',
				message: 'Delete this item?',
				confirmText: 'Yes, Delete',
				cancelText: 'No, Keep',
				onConfirm: vi.fn()
			}
		});

		expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
		expect(screen.getByText('No, Keep')).toBeInTheDocument();
	});

	it('closes dialog after confirm', async () => {
		const { component } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm',
				message: 'Proceed?',
				onConfirm: vi.fn()
			}
		});

		const confirmButton = screen.getByText('Confirm');
		await fireEvent.click(confirmButton);

		// Dialog should close (open becomes false)
		expect(component.open).toBe(false);
	});

	it('closes dialog after cancel', async () => {
		const { component } = render(ConfirmDialog, {
			props: {
				open: true,
				title: 'Confirm',
				message: 'Proceed?',
				onConfirm: vi.fn()
			}
		});

		const cancelButton = screen.getByText('Cancel');
		await fireEvent.click(cancelButton);

		expect(component.open).toBe(false);
	});
});
