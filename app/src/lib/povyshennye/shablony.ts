/**
 * Шаблоны раздела: запись версии → задача онлайн-модуля (`VariantTask`).
 *
 * Каждый шаблон берёт задачу у движка своего раздела — условие, рисунок,
 * ответ, решение учителя, разбор ученика и подсказки — и размечает её
 * теми же функциями, что адаптеры «Собрать вариант» (lib/variant/
 * adapters): лист и онлайн-режим у версии те же, что у любого варианта.
 * Второго решателя здесь нет.
 *
 * Модуль тяжёлый (движки разделов, KaTeX): экран раздела его не грузит,
 * его подтягивает только сборка версии (`set.ts`).
 */

import { shirinaRisunka } from '@/lib/planimetriya/shirina';
import { BEZ_VARIANTA } from '@/lib/planimetriya/variant';
import { sostavZadachi } from '@/lib/planimetriya/trenazher/zadacha';
import {
  giperbolaPryamaya,
  kLog,
  korenKoren,
  type GiperbolaPryamaya,
  type GrafikTask,
  type KLog,
  type KorenKoren,
} from '@/lib/graph/povyshennye';
import {
  chisloNaOtrezke,
  maxNaOtrezke,
  minNaOtrezke,
  skorostVMoment,
  type ChisloNaOtrezke,
  type MaxNaOtrezke,
  type SkorostVMoment,
} from '@/lib/proizvodnaya/povyshennye';
import type { Generated as Generated9 } from '@/lib/proizvodnaya/types';
import { renderSolid } from '@/lib/solid';
import { typeset, typesetKrupno } from '@/lib/tex';
import {
  dlinaKombinatsiiPoRisunku,
  perpendikulyarNeizvestnaya,
  skalyarnoeKombinatsiy,
  type DlinaKombinatsii,
  type PerpendikulyarNeizvestnaya,
  type SkalyarnoeKombinatsiy,
} from '@/lib/vektory/povyshennye';
import {
  PV4_BOLSHE,
  PV4_DELITSYA,
  PV4_NE_MENEE,
  PV4_PROTIVOPOLOZHNOE,
  PV5_DVE_PARTII,
  PV5_KOST_USLOVIE,
  PV5_MEZHDU,
} from '@/lib/veroyatnost/povyshennye';
import { dec, type Prototype as ProtoVer } from '@/lib/veroyatnost/types';
import {
  logObratnyy,
  logPryamoy,
  sinDvoynogoPrivedenie,
  stepeniChastnoe,
} from '@/lib/vychisleniya/povyshennye';
import type { Draft } from '@/lib/vychisleniya/types';
import { razborStepsHtml } from '@/lib/vychisleniya/sheet8';
import { P03_74S } from '@/lib/zadanie3/razdel7/povyshennye';
import {
  PV03_CILINDR,
  PV03_KONUS,
  PV03_SHAR,
  PV03_SHAR_OKOLO_KONUSA,
} from '@/lib/zadanie3/razdel8/povyshennye';
import type { Params as Params3, Prototype as Proto3 } from '@/lib/zadanie3/types';
import { prototype as prototype6 } from '@/lib/zadanie6/prototypes';
import { PV7_KOREN, PV7_LOG_KVADRAT, PV7_LOG_STEPENI } from '@/lib/zadanie7/prototypes/povyshennye';
import type { Prototype as Proto7 } from '@/lib/zadanie7/types';
import { subtype as subtype11 } from '@/lib/zadanie11/prototypes';
import { generateFixed } from '@/lib/zadanie13/generate';
import { PEOPLE, type PlotFull } from '@/lib/zadanie13/plots';
import {
  obshchayaSummaGod,
  posledniyPlatezh,
  stavkaVklada,
  type ObshchayaSumma,
  type PosledniyPlatezh,
  type StavkaVklada,
} from '@/lib/zadanie13/proto/povyshennye';
import type { Prototype as Proto13 } from '@/lib/zadanie13/proto/types';
import type { Params as Params7 } from '@/lib/zadanie7/types';
import type { Params as Params6 } from '@/lib/zadanie6/types';
import type { Params as ParamsVer } from '@/lib/veroyatnost/types';
import type { Params as Params10 } from '@/lib/zadanie10/types';
import type { Params as Params11, Solved as Solved11 } from '@/lib/zadanie11/types';
import { ocheredno } from '@/lib/zadanie11/prototypes/povyshennye';
import { razborUchenika } from '@/lib/variant/adapters/z01';
import { krupnyyRisunok, minFont, shirinaPoKletke } from '@/lib/variant/pechat';
import { build as build02 } from '@/lib/variant/adapters/z02';
import { studentHtml, teacherHtml, type Razbor45 } from '@/lib/variant/adapters/z04/veroyatnost';
import { build as build06 } from '@/lib/variant/adapters/z06';
import { razbor7Html } from '@/lib/variant/adapters/z07/razbor';
import { buildIz as build09 } from '@/lib/variant/adapters/z09';
import { build as build10 } from '@/lib/variant/adapters/z10';
import { build as build11 } from '@/lib/variant/adapters/z11';
import { buildIz as build13 } from '@/lib/variant/adapters/z13';
import {
  answerHtml,
  answerText,
  hintSteps,
  razborAnswer,
  studentFromHints,
  type HintLike,
} from '@/lib/variant/adapters/common';
import type { EgeNo, HintStep, VariantTask } from '@/lib/variant/types';
import type { ShablonInfo, Zapis } from './types';

