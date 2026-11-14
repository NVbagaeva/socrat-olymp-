/**
 * Общее у сборщиков разделов: зерно, перемешивание по зерну, запись
 * ответа ЕГЭ, карточки из каталога.
 */

import { otpechatok } from '@/lib/kartochki/otvet';
import { normalizeEge } from '@/lib/otvet/proverkaDz';
import { rngOf } from '@/lib/vychisleniya/rng';
import type { KartochkaKat, PodtemaKat } from '../katalog/types';
import type { HwUnitInput, RazborDz } from '../types';

/** Ответ-число → нормальная запись ЕГЭ (без хвостов двоичной арифметики). */
export function chisloEge(x: number): string {
  const norm = normalizeEge(String(Math.round(x * 1e9) / 1e9));
  if (norm === null) throw new Error(`ответ ${x} не в записи ЕГЭ`);
  return norm;
}

/** Перемешать по зерну: один и тот же набор при том же зерне. */
export function peremeshat<T>(items: readonly T[], zerno: string): T[] {
  const r = rngOf(zerno);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/**
 * Разложить «сколько» по типам по кругу: 5 задач на типы A, B → A, B,
 * A, B, A. Порядок типов — как выбрал репетитор.
 */
export function poKrugu(tipy: readonly string[], skolko: number): string[] {
  return Array.from({ length: skolko }, (_, i) => tipy[i % tipy.length] as string);
}

/** Карточка каталога → единица пункта. */
export function kartochkaVDz(k: KartochkaKat): HwUnitInput {
  const obshchee = {
    tip: k.type,
    level: k.level,
    figury: k.figury,
    ...(k.figuryOborota === undefined ? {} : { figuryOborota: k.figuryOborota }),
    figuraNaLitse: k.figuraNaLitse,
    ...(k.teoriya === undefined ? {} : { teoriya: k.teoriya }),
  };
  if (k.type === 'verno' || k.type === 'vychislenie') {
    if (k.klyuch === undefined || k.oborot === undefined) {
      throw new Error(`карточка ${k.id}: нет ключа`);
    }
    const oborot = JSON.parse(otpechatok.openText(k.oborot, k.id)) as {
      back: string;
      pochemu?: string;
    };
    const razbor: RazborDz = { shagi: [], delimost: [], oborot };
    return {
      studentId: null,
      kind: k.id,
      ref: k.id,
      answerKind: k.type === 'verno' ? 'verno' : 'number',
      questionHtml: k.front,
      view: { kartochka: obshchee },
      answer: otpechatok.openText(k.klyuch, k.id),
      razbor,
      source: 'карточка',
    };
  }
  return {
    studentId: null,
    kind: k.id,
    ref: k.id,
    answerKind: 'self',
    questionHtml: k.front,
    view: {
      kartochka: {
        ...obshchee,
        back: k.back,
        ...(k.pochemu === undefined ? {} : { pochemu: k.pochemu }),
      },
    },
    answer: null,
    razbor: null,
    source: 'карточка',
  };
}

/** Набор карточек: вся подтема или выбранные (в порядке колоды). */
export function kartochkiNabora(p: PodtemaKat, ids: readonly string[] | null): KartochkaKat[] {
  return ids === null ? p.kartochki : p.kartochki.filter((k) => ids.includes(k.id));
}
