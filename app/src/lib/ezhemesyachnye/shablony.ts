/**
 * Шаблоны раздела «Ежемесячные варианты», которых нет в реестре
 * вариантов повышенной сложности: запись варианта → задача онлайн-модуля
 * (`VariantTask`). Как и там, задачу строит движок раздела (прототипы
 * lib/<раздел>/…/ezhemesyachnye.ts), а размечают её те же функции
 * (lib/povyshennye/shablony.ts): лист и онлайн-режим — общие.
 *
 * Модуль тяжёлый (движки разделов, KaTeX): экран раздела его не грузит.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Uslovie6 } from '@/components/tasks/zadanie6/Uslovie6';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Params as ParamsPlan } from '@/lib/planimetriya/stseny/dsl';
import {
  bezPoley,
  kand,
  peremeshat,
  veroyatnost,
  z01,
  z03,
  z06,
  z07,
  z08,
  z09,
  z10s,
  z11,
  z12,
  z13,
  type Gotovaya,
  type Shablon,
  type Syuzhet13,
} from '@/lib/povyshennye/shablony';
import {
  logChastnye,
  otnosheniePoDrobi,
  raznostKvadratov,
  trigSokrashchenie,
  type LogChastnye,
  type OtnosheniePoDrobi,
  type RaznostKvadratov,
  type TrigPrivedenieEV,
} from '@/lib/vychisleniya/ezhemesyachnye';
import {
  EV4_DVA_ETAPA,
  EV4_DVA_V_NORME,
  EV4_EILER_USLOVNAYA,
  EV4_HOTYA_BY_ODNO,
  EV5_BERNULLI_OTNOSHENIE,
  EV5_HOTYA_BY_TRI,
  EV5_USLOVNAYA,
  eilerSobytiyaSvg,
} from '@/lib/veroyatnost/ezhemesyachnye';
import type { Params as ParamsVer } from '@/lib/veroyatnost/types';
import {
  bLog,
  korenObshchayaPryamaya,
  modulParaboly,
  parabolaKx,
  type BLog,
  type KorenObshchayaPryamaya,
  type ModulParaboly,
  type ParabolaKx,
} from '@/lib/graph/ezhemesyachnye';
import { chisloMinF, nuliFunkcii, type PoGrafikuF } from '@/lib/proizvodnaya/ezhemesyachnye';
import {
  chisloNaOtrezke,
  kasatParallelFprime,
  type ChisloNaOtrezke,
  type KasatParallelFprime,
} from '@/lib/proizvodnaya/povyshennye';
import {
  answerHtml,
  answerText,
  hintSteps,
  razborAnswer,
  studentFromHints,
  teacherStepsHtml,
  type HintLike,
} from '@/lib/variant/adapters/common';
import { typesetKrupno } from '@/lib/tex';
import {
  suhoyLed,
  teplicy,
  zadannyeChisla,
  type Reshenie13,
  type SuhoyLed,
  type Teplicy,
} from '@/lib/zadanie13/proto/ezhemesyachnye';
import {
  EV10_AMPER,
  EV10_NAGREVATELI,
  EV10_SIGNAL,
  EV10_VYSOTA_UGOL,
} from '@/lib/zadanie10/prototypes/ezhemesyachnye';
import type { Params as Params10 } from '@/lib/zadanie10/types';
import { subtype as subtype11 } from '@/lib/zadanie11/prototypes';
import {
  bolshePriNizkoyCene,
  plotIKater,
  summaProgressii,
} from '@/lib/zadanie11/prototypes/ezhemesyachnye';
import type { Params as Params11 } from '@/lib/zadanie11/types';
import {
  EV03_KOZHURA,
  EV03_SHEST_TANGENS,
  EV03_STUPEN_UGOL,
  EV03_STVOL,
} from '@/lib/zadanie3/ezhemesyachnye';
import type { Params as Params3 } from '@/lib/zadanie3/types';
import { build as build02 } from '@/lib/variant/adapters/z02';
import {
  dlinaPoSkalyarnomu,
  konecVektora,
  skalyarnoeVTreugolnike,
  type DlinaPoSkalyarnomu,
  type KonecVektora,
  type SkalyarnoeVTreugolnike,
} from '@/lib/vektory/ezhemesyachnye';
import type { Generated as Generated2 } from '@/lib/vektory/types';
import type { Params as Params6 } from '@/lib/zadanie6/types';
import { prototype as prototype7 } from '@/lib/zadanie7/prototypes';
import { EV7_LOG_KVADRATNYY } from '@/lib/zadanie7/prototypes/ezhemesyachnye';
import type { Params as Params7 } from '@/lib/zadanie7/types';

/* ── №1 ─────────────────────────────────────────────────────────── */

