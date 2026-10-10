/**
 * Группа V. Первообразная.
 *
 *   9.5.1 — по графику F: в скольких отмеченных точках f(x) положительна;
 *   9.5.2 — то же: отрицательна;
 *   9.5.3 — по графику F: число решений уравнения f(x)=0 на отрезке;
 *   9.5.4 — по графику-ломаной f: F(b)−F(a) как площадь со знаком;
 *   9.5.5 — площадь закрашенной фигуры под параболой, F дана, одна
 *           граница (левый корень) читается по рисунку, вторая — в тексте;
 *   9.5.6 — то же, обе границы — корни параболы, читаются по рисунку.
 *
 * Рисунки 9.5.1–9.5.3 собираются через sobrat() (волна F). Ломаная и
 * парабола с закраской — не «волны»: часть проверок reshit.problemy
 * (отбор нулей по отрезку) к ним неприменима, поэтому здесь своя
 * сборка `sobratRu`: problemy без запроса, risunokChist, независимый
 * пересчёт интегралом.
 */

import type { Rng } from '../../veroyatnost/generator';
import { chislaOtvet } from '../otvet';
import { vybratMetki, znakProizvodnoy } from '../chtenie';
import { razmerKletki, volna } from '../krivye';
import { risunokChist } from '../render';
import { problemy, reshit } from '../reshit';
import { lomanayaY, postroit } from '../spline';
import { d, interval, otrezok, xi } from '../tex';
import type { Draft, Figura, Okno, Pomoshch, Uzel, Zapros } from '../types';
import { grafikBigF, metkiTekst } from '../uslovie';
import { podpisUzlov, proto, shag, vopros } from './common';
import type { Nevernyy } from './common';

/* ── Общие кирпичi ──────────────────────────────────────────────── */

/** Вопрос подсказки с числовыми вариантами: неверные с объяснением, без повторов. */
function chislovoy(
  r: Rng,
  text: string,
  verno: number,
  neverno: { v: number; w: string }[],
  itog?: string,
  shagNomer?: number,
) {
  const seen = new Set<string>([d(verno)]);
  const list: Nevernyy[] = [];
  for (const n of neverno) {
    if (Number.isFinite(n.v) && !seen.has(d(n.v))) {
      seen.add(d(n.v));
      list.push({ tekst: `$${d(n.v)}$`, pochemu: n.w });
    }
  }
  return vopros(r, text, `$${d(verno)}$`, list.slice(0, 3), itog, shagNomer);
}

function perechen(idx: number[]): string {
  return idx.map((i) => xi(i)).join(',\\ ');
}

interface Promezhutok {
  from: number;
  to: number;
  vozr: boolean;
}

/** Промежутки монотонности волны по её узлам. */
function promezhutki(uzly: readonly Uzel[]): Promezhutok[] {
  const out: Promezhutok[] = [];
  let start = (uzly[0] as Uzel).x;
  let vozr = (uzly[1] as Uzel).y > (uzly[0] as Uzel).y;
  for (let i = 1; i < uzly.length; i += 1) {
    const u = uzly[i] as Uzel;
    const next = uzly[i + 1];
    if (next === undefined) {
      out.push({ from: start, to: u.x, vozr });
    } else if (next.y > u.y !== vozr) {
      out.push({ from: start, to: u.x, vozr });
      start = u.x;
      vozr = !vozr;
    }
  }
  return out;
}

function promezhutkiTekst(ps: Promezhutok[], vozr: boolean): string {
  return ps
    .filter((p) => p.vozr === vozr)
    .map((p) => `$${interval(p.from, p.to)}$`)
    .join(', ');
}

/** Проверка читаемости и независимый пересчёт ответа (как sobrat из common.ts). */
function sobrat(
  fig: Figura,
  zapros: Zapros,
  otvet: number,
  rest: Omit<Draft, 'risunok' | 'zapros' | 'otvet' | 'proverka'>,
): Draft | null {
  const pr = problemy(fig, zapros);
  if (pr.length > 0) {
    if (process.env.PDBG) console.log('P', pr[0]);
    return null;
  }
  const ch = risunokChist(fig);
  if (ch.length > 0) {
    if (process.env.PDBG) console.log('C', ch[0]);
    return null;
  }
  const proverka = reshit(fig, zapros);
  if (proverka === null || Math.abs(proverka - otvet) > 1e-6) {
    return null;
  }
  return { risunok: fig, zapros, otvet, proverka, ...rest };
}

/* ── 9.5.1 и 9.5.2: знак f в отмеченных точках по графику F ─────── */

