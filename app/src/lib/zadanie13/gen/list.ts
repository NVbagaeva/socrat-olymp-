/**
 * Состав листа генератора №13: план (прототип и seed каждой задачи)
 * и собранные задачи с разметкой условия, ответом и решениями.
 *
 * План детерминирован по seed комплекта: лист ученика, лист учителя
 * и онлайн-набор, построенные из одного адреса, дают одни и те же
 * задачи. «↻ заменить» меняет одну задачу на новую того же прототипа
 * и не трогает остальные.
 */

import type { Vid13 } from '@/content/generator13';
import type { Urok13 } from '@/content/repetitory13';
import { typeset } from '../../tex';
import { rngOf } from '../../vychisleniya/rng';
import { BANK_13 } from '../bank';
import { generate } from '../generate';
import { kletkiUsloviya, otvetText, tablitsaHtml } from '../html';
import { reshenieChasti } from '../reshenieHtml';
import { SIGN, TIP_VYVOD } from '../proto/common';
import { PROTOTYPES } from '../proto';
import { TYPE_NAMES, type Task13 } from '../types';
import { blokById13, zadachiBloka } from '../opornye/bloki';
import { urokPo13, VIDY_ID, type GenParams13 } from './params';

/** Часть листа урока: опорные → банк → новые → «Определи тип». */
export type Chast13 = 'opornye' | 'bank' | 'novye' | 'tip';

export interface Poziciya13 {
  /** «вариант.номер»: ключ замены. */
  pos: string;
  no: number;
  vid: Vid13;
  prototypeId: string;
  seed: string;
  istochnik: 'bank' | 'new';
  /** Только у листа урока. */
  chast?: Chast13;
}

export interface ListZadacha13 extends Poziciya13 {
  task: Task13;
  questionHtml: string;
  /** Ответ строкой: «600 000 рублей», «Аннуитет». */
  answer: string;
  /** Решение по шагам — по куску на шаг (лист учителя переносит шаги). */
  kratko: string[];
  polno: string[];
  kratkoHtml: string;
  polnoHtml: string;
}

export interface List13 {
  poVariantam: ListZadacha13[][];
}

/** Прототипы для строки «Что» с учётом уровня. */
function kandidaty(vid: Vid13, uroven: GenParams13['uroven']): string[] {
  const vse = PROTOTYPES.filter((p) =>
    vid === 'P' ? p.id.startsWith('P-') : !p.id.startsWith('P-') && (vid === 'T' || p.type === vid),
  );
  const poUrovnyu = vse.filter((p) =>
    uroven === 'all' ? true : uroven === 'base' ? p.difficulty === 'base' : p.difficulty === 'hard',
  );
  return (poUrovnyu.length > 0 ? poUrovnyu : vse).map((p) => p.id);
}

/** Место задачи в варианте до раскладки: строка «Что» и номер в ней. */
interface Slot {
  vid: Vid13;
  i: number;
  prototypeId: string;
}

/**
 * План листа: по вариантам. Прототипы строки «Что» — по кругу в
 * перемешанном порядке. Задачи варианта перемешиваются (seed
 * комплекта): по соседству задач нельзя угадать схему. У зачёта
 * порядок блоков, так и задуман. Seed банка у прототипа свой и не
 * повторяется в комплекте, «Банк + новые» чередует. Замена — новая
 * задача того же прототипа на своём seed; остальные задачи она не
 * трогает: место в очереди банка задача занимает и после замены.
 */
