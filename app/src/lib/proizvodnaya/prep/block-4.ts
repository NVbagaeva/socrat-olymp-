/** Блок P9-4 · Нули производной и экстремумы по графику f′. */

import type { Rng } from '../../veroyatnost/generator';
import { okno, raznesennye } from '../krivye';
import { shag } from '../prototypes/common';
import { nuliProizvodnoy } from '../reshit';
import { interval } from '../tex';
import type { Figura, Pomoshch, Uzel } from '../types';
import { d, figKrivaya, micro, qChislo, razborIz, vopros, vybor } from './pomoshniki';
import type { PrepGenerated, PrepMicro } from './types';

type Tip = 'x' | 't';

interface Pf {
  uzly: Uzel[];
  a: number;
  b: number;
  /** Нули по возрастанию: абсцисса, тип (пересечение или касание), знак слева. */
  nuli: { x: number; tip: Tip; sleva: 1 | -1 }[];
  /** Знаки долей между границами. */
  doli: { from: number; to: number; s: 1 | -1 }[];
}

/** График f′ с заданной последовательностью нулей: пересечения и касания. */
function postroitP(r: Rng, tipy: Tip[]): Pf | null {
  const a = r.int(-9, -4);
  const b = r.int(4, 9);
  if (b - a < 8 || b - a > 17) {
    return null;
  }
  const zs = raznesennye(r, a + 1, b - 1, tipy.length, 3);
  if (zs === null) {
    return null;
  }
  const s0: 1 | -1 = r.next() < 0.5 ? 1 : -1;
  const bounds = [a, ...zs, b];
  const doli: Pf['doli'] = [];
  const nuli: Pf['nuli'] = [];
  let s = s0;
  const uzly: Uzel[] = [];
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const from = bounds[i] as number;
    const to = bounds[i + 1] as number;
    doli.push({ from, to, s });
    const left = i === 0;
    const right = i === bounds.length - 2;
    if (left) {
      uzly.push({ x: from, y: s * r.int(1, 3) });
    }
    const peak = r.int(from + 1, to - 1);
    if (peak > from && peak < to && (peak !== from) && to - from >= 2) {
      if (!(left && peak === from) && !(right && peak === to)) {
        uzly.push({ x: peak, y: s * r.int(2, 4) });
      }
    }
    if (right) {
      uzly.push({ x: to, y: s * r.int(1, 3) });
    } else {
      uzly.push({ x: to, y: 0 });
      const tip = tipy[i] as Tip;
      nuli.push({ x: to, tip, sleva: s });
      if (tip === 'x') {
        s = (-s) as 1 | -1;
      }
    }
  }
  /* Узлы строго по возрастанию. */
  for (let i = 1; i < uzly.length; i += 1) {
    if ((uzly[i] as Uzel).x <= (uzly[i - 1] as Uzel).x) {
      return null;
    }
  }
  return { uzly, a, b, nuli, doli };
}

function figP(p: Pf, metki: number[] = [], pom: Pomoshch[] = []): Figura | null {
  return figKrivaya('fprime', p.uzly, okno(p.uzly), { metki, pomoshch: pom });
}

function pereseky(p: Pf) {
  return p.nuli.filter((z) => z.tip === 'x');
}

/** Знак f′ в целой точке по структуре. */
function znakP(p: Pf, x: number): number {
  for (const dl of p.doli) {
    if (x > dl.from && x < dl.to) {
      return dl.s;
    }
  }
  return 0;
}

/** Проверка по данным рисунка: нули с типами. */
function skolkoNuley(fig: Figura): { vse: number; max: number; min: number } {
  const z = nuliProizvodnoy(fig);
  return {
    vse: z.length,
    max: z.filter((q) => q.tip === 'plus-minus').length,
    min: z.filter((q) => q.tip === 'minus-plus').length,
  };
}

const VERT = (p: Pf, shagN = 1): Pomoshch[] => p.nuli.map((z) => ({ t: 'vert', x: z.x, shag: shagN }));

const TIP_TEXT = ['точка максимума', 'точка минимума', 'не точка экстремума'];