function znakVMetkah(sgn: 1 | -1) {
  return (r: Rng): Draft | null => {
    const w = volna(r, { n: [2, 3], shag: 3, a: [-9, -6], b: [6, 9], vysota: [2, 4] });
    if (w === null) {
      if (process.env.PDBG) console.log('G volna');
      return null;
    }
    const spl = postroit(w.uzly);
    const godnaya = (x: number) =>
      x !== 0 && Math.abs(spl.dy(x)) >= 0.55 && Math.abs(spl.y(x)) >= 0.9;
    let pool = 0;
    for (let x = w.a + 1; x < w.b; x += 1) {
      pool += godnaya(x) ? 1 : 0;
    }
    if (pool < 6) {
      if (process.env.PDBG) console.log('G pool');
      return null;
    }
    const n = r.int(6, Math.min(9, pool));
    const metki = vybratMetki(r, w.a, w.b, n, godnaya);
    if (metki === null) {
      return null;
    }
    const idxAll = metki.map((_, i) => i + 1);
    const good = idxAll.filter((i) => znakProizvodnoy(w.uzly, metki[i - 1] as number) === sgn);
    const bad = idxAll.filter((i) => !good.includes(i));
    const k = good.length;
    if (k < 2 || bad.length < 2) {
      if (process.env.PDBG) console.log('G bal');
      return null;
    }
    const ps = promezhutki(w.uzly);
    const exts = w.ekstremumy.map((e) => e.x);
    const pom: Pomoshch[] = [
      ...exts.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 1 })),
    ];
    const fig: Figura = {
      rezhim: 'F',
      podpis: 'F(x)',
      uzly: w.uzly,
      levyy: 'open',
      pravyy: 'open',
      chisla: 'vse',
      chislaY: 'minimum',
      ...(figuraWave(w.uzly, metki, pom) as Pick<Figura, 'okno'>),
    };
    const polozh = sgn === 1;
    const slovo = polozh ? 'положительно' : 'отрицательно';
    const uslovie = `${grafikBigF(w.a, w.b)} ${metkiTekst(n)} В скольких из этих точек значение функции $f(x)$ ${slovo}?`;
    const khod = polozh ? 'возрастает (идёт вверх)' : 'убывает (идёт вниз)';
    const nuzhnyy = polozh ? 'возрастания' : 'убывания';
    const drugoy = polozh ? 'убывания' : 'возрастания';
    return sobrat(fig, { t: 'znak-v-metkah', znak: sgn }, k, {
      uslovie,
      shagi: [
        shag(
          'Связь графика $F$ и функции $f$',
          "$F$ — первообразная функции $f$, поэтому $F'(x)=f(x)$.",
          polozh
            ? 'Значит, $f(x)>0$ там, где $F$ возрастает, а $f(x)<0$ там, где $F$ убывает.'
            : 'Значит, $f(x)<0$ там, где $F$ убывает, а $f(x)>0$ там, где $F$ возрастает.',
        ),
        shag(
          'Промежутки монотонности $F$',
          `График $F$ меняет направление при $x=${exts.map(d).join('$, $x=')}$.`,
          `$F$ возрастает на ${promezhutkiTekst(ps, true)}; убывает на ${promezhutkiTekst(ps, false)}.`,
        ),
        shag(
          'Распределяем отмеченные точки',
          `Промежутки ${nuzhnyy}: в них попадают $${perechen(good)}$.`,
          `Остальные точки ($${perechen(bad)}$) лежат на промежутках ${drugoy}.`,
        ),
        shag('Считаем', `Подходящих точек: $${k}$.`),
        shag('Ответ', `**Ответ: ${chislaOtvet(k)}**`),
      ],
      podskazka: [
        vopros(
          r,
          `Что значит, что $f(x)$ ${slovo} в точке $x_i$, если известен график $F$?`,
          `График $F$ в этой точке ${khod}`,
          [
            {
              tekst: polozh
                ? 'График $F$ в этой точке лежит выше оси $Ox$'
                : 'График $F$ в этой точке лежит ниже оси $Ox$',
              pochemu:
                "Положение $F$ относительно оси говорит о знаке самой $F$, а знак $f=F'$ показывает направление графика.",
            },
            {
              tekst: polozh
                ? 'График $F$ в этой точке убывает (идёт вниз)'
                : 'График $F$ в этой точке возрастает (идёт вверх)',
              pochemu: polozh
                ? "Убывание $F$ означает $F'(x)=f(x)<0$, а не $>0$."
                : "Возрастание $F$ означает $F'(x)=f(x)>0$, а не $<0$.",
            },
            {
              tekst: 'График $F$ в этой точке имеет вершину',
              pochemu: "В вершине $F'(x)=0$, то есть $f(x)=0$: ни плюса, ни минуса.",
            },
          ],
          polozh
            ? "$f(x)=F'(x)>0$ там, где $F$ идёт вверх."
            : "$f(x)=F'(x)<0$ там, где $F$ идёт вниз.",
          1,
        ),
        vopros(
          r,
          `Какие из отмеченных точек лежат там, где график $F$ ${polozh ? 'идёт вверх' : 'идёт вниз'}?`,
          `$${perechen(good)}$`,
          [
            {
              tekst: `$${perechen(bad)}$`,
              pochemu: 'Это точки противоположного направления: перепутаны возрастание и убывание.',
            },
            {
              tekst: `$${perechen(good.slice(1))}$`,
              pochemu: `Пропущена точка $${xi(good[0] as number)}$: она тоже лежит на нужном промежутке.`,
            },
            {
              tekst: `$${perechen([...good, bad[0] as number].sort((p, q) => p - q))}$`,
              pochemu: `Лишняя точка $${xi(bad[0] as number)}$: она лежит на промежутке противоположного направления.`,
            },
          ],
          `Нужные точки: $${perechen(good)}$.`,
          2,
        ),
        chislovoy(
          r,
          'Сколько их всего?',
          k,
          [
            { v: n - k, w: 'Это число точек противоположного знака.' },
            { v: k + 1, w: 'Одна точка посчитана лишний раз.' },
            { v: k - 1, w: 'Одна подходящая точка пропущена.' },
          ],
          `Ответ: $${k}$.`,
          2,
        ),
      ],
      params: { a: w.a, b: w.b, n, k, sgn, ext: exts.join(',') },
      signature: `${podpisUzlov(fig)}|${sgn}`,
      vid: `n${n}e${exts.length}`,
    });
  };
}

/** Рисунок-волна: окно и размер клетки — как в krivye.figura, без лишних полей. */
function figuraWave(uzly: Uzel[], metki: number[], pomoshch: Pomoshch[]): Partial<Figura> {
  const spl = postroit(uzly);
  let ymin = Infinity;
  let ymax = -Infinity;
  const first = uzly[0] as Uzel;
  const last = uzly[uzly.length - 1] as Uzel;
  for (let x = first.x; x <= last.x + 1e-9; x += 0.02) {
    ymin = Math.min(ymin, spl.y(x));
    ymax = Math.max(ymax, spl.y(x));
  }
  const okno: Okno = {
    xmin: Math.min(first.x - 1, -1),
    xmax: Math.max(last.x + 1, 1),
    ymin: Math.min(Math.floor(ymin) - 1, -1),
    ymax: Math.max(Math.ceil(ymax) + 1, 1),
  };
  return { okno, cell: razmerKletki(okno), metki, pomoshch };
}

