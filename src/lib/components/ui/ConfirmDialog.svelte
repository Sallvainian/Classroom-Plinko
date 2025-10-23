<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	export let open = false;
	export let title = 'Confirm Action';
	export let message = 'Are you sure?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';
	export let onConfirm: () => void;
	export let onCancel: () => void = () => {};

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}
</script>

<DialogPrimitive.Root bind:open>
	<DialogPrimitive.Portal>
		<DialogPrimitive.Overlay class="fixed inset-0 bg-black/50 z-50" />
		<DialogPrimitive.Content
			class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
			       bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50"
		>
			<DialogPrimitive.Title class="text-xl font-bold text-gray-900 mb-3">
				{title}
			</DialogPrimitive.Title>
			<DialogPrimitive.Description class="text-gray-700 mb-6">
				{message}
			</DialogPrimitive.Description>
			<div class="flex gap-3 justify-end">
				<button
					type="button"
					on:click={handleCancel}
					class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
				>
					{cancelText}
				</button>
				<button
					type="button"
					on:click={handleConfirm}
					class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
				>
					{confirmText}
				</button>
			</div>
		</DialogPrimitive.Content>
	</DialogPrimitive.Portal>
</DialogPrimitive.Root>
