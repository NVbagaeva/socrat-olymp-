#!/usr/bin/env node
/* scripts/komplekt-12/sobrat.mjs — бесплатный комплект №1 для учителей:
   самостоятельная по заданию 12 «Линейная функция» в нескольких
   вариантах, лист учителя с таблицей ответов и краткими решениями,
   страница «Частые ошибки».

   Запуск:  pnpm build:komplekt-12
   Готовые файлы — в app/pdf-private/komplekt-12/ (папка вне
   репозитория: в комплекте есть ответы, а репозиторий публичный).

   Что здесь своего: выбор задач по правилу «во всём комплекте прямые
   и ответы разные, кроме вынужденных повторов», подпись варианта,
   строка для фамилии, подвал комплекта, таблица ответов «варианты × задачи» и страница
   «Частые ошибки». Условия, чертежи, ответы и краткие решения —
   только из движка graph/ и шаблона lib/sheet/, банк не трогается.

   Настройки — переменными окружения, все необязательны:
     SOSTAV    сколько задач из какого набора: "12.A:2,12.B:2,12.C:2,12.D:2"
     VARIANTS  число вариантов, по умолчанию 4
     LAYOUT    раскладка листа ученика: double-side (по умолчанию),
               double или single
     CELL      клетка чертежа в мм, по умолчанию 3
     LEVEL     уровень задач: lucky (по умолчанию) или unlucky
     MAKS_POVTOR_OTVETOV  сколько ответов может повториться между
               наборами, по умолчанию 3
     MAKS_POVTOR_PRYAMYH  сколько прямых может повториться половиной
               пары, по умолчанию 2

   Вынужденные повторы (решение автора 01.10.2026). При составе
   12.A:2, 12.B:2, 12.C:2, 12.D:2 без повторов комплект не собирается:
   у 12.C уровня «Базовая» 8 разных ответов на 8 задач (±7, ±11, ±13,
   ±14), он берёт все; у 12.D 9 ответов, из них ±13 и ±14 заняты 12.C,
   свободных 5 (±15, ±9,5, 12) на 8 задач — минимум 3 повтора ответа.
   Восемь задач 12.D с разными прямыми и ответами не набираются вообще:
   прямая повторяется половиной пары. Принятый минимум — 3 ответа
   и 2 прямые; больше — сборка падает (MAKS_POVTOR_*), чтобы правка
   банка не ухудшила комплект молча. Состав без повторов — 12.A:3,
   12.B:2, 12.C:2, 12.D:1, см. docs/tasks/12-lineynaya-pozzhe.md. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import generator from '../../src/lib/graph/generate.js';
import solutionBuilder from '../../src/lib/graph/solution.js';
import sheet from '../../src/lib/sheet/sheet.js';
import { answersItems } from '../../src/lib/sheet/answers12.js';
import typo from '../../src/lib/sheet/typography.js';
import content from '../../src/content/sheet12.js';
import { chromium } from 'playwright';
import { renderPdf } from '../lib/sheet-render.mjs';
import * as oshibki from './chastye-oshibki.mjs';

/* Названия блоков — как у навыков генератора (content/skills12.ts;
   тот файл на TypeScript, и Node его не читает). */
