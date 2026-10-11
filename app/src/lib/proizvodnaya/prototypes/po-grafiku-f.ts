/**
 * Группа III. Производная по графику функции f.
 *
 *   9.3.1 — в скольких отмеченных точках производная положительна;
 *   9.3.2 — в скольких отмеченных точках производная отрицательна;
 *   9.3.3 — сколько целых точек интервала, где производная положительна;
 *   9.3.4 — то же, где отрицательна;
 *   9.3.5 — сколько точек, в которых производная равна нулю;
 *   9.3.6 — точка отрезка, в которой производная равна нулю.
 *
 * Рисунок — волна из krivye.volna: экстремумы в целых узлах, между
 * ними график строго монотонен. Знак производной в целой точке берётся
 * из узлов (chtenie.ts), а sobrat() пересчитывает ответ независимо.
 */

import type { Rng } from '../../veroyatnost/generator';
import { chislaOtvet } from '../otvet';
import { ekstremumyUzlov, vybratMetki, znakProizvodnoy } from '../chtenie';
import { figura, volna } from '../krivye';
import { postroit } from '../spline';
import { d, interval, otrezok } from '../tex';
import type { Draft, Figura, Pomoshch, Uzel } from '../types';
import { grafikF, metkiTekst } from '../uslovie';
import { podpisUzlov, proto, shag, sobrat, vopros } from './common';
import type { Nevernyy } from './common';
import {
  bezPolok,
  celevoy,
  krutyeKoncy,
  intervalShiriny,
  neverniyeChisla,
  ploskoe,
  razbrosat,
  sdvigPod,
  sdvinut,
  promezhutki,
  skobki,
  xSpisok,
  znakiPomoshch,
} from './chtenie-pom';

const MINUS = '−';

/** Подпись «+» или «−» у точки графика. */
function glif(s: number): string {
  return s > 0 ? '+' : MINUS;
}

/** Неверные варианты-списки: гарантируем не меньше двух отличных от верного. */
function varSpiska(
  verno: string,
  kandidaty: readonly Nevernyy[],
  zapas: readonly Nevernyy[],
): Nevernyy[] {
  const out: Nevernyy[] = [];
  const seen = new Set<string>([verno]);
  for (const c of [...kandidaty, ...zapas]) {
    if (!seen.has(c.tekst)) {
      seen.add(c.tekst);
      out.push(c);
    }
  }
  return out.slice(0, 3);
}

/* ── 9.3.1 и 9.3.2 ───────────────────────────────────────────────── */

const FORMULIROVKI_METKI: Record<'1' | '-1', string[]> = {
  '1': [
    'В скольких из этих точек производная функции $f(x)$ положительна?',
    'Сколько среди отмеченных точек таких, в которых производная функции $f(x)$ положительна?',
    "Найдите количество отмеченных точек, в которых $f'(x)>0$.",
  ],
  '-1': [
    'В скольких из этих точек производная функции $f(x)$ отрицательна?',
    'Сколько среди отмеченных точек таких, в которых производная функции $f(x)$ отрицательна?',
    "Найдите количество отмеченных точек, в которых $f'(x)<0$.",
  ],
};

