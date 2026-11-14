'use client';

/**
 * Задачи тренажёра в браузере для общего тренажёра по банку
 * (lib/trening/zagruzka.ts задаёт интерфейс). Файлов с задачами нет:
 * прототипы и KaTeX приезжают одним куском при первой задаче, задача
 * строится по ключу «прототип|зерно» (lib/zadanie21/zadacha.ts). Ответ
 * сразу закрывается отпечатком.
 */

import type { Zagruzka } from '@/lib/trening/zagruzka';
import type { Etap, HintStep } from '../types';
import { prototipKlyucha, type Zadacha21Polnaya } from '../zadacha';

export interface Zadacha21 {
  id: string;
  prototypeId: string;
  params: Record<string, unknown>;
  text: string;
  seal: string;
}

export interface Reshenie21 {
  etapy: Etap[];
  hints: HintStep[];
  answer: number;
}

interface Moduli {
  zadacha: (id: string) => Zadacha21Polnaya;
  seal: (otvet: number) => string;
  typeset: (text: string) => string;
}

let moduli: Moduli | null = null;
let zhdyot: Promise<void> | null = null;
const kesh = new Map<string, { z: Zadacha21; polnaya: Zadacha21Polnaya }>();

function zagruzitModuli(): Promise<void> {
  zhdyot ??= Promise.all([import('../zadacha'), import('../secret'), import('@/lib/tex')]).then(
    ([z, s, tex]) => {
      moduli = { zadacha: z.zadachaPoKlyuchu, seal: s.sealAnswer, typeset: tex.typeset };
    },
  );
  zhdyot.catch(() => {
    zhdyot = null;
  });
  return zhdyot;
}

function postroit(id: string) {
  const gotovaya = kesh.get(id);
  if (gotovaya !== undefined || moduli === null) return gotovaya;
  try {
    const polnaya = moduli.zadacha(id);
    const z: Zadacha21 = {
      id,
      prototypeId: prototipKlyucha(id),
      params: polnaya.params,
      text: polnaya.uslovie,
      seal: moduli.seal(polnaya.solved.answer),
    };
    kesh.set(id, { z, polnaya });
    return kesh.get(id);
  } catch {
    /* Прототипа с таким ключом нет (сайт обновился). */
    return undefined;
  }
}

export const ZAGRUZKA21: Zagruzka<Zadacha21, Reshenie21, null> = {
  zagruzit: () => zagruzitModuli(),
  izKesha: (id) => postroit(id)?.z,
  reshenie(z) {
    const zapis = postroit(z.id);
    if (zapis === undefined) return null;
    const { etapy, hints, answer } = zapis.polnaya.solved;
    return { etapy, hints, answer };
  },
  nabrat: (text) => (moduli === null ? text : moduli.typeset(text)),
  prototip: () => null,
};
