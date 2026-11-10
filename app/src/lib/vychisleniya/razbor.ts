/**
 * Решение задачи №8 в HTML — одно на тренажёр, лист учителя, сборник
 * PDF и онлайн-вариант.
 *
 * Шаг — подпись «что делаем и почему» и выкладка (types.ts → Shag).
 * Подпись набирается как текст с формулами в $…$, выкладка — формулой.
 * Под решением, если сокращение держится на признаках делимости, —
 * сворачиваемая панель «Признаки делимости».
 */

import { typeset } from '../tex';
import { PRIZNAKI } from './priznaki';
import type { Priznak, Shag } from './types';

/** Шаг, уже набранный KaTeX. */
export interface ShagHtml {
  chto: string;
  tex: string;
}

export interface PriznakHtml {
  title: string;
  html: string;
}

/** Решение, набранное KaTeX: шаги и признаки делимости. */
export interface RazborHtml {
  shagi: ShagHtml[];
  delimost: PriznakHtml[];
}

export function shagHtml(step: Shag): ShagHtml {
  return { chto: typeset(step.chto), tex: typeset(`$${step.tex}$`) };
}

export function priznakiHtml(list: readonly Priznak[] | undefined): PriznakHtml[] {
  return (list ?? []).map((id) => ({ title: PRIZNAKI[id].title, html: typeset(PRIZNAKI[id].text) }));
}

export function razborData(steps: readonly Shag[], delimost?: readonly Priznak[]): RazborHtml {
  return { shagi: steps.map(shagHtml), delimost: priznakiHtml(delimost) };
}

/**
 * Решение для печатного листа учителя и сборника: шаги с подписями
 * (подпись полужирным, выкладка следом) — под ту же CSS, что у №2 и
 * №12. Признаки делимости — строкой под шагами.
 */
export function razborStepsHtml(steps: readonly Shag[], delimost?: readonly Priznak[]): string {
  const items = steps
    .map((step) => {
      const s = shagHtml(step);
      return `<li class="sheet-step"><b>${s.chto}.</b> ${s.tex}</li>`;
    })
    .join('');
  const signs = priznakiHtml(delimost);
  const tail =
    signs.length === 0
      ? ''
      : `<p class="sheet-step-note"><b>Признаки делимости.</b> ${signs
          .map((p) => `${p.title}: ${p.html}`)
          .join(' ')}</p>`;
  return `<ol class="sheet-steps">${items}</ol>${tail}`;
}

/** Решение и строка ответа для листа учителя. */
export function razborSheetHtml(
  steps: readonly Shag[],
  answerText: string,
  delimost?: readonly Priznak[],
): string {
  return `${razborStepsHtml(steps, delimost)}<p class="sheet-task-answer">Ответ: <b>${answerText}</b></p>`;
}

/** Шаги в общем виде листов варианта: подпись и выкладка строкой. */
export function asStepLike(steps: readonly Shag[]): { title: string; lines: string[] }[] {
  return steps.map((step) => ({ title: step.chto, lines: [`$${step.tex}$`] }));
}
