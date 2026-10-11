/**
 * Самотест справочника задания №1 (content/teoriya1.ts):
 *
 *   — рисунки карточек и фактов существуют и рисуются движком без
 *     нарушений; живые чертежи существуют;
 *   — «Пример» — задача открытого банка, её прототип стоит в «Где на
 *     ЕГЭ» той же карточки;
 *   — «Где на ЕГЭ» покрывает все прототипы 1–75: у каждого есть
 *     карточка для «Повторить теорию»;
 *   — шпаргалки уроков ссылаются на существующие карточки;
 *   — все формулы и тексты набираются KaTeX в строгом режиме, в
 *     формулах нет «1x», «+ −» и лишних скобок (гигиена банка).
 *
 * Тексты справочника отдаются наружу (tekstyTeorii): автотест сверяет
 * их со сторонним справочником — не больше восьми слов подряд.
 */

import {
  KARTOCHKI_1,
  RAZDELY_TEORII_1,
  SHPARGALKI_1,
  kartochkaPrototipa,
} from '../../content/teoriya1';
import { typeset } from '../tex';
import { gigienaFormuly } from './bank/selftest';
import { BANK_FIPI } from './bank/fipi';
import { pustoyOtchet, renderPlan } from './render';
import { proveritPodpisi } from './selftest';
import { PROTOTIPY } from './stseny';
import { risunokTeorii } from './teoriya';
import { ZHIVYE } from './zhivye';

type Typeset = (tex: string) => string;

/** Все тексты справочника, которые видит ученик. */
export function tekstyTeorii(): string[] {
  const out: string[] = [];
  for (const r of RAZDELY_TEORII_1) {
    out.push(r.title, r.lead, ...r.zapomni);
    for (const k of r.kartochki) out.push(k.title, ...k.tekst);
    for (const f of r.fakty ?? []) out.push(f.title, f.tekst);
    for (const f of r.dlya17 ?? []) out.push(f.tekst);
  }
  return out;
}

function formuly(): string[] {
  const out: string[] = [];
  for (const r of RAZDELY_TEORII_1) {
    for (const k of r.kartochki) {
      if (k.formula !== undefined) out.push(k.formula);
      for (const row of [...(k.tablica?.head ?? []), ...(k.tablica?.rows.flat() ?? [])])
        for (const f of row.match(/\$[^$]+\$/g) ?? []) out.push(f.slice(1, -1));
    }
    for (const f of [...(r.fakty ?? []), ...(r.dlya17 ?? [])])
      if (f.formula !== undefined) out.push(f.formula);
  }
  return out;
}

function risunokChist(klyuch: string): string | null {
  try {
    const r = risunokTeorii(klyuch);
    const o = pustoyOtchet();
    const svg = renderPlan(r.scena, r.optsii, o);
    const p = [...o.problems, ...proveritPodpisi(o)];
    if (/NaN|Infinity/.test(svg)) p.push('NaN в SVG');
    return p.length === 0 ? null : p.join('; ');
  } catch (e) {
    return (e as Error).message;
  }
}

export interface ItogTeorii {
  kartochek: number;
  faktov: number;
  problems: string[];
}

export function checkTeoriya(katex: Typeset): ItogTeorii {
  const problems: string[] = [];
  const zhivye = new Set(ZHIVYE.map((z) => z.id));
  const ids = new Set<string>();
  let faktov = 0;

  for (const r of RAZDELY_TEORII_1) {
    for (const k of r.kartochki) {
      if (ids.has(k.id)) problems.push(`карточка «${k.id}» повторяется`);
      ids.add(k.id);
      if (k.risunok === undefined && k.zhivoy === undefined)
        problems.push(`карточка «${k.id}»: нет чертежа`);
      if (k.risunok !== undefined) {
        const p = risunokChist(k.risunok);
        if (p !== null) problems.push(`карточка «${k.id}», рисунок ${k.risunok}: ${p}`);
      }
      if (k.zhivoy !== undefined && !zhivye.has(k.zhivoy))
        problems.push(`карточка «${k.id}»: нет живого чертежа ${k.zhivoy}`);
      if (k.tekst.length < 1 || k.tekst.length > 3)
        problems.push(`карточка «${k.id}»: ${k.tekst.length} абзацев, нужно 1–3`);
      if (k.primer !== undefined) {
        const z = BANK_FIPI.find((x) => x.n === k.primer);
        if (z === undefined) problems.push(`карточка «${k.id}»: нет задачи ${k.primer} в банке`);
        else if (!k.prototipy.includes(z.proto))
          problems.push(
            `карточка «${k.id}»: пример — задача ${k.primer} прототипа ${z.proto}, его нет в «Где на ЕГЭ»`,
          );
      }
      for (const p of k.prototipy)
        if (!PROTOTIPY.some((x) => x.id === p))
          problems.push(`карточка «${k.id}»: нет прототипа ${p}`);
    }
    for (const f of r.fakty ?? []) {
      faktov += 1;
      const p = risunokChist(f.risunok);
      if (p !== null) problems.push(`факт ${f.no}, рисунок ${f.risunok}: ${p}`);
      if (f.prototipy.length === 0 && ![10, 12, 13, 16].includes(f.no))
        problems.push(`факт ${f.no}: нет прототипа`);
    }
  }

  for (const p of PROTOTIPY)
    if (kartochkaPrototipa(p.id) === null)
      problems.push(`прототип ${p.id}: ни одна карточка не ведёт на него («Повторить теорию»)`);

  for (const [u, spisok] of Object.entries(SHPARGALKI_1))
    for (const id of spisok)
      if (!ids.has(id)) problems.push(`шпаргалка урока ${u}: нет карточки «${id}»`);

  for (const f of formuly()) {
    try {
      katex(f);
    } catch (e) {
      problems.push(`формула «${f}»: ${(e as Error).message}`);
    }
    const g = gigienaFormuly(f);
    if (g !== null) problems.push(`формула «${f}»: ${g}`);
  }
  for (const t of tekstyTeorii()) {
    try {
      typeset(t, true);
    } catch (e) {
      problems.push(`текст «${t}»: ${(e as Error).message}`);
    }
  }
  return { kartochek: KARTOCHKI_1.length, faktov, problems };
}
