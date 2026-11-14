/**
 * Банк задач раздела базы: прототипы → задачи с числами.
 *
 * Задачи детерминированы: зерно — «раздел:прототип:номер попытки»,
 * поэтому пересборка даёт тот же банк, а ключ задачи («P01-03») всегда
 * означает одну и ту же задачу. Повторы чисел отбрасываются. Файлы для
 * браузера (public/data/baza/N/) пишет scripts/build-bank-baza.mjs.
 */

import { rngOf } from '../vychisleniya/rng';
import { zapechatat } from './secret';
import type { Prototip, ZadachaBazy, ZadachaLite } from './types';

/** Ключ задачи банка базы: «P01-03». */
export const KLYUCH_BAZY = /^P\d\d-\d\d$/;

/** Задачи одного прототипа. Бросает, если разных задач меньше заявленного. */
export function zadachiPrototipa(slug: string, proto: Prototip): ZadachaBazy[] {
  const out: ZadachaBazy[] = [];
  const vidennye = new Set<string>();
  for (let i = 0; out.length < proto.zadach; i += 1) {
    if (i > proto.zadach * 60) {
      throw new Error(`База №${slug}, ${proto.id}: разных задач меньше ${proto.zadach}`);
    }
    const params = proto.generate(rngOf(`baza:${slug}:${proto.id}:${i}`));
    const text = proto.text(params);
    /* Одинаковое условие — та же задача, даже если параметры записаны иначе. */
    if (vidennye.has(text)) continue;
    vidennye.add(text);
    const r = proto.solve(params);
    out.push({
      id: `${proto.id}-${String(out.length + 1).padStart(2, '0')}`,
      prototypeId: proto.id,
      params,
      text,
      otvet: r.otvet,
      ...(r.dopustimye === undefined ? {} : { dopustimye: r.dopustimye }),
      tip: proto.tip,
    });
  }
  return out;
}

export function bankRazdela(slug: string, prototipy: readonly Prototip[]): ZadachaBazy[] {
  return prototipy.flatMap((proto) => zadachiPrototipa(slug, proto));
}

export function lite(z: ZadachaBazy): ZadachaLite {
  return {
    id: z.id,
    prototypeId: z.prototypeId,
    params: z.params,
    text: z.text,
    seal: zapechatat({
      tip: z.tip,
      otvet: z.otvet,
      ...(z.dopustimye === undefined ? {} : { dopustimye: z.dopustimye }),
    }),
  };
}

/** Файлы данных раздела для браузера: имя файла (без .json) → содержимое. */
export function dannyeDlyaBrauzera(bank: readonly ZadachaBazy[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of [...new Set(bank.map((z) => z.prototypeId))].sort()) {
    out[p] = JSON.stringify(bank.filter((z) => z.prototypeId === p).map(lite)) + '\n';
  }
  return out;
}
