/**
 * Реестр фактов планиметрии (задание №1): id → утверждение справочника.
 *
 * Источник один — карточки справочника (./r01…r11): утверждение,
 * помеченное `fakt`, становится фактом реестра. Отсюда его берут
 * кнопка «Показать свойство» в подсказках тренажёра, опорные задачи и
 * шаги решений. Формулировка, формула, чертёж и разбор — те же, что в
 * справочнике: копий текста нет.
 */

import { RAZDELY_SPRAVOCHNIKA_1 } from './index';
import type { MetkaFakta, Razdel1, Tema1, Teorema, Utverzhdenie } from './tipy';

export type VidFakta = 'opredeleniya' | 'svoystva' | 'priznaki' | 'teoremy';

export interface Fakt1 extends MetkaFakta {
  vid: VidFakta;
  /** Формулировка словами ($…$ и **жирное**). */
  tekst: string;
  /** Формула (TeX без $). */
  formula?: string;
  /** Вторая формула теоремы с подписью. */
  dop?: { podpis: string; formula: string };
  /** Название теоремы из справочника: «Теорема Пифагора». */
  teorema?: string;
  tema: Tema1;
  razdel: Razdel1;
}

const VIDY: readonly VidFakta[] = ['opredeleniya', 'teoremy', 'svoystva', 'priznaki'];

function sobrat(): Record<string, Fakt1> {
  const out: Record<string, Fakt1> = {};
  for (const razdel of RAZDELY_SPRAVOCHNIKA_1) {
    for (const tema of razdel.temy) {
      for (const vid of VIDY) {
        for (const u of (tema[vid] ?? []) as readonly (Utverzhdenie | Teorema)[]) {
          if (u.fakt === undefined) continue;
          if (out[u.fakt.id] !== undefined) {
            throw new Error(`Факт ${u.fakt.id} помечен в справочнике дважды`);
          }
          out[u.fakt.id] =
            'slovami' in u
              ? {
                  ...u.fakt,
                  vid,
                  tekst: u.slovami,
                  formula: u.formula,
                  ...(u.dop === undefined ? {} : { dop: u.dop }),
                  ...(u.nazvanie === undefined ? {} : { teorema: u.nazvanie }),
                  tema,
                  razdel,
                }
              : {
                  ...u.fakt,
                  vid,
                  tekst: u.tekst,
                  ...(u.formula === undefined ? {} : { formula: u.formula }),
                  tema,
                  razdel,
                };
        }
      }
    }
  }
  return out;
}

/** Все факты: id → утверждение справочника. */
export const FAKTY_1: Readonly<Record<string, Fakt1>> = sobrat();

export function fakt1(id: string): Fakt1 | undefined {
  return FAKTY_1[id];
}

/** Название факта для кнопки; неизвестный id — ошибка сборки. */
export function nazvanieFakta1(id: string): string {
  const f = FAKTY_1[id];
  if (f === undefined) throw new Error(`Факт «${id}» не найден в реестре справочника`);
  return f.nazvanie;
}
