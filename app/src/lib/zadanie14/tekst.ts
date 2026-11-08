/**
 * Тексты задачи №14 для экрана и листа: условие, ответы пунктов а и б,
 * разбор пункта б. Всё — строки с $…$ для Tex / typeset.
 */

import { otborKrug, otborNerav } from './otbor';
import type { Razminka14, Uravnenie14, Zadacha14 } from './tipy';
import { korniNaPromezhutke, otvetATex, otvetBTex, promezhutokSlovo, promezhutokTex } from './ugol';

export function uslovieA(z: Zadacha14): string {
  if (z.vid === 'razminka') {
    const vopros =
      z.vopros === 'min-pol'
        ? 'наименьший положительный корень'
        : 'наибольший отрицательный корень';
    return `Решите уравнение $${z.uravnenie}$. В ответе напишите ${vopros}.`;
  }
  return `${z.promezhutok ? 'а) ' : ''}Решите уравнение $${z.uravnenie}$.`;
}

export function uslovieB(z: Uravnenie14): string | null {
  if (z.promezhutok === undefined) return null;
  return `б) Найдите все корни этого уравнения, принадлежащие ${promezhutokSlovo(z.promezhutok)} $${promezhutokTex(z.promezhutok)}$.`;
}

/** Ответ пункта а: «$x=…;\ x=…,\ k\in\mathbb{Z}$». */
export function otvetA(z: Uravnenie14): string {
  if (z.zapisA !== undefined) {
    return `$${z.zapisA.map((t) => `x=${t}`).join(';\\ ')},\\ k\\in\\mathbb{Z}$`;
  }
  return `$${otvetATex(z.serii)}$`;
}

export function otvetB(z: Uravnenie14): string | null {
  if (z.promezhutok === undefined) return null;
  return `$${otvetBTex(korniNaPromezhutke(z.serii, z.promezhutok))}$`;
}

/** Разбор пункта б: по окружности или неравенством, как задано в задаче. */
export function razborB(z: Uravnenie14): string[] {
  if (z.promezhutok === undefined) return [];
  const tablichnye =
    z.serii.every((s) => s.nach.arc === undefined) &&
    z.promezhutok.ot.arc === undefined &&
    z.promezhutok.do.arc === undefined;
  return z.otbor === 'nerav' && tablichnye
    ? otborNerav(z.serii, z.promezhutok)
    : otborKrug(z.serii, z.promezhutok);
}

/** Число в ответе разминки: «−0,5», «4». */
export function chisloTex(x: number): string {
  const t = String(Math.round(x * 1e9) / 1e9).replace('.', '{,}');
  return t.startsWith('-') ? `-${t.slice(1)}` : t;
}

export function otvetRazminki(z: Razminka14): string {
  return `$${chisloTex(z.otvet)}$`;
}
