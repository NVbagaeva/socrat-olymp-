/**
 * Группа II. Геометрический смысл производной и касательная.
 *
 *   9.2.1 — f′(x₀) по графику f и касательной (через tg α);
 *   9.2.2 — по графику f′: точка отрезка, где касательная параллельна Ox;
 *   9.2.3 — по графику f′: абсцисса, где касательная параллельна прямой;
 *   9.2.4 — по графику f′: сколько точек, где касательная параллельна прямой;
 *   9.2.5 — по графику f: в какой отмеченной точке f′ наибольшая;
 *   9.2.6 — по графику f: в какой отмеченной точке f′ наименьшая;
 *   9.2.7 — параметр c, при котором прямая — касательная (аналитически).
 *
 * Это эталонный файл группы: рисунок строится из узлов (krivye.ts),
 * ответ берётся из задуманной структуры, затем sobrat() пересчитывает
 * его независимо по данным рисунка (reshit.ts) и проверяет читаемость.
 * Решение — по этапам с подписями; подсказка — лесенка вопросов с
 * кнопками; вспомогательные построения лежат в Figura.pomoshch и
 * показываются только в подсказке и на листе учителя.
 */

import type { Rng } from '../../veroyatnost/generator';
import { chislaOtvet } from '../otvet';
import { nuliUzlov } from '../chtenie';
import { blizhayshiyNaklon, figura, volna, volnaP } from '../krivye';
import { naklony, postroit } from '../spline';
import { d, otrezok } from '../tex';
import type { Draft, Figura, Pomoshch, Uzel } from '../types';
import { grafikF, grafikP, metkiTekst } from '../uslovie';
import { proto, shag, sobrat, vopros } from './common';
import { shagiNaklon } from './naklon';

/* ── 9.2.1 ───────────────────────────────────────────────────────── */

interface SKasat {
  uzly: Uzel[];
  a: number;
  b: number;
  x0: number;
  y0: number;
  p: number;
  q: number;
}

/** Волна с узлом касания: наклон в нём задан явно и равен p/q. */
function volnaSKasat(r: Rng): SKasat | null {
  const w = volna(r, { n: [2, 3], shag: 3 });
  if (w === null) {
    return null;
  }
  /* Сегменты шириной от трёх клеток: внутри есть целая абсцисса с запасом. */
  const segs: number[] = [];
  for (let i = 0; i < w.uzly.length - 1; i += 1) {
    if ((w.uzly[i + 1] as Uzel).x - (w.uzly[i] as Uzel).x >= 3) {
      segs.push(i);
    }
  }
  if (segs.length === 0) {
    return null;
  }
  const i = r.pick(segs);
  const u0 = w.uzly[i] as Uzel;
  const u1 = w.uzly[i + 1] as Uzel;
  const x0 = r.int(u0.x + 1, u1.x - 1);
  const natural = postroit(w.uzly).y(x0);
  const y0 = Math.round(natural);
  if (!(Math.min(u0.y, u1.y) < y0 && y0 < Math.max(u0.y, u1.y))) {
    return null;
  }
  const withNode = [...w.uzly.slice(0, i + 1), { x: x0, y: y0 }, ...w.uzly.slice(i + 1)];
  const idx = i + 1;
  const mNat = naklony(withNode)[idx] as number;
  const pq = blizhayshiyNaklon(mNat);
  if (pq === null) {
    return null;
  }
  const uzly = withNode.map((u, j) => (j === idx ? { ...u, m: pq.p / pq.q } : u));
  return { uzly, a: w.a, b: w.b, x0, y0, p: pq.p, q: pq.q };
}

/** Два узла касательной внутри окна. */
function dvaUzla(
  r: Rng,
  s: SKasat,
  win: { xmin: number; xmax: number; ymin: number; ymax: number },
) {
  const cand: [number, number][] = [];
  const spl = postroit(s.uzly);
  for (let t = -12; t <= 12; t += 1) {
    const x = s.x0 + s.q * t;
    const y = s.y0 + s.p * t;
    if (t === 0 || x < win.xmin + 1 || x > win.xmax - 1 || y < win.ymin + 1 || y > win.ymax - 1) {
      continue;
    }
    /* Узел касательной не должен лежать на самой кривой: его не спутать с точкой касания. */
    if (x >= s.a && x <= s.b && Math.abs(spl.y(x) - y) < 0.6) {
      continue;
    }
    cand.push([x, y]);
  }
  const far: [[number, number], [number, number]][] = [];
  for (let i = 0; i < cand.length; i += 1) {
    for (let j = i + 1; j < cand.length; j += 1) {
      const A = cand[i] as [number, number];
      const B = cand[j] as [number, number];
      if (B[0] - A[0] >= 3 && B[0] - A[0] <= 9) {
        far.push([A, B]);
      }
    }
  }
  if (far.length === 0) {
    return null;
  }
  return r.pick(far);
}

