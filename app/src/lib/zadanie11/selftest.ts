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
import { generate, GENERATORS, paramsKey, pohozhaNaBank, type Generated } from './gen';
import { subtype, SUBTYPES } from './prototypes';
import { rngOf } from '../vychisleniya/rng';
import { STROKI_KONC } from './kit';
import type { BankItem, Solved, Tablitsa } from './types';

export interface Problem {
  where: string;
  what: string;
}

/** Все строки задачи, которые видит ученик или учитель. */
export function allTexts(s: Solved): string[] {
  return [
    s.uslovie,
    ...s.etapy.flatMap((e) => [e.title, ...e.lines]),
    ...(s.tables ?? []).flatMap((t) => [
      ...(t.title ? [t.title] : []),
      ...t.head,
      ...t.rows.flat(),
    ]),
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
  for (const t of s.tables ?? []) {
    for (const row of t.rows) {
      if (row.length !== t.head.length) {
        add('строка таблицы не совпадает по длине с шапкой');
      }
    }
    problems.push(...checkTablitsa(where, t));
  }
  problems.push(...checkOboznacheniya(where, s));
  return problems;
}

/* ── Методика: порядок столбцов и обозначения ─────────────────── */

const PORYADOK: Record<string, string[]> = {
  dvizhenie: ['$S$', '$v$', '$t$'],
  rabota: ['$A$', '$p$', '$t$'],
};

/** Таблица по правилам: S | v | t, A | p | t, строки концентрации. */
export function checkTablitsa(where: string, t: Tablitsa): Problem[] {
  const problems: Problem[] = [];
  const order = PORYADOK[t.vid];
  if (order) {
    const got = t.head.slice(1).map((h) => h.split('$').slice(0, 2).join('$') + '$');
    if (got.join('|') !== order.join('|')) {
      problems.push({
        where,
        what: `таблица «${t.vid}»: столбцы ${got.join(' | ')} вместо ${order.join(' | ')}`,
      });
    }
  }
  if (t.vid === 'koncentraciya') {
    const labels = t.rows.map((r) => r[0]);
    if (labels.join('|') !== STROKI_KONC.join('|')) {
      problems.push({ where, what: `таблица концентрации: строки ${labels.join(' | ')}` });
    }
    /* Столбцы — римскими цифрами (I, II, I + II, I*, …), вода или
       название продукта (виноград, изюм); арабских цифр нет. */
    for (const h of t.head.slice(1)) {
      if (/[0-9]/.test(h) || !/^(?:(?:I{1,3}\*?|вода|[а-яё ]+)(?: \+ |$))+$/.test(h)) {
        problems.push({ where, what: `таблица концентрации: столбец «${h}» не римскими цифрами` });
      }
    }
  }
  return problems;
}

/**
 * Неизвестная — x (вторая — y): буквы c (течение), k (множитель) и v
 * в клетках таблиц не используются как неизвестные. Проверяются
 * формулы разбора, подсказок и клетки таблиц (шапки — нет).
 */
export function checkOboznacheniya(where: string, s: Solved): Problem[] {
  const texts = [
    ...s.etapy.flatMap((e) => e.lines),
    ...s.hints.flatMap((h) => [h.question, ...h.options, ...(h.comment ? [h.comment] : [])]),
  ];
  const cells = (s.tables ?? []).flatMap((t) => t.rows.flatMap((r) => r.slice(1)));
  const problems: Problem[] = [];
  const letters = (tex: string): string =>
    tex.replace(/\\text\{[^}]*\}/g, ' ').replace(/\\[A-Za-z]+/g, ' ');
  for (const text of texts) {
    for (const tex of texPieces(text) ?? []) {
      if (/(?<![A-Za-z])[ck](?![A-Za-z])/.test(letters(tex))) {
        problems.push({ where, what: `неизвестная не x/y: «${tex.slice(0, 50)}»` });
      }
    }
  }
  for (const cell of cells) {
    for (const tex of texPieces(cell) ?? []) {
      if (/(?<![A-Za-z])[ckv](?![A-Za-z])/.test(letters(tex))) {
        problems.push({ where, what: `в клетке таблицы буква вместо x/y: «${tex.slice(0, 50)}»` });
      }
    }
  }
  return problems;
}

/** Какой вид таблицы обязателен у раздела. */
const VID_RAZDELA: Record<string, Tablitsa['vid']> = {
  DP: 'dvizhenie',
  PT: 'dvizhenie',
  VD: 'dvizhenie',
  OK: 'dvizhenie',
  RB: 'rabota',
  SM: 'koncentraciya',
};

/** Подтипы без таблицы модели: перевод единиц, система без таблицы. */
const BEZ_TABLITSY = new Set(['DP-01', 'OK-03']);

