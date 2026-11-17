/**
 * Разминки устного счёта для страниц заданий с вычислениями: какие
 * приёмы тренировать перед заданием. Карточка — components/ustnyySchet/
 * Razminka.tsx.
 */

import { NASTROYKI_PO_UMOLCHANIYU } from './nabor';
import type { PriyomId } from './types';
import { trenirovkaHref } from './zapros';

export type RazminkaId = 'profil-8' | 'baza-4' | 'baza-14' | 'baza-15' | 'baza-16';

export const RAZMINKI: Record<RazminkaId, { ids: PriyomId[]; lead: string }> = {
  'profil-8': {
    ids: ['desyatichnye-umnozhenie', 'delenie-na-5-25', 'stepeni-kuby-korni', 'otricatelnye'],
    lead: 'Десятичные дроби, деление на 0,5 и 0,25, степени и знаки — на них чаще всего теряют баллы в вычислениях.',
  },
  'baza-4': {
    ids: ['otricatelnye', 'razlozhenie', 'desyatichnye-umnozhenie', 'procent-ot-chisla'],
    lead: 'Подставить числа в формулу и не ошибиться: умножение, отрицательные числа, проценты.',
  },
  'baza-14': {
    ids: ['doli-procenty', 'desyatichnye-umnozhenie', 'delenie-na-5-25'],
    lead: 'Доли, десятичные дроби и деление на 0,5, 0,25 и 0,2 — основа заданий с дробями.',
  },
  'baza-15': {
    ids: ['procent-ot-chisla', 'doli-procenty'],
    lead: 'Процент от числа по частям и перевод долей в проценты — без калькулятора.',
  },
  'baza-16': {
    ids: ['stepeni-kuby-korni', 'kvadraty-11-30', 'raznost-kvadratov', 'otricatelnye'],
    lead: 'Степени, квадраты, корни и знаки — быстро и без ошибок.',
  },
};

/** Разминка базы по номеру задания (slug «4», «14»…); нет — null. */
export function razminkaBazy(slug: string): RazminkaId | null {
  const id = `baza-${slug}` as RazminkaId;
  return id in RAZMINKI ? id : null;
}

/** Ссылка: серия из 10 примеров этих приёмов, сразу старт. */
export function razminkaHref(id: RazminkaId): string {
  return trenirovkaHref({
    nabor: { tip: 'priyomy', ids: RAZMINKI[id].ids },
    rezhim: { tip: 'seriya', n: 10 },
    nast: NASTROYKI_PO_UMOLCHANIYU,
    go: true,
  });
}