const P921 = proto({
  id: '9.2.1',
  gruppa: 'II',
  nazvanie: 'Значение производной по графику функции и касательной',
  kratko: "Найти $f'(x_0)$ по касательной",
  risunok: true,
  generate(r: Rng): Draft | null {
    const s = volnaSKasat(r);
    if (s === null) {
      return null;
    }
    const base = figura('f', 'f(x)', s.uzly, {});
    const pair = dvaUzla(r, s, base.okno);
    if (pair === null) {
      return null;
    }
    const [A, B] = pair;
    const k = s.p / s.q;
    /* Разнообразие: убывающих касательных не меньше трети, наклон ±1 — реже остальных. */
    if (k < 0 !== r.next() < 0.4 || (Math.abs(k) === 1 && r.next() < 0.6)) {
      return null;
    }
    const fig: Figura = {
      ...base,
      kasatelnaya: { a: A, b: B, x0: s.x0 },
      pomoshch: [
        { t: 'vert', x: s.x0, shag: 1 },
        { t: 'treugolnik', shag: 2 },
      ],
    };
    const vozr = k > 0;
    const dx = B[0] - A[0];
    const dy = Math.abs(B[1] - A[1]);
    const katety = `$\\Delta x=${dx}$, $\\Delta y=${dy}$`;
    const uslovie =
      'На рисунке изображены график функции $y=f(x)$ и касательная к нему в точке с абсциссой $x_0$. ' +
      'Найдите значение производной функции $f(x)$ в точке $x_0$.';
    const mistakes = [
      {
        v: -k,
        w:
          'Знак перепутан: касательная ' +
          (vozr ? "возрастает, значит $f'(x_0)>0$." : "убывает, значит $f'(x_0)<0$."),
      },
      {
        v: dx / dy,
        w: 'Катеты перепутаны: $\\operatorname{tg}\\alpha=\\dfrac{\\Delta y}{\\Delta x}$, а не наоборот.',
      },
      {
        v: ((dy + 1) / dx) * (vozr ? 1 : -1),
        w: 'Катет сосчитан с ошибкой на клетку: пересчитайте по узлам.',
      },
    ];
    const draft = sobrat(fig, { t: 'kasat-znachenie' }, k, {
      uslovie,
      shagi: [
        shag(
          'Что нужно найти',
          "Значение производной в точке касания равно угловому коэффициенту касательной: $f'(x_0)=k=\\operatorname{tg}\\alpha$.",
          '$\\alpha$ — угол между касательной и положительным направлением оси $Ox$.',
        ),
        ...shagiNaklon(A, B),
        shag(
          'Проверка на здравый смысл',
          vozr
            ? `Касательная идёт вверх слева направо, значит $f'(x_0)>0$; ответ $${d(k)}$ положителен.`
            : `Касательная идёт вниз слева направо, значит $f'(x_0)<0$; ответ $${d(k)}$ отрицателен.`,
          Math.abs(k) < 1
            ? 'Касательная положе, чем под углом $45^\\circ$ (на 1 клетку вправо она поднимается меньше чем на клетку), поэтому $|k|<1$.'
            : 'Касательная круче, чем под углом $45^\\circ$, поэтому $|k|>1$.',
        ),
        shag('Ответ', `**Ответ: ${d(k).replace('{,}', ',')}**`),
      ],
      podskazka: [
        vopros(
          r,
          'Касательная идёт вверх или вниз, если смотреть слева направо?',
          vozr ? 'Вверх: производная положительна' : 'Вниз: производная отрицательна',
          [
            {
              tekst: vozr ? 'Вниз: производная отрицательна' : 'Вверх: производная положительна',
              pochemu: vozr
                ? 'Слева направо касательная поднимается — угол $\\alpha$ острый, $\\operatorname{tg}\\alpha>0$.'
                : 'Слева направо касательная опускается — угол $\\alpha$ тупой, $\\operatorname{tg}\\alpha<0$.',
            },
            {
              tekst: 'Горизонтально: производная равна нулю',
              pochemu:
                'Горизонтальная касательная была бы параллельна оси $Ox$, а здесь она наклонена.',
            },
          ],
          vozr
            ? "$f'(x_0)>0$: угол $\\alpha$ острый."
            : "$f'(x_0)<0$: угол $\\alpha$ тупой, считаем через смежный угол.",
        ),
        vopros(
          r,
          'Выберите два узла сетки, через которые проходит касательная.',
          `$(${A[0]};\\ ${A[1]})$ и $(${B[0]};\\ ${B[1]})$`,
          [
            {
              tekst: `$(${A[0]};\\ ${A[1]})$ и $(${B[0]};\\ ${B[1] + 1})$`,
              pochemu: 'Вторая точка лежит выше касательной: она не на прямой.',
            },
            {
              tekst: `$(${A[0]};\\ ${A[1]})$ и $(${B[0] + 1};\\ ${B[1]})$`,
              pochemu: 'Вторая точка лежит правее касательной: она не на прямой.',
            },
            {
              tekst: `$(${A[1]};\\ ${A[0]})$ и $(${B[1]};\\ ${B[0]})$`,
              pochemu: 'Координаты переставлены: сначала абсцисса, потом ордината.',
            },
          ],
          `Берём узлы $A(${A[0]};\\ ${A[1]})$ и $B(${B[0]};\\ ${B[1]})$ — по ним надёжнее считать наклон.`,
          1,
        ),
        vopros(
          r,
          'Построй прямоугольный треугольник на этих узлах. Чему равны катеты?',
          katety,
          [
            {
              tekst: `$\\Delta x=${dy}$, $\\Delta y=${dx}$`,
              pochemu:
                'Катеты поменяны местами: $\\Delta x$ — по горизонтали, $\\Delta y$ — по вертикали.',
            },
            {
              tekst: `$\\Delta x=${dx + 1}$, $\\Delta y=${dy}$`,
              pochemu: 'Горизонтальный катет посчитан с лишней клеткой.',
            },
            {
              tekst: `$\\Delta x=${dx}$, $\\Delta y=${dy + 1}$`,
              pochemu: 'Вертикальный катет посчитан с лишней клеткой.',
            },
          ],
          `Катеты треугольника: $\\Delta x=${dx}$, $\\Delta y=${dy}$.`,
          2,
        ),
        vopros(
          r,
          "Чему равен $\\operatorname{tg}\\alpha$, то есть $f'(x_0)$?",
          `$${d(k)}$`,
          mistakes
            .filter((m) => Number.isFinite(m.v))
            .map((m) => ({ tekst: `$${d(Math.round(m.v * 100) / 100)}$`, pochemu: m.w })),
          `$f'(x_0)=${d(k)}$.`,
          2,
        ),
      ],
      params: { x0: s.x0, y0: s.y0, p: s.p, q: s.q, ax: A[0], ay: A[1], bx: B[0], by: B[1] },
      signature: `${s.p}/${s.q}|${s.x0}|${A}|${B}`,
      vid: `${k > 0 ? 'up' : 'down'}-${Math.abs(k) < 1 ? 'flat' : Math.abs(k) === 1 ? '45' : 'steep'}`,
    });
    return draft;
  },
});

