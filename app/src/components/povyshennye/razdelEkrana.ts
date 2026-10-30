/**
 * Что отличает экраны разделов с готовыми вариантами: тексты, код
 * набора, число вариантов и версий, готовые варианты и варианты с
 * частью 2. Экран один (PovScreen) — «Варианты повышенной сложности»
 * и «Ежемесячные варианты» различаются только этим описанием.
 */

import { EZH_SCREEN, EZH_VARIANT_LABEL } from '@/content/ezhemesyachnye';
import { POV_SCREEN, type PovTexts } from '@/content/povyshennye';
import { ezhKod, ezhNomer, EZH_VARIANTOV } from '@/lib/ezhemesyachnye/kod';
import { GOTOVY as GOTOVY_EV } from '@/lib/ezhemesyachnye/dannye';
import { GOTOVY, S_CHAST2 } from '@/lib/povyshennye/dannye';
import { povKod, povNomer, versiyaText } from '@/lib/povyshennye/kod';
import { VARIANTOV, VERSIY } from '@/lib/povyshennye/types';

export interface RazdelEkrana {
  /** Префикс data-testid: «pov», «ezh». */
  id: string;
  T: PovTexts;
  kod: (k: number) => string;
  nomer: (code: string) => number | null;
  variantov: number;
  versiy: number;
  gotovy: readonly number[];
  chast2: readonly number[];
  /** Подпись версии: «7.3» или «Октябрь 2026». */
  versiya: (k: number, v: number) => string;
  /** Короткая подпись строки в списке версий: «7.3» или код «EV-01». */
  stroka: (k: number, v: number) => string;
}

export const RAZDEL_POV: RazdelEkrana = {
  id: 'pov',
  T: POV_SCREEN,
  kod: povKod,
  nomer: povNomer,
  variantov: VARIANTOV,
  versiy: VERSIY,
  gotovy: GOTOVY,
  chast2: S_CHAST2,
  versiya: versiyaText,
  stroka: versiyaText,
};

export const RAZDEL_EZH: RazdelEkrana = {
  id: 'ezh',
  T: EZH_SCREEN,
  kod: ezhKod,
  nomer: ezhNomer,
  variantov: EZH_VARIANTOV,
  versiy: 1,
  gotovy: GOTOVY_EV,
  /* Часть 2 есть во всех ежемесячных вариантах. */
  chast2: GOTOVY_EV,
  versiya: (k) => EZH_VARIANT_LABEL(k),
  stroka: (k) => ezhKod(k),
};

/** Описания по id: страница (серверный компонент) передаёт экрану строку, а не функции. */
export const RAZDELY_EKRANA = { pov: RAZDEL_POV, ezh: RAZDEL_EZH } as const;