/** Синус по таблице Брадиса: четыре знака, запятая. */
function sinBradis(g: number, m: number): string {
  const s = Math.sin(((g + m / 60) * Math.PI) / 180);
  return `$${s.toFixed(4).replace('.', '{,}')}$`;
}

/**
 * Фрагмент таблицы синусов (как в таблицах Брадиса): строки — градусы
 * от g0 до g1, столбцы — минуты через 6′.
 */
function tablicaSinusov(g0: number, g1: number) {
  const minuty = [0, 6, 12, 18, 24, 30, 36, 42, 48, 54];
  const stroki = [{ zag: '$\\sin$', yach: minuty.map((m) => `$${m}'$`) }];
  for (let g = g0; g <= g1; g += 1) {
    stroki.push({ zag: `$${g}^\\circ$`, yach: minuty.map((m) => sinBradis(g, m)) });
  }
  return { stroki };
}

/** №1 с таблицей синусов в условии (прототип 202). */
function z01Tablica(params: ParamsPlan & { g0: number; g1: number }) {
  const { g0, g1, ...p } = params;
  const t = z01(202, p);
  const u = {
    text: prototip(202).uslovie(p as ParamsPlan),
    ris: { vid: 'tablica' as const, tablica: tablicaSinusov(g0, g1) },
  };
  return { ...t, statement: renderToStaticMarkup(createElement(Uslovie6, { u })) };
}

/* ── №2 ─────────────────────────────────────────────────────────── */

const z02 = (g: Generated2) => bezPoley(build02({ ...kand, seed: 'ev', n: null }, g));

/* ── №3 ─────────────────────────────────────────────────────────── */

const HINTS_STUPEN: HintLike[] = [
  {
    question: 'Какая фигура — грань, в которой лежат точки $E$, $F$, $G$?',
    options: ['Прямоугольник', 'Трапеция', 'Ромб'],
    correct: 0,
    comment: 'Все двугранные углы прямые: грани ступеньки — прямоугольники.',
  },
  {
    question: 'Чему равен отрезок $EF$?',
    options: ['Ребру $BC$ — глубине многогранника', 'Ребру $AB$', 'Отрезку $GE$'],
    correct: 0,
    comment: '$EF\\parallel BC$, а противоположные стороны прямоугольника равны.',
  },
  {
    question: 'Как найти тангенс угла $FGE$?',
    options: ['$\\dfrac{EF}{GE}$', '$\\dfrac{GE}{EF}$', '$\\dfrac{EF}{FG}$'],
    correct: 0,
    comment: 'В прямоугольном треугольнике $FGE$ тангенс — противолежащий катет на прилежащий.',
  },
];

const HINTS_STVOL: HintLike[] = [
  {
    question:
      'Что такое ствол для прямоугольного параллелепипеда с рёбрами — смещениями на восток, на север и вниз?',
    options: ['Его диагональ', 'Диагональ его грани', 'Его ребро'],
    correct: 0,
  },
  {
    question: 'Чему равен квадрат диагонали прямоугольного параллелепипеда?',
    options: ['Сумме квадратов трёх рёбер', 'Сумме трёх рёбер', 'Произведению трёх рёбер'],
    correct: 0,
    comment: '$d^2=a^2+b^2+c^2$.',
  },
];