/* ── 9.2.2 ───────────────────────────────────────────────────────── */

function otvetTekst(x: number): string {
  return chislaOtvet(x);
}

const P922 = proto({
  id: '9.2.2',
  gruppa: 'II',
  nazvanie: 'Касательная параллельна оси абсцисс: точка отрезка по графику производной',
  kratko: 'Где касательная параллельна $Ox$',
  risunok: true,
  generate(r: Rng): Draft | null {
    const w = volnaP(r, { n: [3, 5] });
    if (w === null) {
      return null;
    }
    const zs = nuliUzlov(w.uzly);
    /* Отрезок длиной 4–6 клеток с одним нулём внутри. */
    const zero = r.pick(zs).x;
    const p = zero - r.int(1, 3);
    const q = zero + r.int(1, 3);
    if (p < w.a + 1 || q > w.b - 1 || q - p < 3) {
      return null;
    }
    const inside = zs.filter((z) => z.x >= p && z.x <= q);
    if (inside.length !== 1) {
      return null;
    }
    const fig: Figura = figura('fprime', "f'(x)", w.uzly, {
      pomoshch: [
        { t: 'otrezok', p, q, shag: 1 },
        ...zs.map((z): Pomoshch => ({ t: 'vert', x: z.x, podpis: d(z.x), shag: 2 })),
      ],
    });
    const uslovie = `${grafikP(w.a, w.b)} В какой точке отрезка $${otrezok(p, q)}$ касательная к графику функции $f(x)$ параллельна оси абсцисс или совпадает с ней?`;
    const outside = zs.filter((z) => z.x < p || z.x > q).map((z) => z.x);
    return sobrat(fig, { t: 'extr-na-otrezke', p, q }, zero, {
      uslovie,
      shagi: [
        shag(
          'Переводим условие',
          'Касательная параллельна оси $Ox$ (горизонтальна) тогда и только тогда, когда её угловой коэффициент равен нулю.',
          "Угловой коэффициент касательной — это $f'(x)$, значит нужно решить $f'(x)=0$.",
        ),
        shag(
          'Ищем нули графика производной',
          `$f'(x)=0$ там, где график $y=f'(x)$ пересекает ось абсцисс: ${zs.map((z) => `$x=${d(z.x)}$`).join(', ')}.`,
        ),
        shag(
          'Выбираем точку из отрезка',
          `Отрезок $${otrezok(p, q)}$: из найденных нулей в него попадает только $x=${d(zero)}$.`,
          outside.length > 0
            ? `Остальные нули ($${outside.map(d).join('$, $')}$) лежат вне отрезка.`
            : '',
        ),
        shag('Ответ', `**Ответ: ${otvetTekst(zero)}**`),
      ].map((s) => ({ ...s, stroki: s.stroki.filter((x) => x !== '') })),
      podskazka: [
        vopros(
          r,
          'Чему равна производная в точке, где касательная параллельна оси $Ox$?',
          '$0$',
          [
            {
              tekst: '$1$',
              pochemu:
                'Угловой коэффициент $1$ — касательная под углом $45^\\circ$, не горизонтальная.',
            },
            {
              tekst: 'Не существует',
              pochemu: 'Горизонтальная касательная есть, её угловой коэффициент равен нулю.',
            },
          ],
          "Горизонтальная касательная: $f'(x)=0$.",
        ),
        vopros(
          r,
          "Что на графике $y=f'(x)$ показывает такие точки?",
          'Пересечения графика с осью $Ox$',
          [
            {
              tekst: 'Вершины («горки» и «ямки») графика',
              pochemu:
                "Вершины графика $f'$ — это экстремумы самой производной, а нули $f'$ — пересечения с осью.",
            },
            {
              tekst: 'Пересечения графика с осью $Oy$',
              pochemu: "Ось $Oy$ даёт значение $f'(0)$, а нужны нули.",
            },
          ],
          "Нули производной — точки пересечения графика $f'$ с осью $Ox$.",
          2,
        ),
        vopros(
          r,
          `Какой из нулей лежит на отрезке $${otrezok(p, q)}$?`,
          `$x=${d(zero)}$`,
          outside.slice(0, 3).map((x) => ({
            tekst: `$x=${d(x)}$`,
            pochemu: `Точка $x=${d(x)}$ — нуль $f'$, но она вне отрезка $${otrezok(p, q)}$.`,
          })),
          `На отрезке $${otrezok(p, q)}$ лежит нуль $x=${d(zero)}$.`,
          2,
        ),
      ],
      params: { a: w.a, b: w.b, p, q, zero, zs: zs.map((z) => z.x).join(',') },
      signature: podp(w.uzly) + `|${p}|${q}`,
      vid: `n${zs.length}-d${q - p}`,
    });
  },
});

