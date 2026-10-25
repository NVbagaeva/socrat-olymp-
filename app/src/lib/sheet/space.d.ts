/* Типы sheet/space.js — место для решения на листе ученика. */

export type SpaceMode = 'none' | 'blank' | 'grid';
export type SpaceSize = 'S' | 'M' | 'L' | 'auto';

/** Настройка: режим, размер и свой размер (или «без места») по номерам заданий. */
export interface SheetSpace {
  mode: SpaceMode;
  size: SpaceSize;
  per: Partial<Record<number, SpaceSize | 'none'>>;
}

/** Поле одной задачи на листе. */
export interface SpaceField {
  mode: 'blank' | 'grid';
  rows: number;
}

export interface SolutionLengths {
  byId: Record<string, number>;
  byNo: Record<string, number>;
}

export declare const MODES: readonly SpaceMode[];
export declare const SIZES: readonly SpaceSize[];
export declare const ROWS: Readonly<Record<'S' | 'M' | 'L', number>>;
export declare const AUTO: Readonly<{ min: number; max: number; from: number; perRow: number }>;
export declare const CELL_MM: number;
export declare const FIRST_ROWS: number;
export declare const DEFAULT: SheetSpace;

export declare function encodeSpace(space: SheetSpace | null | undefined): string;
export declare function decodeSpace(token: string | null | undefined): SheetSpace;
export declare function normalizeSpace(raw: unknown): SheetSpace;
export declare function withSpace(href: string, space: SheetSpace): string;
export declare function solutionLength(html: string | null | undefined): number | null;
export declare function rowsFor(size: SpaceSize, length: number | null | undefined): number;
export declare function spaceFor(
  space: SheetSpace,
  key: number | string | null | undefined,
  length: number | null | undefined,
): SpaceField | null;
export declare function solutionLengths(teacherSpec: unknown): SolutionLengths;
export declare function applySpace<T>(
  spec: T,
  space: SheetSpace,
  opts?: {
    lengths?: SolutionLengths | null;
    lengthOf?: (task: { id?: string; no?: number }) => number | null;
    keyOf?: (task: { id?: string; no?: number }) => number | null;
  },
): T;
export declare function spaceHtml(
  field: SpaceField,
  rows: number,
  first: boolean,
  last: boolean,
): string;

declare const api: {
  MODES: typeof MODES;
  SIZES: typeof SIZES;
  ROWS: typeof ROWS;
  AUTO: typeof AUTO;
  CELL_MM: typeof CELL_MM;
  FIRST_ROWS: typeof FIRST_ROWS;
  DEFAULT: typeof DEFAULT;
  encodeSpace: typeof encodeSpace;
  decodeSpace: typeof decodeSpace;
  normalizeSpace: typeof normalizeSpace;
  withSpace: typeof withSpace;
  solutionLength: typeof solutionLength;
  rowsFor: typeof rowsFor;
  spaceFor: typeof spaceFor;
  solutionLengths: typeof solutionLengths;
  applySpace: typeof applySpace;
  spaceHtml: typeof spaceHtml;
};
export default api;