function znakVMetkah(id: string, znak: 1 | -1) {
  const pol = znak > 0;
  return proto({
    id,
    gruppa: 'III',
    nazvanie: pol
      ? 'Сколько отмеченных точек, в которых производная положительна'
      : 'Сколько отмеченных точек, в которых производная отрицательна',
    kratko: pol ? "В скольких точках $f'>0$" : "В скольких точках $f'<0$",
    risunok: true,
    generate(r: Rng): Draft | null {
      /* Сначала ответ k (равномерно), потом число отмеченных точек n и рисунок под них. */
      const k = celevoy(r, 1, 7);
      const n = k + r.int(k <= 2 ? 2 : 1, Math.min(4, 10 - k));
      for (let popytka = 0; popytka < 150; popytka += 1) {
        const draft = postroitZnak(r, k, n);
        if (draft !== null) {
          return draft;
        }
      }
      return null;
    },
  });

  function postroitZnak(r: Rng, k: number, n: number): Draft | null {
    const shirina = r.int(Math.min(17, Math.max(10, n + 6)), 17);
    const { a, b } = intervalShiriny(r, shirina);
    /* Много точек одного знака — нужны крутые участки: больше вершин, выше размах. */
    const mnogo = k >= 6;
    const nE = mnogo ? r.int(3, 4) : r.int(1, Math.max(2, Math.floor(shirina / 5)));
    const tochki = razbrosat(r, a + 2, b - 2, nE, 3);
    if (tochki === null) {
      return null;
    }
    const w = volna(r, {
      n: [nE, nE],
      a: [a, a],
      b: [b, b],
      shirina: [shirina, shirina],
      vysota: mnogo ? [2, 5] : [2, 4],
      tochki,
    });
    if (w !== null) {
      krutyeKoncy(w.uzly);
    }
    if (w === null || ploskoe(w.uzly) || !bezPolok(w.uzly, 0.3)) {
      return null;
    }
    const spl = postroit(w.uzly);
    const exs = new Set(ekstremumyUzlov(w.uzly).map((e) => e.x));
    const podhodit = (s: number) => (x: number) =>
      x !== 0 &&
      !exs.has(x) &&
      znakProizvodnoy(w.uzly, x) === s &&
      Math.abs(spl.dy(x)) >= 0.55 &&
      Math.abs(spl.y(x)) >= 0.5;
    /* Сколько точек каждого знака доступно: от этого зависят n и k. */
    let nuzhP = 0;
    let prochP = 0;
    for (let x = w.a + 1; x < w.b; x += 1) {
      nuzhP += podhodit(znak)(x) ? 1 : 0;
      prochP += podhodit(-znak)(x) ? 1 : 0;
    }
    if (nuzhP < k || prochP < n - k) {
      return null;
    }
    const nuzhnye = vybratMetki(r, w.a, w.b, k, podhodit(znak));
    if (nuzhnye === null) {
      return null;
    }
    const ostalnye = vybratMetki(
      r,
      w.a,
      w.b,
      n - k,
      (x) => podhodit(-znak)(x) && !nuzhnye.includes(x),
    );
    if (ostalnye === null) {
      return null;
    }
    const metki = [...nuzhnye, ...ostalnye].sort((p, q) => p - q);
    const sg = metki.map((x) => znakProizvodnoy(w.uzly, x));
    const idxNuzh = sg.map((s, i) => (s === znak ? i : -1)).filter((i) => i >= 0);
    const idxProch = sg.map((s, i) => (s === -znak ? i : -1)).filter((i) => i >= 0);
    /* Ловушка: знак самой функции (график выше или ниже оси Ox). */
    const idxOs = metki
      .map((x, i) => ((znak > 0 ? spl.y(x) > 0.2 : spl.y(x) < -0.2) ? i : -1))
      .filter((i) => i >= 0);
    const fig: Figura = figura('f', 'f(x)', w.uzly, {
      metki,
      pomoshch: [
        ...metki.map((x): Pomoshch => ({ t: 'vert', x, shag: 1 })),
        ...metki.map((x, i): Pomoshch => ({
          t: 'tochka',
          x,
          y: spl.y(x),
          podpis: glif(sg[i] as number),
          shag: 2,
        })),
      ],
    });
    const variant = r.int(0, 2);
    const vopr = (FORMULIROVKI_METKI[pol ? '1' : '-1'] as string[])[variant] as string;
    const uslovie = `${grafikF(w.a, w.b)} ${metkiTekst(n)} ${vopr}`;
    const vverh = pol ? 'вверх' : 'вниз';
    const vniz = pol ? 'вниз' : 'вверх';
    const znakStr = pol ? '>' : '<';
    const sosed = (rows: number[]) => rows.map((i) => `$x_{${i + 1}}$`).join(', ');
    const vozrIdx = sg.map((s, i) => (s > 0 ? i : -1)).filter((i) => i >= 0);
    const ubIdx = sg.map((s, i) => (s < 0 ? i : -1)).filter((i) => i >= 0);
    const first = sg[0] as number;
    return sobrat(fig, { t: 'znak-v-metkah', znak }, k, {
      uslovie,
      shagi: [
        shag(
          'Что значит знак производной',
          "Знак производной показывает, куда идёт график функции (слева направо): если $f'(x)>0$, график идёт вверх, функция возрастает; если $f'(x)<0$ — вниз, функция убывает.",
          'Положение точки относительно оси $Ox$ здесь ни при чём: оно задаёт знак самой функции $f(x)$, а не её производной.',
        ),
        shag(
          'Смотрим на график около каждой отмеченной точки',
          `Идём слева направо. График идёт вверх около точек ${sosed(vozrIdx) || '—'}: там $f'(x)>0$.`,
          `График идёт вниз около точек ${sosed(ubIdx) || '—'}: там $f'(x)<0$.`,
          'Отмеченных точек, где касательная горизонтальна (вершины «горок» и «ямок»), среди них нет.',
        ),
        shag(
          'Отбираем нужные точки',
          `Нужны точки, где производная ${pol ? 'положительна' : 'отрицательна'}: график идёт ${vverh}. Это ${sosed(idxNuzh)}.`,
          `Их количество: $${k}$. Проверка: $${k}+${n - k}=${n}$ — все отмеченные точки учтены.`,
        ),
        shag('Ответ', `**Ответ: ${k}**`),
      ],
      podskazka: [
        vopros(
          r,
          `Что означает $f'(x_i)${znakStr}0$ для графика функции $f$ около точки $x_i$?`,
          `График идёт ${vverh} (слева направо)`,
          [
            {
              tekst: `График лежит ${pol ? 'выше' : 'ниже'} оси $Ox$`,
              pochemu: `Это про знак самой функции: $f(x)${znakStr}0$. Знак производной показывает не положение точки, а направление графика.`,
            },
            {
              tekst: `График идёт ${vniz}`,
              pochemu: `Так идёт график, когда производная ${pol ? 'отрицательна' : 'положительна'}.`,
            },
            {
              tekst: 'Около точки график горизонтален',
              pochemu:
                "Горизонтальная касательная означает $f'(x_i)=0$, а не знак «больше» или «меньше».",
            },
          ],
          `$f'(x_i)${znakStr}0$ — график около $x_i$ идёт ${vverh}.`,
        ),
        vopros(
          r,
          `Куда идёт график около точки $x_1$ (слева направо)?`,
          first > 0 ? 'Вверх' : 'Вниз',
          [
            {
              tekst: first > 0 ? 'Вниз' : 'Вверх',
              pochemu:
                first > 0
                  ? 'Около $x_1$ график поднимается: смотрите на пунктир и на соседние участки.'
                  : 'Около $x_1$ график опускается: смотрите на пунктир и на соседние участки.',
            },
            {
              tekst: 'Горизонтально',
              pochemu: 'Горизонтально график идёт только на вершинах, а $x_1$ — не вершина.',
            },
          ],
          first > 0
            ? "Около $x_1$ график идёт вверх, $f'(x_1)>0$."
            : "Около $x_1$ график идёт вниз, $f'(x_1)<0$.",
          1,
        ),
        vopros(
          r,
          `В каких отмеченных точках график ${pol ? 'идёт вверх' : 'идёт вниз'}?`,
          xSpisok(idxNuzh),
          varSpiska(
            xSpisok(idxNuzh),
            [
              {
                tekst: xSpisok(idxProch),
                pochemu: `В этих точках график идёт ${vniz}: производная там ${pol ? 'отрицательна' : 'положительна'}.`,
              },
              {
                tekst: xSpisok(idxOs),
                pochemu: `Это точки, где график лежит ${pol ? 'выше' : 'ниже'} оси $Ox$, то есть знак функции, а не производной.`,
              },
            ],
            [
              {
                tekst: xSpisok(idxNuzh.slice(1)),
                pochemu:
                  'Одна подходящая точка пропущена: проверьте направление графика около каждой точки.',
              },
              {
                tekst: xSpisok([...idxNuzh, ...idxProch.slice(0, 1)].sort((p, q) => p - q)),
                pochemu: 'В список попала лишняя точка, где график идёт в другую сторону.',
              },
            ],
          ),
          `Нужные точки: ${xSpisok(idxNuzh)}.`,
          2,
        ),
        vopros(
          r,
          'Сколько таких точек?',
          `$${k}$`,
          neverniyeChisla(
            k,
            [
              {
                v: n - k,
                w: `Посчитаны точки противоположного знака: их $${n - k}$, а нужны другие.`,
              },
              ...(idxOs.length !== k && idxOs.length > 0
                ? [
                    {
                      v: idxOs.length,
                      w: 'Посчитаны точки, где график выше (ниже) оси $Ox$, — это знак функции, а не производной.',
                    },
                  ]
                : []),
            ],
            1,
          ),
          `Таких точек $${k}$.`,
          2,
        ),
      ],
      params: { n, k, a: w.a, b: w.b, znak },
      signature: podpisUzlov(fig),
      vid: `v${variant}n${n}`,
    });
  }
}