const skillTitle = {
  '12.A': 'Значение функции',
  '12.B': 'Аргумент по значению',
  '12.C': 'Абсцисса пересечения',
  '12.D': 'Ордината пересечения',
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(HERE, '..', '..');
const OUT = process.env.OUT || path.join(APP, 'pdf-private', 'komplekt-12');
const VARIANTS = Number(process.env.VARIANTS || 4);
const LAYOUT = process.env.LAYOUT || 'double-side';
const CELL = Number(process.env.CELL || 3);
const LEVEL = process.env.LEVEL || 'lucky';
const RAZNYE = process.env.RAZNYE !== '0';
/* Без полос-заголовков блоков, «Вариант N» и строка для фамилии
   в одну строку: так восемь задач встают на одну страницу.
   KOMPAKT=0 возвращает полосы блоков и отдельную шапку варианта. */
const KOMPAKT = process.env.KOMPAKT !== '0';
/* Ряд карточек с чертежом на окно ±8 (16 клеток, 48 мм при клетке
   3 мм) выше ряда с окном ±5 или ±6. Восемь задач встают на страницу,
   только если таких рядов не больше двух: KRUPNYH — сколько рядов
   с крупным чертежом допускается в варианте, KRUPNOE_OKNO — с какого
   окна чертёж считается крупным. Ряд — две задачи одного набора. */
const KRUPNYH = Number(process.env.KRUPNYH || 2);
/* Кегль условия и отступы карточки. В раскладке double-side колонка
   текста рядом с чертежом узкая (около 37 мм), длинное условие 12.C/12.D
   в кегле листа 10,5 pt занимает 10 строк и делает ряд выше чертежа.
   Кегль 9,5 pt и отступы поменьше возвращают высоту ряда чертежу. */
const KEGL = process.env.KEGL || '9.5pt';
/* Пробы раскладки (только для сравнения вариантов, в комплекте не
   используются): EXTRA_CSS — добавочные правила; NOMER=v-tekste —
   номер задачи внутри колонки текста, а не отдельным столбцом;
   STOPKA8=1 — у карточек с окном ±8 условие над чертежом. */
const EXTRA_CSS = process.env.EXTRA_CSS || '';
/* Запас по высоте: на каждой странице листа ученика до потолка
   пагинатора должно оставаться не меньше ZAPAS мм. Не хватает —
   в этом варианте задачи 12.A/12.B берутся с окном ±5 (лимит крупных
   рядов варианта уменьшается на один), и комплект подбирается заново. */
const ZAPAS = Number(process.env.ZAPAS || 3);
/* Охрана от молчаливого ухудшения: сколько ответов может повториться
   между наборами и сколько прямых — половиной пары. Принятый минимум
   при составе по умолчанию — 3 и 2 (решение автора 01.10.2026). */
const MAKS_POVTOR_OTVETOV = Number(process.env.MAKS_POVTOR_OTVETOV ?? 3);
const MAKS_POVTOR_PRYAMYH = Number(process.env.MAKS_POVTOR_PRYAMYH ?? 2);
/* Номер задачи. По умолчанию — в первой строке условия, текст его
   обтекает (NOMER=v-stroke): отдельный столбец с номером отнимал
   у колонки текста 9,5 мм, а рядом с чертежом ±8 тексту и так
   остаётся 26,8 мм из 89,9 мм колонки сетки. NOMER=stolbec — столбец
   слева, как на листе; NOMER=v-tekste — над условием. */
const NOMER = process.env.NOMER || 'v-stroke';
const STOPKA8 = process.env.STOPKA8 === '1';
/* Задачи банка, которые в комплект не берутся. 12.D-03/04 помечены
   в банке уровнем «Базовая», но b = ±7 у них за рамкой окна ±5,
   а k = ±2,5 — по определению уровня («b читается с графика, k целый»)
   это не «Базовая». В банке они не трогаются: решение об уровне —
   отдельно, с учётом истории решений учеников. */
const ISKLYUCHIT = new Set((process.env.ISKLYUCHIT || '12.D-03,12.D-04').split(',').map((s) => s.trim()).filter(Boolean));
const KRUPNOE_OKNO = Number(process.env.KRUPNOE_OKNO || 8);
const SOSTAV = (process.env.SOSTAV || '12.A:2,12.B:2,12.C:2,12.D:2').split(',').map((part) => {
  const [id, n] = part.split(':');
  return { id: id.trim(), count: Number(n) };
});

/* ── Банк ─────────────────────────────────────────────────── */
const DATA = path.join(APP, 'src', 'lib', 'graph', 'data');
const readSets = (dir) => fs.readdirSync(path.join(DATA, dir))
  .filter((name) => name.endsWith('.json')).sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(DATA, dir, name), 'utf8')));
const prep = readSets('prep/12');
const prototypes = readSets('prototypes/12');
generator.setSets({ prep, prototypes });
const rules = {};
for (const set of [...prep, ...prototypes]) {
  for (const task of set.tasks || []) { rules[task.id] = task.answerRule; }
}

/* ── Выбор задач ──────────────────────────────────────────────
   В комплекте не повторяются ни прямая (у пары — каждая из двух
   прямых по отдельности), ни ответ, кроме вынужденных повторов
   (см. шапку и ниже). Кандидаты — задачи нужного
   уровня на SEEDS разных seed; из них перебором с возвратом
   набираются все варианты сразу: жадный выбор по одному варианту
   заходит в тупик, когда ранний вариант забирает прямую или ответ,
   без которых поздний не соберётся.

   Ответы: сначала ищется набор, где ответ не повторяется нигде
   в комплекте. Если такого нет (у 12.C и 12.D разных ответов уровня
   «Базовая» ровно столько, сколько нужно, и часть у них общая),
   действует запасное правило: ответ не повторяется в своём наборе
   и в своём варианте, а каждый повтор печатается в отчёте. */
const SEEDS = Number(process.env.SEEDS || 60);
const lineKeys = (task) => (task.meta.lines || [task.meta]).map((line) => `${line.k}@${line.b}`);
const lineKey = (task) => lineKeys(task).join('|');
const isBig = (task) => Boolean(task.meta.window) && task.meta.window.xmax >= KRUPNOE_OKNO;

function poolOf(setId) {
  const set = prototypes.find((item) => item.id === setId);
  if (!set) { throw new Error(`набор ${setId} не найден`); }
  if (!set.tasks.some((task) => task.level === LEVEL)) { throw new Error(`${setId}: нет задач уровня ${LEVEL}`); }
  const seen = new Set();
  const pool = [];
  for (let n = 0; n < SEEDS; n += 1) {
    let tasks = null;
    try { tasks = generator.generateSet(setId, `komplekt:${setId}:${n}`); } catch { continue; }
    for (const task of tasks) {
      if (task.level !== LEVEL || ISKLYUCHIT.has(task.id)) { continue; }
      const key = lineKey(task) + '#' + task.answer + '#' + (task.meta.query ? task.meta.query.x0 : '');
      if (seen.has(key)) { continue; }
      seen.add(key);
      pool.push(task);
    }
  }
  return pool;
}

