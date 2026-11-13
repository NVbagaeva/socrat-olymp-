'use client';

/**
 * Задачи тренажёра №2 в браузере для общего тренажёра по банку
 * (lib/trening/zagruzka.ts задаёт тот же интерфейс). Файлов с задачами
 * у №2 нет: генератор, движок рисунков и KaTeX приезжают одним куском
 * при первой задаче, задача строится по ключу «прототип|seed». Ответ
 * сразу закрывается отпечатком; разбор (шаги и рисунок с катетами)
 * берётся из той же сгенерированной задачи, когда ученик открывает
 * подсказку или решение.
 */

import type { Zagruzka } from '@/lib/trening/zagruzka';
import type { Generated, Risunok } from '../types';
import { prototipKlyucha2 } from './session';

/** Задача №2 на экране: условие и рисунок без катетов, отпечаток ответа. */
export interface Zadacha2 {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
  text: string;
  /** Рисунок условия без катетов; null — задача по координатам или словами. */
  risunokSvg: string | null;
  seal: string;
}

/** Разбор задачи: шаги генератора и рисунок с катетами. */
export interface Reshenie2 {
  shagi: Generated['shagi'];
  risunokSvg: string | null;
}

interface Moduli {
  generate: (prototip: string, seed: string) => Generated;
  render: (risunok: Risunok) => string;
  seal: (otvet: number) => string;
  typeset: (text: string) => string;
}

let moduli: Moduli | null = null;
let zhdyot: Promise<void> | null = null;
const zadachi = new Map<string, { z: Zadacha2; task: Generated }>();
const resheniya = new Map<string, Reshenie2>();

function zagruzitModuli(): Promise<void> {
  zhdyot ??= Promise.all([
    import('../generate'),
    import('../render'),
    import('../secret'),
    import('@/lib/tex'),
  ]).then(([g, r, s, tex]) => {
    moduli = {
      generate: g.generate,
      render: r.renderVectorPlane,
      seal: s.sealAnswer,
      typeset: tex.typeset,
    };
  });
  zhdyot.catch(() => {
    zhdyot = null;
  });
  return zhdyot;
}

function postroit(id: string): { z: Zadacha2; task: Generated } | undefined {
  const gotovaya = zadachi.get(id);
  if (gotovaya !== undefined || moduli === null) {
    return gotovaya;
  }
  const prototip = prototipKlyucha2(id);
  const seed = id.slice(prototip.length + 1);
  try {
    const task = moduli.generate(prototip, seed);
    const z: Zadacha2 = {
      id,
      prototypeId: prototip,
      params: { seed },
      text: task.uslovie,
      risunokSvg: task.risunok === null ? null : moduli.render(task.risunok),
      seal: moduli.seal(task.otvet),
    };
    zadachi.set(id, { z, task });
    return zadachi.get(id);
  } catch {
    /* Генератор не собрал задачу по этому ключу (сайт обновился). */
    return undefined;
  }
}

export const ZAGRUZKA2: Zagruzka<Zadacha2, Reshenie2, null> = {
  zagruzit: () => zagruzitModuli(),
  izKesha: (id) => postroit(id)?.z,
  reshenie(z) {
    const gotovoe = resheniya.get(z.id);
    if (gotovoe !== undefined) {
      return gotovoe;
    }
    const zapis = postroit(z.id);
    if (zapis === undefined || moduli === null) {
      return null;
    }
    const r: Reshenie2 = {
      shagi: zapis.task.shagi,
      risunokSvg:
        zapis.task.risunok === null ? null : moduli.render({ ...zapis.task.risunok, hints: true }),
    };
    resheniya.set(z.id, r);
    return r;
  },
  nabrat: (text) => (moduli === null ? text : moduli.typeset(text)),
  prototip: () => null,
};
