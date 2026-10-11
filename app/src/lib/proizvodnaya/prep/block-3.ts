/** Блок P9-3 · Знак производной по графику функции f. */

import type { Rng } from '../../veroyatnost/generator';
import { znakProizvodnoy } from '../chtenie';
import { okno, volna } from '../krivye';
import type { Volna } from '../krivye';
import { shag } from '../prototypes/common';
import { ekstremumy } from '../reshit';
import { reshit } from '../reshit';
import { postroit } from '../spline';
import { interval } from '../tex';
import { otmecheno } from '../uslovie';
import type { Figura, Pomoshch } from '../types';
import { d, figKrivaya, micro, qChislo, razborIz, vopros, vybor } from './pomoshniki';
import type { PrepGenerated, PrepMicro } from './types';

const FP = "f'";

interface Ctx {
  w: Volna;
  spl: ReturnType<typeof postroit>;
  obychnye: number[];
}

function volnaF(
  r: Rng,
  n: [number, number],
  opts: { a?: [number, number]; b?: [number, number] } = {},
): Ctx | null {
  const w = volna(r, { n, shag: 2, ...opts });
  if (w === null) {
    return null;
  }
  const spl = postroit(w.uzly);
  const obychnye: number[] = [];
  for (let x = w.a + 1; x < w.b; x += 1) {
    if (Math.abs(spl.dy(x)) >= 0.7 && !w.ekstremumy.some((e) => e.x === x)) {
      obychnye.push(x);
    }
  }
  return { w, spl, obychnye };
}

function risunokF(c: Ctx, metki: number[], pom: Pomoshch[] = []): Figura | null {
  return figKrivaya('f', c.w.uzly, okno(c.w.uzly), { metki, pomoshch: pom });
}

function znak(c: Ctx, x: number): number {
  return znakProizvodnoy(c.w.uzly, x);
}

function vyberi(r: Rng, pool: number[], n: number): number[] | null {
  if (pool.length < n) {
    return null;
  }
  const rest = [...pool];
  const out: number[] = [];
  while (out.length < n) {
    out.push(rest.splice(r.int(0, rest.length - 1), 1)[0] as number);
  }
  return out.sort((p, q) => p - q);
}

const SIGN_OPT = [`$${FP}(x_1)>0$`, `$${FP}(x_1)<0$`, `$${FP}(x_1)=0$`];
const IDX = ['$x_1$', '$x_2$', '$x_3$'];

function slovoZnak(s: number): string {
  return s > 0 ? 'идёт вверх' : s < 0 ? 'идёт вниз' : 'имеет вершину';
}