/* Порядок подбора — не порядок на листе. Сначала наборы, у которых
   задач нужного уровня меньше (12.C и 12.D): их ответы почти все
   нужны комплекту. Крупные ряды считаются в том же порядке: 12.C
   с окном ±8 берёт один из KRUPNYH, 12.A/12.B получают оставшийся. */
const pools = new Map(SOSTAV.map((part) => [part.id, poolOf(part.id)]));
/* Тесные наборы — вперёд: у кого меньше разных прямых в пуле, тот
   первым. Так тупик обнаруживается на первых шагах перебора. */
const distinctLines = (setId) => new Set(pools.get(setId).flatMap(lineKeys)).size;
const pickOrder = SOSTAV.map((part, i) => ({ part, i }))
  .sort((a, b) => distinctLines(a.part.id) - distinctLines(b.part.id) || a.i - b.i)
  .map((item) => item.part);
for (const part of pickOrder) {
  console.log(`  пул ${part.id}: кандидатов ${pools.get(part.id).length}, разных прямых ${distinctLines(part.id)}, ` +
    `разных ответов ${new Set(pools.get(part.id).map((t) => t.answer)).size}`);
}
/* Слоты перебора: сначала все варианты тесного набора, потом
   следующего. Так тупик в 12.C обнаруживается на первых шагах,
   а не после того, как расставлены задачи 12.A/12.B. */
const slots = [];
for (const part of pickOrder) {
  for (let v = 1; v <= VARIANTS; v += 1) {
    for (let i = 0; i < part.count; i += 1) { slots.push({ v, set: part.id }); }
  }
}

const tight = new Set(SOSTAV.filter((part) =>
  new Set(pools.get(part.id).map((t) => t.answer)).size < 2 * part.count * VARIANTS).map((part) => part.id));
const BUDGET = Number(process.env.BUDGET || 10000000);
/* relaxed — запасное правило для ответов (см. выше). lineRepeats —
   сколько раз прямая может повториться половиной другой пары: у 12.D
   без 12.D-03/04 разных прямых 26 на восемь пар, и без единого повтора
   восемь пар с разными ответами не набираются. Повтор допускается
   только у пары в другом варианте; целиком пара и одиночная прямая
   не повторяются никогда. */