const P951 = proto({
  id: '9.5.1',
  gruppa: 'V',
  nazvanie: 'Знак функции $f$ в отмеченных точках по графику первообразной $F$',
  kratko: 'Где $f(x)>0$ по графику $F$',
  risunok: true,
  generate: znakVMetkah(1),
});

const P952 = proto({
  id: '9.5.2',
  gruppa: 'V',
  nazvanie: 'Знак функции $f$ в отмеченных точках по графику первообразной $F$ (отрицательна)',
  kratko: 'Где $f(x)<0$ по графику $F$',
  risunok: true,
  generate: znakVMetkah(-1),
});

/* ── 9.5.3: число решений f(x)=0 на отрезке по графику F ────────── */

const P953 = proto({
  id: '9.5.3',
  gruppa: 'V',
  nazvanie: 'Число решений уравнения $f(x)=0$ на отрезке по графику первообразной',
  kratko: 'Сколько решений $f(x)=0$ на отрезке',
  risunok: true,
  generate(r: Rng): Draft | null {
    const w = volna(r, { n: [3, 5], shag: 2 });
    if (w === null) {
      return null;
    }
    const p = r.int(w.a + 1, w.b - 4);
    const q = r.int(p + 3, w.b - 1);
    const exts = w.ekstremumy.map((e) => e.x);
    const inside = exts.filter((x) => x > p && x < q);
    const outside = exts.filter((x) => x < p || x > q);
    if (
      inside.length < 1 ||
      inside.length > 3 ||
      outside.length < 1 ||
      exts.includes(p) ||
      exts.includes(q)
    ) {
      return null;
    }
    const k = inside.length;
    const pom: Pomoshch[] = [
      ...exts.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 1 })),
      { t: 'otrezok', p, q, shag: 2 },
    ];
    const fig: Figura = {
      rezhim: 'F',
      podpis: 'F(x)',
      uzly: w.uzly,
      levyy: 'open',
      pravyy: 'open',
      chisla: 'vse',
      chislaY: 'minimum',
      ...(figuraWave(w.uzly, [], pom) as Pick<Figura, 'okno'>),
    };
    delete fig.metki;
    const uslovie = `${grafikBigF(w.a, w.b)} Найдите количество решений уравнения $f(x)=0$ на отрезке $${otrezok(p, q)}$.`;
    return sobrat(fig, { t: 'chislo-nuley-f', p, q }, k, {
      uslovie,
      shagi: [
        shag(
          'Переводим уравнение на язык графика $F$',
          "Так как $F'(x)=f(x)$, уравнение $f(x)=0$ означает $F'(x)=0$.",
          'Производная равна нулю там, где касательная к графику $F$ горизонтальна, то есть в «вершинах» графика: точках максимума и минимума.',
        ),
        shag(
          'Находим вершины графика $F$',
          `На всём интервале график $F$ имеет вершины при $x=${exts.map(d).join('$, $x=')}$ — всего $${exts.length}$.`,
        ),
        shag(
          'Отбираем вершины на отрезке',
          `Отрезок $${otrezok(p, q)}$: внутри него лежат $x=${inside.map(d).join('$, $x=')}$.`,
          `Вершины $x=${outside.map(d).join('$, $x=')}$ лежат вне отрезка, их не считаем.`,
        ),
        shag('Ответ', `**Ответ: ${chislaOtvet(k)}**`),
      ],
      podskazka: [
        vopros(
          r,
          'Что происходит с графиком $F$ в точке, где $f(x)=0$?',
          'Касательная к графику $F$ горизонтальна (вершина графика)',
          [
            {
              tekst: 'График $F$ пересекает ось $Ox$',
              pochemu: "Пересечение оси даёт $F(x)=0$, а не $f(x)=F'(x)=0$.",
            },
            {
              tekst: 'График $F$ имеет излом',
              pochemu: 'Первообразная — гладкая функция, изломов у неё нет.',
            },
            {
              tekst: 'График $F$ проходит через начало координат',
              pochemu: 'Ни $f(x)=0$, ни начало координат между собой не связаны.',
            },
          ],
          "$f(x)=F'(x)=0$ — вершины графика $F$.",
          1,
        ),
        chislovoy(
          r,
          'Сколько вершин у графика $F$ на всём интервале?',
          exts.length,
          [
            { v: exts.length + 1, w: 'Лишняя вершина: концы интервала вершинами не считаются.' },
            { v: exts.length - 1, w: 'Одна вершина пропущена: пересчитайте «горки» и «ямки».' },
            {
              v: exts.length + 2,
              w: 'Концы интервала посчитаны как вершины, а они не входят в интервал.',
            },
          ],
          `Вершин всего $${exts.length}$.`,
          1,
        ),
        chislovoy(
          r,
          `Сколько из них лежит на отрезке $${otrezok(p, q)}$?`,
          k,
          [
            { v: exts.length, w: 'Посчитаны все вершины, а нужны только лежащие на отрезке.' },
            { v: k + 1, w: 'Вершина за границей отрезка посчитана лишней.' },
            { v: k - 1, w: 'Пропущена вершина внутри отрезка.' },
          ],
          `На отрезке $${otrezok(p, q)}$ вершин $${k}$.`,
          2,
        ),
      ],
      params: { a: w.a, b: w.b, p, q, k, n: exts.length },
      signature: `${podpisUzlov(fig)}|${p}|${q}`,
      vid: `n${exts.length}k${k}`,
    });
  },
});