function podp(uzly: readonly Uzel[]): string {
  return uzly.map((u) => `${u.x}:${u.y}`).join(',');
}

/* ── 9.2.3 и 9.2.4: касательная параллельна прямой y = kx + m ───── */

/**
 * Волна f′ с узлом (x*, k) на подъёме или спуске: по нему график
 * пересекает прямую y = k в целой точке. unique: true — пересечение
 * единственное в интервале.
 */
function volnaSPeresecheniem(
  r: Rng,
  k: number,
): { uzly: Uzel[]; a: number; b: number; xk: number } | null {
  const w = volnaP(r, { n: [2, 4], shag: 2 });
  if (w === null) {
    return null;
  }
  /* Участки «нуль — горб» одного знака с k, где горб выше |k|. */
  const cands: { i: number; x: number }[] = [];
  for (let i = 0; i < w.uzly.length - 1; i += 1) {
    const u0 = w.uzly[i] as Uzel;
    const u1 = w.uzly[i + 1] as Uzel;
    const lo = Math.min(u0.y, u1.y);
    const hi = Math.max(u0.y, u1.y);
    if (lo < k && k < hi && u1.x - u0.x >= 2) {
      for (let x = u0.x + 1; x <= u1.x - 1; x += 1) {
        cands.push({ i, x });
      }
    }
  }
  if (cands.length === 0) {
    return null;
  }
  const c = r.pick(cands);
  const uzly = [...w.uzly.slice(0, c.i + 1), { x: c.x, y: k }, ...w.uzly.slice(c.i + 1)];
  return { uzly, a: w.a, b: w.b, xk: c.x };
}

function tekstPryamoy(k: number, m: number): string {
  const kk = k === 1 ? '' : k === -1 ? '-' : String(k);
  const mm = m === 0 ? '' : m > 0 ? `+${m}` : String(m);
  return k === 0 ? `y=${m}` : `y=${kk}x${mm}`;
}

