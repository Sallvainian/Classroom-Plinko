<script lang="ts">
	import { onMount } from 'svelte';
	import { classesCache, activeClassId } from '$lib/stores/classroom';

	// Session storage key for persistence
	const STORAGE_KEY = 'activeClassId';

	// Restore from sessionStorage on mount
	onMount(() => {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		if (stored && $classesCache.some((c) => c.id === stored)) {
			activeClassId.set(stored);
		}
	});

	// Handle class selection
	function selectClass(classId: string) {
		activeClassId.set(classId);
		sessionStorage.setItem(STORAGE_KEY, classId);
	}
</script>

<div class="class-period-selector">
	<h3 class="text-lg font-bold mb-4 text-white tracking-wide">Select Class Period</h3>
	<div class="grid grid-cols-2 gap-3">
		{#each $classesCache as classItem}
			<button
				type="button"
				on:click={() => selectClass(classItem.id)}
				class="px-4 py-3.5 bg-gray-800/80 text-gray-300 rounded-lg font-semibold border border-gray-700
				       hover:bg-gray-700 hover:text-white hover:border-gray-600 active:bg-gray-600 transition-all shadow-md
				       {$activeClassId === classItem.id ? 'ring-2 ring-blue-500 bg-gray-700 text-white border-blue-600 shadow-lg shadow-blue-900/30' : ''}"
			>
				{classItem.name}
			</button>
		{/each}
	</div>
</div>

<style>
	.class-period-selector {
		user-select: none;
	}
</style>
