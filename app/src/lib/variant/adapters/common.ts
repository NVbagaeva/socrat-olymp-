/**
 * Общее для адаптеров разделов: выбор из пула по фильтрам, ответ
 * строкой, решения по шагам и разбор для ученика из подсказок.
 *
 * Разметка решений — классы листа (`sheet-steps`, `sheet-step`) и свои
 * классы разбора (`var-razbor*`, lib/variant/variant-sheet.css). Свои
 * рендереры разделов адаптеры не переписывают: где у раздела есть
 * готовая разметка решения, берётся она, здесь — только то, чего у
 * раздела нет (разбор для ученика) и одинаковые мелочи.
 */

import { typeset } from '@/lib/tex';
import type { Fallback, Rng, SourceFilter, Stars, TaskFilters } from '../types';

/* ── Фильтры ────────────────────────────────────────────────────── */

/** Задача годится по источнику. */
export function sourceOk(kind: 'fipi' | 'own', filter: SourceFilter): boolean {
  return filter === 'mix' || filter === kind;
}

/** Задача годится по сложности. Сложность не размечена — годится. */
export function starsOk(stars: Stars | null, filter: readonly Stars[] | null): boolean {
  return filter === null || stars === null || filter.includes(stars);
}

/** Задача годится по подтипу. */
export function subtypeOk(subtype: string, filter: readonly string[] | null): boolean {
  return filter === null || filter.includes(subtype);
}

/**
 * Кандидат пула: всё, что нужно фильтрам, без разметки — разметка
 * считается только у выбранной задачи.
 */
export interface Candidate {
  taskId: string;
  prototypeId: string;
  subtype: string;
  source: 'fipi' | 'own';
  stars: Stars | null;
}

/**
 * Случайный кандидат по фильтрам. «Вперемешку» сначала бросает
 * монетку между банком и своими, чтобы большой пул аналогов не
 * задавил открытый банк.
 */
export function pickCandidate<C extends Candidate>(
  pool: readonly C[],
  filters: TaskFilters,
  rng: Rng,
): C | null {
  const ok = pool.filter(
    (c) =>
      !filters.exclude.has(c.taskId) &&
      (filters.prototype === undefined || c.prototypeId === filters.prototype) &&
      subtypeOk(c.subtype, filters.subtypes) &&
      starsOk(c.stars, filters.stars) &&
      sourceOk(c.source, filters.source),
  );
  if (ok.length === 0) return null;
  if (filters.source === 'mix') {
    const fipi = ok.filter((c) => c.source === 'fipi');
    const own = ok.filter((c) => c.source === 'own');
    if (fipi.length > 0 && own.length > 0) {
      return rng.pick(rng.next() < 0.5 ? fipi : own);
    }
  }
  return rng.pick(ok);
}

/* ── Ответ ──────────────────────────────────────────────────────── */

/** Число для бланка: 2.25 → «2,25», −3 → «−3». */
export function answerText(x: number): string {
  const s = String(Math.round(x * 1e9) / 1e9).replace('.', ',');
  return s.startsWith('-') ? `−${s.slice(1)}` : s;
}

/** Ответ, набранный KaTeX. */
export function answerHtml(x: number | string): string {
  const s = typeof x === 'number' ? answerText(x) : x;
  if (!/^[-−]?\d+(?:[,.]\d+)?$/.test(s)) return typeset(s);
  return typeset(`$${s.replace('−', '-').replace(/[,.]/, '{,}')}$`);
}

/* ── Решения ────────────────────────────────────────────────────── */

export interface StepLike {
  title: string;
  lines: readonly string[];
}

/** Строки «Ответ: …» в шагах не печатаются: ответ стоит отдельно. */
const OTVET = /^\s*\*{0,2}Ответ:/;

/** Решение учителя по шагам: подпись этапа и выкладки ($…$). */
export function teacherStepsHtml(steps: readonly StepLike[]): string {
  const items = steps
    .map((s) => {
      const lines = s.lines.filter((l) => !OTVET.test(l));
      if (lines.length === 0 && s.title === '') return '';
      const title = s.title === '' ? '' : `<b>${typeset(s.title)}.</b> `;
      return `<li class="sheet-step">${title}${lines.map((l) => typeset(l)).join(' ')}</li>`;
    })
    .join('');
  return `<ol class="sheet-steps">${items}</ol>`;
}

/** Подсказка-вопрос раздела: вопрос, варианты, верный, комментарий. */
export interface HintLike {
  question: string;
  options: readonly string[];
  correct: number;
  comment?: string;
}

/**
 * Разбор для ученика из цепочки подсказок: каждый вопрос — «что
 * делаем и зачем», верный вариант — ответ на него, комментарий —
 * пояснение. Затем выкладки шагов решения учителя: формулы KaTeX.
 */
export function studentFromHints(hints: readonly HintLike[], steps: readonly StepLike[]): string {
  const think = hints
    .map((h, i) => {
      const answer = h.options[h.correct] ?? '';
      const comment =
        h.comment === undefined || h.comment === ''
          ? ''
          : `<p class="var-razbor__why">${typeset(h.comment)}</p>`;
      return (
        `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${i + 1}</span>${typeset(h.question)}</p>` +
        `<p class="var-razbor__a">${typeset(answer)}</p>${comment}</li>`
      );
    })
    .join('');
  const calc = studentFromSteps(steps);
  return (
    (think === ''
      ? ''
      : `<p class="var-razbor__h">Рассуждаем</p><ol class="var-razbor">${think}</ol>`) + calc
  );
}

/**
 * Разбор для ученика из шагов решения: подпись шага — что делаем,
 * строки — пояснения и формулы. Запасной вариант для разделов без
 * ученического разбора.
 */
export function studentFromSteps(steps: readonly StepLike[]): string {
  const items = steps
    .map((s, i) => {
      const lines = s.lines.filter((l) => !OTVET.test(l));
      if (lines.length === 0 && s.title === '') return '';
      return (
        `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${i + 1}</span>${typeset(s.title)}</p>` +
        lines.map((l) => `<p class="var-razbor__line">${typeset(l)}</p>`).join('') +
        `</li>`
      );
    })
    .join('');
  return items === ''
    ? ''
    : `<p class="var-razbor__h">Решаем</p><ol class="var-razbor">${items}</ol>`;
}

/** Строка ответа в конце разбора. */
export function razborAnswer(html: string): string {
  return `<p class="var-razbor__answer"><b>Ответ:</b> ${html}</p>`;
}

/* ── Пометки ────────────────────────────────────────────────────── */

export const FALLBACK = {
  studentFromHints: {
    field: 'solutionStudent',
    note: 'Разбор для ученика собран из подсказок-вопросов и шагов решения',
  },
  studentFromTeacher: {
    field: 'solutionStudent',
    note: 'Ученического разбора нет — показаны шаги решения учителя',
  },
  noTeacher: { field: 'solutionTeacher', note: 'У задачи нет решения по шагам — только ответ' },
  noFigure: { field: 'figure', note: 'Рисунок к этой задаче на лист не выводится' },
  noDifficulty: { field: 'difficulty', note: 'Сложность в разделе не размечена' },
  noPrototypeNo: { field: 'source', note: 'Номер прототипа ФИПИ не размечен' },
} as const satisfies Record<string, Fallback>;