function tipNulya(z: { tip: Tip; sleva: 1 | -1 }): number {
  return z.tip === 't' ? 2 : z.sleva > 0 ? 0 : 1;
}

function lestnicaTip(r: Rng, z: { tip: Tip; sleva: 1 | -1 }, x: number) {
  const idx = tipNulya(z);
  const slevaT = z.sleva > 0 ? 'плюс' : 'минус';
  const spravaT = z.tip === 't' ? slevaT : z.sleva > 0 ? 'минус' : 'плюс';
  return [
    vopros(
      r,
      `Какой знак у $f'$ слева от нуля $x_1$ (график над осью $Ox$ или под ней)?`,
      slevaT === 'плюс' ? 'Плюс: график над осью' : 'Минус: график под осью',
      [{ tekst: slevaT === 'плюс' ? 'Минус: график под осью' : 'Плюс: график над осью', pochemu: slevaT === 'плюс' ? 'Слева от $x_1$ график лежит выше оси.' : 'Слева от $x_1$ график лежит ниже оси.' }],
      `Слева знак «${slevaT === 'плюс' ? '+' : '−'}».`,
      1,
    ),
    vopros(
      r,
      `Какой знак у $f'$ справа от $x_1$?`,
      spravaT === 'плюс' ? 'Плюс: график над осью' : 'Минус: график под осью',
      [{ tekst: spravaT === 'плюс' ? 'Минус: график под осью' : 'Плюс: график над осью', pochemu: z.tip === 't' ? 'График лишь касается оси и возвращается на ту же сторону: знак не меняется.' : 'Справа график по другую сторону оси, чем слева.' }],
      `Справа знак «${spravaT === 'плюс' ? '+' : '−'}».`,
      1,
    ),
    vopros(
      r,
      'Что это значит для функции $f$?',
      TIP_TEXT[idx] as string,
      TIP_TEXT.filter((_, i) => i !== idx).map((t) => ({
        tekst: t,
        pochemu:
          t === 'не точка экстремума'
            ? 'Экстремум есть, когда знак $f\'$ меняется.'
            : t === 'точка максимума'
              ? 'Максимум — смена знака с «+» на «−».'
              : 'Минимум — смена знака с «−» на «+».',
      })),
      `$x_1=${d(x)}$ — ${TIP_TEXT[idx]}.`,
      1,
    ),
  ];
}

function opisanieTipa(z: { tip: Tip; sleva: 1 | -1 }): string {
  if (z.tip === 't') {
    return `знак $f'$ не меняется (график касается оси ${z.sleva > 0 ? 'сверху' : 'снизу'}), экстремума нет`;
  }
  return z.sleva > 0 ? "знак $f'$ меняется с «+» на «−»: максимум" : "знак $f'$ меняется с «−» на «+»: минимум";
}

const m01 = micro('P9-4-01', 'Тип нуля производной: максимум, минимум, не экстремум', 'choice', (r): PrepGenerated | null => {
  const kind = r.pick<Tip>(['x', 'x', 't']);
  const tipy: Tip[] = r.next() < 0.5 ? [kind] : r.next() < 0.5 ? [kind, 'x'] : ['x', kind];
  const p = postroitP(r, tipy);
  if (p === null) {
    return null;
  }
  const z = p.nuli[tipy.indexOf(kind)] as Pf['nuli'][number];
  const fig = figP(p, [z.x], [{ t: 'vert', x: z.x, shag: 1 }]);
  if (fig === null) {
    return null;
  }
  const idx = tipNulya(z);
  const v = vybor(r, TIP_TEXT[idx] as string, TIP_TEXT.filter((_, i) => i !== idx));
  return {
    uslovie: "На рисунке изображён график производной $y=f'(x)$ функции $f(x)$. Точка $x_1$ — нуль производной. Что можно сказать о точке $x_1$ для функции $f(x)$?",
    risunok: fig,
    varianty: v.varianty,
    otvet: v.otvet,
    proverka: v.otvet,
    razbor: razborIz([
      shag('Знаки слева и справа', `Слева от $x_1$ производная ${z.sleva > 0 ? 'положительна' : 'отрицательна'}, справа ${z.tip === 't' ? (z.sleva > 0 ? 'тоже положительна' : 'тоже отрицательна') : z.sleva > 0 ? 'отрицательна' : 'положительна'}.`),
      shag('Вывод', `${opisanieTipa(z)}.`),
      shag('Ответ', TIP_TEXT[idx] as string),
    ]),
    podskazka: lestnicaTip(r, z, z.x),
    params: { x: z.x, tip: idx },
  };
});

