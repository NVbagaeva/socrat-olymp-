/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №9.
 *
 * Тот же движок, что у прототипов группы IV: волна f′ по целым узлам
 * (`figura`, сплайн из spline.ts), вспомогательные построения по шагам,
 * сборка с проверкой рисунка и независимым пересчётом ответа
 * (`sobrat` → `reshit`). Узлы задаёт вариант, а не генератор. В банк,
 * тренажёр и генератор №9 не входит.
 */

import { rngOf } from '../vychisleniya/rng';
import { nuliUzlov } from './chtenie';
import { figura } from './krivye';
import { chislaOtvet } from './otvet';
import { promezhutki, xRavno, znakiPomoshch } from './prototypes/chtenie-pom';
import { NE_IZ_BANKA, shag, sobrat, vopros } from './prototypes/common';
import { zadacha921 } from './prototypes/kasatelnaya';
import { zadachaZnak } from './prototypes/po-grafiku-f';
import { znakZnacheniya } from './chtenie';
import { d, otrezok } from './tex';
import type { Figura, Generated, Pomoshch, Uzel } from './types';
import { grafikP } from './uslovie';

const MINUS_PLUS = 'с $-$ на $+$';
const PLUS_MINUS = 'с $+$ на $-$';
/* В вопросах подсказки знаки — в кавычках. */
const MINUS_PLUS_K = 'с «$-$» на «$+$»';
const PLUS_MINUS_K = 'с «$+$» на «$-$»';

export interface MaxNaOtrezke {
  /** Узлы волны f′: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Отрезок вопроса. */
  p: number;
  q: number;
}

type Tip = 'max' | 'min';

/** Слова для точки максимума и минимума: что ищем и что отбрасываем. */
const SLOVA: Record<
  Tip,
  { imya: string; imyaR: string; drugoeR: string; znak: string; drugoyZnak: string }
> = {
  max: {
    imya: 'максимум',
    imyaR: 'максимума',
    drugoeR: 'минимума',
    znak: PLUS_MINUS,
    drugoyZnak: MINUS_PLUS,
  },
  min: {
    imya: 'минимум',
    imyaR: 'минимума',
    drugoeR: 'максимума',
    znak: MINUS_PLUS,
    drugoyZnak: PLUS_MINUS,
  },
};

/**
 * Точка максимума f на отрезке по графику f′, когда на отрезке есть и
 * точка минимума, а у f′ внутри отрезка — вершина, которая нулём не
 * является. Подвох: выбрать нуль со сменой знака «+ на −», а не любой
 * нуль и не вершину графика f′.
 */
export function maxNaOtrezke(par: MaxNaOtrezke): Generated | null {
  return ekstremumNaOtrezke(par, 'max');
}

/** То же для точки минимума: на отрезке есть и точка максимума. */
export function minNaOtrezke(par: MaxNaOtrezke): Generated | null {
  return ekstremumNaOtrezke(par, 'min');
}