function kasatParallel(id: string, nazvanie: string, kratko: string, schitat: boolean) {
  return proto({
    id,
    gruppa: 'II',
    nazvanie,
    kratko,
    risunok: true,
    generate(r: Rng): Draft | null {
      const k = schitat ? r.pick([0, 1, 1, 2, -1, -2, 3]) : r.pick([1, 2, 3, -1, -2]);
      const m = r.pick([-9, -7, -5, -3, -2, -1, 0, 1, 2, 3, 4, 6, 8]);
      const w = volnaSPeresecheniem(r, k);
      if (w === null) {
        return null;
      }
      const zapros = schitat
        ? ({ t: 'kasat-chislo', k } as const)
        : ({ t: 'kasat-abscissa', k } as const);
      /* Число точек: пересечения y = k, считаем по узлам независимо от reshit. */
      let count = 0;
      for (let i = 0; i < w.uzly.length - 1; i += 1) {
        const u0 = w.uzly[i] as Uzel;
        const u1 = w.uzly[i + 1] as Uzel;
        if ((u0.y - k) * (u1.y - k) < 0 || u0.y === k) {
          count += 1;
        }
      }
      if ((w.uzly[w.uzly.length - 1] as Uzel).y === k) {
        count += 1;
      }
      const otvet = schitat ? count : w.xk;
      if (schitat ? count < 1 || count > 4 : count !== 1) {
        return null;
      }
      const pryamaya = tekstPryamoy(k, m);
      const pomoshch: Pomoshch[] = [
        { t: 'goriz', y: k, podpis: k === 0 ? 'y = 0' : `y = ${k}`, shag: 2 },
      ];
      if (!schitat) {
        pomoshch.push({ t: 'vert', x: w.xk, podpis: d(w.xk), shag: 3 });
      }
      const fig = figura('fprime', "f'(x)", w.uzly, { pomoshch });
      const zadanie = schitat
        ? `Найдите количество точек, в которых касательная к графику функции $y=f(x)$ параллельна прямой $${pryamaya}$ или совпадает с ней.`
        : `Найдите абсциссу точки, в которой касательная к графику функции $y=f(x)$ параллельна прямой $${pryamaya}$ или совпадает с ней.`;
      return sobrat(fig, zapros, otvet, {
        uslovie: `${grafikP(w.a, w.b)} ${zadanie}`,
        shagi: [
          shag(
            'Находим угловой коэффициент прямой',
            `У прямой $${pryamaya}$ угловой коэффициент равен $k=${d(k)}$; число $m$ на параллельность не влияет.`,
          ),
          shag(
            'Переводим условие на язык производной',
            `Параллельные прямые имеют равные угловые коэффициенты, а угловой коэффициент касательной — это $f'(x)$. Значит, нужно решить $f'(x)=${d(k)}$.`,
          ),
          shag(
            'Проводим на графике горизонталь',
            `Решения уравнения $f'(x)=${d(k)}$ — точки пересечения графика $y=f'(x)$ с горизонтальной прямой $y=${d(k)}$.`,
          ),
          schitat
            ? shag(
                'Считаем точки пересечения',
                `Прямая $y=${d(k)}$ пересекает график в ${count} точ${count === 1 ? 'ке' : 'ках'}: касание и совпадение с осью здесь не встречаются.`,
              )
            : shag(
                'Читаем абсциссу',
                `Единственная точка пересечения имеет абсциссу $x=${d(w.xk)}$.`,
              ),
          shag('Ответ', `**Ответ: ${otvetTekst(otvet)}**`),
        ],
        podskazka: [
          vopros(
            r,
            `Чему равен угловой коэффициент прямой $${pryamaya}$?`,
            `$${d(k)}$`,
            [
              {
                tekst: `$${d(m)}$`,
                pochemu:
                  '$m$ — это сдвиг прямой вдоль оси $Oy$; угловой коэффициент стоит при $x$.',
              },
              {
                tekst: `$${d(-k)}$`,
                pochemu: 'Знак потерян: угловой коэффициент — число перед $x$ со своим знаком.',
              },
            ].filter((o) => !(k === 0 && o.tekst === '$0$')),
            `$k=${d(k)}$.`,
          ),
          vopros(
            r,
            'Какое уравнение нужно решить?',
            `$f'(x)=${d(k)}$`,
            [
              {
                tekst: `$f(x)=${d(k)}$`,
                pochemu:
                  'Угловой коэффициент касательной равен производной, а не значению функции.',
              },
              {
                tekst: `$f'(x)=${d(m)}$`,
                pochemu: `Число $${d(m)}$ — свободный член прямой, а не её наклон.`,
              },
              {
                tekst: "$f'(x)=0$",
                pochemu:
                  'Ноль был бы у касательной, параллельной оси $Ox$, а здесь прямая наклонная.'.replace(
                    'наклонная',
                    k === 0 ? 'горизонтальная' : 'наклонная',
                  ),
              },
            ].filter((o) => k !== 0 || o.tekst !== "$f'(x)=0$"),
            `Нужно решить $f'(x)=${d(k)}$.`,
            1,
          ),
          vopros(
            r,
            `Что на графике $y=f'(x)$ даёт решения $f'(x)=${d(k)}$?`,
            `Пересечения графика с горизонталью $y=${d(k)}$`,
            [
              {
                tekst: 'Вершины графика',
                pochemu: 'Вершины — экстремумы самой производной, они не связаны с уравнением.',
              },
              {
                tekst: `Пересечения с осью $Ox$`,
                pochemu:
                  k === 0
                    ? 'Это верно для $k=0$, но ось $Ox$ — и есть горизонталь $y=0$.'
                    : `Пересечения с осью $Ox$ — это решения $f'(x)=0$, а нужно $f'(x)=${d(k)}$.`,
              },
            ].filter((o) => !(k === 0 && o.tekst.startsWith('Пересечения с осью'))),
            `Проводим горизонталь $y=${d(k)}$ и смотрим, где она пересекает график.`,
            2,
          ),
          vopros(
            r,
            schitat ? 'Сколько точек пересечения?' : 'Какова абсцисса точки пересечения?',
            `$${d(otvet)}$`,
            schitat
              ? [otvet + 1, Math.max(0, otvet - 1), otvet + 2]
                  .filter((n) => n !== otvet)
                  .map((n) => ({
                    tekst: `$${n}$`,
                    pochemu:
                      'Пересчитайте пересечения горизонтали с графиком: касания в этой задаче нет.',
                  }))
              : [
                  {
                    tekst: `$${d(w.xk + 1)}$`,
                    pochemu: 'Это соседняя клетка: сверьтесь с сеткой.',
                  },
                  {
                    tekst: `$${d(k)}$`,
                    pochemu: 'Число $k$ — это ордината точки пересечения, а нужна абсцисса.',
                  },
                  {
                    tekst: `$${d(-w.xk)}$`,
                    pochemu:
                      'Знак абсциссы перепутан: отсчитывайте клетки от начала координат с учётом стороны.',
                  },
                ].filter((o) => o.tekst !== `$${d(otvet)}$`),
            schitat
              ? `Точек пересечения — ${otvet}.`
              : `Абсцисса точки пересечения: $x=${d(w.xk)}$.`,
            3,
          ),
        ],
        params: { k, m, xk: w.xk, a: w.a, b: w.b },
        signature: podp(w.uzly) + `|${k}`,
        vid: `k${k}-${w.xk > 0 ? 'r' : 'l'}`,
      });
    },
  });
}

