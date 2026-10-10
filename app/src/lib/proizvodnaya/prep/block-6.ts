/** Блок P9-6 · Площадь и первообразная. */

import type { Rng } from '../../veroyatnost/generator';
import { shag } from '../prototypes/common';
import { reshit } from '../reshit';
import type { Figura, Pomoshch, Uzel } from '../types';
import { d, figLomanaya, micro, qChislo, razborIz, sk, vopros } from './pomoshniki';
import type { PrepGenerated, PrepMicro } from './types';

/** Половина произведения «умно»: делим чётный множитель. */
function polovina(p: number, q: number): [string, number] {
  if (p % 2 === 0) {
    return [`${p / 2}\\cdot ${q}`, (p / 2) * q];
  }
  if (q % 2 === 0) {
    return [`${p}\\cdot ${q / 2}`, p * (q / 2)];
  }
  return [`\\dfrac{${p}\\cdot ${q}}{2}`, (p * q) / 2];
}

interface Kusok {
  u: number;
  v: number;
  yu: number;
  yv: number;
}

function nazv(k: Kusok): string {
  return k.yu === k.yv ? 'прямоугольник' : k.yu === 0 || k.yv === 0 ? 'треугольник' : 'трапеция';
}

/** Площадь куска по модулю и запись её вычисления. */
function pl(k: Kusok): { val: number; tex: string } {
  const dx = k.v - k.u;
  const A = Math.abs(k.yu);
  const B = Math.abs(k.yv);
  if (k.yu === k.yv) {
    return { val: A * dx, tex: `${dx}\\cdot ${A}=${d(A * dx)}` };
  }
  if (k.yu === 0 || k.yv === 0) {
    const h = Math.max(A, B);
    const [mid, val] = polovina(dx, h);
    return { val, tex: `\\dfrac{1}{2}\\cdot ${dx}\\cdot ${h}=${mid}=${d(val)}` };
  }
  const [mid, val] = polovina(A + B, dx);
  return { val, tex: `\\dfrac{${A}+${B}}{2}\\cdot ${dx}=${mid}=${d(val)}` };
}

function kuski(uzly: Uzel[]): Kusok[] {
  const out: Kusok[] = [];
  for (let i = 0; i < uzly.length - 1; i += 1) {
    const p = uzly[i] as Uzel;
    const q = uzly[i + 1] as Uzel;
    out.push({ u: p.x, v: q.x, yu: p.y, yv: q.y });
  }
  return out;
}

function podpisKuska(k: Kusok): string {
  return `${nazv(k)} на $[${d(k.u)};\\ ${d(k.v)}]$`;
}

const PLOSHCHAD = (a: number, b: number) =>
  `Найдите площадь фигуры, ограниченной графиком функции $y=f(x)$, осью абсцисс и прямыми $x=${d(a)}$ и $x=${d(b)}$.`;
const PRIRASH = (a: number, b: number) =>
  `Пользуясь рисунком, найдите $F(${d(b)})-F(${d(a)})$, где $F(x)$ — одна из первообразных функции $f(x)$.`;