const P931 = znakVMetkah('9.3.1', 1);
const P932 = znakVMetkah('9.3.2', -1);

/* ── 9.3.3 и 9.3.4 ───────────────────────────────────────────────── */

const FORMULIROVKI_CELYE: Record<'1' | '-1', string[]> = {
  '1': [
    'Найдите количество целых точек из этого интервала, в которых производная функции $f(x)$ положительна.',
    'Сколько целых точек интервала, в которых производная функции $f(x)$ положительна?',
    "Определите количество целых точек из интервала, в которых $f'(x)>0$.",
  ],
  '-1': [
    'Найдите количество целых точек из этого интервала, в которых производная функции $f(x)$ отрицательна.',
    'Сколько целых точек интервала, в которых производная функции $f(x)$ отрицательна?',
    "Определите количество целых точек из интервала, в которых $f'(x)<0$.",
  ],
};

function celyeZnak(id: string, znak: 1 | -1) {
  const pol = znak > 0;
  return proto({
    id,
    gruppa: 'III',
    nazvanie: pol
      ? 'Количество целых точек интервала, в которых производная положительна'
      : 'Количество целых точек интервала, в которых производная отрицательна',
    kratko: pol ? "Целые точки, где $f'>0$" : "Целые точки, где $f'<0$",
    risunok: true,
    generate(r: Rng): Draft | null {
      /* Сначала ответ (равномерно), потом волны, пока счёт не совпадёт: подбор дешёвый,
         рисунок проверяется только у совпавших. */
      const cel = celevoy(r, 1, 13);
      for (let popytka = 0; popytka < 1000; popytka += 1) {
        const draft = postroitCelye(r, cel);
        if (draft !== null) {
          return draft;
        }
      }
      return null;
    },
  });

  function postroitCelye(r: Rng, cel: number): Draft | null {
    /* Много целых точек одного знака — длинные участки: им нужен больший размах. */
    const w = volna(r, { n: [1, 5], shag: r.int(2, 3), vysota: cel >= 8 ? [3, 4] : [1, 4] });
    if (w !== null) {
      krutyeKoncy(w.uzly);
    }
    if (w === null || ploskoe(w.uzly) || !bezPolok(w.uzly, 0.3)) {
      return null;
    }
    const exs = ekstremumyUzlov(w.uzly);
    const granicy = [w.a, ...exs.map((e) => e.x), w.b];
    const ps = promezhutki(granicy, (m) => znakProizvodnoy(w.uzly, m));
    /* Целые точки: по знаку производной на промежутках (экстремумы дают нуль). */
    let k = 0;
    let drugih = 0;
    for (const p of ps) {
      const cnt = p.hi - p.lo - 1;
      if (p.znak === znak) {
        k += cnt;
      } else {
        drugih += cnt;
      }
    }
    const vsego = w.b - w.a - 1;
    if (k !== cel || drugih < 1) {
      return null;
    }
    const fig: Figura = figura('f', 'f(x)', w.uzly, {
      pomoshch: [
        ...exs.map((e): Pomoshch => ({ t: 'vert', x: e.x, podpis: d(e.x), shag: 1 })),
        ...znakiPomoshch(ps, 2),
      ],
    });
    const variant = r.int(0, 2);
    const uslovie = `${grafikF(w.a, w.b)} ${(FORMULIROVKI_CELYE[pol ? '1' : '-1'] as string[])[variant] as string}`;
    const vverh = pol ? 'вверх' : 'вниз';
    const znakStr = pol ? '>' : '<';
    const stroki = ps.map((p) => {
      const cnt = p.hi - p.lo - 1;
      const sgnStr = p.znak > 0 ? "идёт вверх, $f'(x)>0$" : "идёт вниз, $f'(x)<0$";
      return `$${interval(p.lo, p.hi)}$: график ${sgnStr}; целых точек внутри $${cnt}$.`.replace(
        'целых точек внутри $0$',
        'целых точек внутри нет',
      );
    });
    const nuzhnye = ps.filter((p) => p.znak === znak);
    const schet = nuzhnye.map((p) => {
      const cnt = p.hi - p.lo - 1;
      if (cnt === 0) {
        return `$${interval(p.lo, p.hi)}$: между $${d(p.lo)}$ и $${d(p.hi)}$ целых чисел нет.`;
      }
      const spisok =
        cnt <= 6
          ? ` Это ${Array.from({ length: cnt }, (_, i) => `$${d(p.lo + 1 + i)}$`).join(', ')}.`
          : '';
      return `$${interval(p.lo, p.hi)}$: $${d(p.hi)}-${skobki(p.lo)}-1=${cnt}$.${spisok}`;
    });
    const slag = nuzhnye.map((p) => p.hi - p.lo - 1);
    const summa = slag.length > 1 ? `Всего: $${slag.join('+')}=${k}$.` : `Всего: $${k}$.`;
    const exSpisok = exs.map((e) => e.x);
    const pervyZnak = (ps[0] as { znak: number }).znak;
    return sobrat(fig, { t: 'celye-znak', znak }, k, {
      uslovie,
      shagi: [
        shag(
          'Что значит знак производной',
          `Если $f'(x)${znakStr}0$, график функции идёт ${vverh}. В точках экстремума (вершины «горок» и «ямок») касательная горизонтальна и $f'(x)=0$: эти точки не подходят ни под «положительна», ни под «отрицательна».`,
        ),
        shag(
          'Делим интервал на промежутки монотонности',
          `Экстремумы находятся при $x=${exSpisok.map((x) => d(x)).join('$, $x=')}$. Они делят интервал $${interval(w.a, w.b)}$ на промежутки; концы интервала выколоты.`,
          ...stroki,
        ),
        shag(
          'Считаем целые точки на нужных промежутках',
          `Нужны промежутки, где график идёт ${vverh}. Целых чисел строго между $m$ и $n$ ровно $n-m-1$.`,
          ...schet,
          summa,
        ),
        shag(
          'Проверка',
          `Всего целых точек в интервале: $${d(w.b)}-${skobki(w.a)}-1=${vsego}$. Из них $${exs.length}$ — точки экстремума (производная равна нулю), ещё $${drugih}$ — с производной другого знака, и $${k}$ — нужные: $${exs.length}+${drugih}+${k}=${vsego}$.`,
        ),
        shag('Ответ', `**Ответ: ${k}**`),
      ],
      podskazka: [
        vopros(
          r,
          `Какие точки графика не подходят ни под «производная положительна», ни под «производная отрицательна»?`,
          'Вершины «горок» и «ямок» (точки экстремума)',
          [
            {
              tekst: 'Точки пересечения графика с осью $Ox$',
              pochemu:
                "В них нулю равна сама функция $f(x)$, а производная $f'(x)$ там может быть любого знака.",
            },
            {
              tekst: 'Концы интервала',
              pochemu:
                'Концы интервала выколоты: они не входят в рассматриваемые точки, но дело не в них — важны вершины, где касательная горизонтальна.',
            },
          ],
          "В вершинах $f'(x)=0$: их считать не нужно.",
        ),
        vopros(
          r,
          `Где график функции идёт ${vverh}? Выберите промежуток.`,
          `$${interval((nuzhnye[0] as { lo: number; hi: number }).lo, (nuzhnye[0] as { lo: number; hi: number }).hi)}$`,
          [
            ...ps
              .filter((p) => p.znak !== znak)
              .slice(0, 2)
              .map((p) => ({
                tekst: `$${interval(p.lo, p.hi)}$`,
                pochemu: `Здесь график идёт ${pol ? 'вниз' : 'вверх'}: производная ${pol ? 'отрицательна' : 'положительна'}.`,
              })),
            {
              tekst: `$${interval(w.a, w.b)}$`,
              pochemu:
                'Это весь интервал, а график идёт в разные стороны: на части интервала вверх, на части вниз.',
            },
          ],
          `Один из нужных промежутков — $${interval((nuzhnye[0] as { lo: number; hi: number }).lo, (nuzhnye[0] as { lo: number; hi: number }).hi)}$.`,
          1,
        ),
        vopros(
          r,
          'Сколько целых чисел лежит строго между двумя соседними экстремумами, расстояние между которыми равно $m$?',
          '$m-1$',
          [
            {
              tekst: '$m$',
              pochemu:
                'Так считаются клетки между точками, а целых чисел строго между ними на одно меньше: сами вершины не входят.',
            },
            {
              tekst: '$m+1$',
              pochemu:
                'Так считаются целые числа вместе с обоими концами; вершины не считаются, их производная равна нулю.',
            },
          ],
          'Строго между $m$ и $n$ целых чисел $n-m-1$.',
          2,
        ),
        vopros(
          r,
          'Сколько всего целых точек нужного знака?',
          `$${k}$`,
          neverniyeChisla(
            k,
            [
              { v: drugih, w: `Посчитаны целые точки противоположного знака: их $${drugih}$.` },
              {
                v: k + exs.length,
                w: `Добавлены точки экстремума ($${exs.length}$): в них производная равна нулю.`,
              },
              { v: vsego, w: 'Посчитаны все целые точки интервала, без отбора по знаку.' },
            ],
            1,
          ),
          `Нужных целых точек $${k}$.`,
          2,
        ),
      ],
      params: { a: w.a, b: w.b, k, drugih, n: exs.length, znak },
      signature: podpisUzlov(fig) + `|${znak}`,
      vid: `v${variant}e${exs.length}${pervyZnak > 0 ? 'u' : 'd'}`,
    });
  }
}

