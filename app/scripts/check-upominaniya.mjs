#!/usr/bin/env node
/* scripts/check-upominaniya.mjs — упомянутая в условии таблица,
   рисунок, график или диаграмма у задачи действительно есть.

   Запуск: pnpm test:upominaniya

   Правило сайта: если условие говорит «в таблице приведены…», «на
   рисунке изображён…», «по графику определите…» или «на диаграмме
   показано…», ученик видит эту таблицу, рисунок, график или диаграмму
   рядом с условием. Задача, где слово в условии есть, а самого
   элемента нет, нерешаема — её и ищет проверка.

   Какие слова ищутся (без учёта регистра):
     — «таблиц» в любой форме                  → нужна таблица;
     — «рисунок» в любой форме («на рисунке», «по рисунку»,
       «пользуясь рисунком»)                   → нужен рисунок
       (график тоже рисунок);
     — «график» как ссылка на картинку: «по графику», «на графике»,
       «изображён график», «график … показан» → нужен график, рисунок
       или таблица (у №13 «в таблице представлен график погашения» —
       это таблица условия). «Касательная к графику функции $y=…$»
       ссылкой не считается: такая задача решается по формуле;
     — «диаграмм» в любой форме                → нужен рисунок
       (диаграмма Эйлера, дерево, диаграмма-картинка).

   Задачи берутся из банков разделов так же, как в остальных
   проверках (load-ts.mjs переводит TypeScript на лету): банк
   тренажёра, аналоги, опорные задачи. Для каждого раздела написан
   свой переходник: он отдаёт простые записи
   { razdel, id, text, hasElement: { table, figure, graph } } и
   решает, есть ли элемент, по тем самым полям, по которым компонент
   раздела рисует таблицу или рисунок (поля названы в комментарии
   у каждого переходника).

   Раздел, который не удалось загрузить в Node, в нарушения не идёт:
   он печатается в списке «не проверено» с причиной.

   Ненулевой код возврата — есть задача с упоминанием без элемента.
*/

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { requireSrc } from './lib/load-ts.mjs';
import GraphGenerate from '../src/lib/graph/generate.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── Упоминания ─────────────────────────────────────────────────── */

/**
 * Виды упоминаний: регулярное выражение по тексту условия и какие
 * элементы задачи его закрывают.
 */
const UPOMINANIYA = [
  { vid: 'таблица', re: /таблиц/i, ok: (h) => h.table },
  /* «на рисунке», «по рисунку», «пользуясь рисунком», «рисунок 2». */
  { vid: 'рисунок', re: /рисун(?:ок|к)/i, ok: (h) => h.figure || h.graph },
  /* Слово «график» само по себе ещё не ссылка на картинку: «касательная
     к графику функции $y=x^2+c$», «принадлежит ли точка её графику»,
     «показатели графики» игры — задачи по формуле, рисунка им не нужно.
     Ссылкой считается «по графику», «на графике», «изображён /
     показан / представлен / приведён график» и «график … изображён»
     в пределах одного предложения. */
  {
    vid: 'график',
    re: /(?:по|на)\s+график|(?:изображ|показан|представлен|приведен|приведён)[а-яё]*\s+график|график[а-яё]*\s[^.?!]{0,80}?(?:изображ|показан|представлен|приведен|приведён)/i,
    ok: (h) => h.graph || h.figure || h.table,
  },
  { vid: 'диаграмма', re: /диаграмм/i, ok: (h) => h.figure || h.graph },
];

