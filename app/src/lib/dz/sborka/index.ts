/**
 * Сборка ДЗ при выдаче: состав (правила) → пункты с готовыми задачами.
 *
 * Зерно ставится здесь, одно на выдачу, и пишется в правило каждого
 * пункта: «каждому свои» — у ученика i своё зерно «<зерно>:<пункт>:i».
 * Ученик, лист ученика и лист учителя берут задачи из базы — снимком,
 * ничего не генерируя заново (docs/kabinet-dz-istochniki.md).
 *
 * Разделы подключаются по одному: r7, r8. Раздел без сборщика —
 * ошибка выдачи, а не пустой пункт.
 */

import { randomSeed } from '@/lib/randomSeed';
import type { KatalogRazdela } from '../katalog/types';
import type { PunktSostava, Sostav } from '../sostav';
import type { HwPartInput, HwUnitInput } from '../types';
import { kartochkaVDz, kartochkiNabora } from './obshchee';
import { OPORNYE_IZ_ZERNA, SBORSHCHIKI } from './razdely';

export class SborkaError extends Error {
  override name = 'SborkaError';
}

export type Katalogi = ReadonlyMap<number, KatalogRazdela>;

function katalogOf(k: Katalogi, no: number): KatalogRazdela {
  const kat = k.get(no);
  if (kat === undefined) throw new SborkaError(`Раздел №${no} пока нельзя выдать в ДЗ.`);
  return kat;
}

function nazvanieTipa(kat: KatalogRazdela, id: string): string {
  for (const g of kat.trenazher) {
    const t = g.tipy.find((x) => x.id === id);
    if (t !== undefined) return t.nazvanieHtml;
  }
  return id;
}

function escape(text: string): string {
  return text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Название пункта для списка и результатов (HTML). */
export function titlePunkta(kat: KatalogRazdela, p: PunktSostava): string {
  switch (p.ist) {
    case 'kartochki':
      return kat.kartochki?.find((t) => t.id === p.podtema)?.titleHtml ?? escape(p.podtema);
    case 'opornye':
      return escape(kat.opornye.find((b) => b.slug === p.blok)?.nazvanie ?? p.blok);
    case 'trenazher':
      return p.gruppa !== undefined
        ? escape(kat.trenazher.find((g) => g.id === p.gruppa)?.nazvanie ?? p.gruppa)
        : p.tipy.map((id) => nazvanieTipa(kat, id)).join('; ');
    case 'zadacha':
      return nazvanieTipa(kat, p.tip);
  }
}

async function edinitsy(
  kat: KatalogRazdela,
  p: PunktSostava,
  zerno: string,
  komu: readonly (string | null)[],
): Promise<HwUnitInput[]> {
  const no = kat.no;
  if (p.ist === 'kartochki') {
    const t = kat.kartochki?.find((x) => x.id === p.podtema);
    if (t === undefined) throw new SborkaError(`Нет набора карточек «${p.podtema}» в №${no}.`);
    return kartochkiNabora(t, p.kartochki).map(kartochkaVDz);
  }
  const getter = SBORSHCHIKI[no];
  if (getter === undefined) throw new SborkaError(`Раздел №${no} пока нельзя выдать в ДЗ.`);
  const r = await getter();
  if (p.ist === 'opornye') {
    const blok = kat.opornye.find((b) => b.slug === p.blok);
    if (blok === undefined) throw new SborkaError(`Нет блока «${p.blok}» в №${no}.`);
    return r.opornye(blok, p.zadachi ?? blok.zadachi.map((z) => z.id), zerno, komu);
  }
  if (p.ist === 'trenazher') return r.trenazher(kat, p.tipy, p.skolko, zerno, komu);
  return r.zadacha(kat, p.ref);
}

/** «Каждому свои» имеет смысл, только где задачи строятся заново (у опорных без зерна — нет). */
export function kazhdomuMozhno(p: PunktSostava): boolean {
  if (p.ist === 'opornye') return OPORNYE_IZ_ZERNA.has(p.no);
  return p.ist === 'trenazher';
}

function pravilo(p: PunktSostava, zerno: string): Record<string, unknown> {
  switch (p.ist) {
    case 'kartochki':
      return { podtema: p.podtema, kartochki: p.kartochki };
    case 'opornye':
      return { blok: p.blok, zadachi: p.zadachi, zerno };
    case 'trenazher':
      return { tipy: p.tipy, skolko: p.skolko, ...(p.gruppa === undefined ? {} : { gruppa: p.gruppa }), zerno };
    case 'zadacha':
      return { zadacha: p.ref, tip: p.tip };
  }
}

/** Состав → пункты для issue_homework_parts. */
export async function sobratPunkty(
  sostav: Sostav,
  katalogi: Katalogi,
  students: readonly string[],
  zernoVydachi: string = randomSeed(),
): Promise<HwPartInput[]> {
  const parts: HwPartInput[] = [];
  for (const [i, p] of sostav.punkty.entries()) {
    const kat = katalogOf(katalogi, p.no);
    const zerno = `${zernoVydachi}:${i + 1}`;
    const kazhdomu = kazhdomuMozhno(p) && 'kazhdomu' in p && p.kazhdomu;
    const komu: (string | null)[] = kazhdomu ? [...students] : [null];
    const units = await edinitsy(kat, p, zerno, komu);
    if (units.length === 0) throw new SborkaError(`Пункт ${i + 1}: не собралось ни одной задачи.`);
    parts.push({
      source: p.ist === 'zadacha' ? 'trenazher' : p.ist,
      taskNo: p.no,
      ref:
        p.ist === 'kartochki'
          ? `${p.no}:${p.podtema}`
          : p.ist === 'opornye'
            ? `${p.no}:${p.blok}`
            : p.ist === 'trenazher'
              ? `${p.no}:${p.tipy.join(',')}×${p.skolko}`
              : `${p.no}:${p.ref}`,
      titleHtml: titlePunkta(kat, p),
      rule: pravilo(p, zerno),
      perStudent: kazhdomu,
      comment: null,
      units,
    });
  }
  return parts;
}