const HINTS_KOZHURA: HintLike[] = [
  {
    question: 'Во сколько раз меняется объём шара, если диаметр умножить на $k$?',
    options: ['В $k^3$ раз', 'В $k^2$ раз', 'В $k$ раз'],
    correct: 0,
    comment: '$V=\\dfrac43\\pi R^3$: радиус входит в кубе.',
  },
  {
    question: 'Какую часть объёма занимает кожура?',
    options: ['$1-k^3$', '$k^3$', '$1-k$'],
    correct: 0,
    comment: '$k^3$ — доля мякоти, остальное — кожура.',
  },
];

const HINTS_SHEST: HintLike[] = [
  {
    question: 'Какой прямой можно заменить $AA_1$, не меняя угла?',
    options: ['$CC_1$', '$AB$', '$C_1F_1$'],
    correct: 0,
    comment: 'Боковые рёбра призмы параллельны.',
  },
  {
    question: 'Чему равна большая диагональ $CF$ правильного шестиугольника со стороной $a$?',
    options: ['$2a$', '$a\\sqrt3$', '$a$'],
    correct: 0,
    comment: 'Шестиугольник складывается из шести правильных треугольников, $CF$ — два их ребра.',
  },
  {
    question: 'Как найти тангенс угла $FC_1C$?',
    options: ['$\\dfrac{CF}{CC_1}$', '$\\dfrac{CC_1}{CF}$', '$\\dfrac{CF}{C_1F}$'],
    correct: 0,
  },
];

/* ── №4, №5 ───────────────────────────────────────────────────────── */

/** №4 с диаграммой Эйлера: рисунок условия и рисунок к разбору (общая часть выделена). */
function z04Eiler(p: ParamsVer) {
  const t = veroyatnost(4, EV4_EILER_USLOVNAYA, p);
  return {
    ...t,
    figure: { svg: eilerSobytiyaSvg(p), width: 64 },
    figureTeacher: { svg: eilerSobytiyaSvg(p, true), width: 64 },
  };
}

/* ── №8 ─────────────────────────────────────────────────────────── */

function hints08Kvadraty(p: RaznostKvadratov): HintLike[] {
  return [
    {
      question: 'Какая формула упростит счёт?',
      options: ['$x^2-y^2=(x-y)(x+y)$', '$(x-y)^2=x^2-2xy+y^2$', '$x^2-y^2=(x-y)^2$'],
      correct: 0,
    },
    {
      question: `Чему равна разность $\\dfrac{${p.a}}{${p.z}}-\\dfrac{${p.b}}{${p.z}}$?`,
      options: [`$${(p.a - p.b) / p.z}$`, `$${p.a - p.b}$`, `$\\dfrac{${p.a - p.b}}{${2 * p.z}}$`],
      correct: 0,
    },
  ];
}

const HINTS_08_TRIG: HintLike[] = [
  {
    question: 'Чему равен $\\sin\\left(x-\\dfrac{3\\pi}{2}\\right)$?',
    options: ['$\\cos x$', '$-\\cos x$', '$\\sin x$'],
    correct: 0,
    comment:
      'Угол $x-\\dfrac{3\\pi}{2}$ при малом $x>0$ во второй четверти — синус там положителен.',
  },
  {
    question:
      'На что заменить $\\cos\\left(x-\\dfrac{\\pi}{6}\\right)$, чтобы сократить с числителем?',
    options: [
      '$\\sin\\left(x+\\dfrac{\\pi}{3}\\right)$',
      '$\\sin\\left(x-\\dfrac{\\pi}{6}\\right)$',
      '$-\\sin\\left(x+\\dfrac{\\pi}{3}\\right)$',
    ],
    correct: 0,
    comment: '$\\cos t=\\sin\\left(\\dfrac{\\pi}{2}+t\\right)$.',
  },
  {
    question: 'Чему равен $\\sin\\dfrac{19\\pi}{6}$?',
    options: ['$-\\dfrac12$', '$\\dfrac12$', '$-\\dfrac{\\sqrt3}{2}$'],
    correct: 0,
    comment: '$\\dfrac{19\\pi}{6}=2\\pi+\\dfrac{7\\pi}{6}$, угол в третьей четверти.',
  },
];