/** Текст для поиска и для отрывка: без HTML-разметки и лишних пробелов. */
function plain(text) {
  return String(text ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Отрывок условия около первого упоминания: ~120 знаков. */
function otryvok(text, re) {
  const t = plain(text);
  const m = re.exec(t);
  const at = m ? m.index : 0;
  const from = Math.max(0, Math.min(at - 50, t.length - 120));
  const s = t.slice(from, from + 120);
  return (from > 0 ? '…' : '') + s + (from + 120 < t.length ? '…' : '');
}

/* ── Сбор задач ─────────────────────────────────────────────────── */

/** Все задачи для проверки. */
const zadachi = [];
/** Разделы и блоки, которые проверить не удалось: { razdel, chto, prichina }. */
const neProvereno = [];
/** Сколько задач дал каждый переходник — для итога. */
const skolko = new Map();

const NET = { table: false, figure: false, graph: false };

/** Записать задачу; hasElement — какие элементы у неё есть. */
function dobavit(razdel, id, text, hasElement) {
  zadachi.push({ razdel, id, text: plain(text), hasElement: { ...NET, ...hasElement } });
  skolko.set(razdel, (skolko.get(razdel) ?? 0) + 1);
}

/**
 * Запустить переходник: упал — раздел (или блок) в «не проверено»
 * с текстом ошибки, остальные разделы проверяются дальше.
 */
function perehodnik(razdel, chto, fn) {
  try {
    fn();
  } catch (e) {
    neProvereno.push({ razdel, chto, prichina: String(e?.message ?? e).split('\n')[0] });
  }
}

/** Разметка, вставленная прямо в условие: таблица или SVG. */
function vUslovii(html) {
  const s = String(html ?? '');
  return { table: /<table[\s>]/i.test(s), figure: /<svg[\s>]|<img[\s>]/i.test(s) };
}

/* №1. Планиметрия. Карточка тренажёра всегда рисует чертёж прототипа:
   stsena(params, POROG) — элементы слоя «условие» (sloy не задан или
   'uslovie'). Опорные задачи — generateMikro: рисунок в поле risunok
   (null — задача без рисунка). */
perehodnik('№1', 'банк ФИПИ и аналоги', () => {
  const { BANK_FIPI } = requireSrc('lib/planimetriya/bank/fipi');
  const { vseAnalogi } = requireSrc('lib/planimetriya/bank/analogi');
  const { prototip } = requireSrc('lib/planimetriya/stseny/index');
  const { POROG } = requireSrc('lib/planimetriya/figury');
  const estChertezh = (p, params) => {
    const scena = p.stsena(params, POROG);
    return (scena?.elementy ?? []).some((e) => (e.sloy ?? 'uslovie') === 'uslovie');
  };
  for (const z of BANK_FIPI) {
    const p = prototip(z.proto);
    const params = { ...p.primer, ...z.params };
    dobavit('№1', `ФИПИ ${z.n} (прототип ${z.proto})`, p.uslovie(params), {
      figure: estChertezh(p, params),
    });
  }
  for (const a of vseAnalogi()) {
    const p = prototip(a.proto);
    dobavit('№1', `аналог ${a.proto}-${a.no}`, p.uslovie(a.params), {
      figure: estChertezh(p, a.params),
    });
  }
});
perehodnik('№1', 'опорные задачи', () => {
  const { BLOKI } = requireSrc('lib/planimetriya/prep/bloki');
  const { fixedSeed, generateMikro } = requireSrc('lib/planimetriya/prep/generate');
  for (const blok of BLOKI) {
    for (const m of blok.zadachi) {
      const g = generateMikro(m.id, fixedSeed(m.id));
      dobavit('№1', m.id, g.uslovie, { figure: g.risunok !== null });
    }
  }
});

/* №2. Векторы. Генератор отдаёт рисунок полем risunok (null у задач
   по координатам и словами) — его рисует Risunok.tsx. Так же у
   опорных микрозадач (generateMikro) и у разобранных образцов. */
perehodnik('№2', 'банк тренажёра', () => {
  const { BANK } = requireSrc('lib/vektory/bank');
  const { generate } = requireSrc('lib/vektory/generate');
  for (const entry of BANK) {
    for (const v of entry.variants) {
      const t = generate(entry.prototype, v.seed);
      dobavit('№2', `${entry.prototype}:${v.seed}`, t.uslovie, { figure: t.risunok !== null });
    }
  }
});
perehodnik('№2', 'опорные задачи', () => {
  const { BLOKI } = requireSrc('lib/vektory/prep/bloki');
  const { fixedSeed, generateMikro } = requireSrc('lib/vektory/prep/generate');
  for (const blok of BLOKI) {
    for (const m of blok.zadachi) {
      const g = generateMikro(m.id, fixedSeed(m));
      dobavit('№2', m.id, g.uslovie, { figure: g.risunok !== null });
    }
  }
  const { OPORNYE_KOSINUS_TRI_ZNAKA } = requireSrc('lib/vektory/opornye-kosinus');
  for (const t of OPORNYE_KOSINUS_TRI_ZNAKA) {
    dobavit('№2', `косинус ${t.prototype}:${t.seed}`, t.uslovie, { figure: t.risunok !== null });
  }
});

/* №3. Стереометрия. Чертёж варианта — chertezh(params), модель тела:
   её рисует движок solid/ в карточке тренажёра. */
perehodnik('№3', 'банк тренажёра', () => {
  const { BANK } = requireSrc('lib/zadanie3/index');
  for (const p of BANK) {
    p.varianty.forEach((v, i) => {
      let figure = false;
      try {
        figure = p.chertezh(v.params) != null;
      } catch {
        figure = false;
      }
      dobavit('№3', `${p.id} в${i + 1}`, p.uslovie(v.params), figure ? { figure } : {});
    });
  }
});

/* №4 и №5. Вероятность. В условии карточки (ProblemCard) до ответа
   стоят только текст и иллюстрация-картинка сюжета; рисунок метода
   (дерево, таблица исходов) появляется вместе с разбором и элементом
   условия не считается. Готовый чертёж есть у опорных задач полем
   risunok (лабиринт). Если условие само несёт <table> или <svg>,
   это тоже элемент. */
perehodnik('№4/№5', 'банк и опорные задачи', () => {
  const { BANK_4, BANK_5, PODGOTOVKA_4, PODGOTOVKA_5 } = requireSrc('lib/veroyatnost/index');
  for (const [razdel, bank, podgotovka] of [
    ['№4', BANK_4, PODGOTOVKA_4],
    ['№5', BANK_5, PODGOTOVKA_5],
  ]) {
    for (const p of bank) {
      p.varianty.forEach((v, i) => {
        const u = p.uslovie(v.params);
        dobavit(razdel, `${p.id} в${i + 1}`, u, vUslovii(u));
      });
    }
    for (const blok of podgotovka) {
      for (const z of blok.zadachi) {
        const el = vUslovii(z.uslovie);
        dobavit(razdel, z.id, z.uslovie, { ...el, figure: el.figure || z.risunok !== undefined });
      }
    }
  }
});

/* №6. Случайные величины. Рисунок условия — prototype(id).ris(params)
   (Uslovie6 → Ris6): vid 'tablica' — таблица распределения, 'eiler'
   и 'derevo' — диаграмма Эйлера и дерево (рисунок), 'zapis' — строка
   X ~ (…), это ни таблица, ни рисунок. Текст — text и posle задачи.
   Опорные микрозадачи — только текст, без рисунков и таблиц. */
perehodnik('№6', 'банк (исходные и аналоги)', () => {
  const { BANK } = requireSrc('lib/zadanie6/bank/index');
  const { prototype } = requireSrc('lib/zadanie6/prototypes/index');
  for (const z of BANK) {
    const ris = prototype(z.prototypeId).ris(z.params);
    dobavit('№6', z.id, `${z.text} ${z.posle ?? ''}`, {
      table: ris?.vid === 'tablica',
      figure: ris?.vid === 'eiler' || ris?.vid === 'derevo',
    });
  }
});
perehodnik('№6', 'опорные задачи', () => {
  const { BLOKI_OPORNYH } = requireSrc('lib/zadanie6/opornye');
  for (const b of BLOKI_OPORNYH) {
    for (const z of b.zadachi) {
      dobavit('№6', `${b.slug}/${z.id}`, z.uslovie, {});
    }
  }
});

/* №7. Уравнения. У задач нет ни таблиц, ни рисунков: карточка —
   текст условия и поле ответа. */
perehodnik('№7', 'банк и опорные задачи', () => {
  const { BANK } = requireSrc('lib/zadanie7/bank/index');
  for (const z of BANK) {
    dobavit('№7', z.id, z.text, {});
  }
  const { BLOKI_OPORNYH } = requireSrc('lib/zadanie7/opornye');
  for (const b of BLOKI_OPORNYH) {
    for (const z of b.zadachi) {
      dobavit('№7', `${b.slug}/${z.id}`, z.uslovie, {});
    }
  }
});

/* №8. Вычисления. Ни таблиц, ни рисунков: только выражение. */
perehodnik('№8', 'банк и опорные задачи', () => {
  const { BANK } = requireSrc('lib/vychisleniya/bank');
  const { generate } = requireSrc('lib/vychisleniya/generate');
  for (const entry of BANK) {
    for (const v of entry.variants) {
      const t = generate(entry.prototype, v.seed, v.level);
      dobavit('№8', `${entry.prototype}:${v.seed}`, t.uslovie, {});
    }
  }
  const { PREP_BLOCKS } = requireSrc('lib/vychisleniya/prep/blocks');
  const { fixedSeed, generatePrep } = requireSrc('lib/vychisleniya/prep/generate');
  for (const blok of PREP_BLOCKS) {
    for (const m of blok.zadachi) {
      const t = generatePrep(m.id, fixedSeed(m));
      dobavit('№8', m.id, t.uslovie, {});
    }
  }
});

/* №9. Производная. Рисунок — поле risunok (Figura: график функции или
   производной), null у задач без рисунка (физический смысл, параметр).
   Тот же рисунок у опорных микрозадач. У открытого банка — картинка
   kartinka (адрес в public). */
perehodnik('№9', 'банк тренажёра', () => {
  if (!fs.existsSync(path.join(root, 'src', 'lib', 'proizvodnaya', 'bank.ts'))) {
    throw new Error('нет lib/proizvodnaya/bank.ts');
  }
  const { BANK } = requireSrc('lib/proizvodnaya/bank');
  const { generate } = requireSrc('lib/proizvodnaya/generate');
  for (const entry of BANK) {
    for (const v of entry.variants) {
      const t = generate(entry.prototype, v.seed);
      const est = t.risunok !== null;
      dobavit('№9', `${entry.prototype}:${v.seed}`, t.uslovie, { graph: est, figure: est });
    }
  }
  const { OPEN_BANK } = requireSrc('lib/proizvodnaya/otkrytyj-bank');
  for (const z of OPEN_BANK) {
    dobavit('№9', z.id, z.uslovie, { figure: z.kartinka !== null });
  }
});
perehodnik('№9', 'опорные задачи', () => {
  const { PREP_BLOCKS } = requireSrc('lib/proizvodnaya/prep/blocks');
  const { fixedSeed, generatePrepById } = requireSrc('lib/proizvodnaya/prep/generate');
  for (const blok of PREP_BLOCKS) {
    for (const m of blok.zadachi) {
      const g = generatePrepById(m.id, fixedSeed(m));
      const est = g.risunok !== null;
      dobavit('№9', m.id, g.uslovie, { graph: est, figure: est });
    }
  }
});

/* №10. Прикладные задачи. Чертёж в условии — только мост у
   прототипа P01 (Most10). Картинка сюжета (illyustracii) — украшение,
   её может не быть, и рисунком условия она не считается. Опорные
   микрозадачи — только текст. */
perehodnik('№10', 'банк и опорные задачи', () => {
  const { BANK } = requireSrc('lib/zadanie10/bank/index');
  for (const z of BANK) {
    dobavit('№10', z.id, z.text, { figure: z.prototypeId === 'P01' });
  }
  const { BLOKI_OPORNYH } = requireSrc('lib/zadanie10/opornye');
  for (const b of BLOKI_OPORNYH) {
    for (const z of b.zadachi) {
      dobavit('№10', `${b.slug}/${z.id}`, z.uslovie, {});
    }
  }
});

/* №11. Текстовые задачи. Условие банка и разминки строит подтип:
   subtype(id).solve(params).uslovie; у аналогов текст готов (text).
   Таблица модели (solve().tables) — помощь в режиме подсказок, а не
   часть условия: в условии банка таблицы нет. У опорных микрозадач
   таблица условия — поле tablitsa (Opornye11Screen → Tablitsa11). */
perehodnik('№11', 'банк, разминка и аналоги', () => {
  const { BANK, RAZMINKA } = requireSrc('lib/zadanie11/bank');
  const { subtype } = requireSrc('lib/zadanie11/prototypes/index');
  for (const [chto, spisok] of [
    ['банк', BANK],
    ['разминка', RAZMINKA],
  ]) {
    spisok.forEach((z, i) => {
      const u = subtype(z.id).solve(z.params).uslovie;
      dobavit('№11', `${chto} ${z.id} #${i + 1}`, u, vUslovii(u));
    });
  }
  const { ANALOGI } = requireSrc('lib/zadanie11/analogi');
  for (const a of ANALOGI) {
    dobavit('№11', a.id, a.text, vUslovii(a.text));
  }
});
perehodnik('№11', 'опорные задачи', () => {
  const { BLOKI } = requireSrc('lib/zadanie11/prep/bloki');
  const { fixedSeed, generateMikro } = requireSrc('lib/zadanie11/prep/generate');
  for (const blok of BLOKI) {
    for (const m of blok.zadachi) {
      const g = generateMikro(m.id, fixedSeed(m));
      dobavit('№11', m.id, g.uslovie, { table: g.tablitsa !== undefined });
    }
  }
});

/* №12. Графики функций: наборы движка graph/ (опорные задачи и
   прототипы). График — поле svg (null у задач с noChart). Текст —
   вопрос задачи (question). */
perehodnik('№12', 'наборы graph/', () => {
  const graphData = path.join(root, 'src', 'lib', 'graph', 'data');
  const readSets = (dir) =>
    fs
      .readdirSync(path.join(graphData, dir))
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => JSON.parse(fs.readFileSync(path.join(graphData, dir, name), 'utf8')));
  const PODPAPKI = ['12', '12q', '12r', '12s', '12e', '12l', '12t'];
  const prep = PODPAPKI.flatMap((p) => readSets(`prep/${p}`));
  const prototypes = PODPAPKI.flatMap((p) => readSets(`prototypes/${p}`));
  GraphGenerate.setSets({ prep, prototypes });
  for (const set of [...prep, ...prototypes]) {
    for (const t of GraphGenerate.generateSet(set.id)) {
      const est = t.svg !== null && t.svg !== undefined;
      dobavit('№12', t.id, t.question, { graph: est, figure: est });
    }
  }
});

/* №13. Экономические задачи. Таблица условия — conditionTable (график
   долга); у задач «Заполни таблицу» (прототипы P-*) — интерактивная
   таблица tablitsaZapolni13 (не null). В опорных задачах — то, что
   реально уходит в карточку: sealTask13 (tablitsaHtml или zapolni;
   у блоков «Определи тип» zapolni всегда null). */
perehodnik('№13', 'банк тренажёра', () => {
  const { BANK_13 } = requireSrc('lib/zadanie13/bank');
  const { generate } = requireSrc('lib/zadanie13/generate');
  const { tablitsaZapolni13 } = requireSrc('lib/zadanie13/zapolni');
  for (const [prototypeId, seed] of BANK_13) {
    const t = generate(prototypeId, seed);
    const table =
      t.conditionTable !== undefined ||
      (prototypeId.startsWith('P-') && tablitsaZapolni13(t, (s) => s) !== null);
    dobavit('№13', `${prototypeId}:${seed}`, t.condition, { table });
  }
});
perehodnik('№13', 'опорные задачи', () => {
  const { BLOKI_13, zadachiBloka } = requireSrc('lib/zadanie13/opornye/bloki');
  const { generate } = requireSrc('lib/zadanie13/generate');
  const { sealTask13 } = requireSrc('lib/zadanie13/opornye/seal');
  for (const b of BLOKI_13) {
    for (const z of zadachiBloka(b)) {
      const t = generate(z.prototypeId, z.seed);
      const s = sealTask13(t, b.vid, z.no);
      dobavit('№13', `${b.slug}/${z.no} ${z.prototypeId}:${z.seed}`, t.condition, {
        table: s.tablitsaHtml !== null || s.zapolni !== null,
      });
    }
  }
});

/* №15 и №16 — пока только служебные витрины чертежей, банка задач
   нет: проверять нечего. */
neProvereno.push({
  razdel: '№15/№16',
  chto: 'весь раздел',
  prichina: 'банка задач нет — только витрины чертежей (lib/zadanie15, lib/zadanie16)',
});

/* ── Проверка ───────────────────────────────────────────────────── */

const narusheniya = [];
const upominaniy = new Map();
for (const z of zadachi) {
  const est = UPOMINANIYA.filter((u) => u.re.test(z.text));
  if (est.length > 0) upominaniy.set(z.razdel, (upominaniy.get(z.razdel) ?? 0) + 1);
  for (const u of est) {
    if (!u.ok(z.hasElement)) {
      narusheniya.push({ ...z, vid: u.vid, otryvok: otryvok(z.text, u.re) });
    }
  }
}

/* ── Отчёт ──────────────────────────────────────────────────────── */

const poRazdelam = new Map();
for (const n of narusheniya) {
  if (!poRazdelam.has(n.razdel)) poRazdelam.set(n.razdel, []);
  poRazdelam.get(n.razdel).push(n);
}
const nomer = (r) => parseInt(r.replace(/\D+/g, ''), 10) || 0;

console.log('Задачи по разделам (проверено / с упоминанием / нарушений):');
for (const r of [...skolko.keys()].sort((a, b) => nomer(a) - nomer(b))) {
  console.log(
    `  ${r.padEnd(4)} ${String(skolko.get(r)).padStart(6)} / ${String(upominaniy.get(r) ?? 0).padStart(4)} / ${poRazdelam.get(r)?.length ?? 0}`,
  );
}

if (neProvereno.length > 0) {
  console.log('\nНе проверено:');
  for (const n of neProvereno) {
    console.log(`  ${n.razdel} (${n.chto}): ${n.prichina}`);
  }
}

if (narusheniya.length > 0) {
  console.log('\nУпоминание в условии без элемента:');
  for (const r of [...poRazdelam.keys()].sort((a, b) => nomer(a) - nomer(b))) {
    const spisok = poRazdelam.get(r);
    console.log(`\n${r} — ${spisok.length}`);
    for (const n of spisok) {
      console.log(`  ${n.id} [${n.vid}]: ${n.otryvok}`);
    }
  }
}

console.log(
  `\nИтого: задач ${zadachi.length}, с упоминанием ${[...upominaniy.values()].reduce((a, b) => a + b, 0)}, нарушений ${narusheniya.length}.`,
);
process.exit(narusheniya.length > 0 ? 1 : 0);
