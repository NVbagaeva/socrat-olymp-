/**
 * Генераторы микрозадач тренировок навыков задания №2.
 *
 * Пять блоков по десять задач. Числа — те же кирпичи, что у
 * прототипов (prototypes/common, troyki, razmeshchenie): шаги
 * разбора говорят тем же языком, что подсказки тренажёра.
 *
 * Десять задач блока не одинаковы: у каждой свой «профиль» — знаки
 * координат (все четыре четверти и векторы вдоль осей), действие,
 * знак скалярного произведения или косинуса. Так блок проводит
 * ученика по всем случаям, а не по десяти похожим.
 */

import type { Rng } from '../../veroyatnost/generator';
import {
  shagDlina,
  shagKombinatsiya,
  shagSkalyarnoe,
  sluchaynyy,
  strokiKoordinat,
} from '../prototypes/common';
import { pary, shagiKosinusa } from '../prototypes/kosinus';
import { OKNO_DVA, OKNO_TRI, razmestit } from '../razmeshchenie';
import { kombinatsiya, kv, modul, skalyarnoe, vec, vecKv } from '../tex';
import { kosoy, pifagorovy, skalyar, tselayaDlina } from '../troyki';
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

/** Номер задачи в идентификаторе: P2-1-01 … P2-1-10. */
function nomer(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Знаки координат: +1, −1 или 0 (вектор вдоль оси). Профиль задачи
 * блока — какой вектор нужен; генератор берёт случайный и отбрасывает
 * неподходящий, generateMikro повторяет попытку.
 */
type Znak = 1 | -1 | 0;
type Profil = readonly [Znak, Znak];

function podkhodit(p: Tochka, [sx, sy]: Profil): boolean {
  return Math.sign(p[0]) === sx && Math.sign(p[1]) === sy;
}

/** Все четыре четверти по два раза и два вектора вдоль осей. */
const PROFILI_10: readonly Profil[] = [
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 0],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [0, -1],
  [1, 1],
];

/** Вектор с заданными знаками координат: модули 1…bound, не 45°. */
function vektorProfilya(r: Rng, bound: number, profil: Profil, minLen = 2): Tochka {
  const [sx, sy] = profil;
  for (;;) {
    const x = sx * r.int(sx === 0 ? 0 : 1, sx === 0 ? 0 : bound);
    const y = sy * r.int(sy === 0 ? 0 : 1, sy === 0 ? 0 : bound);
    if (Math.hypot(x, y) >= minLen && (sx === 0 || sy === 0 || Math.abs(x) !== Math.abs(y))) {
      return [x, y];
    }
  }
}

/** Первые три различных подвоха, не совпадающих с верным ответом. */
function triPodvokha(verno: Tochka, kandidaty: readonly Tochka[]): Tochka[] | null {
  const out: Tochka[] = [];
  for (const c of kandidaty) {
    if ([verno, ...out].every((p) => p[0] !== c[0] || p[1] !== c[1])) out.push(c);
    if (out.length === 3) return out;
  }
  return null;
}

function risunokOdnogo(v: Vektor): Risunok {
  return { vectors: [v], window: 'tight', alt: 'Вектор a на координатной плоскости' };
}

/* ── Блок 1: координаты вектора по рисунку ──────────────────── */

function koordinatyPoRisunku(profil: Profil) {
  return (r: Rng): MikroGenerated | null => {
    const p = vektorProfilya(r, 6, profil);
    const placed = razmestit(r, [p], OKNO_DVA);
    if (placed === null) return null;
    const v = placed[0] as Vektor;
    const [dx, dy] = p;
    /* Подвохи: начало минус конец, перепутаны x и y, потерян знак. */
    const podvokhi = triPodvokha(p, [
      [-dx, -dy],
      [dy, dx],
      r.next() < 0.5 ? [-dx, dy] : [dx, -dy],
      [dx, -dy],
      [-dx, dy],
      [-dy, -dx],
    ]);
    if (podvokhi === null) return null;
    const got = vybory(r, p, podvokhi);
    if (got === null) return null;
    return {
      uslovie: `На рисунке изображён вектор $${vec('a')}$, координатами которого являются целые числа. Найдите его координаты.`,
      risunok: risunokOdnogo(v),
      otvet: got.otvet,
      razbor: strokiKoordinat(v),
      vybory: got.vybory,
    };
  };
}