const P923 = kasatParallel(
  '9.2.3',
  'Касательная параллельна прямой: абсцисса по графику производной',
  'Абсцисса, где касательная $\\parallel y=kx+m$',
  false,
);
const P924 = kasatParallel(
  '9.2.4',
  'Касательная параллельна прямой: количество точек по графику производной',
  'Сколько точек, где касательная $\\parallel y=kx+m$',
  true,
);

/* ── 9.2.5 и 9.2.6: в какой отмеченной точке производная наибольшая / наименьшая ── */

function naibNaim(id: string, naib: boolean) {
  return proto({
    id,
    gruppa: 'II',
    nazvanie: naib
      ? 'В какой отмеченной точке производная наибольшая'
      : 'В какой отмеченной точке производная наименьшая',
    kratko: naib ? "Где $f'$ наибольшая" : "Где $f'$ наименьшая",
    risunok: true,
    generate(r: Rng): Draft | null {
      const w = volna(r, { n: [2, 4], vysota: [2, 4] });
      if (w === null) {
        return null;
      }
      const n = r.pick([4, 4, 5]);
      const spl = postroit(w.uzly);
      /* Выигрывает одна точка, отрыв от остальных не меньше единицы: на глаз различим. */
      const all: { x: number; s: number }[] = [];
      for (let x = w.a + 1; x < w.b; x += 1) {
        const sl = spl.dy(x);
        if (Math.abs(sl) >= 0.5) {
          all.push({ x, s: sl });
        }
      }
      const winners = all.filter((c) => (naib ? c.s >= 1 : c.s <= -1));
      if (winners.length === 0) {
        return null;
      }
      const win = r.pick(winners);
      const others = all.filter(
        (c) => c.x !== win.x && (naib ? c.s <= win.s - 1 : c.s >= win.s + 1),
      );
      if (others.length < n - 1) {
        return null;
      }
      const picked = [win, ...r.sample(others, n - 1)].sort((p, q) => p.x - q.x);
      const metki = picked.map((c) => c.x);
      const slopes = metki.map((x) => spl.dy(x));
      const target = naib ? Math.max(...slopes) : Math.min(...slopes);
      const idx = slopes.findIndex((s) => Math.abs(s - target) < 1e-9);
      const fig = figura('f', 'f(x)', w.uzly, {
        metki,
        pomoshch: metki.map((x, i): Pomoshch => ({ t: 'vert', x, shag: 1 + (i % 1) })),
      });
      const uslovie = `${grafikF(w.a, w.b)} ${metkiTekst(n)} В какой из этих точек значение производной ${naib ? 'наибольшее' : 'наименьшее'}? В ответе укажите номер этой точки.`;
      const rounded = slopes.map((s) => Math.round(s * 2) / 2);
      const spisok = (pred: (s: number) => boolean) =>
        metki
          .map((_, i) => i)
          .filter((i) => pred(slopes[i] as number))
          .map((i) => `$x_{${i + 1}}$`)
          .join(', ');
      return sobrat(fig, { t: naib ? 'naib-metka' : 'naim-metka' }, idx + 1, {
        uslovie,
        shagi: [
          shag(
            'Что значит «производная»',
            'Значение производной в точке — угловой коэффициент касательной: чем круче график идёт вверх, тем больше производная; чем круче вниз — тем она меньше (отрицательна).',
          ),
          shag(
            'Знаки производной в отмеченных точках',
            `График возрастает в точках ${spisok((s) => s > 0) || '—'}, значит там $f'>0$; убывает в точках ${spisok((s) => s < 0) || '—'}, там $f'<0$.`,
          ),
          shag(
            'Сравниваем крутизну',
            naib
              ? 'Наибольшая производная — у самого крутого подъёма: ищем точку, где график идёт вверх круче всего.'
              : 'Наименьшая производная — у самого крутого спуска: ищем точку, где график идёт вниз круче всего.',
            `На глаз по клеткам: наклон в точках $x_1,\\ldots,x_${n}$ примерно ${rounded.map((s) => `$${d(s)}$`).join('; ')}.`,
          ),
          shag(
            'Ответ',
            `${naib ? 'Наибольшая' : 'Наименьшая'} производная в точке $x_{${idx + 1}}$.`,
            `**Ответ: ${idx + 1}**`,
          ),
        ],
        podskazka: [
          vopros(
            r,
            'Что показывает значение производной в точке графика?',
            'Наклон касательной к графику',
            [
              {
                tekst: 'Высоту точки над осью',
                pochemu: 'Высота — это значение функции $f(x)$, а не производной.',
              },
              {
                tekst: 'Расстояние до оси $Oy$',
                pochemu: 'Это абсцисса точки, к производной она отношения не имеет.',
              },
            ],
            'Производная — угловой коэффициент касательной.',
          ),
          vopros(
            r,
            'В каких отмеченных точках производная положительна?',
            spisok((s) => s > 0) !== '' ? spisok((s) => s > 0).replace(/\$/g, '$') : 'Ни в одной',
            [
              {
                tekst: spisok((s) => s < 0) || 'Ни в одной',
                pochemu: 'Здесь график убывает: производная отрицательна.',
              },
              {
                tekst: metki.map((_, i) => `$x_{${i + 1}}$`).join(', '),
                pochemu: 'В части точек график убывает: там производная отрицательна.',
              },
            ],
            'Там, где график идёт вверх (слева направо), производная положительна.',
            1,
          ),
          vopros(
            r,
            naib ? 'Где график поднимается круче всего?' : 'Где график опускается круче всего?',
            `$x_{${idx + 1}}$`,
            metki
              .map((_, i) => i)
              .filter((i) => i !== idx)
              .slice(0, 3)
              .map((i) => ({
                tekst: `$x_{${i + 1}}$`,
                pochemu: naib
                  ? (slopes[i] as number) <= 0
                    ? 'Здесь график не растёт: производная не положительна.'
                    : 'Здесь график поднимается, но положе, чем в лучшей точке.'
                  : (slopes[i] as number) >= 0
                    ? 'Здесь график не убывает: производная не отрицательна.'
                    : 'Здесь график опускается, но положе, чем в лучшей точке.',
              })),
            `Самый крутой участок — у точки $x_{${idx + 1}}$.`,
            1,
          ),
        ],
        params: { n, a: w.a, b: w.b, idx },
        signature: podp(w.uzly) + `|${metki.join(',')}`,
        vid: `n${n}-i${idx}`,
      });
    },
  });
}