function search(relaxed, lineRepeats, bigLimit) {
  const usedLines = new Map();            /* прямая → { variant, pair } */
  let repeatsLeft = lineRepeats;
  const usedAnswers = new Map();          /* ответ → сколько раз */
  const usedInSet = new Map();
  const usedInVariant = new Map();
  const usedIds = new Map();              /* вариант → задачи банка */
  const bigRows = new Map();              /* вариант → крупных рядов */
  const bigParts = new Map();             /* вариант|набор → крупный ли ряд */
  const chosen = new Array(slots.length);
  let budget = BUDGET;
  const setOf = (map, key) => { if (!map.has(key)) { map.set(key, new Set()); } return map.get(key); };

  function step(depth) {
    if (depth === slots.length) { return true; }
    const slot = slots[depth];
    const pool = pools.get(slot.set);
    /* Варианты начинают перебор с разных мест пула: так задачи банка
       и наклоны в них идут в разном порядке. */
    const start = ((slot.v - 1) * 7) % pool.length;
    for (let c = 0; c < pool.length; c += 1) {
      if (--budget < 0) { throw new Error('подбор не уложился в отведённый перебор'); }
      const task = pool[(start + c) % pool.length];
      if (setOf(usedIds, slot.v).has(task.id)) { continue; }
      let reuse = 0;
      if (RAZNYE) {
        const keys = lineKeys(task);
        const pair = keys.length === 2 ? keys.join('|') : null;
        let clash = false;
        for (const key of keys) {
          const prev = usedLines.get(key);
          if (!prev) { continue; }
          if (!pair || !prev.pair || prev.pair === pair || prev.variant === slot.v) { clash = true; break; }
          reuse += 1;
        }
        if (clash || reuse > repeatsLeft) { continue; }
        const a = task.answer;
        if (usedAnswers.has(a)) {
          /* Запасное правило — только для тесных наборов, у которых
             разных ответов меньше, чем вдвое нужно; 12.A/12.B в нём
             не нуждаются и остаются под строгим. */
          if (!relaxed || !tight.has(slot.set) ||
              setOf(usedInSet, slot.set).has(a) || setOf(usedInVariant, slot.v).has(a)) { continue; }
        }
      }
      const partKey = `${slot.v}|${slot.set}`;
      const big = isBig(task) && !bigParts.get(partKey);
      if (big && (bigRows.get(slot.v) || 0) >= (bigLimit.has(slot.v) ? bigLimit.get(slot.v) : KRUPNYH)) { continue; }

      const ownKeys = lineKeys(task).filter((key) => !usedLines.has(key));
      const pairKey = ownKeys.length === lineKeys(task).length && lineKeys(task).length === 2 ? lineKeys(task).join('|') : lineKeys(task).join('|');
      ownKeys.forEach((key) => usedLines.set(key, { variant: slot.v, pair: lineKeys(task).length === 2 ? pairKey : null }));
      repeatsLeft -= reuse;
      usedAnswers.set(task.answer, (usedAnswers.get(task.answer) || 0) + 1);
      setOf(usedInSet, slot.set).add(task.answer);
      setOf(usedInVariant, slot.v).add(task.answer);
      setOf(usedIds, slot.v).add(task.id);
      if (big) { bigParts.set(partKey, true); bigRows.set(slot.v, (bigRows.get(slot.v) || 0) + 1); }
      chosen[depth] = task;
      if (step(depth + 1)) { return true; }
      ownKeys.forEach((key) => usedLines.delete(key));
      repeatsLeft += reuse;
      if (usedAnswers.get(task.answer) === 1) {
        usedAnswers.delete(task.answer);
        setOf(usedInSet, slot.set).delete(task.answer);
        setOf(usedInVariant, slot.v).delete(task.answer);
      } else {
        usedAnswers.set(task.answer, usedAnswers.get(task.answer) - 1);
        /* Ответ повторён в другом наборе/варианте: в своём наборе и
           варианте он был единственным — снимаем только их. */
        setOf(usedInSet, slot.set).delete(task.answer);
        setOf(usedInVariant, slot.v).delete(task.answer);
      }
      setOf(usedIds, slot.v).delete(task.id);
      if (big) { bigParts.delete(partKey); bigRows.set(slot.v, bigRows.get(slot.v) - 1); }
    }
    return false;
  }

  let ok = false;
  try { ok = step(0); }
  catch (error) {
    /* Перебор исчерпан — решения при этом правиле нет (или его
       не найти за разумное время); пробуем следующее правило. */
    if (!/отведённый перебор/.test(error.message)) { throw error; }
    ok = false;
  }
  console.log(`  перебор (ответы: ${relaxed ? 'запасное' : 'строгое'} правило; повторов прямых не больше ${lineRepeats}): ` +
    `шагов ${BUDGET - budget}, ${ok ? 'найдено' : 'решения нет'}`);
  if (!ok) { return null; }
  return { chosen, bigRows, usedLines, usedAnswers, lineRepeats: lineRepeats - repeatsLeft };
}

/* От строгого к запасному: сначала без повторов прямых (ответы строго,
   потом запасное правило), затем с одним повтором прямой, с двумя…
   bigLimit — лимит крупных рядов по вариантам (см. ZAPAS). */
let found = null;
let relaxedUsed = false;
let repeats = [];
let variants = [];
let usedLines = null;
let usedAnswers = null;
let repeatedLines = [];

function select(bigLimit) {
  found = null;
  relaxedUsed = false;
  for (let k = 0; k <= 3 && !found; k += 1) {
    for (const relaxed of [false, true]) {
      found = search(relaxed, k, bigLimit);
      if (found) { relaxedUsed = relaxed; break; }
    }
  }
  if (!found) {
    throw new Error('комплект не собрался: в банке не хватает разных прямых и ответов ' +
      'даже при повторе ответов между наборами и трёх повторах прямых');
  }
  repeats = [...found.usedAnswers].filter(([, n]) => n > 1).map(([a]) => a);

  variants = [];
  for (let v = 1; v <= VARIANTS; v += 1) {
    let no = 0;
    const blocks = SOSTAV.map((part) => ({
      title: skillTitle[part.id] || part.id, note: '', set: part.id,
      tasks: slots.map((slot, i) => ({ slot, task: found.chosen[i] }))
        .filter(({ slot }) => slot.v === v && slot.set === part.id)
        .map(({ task }) => sheetTask(task, ++no)),
    }));
    variants.push({ v, blocks, bigRows: found.bigRows.get(v) || 0 });
  }
  usedLines = found.usedLines;
  usedAnswers = found.usedAnswers;
  /* Какие прямые повторились половиной пары и в каких задачах. */
  const lineUses = new Map();
  slots.forEach((slot, i) => lineKeys(found.chosen[i]).forEach((key) => {
    if (!lineUses.has(key)) { lineUses.set(key, []); }
    lineUses.get(key).push(`${found.chosen[i].id} (вариант ${slot.v})`);
  }));
  repeatedLines = [...lineUses].filter(([, uses]) => uses.length > 1);
  /* Повторов больше принятого минимума — сборка падает с перечнем
     (при RAZNYE=0 правило снято, и проверка тоже). */
  const overflow = [];
  if (RAZNYE && repeats.length > MAKS_POVTOR_OTVETOV) {
    overflow.push(`ответов повторилось ${repeats.length}, допускается ${MAKS_POVTOR_OTVETOV}: ${repeats.join(', ')}`);
  }
  if (RAZNYE && repeatedLines.length > MAKS_POVTOR_PRYAMYH) {
    overflow.push(`прямых повторилось ${repeatedLines.length}, допускается ${MAKS_POVTOR_PRYAMYH}: ` +
      repeatedLines.map(([key, uses]) => `${generator.equationText(...key.split('@').map(Number))} — ${uses.join(', ')}`).join('; '));
  }
  if (overflow.length) {
    overflow.forEach((line) => console.log('  ' + line));
    throw new Error('повторов больше принятого минимума (MAKS_POVTOR_OTVETOV, MAKS_POVTOR_PRYAMYH), см. выше');
  }
}

