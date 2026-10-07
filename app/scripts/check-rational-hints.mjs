#!/usr/bin/env node
/* scripts/check-rational-hints.mjs — подсказки тренажёра «Гипербола».

   Строит все наборы подтемы (опорные и прототипы) на серии seed и для
   каждой задачи проверяет подсказку (lib/graph/hints-rational.js):

     1. Шаги те же, что в полном решении листа учителя: номер и
        название шага подсказки совпадают с шагом решения.
     2. Порядок шагов по записи функции: k/x + a — вверх-вниз → k;
        k/(x + a) — влево-вправо → k; k/(x + a) + b — вверх-вниз →
        влево-вправо → k; (kx + a)/(x + b) — вверх-вниз (k) →
        влево-вправо (b) → a; гипербола и прямая — k → прямая →
        уравнение → ОДЗ → квадратное уравнение → корни → отбор корней →
        ордината.
     3. В каждом вопросе с кнопками верный вариант ровно один, и он
        совпадает с ключом, посчитанным здесь заново по чертежу
        (сдвиг, знак в знаменателе, корень); неверные с верным не
        совпадают, у каждого неверного есть пояснение.
     4. Поля шагов: ключ — коэффициент или ответ задачи.
     5. Подсказка кончается на шаге, где найдено то, о чём спрашивают.

   Запуск: pnpm test:rational-hints [--seeds N]   (по умолчанию 40) */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../src/lib/graph/generate.js';
import Hints from '../src/lib/graph/hints-rational.js';
import Solution from '../src/lib/graph/solution-rational.js';

const args = process.argv.slice(2);
const seeds = args.includes('--seeds') ? Number(args[args.indexOf('--seeds') + 1]) : 40;

const ROOT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'lib',
  'graph',
  'data',
);
function readSets(dir) {
  const full = path.join(ROOT, dir);
  return fs
    .readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')));
}

const PREP = readSets(path.join('prep', '12r'));
const PROTO = readSets(path.join('prototypes', '12r'));
generator.setSets({ prep: PREP, prototypes: PROTO });

const val = (e) => e.p / e.q;

/* Ключи полей и кнопок («2», «-0,5», «-1/3») сверяются как числа:
   здесь ожидаемое значение — просто число строкой. */
function plain(value) {
  return String(value);
}
function parse(text) {
  const clean = String(text).replace(',', '.');
  const parts = clean.split('/');
  return parts.length === 2 ? Number(parts[0]) / Number(parts[1]) : Number(clean);
}
function same(a, b) {
  return Math.abs(parse(a) - parse(b)) < 1e-9;
}
/* Ключ вида «a=-3», «x=-1/3» или «up 2»: буква или направление и число. */
function sameKey(a, b) {
  const sep = String(a).includes('=') ? '=' : ' ';
  const [na, va] = String(a).split(sep);
  const [nb, vb] = String(b).split(sep);
  if (va === undefined || vb === undefined) {
    return a === b;
  }
  return na === nb && same(va, vb);
}

/* Ключ сдвига по чертежу: направление и величина. */
function shiftKey(value, plus, minus) {
  if (value === 0) {
    return 'none 0';
  }
  return (value > 0 ? plus : minus) + ' ' + plain(Math.abs(value));
}

/* Ожидаемые шаги подсказки по записи функции и вопросу задачи. */
function expectedIds(meta) {
  const { form, rule } = meta;
  if (form === 'line') {
    if (rule === 'line-a' || rule === 'line-b') {
      return ['line'];
    }
    return ['k', 'line', 'equation', 'odz', 'quadratic', 'roots', 'choose'].concat(
      meta.intersection.axis === 'y' ? ['ordinate'] : [],
    );
  }
  const chain = {
    basic: ['k'],
    'shift-y': ['horizontal', 'k'],
    'shift-x': ['vertical', 'k'],
    'shift-xy': ['horizontal', 'vertical', 'k'],
    linear: ['horizontal', 'vertical', 'k'],
  }[form];
  const askedAt = {
    'coef-k': form === 'linear' ? 'horizontal' : 'k',
    'coef-a': form === 'shift-y' ? 'horizontal' : form === 'linear' ? 'k' : 'vertical',
    'coef-b': form === 'linear' ? 'vertical' : 'horizontal',
  }[rule];
  if (askedAt !== undefined) {
    return chain.slice(0, chain.indexOf(askedAt) + 1);
  }
  return chain.concat(['answer']);
}

/* Ожидаемые ключи вопросов шага. */
function expectedAnswers(step, meta) {
  if (step.id === 'horizontal') {
    return [shiftKey(val(meta.t), 'up', 'down')];
  }
  if (step.id === 'vertical') {
    const name = meta.form === 'linear' ? 'b' : 'a';
    return [shiftKey(val(meta.s), 'right', 'left'), name + '=' + plain(-val(meta.s))];
  }
  if (step.id === 'choose') {
    return ['x=' + plain(val(meta.intersection.B.x))];
  }
  if (step.id === 'equation') {
    return ['eq'];
  }
  if (step.id === 'odz') {
    return ['x!=0'];
  }
  return [];
}

/* Ожидаемые ключи полей шага. */
function expectedFields(step, meta) {
  const co = Object.fromEntries(Object.entries(meta.coefficients).map(([n, e]) => [n, val(e)]));
  if (step.id === 'k' && meta.form === 'line') {
    return [plain(val(meta.m))];
  }
  if (step.id === 'k') {
    const name = meta.form === 'linear' ? 'a' : 'k';
    return [null, null, plain(co[name])];
  }
  if (step.id === 'answer') {
    return [plain(val(meta.answer))];
  }
  if (step.id === 'line') {
    const a = plain(val(meta.line.k));
    return meta.rule === 'line-a' ? [a] : [a, plain(val(meta.line.b))];
  }
  if (step.id === 'ordinate') {
    return [plain(val(meta.intersection.B.y))];
  }
  return null;
}

