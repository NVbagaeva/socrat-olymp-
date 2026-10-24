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
import { kLog, type KLog } from '@/lib/graph/povyshennye';
import { maxNaOtrezke, type MaxNaOtrezke } from '@/lib/proizvodnaya/povyshennye';
import { renderSolid } from '@/lib/solid';
import { typeset, typesetKrupno } from '@/lib/tex';
import { skalyarnoeKombinatsiy, type SkalyarnoeKombinatsiy } from '@/lib/vektory/povyshennye';
import { PV4_NE_MENEE, PV5_DVE_PARTII } from '@/lib/veroyatnost/povyshennye';
import { dec, type Prototype as ProtoVer } from '@/lib/veroyatnost/types';
import { logObratnyy } from '@/lib/vychisleniya/povyshennye';
import { razborStepsHtml } from '@/lib/vychisleniya/sheet8';
import { P03_86 } from '@/lib/zadanie3/razdel8/cilindr';
import { prototype as prototype6 } from '@/lib/zadanie6/prototypes';
import { PV7_KOREN } from '@/lib/zadanie7/prototypes/povyshennye';
import { subtype as subtype11 } from '@/lib/zadanie11/prototypes';
import { generateFixed } from '@/lib/zadanie13/generate';
import { PEOPLE, type PlotFull } from '@/lib/zadanie13/plots';
import { obshchayaSummaGod, type ObshchayaSumma } from '@/lib/zadanie13/proto/povyshennye';
import type { Params as Params7 } from '@/lib/zadanie7/types';
import type { Params as Params6 } from '@/lib/zadanie6/types';
import type { Params as ParamsVer } from '@/lib/veroyatnost/types';
import type { Params as Params10 } from '@/lib/zadanie10/types';
import type { Params as Params11 } from '@/lib/zadanie11/types';
import { razborUchenika } from '@/lib/variant/adapters/z01';
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