const m02 = micro('P9-4-02', 'Максимум или минимум в нуле производной', 'choice', (r): PrepGenerated | null => {
  const n = r.int(1, 3);
  const p = postroitP(r, Array(n).fill('x') as Tip[]);
  if (p === null) {
    return null;
  }
  const z = r.pick(p.nuli);
  const fig = figP(p, [z.x], [{ t: 'vert', x: z.x, shag: 1 }]);
  if (fig === null) {
    return null;
  }
  const mx = z.sleva > 0;
  const v = vybor(r, mx ? 'максимума' : 'минимума', [mx ? 'минимума' : 'максимума']);
  return {
    uslovie: "На рисунке изображён график производной $y=f'(x)$. Точка $x_1$ — нуль производной. Функция $f(x)$ в точке $x_1$ имеет точку…",
    risunok: fig,
    varianty: v.varianty,
    otvet: v.otvet,
    proverka: v.otvet,
    razbor: razborIz([
      shag('Знаки', `Слева от $x_1$ график $f'$ ${mx ? 'выше' : 'ниже'} оси: $f'${mx ? '>' : '<'}0$; справа ${mx ? 'ниже' : 'выше'}: $f'${mx ? '<' : '>'}0$.`),
      shag('Вывод', mx ? 'Функция сначала растёт, затем убывает: максимум.' : 'Функция сначала убывает, затем растёт: минимум.'),
      shag('Ответ', mx ? 'максимума' : 'минимума'),
    ]),
    podskazka: lestnicaTip(r, z, z.x),
    params: { x: z.x, mx: mx ? 1 : 0 },
  };
});

const m03 = micro('P9-4-03', 'Число нулей производной', 'number', (r): PrepGenerated | null => {
  const n = r.int(2, 5);
  const p = postroitP(r, Array(n).fill('x') as Tip[]);
  if (p === null) {
    return null;
  }
  const fig = figP(p, [], VERT(p));
  if (fig === null) {
    return null;
  }
  const k = p.nuli.length;
  return {
    uslovie: `На рисунке изображён график производной $y=f'(x)$ функции $f(x)$, определённой на интервале $${interval(p.a, p.b)}$. Сколько нулей имеет производная?`,
    risunok: fig,
    otvet: k,
    proverka: skolkoNuley(fig).vse,
    razbor: razborIz([
      shag('Что такое нуль', "Нуль производной — точка, где график $f'$ пересекает ось $Ox$."),
      shag('Считаем пересечения', `Пересечения при $x=${p.nuli.map((z) => d(z.x)).join('$, $x=')}$.`),
      shag('Ответ', `$${k}$`),
    ]),
    podskazka: [
      vopros(r, "Что значит $f'(x)=0$ на графике $f'$?", 'График лежит на оси $Ox$ в этой точке', [
        { tekst: 'График пересекает ось $Oy$', pochemu: 'Ось $Oy$ даёт значение $f\'(0)$.' },
        { tekst: 'График имеет вершину', pochemu: 'Вершина графика $f\'$ — экстремум самой производной, а не её нуль.' },
      ], 'Нули — это пересечения с осью $Ox$.', 1),
      qChislo(r, 'Сколько раз график пересекает ось $Ox$?', k, [
        { v: k + 1, w: 'Лишнее пересечение: проверьте, что график действительно доходит до оси.' },
        { v: k - 1, w: 'Одно пересечение пропущено.' },
        { v: p.uzly.length, w: 'Посчитаны все узлы графика, а не только пересечения оси.' },
      ], `Ответ: $${k}$.`, 1),
    ],
    params: { k },
  };
});

