<script lang="ts">
	import { classesCache, activeClass, syncStatus, updateClassInCache } from '$lib/stores/classroom';
	import { adjustClassPoints } from '$lib/services/supabase';
	import { queueOperation } from '$lib/services/offlineQueue';
	import { refreshClassesCache } from '$lib/services/syncService';

	let isProcessing = false;
	let customAmount = '';

	const presetAmounts = [
		{ label: '10K', value: 10000 },
		{ label: '1K', value: 1000 },
		{ label: '500', value: 500 },
		{ label: '100', value: 100 },
		{ label: '50', value: 50 },
		{ label: '10', value: 10 },
		{ label: '1', value: 1 }
	];

	async function adjustPoints(amount: number) {
		if (!$activeClass || isProcessing) return;

		isProcessing = true;

		try {
			// ONLINE-FIRST: Try to sync to Supabase immediately
			if ($syncStatus === 'online' || navigator.onLine) {
				try {
					// Call Supabase directly
					await adjustClassPoints($activeClass.id, amount);

					// Refresh cache from server (source of truth)
					await refreshClassesCache();

					console.log('✓ Points adjustment synced online');
				} catch (error) {
					console.warn('Online points adjustment failed, falling back to offline mode:', error);

					// OFFLINE BACKUP: Queue for later sync
					await queueOperation({
						operation: 'add_points',
						class_id: $activeClass.id,
						payload: {
							points: amount,
							slot_index: -1 // Manual adjustment marker
						},
						timestamp: new Date().toISOString(),
						retry_count: 0,
						synced: false
					});

					// Optimistic update (offline fallback)
					updateClassInCache($activeClass.id, {
						total_points: Math.max(0, $activeClass.total_points + amount)
					});

					syncStatus.set('offline');
				}
			} else {
				// Already offline - queue immediately
				await queueOperation({
					operation: 'add_points',
					class_id: $activeClass.id,
					payload: {
						points: amount,
						slot_index: -1 // Manual adjustment marker
					},
					timestamp: new Date().toISOString(),
					retry_count: 0,
					synced: false
				});

				// Optimistic update
				updateClassInCache($activeClass.id, {
					total_points: Math.max(0, $activeClass.total_points + amount)
				});
			}
		} catch (error) {
			console.error('Failed to adjust points:', error);
		} finally {
			isProcessing = false;
		}
	}

	function handleCustomAdjust(isAdd: boolean) {
		const amount = parseInt(customAmount);
		if (isNaN(amount) || amount <= 0) {
			alert('Please enter a valid positive number');
			return;
		}

		adjustPoints(isAdd ? amount : -amount);
		customAmount = '';
	}
</script>

<div class="points-adjuster">
	<h4 class="font-bold text-white mb-3 text-sm">Adjust Points</h4>

	{#if !$activeClass}
		<p class="text-gray-400 text-sm mb-3">Select a class to adjust points</p>
	{:else}
		<p class="text-gray-300 text-sm mb-3">
			Adjusting: <span class="font-semibold text-white">{$activeClass.name}</span>
		</p>

		<!-- Preset Buttons -->
		<div class="mb-4">
			<p class="text-xs text-gray-400 mb-2">Quick Add:</p>
			<div class="grid grid-cols-4 gap-2 mb-2">
				{#each presetAmounts as preset}
					<button
						type="button"
						on:click={() => adjustPoints(preset.value)}
						disabled={isProcessing}
						class="px-2 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed
						       text-white text-xs font-bold rounded transition-colors"
					>
						+{preset.label}
					</button>
				{/each}
			</div>

			<p class="text-xs text-gray-400 mb-2 mt-3">Quick Subtract:</p>
			<div class="grid grid-cols-4 gap-2">
				{#each presetAmounts as preset}
					<button
						type="button"
						on:click={() => adjustPoints(-preset.value)}
						disabled={isProcessing}
						class="px-2 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed
						       text-white text-xs font-bold rounded transition-colors"
					>
						-{preset.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Custom Amount -->
		<div class="border-t border-gray-800 pt-3">
			<p class="text-xs text-gray-400 mb-2">Custom Amount:</p>
			<div class="flex gap-2 mb-2">
				<input
					type="number"
					bind:value={customAmount}
					placeholder="Enter amount"
					min="1"
					class="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm
					       focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					on:click={() => handleCustomAdjust(true)}
					disabled={isProcessing || !customAmount}
					class="flex-1 px-3 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed
					       text-white text-xs font-bold rounded transition-colors"
				>
					Add Custom
				</button>
				<button
					type="button"
					on:click={() => handleCustomAdjust(false)}
					disabled={isProcessing || !customAmount}
					class="flex-1 px-3 py-2 bg-red-700 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed
					       text-white text-xs font-bold rounded transition-colors"
				>
					Subtract Custom
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.points-adjuster {
		user-select: none;
	}

	/* Remove spinner from number input */
	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