/** Задача без полей версии: их проставляет `zadachaVersii`. */
type Gotovaya = Omit<VariantTask, 'taskId' | 'prototypeId' | 'subtype' | 'source' | 'ref'>;

interface Shablon extends ShablonInfo {
  zadacha(p: never, klyuch: string): Gotovaya;
}

/** Общие поля, которые адаптер раздела заполняет по-своему, — убираем. */
function bezPoley(t: VariantTask): Gotovaya {
  const {
    taskId: _taskId,
    prototypeId: _prototypeId,
    subtype: _subtype,
    source: _source,
    ref: _ref,
    ...rest
  } = t;
  return { ...rest, fallbacks: [], difficulty: null };
}

/** Кандидат для `build` адаптера: только чтобы адаптер собрал разметку. */
const kand = { taskId: 'pv', prototypeId: '', subtype: '', source: 'own' as const, stars: null };

/**
 * Подсказки с верной кнопкой на месте по ключу задачи: шаблоны, где
 * варианты перечислены «верный первым», не выдают ответ положением.
 */
function peremeshat(h: readonly HintLike[], klyuch: string): HintLike[] {
  return h.map((x, i) => {
    let s = 0;
    for (const ch of `${klyuch}|${i}`) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0;
    const sdvig = s % x.options.length;
    const options = x.options.map((_, j) => x.options[(j + sdvig) % x.options.length]!);
    return { ...x, options, correct: (x.correct - sdvig + x.options.length) % x.options.length };
  });
}

/* ── №1 ─────────────────────────────────────────────────────────── */

function z01(proto: number, params: Record<string, number>): Gotovaya {
  const s = sostavZadachi({
    proto,
    params: params as never,
    variant: BEZ_VARIANTA,
    fipi: null,
  });
  const otvet = s.razbor.otvetHtml;
  const hints: HintStep[] = s.podskazki.voprosy.map((v) => ({
    question: v.vopros,
    options: v.knopki,
    correct: v.verno,
    comment: v.poyasnenie === '' ? null : v.poyasnenie,
  }));
  return {
    egeNumber: 1,
    difficulty: null,
    statement: typesetKrupno(s.uslovie),
    figure: { svg: s.risunokSvg, width: shirinaRisunka(s.risunokSvg) },
    figureTeacher: { svg: s.razbor.risunokSvg, width: shirinaRisunka(s.razbor.risunokSvg, 44) },
    answer: answerText(s.otvet),
    answerHtml: otvet,
    solutionTeacher: s.reshenieLista + razborAnswer(otvet),
    solutionStudent: razborUchenika(s.razbor) + razborAnswer(otvet),
    hints,
    fallbacks: [],
  };
}

/* ── №3 ─────────────────────────────────────────────────────────── */

/** Подсказки к шару, вписанному в цилиндр (P03-86, P03-85). */
const HINTS_SHAR_CILINDR: HintLike[] = [
  {
    question: 'Как связаны размеры цилиндра и вписанного в него шара?',
    options: [
      'Радиус основания равен радиусу шара, высота — диаметру',
      'Высота цилиндра равна радиусу шара',
      'Радиус основания вдвое больше радиуса шара',
    ],
    correct: 0,
  },
  {
    question: 'Какую часть объёма цилиндра занимает шар?',
    options: ['$\\dfrac23$', '$\\dfrac12$', '$\\dfrac34$'],
    correct: 0,
    comment: '$V_{\\text{шара}}=\\dfrac43\\pi R^3$, $V_{\\text{цил}}=\\pi R^2\\cdot 2R=2\\pi R^3$.',
  },
];