const m04 = micro('P9-4-04', 'Число точек экстремума при касании оси', 'number', (r): PrepGenerated | null => {
  const nx = r.int(2, 3);
  const tipy: Tip[] = Array(nx).fill('x') as Tip[];
  tipy.splice(r.int(0, nx), 0, 't');
  const p = postroitP(r, tipy);
  if (p === null) {
    return null;
  }
  const fig = figP(p, [], VERT(p));
  if (fig === null) {
    return null;
  }
  const k = pereseky(p).length;
  const t = p.nuli.find((z) => z.tip === 't') as Pf['nuli'][number];
  const sz = skolkoNuley(fig);
  return {
    uslovie: `На рисунке изображён график производной $y=f'(x)$ функции $f(x)$, определённой на интервале $${interval(p.a, p.b)}$. Сколько точек экстремума имеет функция $f(x)$?`,
    risunok: fig,
    otvet: k,
    proverka: sz.max + sz.min,
    razbor: razborIz([
      shag('Нули производной', `Всего нулей $${p.nuli.length}$: $x=${p.nuli.map((z) => d(z.x)).join('$, $x=')}$.`),
      shag('Смена знака', `В точке $x=${d(t.x)}$ график лишь касается оси, знак $f'$ не меняется — экстремума нет. В остальных нулях знак меняется.`),
      shag('Ответ', `$${p.nuli.length}-1=${k}$`),
    ]),
    podskazka: [
      vopros(r, 'Всякий ли нуль производной — точка экстремума?', 'Нет: нужна смена знака производной', [
        { tekst: 'Да, всегда', pochemu: 'Если график $f\'$ лишь касается оси, знак не меняется и экстремума нет.' },
        { tekst: 'Только если график уходит ниже оси', pochemu: 'Важна смена знака в любую сторону: с «+» на «−» или с «−» на «+».' },
      ], 'Нужна смена знака.', 1),
      qChislo(r, 'Сколько нулей, в которых график пересекает ось (знак меняется)?', k, [
        { v: p.nuli.length, w: 'Посчитано и касание оси, а там знак не меняется.' },
        { v: k - 1, w: 'Одно пересечение пропущено.' },
        { v: 1, w: 'Вспомните: экстремум в каждом нуле со сменой знака, а не один.' },
      ], `Ответ: $${k}$.`, 1),
    ],
    params: { k, nuli: p.nuli.length },
  };
});

const m05 = micro('P9-4-05', 'Знак производной в отмеченной точке', 'choice', (r): PrepGenerated | null => {
  const p = postroitP(r, Array(r.int(1, 3)).fill('x') as Tip[]);
  if (p === null) {
    return null;
  }
  const cand: number[] = [];
  for (let x = p.a + 1; x < p.b; x += 1) {
    const s = znakP(p, x);
    if (s !== 0 && Math.abs(spline(p, x)) >= 1) {
      cand.push(x);
    }
  }
  if (cand.length === 0) {
    return null;
  }
  const x1 = r.pick(cand);
  const s = znakP(p, x1);
  const fig = figP(p, [x1], [{ t: 'vert', x: x1, shag: 1 }]);
  if (fig === null) {
    return null;
  }
  const OPT = ["$f'(x_1)>0$", "$f'(x_1)<0$", "$f'(x_1)=0$"];
  const idx = s > 0 ? 0 : 1;
  const v = vybor(r, OPT[idx] as string, OPT.filter((_, i) => i !== idx));
  return {
    uslovie: "На рисунке изображён график производной $y=f'(x)$ функции $f(x)$. Каков знак $f'(x_1)$ в отмеченной точке $x_1$?",
    risunok: fig,
    varianty: v.varianty,
    otvet: v.otvet,
    proverka: v.otvet,
    razbor: razborIz([
      shag('Что нарисовано', "График самой производной: её знак — это положение графика относительно оси $Ox$."),
      shag('Смотрим на точку', `В точке $x_1$ график ${s > 0 ? 'выше' : 'ниже'} оси $Ox$.`),
      shag('Ответ', OPT[idx] as string),
    ]),
    podskazka: [
      vopros(r, "По какому признаку определяется знак $f'$ на этом рисунке?", 'По положению графика относительно оси $Ox$', [
        { tekst: 'По тому, идёт ли график вверх или вниз', pochemu: 'Здесь нарисована сама производная: наклон её графика говорит о второй производной, а не о знаке $f\'$.' },
        { tekst: 'По значению абсциссы', pochemu: 'Знак определяется ординатой графика, а не абсциссой точки.' },
      ], "Знак $f'$ — выше или ниже оси.", 1),
      vopros(r, 'Где лежит график в точке $x_1$?', s > 0 ? 'Выше оси $Ox$' : 'Ниже оси $Ox$', [
        { tekst: s > 0 ? 'Ниже оси $Ox$' : 'Выше оси $Ox$', pochemu: 'Посмотрите на пунктир: график на другой стороне.' },
        { tekst: 'На оси $Ox$', pochemu: 'На оси график лежал бы в нуле производной, а здесь он в стороне.' },
      ], s > 0 ? "$f'(x_1)>0$." : "$f'(x_1)<0$.", 1),
    ],
    params: { x1, s },
  };
});

