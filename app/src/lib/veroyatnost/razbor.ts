/**
 * Разбор задачи в том виде, в каком он едет в браузер.
 *
 * Шаг разбора хранится в банке одной строкой: «Обе перегорят:
 * 0,3 · 0,3 = 0,09.» На карточке он показывается как в учебнике —
 * слова отдельной строкой, а вычисление под ними настоящей формулой:
 * дроби дробями, буквы курсивом. Формулы набирает KaTeX на сборке
 * (см. nabor.ts), здесь — только чистые преобразования строк и
 * формат, общий для сборки и браузера. Модуль намеренно не тянет
 * KaTeX: его импортируют клиентские компоненты.
 *
 * Весь разбор — и слова, и формулы, и координатная прямая — уезжает
 * вниз одной закрытой строкой (см. secret.ts): в разметке ни ответа,
 * ни длины благоприятного промежутка нет.
 */

import type { Pryamaya } from './pryamaya';
import { openText } from './secret';

/** Шаг разбора, набранный для показа. */
export interface RazborShag {
  /** Слова шага: HTML, формулы внутри уже набраны. */
  slova: string;
  /** Вычисление шага отдельной строкой: HTML KaTeX; null — шаг без счёта. */
  formula: string | null;
}

export interface Razbor {
  shagi: RazborShag[];
  /** Координатная прямая, если задача решается по ней. */
  pryamaya?: Pryamaya;
}

/** Раскрыть разбор в браузере — по просьбе ученика. */
export function otkrytRazbor(sealed: string, seal: string): Razbor {
  return JSON.parse(openText(sealed, seal)) as Razbor;
}

/* ── Слова и вычисление ─────────────────────────────────────────── */

/**
 * Хвост шага, который и есть вычисление: числа, знаки действий и
 * равенства, изредка «P =» впереди. Отбирается только хвост с хотя
 * бы одним действием или равенством: «Всего участников 20.» — это
 * слова, а «Жёлтых: 20 − 5 = 15.» — слова и вычисление.
 */
const HVOST = /(?:^|\s)((?:P\s*=\s*)?\d[\d,.\s:·×−+=()/]*\d)\.?$/u;

export interface Razdelenie {
  slova: string;
  /** Вычисление в TeX; null — в шаге его нет. */
  tex: string | null;
}

/** Разделить строку шага на слова и вычисление. */
export function razdelit(text: string): Razdelenie {
  const chistyy = text.trim();
  const match = HVOST.exec(chistyy);
  if (match === null || match[1] === undefined) {
    return { slova: chistyy, tex: null };
  }
  const vyrazhenie = match[1].trim();
  if (!/[=:·×−+/]/.test(vyrazhenie)) {
    return { slova: chistyy, tex: null };
  }
  const slova = chistyy.slice(0, match.index).trim();
  return { slova, tex: vTex(vyrazhenie) };
}

/**
 * Арифметика из банка в TeX. Отношение «a : b» становится дробью,
 * запятая внутри числа — запятой без пробела после, знаки действий —
 * своими командами.
 */
export function vTex(vyrazhenie: string): string {
  return vyrazhenie
    .replace(/(\d+(?:,\d+)?)\s*:\s*(\d+(?:,\d+)?)/g, '\\dfrac{$1}{$2}')
    .replace(/(\d),(\d)/g, '$1{,}$2')
    .replace(/·/g, '\\cdot ')
    .replace(/×/g, '\\times ')
    .replace(/−/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