const m01 = micro(
  'P9-3-01',
  'Знак производной в одной точке',
  'choice',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 2]);
    if (c === null || c.obychnye.length === 0) {
      return null;
    }
    const x1 = r.pick(c.obychnye);
    const s = znak(c, x1);
    const fig = risunokF(c, [x1], [{ t: 'vert', x: x1, shag: 1 }]);
    if (fig === null) {
      return null;
    }
    const idx = s > 0 ? 0 : 1;
    const v = vybor(
      r,
      SIGN_OPT[idx] as string,
      SIGN_OPT.filter((_, i) => i !== idx),
    );
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$, отмечена точка $x_1$. Каков знак производной $${FP}(x_1)$?`,
      risunok: fig,
      knopki: v.knopki,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag(
          'Смотрим на график',
          `В точке $x_1$ график ${slovoZnak(s)}: функция ${s > 0 ? 'возрастает' : 'убывает'}.`,
        ),
        shag(
          'Связь со знаком',
          s > 0 ? `Возрастание означает $${FP}(x_1)>0$.` : `Убывание означает $${FP}(x_1)<0$.`,
        ),
        shag('Ответ', SIGN_OPT[idx] as string),
      ]),
      podskazka: [
        vopros(
          r,
          'Что делает график в точке $x_1$, если смотреть слева направо?',
          s > 0 ? 'Идёт вверх' : 'Идёт вниз',
          [
            {
              tekst: s > 0 ? 'Идёт вниз' : 'Идёт вверх',
              pochemu:
                s > 0
                  ? 'Правее $x_1$ график выше: функция растёт.'
                  : 'Правее $x_1$ график ниже: функция убывает.',
            },
            {
              tekst: 'Имеет вершину',
              pochemu: 'Вершина — «горка» или «ямка»; в точке $x_1$ её нет, график идёт монотонно.',
            },
          ],
          `График ${slovoZnak(s)}.`,
          1,
        ),
        vopros(
          r,
          `Какой знак у $${FP}(x_1)$, если функция ${s > 0 ? 'возрастает' : 'убывает'}?`,
          s > 0 ? 'Плюс' : 'Минус',
          [
            {
              tekst: s > 0 ? 'Минус' : 'Плюс',
              pochemu:
                s > 0
                  ? 'Производная положительна там, где функция возрастает.'
                  : 'Производная отрицательна там, где функция убывает.',
            },
            { tekst: 'Нуль', pochemu: 'Нуль бывает только в вершине графика.' },
          ],
          s > 0 ? `$${FP}(x_1)>0$.` : `$${FP}(x_1)<0$.`,
          1,
        ),
      ],
      params: { x1, s },
    };
  },
);

const m02 = micro(
  'P9-3-02',
  'Точка, где производная равна нулю',
  'choice',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 3]);
    if (c === null || c.w.ekstremumy.length === 0) {
      return null;
    }
    const e = r.pick(c.w.ekstremumy);
    const others = vyberi(
      r,
      c.obychnye.filter((x) => Math.abs(x - e.x) >= 1),
      2,
    );
    if (others === null) {
      return null;
    }
    const metki = [...others, e.x].sort((p, q) => p - q);
    for (let i = 1; i < metki.length; i += 1) {
      if ((metki[i] as number) - (metki[i - 1] as number) < 1) {
        return null;
      }
    }
    const pos = metki.indexOf(e.x);
    const fig = risunokF(c, metki, [{ t: 'vert', x: e.x, shag: 1 }]);
    if (fig === null) {
      return null;
    }
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$, отмечены точки $x_1$, $x_2$, $x_3$. В какой из них производная равна нулю?`,
      risunok: fig,
      knopki: IDX,
      otvet: pos,
      proverka: pos,
      razbor: razborIz([
        shag(
          "Что значит $f'=0$",
          'Производная равна нулю там, где касательная горизонтальна: в вершине графика.',
        ),
        shag(
          'Ищем вершину',
          `Вершина («${e.tip === 'max' ? 'горка' : 'ямка'}») находится в точке $x_${pos + 1}$.`,
        ),
        shag(
          'Остальные точки',
          'В двух других точках график идёт вверх или вниз, касательная наклонена, производная не равна нулю.',
        ),
        shag('Ответ', `$x_${pos + 1}$`),
      ]),
      podskazka: [
        vopros(
          r,
          "Какой должна быть касательная к графику, если $f'(x)=0$?",
          'Горизонтальной',
          [
            {
              tekst: 'Вертикальной',
              pochemu: 'Вертикальная касательная — это бесконечный наклон, а не нулевой.',
            },
            {
              tekst: 'Идущей под углом $45^\\circ$',
              pochemu: 'Под углом $45^\\circ$ угловой коэффициент равен $1$.',
            },
          ],
          "$f'(x)=0$ — касательная горизонтальна.",
        ),
        vopros(
          r,
          'В каком месте графика касательная горизонтальна?',
          'В вершине: на «горке» или в «ямке»',
          [
            {
              tekst: 'Там, где график пересекает ось $Ox$',
              pochemu: "Пересечение оси даёт $f(x)=0$, а не $f'(x)=0$.",
            },
            {
              tekst: 'Там, где график круче всего',
              pochemu: 'Там производная по модулю наибольшая.',
            },
          ],
          'Нужная точка — вершина.',
          1,
        ),
      ],
      params: { pos, ex: e.x },
    };
  },
);