/** Значение нарисованной f′ в точке (по узлам; для порога читаемости). */
function spline(p: Pf, x: number): number {
  for (let i = 0; i < p.uzly.length - 1; i += 1) {
    const u = p.uzly[i] as Uzel;
    const w = p.uzly[i + 1] as Uzel;
    if (x >= u.x && x <= w.x) {
      return u.y + ((w.y - u.y) * (x - u.x)) / (w.x - u.x);
    }
  }
  return 0;
}

function ekstremumOdin(tip: 'max' | 'min', id: string, nazv: string) {
  return micro(id, nazv, 'number', (r): PrepGenerated | null => {
    const n = r.int(2, 4);
    const p = postroitP(r, Array(n).fill('x') as Tip[]);
    if (p === null) {
      return null;
    }
    const mx = tip === 'max';
    const mine = pereseky(p).filter((z) => (z.sleva > 0) === mx);
    if (mine.length !== 1) {
      return null;
    }
    const z = mine[0] as Pf['nuli'][number];
    const fig = figP(p, [], VERT(p));
    if (fig === null) {
      return null;
    }
    const sz = nuliProizvodnoy(fig).filter((q) => q.tip === (mx ? 'plus-minus' : 'minus-plus'));
    const drugie = p.nuli.filter((q) => q.x !== z.x);
    return {
      uslovie: `На рисунке изображён график производной $y=f'(x)$ функции $f(x)$, определённой на интервале $${interval(p.a, p.b)}$. Найдите точку ${mx ? 'максимума' : 'минимума'} функции $f(x)$.`,
      risunok: fig,
      otvet: z.x,
      proverka: sz.length === 1 ? Math.round((sz[0] as { x: number }).x) : Number.NaN,
      razbor: razborIz([
        shag('Условие экстремума', mx ? "В точке максимума $f'$ меняет знак с «+» на «−»." : "В точке минимума $f'$ меняет знак с «−» на «+».") ,
        shag('Нули', `Нули производной: $x=${p.nuli.map((q) => d(q.x)).join('$, $x=')}$.`),
        shag('Смена знака', `${mx ? 'С «+» на «−»' : 'С «−» на «+»'} график переходит в точке $x=${d(z.x)}$.`),
        shag('Ответ', `$${d(z.x)}$`),
      ]),
      podskazka: [
        vopros(r, `Как меняется знак $f'$ в точке ${mx ? 'максимума' : 'минимума'}?`, mx ? 'С «+» на «−»' : 'С «−» на «+»', [
          { tekst: mx ? 'С «−» на «+»' : 'С «+» на «−»', pochemu: mx ? 'Так меняется знак в точке минимума.' : 'Так меняется знак в точке максимума.' },
          { tekst: 'Не меняется', pochemu: 'Без смены знака экстремума нет.' },
        ], mx ? 'Максимум: «+» → «−».' : 'Минимум: «−» → «+».', 1),
        qChislo(r, 'В каком нуле производной знак меняется так?', z.x, [
          ...drugie.map((q) => ({ v: q.x, w: 'В этом нуле знак меняется в другую сторону: это экстремум противоположного вида.' })),
          { v: -z.x, w: 'Знак абсциссы потерян.' },
        ], `Ответ: $${d(z.x)}$.`, 1),
      ],
      params: { x: z.x, n },
    };
  });
}

