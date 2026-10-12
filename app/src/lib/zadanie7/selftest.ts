/**
 * Самотест задания №7 (pnpm test:uravneniya).
 *
 *   — пересчёт корней: ответ каждой задачи (ФИПИ и аналоги) совпадает с
 *     ответом решателя и с независимым численным пересчётом по
 *     формулам частей уравнения (lib/zadanie7/proverka.ts); каждый
 *     найденный корень подставляется в исходное уравнение;
 *   — ОДЗ и посторонние корни: корни в ОДЗ решателя совпадают с
 *     численно найденными; посторонний корень не проходит ОДЗ или
 *     подстановку; в аналогах П-09, П-13, П-30 посторонние корни есть, у
 *     П-13 есть и аналоги без них (оба корня подходят, «меньший» решает);
 *   — распределение ответов: 20 аналогов, не меньше 12 разных, ни один
 *     не чаще двух раз (исключения — с причиной); ответы — целые или
 *     конечные десятичные дроби; файл аналогов совпадает с подбором;
 *     нет двух одинаковых уравнений с точностью до перестановки;
 *   — разметка формул: KaTeX в строгом режиме, нет «1x», «x^1», «^1»,
 *     «+ −», «−(−», «− −», лишних скобок вокруг числа; условие ФИПИ
 *     содержит уравнение, собранное по параметрам;
 *   — разбор: этапы «Шаг N. …», последняя строка — ответ; подсказки:
 *     не меньше трёх, варианты разные, верный есть.
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
  znamTrig,
} from './bank/analogi';
import { korniChislenno, otvetChislenno } from './proverka';
import { PROTOTYPES, prototype } from './prototypes';
import type { BankItem, Solved } from './types';

export interface Problem {
  where: string;
  what: string;
}

/** Сколько задач ФИПИ в источниках (без повторов). */
export const FIPI_VSEGO = 180;

/** Прототипы, у которых аналоги обязаны содержать посторонний корень. */
export const S_POSTORONNIM: Record<string, { min: number; bezNih?: number }> = {
  P09: { min: 5 },
  P13: { min: 8, bezNih: 6 },
  P30: { min: 20 },
};

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

/** «Гигиена» формулы — правила банков №1, №9, №10 и показатель 1. */
export function gigienaFormuly(f: string): string[] {
  const bad: string[] = [];
  if (/(?<![\d.,\\}{_^])1(?=[a-zA-Z]|\\(?:sqrt|pi|sin|cos|tg|log|lg))/.test(f)) {
    bad.push('единица перед буквой');
  }
  if (/\^(?:1(?![\d{,])|\{1\})/.test(f)) {
    bad.push('показатель 1');
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
  if (/\\cdot\s*1(?![\d{,])/.test(f) || /(?<![\d}{,_])1\s*\\cdot/.test(f)) {
    bad.push('умножение на 1');
  }
  if (/\.\d/.test(f)) {
    bad.push('десятичная точка вместо запятой');
  }
  return bad;
}

/** Все строки решения: уравнение, этапы, вычисления, подсказки. */
export function vseTeksty(s: Solved): string[] {
  const out: string[] = [`$${s.uravnenie}$`];
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
        problems.push({ where, what: `формула: ${b} в «${f.slice(0, 90)}»` });
      }
    }
  }
}

function proveritReshenie(where: string, s: Solved, problems: Problem[]) {
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
  if (!s.etapy[0]?.title.endsWith('Тип уравнения и план')) {
    problems.push({ where, what: 'первый этап — не «Тип уравнения и план»' });
  }
  if (!s.etapy.at(-1)?.title.endsWith('Проверка подстановкой')) {
    problems.push({ where, what: 'последний этап — не «Проверка подстановкой»' });
  }
  if (s.postoronnie.length > 0 && !s.etapy.some((e) => e.title.endsWith('Отбор корней'))) {
    problems.push({ where, what: 'есть посторонний корень, но нет этапа «Отбор корней»' });
  }
  if (s.hints.length < 3) {
    problems.push({ where, what: 'подсказок меньше трёх' });
  }
  for (const h of s.hints) {
    if (h.options[h.correct] === undefined) {
      problems.push({ where, what: `подсказка без верного варианта: ${h.question}` });
    }
    if (new Set(h.options).size !== h.options.length || h.options.length < 2) {
      problems.push({ where, what: `варианты подсказки повторяются или их мало: ${h.question}` });
    }
  }
}

