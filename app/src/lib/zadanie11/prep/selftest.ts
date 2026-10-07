/**
 * Самопроверка «Опорных задач» №11 (pnpm test:zadanie11): двенадцать
 * блоков по десять задач, разминка первая; на каждую микрозадачу —
 * зафиксированный вариант и seeds новых. Ответ — хорошее число или
 * номер верного варианта; варианты разные; у подсказок есть верная
 * кнопка; разбор кончается ответом; таблицы — по методике; формулы
 * набираются KaTeX; отпечаток узнаёт свой ответ.
 */

import { tekstyStroki } from '../proporciya/bloki';
import { nice } from '../num';
import { checkTablitsa, texPieces } from '../selftest';
import { answerMatches, choiceMatches } from '../secret';
import { BLOKI } from './bloki';
import { fixedSeed, generateMikro } from './generate';
import { sealMikro11 } from './seal';
import type { MikroZadacha } from './types';

interface Problem {
  where: string;
  what: string;
}

/** Все тексты микрозадачи: для KaTeX и поиска формул вне $…$. */
export function mikroTexts(z: MikroZadacha): string[] {
  const tab = [z.tablitsa, z.razborTablitsa].flatMap((t) =>
    t === undefined ? [] : [...t.head, ...t.rows.flat(), t.title ?? ''],
  );
  return [
    z.uslovie,
    ...z.razbor.flatMap(tekstyStroki),
    ...(z.vybory ?? []).map((v) => v.label),
    ...z.hints.flatMap((h) => [h.question, ...h.options, h.comment ?? '']),
    ...tab,
  ];
}

function checkMikro(where: string, z: MikroZadacha, typeset: (tex: string) => string): Problem[] {
  const out: Problem[] = [];
  if (z.answerType === 'number') {
    if (typeof z.otvet !== 'number' || !nice(z.otvet) || z.otvet <= 0) {
      out.push({ where, what: `ответ не положительное «хорошее» число: ${z.otvet}` });
    }
  } else {
    const v = z.vybory ?? [];
    const labels = v.map((x) => x.label);
    if (v.length < 3 || new Set(labels).size !== labels.length) {
      out.push({ where, what: 'вариантов меньше трёх или они повторяются' });
    }
    if (!v.some((x) => x.number === z.otvet)) {
      out.push({ where, what: `ответ ${z.otvet} не среди вариантов` });
    }
  }
  if (z.hints.length === 0) {
    out.push({ where, what: 'нет подсказки' });
  }
  for (const h of z.hints) {
    if (h.correct < 0 || h.correct >= h.options.length || h.options.length < 2) {
      out.push({ where, what: `у подсказки «${h.question}» нет верного варианта` });
    }
    if (new Set(h.options).size !== h.options.length) {
      out.push({ where, what: `варианты подсказки повторяются: ${h.options.join(' | ')}` });
    }
  }
  if (!/^\*\*Ответ:\*\*/.test(z.razbor.at(-1) ?? '')) {
    out.push({ where, what: 'разбор не кончается ответом' });
  }
  for (const t of [z.tablitsa, z.razborTablitsa]) {
    if (t !== undefined) {
      out.push(...checkTablitsa(where, t));
    }
  }
  for (const text of mikroTexts(z)) {
    if (/⇔|\\Leftrightarrow|\\iff|равносил/i.test(text)) {
      out.push({ where, what: `знак равносильности: ${text.slice(0, 60)}` });
    }
    const pieces = texPieces(text);
    if (pieces === null) {
      out.push({ where, what: `непарный $: ${text.slice(0, 60)}` });
      continue;
    }
    for (const tex of pieces) {
      try {
        typeset(tex);
      } catch (e) {
        out.push({
          where,
          what: `KaTeX: ${(e as Error).message.slice(0, 60)} в «${tex.slice(0, 50)}»`,
        });
      }
    }
  }
  return out;
}

export function checkPrep(seeds: number, typeset: (tex: string) => string) {
  const problems: Problem[] = [];
  const texts: { where: string; text: string }[] = [];
  let generated = 0;
  if (BLOKI.length !== 12 || BLOKI[0]?.razdel !== 'RZ') {
    problems.push({ where: 'опорные', what: 'блоков не 12 или разминка не первая' });
  }
  const ids = new Set<string>();
  for (const b of BLOKI) {
    if (b.zadachi.length !== 10) {
      problems.push({ where: b.id, what: `задач ${b.zadachi.length}, а не 10` });
    }
    if (/\$|\\/.test(b.nazvanie)) {
      problems.push({ where: b.id, what: 'формула в названии блока' });
    }
    for (const line of [b.lead, ...b.zapomni]) {
      texts.push({ where: `${b.id} запомни`, text: line });
      for (const tex of texPieces(line) ?? []) {
        try {
          typeset(tex);
        } catch (e) {
          problems.push({ where: b.id, what: `KaTeX: ${(e as Error).message.slice(0, 60)}` });
        }
      }
    }
    for (const m of b.zadachi) {
      if (ids.has(m.id)) {
        problems.push({ where: m.id, what: 'повтор идентификатора' });
      }
      ids.add(m.id);
      const variants = new Set<string>();
      for (const seed of [fixedSeed(m), ...Array.from({ length: seeds }, (_, i) => String(i))]) {
        const where = `${m.id} seed ${seed}`;
        let z: MikroZadacha;
        try {
          z = generateMikro(m.id, seed);
        } catch (e) {
          problems.push({ where, what: (e as Error).message });
          continue;
        }
        generated += 1;
        variants.add(z.uslovie + JSON.stringify(z.tablitsa ?? null));
        problems.push(...checkMikro(where, z, typeset));
        texts.push(...mikroTexts(z).map((text) => ({ where, text })));
      }
      if (seeds >= 20 && variants.size < 3) {
        problems.push({ where: m.id, what: `всего ${variants.size} разных вариантов` });
      }
      /* Отпечаток зафиксированного варианта узнаёт свой ответ. */
      const z = generateMikro(m.id, fixedSeed(m));
      const s = sealMikro11(m, fixedSeed(m));
      const ok =
        z.answerType === 'number'
          ? answerMatches(String(z.otvet).replace('.', ','), s.seal)
          : choiceMatches(String(z.otvet), s.seal);
      if (!ok) {
        problems.push({ where: m.id, what: 'отпечаток не узнаёт ответ' });
      }
    }
  }
  return { problems, texts, generated };
}