function sheetTask(task, no) {
  return {
    no, id: task.id, questionHtml: task.questionHtml, options: task.options, figureSvg: task.svg,
    answer: task.answer, answerHtml: task.answerHtml, answerRule: rules[task.id],
    seed: task.meta.seed, meta: task.meta,
    ...(STOPKA8 && isBig(task) ? { figureBelow: true } : {}),
  };
}

const perVariant = SOSTAV.reduce((sum, part) => sum + part.count, 0);

/* ── Общие куски описания листа ──────────────────────────────── */
const FOOT = { ...content.foot, rights: 'Собрано в „Будет на ЕГЭ“ · budetege.ru' };
const HEAD = content.head;
const SUBTITLE = 'Самостоятельная работа · Задание 12';
const CSS = `
.sheet-name-line { display: flex; align-items: baseline; gap: calc(var(--sheet-step) * 2);
  margin: 0 0 calc(var(--sheet-step) * 3); font-size: var(--sheet-fs-body); color: var(--sheet-ink-2); }
.sheet-name-line .sheet-answer-blank { flex: 1 1 auto; }
.sheet-variant-head { margin: 0 0 calc(var(--sheet-step) * 3); }
.sheet-variant-strip { display: flex; align-items: center; gap: calc(var(--sheet-step) * 4);
  margin: 0 0 calc(var(--sheet-step) * 2); }
.sheet-variant-strip .sheet-name-line { flex: 1 1 auto; margin: 0; }
.sheet-variant-strip .sheet-chip { font-size: var(--sheet-fs-body); }
.sheet-variant-strip-title { flex: none; font-weight: 600; white-space: nowrap; }
.sheet-variant-strip .sheet-name-line > span:first-child { white-space: nowrap; }
.sheet-task { padding: calc(var(--sheet-step) * 1.5) calc(var(--sheet-step) * 2.5); gap: calc(var(--sheet-step) * 2); }
.sheet-task-body { gap: calc(var(--sheet-step) * 2.5); }
.sheet-task-text { font-size: ${KEGL}; line-height: 1.25; }
.sheet-tasks { gap: calc(var(--sheet-step) * 2); }
/* Шрифты формул — заранее. Пагинатор шаблона ждёт document.fonts.ready
   и лишь потом набирает формулы; шрифты KaTeX запрашиваются набранной
   разметкой, то есть уже после ожидания, и обмер карточек идёт
   по запасному шрифту. Ч/б лист от этого рвал вариант на две страницы.
   Невидимые псевдоэлементы с нулевым кеглем запрашивают нужные
   начертания при первой раскладке — до ожидания шрифтов. Правка
   самого пагинатора меняла бы разбивку сборников, поэтому здесь. */
html::before { content: "\\200b"; font-family: KaTeX_Main; font-weight: 400; font-size: 0; position: absolute; }
html::after { content: "\\200b"; font-family: KaTeX_Main; font-weight: 700; font-size: 0; position: absolute; }
body::before { content: "\\200b"; font-family: KaTeX_Math; font-style: italic; font-size: 0; position: absolute; }
body::after { content: "\\200b"; font-family: KaTeX_Size1; font-size: 0; position: absolute; }
#sheet-pages::before { content: "\\200b"; font-family: KaTeX_Size2; font-size: 0; position: absolute; }
#sheet-pages::after { content: "\\200b"; font-family: KaTeX_Main; font-style: italic; font-size: 0; position: absolute; }
/* Колонки сетки строго поровну: иначе сетка растягивается под чертёж
   ±8 и уводит правую карточку за поле страницы. Ширина текста внутри
   карточки подстраивается (min-width: 0 у .sheet-task-text). */
.sheet-tasks--double { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
/* Номер в первой строке — встроенным блоком, а не обтеканием: обтекаемый
   квадратик выше строки, и вторая строка уходила под него с зазором. */
.sheet-task-question .sheet-task-no { display: inline-flex; vertical-align: -0.35em;
  width: calc(var(--sheet-step) * 5); height: calc(var(--sheet-step) * 5);
  font-size: var(--sheet-fs-small); margin: 0 calc(var(--sheet-step) * 1.5) 0 0; }
.sheet-task-text .sheet-task-no { align-self: flex-start; margin: 0 0 calc(var(--sheet-step) * 1.5); }
${EXTRA_CSS}
${KOMPAKT ? `.sheet-title-block { display: none; }
.sheet-head { padding-bottom: calc(var(--sheet-step) * 2); margin-bottom: calc(var(--sheet-step) * 3); }
.sheet-variant-strip { margin-bottom: calc(var(--sheet-step) * 1); }` : ''}
.sheet-recap--mistakes { margin-top: calc(var(--sheet-step) * 2); }
.sheet-recap--mistakes .sheet-recap-list { grid-auto-flow: row; grid-template-rows: none;
  grid-template-columns: 1fr; gap: calc(var(--sheet-step) * 3); }
.sheet-recap--mistakes .sheet-recap-item { align-items: flex-start; line-height: 1.5; }
.sheet-recap--mistakes .sheet-recap-no { align-self: flex-start; margin-top: 2px; }
.sheet-signature { text-align: right; font-family: var(--sheet-font-hand); font-size: 17pt;
  color: var(--sheet-ink); margin: calc(var(--sheet-step) * 4) 0 0; }
.sheet-matrix th, .sheet-matrix td { text-align: center; }
.sheet-matrix th[scope='col'] { background: var(--sheet-num-bg); color: var(--sheet-num-ink); }
.sheet-matrix th[scope='row'] { width: auto; white-space: nowrap; text-align: left;
  padding-right: calc(var(--sheet-step) * 4); }
`;

