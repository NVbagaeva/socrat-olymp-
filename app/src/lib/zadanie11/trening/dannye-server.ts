/**
 * Сборка файлов public/data/zadanie11/ (серверная часть trening/dannye.ts):
 * задачи открытого банка, разминки и аналогов с теми же ключами, что у
 * прежнего тренажёра; ответ заменяется отпечатком. Условие — как
 * показывал прежний тренажёр: у аналога — текст пула, у остальных —
 * функция подтипа по параметрам.
 */

import { subtype } from '../prototypes';
import { sealAnswer, sealChoice } from '../secret';
import { dannyeTrenazhera } from '../trenazher/dannye';
import { klyuchZadachi, type UslovieBanka, type ZadachaPlan } from '../trenazher/sessiya';
import type { ZadachaLite11 } from './dannye';

function plan(b: UslovieBanka): ZadachaPlan {
  return {
    vid: b.analog !== undefined ? 'analog' : b.razminka ? 'razminka' : 'bank',
    no: b.no,
    id: b.id,
  };
}

export function lite11(b: UslovieBanka): ZadachaLite11 {
  const s = subtype(b.id).solve(b.params);
  const z: ZadachaLite11 = {
    id: klyuchZadachi(plan(b)),
    prototypeId: b.id,
    source: b.analog !== undefined ? 'analog' : b.razminka ? 'razminka' : 'fipi',
    text: b.analog?.tekst ?? s.uslovie,
    params: b.params,
    seal: s.vybor === undefined ? sealAnswer(s.answer) : sealChoice(String(s.vybor.correct + 1)),
  };
  if (s.vybor !== undefined) {
    z.vybory = s.vybor.options;
  }
  if (s.lifehacks.length > 0) {
    z.lh = s.lifehacks;
  }
  return z;
}

/** Все задачи тренажёра в порядке банка: открытый банк, разминка, аналоги. */
export function zadachi11(): ZadachaLite11[] {
  return dannyeTrenazhera().bank.map(lite11);
}

/** Содержимое файлов: имя без .json (подтип) → текст. */
export function dannyeDlyaBrauzera11(): Record<string, string> {
  const vse = zadachi11();
  const out: Record<string, string> = {};
  for (const p of [...new Set(vse.map((z) => z.prototypeId))].sort()) {
    out[p] = JSON.stringify(vse.filter((z) => z.prototypeId === p)) + '\n';
  }
  return out;
}

/**
 * Каталог для тренажёра: подтип → ключи. «Исходные» (`f`) — задачи
 * открытого банка и разминки, `a` — аналоги из пула.
 */
export function katalog11(): Record<string, { f: string[]; a: string[] }> {
  const out: Record<string, { f: string[]; a: string[] }> = {};
  for (const b of dannyeTrenazhera().bank) {
    const row = (out[b.id] ??= { f: [], a: [] });
    (b.analog === undefined ? row.f : row.a).push(klyuchZadachi(plan(b)));
  }
  return out;
}