/* ── Своя сборка для рисунков, не являющихся «волной» ───────────── */

/**
 * Проверка и независимый пересчёт для ломаной и параболы: читаемость
 * без запроса (отбор нулей по отрезку к ним не относится), чистота
 * подписей и интеграл Симпсона. `znakOtveta` — как ответ связан с
 * интегралом: +1 — ответ равен интегралу, −1 — минус интегралу.
 */
function sobratRu(
  fig: Figura,
  zapros: Zapros,
  otvet: number,
  znakOtveta: 1 | -1,
  rest: Omit<Draft, 'risunok' | 'zapros' | 'otvet' | 'proverka'>,
): Draft | null {
  if (problemy(fig, null).length > 0) {
    return null;
  }
  if (risunokChist(fig).length > 0) {
    return null;
  }
  const proverka = reshit(fig, zapros);
  if (proverka === null || Math.abs(proverka * znakOtveta - otvet) > 1e-6) {
    return null;
  }
  /* Draft.zapros для «чаши» пустой: reshit вернул бы отрицательное число. */
  return {
    risunok: fig,
    zapros: znakOtveta === 1 ? zapros : null,
    otvet,
    proverka: proverka * znakOtveta,
    ...rest,
  };
}

function okoshko(xs: [number, number], ys: [number, number], pole = 1): Okno {
  return {
    xmin: Math.min(Math.floor(xs[0]) - pole, -1),
    xmax: Math.max(Math.ceil(xs[1]) + pole, 1),
    ymin: Math.min(Math.floor(ys[0]) - pole, -1),
    ymax: Math.max(Math.ceil(ys[1]) + pole, 1),
  };
}

/* ── 9.5.4: F(b) − F(a) по графику-ломаной f ─────────────────────── */

interface Kusok {
  u: number;
  v: number;
  yu: number;
  yv: number;
}

/** Половина произведения «умно»: делим чётный множитель. [выражение, значение] */
function polovina(p: number, q: number): [string, number] {
  if (p % 2 === 0) {
    return [`${p / 2}\\cdot ${q}`, (p / 2) * q];
  }
  if (q % 2 === 0) {
    return [`${p}\\cdot ${q / 2}`, p * (q / 2)];
  }
  return [`\\dfrac{${p}\\cdot ${q}}{2}`, (p * q) / 2];
}

function nazvanieFigury(k: Kusok): 'pryamougolnik' | 'treugolnik' | 'trapeciya' {
  if (k.yu === k.yv) {
    return 'pryamougolnik';
  }
  if (k.yu === 0 || k.yv === 0) {
    return 'treugolnik';
  }
  return 'trapeciya';
}

const IMYA = {
  pryamougolnik: 'прямоугольник',
  treugolnik: 'треугольник',
  trapeciya: 'трапеция',
} as const;

/** Площадь куска (по модулю) с записью вычисления в TeX. */
function ploshchadKuska(k: Kusok): { val: number; tex: string } {
  const dx = k.v - k.u;
  const A = Math.abs(k.yu);
  const B = Math.abs(k.yv);
  switch (nazvanieFigury(k)) {
    case 'pryamougolnik':
      return { val: A * dx, tex: `${A}\\cdot ${dx}=${d(A * dx)}` };
    case 'treugolnik': {
      const h = Math.max(A, B);
      const [mid, val] = polovina(dx, h);
      return { val, tex: `\\dfrac{1}{2}\\cdot ${dx}\\cdot ${h}=${mid}=${d(val)}` };
    }
    default: {
      const [mid, val] = polovina(A + B, dx);
      return { val, tex: `\\dfrac{${A}+${B}}{2}\\cdot ${dx}=${mid}=${d(val)}` };
    }
  }
}

function sumTex(vals: number[]): string {
  return vals.map((v, i) => (i === 0 ? d(v) : v < 0 ? `-${d(-v)}` : `+${d(v)}`)).join('');
}

function lomanayaFigura(r: Rng): { uzly: Uzel[]; a: number; b: number } | null {
  const pieces = r.int(2, 3);
  const xs = [r.int(-6, -2)];
  for (let i = 0; i < pieces; i += 1) {
    xs.push((xs[i] as number) + r.int(2, 4));
  }
  const ys = [r.int(-3, 5)];
  const slopes: number[] = [];
  const horizFirst = r.next() < 0.5;
  for (let i = 0; i < pieces; i += 1) {
    const dx = (xs[i + 1] as number) - (xs[i] as number);
    const choices = [0, 1, -1, 2, -2, 0.5, -0.5].filter((s) =>
      Math.abs(s) === 0.5 ? dx % 2 === 0 : true,
    );
    const s = i === 0 && horizFirst ? 0 : r.pick(choices);
    if (i > 0 && s === slopes[i - 1]) {
      return null;
    }
    slopes.push(s);
    ys.push((ys[i] as number) + s * dx);
  }
  if (slopes.every((s) => s === 0)) {
    return null;
  }
  for (let i = 0; i <= pieces; i += 1) {
    const y = ys[i] as number;
    if (y < -5 || y > 7) {
      return null;
    }
    if (slopes[i] === 0 && y === 0) {
      return null;
    }
  }
  const uzly: Uzel[] = xs.map((x, i) => ({ x, y: ys[i] as number }));
  /* Пересечения оси — только в целых точках. */
  for (let i = 0; i < pieces; i += 1) {
    const y0 = ys[i] as number;
    const y1 = ys[i + 1] as number;
    if (y0 * y1 < 0) {
      const xz =
        (xs[i] as number) +
        (((xs[i + 1] as number) - (xs[i] as number)) * Math.abs(y0)) /
          (Math.abs(y0) + Math.abs(y1));
      if (Math.abs(xz - Math.round(xz)) > 1e-9) {
        return null;
      }
    }
  }
  const x0 = xs[0] as number;
  const xn = xs[pieces] as number;
  if (xn - x0 < 5) {
    return null;
  }
  const a = r.int(x0, xn - 3);
  const b = r.int(a + 3, xn);
  return { uzly, a, b };
}