/** Подтипы «равных масс»: вторая таблица I*, II*, I* + II* и сокращение m. */
const RAVNYE_MASSY = new Set(['SM-02', 'SM-07']);

/**
 * Методика раздела: вид таблицы по разделу, «примем всю работу за 1»,
 * таблица равных масс и явное сокращение на m.
 */
export function checkMetodika(where: string, id: string, s: Solved): Problem[] {
  const problems: Problem[] = [];
  const add = (what: string) => problems.push({ where, what });
  const vid = VID_RAZDELA[id.split('-')[0] ?? ''];
  const tables = s.tables ?? [];
  if (vid) {
    if (tables.length === 0 && !BEZ_TABLITSY.has(id)) {
      add(`нет таблицы модели (${vid})`);
    }
    for (const t of tables) {
      if (t.vid !== vid) {
        add(`таблица вида ${t.vid}, а разделу нужна ${vid}`);
      }
    }
  }
  const text = s.etapy.flatMap((e) => e.lines).join(' ');
  if (
    tables.some((t) => t.vid === 'rabota' && t.rows.some((r) => r[1] === '$1$')) &&
    !text.includes('Примем всю работу за $1$') &&
    !/Примем всю работу \([^)]*\) за \$1\$/.test(text)
  ) {
    add('объём работы принят за 1, но в решении это не сказано');
  }
  if (RAVNYE_MASSY.has(id)) {
    if (!tables.some((t) => t.head.includes('I*') && t.head.includes('I* + II*'))) {
      add('нет таблицы равных масс I*, II*, I* + II*');
    }
    if (!text.includes('Сокращаем на $m$')) {
      add('не показано сокращение на m');
    }
  }
  return problems;
}

/* ── Дробно-рациональные уравнения ──────────────────────────────── */

/** Есть ли в формуле дробь с неизвестной в знаменателе. */
export function drobnoeUravnenie(tex: string): boolean {
  const re = /\\[dt]?frac\{(?:[^{}]|\{[^{}]*\})*\}\{((?:[^{}]|\{[^{}]*\})*)\}/g;
  let m = re.exec(tex);
  while (m !== null) {
    if (/(?<![A-Za-z\\])[xy](?![A-Za-z])/.test(m[1] ?? '')) {
      return true;
    }
    m = re.exec(tex);
  }
  return false;
}

/** Знак равносильности допустим только внутри системы с ОДЗ. */
const RAVNOSILNOST = /⇔|\\Leftrightarrow|\\iff|равносил/i;

/**
 * Методика дробно-рациональных уравнений: если в уравнении неизвестная
 * стоит в знаменателе — в разборе есть шаги «ОДЗ» и «Отбор корней»,
 * умножение на знаменатель записано «≠ 0 (по ОДЗ)», в подсказках —
 * вопросы «Какие значения x недопустимы?» и «Какой корень подходит?».
 * Знак равносильности нигде не используется вне системы с ОДЗ.
 */