const HINTS_08_LOG: HintLike[] = [
  {
    question: 'Как избавиться от логарифма в знаменателе?',
    options: [
      '$\\dfrac{1}{\\log_b c}=\\log_c b$',
      '$\\dfrac{1}{\\log_b c}=\\log_b \\dfrac1c$',
      '$\\dfrac{1}{\\log_b c}=-\\log_b c$',
    ],
    correct: 0,
  },
  {
    question: 'Что получится после раскрытия скобок?',
    options: ['Квадраты $t$ и слагаемые с $t$ сократятся', 'Останется $t^2$', 'Останется $t$'],
    correct: 0,
  },
];

function hints08Otnoshenie(p: OtnosheniePoDrobi): HintLike[] {
  return [
    {
      question: 'Что сделать, чтобы в дроби осталось одно неизвестное?',
      options: [
        'Разделить числитель и знаменатель на $b$',
        'Подставить $a=1$',
        'Сложить числитель и знаменатель',
      ],
      correct: 0,
      comment: 'Получится уравнение относительно $t=\\dfrac{a}{b}$.',
    },
    {
      question: 'Какое уравнение получится?',
      options: [
        `$${p.p}t+${p.q}=${p.v}(${p.r === 1 ? '' : p.r}t+${p.s})$`,
        `$${p.p}t+${p.q}=${p.v}$`,
        `$${p.p}+${p.q}t=${p.v}(${p.r}+${p.s}t)$`,
      ],
      correct: 0,
    },
  ];
}

/* ── №13 ─────────────────────────────────────────────────────────── */

/**
 * №13 без таблицы кредита: условие — текст варианта, решение учителя и
 * разбор — шаги решателя, разметка общая (lib/variant/adapters/common).
 */
