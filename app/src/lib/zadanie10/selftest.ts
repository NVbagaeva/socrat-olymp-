/**
 * Самотест задания №10 (pnpm test:prikladnye).
 *
 *   — каждая задача ФИПИ решается своим прототипом, ответ совпадает с
 *     ответом в JSON (его пересчитала отдельная программа);
 *   — у каждого прототипа ровно 20 аналогов, 10 из них — современные
 *     сюжеты; файл аналогов совпадает с повторным подбором;
 *   — ответы — целые или конечные десятичные дроби; у аналогов не
 *     меньше 12 разных ответов, ни один не чаще двух раз (исключения
 *     — с причиной); величины в правдоподобных пределах;
 *   — отпечатки (прототип + числа) не повторяются во всём банке;
 *   — формулы условия, разбора, подсказок и вычислений набираются
 *     KaTeX в строгом режиме и «чистые»: нет «1x», «+ −», «−(−»,
 *     «− −», лишних скобок вокруг числа;
 *   — в тексте нет NaN / undefined / Infinity;
 *   — разбор: этапы «Шаг N. …», последняя строка — ответ; подсказки:
 *     варианты разные, верный есть.
 */

import { FIPI } from './bank/fipi';
import { ANALOGI_PO_PROTOTIPAM } from './bank/index';
import {
  ANALOGOV,
  GENERATORY,
  otpechatok,
  otvetEge,
  podobratAnalogi,
  pravila,
  SOVREMENNYH,
} from './bank/analogi';
import { PROTOTYPES, prototype } from './prototypes';
import type { BankItem, Solved } from './types';

export interface Problem {
  where: string;
  what: string;
}

/** Формулы $…$ из строки. */
export function formuly(s: string): string[] {
  const out: string[] = [];
  const re = /\$([^$]+)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push(m[1] ?? '');
  }
  return out;
}

