/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №2.
 *
 * Своя задача на числах, которые задаёт вариант (не случайных): тот же
 * язык условия и те же шаги разбора, что у прототипов раздела
 * (prototypes/common.ts), поэтому лист учителя (`shagiHtml2`) и разбор
 * собираются как у задач банка. В банк и генератор №2 не входят.
 */

import { rngOf } from '../vychisleniya/rng';
import { risunokChist } from './generate';
import { OKNO_DVA, OKNO_TRI, razmestit } from './razmeshchenie';
import { d, kombinatsiya, mnozhitel, slagaemoe, vec } from './tex';
import {
  dany,
  izobrazheny,
  naydiDlinu,
  shagDlina,
  shagKombinatsiya,
  shagOtvet,
  shagPoRisunku,
  shagSkalyarnoe,
  signatureOf,
} from './prototypes/common';
import type { Generated, Okno, Risunok, Tochka } from './types';

/** k·a и m·b заданы координатами a и b: скалярное произведение k·a на m·b. */
export interface SkalyarnoeKombinatsiy {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Множители при векторах: целый и десятичный (0,5; 1,5 …). */
  k: number;
  m: number;
}

const umn = (k: number, p: Tochka): Tochka => [
  Math.round(k * p[0] * 1e9) / 1e9,
  Math.round(k * p[1] * 1e9) / 1e9,
];

