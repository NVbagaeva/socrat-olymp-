/**
 * Самопроверка генераторов и банка задания №8.
 *
 * Запускается служебным скриптом scripts/check-vychisleniya.mjs; в
 * браузер не попадает. Проверяет то, что обещано таксономии: ответ
 * всегда целый или конечная десятичная дробь, условие набирается
 * KaTeX, разбор заканчивается ответом, у банка ровно десять разных
 * вариантов на прототип, отпечатки разных ответов не совпадают.
 */

import { BANK } from './bank';
import { generate, hasLevel } from './generate';
import { nice, round9, ru } from './numbers';
import { PROTOTYPES } from './prototypes';
import { sealAnswer } from './secret';
import { SKILLS } from './skills';
import type { Generated, Level } from './types';

export interface Problem {
  where: string;
  what: string;
}

export interface Report {
  prototypes: number;
  generated: number;
  problems: Problem[];
}

/** Формулы условия и разбора: всё между долларами. */
function formulas(task: Generated): string[] {
  const out: string[] = [];
  for (const text of [task.uslovie, ...task.razbor]) {
    for (const match of text.matchAll(/\$([^$]+)\$/g)) {
      out.push(match[1] as string);
    }
  }
  return out;
}

/** Проверка одной задачи; typeset — набор KaTeX, если он есть. */
export function checkTask(task: Generated, typeset: ((tex: string) => void) | null): Problem[] {
  const where = `${task.prototype} (${task.podtip}) seed=${task.seed}`;
  const problems: Problem[] = [];
  if (!Number.isFinite(task.otvet)) {
    problems.push({ where, what: `ответ не число: ${String(task.otvet)}` });
  } else if (!nice(task.otvet, 3)) {
    problems.push({ where, what: `ответ не целый и не конечная десятичная дробь: ${task.otvet}` });
  }
  if (!Number.isFinite(task.proverka) || Math.abs(task.proverka - task.otvet) > 1e-6) {
    problems.push({ where, what: `независимый счёт ${task.proverka} не сходится с ответом ${task.otvet}` });
  }
  if (Math.abs(task.otvet) > 10000) {
    problems.push({ where, what: `ответ слишком велик: ${task.otvet}` });
  }
  const last = task.razbor[task.razbor.length - 1] ?? '';
  const answerText = ru(task.otvet);
  const tail = last.replace(/\{,\}/g, ',').replace(/\s/g, '');
  if (!tail.includes(answerText)) {
    problems.push({ where, what: `разбор не заканчивается ответом ${answerText}: ${last}` });
  }
  if (/\d+[,.]\d{4,}/.test(task.uslovie.replace(/\{,\}/g, ','))) {
    problems.push({ where, what: `длинный хвост в условии: ${task.uslovie}` });
  }
  if (/NaN|Infinity|undefined/.test(task.uslovie + task.razbor.join(''))) {
    problems.push({ where, what: 'NaN или undefined в тексте' });
  }
  if (typeset !== null) {
    for (const tex of formulas(task)) {
      try {
        typeset(tex);
      } catch (error) {
        problems.push({ where, what: `KaTeX не принял «${tex}»: ${String(error)}` });
      }
    }
  }
  return problems;
}

