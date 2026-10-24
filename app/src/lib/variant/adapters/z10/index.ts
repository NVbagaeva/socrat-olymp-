/**
 * Адаптер задания №10: задачи открытого банка ФИПИ и аналоги (банк
 * раздела без ответов, маршрут /variant/dannye/z10.json). Ответ, разбор
 * и подсказки считает решатель прототипа по параметрам — как лист
 * учителя №10 (components/tasks/zadanie10/List10.tsx). Рисунок — только
 * чертёж моста П-01 (lib/zadanie10/chertezh/most.ts): ученику — режим
 * «uchenik», учителю — «uchitel» с выделенной вантой. Картинки сюжетов
 * декоративные — на лист ЕГЭ не идут.
 *
 * Генератора новых чисел у №10 нет: кончились задачи прототипа —
 * `null`, и сборщик ослабит фильтр прототипа сам.
 */

import { typeset } from '@/lib/tex';
import { chertezhMosta } from '@/lib/zadanie10/chertezh/most';
import { kodNaSayte, prototype } from '@/lib/zadanie10/prototypes';
import type { Fallback, SectionAdapter, SectionModule, VariantTask } from '../../types';
import type { Zadacha10Variant } from '../../data/z10';
import { dataUrl } from '@/lib/dataUrl';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  studentFromHints,
  type Candidate,
} from '../common';
import { info } from './info';
import { razbor10Html } from './razbor';

/** Ширина чертежа моста на листе, мм — как на листе №10 (List10, SHIRINA_MM.most). */
const SHIRINA_MOSTA_MM = 84;

interface C10 extends Candidate {
  z: Zadacha10Variant;
}

function candidate(z: Zadacha10Variant): C10 | null {
  let group: string;
  try {
    group = prototype(z.prototypeId).group;
  } catch {
    return null;
  }
  return {
    taskId: z.id,
    prototypeId: z.prototypeId,
    subtype: group,
    source: z.source === 'fipi' ? 'fipi' : 'own',
    stars: null,
    z,
  };
}

function mostSvg(z: Zadacha10Variant, rezhim: 'uchenik' | 'uchitel'): string {
  const p = z.params;
  return chertezhMosta({ a: Number(p.a), b: Number(p.b), c: Number(p.c), x: Number(p.x) }, rezhim)
    .svg;
}

/** Ответ с единицами: «17 Ом», «30°». */
function otvetSEdinicami(answer: number, edinicy: string): string {
  const x = answerHtml(answer);
  if (edinicy === '') return x;
  return /^[°%]/.test(edinicy) ? `${x}${typeset(edinicy)}` : `${x}&nbsp;${typeset(edinicy)}`;
}

function build(c: C10): VariantTask {
  const { z } = c;
  const p = prototype(z.prototypeId);
  const s = p.solve(z.params);
  const kod = kodNaSayte(z.prototypeId);
  const izKursa = p.fipiNos === '';
  const most = z.prototypeId === 'P01';
  const razbor = razbor10Html(s);
  const otvet = razborAnswer(otvetSEdinicami(s.answer, s.edinicy));
  const fallbacks: Fallback[] = [FALLBACK.studentFromHints, FALLBACK.noDifficulty];
  let label: string;
  if (z.source === 'fipi') {
    if (z.no === undefined) {
      label = `Открытый банк ФИПИ: прототип ${kod}`;
      fallbacks.push(FALLBACK.noPrototypeNo);
    } else {
      label = `Открытый банк ФИПИ: задача ${z.no} (прототип ${kod})`;
    }
  } else {
    label = `Аналог прототипа ${kod}${izKursa ? ' (прототип из курса, не из открытого банка)' : ''}`;
  }
  return {
    egeNumber: 10,
    taskId: c.taskId,
    prototypeId: c.prototypeId,
    subtype: c.subtype,
    source: { kind: c.source, label },
    difficulty: null,
    statement: `<p>${typeset(z.text)}</p>`,
    figure: most ? { svg: mostSvg(z, 'uchenik'), width: SHIRINA_MOSTA_MM } : null,
    figureTeacher: most ? { svg: mostSvg(z, 'uchitel'), width: SHIRINA_MOSTA_MM } : null,
    answer: answerText(s.answer),
    answerHtml: answerHtml(s.answer),
    solutionTeacher: razbor + otvet,
    solutionStudent:
      studentFromHints(s.hints, []) + `<p class="var-razbor__h">Решаем</p>${razbor}` + otvet,
    fallbacks,
    ref: { prototype: c.prototypeId, id: z.id },
  };
}

function isZadacha(x: unknown): x is Zadacha10Variant {
  if (typeof x !== 'object' || x === null) return false;
  const z = x as Record<string, unknown>;
  return (
    typeof z.id === 'string' &&
    typeof z.prototypeId === 'string' &&
    typeof z.text === 'string' &&
    typeof z.params === 'object' &&
    z.params !== null
  );
}

function init(data: unknown): SectionAdapter {
  const items = Array.isArray(data) ? data.filter(isZadacha) : [];
  const pool = items.flatMap((z) => {
    const c = candidate(z);
    return c === null ? [] : [c];
  });
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      return c === null ? null : build(c);
    },
  };
}

async function load(): Promise<unknown> {
  const r = await fetch(dataUrl('/variant/dannye/z10.json'));
  if (!r.ok) throw new Error(`нет данных №10: ${r.status}`);
  return r.json();
}

export const section: SectionModule = { load, init };