/** Общая сборка задач по ломаной: ответ — сумма знаковых площадей кусков. */
function poLomanoy(
  uzly: Uzel[],
  uslovie: (a: number, b: number) => string,
  voprosy: (ctx: { kus: Kusok[]; vals: number[]; otv: number; a: number; b: number }) => ReturnType<typeof vopros>[],
  znakovaya: boolean,
): PrepGenerated | null {
  const a = (uzly[0] as Uzel).x;
  const b = (uzly[uzly.length - 1] as Uzel).x;
  const kus = kuski(uzly);
  const pls = kus.map(pl);
  const vals = kus.map((k, i) => (k.yu + k.yv < 0 ? -1 : 1) * (pls[i] as { val: number }).val);
  const otv = vals.reduce((s, v) => s + v, 0);
  if (otv === 0 || Math.abs(otv) > 40) {
    return null;
  }
  const pom: Pomoshch[] = [
    { t: 'vert', x: a, shag: 1 },
    { t: 'vert', x: b, shag: 1 },
    ...uzly.slice(1, -1).map((u): Pomoshch => ({ t: 'vert', x: u.x, shag: 2 })),
  ];
  const fig: Figura | null = figLomanaya(uzly, pom);
  if (fig === null) {
    return null;
  }
  const proverka = reshit(fig, { t: 'prirashchenie', p: a, q: b });
  if (proverka === null) {
    return null;
  }
  const summa = vals.map((v, i) => (i === 0 ? d(v) : v < 0 ? `-${d(-v)}` : `+${d(v)}`)).join('');
  const rasch = kus.map((k, i) => {
    const p = pls[i] as { val: number; tex: string };
    const minus = (vals[i] as number) < 0;
    return `$S_{${i + 1}}=${minus ? '-(' : ''}${p.tex}${minus ? `)=-${d(p.val)}` : ''}$ (${podpisKuska(k)}${znakovaya ? (minus ? ', под осью' : ', над осью') : ''}).`;
  });
  return {
    uslovie: uslovie(a, b),
    risunok: fig,
    otvet: otv,
    proverka,
    razbor: razborIz([
      shag('Разбиваем на простые фигуры', `Отрезок $[${d(a)};\\ ${d(b)}]$ режем по вершинам ломаной${znakovaya ? ' и точкам пересечения с осью' : ''}: получилось ${kus.length === 1 ? 'одна фигура' : `${kus.length} фигуры`}.`),
      shag('Площадь каждой', ...rasch),
      shag('Итог', kus.length === 1 && !znakovaya ? `$S=${d(otv)}$` : `$${kus.map((_, i) => `S_{${i + 1}}`).join('+')}=${summa}=${d(otv)}$`),
      shag('Ответ', `$${d(otv)}$`),
    ]),
    podskazka: voprosy({ kus, vals, otv, a, b }),
    params: { a, b, n: kus.length, otv },
  };
}

function formaVopros(r: Rng, kus: Kusok) {
  const verno = nazv(kus);
  return vopros(
    r,
    `Какая фигура лежит между графиком, осью $Ox$ и прямыми $x=${d(kus.u)}$, $x=${d(kus.v)}$?`,
    verno,
    ['прямоугольник', 'треугольник', 'трапеция'].filter((s) => s !== verno).map((s) => ({
      tekst: s,
      pochemu:
        s === 'прямоугольник'
          ? 'У прямоугольника обе стороны над осью на одной высоте, а здесь высоты в крайних точках разные.'
          : s === 'треугольник'
            ? 'У треугольника одна из точек лежит на оси (высота $0$), проверьте высоты на концах.'
            : 'У трапеции высоты на концах разные и обе не нулевые, проверьте высоты на концах.',
    })),
    `Это ${verno}.`,
    1,
  );
}

const m01 = micro('P9-6-01', 'Площадь прямоугольника под графиком', 'number', (r): PrepGenerated | null => {
  const dx = r.int(3, 9);
  const h = r.int(2, 6);
  const x0 = r.int(-7, 6 - dx);
  const g = poLomanoy([{ x: x0, y: h }, { x: x0 + dx, y: h }], PLOSHCHAD, ({ otv }) => [
    qChislo(r, 'Чему равна ширина фигуры (длина отрезка по оси $Ox$)?', dx, [
      { v: h, w: 'Это высота, а не ширина.' },
      { v: dx + 1, w: 'Посчитаны лишние клетки: ширина — разность абсцисс границ.' },
    ], `Ширина $${dx}$.`, 1),
    qChislo(r, 'Чему равна высота (значение $f$ на отрезке)?', h, [
      { v: dx, w: 'Это ширина, а не высота.' },
      { v: h - 1, w: 'Высота считается от оси $Ox$ до графика.' },
    ], `Высота $${h}$.`, 1),
    qChislo(r, 'Чему равна площадь $S=ab$?', otv, [
      { v: dx + h, w: 'Площадь прямоугольника — произведение сторон, а не сумма.' },
      { v: (dx * h) / 2, w: 'Множитель $\\dfrac12$ нужен у треугольника, а не у прямоугольника.' },
    ], `$S=${d(otv)}$.`, 1),
  ], false);
  return g;
});