const problems = new Map();
function note(label, item) {
  if (!problems.has(label)) {
    problems.set(label, []);
  }
  const list = problems.get(label);
  if (list.length < 4) {
    list.push(item);
  }
}

let tasks = 0;
let questions = 0;
let buttons = 0;
const forms = new Set();
for (const set of PREP.concat(PROTO)) {
  for (let run = 0; run < seeds; run++) {
    const seed = run === 0 ? set.seed : set.seed * 1000 + run;
    let built;
    try {
      built = generator.generateSet(set.id, seed);
    } catch {
      continue;
    }
    for (const task of built) {
      tasks += 1;
      const meta = task.meta;
      forms.add(meta.form + ' · ' + meta.rule);
      const where = `${task.id} (seed ${seed})`;
      const hints = Hints.fromTask(task);
      const solution = Solution.fromTask(task);

      /* 1. Номер и название — как в полном решении. */
      hints.forEach((hint, i) => {
        const sol = solution[i];
        if (!sol || hint.number !== i + 1 || sol.number !== i + 1 || hint.title !== sol.title) {
          note('шаг подсказки не совпадает с шагом решения', `${where}: ${i + 1}. ${hint.title}`);
        }
      });

      /* 2 и 5. Порядок шагов и где подсказка кончается. */
      const ids = hints.map((hint) => hint.id).join(' → ');
      const want = expectedIds(meta).join(' → ');
      if (ids !== want) {
        note(`порядок шагов (${meta.form}, ${meta.rule})`, `${where}: ${ids} вместо ${want}`);
      }

      for (const hint of hints) {
        /* 3. Вопросы с кнопками. */
        if (hint.kind === 'questions') {
          const keys = expectedAnswers(hint, meta);
          if (hint.questions.length !== keys.length) {
            note('число вопросов в шаге', `${where}: ${hint.title}`);
          }
          hint.questions.forEach((question, qi) => {
            questions += 1;
            buttons += question.options.length;
            const rights = question.options.filter((option) => option.right);
            if (rights.length !== 1) {
              note(
                'верный вариант не один',
                `${where}: ${question.prompt} — верных ${rights.length}`,
              );
              return;
            }
            if (rights[0].key !== question.answer || !sameKey(question.answer, keys[qi])) {
              note(
                'верный вариант не совпадает с ключом',
                `${where}: «${rights[0].text}» (${rights[0].key}), ключ ${keys[qi]}`,
              );
            }
            const texts = question.options.map((option) => option.text);
            if (new Set(texts).size !== texts.length) {
              note('варианты повторяются', `${where}: ${texts.join(' / ')}`);
            }
            for (const option of question.options) {
              if (
                !option.right &&
                (option.key === question.answer || option.text === rights[0].text)
              ) {
                note('неверный вариант совпадает с верным', `${where}: ${option.text}`);
              }
              if (!option.right && !option.why) {
                note('у неверного варианта нет пояснения', `${where}: ${option.text}`);
              }
            }
            if (hint.id === 'vertical' && qi === 1 && val(meta.s) !== 0) {
              /* Ошибка знака — отдельное пояснение именно про неё. */
              const name = meta.form === 'linear' ? 'b' : 'a';
              const flipped = question.options.find((option) =>
                sameKey(option.key, name + '=' + plain(val(meta.s))),
              );
              if (!flipped || !/ошибка знака/.test(flipped.why || '')) {
                note('нет варианта с ошибкой знака и пояснения к нему', `${where}`);
              }
            }
          });
          const focus = { horizontal: 'horizontal', vertical: 'vertical' }[hint.id] ?? null;
          if ((hint.focus ?? null) !== focus) {
            note('подсветка асимптоты', `${where}: ${hint.title} → ${hint.focus}`);
          }
          if ((hint.id === 'horizontal' || hint.id === 'vertical') && !hint.reminder) {
            note('нет напоминания на шаге сдвига', `${where}: ${hint.title}`);
          }
        }

        /* 4. Поля. */
        if (hint.kind === 'fields') {
          const want = expectedFields(hint, meta);
          const got = hint.fields.map((field) => field.answer);
          if (want !== null) {
            const ok =
              want.length === got.length && want.every((w, i) => w === null || same(w, got[i]));
            if (!ok) {
              note(
                'ключ поля',
                `${where}: ${hint.title}: ${got.join(', ')} вместо ${want.join(', ')}`,
              );
            }
          }
          if (hint.id === 'k' && meta.form !== 'line') {
            /* Координаты — одной из отмеченных точек. */
            const marks = meta.points.filter((p) => p.role === 'mark');
            const ok =
              (hint.variants || []).length === marks.length &&
              marks.every(
                (p, i) =>
                  same(hint.variants[i][0], plain(p.x)) && same(hint.variants[i][1], plain(p.y)),
              );
            if (!ok) {
              note('координаты точки в шаге k', `${where}`);
            }
          }
          if (!hint.after || hint.after.length === 0) {
            note('после шага нет вычисления', `${where}: ${hint.title}`);
          }
        }
      }
    }
  }
}

console.log(
  `Подсказки «Гипербола»: задач ${tasks}, типов ${forms.size}, вопросов с кнопками ${questions}, кнопок ${buttons}.`,
);
if (problems.size > 0) {
  console.error(`\nПодсказки (${problems.size}):`);
  for (const [label, list] of problems) {
    console.error('  ✗ ' + label);
    list.forEach((item) => console.error('      ' + item));
  }
  process.exit(1);
}
console.log(
  'Шаги совпадают с решением, в каждом вопросе один верный вариант и он сходится с ключом.',
);
