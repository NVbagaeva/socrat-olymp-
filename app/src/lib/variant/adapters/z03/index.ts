/**
 * Адаптер задания №3: банк задачника, 10 вариантов на прототип,
 * разделы I–VIII. Банк сюда не импортируется (в нём ответы и
 * проверки): задачи приходят с маршрута /variant/dannye/z03.json
 * закрытыми, как на листе печати №3 (pechat-dannye.ts), и
 * раскрываются отпечатком ответа так же, как раскрывает их лист
 * учителя (pechat.ts).
 *
 * Чертёж I–III — сценарий листа печати (`chertezhLista`): ученику без
 * построений, учителю — с ними. Чертёж IV–VIII — SVG тренажёра
 * (solid/), один на прототип. Решение — шаги листа учителя.
 */

import { dataUrl } from '@/lib/dataUrl';
import { katex } from '@/lib/graph/katex';
import { typeset } from '@/lib/tex';
import type { ZadachaPechati } from '@/lib/zadanie3/pechat-dannye';
import { chertezhLista } from '@/lib/zadanie3/pechat';
import { openText } from '@/lib/zadanie3/secret';
import type { Scenariy } from '@/lib/chertezh3/scenariy';
import type { Model } from '@/lib/solid/model';
import { dannye3dJson } from '@/lib/stereo/zhivoy';
import type { Figure, SectionAdapter, SectionModule, VariantTask } from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  studentFromSteps,
  type Candidate,
} from '../common';
import { info } from './info';

/** Данные маршрута: lib/variant/data/z03.ts. */
interface Zadacha03 extends Omit<ZadachaPechati, 'nazvanie'> {
  ref: string;
}

interface Dannye03 {
  razdel: Record<string, string>;
  svg: Record<string, string>;
  model: Record<string, Model>;
  zadachi: Zadacha03[];
}

interface C03 extends Candidate {
  z: Zadacha03;
}

/** Ширина чертежа на листе, мм: I–III — как на листе печати №3 (figureWidth). */
const SHIRINA_SCENARIYA = 58;
const SHIRINA_SOLID = 50;

const OTVET = /^\s*\*{0,2}Ответ:/;

function tex(t: string): string {
  return katex.renderToString(t, { throwOnError: false });
}

/** «задачник 164» → «Своя: прототип P03-52 (задачник 164)». */
function sourceLabel(prototypeId: string, ref: string): string {
  if (ref === '' || ref === 'новый') return `Своя: прототип ${prototypeId}, новый вариант`;
  return `Своя: прототип ${prototypeId} (${ref})`;
}

function init(data: unknown): SectionAdapter {
  const d = data as Dannye03;
  const pool: C03[] = d.zadachi.map((z) => ({
    taskId: z.klyuch,
    prototypeId: z.prototip,
    subtype: d.razdel[z.prototip] ?? '',
    source: 'own',
    stars: null,
    z,
  }));

  function build(c: C03): VariantTask {
    const z = c.z;
    const otvetChislo = Number(openText(z.otvet, z.seal).replace(',', '.').replace('−', '-'));
    const otvet = answerHtml(otvetChislo);
    const shagi = openText(z.shagi, z.seal)
      .split('\n')
      .filter((t) => t.trim() !== '' && !OTVET.test(t));
    let figure: Figure | null;
    let figureTeacher: Figure | null;
    if (z.scena !== '') {
      /* Листу печати от записи нужны только сценарий и отпечаток. */
      const zp: ZadachaPechati = { ...z, nazvanie: '' };
      const sc = JSON.parse(openText(z.scena, z.seal)) as Scenariy;
      figure = {
        svg: chertezhLista(zp, 'uchenik', tex),
        width: SHIRINA_SCENARIYA,
        zhivoy: dannye3dJson({ sc }),
      };
      figureTeacher = {
        svg: chertezhLista(zp, 'uchitel', tex),
        width: SHIRINA_SCENARIYA,
        zhivoy: dannye3dJson({ sc, vspom: true }),
      };
    } else {
      const svg = d.svg[z.klyuch] ?? d.svg[z.prototip];
      const m = d.model[z.klyuch] ?? d.model[z.prototip];
      figure =
        svg === undefined
          ? null
          : {
              svg,
              width: SHIRINA_SOLID,
              ...(m === undefined ? {} : { zhivoy: dannye3dJson({ m }) }),
            };
      figureTeacher = null;
    }
    return {
      egeNumber: 3,
      taskId: c.taskId,
      prototypeId: c.prototypeId,
      subtype: c.subtype,
      source: { kind: 'own', label: sourceLabel(c.prototypeId, z.ref) },
      difficulty: null,
      statement: typeset(z.uslovie),
      figure,
      figureTeacher,
      answer: answerText(otvetChislo),
      answerHtml: otvet,
      /* Как на листе учителя №3 (specLista): шаг — строка с выкладками. */
      solutionTeacher:
        `<ol class="sheet-steps">${shagi.map((t) => `<li class="sheet-step">${typeset(t)}</li>`).join('')}</ol>` +
        razborAnswer(otvet),
      solutionStudent:
        studentFromSteps(shagi.map((t) => ({ title: t, lines: [] }))) + razborAnswer(otvet),
      fallbacks: [
        FALLBACK.noDifficulty,
        FALLBACK.studentFromTeacher,
        ...(figure === null ? [FALLBACK.noFigure] : []),
      ],
      ref: { prototype: c.prototypeId, variant: Number(z.klyuch.split('#')[1] ?? 0) },
    };
  }

  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      return c === null ? null : build(c);
    },
  };
}

export const section: SectionModule = {
  load: async () => {
    const res = await fetch(dataUrl('/variant/dannye/z03.json'));
    if (!res.ok) throw new Error(`z03.json: ${res.status}`);
    return (await res.json()) as unknown;
  },
  init,
};
