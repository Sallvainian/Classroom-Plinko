import { getBinColors } from '$lib/utils/colors';
import { computeBinProbabilities } from '$lib/utils/numbers';

export const LOCAL_STORAGE_KEY = {
  SETTINGS: {
    ANIMATION: 'plinko_settings_animation',
  },
} as const;

/**
 * Fixed point values for each slot (9 slots total).
 * These replace the old multiplier-based payout system.
 */
export const POINT_SLOTS = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100] as const;

/**
 * Fixed number of rows for the educational version.
 */
export const FIXED_ROW_COUNT = 16 as const;

/**
 * Range of row counts the game supports.
 */
export const rowCountOptions = [8, 9, 10, 11, 12, 13, 14, 15, 16] as const;

/**
 * Number of rows of pins the game supports.
 */
export type RowCount = (typeof rowCountOptions)[number];

/**
 * Interval (in milliseconds) for placing auto bets.
 */
export const autoBetIntervalMs = 250;

/**
 * For each row count, the background and shadow colors of each bin.
 */
export const binColorsByRowCount = rowCountOptions.reduce(
  (acc, rowCount) => {
    acc[rowCount] = getBinColors(rowCount);
    return acc;
  },
  {} as Record<RowCount, ReturnType<typeof getBinColors>>,
);

/**
 * For each row count, what's the probabilities of a ball falling into each bin.
 */
export const binProbabilitiesByRowCount: Record<RowCount, number[]> = rowCountOptions.reduce(
  (acc, rowCount) => {
    acc[rowCount] = computeBinProbabilities(rowCount);
    return acc;
  },
  {} as Record<RowCount, number[]>,
);

export const binColor = {
  background: {
    red: { r: 255, g: 0, b: 63 }, // rgb(255, 0, 63)
    yellow: { r: 255, g: 192, b: 0 }, // rgb(255, 192, 0)
  },
  shadow: {
    red: { r: 166, g: 0, b: 4 }, // rgb(166, 0, 4)
    yellow: { r: 171, g: 121, b: 0 }, // rgb(171, 121, 0)
  },
} as const;
