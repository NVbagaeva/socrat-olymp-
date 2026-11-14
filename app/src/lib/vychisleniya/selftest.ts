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
import { PREP_BLOCKS } from './prep/blocks';
import { fixedSeed, generatePrep } from './prep/generate';
import { PROTOTYPES } from './prototypes';
import { normalizeAnswer } from '../otvet';
import { PROTOTYPE_NAMES } from './ids';
import { PRIZNAKI } from './priznaki';
import { answerRecord, readSealed, sealAnswer } from './secret';
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

/** Формулы условия и решения: всё между долларами и выкладки шагов. */
function formulas(task: Generated): string[] {
  const out: string[] = [];
  const steps = Array.isArray(task.razbor) ? task.razbor : [];
  const texts = [task.uslovie, ...steps.map((step) => (typeof step?.chto === 'string' ? step.chto : String(step)))];
  for (const text of texts) {
    for (const match of text.matchAll(/\$([^$]+)\$/g)) {
      out.push(match[1] as string);
    }
  }
  for (const step of steps) {
    if (typeof step?.tex === 'string') out.push(step.tex);
  }
  return out;
}

/**
 * Решение по шагам — то, что обещано разделу: у каждого шага подпись
 * «что делаем и почему» и выкладка, шагов не меньше двух, последний
 * кончается ответом. Подпись — с большой буквы, без точки в конце, не
 * «перемножим всё».
 */
function checkSteps(task: Generated, where: string, problems: Problem[]): void {
  if (!Array.isArray(task.razbor) || task.razbor.length < 2) {
    problems.push({ where, what: `в решении меньше двух шагов` });
    return;
  }
  for (const [i, step] of task.razbor.entries()) {
    if (typeof step !== 'object' || step === null || typeof step.chto !== 'string' || typeof step.tex !== 'string') {
      problems.push({ where, what: `шаг ${i + 1} не в формате {chto, tex}` });
      continue;
    }
    const chto = step.chto.trim();
    if (chto.replace(/\$[^$]*\$/g, '').trim().length < 10) {
      problems.push({ where, what: `шаг ${i + 1}: подпись без слов «что делаем и почему»: «${chto}»` });
    }
    if (!/^[А-ЯЁ]/.test(chto)) {
      problems.push({ where, what: `шаг ${i + 1}: подпись не с большой буквы: «${chto}»` });
    }
    if (/[.]$/.test(chto)) {
      problems.push({ where, what: `шаг ${i + 1}: подпись с точкой в конце: «${chto}»` });
    }
    if (/перемнож\S* всё|посчитаем всё/i.test(chto)) {
      problems.push({ where, what: `шаг ${i + 1}: «перемножим всё» вместо приёма: «${chto}»` });
    }
    if (step.tex.trim() === '' || step.tex.includes('$')) {
      problems.push({ where, what: `шаг ${i + 1}: выкладка пустая или с долларами` });
    }
  }
  for (const priznak of task.delimost ?? []) {
    if (PRIZNAKI[priznak] === undefined) {
      problems.push({ where, what: `неизвестный признак делимости ${priznak}` });
    }
  }
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
    problems.push({
      where,
      what: `независимый счёт ${task.proverka} не сходится с ответом ${task.otvet}`,
    });
  }
  if (Number.isFinite(task.otvet)) {
    /* Ответ сверяется точно, по нормальной записи: запись верного ответа
       должна быть записью бланка, а ответ, введённый как в бланке, —
       засчитываться. */
    const record = answerRecord(task.otvet);
    const normal = normalizeAnswer(record);
    if (!normal.ok || normal.value !== record) {
      problems.push({ where, what: `запись ответа ${record} не в формате бланка` });
    }
    const typed = ru(task.otvet);
    const reading = readSealed(typed, sealAnswer(task.otvet));
    if (reading.kind !== 'answer' || !reading.right) {
      problems.push({ where, what: `ответ «${typed}», введённый как в бланке, не засчитывается` });
    }
  }
  if (Math.abs(task.otvet) > 10000) {
    problems.push({ where, what: `ответ слишком велик: ${task.otvet}` });
  }
  checkSteps(task, where, problems);
  const last = String(task.razbor[task.razbor.length - 1]?.tex ?? '');
  const answerText = ru(task.otvet);
  const tail = last.replace(/\{,\}/g, ',').replace(/\s/g, '');
  if (!tail.endsWith(answerText)) {
    problems.push({ where, what: `решение не кончается ответом ${answerText}: ${last}` });
  }
  if (/\d+[,.]\d{4,}/.test(task.uslovie.replace(/\{,\}/g, ','))) {
    problems.push({ where, what: `длинный хвост в условии: ${task.uslovie}` });
  }
  if (/NaN|Infinity|undefined|\[object/.test(task.uslovie + JSON.stringify(task.razbor))) {
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
export function checkGenerators(
  seedsPerLevel: number,
  typeset: ((tex: string) => void) | null,
  only: readonly string[] | null = null,
): Report {
  const problems: Problem[] = [];
  let generated = 0;
  /* Лёгкий список названий (ids.ts) совпадает с прототипами. */
  for (const prototype of PROTOTYPES) {
    if (PROTOTYPE_NAMES[prototype.id] !== prototype.nazvanie) {
      problems.push({
        where: prototype.id,
        what: `название в ids.ts не совпадает с прототипом: ${prototype.nazvanie}`,
      });
    }
  }
  if (Object.keys(PROTOTYPE_NAMES).length !== PROTOTYPES.length) {
    problems.push({ where: 'ids.ts', what: 'в списке названий лишние или недостающие прототипы' });
  }
  for (const prototype of PROTOTYPES) {
    if (only !== null && !only.includes(prototype.id)) continue;
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
          problems.push({
            where: `${prototype.id} level=${String(level)} seed=${seed}`,
            what: String(error),
          });
          continue;
        }
        generated += 1;
        if (level !== null && task.level !== level) {
          problems.push({
            where: `${prototype.id} seed=${seed}`,
            what: `просили уровень ${level}, получили ${task.level}`,
          });
        }
        problems.push(...checkTask(task, typeset));
        seen.set(task.uslovie, (seen.get(task.uslovie) ?? 0) + 1);
      }
      /* Разнообразие: на многих seed не должно быть одного условия чаще
         чем в четверти случаев — иначе тренажёр повторяется. */
      const max = Math.max(...seen.values());
      if (seedsPerLevel >= 100 && max > seedsPerLevel / 4) {
        problems.push({
          where: `${prototype.id} level=${String(level)}`,
          what: `одно условие повторилось ${max} раз из ${seedsPerLevel}`,
        });
      }
    }
  }
  return { prototypes: PROTOTYPES.length, generated, problems };
}