/** Пересчёт корней и посторонних корней независимо от решателя. */
function proveritKorni(where: string, item: BankItem, s: Solved, problems: Problem[]) {
  const proto = prototype(item.prototypeId);
  const ch = proto.chisla(item.params);
  const v = proto.vopros(item.params);
  const ravny = (x: number) => {
    const l = ch.lhs(x);
    const r = ch.rhs(x);
    return ch.odz(x) && Math.abs(l - r) <= 1e-6 * Math.max(1, Math.abs(l), Math.abs(r));
  };
  if (!ravny(item.answer)) {
    problems.push({
      where,
      what: `подстановка: ответ ${item.answer} не обращает уравнение в верное равенство`,
    });
  }
  const chisl = otvetChislenno(ch, v, znamTrig(item.params));
  if (chisl === null || Math.abs(chisl - item.answer) > 1e-6) {
    problems.push({
      where,
      what: `численный пересчёт даёт ${String(chisl)}, в банке ${item.answer}`,
    });
  }
  for (const x of s.postoronnie) {
    if (ravny(x)) {
      problems.push({ where, what: `«посторонний» корень ${x} на самом деле подходит` });
    }
    if (!s.korni.includes(x)) {
      problems.push({
        where,
        what: `посторонний корень ${x} не среди корней после преобразований`,
      });
    }
  }
  const vOdz = s.korni.filter((x) => !s.postoronnie.includes(x));
  if (!ch.periodicheskoe) {
    for (const x of vOdz) {
      if (!ravny(x)) {
        problems.push({ where, what: `корень ${x} не проходит подстановку` });
      }
    }
    const naydeno = korniChislenno(ch);
    const svoi = [...vOdz].sort((a, b) => a - b);
    if (
      naydeno.length !== svoi.length ||
      naydeno.some((x, i) => Math.abs(x - (svoi[i] as number)) > 1e-6)
    ) {
      problems.push({
        where,
        what: `корни решателя ${svoi.join('; ')}, численно найдены ${naydeno.join('; ')}`,
      });
    }
    if (v === 'menshiy' && item.answer !== Math.min(...vOdz)) {
      problems.push({ where, what: 'в ответе не меньший корень' });
    }
    if (v === 'bolshiy' && item.answer !== Math.max(...vOdz)) {
      problems.push({ where, what: 'в ответе не больший корень' });
    }
    if ((v === 'menshiy' || v === 'bolshiy') && new Set(s.korni).size < 2) {
      problems.push({
        where,
        what: '«если корней больше одного», а после преобразований корень один',
      });
    }
  } else if (v === 'minPol' ? item.answer <= 0 : item.answer >= 0) {
    problems.push({ where, what: `ответ ${item.answer} не того знака для вопроса ${v}` });
  }
}

export interface Itog {
  problems: Problem[];
  solved: { where: string; item: BankItem; s: Solved }[];
  statistika: string[];
}

export function checkBank(typeset: (tex: string) => string): Itog {
  const problems: Problem[] = [];
  const solved: Itog['solved'] = [];
  const statistika: string[] = [];

  /* ── ФИПИ ── */
  if (FIPI.length !== FIPI_VSEGO) {
    problems.push({ where: 'ФИПИ', what: `задач ${FIPI.length}, ожидалось ${FIPI_VSEGO}` });
  }
  FIPI.forEach((f, i) => {
    if (f.no !== i + 1 || f.id !== `F${String(i + 1).padStart(3, '0')}`) {
      problems.push({ where: f.id, what: `номер ${f.no}, ожидался ${i + 1}` });
    }
    if (!f.gde) {
      problems.push({ where: f.id, what: 'не указано, где задача в источнике' });
    }
    if (!otvetEge(f.answer, 3)) {
      problems.push({ where: f.id, what: `ответ не для бланка: ${f.answer}` });
    }
  });
  for (const p of PROTOTYPES) {
    const est = FIPI.some((f) => f.prototypeId === p.id);
    if (p.fipiNos !== '' && !est) {
      problems.push({ where: p.id, what: `указан источник «${p.fipiNos}», но задач ФИПИ нет` });
    }
    if (p.fipiNos === '' && est) {
      problems.push({ where: p.id, what: 'есть задачи ФИПИ, а источник не указан' });
    }
  }

  const vse: BankItem[] = [...FIPI, ...Object.values(ANALOGI_PO_PROTOTIPAM).flat()];
  const otpechatki = new Map<string, string>();
  for (const item of vse) {
    let s: Solved;
    const proto = prototype(item.prototypeId);
    try {
      s = proto.solve(item.params);
    } catch (e) {
      problems.push({ where: item.id, what: `решатель упал: ${(e as Error).message}` });
      continue;
    }
    solved.push({ where: item.id, item, s });
    if (Math.abs(s.answer - item.answer) > 1e-9) {
      problems.push({ where: item.id, what: `ответ решателя ${s.answer}, в банке ${item.answer}` });
    }
    if (!item.text.includes(`$${proto.uravnenie(item.params)}$`)) {
      problems.push({ where: item.id, what: 'в условии нет уравнения, собранного по параметрам' });
    }
    proveritKorni(item.id, item, s, problems);
    proveritReshenie(item.id, s, problems);
    proveritTeksty(item.id, [item.text, ...vseTeksty(s)], typeset, problems);
    const fp = otpechatok(proto, item.params);
    const byl = otpechatki.get(fp);
    if (byl !== undefined) {
      problems.push({ where: item.id, what: `то же уравнение, что ${byl}` });
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
    for (const x of a) {
      if (!otvetEge(x.answer)) {
        problems.push({ where: x.id, what: `ответ не для бланка: ${x.answer}` });
      }
    }
    const post = a.filter((x) => solved.find((z) => z.item.id === x.id)?.s.postoronnie.length);
    const nado = S_POSTORONNIM[p.id];
    if (nado) {
      if (post.length < nado.min) {
        problems.push({
          where,
          what: `с посторонним корнем ${post.length} аналогов, нужно не меньше ${nado.min}`,
        });
      }
      if (nado.bezNih !== undefined && a.length - post.length < nado.bezNih) {
        problems.push({
          where,
          what: `без постороннего корня ${a.length - post.length}, нужно не меньше ${nado.bezNih}`,
        });
      }
    }
    statistika.push(
      `${p.id}: ФИПИ ${FIPI.filter((f) => f.prototypeId === p.id).length}, аналогов ${a.length}, разных ответов ${cnt.size}, макс. повтор ${max}${post.length ? `, с посторонним корнем ${post.length}` : ''}`,
    );
    if (!GENERATORY[p.id]) {
      problems.push({ where, what: 'нет генератора аналогов' });
      continue;
    }
    const zanovo = podobratAnalogi(p.id, FIPI);
    if (JSON.stringify(zanovo) !== JSON.stringify(a)) {
      problems.push({ where, what: 'файл аналогов устарел — запустите pnpm build:bank-7' });
    }
  }

  return { problems, solved, statistika };
}
