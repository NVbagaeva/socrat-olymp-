/**
 * Самотест задания №11: банк, разминка, разборы и подсказки.
 *
 * Для каждой задачи из JSON: подтип существует, `solve` отрабатывает,
 * ответ совпадает с контрольным, он целый или конечная десятичная
 * дробь и положителен; каждая формула набирается KaTeX; разбор
 * кончается строкой «Ответ»; у каждого вопроса подсказки есть верный
 * вариант и варианты не повторяются. Проверка текста на «формулы
 * обычным текстом» — в скрипте (scripts/check-zadanie11.mjs).
 */

import { BANK, RAZMINKA } from './bank';
import { d, nice } from './num';
import { subtype } from './prototypes';
import type { BankItem, Solved } from './types';

export interface Problem {
  where: string;
  what: string;
}

/** Все строки задачи, которые видит ученик или учитель. */
export function allTexts(s: Solved): string[] {
  return [
    s.uslovie,
    ...s.etapy.flatMap((e) => [e.title, ...e.lines]),
    ...(s.table ? [...s.table.head, ...s.table.rows.flat()] : []),
    ...s.hints.flatMap((h) => [h.question, ...h.options, ...(h.comment ? [h.comment] : [])]),
    ...(s.vybor ? s.vybor.options : []),
  ];
}

/** Куски $…$ строки; нечётное число долларов — ошибка. */
export function texPieces(text: string): string[] | null {
  const parts = text.split('$');
  if (parts.length % 2 === 0) {
    return null;
  }
  return parts.filter((_, i) => i % 2 === 1);
}

export function checkSolved(where: string, s: Solved, typeset: (tex: string) => string): Problem[] {
  const problems: Problem[] = [];
  const add = (what: string) => problems.push({ where, what });

  if (!(s.answer > 0) || !nice(s.answer, 4)) {
    add(`ответ ${s.answer} — не положительное конечное десятичное`);
  }
  for (const text of allTexts(s)) {
    if (/NaN|undefined|Infinity|\[object/.test(text)) {
      add(`мусор в тексте: ${text.slice(0, 80)}`);
    }
    const pieces = texPieces(text);
    if (pieces === null) {
      add(`непарный $: ${text.slice(0, 80)}`);
      continue;
    }
    for (const tex of pieces) {
      try {
        typeset(tex);
      } catch (e) {
        add(`KaTeX: ${(e as Error).message.slice(0, 80)} в «${tex.slice(0, 60)}»`);
      }
    }
  }
  if (s.etapy.length < 3) {
    add('в разборе меньше трёх этапов');
  }
  s.etapy.forEach((e, i) => {
    if (!e.title.startsWith(`Шаг ${i + 1}. `)) {
      add(`этап ${i + 1} без подписи «Шаг ${i + 1}.»: ${e.title}`);
    }
  });
  const last = s.etapy.at(-1)?.lines.at(-1) ?? '';
  if (!last.includes('Ответ') || !last.includes(`$${d(s.answer)}$`)) {
    if (!s.vybor) {
      add(`разбор не кончается ответом ${d(s.answer)}: ${last}`);
    }
  }
  if (s.hints.length < 2) {
    add('меньше двух шагов подсказки');
  }
  s.hints.forEach((h, i) => {
    if (h.options.length < 2 || new Set(h.options).size !== h.options.length) {
      add(`подсказка ${i + 1}: варианты повторяются или их меньше двух`);
    }
    if (h.correct < 0 || h.correct >= h.options.length) {
      add(`подсказка ${i + 1}: нет верного варианта`);
    }
  });
  if (s.table) {
    for (const row of s.table.rows) {
      if (row.length !== s.table.head.length) {
        add('строка таблицы не совпадает по длине с шапкой');
      }
    }
  }
  return problems;
}

/** Проверка задач из JSON (банк или разминка). */
export function checkItems(
  items: BankItem[],
  label: string,
  typeset: (tex: string) => string,
): { checked: number; problems: Problem[]; solved: Array<{ where: string; s: Solved }> } {
  const problems: Problem[] = [];
  const solved: Array<{ where: string; s: Solved }> = [];
  const seen = new Set<string>();
  items.forEach((item, i) => {
    const where = `${label} #${i + 1} ${item.id} ${JSON.stringify(item.params)}`;
    const key = item.id + JSON.stringify(item.params);
    if (seen.has(key)) {
      problems.push({ where, what: 'задача повторяется' });
    }
    seen.add(key);
    let s: Solved;
    try {
      s = subtype(item.id).solve(item.params);
    } catch (e) {
      problems.push({ where, what: `solve упал: ${(e as Error).message}` });
      return;
    }
    if (Math.abs(s.answer - item.answer) > 1e-9) {
      problems.push({ where, what: `ответ solve ${s.answer} ≠ ответ банка ${item.answer}` });
    }
    problems.push(...checkSolved(where, s, typeset));
    solved.push({ where, s });
  });
  return { checked: items.length, problems, solved };
}

export function checkBank(typeset: (tex: string) => string) {
  return checkItems(BANK, 'банк', typeset);
}

export function checkRazminka(typeset: (tex: string) => string) {
  return checkItems(RAZMINKA, 'разминка', typeset);
}
