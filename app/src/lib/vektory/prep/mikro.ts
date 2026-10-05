/**
 * Генераторы микрозадач тренировок навыков задания №2.
 *
 * Пять блоков по шесть задач. Числа — те же кирпичи, что у
 * прототипов (prototypes/common, troyki, razmeshchenie): шаги
 * разбора говорят тем же языком, что подсказки тренажёра.
 */

import type { Rng } from '../../veroyatnost/generator';
import {
  shagDlina,
  shagKombinatsiya,
  shagSkalyarnoe,
  sluchaynyy,
  strokiKoordinat,
} from '../prototypes/common';
import { shagiKosinusa, vybratParu } from '../prototypes/kosinus';
import { OKNO_DVA, razmestit } from '../razmeshchenie';
import { kombinatsiya, kv, modul, skalyarnoe, vec, vecKv } from '../tex';
import { pifagorovy, skalyar, tselayaDlina } from '../troyki';
import type { Risunok, Tochka, Vektor } from '../types';
import type { Mikro, MikroGenerated, MikroVybor } from './types';

function mikro(
  id: string,
  nazvanie: string,
  formula: string,
  answerType: Mikro['answerType'],
  generate: Mikro['generate'],
): Mikro {
  return { id, nazvanie, formula, answerType, generate };
}

/** Четыре варианта: верный и три подвоха, перемешанные по seed. */
function vybory(
  r: Rng,
  verno: Tochka,
  podvokhi: Tochka[],
): { vybory: MikroVybor[]; otvet: string } | null {
  const all = [verno, ...podvokhi];
  const keys = all.map((p) => `${p[0]},${p[1]}`);
  if (new Set(keys).size !== 4) return null;
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = r.int(0, i);
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  const list = order.map((k, i) => ({
    number: String(i + 1),
    label: `$${kv(all[k]![0], all[k]![1])}$`,
  }));
  const otvet = String(order.indexOf(0) + 1);
  return { vybory: list, otvet };
}

function risunokOdnogo(v: Vektor): Risunok {
  return { vectors: [v], window: 'tight', alt: 'Вектор a на координатной плоскости' };
}

/* ── Блок 1: координаты вектора по рисунку ──────────────────── */

function koordinatyPoRisunku(r: Rng): MikroGenerated | null {
  const p = sluchaynyy(r, 6, { pryamoy: 1 / 10 });
  if (Math.abs(p[0]) === Math.abs(p[1])) return null;
  const placed = razmestit(r, [p], OKNO_DVA);
  if (placed === null) return null;
  const v = placed[0] as Vektor;
  const [dx, dy] = p;
  const got = vybory(
    r,
    [dx, dy],
    [
      [-dx, -dy],
      [dy, dx],
      [r.next() < 0.5 ? -dx : dx, r.next() < 0.5 ? dy : -dy],
    ],
  );
  if (got === null) return null;
  return {
    uslovie: `На рисунке изображён вектор $${vec('a')}$, координатами которого являются целые числа. Найдите его координаты.`,
    risunok: risunokOdnogo(v),
    otvet: got.otvet,
    razbor: strokiKoordinat(v),
    vybory: got.vybory,
  };
}

export const BLOK_KOORDINATY: Mikro[] = [1, 2, 3, 4, 5, 6].map((n) =>
  mikro(
    `P2-1-0${n}`,
    'Координаты вектора по рисунку',
    '\\vec{AB}\\,(x_2 - x_1;\\ y_2 - y_1)',
    'choice',
    koordinatyPoRisunku,
  ),
);

/* ── Блок 2: действия с векторами ───────────────────────────── */

const DEYSTVIYA: readonly (readonly [number, number])[] = [
  [1, 1],
  [1, -1],
  [2, 0],
  [2, 1],
  [1, -2],
  [3, -2],
];

function deystvie(k: number, m: number) {
  return (r: Rng): MikroGenerated | null => {
    const a = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    const b = m === 0 ? a : sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    const verno: Tochka = [k * a[0] + m * b[0], k * a[1] + m * b[1]];
    /* Подвохи по порядку правдоподобия; при k = ±m часть из них
       совпадает между собой или с верным — берутся первые три разных. */
    const kandidaty: Tochka[] =
      m === 0
        ? [
            [k * a[0], a[1]],
            [a[0] + k, a[1] + k],
            [-verno[0], -verno[1]],
            [k * a[1], k * a[0]],
            [k * a[0], -k * a[1]],
          ]
        : [
            [k * a[0] - m * b[0], k * a[1] - m * b[1]],
            [m * a[0] + k * b[0], m * a[1] + k * b[1]],
            [-verno[0], -verno[1]],
            [k * a[0] + m * b[0], k * a[1] - m * b[1]],
            [verno[1], verno[0]],
            [a[0] + b[0], a[1] + b[1]],
            [a[0] - b[0], a[1] - b[1]],
          ];
    const podvokhi: Tochka[] = [];
    for (const c of kandidaty) {
      const novyy = [verno, ...podvokhi].every((p) => p[0] !== c[0] || p[1] !== c[1]);
      if (novyy) podvokhi.push(c);
      if (podvokhi.length === 3) break;
    }
    if (podvokhi.length < 3) return null;
    const got = vybory(r, verno, podvokhi);
    if (got === null) return null;
    const terms =
      m === 0
        ? ([[k, 'a', a]] as const)
        : ([
            [k, 'a', a],
            [m, 'b', b],
          ] as const);
    const tex = kombinatsiya(
      m === 0
        ? [[k, 'a']]
        : [
            [k, 'a'],
            [m, 'b'],
          ],
    );
    const dany =
      m === 0
        ? `Дан вектор $${vecKv('a', a)}$.`
        : `Даны векторы $${vecKv('a', a)}$ и $${vecKv('b', b)}$.`;
    const shag = shagKombinatsiya(terms, verno, 'c');
    return {
      uslovie: `${dany} Найдите координаты вектора $${tex}$.`,
      risunok: null,
      otvet: got.otvet,
      razbor: shag.stroki,
      vybory: got.vybory,
    };
  };
}

