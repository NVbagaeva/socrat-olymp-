/**
 * Самотест банка задания №1: открытый банк ФИПИ, аналоги, решения.
 *
 *   — 214 задач Блока 1: ответ прототипа — целое или конечная
 *     десятичная дробь, сходится с измерением на фигуре
 *     (bank/proverka.ts) и с ответом решения по шагам;
 *   — каждая задача и каждый аналог: условие, шаги, выкладки,
 *     вопросы подсказок и сверка набираются KaTeX в строгом режиме,
 *     в тексте нет NaN и undefined; слои чертежа, на которые ссылаются
 *     шаги и вопросы, в сцене есть; верный вариант вопроса существует,
 *     варианты различны;
 *   — аналоги: по десять на прототип, наборы не из открытого банка и
 *     различны, ответы ЕГЭ, чертёж чист; файл данных совпадает с
 *     подбором заново (bank/analogi.ts).
 */

import { typeset } from '../../tex';
import { POROG } from '../figury';
import { shagovPodskazki } from '../render';
import { reshenie } from '../reshenie';
import { PROTOTIPY, prototip } from '../stseny';
import type { Params } from '../stseny/dsl';
import { ANALOGI_DANNYE } from './analogi-dannye';
import { ANALOGOV, analogi, chertezhChist, otvetEge, podobratAnalogi } from './analogi';
import { BANK_FIPI } from './fipi';
import { izmerit } from './proverka';

export interface ItogBanka {
  zadach: number;
  problems: string[];
}

type Typeset = (tex: string) => string;

/** Все строки с формулами в $…$ из задачи и её решения. */
function teksty(proto: number, p: Params): { stroki: string[]; formuly: string[] } {
  const r = reshenie(proto, p);
  const stroki = [prototip(proto).uslovie(p), r.sverka];
  const formuly: string[] = [];
  for (const s of r.shagi) {
    stroki.push(s.zagolovok, ...s.tekst);
    formuly.push(...(s.formuly ?? []));
    for (const k of s.sokrashchenie ?? []) {
      stroki.push(k.tekst);
      if (k.tex !== '') formuly.push(k.tex);
    }
  }
  for (const v of r.voprosy) stroki.push(v.vopros, v.poyasnenie, ...v.knopki);
  return { stroki, formuly };
}

function proveritZadachu(proto: number, p: Params, metka: string, katex: Typeset): string[] {
  const out: string[] = [];
  const pr = prototip(proto);
  const o = pr.otvet(p);
  if (!otvetEge(o)) out.push(`${metka}: ответ ${o} — не целое и не конечная дробь до двух знаков`);
  const m = izmerit(proto, p);
  if (m === null || Math.abs(m - o) > 1e-6 * Math.max(1, Math.abs(o))) {
    out.push(`${metka}: ответ ${o}, а на фигуре ${m}`);
  }
  let r;
  try {
    r = reshenie(proto, p);
  } catch (e) {
    return [...out, `${metka}: решение не строится: ${(e as Error).message}`];
  }
  if (Math.abs(r.otvet - o) > 1e-6 * Math.max(1, Math.abs(o))) {
    out.push(`${metka}: ответ решения ${r.otvet}, а прототипа ${o}`);
  }
  const shagov = shagovPodskazki(pr.stsena(p, POROG));
  for (const s of r.shagi) {
    if (s.sloy !== undefined && s.sloy > shagov)
      out.push(`${metka}: шаг «${s.zagolovok}» ссылается на слой ${s.sloy}, а в сцене ${shagov}`);
  }
  for (const v of r.voprosy) {
    if (v.sloy !== undefined && v.sloy > shagov)
      out.push(`${metka}: вопрос «${v.vopros}» ссылается на слой ${v.sloy}`);
    if (v.verno < 0 || v.verno >= v.knopki.length)
      out.push(`${metka}: у вопроса «${v.vopros}» нет верного варианта`);
    if (new Set(v.knopki).size !== v.knopki.length)
      out.push(`${metka}: у вопроса «${v.vopros}» повторяются варианты`);
  }
  if (r.shagi.length === 0) out.push(`${metka}: решение без шагов`);
  const { stroki, formuly } = teksty(proto, p);
  for (const s of stroki) {
    if (/NaN|undefined|Infinity/.test(s)) out.push(`${metka}: в тексте «${s}» не число`);
    try {
      typeset(s);
      for (const f of s.match(/\$[^$]+\$/g) ?? []) katex(f.slice(1, -1));
    } catch (e) {
      out.push(`${metka}: KaTeX не набрал «${s}»: ${(e as Error).message}`);
    }
  }
  for (const f of formuly) {
    if (/NaN|undefined|Infinity/.test(f)) out.push(`${metka}: в выкладке «${f}» не число`);
    try {
      katex(f);
    } catch (e) {
      out.push(`${metka}: KaTeX не набрал выкладку «${f}»: ${(e as Error).message}`);
    }
  }
  return out;
}

export function checkBank(katex: Typeset, sPodborom = true): ItogBanka {
  const problems: string[] = [];
  let zadach = 0;
  const nomera = new Set<number>();
  for (const z of BANK_FIPI) {
    nomera.add(z.n);
    const p = { ...prototip(z.proto).primer, ...z.params } as Params;
    if (!prototip(z.proto).fipi.includes(z.n))
      problems.push(`задача ${z.n}: нет в списке задач прототипа ${z.proto}`);
    problems.push(...proveritZadachu(z.proto, p, `задача ${z.n} (прототип ${z.proto})`, katex));
    zadach += 1;
  }
  for (let n = 1; n <= 214; n += 1) if (!nomera.has(n)) problems.push(`в банке нет задачи ${n}`);

  for (const pr of PROTOTIPY) {
    problems.push(
      ...proveritZadachu(pr.id, pr.primer as Params, `образец прототипа ${pr.id}`, katex),
    );
    const a = analogi(pr.id);
    if (a.length !== ANALOGOV)
      problems.push(`прототип ${pr.id}: аналогов ${a.length}, а нужно ${ANALOGOV}`);
    const klyuchi = new Set<string>();
    for (const x of a) {
      const k = JSON.stringify(x.params);
      if (klyuchi.has(k)) problems.push(`прототип ${pr.id}: аналог ${x.no} повторяется`);
      klyuchi.add(k);
      if (!chertezhChist(pr.id, x.params))
        problems.push(`прототип ${pr.id}, аналог ${x.no}: чертёж с нарушениями`);
      problems.push(
        ...proveritZadachu(pr.id, x.params, `прототип ${pr.id}, аналог ${x.no}`, katex),
      );
      zadach += 1;
    }
    for (const z of BANK_FIPI.filter((q) => q.proto === pr.id)) {
      if (klyuchi.has(JSON.stringify({ ...pr.primer, ...z.params })))
        problems.push(`прототип ${pr.id}: аналог совпал с задачей ${z.n}`);
    }
    if (sPodborom) {
      const zanovo = JSON.stringify(podobratAnalogi(pr.id).map((x) => x.params));
      const vFayle = JSON.stringify(
        (ANALOGI_DANNYE[pr.id] ?? []).map((nab) => ({ ...pr.primer, ...nab })),
      );
      if (zanovo !== vFayle)
        problems.push(`прототип ${pr.id}: файл аналогов устарел — запустите pnpm build:bank-1`);
    }
  }
  return { zadach, problems };
}