export function skalyarnoeKombinatsiy(p: SkalyarnoeKombinatsiy): Generated {
  const a: Tochka = [p.ax, p.ay];
  const b: Tochka = [p.bx, p.by];
  const u = umn(p.k, a);
  const v = umn(p.m, b);
  const otvet = u[0] * v[0] + u[1] * v[1];
  const ka = kombinatsiya([[p.k, 'a']]);
  const mb = kombinatsiya([[p.m, 'b']]);
  return {
    uslovie: `${dany([
      ['a', a],
      ['b', b],
    ])} Найдите скалярное произведение векторов $${ka}$ и $${mb}$.`,
    risunok: null,
    otvet,
    /* Второй счёт: множители выносятся за скобку, (k·m)·(a·b). */
    proverka: p.k * p.m * (p.ax * p.bx + p.ay * p.by),
    shagi: [
      shagKombinatsiya([[p.k, 'a', a]], u, 'u'),
      shagKombinatsiya([[p.m, 'b', b]], v, 'v'),
      {
        ...shagSkalyarnoe(['u', u], ['v', v]),
        zagolovok: `Скалярное произведение $${vec('u')}\\cdot${vec('v')}$ по координатам`,
      },
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `${signatureOf([a, b])}|${d(p.k)}|${d(p.m)}`,
    prototype: 'P2-KM',
    seed: 'fixed',
  };
}

/** Длина a + k·b по рисунку: координаты задаёт вариант, начала подбираются. */
export interface DlinaKombinatsii {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Множитель при b: целый или 0,5. */
  k: number;
}

/** Окна по возрастанию: первое, куда векторы ложатся с чистым рисунком. */
const OKNA: readonly Okno[] = [
  OKNO_DVA,
  OKNO_TRI,
  { xmin: -1, xmax: 14, ymin: -2, ymax: 13 },
  { xmin: -1, xmax: 17, ymin: -2, ymax: 15 },
];

/**
 * Как A6 раздела (длина по рисунку: два вектора), но множитель может
 * быть дробным и у вектора b. Подвох: сначала координаты по клеткам,
 * потом комбинация, длина — по формуле, а не «на глаз».
 */
export function dlinaKombinatsiiPoRisunku(p: DlinaKombinatsii): Generated {
  const a: Tochka = [p.ax, p.ay];
  const b: Tochka = [p.bx, p.by];
  const kb = umn(p.k, b);
  const R: Tochka = [a[0] + kb[0], a[1] + kb[1]];
  const len = Math.sqrt(R[0] * R[0] + R[1] * R[1]);
  if (!Number.isInteger(Math.round(len * 1e9) / 1e9))
    throw new Error(`№2: длина не целая ${JSON.stringify(p)}`);
  const kod = `pv2d|${p.ax}|${p.ay}|${p.bx}|${p.by}|${p.k}`;
  let risunok: Risunok | null = null;
  for (const okno of OKNA) {
    for (let i = 0; i < 30 && risunok === null; i += 1) {
      const vectors = razmestit(rngOf(`${kod}|${i}`), [a, b], okno);
      if (vectors === null) continue;
      const r: Risunok = { vectors, window: okno, alt: 'Векторы a, b на координатной плоскости' };
      if (risunokChist(r)) risunok = r;
    }
    if (risunok !== null) break;
  }
  if (risunok === null) throw new Error(`№2: рисунок не сложился ${JSON.stringify(p)}`);
  const terms = [
    [1, 'a', a],
    [p.k, 'b', b],
  ] as const;
  const otvet = Math.round(len);
  return {
    uslovie: `${izobrazheny(['a', 'b'])} ${naydiDlinu(
      kombinatsiya([
        [1, 'a'],
        [p.k, 'b'],
      ]),
    )}`,
    risunok,
    otvet,
    /* Второй счёт: |a|² + 2k·(a·b) + k²|b|² без координат суммы. */
    proverka: Math.sqrt(
      p.ax ** 2 +
        p.ay ** 2 +
        2 * p.k * (p.ax * p.bx + p.ay * p.by) +
        p.k ** 2 * (p.bx ** 2 + p.by ** 2),
    ),
    shagi: [
      shagPoRisunku(risunok.vectors),
      shagKombinatsiya(terms, R, 'c'),
      shagDlina('c', R, otvet),
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `${signatureOf([a, b])}|${d(p.k)}`,
    prototype: 'P2-DLINA-KB',
    seed: 'fixed',
  };
}

/** Перпендикулярные векторы, одна координата неизвестна. */
export interface PerpendikulyarNeizvestnaya {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  /** Какая координата неизвестна; её значение в данных — ответ. */
  neizv: 'ax' | 'ay' | 'bx' | 'by';
}

/**
 * Векторы перпендикулярны ⇔ скалярное произведение равно нулю:
 * линейное уравнение на неизвестную координату, ответ — десятичная дробь.
 * Подвох: условие «перпендикулярны» нужно перевести в «a·b = 0».
 */
export function perpendikulyarNeizvestnaya(p: PerpendikulyarNeizvestnaya): Generated {
  const bukva = p.neizv.endsWith('x') ? 'x' : 'y';
  const kv = (v: 'a' | 'b'): string => {
    const x = p.neizv === `${v}x` ? bukva : d(p[`${v}x`]);
    const y = p.neizv === `${v}y` ? bukva : d(p[`${v}y`]);
    return `${vec(v)}(${x};\\ ${y})`;
  };
  /* Слагаемое с неизвестной: k·t, где k — парная координата. */
  const para: Record<PerpendikulyarNeizvestnaya['neizv'], 'ax' | 'ay' | 'bx' | 'by'> = {
    ax: 'bx',
    ay: 'by',
    bx: 'ax',
    by: 'ay',
  };
  const k = p[para[p.neizv]];
  const svobodnoe = p.neizv.endsWith('x') ? p.ay * p.by : p.ax * p.bx;
  if (k === 0) throw new Error(`№2: при неизвестной нулевой множитель ${JSON.stringify(p)}`);
  const otvet = Math.round((-svobodnoe / k) * 1e9) / 1e9;
  if (Math.abs(otvet - p[p.neizv]) > 1e-9)
    throw new Error(`№2: ${p.neizv} = ${p[p.neizv]}, а из уравнения ${otvet}`);
  const known = p.neizv.endsWith('x') ? (['ay', 'by'] as const) : (['ax', 'bx'] as const);
  const chlenK = k === 1 ? bukva : k === -1 ? `-${bukva}` : `${d(k)}${bukva}`;
  const pervyy = p.neizv.endsWith('x');
  const proizv = `${mnozhitel(p[known[0]])}\\cdot${mnozhitel(p[known[1]])}`;
  const uravnenie = pervyy
    ? `${chlenK}${svobodnoe < 0 ? '' : '+'}${d(svobodnoe)}=0`
    : `${d(svobodnoe)}${k < 0 ? '' : '+'}${chlenK}=0`;
  return {
    uslovie: `Даны векторы $${kv('a')}$ и $${kv('b')}$. Найдите $${bukva}$, если векторы $${vec('a')}$ и $${vec('b')}$ перпендикулярны.`,
    risunok: null,
    otvet,
    /* Второй счёт: угол между векторами при найденной координате — 90°. */
    proverka: (() => {
      const q = { ...p };
      const t = (Math.atan2(q.by, q.bx) - Math.atan2(q.ay, q.ax)) % Math.PI;
      return Math.abs(Math.abs(t) - Math.PI / 2) < 1e-9 ? p[p.neizv] : NaN;
    })(),
    shagi: [
      {
        zagolovok: 'Условие перпендикулярности',
        stroki: [
          `Векторы перпендикулярны тогда и только тогда, когда их скалярное произведение равно нулю: $${vec('a')}\\cdot${vec('b')} = x_1x_2 + y_1y_2 = 0$.`,
        ],
      },
      {
        zagolovok: 'Уравнение',
        stroki: [
          pervyy
            ? `$${mnozhitel(p[para[p.neizv]])}\\cdot ${bukva} + ${proizv} = 0$, то есть $${uravnenie}$.`
            : `$${proizv} + ${mnozhitel(p[para[p.neizv]])}\\cdot ${bukva} = 0$, то есть $${uravnenie}$.`,
          `$${bukva} = ${slagaemoe(-svobodnoe, true)}:${mnozhitel(k)} = ${d(otvet)}$.`,
        ],
      },
      shagOtvet(otvet),
    ],
    params: { ...p },
    signature: `pv2p|${p.ax}|${p.ay}|${p.bx}|${p.by}|${p.neizv}`,
    prototype: 'P2-PERP',
    seed: 'fixed',
  };
}