const m06 = ekstremumOdin('max', 'P9-4-06', 'Точка максимума по графику производной');
const m07 = ekstremumOdin('min', 'P9-4-07', 'Точка минимума по графику производной');

const m08 = micro('P9-4-08', 'Промежуток возрастания функции', 'choice', (r): PrepGenerated | null => {
  const p = postroitP(r, Array(r.int(2, 3)).fill('x') as Tip[]);
  if (p === null) {
    return null;
  }
  const zs = p.nuli.map((z) => z.x);
  const kind = (u: number, w: number): 'inc' | 'dec' | 'mix' =>
    zs.some((x) => x > u && x < w) ? 'mix' : znakP(p, Math.floor((u + w) / 2)) > 0 || znakP(p, Math.ceil((u + w) / 2)) > 0 ? 'inc' : 'dec';
  const all: { p: number; q: number; k: string }[] = [];
  for (let u = p.a + 1; u < p.b; u += 1) {
    for (let w = u + 2; w <= Math.min(u + 5, p.b - 1); w += 1) {
      all.push({ p: u, q: w, k: kind(u, w) });
    }
  }
  const inc = all.filter((t) => t.k === 'inc');
  const dec = all.filter((t) => t.k === 'dec');
  const mix = all.filter((t) => t.k === 'mix');
  if (inc.length === 0 || dec.length === 0 || mix.length < 2) {
    return null;
  }
  const good = r.pick(inc);
  const w1 = r.pick(dec);
  const w2 = r.pick(mix);
  const w3 = r.pick(mix.filter((t) => t.p !== w2.p || t.q !== w2.q));
  const t = (o: { p: number; q: number }) => `$${interval(o.p, o.q)}$`;
  const fig = figP(p, [], VERT(p));
  if (fig === null) {
    return null;
  }
  const v = vybor(r, t(good), [t(w1), t(w2), t(w3)]);
  return {
    uslovie: "На рисунке изображён график производной $y=f'(x)$ функции $f(x)$. На каком из промежутков функция $f(x)$ возрастает?",
    risunok: fig,
    varianty: v.varianty,
    otvet: v.otvet,
    proverka: v.otvet,
    razbor: razborIz([
      shag('Правило', "$f$ возрастает там, где $f'>0$, то есть график $f'$ лежит выше оси $Ox$ на всём промежутке."),
      shag('Проверяем', `${t(w1)} — график $f'$ ниже оси; ${t(w2)} и ${t(w3)} — внутри график пересекает ось, знак меняется.`),
      shag('Ответ', t(good)),
    ]),
    podskazka: [
      vopros(r, "Где функция $f$ возрастает?", "Где $f'>0$: график $f'$ выше оси", [
        { tekst: "Где график $f'$ идёт вверх", pochemu: "Подъём графика $f'$ не связан с возрастанием $f$: важно положение относительно оси." },
        { tekst: "Где $f'<0$: график $f'$ ниже оси", pochemu: 'Там функция убывает.' },
      ], "Нужно $f'>0$.", 1),
      vopros(r, 'Какой промежуток целиком лежит над осью?', t(good), [t(w1), t(w2), t(w3)].map((x) => ({ tekst: x, pochemu: x === t(w1) ? 'Здесь график $f\'$ ниже оси.' : 'Внутри график $f\'$ пересекает ось: знак меняется.' })), `Ответ: ${t(good)}.`, 1),
    ],
    params: { p: good.p, q: good.q },
  };
});