const m03 = micro(
  'P9-3-03',
  'Где производная положительна: две точки',
  'choice',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 3]);
    if (c === null) {
      return null;
    }
    const pattern = r.pick([
      [1, -1],
      [-1, 1],
      [1, 1],
      [-1, -1],
    ]) as number[];
    const pools = [1, -1].map((s) => c.obychnye.filter((x) => znak(c, x) === s));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const p1 = pools[(pattern[0] as number) > 0 ? 0 : 1] as number[];
      const p2 = pools[(pattern[1] as number) > 0 ? 0 : 1] as number[];
      if (p1.length === 0 || p2.length === 0) {
        return null;
      }
      const x1 = r.pick(p1);
      const x2 = r.pick(p2);
      if (x1 === undefined || x2 === undefined || Math.abs(x1 - x2) < 2) {
        continue;
      }
      const metki = [x1, x2].sort((p, q) => p - q);
      const s1 = znak(c, metki[0] as number);
      const s2 = znak(c, metki[1] as number);
      const verno =
        s1 > 0 && s2 < 0
          ? '$x_1$'
          : s1 < 0 && s2 > 0
            ? '$x_2$'
            : s1 > 0
              ? 'в обеих точках'
              : 'ни в одной из точек';
      const fig = risunokF(c, metki, [
        { t: 'vert', x: metki[0] as number, shag: 1 },
        { t: 'vert', x: metki[1] as number, shag: 1 },
      ]);
      if (fig === null) {
        return null;
      }
      const v = vybor(
        r,
        verno,
        ['$x_1$', '$x_2$', 'в обеих точках', 'ни в одной из точек'].filter((s) => s !== verno),
      );
      const pl = (s: number) => (s > 0 ? "возрастает, $f'>0$" : "убывает, $f'<0$");
      return {
        uslovie:
          'На рисунке изображён график функции $y=f(x)$, отмечены точки $x_1$ и $x_2$. В какой из них производная положительна?',
        risunok: fig,
        knopki: v.knopki,
        otvet: v.otvet,
        proverka: v.otvet,
        razbor: razborIz([
          shag('Точка $x_1$', `Функция ${pl(s1)}.`),
          shag('Точка $x_2$', `Функция ${pl(s2)}.`),
          shag('Ответ', verno),
        ]),
        podskazka: [
          vopros(
            r,
            'Что делает график в точке $x_1$?',
            s1 > 0 ? 'Идёт вверх' : 'Идёт вниз',
            [
              {
                tekst: s1 > 0 ? 'Идёт вниз' : 'Идёт вверх',
                pochemu:
                  s1 > 0 ? 'В точке $x_1$ график поднимается.' : 'В точке $x_1$ график опускается.',
              },
            ],
            s1 > 0 ? 'В $x_1$ производная положительна.' : 'В $x_1$ производная отрицательна.',
            1,
          ),
          vopros(
            r,
            'Что делает график в точке $x_2$?',
            s2 > 0 ? 'Идёт вверх' : 'Идёт вниз',
            [
              {
                tekst: s2 > 0 ? 'Идёт вниз' : 'Идёт вверх',
                pochemu:
                  s2 > 0 ? 'В точке $x_2$ график поднимается.' : 'В точке $x_2$ график опускается.',
              },
            ],
            s2 > 0 ? 'В $x_2$ производная положительна.' : 'В $x_2$ производная отрицательна.',
            1,
          ),
          vopros(
            r,
            'Где производная положительна?',
            verno,
            ['$x_1$', '$x_2$', 'в обеих точках', 'ни в одной из точек']
              .filter((s) => s !== verno)
              .slice(0, 3)
              .map((s) => ({
                tekst: s,
                pochemu:
                  'Производная положительна там, где график идёт вверх: сверьте с двумя предыдущими ответами.',
              })),
            `Ответ: ${verno}.`,
            1,
          ),
        ],
        params: { x1: metki[0] as number, x2: metki[1] as number },
      };
    }
    return null;
  },
);