const P954 = proto({
  id: '9.5.4',
  gruppa: 'V',
  nazvanie: 'Приращение первообразной $F(b)-F(a)$ по графику-ломаной функции $f$',
  kratko: '$F(b)-F(a)$ по графику $f$',
  risunok: true,
  generate(r: Rng): Draft | null {
    const g = lomanayaFigura(r);
    if (g === null) {
      return null;
    }
    const { uzly, a, b } = g;
    const ysAll = uzly.map((u) => u.y);
    const okno = okoshko(
      [uzly[0]!.x, uzly[uzly.length - 1]!.x],
      [Math.min(...ysAll), Math.max(...ysAll)],
    );
    /* Точки разбиения отрезка [a; b]: концы, вершины, пересечения оси. */
    const bp = new Set<number>([a, b]);
    for (const u of uzly) {
      if (u.x > a && u.x < b) {
        bp.add(u.x);
      }
    }
    for (let i = 0; i < uzly.length - 1; i += 1) {
      const p0 = uzly[i] as Uzel;
      const p1 = uzly[i + 1] as Uzel;
      if (p0.y * p1.y < 0) {
        const xz = p0.x + ((p1.x - p0.x) * Math.abs(p0.y)) / (Math.abs(p0.y) + Math.abs(p1.y));
        if (xz > a && xz < b) {
          bp.add(Math.round(xz));
        }
      }
    }
    const pts = [...bp].sort((p, q) => p - q);
    const kuski: Kusok[] = [];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const u = pts[i] as number;
      const v = pts[i + 1] as number;
      kuski.push({ u, v, yu: Math.round(lomanayaY(uzly, u)), yv: Math.round(lomanayaY(uzly, v)) });
    }
    if (kuski.some((k) => k.yu === 0 && k.yv === 0) || kuski.length < 2 || kuski.length > 5) {
      return null;
    }
    const znaki = kuski.map((k) => (k.yu + k.yv > 0 ? 1 : -1));
    const ploshchadi = kuski.map((k) => ploshchadKuska(k));
    const znachenia = ploshchadi.map((p, i) => (znaki[i] as number) * p.val);
    const otvet = znachenia.reduce((s, v) => s + v, 0);
    if (otvet === 0 || Math.abs(otvet) > 40 || znachenia.length !== kuski.length) {
      return null;
    }
    const pom: Pomoshch[] = [
      { t: 'vert', x: a, podpis: d(a), shag: 1 },
      { t: 'vert', x: b, podpis: d(b), shag: 1 },
      ...pts.slice(1, -1).map((x): Pomoshch => ({ t: 'vert', x, shag: 2 })),
      ...kuski.map((k, i): Pomoshch => ({
        t: 'znak',
        x0: k.u,
        x1: k.v,
        znak: znaki[i] as 1 | -1,
        shag: 2,
      })),
    ];
    const fig: Figura = {
      rezhim: 'lomanaya',
      okno,
      podpis: 'f(x)',
      uzly,
      levyy: 'closed',
      pravyy: 'closed',
      chisla: 'vse',
      chislaY: 'vse',
      cell: razmerKletki(okno),
      pomoshch: pom,
    };
    const uslovie = `На рисунке изображён график функции $y=f(x)$. Пользуясь рисунком, вычислите $F(${d(b)})-F(${d(a)})$, где $F(x)$ — одна из первообразных функции $f(x)$.`;
    const kuskiSt = kuski
      .map(
        (k, i) =>
          `$S_{${i + 1}}$ — ${IMYA[nazvanieFigury(k)]} на $${otrezok(k.u, k.v)}$ (${(znaki[i] as number) > 0 ? 'над осью, знак «+»' : 'под осью, знак «−»'})`,
      )
      .join('; ');
    const rasch = kuski.map((_, i) => {
      const s = znaki[i] as number;
      const pl = ploshchadi[i] as { tex: string; val: number };
      return `$S_{${i + 1}}=${s > 0 ? '' : '-('}${pl.tex}${s > 0 ? '' : ')'}${s > 0 ? '' : `=-${d(pl.val)}`}$`;
    });
    const summa = sumTex(znachenia);
    const first = kuski[0] as Kusok;
    const firstZ = znaki[0] as number;
    const firstS = znachenia[0] as number;
    const absSum = ploshchadi.reduce((s, p) => s + p.val, 0);
    return sobratRu(fig, { t: 'prirashchenie', p: a, q: b }, otvet, 1, {
      uslovie,
      shagi: [
        shag(
          'Что такое $F(b)-F(a)$',
          'Приращение первообразной на отрезке равно площади фигуры под графиком $f$ на этом отрезке, взятой со знаком: «+» над осью $Ox$ и «−» под осью.',
          `Нам нужна площадь со знаком на отрезке $${otrezok(a, b)}$.`,
        ),
        shag(
          'Разбиваем на простые фигуры',
          `Режем отрезок $${otrezok(a, b)}$ по вершинам ломаной и точкам пересечения с осью $Ox$: точки $${pts.map(d).join(';\\ ')}$.`,
          `Получилось ${kuski.length} фигуры: ${kuskiSt}.`,
        ),
        shag('Площадь каждой фигуры', ...rasch),
        shag(
          'Складываем с учётом знаков',
          `$F(${d(b)})-F(${d(a)})=${kuski.map((_, i) => `S_{${i + 1}}`).join('+')}=${summa}=${d(otvet)}$`,
        ),
        shag('Ответ', `**Ответ: ${chislaOtvet(otvet)}**`),
      ],
      podskazka: [
        vopros(
          r,
          `Чему равно $F(${d(b)})-F(${d(a)})$?`,
          'Площади фигуры под графиком $f$ на $' + otrezok(a, b) + '$, взятой со знаком',
          [
            {
              tekst: `Разности $f(${d(b)})-f(${d(a)})$`,
              pochemu:
                'Это приращение самой $f$. Приращение первообразной $F$ — площадь под графиком $f$.',
            },
            {
              tekst: `Произведению $f(${d(b)})\\cdot(${d(b - a)})$`,
              pochemu:
                'Так считают площадь прямоугольника, но график $f$ на отрезке не обязан быть горизонтальным.',
            },
            {
              tekst: 'Угловому коэффициенту графика $f$',
              pochemu:
                'Угловой коэффициент — это производная, а мы идём в обратную сторону — к первообразной.',
            },
          ],
          'Приращение $F$ — площадь со знаком под графиком $f$.',
          1,
        ),
        chislovoy(
          r,
          `Чему равна площадь первой фигуры на $${otrezok(first.u, first.v)}$ вместе со знаком?`,
          firstS,
          [
            {
              v: -firstS,
              w:
                firstZ > 0
                  ? 'Фигура над осью, знак «+»: минус ставить не нужно.'
                  : 'Фигура под осью, поэтому её площадь входит со знаком «−».',
            },
            {
              v: Math.abs(firstS) * 2,
              w: 'Забыли множитель $\\dfrac12$ у треугольника или полусумму оснований у трапеции.',
            },
            {
              v: Math.abs(firstS) + (firstZ > 0 ? 1 : -1) * (first.v - first.u),
              w: 'Площадь посчитана по неверным основаниям или высоте.',
            },
          ],
          `Первая фигура даёт $${d(firstS)}$.`,
          2,
        ),
        chislovoy(
          r,
          `Чему равно $F(${d(b)})-F(${d(a)})$?`,
          otvet,
          [
            { v: -otvet, w: 'Перепутан знак итога: сверьте, какая из площадей больше.' },
            { v: absSum, w: 'Площади сложены без учёта знаков: части под осью надо вычитать.' },
            {
              v: otvet - (znachenia[znachenia.length - 1] as number),
              w: 'Последняя фигура не учтена в сумме.',
            },
          ],
          `$F(${d(b)})-F(${d(a)})=${d(otvet)}$.`,
          2,
        ),
      ],
      params: { a, b, n: kuski.length, ans: otvet },
      signature: `${podpisUzlov(fig)}|${a}|${b}`,
      vid: `k${kuski.length}`,
    });
  },
});

