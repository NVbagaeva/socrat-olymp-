/**
 * Банк заданий №4 и №5: прототипы по блокам задачника.
 *
 * Список блоков и список прототипов здесь один на всё приложение:
 * и тренажёр, и витрина, и автотест берут их отсюда. Новый прототип
 * добавляется только в свой файл блока — ни страницу, ни автотест
 * трогать не нужно.
 */

import { KLASSICHESKOE } from './bank4/klassicheskoe';
import { STATISTICHESKOE } from './bank4/statisticheskoe';
import { BLOKI_4, type Blok } from './blocks';
import { PODGOTOVKA_4 } from './podgotovka4';
import { round, type Params, type PrepZadacha, type Prototype } from './types';

export { BLOKI_4, type Blok } from './blocks';

/** Банк задания №4: два блока задачника, 21 прототип. */
export const BANK_4: readonly Prototype[] = [...KLASSICHESKOE, ...STATISTICHESKOE];

export function prototypeById(id: string): Prototype | undefined {
  return BANK_4.find((p) => p.id === id);
}

export function blokById(id: string): Blok | undefined {
  return BLOKI_4.find((b) => b.id === id);
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

/** Все подготовительные задачи задания №4 подряд, в порядке блоков. */
export function prepZadachi4(): readonly PrepZadacha[] {
  return PODGOTOVKA_4.flatMap((blok) => [...blok.zadachi]);
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