const m04 = micro(
  'P9-3-04',
  'Сколько отмеченных точек на возрастании',
  'number',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 3]);
    if (c === null) {
      return null;
    }
    const n = r.int(3, 5);
    const metki = vyberi(r, c.obychnye, n);
    if (metki === null) {
      return null;
    }
    const k = metki.filter((x) => znak(c, x) > 0).length;
    if (k < 1 || k > n - 1) {
      return null;
    }
    const fig = risunokF(
      c,
      metki,
      c.w.ekstremumy.map((e): Pomoshch => ({ t: 'vert', x: e.x, shag: 1 })),
    );
    if (fig === null) {
      return null;
    }
    const dobav = (p: boolean) =>
      metki
        .map((x, i) => (znak(c, x) > 0 === p ? i + 1 : 0))
        .filter((i) => i > 0)
        .map((i) => `x_{${i}}`)
        .join(',\\ ');
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$. На оси абсцисс ${otmecheno(n)}. В скольких из них производная положительна?`,
      risunok: fig,
      otvet: k,
      proverka: reshit(fig, { t: 'znak-v-metkah', znak: 1 }) ?? Number.NaN,
      razbor: razborIz([
        shag('Правило', "$f'(x)>0$ там, где график идёт вверх."),
        shag('Точки на подъёме', `Вверх график идёт в точках $${dobav(true)}$.`),
        shag('Остальные', `В точках $${dobav(false)}$ график идёт вниз.`),
        shag('Ответ', `$${k}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Где производная положительна?',
          'Там, где график идёт вверх',
          [
            {
              tekst: 'Там, где график выше оси $Ox$',
              pochemu: "Положение над осью говорит о знаке самой $f$, а не $f'$.",
            },
            { tekst: 'Там, где график идёт вниз', pochemu: 'На спуске производная отрицательна.' },
          ],
          "$f'>0$ при возрастании.",
          1,
        ),
        vopros(
          r,
          'Какие из отмеченных точек лежат на подъёме?',
          `$${dobav(true)}$`,
          [{ tekst: `$${dobav(false)}$`, pochemu: 'Это точки на спуске.' }],
          `На подъёме: $${dobav(true)}$.`,
          1,
        ),
        qChislo(
          r,
          'Сколько их?',
          k,
          [
            { v: n - k, w: 'Посчитаны точки на спуске.' },
            { v: k + 1, w: 'Лишняя точка.' },
            { v: k - 1, w: 'Одна точка пропущена.' },
          ],
          `Ответ: $${k}$.`,
          1,
        ),
      ],
      params: { n, k },
    };
  },
);