const nameLine = '<div class="sheet-item sheet-name-line"><span>Фамилия, имя, класс</span>' +
  '<span class="sheet-answer-blank"></span></div>';

/* Шапка варианта — той же разметкой, что блок названия листа.
   У первого варианта название даёт сам шаблон; у следующих оно
   повторяется куском потока с новой страницы. */
function variantHead(variant) {
  return '<div class="sheet-item sheet-variant-head" data-page-break="1" data-keep-with-next="1">' +
    '<div class="sheet-title-block"><div class="sheet-title-row">' +
    `<span class="sheet-chip">Вариант ${variant.v}</span>` +
    '<div class="sheet-title-col"><h1 class="sheet-title">Линейная функция</h1>' +
    `<p class="sheet-subtitle">${SUBTITLE}</p></div></div></div></div>`;
}

/* Задачи варианта: куски потока в раскладке листа. Их собирает сам
   шаблон (flowItems внутри buildDocument); здесь они вынимаются из
   спецификации документа с одним вариантом, чтобы вставить между
   вариантами шапку и строку для фамилии. */
function taskItems(variant, theme) {
  const html = sheet.buildDocument({
    theme, layout: LAYOUT, cell: CELL, head: HEAD, title: { chip: '', text: 'Вариант' },
    recap: null, blocks: variant.blocks, withAnswerLine: true, foot: FOOT,
  }, {});
  const open = '<script type="application/json" id="sheet-spec">';
  const start = html.indexOf(open) + open.length;
  let items = JSON.parse(html.slice(start, html.indexOf('</script>', start))).items;
  if (NOMER === 'v-tekste') {
    /* Номер уходит из отдельного столбца в начало колонки текста. */
    items = items.map((item) => item.replace(
      /(<span class="sheet-task-no">[^<]*<\/span>)(<div class="sheet-task-body">)(<div class="sheet-task-text">)/g,
      '$2$3$1'));
  } else if (NOMER === 'v-stroke') {
    /* Номер — в первой строке условия, текст обтекает его. */
    items = items.map((item) => item.replace(
      /(<span class="sheet-task-no">[^<]*<\/span>)(<div class="sheet-task-body">)(<div class="sheet-task-text">)(<p class="sheet-task-question">)/g,
      '$2$3$4$1'));
  }
  return KOMPAKT ? items.filter((item) => !item.startsWith('<div class="sheet-item sheet-block')) : items;
}

/* Компактная шапка варианта: плашка и строка для фамилии в одну
   строку. У первого варианта плашка стоит в названии листа. */
function variantStrip(variant, first) {
  return `<div class="sheet-item sheet-variant-strip"${first ? '' : ' data-page-break="1"'} data-keep-with-next="1">` +
    `<span class="sheet-chip">Вариант ${variant.v}</span>` +
    '<span class="sheet-variant-strip-title">Линейная функция · Самостоятельная работа</span>' +
    '<span class="sheet-name-line"><span>Фамилия, имя, класс</span><span class="sheet-answer-blank"></span></span></div>';
}

const mistakesItem = '<div class="sheet-item" data-page-break="1">' +
  '<section class="sheet-recap sheet-recap--mistakes"><div class="sheet-recap-main">' +
  `<h2 class="sheet-recap-title">${typo.text(oshibki.title)}</h2><ul class="sheet-recap-list">` +
  oshibki.items.map((text, i) =>
    `<li class="sheet-recap-item"><span class="sheet-recap-no">${i + 1}</span><span>${typo.markup(text)}</span></li>`).join('') +
  `</ul></div></section><p class="sheet-signature">${typo.text(oshibki.signature)}</p></div>`;