export function planLista13(p: GenParams13): Poziciya13[][] {
  const u = p.urok > 0 ? urokPo13(p.urok) : undefined;
  if (u !== undefined) return planUroka13(p, u);
  const bankSeeds = new Map<string, string[]>();
  const vzyato = new Map<string, number>();
  const seedsOf = (id: string): string[] => {
    let list = bankSeeds.get(id);
    if (list === undefined) {
      const own = BANK_13.filter(([pid]) => pid === id).map(([, s]) => s);
      list = rngOf(`z13-gen|${p.seed}|${id}`).sample(own, own.length);
      bankSeeds.set(id, list);
    }
    return list;
  };
  const out: Poziciya13[][] = [];
  for (let v = 0; v < p.variants; v += 1) {
    const sloty: Slot[] = [];
    for (const vid of VIDY_ID) {
      const n = p.sostav[vid] ?? 0;
      if (n === 0) continue;
      const kand = kandidaty(vid, p.uroven);
      const poryadok = rngOf(`z13-gen|${p.seed}|${v}|${vid}`).sample(kand, kand.length);
      for (let i = 0; i < n; i += 1) {
        sloty.push({ vid, i, prototypeId: poryadok[i % poryadok.length] ?? kand[0] ?? 'A-01' });
      }
    }
    const rasklad = p.zachet
      ? sloty
      : rngOf(`z13-gen|${p.seed}|${v}|poryadok`).sample(sloty, sloty.length);
    out.push(
      rasklad.map((slot, k): Poziciya13 => {
        const no = k + 1;
        const pos = `${v + 1}.${no}`;
        const { vid, prototypeId } = slot;
        const izBanka =
          vid !== 'P' && (p.istochnik === 'bank' || (p.istochnik === 'mix' && slot.i % 2 === 0));
        let seed: string | undefined;
        if (izBanka) {
          const j = vzyato.get(prototypeId) ?? 0;
          seed = seedsOf(prototypeId)[j];
          vzyato.set(prototypeId, j + 1);
        }
        const zamena = p.zameny[pos] ?? 0;
        return seed === undefined || zamena > 0
          ? { pos, no, vid, prototypeId, seed: `g${p.seed}-${pos}-${zamena}`, istochnik: 'new' }
          : { pos, no, vid, prototypeId, seed, istochnik: 'bank' };
      }),
    );
  }
  return out;
}

/** Вид задачи урока: «таблица руками» — свой вид, «Определи тип» — свой, остальное — тип прототипа. */
function vidPrototipa(id: string, tip: boolean): Vid13 {
  if (tip) return 'T';
  const proto = PROTOTYPES.find((x) => x.id === id);
  return id.startsWith('P-') ? 'P' : (proto?.type ?? 'A');
}

/**
 * План листа урока «Для репетиторов»: опорные задачи — те же, что на
 * экране опорных задач (в варианте 2 — следующие задачи блока),
 * задачи банка — свои seed прототипов без повторов, новые — свежие
 * seed, «Определи тип» — условия банка разных типов. Части идут по
 * порядку, внутри банка и новых порядок перемешан seed комплекта.
 * Замена, как в генераторе, даёт новую задачу того же прототипа.
 */
