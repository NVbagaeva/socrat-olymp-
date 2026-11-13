/**
 * Продавец: реквизиты для подвала и оферты. ФИО — то же, что у оператора
 * персональных данных (operator.json), статус, ИНН, почта и дата
 * редакции оферты — prodavets.json.
 *
 * Флаг NEXT_PUBLIC_LEGAL_READY («1») публикует оферту и реквизиты. Без
 * него подвал прежний, страницы /oferta/ на сайте нет (она собирается
 * только в next dev и в превью с OFERTA_PREVIEW=1, next.config.ts).
 * С флагом и незаполненными реквизитами сборка падает.
 */

import raw from '@/content/legal/prodavets.json';
import { operator } from './operator';
import { prodavetsProblems } from './prodavetsProblems.mjs';

export const LEGAL_READY = process.env.NEXT_PUBLIC_LEGAL_READY === '1';

export const OFERTA_HREF = '/oferta/';

export const prodavets = {
  fio: operator.fio,
  status: raw.status.trim(),
  statusPolnostyu: raw.statusPolnostyu.trim(),
  inn: raw.inn.trim(),
  pochta: raw.pochta.trim(),
  /** Личный Telegram для вопросов, без @. */
  telegram: raw.telegram.trim(),
  /** Ручная оплата: за сколько часов открывается доступ (строка-число). */
  srokOtkrytiyaChasov: raw.srokOtkrytiyaChasov.trim(),
  /** Дата редакции оферты: ДД.ММ.ГГГГ. */
  dataOferty: raw.dataOferty.trim(),
};

/** Ссылка на личный Telegram. */
export const TELEGRAM_LICHNYY = `https://t.me/${prodavets.telegram}`;

/** «24 часов», «1 часа» — срок открытия доступа для «в течение …». */
export function srokOtkrytiyaTekst(): string {
  const n = Number(prodavets.srokOtkrytiyaChasov);
  if (!Number.isInteger(n) || n < 1) return '[ЧАСОВ] часов';
  return `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'часа' : 'часов'}`;
}

/** Реквизиты заполнены — нет квадратных скобок вместо ИНН и почты. */
export const prodavetsFilled = prodavetsProblems(prodavets).length === 0;

/** Показывать реквизиты и ссылку на оферту: флаг включён и всё заполнено. */
export const rekvizityVidny = LEGAL_READY && prodavetsFilled;

/** Строка реквизитов в подвале — по частям, чтобы на телефоне шли столбиком. */
export const strokaRekvizitov: string[] = [
  prodavets.fio,
  prodavets.status,
  `ИНН ${prodavets.inn}`,
  prodavets.pochta,
];