const P925 = naibNaim('9.2.5', true);
const P926 = naibNaim('9.2.6', false);

/* ── 9.2.7: параметр c ──────────────────────────────────────────── */

const P927 = proto({
  id: '9.2.7',
  gruppa: 'II',
  nazvanie: 'Параметр: при каком $c$ прямая является касательной',
  kratko: 'Найти $c$: прямая — касательная',
  risunok: false,
  generate(r: Rng): Draft | null {
    const a = r.pick([1, 1, 2, 3, -1, -2, -3]);
    const b = r.pick([-9, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 9]);
    const x0 = r.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
    const k = 2 * a * x0 + b;
    if (k === 0 || Math.abs(k) > 24) {
      return null;
    }
    const m = r.pick([-12, -10, -8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 7, 8, 10, 12]);
    const c = k * x0 + m - (a * x0 * x0 + b * x0);
    if (Math.abs(c) > 60 || c === 0) {
      return null;
    }
    const kk = k === 1 ? '' : k === -1 ? '-' : String(k);
    const mm = m > 0 ? `+${m}` : String(m);
    const pryamaya = `y=${kk}x${mm}`;
    const aa = a === 1 ? '' : a === -1 ? '-' : String(a);
    const bb = b > 0 ? `+${b}` : String(b);
    const parabola = `y=${aa}x^{2}${bb}x+c`;
    const f0 = a * x0 * x0 + b * x0;
    const uslovie = `Прямая $${pryamaya}$ является касательной к графику функции $${parabola}$. Найдите $c$.`;
    return {
      uslovie,
      risunok: null,
      zapros: null,
      otvet: c,
      proverka: reshit927(a, b, k, m),
      shagi: [
        shag(
          'Условия касания',
          'Прямая $y=kx+m$ касается графика $y=f(x)$ в точке с абсциссой $x_0$, если выполнены два условия одновременно:',
          "$f'(x_0)=k$ (совпадают наклоны) и $f(x_0)=kx_0+m$ (общая точка).",
        ),
        shag(
          'Находим абсциссу точки касания',
          `$f'(x)=${fPrime(a, b)}$`,
          `$${fPrime(a, b)}=${k}$, откуда $x_0=${x0}$.`,
        ),
        shag(
          'Приравниваем значения в точке касания',
          `Прямая в точке $x_0=${x0}$: $y=${k}\\cdot(${x0})${mm.startsWith('+') ? mm : mm}=${k * x0 + m}$.`,
          `Парабола в этой точке: $f(${x0})=${f0}+c$.`,
          `$${f0}+c=${k * x0 + m}$, откуда $c=${k * x0 + m}-(${f0})=${c}$.`,
        ),
        shag('Ответ', `**Ответ: ${c}**`),
      ],
      podskazka: [
        vopros(
          r,
          'Какие два условия выполняются в точке касания?',
          "$f'(x_0)=k$ и $f(x_0)=kx_0+m$",
          [
            {
              tekst: "$f(x_0)=k$ и $f'(x_0)=m$",
              pochemu: 'Наклон прямой $k$ сравнивается с производной, а не со значением функции.',
            },
            {
              tekst: "Только $f'(x_0)=k$",
              pochemu:
                'Равенство наклонов ещё не значит, что прямая проходит через точку графика: нужна и общая точка.',
            },
          ],
          'Касание = общая точка + общий наклон.',
        ),
        vopros(
          r,
          'Чему равна абсцисса точки касания?',
          `$x_0=${x0}$`,
          [
            { tekst: `$x_0=${-x0}$`, pochemu: `Знак потерян при решении $${fPrime(a, b)}=${k}$.` },
            { tekst: `$x_0=${k}$`, pochemu: 'Это угловой коэффициент, а не абсцисса.' },
          ],
          `Из $${fPrime(a, b)}=${k}$ получаем $x_0=${x0}$.`,
          1,
        ),
        vopros(
          r,
          'Чему равна ордината прямой в точке касания?',
          `$${k * x0 + m}$`,
          [
            { tekst: `$${k * x0 - m}$`, pochemu: 'Знак при $m$ перепутан.' },
            { tekst: `$${m}$`, pochemu: '$m$ — ордината при $x=0$, а не в точке касания.' },
          ],
          `$y(${x0})=${k * x0 + m}$.`,
          2,
        ),
      ],
      params: { a, b, x0, m, c },
      signature: `${a}|${b}|${x0}|${m}`,
      vid: `a${a}`,
    };
  },
});

/** Независимый счёт c: условие D = 0 для уравнения ax² + (b − k)x + (c − m) = 0. */
function reshit927(a: number, b: number, k: number, m: number): number {
  /* D = (b − k)² − 4a(c − m) = 0  ⇒  c = m + (b − k)² / (4a). */
  return m + (b - k) ** 2 / (4 * a);
}

function fPrime(a: number, b: number): string {
  const first = a === 1 ? '2x' : a === -1 ? '-2x' : `${2 * a}x`;
  return `${first}${b > 0 ? '+' + b : b}`;
}

export const KASATELNAYA = [P921, P922, P923, P924, P925, P926, P927];
