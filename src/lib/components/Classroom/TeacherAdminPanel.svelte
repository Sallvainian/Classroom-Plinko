<script lang="ts">
	import { classesCache, updateClassInCache, syncStatus } from '$lib/stores/classroom';
	import {
		adjustClassChips,
		resetAllChips,
		getClassDropHistory
	} from '$lib/services/supabase';
	import { queueOperation } from '$lib/services/offlineQueue';
	import { refreshClassesCache } from '$lib/services/syncService';
	import SyncStatusIndicator from '../SyncStatusIndicator.svelte';
	import ConfirmDialog from '../ui/ConfirmDialog.svelte';
	import PointsAdjuster from './PointsAdjuster.svelte';

	let isExpanded = false;
	let showResetConfirm = false;
	let isProcessing = false;

	function togglePanel() {
		isExpanded = !isExpanded;
	}

	async function handleAdjustChips(classId: string, delta: number) {
		try {
			isProcessing = true;

			// ONLINE-FIRST: Try to sync to Supabase immediately
			if ($syncStatus === 'online' || navigator.onLine) {
				try {
					// Call Supabase directly
					await adjustClassChips(classId, delta);

					// Refresh cache from server (source of truth)
					await refreshClassesCache();

					console.log('✓ Adjust chips synced online');
				} catch (error) {
					console.warn('Online adjust failed, falling back to offline mode:', error);

					// OFFLINE BACKUP: Queue for later sync
					await queueOperation({
						operation: delta > 0 ? 'reset_chips' : 'subtract_chip',
						class_id: classId,
						payload: {},
						timestamp: new Date().toISOString(),
						retry_count: 0,
						synced: false
					});

					// Optimistic update (offline fallback)
					updateClassInCache(classId, {
						chips_remaining: Math.max(
							0,
							($classesCache.find((c) => c.id === classId)?.chips_remaining || 0) + delta
						)
					});

					syncStatus.set('offline');
				}
			} else {
				// Already offline - queue immediately
				await queueOperation({
					operation: delta > 0 ? 'reset_chips' : 'subtract_chip',
					class_id: classId,
					payload: {},
					timestamp: new Date().toISOString(),
					retry_count: 0,
					synced: false
				});

				// Optimistic update
				updateClassInCache(classId, {
					chips_remaining: Math.max(
						0,
						($classesCache.find((c) => c.id === classId)?.chips_remaining || 0) + delta
					)
				});
			}
		} catch (error) {
			console.error('Failed to adjust chips:', error);
		} finally {
			isProcessing = false;
		}
	}

	async function handleResetAll() {
		try {
			isProcessing = true;

			// ONLINE-FIRST: Try to sync to Supabase immediately
			if ($syncStatus === 'online' || navigator.onLine) {
				try {
					// Call Supabase directly
					await resetAllChips();

					// Refresh cache from server (source of truth)
					await refreshClassesCache();

					console.log('✓ Reset chips synced online');
				} catch (error) {
					console.warn('Online reset failed, falling back to offline mode:', error);

					// OFFLINE BACKUP: Queue for later sync
					await queueOperation({
						operation: 'reset_chips',
						class_id: 'all',
						payload: {},
						timestamp: new Date().toISOString(),
						retry_count: 0,
						synced: false
					});

					// Optimistic update (offline fallback)
					$classesCache.forEach((classItem) => {
						updateClassInCache(classItem.id, { chips_remaining: 5 });
					});

					syncStatus.set('offline');
				}
			} else {
				// Already offline - queue immediately
				await queueOperation({
					operation: 'reset_chips',
					class_id: 'all',
					payload: {},
					timestamp: new Date().toISOString(),
					retry_count: 0,
					synced: false
				});

				// Optimistic update
				$classesCache.forEach((classItem) => {
					updateClassInCache(classItem.id, { chips_remaining: 5 });
				});
			}

			showResetConfirm = false;
		} catch (error) {
			console.error('Failed to reset all chips:', error);
		} finally {
			isProcessing = false;
		}
	}

	// Undo last drop (nice-to-have - AC11)
	async function handleUndo() {
		// This would need to:
		// 1. Fetch last drop record from history
		// 2. Reverse the points
		// 3. Add chip back
		// For now, showing a placeholder
		console.log('Undo functionality - to be implemented');
	}
</script>

<div class="teacher-admin-panel">
	<button
		type="button"
		on:click={togglePanel}
		class="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all border border-gray-700 flex items-center justify-between"
	>
		<span>Teacher Controls</span>
		<span class="text-lg">{isExpanded ? '▼' : '▶'}</span>
	</button>

	{#if isExpanded}
		<div class="panel-content bg-gray-900/50 rounded-b-lg p-4 border border-gray-800 border-t-0">
			<!-- Sync Status Indicator -->
			<div class="mb-4 flex items-center gap-2">
				<span class="text-sm font-semibold text-gray-300">Sync Status:</span>
				<SyncStatusIndicator />
			</div>

			<!-- Points Adjuster -->
			<div class="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
				<PointsAdjuster />
			</div>

			<!-- Chip Controls for Each Class -->
			<div class="space-y-2 mb-4">
				<h4 class="font-bold text-white mb-2">Adjust Chips</h4>
				{#each $classesCache as classItem}
					<div class="flex items-center justify-between bg-gray-800 rounded p-2 border border-gray-700">
						<span class="font-semibold text-white">{classItem.name}</span>
						<div class="flex items-center gap-2">
							<span class="text-gray-300 font-mono">{classItem.chips_remaining}</span>
							<button
								type="button"
								on:click={() => handleAdjustChips(classItem.id, -1)}
								disabled={isProcessing || classItem.chips_remaining === 0}
								class="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:cursor-not-allowed
								       text-white font-bold rounded transition-colors"
							>
								-1
							</button>
							<button
								type="button"
								on:click={() => handleAdjustChips(classItem.id, +1)}
								disabled={isProcessing}
								class="px-3 py-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed
								       text-white font-bold rounded transition-colors"
							>
								+1
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Reset All Chips Button -->
			<button
				type="button"
				on:click={() => (showResetConfirm = true)}
				disabled={isProcessing}
				class="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700
				       text-white font-bold rounded-lg transition-colors mb-2"
			>
				Reset All Chips
			</button>

			<!-- Undo Last Drop Button (nice-to-have) -->
			<button
				type="button"
				on:click={handleUndo}
				disabled={isProcessing}
				class="w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700
				       text-white font-bold rounded-lg transition-colors"
			>
				Undo Last Drop
			</button>
		</div>
	{/if}
</div>

<!-- Reset Confirmation Dialog -->
<ConfirmDialog
	bind:open={showResetConfirm}
	title="Reset All Chips"
	message="Reset all chips to 5? This cannot be undone."
	confirmText="Reset"
	onConfirm={handleResetAll}
/>

<style>
	.teacher-admin-panel {
		user-select: none;
	}
</style>