function ekstremumNaOtrezke(par: MaxNaOtrezke, tip: Tip): Generated | null {
  const { p, q } = par;
  const w = SLOVA[tip];
  const drugoy: Tip = tip === 'max' ? 'min' : 'max';
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const nuli = nuliUzlov(uzly).map((z) => ({ x: z.x, tip: z.sleva > 0 ? 'max' : 'min' }));
  const zs = nuli.map((z) => z.x);
  const vnutri = nuli.filter((z) => z.x > p && z.x < q);
  const max = vnutri.filter((z) => z.tip === tip);
  const min = vnutri.filter((z) => z.tip === drugoy);
  if (max.length !== 1 || min.length < 1) return null;
  const ans = max[0]!.x;
  /* Вершина f′ на отрезке, не нуль: ловушка «экстремум производной». */
  const vershiny = uzly.filter((u, i) => {
    const l = uzly[i - 1];
    const r = uzly[i + 1];
    return (
      l !== undefined &&
      r !== undefined &&
      u.y !== 0 &&
      u.x > p &&
      u.x < q &&
      (u.y - l.y) * (u.y - r.y) > 0
    );
  });
  const ps = promezhutki([a, ...zs, b], (m) => znakZnacheniya(uzly, m));
  const fig: Figura = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'otrezok', p, q, shag: 1 },
      ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
      ...znakiPomoshch(ps, 3),
    ],
  });
  const kod = tip === 'max' ? 'pv9' : 'pv9min';
  const r = rngOf(`${kod}|${par.uzly.join(';')}|${p}|${q}`);
  const minX = min.map((z) => z.x);
  const draft = sobrat(fig, { t: tip === 'max' ? 'max-na-otrezke' : 'min-na-otrezke', p, q }, ans, {
    uslovie: `${grafikP(a, b)} В какой точке отрезка $${otrezok(p, q)}$ функция $f(x)$ имеет ${w.imya}?`,
    shagi: [
      shag(
        `Что такое точка ${w.imyaR}`,
        tip === 'max'
          ? "В точке максимума функции $f$ производная $f'$ равна нулю и меняет знак с «$+$» на «$-$»: слева функция возрастает, справа убывает. На графике $f'$ — это пересечение оси $Ox$ сверху вниз."
          : "В точке минимума функции $f$ производная $f'$ равна нулю и меняет знак с «$-$» на «$+$»: слева функция убывает, справа возрастает. На графике $f'$ — это пересечение оси $Ox$ снизу вверх.",
      ),
      shag(
        'Находим нули производной',
        `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}.`,
        ...nuli.map(
          (z) =>
            `$x=${d(z.x)}$: знак $f'$ меняется ${SLOVA[z.tip as Tip].znak}, точка ${SLOVA[z.tip as Tip].imyaR}.`,
        ),
      ),
      shag(
        'Выбираем точку на отрезке',
        `На отрезке $${otrezok(p, q)}$ лежат нули ${xRavno(vnutri.map((z) => z.x))}.`,
        `${xRavno(minX)} — точк${minX.length === 1 ? 'а' : 'и'} ${w.drugoeR} (знак меняется ${w.drugoyZnak}), ${minX.length === 1 ? 'она' : 'они'} не подходит.`.replace(
          'не подходит',
          minX.length === 1 ? 'не подходит' : 'не подходят',
        ),
        ...(vershiny.length === 0
          ? []
          : [
              `Вершины графика $f'$ (${xRavno(vershiny.map((u) => u.x))}) — не нули производной: там $f'\\ne0$, экстремума функции $f$ нет.`,
            ]),
        `Точка ${w.imyaR} на отрезке одна: $x=${d(ans)}$.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(
        r,
        `Как на графике $f'$ узнать точку ${w.imyaR} функции $f$?`,
        `$f'$ пересекает ось $Ox$, меняя знак ${tip === 'max' ? PLUS_MINUS_K : MINUS_PLUS_K}`,
        [
          {
            tekst:
              tip === 'max'
                ? "Это наивысшая точка графика $f'$"
                : "Это наинизшая точка графика $f'$",
            pochemu: "Вершина графика $f'$ — экстремум производной, а не функции $f$.",
          },
          {
            tekst: `$f'$ пересекает ось $Ox$, меняя знак ${tip === 'max' ? MINUS_PLUS_K : PLUS_MINUS_K}`,
            pochemu:
              tip === 'max'
                ? 'Так выглядит точка минимума: функция сначала убывает, потом возрастает.'
                : 'Так выглядит точка максимума: функция сначала возрастает, потом убывает.',
          },
        ],
        tip === 'max'
          ? "Слева от точки максимума $f$ возрастает ($f'>0$), справа убывает ($f'<0$)."
          : "Слева от точки минимума $f$ убывает ($f'<0$), справа возрастает ($f'>0$).",
      ),
      vopros(
        r,
        `Какие нули $f'$ лежат на отрезке $${otrezok(p, q)}$?`,
        xRavno(vnutri.map((z) => z.x)),
        [
          {
            tekst: xRavno([ans]),
            pochemu: 'На отрезке есть и другие нули — посмотрите на весь отрезок.',
          },
          {
            tekst: xRavno(zs),
            pochemu: 'Часть этих нулей лежит вне отрезка.',
          },
        ],
        undefined,
        2,
      ),
      vopros(
        r,
        `Какой из них — точка ${w.imyaR}?`,
        `$x=${d(ans)}$`,
        [
          ...minX.slice(0, 1).map((x) => ({
            tekst: `$x=${d(x)}$`,
            pochemu: `Здесь знак $f'$ меняется ${w.drugoyZnak}: это ${SLOVA[drugoy].imya}.`,
          })),
          ...vershiny.slice(0, 1).map((u) => ({
            tekst: `$x=${d(u.x)}$`,
            pochemu: "Это вершина графика $f'$, там $f'\\ne0$.",
          })),
        ],
        `Знак меняется ${w.znak} только в $x=${d(ans)}$.`,
        3,
      ),
    ],
    params: { a, b, p, q, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: `${kod}|${par.uzly.join(';')}|${p}|${q}`,
  });
  return draft === null
    ? null
    : {
        ...draft,
        prototype: tip === 'max' ? 'PV9-MAX' : 'PV9-MIN',
        seed: 'fixed',
        istochnik: NE_IZ_BANKA,
      };
}

