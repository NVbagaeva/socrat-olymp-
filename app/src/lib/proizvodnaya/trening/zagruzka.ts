'use client';

/**
 * Задачи тренажёра №9 в браузере для общего тренажёра по банку
 * (lib/trening/zagruzka.ts задаёт тот же интерфейс). Файлов с задачами
 * у №9 нет: генератор, движок рисунков и KaTeX приезжают одним куском
 * при первой задаче, задача строится по ключу «прототип|seed» — как у
 * прежнего тренажёра. Ответ сразу закрывается отпечатком; разбор и
 * подсказка-лесенка берутся из той же сгенерированной задачи.
 */

import type { Zagruzka } from '@/lib/trening/zagruzka';
import type { OpciiRisunka } from '../render';
import type { Figura, Generated, Shag, Vopros } from '../types';
import { prototipKlyucha9 } from './session';

/** Задача №9 на экране: условие, рисунок условия, отпечаток ответа. */
export interface Zadacha9 {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
  text: string;
  /** Рисунок (данные для движка); null — задача без рисунка. */
  risunok: Figura | null;
  /** С какого шага рисунок показывает построения — по вопросам подсказки. */
  shagiRisunka: number[];
  seal: string;
}

/** Разбор задачи: шаги генератора и лесенка вопросов подсказки. */
export interface Reshenie9 {
  shagi: Shag[];
  podskazka: Vopros[];
  risunok: Figura | null;
}

interface Moduli {
  generate: (prototip: string, seed: string) => Generated;
  render: (figura: Figura, opts: OpciiRisunka) => string;
  seal: (otvet: number) => string;
  typeset: (text: string) => string;
}

let moduli: Moduli | null = null;
let zhdyot: Promise<void> | null = null;
const zadachi = new Map<string, { z: Zadacha9; task: Generated }>();

function zagruzitModuli(): Promise<void> {
  zhdyot ??= Promise.all([
    import('../generate'),
    import('../render'),
    import('../secret'),
    import('@/lib/tex'),
  ]).then(([g, r, s, tex]) => {
    moduli = {
      generate: g.generate,
      render: r.renderFigura,
      seal: s.sealAnswer,
      typeset: tex.typeset,
    };
  });
  zhdyot.catch(() => {
    zhdyot = null;
  });
  return zhdyot;
}

function postroit(id: string): { z: Zadacha9; task: Generated } | undefined {
  const gotovaya = zadachi.get(id);
  if (gotovaya !== undefined || moduli === null) {
    return gotovaya;
  }
  const prototip = prototipKlyucha9(id);
  const seed = id.slice(prototip.length + 1);
  try {
    const task = moduli.generate(prototip, seed);
    const z: Zadacha9 = {
      id,
      prototypeId: prototip,
      params: { seed },
      text: task.uslovie,
      risunok: task.risunok,
      /* Как у прежнего экрана: шаг вопроса, нет — его номер с единицы. */
      shagiRisunka: task.podskazka.map((v, i) => v.shag ?? i + 1),
      seal: moduli.seal(task.otvet),
    };
    zadachi.set(id, { z, task });
    return zadachi.get(id);
  } catch {
    /* Генератор не собрал задачу по этому ключу (сайт обновился). */
    return undefined;
  }
}

/** Рисунок движка: SVG строкой; движок ещё не приехал — пусто. */
export function risovat9(figura: Figura, opts: OpciiRisunka): string {
  return moduli === null ? '' : moduli.render(figura, opts);
}

export const ZAGRUZKA9: Zagruzka<Zadacha9, Reshenie9, null> = {
  zagruzit: () => zagruzitModuli(),
  izKesha: (id) => postroit(id)?.z,
  reshenie(z) {
    const zapis = postroit(z.id);
    return zapis === undefined
      ? null
      : { shagi: zapis.task.shagi, podskazka: zapis.task.podskazka, risunok: zapis.task.risunok };
  },
  nabrat: (text) => (moduli === null ? text : moduli.typeset(text)),
  prototip: () => null,
};
