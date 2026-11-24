/**
 * Задачи для ДЗ — в браузере учителя тем же генератором, что тренажёр и
 * «Собрать вариант»: те же числа и чертёж, ответ в нормальной записи ЕГЭ,
 * шаги разбора для подсказок (docs/kabinet-dz2.md).
 *
 * Опорные задачи фиксированы: собираются, когда учитель нажал «В домашку»
 * на странице блока. Запас тренажёра собирается при выдаче, при
 * «индивидуальных числах» — у каждого ученика свой.
 */

import { normalnayaZapis, type ZadachaDz } from './model';

/* ── Опорные №8: микрозадача и seed → генератор ─────────────────── */

export interface Prep8 {
  id: string;
  seed: string;
  uslovieHtml: string;
}

export interface Razbor8Html {
  shagi: { chto: string; tex: string }[];
}

export function zadachaOpornaya8(
  t: Prep8,
  otvet: number | string,
  razbor: Razbor8Html | null,
): ZadachaDz | null {
  const answer = normalnayaZapis(String(otvet));
  if (answer === null) return null;
  return {
    kind: t.id,
    task_ref: `${t.id}@${t.seed}`,
    question_html: t.uslovieHtml,
    level: 1,
    answer,
    ...(razbor === null || razbor.shagi.length === 0
      ? {}
      : { razbor: { shagi: razbor.shagi.map((s) => ({ chto: s.chto, tex: s.tex })) } }),
  };
}

/* ── Опорные №4 и №5: задача банка, разбор открыт отпечатком ────── */

export interface Zadacha5 {
  id: string;
  uslovie: string;
  illustration?: { path: string };
}

export interface Razbor5 {
  otvet: string;
  shagi: { text: string; tex?: string }[];
}

/**
 * Набор формул для №5: условие и шаги в банке — текст с $…$ и TeX.
 * В базу ДЗ уходит готовая вёрстка (как у №8 и тренажёра): ученику
 * KaTeX не нужен, он только очищает HTML.
 */
export interface Nabor {
  /** Текст с $…$ → HTML (всё вне формул экранировано). */
  tekst: (s: string) => string;
  /** Формула TeX → HTML KaTeX. */
  formula: (tex: string) => string;
}

/** level — сложность раздела (lib/zhurnal/uroven.ts): №5 — 2, №4 — 1. */
export function zadachaOpornaya5(
  z: Zadacha5,
  r: Razbor5,
  nabor: Nabor,
  level: 1 | 2 | 3 = 2,
): ZadachaDz | null {
  const answer = normalnayaZapis(r.otvet);
  if (answer === null) return null;
  return {
    kind: z.id,
    task_ref: z.id,
    question_html: `<p>${nabor.tekst(z.uslovie)}</p>`,
    ...(z.illustration === undefined ? {} : { risunok: z.illustration.path }),
    level,
    answer,
    razbor: {
      shagi: r.shagi.map((s) => ({
        chto: nabor.tekst(s.text),
        ...(s.tex === undefined ? {} : { tex: nabor.formula(s.tex) }),
      })),
    },
  };
}

/* ── Тренажёр: запас из адаптера «Собрать вариант» ──────────────── */

/** То, что отдаёт адаптер раздела (lib/variant/types.ts, VariantTask). */
export interface ZadachaAdaptera {
  taskId: string;
  prototypeId: string;
  statement: string;
  answer: string;
  solutionStudent: string | null;
  figure?: unknown;
}

/**
 * Запас задач тренажёра: по кругу по выбранным типам, без повторов,
 * пока не наберётся `skolko` или генератор не иссякнет. `vzyat` — обёртка
 * над adapter.getRandomTask с фильтром по прототипу.
 */
export function zapasTrenazhera(
  tipy: readonly string[],
  skolko: number,
  vzyat: (prototip: string, uzhe: ReadonlySet<string>, shag: number) => ZadachaAdaptera | null,
  uroven: (z: ZadachaAdaptera) => 1 | 2 | 3,
): ZadachaDz[] {
  const out: ZadachaDz[] = [];
  const uzhe = new Set<string>();
  let pusto = 0;
  for (let shag = 0; out.length < skolko && pusto < tipy.length * 3 && tipy.length > 0; shag += 1) {
    const prototip = tipy[shag % tipy.length] as string;
    const z = vzyat(prototip, uzhe, shag);
    const answer = z === null ? null : normalnayaZapis(z.answer);
    if (z === null || answer === null || uzhe.has(z.taskId)) {
      pusto += 1;
      continue;
    }
    pusto = 0;
    uzhe.add(z.taskId);
    out.push({
      kind: z.prototypeId,
      task_ref: z.taskId,
      question_html: z.statement,
      level: uroven(z),
      answer,
      ...(z.solutionStudent === null ? {} : { razbor: { shagi: [{ chto: z.solutionStudent }] } }),
    });
  }
  return out;
}