const m02 = micro('P9-6-02', 'Площадь треугольника под графиком', 'number', (r): PrepGenerated | null => {
  const dx = r.int(2, 8);
  const h = r.int(2, 6);
  const x0 = r.int(-7, 6 - dx);
  const vozr = r.next() < 0.5;
  const uzly: Uzel[] = vozr ? [{ x: x0, y: 0 }, { x: x0 + dx, y: h }] : [{ x: x0, y: h }, { x: x0 + dx, y: 0 }];
  return poLomanoy(uzly, PLOSHCHAD, ({ otv, kus }) => [
    formaVopros(r, kus[0] as Kusok),
    qChislo(r, 'Чему равны основание (по оси $Ox$) и высота?', dx, [
      { v: h, w: 'Основание и высота перепутаны: основание лежит на оси $Ox$.' },
    ], `Основание $${dx}$, высота $${h}$.`, 1),
    qChislo(r, 'Чему равна площадь $S=\\dfrac12ah$?', otv, [
      { v: dx * h, w: 'Забыт множитель $\\dfrac12$.' },
      { v: (dx + h) / 2, w: 'Площадь треугольника — половина произведения, а не полусумма.' },
    ], `$S=${d(otv)}$.`, 1),
  ], false);
});

const m03 = micro('P9-6-03', 'Площадь трапеции под графиком', 'number', (r): PrepGenerated | null => {
  const dx = r.int(2, 8);
  const h0 = r.int(1, 6);
  const h1 = r.int(1, 6);
  if (h0 === h1) {
    return null;
  }
  const x0 = r.int(-7, 6 - dx);
  return poLomanoy([{ x: x0, y: h0 }, { x: x0 + dx, y: h1 }], PLOSHCHAD, ({ otv, kus }) => [
    formaVopros(r, kus[0] as Kusok),
    qChislo(r, 'Чему равна полусумма оснований (высот на концах)?', (h0 + h1) / 2, [
      { v: h0 + h1, w: 'Сумма оснований не поделена на $2$.' },
      { v: h0 * h1, w: 'Основания нужно складывать, а не умножать.' },
    ], `Полусумма $${d((h0 + h1) / 2)}$.`, 1),
    qChislo(r, 'Чему равна площадь $S=\\dfrac{a+b}{2}\\cdot h$?', otv, [
      { v: h0 + h1 + dx, w: 'Это сумма, а площадь — полусумма оснований на высоту.' },
      { v: ((h0 + h1) * dx), w: 'Забыт множитель $\\dfrac12$.' },
    ], `$S=${d(otv)}$.`, 1),
  ], false);
});

const m04 = micro('P9-6-04', 'Приращение первообразной под осью', 'number', (r): PrepGenerated | null => {
  const dx = r.int(2, 8);
  const h0 = r.int(1, 5);
  const h1 = r.pick([h0, r.int(1, 5)]);
  const x0 = r.int(-7, 6 - dx);
  return poLomanoy([{ x: x0, y: -h0 }, { x: x0 + dx, y: -h1 }], PRIRASH, ({ otv, kus }) => {
    const s = (pl(kus[0] as Kusok)).val;
    return [
      vopros(r, 'Над осью или под осью лежит график и какой знак у площади?', 'Под осью, знак «−»', [
        { tekst: 'Над осью, знак «+»', pochemu: 'График ниже оси $Ox$: значения $f$ отрицательны.' },
        { tekst: 'Знак значения не имеет', pochemu: '$F(b)-F(a)$ — площадь со знаком: под осью она берётся с минусом.' },
      ], 'Под осью площадь берём со знаком «−».', 1),
      qChislo(r, 'Чему равна площадь фигуры без учёта знака?', s, [
        { v: -s, w: 'Площадь без знака положительна.' },
        { v: dx * h0, w: 'Проверьте высоту на правом конце: если она другая, нужна полусумма высот.' },
      ], `Без знака $${d(s)}$.`, 1),
      qChislo(r, `Чему равно $F(${d(x0 + dx)})-F(${d(x0)})$?`, otv, [
        { v: s, w: 'Фигура под осью: ответ отрицателен.' },
        { v: -s / 2, w: 'Лишний множитель $\\dfrac12$.' },
      ], `Ответ: $${d(otv)}$.`, 1),
    ];
  }, true);
});

