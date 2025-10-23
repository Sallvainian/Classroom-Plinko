<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import logo from '$lib/assets/logo.svg';
  import Plinko from '$lib/components/Plinko';
  import SettingsWindow from '$lib/components/SettingsWindow';
  import Sidebar from '$lib/components/Sidebar';
  import Leaderboard from '$lib/components/Classroom/Leaderboard.svelte';
  import SyncStatusIndicator from '$lib/components/SyncStatusIndicator.svelte';
  import GitHubLogo from 'phosphor-svelte/lib/GithubLogo';
  import { initializeSyncService, cleanupSyncService, enableRealtimeSync } from '$lib/services/syncService';
  import { classesCache, activeClassId } from '$lib/stores/classroom';

  onMount(() => {
    // Initialize sync service with auto-sync and online/offline listeners
    initializeSyncService();

    // Enable real-time subscriptions for leaderboard updates
    enableRealtimeSync();

    // Set default active class (Period 1) when classes are loaded
    const unsubscribe = classesCache.subscribe((classes) => {
      if (classes.length > 0 && !$activeClassId) {
        // Set Period 1 as default active class
        const period1 = classes.find((c) => c.name === 'Period 1');
        if (period1) {
          activeClassId.set(period1.id);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  });

  onDestroy(() => {
    // Cleanup sync service when component unmounts
    cleanupSyncService();
  });
</script>

<div class="relative flex min-h-dvh w-full flex-col">
  <nav class="sticky top-0 z-10 w-full bg-black/95 backdrop-blur-sm px-5 drop-shadow-2xl border-b border-gray-900">
    <div class="mx-auto flex h-14 max-w-7xl items-center justify-between">
      <img src={logo} alt="logo" class="h-6 sm:h-7" />
      <SyncStatusIndicator />
    </div>
  </nav>

  <div class="flex-1 px-5">
    <div class="mx-auto mt-5 min-w-[300px] drop-shadow-xl md:mt-10" style="max-width: 1800px;">
      <div class="flex flex-col-reverse overflow-hidden rounded-lg lg:w-full lg:flex-row gap-0">
        <div class="lg:w-80 lg:flex-shrink-0">
          <Sidebar />
        </div>
        <div class="flex-1 min-w-0">
          <Plinko />
        </div>
        <div class="lg:w-80 lg:flex-shrink-0 bg-black/90 p-5 border-l border-gray-800">
          <Leaderboard />
        </div>
      </div>
    </div>
  </div>

  <SettingsWindow />

  <footer class="px-5 pb-4 pt-16">
    <div class="mx-auto max-w-[40rem]">
      <div aria-hidden="true" class="h-[1px] bg-slate-700" />
      <div class="flex items-center justify-between p-2">
        <p class="text-sm text-slate-500">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            class=" text-cyan-600 transition hover:text-cyan-500"
          >
            Plinko Game Online
          </a>
          © 2024
        </p>
        <a
          href="https://github.com/plinko-game-online/plinko-game-online.github.io"
          target="_blank"
          rel="noreferrer"
          class="flex items-center gap-1 p-1 text-sm text-slate-500 transition hover:text-cyan-500"
        >
          <GitHubLogo class="size-4" weight="bold" />
          <span>Source Code</span>
        </a>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    @apply bg-neutral-950;
  }
</style>