function z13Shagi(r: Reshenie13, tekst: string, klyuch: string): Gotovaya {
  if (Math.abs(r.otvet - r.proverka) > 1e-6)
    throw new Error(`№13: ответ ${r.otvet} не сходится с пересчётом ${r.proverka}`);
  const otvet = answerHtml(r.otvet);
  const h = peremeshat(r.hints, klyuch);
  return {
    egeNumber: 13,
    difficulty: null,
    statement: typesetKrupno(tekst),
    figure: null,
    figureTeacher: null,
    answer: answerText(r.otvet),
    answerHtml: otvet,
    solutionTeacher: teacherStepsHtml(r.shagi) + razborAnswer(otvet),
    hints: hintSteps(h),
    solutionStudent: studentFromHints(h, r.shagi) + razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── Реестр ─────────────────────────────────────────────────────── */

export const SHABLONY_EV: Record<string, Shablon> = {
  'e01.sin-po-katetam': {
    ege: 1,
    prototip:
      'Планиметрия, блок V: катеты k√m и b → sin A, гипотенуза по Пифагору (как прототип 25)',
    otkuda: 'novyy',
    zadacha: (p: Record<string, number>) => z01(201, p),
  },
  'e01.tablica-sinusov': {
    ege: 1,
    prototip: 'Планиметрия, блок V: угол подъёма по синусу и фрагменту таблицы Брадиса',
    otkuda: 'novyy',
    zadacha: (p: ParamsPlan & { g0: number; g1: number }) => z01Tablica(p),
  },
  'e01.kasatelnaya-perimetr': {
    ege: 1,
    prototip:
      'Планиметрия, блок VII: касательная к вписанной окружности → периметр отсечённого треугольника',
    otkuda: 'novyy',
    zadacha: (p: Record<string, number>) => z01(203, p),
  },
  'e01.vpisannaya-ravnobedr': {
    ege: 1,
    prototip: 'Планиметрия, блок X: равнобедренный прямоугольный, катет a + b√2 → радиус вписанной',
    otkuda: 'novyy',
    zadacha: (p: Record<string, number>) => z01(204, p),
  },
  'e02.konec-vektora': {
    ege: 2,
    prototip: 'Векторы, группа A: начало и координаты вектора → абсцисса конца',
    otkuda: 'novyy',
    zadacha: (p: KonecVektora) => z02(konecVektora(p)),
  },
  'e02.skalyar-treugolnik': {
    ege: 2,
    prototip:
      'Векторы, группа B: скалярное произведение в прямоугольном треугольнике 30°–60°, угол между векторами тупой',
    otkuda: 'novyy',
    zadacha: (p: SkalyarnoeVTreugolnike) => z02(skalyarnoeVTreugolnike(p)),
  },
  'e02.dlina-po-skalyarnomu': {
    ege: 2,
    prototip: 'Векторы, группа B: длина вектора по скалярному произведению и углу (обратная к B2)',
    otkuda: 'novyy',
    zadacha: (p: DlinaPoSkalyarnomu) => z02(dlinaPoSkalyarnomu(p)),
  },
  'e03.stupen-ugol': {
    ege: 3,
    prototip: 'Стереометрия, раздел I: ступенчатый многогранник, тангенс угла в боковой грани',
    otkuda: 'novyy',
    zadacha: (p: Params3, klyuch: string) => z03(EV03_STUPEN_UGOL, p, HINTS_STUPEN, klyuch),
  },
  'e03.stvol': {
    ege: 3,
    prototip:
      'Стереометрия, раздел I: диагональ прямоугольного параллелепипеда (как P03-01), сюжет',
    otkuda: 'novyy',
    zadacha: (p: Params3, klyuch: string) => z03(EV03_STVOL, p, HINTS_STVOL, klyuch),
  },
  'e03.kozhura': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: шар в шаре, доля оболочки в процентах (подобие тел)',
    otkuda: 'novyy',
    zadacha: (p: Params3, klyuch: string) => z03(EV03_KOZHURA, p, HINTS_KOZHURA, klyuch),
  },
  'e03.shest-tangens': {
    ege: 3,
    prototip:
      'Стереометрия, раздел II: тангенс угла между диагональю и боковым ребром шестиугольной призмы',
    otkuda: 'novyy',
    zadacha: (p: Params3, klyuch: string) => z03(EV03_SHEST_TANGENS, p, HINTS_SHEST, klyuch),
  },
  'e04.dva-v-norme': {
    ege: 4,
    prototip: 'Вероятность: интервал массы по двум «хвостам» (p₁ + p₂ − 1), два изделия независимо',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, EV4_DVA_V_NORME, p),
  },
  'e04.eiler-uslovnaya': {
    ege: 4,
    prototip: 'Вероятность: условная вероятность по диаграмме Эйлера с точками',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => z04Eiler(p),
  },
  'e04.hotya-by-odno': {
    ege: 4,
    prototip: 'Вероятность: хотя бы одно из двух совместных событий, формула сложения',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, EV4_HOTYA_BY_ODNO, p),
  },
  'e04.dva-etapa': {
    ege: 4,
    prototip: 'Вероятность: второй этап только после первого — «первый да, второй нет»',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, EV4_DVA_ETAPA, p),
  },
  'e05.hotya-by-tri': {
    ege: 5,
    prototip:
      'Вероятность: хотя бы одно из трёх независимых событий через противоположное, в процентах',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, EV5_HOTYA_BY_TRI, p),
  },
  'e05.bernulli-otnoshenie': {
    ege: 5,
    prototip:
      'Вероятность: схема Бернулли, отношение вероятностей «ровно k₁» и «ровно k₂» (один или два участника)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, EV5_BERNULLI_OTNOSHENIE, p),
  },
  'e05.uslovnaya': {
    ege: 5,
    prototip: 'Вероятность: условная вероятность по вероятностям события и пересечения',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, EV5_USLOVNAYA, p),
  },
  'e08.raznost-kvadratov': {
    ege: 8,
    prototip: 'Вычисления: разность квадратов дробей с общим знаменателем, затем деление',
    otkuda: 'novyy',
    zadacha: (p: RaznostKvadratov, klyuch: string) =>
      z08(raznostKvadratov(p), hints08Kvadraty(p), klyuch),
  },
  'e08.trig-sokrashchenie': {
    ege: 8,
    prototip: 'Вычисления: формулы приведения, множители с x сокращаются',
    otkuda: 'novyy',
    zadacha: (p: TrigPrivedenieEV, klyuch: string) =>
      z08(trigSokrashchenie(p), HINTS_08_TRIG, klyuch),
  },
  'e08.log-chastnye': {
    ege: 8,
    prototip: 'Вычисления: частные логарифмов — переход к одному основанию, t² сокращается',
    otkuda: 'novyy',
    zadacha: (p: LogChastnye, klyuch: string) => z08(logChastnye(p), HINTS_08_LOG, klyuch),
  },
  'e08.otnoshenie': {
    ege: 8,
    prototip: 'Вычисления: отношение a/b по значению дроби — замена t = a/b',
    otkuda: 'novyy',
    zadacha: (p: OtnosheniePoDrobi, klyuch: string) =>
      z08(otnosheniePoDrobi(p), hints08Otnoshenie(p), klyuch),
  },
  'e09.nuli-f': {
    ege: 9,
    prototip: 'Производная и графики: число нулей функции по её графику (подвох — вершины)',
    otkuda: 'novyy',
    zadacha: (p: PoGrafikuF) => z09(nuliFunkcii(p), p),
  },
  'e09.min-f': {
    ege: 9,
    prototip: 'Производная и графики: число точек минимума по графику функции на отрезке',
    otkuda: 'novyy',
    zadacha: (p: PoGrafikuF) => z09(chisloMinF(p), p),
  },
  'e09.chislo-min': {
    ege: 9,
    prototip: 'Производная и графики: число точек минимума на отрезке по графику производной',
    otkuda: 'razdel',
    zadacha: (p: ChisloNaOtrezke) => z09(chisloNaOtrezke(p), p),
  },
  'e09.parallel-chislo': {
    ege: 9,
    prototip:
      'Производная и графики: число точек, где касательная параллельна прямой, по графику производной',
    otkuda: 'razdel',
    zadacha: (p: KasatParallelFprime) => z09(kasatParallelFprime(p), p),
  },
  'e10.vysota-ugol': {
    ege: 10,
    prototip:
      'Прикладная, тригонометрия: угол броска по наибольшей высоте H = v₀²(1 − cos 2α)/(4g)',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(EV10_VYSOTA_UGOL, p, klyuch),
  },
  'e10.signal': {
    ege: 10,
    prototip: 'Прикладная, тригонометрия: доля времени, когда U = U₀ sin(ωt + φ) не ниже порога',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(EV10_SIGNAL, p, klyuch),
  },
  'e10.nagrevateli': {
    ege: 10,
    prototip: 'Прикладная, подстановка: закон Ома для полной цепи, наименьшее число элементов',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(EV10_NAGREVATELI, p, klyuch),
  },
  'e10.amper': {
    ege: 10,
    prototip: 'Прикладная, тригонометрия: сила Ампера F = BIl sin α, наименьший угол',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(EV10_AMPER, p, klyuch),
  },
  'e11.plot-kater': {
    ege: 11,
    prototip:
      'Текстовые, вода: катер туда и обратно со стоянкой (как ВД-03), затем путь плота за всё время',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('EV11-PLOT-KATER', p, klyuch, plotIKater),
  },
  'e11.progressiya': {
    ege: 11,
    prototip: 'Текстовые, прогрессия: сумма арифметической прогрессии за n дней (как ПГ-01)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('EV11-PROGRESSIYA', p, klyuch, summaProgressii),
  },
  'e11.medlennyy': {
    ege: 11,
    prototip:
      'Текстовые, движение: «за час на … км больше, прибыл раньше» (DP-09), спрашивают скорость медленного',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('DP-09', p, klyuch, (x) => subtype11('DP-09').solve(x)),
  },
  'e11.procent-cena': {
    ege: 11,
    prototip:
      'Текстовые, проценты: на сколько процентов больше купишь при меньшей цене (как ПР-04)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('EV11-PROCENT', p, klyuch, bolshePriNizkoyCene),
  },
  'e12.parabola-kx': {
    ege: 12,
    prototip:
      'Графики: парабола и прямая y = kx, вторая точка пересечения за рамкой (теорема Виета)',
    otkuda: 'novyy',
    zadacha: (p: ParabolaKx, klyuch: string) => z12((pe) => parabolaKx(p, pe), klyuch),
  },
  'e12.modul-paraboly': {
    ege: 12,
    prototip: 'Графики: y = |ax² + bx + c| — найти c при условии c > 0',
    otkuda: 'novyy',
    zadacha: (p: ModulParaboly, klyuch: string) => z12((pe) => modulParaboly(p, pe), klyuch),
  },
  'e12.koren-pryamaya': {
    ege: 12,
    prototip: 'Графики: a√x и прямая общего вида, ордината точки пересечения (замена t = √x)',
    otkuda: 'novyy',
    zadacha: (p: KorenObshchayaPryamaya, klyuch: string) =>
      z12((pe) => korenObshchayaPryamaya(p, pe), klyuch),
  },
  'e12.b-log': {
    ege: 12,
    prototip: 'Графики: f(x) = b + logₐ x по узлам, значение в точке за рамкой',
    otkuda: 'novyy',
    zadacha: (p: BLog, klyuch: string) => z12((pe) => bLog(p, pe), klyuch),
  },
  'e13.dva-vklada': {
    ege: 13,
    prototip:
      'Экономика, тип D: два вклада — наименьшая целая ставка, при которой второй выгоднее (D-08)',
    otkuda: 'razdel',
    zadacha: (p: Syuzhet13 & { rA: number; r1: number }, klyuch: string) =>
      z13(zadannyeChisla('D-08', [p.rA, p.r1, 0, 0]), p, klyuch),
  },
  'e13.ravnye-platezhi-raznost': {
    ege: 13,
    prototip: 'Экономика, тип C: на сколько больше отдать при большем числе равных платежей (C-03)',
    otkuda: 'razdel',
    zadacha: (p: Syuzhet13 & { n: number; r: string; c: number }, klyuch: string) =>
      z13(
        zadannyeChisla(
          'C-03',
          [p.c, 0, 0],
          [(x) => x === p.n, (x) => (x as { r: string }).r === p.r],
        ),
        p,
        klyuch,
      ),
  },
  'e13.teplicy': {
    ege: 13,
    prototip: 'Экономика, оптимизация: два участка и две культуры — наибольший доход',
    otkuda: 'novyy',
    zadacha: (p: Teplicy & { tekst: string }, klyuch: string) =>
      z13Shagi(teplicy(p), p.tekst, klyuch),
  },
  'e13.suhoy-led': {
    ege: 13,
    prototip: 'Экономика, последовательность: запас уменьшается на p % и на k кг в день — выручка',
    otkuda: 'novyy',
    zadacha: (p: SuhoyLed & { tekst: string }, klyuch: string) =>
      z13Shagi(suhoyLed(p), p.tekst, klyuch),
  },
  'e06.ozhidanie-tablica': {
    ege: 6,
    prototip:
      'Случайные величины, группа III: математическое ожидание по таблице распределения (P06)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P06', p, klyuch),
  },
  'e06.dispersiya-drobi': {
    ege: 6,
    prototip: 'Случайные величины, группа V: дисперсия, вероятности — обыкновенные дроби (P13)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P13', p, klyuch),
  },
  'e07.kub-koren': {
    ege: 7,
    prototip: 'Простейшие уравнения, группа II: кубический корень равен числу (П-12)',
    otkuda: 'razdel',
    zadacha: (p: Params7) => z07(p, prototype7('P12')),
  },
  'e07.kvadratnoe': {
    ege: 7,
    prototip: 'Простейшие уравнения, группа I: квадратное уравнение, меньший корень (П-10)',
    otkuda: 'razdel',
    zadacha: (p: Params7) => z07(p, prototype7('P10')),
  },
  'e07.log-kvadratnyy': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа IV: логарифм квадратного трёхчлена равен числу, меньший корень',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, EV7_LOG_KVADRATNYY),
  },
  'e07.cos': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа V: косинус от линейного аргумента, наибольший отрицательный корень (П-27)',
    otkuda: 'razdel',
    zadacha: (p: Params7) => z07(p, prototype7('P27')),
  },
};
