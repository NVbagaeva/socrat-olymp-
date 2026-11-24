/**
 * Картинки-иллюстрации к сюжетам задач первой части (№4, №5, №9, №10
 * по ЕГЭ-2027). Одна картинка — один сюжет: у аналогов с тем же
 * сюжетом и другими числами картинка общая.
 *
 * Файлы: public/images/zadachi/<номер ЕГЭ>/<ключ сюжета>-560.webp и
 * -280.webp, квадрат, фон прозрачный. Подписи alt —
 * data/kartinkiZadach.json. Оба собирает tools/kartinki_zadach.py
 * (сюжеты и промпты — tools/kartinki-zadach.json, план и журнал —
 * docs/plans/kartinki-k-zadacham.md).
 *
 * Привязку задачи к ключу сюжета ведёт каждый раздел у себя: №4–5 —
 * lib/veroyatnost/illyustratsii.ts, №9 — lib/zadanie10/kartinkiSyuzhetov.ts,
 * №10 — lib/zadanie11/kartinki.ts.
 */

import DANNYE from '@/data/kartinkiZadach.json';
import { assetUrl } from './assetUrl';

export type NomerKartinki = 4 | 5 | 9 | 10;

export interface KartinkaZadachi {
  /** Путь от корня public с версией: 560 px — основной, для экранов 2x. */
  src: string;
  /** 280 px — для обычных экранов и печати. */
  src280: string;
  alt: string;
  /** Сторона квадрата исходника в webp. */
  razmer: 560;
}

const ALT = DANNYE as Readonly<Record<string, Readonly<Record<string, string>>>>;

/* Версии файлов картинок — своя таблица (next.config.ts): в общей
   ASSET_VERSIONS 800 строк попали бы в первую загрузку каждой страницы. */
let versii: Record<string, string> | null = null;

/** Путь с версией: '/images/zadachi/9/x-560.webp' → '…?v=1a2b3c4d'. */
function sVersiey(put: string): string {
  if (versii === null) {
    try {
      versii = JSON.parse(process.env.KARTINKI_ASSET_VERSIONS ?? '{}') as Record<string, string>;
    } catch {
      versii = {};
    }
  }
  const v = versii[put];
  return v === undefined ? put : `${put}?v=${v}`;
}

export const PAPKA_KARTINOK_ZADACH = '/images/zadachi';

/** Картинка сюжета или undefined, если её ещё нет. */
export function kartinkaSyuzheta(
  nomer: NomerKartinki,
  klyuch: string | undefined,
): KartinkaZadachi | undefined {
  if (klyuch === undefined) {
    return undefined;
  }
  const alt = ALT[String(nomer)]?.[klyuch];
  if (alt === undefined) {
    return undefined;
  }
  const baza = `${PAPKA_KARTINOK_ZADACH}/${nomer}/${klyuch}`;
  return {
    src: sVersiey(`${baza}-560.webp`),
    src280: sVersiey(`${baza}-280.webp`),
    alt,
    razmer: 560,
  };
}

/** Все ключи сюжетов задания, у которых картинка готова. */
export function klyuchiKartinok(nomer: NomerKartinki): string[] {
  return Object.keys(ALT[String(nomer)] ?? {});
}

/** Подпись переключателя генератора листов — одна у всех заданий с картинками. */
export const FLAG_KARTINOK = {
  title: 'Картинки к задачам',
  note: 'Иллюстрации сюжетов на цветном листе; тратят тонер. На чёрно-белом листе и в варианте ЕГЭ их нет.',
};

function attr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Картинка на лист генератора: справа от условия, 30 мм. Ставится в
 * начало условия (обтекается текстом) и только на цветном листе.
 * `src` — путь от корня public или уже с версией.
 */
export function kartinkaListaHtml(src: string, alt: string): string {
  return (
    `<img class="sheet-kartinka" src="${attr(assetUrl(src))}" alt="${attr(alt)}" width="560" height="560" ` +
    'style="float:right;width:30mm;height:30mm;object-fit:contain;margin:0 0 2mm 4mm">'
  );
}
