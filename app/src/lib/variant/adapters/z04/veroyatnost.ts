/**
 * Общее у адаптеров заданий №4 и №5: банк прототипов раздела
 * (lib/veroyatnost) в том виде, в каком он едет в браузер, — условие,
 * отпечаток ответа и закрытый разбор (маршруты /variant/dannye/z04.json
 * и z05.json, lib/variant/data/z04.ts). Сами банки (BANK_4, BANK_5) сюда
 * не импортируются: в них формулы ответа и перебор.
 *
 * Разбор открывается отпечатком, как на листе учителя
 * (lib/veroyatnost/sheet4.ts → otkrytRazbor). Решение учителя — шаги
 * разбора разметкой сборников №4 и №5 (`answers.steps`, как в
 * scripts/lib/sheet4-tasks.mjs и sheet5-tasks.mjs); разбор для ученика —
 * разбор тренажёра: метод и шаги словами с формулой.
 *
 * Рисунков нет: на ЕГЭ у №4 и №5 их нет, лист генератора раздела их
 * тоже не печатает. Новых задач раздел не генерирует: варианты прототипа
 * кончились — `null`, и сборщик ослабит фильтр сам.
 */

import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import { typesetText } from '@/lib/tex';
import { texPlain } from '@/lib/veroyatnost/model';
import { openText } from '@/lib/veroyatnost/secret';
import type { SectionAdapter, SectionInfo, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  pickCandidate,
  razborAnswer,
  studentFromSteps,
  type Candidate,
} from '../common';

/* ── Данные ─────────────────────────────────────────────────────── */

/** Вариант прототипа: условие текстом ($…$), отпечаток, закрытый разбор. */
export interface Variant45 {
  n: number;
  uslovie: string;
  /** Отпечаток верного ответа (lib/veroyatnost/secret.ts, sealAnswer). */
  seal: string;
  /** `Razbor45` в JSON, закрытый отпечатком (sealText). */
  razbor: string;
}

export interface Kind45 {
  id: string;
  title: string;
  /** Блок банка — подтип фильтра. */
  blok: string;
  variants: Variant45[];
}

export interface Dannye45 {
  kinds: Kind45[];
}

/**
 * Закрытый разбор: тот же, что у тренажёра (lib/veroyatnost/razbor.ts,
 * `Razbor`), без вёрстки выкладок и без параметров рисунка — генератору
 * они не нужны, а данные без них в двадцать раз легче.
 */
export interface Razbor45 {
  /** Фраза после «Метод:»; пусто — метода нет. */
  metod: string;
  shagi: { etap: string; text: string; tex?: string }[];
  /** Ответ, как его записать: «0,25». */
  otvet: string;
}

/* ── Разметка ───────────────────────────────────────────────────── */

/** Строка ответа, которую answers.steps ставит в конце: ответ стоит отдельно. */
const OTVET_LISTA = /<p class="sheet-task-answer">[\s\S]*?<\/p>\s*$/;

/** Метка формулы из пояснения шага: её не трогают ни экранирование, ни типограф. */
const METKA = /\u0001(\d+)\u0001/g;

/** Формула заглушкой листа: TeX в data-tex, словами — до набора KaTeX. */
function mathSpan(tex: string): string {
  return `<span class="math" data-tex="${typo.attr(tex)}">${typo.escape(texPlain(tex))}</span>`;
}

/**
 * Решение учителя: шаги разбора разметкой сборников №4 и №5. В
 * пояснениях шагов бывают формулы ($k$, $5\times 5$), а answers.steps
 * печатает пояснение текстом — формулы выносятся метками и после
 * встают заглушками `.math`, как формулы самих шагов.
 */
function teacherHtml(r: Razbor45): string {
  const formuly: string[] = [];
  const items = r.shagi.map((s) => ({
    etap: s.etap,
    text: s.text.replace(/\$([^$]+)\$/g, (_m, tex: string) => {
      formuly.push(tex);
      return `\u0001${formuly.length - 1}\u0001`;
    }),
    tex: s.tex,
    plain: s.tex === undefined ? '' : texPlain(s.tex),
  }));
  return String(answers.steps(items, r.otvet))
    .replace(OTVET_LISTA, '')
    .replace(METKA, (_m, i: string) => mathSpan(formuly[Number(i)] ?? ''));
}

/** Разбор для ученика: метод, затем шаги — этап, пояснение, формула. */
function studentHtml(r: Razbor45): string {
  const metod =
    r.metod === ''
      ? ''
      : `<p class="var-razbor__h">Метод</p><p class="var-razbor__why">${typesetText(r.metod)}</p>`;
  return (
    metod +
    studentFromSteps(
      r.shagi.map((s) => ({
        title: s.etap,
        lines: [s.text, ...(s.tex === undefined ? [] : [`$${s.tex}$`])],
      })),
    )
  );
}

/* ── Адаптер ────────────────────────────────────────────────────── */

interface C45 extends Candidate {
  kind: Kind45;
  variant: Variant45;
}

function build(egeNumber: 4 | 5, c: C45): VariantTask {
  const { kind, variant } = c;
  const r = JSON.parse(openText(variant.razbor, variant.seal)) as Razbor45;
  const otvet = answerHtml(r.otvet);
  return {
    egeNumber,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: {
      kind: 'own',
      label: `Своя: прототип ${kind.id} «${kind.title}», вариант ${variant.n}`,
    },
    difficulty: null,
    statement: `<p>${typesetText(variant.uslovie)}</p>`,
    figure: null,
    figureTeacher: null,
    answer: r.otvet.replace('.', ',').replace('-', '−'),
    answerHtml: otvet,
    solutionTeacher: teacherHtml(r) + razborAnswer(otvet),
    solutionStudent: studentHtml(r) + razborAnswer(otvet),
    fallbacks: [FALLBACK.noDifficulty],
    ref: { prototype: kind.id, n: variant.n },
  };
}

/**
 * Адаптер задания по данным маршрута. Блок прототипа, которого нет в
 * подтипах `info`, — ошибка: значит, банк и info.ts разошлись.
 */
export function adapter45(egeNumber: 4 | 5, info: SectionInfo, data: unknown): SectionAdapter {
  const dannye = data as Dannye45;
  const bloki = new Set(info.subtypes.map((s) => s.id));
  const pool: C45[] = dannye.kinds.flatMap((kind) => {
    if (!bloki.has(kind.blok)) {
      throw new Error(`№${egeNumber}: блока ${kind.blok} (прототип ${kind.id}) нет в info.ts`);
    }
    return kind.variants.map((variant) => ({
      taskId: `${kind.id}-${variant.n}`,
      prototypeId: kind.id,
      subtype: kind.blok,
      source: 'own' as const,
      stars: null,
      kind,
      variant,
    }));
  });
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      return c === null ? null : build(egeNumber, c);
    },
  };
}