/** Банк: десять seed на прототип, разные условия, отпечатки. */
export function checkBank(
  typeset: ((tex: string) => void) | null,
  only: readonly string[] | null = null,
): Report {
  const problems: Problem[] = [];
  let generated = 0;
  const seals = new Map<string, string>();
  for (const prototype of PROTOTYPES) {
    if (only !== null && !only.includes(prototype.id)) continue;
    const entry = BANK.find((item) => item.prototype === prototype.id);
    if (entry === undefined) {
      problems.push({ where: prototype.id, what: 'нет в банке' });
      continue;
    }
    if (entry.variants.length !== 10) {
      problems.push({
        where: prototype.id,
        what: `в банке ${entry.variants.length} вариантов, а не 10`,
      });
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
        problems.push({
          where: `${prototype.id} seed=${variant.seed}`,
          what: 'условие повторяет другой вариант банка',
        });
      }
      statements.add(task.uslovie);
      const signature = `${task.podtip}|${task.signature ?? ''}`;
      if (task.signature !== undefined && signatures.has(signature)) {
        problems.push({
          where: `${prototype.id} seed=${variant.seed}`,
          what: `подпись «${task.signature}» уже есть в банке`,
        });
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
        problems.push({
          where: `${prototype.id} seed=${variant.seed}`,
          what: `столкновение отпечатков: ${taken} и ${task.otvet}`,
        });
      }
      seals.set(seal, String(round9(task.otvet)));
    }
    for (const [answer, count] of answers) {
      if (count > 3) {
        problems.push({
          where: prototype.id,
          what: `ответ ${answer} встречается ${count} раза в банке`,
        });
      }
    }
    if (hasLevel(prototype, 'base') && hasLevel(prototype, 'advanced') && (base < 5 || base > 7)) {
      problems.push({
        where: prototype.id,
        what: `базовых вариантов в банке ${base}, ожидается 5–7`,
      });
    }
  }
  for (const skill of SKILLS) {
    for (const id of skill.prototypes) {
      if (!PROTOTYPES.some((p) => p.id === id)) {
        problems.push({
          where: skill.id,
          what: `навык ссылается на несуществующий прототип ${id}`,
        });
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

/** Решение микро-задачи: шаги того же вида, что у тренажёра, но шаг может быть один. */
function checkPrepSteps(razbor: unknown, where: string, problems: Problem[]): void {
  if (!Array.isArray(razbor) || razbor.length === 0) {
    problems.push({ where, what: 'решение не по шагам {chto, tex}' });
    return;
  }
  for (const [i, step] of (razbor as unknown[]).entries()) {
    const s = step as { chto?: unknown; tex?: unknown } | null;
    if (typeof s?.chto !== 'string' || typeof s?.tex !== 'string') {
      problems.push({ where, what: `шаг ${i + 1} не в формате {chto, tex}` });
      continue;
    }
    const chto = s.chto.trim();
    if (chto.replace(/\$[^$]*\$/g, '').trim().length < 10 || !/^[А-ЯЁ]/.test(chto) || /[.]$/.test(chto)) {
      problems.push({ where, what: `шаг ${i + 1}: подпись «что делаем и почему» не по правилам: «${chto}»` });
    }
    if (s.tex.trim() === '' || s.tex.includes('$')) {
      problems.push({ where, what: `шаг ${i + 1}: выкладка пустая или с долларами` });
    }
  }
}

/** Подготовка: пятьдесят микро-задач на многих seed и их зафиксированные варианты. */
export function checkPrep(seedsPerTask: number, typeset: ((tex: string) => void) | null): Report {
  const problems: Problem[] = [];
  let generated = 0;
  const ids = new Set<string>();
  for (const block of PREP_BLOCKS) {
    if (block.zadachi.length !== 10) {
      problems.push({ where: block.id, what: `в блоке ${block.zadachi.length} задач, а не 10` });
    }
    block.zadachi.forEach((micro, i) => {
      const expected = `${block.id}-${String(i + 1).padStart(2, '0')}`;
      if (micro.id !== expected || ids.has(micro.id)) {
        problems.push({ where: micro.id, what: `ожидался идентификатор ${expected}` });
      }
      ids.add(micro.id);
      if (typeset !== null) {
        try {
          typeset(micro.formula);
        } catch (error) {
          problems.push({
            where: micro.id,
            what: `KaTeX не принял формулу-подсказку: ${String(error)}`,
          });
        }
      }
      const seeds = [fixedSeed(micro), ...Array.from({ length: seedsPerTask }, (_, k) => `t${k}`)];
      for (const seed of seeds) {
        const where = `${micro.id} seed=${seed}`;
        let task;
        try {
          task = generatePrep(micro.id, seed);
        } catch (error) {
          problems.push({ where, what: String(error) });
          continue;
        }
        generated += 1;
        if (micro.answerType === 'number') {
          if (typeof task.otvet !== 'number' || !nice(task.otvet, 3)) {
            problems.push({
              where,
              what: `ответ не целый и не конечная десятичная дробь: ${String(task.otvet)}`,
            });
          }
          if (
            task.proverka === null ||
            typeof task.otvet !== 'number' ||
            Math.abs(task.proverka - task.otvet) > 1e-6
          ) {
            problems.push({
              where,
              what: `независимый счёт ${String(task.proverka)} не сходится с ответом ${String(task.otvet)}`,
            });
          }
          const lastTex = String(task.razbor[task.razbor.length - 1]?.tex ?? '');
          const tail = lastTex.replace(/\{,\}/g, ',').replace(/\s/g, '');
          if (typeof task.otvet === 'number' && !tail.endsWith(ru(task.otvet))) {
            problems.push({
              where,
              what: `решение не кончается ответом ${ru(task.otvet)}: ${lastTex}`,
            });
          }
        } else if (!(micro.choices ?? []).some((c) => c.number === task.otvet)) {
          problems.push({
            where,
            what: `ответ-выбор ${String(task.otvet)} не из списка вариантов`,
          });
        }
        if (/NaN|Infinity|undefined|\[object/.test(task.uslovie + JSON.stringify(task.razbor))) {
          problems.push({ where, what: 'NaN или undefined в тексте' });
        }
        checkPrepSteps(task.razbor, where, problems);
        if (typeset !== null) {
          const steps = Array.isArray(task.razbor) ? task.razbor : [];
          for (const step of steps) {
            if (typeof step?.tex !== 'string') continue;
            try {
              typeset(step.tex);
            } catch (error) {
              problems.push({ where, what: `KaTeX не принял «${step.tex}»: ${String(error)}` });
            }
          }
          for (const text of [task.uslovie, ...steps.map((step) => String(step?.chto ?? step))]) {
            for (const match of text.matchAll(/\$([^$]+)\$/g)) {
              try {
                typeset(match[1] as string);
              } catch (error) {
                problems.push({
                  where,
                  what: `KaTeX не принял «${match[1] as string}»: ${String(error)}`,
                });
              }
            }
          }
        }
      }
    });
  }
  return { prototypes: ids.size, generated, problems };
}
