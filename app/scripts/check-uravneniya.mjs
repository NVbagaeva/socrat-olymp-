#!/usr/bin/env node
/* scripts/check-uravneniya.mjs — автотест задания №7 «Простейшие уравнения».

   Запуск: pnpm test:uravneniya

   Проверки — в lib/zadanie7/selftest.ts:
     — пересчёт корней подстановкой и независимым численным поиском;
     — ОДЗ и посторонние корни;
     — распределение ответов аналогов (не меньше 12 разных из 20, ни
       один не чаще двух раз), отпечатки уравнений, свежесть файла;
     — разметка формул: KaTeX в строгом режиме, «чистота» («1x», «x^1»,
       «+ −», «−(−», лишние скобки, точка вместо запятой).
   Здесь же — формулы обычным текстом и сырой TeX вне $…$ (те же
   признаки, что у pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie7/selftest');

const { problems, solved, statistika } = checkBank(typeset);

for (const { where, item, s } of solved) {
  for (const text of [item.text, ...vseTeksty(s)]) {
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where,
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»`,
      });
    }
  }
}

/* Теория: девять разделов; каждый прототип — ровно в одной карточке;
   примеры — задачи банка своего прототипа; формулы — KaTeX строго и
   «чисто», вне $…$ нет формул обычным текстом; плашки рамок без формул. */
{
  const { RAZDELY_TEORII_7, SHPARGALKA_7, vseKartochki7 } = requireSrc('content/teoriya7');
  const { PROTOTYPES } = requireSrc('lib/zadanie7/prototypes');
  const { gigienaFormuly, formuly } = requireSrc('lib/zadanie7/selftest');
  const idsBanka = new Map(solved.map((x) => [x.item.id, x.item.prototypeId]));
  const stroki = [];
  const display = (tex, where) => {
    try {
      katex.renderToString(tex, { throwOnError: true, strict: 'error', displayMode: true });
    } catch (e) {
      problems.push({ where, what: `KaTeX: ${e.message.slice(0, 100)}` });
    }
    gigienaFormuly(tex).forEach((b) =>
      problems.push({ where, what: `формула: ${b} в «${tex.slice(0, 60)}»` }),
    );
  };
  if (RAZDELY_TEORII_7.length !== 9) {
    problems.push({ where: 'теория', what: `разделов ${RAZDELY_TEORII_7.length}, нужно 9` });
  }
  for (const r of RAZDELY_TEORII_7) {
    const where = `теория ${r.id}`;
    stroki.push([where, r.lead], [where, r.title]);
    for (const b of r.bloki) {
      for (const k of ['paras', 'spisok']) (b[k] ?? []).forEach((t) => stroki.push([where, t]));
      for (const k of ['podpis', 'oshibka', 'pravilno', 'uslovie', 'otvet']) {
        if (typeof b[k] === 'string') stroki.push([where, b[k]]);
      }
      if (typeof b.title === 'string') {
        stroki.push([where, b.title]);
        if (['opredelenie', 'vazhno', 'vyvod', 'lovushka'].includes(b.vid) && /\$/.test(b.title)) {
          problems.push({ where, what: `формула в плашке рамки: «${b.title}»` });
        }
      }
      if (b.formula) display(b.formula, where);
      if (b.rows) [b.head, ...b.rows].flat().forEach((t) => stroki.push([where, t]));
      if (b.vid === 'primer' && !idsBanka.has(b.zadacha)) {
        problems.push({ where, what: `пример ${b.zadacha} не из банка` });
      }
      if (b.vid === 'kartochki') {
        for (const k of b.kartochki) {
          const w = `${where} карточка ${k.id}`;
          stroki.push([w, k.title]);
          for (const bl of k.bloki) {
            bl.tekst.forEach((t) => stroki.push([w, t]));
            if (bl.formula) display(bl.formula, w);
          }
          if (k.primer !== undefined) {
            const p = idsBanka.get(k.primer);
            if (p === undefined)
              problems.push({ where: w, what: `пример ${k.primer} не из банка` });
            else if (k.prototipy.length > 0 && !k.prototipy.includes(p)) {
              problems.push({
                where: w,
                what: `пример ${k.primer} — прототип ${p}, не из карточки`,
              });
            }
          }
        }
      }
    }
  }
  const karty = vseKartochki7();
  if (new Set(karty.map((k) => k.id)).size !== karty.length) {
    problems.push({ where: 'теория', what: 'повторяются id карточек' });
  }
  for (const p of PROTOTYPES) {
    const n = karty.filter((k) => k.prototipy.includes(p.id)).length;
    if (n !== 1)
      problems.push({
        where: `теория ${p.id}`,
        what: `прототип в ${n} карточках, нужно ровно в одной`,
      });
  }
  for (const id of SHPARGALKA_7.razdely) {
    if (!RAZDELY_TEORII_7.some((r) => r.id === id))
      problems.push({ where: 'шпаргалка', what: `нет раздела ${id}` });
  }
  SHPARGALKA_7.algoritm.forEach((t) => stroki.push(['шпаргалка', t]));
  for (const [where, t] of stroki) {
    for (const f of formuly(t)) {
      try {
        typeset(f);
      } catch (e) {
        problems.push({ where, what: `KaTeX: ${e.message.slice(0, 100)} в «${f.slice(0, 60)}»` });
      }
      gigienaFormuly(f).forEach((b) =>
        problems.push({ where, what: `формула: ${b} в «${f.slice(0, 60)}»` }),
      );
    }
    const plain = stripDollarMath(t).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({ where, what: `вне KaTeX (${f.rule}): «${f.match}» в «${t.slice(0, 60)}»` });
    }
  }
  console.log(
    `Теория: разделов ${RAZDELY_TEORII_7.length}, карточек ${karty.length}, строк проверено ${stroki.length}.`,
  );
}

