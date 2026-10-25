/**
 * Разделы первой части для экрана фильтров: названия, подтипы и
 * возможности. Лёгкие описания (adapters/zNN/info.ts) — движки разделов
 * здесь не грузятся, их тянет lib/variant/load.ts по «Сформировать».
 */

import { info as z01 } from './adapters/z01/info';
import { info as z02 } from './adapters/z02/info';
import { info as z03 } from './adapters/z03/info';
import { info as z04 } from './adapters/z04/info';
import { info as z05 } from './adapters/z05/info';
import { info as z06 } from './adapters/z06/info';
import { info as z07 } from './adapters/z07/info';
import { info as z08 } from './adapters/z08/info';
import { info as z09 } from './adapters/z09/info';
import { info as z10 } from './adapters/z10/info';
import { info as z11 } from './adapters/z11/info';
import { info as z12 } from './adapters/z12/info';
import { info as z13 } from './adapters/z13/info';
import type { EgeNo, SectionInfo } from './types';

export const SECTIONS: readonly SectionInfo[] = [
  z01,
  z02,
  z03,
  z04,
  z05,
  z06,
  z07,
  z08,
  z09,
  z10,
  z11,
  z12,
  z13,
];

export function sectionInfo(n: EgeNo): SectionInfo {
  const s = SECTIONS.find((x) => x.egeNumber === n);
  if (s === undefined) throw new Error(`Нет раздела №${n}`);
  return s;
}

/** Подтипы по заданиям: от них длина маски в коде варианта. */
export const SUBTYPE_IDS: Readonly<Record<EgeNo, readonly string[]>> = Object.fromEntries(
  SECTIONS.map((s) => [s.egeNumber, s.subtypes.map((t) => t.id)]),
) as unknown as Record<EgeNo, readonly string[]>;