export function checkDrobnye(where: string, s: Solved): Problem[] {
  const problems: Problem[] = [];
  const add = (what: string) => problems.push({ where, what });
  const uravnenie = s.etapy
    .filter((e) => /Уравнение|Система/.test(e.title))
    .flatMap((e) => e.lines)
    .some((line) => (texPieces(line) ?? []).some(drobnoeUravnenie));
  for (const text of allTexts(s)) {
    if (RAVNOSILNOST.test(text)) {
      const vSisteme = (texPieces(text) ?? []).some(
        (tex) => RAVNOSILNOST.test(tex) && /\\begin\{cases\}/.test(tex) && /\\ne/.test(tex),
      );
      if (!vSisteme) {
        add(`знак равносильности вне системы с ОДЗ: ${text.slice(0, 60)}`);
      }
    }
  }
  if (!uravnenie) {
    return problems;
  }
  const titles = s.etapy.map((e) => e.title);
  if (!titles.some((t) => /\. ОДЗ$/.test(t))) {
    add('дробное уравнение без шага «ОДЗ»');
  }
  if (!titles.some((t) => t.includes('Отбор корней'))) {
    add('дробное уравнение без шага «Отбор корней»');
  }
  const odz = s.etapy.find((e) => /\. ОДЗ$/.test(e.title));
  if (odz && !odz.lines.some((l) => l.startsWith('**ОДЗ** (область допустимых значений):'))) {
    add('в шаге ОДЗ нет строки «ОДЗ: …»');
  }
  if (odz && !odz.lines.some((l) => l.includes('По смыслу задачи'))) {
    add('в шаге ОДЗ нет условия по смыслу задачи');
  }
  const text = s.etapy.flatMap((e) => e.lines).join(' ');
  if (/Умножаем на|Приводим к общему знаменателю/.test(text)) {
    add('умножение на знаменатель без «≠ 0 (по ОДЗ)»');
  }
  if (!/Умножим обе части на \$[^$]*\\ne0\$ \(по ОДЗ\)/.test(text)) {
    add('нет строки «Умножим обе части на … ≠ 0 (по ОДЗ)»');
  }
  if (!s.hints.some((h) => h.question.startsWith('Какие значения'))) {
    add('в подсказке нет вопроса «Какие значения x недопустимы?»');
  }
  if (!s.hints.some((h) => h.question === 'Какой корень подходит?')) {
    add('в подсказке нет вопроса «Какой корень подходит?»');
  }
  if (text.includes('Лайфхак') && !text.includes('Других подходящих корней нет')) {
    add('подбор корня без обоснования, что других корней нет');
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
    problems.push(...checkMetodika(where, item.id, s), ...checkDrobnye(where, s));
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

/* ── Генератор ──────────────────────────────────────────────────── */

/** Подтипы разминки, у которых генератор обязан давать разные случаи. */
const SLUCHAI: Record<string, string[]> = {
  'RZ-04': ['ostatok', 'nacelo'],
  'RZ-05': ['ostatok', 'nacelo'],
  'RZ-06': ['ostatok', 'nacelo'],
  'RZ-07': ['vverh', 'vniz'],
  'RZ-08': ['chetnoe', 'nechetnoe'],
  'RZ-09': ['ostatok', 'nacelo'],
};

/**
 * Генератор каждого подтипа на `seeds` seed: задача подбирается, все
 * проверки разбора и методики проходят, параметры не из банка.
 * Отдельно — сырой прогон генератора: каждая заготовка, которую
 * решает solve, должна дать задуманный ответ (иначе генератор и
 * solve расходятся, а generate молча отбросил бы такую заготовку).
 */
export function checkGenerators(seeds: number, typeset: (tex: string) => string) {
  const problems: Problem[] = [];
  const solved: Array<{ where: string; s: Solved }> = [];
  const stats: Array<{ id: string; distinct: number; rejected: number }> = [];
  let generated = 0;
  for (const st of SUBTYPES) {
    const gen = GENERATORS[st.id];
    if (!gen) {
      problems.push({ where: st.id, what: 'нет генератора' });
      continue;
    }
    /* Сырой прогон. */
    const r = rngOf(`selftest|${st.id}`);
    let rejected = 0;
    for (let i = 0; i < seeds * 20; i += 1) {
      const z = gen(r);
      if (!z) {
        rejected += 1;
        continue;
      }
      let s: Solved;
      try {
        s = st.solve(z.params);
      } catch (e) {
        problems.push({
          where: `${st.id} ${JSON.stringify(z.params)}`,
          what: `solve упал: ${(e as Error).message}`,
        });
        continue;
      }
      if (Math.abs(s.answer - z.answer) > 1e-9) {
        problems.push({
          where: `${st.id} ${JSON.stringify(z.params)}`,
          what: `генератор задумал ${z.answer}, solve дал ${s.answer}`,
        });
      }
    }
    /* Задачи через generate. */
    const keys = new Set<string>();
    const sluchai = new Set<string>();
    for (let i = 0; i < seeds; i += 1) {
      const where = `${st.id} seed=${i}`;
      let g: Generated;
      try {
        g = generate(st.id, String(i));
      } catch (e) {
        problems.push({ where, what: (e as Error).message });
        continue;
      }
      generated += 1;
      if (pohozhaNaBank(st.id, g.params)) {
        problems.push({
          where,
          what: 'задача совпадает с банком или отличается от неё одним числом',
        });
      }
      keys.add(paramsKey(st.id, g.params));
      if (g.sluchay) {
        sluchai.add(g.sluchay);
      }
      const w = `${where} ${JSON.stringify(g.params)}`;
      problems.push(
        ...checkSolved(w, g.solved, typeset),
        ...checkMetodika(w, st.id, g.solved),
        ...checkDrobnye(w, g.solved),
      );
      solved.push({ where: w, s: g.solved });
    }
    if (keys.size < Math.min(5, seeds)) {
      problems.push({
        where: st.id,
        what: `генератор однообразен: ${keys.size} разных задач на ${seeds} seed`,
      });
    }
    for (const need of SLUCHAI[st.id] ?? []) {
      if (!sluchai.has(need)) {
        problems.push({ where: st.id, what: `генератор не выдаёт случай «${need}»` });
      }
    }
    stats.push({ id: st.id, distinct: keys.size, rejected });
  }
  return { generated, problems, solved, stats };
}
