<script lang="ts">
	import { syncStatus } from '$lib/stores/classroom';
	import { getPendingCount } from '$lib/services/offlineQueue';
	import { onMount, onDestroy } from 'svelte';

	let pendingCount = 0;
	let interval: ReturnType<typeof setInterval> | null = null;

	async function updatePendingCount() {
		pendingCount = await getPendingCount();
	}

	onMount(() => {
		updatePendingCount();
		// Update pending count every 5 seconds
		interval = setInterval(updatePendingCount, 5000);
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	$: statusColor =
		$syncStatus === 'online' ? 'bg-green-500' : $syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500';

	$: statusText =
		$syncStatus === 'online'
			? 'Online'
			: $syncStatus === 'syncing'
				? 'Syncing...'
				: 'Offline';
</script>

<div class="sync-status-indicator flex items-center gap-2 text-sm">
	<div class="relative">
		<div class="w-3 h-3 rounded-full {statusColor}"></div>
		{#if $syncStatus === 'syncing'}
			<div class="absolute inset-0 w-3 h-3 rounded-full {statusColor} animate-ping opacity-75"></div>
		{/if}
	</div>
	<span class="text-gray-700">{statusText}</span>
	{#if pendingCount > 0}
		<span class="text-xs text-gray-500">({pendingCount} pending)</span>
	{/if}
</div>

<style>
	.sync-status-indicator {
		user-select: none;
	}
</style>