const P933 = celyeZnak('9.3.3', 1);
const P934 = celyeZnak('9.3.4', -1);

/* ── 9.3.5: число точек, где производная равна нулю ─────────────── */

const FORMULIROVKI_NULI = [
  'Найдите количество точек, в которых производная функции $f(x)$ равна $0$.',
  'Сколько точек, в которых производная функции $f(x)$ равна нулю, на этом интервале?',
  "Определите количество решений уравнения $f'(x)=0$ на интервале.",
];

const P935 = proto({
  id: '9.3.5',
  gruppa: 'III',
  nazvanie: 'Количество точек, в которых производная равна нулю',
  kratko: "Сколько точек, где $f'=0$",
  risunok: true,
  generate(r: Rng): Draft | null {
    /* Сначала ответ — число вершин (равномерно), потом ширина и рисунок под него. */
    const cel = celevoy(r, 1, 7);
    for (let popytka = 0; popytka < 40; popytka += 1) {
      const draft = nuliPodCel(r, cel);
      if (draft !== null) {
        return draft;
      }
    }
    return null;
  },
});

function nuliPodCel(r: Rng, cel: number): Draft | null {
  const shirina = r.int(Math.max(8, 2 * cel + 2), 17);
  const { a, b } = intervalShiriny(r, shirina);
  const tochki = razbrosat(r, a + 2, b - 2, cel, 2);
  if (tochki === null) {
    return null;
  }
  const w = volna(r, {
    n: [cel, cel],
    a: [a, a],
    b: [b, b],
    shirina: [shirina, shirina],
    tochki,
  });
  if (w !== null) {
    krutyeKoncy(w.uzly);
  }
  if (w === null || ploskoe(w.uzly) || !bezPolok(w.uzly, 0.3)) {
    return null;
  }
  const exs = ekstremumyUzlov(w.uzly);
  const n = exs.length;
  if (n !== cel) {
    return null;
  }
  const nmax = exs.filter((e) => e.tip === 'max').length;
  const nmin = n - nmax;
  const fig: Figura = figura('f', 'f(x)', w.uzly, {
    pomoshch: [
      ...exs.map((e): Pomoshch => ({
        t: 'tochka',
        x: e.x,
        y: (w.uzly.find((u) => u.x === e.x) as Uzel).y,
        shag: 1,
      })),
      ...exs.map((e): Pomoshch => ({ t: 'vert', x: e.x, podpis: d(e.x), shag: 2 })),
    ],
  });
  const variant = r.int(0, 2);
  const uslovie = `${grafikF(w.a, w.b)} ${FORMULIROVKI_NULI[variant] as string}`;
  return sobrat(fig, { t: 'chislo-nuley' }, n, {
    uslovie,
    shagi: [
      shag(
        'Когда производная равна нулю',
        "Производная в точке равна угловому коэффициенту касательной. Значит, $f'(x)=0$ там, где касательная к графику горизонтальна.",
      ),
      shag(
        'Где касательная горизонтальна',
        'График плавный, без изломов. Касательная горизонтальна только на вершинах: на вершинах «горок» (точки максимума) и на дне «ямок» (точки минимума). Там, где график поднимается или опускается, касательная наклонна.',
      ),
      shag(
        'Считаем вершины',
        `Вершин-«горок» на графике: $${nmax}$, «ямок»: $${nmin}$. Они расположены при $x=${exs.map((e) => d(e.x)).join('$, $x=')}$.`,
        'Концы интервала выколоты и в подсчёт не входят.',
        `Всего: $${nmax}+${nmin}=${n}$.`,
      ),
      shag('Ответ', `**Ответ: ${n}**`),
    ],
    podskazka: [
      vopros(
        r,
        'Чему равна производная в точке, где касательная к графику горизонтальна?',
        '$0$',
        [
          {
            tekst: '$1$',
            pochemu:
              'Производная $1$ — это касательная под углом $45^\\circ$, а не горизонтальная.',
          },
          {
            tekst: 'Производной в такой точке нет',
            pochemu: 'Горизонтальная касательная существует, её угловой коэффициент равен нулю.',
          },
        ],
        "Горизонтальная касательная: $f'(x)=0$.",
      ),
      vopros(
        r,
        'Где на этом графике касательная горизонтальна?',
        'На вершинах «горок» и «ямок»',
        [
          {
            tekst: 'В точках пересечения графика с осью $Ox$',
            pochemu: 'В этих точках равна нулю сама функция $f(x)$, а не производная.',
          },
          {
            tekst: 'Там, где график идёт круче всего',
            pochemu: 'Там касательная как раз сильнее всего наклонена, а не горизонтальна.',
          },
        ],
        'Горизонтальна касательная в точках максимума и минимума.',
        1,
      ),
      vopros(
        r,
        'Сколько вершин-«горок» и «ямок» на графике всего?',
        `$${n}$`,
        neverniyeChisla(
          n,
          [
            {
              v: n + 2,
              w: 'Добавлены концы графика, но концы интервала выколоты, и касательная в них не рассматривается.',
            },
            {
              v: nmax,
              w: 'Посчитаны только «горки»; на дне «ямок» касательная тоже горизонтальна.',
            },
            {
              v: nmin,
              w: 'Посчитаны только «ямки»; на вершинах «горок» касательная тоже горизонтальна.',
            },
          ],
          1,
        ),
        `Вершин всего $${n}$.`,
        2,
      ),
    ],
    params: { a: w.a, b: w.b, n, nmax, nmin },
    signature: podpisUzlov(fig),
    vid: `v${variant}n${n}`,
  });
}