/* ── 9.5.5 и 9.5.6: площадь под параболой по формуле F ──────────── */

const FORMY: { a: number; w: number }[] = [
  { a: 3, w: 2 },
  { a: 3, w: 3 },
  { a: 6, w: 2 },
  { a: 1.5, w: 3 },
  { a: 1.5, w: 5 },
];

interface Parabola {
  a: number;
  alpha: number;
  beta: number;
  A: number;
  B: number;
  C: number;
  C0: number;
  uzly: Uzel[];
}

function parabola(r: Rng): Parabola {
  const f = r.pick(FORMY);
  const znak = r.next() < 0.5 ? -1 : 1;
  const a = znak * f.a;
  const alpha = r.int(-5, 1);
  const beta = alpha + f.w;
  const uzly: Uzel[] = [];
  for (let x = alpha; x <= beta; x += 1) {
    uzly.push({ x, y: a * (x - alpha) * (x - beta), m: a * (2 * x - alpha - beta) });
  }
  const C0 = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  return { a, alpha, beta, A: a / 3, B: (-a * (alpha + beta)) / 2, C: a * alpha * beta, C0, uzly };
}

/** Многочлен от x по убыванию степеней в TeX. */
function mnogochlen(terms: [number, number][]): string {
  let out = '';
  for (const [c, p] of terms) {
    if (c === 0) {
      continue;
    }
    const abs = Math.abs(c);
    const coef = p > 0 && abs === 1 ? '' : d(abs);
    const xp = p === 0 ? '' : p === 1 ? 'x' : `x^{${p}}`;
    const znak = c < 0 ? '-' : out === '' ? '' : '+';
    out += `${znak}${coef}${xp}`;
  }
  return out;
}

function Fvalue(P: Parabola, x: number): number {
  return P.A * x ** 3 + P.B * x ** 2 + P.C * x + P.C0;
}

function risunokParaboly(P: Parabola, c: number, pom: Pomoshch[]): Figura {
  const ys = P.uzly.map((u) => u.y);
  const okno = okoshko([P.alpha - 2, P.beta + 2], [Math.min(...ys, 0), Math.max(...ys, 0)], 1);
  return {
    rezhim: 'zalivka',
    okno,
    podpis: 'f(x)',
    uzly: P.uzly,
    levyy: 'none',
    pravyy: 'none',
    chisla: 'vse',
    chislaY: 'vse',
    zalivka: { a: P.alpha, b: c },
    cell: razmerKletki(okno),
    pomoshch: pom,
  };
}

