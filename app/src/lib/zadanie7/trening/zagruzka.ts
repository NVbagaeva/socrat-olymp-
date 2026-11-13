'use client';

/**
 * Данные задач тренажёра №7 в браузере: файл прототипа качается один
 * раз за визит (сбой сети в кеше не застревает), решатель прототипов
 * и KaTeX приезжают вместе с первым файлом. Ответов в файлах нет —
 * только отпечаток; разбор и подсказки-вопросы строит решатель по
 * параметрам задачи.
 */

import { urlDannyh, type ZadachaLite } from '../dannye';
import type { Solved } from '../types';

const FAYLY = new Map<string, Promise<void>>();
const ZADACHI = new Map<string, ZadachaLite>();
const RESHENIYA = new Map<string, Solved>();

let nabor: ((text: string) => string) | null = null;
let reshatel: ((id: string) => { solve(params: ZadachaLite['params']): Solved }) | null = null;
let obshcheeZhdyot: Promise<void> | null = null;

/** KaTeX и решатель прототипов: один раз на визит. */
function zagruzitObshchee(): Promise<void> {
  obshcheeZhdyot ??= Promise.all([import('@/lib/tex'), import('../prototypes')]).then(
    ([tex, prototypes]) => {
      nabor = tex.typeset;
      reshatel = prototypes.prototype;
    },
  );
  obshcheeZhdyot.catch(() => {
    obshcheeZhdyot = null;
  });
  return obshcheeZhdyot;
}

/** Набрать текст с формулами $…$; пока KaTeX не приехал — как есть. */
export function nabrat7(text: string): string {
  return nabor === null ? text : nabor(text);
}

function zagruzitPrototip(p: string): Promise<void> {
  let zhdyot = FAYLY.get(p);
  if (zhdyot === undefined) {
    zhdyot = fetch(urlDannyh(p)).then(async (r) => {
      if (!r.ok) throw new Error(`${p}.json: ${r.status}`);
      for (const z of (await r.json()) as ZadachaLite[]) {
        ZADACHI.set(z.id, z);
      }
    });
    FAYLY.set(p, zhdyot);
    zhdyot.catch(() => {
      FAYLY.delete(p);
    });
  }
  return zhdyot;
}

/** Загрузить файлы прототипов (и KaTeX с решателем): после этого кеш отдаёт задачи сразу. */
export async function zagruzitPrototipy7(prototipy: readonly string[]): Promise<void> {
  await Promise.all([zagruzitObshchee(), ...[...new Set(prototipy)].map(zagruzitPrototip)]);
}

/** Задача из уже загруженных; undefined — её файл ещё не приехал или такой задачи нет. */
export function zadachaIzKesha7(id: string): ZadachaLite | undefined {
  return reshatel === null ? undefined : ZADACHI.get(id);
}

/** Разбор задачи решателем прототипа: считается один раз на задачу. */
export function reshenieZadachi7(z: ZadachaLite): Solved | null {
  const gotovo = RESHENIYA.get(z.id);
  if (gotovo !== undefined) {
    return gotovo;
  }
  if (reshatel === null) {
    return null;
  }
  try {
    const s = reshatel(z.prototypeId).solve(z.params);
    RESHENIYA.set(z.id, s);
    return s;
  } catch {
    return null;
  }
}