function z01(p: { proto: number; a: number }): Gotovaya {
  const s = sostavZadachi({
    proto: p.proto,
    params: { a: p.a } as never,
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

function z03(p: { V: number }): Gotovaya {
  const proto = P03_86;
  const otvetChislo = proto.otvet(p);
  const otvet = answerHtml(otvetChislo);
  const shagi = proto.shagi(p).map((s) => s.text.replace(/\n/g, ' '));
  const hints: HintLike[] = [
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
      comment:
        '$V_{\\text{шара}}=\\dfrac43\\pi R^3$, $V_{\\text{цил}}=\\pi R^2\\cdot 2R=2\\pi R^3$.',
    },
  ];
  return {
    egeNumber: 3,
    difficulty: null,
    statement: typeset(proto.uslovie(p)),
    figure: { svg: renderSolid(proto.chertezh(p)), width: 50 },
    figureTeacher: null,
    answer: answerText(otvetChislo),
    answerHtml: otvet,
    solutionTeacher:
      `<ol class="sheet-steps">${shagi.map((t) => `<li class="sheet-step">${typeset(t)}</li>`).join('')}</ol>` +
      razborAnswer(otvet),
    hints: hintSteps(peremeshat(hints, `z03|${p.V}`)),
    solutionStudent:
      studentFromHints(
        peremeshat(hints, `z03|${p.V}`),
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

/* ── №7 ─────────────────────────────────────────────────────────── */

function z07(p: Params7): Gotovaya {
  const s = PV7_KOREN.solve(p);
  const otvet = answerHtml(s.answer);
  const razbor = razbor7Html(s);
  return {
    egeNumber: 7,
    difficulty: null,
    statement: `<p>${typeset(PV7_KOREN.uslovie(p))}</p>`,
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

function z08(p: { m: number; t: number }): Gotovaya {
  const t = logObratnyy(p);
  const otvet = answerHtml(t.otvet);
  const hints: HintLike[] = [
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
  const h = peremeshat(hints, `z08|${p.m}|${p.t}`);
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

/* ── №12 ────────────────────────────────────────────────────────── */

/** Ширина рисунка №12 на листе, мм: клетка 3,4 мм, у движка — 34 единицы. */
function shirina12(svg: string): number | undefined {
  const box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  return box === null ? undefined : Math.round((Number(box[1]) / 34) * 3.4 * 100) / 100;
}

function z12(p: KLog): Gotovaya {
  const t = kLog(p);
  const otvet = answerHtml(t.otvet);
  const h = peremeshat(t.hints, `z12|${p.r}|${p.c}|${p.y0}`);
  return {
    egeNumber: 12,
    difficulty: null,
    statement: `<p>${typeset(t.uslovie)}</p>`,
    figure: { svg: t.svg, width: shirina12(t.svg) },
    figureTeacher: { svg: t.svgUchitel, width: shirina12(t.svgUchitel) },
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

function z13(p: ObshchayaSumma & Syuzhet13, klyuch: string): Gotovaya {
  const person = PEOPLE.find((x) => x.name === p.imya) ?? { name: p.imya, g: 'm' as const };
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
  const task = generateFixed(obshchayaSummaGod(p), plot, klyuch);
  return bezPoley(
    build13({ ...kand, seed: klyuch, prototypeId: task.prototypeId, subtype: 'A' }, false, task),
  );
}

/* ── Реестр ─────────────────────────────────────────────────────── */

export const SHABLONY: Record<string, Shablon> = {
  'z01.ravnobedr-koren': {
    ege: 1,
    prototip:
      'Планиметрия, блок III: площадь равнобедренного с углом 30° при вершине (прототип 17), боковая сторона — корень',
    otkuda: 'novyy',
    zadacha: (p: { a: number }) => z01({ proto: 101, a: p.a }),
  },
  'z01.ravnobedr-150': {
    ege: 1,
    prototip:
      'Планиметрия, блок III: площадь равнобедренного с тупым углом 150° при вершине (как прототип 17), боковая сторона — корень; подвох — sin 150° = sin 30°',
    otkuda: 'novyy',
    zadacha: (p: { a: number }) => z01({ proto: 102, a: p.a }),
  },
  'z02.skalyar-km': {
    ege: 2,
    prototip:
      'Векторы, группа B: скалярное произведение по координатам (B3) для векторов k·a и m·b',
    otkuda: 'novyy',
    zadacha: (p: SkalyarnoeKombinatsiy) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, skalyarnoeKombinatsiy(p))),
  },
  'z03.shar-v-cilindre': {
    ege: 3,
    prototip: 'Стереометрия, раздел VIII: объём шара, вписанного в цилиндр (P03-86)',
    otkuda: 'razdel',
    zadacha: (p: { V: number }) => z03(p),
  },
  'z04.ne-menee': {
    ege: 4,
    prototip: 'Вероятность: вложенные события «не менее a / не менее b» (как p5-03, сюжет лучника)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_NE_MENEE, p),
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
    zadacha: (p: Params6, klyuch: string) =>
      bezPoley(
        build06({
          ...kand,
          prototypeId: 'P08',
          z: {
            id: klyuch,
            prototypeId: 'P08',
            source: 'analog',
            text: prototype6('P08').uslovie(p).text,
            params: p,
          },
        }),
      ),
  },
  'z07.koren': {
    ege: 7,
    prototip: 'Простейшие уравнения, группа III: показательное, справа корень (как П-16)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p),
  },
  'z08.log-obratnyy': {
    ege: 8,
    prototip: 'Вычисления, логарифмы с буквами (как 8.Z «given»): дан log_b a, найти log_a(bᵐ√a)',
    otkuda: 'novyy',
    zadacha: (p: { m: number; t: number }) => z08(p),
  },
  'z09.max-na-otrezke': {
    ege: 9,
    prototip:
      'Производная, группа IV: точка максимума на отрезке по графику f′ (как 9.4.8, на отрезке есть и минимум)',
    otkuda: 'novyy',
    zadacha: (p: MaxNaOtrezke) => {
      const g = maxNaOtrezke(p);
      if (g === null) throw new Error(`№9: рисунок не прошёл проверки ${JSON.stringify(p)}`);
      return bezPoley(build09({ ...kand, seed: 'pv' }, g, false));
    },
  },
  'z10.vysota': {
    ege: 10,
    prototip:
      'Прикладные, группа II: сколько секунд тело выше отметки (P17), коэффициент при t² — параметр',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => {
      const { tekst, ...params } = p;
      return bezPoley(
        build10({
          ...kand,
          prototypeId: 'P17',
          z: { id: klyuch, prototypeId: 'P17', source: 'analog', text: tekst, params },
        }),
      );
    },
  },
  'z11.bystryy': {
    ege: 11,
    prototip:
      'Текстовые, движение: «за час на … км больше, прибыл раньше» (DP-09), спрашивают скорость быстрого',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) => {
      const { tekst, ...params } = p;
      const t = build11(
        { ...kand, prototypeId: 'DP-09', iz: { vid: 'new', seed: klyuch, params } },
        subtype11('DP-09').solve({ ...params, ask: 'bys' }),
      );
      return bezPoley({ ...t, statement: typesetKrupno(tekst) });
    },
  },
  'z12.k-log': {
    ege: 12,
    prototip: 'Графики, логарифмическая: f(x) = k·logₐ x, аргумент по значению (как 12L.C)',
    otkuda: 'novyy',
    zadacha: (p: KLog) => z12(p),
  },
  'z13.dif-summa': {
    ege: 13,
    prototip:
      'Экономика, тип A: годовой дифференцированный, общая сумма выплат в рублях (как A-01, рамка «июль»)',
    otkuda: 'novyy',
    zadacha: (p: ObshchayaSumma & Syuzhet13, klyuch: string) => z13(p, klyuch),
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