/** Генераторы на многих seed: каждый прототип, каждый уровень. */
export function checkGenerators(seedsPerLevel: number, typeset: ((tex: string) => void) | null): Report {
  const problems: Problem[] = [];
  let generated = 0;
  for (const prototype of PROTOTYPES) {
    const levels: (Level | null)[] = [null, 'base', 'advanced'].filter(
      (level) => level === null || hasLevel(prototype, level as Level),
    ) as (Level | null)[];
    for (const level of levels) {
      const seen = new Map<string, number>();
      for (let i = 0; i < seedsPerLevel; i += 1) {
        const seed = `t${i}`;
        let task: Generated;
        try {
          task = generate(prototype.id, seed, level);
        } catch (error) {
          problems.push({ where: `${prototype.id} level=${String(level)} seed=${seed}`, what: String(error) });
          continue;
        }
        generated += 1;
        if (level !== null && task.level !== level) {
          problems.push({ where: `${prototype.id} seed=${seed}`, what: `просили уровень ${level}, получили ${task.level}` });
        }
        problems.push(...checkTask(task, typeset));
        seen.set(task.uslovie, (seen.get(task.uslovie) ?? 0) + 1);
      }
      /* Разнообразие: на многих seed не должно быть одного условия чаще
         чем в четверти случаев — иначе тренажёр повторяется. */
      const max = Math.max(...seen.values());
      if (seedsPerLevel >= 100 && max > seedsPerLevel / 4) {
        problems.push({ where: `${prototype.id} level=${String(level)}`, what: `одно условие повторилось ${max} раз из ${seedsPerLevel}` });
      }
    }
  }
  return { prototypes: PROTOTYPES.length, generated, problems };
}

/** Банк: десять seed на прототип, разные условия, отпечатки. */
export function checkBank(typeset: ((tex: string) => void) | null): Report {
  const problems: Problem[] = [];
  let generated = 0;
  const seals = new Map<string, string>();
  for (const prototype of PROTOTYPES) {
    const entry = BANK.find((item) => item.prototype === prototype.id);
    if (entry === undefined) {
      problems.push({ where: prototype.id, what: 'нет в банке' });
      continue;
    }
    if (entry.variants.length !== 10) {
      problems.push({ where: prototype.id, what: `в банке ${entry.variants.length} вариантов, а не 10` });
    }
    const statements = new Set<string>();
    const signatures = new Set<string>();
    const answers = new Map<string, number>();
    let base = 0;
    for (const variant of entry.variants) {
      const task = generate(prototype.id, variant.seed, variant.level);
      generated += 1;
      problems.push(...checkTask(task, typeset));
      if (statements.has(task.uslovie)) {
        problems.push({ where: `${prototype.id} seed=${variant.seed}`, what: 'условие повторяет другой вариант банка' });
      }
      statements.add(task.uslovie);
      const signature = `${task.podtip}|${task.signature ?? ''}`;
      if (task.signature !== undefined && signatures.has(signature)) {
        problems.push({ where: `${prototype.id} seed=${variant.seed}`, what: `подпись «${task.signature}» уже есть в банке` });
      }
      signatures.add(signature);
      const key = ru(task.otvet);
      answers.set(key, (answers.get(key) ?? 0) + 1);
      if (task.level === 'base') {
        base += 1;
      }
      const seal = sealAnswer(task.otvet);
      const taken = seals.get(seal);
      if (taken !== undefined && taken !== String(round9(task.otvet))) {
        problems.push({ where: `${prototype.id} seed=${variant.seed}`, what: `столкновение отпечатков: ${taken} и ${task.otvet}` });
      }
      seals.set(seal, String(round9(task.otvet)));
    }
    for (const [answer, count] of answers) {
      if (count > 3) {
        problems.push({ where: prototype.id, what: `ответ ${answer} встречается ${count} раза в банке` });
      }
    }
    if (hasLevel(prototype, 'base') && hasLevel(prototype, 'advanced') && (base < 5 || base > 7)) {
      problems.push({ where: prototype.id, what: `базовых вариантов в банке ${base}, ожидается 5–7` });
    }
  }
  for (const skill of SKILLS) {
    for (const id of skill.prototypes) {
      if (!PROTOTYPES.some((p) => p.id === id)) {
        problems.push({ where: skill.id, what: `навык ссылается на несуществующий прототип ${id}` });
      }
    }
  }
  const covered = new Set(SKILLS.flatMap((s) => s.prototypes));
  for (const prototype of PROTOTYPES) {
    if (!covered.has(prototype.id)) {
      problems.push({ where: prototype.id, what: 'прототип не входит ни в один навык' });
    }
  }
  return { prototypes: PROTOTYPES.length, generated, problems };
}