const m05 = micro('P9-6-05', 'Площадь составной фигуры', 'number', (r): PrepGenerated | null => {
  const x0 = r.int(-7, -2);
  const x1 = x0 + r.int(2, 4);
  const x2 = x1 + r.int(2, 4);
  const shape = r.int(0, 2);
  const h = r.int(2, 5);
  const g = r.int(1, 5);
  const ys: number[] = shape === 0 ? [h, h, 0] : shape === 1 ? [0, h, h] : [g, h, g + r.int(1, 2)];
  if (ys[0] === ys[1] && ys[1] === ys[2]) {
    return null;
  }
  if (x2 > 7) {
    return null;
  }
  return poLomanoy([{ x: x0, y: ys[0] as number }, { x: x1, y: ys[1] as number }, { x: x2, y: ys[2] as number }], PLOSHCHAD, ({ kus, vals, otv }) => [
    qChislo(r, 'На сколько простых фигур разбивается фигура по вершинам ломаной?', kus.length, [
      { v: kus.length + 1, w: 'Фигур столько, сколько прямолинейных кусков у графика.' },
      { v: 1, w: 'График состоит из нескольких прямолинейных кусков: фигура не одна.' },
    ], 'Фигур столько, сколько кусков у ломаной.', 1),
    qChislo(r, `Чему равна площадь первой фигуры (${nazv(kus[0] as Kusok)})?`, vals[0] as number, [
      { v: (vals[1] as number), w: 'Это площадь второй фигуры.' },
      { v: ((kus[0] as Kusok).v - (kus[0] as Kusok).u) * Math.max((kus[0] as Kusok).yu, (kus[0] as Kusok).yv), w: 'Забыт множитель $\\dfrac12$ или полусумма оснований.' },
    ], `Первая фигура: $${d(vals[0] as number)}$.`, 2),
    qChislo(r, 'Чему равна вся площадь?', otv, [
      { v: otv - (vals[1] as number), w: 'Одна из фигур не добавлена.' },
      { v: otv + 1, w: 'Ошибка в сложении: сложите площади ещё раз.' },
    ], `Ответ: $${d(otv)}$.`, 2),
  ], false);
});

const m06 = micro('P9-6-06', 'Значение первообразной в точке', 'number', (r): PrepGenerated | null => {
  const n = r.int(1, 3);
  let m = r.int(-3, 4);
  if (m === 0) {
    m = 2;
  }
  const k = m * (n + 1);
  let x1 = r.int(-2, 2);
  if (x1 === 0) {
    x1 = 1;
  }
  const y1 = r.int(-9, 9);
  const C = y1 - m * x1 ** (n + 1);
  const x0 = r.pick([-3, -2, -1, 1, 2, 3].filter((x) => x !== x1));
  const otv = m * x0 ** (n + 1) + C;
  const fx = `${d(k)}${n === 1 ? 'x' : `x^{${n}}`}`;
  const Fx = `${m === 1 ? '' : m === -1 ? '-' : d(m)}x^{${n + 1}}`;
  return {
    uslovie: `Найдите значение в точке $x_0=${d(x0)}$ той первообразной $F(x)$ функции $f(x)=${fx}$, график которой проходит через точку $(${d(x1)};\\ ${d(y1)})$.`,
    risunok: null,
    otvet: otv,
    proverka: m * x0 ** (n + 1) + (y1 - m * x1 ** (n + 1)),
    razbor: razborIz([
      shag('Общий вид первообразной', `Для $x^n$ первообразная $\\dfrac{x^{n+1}}{n+1}$, поэтому $F(x)=\\dfrac{${d(k)}x^{${n + 1}}}{${n + 1}}+C=${Fx}+C$.`),
      shag('Находим $C$', `$F(${d(x1)})=${sk(m)}\\cdot ${sk(x1)}^{${n + 1}}+C=${d(m * x1 ** (n + 1))}+C=${d(y1)}$, откуда $C=${d(C)}$.`),
      shag('Считаем $F(x_0)$', `$F(${d(x0)})=${sk(m)}\\cdot ${sk(x0)}^{${n + 1}}${C < 0 ? '' : '+'}${d(C)}=${d(m * x0 ** (n + 1))}${C < 0 ? '' : '+'}${d(C)}=${d(otv)}$.`),
      shag('Ответ', `$${d(otv)}$`),
    ]),
    podskazka: [
      vopros(r, `Чему равна первообразная $${fx}$?`, `$${Fx}+C$`, [
        { tekst: `$${d(k)}x^{${n + 1}}+C$`, pochemu: 'Показатель увеличен, но не поделён на новый показатель.' },
        { tekst: `$${poly1(k * n, n - 1)}$`, pochemu: 'Это производная, а нужна первообразная.' },
      ], `$F(x)=${Fx}+C$.`),
      qChislo(r, 'Чему равна константа $C$?', C, [
        { v: y1, w: 'Значение $y_1$ нужно уменьшить на $m x_1^{n+1}$: $C=F(x_1)-(\\text{часть без }C)$.' },
        { v: y1 + m * x1 ** (n + 1), w: 'Часть без $C$ нужно вычесть, а не прибавить.' },
      ], `$C=${d(C)}$.`),
      qChislo(r, `Чему равно $F(${d(x0)})$?`, otv, [
        { v: m * x0 ** (n + 1), w: 'Константа $C$ не добавлена.' },
        { v: m * x0 ** (n + 1) - C, w: 'Знак $C$ изменён.' },
      ], `Ответ: $${d(otv)}$.`),
    ],
    params: { n, m, x1, y1, x0 },
  };
});