const m05 = micro(
  'P9-3-05',
  'Целые точки с отрицательной производной',
  'number',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [2, 3]);
    if (c === null) {
      return null;
    }
    const fig = risunokF(
      c,
      [],
      c.w.ekstremumy.map((e): Pomoshch => ({ t: 'vert', x: e.x, shag: 1 })),
    );
    if (fig === null) {
      return null;
    }
    let k = 0;
    const lst: number[] = [];
    for (let x = c.w.a + 1; x < c.w.b; x += 1) {
      if (znak(c, x) < 0) {
        k += 1;
        lst.push(x);
      }
    }
    if (k < 2) {
      return null;
    }
    const proverka = reshit(fig, { t: 'celye-znak', znak: -1 });
    const ext = c.w.ekstremumy.map((e) => e.x);
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$, определённой на интервале $${interval(c.w.a, c.w.b)}$. Сколько целых точек этого интервала, в которых производная отрицательна?`,
      risunok: fig,
      otvet: k,
      proverka: proverka ?? Number.NaN,
      razbor: razborIz([
        shag('Правило', "$f'(x)<0$ там, где функция убывает."),
        shag(
          'Промежутки убывания',
          `Вершины графика: $x=${ext.map(d).join('$, $x=')}$. Между ними функция убывает на тех промежутках, где график идёт вниз.`,
        ),
        shag(
          'Целые точки',
          `Целые точки на спуске (вершины не считаем, там производная равна нулю): $${lst.map(d).join(';\\ ')}$.`,
        ),
        shag('Ответ', `$${k}$`),
      ]),
      podskazka: [
        vopros(
          r,
          "Где $f'(x)<0$?",
          'Там, где график идёт вниз',
          [
            {
              tekst: 'Там, где график ниже оси $Ox$',
              pochemu: 'Это знак самой $f$, а не её производной.',
            },
            { tekst: 'В вершинах графика', pochemu: "В вершинах $f'=0$." },
          ],
          "$f'<0$ при убывании.",
          1,
        ),
        vopros(
          r,
          'Чему равна производная в вершинах графика, и считаются ли они?',
          'Равна нулю, не считаются',
          [
            {
              tekst: 'Отрицательна, считаются',
              pochemu: 'В вершине касательная горизонтальна: производная равна нулю.',
            },
            {
              tekst: 'Положительна, не считаются',
              pochemu: 'В вершине производная ни положительна, ни отрицательна — она нулевая.',
            },
          ],
          'Вершины пропускаем.',
          1,
        ),
        qChislo(
          r,
          'Сколько целых точек на спуске?',
          k,
          [
            { v: k + c.w.ekstremumy.length, w: 'Вершины посчитаны как точки спуска.' },
            { v: k - 1, w: 'Одна точка пропущена.' },
            { v: k + 1, w: 'Одна точка посчитана лишней.' },
          ],
          `Ответ: $${k}$.`,
          1,
        ),
      ],
      params: { a: c.w.a, b: c.w.b, k },
    };
  },
);

function tochkaEkstremuma(tip: 'max' | 'min', id: string, nazv: string) {
  return micro(id, nazv, 'number', (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 3]);
    if (c === null) {
      return null;
    }
    const mine = c.w.ekstremumy.filter((e) => e.tip === tip);
    if (mine.length !== 1) {
      return null;
    }
    const e = mine[0] as { x: number };
    const fig = risunokF(
      c,
      [],
      c.w.ekstremumy.map((q): Pomoshch => ({ t: 'vert', x: q.x, shag: 1 })),
    );
    if (fig === null) {
      return null;
    }
    const proverka = ekstremumy(fig, c.w.a, c.w.b).filter(
      (z) => z.tip === (tip === 'max' ? 'plus-minus' : 'minus-plus'),
    );
    const mx = tip === 'max';
    const other = c.w.ekstremumy.filter((q) => q.tip !== tip).map((q) => q.x);
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$, определённой на интервале $${interval(c.w.a, c.w.b)}$. Найдите точку ${mx ? 'максимума' : 'минимума'} функции.`,
      risunok: fig,
      otvet: e.x,
      proverka: proverka.length === 1 ? Math.round((proverka[0] as { x: number }).x) : Number.NaN,
      razbor: razborIz([
        shag(
          'Определение',
          mx
            ? 'Точка максимума — точка, где функция меняет возрастание на убывание («горка»).'
            : 'Точка минимума — точка, где функция меняет убывание на возрастание («ямка»).',
        ),
        shag(
          'Ищем на графике',
          `Вершины графика: $x=${c.w.ekstremumy.map((q) => d(q.x)).join('$, $x=')}$.`,
        ),
        shag(
          'Отбор',
          `${mx ? 'Горка' : 'Ямка'} — это $x=${d(e.x)}$.${other.length ? ` В точках $x=${other.map(d).join('$, $x=')}$ вершины противоположного вида.` : ''}`,
        ),
        shag('Ответ', `$${d(e.x)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          `Как выглядит точка ${mx ? 'максимума' : 'минимума'} на графике?`,
          mx
            ? 'Вершина «горки»: слева график идёт вверх, справа вниз'
            : 'Дно «ямки»: слева график идёт вниз, справа вверх',
          [
            {
              tekst: mx ? 'Дно «ямки»' : 'Вершина «горки»',
              pochemu: mx ? 'Это минимум, а не максимум.' : 'Это максимум, а не минимум.',
            },
            {
              tekst: 'Точка пересечения с осью $Ox$',
              pochemu: 'Пересечение с осью — нуль функции, а не экстремум.',
            },
          ],
          mx ? 'Максимум — «горка».' : 'Минимум — «ямка».',
          1,
        ),
        qChislo(
          r,
          'Какая абсцисса у такой вершины?',
          e.x,
          [
            ...other.map((x) => ({
              v: x,
              w: mx ? 'Это «ямка» — минимум.' : 'Это «горка» — максимум.',
            })),
            { v: e.x + 1, w: 'Абсцисса сдвинута на клетку: смотрите по сетке.' },
            {
              v: -e.x,
              w: 'Знак абсциссы потерян: проверьте, по какую сторону от оси $Oy$ вершина.',
            },
          ],
          `Ответ: $${d(e.x)}$.`,
          1,
        ),
      ],
      params: { x: e.x, n: c.w.ekstremumy.length },
    };
  });
}

const m06 = tochkaEkstremuma('max', 'P9-3-06', 'Точка максимума по графику');
const m07 = tochkaEkstremuma('min', 'P9-3-07', 'Точка минимума по графику');

const m08 = micro(
  'P9-3-08',
  'Знак производной на промежутке',
  'choice',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [1, 3]);
    if (c === null) {
      return null;
    }
    const p = r.int(c.w.a + 1, c.w.b - 3);
    const q = r.int(p + 2, Math.min(p + 6, c.w.b - 1));
    const inner = c.w.ekstremumy.filter((e) => e.x > p && e.x < q);
    const touched = c.w.ekstremumy.some((e) => e.x === p || e.x === q);
    if (inner.length > 1 || touched) {
      return null;
    }
    const mid = (p + q) / 2;
    const s = inner.length === 1 ? 0 : znak(c, Math.floor(mid)) || znak(c, Math.ceil(mid));
    const OPT = [
      `$${FP}(x)>0$ на всём промежутке`,
      `$${FP}(x)<0$ на всём промежутке`,
      `$${FP}(x)$ меняет знак на промежутке`,
    ];
    const idx = s > 0 ? 0 : s < 0 ? 1 : 2;
    const fig = risunokF(
      c,
      [],
      [
        { t: 'otrezok', p, q, shag: 1 },
        ...inner.map((e): Pomoshch => ({ t: 'vert', x: e.x, shag: 1 })),
      ],
    );
    if (fig === null) {
      return null;
    }
    const v = vybor(
      r,
      OPT[idx] as string,
      OPT.filter((_, i) => i !== idx),
    );
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$. Что можно сказать о знаке производной на промежутке $${interval(p, q)}$?`,
      risunok: fig,
      knopki: v.knopki,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag(
          'Смотрим на промежуток',
          `На $${interval(p, q)}$ ${inner.length === 1 ? `лежит вершина $x=${d((inner[0] as { x: number }).x)}$: направление графика меняется.` : s > 0 ? 'график идёт вверх без вершин.' : 'график идёт вниз без вершин.'}`,
        ),
        shag(
          'Вывод',
          inner.length === 1
            ? "Слева и справа от вершины знак $f'$ разный: он меняется."
            : s > 0
              ? "Функция возрастает, $f'>0$ на всём промежутке."
              : "Функция убывает, $f'<0$ на всём промежутке.",
        ),
        shag('Ответ', OPT[idx] as string),
      ]),
      podskazka: [
        vopros(
          r,
          `Есть ли на промежутке $${interval(p, q)}$ вершина графика?`,
          inner.length === 1 ? 'Есть' : 'Нет',
          [
            {
              tekst: inner.length === 1 ? 'Нет' : 'Есть',
              pochemu:
                inner.length === 1
                  ? 'Присмотритесь: график разворачивается внутри промежутка.'
                  : 'Внутри промежутка график идёт в одну сторону, разворота нет.',
            },
          ],
          inner.length === 1 ? 'Вершина есть: знак меняется.' : 'Вершины нет: знак один.',
          1,
        ),
        vopros(
          r,
          'Какой вывод о знаке производной?',
          OPT[idx] as string,
          OPT.filter((_, i) => i !== idx).map((t) => ({
            tekst: t,
            pochemu:
              'Сверьте с тем, куда идёт график: вверх — плюс, вниз — минус, разворот — смена знака.',
          })),
          `Ответ: ${OPT[idx]}.`,
          1,
        ),
      ],
      params: { p, q, s },
    };
  },
);

