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
  giperbolaKB,
  giperbolaPryamaya,
  kLog,
  korenKoren,
  korenPryamaya,
  parabolaB,
  parabolaKorni,
  parabolaPryamaya,
  pokazatelnayaOtnoshenie,
  type GiperbolaKB,
  type GiperbolaPryamaya,
  type KorenPryamaya,
  type ParabolaPryamaya,
  type GrafikTask,
  type KLog,
  type KorenKoren,
  type ParabolaB,
  type ParabolaKorni,
  type PokazatelnayaOtnoshenie,
} from '@/lib/graph/povyshennye';
import {
  chisloNaOtrezke,
  kasatelnayaCherezNachalo,
  kasatelnayaPoUzlam,
  maxNaOtrezke,
  minNaOtrezke,
  naibNaimMetka,
  skorostMnogochlen,
  skorostVMoment,
  znakVTochkah,
  type ChisloNaOtrezke,
  type KasatelnayaNachalo,
  type KasatelnayaPoUzlam,
  type MaxNaOtrezke,
  type NaibNaimMetka,
  type SkorostMnogochlen,
  type SkorostVMoment,
  type ZnakVTochkah,
} from '@/lib/proizvodnaya/povyshennye';
import type { Generated as Generated9 } from '@/lib/proizvodnaya/types';
import { renderSolid } from '@/lib/solid';
import { typeset, typesetKrupno } from '@/lib/tex';
import {
  dlinaKM,
  dlinaKombinatsiiPoRisunku,
  kosinusPoKoordinatam,
  kosinusPoRisunku,
  perpendikulyarNeizvestnaya,
  skalyarnoeKombinatsiy,
  skalyarnoePoRisunku,
  type DlinaKM,
  type DlinaKombinatsii,
  type KosinusVektorov,
  type PerpendikulyarNeizvestnaya,
  type SkalyarnoeKombinatsiy,
  type SkalyarnoePoRisunku,
} from '@/lib/vektory/povyshennye';
import {
  PV4_BOLSHE,
  PV4_CHASTOTA,
  PV4_DELITSYA,
  PV4_NASOSY,
  PV4_NE_MENEE,
  PV4_PROTIVOPOLOZHNOE,
  PV4_PARY,
  PV4_SOOTECHESTVENNIK,
  PV4_SUMKI,
  PV4_TAKSI,
  PV4_TRI_TSVETA,
  PV5_BERNULLI,
  PV5_DVE_MISHENI,
  PV5_HOTYA_BY_DVE,
  PV5_DVE_PARTII,
  PV5_KOST_USLOVIE,
  PV5_MEZHDU,
  PV5_OBA_ZAKONCHILIS,
  PV5_ODIN_TSVET,
  PV5_ODNA_GRUPPA,
  PV5_SUMMA_OCHKOV,
} from '@/lib/veroyatnost/povyshennye';
import { dec, type Prototype as ProtoVer } from '@/lib/veroyatnost/types';
import {
  cosDvoynogo,
  logAmBn,
  logChastnoeStepeney,
  logObratnyy,
  logPryamoy,
  sinDvoynogoPrivedenie,
  stepeniChastnoe,
  stepenSLog,
  tgPoZnacheniyu,
  trigCepochka,
  trigPrivedenie,
  type CosDvoynogo,
  type LogAmBn,
  type TgPoZnacheniyu,
  type TrigPrivedenie,
  type TrigUgol,
} from '@/lib/vychisleniya/povyshennye';
import { fn as fnTex, rad as radTex } from '@/lib/vychisleniya/tex';
import type { Draft } from '@/lib/vychisleniya/types';
import { razborStepsHtml } from '@/lib/vychisleniya/sheet8';
import { PV03_PIRAMIDA_ABCA1B1, PV03_TETRAEDR_ABCB1 } from '@/lib/zadanie3/razdel1/povyshennye';
import { P03_20S, P03_28S } from '@/lib/zadanie3/razdel2/povyshennye';
import { P03_48S } from '@/lib/zadanie3/razdel3/povyshennye';
import { P03_69S, PV03_KRUZHKI } from '@/lib/zadanie3/razdel5/povyshennye';
import { P03_74S, PV03_KONUS_BOKOVAYA } from '@/lib/zadanie3/razdel7/povyshennye';
import {
  PV03_CILINDR,
  PV03_KONUS,
  PV03_KUB_V_SHARE,
  PV03_PARALLELEPIPED_OKOLO_SFERY,
  PV03_SHAR,
  PV03_SHAR_OKOLO_KONUSA,
} from '@/lib/zadanie3/razdel8/povyshennye';
import type { Params as Params3, Prototype as Proto3 } from '@/lib/zadanie3/types';
import { prototype as prototype6 } from '@/lib/zadanie6/prototypes';
import {
  PV7_KOREN,
  PV7_KOREN_KVADRAT,
  PV7_KOREN_LINEYNYY,
  PV7_KUB_OBRATNOE,
  PV7_LOG_KVADRAT,
  PV7_LOG_KVADRATNOE,
  PV7_LOG_STEPENI,
  PV7_POKAZATELNOE,
} from '@/lib/zadanie7/prototypes/povyshennye';
import { prototype as prototype7 } from '@/lib/zadanie7/prototypes';
import type { Prototype as Proto7 } from '@/lib/zadanie7/types';
import { subtype as subtype11 } from '@/lib/zadanie11/prototypes';
import { generateFixed } from '@/lib/zadanie13/generate';
import { PEOPLE, type PlotFull } from '@/lib/zadanie13/plots';
import {
  dvaRavnyhStavka,
  dvaRavnyhSumma,
  obshchayaSummaGod,
  posledniyPlatezh,
  ravnyePopolneniya,
  stavkaPoSumme,
  stavkaVklada,
  summaPriUbyvanii,
  vkladNachalnyy,
  type DvaRavnyhStavka,
  type DvaRavnyhSumma,
  type ObshchayaSumma,
  type PosledniyPlatezh,
  type RavnyePopolneniya,
  type StavkaPoSumme,
  type StavkaVklada,
  type VkladNachalnyy,
} from '@/lib/zadanie13/proto/povyshennye';
import type { Prototype as Proto13 } from '@/lib/zadanie13/proto/types';
import type { Params as Params7 } from '@/lib/zadanie7/types';
import type { Params as Params6, Prototype as Proto6 } from '@/lib/zadanie6/types';
import { PV6_STRAHOVKA_TYS } from '@/lib/zadanie6/prototypes/povyshennye';
import type { Params as ParamsVer } from '@/lib/veroyatnost/types';
import type { Params as Params10, Prototype as Proto10 } from '@/lib/zadanie10/types';
import { sChistymResheniem } from '@/lib/zadanie10/prototypes';
import {
  PV10_DOLYA,
  PV10_GORIZONT,
  PV10_KPD,
  PV10_LINZA_MAX,
} from '@/lib/zadanie10/prototypes/povyshennye';
import type { Params as Params11, Solved as Solved11 } from '@/lib/zadanie11/types';
import {
  avtobusIAvtomobil,
  dveTruby,
  ocheredno,
  rastvorIVoda,
  triRastvora,
} from '@/lib/zadanie11/prototypes/povyshennye';
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