function poly1(c: number, p: number): string {
  return `${d(c)}${p === 0 ? '' : p === 1 ? 'x' : `x^{${p}}`}`;
}

const m07 = micro('P9-6-07', 'Приращение первообразной степенной функции', 'number', (r): PrepGenerated | null => {
  const n = r.int(1, 3);
  let m = r.int(-3, 4);
  if (m === 0) {
    m = 3;
  }
  const k = m * (n + 1);
  const a = r.int(-3, 1);
  const b = r.int(a + 1, 4);
  const Fa = m * a ** (n + 1);
  const Fb = m * b ** (n + 1);
  const otv = Fb - Fa;
  const fx = `${d(k)}${n === 1 ? 'x' : `x^{${n}}`}`;
  const Fx = `${m === 1 ? '' : m === -1 ? '-' : d(m)}x^{${n + 1}}`;
  return {
    uslovie: `Функция $F(x)$ — первообразная функции $f(x)=${fx}$. Найдите $F(${d(b)})-F(${d(a)})$.`,
    risunok: null,
    otvet: otv,
    proverka: ((Fb * 1) - Fa),
    razbor: razborIz([
      shag('Первообразная', `Берём $F(x)=${Fx}$; константа при вычитании сократится.`),
      shag('Значения', `$F(${d(b)})=${sk(m)}\\cdot ${sk(b)}^{${n + 1}}=${d(Fb)}$, $F(${d(a)})=${sk(m)}\\cdot ${sk(a)}^{${n + 1}}=${d(Fa)}$.`),
      shag('Разность', `$F(${d(b)})-F(${d(a)})=${d(Fb)}-${sk(Fa)}=${d(otv)}$.`),
      shag('Ответ', `$${d(otv)}$`),
    ]),
    podskazka: [
      vopros(r, `Чему равна первообразная $${fx}$?`, `$${Fx}$`, [
        { tekst: `$${d(k)}x^{${n + 1}}$`, pochemu: 'Показатель увеличен, но не поделён на $n+1$.' },
        { tekst: `$${poly1(k * n, n - 1)}$`, pochemu: 'Это производная, а нужна первообразная.' },
      ], `$F(x)=${Fx}$.`),
      qChislo(r, `Чему равно $F(${d(b)})$?`, Fb, [
        { v: Fa, w: 'Это значение $F$ в другой точке.' },
        { v: m * b ** n, w: 'Показатель степени должен быть $n+1$.' },
      ], `$F(${d(b)})=${d(Fb)}$.`),
      qChislo(r, 'Чему равна разность?', otv, [
        { v: Fb + Fa, w: 'Нужно вычесть, а не сложить.' },
        { v: Fa - Fb, w: 'Порядок вычитания: из $F(b)$ вычитаем $F(a)$.' },
      ], `Ответ: $${d(otv)}$.`),
    ],
    params: { n, m, a, b },
  };
});