/** Общая часть разбора: разность F(c) − F(α), сгруппированная. */
function raznostFTeks(P: Parabola, c: number): { stroki: string[]; delta: number } {
  const { alpha, A, B, C } = P;
  const dl = c - alpha;
  const q1 = c * c + c * alpha + alpha * alpha;
  const q2 = c + alpha;
  const inner = A * q1 + B * q2 + C;
  const delta = dl * inner;
  const sk = (x: number) => (x < 0 ? `(${d(x)})` : d(x));
  const stroki = [
    `Константа $C_0$ при вычитании сократится, поэтому: $F(${d(c)})-F(${d(alpha)})=A(c^3-\\alpha^3)+B(c^2-\\alpha^2)+C(c-\\alpha)$, где $A=${d(A)}$, $B=${d(B)}$, $C=${d(C)}$, $c=${d(c)}$, $\\alpha=${d(alpha)}$.`,
    `Выносим общий множитель $c-\\alpha=${d(c)}-${sk(alpha)}=${dl}$ (разность кубов: $c^3-\\alpha^3=(c-\\alpha)(c^2+c\\alpha+\\alpha^2)$, разность квадратов: $c^2-\\alpha^2=(c-\\alpha)(c+\\alpha)$).`,
    `В скобке: $c^2+c\\alpha+\\alpha^2=${q1}$ и $c+\\alpha=${d(q2)}$, поэтому $A\\cdot ${q1}+B\\cdot ${sk(q2)}+C=${d(A * q1)}${B * q2 < 0 ? '-' : '+'}${d(Math.abs(B * q2))}${C < 0 ? '-' : '+'}${d(Math.abs(C))}=${d(inner)}$.`,
    `$F(${d(c)})-F(${d(alpha)})=${dl}\\cdot ${sk(inner)}=${d(delta)}$.`,
  ];
  return { stroki, delta };
}

function formulaF(P: Parabola): string {
  return `F(x)=${mnogochlen([
    [P.A, 3],
    [P.B, 2],
    [P.C, 1],
    [P.C0, 0],
  ])}`;
}

