/**
 * Тренажёр №3 на общей панели фильтров (docs/trenazher-filtry/):
 * конфиг фильтров и конечный список задач. Устройство — как у №1
 * (lib/planimetriya/trenazher/filtry1.ts).
 *
 * Темы — разделы I–VIII, чипы — прототипы. Задачи — варианты банка
 * (по десять на прототип): размеченные номером открытого банка ФИПИ —
 * «открытый банк», остальные — «не из банка». Сложность у №3 не
 * размечена: фильтра по звёздам нет. «Похожая задача» — другой
 * вариант того же прототипа.
 *
 * Модуль берёт разделы аргументом, а не импортом: страница считает
 * конфиг на сборке, а ключи задач (klyuch3, poKlyuchu3) нужны и
 * карточке в браузере — банк прототипов туда не попадает.
 */

import type { TrenazherConfig, ZadachaRef } from '../../trenazher/types';
import type { Razdel } from '../index';

/** Ключ задачи: прототип и номер варианта — как у отпечатка ответа (secret.ts). */
export function klyuch3(id: string, n: number): string {
  return `${id}#${n}`;
}

/** Прототип и вариант по ключу «P03-01#3». Чужой ключ — null. */
export function poKlyuchu3(key: string): { id: string; n: number } | null {
  const m = /^(P03-\d{2})#(\d+)$/.exec(key);
  return m === null ? null : { id: m[1] as string, n: Number(m[2]) };
}

/** Название без разметки формул — для строки-сводки и списка итогов. */
function bezFormul(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_, tex: string) =>
    tex
      .replace(/\\[a-z]+\s*/gi, '')
      .replace(/[{}_^]/g, '')
      .trim(),
  );
}

/** Короткое название раздела для сводки: «призма». */
function korotko(nazvanie: string): string {
  return nazvanie.charAt(0).toLowerCase() + nazvanie.slice(1);
}

/**
 * Конфиг фильтров. Названия прототипов с формулами набирает typeset
 * (KaTeX) — его передаёт страница, на сборке.
 */
export function trenazherConfig3(
  razdely: readonly Razdel[],
  typeset: (text: string) => string,
): TrenazherConfig {
  return {
    razdel: '3',
    /* Тот же раздел сессии, что у прежнего тренажёра: незавершённая
       тренировка переводится (Trenazher3.tsx). */
    scope: '3',
    temy: razdely.map((r) => ({
      id: r.slug,
      title: `${r.nomer}. ${r.nazvanie}`,
      short: korotko(r.nazvanie),
      podtipy: r.prototipy.map((p) => ({
        id: p.id,
        code: p.id.replace(/^P03-/, ''),
        title: bezFormul(p.nazvanie),
        ...(p.nazvanie.includes('$') ? { titleHtml: typeset(p.nazvanie) } : {}),
      })),
    })),
    urovni: [],
    istochnik: true,
  };
}

/** Задачи тренажёра: все варианты банка. fipi — номера варианта в открытом банке. */
export function zadachi3(
  razdely: readonly Razdel[],
  fipi: (id: string, n: number) => readonly string[],
): ZadachaRef[] {
  return razdely.flatMap((r) =>
    r.prototipy.flatMap((p) =>
      p.varianty.map((v) => ({
        key: klyuch3(p.id, v.n),
        podtip: p.id,
        uroven: null,
        istochnik: fipi(p.id, v.n).length > 0 ? ('fipi' as const) : ('new' as const),
      })),
    ),
  );
}
