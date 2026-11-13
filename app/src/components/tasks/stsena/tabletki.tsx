/**
 * Таблетки шапки раздела: «Часть 1», «1 балл», «≈ 3 минуты».
 *
 * Цифры берутся из тех же `fakty`, что показывает вкладка «О задании»
 * (content/<раздел>/…, поля `znachenie` и `podpis`). Один источник на
 * оба места: если балл или время поменяются, они поменяются разом и
 * нигде не разъедутся. Чего в данных нет, того и в шапке нет —
 * таблетка просто не рисуется.
 */

import { ChasyIkonka, ZvezdaIkonka, type Tabletka } from './StsenaShapka';

/** Факт раздела со вкладки «О задании». */
export interface Fakt {
  znachenie: string;
  podpis: string;
}

/** По этим подписям узнаём балл и время среди фактов раздела. */
const PODPIS_BALL = 'первичный балл';
const PODPIS_MINUTY = 'минуты на экзамене';

function najti(fakty: readonly Fakt[], podpis: string): string | undefined {
  return fakty.find((f) => f.podpis === podpis)?.znachenie;
}

/** Выбор из трёх форм по числу: 1 балл, 2 балла, 5 баллов. */
function forma(znachenie: string, odin: string, dva: string, pyat: string): string {
  const n = Number(znachenie.replace(/[^\d]/g, ''));
  if (!Number.isFinite(n)) return dva;
  const sto = n % 100;
  if (sto >= 11 && sto <= 14) return pyat;
  const des = n % 10;
  if (des === 1) return odin;
  if (des >= 2 && des <= 4) return dva;
  return pyat;
}

export interface TabletkiRazdelaOpts {
  /** Первая таблетка: «Часть 1». Не задана — таблетки нет. */
  chast?: string;
  /** Факты раздела со вкладки «О задании». Нет — остаётся одна часть. */
  fakty?: readonly Fakt[];
}

/**
 * Таблетки для шапки раздела в порядке макета: часть, балл, время.
 * Пустой список — шапка рисуется без строки таблеток.
 */
export function tabletkiRazdela({ chast, fakty = [] }: TabletkiRazdelaOpts): readonly Tabletka[] {
  const out: Tabletka[] = [];
  if (chast !== undefined && chast !== '') {
    out.push({ text: chast });
  }
  const ball = najti(fakty, PODPIS_BALL);
  if (ball !== undefined) {
    out.push({
      text: `${ball} ${forma(ball, 'балл', 'балла', 'баллов')}`,
      ikonka: <ZvezdaIkonka />,
      ton: 'warm',
    });
  }
  const minuty = najti(fakty, PODPIS_MINUTY);
  if (minuty !== undefined) {
    out.push({
      text: `${minuty} ${forma(minuty, 'минута', 'минуты', 'минут')}`,
      ikonka: <ChasyIkonka />,
    });
  }
  return out;
}
