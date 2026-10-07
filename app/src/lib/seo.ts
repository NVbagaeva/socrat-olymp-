/**
 * Общие строки для поисковиков: адрес сайта, бренд и заголовки
 * страниц заданий.
 *
 * Бренд «Будет на ЕГЭ» и домен budetege.ru должны читаться одинаково
 * везде — в <title>, в Open Graph, в разметке Schema.org и в
 * канонических адресах. Поэтому они записаны здесь один раз.
 */

import type { Metadata } from 'next';

/** Канонический домен: https, без www, с «/» на конце. */
export const SITE_URL = 'https://budetege.ru';
export const SITE_NAME = 'Будет на ЕГЭ';
export const SITE_DOMAIN = 'budetege.ru';

/** Одна фраза о сайте — для описаний по умолчанию и Schema.org. */
export const SITE_DESCRIPTION =
  'Будет на ЕГЭ — онлайн-платформа для подготовки к ЕГЭ по профильной математике. Теория, задания, тренажёры, генератор задач и система подготовки по темам экзамена.';

/** Первая буква строчная: «Векторы» → «векторы», «ЕГЭ» остаётся. */
function lower(name: string): string {
  const first = name.charAt(0);
  return first === first.toUpperCase() && first !== first.toLowerCase()
    ? first.toLowerCase() + name.slice(1)
    : name;
}

/** «12» из «12» или «012»: номер задания без ведущих нулей. */
function nomer(no: string | number): string {
  return String(Number(no));
}

/**
 * Заголовок страницы раздела задания:
 * «Задание 12 ЕГЭ по математике — графики функций | Будет на ЕГЭ».
 */
export function razdelTitle(no: string | number, name: string): string {
  return `Задание ${nomer(no)} ЕГЭ по математике — ${lower(name)} | ${SITE_NAME}`;
}

/**
 * Заголовок вкладки раздела:
 * «Теория · Задание 12 ЕГЭ — графики функций | Будет на ЕГЭ».
 */
export function vkladkaTitle(no: string | number, name: string, tab: string): string {
  return `${tab} · Задание ${nomer(no)} ЕГЭ — ${lower(name)} | ${SITE_NAME}`;
}

/**
 * Описание страницы раздела. Своя фраза раздела (lead) идёт первой,
 * общая строка о том, что это задание ЕГЭ, — за ней.
 */
export function razdelDescription(no: string | number, name: string, lead?: string): string {
  const base = `Задание ${nomer(no)} ЕГЭ по профильной математике — ${lower(name)}: теория, опорные задачи, тренажёр и генератор вариантов с новыми числами.`;
  return lead === undefined || lead === '' ? base : `${lead} ${base}`;
}

/** Описание вкладки раздела — чем именно занимается вкладка. */
export function vkladkaDescription(no: string | number, name: string, tab: string): string {
  return `${tab} — задание ${nomer(no)} ЕГЭ по профильной математике (${lower(name)}). Подготовка к ЕГЭ на платформе «Будет на ЕГЭ»: теория, опорные задачи, тренажёр, генератор.`;
}

/** Заголовок и описание страницы раздела одним объектом. */
export function razdelMeta(no: string | number, name: string, lead?: string): Metadata {
  return {
    title: razdelTitle(no, name),
    description: razdelDescription(no, name, lead),
  };
}

/** Заголовок и описание вкладки раздела одним объектом. */
export function vkladkaMeta(no: string | number, name: string, tab: string): Metadata {
  return {
    title: vkladkaTitle(no, name, tab),
    description: vkladkaDescription(no, name, tab),
  };
}

/**
 * Страница без содержимого для поиска: заглушка раздела, личный
 * кабинет, печатный лист. Робот по ссылкам идёт, страницу не хранит.
 */
export const NOINDEX: Metadata['robots'] = { index: false, follow: true };
