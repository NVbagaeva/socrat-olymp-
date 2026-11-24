/**
 * «Картинки к задачам» на листе генератора №11 (по ЕГЭ-2027 — №10).
 *
 * Переключатель живёт в общем генераторе (GenConfig.extras.flagi, id
 * FLAG_KARTINKI_11) и уходит в адрес листа параметром ki=1. Движок
 * №11 (generator11.ts, sheet11.ts — содержание раздела, его сторожит
 * scripts/check-redesign.mjs) не меняется: картинки добавляются к уже
 * собранному листу — здесь, по ключу позиции (ListZadacha.pos =
 * GenTask.pos), и в предпросмотре генератора, и на печати.
 *
 * Картинка ставится только на цветном листе отработки: в формате
 * варианта ЕГЭ (rezhim 'komplekt') и на ч/б листе картинок нет.
 */

import { kartinkaListaHtml } from '../kartinkiZadach';
import type { GenSheet, GenState } from '../generator/obshchiy/types';
import { flagVklyuchen } from '../generator/obshchiy/state';
import { kartinka11, klyuchAnaloga11 } from './kartinki';
import type { SheetParams11, SobrannyyList, Pozitsiya } from './sheet11';
import type { UslovieBanka } from './trenazher/sessiya';

/** id переключателя в GenConfig.extras.flagi. */
export const FLAG_KARTINKI_11 = 'kartinki';

/** Параметр адреса листа: ki=1 — картинки включены. */
export const PARAM_KARTINKI = 'ki';

export function kartinkiVklyucheny(extras: GenState['extras']): boolean {
  return flagVklyuchen(extras, FLAG_KARTINKI_11);
}

/** Картинки уместны на этом листе: цветной лист отработки. */
export function kartinkiNaListe(p: SheetParams11): boolean {
  return p.rezhim === 'otrabotka' && p.theme === 'color';
}

/** HTML картинки к задаче позиции; '' — картинки нет. */
function kartinkaPozicii(poz: Pozitsiya, bank: readonly UslovieBanka[]): string {
  if (poz.vid === 'mikro' || poz.vid === 'razminka') return '';
  if (poz.vid === 'new') {
    const k = kartinka11(poz.id);
    return k === undefined ? '' : kartinkaListaHtml(k.src280, k.alt);
  }
  const b = bank.find((x) => x.no === poz.no);
  if (b?.analog !== undefined) {
    const ks = klyuchAnaloga11(b.analog.kod);
    const k = ks === undefined ? undefined : kartinka11(poz.id, undefined, ks);
    return k === undefined ? '' : kartinkaListaHtml(k.src280, k.alt);
  }
  const k = kartinka11(poz.id, b?.params);
  return k === undefined ? '' : kartinkaListaHtml(k.src280, k.alt);
}

/** Картинки по ключу позиции «вариант.ключ». */
export function kartinkiPozicij(
  list: SobrannyyList,
  bank: readonly UslovieBanka[],
): Map<string, string> {
  const out = new Map<string, string>();
  for (const z of list.poVariantam.flat()) {
    const html = kartinkaPozicii(z.poz, bank);
    if (html !== '') out.set(z.pos, html);
  }
  return out;
}

/** Собранный лист с картинками в начале условий. */
export function listSKartinkami(list: SobrannyyList, bank: readonly UslovieBanka[]): SobrannyyList {
  const k = kartinkiPozicij(list, bank);
  return {
    ...list,
    poVariantam: list.poVariantam.map((v) =>
      v.map((z) => {
        const html = k.get(z.pos);
        return html === undefined ? z : { ...z, questionHtml: html + z.questionHtml };
      }),
    ),
  };
}

/** Предпросмотр генератора с картинками в начале условий. */
export function sheetSKartinkami(sheet: GenSheet, k: Map<string, string>): GenSheet {
  return {
    ...sheet,
    variants: sheet.variants.map((v) =>
      v.map((t) => {
        const html = k.get(t.pos);
        return html === undefined ? t : { ...t, questionHtml: html + t.questionHtml };
      }),
    ),
  };
}

/** Адрес с ki=1 (или без него). */
export function sKartinkami(url: string, on: boolean): string {
  if (!on || url === '') return url;
  const [put, hash = ''] = url.split('#');
  const sep = (put ?? '').includes('?') ? '&' : '?';
  return `${put}${sep}${PARAM_KARTINKI}=1${hash === '' ? '' : `#${hash}`}`;
}