/** Подсказки к конусу, вписанному в шар (P03-90, P03-91). */
const HINTS_KONUS_SHAR: HintLike[] = [
  {
    question: 'Чему равна высота конуса, если радиус его основания равен радиусу шара?',
    options: ['Радиусу шара', 'Диаметру шара', 'Половине радиуса шара'],
    correct: 0,
    comment: 'Основание — большой круг шара, центр шара — центр основания, вершина лежит на шаре.',
  },
  {
    question: 'Во сколько раз объём шара больше объёма конуса?',
    options: ['В 4 раза', 'В 3 раза', 'В 2 раза'],
    correct: 0,
    comment:
      '$V_{\\text{шара}}=\\dfrac43\\pi R^3$, $V_{\\text{кон}}=\\dfrac13\\pi R^2\\cdot R=\\dfrac13\\pi R^3$.',
  },
];

/** Подсказки к призме, описанной около цилиндра (P03-74S). */
const HINTS_PRIZMA_CILINDR: HintLike[] = [
  {
    question: 'Чему равна сторона основания призмы?',
    options: ['Диаметру цилиндра', 'Радиусу цилиндра', 'Высоте цилиндра'],
    correct: 0,
    comment: 'Круг основания цилиндра вписан в квадрат основания призмы.',
  },
  {
    question: 'Из чего складывается полная поверхность призмы?',
    options: [
      'Два квадрата-основания и четыре прямоугольные боковые грани',
      'Только четыре боковые грани',
      'Одно основание и четыре боковые грани',
    ],
    correct: 0,
  },
];

