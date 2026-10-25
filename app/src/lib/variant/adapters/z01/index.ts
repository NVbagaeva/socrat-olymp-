/**
 * Адаптер задания №1: 214 задач Блока 1 открытого банка ФИПИ, 20
 * аналогов на прототип и новые числа того же прототипа, когда банк
 * и аналоги в партии кончились. Числа банка и аналогов приходят с
 * маршрута /variant/dannye/z01.json (без ответов, как у генератора
 * №1); задачу собирает движок раздела (`razreshit` + `sostavZadachi`,
 * trenazher/zadacha.ts) — те же условие, чертежи и решение, что на
 * листе генератора №1 (sheet1.ts).
 *
 * Чертёж ученика — режим «uchenik» (без построений и чисел решения),
 * чертёж учителя — «uchitel» со всеми построениями. Разбор для
 * ученика — разбор тренажёра (Razbor1): шаги словами, выкладки,
 * признаки делимости, сверка с рисунком.
 */

import { dataUrl } from '@/lib/dataUrl';
import { shirinaRisunka } from '@/lib/planimetriya/shirina';
import { prototip } from '@/lib/planimetriya/stseny';
import type { Nabor } from '@/lib/planimetriya/stseny/dsl';
import {
  klyuchProto,
  type UslovieBanka,
  type ZadachaPlan,
} from '@/lib/planimetriya/trenazher/sessiya';
import {
  novyeParams,
  razreshit,
  sostavZadachi,
  type Razbor1,
} from '@/lib/planimetriya/trenazher/zadacha';
import { typesetKrupno as typeset } from '@/lib/tex';
import type { Fallback, SectionAdapter, SectionModule, Stars, VariantTask } from '../../types';
import { answerText, pickCandidate, razborAnswer, type Candidate } from '../common';
import { info } from './info';

/** Данные маршрута: lib/variant/data/z01.ts. */
interface Dannye01 {
  urovni: Record<string, number>;
  bank: [number, number, Nabor][];
}

interface C01 extends Candidate {
  plan: ZadachaPlan;
}

/** Номер аналога в банке тренажёра — от 1000 (nomerAnaloga). */
const ANALOG_OT = 1000;

/** Чертёж решения на листе учителя не шире, мм — как на листе №1 (RESHENIE_MAX_MM). */
const RESHENIE_MAX_MM = 44;

/** Подписи разбора — как у разбора тренажёра (RAZBOR_1, content/zadanie1.ts). */
const PODPISI = {
  priznaki: 'Как сокращали: признаки делимости',
  sverka: 'Сверка с рисунком',
};

function starsOf(level: number | undefined): Stars | null {
  return level === 1 || level === 2 || level === 3 ? level : null;
}

/** Код прототипа на сайте: 5 → «05». */
function kod(id: string): string {
  return id.slice(1);
}

/** Разбор для ученика из разбора тренажёра: разметка уже набрана KaTeX. */
export function razborUchenika(r: Razbor1): string {
  const shagi = r.shagi
    .map((s, i) => {
      const tekst = s.tekst.map((t) => `<p class="var-razbor__line">${t}</p>`).join('');
      const formuly = s.formuly.map((f) => `<div class="var-razbor__line">${f}</div>`).join('');
      const sokr =
        s.sokrashchenie.length === 0
          ? ''
          : `<p class="var-razbor__why">${PODPISI.priznaki}:</p>` +
            s.sokrashchenie
              .map((k) => `<p class="var-razbor__why">${k.tekst}</p>${k.formula}`)
              .join('');
      return (
        `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${i + 1}</span>${s.zagolovok}</p>` +
        `${tekst}${formuly}${sokr}</li>`
      );
    })
    .join('');
  const sverka =
    r.sverka === ''
      ? ''
      : `<li class="var-razbor__step">` +
        `<p class="var-razbor__q"><span class="var-razbor__n">${r.shagi.length + 1}</span>${PODPISI.sverka}</p>` +
        `<p class="var-razbor__line">${r.sverka}</p></li>`;
  return `<p class="var-razbor__h">Решаем</p><ol class="var-razbor">${shagi}${sverka}</ol>`;
}