function ploshchadParaboly(polnaya: boolean) {
  return (r: Rng): Draft | null => {
    const P = parabola(r);
    const { alpha, beta, a } = P;
    const w = beta - alpha;
    const c = polnaya ? beta : r.next() < 0.5 ? beta : r.int(alpha + 1, beta);
    const gorka = a < 0;
    const peak = (Math.abs(a) * (w * w)) / 4;
    if (peak > 9.5 || P.uzly.some((u) => !Number.isInteger(u.y))) {
      return null;
    }
    const { stroki, delta } = raznostFTeks(P, c);
    /* Независимая проверка формулы: ∫ a(x−α)(x−β) от α до c. */
    const dd = c - alpha;
    const forma = (a * dd * dd * (2 * dd - 3 * w)) / 6;
    if (
      Math.abs(forma - delta) > 1e-9 ||
      Math.abs(Fvalue(P, c) - Fvalue(P, alpha) - delta) > 1e-9
    ) {
      return null;
    }
    const S = Math.abs(delta);
    if (S === 0) {
      return null;
    }
    const pom: Pomoshch[] = polnaya
      ? [
          { t: 'zasechka', x: alpha, podpis: d(alpha), shag: 1 },
          { t: 'zasechka', x: beta, podpis: d(beta), shag: 1 },
          { t: 'vert', x: alpha, shag: 1 },
          { t: 'vert', x: beta, shag: 1 },
        ]
      : [
          { t: 'zasechka', x: alpha, podpis: d(alpha), shag: 1 },
          { t: 'vert', x: alpha, shag: 1 },
          { t: 'vert', x: c, shag: 2 },
        ];
    const fig = risunokParaboly(P, c, pom);
    const Fs = formulaF(P);
    const znakTeks = gorka
      ? `F(${d(c)})-F(${d(alpha)})`
      : `-\\bigl(F(${d(c)})-F(${d(alpha)})\\bigr)`;
    const uslovie = polnaya
      ? `На рисунке изображён график функции $y=f(x)$; закрашена фигура, ограниченная этим графиком и осью абсцисс. Функция $${Fs}$ — одна из первообразных функции $f(x)$. Найдите площадь закрашенной фигуры.`
      : c === beta
        ? `На рисунке изображён график функции $y=f(x)$; закрашена фигура, ограниченная этим графиком, осью абсцисс и прямой $x=${d(c)}$. Функция $${Fs}$ — одна из первообразных функции $f(x)$. Найдите площадь закрашенной фигуры.`
        : `На рисунке изображён график функции $y=f(x)$; закрашена фигура, ограниченная этим графиком, осью абсцисс и прямой $x=${d(c)}$ (слева фигура начинается там, где график выходит на ось $Ox$). Функция $${Fs}$ — одна из первообразных функции $f(x)$. Найдите площадь закрашенной фигуры.`;
    const lo = alpha;
    const hi = c;
    const shagiSt = [
      shag(
        'Границы фигуры',
        polnaya
          ? `График пересекает ось $Ox$ в точках $x=${d(alpha)}$ и $x=${d(beta)}$: это границы фигуры, $[\\alpha;\\ \\beta]=${otrezok(alpha, beta)}$.`
          : `Левая граница — точка, где график выходит на ось $Ox$: $x=${d(alpha)}$. Правая граница дана в условии: $x=${d(c)}$. Фигура лежит на отрезке $${otrezok(lo, hi)}$.`,
      ),
      shag(
        'Выбираем знак',
        gorka
          ? 'Фигура лежит над осью $Ox$, значит $f(x)\\geqslant 0$ и площадь равна $S=F(' +
              d(hi) +
              ')-F(' +
              d(lo) +
              ')$.'
          : 'Фигура лежит под осью $Ox$, значит $f(x)\\leqslant 0$ и разность $F(' +
              d(hi) +
              ')-F(' +
              d(lo) +
              ')$ отрицательна. Площадь положительна, поэтому $S=-\\bigl(F(' +
              d(hi) +
              ')-F(' +
              d(lo) +
              ')\\bigr)$.',
      ),
      shag('Считаем разность без лишних вычислений', ...stroki),
      shag('Площадь', `$S=${znakTeks}=${d(S)}$`),
      shag('Ответ', `**Ответ: ${chislaOtvet(S)}**`),
    ];
    const hodNa = gorka
      ? 'выше оси, значит $S=F(' + d(hi) + ')-F(' + d(lo) + ')$'
      : 'ниже оси, значит $S=-(F(' + d(hi) + ')-F(' + d(lo) + '))$';
    return sobratRu(fig, { t: 'prirashchenie', p: lo, q: hi }, S, gorka ? 1 : -1, {
      uslovie,
      shagi: shagiSt,
      podskazka: [
        vopros(
          r,
          `Как по первообразной найти площадь под графиком $f$ на $${otrezok(lo, hi)}$ (фигура над осью)?`,
          `$F(${d(hi)})-F(${d(lo)})$`,
          [
            {
              tekst: `$F(${d(hi)})+F(${d(lo)})$`,
              pochemu:
                'Площадь — это приращение первообразной, то есть разность значений, а не сумма.',
            },
            {
              tekst: `$f(${d(hi)})-f(${d(lo)})$`,
              pochemu: 'Это разность значений самой $f$, а не площадь под её графиком.',
            },
            {
              tekst: `$F(${d(hi)})\\cdot(${d(hi - lo)})$`,
              pochemu: 'Так считают площадь прямоугольника, а график $f$ не горизонтален.',
            },
          ],
          `$S=F(${d(hi)})-F(${d(lo)})$ для фигуры над осью.`,
          1,
        ),
        vopros(
          r,
          polnaya
            ? 'В каких точках график пересекает ось $Ox$ (границы фигуры)?'
            : 'Где левая граница закрашенной фигуры?',
          polnaya ? `$x=${d(alpha)}$ и $x=${d(beta)}$` : `$x=${d(alpha)}$`,
          polnaya
            ? [
                {
                  tekst: `$x=${d(alpha + 1)}$ и $x=${d(beta + 1)}$`,
                  pochemu: 'Границы сдвинуты на клетку: смотрите, где график ровно на оси.',
                },
                {
                  tekst: `$x=${d(alpha - 1)}$ и $x=${d(beta)}$`,
                  pochemu: 'Левая граница сдвинута на клетку.',
                },
                {
                  tekst: `$x=${d(alpha)}$ и $x=${d(beta - 1)}$`,
                  pochemu: 'Правая граница сдвинута на клетку.',
                },
              ]
            : [
                {
                  tekst: `$x=${d(alpha + 1)}$`,
                  pochemu:
                    'Здесь график уже над (под) осью, а фигура начинается там, где он выходит на ось.',
                },
                {
                  tekst: `$x=${d(alpha - 1)}$`,
                  pochemu: 'Левее фигуры нет: её граница на клетку правее.',
                },
                { tekst: '$x=0$', pochemu: 'Ось $Oy$ не является границей фигуры.' },
              ],
          polnaya
            ? `Границы: $x=${d(alpha)}$ и $x=${d(beta)}$.`
            : `Левая граница: $x=${d(alpha)}$.`,
          1,
        ),
        vopros(
          r,
          'Где расположена фигура и какое выражение даёт её площадь?',
          gorka
            ? `Над осью: $S=F(${d(hi)})-F(${d(lo)})$`
            : `Под осью: $S=-\\bigl(F(${d(hi)})-F(${d(lo)})\\bigr)$`,
          [
            {
              tekst: gorka
                ? `Под осью: $S=-\\bigl(F(${d(hi)})-F(${d(lo)})\\bigr)$`
                : `Над осью: $S=F(${d(hi)})-F(${d(lo)})$`,
              pochemu: gorka
                ? 'Фигура выше оси, там $f>0$, и разность $F(' +
                  d(hi) +
                  ')-F(' +
                  d(lo) +
                  ')$ положительна.'
                : 'Фигура ниже оси: разность $F(' +
                  d(hi) +
                  ')-F(' +
                  d(lo) +
                  ')$ отрицательна, а площадь не может быть отрицательной.',
            },
            {
              tekst: `Всегда $S=F(${d(lo)})-F(${d(hi)})$`,
              pochemu: 'Знак зависит от расположения фигуры относительно оси, а не фиксирован.',
            },
          ],
          `Фигура ${hodNa}.`,
          2,
        ),
        chislovoy(
          r,
          `Чему равна разность $F(${d(hi)})-F(${d(lo)})$?`,
          delta,
          [
            {
              v: -delta,
              w: 'Знак разности перепутан: найдите значения $F$ в обеих точках и вычтите из большего номера меньший.',
            },
            {
              v: delta + P.C0,
              w: 'Константа $C_0$ при вычитании сокращается и в ответ не входит.',
            },
            { v: Fvalue(P, hi) + Fvalue(P, lo), w: 'Вместо разности найдена сумма значений $F$.' },
          ],
          `Разность равна $${d(delta)}$${gorka ? '' : ', площадь — число, противоположное ей'}.`,
          2,
        ),
      ],
      params: { alpha, beta, c, a, C0: P.C0, S },
      signature: `${a}|${alpha}|${beta}|${c}|${P.C0}`,
      vid: `a${a}w${w}${c === beta ? 'p' : 'q'}`,
    });
  };
}

const P955 = proto({
  id: '9.5.5',
  gruppa: 'V',
  nazvanie: 'Площадь фигуры под параболой по первообразной: одна граница по рисунку',
  kratko: 'Площадь по $F$: левая граница по рисунку',
  risunok: true,
  generate: ploshchadParaboly(false),
});

const P956 = proto({
  id: '9.5.6',
  gruppa: 'V',
  nazvanie: 'Площадь фигуры между параболой и осью по первообразной: обе границы по рисунку',
  kratko: 'Площадь по $F$: обе границы по рисунку',
  risunok: true,
  generate: ploshchadParaboly(true),
});

export const PERVOOBRAZNAYA = [P951, P952, P953, P954, P955, P956];