function studentSpec(theme) {
  const items = [];
  variants.forEach((variant, i) => {
    if (KOMPAKT) {
      items.push(variantStrip(variant, i === 0));
    } else {
      if (i > 0) { items.push(variantHead(variant)); }
      items.push(nameLine);
    }
    items.push(...taskItems(variant, theme));
  });
  items.push(mistakesItem);
  return {
    theme, layout: LAYOUT, cell: CELL,
    documentTitle: 'Линейная функция. Самостоятельная работа',
    head: HEAD, runner: 'Линейная функция · Самостоятельная работа',
    title: { chip: 'Вариант 1', text: 'Линейная функция', subtitle: SUBTITLE },
    recap: null, leadItems: items, blocks: [], withAnswerLine: true, foot: FOOT,
  };
}

/* ── Лист учителя ────────────────────────────────────────────── */
function matrixItem() {
  let html = '<div class="sheet-item sheet-answers"><table class="sheet-answers-table sheet-matrix">' +
    '<caption>Ответы: строки — варианты, столбцы — номера задач</caption><thead><tr><th scope="col"></th>';
  for (let i = 1; i <= perVariant; i += 1) { html += `<th scope="col">${i}</th>`; }
  html += '</tr></thead><tbody>';
  for (const variant of variants) {
    html += `<tr><th scope="row">Вариант ${variant.v}</th>`;
    for (const task of variant.blocks.flatMap((block) => block.tasks)) {
      html += `<td data-answer="${typo.attr(task.answer)}">${task.answerHtml || typo.markup(task.answer)}</td>`;
    }
    html += '</tr>';
  }
  return html + '</tbody></table></div>';
}

function solutionsOf(variant) {
  const items = answersItems(variant.blocks, generator, solutionBuilder);
  const solved = items.filter((html) => html.includes('class="sheet-item sheet-solution"'));
  const head = '<div class="sheet-item sheet-block" data-keep-with-next="1"><header class="sheet-block-head">' +
    `<h2 class="sheet-block-title">Вариант ${variant.v}</h2>` +
    `<span class="sheet-block-note">краткие решения, ${solved.length} задач из ${perVariant}</span></header></div>`;
  return [head, ...solved];
}

function teacherSpec(theme) {
  return {
    theme, layout: 'single', cell: CELL,
    documentTitle: 'Линейная функция. Самостоятельная работа. Ответы',
    head: HEAD, runner: 'Линейная функция · Ответы',
    title: { chip: 'Ответы', text: 'Линейная функция', subtitle: `Самостоятельная работа · вариантов: ${VARIANTS} · лист учителя` },
    recap: null, leadItems: [matrixItem()], blocks: [], withAnswerLine: false,
    extraItems: variants.flatMap(solutionsOf), foot: FOOT,
  };
}

/* ── Печать ──────────────────────────────────────────────────── */
fs.mkdirSync(OUT, { recursive: true });

/* Ширина: каждая карточка и каждый чертёж целиком в поле потока
   страницы. Пагинатор следит только за высотой, а по ширине сетка
   в две колонки растягивается под содержимое и уводит правую
   карточку за поле. Обмер — по готовой разметке в браузере. */
async function checkLayout(htmlFile) {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
  });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + htmlFile, { waitUntil: 'networkidle' });
    await page.waitForSelector('#sheet-pages .sheet-page');
    return await page.$$eval('#sheet-pages .sheet-page', (pages) => {
      const mm = (px) => Math.round(px / 96 * 25.4 * 10) / 10;
      const bad = [];
      const heights = [];
      let widest = 0;
      pages.forEach((p, i) => {
        const flowEl = p.querySelector('.sheet-flow');
        const flow = flowEl.getBoundingClientRect();
        /* Запас по высоте: от низа последнего куска до потолка потока.
           Потолок пагинатора — ровно высота потока (проверено: пустой
           блок добавляется, пока не упрётся в неё). */
        const last = flowEl.lastElementChild;
        const chip = p.querySelector('.sheet-variant-strip .sheet-chip, .sheet-variant-head .sheet-chip');
        const variant = chip ? Number((chip.textContent.match(/\d+/) || [0])[0]) : null;
        heights.push({ page: i + 1, variant,
          free: mm(last ? flowEl.clientHeight - (last.getBoundingClientRect().bottom - flow.top) : flowEl.clientHeight) });
        p.querySelectorAll('.sheet-task, .sheet-figure').forEach((el) => {
          const r = el.getBoundingClientRect();
          const over = Math.max(r.right - flow.right, flow.left - r.left);
          widest = Math.max(widest, over);
          if (over > 0.5) {
            const card = el.closest('.sheet-task');
            bad.push(`стр. ${i + 1}, задача ${card ? card.getAttribute('data-task') : '?'}` +
              (el.classList.contains('sheet-figure') ? ' (чертёж)' : '') + ` — за полем на ${mm(over)} мм`);
          }
        });
      });
      return { bad, heights, widest: mm(Math.max(0, widest)) };
    });
  } finally { await browser.close(); }
}

