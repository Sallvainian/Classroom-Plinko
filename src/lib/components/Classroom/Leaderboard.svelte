<script lang="ts">
	import { classLeaderboard, activeClassId } from '$lib/stores/classroom';

	// Format number with commas (e.g., 1000 -> "1,000")
	function formatPoints(points: number): string {
		return points.toLocaleString('en-US');
	}
</script>

<div class="leaderboard">
	<h3 class="text-xl font-bold mb-4 text-white tracking-wide">Leaderboard</h3>
	<table class="w-full border-collapse">
		<thead>
			<tr class="border-b-2 border-gray-700">
				<th class="text-left py-2 px-3 font-bold text-gray-400 text-sm">Rank</th>
				<th class="text-left py-2 px-3 font-bold text-gray-400 text-sm">Class</th>
				<th class="text-right py-2 px-3 font-bold text-gray-400 text-sm">Points</th>
				<th class="text-right py-2 px-3 font-bold text-gray-400 text-sm">Chips</th>
			</tr>
		</thead>
		<tbody>
			{#each $classLeaderboard as classItem, index}
				<tr
					class="border-b border-gray-800 transition-all
					       {$activeClassId === classItem.id ? 'bg-blue-900/40 border-blue-700' : 'hover:bg-gray-800/50'}"
				>
					<td class="py-3 px-3 text-lg font-semibold text-gray-400">#{index + 1}</td>
					<td class="py-3 px-3 text-lg font-semibold text-white">{classItem.name}</td>
					<td class="py-3 px-3 text-right text-lg font-bold text-blue-400">
						{formatPoints(classItem.total_points)}
					</td>
					<td class="py-3 px-3 text-right text-lg font-semibold text-gray-300">
						{classItem.chips_remaining}/5
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.leaderboard {
		user-select: none;
	}

	/* Larger fonts for projector visibility */
	table {
		font-size: 1.1rem;
	}

	@media (min-width: 1024px) {
		table {
			font-size: 1.25rem;
		}
	}
</style>