const m09 = micro('P9-3-09', 'Число точек экстремума', 'number', (r): PrepGenerated | null => {
  const c = volnaF(r, [2, 4]);
  if (c === null) {
    return null;
  }
  const fig = risunokF(
    c,
    [],
    c.w.ekstremumy.map((e): Pomoshch => ({ t: 'vert', x: e.x, shag: 1 })),
  );
  if (fig === null) {
    return null;
  }
  const k = c.w.ekstremumy.length;
  const proverka = ekstremumy(fig, c.w.a, c.w.b).filter(
    (z) => z.tip === 'plus-minus' || z.tip === 'minus-plus',
  ).length;
  const mx = c.w.ekstremumy.filter((e) => e.tip === 'max').length;
  return {
    uslovie: `На рисунке изображён график функции $y=f(x)$, определённой на интервале $${interval(c.w.a, c.w.b)}$. Найдите количество точек экстремума функции.`,
    risunok: fig,
    otvet: k,
    proverka,
    razbor: razborIz([
      shag(
        'Определение',
        'Точки экстремума — точки максимума и минимума, где график меняет направление.',
      ),
      shag('Считаем «горки»', `Точек максимума: $${mx}$.`),
      shag('Считаем «ямки»', `Точек минимума: $${k - mx}$.`),
      shag('Ответ', `$${mx}+${k - mx}=${k}$`),
    ]),
    podskazka: [
      vopros(
        r,
        'Считаются ли концы интервала точками экстремума?',
        'Нет: они не внутри интервала',
        [
          {
            tekst: 'Да',
            pochemu:
              'Концы интервала не входят в него, и точкой экстремума может быть только внутренняя точка.',
          },
        ],
        'Считаем только вершины внутри интервала.',
      ),
      qChislo(
        r,
        'Сколько «горок» (максимумов) на графике?',
        mx,
        [
          { v: k, w: 'Это число всех вершин, а нужны только «горки».' },
          { v: mx + 1, w: 'Лишняя вершина.' },
        ],
        `Максимумов: $${mx}$.`,
        1,
      ),
      qChislo(
        r,
        'Сколько всего точек экстремума?',
        k,
        [
          { v: mx, w: 'Минимумы не добавлены.' },
          { v: k + 1, w: 'Посчитан конец интервала.' },
          { v: k - 1, w: 'Одна вершина пропущена.' },
        ],
        `Ответ: $${k}$.`,
        1,
      ),
    ],
    params: { k, mx },
  };
});