async function print(name, spec, expectTasks) {
  const file = path.join(OUT, name + '.pdf');
  const htmlFile = path.join(OUT, 'html', name + '.html');
  const report = await renderPdf(spec, file, { keepHtml: htmlFile, requireKatex: true, extraCss: CSS });
  const layout = await checkLayout(htmlFile);
  if (layout.bad.length) {
    console.log(`  ${name}: за полем страницы — ${layout.bad.join('; ')}`);
    throw new Error(`${name}: карточки выходят за поле страницы, см. выше`);
  }
  console.log(`  ${name}.pdf: страниц ${report.pages}, задач ${report.tasks}, формул ${report.formulas}` +
    ', по ширине все карточки в поле; запас по высоте: ' +
    layout.heights.map((h) => `стр. ${h.page} — ${h.free} мм`).join(', ') +
    (report.overflowing.length ? `, ВЫШЕ СТРАНИЦЫ: ${report.overflowing.join(', ')}` : '') +
    (report.formulasFailed ? `, KaTeX не принял ${report.formulasFailed}` : ''));
  if (report.tasks !== expectTasks) {
    throw new Error(`${name}: задач на листе ${report.tasks}, ждали ${expectTasks}`);
  }
  if (report.overflowing.length || report.formulasFailed) {
    throw new Error(`${name}: лист собрался с ошибками, см. выше`);
  }
  return { report, layout };
}

/* Страницы вариантов с запасом меньше ZAPAS (страница «Частые ошибки»
   не считается: у неё вариант не подписан). */
const tightPages = (layout) => layout.heights.filter((h) => h.variant && h.free < ZAPAS - 1e-9);

console.log(`Комплект: вариантов ${VARIANTS}, задач в варианте ${perVariant}, раскладка ${LAYOUT}, клетка ${CELL} мм, запас по высоте не меньше ${ZAPAS} мм`);

/* Подбор и печать листа ученика — пока на каждой странице не останется
   запас ZAPAS. Страница не проходит — у её варианта лимит крупных рядов
   уменьшается на один (задачи 12.A/12.B берутся с окном ±5), и комплект
   подбирается заново. Лимит кончился — ошибка. */
const bigLimit = new Map();
let student = null;
for (let round = 0; round < 3; round += 1) {
  select(bigLimit);
  for (const variant of variants) {
    const windows = variant.blocks.flatMap((block) => block.tasks).map((task) => '±' + task.meta.window.xmax);
    console.log(`  вариант ${variant.v}: окна ${windows.join(' ')}, крупных рядов ${variant.bigRows}`);
  }
  student = await print('samostoyatelnaya-12-lineynaya-funkciya-cvet', studentSpec('color'), VARIANTS * perVariant);
  const short = tightPages(student.layout);
  if (!short.length) { break; }
  for (const h of short) {
    const limit = (bigLimit.has(h.variant) ? bigLimit.get(h.variant) : KRUPNYH) - 1;
    if (limit < 0) {
      throw new Error(`вариант ${h.variant}: запас по высоте ${h.free} мм меньше ${ZAPAS} мм даже без крупных рядов`);
    }
    bigLimit.set(h.variant, limit);
    console.log(`  вариант ${h.variant}: запас по высоте ${h.free} мм меньше ${ZAPAS} мм — крупных рядов не больше ${limit}, подбор заново`);
  }
  student = null;
}
if (!student) { throw new Error('запас по высоте не набран за три подбора'); }
const chb = await print('samostoyatelnaya-12-lineynaya-funkciya-chb', studentSpec('print'), VARIANTS * perVariant);
if (tightPages(chb.layout).length) {
  throw new Error('ч/б лист: запас по высоте меньше ' + ZAPAS + ' мм — ' +
    tightPages(chb.layout).map((h) => `стр. ${h.page}: ${h.free} мм`).join(', '));
}
await print('samostoyatelnaya-12-lineynaya-funkciya-otvety-uchitel', teacherSpec('color'), 0);

const sostav = variants.map((variant) => ({
  v: variant.v,
  tasks: variant.blocks.flatMap((block) => block.tasks).map((task) => ({
    no: task.no, id: task.id, lines: lineKey(task),
    x0: task.meta.query ? task.meta.query.x0 : null, answer: task.answer,
  })),
}));
fs.writeFileSync(path.join(OUT, 'sostav.json'), JSON.stringify(sostav, null, 1));
console.log(`разных прямых ${usedLines.size} из ${slots.reduce((n, slot, i) => n + lineKeys(found.chosen[i]).length, 0)}, ` +
  `разных ответов ${usedAnswers.size}; файлы в ${OUT}`);
if (repeatedLines.length) {
  console.log('прямые, повторившиеся половиной пары в другом варианте: ' +
    repeatedLines.map(([key, uses]) => `${generator.equationText(...key.split('@').map(Number))} — ${uses.join(', ')}`).join('; '));
}
if (relaxedUsed) {
  console.log('строгое правило «все ответы разные» не выполнимо; ответы, повторившиеся между наборами ' +
    '(в своём наборе и в своём варианте — нет): ' + repeats.join(', '));
}
