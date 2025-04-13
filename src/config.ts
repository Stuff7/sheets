import type { Color } from "./types";

export const GRID_LINE_SIZE = 1;

export const COLOR_GRID_LINE_DARK: Color = [0.25, 0.25, 0.27, 1.0]; // zinc-700 #3f3f46
export const COLOR_GRID_LINE_LIGHT: Color = [0.89, 0.89, 0.91, 1.0]; // zinc-200 #e4e4e7

export const COLOR_SELECTED_CELL_DARK: Color = [0.2, 0.83, 0.6, 0.4]; // emerald-400/40 #34d399
export const COLOR_SELECTED_CELL_LIGHT: Color = [0.31, 0.27, 0.9, 0.6]; // indigo-600/40 #4f46e5

export const COLOR_CELL_DARK: Color = [0.09, 0.09, 0.11, 1.0]; // zinc-900 #18181b
export const COLOR_CELL_LIGHT: Color = [0.98, 0.98, 0.98, 1.0]; // zinc-50 #fafafa

export const MAX_COLS = 9e4;
export const MAX_ROWS = 2e5;

export const CELL_W = 99;
export const CELL_H = 33;