const m09 = micro('P9-4-09', 'Число точек максимума', 'number', (r): PrepGenerated | null => {
  const n = r.int(3, 5);
  const p = postroitP(r, Array(n).fill('x') as Tip[]);
  if (p === null) {
    return null;
  }
  const k = pereseky(p).filter((z) => z.sleva > 0).length;
  if (k < 1 || k > n - 1) {
    return null;
  }
  const fig = figP(p, [], VERT(p));
  if (fig === null) {
    return null;
  }
  const mx = pereseky(p).filter((z) => z.sleva > 0).map((z) => z.x);
  return {
    uslovie: `На рисунке изображён график производной $y=f'(x)$ функции $f(x)$, определённой на интервале $${interval(p.a, p.b)}$. Сколько точек максимума имеет функция $f(x)$?`,
    risunok: fig,
    otvet: k,
    proverka: skolkoNuley(fig).max,
    razbor: razborIz([
      shag('Условие максимума', "Максимум — нуль $f'$, где знак меняется с «+» на «−»: график идёт сверху вниз через ось."),
      shag('Считаем', `Таких нулей $${k}$: $x=${mx.map(d).join('$, $x=')}$.`),
      shag('Ответ', `$${k}$`),
    ]),
    podskazka: [
      vopros(r, 'Как график $f\'$ проходит через ось в точке максимума?', 'Сверху вниз', [
        { tekst: 'Снизу вверх', pochemu: 'Так проходит ось точка минимума.' },
        { tekst: 'Не пересекает ось', pochemu: 'Без пересечения знак не меняется.' },
      ], 'Максимум: сверху вниз.', 1),
      qChislo(r, 'Сколько нулей, где график идёт сверху вниз?', k, [
        { v: n - k, w: 'Посчитаны переходы снизу вверх — это минимумы.' },
        { v: n, w: 'Посчитаны все нули подряд.' },
        { v: k + 1, w: 'Лишний нуль.' },
      ], `Ответ: $${k}$.`, 1),
    ],
    params: { n, k },
  };
});

const m10 = micro('P9-4-10', 'Сколько касательных горизонтальны', 'number', (r): PrepGenerated | null => {
  const nx = r.int(1, 3);
  const tipy: Tip[] = Array(nx).fill('x') as Tip[];
  tipy.splice(r.int(0, nx), 0, 't');
  const p = postroitP(r, tipy);
  if (p === null) {
    return null;
  }
  const fig = figP(p, [], VERT(p));
  if (fig === null) {
    return null;
  }
  const k = p.nuli.length;
  return {
    uslovie: `На рисунке изображён график производной $y=f'(x)$ функции $f(x)$, определённой на интервале $${interval(p.a, p.b)}$. Сколько точек графика функции $f(x)$ имеют горизонтальную касательную?`,
    risunok: fig,
    otvet: k,
    proverka: skolkoNuley(fig).vse,
    razbor: razborIz([
      shag('Условие', "Касательная горизонтальна, когда её угловой коэффициент равен нулю: $f'(x)=0$."),
      shag('Нули', `График $f'$ имеет общие точки с осью $Ox$ при $x=${p.nuli.map((z) => d(z.x)).join('$, $x=')}$ — в том числе точку касания.`),
      shag('Важно', 'Экстремума в точке касания нет, но касательная к графику $f$ там всё равно горизонтальна: считаем все нули.'),
      shag('Ответ', `$${k}$`),
    ]),
    podskazka: [
      vopros(r, 'Чему равна производная в точке, где касательная горизонтальна?', 'Нулю', [
        { tekst: 'Единице', pochemu: 'Угловой коэффициент $1$ — угол $45^\\circ$, а не горизонталь.' },
        { tekst: 'Она не существует', pochemu: 'У гладкой функции она существует и равна нулю.' },
      ], "$f'(x)=0$.", 1),
      vopros(r, 'Считать ли точку, где график $f\'$ только касается оси?', 'Да: там тоже $f\'(x)=0$', [
        { tekst: 'Нет: там нет экстремума', pochemu: 'Вопрос про горизонтальную касательную, а не про экстремум: там $f\'=0$, значит, касательная горизонтальна.' },
      ], 'Считаем и касание.', 1),
      qChislo(r, 'Сколько всего общих точек у графика $f\'$ с осью $Ox$?', k, [
        { v: k - 1, w: 'Точка касания не посчитана.' },
        { v: k + 1, w: 'Лишняя точка.' },
      ], `Ответ: $${k}$.`, 1),
    ],
    params: { k },
  };
});

export const BLOCK_4: PrepMicro[] = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];