export const BLOK_KOORDINATY: Mikro[] = PROFILI_10.map((profil, i) =>
  mikro(
    `P2-1-${nomer(i + 1)}`,
    'Координаты вектора по рисунку',
    '\\overrightarrow{AB}\\,(x_2 - x_1;\\ y_2 - y_1)',
    'choice',
    koordinatyPoRisunku(profil),
  ),
);

/* ── Блок 2: действия с векторами ───────────────────────────── */

/** Коэффициенты k·a + m·b: сумма, разность, умножение на число и их сочетания. */
const DEYSTVIYA: readonly (readonly [number, number])[] = [
  [1, 1],
  [1, -1],
  [2, 0],
  [-1, 0],
  [2, 1],
  [1, -2],
  [3, 0],
  [-1, 1],
  [3, -2],
  [-2, 3],
];

function deystvie(k: number, m: number) {
  return (r: Rng): MikroGenerated | null => {
    const a = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    const b = m === 0 ? a : sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    const verno: Tochka = [k * a[0] + m * b[0], k * a[1] + m * b[1]];
    if (Math.abs(verno[0]) > 30 || Math.abs(verno[1]) > 30) return null;
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
    const podvokhi = triPodvokha(verno, kandidaty);
    if (podvokhi === null) return null;
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
    `P2-2-${nomer(i + 1)}`,
    'Действия с векторами',
    m === 0 ? 'k\\vec{a} = (kx;\\ ky)' : '\\vec{a} \\pm \\vec{b} = (x_1 \\pm x_2;\\ y_1 \\pm y_2)',
    'choice',
    deystvie(k, m),
  ),
);

/* ── Блок 3: длина вектора ──────────────────────────────────── */

/** Пифагоров вектор с заданными знаками координат и длиной. */
function pifagorovProfilya(r: Rng, bound: number, profil: Profil, dlina: number): Tochka | null {
  const fit = pifagorovy(bound).filter((p) => podkhodit(p, profil) && tselayaDlina(p) === dlina);
  return fit.length === 0 ? null : r.pick(fit);
}

function dlinaPoKoordinatam(profil: Profil, dlina: number) {
  return (r: Rng): MikroGenerated | null => {
    const a = pifagorovProfilya(r, 24, profil, dlina);
    if (a === null) return null;
    return {
      uslovie: `Найдите длину вектора $${vecKv('a', a)}$.`,
      risunok: null,
      otvet: dlina,
      razbor: shagDlina('a', a, dlina).stroki,
    };
  };
}

function dlinaPoRisunku(profil: Profil, dlina: number) {
  return (r: Rng): MikroGenerated | null => {
    const p = pifagorovProfilya(r, 10, profil, dlina);
    if (p === null) return null;
    /* Вектор длиной 10 (катеты 6 и 8) в малое поле не входит. */
    const placed = razmestit(r, [p], dlina > 5 ? OKNO_TRI : OKNO_DVA);
    if (placed === null) return null;
    const v = placed[0] as Vektor;
    return {
      uslovie: `На рисунке изображён вектор $${vec('a')}$, координатами которого являются целые числа. Найдите его длину.`,
      risunok: risunokOdnogo(v),
      otvet: dlina,
      razbor: [...strokiKoordinat(v), ...shagDlina('a', p, dlina).stroki],
    };
  };
}

/**
 * Пять по координатам и пять по рисунку — в каждой половине все
 * четверти и разные длины (тройки 3–4–5, 5–12–13, 8–15–17, 7–24–25
 * и кратные), чтобы ответ не угадывался по соседним задачам.
 */
const DLINA: readonly (readonly ['koordinaty' | 'risunok', Profil, number])[] = [
  ['koordinaty', [1, 1], 13],
  ['koordinaty', [-1, 1], 25],
  ['koordinaty', [1, -1], 17],
  ['koordinaty', [-1, -1], 15],
  ['koordinaty', [1, -1], 26],
  ['risunok', [1, 1], 5],
  ['risunok', [-1, -1], 10],
  ['risunok', [-1, 1], 5],
  ['risunok', [1, -1], 10],
  ['risunok', [-1, 1], 10],
];