const m08 = micro('P9-6-08', 'Приращение первообразной линейной функции', 'number', (r): PrepGenerated | null => {
  let k = r.int(-6, 6);
  if (k === 0) {
    k = 2;
  }
  const m0 = r.int(-6, 6);
  const a = r.int(-4, 1);
  const b = r.int(a + 2, 5);
  const otv = (k / 2) * (b * b - a * a) + m0 * (b - a);
  const fx = k === 1 ? 'x' : k === -1 ? '-x' : `${d(k)}x`;
  const lin = `${fx}${m0 === 0 ? '' : m0 > 0 ? `+${m0}` : String(m0)}`;
  const K = k / 2;
  const Ftxt = `${d(K)}x^2${m0 === 0 ? '' : m0 > 0 ? `+${m0}x` : `${m0}x`}`;
  return {
    uslovie: `Функция $F(x)$ — первообразная функции $f(x)=${lin}$. Найдите $F(${d(b)})-F(${d(a)})$.`,
    risunok: null,
    otvet: otv,
    proverka: (b - a) * ((k / 2) * (a + b) + m0),
    razbor: razborIz([
      shag('Первообразная', `$F(x)=${Ftxt}$ (константу не пишем: она сократится).`),
      shag('Группируем', `$F(${d(b)})-F(${d(a)})=${d(K)}(${d(b)}^2-${sk(a)}^2)${m0 === 0 ? '' : `+${sk(m0)}(${d(b)}-${sk(a)})`}=(${d(b)}-${sk(a)})\\bigl(${d(K)}(${d(b)}+${sk(a)})${m0 === 0 ? '' : `+${sk(m0)}`}\\bigr)$ — использовали разность квадратов $b^2-a^2=(b-a)(b+a)$.`),
      shag('Считаем', `$${d(b - a)}\\cdot (${d(K * (a + b))}${m0 === 0 ? '' : `+${sk(m0)}`})=${d(b - a)}\\cdot ${d(K * (a + b) + m0)}=${d(otv)}$.`),
      shag('Ответ', `$${d(otv)}$`),
    ]),
    podskazka: [
      vopros(r, `Чему равна первообразная $${lin}$?`, `$${Ftxt}$`, [
        { tekst: `$${d(k)}x^2${m0 === 0 ? '' : m0 > 0 ? `+${m0}x` : `${m0}x`}$`, pochemu: 'Для $kx$ первообразная $\\dfrac{kx^2}{2}$: показатель увеличивается и делится на $2$.' },
        { tekst: `$${d(K)}x^2${m0 === 0 ? '' : m0 > 0 ? `+${m0}` : String(m0)}$`, pochemu: 'У константы первообразная $m_0x$, а не $m_0$.' },
      ], `$F(x)=${Ftxt}$.`),
      qChislo(r, `Чему равно $${d(K)}(${d(b)}^2-${sk(a)}^2)$ — часть от слагаемого с $x^2$?`, K * (b * b - a * a), [
        { v: K * (b - a) ** 2, w: 'Разность квадратов — не квадрат разности: $b^2-a^2=(b-a)(b+a)$.' },
        { v: K * (b * b + a * a), w: 'Квадраты нужно вычитать, а не складывать.' },
      ], `Это $${d(K * (b * b - a * a))}$.`),
      qChislo(r, 'Чему равна вся разность $F(b)-F(a)$?', otv, [
        { v: otv - m0 * (b - a), w: 'Не учтено слагаемое с $m_0$.' },
        { v: -otv, w: 'Порядок вычитания: $F(b)-F(a)$.' },
      ], `Ответ: $${d(otv)}$.`),
    ],
    params: { k, m0, a, b },
  };
});

const m09 = micro('P9-6-09', 'Площадь со знаком: над и под осью', 'number', (r): PrepGenerated | null => {
  const x0 = r.int(-6, -2);
  const x1 = x0 + r.int(2, 4);
  const x2 = x1 + r.int(2, 4);
  const h = r.int(2, 5);
  const g = r.int(1, 5);
  const verh = r.next() < 0.5;
  if (x2 > 7) {
    return null;
  }
  const uzly: Uzel[] = verh ? [{ x: x0, y: h }, { x: x1, y: 0 }, { x: x2, y: -g }] : [{ x: x0, y: -g }, { x: x1, y: 0 }, { x: x2, y: h }];
  return poLomanoy(uzly, PRIRASH, ({ kus, vals, otv }) => [
    vopros(r, 'Какой знак у площади части графика под осью $Ox$?', 'Минус', [
      { tekst: 'Плюс', pochemu: 'Площади под осью входят в $F(b)-F(a)$ со знаком «−».' },
      { tekst: 'Такие площади не учитываются', pochemu: 'Они учитываются, но с противоположным знаком.' },
    ], 'Под осью берём «−».', 1),
    qChislo(r, 'Чему равна площадь части над осью (со знаком)?', Math.max(...vals), [
      { v: Math.min(...vals), w: 'Это площадь части под осью.' },
      { v: Math.abs(Math.min(...vals)), w: 'Площадь под осью входит со знаком «−».' },
    ], `Над осью $${d(Math.max(...vals))}$.`, 2),
    qChislo(r, `Чему равно $F(${d(x2)})-F(${d(x0)})$?`, otv, [
      { v: vals.reduce((s, v) => s + Math.abs(v), 0), w: 'Площади сложены без знаков.' },
      { v: -otv, w: 'Знак итога перепутан.' },
    ], `Ответ: $${d(otv)}$.`, 2),
    ...(kus.length > 5 ? [] : []),
  ], true);
});

