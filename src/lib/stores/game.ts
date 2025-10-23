import PlinkoEngine from '$lib/components/Plinko/PlinkoEngine';
import { binColor } from '$lib/constants/game';
import type { RowCount } from '$lib/types';
import { interpolateRgbColors } from '$lib/utils/colors';
import { derived, writable } from 'svelte/store';

export const plinkoEngine = writable<PlinkoEngine | null>(null);

export const rowCount = writable<RowCount>(16);

/**
 * Total points accumulated from all balls.
 */
export const points = writable<number>(0);

/**
 * Recent point wins (for LastWins display).
 * Stores the last few ball results: { binIndex, points }
 */
export const recentWins = writable<Array<{ binIndex: number; points: number }>>([]);

/**
 * RGB colors for every bin. The length of the array is the number of bins.
 */
export const binColors = derived<typeof rowCount, { background: string[]; shadow: string[] }>(
  rowCount,
  ($rowCount) => {
    const binCount = $rowCount + 1;
    const isBinsEven = binCount % 2 === 0;
    const redToYellowLength = Math.ceil(binCount / 2);

    const redToYellowBg = interpolateRgbColors(
      binColor.background.red,
      binColor.background.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    const redToYellowShadow = interpolateRgbColors(
      binColor.shadow.red,
      binColor.shadow.yellow,
      redToYellowLength,
    ).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`);

    return {
      background: [...redToYellowBg, ...redToYellowBg.toReversed().slice(isBinsEven ? 0 : 1)],
      shadow: [...redToYellowShadow, ...redToYellowShadow.toReversed().slice(isBinsEven ? 0 : 1)],
    };
  },
);
