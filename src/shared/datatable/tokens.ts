export const SPACING_UNIT_PX = 4;

export const SPACING = {
  none: 0,
  xs: SPACING_UNIT_PX,
  sm: SPACING_UNIT_PX * 2,
  md: SPACING_UNIT_PX * 3,
  lg: SPACING_UNIT_PX * 4,
  xl: SPACING_UNIT_PX * 6,
  xxl: SPACING_UNIT_PX * 8,
} as const;

export type TableDensity = "compact" | "default" | "comfortable";

export const DENSITY_ROW_HEIGHT: Record<TableDensity, number> = {
  compact: 32,
  default: 40,
  comfortable: 48,
};

export const DENSITY_HEADER_HEIGHT: Record<TableDensity, number> = {
  compact: 36,
  default: 40,
  comfortable: 48,
};

export const DENSITY_CELL_PADDING_Y: Record<TableDensity, string> = {
  compact: "py-1",
  default: "py-1.5",
  comfortable: "py-2",
};

export const DENSITY_CELL_PADDING_X: Record<TableDensity, string> = {
  compact: "px-2",
  default: "px-3",
  comfortable: "px-4",
};

export const TABLE_SELECTION_COL_WIDTH = 40;
export const TABLE_VIRTUAL_THRESHOLD = 80;
export const TABLE_DEFAULT_COL_SIZE = 140;
export const TABLE_DEFAULT_MIN_SIZE = 64;
export const TABLE_DEFAULT_MAX_SIZE = 600;
export const TABLE_GROW_MIN_SIZE = 140;
