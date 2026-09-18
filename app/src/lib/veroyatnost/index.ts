/**
 * Банк заданий №4 и №5: прототипы по блокам задачника.
 *
 * Список блоков и список прототипов здесь один на всё приложение:
 * и тренажёр, и витрина, и автотест берут их отсюда. Новый прототип
 * добавляется только в свой файл блока — ни страницу, ни автотест
 * трогать не нужно.
 */

import { KLASSICHESKOE } from './bank4/klassicheskoe';
import { KONSPEKT_4 } from './bank4/konspekt';
import { STATISTICHESKOE } from './bank4/statisticheskoe';
import { BANK_5 } from './bank5';
import { BLOKI_4, BLOKI_5, type Blok } from './blocks';
import { PODGOTOVKA_4 } from './podgotovka4';
import { PODGOTOVKA_5 } from './podgotovka5';
import { round, type Params, type PrepZadacha, type Prototype } from './types';

export { BLOKI_4, BLOKI_5, type Blok } from './blocks';
export { BANK_5 } from './bank5';

/** Банк задания №4: два блока задачника, 21 прототип. */
export const BANK_4: readonly Prototype[] = [...KLASSICHESKOE, ...STATISTICHESKOE];

/** Прототипы задач конспекта №4: вариант 1 — задача автора, дальше генератор. */
export { KONSPEKT_4 };

/** Прототипы обоих заданий подряд: по ним ищут и проверяют. */
export const VSE_PROTOTIPY: readonly Prototype[] = [...BANK_4, ...BANK_5];

export function prototypeById(id: string): Prototype | undefined {
  return VSE_PROTOTIPY.find((p) => p.id === id);
}

export function blokById(id: string): Blok | undefined {
  return [...BLOKI_4, ...BLOKI_5].find((b) => b.id === id);
}

/** Прототипы одного блока — в порядке банка. */
export function prototipyBloka(blok: string): readonly Prototype[] {
  return BANK_4.filter((p) => p.blok === blok);
}

/**
 * Ответ в том виде, в каком его пишет ученик: округлённый, если
 * условие просит округления, и точный, если не просит. Именно это
 * число закрывается отпечатком и с ним сравнивается введённое.
 */
export function otvetUchenika(prototype: Prototype, params: Params): number {
  const znakov = prototype.okruglenie(params);
  const tochno = prototype.otvet(params);
  const otvet = znakov === null ? tochno : round(tochno, znakov);
  /* Девять знаков после запятой. Иначе 1 − 0,32 даёт
     0,6799999999999999, и это «другое число», чем 0,68, — хотя для
     ученика и для отпечатка ответа это одно и то же. */
  return Math.round(otvet * 1e9) / 1e9;
}

/* ── Подготовительные задачи ─────────────────────────────────────── */

export { PODGOTOVKA_4 } from './podgotovka4';
export { PODGOTOVKA_5 } from './podgotovka5';

/** Все подготовительные задачи обоих заданий подряд, в порядке блоков. */
export function prepZadachi(): readonly PrepZadacha[] {
  return [...PODGOTOVKA_4, ...PODGOTOVKA_5].flatMap((blok) => [...blok.zadachi]);
}

/**
 * Ответ подготовительной задачи в том виде, в каком его пишет ученик.
 * Округление — только если его просит условие конспекта.
 */
export function prepOtvet(zadacha: PrepZadacha): number {
  const otvet =
    zadacha.okruglenie === undefined ? zadacha.otvet : round(zadacha.otvet, zadacha.okruglenie);
  return Math.round(otvet * 1e9) / 1e9;
}
