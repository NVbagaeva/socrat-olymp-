/**
 * Лист задания №3 для печати: адрес → набор задач → описание листа.
 *
 * Всё, что определяет лист, — в адресе: раздел, число задач, seed.
 * Один адрес — один и тот же набор: лист ученика и лист учителя по
 * одному адресу печатают одни и те же задачи в том же порядке.
 * Отличаются только чертежом (ученику — без вспомогательных
 * построений, учителю — с ними) и решениями с ответами.
 */

import answers from '@/lib/sheet/answers.js';
import typo from '@/lib/sheet/typography.js';
import { SHEET_3 } from '@/content/sheet3';
import { chertezhSvg } from '../chertezh3';
import type { Scenariy } from '../chertezh3/scenariy';
import { KEGL, SHIRINA, SHIRINA_MM } from '../chertezh3/vid';
import type { ZadachaPechati } from './pechat-dannye';
import { seeded } from './podhod';
import { openText } from './secret';

export type Vid = 'uchenik' | 'uchitel';

export interface ParametryLista {
  n: number;
  seed: number;
  theme: 'color' | 'print';
}

export const ZADACH_MIN = 2;
export const ZADACH_MAX = 12;

export function parametryIz(q: URLSearchParams): ParametryLista {
  const n = Number(q.get('n'));
  const seed = Number.parseInt(q.get('seed') ?? '', 36);
  return {
    n: Number.isFinite(n) && n >= ZADACH_MIN ? Math.min(ZADACH_MAX, Math.floor(n)) : 6,
    seed: Number.isFinite(seed) && seed > 0 ? seed : 1,
    theme: q.get('t') === 'print' ? 'print' : 'color',
  };
}

export function adresLista(p: ParametryLista): string {
  const q = new URLSearchParams({ n: String(p.n), seed: p.seed.toString(36) });
  if (p.theme === 'print') q.set('t', 'print');
  return q.toString();
}

/**
 * Набор задач по seed: прототипы перемешиваются, с каждого берётся
 * один вариант; если задач нужно больше, чем прототипов, круг идёт
 * заново с другими вариантами. Чистая функция — по ней совпадают
 * листы ученика и учителя.
 */
export function vybrat(vse: readonly ZadachaPechati[], p: ParametryLista): ZadachaPechati[] {
  const rnd = seeded(p.seed);
  const poProtot = new Map<string, ZadachaPechati[]>();
  for (const z of vse) poProtot.set(z.prototip, [...(poProtot.get(z.prototip) ?? []), z]);
  const protot = [...poProtot.keys()];
  for (let i = protot.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [protot[i], protot[j]] = [protot[j] as string, protot[i] as string];
  }
  const ochered = new Map(
    [...poProtot].map(([k, v]) => {
      const s = [...v];
      for (let i = s.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rnd() * (i + 1));
        [s[i], s[j]] = [s[j] as ZadachaPechati, s[i] as ZadachaPechati];
      }
      return [k, s];
    }),
  );
  const out: ZadachaPechati[] = [];
  for (let krug = 0; out.length < p.n && krug < 10; krug += 1) {
    for (const id of protot) {
      if (out.length >= p.n) break;
      const z = ochered.get(id)?.[krug];
      if (z) out.push(z);
    }
  }
  return out;
}

/** Статичный чертёж задачи для листа: из того же сценария, что интерактив. */
export function chertezhLista(
  z: ZadachaPechati,
  vid: Vid,
  katex?: (tex: string) => string,
  /** Свой ракурс вместо ракурса задачи: учитель повернул чертёж в предпросмотре. */
  rakurs?: { azimut: number; vysota: number },
): string {
  const ishodnyy = JSON.parse(openText(z.scena, z.seal)) as Scenariy;
  const sc = rakurs === undefined ? ishodnyy : { ...ishodnyy, rakurs };
  return chertezhSvg(sc, {
    rezhim: vid,
    shirina: SHIRINA,
    kegl: KEGL,
    pechatMm: SHIRINA_MM,
    ...(katex ? { katex } : {}),
    klass: 'sheet-solid ch3-svg',
  });
}

/** Описание листа для lib/sheet/sheet.js. */
export function specLista(
  vse: readonly ZadachaPechati[],
  razdel: string,
  p: ParametryLista,
  vid: Vid,
  katex?: (tex: string) => string,
) {
  const nabor = vybrat(vse, p);
  const s = SHEET_3;
  const tasks = nabor.map((z, i) => {
    const task: Record<string, unknown> = {
      id: z.klyuch,
      no: i + 1,
      questionHtml: typo.mathText(z.uslovie),
      figureSvg: chertezhLista(z, vid, katex),
      figureWidth: 58,
    };
    if (vid === 'uchitel') {
      const shagi = openText(z.shagi, z.seal).split('\n');
      task.solutionHtml =
        `<ol class="sheet-steps">${shagi.map((t) => `<li class="sheet-step">${typo.mathText(t)}</li>`).join('')}</ol>` +
        `<p class="sheet-step-answer"><b>Ответ:</b> ${typo.text(openText(z.otvet, z.seal))}</p>`;
    }
    return task;
  });
  return {
    theme: p.theme,
    layout: 'single',
    documentTitle: `${s.chip}. ${s.title} — ${razdel}`,
    head: s.head,
    runner: s.runner,
    title: {
      chip: s.chip,
      text: `${s.title}. ${razdel}`,
      subtitle: vid === 'uchenik' ? s.uchenik : s.uchitel,
    },
    recap: null,
    blocks: [{ title: razdel, tasks }],
    fields: vid === 'uchenik' ? { date: '' } : undefined,
    withAnswerLine: vid === 'uchenik',
    extraItems:
      vid === 'uchitel'
        ? [
            answers.sectionHead(s.otvety, 'по номерам задач листа'),
            answers.table(
              s.otvety,
              nabor.map((z, i) => ({ no: i + 1, answer: openText(z.otvet, z.seal), html: null })),
              6,
            ),
          ]
        : [],
    foot: s.foot,
    /** Набор задач — для проверки, что листы совпадают. */
    nabor: nabor.map((z) => z.klyuch),
  };
}
