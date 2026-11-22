'use client';

/**
 * Задачи тренажёра №12 в браузере для общего тренажёра по банку
 * (lib/trening/zagruzka.ts задаёт интерфейс). Файлов с задачами у №12
 * нет: движок graph/ и KaTeX приезжают одним куском по «Начать», задача
 * строится по ключу шаблона («12Q.B-07») тем же кодом, что и в прежнем
 * тренажёре (lib/trainerSession.ts, zadachaShablona).
 *
 * Seed у шаблона постоянный — от набора: задача по ключу всегда одна и
 * та же, а все шаблоны набора берутся из одной сборки набора. Сборка
 * набора занимает десятки миллисекунд, поэтому наборы тренировки
 * собираются заранее, по одному, с передышкой между ними — экран не
 * замирает.
 */

import type { TrainerTask } from '@/lib/trainer';
import type { Zagruzka } from '@/lib/trening/zagruzka';
import { naborKlyucha, seedNabora12 } from './session';
import { seal12 } from './otvet12';
import { shagiIz12, type Shag12 } from './shagi12';

/** Задача №12 на экране тренажёра. */
export interface Zadacha12 {
  id: string;
  prototypeId: string;
  params: Record<string, never>;
  /** Условие — готовая разметка движка (формулы уже набраны). */
  text: string;
  seal: string;
  task: TrainerTask;
}

/** Разбор: задача движка (подсказка по шагам) и шаги решения. */
export interface Reshenie12 {
  task: TrainerTask;
  shagi: Shag12[];
}

type EngineCache = Map<string, unknown>;

interface Moduli {
  zadachaShablona: (
    key: string,
    seedFor: (attempt: number) => string,
    cache: EngineCache,
  ) => TrainerTask | null;
  typeset: (text: string) => string;
}

let moduli: Moduli | null = null;
let zhdyot: Promise<void> | null = null;
const cache: EngineCache = new Map();
const zadachi = new Map<string, Zadacha12 | null>();
const resheniya = new Map<string, Reshenie12>();
/** Наборы, собранные заранее: дальше задачи из них берутся сразу. */
const sobrany = new Set<string>();
/** Шаблоны по наборам: по первому из них собирается весь набор. */
const shablony = new Map<string, string>();

/** Каталог тренажёра: по какому шаблону собирать набор заранее. */
export function zapomnitKatalog12(katalog: Record<string, { f: string[]; a: string[] }>): void {
  for (const [nabor, { f, a }] of Object.entries(katalog)) {
    const pervyy = f[0] ?? a[0];
    if (pervyy !== undefined) shablony.set(nabor, pervyy);
  }
}

function zagruzitModuli(): Promise<void> {
  zhdyot ??= Promise.all([import('@/lib/trainerSession'), import('@/lib/tex')]).then(([s, tex]) => {
    moduli = {
      zadachaShablona: s.zadachaShablona as Moduli['zadachaShablona'],
      typeset: tex.typeset,
    };
  });
  zhdyot.catch(() => {
    zhdyot = null;
  });
  return zhdyot;
}

function postroit(id: string): Zadacha12 | null {
  const gotovaya = zadachi.get(id);
  if (gotovaya !== undefined || moduli === null) {
    return gotovaya ?? null;
  }
  const nabor = naborKlyucha(id);
  let task: TrainerTask | null = null;
  try {
    task = moduli.zadachaShablona(id, seedNabora12(nabor), cache);
  } catch {
    task = null;
  }
  const z: Zadacha12 | null =
    task === null
      ? null
      : {
          id,
          prototypeId: nabor,
          params: {},
          text: task.questionHtml,
          seal: seal12(task.answer, task.options !== null),
          task,
        };
  zadachi.set(id, z);
  sobrany.add(nabor);
  return z;
}

/** Передышка между сборками наборов: экран успевает отрисоваться. */
function peredyshka(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export const ZAGRUZKA12: Zagruzka<Zadacha12, Reshenie12, null> = {
  async zagruzit(prototipy) {
    await zagruzitModuli();
    for (const nabor of new Set(prototipy)) {
      const shablon = shablony.get(nabor);
      if (sobrany.has(nabor)) continue;
      if (shablon === undefined) {
        /* Набора нет в каталоге страницы: задачи соберутся по запросу. */
        sobrany.add(nabor);
        continue;
      }
      postroit(shablon);
      await peredyshka();
    }
  },
  izKesha(id) {
    if (moduli === null) return undefined;
    /* Набор ещё не собран — ждём zagruzit, чтобы не замирать на сборке. */
    if (!sobrany.has(naborKlyucha(id)) && !zadachi.has(id)) return undefined;
    return postroit(id) ?? undefined;
  },
  reshenie(z) {
    const gotovoe = resheniya.get(z.id);
    if (gotovoe !== undefined) return gotovoe;
    if (moduli === null) return null;
    const r: Reshenie12 = {
      task: z.task,
      shagi: shagiIz12(z.task.solution, z.task.rightHint, moduli.typeset),
    };
    resheniya.set(z.id, r);
    return r;
  },
  /* Условие движка уже набрано: формулы в нём — готовая разметка KaTeX. */
  nabrat: (text) => text,
  prototip: () => null,
};