const m10 = micro(
  'P9-3-10',
  'Промежуток, где производная отрицательна',
  'choice',
  (r): PrepGenerated | null => {
    const c = volnaF(r, [2, 3]);
    if (c === null) {
      return null;
    }
    const exts = c.w.ekstremumy.map((e) => e.x);
    const kind = (p: number, q: number): 'dec' | 'inc' | 'mix' => {
      if (exts.some((x) => x > p && x < q)) {
        return 'mix';
      }
      return znak(c, Math.floor((p + q) / 2)) < 0 ||
        ((p + q) % 2 !== 0 && znak(c, Math.ceil((p + q) / 2)) < 0)
        ? 'dec'
        : 'inc';
    };
    const all: { p: number; q: number; k: 'dec' | 'inc' | 'mix' }[] = [];
    for (let p = c.w.a + 1; p < c.w.b; p += 1) {
      for (let q = p + 2; q <= Math.min(p + 5, c.w.b - 1); q += 1) {
        all.push({ p, q, k: kind(p, q) });
      }
    }
    const pick = (k: string) => all.filter((t) => t.k === k);
    const dec = pick('dec');
    const inc = pick('inc');
    const mix = pick('mix');
    if (dec.length === 0 || inc.length === 0 || mix.length < 2) {
      return null;
    }
    const good = r.pick(dec);
    const w1 = r.pick(inc);
    const w2 = r.pick(mix);
    const w3 = r.pick(mix.filter((t) => t.p !== w2.p || t.q !== w2.q));
    const t = (o: { p: number; q: number }) => `$${interval(o.p, o.q)}$`;
    const fig = risunokF(
      c,
      [],
      exts.map((x): Pomoshch => ({ t: 'vert', x, shag: 1 })),
    );
    if (fig === null) {
      return null;
    }
    const v = vybor(r, t(good), [t(w1), t(w2), t(w3)]);
    return {
      uslovie: `На рисунке изображён график функции $y=f(x)$. На каком из промежутков производная отрицательна на всём промежутке?`,
      risunok: fig,
      knopki: v.knopki,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag('Правило', "$f'<0$ там, где график идёт вниз, и без разворотов внутри промежутка."),
        shag(
          'Проверяем варианты',
          `${t(w1)} — график идёт вверх; ${t(w2)} и ${t(w3)} — внутри есть вершина, направление меняется.`,
        ),
        shag('Ответ', t(good)),
      ]),
      podskazka: [
        vopros(
          r,
          'Что должен делать график на нужном промежутке?',
          'Идти вниз, без вершин внутри',
          [
            { tekst: 'Идти вверх', pochemu: 'Подъём — это положительная производная.' },
            {
              tekst: 'Иметь вершину внутри',
              pochemu: 'В вершине производная меняет знак: промежуток не подходит.',
            },
          ],
          'Нужен спуск без вершин.',
          1,
        ),
        vopros(
          r,
          'Какой из промежутков подходит?',
          t(good),
          [t(w1), t(w2), t(w3)].map((x) => ({
            tekst: x,
            pochemu:
              x === t(w1) ? 'Здесь график идёт вверх.' : 'Внутри этого промежутка есть вершина.',
          })),
          `Подходит ${t(good)}.`,
          1,
        ),
      ],
      params: { p: good.p, q: good.q },
    };
  },
);

export const BLOCK_3: PrepMicro[] = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];
