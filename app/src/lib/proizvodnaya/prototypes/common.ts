/**
 * Общие кирпичи прототипов задания №9: описание прототипа, вопросы
 * подсказки с кнопками, перемешивание, проверка рисунка.
 */

import type { Rng } from '../../veroyatnost/generator';
import { paramsKey } from '../../vychisleniya/prototypes/common';
import { problemy, reshit } from '../reshit';
import { risunokChist } from '../render';
import type {
  Draft,
  Figura,
  Gruppa,
  Istochnik,
  Params,
  Prototype,
  Shag,
  Variant,
  Vopros,
  Zapros,
} from '../types';

export { paramsKey };

/** Все наши прототипы — «не из открытого банка». Открытый банк добавляется вручную. */
export const NE_IZ_BANKA: Istochnik = 'ne-iz-otkrytogo-banka';

export interface OpisanieProto {
  id: string;
  gruppa: Gruppa;
  nazvanie: string;
  kratko: string;
  risunok: boolean;
  zaglushka?: boolean;
  generate(r: Rng): Draft | null;
}

export function proto(o: OpisanieProto): Prototype {
  return { ...o, istochnik: NE_IZ_BANKA };
}

/** Перемешивание на источнике генератора: задача по seed воспроизводится. */
export function peremeshat<T>(r: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export interface Nevernyy {
  tekst: string;
  pochemu: string;
}

/** Вопрос подсказки: верный вариант и неверные с объяснением. Порядок — по seed. */
export function vopros(
  r: Rng,
  text: string,
  verno: string,
  neverno: readonly Nevernyy[],
  itog?: string,
  shagNomer?: number,
): Vopros {
  const seen = new Set<string>([verno]);
  const varianty: Variant[] = [{ tekst: verno, verno: true }];
  for (const n of neverno) {
    if (!seen.has(n.tekst)) {
      seen.add(n.tekst);
      varianty.push({ tekst: n.tekst, verno: false, pochemu: n.pochemu });
    }
  }
  const out: Vopros = { vopros: text, varianty: peremeshat(r, varianty) };
  if (itog !== undefined) {
    out.itog = itog;
  }
  if (shagNomer !== undefined) {
    out.shag = shagNomer;
  }
  return out;
}

/**
 * Собрать задачу с рисунком: проверить читаемость, пересчитать ответ
 * независимо и вернуть null, если что-то не сошлось. Ответ `otvet`
 * приходит из задуманной структуры рисунка, пересчёт — из данных.
 */
export function sobrat(
  fig: Figura,
  zapros: Zapros,
  otvet: number,
  rest: Omit<Draft, 'risunok' | 'zapros' | 'otvet' | 'proverka'>,
): Draft | null {
  if (problemy(fig, zapros).length > 0) {
    return null;
  }
  if (risunokChist(fig).length > 0) {
    return null;
  }
  const proverka = reshit(fig, zapros);
  if (proverka === null || Math.abs(proverka - otvet) > 1e-6) {
    return null;
  }
  return { risunok: fig, zapros, otvet, proverka, ...rest };
}

/** Шаг разбора. */
export function shag(zagolovok: string, ...stroki: string[]): Shag {
  return { zagolovok, stroki };
}

/** Ключ параметров из набора. */
export function kluch(params: Params): string {
  return paramsKey(params);
}

/** Подпись узлов кривой: по ней банк отличает один рисунок от другого. */
export function podpisUzlov(fig: Figura): string {
  return fig.uzly.map((u) => `${u.x}:${u.y}`).join(',') + '|' + (fig.metki ?? []).join(',');
}