/* Вкладки раздела (PR3): данные для браузера совпадают с банком и без
   ответов; опорные задачи — 8 блоков по 10, ответ пересчитан своей
   проверкой; группы генератора — те же, что у прототипов; сборка листа
   и план тренировки детерминированы и без повторов; ответ ученика
   принимается в любом верном виде. */
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { APP } = await import('./lib/load-ts.mjs');
  const { FIPI, ANALOGI_PO_PROTOTIPAM, BANK } = requireSrc('lib/zadanie7/bank/index');
  const { dannyeDlyaBrauzera } = requireSrc('lib/zadanie7/dannye-server');
  const { BLOKI_OPORNYH, opornyeDlyaBrauzera } = requireSrc('lib/zadanie7/opornye');
  const { GRUPPY_PROTOTIPOV, sobratList, parseZapros, zaprosQuery } =
    requireSrc('lib/zadanie7/sborka');
  const { planTrenirovki } = requireSrc('lib/zadanie7/trenazher');
  const { answerMatches7 } = requireSrc('lib/zadanie7/otvet');
  const { sealAnswer, openText } = requireSrc('lib/zadanie7/secret');
  const { PROTOTYPES } = requireSrc('lib/zadanie7/prototypes');
  const { rngOf } = requireSrc('lib/vychisleniya/rng');

  /* public/data/zadanie7 — свежие и без ответов. */
  const dir = path.join(APP, 'public/data/zadanie7');
  const nado = dannyeDlyaBrauzera(FIPI, ANALOGI_PO_PROTOTIPAM);
  for (const [fail, tekst] of Object.entries(nado)) {
    const full = path.join(dir, `${fail}.json`);
    if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8') !== tekst) {
      problems.push({
        where: `public/data/zadanie7/${fail}.json`,
        what: 'устарел: pnpm build:bank-7',
      });
    }
  }
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const t = fs.readFileSync(path.join(dir, name), 'utf8');
    if (/"answer"|"korni"|"etapy"/.test(t)) {
      problems.push({
        where: `public/data/zadanie7/${name}`,
        what: 'в данных для браузера есть ответ или разбор',
      });
    }
  }

  /* Опорные задачи. */
  if (BLOKI_OPORNYH.length !== 8) {
    problems.push({ where: 'опорные', what: `блоков ${BLOKI_OPORNYH.length}, нужно 8` });
  }
  for (const b of BLOKI_OPORNYH) {
    if (b.zadachi.length !== 10) {
      problems.push({ where: `опорные ${b.slug}`, what: `задач ${b.zadachi.length}, нужно 10` });
    }
    if (/\$|\\/.test(b.opisanie) || /\$|\\/.test(b.nazvanie)) {
      problems.push({ where: `опорные ${b.slug}`, what: 'формула на карточке блока' });
    }
    for (const z of b.zadachi) {
      const v = z.proverka();
      if (Math.abs(v - z.answer) > 1e-9) {
        problems.push({ where: `опорные ${z.id}`, what: `ответ ${z.answer}, пересчёт ${v}` });
      }
      if (
        !Number.isFinite(z.answer) ||
        Math.abs(z.answer * 1e6 - Math.round(z.answer * 1e6)) > 1e-6
      ) {
        problems.push({ where: `опорные ${z.id}`, what: `ответ не конечная дробь: ${z.answer}` });
      }
      for (const t of [z.uslovie, z.podskazka, ...z.razbor]) {
        for (const f of t.match(/\$[^$]+\$/g) ?? []) {
          try {
            typeset(f.slice(1, -1));
          } catch (e) {
            problems.push({ where: `опорные ${z.id}`, what: `KaTeX: ${e.message.slice(0, 80)}` });
          }
        }
      }
    }
    for (const m of opornyeDlyaBrauzera(b)) {
      const z = b.zadachi.find((x) => x.id === m.id);
      if (JSON.stringify(JSON.parse(openText(m.razbor, m.id))) !== JSON.stringify(z.razbor)) {
        problems.push({ where: `опорные ${m.id}`, what: 'закрытый разбор не открывается' });
      }
    }
    if (/"answer"|Ответ:/.test(JSON.stringify(opornyeDlyaBrauzera(b)))) {
      problems.push({ where: `опорные ${b.slug}`, what: 'ответ уходит в браузер' });
    }
  }

  /* Группы генератора и тренажёра = группы прототипов. */
  for (const p of PROTOTYPES) {
    if (!(GRUPPY_PROTOTIPOV[p.group] ?? []).includes(p.id)) {
      problems.push({ where: 'sborka.ts', what: `${p.id} нет в группе ${p.group}` });
    }
  }
  const vGruppah = Object.values(GRUPPY_PROTOTIPOV).flat();
  if (vGruppah.length !== PROTOTYPES.length) {
    problems.push({
      where: 'sborka.ts',
      what: `в группах ${vGruppah.length}, прототипов ${PROTOTYPES.length}`,
    });
  }

  /* Лист генератора: адрес → тот же лист; без повторов; ученик и учитель одинаковы. */
  const indeks = BANK.map((b) => ({
    id: b.id,
    p: b.prototypeId,
    s: b.source === 'fipi' ? 'f' : 'a',
  }));
  const zapros = {
    tipy: PROTOTYPES.map((p) => ({ id: p.id, n: 2 })),
    istochnik: 'mix',
    variantov: 3,
    primery: 2,
    seed: 'AB12',
  };
  const q = new URLSearchParams(zaprosQuery(zapros));
  const z2 = parseZapros(q);
  const a = JSON.stringify(sobratList(zapros, indeks));
  if (z2 === null || JSON.stringify(sobratList(z2, indeks)) !== a) {
    problems.push({ where: 'sborka.ts', what: 'лист по адресу не совпал с листом по запросу' });
  }
  const m = sobratList(zapros, indeks);
  const ids = m.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
  if (new Set(ids).size !== ids.length) {
    problems.push({ where: 'sborka.ts', what: 'на листе генератора повторяются задачи' });
  }
  const fipiOnly = sobratList({ ...zapros, istochnik: 'fipi', seed: 'CD34', primery: 0 }, indeks);
  for (const id of fipiOnly.bloki.flatMap((b) => b.spiski.flat())) {
    const it = BANK.find((b) => b.id === id);
    if (
      it &&
      it.source !== 'fipi' &&
      FIPI.some(
        (f) =>
          f.prototypeId === it.prototypeId &&
          !fipiOnly.bloki.some((b) => b.spiski.flat().includes(f.id)),
      )
    ) {
      problems.push({
        where: 'sborka.ts',
        what: `«только ФИПИ» взял аналог ${id}, хотя ФИПИ остались`,
      });
    }
  }

  /* План тренировки: детерминирован при одном random, без повторов, нужное число. */
  const r1 = rngOf('z7-plan');
  const r2 = rngOf('z7-plan');
  const n = { istochnik: 'mix', tipy: ['P01', 'P13', 'P26'], skolko: 20 };
  const p1 = planTrenirovki(indeks, n, () => r1.next());
  const p2 = planTrenirovki(indeks, n, () => r2.next());
  if (
    JSON.stringify(p1) !== JSON.stringify(p2) ||
    new Set(p1).size !== p1.length ||
    p1.length !== 20
  ) {
    problems.push({
      where: 'trenazher.ts',
      what: `план тренировки: ${p1.length} задач, повторы или не детерминирован`,
    });
  }
  const bezFipi = planTrenirovki(
    indeks,
    { istochnik: 'fipi', tipy: ['P10'], skolko: 5 },
    Math.random,
  );
  if (bezFipi.length !== 5) {
    problems.push({ where: 'trenazher.ts', what: 'П-10 в режиме «только ФИПИ» не дал аналогов' });
  }

  /* Ответ ученика в любом верном виде. */
  const pecat = sealAnswer(1.4);
  for (const v of ['1,4', '1.4', '7/5', '−(−1,4)', ' 1,40 ', '14/10']) {
    if (!answerMatches7(v, pecat)) {
      problems.push({ where: 'otvet.ts', what: `«${v}» не принят как 1,4` });
    }
  }
  for (const v of ['1,41', '-1,4', '7/4', 'abc', '']) {
    if (answerMatches7(v, pecat)) {
      problems.push({ where: 'otvet.ts', what: `«${v}» принят как 1,4` });
    }
  }
  console.log(
    `Вкладки: опорных ${BLOKI_OPORNYH.length}×10, лист генератора ${ids.length} задач, план ${p1.length}.`,
  );
}

statistika.forEach((s) => console.log(s));
console.log(`Задач проверено: ${solved.length}.`);

if (problems.length > 0) {
  console.error(`\nПроблем: ${problems.length}`);
  for (const p of problems.slice(0, 200)) {
    console.error(`  ${p.where}: ${p.what}`);
  }
  if (problems.length > 200) {
    console.error(`  … и ещё ${problems.length - 200}`);
  }
  process.exit(1);
}
console.log('Банк задания №7 в порядке.');