/** Подсказки к прямой призме, у которой ребро равно гипотенузе (P03-20S). */
const HINTS_PRIZMA_GIPOTENUZA: HintLike[] = [
  {
    question: 'Чему равна гипотенуза основания с катетами $k\\sqrt q$ и $m\\sqrt q$?',
    options: ['$\\sqrt{k^2+m^2}\\cdot\\sqrt q$', '$(k+m)\\sqrt q$', '$\\sqrt{k^2+m^2}\\cdot q$'],
    correct: 0,
    comment:
      'Теорема Пифагора: $(k\\sqrt q)^2 = k^2q$, общий множитель $q$ выносится из-под корня.',
  },
  {
    question: 'Из чего складывается полная поверхность призмы?',
    options: [
      'Два основания и боковая поверхность: периметр основания на боковое ребро',
      'Одно основание и три боковые грани',
      'Только боковая поверхность',
    ],
    correct: 0,
  },
];

/** Подсказки к пирамиде, отсечённой от призмы (P03-28S). */
const HINTS_PRIZMA_PIRAMIDA: HintLike[] = [
  {
    question: 'Какую часть объёма призмы занимает отсечённая пирамида $C_1ABC$?',
    options: ['Треть', 'Половину', 'Шестую часть'],
    correct: 0,
    comment: 'Основание и высота у пирамиды те же, что у призмы, а $V_{\\text{пир}}=\\dfrac13 Sh$.',
  },
  {
    question: 'Что спрашивают?',
    options: ['Объём оставшейся части', 'Объём пирамиды', 'Объём всей призмы'],
    correct: 0,
  },
];

/** Подсказки к пирамиде, разделённой плоскостью через сторону основания (P03-48S). */
const HINTS_PIRAMIDA_DELIT: HintLike[] = [
  {
    question: 'На какие тела плоскость делит пирамиду $SABC$?',
    options: [
      'На две треугольные пирамиды $SABM$ и $MABC$',
      'На пирамиду и усечённую пирамиду',
      'На две призмы',
    ],
    correct: 0,
  },
  {
    question: 'Во сколько раз высота пирамиды $MABC$ меньше высоты $SABC$?',
    options: [
      'Во столько, во сколько $MC$ короче $SC$',
      'В $2$ раза',
      'Во столько, во сколько $SM$ короче $SC$',
    ],
    correct: 0,
    comment: 'Основание $ABC$ общее, высоты относятся как $MC : SC$.',
  },
];

/** Подсказки к двум цилиндрам: второй выше, радиус меньше (P03-69S). */
const HINTS_DVA_CILINDRA: HintLike[] = [
  {
    question: 'Как меняется объём цилиндра, если радиус уменьшить в $b$ раз?',
    options: ['Уменьшается в $b^2$ раз', 'Уменьшается в $b$ раз', 'Не меняется'],
    correct: 0,
    comment: '$V=\\pi r^2h$: радиус входит в квадрате.',
  },
  {
    question: 'А если высоту увеличить в $a$ раз?',
    options: ['Увеличивается в $a$ раз', 'Увеличивается в $a^2$ раз', 'Уменьшается в $a$ раз'],
    correct: 0,
  },
];

/** Подсказки к двум кружкам (P03-70). */
const HINTS_KRUZHKI: HintLike[] = [
  {
    question: 'Вторая кружка шире в $w$ раз. Во сколько раз больше площадь её дна?',
    options: ['В $w^2$ раз', 'В $w$ раз', 'В $2w$ раз'],
    correct: 0,
    comment: 'Ширина — диаметр; площадь круга пропорциональна квадрату диаметра.',
  },
  {
    question: 'Как учесть, что вторая кружка ниже?',
    options: ['Разделить на отношение высот', 'Умножить на отношение высот', 'Никак'],
    correct: 0,
  },
];

/** Подсказки к конусу, у которого меняются радиус и образующая. */
const HINTS_KONUS_BOKOVAYA: HintLike[] = [
  {
    question: 'По какой формуле считается боковая поверхность конуса?',
    options: ['$S=\\pi r l$', '$S=\\pi r^2$', '$S=\\dfrac13\\pi r^2 h$'],
    correct: 0,
  },
  {
    question: 'Как меняется $S$, если $r$ умножить на $p$, а $l$ — на $q$?',
    options: ['Умножается на $p\\cdot q$', 'Умножается на $p+q$', 'Умножается на $p^2 q$'],
    correct: 0,
    comment: 'Радиус и образующая входят в формулу в первой степени.',
  },
];

/** Подсказки к кубу, вписанному в шар. */
const HINTS_KUB_V_SHARE: HintLike[] = [
  {
    question: 'Какой отрезок куба равен диаметру шара?',
    options: ['Диагональ куба', 'Ребро куба', 'Диагональ грани'],
    correct: 0,
    comment: 'Вершины вписанного куба лежат на сфере, противоположные — концы диаметра.',
  },
  {
    question: 'Чему равна диагональ куба с ребром $a$?',
    options: ['$a\\sqrt3$', '$a\\sqrt2$', '$3a$'],
    correct: 0,
  },
];

/** Подсказки к параллелепипеду, описанному около сферы. */
const HINTS_OKOLO_SFERY: HintLike[] = [
  {
    question: 'Каким должен быть параллелепипед, чтобы сфера касалась всех граней?',
    options: ['Кубом с ребром, равным диаметру', 'Любым', 'Кубом с ребром, равным радиусу'],
    correct: 0,
  },
  {
    question: 'Из чего складывается поверхность куба?',
    options: ['Из шести равных квадратов', 'Из четырёх квадратов', 'Из двух квадратов'],
    correct: 0,
  },
];