function z03(proto: Proto3, p: Params3, hints: HintLike[], klyuch: string): Gotovaya {
  const otvetChislo = proto.otvet(p);
  const otvet = answerHtml(otvetChislo);
  const shagi = proto.shagi(p).map((s) => s.text.replace(/\n/g, ' '));
  const h = peremeshat(hints, klyuch);
  return {
    egeNumber: 3,
    difficulty: null,
    statement: typeset(proto.uslovie(p)),
    /* Ширина 70 мм: видимые рёбра движка — 1,5 pt (lib/solid/render.ts). */
    figure: { svg: renderSolid(proto.chertezh(p)), width: 70 },
    figureTeacher: null,
    answer: answerText(otvetChislo),
    answerHtml: otvet,
    solutionTeacher:
      `<ol class="sheet-steps">${shagi.map((t) => `<li class="sheet-step">${typeset(t)}</li>`).join('')}</ol>` +
      razborAnswer(otvet),
    hints: hintSteps(h),
    solutionStudent:
      studentFromHints(
        h,
        shagi.map((t) => ({ title: t, lines: [] })),
      ) + razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── №4, №5 ─────────────────────────────────────────────────────── */

function veroyatnost(ege: 4 | 5, proto: ProtoVer, p: ParamsVer): Gotovaya {
  if (!proto.dopustimo(p)) throw new Error(`${proto.id}: недопустимые числа ${JSON.stringify(p)}`);
  const otvetChislo = proto.otvet(p);
  const r: Razbor45 = {
    metod: '',
    shagi: proto
      .shagi(p)
      .map((s) =>
        s.formula === undefined
          ? { etap: s.etap, text: s.text }
          : { etap: s.etap, text: s.text, tex: s.formula },
      ),
    otvet: dec(otvetChislo),
  };
  const otvet = answerHtml(r.otvet);
  const hints = (proto.podskazka?.(p) ?? []).map((h) => ({ ...h, options: [...h.options] }));
  return {
    egeNumber: ege,
    difficulty: null,
    statement: `<p>${typeset(proto.uslovie(p))}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(otvetChislo),
    answerHtml: otvet,
    solutionTeacher: teacherHtml(r) + razborAnswer(otvet),
    hints: hintSteps(hints),
    solutionStudent: studentHtml(r) + razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── №6 ─────────────────────────────────────────────────────────── */

/** Задача №6 прототипа раздела: условие и разбор — генератора раздела. */
function z06(proto: string, p: Params6, klyuch: string): Gotovaya {
  const u = prototype6(proto).uslovie(p);
  return bezPoley(
    build06({
      ...kand,
      prototypeId: proto,
      z: {
        id: klyuch,
        prototypeId: proto,
        source: 'analog',
        text: u.text,
        ...(u.posle === undefined ? {} : { posle: u.posle }),
        params: p,
      },
    }),
  );
}

/* ── №7 ─────────────────────────────────────────────────────────── */

function z07(p: Params7, proto: Proto7 = PV7_KOREN): Gotovaya {
  const s = proto.solve(p);
  const otvet = answerHtml(s.answer);
  const razbor = razbor7Html(s);
  return {
    egeNumber: 7,
    difficulty: null,
    statement: `<p>${typeset(proto.uslovie(p))}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(s.answer),
    answerHtml: otvet,
    solutionTeacher: razbor + razborAnswer(otvet),
    hints: hintSteps(s.hints),
    solutionStudent:
      studentFromHints(s.hints, []) +
      `<p class="var-razbor__h">Решаем</p>${razbor}` +
      razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── №8 ─────────────────────────────────────────────────────────── */

/** Подсказки к log_a(bᵐ√a) при данном log_b a (вариант 1). */
function hints08Obratnyy(p: { m: number; t: number }): HintLike[] {
  return [
    {
      question: `Как найти $\\log_a b$, если $\\log_b a=${p.t}$?`,
      options: [`$\\dfrac{1}{${p.t}}$`, `$${-p.t}$`, `$${p.t}$`],
      correct: 0,
      comment: '$\\log_a b\\cdot\\log_b a=1$.',
    },
    {
      question: `Чему равен $\\log_a\\sqrt a$?`,
      options: ['$0{,}5$', '$2$', '$1$'],
      correct: 0,
    },
    {
      question: 'Какое выражение даёт ответ?',
      options: [
        `$${p.m}\\cdot\\dfrac{1}{${p.t}}+0{,}5$`,
        `$${p.m}\\cdot(${p.t})+0{,}5$`,
        `$${p.m}\\cdot\\dfrac{1}{${p.t}}\\cdot0{,}5$`,
      ],
      correct: 0,
    },
  ];
}

/** Задача №8 из черновика раздела и своих подсказок. */
function z08(t: Draft, hints: HintLike[], klyuch: string): Gotovaya {
  const otvet = answerHtml(t.otvet);
  const h = peremeshat(hints, klyuch);
  return {
    egeNumber: 8,
    difficulty: null,
    statement: `<p>${typeset(t.uslovie)}</p>`,
    figure: null,
    figureTeacher: null,
    answer: answerText(t.otvet),
    answerHtml: otvet,
    solutionTeacher: razborStepsHtml(t.razbor) + razborAnswer(otvet),
    hints: hintSteps(h),
    solutionStudent:
      studentFromHints(h, [{ title: 'Преобразуем и считаем', lines: t.razbor }]) +
      razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── №9 ──────────────────────────────────────────────────────────── */

function z09(g: Generated9 | null, p: unknown): Gotovaya {
  if (g === null) throw new Error(`№9: рисунок не прошёл проверки ${JSON.stringify(p)}`);
  return bezPoley(build09({ ...kand, seed: 'pv' }, g, false));
}

/* ── №10 ────────────────────────────────────────────────────────── */

/** Задача №10 прототипа раздела со своим текстом сюжета. */
function z10(proto: string, p: Params10 & { tekst: string }, klyuch: string): Gotovaya {
  const { tekst, ...params } = p;
  return bezPoley(
    build10({
      ...kand,
      prototypeId: proto,
      z: { id: klyuch, prototypeId: proto, source: 'analog', text: tekst, params },
    }),
  );
}

/* ── №11 ────────────────────────────────────────────────────────── */

/** Задача №11 по решателю подтипа, условие — свой текст сюжета. */
function z11(
  id: string,
  p: Params11 & { tekst: string },
  klyuch: string,
  solve: (x: Params11) => Solved11,
): Gotovaya {
  const { tekst, ...params } = p;
  const t = build11(
    { ...kand, prototypeId: id, iz: { vid: 'new', seed: klyuch, params } },
    solve(params),
  );
  return bezPoley({ ...t, statement: typesetKrupno(tekst) });
}

/* ── №12 ────────────────────────────────────────────────────────── */

/**
 * Задача №12 из шаблона раздела: рисунки — движком №12 крупно, клетка
 * 7 мм (не меньше 6), подписи не мельче 10 pt (lib/variant/pechat).
 */
function z12(sobrat: (pechat: { minFont: number }) => GrafikTask, klyuch: string): Gotovaya {
  const kletka = krupnyyRisunok((kegl) => sobrat({ minFont: kegl }).svg).kletka;
  const t = sobrat({ minFont: minFont(kletka) });
  const otvet = answerHtml(t.otvet);
  const h = peremeshat(t.hints, klyuch);
  return {
    egeNumber: 12,
    difficulty: null,
    statement: `<p>${typeset(t.uslovie)}</p>`,
    figure: { svg: t.svg, width: shirinaPoKletke(t.svg, kletka), below: true },
    figureTeacher: { svg: t.svgUchitel, width: shirinaPoKletke(t.svgUchitel, kletka), below: true },
    answer: answerText(t.otvet),
    answerHtml: otvet,
    solutionTeacher:
      `<ol class="sheet-steps">${t.shagi
        .map(
          (s) =>
            `<li class="sheet-step"><b>${s.title}.</b> ${s.lines.map((l) => typeset(l)).join(' ')}</li>`,
        )
        .join('')}</ol>` + razborAnswer(otvet),
    hints: hintSteps(h),
    solutionStudent: studentFromHints(h, t.shagi) + razborAnswer(otvet),
    fallbacks: [],
  };
}

/* ── №13 ────────────────────────────────────────────────────────── */

interface Syuzhet13 {
  imya: string;
  /** Цель кредита: «на открытие пекарни». */
  goal: string;
  year: number;
}

function z13(proto: Proto13, p: Syuzhet13, klyuch: string): Gotovaya {
  /* Род глаголов условия берётся из списка имён раздела: чужое имя — ошибка данных. */
  const person = PEOPLE.find((x) => x.name === p.imya);
  if (person === undefined) throw new Error(`№13: имени «${p.imya}» нет в PEOPLE`);
  const plot: PlotFull = {
    deck: 'варианты',
    who: person.name,
    goal: p.goal,
    year: p.year,
    person,
    subject: person.name,
    g: person.g,
    firm: false,
  };
  const task = generateFixed(proto, plot, klyuch);
  return bezPoley(
    build13(
      { ...kand, seed: klyuch, prototypeId: task.prototypeId, subtype: proto.type },
      false,
      task,
    ),
  );
}

/* ── Реестр ─────────────────────────────────────────────────────── */

export const SHABLONY: Record<string, Shablon> = {
  'z01.ravnobedr-koren': {
    ege: 1,
    prototip:
      'Планиметрия, блок III: площадь равнобедренного с углом 30° при вершине (прототип 17), боковая сторона — корень',
    otkuda: 'novyy',
    zadacha: (p: { a: number }) => z01(101, p),
  },
  'z01.ravnobedr-150': {
    ege: 1,
    prototip:
      'Планиметрия, блок III: площадь равнобедренного с тупым углом 150° при вершине (как прототип 17), боковая сторона — корень; подвох — sin 150° = sin 30°',
    otkuda: 'novyy',
    zadacha: (p: { a: number }) => z01(102, p),
  },
  'z01.trapeciya-menshiy': {
    ege: 1,
    prototip:
      'Планиметрия, блок IV: меньший из отрезков, на которые диагональ делит среднюю линию трапеции (как прототип 22, где спрашивают больший)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; b: number }) => z01(103, p),
  },
  'z01.trapeciya-diagonali': {
    ege: 1,
    prototip: 'Планиметрия, блок X: отрезок между серединами диагоналей трапеции (прототип 71)',
    otkuda: 'razdel',
    zadacha: (p: { a: number; b: number }) => z01(71, p),
  },
  'z01.vneshnie-ugly': {
    ege: 1,
    prototip:
      'Планиметрия, блок X: два внешних угла при A и C → угол B (как прототип 51, где дан один внешний угол)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; c: number }) => z01(104, p),
  },
  'z02.skalyar-km': {
    ege: 2,
    prototip:
      'Векторы, группа B: скалярное произведение по координатам (B3) для векторов k·a и m·b',
    otkuda: 'novyy',
    zadacha: (p: SkalyarnoeKombinatsiy) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, skalyarnoeKombinatsiy(p))),
  },
  'z02.dlina-po-risunku': {
    ege: 2,
    prototip:
      'Векторы, группа A: длина a + k·b по рисунку на клетчатой плоскости (как A6), множитель при b — и дробный',
    otkuda: 'novyy',
    zadacha: (p: DlinaKombinatsii) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, dlinaKombinatsiiPoRisunku(p))),
  },
  'z02.perpendikulyar': {
    ege: 2,
    prototip:
      'Векторы, группа B: перпендикулярные векторы, неизвестная координата (как B3, условие a·b = 0)',
    otkuda: 'novyy',
    zadacha: (p: PerpendikulyarNeizvestnaya) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, perpendikulyarNeizvestnaya(p))),
  },
  'z03.shar-v-cilindre': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: объём шара, вписанного в цилиндр (P03-86)',
    otkuda: 'razdel',
    zadacha: (p: { V: number }) => z03(PV03_SHAR, p, HINTS_SHAR_CILINDR, `z03|${p.V}`),
  },
  'z03.cilindr-okolo-shara': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: объём цилиндра, описанного около шара (P03-85)',
    otkuda: 'razdel',
    zadacha: (p: { V: number }) => z03(PV03_CILINDR, p, HINTS_SHAR_CILINDR, `z03c|${p.V}`),
  },
  'z03.prizma-okolo-cilindra': {
    ege: 3,
    prototip:
      'Стереометрия, раздел VII: полная поверхность правильной четырёхугольной призмы около цилиндра (как P03-74, где спрашивают объём)',
    otkuda: 'novyy',
    zadacha: (p: { r: number; h: number }) =>
      z03(P03_74S, p, HINTS_PRIZMA_CILINDR, `z03p|${p.r}|${p.h}`),
  },
  'z03.konus-v-share': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: конус в шаре, r конуса = R шара — объём конуса (P03-91)',
    otkuda: 'razdel',
    zadacha: (p: { V: number }) => z03(PV03_KONUS, p, HINTS_KONUS_SHAR, `z03k|${p.V}`),
  },
  'z03.shar-okolo-konusa': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: конус в шаре, r конуса = R шара — объём шара (P03-90)',
    otkuda: 'razdel',
    zadacha: (p: { V: number }) => z03(PV03_SHAR_OKOLO_KONUSA, p, HINTS_KONUS_SHAR, `z03s|${p.V}`),
  },
  'z04.ne-menee': {
    ege: 4,
    prototip: 'Вероятность: вложенные события «не менее a / не менее b» (как p5-03, сюжет лучника)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_NE_MENEE, p),
  },
  'z04.bolshe': {
    ege: 4,
    prototip:
      'Вероятность: вложенные события «больше a / больше b», строгие границы (как p5-03, сюжет с пассажирами, посетителями…)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_BOLSHE, p),
  },
  'z04.delitsya': {
    ege: 4,
    prototip:
      'Вероятность, классическое определение: число из отрезка натурального ряда делится на d (концы входят)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_DELITSYA, p),
  },
  'z04.protivopolozhnoe': {
    ege: 4,
    prototip: 'Вероятность: противоположное событие — выход размера за допуск или «не ниже порога»',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_PROTIVOPOLOZHNOE, p),
  },
  'z05.mezhdu': {
    ege: 5,
    prototip:
      'Вероятность: значение между двумя порогами по P(выше t₁) и P(ниже t₂), p₁ + p₂ − 1 (как p5-13)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_MEZHDU, p),
  },
  'z05.kost-uslovie': {
    ege: 5,
    prototip:
      'Условная вероятность на двух костях: «хотя бы раз g» при «сумма не s», до сотых (как p5-05)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_KOST_USLOVIE, p),
  },
  'z05.dve-partii': {
    ege: 5,
    prototip: 'Вероятность: «не менее 4 очков» в двух играх с разными вероятностями (как p5-10)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_DVE_PARTII, p),
  },
  'z06.chastoty': {
    ege: 6,
    prototip: 'Случайные величины, группа III: частоты «из 100 покупателей» → ожидание (P08)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P08', p, klyuch),
  },
  'z06.dispersiya': {
    ege: 6,
    prototip: 'Случайные величины, группа V: дисперсия по распределению (P14)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P14', p, klyuch),
  },
  'z06.otklonenie': {
    ege: 6,
    prototip: 'Случайные величины, группа V: стандартное отклонение (P15)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P15', p, klyuch),
  },
  'z07.koren': {
    ege: 7,
    prototip: 'Простейшие уравнения, группа III: показательное, справа корень (как П-16)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p),
  },
  'z07.log-stepeni': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа IV: логарифм степени, основание и число — разные степени одного числа (как П-25)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_LOG_STEPENI),
  },
  'z07.log-postoronniy': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа IV: равные логарифмы → x² = c, посторонний корень, «больший корень» (как П-30)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_LOG_KVADRAT),
  },
  'z08.log-obratnyy': {
    ege: 8,
    prototip: 'Вычисления, логарифмы с буквами (как 8.Z «given»): дан log_b a, найти log_a(bᵐ√a)',
    otkuda: 'novyy',
    zadacha: (p: { m: number; t: number }) =>
      z08(logObratnyy(p), hints08Obratnyy(p), `z08|${p.m}|${p.t}`),
  },
  'z08.log-pryamoy': {
    ege: 8,
    prototip:
      'Вычисления, логарифмы с буквами (как 8.Z «given»): дан log_b a, найти log_a(aᵐ√b) — корень из b, а не из a',
    otkuda: 'novyy',
    zadacha: (p: { m: number; t: number }) =>
      z08(
        logPryamoy(p),
        [
          {
            question: `Чему равен $\\log_a a^{${p.m}}$?`,
            options: [`$${p.m}$`, `$${p.m}\\log_a b$`, '$1$'],
            correct: 0,
          },
          {
            question: `Как найти $\\log_a b$, если $\\log_b a=${p.t}$?`,
            options: [`$\\dfrac{1}{${p.t}}$`, `$${-p.t}$`, `$${p.t}$`],
            correct: 0,
            comment: '$\\log_a b\\cdot\\log_b a=1$.',
          },
          {
            question: 'Чему равен $\\log_a\\sqrt b$?',
            options: ['$\\dfrac12\\log_a b$', '$\\dfrac12$', '$2\\log_a b$'],
            correct: 0,
            comment: '$\\sqrt b=b^{\\frac12}$, показатель выносим множителем.',
          },
        ],
        `z08p|${p.m}|${p.t}`,
      ),
  },
  'z08.sin-dvoynoy': {
    ege: 8,
    prototip:
      'Вычисления, тригонометрия (как 8.R «cancel»): синус двойного угла в числителе, формула приведения и знак в знаменателе',
    otkuda: 'novyy',
    zadacha: (p: { x: number; c: number }) =>
      z08(
        sinDvoynogoPrivedenie(p),
        [
          {
            question: `Чему равно $2\\sin ${p.x}^\\circ\\cos ${p.x}^\\circ$?`,
            options: [
              `$\\sin ${2 * p.x}^\\circ$`,
              `$\\cos ${2 * p.x}^\\circ$`,
              `$\\sin ${p.x}^\\circ$`,
            ],
            correct: 0,
            comment: 'Формула синуса двойного угла.',
          },
          {
            question: `Как связаны $\\sin ${360 - 2 * p.x}^\\circ$ и $\\sin ${2 * p.x}^\\circ$?`,
            options: [
              `$\\sin ${360 - 2 * p.x}^\\circ=-\\sin ${2 * p.x}^\\circ$`,
              `$\\sin ${360 - 2 * p.x}^\\circ=\\sin ${2 * p.x}^\\circ$`,
              `$\\sin ${360 - 2 * p.x}^\\circ=\\cos ${2 * p.x}^\\circ$`,
            ],
            correct: 0,
            comment: '$\\sin(360^\\circ-\\alpha)=-\\sin\\alpha$.',
          },
        ],
        `z08s|${p.x}|${p.c}`,
      ),
  },
  'z08.stepeni-chastnoe': {
    ege: 8,
    prototip:
      'Вычисления, степени (как 8.C «quot»): частное степеней с разными основаниями — степенями одного числа, дробные показатели',
    otkuda: 'novyy',
    zadacha: (p: { b: number; s1: number; s2: number; x: number; y: number }) =>
      z08(
        stepeniChastnoe(p),
        [
          {
            question: `Степенью какого числа являются $${p.b ** p.s1}$ и $${p.b ** p.s2}$?`,
            options: [`$${p.b}$`, `$${p.b ** p.s2}$`, '$10$'],
            correct: 0,
          },
          {
            question: 'Как делить степени с одинаковым основанием?',
            options: ['Показатели вычесть', 'Показатели разделить', 'Основания разделить'],
            correct: 0,
          },
        ],
        `z08c|${p.b}|${p.x}|${p.y}`,
      ),
  },
  'z09.max-na-otrezke': {
    ege: 9,
    prototip:
      'Производная, группа IV: точка максимума на отрезке по графику f′ (как 9.4.8, на отрезке есть и минимум)',
    otkuda: 'novyy',
    zadacha: (p: MaxNaOtrezke) => z09(maxNaOtrezke(p), p),
  },
  'z09.min-na-otrezke': {
    ege: 9,
    prototip:
      'Производная, группа IV: точка минимума на отрезке по графику f′ (как 9.4.8, на отрезке есть и максимум)',
    otkuda: 'novyy',
    zadacha: (p: MaxNaOtrezke) => z09(minNaOtrezke(p), p),
  },
  'z09.chislo-na-otrezke': {
    ege: 9,
    prototip:
      'Производная, группа IV: число точек максимума или экстремума на отрезке по графику f′ (как 9.4.4), часть нулей вне отрезка',
    otkuda: 'novyy',
    zadacha: (p: ChisloNaOtrezke) => z09(chisloNaOtrezke(p), p),
  },
  'z09.skorost': {
    ege: 9,
    prototip:
      'Производная, группа I: скорость в момент t₀ по закону движения (9.1.1), десятичные коэффициенты',
    otkuda: 'novyy',
    zadacha: (p: SkorostVMoment) => z09(skorostVMoment(p), p),
  },
  'z10.vysota': {
    ege: 10,
    prototip:
      'Прикладные, группа II: сколько секунд тело выше отметки (P17), коэффициент при t² — параметр',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P17', p, klyuch),
  },
  'z10.adiabata': {
    ege: 10,
    prototip: 'Прикладные, группа III: адиабатическое сжатие, объём после сжатия (P21)',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P21', p, klyuch),
  },
  'z10.motocikl': {
    ege: 10,
    prototip: 'Прикладные, группа II: разгон S = v₀t + at²/2, наибольшее время в минутах (P12)',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P12', p, klyuch),
  },
  'z11.bystryy': {
    ege: 11,
    prototip:
      'Текстовые, движение: «за час на … км больше, прибыл раньше» (DP-09), спрашивают скорость быстрого',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('DP-09', p, klyuch, (x) => subtype11('DP-09').solve({ ...x, ask: 'bys' })),
  },
  'z11.sobstvennaya': {
    ege: 11,
    prototip:
      'Текстовые, движение по воде: туда и обратно со стоянкой, собственная скорость (ВД-02)',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('VD-02', p, klyuch, (x) => subtype11('VD-02').solve(x)),
  },
  'z11.ocheredno': {
    ege: 11,
    prototip:
      'Текстовые, работа: три одинаковых рабочих подключаются по очереди — сколько длилась работа (как РБ, таблица A | p | t)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PV11-OCHEREDNO', p, klyuch, ocheredno),
  },
  'z12.k-log': {
    ege: 12,
    prototip: 'Графики, логарифмическая: f(x) = k·logₐ x, аргумент по значению (как 12L.C)',
    otkuda: 'novyy',
    zadacha: (p: KLog) => z12((pe) => kLog(p, pe), `z12|${p.r}|${p.c}|${p.y0}`),
  },
  'z12.giperbola-pryamaya': {
    ege: 12,
    prototip:
      'Графики: гипербола k/x и прямая ax + b, вторая точка пересечения вне рисунка (как 12R, по Виету)',
    otkuda: 'novyy',
    zadacha: (p: GiperbolaPryamaya) =>
      z12((pe) => giperbolaPryamaya(p, pe), `z12g|${p.A.join(';')}|${p.P.join(';')}`),
  },
  'z12.koren-koren': {
    ege: 12,
    prototip:
      'Графики: √(ax) и √(x − b), точка пересечения вне рисунка (как 12S, коэффициенты по узлам)',
    otkuda: 'novyy',
    zadacha: (p: KorenKoren) => z12((pe) => korenKoren(p, pe), `z12k|${p.F.join(';')}|${p.b}`),
  },
  'z13.dif-summa': {
    ege: 13,
    prototip:
      'Экономика, тип A: годовой дифференцированный, общая сумма выплат в рублях (как A-01, рамка «июль»)',
    otkuda: 'novyy',
    zadacha: (p: ObshchayaSumma & Syuzhet13, klyuch: string) =>
      z13(obshchayaSummaGod(p), p, klyuch),
  },
  'z13.stavka-vklada': {
    ege: 13,
    prototip:
      'Экономика, тип D (вклады): пополнение через год, ставка по итоговой сумме — квадратное уравнение относительно k (как D-12)',
    otkuda: 'novyy',
    zadacha: (p: StavkaVklada & Syuzhet13, klyuch: string) => z13(stavkaVklada(p), p, klyuch),
  },
  'z13.posledniy-platezh': {
    ege: 13,
    prototip:
      'Экономика, тип B: долг каждый июль меньше на q %, последний платёж в рублях (рамка «июль», как B-кредиты с заданным путём долга)',
    otkuda: 'novyy',
    zadacha: (p: PosledniyPlatezh & Syuzhet13, klyuch: string) =>
      z13(posledniyPlatezh(p), p, klyuch),
  },
};

export function shablon(id: string): Shablon {
  const s = SHABLONY[id];
  if (s === undefined) throw new Error(`Нет шаблона ${id}`);
  return s;
}

/** Задача версии k.v: разметка шаблона плюс поля версии. */
export function zadachaVersii(k: number, v: number, zapis: Zapis): VariantTask {
  const sh = shablon(zapis.s);
  const klyuch = `PV${k}.${v}.${sh.ege}`;
  const t = sh.zadacha(zapis.p as never, klyuch);
  if (t.egeNumber !== sh.ege) throw new Error(`${zapis.s}: номер задания ${t.egeNumber}`);
  return {
    ...t,
    taskId: klyuch,
    prototypeId: zapis.s,
    subtype: zapis.s,
    source: { kind: 'own', label: `Вариант повышенной сложности ${k}, версия ${k}.${v}` },
    ref: { k, v, ege: sh.ege },
  };
}

export type { EgeNo };
