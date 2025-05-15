import type { Color } from "./types";
import { hexToRgba } from "./utils";

export const GRID_LINE_SIZE = 1;

export const COLOR_GRID_LINE_DARK: Color = [0.25, 0.25, 0.27, 1.0]; // zinc-700 #3f3f46
export const COLOR_GRID_LINE_LIGHT: Color = [0.89, 0.89, 0.91, 1.0]; // zinc-200 #e4e4e7

export const COLOR_SELECTED_CELL_DARK: Color = [0.2, 0.83, 0.6, 0.4]; // emerald-400/40 #34d399
export const COLOR_SELECTED_CELL_LIGHT: Color = [0.31, 0.27, 0.9, 0.6]; // indigo-600/40 #4f46e5

export const COLOR_CELL_DARK_HEX = "#18181b"; // zinc-900
export const COLOR_CELL_LIGHT_HEX = "#fafafa"; // zinc-50
export const COLOR_CELL_DARK = hexToRgba(COLOR_CELL_DARK_HEX);
export const COLOR_CELL_LIGHT = hexToRgba(COLOR_CELL_LIGHT_HEX);

export const MAX_COLS = 9e4;
export const MAX_ROWS = 2e5;

export const CELL_W = 99;
export const CELL_H = 33;

export const DEFAULT_FONT_FAMILY = "Roboto";
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT_COLOR = "";
export const DEFAULT_BOLD = false;
export const DEFAULT_ITALIC = false;
export const DEFAULT_UNDERLINE = false;
export const DEFAULT_STRIKETHROUGH = false;

export const SHEET_NAME_PATTERN_STR = "[A-Za-z0-9_]";
export const SHEET_NAME_PATTERN = new RegExp(SHEET_NAME_PATTERN_STR);