export const BLOK_DLINA: Mikro[] = DLINA.map(([vid, profil, dlina], i) =>
  mikro(
    `P2-3-${nomer(i + 1)}`,
    vid === 'koordinaty' ? 'Длина по координатам' : 'Длина по рисунку',
    `${modul(vec('a'))} = \\sqrt{x^2 + y^2}`,
    'number',
    vid === 'koordinaty' ? dlinaPoKoordinatam(profil, dlina) : dlinaPoRisunku(profil, dlina),
  ),
);

/* ── Блок 4: скалярное произведение по координатам ──────────── */

type ZnakOtveta = 'plus' | 'minus' | 'nol';

function nod(x: number, y: number): number {
  return y === 0 ? Math.abs(x) : nod(y, x % y);
}

function skalyarnoePoKoordinatam(znak: ZnakOtveta) {
  return (r: Rng): MikroGenerated | null => {
    const a = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    let b: Tochka;
    if (znak === 'nol') {
      /* Перпендикулярный вектор: (−y; x), сокращённый и умноженный. */
      const g = nod(a[0], a[1]) || 1;
      const t = r.pick([-3, -2, -1, 1, 2, 3]);
      b = [(-a[1] / g) * t, (a[0] / g) * t];
      if (Math.abs(b[0]) > 9 || Math.abs(b[1]) > 9 || !kosoy(b)) return null;
    } else {
      b = sluchaynyy(r, 9, { pryamoy: 1 / 6 });
    }
    const otvet = skalyar(a, b);
    if (znak === 'plus' && otvet <= 0) return null;
    if (znak === 'minus' && otvet >= 0) return null;
    return {
      uslovie: `Даны векторы $${vecKv('a', a)}$ и $${vecKv('b', b)}$. Найдите скалярное произведение $${skalyarnoe(vec('a'), vec('b'))}$.`,
      risunok: null,
      otvet,
      razbor: shagSkalyarnoe(['a', a], ['b', b]).stroki,
    };
  };
}

/** Четыре положительных, четыре отрицательных и два нулевых — перпендикулярные. */
const SKALYARNOE: readonly ZnakOtveta[] = [
  'plus',
  'minus',
  'plus',
  'nol',
  'minus',
  'plus',
  'minus',
  'plus',
  'nol',
  'minus',
];

export const BLOK_SKALYARNOE: Mikro[] = SKALYARNOE.map((znak, i) =>
  mikro(
    `P2-4-${nomer(i + 1)}`,
    'Скалярное произведение',
    '\\vec{a}\\cdot\\vec{b} = x_1x_2 + y_1y_2',
    'number',
    skalyarnoePoKoordinatam(znak),
  ),
);

/* ── Блок 5: косинус угла ───────────────────────────────────── */

function kosinusPoKoordinatam(otritsatelnyy: boolean) {
  return (r: Rng): MikroGenerated | null => {
    const fit = pary(12).filter((p) => p.cos < 0 === otritsatelnyy);
    if (fit.length === 0) return null;
    const p = r.pick(fit);
    const shagi = shagiKosinusa(p, null);
    return {
      uslovie: `Даны векторы $${vecKv('a', p.a)}$ и $${vecKv('b', p.b)}$. Найдите косинус угла между ними.`,
      risunok: null,
      otvet: p.cos,
      razbor: shagi.slice(0, -1).flatMap((s) => s.stroki),
    };
  };
}

/** Шесть острых углов (косинус больше нуля) и четыре тупых. */
const KOSINUS: readonly boolean[] = [
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
];

export const BLOK_KOSINUS: Mikro[] = KOSINUS.map((otritsatelnyy, i) =>
  mikro(
    `P2-5-${nomer(i + 1)}`,
    'Косинус угла',
    `\\cos\\alpha = \\dfrac{\\vec{a}\\cdot\\vec{b}}{${modul(vec('a'))}\\cdot${modul(vec('b'))}}`,
    'number',
    kosinusPoKoordinatam(otritsatelnyy),
  ),
);
