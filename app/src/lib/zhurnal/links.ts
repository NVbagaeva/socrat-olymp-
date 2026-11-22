/**
 * Адреса экранов прогресса (docs/kabinet-progress.md). Страницы
 * статические, данные — по ?id= в адресе, как у классов и ДЗ.
 */

import { href } from '@/lib/paths';

const KABINET = '/kabinet';

export const PROGRESS_TAIL = {
  klass: 'klass-progress',
  uchenik: 'uchenik',
  zadacha: 'zadacha',
  variant: 'variant',
  pechat: 'pechat',
  statistika: 'statistika',
} as const;

const q = (params: Record<string, string | null | undefined>): string => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') out.set(key, value);
  }
  const text = out.toString();
  return text === '' ? '' : `?${text}`;
};

/** Прогресс класса. */
export const klassProgressHref = (classId: string): string =>
  href(KABINET, PROGRESS_TAIL.klass, q({ id: classId }));

/** Прогресс ученика; klass — откуда пришли (для «назад»). */
export const uchenikHref = (studentId: string, classId?: string | null): string =>
  href(KABINET, PROGRESS_TAIL.uchenik, q({ id: studentId, klass: classId }));

export const zadachaUchenikaHref = (studentId: string, zadachaId: string, classId?: string | null): string =>
  href(KABINET, PROGRESS_TAIL.uchenik, PROGRESS_TAIL.zadacha, q({ id: zadachaId, uchenik: studentId, klass: classId }));

export const variantUchenikaHref = (studentId: string, variantId: string, classId?: string | null): string =>
  href(KABINET, PROGRESS_TAIL.uchenik, PROGRESS_TAIL.variant, q({ id: variantId, uchenik: studentId, klass: classId }));

export const pechatUchenikaHref = (studentId: string, from: string, to: string, classId?: string | null): string =>
  href(KABINET, PROGRESS_TAIL.uchenik, PROGRESS_TAIL.pechat, q({ id: studentId, s: from, po: to, klass: classId }));

export const statistikaHref = (): string => href(KABINET, PROGRESS_TAIL.statistika);
