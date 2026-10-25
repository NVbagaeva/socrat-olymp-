/**
 * Адаптер задания №11: задачи открытого банка, вычитанные аналоги и —
 * когда их не хватило — новые числа генератором подтипа (`generateBez`,
 * gen/core.ts). Банк приходит без ответов (маршрут
 * /variant/dannye/z11.json, как условия тренажёра); ответ, разбор и
 * подсказки считает движок подтипа по параметрам. Разметка решения —
 * лист учителя №11 (`reshenieHtml`, sheet11.ts): таблица модели по
 * методике и этапы, правило пропорции — печатным блоком.
 *
 * taxonomy.ts и bank.ts сюда не импортируются: они тянут bank.json с
 * ответами (pnpm test:secrets).
 */

import { typesetKrupno } from '@/lib/tex';
import { dataUrl } from '@/lib/dataUrl';
import { generateBez, paramsKey, pohozhaNa, type Pohozha } from '@/lib/zadanie11/gen/core';
import { kodNaSayte } from '@/lib/zadanie11/kod';
import type { Kontekst } from '@/lib/zadanie11/proporciya/html';
import { SUBTYPES, subtype } from '@/lib/zadanie11/prototypes';
import { reshenieHtml } from '@/lib/zadanie11/sheet11';
import type { UslovieBanka } from '@/lib/zadanie11/trenazher/sessiya';
import type { Params, Solved } from '@/lib/zadanie11/types';
import type {
  Fallback,
  Rng,
  SectionAdapter,
  SectionModule,
  Stars,
  TaskFilters,
  VariantTask,
} from '../../types';
import {
  FALLBACK,
  answerHtml,
  answerText,
  pickCandidate,
  razborAnswer,
  sourceOk,
  starsOk,
  studentFromHints,
  subtypeOk,
  type Candidate,
} from '../common';
import { info } from './info';

/** Подтипы ЕГЭ: без разминки РЗ. */
const EGE_SUBTYPES = SUBTYPES.filter((s) => s.section !== 'RZ');
const EGE_IDS = new Set(EGE_SUBTYPES.map((s) => s.id));

type Iz =
  { vid: 'bank' | 'analog'; b: UslovieBanka } | { vid: 'new'; seed: string; params: Params };

interface C11 extends Candidate {
  iz: Iz;
}

function stars(id: string): Stars {
  return subtype(id).level;
}

function fromBank(b: UslovieBanka): C11 | null {
  if (b.razminka || !EGE_IDS.has(b.id)) return null;
  const st = subtype(b.id);
  const analog = b.analog !== undefined;
  return {
    taskId: analog ? `a:${b.analog?.kod ?? b.no}` : `b:${b.no}`,
    prototypeId: b.id,
    subtype: st.section,
    source: analog ? 'own' : 'fipi',
    stars: st.level,
    iz: { vid: analog ? 'analog' : 'bank', b },
  };
}

function build(c: C11, solved: Solved): VariantTask {
  const id = c.prototypeId;
  const kod = kodNaSayte(id);
  const s = solved;
  /* Правило пропорции и признаки делимости — целиком в каждой задаче:
     задачи варианта из разных разделов, ссылаться не на что. */
  const k: Kontekst = {
    typeset: typesetKrupno,
    pechat: true,
    pokazano: { pravilo: false, priznaki: false },
  };
  const reshenie = reshenieHtml(s.etapy, s.tables ?? [], k);
  const vybor = s.vybor;
  const otvetVybor = vybor === undefined ? null : (vybor.options[vybor.correct] ?? '');
  const otvet = otvetVybor === null ? answerHtml(s.answer) : typesetKrupno(otvetVybor);
  const tekst = c.iz.vid === 'new' ? undefined : c.iz.b.analog?.tekst;
  const fallbacks: Fallback[] = [FALLBACK.studentFromHints];
  let label: string;
  if (c.iz.vid === 'bank') {
    label = `Открытый банк ФИПИ: прототип ${kod}`;
    fallbacks.push(FALLBACK.noPrototypeNo);
  } else if (c.iz.vid === 'analog') {
    label = `Аналог прототипа ${kod}`;
  } else {
    label = `Своя: прототип ${kod}, новые числа`;
  }
  return {
    egeNumber: 11,
    taskId: c.taskId,
    prototypeId: id,
    subtype: c.subtype,
    source: { kind: c.source, label },
    difficulty: stars(id),
    statement: typesetKrupno(tekst ?? s.uslovie),
    figure: null,
    figureTeacher: null,
    answer: otvetVybor === null ? answerText(s.answer) : otvetVybor.replace(/\$/g, ''),
    answerHtml: otvet,
    solutionTeacher: reshenie + razborAnswer(otvet),
    solutionStudent:
      studentFromHints(s.hints, []) +
      `<p class="var-razbor__h">Решаем</p>${reshenie}` +
      razborAnswer(otvet),
    fallbacks,
    ref:
      c.iz.vid === 'new'
        ? { prototype: id, seed: c.iz.seed }
        : { prototype: id, no: c.iz.b.no, vid: c.iz.vid },
  };
}

/**
 * Новая задача подтипа по фильтрам: банк и аналоги кончились. Только
 * для «своих» задач — задача ФИПИ из генератора не берётся.
 */
function fresh(filters: TaskFilters, rng: Rng, pohozha: Pohozha): VariantTask | null {
  if (!sourceOk('own', filters.source)) return null;
  const ids = EGE_SUBTYPES.filter(
    (s) =>
      (filters.prototype === undefined || s.id === filters.prototype) &&
      subtypeOk(s.section, filters.subtypes) &&
      starsOk(s.level, filters.stars),
  );
  if (ids.length === 0) return null;
  for (let i = 0; i < 20; i += 1) {
    const st = rng.pick(ids);
    const seed = `v${Math.floor(rng.next() * 1e9).toString(36)}`;
    let g;
    try {
      g = generateBez(st.id, seed, pohozha);
    } catch {
      continue;
    }
    const taskId = `n:${paramsKey(st.id, g.params)}`;
    if (filters.exclude.has(taskId)) continue;
    const c: C11 = {
      taskId,
      prototypeId: st.id,
      subtype: st.section,
      source: 'own',
      stars: st.level,
      iz: { vid: 'new', seed, params: g.params },
    };
    return build(c, g.solved);
  }
  return null;
}

function isUslovie(x: unknown): x is UslovieBanka {
  if (typeof x !== 'object' || x === null) return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b.no === 'number' &&
    typeof b.id === 'string' &&
    typeof b.params === 'object' &&
    b.params !== null
  );
}

function init(data: unknown): SectionAdapter {
  const bank = Array.isArray(data) ? data.filter(isUslovie) : [];
  /* «Похожа на задачу банка» — по всему списку, как у листа №11. */
  const pohozha = pohozhaNa(bank);
  const pool = bank.flatMap((b) => {
    const c = fromBank(b);
    return c === null ? [] : [c];
  });
  return {
    info,
    getRandomTask(filters, rng) {
      const c = pickCandidate(pool, filters, rng);
      if (c !== null && c.iz.vid !== 'new') {
        return build(c, subtype(c.prototypeId).solve(c.iz.b.params));
      }
      return fresh(filters, rng, pohozha);
    },
  };
}

async function load(): Promise<unknown> {
  const r = await fetch(dataUrl('/variant/dannye/z11.json'));
  if (!r.ok) throw new Error(`нет данных №11: ${r.status}`);
  return r.json();
}

export const section: SectionModule = { load, init };