const m10 = micro('P9-6-10', 'Функция по её первообразной', 'number', (r): PrepGenerated | null => {
  const a = r.int(-3, 3);
  const b = r.int(-6, 6);
  const c = r.int(-9, 9);
  if (a === 0) {
    return null;
  }
  const x0 = r.pick([-3, -2, -1, 1, 2, 3]);
  const otv = 3 * a * x0 * x0 + 2 * b * x0 + c;
  const Fx = `${a === 1 ? '' : a === -1 ? '-' : d(a)}x^3${b === 0 ? '' : `${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}x^2`}${c === 0 ? '' : `${c < 0 ? '-' : '+'}${Math.abs(c) === 1 ? '' : Math.abs(c)}x`}`;
  const fx = `${d(3 * a)}x^2${b === 0 ? '' : `${b < 0 ? '-' : '+'}${Math.abs(2 * b)}x`}${c === 0 ? '' : `${c < 0 ? '-' : '+'}${Math.abs(c)}`}`;
  return {
    uslovie: `Функция $F(x)=${Fx}$ является первообразной функции $f(x)$. Найдите $f(${d(x0)})$.`,
    risunok: null,
    otvet: otv,
    proverka: ((a * (x0 + 1e-4) ** 3 + b * (x0 + 1e-4) ** 2 + c * (x0 + 1e-4)) - (a * (x0 - 1e-4) ** 3 + b * (x0 - 1e-4) ** 2 + c * (x0 - 1e-4))) / 2e-4,
    razbor: razborIz([
      shag('Связь', "Первообразная $F$ связана с $f$ равенством $F'(x)=f(x)$."),
      shag('Находим $f(x)$', `$f(x)=F'(x)=${fx}$.`),
      shag('Подставляем', `$f(${d(x0)})=${d(3 * a)}\\cdot ${sk(x0)}^2${b === 0 ? '' : `${b < 0 ? '-' : '+'}${Math.abs(2 * b)}\\cdot ${sk(x0)}`}${c === 0 ? '' : `${c < 0 ? '-' : '+'}${Math.abs(c)}`}=${d(otv)}$.`),
      shag('Ответ', `$${d(otv)}$`),
    ]),
    podskazka: [
      vopros(r, 'Как по первообразной $F$ найти функцию $f$?', "Найти производную: $f(x)=F'(x)$", [
        { tekst: 'Найти ещё одну первообразную', pochemu: 'Это шаг в обратную сторону; нужна производная.' },
        { tekst: 'Подставить $x_0$ в $F$', pochemu: 'Так находят значение $F(x_0)$, а не $f(x_0)$.' },
      ], "$f=F'$."),
      vopros(r, 'Чему равна $f(x)$?', `$${fx}$`, [
        { tekst: `$${Fx}$`, pochemu: 'Это сама $F$: производную ещё не взяли.' },
      ], `$f(x)=${fx}$.`),
      qChislo(r, `Чему равно $f(${d(x0)})$?`, otv, [
        { v: a * x0 ** 3 + b * x0 * x0 + c * x0, w: 'Найдено $F(x_0)$, а не $f(x_0)$.' },
        { v: 3 * a * x0 + 2 * b * x0 + c, w: 'Показатель при $x^2$ потерян: у $3ax^2$ в $f$ остаётся $x^2$.' },
      ], `Ответ: $${d(otv)}$.`),
    ],
    params: { a, b, c, x0 },
  };
});

export const BLOCK_6: PrepMicro[] = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];
