/**
 * Заголовки страниц разделов для поиска и вкладки браузера.
 *
 * Люди ищут «задание 10 ЕГЭ профиль текстовые задачи», поэтому номер
 * ЕГЭ и «ЕГЭ профиль» стоят в начале (docs/audit-prodazhi.md, H2).
 * Номер — номер задания на экзамене, не номер хранения из адреса
 * (content/struktura.js). Вкладка «О задании» — главная страница
 * раздела: её название в заголовок не пишется.
 */

import { nomerRazdela } from '@/content/struktura';

const GLAVNAYA_VKLADKA = 'О задании';

/** «Задание 10 ЕГЭ профиль: Текстовые задачи. Теория — Будет на ЕГЭ». */
export function zagolovokRazdela(nomerHraneniya: number, nazvanie: string, vkladka: string) {
  const nachalo = `Задание ${nomerRazdela(nomerHraneniya)} ЕГЭ профиль: ${nazvanie}`;
  const chast = vkladka === '' || vkladka === GLAVNAYA_VKLADKA ? '' : `. ${vkladka}`;
  return `${nachalo}${chast} — Будет на ЕГЭ`;
}