/** «Гигиена» формулы — те же правила, что у банка №1. */
export function gigienaFormuly(f: string): string[] {
  const bad: string[] = [];
  if (
    /(?<![\d.,\\}{_^])1(?=[a-zA-Z]|\\(?:sqrt|alpha|beta|gamma|angle|sin|cos|tg|pi|varphi|sigma|nu|omega))/.test(
      f,
    )
  ) {
    bad.push('единица перед буквой');
  }
  if (/\+\s*(?:-|−)/.test(f)) {
    bad.push('«+ −»');
  }
  if (/(?:-|−)\s*\(\s*(?:-|−)/.test(f)) {
    bad.push('«−(−»');
  }
  if (/(?:-|−)\s*(?:-|−)/.test(f)) {
    bad.push('«− −»');
  }
  if (/(?<![a-zA-Z\\])\(\s*\d+(?:\{,\}\d+)?\s*\)/.test(f)) {
    bad.push('лишние скобки вокруг числа');
  }
  if (/\(\s*\(/.test(f)) {
    bad.push('двойные скобки');
  }
  if (/\\cdot\s*1(?![\d{,])/.test(f) || /(?<![\d}])1\s*\\cdot/.test(f)) {
    bad.push('умножение на 1');
  }
  return bad;
}

/** Все строки решения: «Дано», этапы, вычисления, подсказки. */
export function vseTeksty(s: Solved): string[] {
  const out: string[] = [];
  for (const r of s.dano) {
    out.push(`$${r.oboz}=${r.znach}$`, r.smysl);
  }
  for (const e of s.etapy) {
    out.push(e.title, ...e.lines);
  }
  for (const c of s.vychisleniya) {
    out.push(c.tekst);
    if (c.tex) {
      out.push(`$${c.tex}$`);
    }
  }
  for (const h of s.hints) {
    out.push(h.question, ...h.options, ...(h.comment ? [h.comment] : []));
  }
  return out;
}

function proveritTeksty(
  where: string,
  teksty: string[],
  typeset: (tex: string) => string,
  problems: Problem[],
) {
  for (const t of teksty) {
    if (/NaN|undefined|Infinity|\[object/.test(t)) {
      problems.push({ where, what: `мусор в тексте: «${t.slice(0, 80)}»` });
    }
    if ((t.match(/\$/g) ?? []).length % 2 !== 0) {
      problems.push({ where, what: `непарный $: «${t.slice(0, 80)}»` });
    }
    for (const f of formuly(t)) {
      try {
        typeset(f);
      } catch (e) {
        problems.push({
          where,
          what: `KaTeX: ${(e as Error).message.slice(0, 120)} в «${f.slice(0, 80)}»`,
        });
      }
      for (const b of gigienaFormuly(f)) {
        problems.push({ where, what: `формула: ${b} в «${f.slice(0, 80)}»` });
      }
    }
  }
}

function proveritReshenie(where: string, s: Solved, problems: Problem[]) {
  if (!otvetEge(s.answer)) {
    problems.push({ where, what: `ответ не для бланка ЕГЭ: ${s.answer}` });
  }
  s.etapy.forEach((e, i) => {
    if (!e.title.startsWith(`Шаг ${i + 1}. `)) {
      problems.push({ where, what: `этап без подписи «Шаг ${i + 1}»: ${e.title}` });
    }
    if (e.lines.length === 0) {
      problems.push({ where, what: `пустой этап ${e.title}` });
    }
  });
  const last = s.etapy.at(-1)?.lines.at(-1) ?? '';
  if (!last.startsWith('**Ответ:**')) {
    problems.push({ where, what: 'последняя строка разбора — не ответ' });
  }
  if (s.etapy.length < 4) {
    problems.push({ where, what: `этапов меньше четырёх (${s.etapy.length})` });
  }
  if (s.dano.length === 0) {
    problems.push({ where, what: 'пустое «Дано»' });
  }
  if (s.hints.length < 3) {
    problems.push({ where, what: 'подсказок меньше трёх' });
  }
  for (const h of s.hints) {
    if (h.options[h.correct] === undefined) {
      problems.push({ where, what: `подсказка без верного варианта: ${h.question}` });
    }
    if (new Set(h.options).size !== h.options.length || h.options.length < 2) {
      problems.push({ where, what: `варианты подсказки повторяются: ${h.question}` });
    }
  }
}

export interface Itog {
  problems: Problem[];
  solved: { where: string; item: BankItem; s: Solved }[];
}

export function checkBank(typeset: (tex: string) => string): Itog {
  const problems: Problem[] = [];
  const solved: Itog['solved'] = [];

  /* ── ФИПИ ── */
  if (FIPI.length !== 160) {
    problems.push({ where: 'ФИПИ', what: `задач ${FIPI.length}, ожидалось 160` });
  }
  FIPI.forEach((f, i) => {
    if (f.no !== i + 1) {
      problems.push({ where: f.id, what: `номер ${f.no}, ожидался ${i + 1}` });
    }
  });
  for (const p of PROTOTYPES.filter((x) => x.no <= 29)) {
    if (!FIPI.some((f) => f.prototypeId === p.id)) {
      problems.push({ where: p.id, what: 'у прототипа ФИПИ нет задач банка' });
    }
  }

  const vse: BankItem[] = [...FIPI, ...Object.values(ANALOGI_PO_PROTOTIPAM).flat()];
  const otpechatki = new Map<string, string>();
  for (const item of vse) {
    let s: Solved;
    try {
      s = prototype(item.prototypeId).solve(item.params);
    } catch (e) {
      problems.push({ where: item.id, what: `решатель упал: ${(e as Error).message}` });
      continue;
    }
    solved.push({ where: item.id, item, s });
    if (Math.abs(s.answer - item.answer) > 1e-9) {
      problems.push({ where: item.id, what: `ответ решателя ${s.answer}, в банке ${item.answer}` });
    }
    proveritReshenie(item.id, s, problems);
    proveritTeksty(item.id, [item.text, ...vseTeksty(s)], typeset, problems);
    const fp = otpechatok(item.prototypeId, item.params);
    const byl = otpechatki.get(fp);
    if (byl !== undefined) {
      problems.push({ where: item.id, what: `отпечаток совпадает с ${byl}` });
    }
    otpechatki.set(fp, item.id);
  }

  /* ── Аналоги ── */
  for (const p of PROTOTYPES) {
    const a = ANALOGI_PO_PROTOTIPAM[p.id] ?? [];
    const where = `${p.id} аналоги`;
    if (a.length !== ANALOGOV) {
      problems.push({ where, what: `аналогов ${a.length}, нужно ${ANALOGOV}` });
    }
    const sovr = a.filter((x) => x.modern).length;
    if (sovr !== SOVREMENNYH) {
      problems.push({ where, what: `современных сюжетов ${sovr}, нужно ${SOVREMENNYH}` });
    }
    const cnt = new Map<number, number>();
    a.forEach((x) => cnt.set(x.answer, (cnt.get(x.answer) ?? 0) + 1));
    const pr = pravila(p.id);
    if (cnt.size < pr.minRaznyh) {
      problems.push({ where, what: `разных ответов ${cnt.size}, нужно не меньше ${pr.minRaznyh}` });
    }
    const max = Math.max(0, ...cnt.values());
    if (max > pr.maxPovtor) {
      problems.push({
        where,
        what: `ответ повторяется ${max} раз, можно не больше ${pr.maxPovtor}`,
      });
    }
    const g = GENERATORY[p.id];
    for (const x of a) {
      if (g && !g.fizika(x.params, x.answer)) {
        problems.push({ where: x.id, what: 'величины вне правдоподобных пределов' });
      }
      if (!x.text.includes('$')) {
        problems.push({ where: x.id, what: 'в условии нет формулы' });
      }
    }
    /* Файл аналогов совпадает с подбором. */
    const zanovo = podobratAnalogi(p.id, FIPI);
    if (JSON.stringify(zanovo) !== JSON.stringify(a)) {
      problems.push({ where, what: 'файл аналогов устарел — запустите pnpm build:bank-10' });
    }
  }

  return { problems, solved };
}
