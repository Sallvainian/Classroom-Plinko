<script lang="ts">
	import { plinkoEngine } from '$lib/stores/game';
	import { activeClass, canDrop, updateClassInCache, syncStatus } from '$lib/stores/classroom';
	import { queueOperation } from '$lib/services/offlineQueue';
	import { subtractClassChip } from '$lib/services/supabase';
	import { refreshClassesCache } from '$lib/services/syncService';
	import { isGameSettingsOpen } from '$lib/stores/layout';
	import { flyAndScale } from '$lib/utils/transitions';
	import { Tooltip } from 'bits-ui';
	import GearSix from 'phosphor-svelte/lib/GearSix';
	import { twMerge } from 'tailwind-merge';
	import ClassPeriodSelector from '../Classroom/ClassPeriodSelector.svelte';
	import TeacherAdminPanel from '../Classroom/TeacherAdminPanel.svelte';

	let isDropping = false;
	$: isDropChipDisabled = $plinkoEngine === null || !$canDrop || isDropping;

	async function handleDropChip() {
		if (!$activeClass || !$canDrop || isDropping) return;

		// Prevent concurrent drops
		isDropping = true;

		try {
			// ONLINE-FIRST: Try to sync to Supabase immediately
			if ($syncStatus === 'online' || navigator.onLine) {
				try {
					// Call Supabase directly
					await subtractClassChip($activeClass.id);

					// Refresh cache from server (source of truth)
					await refreshClassesCache();

					console.log('✓ Online sync successful');
				} catch (error) {
					console.warn('Online sync failed, falling back to offline mode:', error);

					// OFFLINE BACKUP: Queue for later sync
					await queueOperation({
						operation: 'subtract_chip',
						class_id: $activeClass.id,
						payload: {},
						timestamp: new Date().toISOString(),
						retry_count: 0,
						synced: false
					});

					// Optimistic update (offline fallback)
					updateClassInCache($activeClass.id, {
						chips_remaining: $activeClass.chips_remaining - 1
					});

					syncStatus.set('offline');
				}
			} else {
				// Already offline - queue immediately
				await queueOperation({
					operation: 'subtract_chip',
					class_id: $activeClass.id,
					payload: {},
					timestamp: new Date().toISOString(),
					retry_count: 0,
					synced: false
				});

				// Optimistic update
				updateClassInCache($activeClass.id, {
					chips_remaining: $activeClass.chips_remaining - 1
				});
			}

			// Drop the chip
			$plinkoEngine?.dropBall();
		} finally {
			// Re-enable button after a short delay to prevent rapid clicking
			setTimeout(() => {
				isDropping = false;
			}, 150);
		}
	}
</script>

<div class="flex flex-col gap-5 bg-black/90 p-5 lg:max-w-80 border-r border-gray-800">
	<!-- Class Period Selector -->
	<ClassPeriodSelector />

	<!-- Drop Chip Button -->
	<button
		on:click={handleDropChip}
		disabled={isDropChipDisabled}
		class="touch-manipulation rounded-lg bg-green-600 py-3.5 font-bold text-white transition-all shadow-lg shadow-green-900/50
		       hover:bg-green-500 hover:shadow-green-800/60 active:bg-green-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:shadow-none"
	>
		{#if !$activeClass}
			Select a Class
		{:else if $activeClass.chips_remaining === 0}
			No Chips Remaining
		{:else}
			Drop Chip ({$activeClass.chips_remaining} left)
		{/if}
	</button>

	<!-- Teacher Admin Panel (collapsible) -->
	<TeacherAdminPanel />

	<!-- Settings Button -->
	<div class="mt-auto pt-5">
		<div class="flex items-center gap-4 border-t border-gray-800 pt-3">
			<Tooltip.Root openDelay={0} closeOnPointerDown={false}>
				<Tooltip.Trigger asChild let:builder>
					<button
						use:builder.action
						{...builder}
						on:click={() => ($isGameSettingsOpen = !$isGameSettingsOpen)}
						class={twMerge(
							'rounded-full p-2 text-gray-400 transition hover:bg-gray-800 active:bg-gray-700',
							$isGameSettingsOpen && 'text-white bg-gray-800'
						)}
					>
						<GearSix class="size-6" weight="fill" />
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content
					inTransition={flyAndScale}
					sideOffset={4}
					class="z-30 max-w-lg rounded-md bg-white p-3 text-sm font-medium text-gray-950 drop-shadow-xl"
				>
					<Tooltip.Arrow />
					<p>{$isGameSettingsOpen ? 'Close' : 'Open'} Game Settings</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
</div>