/** Подсказки к части параллелепипеда: пирамида или тетраэдр. */
const HINTS_CHAST_PARALLELEPIPEDA: HintLike[] = [
  {
    question: 'Какое тело задают перечисленные вершины?',
    options: ['Пирамиду', 'Призму', 'Половину параллелепипеда'],
    correct: 0,
    comment: 'Все вершины, кроме одной, лежат в одной плоскости — это основание.',
  },
  {
    question: 'По какой формуле считается объём пирамиды?',
    options: ['$V=\\dfrac13 S h$', '$V=S h$', '$V=\\dfrac12 S h$'],
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

/**
 * Задача №6: условие и разбор — генератора раздела. `proto` — id
 * прототипа банка или свой шаблон (zadanie6/prototypes/povyshennye).
 */
function z06(proto: string | Proto6, p: Params6, klyuch: string): Gotovaya {
  const pr = typeof proto === 'string' ? prototype6(proto) : proto;
  const u = pr.uslovie(p);
  return bezPoley(
    build06(
      {
        ...kand,
        prototypeId: pr.id,
        z: {
          id: klyuch,
          prototypeId: pr.id,
          source: 'analog',
          text: u.text,
          ...(u.posle === undefined ? {} : { posle: u.posle }),
          params: p,
        },
      },
      pr,
    ),
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

/** Подсказки к частному логарифмов со степенями в основаниях и числах. */
function hints08Chastnoe(p: {
  a: number;
  i: number;
  b: number;
  j: number;
  k: number;
  l: number;
}): HintLike[] {
  const L = `\\log_{${p.a}} ${p.b}`;
  return [
    {
      question: `Степенями каких чисел являются $${p.a ** p.i}$, $${p.b ** p.j}$, $${p.a ** p.k}$, $${p.b ** p.l}$?`,
      options: [`$${p.a}$ и $${p.b}$`, `$${p.a ** p.i}$ и $${p.b ** p.j}$`, '$10$'],
      correct: 0,
    },
    {
      question: `Чему равен $\\log_{${p.a ** p.i}} ${p.b ** p.j}$?`,
      options: [
        `$\\dfrac{${p.j}}{${p.i}}${L}$`,
        `$\\dfrac{${p.i}}{${p.j}}${L}$`,
        `$${p.i * p.j}${L}$`,
      ],
      correct: 0,
      comment: '$\\log_{a^i} b^j=\\dfrac{j}{i}\\log_a b$.',
    },
    {
      question: 'Что происходит с $' + L + '$ при делении?',
      options: ['Сокращается', 'Остаётся множителем', 'Возводится в квадрат'],
      correct: 0,
    },
  ];
}

/** Подсказки к выражению с формулами приведения: по значению каждого множителя. */
function hints08Trig(p: TrigPrivedenie): HintLike[] {
  const vse: TrigUgol[] = [...p.f, p.g];
  return vse.map((u) => {
    const tex = trigCepochka(u).tex.split('=');
    const verno = tex[tex.length - 1] as string;
    const protiv = verno.startsWith('-') ? verno.slice(1) : `-${verno}`;
    /* Чужое табличное значение: синус вместо косинуса и наоборот. */
    const drugoe = trigCepochka([
      u[0] === 'tg' ? 'sin' : u[0] === 'sin' ? 'cos' : 'sin',
      u[1],
      u[2],
    ])
      .tex.split('=')
      .pop() as string;
    const options = [...new Set([`$${verno}$`, `$${protiv}$`, `$${drugoe}$`])];
    return {
      question: `Чему равен $${fnTex(u[0])}${u[1] < 0 ? `\\left(${radTex(u[1], u[2])}\\right)` : radTex(u[1], u[2])}$?`,
      options,
      correct: 0,
      comment: `$${trigCepochka(u).tex}$.`,
    };
  });
}

/** Подсказки к log_a(aᵐbⁿ) и log_a(aᵐ/bⁿ). */
function hints08AmBn(p: LogAmBn): HintLike[] {
  const z = p.op === 'umn' ? '+' : '-';
  const nz = p.op === 'umn' ? '-' : '+';
  return [
    {
      question: `Как разложить логарифм ${p.op === 'umn' ? 'произведения' : 'частного'}?`,
      options: [
        `$${p.m}${z}${p.n}\\log_a b$`,
        `$${p.m}${nz}${p.n}\\log_a b$`,
        `$${p.m}\\cdot${p.n}\\log_a b$`,
      ],
      correct: 0,
    },
    ...(p.dano === 'ba'
      ? [
          {
            question: `Как найти $\\log_a b$, если $\\log_b a=${p.t}$?`,
            options: [`$\\dfrac{1}{${p.t}}$`, `$${-p.t}$`, `$${p.t}$`],
            correct: 0,
            comment: '$\\log_a b\\cdot\\log_b a=1$.',
          },
        ]
      : []),
  ];
}

/** Подсказки к √A·cos²α − √A·sin²α (или √(4A)·cos²α − √A). */
function hints08CosDvoynogo(p: CosDvoynogo): HintLike[] {
  return [
    p.vid === 'raznost'
      ? {
          question: 'Какой формулой свернуть $\\cos^2\\alpha-\\sin^2\\alpha$?',
          options: ['$\\cos2\\alpha$', '$\\sin2\\alpha$', '$1$'],
          correct: 0,
        }
      : {
          question: `Чему равен $\\sqrt{${4 * p.A}}$?`,
          options: [`$2\\sqrt{${p.A}}$`, `$4\\sqrt{${p.A}}$`, `$\\sqrt{${2 * p.A}}$`],
          correct: 0,
          comment: 'После этого в скобках остаётся $2\\cos^2\\alpha-1=\\cos2\\alpha$.',
        },
    {
      question: 'В какой четверти лежит угол $2\\alpha$ после отбрасывания периодов?',
      options: ['Найдите его формулами приведения', 'Знак не важен', 'Всегда в первой'],
      correct: 0,
      comment: `$2\\alpha=${radTex(2 * p.n, p.den)}$.`,
    },
  ];
}

/** Подсказки к a^(n + log_a b). */
function hints08StepenSLog(p: { a: number; n: number; b: number }): HintLike[] {
  return [
    {
      question: 'Как разложить степень с суммой в показателе?',
      options: [
        `$${p.a}^{${p.n}}\\cdot ${p.a}^{\\log_{${p.a}} ${p.b}}$`,
        `$${p.a}^{${p.n}}+${p.a}^{\\log_{${p.a}} ${p.b}}$`,
        `$${p.a}^{${p.n}\\cdot\\log_{${p.a}} ${p.b}}$`,
      ],
      correct: 0,
    },
    {
      question: `Чему равно $${p.a}^{\\log_{${p.a}} ${p.b}}$?`,
      options: [`$${p.b}$`, `$${p.a}$`, `$\\log_{${p.a}} ${p.b}$`],
      correct: 0,
      comment: 'Основное логарифмическое тождество: $a^{\\log_a b}=b$.',
    },
  ];
}

/** Подсказки к tg α по синусу или косинусу и четверти. */
function hints08Tg(p: TgPoZnacheniyu): HintLike[] {
  const drug = p.f === 'cos' ? '\\sin' : '\\cos';
  return [
    {
      question: `Как найти $${drug}^2\\alpha$?`,
      options: [
        `$1-\\${p.f}^2\\alpha$`,
        `$\\${p.f}^2\\alpha-1$`,
        `$1+\\${p.f}^2\\alpha$`,
      ],
      correct: 0,
      comment: 'Основное тождество: $\\sin^2\\alpha+\\cos^2\\alpha=1$.',
    },
    {
      question: 'Какой знак у тангенса в этой четверти?',
      options:
        p.q === 1 || p.q === 3
          ? ['Плюс', 'Минус', 'Зависит от значения']
          : ['Минус', 'Плюс', 'Зависит от значения'],
      correct: 0,
      comment: 'Тангенс положителен, когда синус и косинус одного знака.',
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

/** То же для прототипа раздела «Варианты повышенной сложности» (не из реестра №10). */
function z10s(proto: Proto10, p: Params10 & { tekst: string }, klyuch: string): Gotovaya {
  const { tekst, ...params } = p;
  return bezPoley(
    build10(
      {
        ...kand,
        prototypeId: proto.id,
        z: { id: klyuch, prototypeId: proto.id, source: 'analog', text: tekst, params },
      },
      sChistymResheniem(proto),
    ),
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
  'z01.trapeciya-radius': {
    ege: 1,
    prototip:
      'Планиметрия, блок VII: прямоугольная трапеция, описанная около окружности, — периметр и большая боковая сторона → радиус (прототип 43)',
    otkuda: 'razdel',
    zadacha: (p: { per: number; c: number }) => z01(43, p),
  },
  'z01.ravnobedr-osnovanie-cos': {
    ege: 1,
    prototip:
      'Планиметрия, блок V: AC = BC и cos A → основание AB (как прототип 23, где по основанию ищут косинус); подвох — AH лишь половина основания',
    otkuda: 'novyy',
    zadacha: (p: { l: number; c: number }) => z01(105, p),
  },
  'z01.ravnobedr-bok-sin': {
    ege: 1,
    prototip:
      'Планиметрия, блок V: AC = BC, основание AB и sin A → боковая сторона (как прототип 30); подвох — дан синус, нужен косинус',
    otkuda: 'novyy',
    zadacha: (p: { c: number; s: number }) => z01(106, p),
  },
  'z01.bissektrisa-afc': {
    ege: 1,
    prototip:
      'Планиметрия, блок I: равнобедренный с основанием AC, биссектриса AF, угол B → угол AFC (как прототип 9)',
    otkuda: 'novyy',
    zadacha: (p: { b: number }) => z01(107, p),
  },
  'z01.bissektrisa-afb': {
    ege: 1,
    prototip:
      'Планиметрия, блок I: равнобедренный с основанием AC, биссектриса AF, угол B → угол AFB (как прототип 9); подвох — угол, смежный с углом AFC',
    otkuda: 'novyy',
    zadacha: (p: { b: number }) => z01(108, p),
  },
  'z01.parallelogramm-bissektrisa': {
    ege: 1,
    prototip:
      'Планиметрия, блок X: биссектриса тупого угла параллелограмма делит сторону в отношении m : n от острого угла, по периметру — большая сторона (как прототип 53)',
    otkuda: 'novyy',
    zadacha: (p: { m: number; n: number; per: number }) => z01(109, p),
  },
  'z01.parallelogramm-dve-bissektrisy': {
    ege: 1,
    prototip:
      'Планиметрия, блок X: биссектрисы углов при одной стороне параллелограмма пересекаются на противоположной стороне — сторона по периметру (как прототип 53)',
    otkuda: 'novyy',
    zadacha: (p: { per: number; k: number }) => z01(110, p),
  },
  'z01.ravnobedr-vysota-sin': {
    ege: 1,
    prototip:
      'Планиметрия, блок V: AB = BC, основание AC и высота к боковой стороне → синус угла при основании (прототип 31)',
    otkuda: 'razdel',
    zadacha: (p: { a: number; h: number; k: number }) => z01(31, p),
  },
  'z01.ravnobedr-vysota-cos': {
    ege: 1,
    prototip:
      'Планиметрия, блок V: AB = BC, основание AC и высота AH = k√m к боковой стороне → косинус угла при основании (как прототип 31, где спрашивают синус)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; h: number; m: number }) => z01(111, p),
  },
  'z01.vpisannyy-dva-ugla': {
    ege: 1,
    prototip:
      'Планиметрия, блок VIII: два угла вписанного четырёхугольника → больший или меньший из оставшихся (прототип 48)',
    otkuda: 'razdel',
    zadacha: (p: { a: number; b: number; k: number }) => z01(48, p),
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
  'z02.skalyar-po-risunku': {
    ege: 2,
    prototip:
      'Векторы, группа B: скалярное произведение k·a и b по рисунку на клетчатой плоскости (как B9, где множитель 2), множитель — и дробный',
    otkuda: 'novyy',
    zadacha: (p: SkalyarnoePoRisunku) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, skalyarnoePoRisunku(p))),
  },
  'z02.kosinus-km': {
    ege: 2,
    prototip: 'Векторы, группа C: косинус угла между векторами по координатам (C1)',
    otkuda: 'novyy',
    zadacha: (p: KosinusVektorov) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, kosinusPoKoordinatam(p))),
  },
  'z02.kosinus-po-risunku': {
    ege: 2,
    prototip:
      'Векторы, группа C: косинус угла между векторами по рисунку на клетчатой плоскости (C2), длинный вектор — окно шире',
    otkuda: 'novyy',
    zadacha: (p: KosinusVektorov) =>
      bezPoley(build02({ ...kand, seed: 'pv', n: null }, kosinusPoRisunku(p))),
  },
  'z02.dlina-km': {
    ege: 2,
    prototip:
      'Векторы, группа A: длина k·a − m·b по координатам (как A3), разность с целыми множителями',
    otkuda: 'novyy',
    zadacha: (p: DlinaKM) => bezPoley(build02({ ...kand, seed: 'pv', n: null }, dlinaKM(p))),
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
  'z03.prizma-gipotenuza': {
    ege: 3,
    prototip:
      'Стереометрия, раздел II: прямая призма над прямоугольным треугольником, катеты k√q, боковое ребро — гипотенуза; полная поверхность (как P03-20, где спрашивают объём)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; b: number; q: number }) =>
      z03(P03_20S, p, HINTS_PRIZMA_GIPOTENUZA, `z03g|${p.a}|${p.b}|${p.q}`),
  },
  'z03.prizma-bez-piramidy': {
    ege: 3,
    prototip:
      'Стереометрия, раздел II: от треугольной (наклонной) призмы плоскостью через сторону основания и вершину другого основания отсечена пирамида — объём остатка (как P03-28)',
    otkuda: 'novyy',
    zadacha: (p: { V: number }) => z03(P03_28S, p, HINTS_PRIZMA_PIRAMIDA, `z03o|${p.V}`),
  },
  'z03.piramida-delit-rebro': {
    ege: 3,
    prototip:
      'Стереометрия, раздел III: плоскость через сторону основания делит боковое ребро m : n от вершины — меньшая часть пирамиды (как P03-48)',
    otkuda: 'novyy',
    zadacha: (p: { V: number; m: number; n: number }) =>
      z03(P03_48S, p, HINTS_PIRAMIDA_DELIT, `z03d|${p.V}|${p.m}|${p.n}`),
  },
  'z03.dva-cilindra-vyshe': {
    ege: 3,
    prototip:
      'Стереометрия, раздел V: два цилиндра, у второго высота в a раз больше, радиус в b раз меньше — объём второго (как P03-69, где наоборот)',
    otkuda: 'novyy',
    zadacha: (p: { V: number; a: number; b: number }) =>
      z03(P03_69S, p, HINTS_DVA_CILINDRA, `z03v|${p.V}|${p.a}|${p.b}`),
  },
  'z03.dve-kruzhki': {
    ege: 3,
    prototip: 'Стереометрия, раздел V: две кружки — отношение объёмов (P03-70)',
    otkuda: 'razdel',
    zadacha: (p: { hk: number; wk: number; style: string }) =>
      z03(PV03_KRUZHKI, p, HINTS_KRUZHKI, `z03m|${p.hk}|${p.wk}`),
  },
  'z03.konus-bokovaya': {
    ege: 3,
    prototip:
      'Стереометрия, раздел VII: во сколько раз меняется боковая поверхность конуса, если радиус и образующая меняются в данное число раз',
    otkuda: 'novyy',
    zadacha: (p: { r: number; rv: number; l: number; lv: number }) =>
      z03(PV03_KONUS_BOKOVAYA, p, HINTS_KONUS_BOKOVAYA, `z03kb|${p.r}|${p.rv}|${p.l}|${p.lv}`),
  },
  'z03.kub-v-share': {
    ege: 3,
    prototip:
      'Стереометрия, раздел VIII: объём куба, вписанного в шар радиуса k√3 (как P03-82, где шар вписан в куб)',
    otkuda: 'novyy',
    zadacha: (p: { k: number }) => z03(PV03_KUB_V_SHARE, p, HINTS_KUB_V_SHARE, `z03ks|${p.k}`),
  },
  'z03.okolo-sfery-poverhnost': {
    ege: 3,
    prototip:
      'Стереометрия, раздел VIII: площадь поверхности прямоугольного параллелепипеда, описанного около сферы (как P03-83, где спрашивают объём)',
    otkuda: 'novyy',
    zadacha: (p: { r: number }) =>
      z03(PV03_PARALLELEPIPED_OKOLO_SFERY, p, HINTS_OKOLO_SFERY, `z03os|${p.r}`),
  },
  'z03.piramida-v-parallelepipede': {
    ege: 3,
    prototip:
      'Стереометрия, раздел I: объём многогранника A, B, C, A₁, B₁ в прямоугольном параллелепипеде (как P03-18, где призма правильная)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; b: number; c: number }) =>
      z03(PV03_PIRAMIDA_ABCA1B1, p, HINTS_CHAST_PARALLELEPIPEDA, `z03pp|${p.a}|${p.b}|${p.c}`),
  },
  'z03.tetraedr-v-parallelepipede': {
    ege: 3,
    prototip:
      'Стереометрия, раздел I: объём тетраэдра A, B, C, B₁ в прямоугольном параллелепипеде (P03-19)',
    otkuda: 'novyy',
    zadacha: (p: { a: number; b: number; c: number }) =>
      z03(PV03_TETRAEDR_ABCB1, p, HINTS_CHAST_PARALLELEPIPEDA, `z03tp|${p.a}|${p.b}|${p.c}`),
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
  'z04.chastota': {
    ege: 4,
    prototip:
      'Вероятность, статистическое определение: на сколько частота «из N проданных в ремонт попали k» меньше (больше) данной вероятности',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_CHASTOTA, p),
  },
  'z04.sootechestvennik': {
    ege: 4,
    prototip:
      'Вероятность, классическое определение: жребий порядка старта, следующим — спортсмен той же страны, (m − 1)/(n − 1)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_SOOTECHESTVENNIK, p),
  },
  'z04.bez-defekta': {
    ege: 4,
    prototip: 'Вероятность, блок II: сумка без дефекта, «k из N с дефектом»',
    otkuda: 'razdel',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_SUMKI, p),
  },
  'z04.ne-podtekaet': {
    ege: 4,
    prototip: 'Вероятность, блок II: исправный насос, «из N подтекают k»',
    otkuda: 'razdel',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_NASOSY, p),
  },
  'z04.pary': {
    ege: 4,
    prototip:
      'Вероятность, классическое определение: пары первого тура по жребию, соперник — соотечественник, (m − 1)/(n − 1)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_PARY, p),
  },
  'z04.tri-tsveta': {
    ege: 4,
    prototip:
      'Вероятность: три цвета, даны P(X или Y) и P(Z или Y) — найти P(Y) = p₁ + p₂ − 1 (как p5-13, сложение)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_TRI_TSVETA, p),
  },
  'z04.taksi': {
    ege: 4,
    prototip:
      'Вероятность, классическое определение: машины двух раскрасок, дано число первых — спрашивают о вторых',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(4, PV4_TAKSI, p),
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
  'z05.dve-misheni': {
    ege: 5,
    prototip:
      'Вероятность: две мишени, три выстрела — «2 + 1» или «1 + 2», выбрать способ с большей вероятностью поразить обе (как p5-07)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_DVE_MISHENI, p),
  },
  'z05.odin-tsvet': {
    ege: 5,
    prototip:
      'Вероятность: по одному предмету из двух ящиков — одного цвета, два пути по дереву (как p5-09)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_ODIN_TSVET, p),
  },
  'z05.oba-zakonchilis': {
    ege: 5,
    prototip:
      'Вероятность: два автомата, дано «останется в обоих» — найти «закончится в обоих» (обратная к p5-04)',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_OBA_ZAKONCHILIS, p),
  },
  'z05.odna-gruppa': {
    ege: 5,
    prototip:
      'Вероятность: n человек делят на две равные группы — трое друзей в одной, произведение условных вероятностей',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_ODNA_GRUPPA, p),
  },
  'z05.hotya-by-dve': {
    ege: 5,
    prototip:
      'Вероятность: три равные группы — хотя бы двое из трёх в одной, через «все в разных», до сотых',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_HOTYA_BY_DVE, p),
  },
  'z05.summa-ochkov': {
    ege: 5,
    prototip:
      'Условная вероятность: сумма очков в какой-то момент равна s — ровно k бросков, веса (1/6)ʲ, до сотых',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_SUMMA_OCHKOV, p),
  },
  'z05.bernulli': {
    ege: 5,
    prototip: 'Независимые испытания: ровно k попаданий из n выстрелов, C(n, k)·pᵏ·(1 − p)ⁿ⁻ᵏ, до сотых',
    otkuda: 'novyy',
    zadacha: (p: ParamsVer) => veroyatnost(5, PV5_BERNULLI, p),
  },
  'z06.chastoty': {
    ege: 6,
    prototip: 'Случайные величины, группа III: частоты «из 100 покупателей» → ожидание (P08)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P08', p, klyuch),
  },
  'z06.lotereya': {
    ege: 6,
    prototip: 'Случайные величины, группа III: лотерея — ожидание выигрыша на один билет (P04)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P04', p, klyuch),
  },
  'z06.ozhidanie': {
    ege: 6,
    prototip:
      'Случайные величины, группа III: математическое ожидание по распределению записью X ∼ (…) (P07)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P07', p, klyuch),
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
  'z06.strahovka-tys': {
    ege: 6,
    prototip:
      'Случайные величины, группа III: цена полиса по ожидаемому доходу (как P09), суммы в тысячах рублей — ответ дробный',
    otkuda: 'novyy',
    zadacha: (p: Params6, klyuch: string) => z06(PV6_STRAHOVKA_TYS, p, klyuch),
  },
  'z06.promezhutok': {
    ege: 6,
    prototip: 'Случайные величины, группа IV: вероятность попадания в промежуток (P11)',
    otkuda: 'razdel',
    zadacha: (p: Params6, klyuch: string) => z06('P11', p, klyuch),
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
  'z07.kub-obratnoe': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа I: куб выражения 1/x + c равен кубу числа (как П-02, нечётная степень), затем обратное число',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_KUB_OBRATNOE),
  },
  'z07.koren-x2': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа II: √(ax² − b) = x², меньший корень — отрицательный, не посторонний (как П-13)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_KOREN_KVADRAT),
  },
  'z07.koren-smeshannoe': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа II: √(kx) = cx, c — смешанное число, корень x = 0 и больший корень (как П-13 и П-03)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_KOREN_LINEYNYY),
  },
  'z07.nechetnaya-stepen': {
    ege: 7,
    prototip: 'Простейшие уравнения, группа I: нечётная степень линейного выражения (П-02)',
    otkuda: 'razdel',
    zadacha: (p: Params7) => z07(p, prototype7('P02')),
  },
  'z07.pokazatelnoe-osnovaniya': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа III: основания — разные степени одного числа, показатели линейные с обеих сторон (как П-17)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_POKAZATELNOE),
  },
  'z07.log-kvadratnoe': {
    ege: 7,
    prototip:
      'Простейшие уравнения, группа IV: 1 + logₐ(px + q) = 2·logₐ(x + e) — квадратное уравнение, отбор по ОДЗ, «меньший корень» (как П-30)',
    otkuda: 'novyy',
    zadacha: (p: Params7) => z07(p, PV7_LOG_KVADRATNOE),
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
  'z08.log-chastnoe-stepeney': {
    ege: 8,
    prototip:
      'Вычисления, логарифмы (как 8.J «same-arg»): частное логарифмов, основания — степени a, числа — степени b',
    otkuda: 'novyy',
    zadacha: (p: { a: number; i: number; b: number; j: number; k: number; l: number }) =>
      z08(
        logChastnoeStepeney(p),
        hints08Chastnoe(p),
        `z08l|${p.a}|${p.i}|${p.b}|${p.j}|${p.k}|${p.l}`,
      ),
  },
  'z08.trig-privedenie': {
    ege: 8,
    prototip:
      'Вычисления, тригонометрия: произведение и частное значений в углах больше периода и отрицательных — формулы приведения и знаки',
    otkuda: 'novyy',
    zadacha: (p: TrigPrivedenie) =>
      z08(trigPrivedenie(p), hints08Trig(p), `z08t|${JSON.stringify(p)}`),
  },
  'z08.log-am-bn': {
    ege: 8,
    prototip:
      'Вычисления, логарифмы с буквами (как 8.Z «given»): log_a(aᵐbⁿ) или log_a(aᵐ/bⁿ) при данном log_a b или log_b a',
    otkuda: 'novyy',
    zadacha: (p: LogAmBn) =>
      z08(logAmBn(p), hints08AmBn(p), `z08a|${p.m}|${p.n}|${p.op}|${p.dano}|${p.t}`),
  },
  'z08.cos-dvoynoy': {
    ege: 8,
    prototip:
      'Вычисления, тригонометрия: √A·cos²α − √A·sin²α или √(4A)·cos²α − √A — косинус двойного угла и формулы приведения',
    otkuda: 'novyy',
    zadacha: (p: CosDvoynogo) =>
      z08(cosDvoynogo(p), hints08CosDvoynogo(p), `z08c|${p.vid}|${p.A}|${p.n}|${p.den}`),
  },
  'z08.stepen-s-log': {
    ege: 8,
    prototip:
      'Вычисления, логарифмы: aⁿ⁺ˡᵒᵍₐ ᵇ — произведение степеней и основное логарифмическое тождество',
    otkuda: 'novyy',
    zadacha: (p: { a: number; n: number; b: number }) =>
      z08(stepenSLog(p), hints08StepenSLog(p), `z08s|${p.a}|${p.n}|${p.b}`),
  },
  'z08.tg-po-znacheniyu': {
    ege: 8,
    prototip:
      'Вычисления, тригонометрия: tg α по cos α или sin α с корнем и четверти угла — основное тождество и знак',
    otkuda: 'novyy',
    zadacha: (p: TgPoZnacheniyu) =>
      z08(tgPoZnacheniyu(p), hints08Tg(p), `z08t|${p.f}|${p.a}|${p.r}|${p.b}|${p.s}|${p.q}`),
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
  'z09.kasatelnaya': {
    ege: 9,
    prototip:
      'Производная, группа II: f′(x₀) по графику f и касательной через узлы сетки (как 9.2.1), своя кривая',
    otkuda: 'novyy',
    zadacha: (p: KasatelnayaPoUzlam) => z09(kasatelnayaPoUzlam(p), p),
  },
  'z09.znak-v-tochkah': {
    ege: 9,
    prototip:
      'Производная, группа III: сколько из 13 отмеченных точек, где f′ > 0 или f′ < 0 (как 9.3.1/9.3.2), точки у вершин',
    otkuda: 'novyy',
    zadacha: (p: ZnakVTochkah) => z09(znakVTochkah(p), p),
  },
  'z09.kasatelnaya-nachalo': {
    ege: 9,
    prototip:
      'Производная, группа II: касательная через начало координат в точке с абсциссой x₀ — f′(x₀) = f(x₀)/x₀, касательной на рисунке нет',
    otkuda: 'novyy',
    zadacha: (p: KasatelnayaNachalo) => z09(kasatelnayaCherezNachalo(p), p),
  },
  'z09.naib-naim-metka': {
    ege: 9,
    prototip:
      'Производная, группа II: в какой из отмеченных точек производная наибольшая (наименьшая) по графику f (как 9.2.5 / 9.2.6), своя кривая',
    otkuda: 'novyy',
    zadacha: (p: NaibNaimMetka) => z09(naibNaimMetka(p), p),
  },
  'z09.skorost-mnogochlen': {
    ege: 9,
    prototip:
      'Производная, группа I: скорость в момент t₀ по закону движения — многочлену 3-й или 4-й степени с дробными коэффициентами (как 9.1.1)',
    otkuda: 'novyy',
    zadacha: (p: SkorostMnogochlen) => z09(skorostMnogochlen(p), p),
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
  'z10.linza': {
    ege: 10,
    prototip: 'Прикладные, группа I: собирающая линза, наименьшее расстояние до лампочки (P07)',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P07', p, klyuch),
  },
  'z10.linza-max': {
    ege: 10,
    prototip:
      'Прикладные, группа I: собирающая линза, наибольшее расстояние до лампочки — при наименьшем d₂ (как P07)',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(PV10_LINZA_MAX, p, klyuch),
  },
  'z10.dolya-vremeni': {
    ege: 10,
    prototip:
      'Прикладные, группа V: v = A·sin(πt/T), доля первых τ секунд, когда v ≤ c (как P34, вторая дуга синуса за τ не наступает)',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(PV10_DOLYA, p, klyuch),
  },
  'z10.raspad': {
    ege: 10,
    prototip: 'Прикладные, группа IV: радиоактивный распад m = m₀·2^(−t/T), время (P22)',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P22', p, klyuch),
  },
  'z10.gorizont': {
    ege: 10,
    prototip:
      'Прикладные, группа III: дальность горизонта l = √(2Rh) — на сколько метров подняться, чтобы горизонт отодвинулся (как P19)',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(PV10_GORIZONT, p, klyuch),
  },
  'z10.pruzhina': {
    ege: 10,
    prototip: 'Прикладные, группа V: груз на пружине, кинетическая энергия в момент t (P27)',
    otkuda: 'razdel',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10('P27', p, klyuch),
  },
  'z10.kpd': {
    ege: 10,
    prototip:
      'Прикладные, группа I: КПД теплового двигателя η = (T₁ − T₂)/T₁·100 % — температура нагревателя',
    otkuda: 'novyy',
    zadacha: (p: Params10 & { tekst: string }, klyuch: string) => z10s(PV10_KPD, p, klyuch),
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
  'z11.tri-rastvora': {
    ege: 11,
    prototip:
      'Текстовые, смеси: два раствора с неизвестными массами и добавка m₁ или m₂ кг третьего — масса одного из растворов (как СМ-08, у смесей разная масса)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PV11-TRI-RASTVORA', p, klyuch, triRastvora),
  },
  'z11.suhogruzy': {
    ege: 11,
    prototip:
      'Текстовые, протяжённые тела: два судна в одном направлении поменялись местами, разность скоростей (ПТ-04)',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PT-04', p, klyuch, (x) => subtype11('PT-04').solve(x)),
  },
  'z11.ves-put': {
    ege: 11,
    prototip: 'Текстовые, движение по воде: туда и обратно со стоянкой, весь путь за рейс (ВД-01)',
    otkuda: 'razdel',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('VD-01', p, klyuch, (x) => subtype11('VD-01').solve(x)),
  },
  'z11.dve-truby': {
    ege: 11,
    prototip:
      'Текстовые, работа: две одинаковые трубы, вторая подключается позже — всё время наполнения (как РБ, таблица A | p | t)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PV11-DVE-TRUBY', p, klyuch, dveTruby),
  },
  'z11.rastvor-i-voda': {
    ege: 11,
    prototip:
      'Текстовые, смеси: два раствора дали p₁ %, после добавления воды — p₂ %; масса одного из растворов (как СМ)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PV11-RASTVOR-VODA', p, klyuch, rastvorIVoda),
  },
  'z11.avtobus-avtomobil': {
    ege: 11,
    prototip:
      'Текстовые, движение: автомобиль догоняет автобус и возвращается, когда автобус прибывает — расстояние до встречи, квадратное уравнение (как ДП)',
    otkuda: 'novyy',
    zadacha: (p: Params11 & { tekst: string }, klyuch: string) =>
      z11('PV11-AVTOBUS', p, klyuch, avtobusIAvtomobil),
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
  'z12.parabola-b': {
    ege: 12,
    prototip:
      'Графики, парабола: f(x) = ax² + bx + c, b дано, c и a по узлам сетки, значение f(x₀) за рамкой (как 12Q)',
    otkuda: 'novyy',
    zadacha: (p: ParabolaB) =>
      z12((pe) => parabolaB(p, pe), `z12b|${p.b}|${p.c}|${p.Q.join(';')}|${p.x0}`),
  },
  'z12.pokazatelnaya-otnoshenie': {
    ege: 12,
    prototip:
      'Графики, показательная: f(x) = aˣ через два узла, a иррациональное, отношение f(m)/f(n) (как 12E)',
    otkuda: 'novyy',
    zadacha: (p: PokazatelnayaOtnoshenie) =>
      z12((pe) => pokazatelnayaOtnoshenie(p, pe), `z12e|${p.P.join(';')}|${p.m}|${p.n}`),
  },
  'z12.parabola-korni': {
    ege: 12,
    prototip:
      'Графики, парабола: f(x) = ax² + bx + c через нули и точку на оси Oy, f(x₀) за рамкой (как 12Q, форма через нули)',
    otkuda: 'novyy',
    zadacha: (p: ParabolaKorni) =>
      z12((pe) => parabolaKorni(p, pe), `z12q|${p.x1}|${p.x2}|${p.c}|${p.x0}`),
  },
  'z12.giperbola-kb': {
    ege: 12,
    prototip:
      'Графики, гипербола: f(x) = k/x + b через два узла, асимптота не по оси, f(x₀) за рамкой (как 12R)',
    otkuda: 'novyy',
    zadacha: (p: GiperbolaKB) =>
      z12((pe) => giperbolaKB(p, pe), `z12kb|${p.A.join(';')}|${p.B.join(';')}|${p.x0}`),
  },
  'z12.koren-pryamaya': {
    ege: 12,
    prototip:
      'Графики: прямая kx + b и p√x пересекаются в начале координат и в точке вне рисунка (как 12S)',
    otkuda: 'novyy',
    zadacha: (p: KorenPryamaya) =>
      z12((pe) => korenPryamaya(p, pe), `z12kp|${p.G.join(';')}|${p.L.join(';')}`),
  },
  'z12.parabola-pryamaya': {
    ege: 12,
    prototip:
      'Графики: прямая kx + b и парабола ax² + bx + c пересекаются в начале координат и в точке вне рисунка (как 12Q, форма через нули)',
    otkuda: 'novyy',
    zadacha: (p: ParabolaPryamaya) =>
      z12((pe) => parabolaPryamaya(p, pe), `z12pp|${p.r}|${p.Q.join(';')}|${p.L.join(';')}`),
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
  'z13.dif-stavka': {
    ege: 13,
    prototip:
      'Экономика, тип A: годовой дифференцированный, ставка по общей сумме выплат (рамка «июль», переплата S·(n+1)/2·r/100)',
    otkuda: 'novyy',
    zadacha: (p: StavkaPoSumme & Syuzhet13, klyuch: string) => z13(stavkaPoSumme(p), p, klyuch),
  },
  'z13.ravnye-popolneniya': {
    ege: 13,
    prototip:
      'Экономика, тип D (вклады): два одинаковых пополнения за три года, найти пополнение по итоговой сумме (x(k² + k))',
    otkuda: 'novyy',
    zadacha: (p: RavnyePopolneniya & Syuzhet13, klyuch: string) =>
      z13(ravnyePopolneniya(p), p, klyuch),
  },
  'z13.summa-ubyvanie': {
    ege: 13,
    prototip:
      'Экономика, тип B: долг каждый июль меньше на q % прошлогоднего, общая сумма выплат в рублях (рамка «июль»)',
    otkuda: 'novyy',
    zadacha: (p: PosledniyPlatezh & Syuzhet13, klyuch: string) =>
      z13(summaPriUbyvanii(p), p, klyuch),
  },
  'z13.dva-ravnyh-summa': {
    ege: 13,
    prototip:
      'Экономика, тип C: кредит на 2 года двумя равными платежами, общая сумма в рублях (как C-01, рамка «январь»)',
    otkuda: 'novyy',
    zadacha: (p: DvaRavnyhSumma & Syuzhet13, klyuch: string) => z13(dvaRavnyhSumma(p), p, klyuch),
  },
  'z13.dva-ravnyh-stavka': {
    ege: 13,
    prototip:
      'Экономика, тип C: кредит на 2 года двумя равными платежами, ставка — квадратное уравнение относительно k (как C-08)',
    otkuda: 'novyy',
    zadacha: (p: DvaRavnyhStavka & Syuzhet13, klyuch: string) =>
      z13(dvaRavnyhStavka(p), p, klyuch),
  },
  'z13.vklad-nachalnyy': {
    ege: 13,
    prototip:
      'Экономика, тип D (вклады): два одинаковых пополнения за три года, найти первоначальный вклад в сотнях тысяч (обратная к z13.ravnye-popolneniya)',
    otkuda: 'novyy',
    zadacha: (p: VkladNachalnyy & Syuzhet13, klyuch: string) => z13(vkladNachalnyy(p), p, klyuch),
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