function withNote(t: VariantTask, note: readonly Fallback[]): VariantTask {
  return note.length === 0 ? t : { ...t, fallbacks: [...t.fallbacks, ...note] };
}

function init(data: unknown): SectionAdapter {
  const d = data as Dannye01;
  const bank: UslovieBanka[] = d.bank.map(([no, proto, params]) => ({
    no,
    id: klyuchProto(proto),
    params,
    analog: no >= ANALOG_OT,
  }));
  const blokOf = (id: string) => prototip(Number(id.slice(1))).blok;
  const starsOfId = (id: string) => starsOf(d.urovni[id]);

  const pool: C01[] = bank.map((b) => ({
    taskId: `${b.id}|${b.analog ? 'a' : 'b'}${b.no}`,
    prototypeId: b.id,
    subtype: blokOf(b.id),
    source: b.analog ? 'own' : 'fipi',
    stars: starsOfId(b.id),
    plan: { vid: b.analog ? 'analog' : 'bank', no: b.no, id: b.id },
  }));

  function build(c: C01): VariantTask {
    const r = razreshit(c.plan, bank);
    const s = sostavZadachi(r);
    const otvet = s.razbor.otvetHtml;
    const k = kod(c.prototypeId);
    const label =
      c.plan.vid === 'bank'
        ? `Открытый банк ФИПИ: задача ${c.plan.no} (прототип ${k})`
        : c.plan.vid === 'analog'
          ? `Аналог прототипа ${k}`
          : `Своя: прототип ${k}, новые числа`;
    return {
      egeNumber: 1,
      taskId: c.taskId,
      prototypeId: c.prototypeId,
      subtype: c.subtype,
      source: { kind: c.source, label },
      difficulty: c.stars,
      statement: typeset(s.uslovie),
      figure: { svg: s.risunokSvg, width: shirinaRisunka(s.risunokSvg) },
      figureTeacher: {
        svg: s.razbor.risunokSvg,
        width: shirinaRisunka(s.razbor.risunokSvg, RESHENIE_MAX_MM),
      },
      answer: answerText(s.otvet),
      answerHtml: otvet,
      solutionTeacher: s.reshenieLista + razborAnswer(otvet),
      solutionStudent: razborUchenika(s.razbor) + razborAnswer(otvet),
      fallbacks: [],
      ref:
        c.plan.vid === 'new'
          ? { prototype: c.prototypeId, seed: c.plan.seed }
          : { prototype: c.prototypeId, [c.plan.vid]: c.plan.no },
    };
  }

  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      if (c !== null) return build(c);
      const id = filters.prototype;
      if (id === undefined) return null;
      /* Параллельный вариант, а задачи ФИПИ прототипа кончились: свой
         аналог или новые числа того же прототипа, с пометкой. Иначе
         сборщик сменил бы прототип. */
      const note: Fallback[] =
        filters.source === 'fipi'
          ? [{ field: 'source', note: 'Задачи ФИПИ этого прототипа кончились — взят аналог' }]
          : [];
      if (filters.source === 'fipi') {
        const a = pickCandidate(pool, { ...filters, source: 'own' }, rng);
        if (a !== null) return withNote(build(a), note);
      }
      /* Банк и аналоги прототипа в партии кончились: новые числа. */
      for (let i = 0; i < 12; i += 1) {
        const seed = `v${Math.floor(rng.next() * 1e9).toString(36)}`;
        const taskId = `${id}|n${seed}`;
        if (filters.exclude.has(taskId) || novyeParams(Number(id.slice(1)), seed) === null)
          continue;
        return withNote(
          build({
            taskId,
            prototypeId: id,
            subtype: blokOf(id),
            source: 'own',
            stars: starsOfId(id),
            plan: { vid: 'new', id, seed },
          }),
          note,
        );
      }
      return null;
    },
  };
}

export const section: SectionModule = {
  load: async () => {
    const res = await fetch(dataUrl('/variant/dannye/z01.json'));
    if (!res.ok) throw new Error(`z01.json: ${res.status}`);
    return (await res.json()) as unknown;
  },
  init,
};
