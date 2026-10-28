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
import { ekstremumyUzlov, nuliUzlov, znakProizvodnoy } from './chtenie';
import { figura } from './krivye';
import { chislaOtvet } from './otvet';
import { promezhutki, xRavno, znakiPomoshch } from './prototypes/chtenie-pom';
import { NE_IZ_BANKA, shag, sobrat, vopros } from './prototypes/common';
import { zadacha921, zadachaNaibNaim } from './prototypes/kasatelnaya';
import { zadachaZnak } from './prototypes/po-grafiku-f';
import { znakZnacheniya } from './chtenie';
import { d, interval, otrezok } from './tex';
import type { Figura, Generated, Pomoshch, Uzel } from './types';
import { grafikF, grafikP } from './uslovie';

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
  /** Что считаем: точки максимума, минимума или все точки экстремума. */
  tip: 'max' | 'min' | 'extr';
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
  const nuzhnye = vnutri.filter((z) => tip === 'extr' || z.tip === tip);
  const lishnie = vnutri.filter((z) => tip !== 'extr' && z.tip !== tip);
  const ans = nuzhnye.length;
  /* Подвох должен быть: нули вне отрезка, а для «максимума» («минимума») — и точки другого вида на нём. */
  if (ans < 2 || vne.length === 0 || (tip !== 'extr' && lishnie.length === 0)) return null;
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
  const chto =
    tip === 'max' ? 'точек максимума' : tip === 'min' ? 'точек минимума' : 'точек экстремума';
  const drugoy = tip === 'max' ? 'минимума' : 'максимума';
  const nX = nuzhnye.map((z) => z.x);
  const draft = sobrat(fig, { t: `chislo-${tip}` as const, p, q }, ans, {
    uslovie: `${grafikP(a, b)} Найдите количество ${chto} функции $f(x)$, принадлежащих отрезку $${otrezok(p, q)}$.`,
    shagi: [
      shag(
        tip === 'max'
          ? 'Что такое точка максимума'
          : tip === 'min'
            ? 'Что такое точка минимума'
            : 'Что такое точка экстремума',
        tip === 'max'
          ? "В точке максимума производная $f'$ равна нулю и меняет знак с «$+$» на «$-$»: на графике $f'$ — пересечение оси $Ox$ сверху вниз."
          : tip === 'min'
            ? "В точке минимума производная $f'$ равна нулю и меняет знак с «$-$» на «$+$»: на графике $f'$ — пересечение оси $Ox$ снизу вверх."
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
              `${xRavno(lishnie.map((z) => z.x))} — точк${lishnie.length === 1 ? 'а' : 'и'} ${drugoy}, не считаем.`,
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
          : tip === 'min'
            ? "Как на графике $f'$ узнать точку минимума функции $f$?"
            : "Как на графике $f'$ узнать точку экстремума функции $f$?",
        tip === 'max'
          ? `$f'$ пересекает ось $Ox$, меняя знак ${PLUS_MINUS_K}`
          : tip === 'min'
            ? `$f'$ пересекает ось $Ox$, меняя знак ${MINUS_PLUS_K}`
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
            : tip === 'min'
              ? {
                  tekst: `$f'$ пересекает ось $Ox$, меняя знак ${PLUS_MINUS_K}`,
                  pochemu: 'Так выглядит точка максимума.',
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
                  pochemu: `Здесь только точки ${tip === 'min' ? 'минимума' : 'максимума'}, а спрашиваем все нули на отрезке.`,
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
            : [{ tekst: `$${vnutri.length}$`, pochemu: `Посчитаны и точки ${drugoy}.` }]),
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
        prototype: tip === 'max' ? 'PV9-CHISLO-MAX' : tip === 'min' ? 'PV9-CHISLO-MIN' : 'PV9-CHISLO-EXTR',
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
 * равным наклону прямой AB. Подвох прежний — знак наклона и какой
 * катет делить на какой; рисунок, проверки и разбор — те же, что в 9.2.1.
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

/* ── Партия 3 ───────────────────────────────────────────────────── */

export interface KasatelnayaNachalo {
  /** Узлы кривой f: [x, y], x по возрастанию; узел касания — с абсциссой x0. */
  uzly: [number, number][];
  /** Абсцисса точки касания (узел кривой, x0 ≠ 0). */
  x0: number;
}

/**
 * Касательная к графику f в точке с абсциссой x₀ проходит через начало
 * координат; найти f′(x₀). Касательной на рисунке нет — только точка
 * графика. Подвох — прямая через O и (x₀; f(x₀)) имеет наклон f(x₀)/x₀:
 * его надо увидеть, а не искать касательную на глаз.
 */
export function kasatelnayaCherezNachalo(par: KasatelnayaNachalo): Generated | null {
  const { x0 } = par;
  const uzel = par.uzly.find(([x]) => x === x0);
  if (uzel === undefined || x0 === 0) return null;
  const y0 = uzel[1];
  const k = Math.round((y0 / x0) * 1e9) / 1e9;
  if (Math.abs(k * 1e4 - Math.round(k * 1e4)) > 1e-6) return null;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => (x === x0 ? { x, y, m: y0 / x0 } : { x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const fig = figura('f', 'f(x)', uzly, {
    tochkaNaGrafike: x0,
    obyazatelnye: [x0],
    pomoshch: [
      { t: 'tochka', x: 0, y: 0, shag: 1 },
      { t: 'liniya', a: [0, 0], b: [x0, y0], shag: 1 },
    ],
  });
  const kod = `pv9kn|${par.uzly.join(';')}|${x0}`;
  const r = rngOf(kod);
  const vozr = k > 0;
  const draft = sobrat(fig, { t: 'kasat-nachalo', p: x0 }, k, {
    uslovie: `На рисунке изображён график функции $y=f(x)$. Прямая, проходящая через начало координат, касается графика этой функции в точке с абсциссой $${d(x0)}$. Найдите значение производной функции $f(x)$ в точке $x_0=${d(x0)}$.`,
    shagi: [
      shag(
        'Что нужно найти',
        "Значение производной в точке касания равно угловому коэффициенту касательной: $f'(x_0)=k$.",
      ),
      shag(
        'Две точки касательной',
        `Касательная проходит через начало координат $O(0;\\ 0)$ и через точку касания. По рисунку $f(${d(x0)})=${d(y0)}$, точка касания — $(${d(x0)};\\ ${d(y0)})$.`,
      ),
      shag(
        'Угловой коэффициент',
        `Прямая через начало координат — это $y=kx$, и $k=\\dfrac{y}{x}$ для любой её точки: $k=\\dfrac{${d(y0)}}{${d(x0)}}=${d(k)}$.`,
        vozr
          ? `Касательная идёт вверх слева направо, ответ положителен — сходится.`
          : `Касательная идёт вниз слева направо, ответ отрицателен — сходится.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(k)}**`),
    ],
    podskazka: [
      vopros(
        r,
        'Через какие две точки проходит касательная?',
        `$O(0;\\ 0)$ и $(${d(x0)};\\ ${d(y0)})$`,
        [
          {
            tekst: `$O(0;\\ 0)$ и $(${d(y0)};\\ ${d(x0)})$`,
            pochemu: 'Координаты переставлены: сначала абсцисса, потом ордината.',
          },
          {
            tekst: `$(${d(x0)};\\ 0)$ и $(${d(x0)};\\ ${d(y0)})$`,
            pochemu: 'Это вертикальный пунктир, а не касательная.',
          },
        ],
        'Начало координат дано в условии, точка касания — на графике.',
        1,
      ),
      vopros(
        r,
        "Чему равен $f'(x_0)$?",
        `$${d(k)}$`,
        [
          { tekst: `$${d(Math.round((x0 / y0) * 1e4) / 1e4)}$`, pochemu: 'Делить надо $y$ на $x$, а не наоборот.' },
          { tekst: `$${d(-k)}$`, pochemu: 'Знак перепутан: посмотрите, куда идёт прямая.' },
          { tekst: `$${d(y0)}$`, pochemu: "Это значение функции $f(x_0)$, а не производной." },
        ].filter((o) => o.tekst !== `$${d(k)}$`),
        `$k=\\dfrac{${d(y0)}}{${d(x0)}}$.`,
        1,
      ),
    ],
    params: { a, b, x0, y0, ans: k, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : { ...draft, prototype: 'PV9-KASAT-NACHALO', seed: 'fixed', istochnik: NE_IZ_BANKA };
}

export interface NaibNaimMetka {
  /** Узлы кривой f: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Отмеченные точки: целые, разные, по возрастанию; подписаны абсциссами. */
  metki: number[];
  /** 1 — где производная наибольшая, 0 — наименьшая. */
  naib: number;
}

/**
 * В какой отмеченной точке производная наибольшая (наименьшая) — по
 * графику f (как 9.2.5 / 9.2.6), кривая и точки заданы вариантом. Точки
 * на оси подписаны своими абсциссами, в ответе — сама точка, как в ЕГЭ.
 * Подвох — у вершин производная нулевая, а сравнивают не высоту точек,
 * а крутизну подъёма или спуска.
 */
export function naibNaimMetka(par: NaibNaimMetka): Generated | null {
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const w = { uzly, a: uzly[0]!.x, b: uzly.at(-1)!.x };
  const kod = `pv9nm|${par.naib}|${par.uzly.join(';')}|${par.metki.join(',')}`;
  const draft = zadachaNaibNaim(rngOf(kod), w, [...par.metki], par.naib === 1, true);
  return draft === null
    ? null
    : {
        ...draft,
        signature: kod,
        prototype: par.naib === 1 ? 'PV9-NAIB-METKA' : 'PV9-NAIM-METKA',
        seed: 'fixed',
        istochnik: NE_IZ_BANKA,
      };
}

export interface SkorostMnogochlen {
  /** Члены закона x(t): [числитель, знаменатель, степень], степени по убыванию. */
  chleny: [number, number, number][];
  t0: number;
  /** Что движется: «Материальная точка движется прямолинейно». */
  kto: string;
}

/** Член (n/d)·t^k в TeX со знаком: «-\dfrac14t^{3}», «+7t^{2}», «-8t». */
function chlenDrob(n: number, den: number, k: number, first: boolean): string {
  if (n === 0) return '';
  const sign = n < 0 ? '-' : first ? '' : '+';
  const abs = Math.abs(n);
  const t = k === 0 ? '' : k === 1 ? 't' : `t^{${k}}`;
  const coef = den === 1 ? (abs === 1 && k !== 0 ? '' : String(abs)) : `\\dfrac{${abs}}{${den}}`;
  return `${sign}${coef}${t}`;
}

/**
 * Скорость в момент t₀ по закону движения — многочлену третьей или
 * четвёртой степени с дробными коэффициентами (как 9.1.1). Подвох —
 * показатель умножается на дробный коэффициент, а подставлять t₀ надо в
 * производную, не в закон.
 */
export function skorostMnogochlen(par: SkorostMnogochlen): Generated {
  const { chleny, t0 } = par;
  const proizv = chleny
    .filter(([, , k]) => k > 0)
    .map(([n, den, k]) => [n * k, den, k - 1] as [number, number, number]);
  const znach = (cs: [number, number, number][], t: number) =>
    cs.reduce((s, [n, den, k]) => s + (n / den) * t ** k, 0);
  const v = okr(znach(proizv, t0));
  const xFun = (t: number) => znach(chleny, t);
  const h = 1e-4;
  const proverka = Math.round(((xFun(t0 + h) - xFun(t0 - h)) / (2 * h)) * 1e4) / 1e4;
  const tex = (cs: [number, number, number][]) => {
    let out = '';
    for (const [n, den, k] of cs) {
      /* Сокращаем коэффициент: 4/2 → 2. */
      const g = nod(Math.abs(n), den);
      out += chlenDrob(n / g, den / g, k, out === '');
    }
    return out === '' ? '0' : out;
  };
  const xt = tex(chleny);
  const vt = tex(proizv);
  const podst = proizv
    .map(([n, den, k], i) => {
      const g = nod(Math.abs(n), den);
      const [cn, cd] = [Math.abs(n) / g, den / g];
      const sign = n < 0 ? '-' : i === 0 ? '' : '+';
      const c = cd === 1 ? String(cn) : `\\dfrac{${cn}}{${cd}}`;
      const t = k === 0 ? '' : k === 1 ? `\\cdot ${t0}` : `\\cdot ${t0}^{${k}}`;
      return `${sign}${c}${t}`;
    })
    .join('');
  const r = rngOf(`pv9vm|${JSON.stringify(chleny)}|${t0}`);
  const xT0 = okr(znach(chleny, t0));
  return {
    uslovie: `${par.kto} по закону $x(t)=${xt}$, где $x$ — расстояние от точки отсчёта в метрах, $t$ — время в секундах, прошедшее с начала движения. Найдите её скорость (в метрах в секунду) в момент времени $t=${t0}$ с.`,
    risunok: null,
    zapros: null,
    otvet: v,
    proverka,
    shagi: [
      shag(
        "Находим скорость $v(t)=x'(t)$",
        "Скорость — производная закона движения: $v(t)=x'(t)$. Производная степени: $(c\\,t^n)'=c\\cdot n\\,t^{n-1}$, постоянное слагаемое даёт $0$.",
        `$v(t)=${vt}$`,
      ),
      shag(`Подставляем $t=${t0}$`, `$v(${t0})=${podst}=${d(v)}$`),
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
      vopros(r, "Чему равна производная $x'(t)$?", `$${vt}$`, [
        {
          tekst: `$${tex(chleny.filter(([, , k]) => k > 0).map(([n, den, k]) => [n, den, k - 1]))}$`,
          pochemu: 'Степень понижена, но показатель не умножен на коэффициент.',
        },
      ]),
      vopros(
        r,
        `Чему равна скорость при $t=${t0}$?`,
        `$${d(v)}$`,
        [
          {
            tekst: `$${d(xT0)}$`,
            pochemu: 'Это координата $x(t_0)$: подставили $t_0$ в закон движения, а не в производную.',
          },
        ].filter((o) => o.tekst !== `$${d(v)}$`),
      ),
    ],
    params: { t0, ans: v, chleny: chleny.map((c) => c.join(':')).join(',') },
    signature: `pv9vm|${JSON.stringify(chleny)}|${t0}`,
    prototype: 'PV9-SKOROST-MNOGOCHLEN',
    seed: 'fixed',
    istochnik: NE_IZ_BANKA,
  };
}

/* ── Партия 4: касательная задана формулой, рисунка нет ─────────── */

export interface KasatelnayaFormula {
  /**
   * abscissa — прямая y = kx + m касается y = f(x) (f — многочлен), найти
   *            абсциссу точки касания;
   * koefA    — y = kx + m касается y = ax² + bx + c, найти a;
   * parallel — y = kx + m параллельна касательной к y = f(x), найти абсциссу;
   * koefC    — y = kx + m касается y = ax² + bx + c, найти c.
   */
  vid: 'abscissa' | 'koefA' | 'parallel' | 'koefC';
  k: number;
  m: number;
  /** Коэффициенты f по убыванию степени (abscissa, parallel); для koefA — [b, c], для koefC — [a, b]. */
  f: number[];
}

/** Многочлен по коэффициентам при xⁿ, …, x⁰ в TeX: «x^3+5x^2-3x+6». */
function mnogochlenTex(cs: readonly number[]): string {
  const n = cs.length - 1;
  let out = '';
  cs.forEach((c, i) => {
    if (c === 0) return;
    const st = n - i;
    const abs = Math.abs(c);
    const koef = st === 0 ? d(abs) : abs === 1 ? '' : d(abs);
    const x = st === 0 ? '' : st === 1 ? 'x' : `x^${st}`;
    const sign = c < 0 ? '-' : out === '' ? '' : '+';
    out += `${sign}${koef}${x}`;
  });
  return out === '' ? '0' : out;
}

const znachMn = (cs: readonly number[], x: number) => cs.reduce((s, c) => s * x + c, 0);
const proizvMn = (cs: readonly number[]) => {
  const n = cs.length - 1;
  return cs.slice(0, -1).map((c, i) => c * (n - i));
};
const pryamaya = (k: number, m: number) =>
  `${k === 1 ? '' : k === -1 ? '-' : d(k)}x${m === 0 ? '' : m < 0 ? `-${d(-m)}` : `+${d(m)}`}`;

/** Корни многочлена степени ≤ 2 (действительные, по возрастанию). */
function korniKv(cs: readonly number[]): number[] {
  if (cs.length === 2) return [-(cs[1] as number) / (cs[0] as number)];
  const [a, b, c] = cs as [number, number, number];
  const D = b * b - 4 * a * c;
  if (D < 0) return [];
  const s = Math.sqrt(D);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((u, v) => u - v);
}

export function kasatelnayaFormula(par: KasatelnayaFormula): Generated {
  const { vid, k, m, f } = par;
  const line = pryamaya(k, m);
  const r = rngOf(`pv9kf|${vid}|${k}|${m}|${f.join(',')}`);
  let otvet: number;
  let uslovie: string;
  let shagi: ReturnType<typeof shag>[];
  let proverka: number;
  let lovushka: number;
  if (vid === 'abscissa' || vid === 'parallel') {
    const fp = proizvMn(f);
    const fpk = [...fp.slice(0, -1), (fp.at(-1) as number) - k];
    const kandidaty = korniKv(fpk).map(okr);
    const godnye =
      vid === 'parallel'
        ? kandidaty
        : kandidaty.filter((x) => Math.abs(znachMn(f, x) - (k * x + m)) < 1e-9);
    if (godnye.length !== 1) throw new Error(`№9: точек касания ${godnye.length} ${JSON.stringify(par)}`);
    otvet = godnye[0] as number;
    lovushka = kandidaty.find((x) => x !== otvet) ?? otvet + 1;
    const ft = mnogochlenTex(f);
    uslovie =
      vid === 'abscissa'
        ? `Прямая $y=${line}$ является касательной к графику функции $y=${ft}$. Найдите абсциссу точки касания.`
        : `Прямая $y=${line}$ параллельна касательной к графику функции $y=${ft}$. Найдите абсциссу точки касания.`;
    /* Второй счёт: перебор абсцисс с шагом 0,5 — где наклон графика равен k (и, для касания, точка на прямой). */
    proverka = NaN;
    for (let x = -20; x <= 20; x += 0.5) {
      const h = 1e-5;
      const naklon = (znachMn(f, x + h) - znachMn(f, x - h)) / (2 * h);
      const naPryamoy = vid === 'parallel' || Math.abs(znachMn(f, x) - (k * x + m)) < 1e-6;
      if (Math.abs(naklon - k) < 1e-4 && naPryamoy) proverka = x;
    }
    const fpt = mnogochlenTex(fp);
    shagi = [
      shag(
        'Наклон касательной',
        `Угловой коэффициент касательной в точке $x_0$ равен $f'(x_0)$. ${vid === 'abscissa' ? 'У касательной' : 'У параллельной прямой'} $y=${line}$ он равен $${d(k)}$: $f'(x)=${fpt}$, решаем $${fpt}=${d(k)}$.`,
        kandidaty.length === 1
          ? `$x_0=${d(kandidaty[0] as number)}$.`
          : `$x=${d(kandidaty[0] as number)}$ или $x=${d(kandidaty[1] as number)}$.`,
      ),
      ...(vid === 'abscissa' && kandidaty.length > 1
        ? [
            shag(
              'Точка касания лежит и на прямой',
              `Проверяем, где значения функции и прямой совпадают: при $x=${d(otvet)}$ $f(${d(otvet)})=${d(okr(znachMn(f, otvet)))}$ и $${d(k)}\\cdot(${d(otvet)})${m < 0 ? '-' : '+'}${d(Math.abs(m))}=${d(okr(k * otvet + m))}$ — совпали; при $x=${d(lovushka)}$ — нет: $f(${d(lovushka)})=${d(okr(znachMn(f, lovushka)))}\\ne ${d(okr(k * lovushka + m))}$.`,
            ),
          ]
        : []),
      shag('Ответ', `Абсцисса точки касания — $${d(otvet)}$.`, `**Ответ: ${chislaOtvet(otvet)}**`),
    ];
  } else if (vid === 'koefA') {
    const [b, c] = f as [number, number];
    /* 2ax₀ + b = k и ax₀² + bx₀ + c = kx₀ + m ⇒ x₀ = 2(c − m)/(k − b), a = (k − b)/(2x₀). */
    const x0 = okr((2 * (c - m)) / (k - b));
    otvet = okr((k - b) / (2 * x0));
    lovushka = x0;
    uslovie = `Прямая $y=${line}$ является касательной к графику функции $y=ax^2${b < 0 ? '-' : '+'}${d(Math.abs(b))}x${c < 0 ? '-' : '+'}${d(Math.abs(c))}$. Найдите $a$.`;
    proverka = NaN;
    for (let a = -50; a <= 50; a += 0.25) {
      if (a === 0) continue;
      /* Касание ⇔ ax² + (b − k)x + (c − m) = 0 имеет один корень. */
      if (Math.abs((b - k) ** 2 - 4 * a * (c - m)) < 1e-9) proverka = a;
    }
    shagi = [
      shag(
        'Два условия касания в точке $x_0$',
        `Наклоны равны: $2ax_0${b < 0 ? '-' : '+'}${d(Math.abs(b))}=${d(k)}$. Значения равны: $ax_0^2${b < 0 ? '-' : '+'}${d(Math.abs(b))}x_0${c < 0 ? '-' : '+'}${d(Math.abs(c))}=${pryamaya(k, m).replace(/x/g, 'x_0')}$.`,
      ),
      shag(
        'Исключаем $a$',
        `Из первого $ax_0=${d(okr((k - b) / 2))}$. Подставляем $ax_0^2=${d(okr((k - b) / 2))}x_0$ во второе: $${d(okr((k - b) / 2))}x_0${b < 0 ? '-' : '+'}${d(Math.abs(b))}x_0${c < 0 ? '-' : '+'}${d(Math.abs(c))}=${pryamaya(k, m).replace(/x/g, 'x_0')}$, откуда $x_0=${d(x0)}$.`,
        `$a=\\dfrac{${d(okr((k - b) / 2))}}{${d(x0)}}=${d(otvet)}$.`,
      ),
      shag('Ответ', `$a=${d(otvet)}$.`, `**Ответ: ${chislaOtvet(otvet)}**`),
    ];
  } else {
    const [a, b] = f as [number, number];
    const x0 = okr((k - b) / (2 * a));
    const y0 = okr(k * x0 + m);
    otvet = okr(y0 - a * x0 * x0 - b * x0);
    lovushka = y0;
    uslovie = `Прямая $y=${line}$ является касательной к графику функции $y=${mnogochlenTex([a, b, 0]).replace(/^0$/, '')}+c$. Найдите $c$.`;
    proverka = NaN;
    for (let c = -100; c <= 100; c += 0.25) {
      if (Math.abs((b - k) ** 2 - 4 * a * (c - m)) < 1e-9) proverka = c;
    }
    shagi = [
      shag(
        'Абсцисса точки касания',
        `Наклон касательной $f'(x_0)=${d(k)}$: $${mnogochlenTex(proizvMn([a, b, 0]))}=${d(k)}$, $x_0=${d(x0)}$.`,
      ),
      shag(
        'Точка касания лежит на прямой',
        `$y_0=${d(k)}\\cdot${x0 < 0 ? `(${d(x0)})` : d(x0)}${m < 0 ? '-' : '+'}${d(Math.abs(m))}=${d(y0)}$. Значение функции в $x_0$ такое же: $${d(okr(a * x0 * x0 + b * x0))}+c=${d(y0)}$.`,
        `$c=${d(otvet)}$.`,
      ),
      shag('Ответ', `$c=${d(otvet)}$.`, `**Ответ: ${chislaOtvet(otvet)}**`),
    ];
  }
  return {
    uslovie,
    risunok: null,
    zapros: null,
    otvet,
    proverka,
    shagi,
    podskazka: [
      vopros(
        r,
        'Чему равен угловой коэффициент касательной в точке $x_0$?',
        "$f'(x_0)$",
        [
          { tekst: '$f(x_0)$', pochemu: 'Это значение функции, а не наклон.' },
          { tekst: '$x_0$', pochemu: 'Абсцисса точки — не наклон.' },
        ],
        'Геометрический смысл производной: наклон касательной.',
      ),
      vopros(
        r,
        vid === 'koefA' ? 'Чему равен $a$?' : vid === 'koefC' ? 'Чему равно $c$?' : 'Какая абсцисса подходит?',
        `$${d(otvet)}$`,
        [{ tekst: `$${d(lovushka)}$`, pochemu: 'Проверьте оба условия касания: и наклон, и общую точку.' }].filter(
          (o) => o.tekst !== `$${d(otvet)}$`,
        ),
      ),
    ],
    params: { vid, k, m, f: f.join(','), ans: otvet },
    signature: `pv9kf|${vid}|${k}|${m}|${f.join(',')}`,
    prototype: 'PV9-KASAT-FORMULA',
    seed: 'fixed',
    istochnik: NE_IZ_BANKA,
  };
}

/* ── Партия 5 (варианты 25–30) ──────────────────────────────────── */

export interface CelyeZnak {
  /** Узлы кривой f: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Что считаем: f′ > 0 (1) или f′ < 0 (−1). */
  znak: 1 | -1;
}

/**
 * Количество целых точек интервала, где f′ положительна (отрицательна),
 * по графику f. Подвох — целые точки экстремумов не подходят (там
 * f′ = 0), концы интервала выколоты, а знак f′ читают по направлению
 * графика, а не по его положению относительно оси.
 */
export function celyeZnak(par: CelyeZnak): Generated | null {
  const { znak } = par;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const exs = ekstremumyUzlov(uzly);
  const ps = promezhutki([a, ...exs.map((e) => e.x), b], (m) => znakProizvodnoy(uzly, m));
  let k = 0;
  let drugih = 0;
  for (const pr of ps) {
    const cnt = Math.ceil(pr.hi) - Math.floor(pr.lo) - 1;
    if (pr.znak === znak) k += cnt;
    else drugih += cnt;
  }
  const vsego = b - a - 1;
  if (k < 1 || drugih < 1) return null;
  const fig: Figura = figura('f', 'f(x)', uzly, {
    pomoshch: [
      ...exs.map((e): Pomoshch => ({ t: 'vert', x: e.x, podpis: d(e.x), shag: 1 })),
      ...znakiPomoshch(ps, 2),
    ],
  });
  const kod = `pv9cz|${znak}|${par.uzly.join(';')}`;
  const r = rngOf(kod);
  const pol = znak > 0;
  const vverh = pol ? 'вверх' : 'вниз';
  const nuzhnye = ps.filter((pr) => pr.znak === znak);
  const schet = nuzhnye.map((pr) => {
    const cnt = pr.hi - pr.lo - 1;
    return cnt === 0
      ? `$${interval(pr.lo, pr.hi)}$: целых чисел строго внутри нет.`
      : `$${interval(pr.lo, pr.hi)}$: $${Array.from({ length: cnt }, (_, i) => d(pr.lo + 1 + i)).join(',\\ ')}$ — ${cnt} ${tochekSlovo(cnt)}.`;
  });
  const draft = sobrat(fig, { t: 'celye-znak', znak }, k, {
    uslovie: `${grafikF(a, b)} Определите количество целых точек, в которых производная функции $f(x)$ ${pol ? 'положительна' : 'отрицательна'}.`,
    shagi: [
      shag(
        'Знак производной по графику',
        `$f'(x)${pol ? '>' : '<'}0$ там, где график идёт ${vverh}. В вершинах «горок» и «ямок» $f'(x)=0$ — эти точки не считаются.`,
      ),
      shag(
        'Промежутки монотонности',
        `Вершины графика: ${xRavno(exs.map((e) => e.x))}. Они делят интервал $${interval(a, b)}$ на части, концы интервала выколоты.`,
      ),
      shag(
        `Целые точки там, где график идёт ${vverh}`,
        ...schet,
        nuzhnye.length > 1 ? `Всего: $${nuzhnye.map((pr) => pr.hi - pr.lo - 1).join('+')}=${k}$.` : `Всего: $${k}$.`,
      ),
      shag(
        'Проверка',
        `Целых точек в интервале $${vsego}$: из них $${exs.length}$ — вершины, $${drugih}$ — с другим знаком производной и $${k}$ — нужные; $${exs.length}+${drugih}+${k}=${vsego}$.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(k)}**`),
    ],
    podskazka: [
      vopros(
        r,
        `Где производная ${pol ? 'положительна' : 'отрицательна'}?`,
        `Там, где график идёт ${vverh}`,
        [
          {
            tekst: `Там, где график ${pol ? 'выше' : 'ниже'} оси $Ox$`,
            pochemu: 'Положение графика относительно оси — знак самой функции, а не производной.',
          },
          { tekst: 'В вершинах графика', pochemu: "В вершинах $f'(x)=0$." },
        ],
      ),
      vopros(
        r,
        'Считаются ли целые точки, где график имеет вершину?',
        "Нет, там $f'(x)=0$",
        [{ tekst: 'Да, они принадлежат промежутку', pochemu: 'Ноль не положителен и не отрицателен.' }],
      ),
      vopros(r, 'Сколько таких целых точек?', `$${k}$`, [
        { tekst: `$${k + exs.length}$`, pochemu: 'Посчитаны и вершины.' },
        { tekst: `$${drugih}$`, pochemu: 'Это точки с другим знаком производной.' },
      ]),
    ],
    params: { a, b, znak, ans: k, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : { ...draft, prototype: pol ? 'PV9-CELYE-PLUS' : 'PV9-CELYE-MINUS', seed: 'fixed', istochnik: NE_IZ_BANKA };
}

export interface NuliProizvodnoy {
  /** Узлы кривой f: [x, y], x по возрастанию, концы — границы интервала. */
  uzly: [number, number][];
  /** Отрезок вопроса; без него — весь интервал. */
  p?: number;
  q?: number;
}

/**
 * Количество точек, где f′(x) = 0, по графику f — на всём интервале или
 * на отрезке. Подвох — считать вершины «горок» и «ямок», а не точки
 * пересечения графика с осью; на отрезке — только вершины внутри.
 */
export function nuliProizvodnoy(par: NuliProizvodnoy): Generated | null {
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const naOtrezke = par.p !== undefined && par.q !== undefined;
  const p = par.p ?? a;
  const q = par.q ?? b;
  const exs = ekstremumyUzlov(uzly);
  const vnutri = exs.filter((e) => e.x >= p && e.x <= q);
  const vne = exs.filter((e) => e.x < p || e.x > q);
  const ans = vnutri.length;
  if (ans < 2 || (naOtrezke && vne.length === 0)) return null;
  const nuliF = nuliUzlov(uzly).length;
  const fig: Figura = figura('f', 'f(x)', uzly, {
    pomoshch: [
      ...(naOtrezke ? [{ t: 'otrezok', p, q, shag: 1 } as Pomoshch] : []),
      ...exs.map((e): Pomoshch => ({ t: 'vert', x: e.x, podpis: d(e.x), shag: 2 })),
    ],
  });
  const kod = `pv9nu|${naOtrezke ? `${p}|${q}` : 'vse'}|${par.uzly.join(';')}`;
  const r = rngOf(kod);
  const nmax = vnutri.filter((e) => e.tip === 'max').length;
  const draft = sobrat(
    fig,
    naOtrezke ? { t: 'chislo-nuley-f', p, q } : { t: 'chislo-nuley' },
    ans,
    {
      uslovie: naOtrezke
        ? `${grafikF(a, b)} Найдите количество решений уравнения $f'(x)=0$ на отрезке $${otrezok(p, q)}$.`
        : `${grafikF(a, b)} Определите количество точек, в которых производная функции $f(x)$ равна $0$.`,
      shagi: [
        shag(
          "Где $f'(x)=0$",
          "Производная — угловой коэффициент касательной. $f'(x)=0$ там, где касательная горизонтальна: в вершинах «горок» (максимумы) и «ямок» (минимумы). Точки пересечения графика с осью $Ox$ тут ни при чём.",
        ),
        shag(
          'Находим вершины',
          `Вершины графика: ${xRavno(exs.map((e) => e.x))}.`,
          ...(naOtrezke
            ? [`Вне отрезка $${otrezok(p, q)}$: ${xRavno(vne.map((e) => e.x))} — не считаем.`]
            : ['Концы интервала выколоты, вершинами не считаются.']),
          `Остаются ${xRavno(vnutri.map((e) => e.x))}: «горок» $${nmax}$, «ямок» $${ans - nmax}$, всего $${ans}$.`,
        ),
        shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
      ],
      podskazka: [
        vopros(
          r,
          "В каких точках графика $f'(x)=0$?",
          'В вершинах «горок» и «ямок»',
          [
            { tekst: 'В точках пересечения с осью $Ox$', pochemu: 'Там $f(x)=0$, а не производная.' },
            { tekst: 'Там, где график идёт вверх', pochemu: "Там $f'(x)>0$." },
          ],
        ),
        vopros(r, naOtrezke ? `Сколько вершин на отрезке $${otrezok(p, q)}$?` : 'Сколько вершин у графика?', `$${ans}$`, [
          ...(naOtrezke ? [{ tekst: `$${exs.length}$`, pochemu: 'Посчитаны и вершины вне отрезка.' }] : []),
          ...(nuliF !== ans ? [{ tekst: `$${nuliF}$`, pochemu: 'Это число пересечений с осью $Ox$.' }] : []),
          { tekst: `$${nmax}$`, pochemu: 'Посчитаны только «горки».' },
        ]),
      ],
      params: { a, b, p, q, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
      signature: kod,
    },
  );
  return draft === null
    ? null
    : { ...draft, prototype: naOtrezke ? 'PV9-NULI-OTREZOK' : 'PV9-NULI-VSE', seed: 'fixed', istochnik: NE_IZ_BANKA };
}

/**
 * Абсцисса точки отрезка, где касательная к графику f горизонтальна, по
 * графику f′. Подвох — искать ноль f′ (пересечение графика f′ с осью),
 * а не вершину графика f′; на отрезке он один.
 */
export function gorizontalnayaKasatelnaya(par: MaxNaOtrezke): Generated | null {
  const { p, q } = par;
  const uzly: Uzel[] = par.uzly.map(([x, y]) => ({ x, y }));
  const a = uzly[0]!.x;
  const b = uzly.at(-1)!.x;
  const zs = nuliUzlov(uzly).map((z) => z.x);
  const vnutri = zs.filter((x) => x >= p && x <= q);
  if (vnutri.length !== 1) return null;
  const ans = vnutri[0] as number;
  const vne = zs.filter((x) => x < p || x > q);
  const fig: Figura = figura('fprime', "f'(x)", uzly, {
    pomoshch: [
      { t: 'otrezok', p, q, shag: 1 },
      ...zs.map((x): Pomoshch => ({ t: 'vert', x, podpis: d(x), shag: 2 })),
    ],
  });
  const kod = `pv9gk|${par.uzly.join(';')}|${p}|${q}`;
  const r = rngOf(kod);
  const vershina = ekstremumyUzlov(uzly).map((e) => e.x).find((x) => x >= p && x <= q && x !== ans);
  const draft = sobrat(fig, { t: 'extr-na-otrezke', p, q }, ans, {
    uslovie: `${grafikP(a, b)} Найдите абсциссу точки, принадлежащей отрезку $${otrezok(p, q)}$, в которой касательная к графику функции $f(x)$ параллельна оси абсцисс или совпадает с ней.`,
    shagi: [
      shag(
        'Переводим условие',
        "Касательная параллельна оси $Ox$ (или совпадает с ней), когда её угловой коэффициент равен нулю, то есть $f'(x)=0$.",
      ),
      shag(
        "Нули $f'$ по графику",
        `График $f'$ пересекает ось $Ox$ при ${xRavno(zs)}.`,
        ...(vne.length > 0 ? [`${xRavno(vne)} — вне отрезка $${otrezok(p, q)}$.`] : []),
        `На отрезке остаётся $x=${d(ans)}$.`,
      ),
      shag('Ответ', `**Ответ: ${chislaOtvet(ans)}**`),
    ],
    podskazka: [
      vopros(
        r,
        'Чему равен угловой коэффициент горизонтальной касательной?',
        '$0$',
        [{ tekst: '$1$', pochemu: 'Это касательная под углом $45^\\circ$.' }],
        "Значит, ищем точку, где $f'(x)=0$.",
      ),
      vopros(
        r,
        "Как на графике $f'$ найти точку, где $f'(x)=0$?",
        'Пересечение графика с осью $Ox$',
        [
          { tekst: "Вершина графика $f'$", pochemu: "Вершина графика $f'$ — экстремум производной, а не её ноль." },
          { tekst: 'Пересечение с осью $Oy$', pochemu: "Там $x=0$, а $f'(0)$ может быть любым." },
        ],
      ),
      vopros(r, 'Какая это точка отрезка?', `$${d(ans)}$`, [
        ...(vershina !== undefined ? [{ tekst: `$${d(vershina)}$`, pochemu: "Это вершина графика $f'$." }] : []),
        ...vne.slice(0, 1).map((x) => ({ tekst: `$${d(x)}$`, pochemu: 'Эта точка вне отрезка.' })),
        { tekst: `$${d(p)}$`, pochemu: 'Это конец отрезка.' },
      ]),
    ],
    params: { a, b, p, q, ans, uzly: par.uzly.map((u) => u.join(':')).join(',') },
    signature: kod,
  });
  return draft === null
    ? null
    : { ...draft, prototype: 'PV9-GORIZONT', seed: 'fixed', istochnik: NE_IZ_BANKA };
}
