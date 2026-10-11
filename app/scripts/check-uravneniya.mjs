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