export interface ChisloNaOtrezke extends MaxNaOtrezke {
  /** Что считаем: точки максимума или все точки экстремума. */
  tip: 'max' | 'extr';
}

/**
 * Число точек максимума (или экстремума) f на отрезке по графику f′.
 * Подвох: нули вне отрезка не считаются, а для «максимума» — и нули со
 * сменой знака «− на +»; вершины графика f′ — не экстремумы f.
 */
export function chisloNaOtrezke(par: ChisloNaOtrezke): Generated | null {
  const { p, q, tip } = par;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const nuli = nuliUzlov(uzly).map((z) => ({ x: z.x, tip: (z.sleva > 0 ? 'max' : 'min') as Tip }));
  const zs = nuli.map((z) => z.x);
  const vnutri = nuli.filter((z) => z.x >= p && z.x <= q);
  const vne = nuli.filter((z) => z.x < p || z.x > q);
  const nuzhnye = vnutri.filter((z) => tip === 'extr' || z.tip === 'max');
  const lishnie = vnutri.filter((z) => tip === 'max' && z.tip === 'min');
  const ans = nuzhnye.length;
  /* Подвох должен быть: нули вне отрезка, а для «максимума» — и минимумы на нём. */
  if (ans < 2 || vne.length === 0 || (tip === 'max' && lishnie.length === 0)) return null;
  const ps = promezhutki([a, ...zs, b], (m) => znakZnacheniya(uzly, m));
  const fig: Figura = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'otrezok', p, q, shag: 1 },
      ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
      ...znakiPomoshch(ps, 3),
    ],
  });
  const kod = `pv9n${tip}|${par.uzly.join(';')}|${p}|${q}`;
  const r = rngOf(kod);
  const chto = tip === 'max' ? 'точек максимума' : 'точек экстремума';
  const nX = nuzhnye.map((z) => z.x);
  const draft = sobrat(fig, { t: tip === 'max' ? 'chislo-max' : 'chislo-extr', p, q }, ans, {
    uslovie: `${grafikP(a, b)} Найдите количество ${chto} функции $f(x)$, принадлежащих отрезку $${otrezok(p, q)}$.`,
    shagi: [
      shag(
        tip === 'max' ? 'Что такое точка максимума' : 'Что такое точка экстремума',
        tip === 'max'
          ? "В точке максимума производная $f'$ равна нулю и меняет знак с «$+$» на «$-$»: на графике $f'$ — пересечение оси $Ox$ сверху вниз."
          : "В точке экстремума производная $f'$ равна нулю и меняет знак: на графике $f'$ — пересечение оси $Ox$. Сверху вниз — максимум, снизу вверх — минимум.",
      ),
      shag(
        'Находим нули производной',
        `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}.`,
        ...nuli.map(
          (z) =>
            `$x=${d(z.x)}$: знак $f'$ меняется ${SLOVA[z.tip].znak}, точка ${SLOVA[z.tip].imyaR}.`,
        ),
      ),
      shag(
        'Оставляем точки отрезка',
        `Вне отрезка $${otrezok(p, q)}$: ${xRavno(vne.map((z) => z.x))} — не считаем.`,
        ...(lishnie.length === 0
          ? []
          : [
              `${xRavno(lishnie.map((z) => z.x))} — точк${lishnie.length === 1 ? 'а' : 'и'} минимума, не считаем.`,
            ]),
        `Остаются ${xRavno(nX)}: ${ans} ${tochekSlovo(ans)}.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(
        r,
        tip === 'max'
          ? "Как на графике $f'$ узнать точку максимума функции $f$?"
          : "Как на графике $f'$ узнать точку экстремума функции $f$?",
        tip === 'max'
          ? `$f'$ пересекает ось $Ox$, меняя знак ${PLUS_MINUS_K}`
          : "$f'$ пересекает ось $Ox$ (меняет знак)",
        [
          {
            tekst: "Это вершина графика $f'$",
            pochemu: "Вершина графика $f'$ — экстремум производной, а не функции $f$.",
          },
          tip === 'max'
            ? {
                tekst: `$f'$ пересекает ось $Ox$, меняя знак ${MINUS_PLUS_K}`,
                pochemu: 'Так выглядит точка минимума.',
              }
            : {
                tekst: "$f'$ положительна",
                pochemu: 'Там функция возрастает, но экстремума нет.',
              },
        ],
      ),
      vopros(
        r,
        `Какие нули $f'$ лежат на отрезке $${otrezok(p, q)}$?`,
        xRavno(vnutri.map((z) => z.x)),
        [
          { tekst: xRavno(zs), pochemu: `${xRavno(vne.map((z) => z.x))} — вне отрезка.` },
          ...(lishnie.length === 0
            ? []
            : [
                {
                  tekst: xRavno(nX),
                  pochemu: 'Здесь только точки максимума, а спрашиваем все нули на отрезке.',
                },
              ]),
        ],
        undefined,
        2,
      ),
      vopros(
        r,
        `Сколько из них — ${chto}?`,
        `$${ans}$`,
        [
          { tekst: `$${zs.length}$`, pochemu: 'Посчитаны и нули вне отрезка.' },
          ...(lishnie.length === 0
            ? [{ tekst: `$${ans - 1}$`, pochemu: 'Пропущена одна из точек на отрезке.' }]
            : [{ tekst: `$${vnutri.length}$`, pochemu: 'Посчитаны и точки минимума.' }]),
        ],
        `${xRavno(nX)}.`,
        3,
      ),
    ],
    params: { a, b, p, q, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : {
        ...draft,
        prototype: tip === 'max' ? 'PV9-CHISLO-MAX' : 'PV9-CHISLO-EXTR',
        seed: 'fixed',
        istochnik: NE_IZ_BANKA,
      };
}

function tochekSlovo(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'точка';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'точки';
  return 'точек';
}

export interface SkorostVMoment {
  /** x(t) = a2·t² + a1·t + a0, коэффициенты — конечные десятичные. */
  a2: number;
  a1: number;
  a0: number;
  t0: number;
  /** Что движется и что такое x. */
  kto: string;
  x: string;
}

/** Член c·t^k со знаком, коэффициент десятичный. */
function chlenD(c: number, k: number, first: boolean): string {
  if (c === 0) return '';
  const sign = c < 0 ? '-' : first ? '' : '+';
  const abs = Math.abs(c);
  const t = k === 0 ? '' : k === 1 ? 't' : `t^{${k}}`;
  const coef = abs === 1 && k !== 0 ? '' : d(abs);
  return `${sign}${coef}${t}`;
}

function mnogochlenD(cs: [number, number][]): string {
  let out = '';
  for (const [c, k] of cs) out += chlenD(c, k, out === '');
  return out === '' ? '0' : out;
}

/** Округление до 10⁻⁶: убирает хвосты двоичной арифметики. */
function okr(x: number): number {
  return Math.round(x * 1e6) / 1e6;
}

/**
 * Скорость в момент t₀ по квадратичному закону с десятичными
 * коэффициентами (как 9.1.1). Подвох: v = 2·a2·t + a1 — коэффициент при t²
 * удваивается; подставить t₀ в x(t) — частая ошибка.
 */
export function skorostVMoment(par: SkorostVMoment): Generated {
  const { a2, a1, a0, t0 } = par;
  const v = okr(2 * a2 * t0 + a1);
  const proverka = okr(
    (a2 * (t0 + 1e-3) ** 2 + a1 * (t0 + 1e-3) - (a2 * (t0 - 1e-3) ** 2 + a1 * (t0 - 1e-3))) / 2e-3,
  );
  const xt = mnogochlenD([
    [a2, 2],
    [a1, 1],
    [a0, 0],
  ]);
  const vt = mnogochlenD([
    [okr(2 * a2), 1],
    [a1, 0],
  ]);
  const r = rngOf(`pv9v|${a2}|${a1}|${a0}|${t0}`);
  const xT0 = okr(a2 * t0 * t0 + a1 * t0 + a0);
  return {
    uslovie: `${par.kto} по закону $x(t)=${xt}$, где $x$ — ${par.x} (в метрах), $t$ — время (в секундах), прошедшее с начала движения. Найдите скорость (в м/с) в момент времени $t=${t0}$ с.`,
    risunok: null,
    zapros: null,
    otvet: v,
    proverka: Math.round(proverka * 1e4) / 1e4,
    shagi: [
      shag(
        "Находим скорость $v(t)=x'(t)$",
        "Скорость — производная закона движения: $v(t)=x'(t)$.",
        `$\\left(${chlenD(a2, 2, true)}\\right)'=${d(a2)}\\cdot 2t=${chlenD(okr(2 * a2), 1, true)}$, $\\left(${chlenD(a1, 1, true)}\\right)'=${d(a1)}$, $(${d(a0)})'=0$.`,
        `$v(t)=${vt}$`,
      ),
      shag(
        `Подставляем $t=${t0}$`,
        `$v(${t0})=${d(okr(2 * a2))}\\cdot ${t0}${a1 < 0 ? '-' : '+'}${d(Math.abs(a1))}=${d(v)}$`,
      ),
      shag(
        'Ответ',
        `Скорость в момент $t=${t0}$ с равна $${d(v)}$ м/с.`,
        `**Ответ: ${chislaOtvet(v)}**`,
      ),
    ],
    podskazka: [
      vopros(
        r,
        'Как связаны скорость и закон движения $x(t)$?',
        "$v(t)=x'(t)$",
        [
          { tekst: '$v(t)=x(t)$', pochemu: 'Это само расстояние, а не скорость.' },
          {
            tekst: '$v(t)=\\dfrac{x(t)}{t}$',
            pochemu: 'Так считают среднюю скорость, а нужна скорость в момент.',
          },
        ],
        'Скорость в момент времени — это производная закона движения.',
      ),
      vopros(
        r,
        "Чему равна производная $x'(t)$?",
        `$${vt}$`,
        [
          {
            tekst: `$${mnogochlenD([
              [a2, 1],
              [a1, 0],
            ])}$`,
            pochemu: `Показатель не умножен на коэффициент: $(${chlenD(a2, 2, true)})'=${chlenD(okr(2 * a2), 1, true)}$.`,
          },
          {
            tekst: `$${mnogochlenD([
              [okr(2 * a2), 1],
              [a1, 0],
              [a0, 0],
            ])}$`,
            pochemu: 'Производная постоянного слагаемого равна нулю.',
          },
        ],
        `$v(t)=${vt}$`,
      ),
      vopros(
        r,
        `Чему равна скорость при $t=${t0}$?`,
        `$${d(v)}$`,
        [
          {
            tekst: `$${d(xT0)}$`,
            pochemu:
              'Это координата $x(t_0)$: подставили $t_0$ в закон движения, а не в производную.',
          },
          {
            tekst: `$${d(okr(a2 * t0 + a1))}$`,
            pochemu: 'Коэффициент при $t^2$ не удвоен.',
          },
        ].filter((o) => o.tekst !== `$${d(v)}$`),
      ),
    ],
    params: { a2, a1, a0, t0, ans: v },
    signature: `pv9v|${a2}|${a1}|${a0}|${t0}`,
    prototype: 'PV9-SKOROST',
    seed: 'fixed',
    istochnik: NE_IZ_BANKA,
  };
}

export interface KasatelnayaPoUzlam {
  /** Узлы кривой f: [x, y], x по возрастанию; узел касания — с абсциссой x0. */
  uzly: [number, number][];
  /** Абсцисса точки касания (узел кривой). */
  x0: number;
  /** Два узла сетки на касательной, A левее B. */
  A: [number, number];
  B: [number, number];
}

function nod(a: number, b: number): number {
  return b === 0 ? a : nod(b, a % b);
}

/**
 * f′(x₀) по графику f и касательной (как 9.2.1): кривая и узлы
 * касательной заданы вариантом. Наклон кривой в узле касания ставится
 * равным наклону прямой AB. Подвох прежний — знак наклона и катеты
 * «Δy к Δx», а не наоборот; рисунок, проверки и разбор — те же, что в 9.2.1.
 */
export function kasatelnayaPoUzlam(par: KasatelnayaPoUzlam): Generated | null {
  const { x0, A, B } = par;
  const dx = B[0] - A[0];
  const dy = B[1] - A[1];
  if (dx <= 0 || dy === 0) return null;
  const g = nod(Math.abs(dy), dx);
  const p = dy / g;
  const q = dx / g;
  const uzel = par.uzly.find(([x]) => x === x0);
  if (uzel === undefined) return null;
  const y0 = uzel[1];
  /* Узел касания лежит на прямой AB. */
  if ((x0 - A[0]) * dy !== (y0 - A[1]) * dx) return null;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => (x === x0 ? { x, y, m: p / q } : { x, y }));
  const s = { uzly, a: uzly[0]!.x, b: uzly.at(-1)!.x, x0, y0, p, q };
  const base = figura('f', 'f(x)', uzly, {});
  const ok = base.okno;
  for (const [x, y] of [A, B]) {
    if (x < ok.xmin + 1 || x > ok.xmax - 1 || y < ok.ymin + 1 || y > ok.ymax - 1) return null;
  }
  const kod = `pv9k|${par.uzly.join(';')}|${x0}|${A.join(':')}|${B.join(':')}`;
  const draft = zadacha921(rngOf(kod), s, base, A, B);
  return draft === null
    ? null
    : {
        ...draft,
        signature: kod,
        prototype: 'PV9-KASAT',
        seed: 'fixed',
        istochnik: NE_IZ_BANKA,
      };
}

export interface ZnakVTochkah {
  /** Узлы кривой f: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Отмеченные точки x₁ … xₙ: целые, по возрастанию. */
  metki: number[];
  /** Что считаем: f′ > 0 (1) или f′ < 0 (−1). */
  znak: 1 | -1;
}

/**
 * Сколько отмеченных точек, где f′ > 0 (или f′ < 0), по графику f (как
 * 9.3.1 / 9.3.2), но точек много — 13, и часть стоит у самых вершин.
 * Подвох — знак производной читают по направлению графика, а не по его
 * положению относительно оси Ox; рисунок и разбор — те же, что в 9.3.1.
 */
export function znakVTochkah(par: ZnakVTochkah): Generated | null {
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const w = { uzly, a: uzly[0]!.x, b: uzly.at(-1)!.x };
  const kod = `pv9z|${par.znak}|${par.uzly.join(';')}|${par.metki.join(',')}`;
  const draft = zadachaZnak(rngOf(kod), par.znak, w, [...par.metki]);
  return draft === null
    ? null
    : {
        ...draft,
        signature: kod,
        prototype: par.znak > 0 ? 'PV9-ZNAK-PLUS' : 'PV9-ZNAK-MINUS',
        seed: 'fixed',
        istochnik: NE_IZ_BANKA,
      };
}