/* ── 9.3.6: точка отрезка, где производная равна нулю ───────────── */

const P936 = proto({
  id: '9.3.6',
  gruppa: 'III',
  nazvanie: 'Точка отрезка, в которой производная равна нулю',
  kratko: "Точка отрезка, где $f'=0$",
  risunok: true,
  generate(r: Rng): Draft | null {
    /* Сначала ответ (равномерно), потом рисунок, сдвинутый так, чтобы вершина попала в него. */
    const cel = celevoy(r, -8, 8);
    for (let popytka = 0; popytka < 150; popytka += 1) {
      const draft = nulNaOtrezke(r, cel);
      if (draft !== null) {
        return draft;
      }
    }
    return null;
  },
});

function nulNaOtrezke(r: Rng, cel: number): Draft | null {
  const w0 = volna(r, { n: [2, 5], shag: r.int(2, 3) });
  if (w0 !== null) {
    krutyeKoncy(w0.uzly);
  }
  if (w0 === null || ploskoe(w0.uzly) || !bezPolok(w0.uzly, 0.3)) {
    return null;
  }
  const e0 = r.pick(ekstremumyUzlov(w0.uzly).map((z) => z.x));
  const s = sdvigPod(cel, e0, w0.a, w0.b);
  if (s === null) {
    return null;
  }
  const w = { ...w0, uzly: sdvinut(w0.uzly, s), a: w0.a + s, b: w0.b + s };
  const exs = ekstremumyUzlov(w.uzly);
  const xs = exs.map((z) => z.x);
  const e = e0 + s;
  const p = e - r.int(1, 3);
  const q = e + r.int(1, 3);
  if (p <= w.a || q >= w.b || q - p < 3) {
    return null;
  }
  if (xs.filter((x) => x >= p && x <= q).length !== 1) {
    return null;
  }
  const prochie = xs.filter((x) => x < p || x > q);
  const fig: Figura = figura('f', 'f(x)', w.uzly, {
    pomoshch: [
      { t: 'otrezok', p, q, shag: 1 },
      ...xs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
    ],
  });
  const variant = r.int(0, 2);
  const vopr = [
    `Найдите точку отрезка $${otrezok(p, q)}$, в которой производная функции $f(x)$ равна $0$.`,
    `В какой точке отрезка $${otrezok(p, q)}$ производная функции $f(x)$ равна нулю?`,
    `Найдите абсциссу точки отрезка $${otrezok(p, q)}$, в которой касательная к графику функции $f(x)$ горизонтальна.`,
  ][variant] as string;
  return sobrat(fig, { t: 'nul-na-otrezke', p, q }, e, {
    uslovie: `${grafikF(w.a, w.b)} ${vopr}`,
    shagi: [
      shag(
        'Когда производная равна нулю',
        "Производная в точке — угловой коэффициент касательной. $f'(x)=0$ там, где касательная горизонтальна, то есть на вершинах «горок» и «ямок».",
      ),
      shag(
        'Находим вершины на графике',
        `Вершины графика расположены при $x=${xs.map((x) => d(x)).join('$, $x=')}$.`,
      ),
      shag(
        'Отбираем вершину из отрезка',
        `Отрезок $${otrezok(p, q)}$ содержит только вершину $x=${d(e)}$: $${d(p)}<${d(e)}<${d(q)}$.`,
        `Остальные вершины ($${prochie.map((x) => d(x)).join('$, $')}$) лежат вне отрезка.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(e)}**`),
    ],
    podskazka: [
      vopros(
        r,
        "Какая касательная соответствует условию $f'(x)=0$?",
        'Горизонтальная',
        [
          {
            tekst: 'Вертикальная',
            pochemu:
              'У вертикальной прямой нет углового коэффициента: у графика функции такой касательной не бывает.',
          },
          {
            tekst: 'Проходящая через начало координат',
            pochemu: 'Это про место прямой, а не про её наклон; производная показывает наклон.',
          },
        ],
        "$f'(x)=0$ — касательная горизонтальна.",
      ),
      vopros(
        r,
        'В каких точках графика касательная горизонтальна?',
        'На вершинах «горок» и «ямок»',
        [
          {
            tekst: 'В точках пересечения с осью $Ox$',
            pochemu: 'Там график пересекает ось, наклон при этом произвольный.',
          },
          {
            tekst: 'В самой левой и самой правой точках графика',
            pochemu: 'Концы графика выколоты, а их наклон ничем не выделен.',
          },
        ],
        'Горизонтальную касательную даёт вершина.',
        1,
      ),
      vopros(
        r,
        `Какая вершина лежит внутри отрезка $${otrezok(p, q)}$?`,
        `$x=${d(e)}$`,
        [
          ...prochie.slice(0, 2).map((x) => ({
            tekst: `$x=${d(x)}$`,
            pochemu: `Это тоже вершина графика, но она вне отрезка $${otrezok(p, q)}$: условие требует точку из отрезка.`,
          })),
          {
            tekst: `$x=${d(p)}$`,
            pochemu:
              'Это левый конец отрезка, но в нём график не имеет вершины: касательная там наклонна.',
          },
          {
            tekst: `$x=${d(q)}$`,
            pochemu:
              'Это правый конец отрезка, но в нём график не имеет вершины: касательная там наклонна.',
          },
        ].slice(0, 3),
        `В отрезок попадает вершина $x=${d(e)}$.`,
        2,
      ),
    ],
    params: { a: w.a, b: w.b, p, q, e, n: xs.length },
    signature: podpisUzlov(fig) + `|${p}|${q}`,
    vid: `v${variant}n${xs.length}`,
  });
}

export const PO_GRAFIKU_F = [P931, P932, P933, P934, P935, P936];