export const BLOK_DEYSTVIYA: Mikro[] = DEYSTVIYA.map(([k, m], i) =>
  mikro(
    `P2-2-0${i + 1}`,
    'Действия с векторами',
    k === 2 && m === 0
      ? 'k\\vec{a} = (kx;\\ ky)'
      : '\\vec{a} \\pm \\vec{b} = (x_1 \\pm x_2;\\ y_1 \\pm y_2)',
    'choice',
    deystvie(k, m),
  ),
);

/* ── Блок 3: длина вектора ──────────────────────────────────── */

function dlinaPoKoordinatam(r: Rng): MikroGenerated | null {
  const a = r.pick(pifagorovy(20));
  const len = tselayaDlina(a) as number;
  return {
    uslovie: `Найдите длину вектора $${vecKv('a', a)}$.`,
    risunok: null,
    otvet: len,
    razbor: shagDlina('a', a, len).stroki,
  };
}

function dlinaPoRisunku(r: Rng): MikroGenerated | null {
  const p = r.pick(pifagorovy(6));
  const placed = razmestit(r, [p], OKNO_DVA);
  if (placed === null) return null;
  const v = placed[0] as Vektor;
  const len = tselayaDlina(p) as number;
  return {
    uslovie: `На рисунке изображён вектор $${vec('a')}$, координатами которого являются целые числа. Найдите его длину.`,
    risunok: risunokOdnogo(v),
    otvet: len,
    razbor: [...strokiKoordinat(v), ...shagDlina('a', p, len).stroki],
  };
}

export const BLOK_DLINA: Mikro[] = [1, 2, 3, 4, 5, 6].map((n) =>
  mikro(
    `P2-3-0${n}`,
    n <= 3 ? 'Длина по координатам' : 'Длина по рисунку',
    '|\\vec{a}| = \\sqrt{x^2 + y^2}',
    'number',
    n <= 3 ? dlinaPoKoordinatam : dlinaPoRisunku,
  ),
);

/* ── Блок 4: скалярное произведение по координатам ──────────── */

function skalyarnoePoKoordinatam(r: Rng): MikroGenerated | null {
  const a = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
  const b = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
  const otvet = skalyar(a, b);
  return {
    uslovie: `Даны векторы $${vecKv('a', a)}$ и $${vecKv('b', b)}$. Найдите скалярное произведение $${skalyarnoe(vec('a'), vec('b'))}$.`,
    risunok: null,
    otvet,
    razbor: shagSkalyarnoe(['a', a], ['b', b]).stroki,
  };
}

export const BLOK_SKALYARNOE: Mikro[] = [1, 2, 3, 4, 5, 6].map((n) =>
  mikro(
    `P2-4-0${n}`,
    'Скалярное произведение',
    '\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2',
    'number',
    skalyarnoePoKoordinatam,
  ),
);

/* ── Блок 5: косинус угла ───────────────────────────────────── */

function kosinusPoKoordinatam(r: Rng): MikroGenerated | null {
  const p = vybratParu(r, 12);
  if (p === null) return null;
  const shagi = shagiKosinusa(p, null);
  return {
    uslovie: `Даны векторы $${vecKv('a', p.a)}$ и $${vecKv('b', p.b)}$. Найдите косинус угла между ними.`,
    risunok: null,
    otvet: p.cos,
    razbor: shagi.slice(0, -1).flatMap((s) => s.stroki),
  };
}

export const BLOK_KOSINUS: Mikro[] = [1, 2, 3, 4, 5, 6].map((n) =>
  mikro(
    `P2-5-0${n}`,
    'Косинус угла',
    `\\cos\\alpha = \\dfrac{\\vec{a}\\cdot\\vec{b}}{${modul(vec('a'))}\\cdot${modul(vec('b'))}}`,
    'number',
    kosinusPoKoordinatam,
  ),
);
