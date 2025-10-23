<script lang="ts">
  import { plinkoEngine, points, recentWins } from '$lib/stores/game';
  import { activeClass, updateClassInCache, syncStatus } from '$lib/stores/classroom';
  import { queueOperation } from '$lib/services/offlineQueue';
  import { addClassPoints } from '$lib/services/supabase';
  import { refreshClassesCache } from '$lib/services/syncService';
  import CircleNotch from 'phosphor-svelte/lib/CircleNotch';
  import { onMount, onDestroy } from 'svelte';
  import type { Action } from 'svelte/action';
  import BinsRow from './BinsRow.svelte';
  import LastWins from './LastWins.svelte';
  import PlinkoEngine from './PlinkoEngine';

  const { WIDTH, HEIGHT } = PlinkoEngine;

  const initPlinko: Action<HTMLCanvasElement> = (node) => {
    $plinkoEngine = new PlinkoEngine(node);
    $plinkoEngine.start();

    return {
      destroy: () => {
        $plinkoEngine?.stop();
      },
    };
  };

  // Listen for ballEnteredBin events and update points
  const handleBallEnteredBin = async (event: Event) => {
    const customEvent = event as CustomEvent<{ binIndex: number; points: number }>;
    const { binIndex, points: ballPoints } = customEvent.detail;

    // Update old points system (for backwards compatibility)
    points.update((currentPoints) => currentPoints + ballPoints);
    recentWins.update((wins) => [...wins.slice(-19), { binIndex, points: ballPoints }]);

    // ONLINE-FIRST: Add points for active class
    if ($activeClass) {
      if ($syncStatus === 'online' || navigator.onLine) {
        try {
          // Call Supabase directly
          await addClassPoints($activeClass.id, ballPoints, binIndex);

          // Refresh cache from server (source of truth)
          await refreshClassesCache();

          console.log('✓ Points synced online');
        } catch (error) {
          console.warn('Online points sync failed, falling back to offline mode:', error);

          // OFFLINE BACKUP: Queue for later sync
          await queueOperation({
            operation: 'add_points',
            class_id: $activeClass.id,
            payload: {
              points: ballPoints,
              slot_index: binIndex,
            },
            timestamp: new Date().toISOString(),
            retry_count: 0,
            synced: false,
          });

          // Optimistic update (offline fallback)
          updateClassInCache($activeClass.id, {
            total_points: $activeClass.total_points + ballPoints,
          });

          syncStatus.set('offline');
        }
      } else {
        // Already offline - queue immediately
        await queueOperation({
          operation: 'add_points',
          class_id: $activeClass.id,
          payload: {
            points: ballPoints,
            slot_index: binIndex,
          },
          timestamp: new Date().toISOString(),
          retry_count: 0,
          synced: false,
        });

        // Optimistic update
        updateClassInCache($activeClass.id, {
          total_points: $activeClass.total_points + ballPoints,
        });
      }
    }
  };

  onMount(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('ballEnteredBin', handleBallEnteredBin);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('ballEnteredBin', handleBallEnteredBin);
    }
  });
</script>

<div class="relative bg-black h-full">
  <div class="mx-auto flex h-full flex-col px-4 pb-4">
    <div class="relative w-full" style:aspect-ratio={`${WIDTH} / ${HEIGHT}`}>
      {#if $plinkoEngine === null}
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <CircleNotch class="size-20 animate-spin text-slate-600" weight="bold" />
        </div>
      {/if}

      <canvas use:initPlinko width={WIDTH} height={HEIGHT} class="absolute inset-0 h-full w-full" />
    </div>
    <BinsRow />
  </div>
  <div class="absolute right-[5%] top-1/2 -translate-y-1/2">
    <LastWins />
  </div>
</div>