function planUroka13(p: GenParams13, u: Urok13): Poziciya13[][] {
  const bankSeeds = new Map<string, string[]>();
  const vzyato = new Map<string, number>();
  const seedsOf = (id: string): string[] => {
    let list = bankSeeds.get(id);
    if (list === undefined) {
      const own = BANK_13.filter(([pid]) => pid === id).map(([, s]) => s);
      list = rngOf(`z13-urok|${p.seed}|${id}`).sample(own, own.length);
      bankSeeds.set(id, list);
    }
    return list;
  };
  /* Задача банка не повторяет опорную задачу того же урока. */
  const zanyato = new Set<string>();
  const izBanka = (id: string): string | undefined => {
    const svoi = seedsOf(id);
    for (let j = vzyato.get(id) ?? 0; j < svoi.length; j += 1) {
      const seed = svoi[j] as string;
      if (zanyato.has(`${id}|${seed}`)) continue;
      vzyato.set(id, j + 1);
      zanyato.add(`${id}|${seed}`);
      return seed;
    }
    vzyato.set(id, svoi.length);
    return undefined;
  };
  const tipKand = kandidaty('T', 'base');
  /* Опорные всех вариантов — до банка: банк их не повторит. */
  const opornyePo = Array.from({ length: p.variants }, (_, v) => {
    const zadachiBlokov = new Map<string, number>();
    return u.opornye.map((blokId) => {
      const blok = blokById13(blokId);
      const svoi = blok === undefined ? [] : zadachiBloka(blok);
      const k = zadachiBlokov.get(blokId) ?? 0;
      zadachiBlokov.set(blokId, k + 1);
      const perOne = u.opornye.filter((x) => x === blokId).length;
      const z = svoi[(v * perOne + k) % Math.max(1, svoi.length)];
      if (z !== undefined) zanyato.add(`${z.prototypeId}|${z.seed}`);
      return { chast: 'opornye' as const, prototypeId: z?.prototypeId ?? 'P-01', seed: z?.seed };
    });
  });
  const out: Poziciya13[][] = [];
  for (let v = 0; v < p.variants; v += 1) {
    const opornye = opornyePo[v] ?? [];
    const r = rngOf(`z13-urok|${p.seed}|${v}|poryadok`);
    const bank = r
      .sample(u.bank, u.bank.length)
      .map((id) => ({ chast: 'bank' as const, prototypeId: id, seed: izBanka(id) }));
    const novye = r
      .sample(u.novye, u.novye.length)
      .map((id) => ({ chast: 'novye' as const, prototypeId: id, seed: undefined }));
    const tipy = rngOf(`z13-urok|${p.seed}|${v}|tip`).sample(tipKand, tipKand.length);
    const tip = Array.from({ length: u.tip }, (_, i) => {
      const id = tipy[i % tipy.length] ?? 'A-01';
      return { chast: 'tip' as const, prototypeId: id, seed: izBanka(id) };
    });
    out.push(
      [...opornye, ...bank, ...novye, ...tip].map((slot, k): Poziciya13 => {
        const no = k + 1;
        const pos = `${v + 1}.${no}`;
        const vid = vidPrototipa(slot.prototypeId, slot.chast === 'tip');
        const zamena = p.zameny[pos] ?? 0;
        const base = { pos, no, vid, prototypeId: slot.prototypeId, chast: slot.chast };
        return slot.seed === undefined || zamena > 0
          ? { ...base, seed: `g${p.seed}-${pos}-${zamena}`, istochnik: 'new' }
          : { ...base, seed: slot.seed, istochnik: 'bank' };
      }),
    );
  }
  return out;
}

function uslovieHtml(t: Task13): string {
  const text = t.condition
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => typeset(line))
    .join('<br>');
  return text;
}

/** Первая строка решения учителя: тип называется здесь, а не над условием. */
function tipHtml(t: Task13): string {
  const v = TIP_VYVOD[t.type];
  return `<div class="z13-r-shag"><p class="z13-r-shag__head"><b>${v.title}:</b> ${typeset(v.text)}</p></div>`;
}

/**
 * Задача листа по позиции плана: условие, ответ, решения. `gotovaya` —
 * задача, уже собранная на заданных числах (generateFixed).
 */
export function sobratZadachu13(poz: Poziciya13, gotovaya?: Task13): ListZadacha13 {
  const t = gotovaya ?? generate(poz.prototypeId, poz.seed);
  if (poz.vid === 'T') {
    const reshenie = `<p>${typeset(`Признак: ${SIGN[t.type]}.`)}</p>`;
    return {
      ...poz,
      task: t,
      questionHtml: uslovieHtml(t),
      answer: TYPE_NAMES[t.type],
      kratko: [reshenie],
      polno: [reshenie],
      kratkoHtml: reshenie,
      polnoHtml: reshenie,
    };
  }
  /* Решение — общей разметкой (lib/zadanie13/reshenieHtml.ts). Тип
     называется первым шагом; у старых решений его нет — добавляем. */
  const tip = t.solution[0]?.title.startsWith('Определяем тип') ? [] : [tipHtml(t)];
  const kratko = [...tip, ...reshenieChasti(t.solution, t.tableModel, { kratko: true })];
  const polno = [...tip, ...reshenieChasti(t.solution, t.tableModel)];
  return {
    ...poz,
    task: t,
    questionHtml: uslovieHtml(t),
    answer: otvetText(t.answer, t.units),
    kratko,
    polno,
    kratkoHtml: kratko.join(''),
    polnoHtml: polno.join(''),
  };
}

export function sobratList13(p: GenParams13): List13 {
  return {
    poVariantam: planLista13(p).map((variant) => variant.map((poz) => sobratZadachu13(poz))),
  };
}

/** Таблица условия — отдельно: на листе она стоит под условием, не внутри абзаца. */
export function tablitsaUsloviya13(z: ListZadacha13): string {
  return z.task.conditionTable ? tablitsaHtml(kletkiUsloviya(z.task.conditionTable)) : '';
}
