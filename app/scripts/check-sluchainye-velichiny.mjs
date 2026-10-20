#!/usr/bin/env node
/* scripts/check-sluchainye-velichiny.mjs — автотест задания №6
   «Случайные величины и распределения».

   Запуск: pnpm test:sluchainye-velichiny

   Проверки — в lib/zadanie6/selftest.ts:
     — пересчёт ответов решателем и независимо, по параметрам;
     — суммы вероятностей (распределения, ветви дерева, билеты);
     — распределение ответов аналогов (не меньше 20 разных из 50, ни
       один не чаще трёх раз), свежесть файла аналогов;
     — уникальность наборов чисел;
     — доля сюжетных задач: 20 из 50, по две на тему;
     — разметка формул (KaTeX строго, «чистота», тысячи, запятая);
     — рисунки: раскладка диаграмм Эйлера и деревьев.
   Здесь же — формулы обычным текстом и сырой TeX вне $…$ (те же
   признаки, что у pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie6/selftest');

const { problems, solved, statistika } = checkBank(typeset);

for (const { where, u, s } of solved) {
  for (const text of vseTeksty(u, s)) {
    const plain = stripDollarMath(text).replace(/\*\*/g, '');
    for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
      problems.push({
        where,
        what: `вне KaTeX (${f.rule}): «${f.match}» в «${text.slice(0, 70)}»`,
      });
    }
  }
}

/* Проверка проверки: диаграмма с подписями друг на друге и дерево с
   подписью на ветке обязаны дать замечания. */
{
  const { problemyEilera, EILER } = requireSrc('components/probability/eilerRaskladka');
  const { problemyDereva } = requireSrc('lib/zadanie6/selftest');
  const { raskladkaDereva } = requireSrc('components/probability/derevoRaskladka');
  const box = (x, y) => ({ x, y, halfW: 8, halfH: 6 });
  const plohaya = {
    w: EILER.w,
    h: EILER.h,
    s: box(16, 17),
    tochki: [
      { cx: 100, cy: 80, znachenie: box(100, 70) },
      { cx: 104, cy: 82, znachenie: box(104, 72) },
    ],
  };
  if (problemyEilera(plohaya).length === 0) {
    problems.push({
      where: 'самопроверка',
      what: 'наложение подписей на диаграмме Эйлера не поймано',
    });
  }
  const r = raskladkaDereva({
    branches: [
      { id: 'a', parent: null, label: '', p: 0.5 },
      { id: 'b', parent: null, label: '', p: 0.5 },
    ],
  });
  const naVetke = {
    ...r,
    metki: r.metki.map((m) => ({
      ...m,
      x: (r.otrezki[0].x1 + r.otrezki[0].x2) / 2,
      anchor: 'start',
    })),
  };
  if (problemyDereva(naVetke).length === 0) {
    problems.push({ where: 'самопроверка', what: 'подпись на ветке дерева не поймана' });
  }
}

/* Теория (PR2): девять разделов; каждый прототип — ровно в одной
   карточке; примеры — задачи банка своего прототипа; формулы — KaTeX
   строго и «чисто», вне $…$ нет формул обычным текстом; в плашках рамок
   нет формул; «Проверь себя» после каждого раздела: один верный вариант,
   все варианты разные, у каждой ошибки — подсказка, ответ «красивый». */
{
  const { RAZDELY_TEORII_6, SHPARGALKA_6, vseKartochki6 } = requireSrc('content/teoriya6');
  const { PROTOTYPES } = requireSrc('lib/zadanie6/prototypes');
  const { NABORY_PROVERKI_6 } = requireSrc('lib/zadanie6/proverka');
  const { gigienaFormuly, formuly } = requireSrc('lib/zadanie6/selftest');
  const { rngOf } = requireSrc('lib/vychisleniya/rng');
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
  if (RAZDELY_TEORII_6.length !== 9) {
    problems.push({ where: 'теория', what: `разделов ${RAZDELY_TEORII_6.length}, нужно 9` });
  }
  for (const r of RAZDELY_TEORII_6) {
    const where = `теория ${r.id}`;
    stroki.push([where, r.lead], [where, r.title]);
    const nabory = r.bloki.filter((b) => b.vid === 'proverka');
    if (nabory.length !== 1)
      problems.push({ where, what: `«Проверь себя» в разделе ${nabory.length} раз, нужно 1` });
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
      if (b.shagi)
        b.shagi.forEach((sh) =>
          [sh.label, ...(sh.paras ?? [])].forEach((t) => stroki.push([where, t])),
        );
      if (b.rows) [b.head, ...b.rows].flat().forEach((t) => stroki.push([where, t]));
      if (b.vid === 'ris' && b.ris.vid === 'tablica')
        b.ris.tablica.stroki.forEach((st) =>
          [st.zag, ...st.yach].forEach((t) => stroki.push([where, t])),
        );
      if (b.vid === 'primer' && !idsBanka.has(b.zadacha)) {
        problems.push({ where, what: `пример ${b.zadacha} не из банка` });
      }
      if (b.vid === 'proverka' && !NABORY_PROVERKI_6[b.nabor]) {
        problems.push({ where, what: `нет набора «Проверь себя» ${b.nabor}` });
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
  /* Суммы в рисунках теории: вероятности точек и листьев. */
  const { RAZDELY_TEORII_6: R } = requireSrc('content/teoriya6');
  for (const r of R) {
    for (const b of r.bloki) {
      if (b.vid === 'ris' && b.ris.vid === 'eiler') {
        const s = b.ris.tochki.reduce((a, t) => a + Number(String(t.p).replace('{,}', '.')), 0);
        if (Math.abs(s - 1) > 1e-9)
          problems.push({ where: `теория ${r.id}`, what: `вероятности точек в сумме ${s}` });
      }
      if (b.vid === 'ris' && b.ris.vid === 'derevo') {
        const v = b.ris.vetki;
        for (const u of [null, ...v.map((x) => x.id)]) {
          const deti = v.filter((x) => x.parent === u);
          const s = deti.reduce((a, x) => a + x.pv, 0);
          if (deti.length > 0 && Math.abs(s - 1) > 1e-9)
            problems.push({ where: `теория ${r.id}`, what: `рёбра из ${u ?? 'S'} в сумме ${s}` });
        }
      }
    }
  }
  const karty = vseKartochki6();
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
  for (const id of SHPARGALKA_6.razdely) {
    if (!RAZDELY_TEORII_6.some((r) => r.id === id))
      problems.push({ where: 'шпаргалка', what: `нет раздела ${id}` });
  }
  SHPARGALKA_6.glavnoe.forEach((t) => stroki.push(['шпаргалка', t]));

  /* «Проверь себя»: по 10 экземпляров каждого шаблона, как на странице. */
  let ekz = 0;
  for (const [nabor, shablony] of Object.entries(NABORY_PROVERKI_6)) {
    for (const sh of shablony) {
      for (let n = 0; n < 10; n += 1) {
        const z = sh.sozdat(rngOf(`${sh.id}|${n}`), n);
        const where = `проверь себя ${nabor}/${sh.id}#${n}`;
        ekz += 1;
        const verny = z.varianty.filter((v) => v.verno);
        if (verny.length !== 1) problems.push({ where, what: `верных вариантов ${verny.length}` });
        if (z.varianty.length < 3)
          problems.push({ where, what: `вариантов ${z.varianty.length}, нужно не меньше 3` });
        if (new Set(z.varianty.map((v) => v.tekst)).size !== z.varianty.length)
          problems.push({ where, what: 'варианты повторяются' });
        for (const v of z.varianty) {
          if (/\{,\}\d{5,}/.test(v.tekst))
            problems.push({ where, what: `вариант с длинной дробью: ${v.tekst}` });
        }
        for (const v of z.varianty)
          if (!v.verno && !v.podskazka)
            problems.push({ where, what: `у ошибки ${v.tekst} нет подсказки` });
        if (
          z.znachenie !== undefined &&
          Math.abs(z.znachenie * 1e4 - Math.round(z.znachenie * 1e4)) > 1e-6
        ) {
          problems.push({ where, what: `ответ не конечная дробь: ${z.znachenie}` });
        }
        if (
          z.znachenie !== undefined &&
          !verny.some(
            (v) =>
              v.tekst ===
              `$${String(Math.round(z.znachenie * 1e9) / 1e9)
                .replace('.', '{,}')
                .replace('-', '-')}$`,
          )
        ) {
          problems.push({
            where,
            what: `верный вариант ${verny[0]?.tekst} не совпадает с ответом ${z.znachenie}`,
          });
        }
        [
          z.uslovie,
          ...z.razbor,
          ...z.varianty.flatMap((v) => [v.tekst, v.podskazka ?? '']),
        ].forEach((t) => stroki.push([where, t]));
      }
    }
  }

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
    `Теория: разделов ${RAZDELY_TEORII_6.length}, карточек ${karty.length}, «Проверь себя» — ${ekz} экземпляров, строк проверено ${stroki.length}.`,
  );
}

/* Вкладки раздела (PR3): данные для браузера совпадают с банком и без
   ответов; опорные задачи — 7 блоков по 10, ответ пересчитан своей
   проверкой; группы генератора — те же, что у прототипов; сборка листа
   и план тренировки детерминированы, без повторов, со своим стилем;
   ответ ученика принимается в любом верном виде. */
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { APP } = await import('./lib/load-ts.mjs');
  const { ISTOCHNIKI, ANALOGI_PO_PROTOTIPAM, BANK } = requireSrc('lib/zadanie6/bank/index');
  const { dannyeDlyaBrauzera } = requireSrc('lib/zadanie6/dannye-server');
  const { BLOKI_OPORNYH, opornyeDlyaBrauzera } = requireSrc('lib/zadanie6/opornye');
  const { GRUPPY_PROTOTIPOV, sobratList, parseZapros, zaprosQuery } =
    requireSrc('lib/zadanie6/sborka');
  const { planTrenirovki } = requireSrc('lib/zadanie6/trenazher');
  const { SHABLONY_6 } = requireSrc('lib/zadanie6/shablony');
  const { answerMatches6 } = requireSrc('lib/zadanie6/otvet');
  const { sealAnswer, openText } = requireSrc('lib/zadanie6/secret');
  const { PROTOTYPES } = requireSrc('lib/zadanie6/prototypes');
  const { rngOf } = requireSrc('lib/vychisleniya/rng');
  const { ZADANIE6 } = requireSrc('content/zadanie6');

  if (ZADANIE6.tabs.some((t) => t.id === 'repetitory')) {
    problems.push({ where: 'content/zadanie6.ts', what: 'вкладка «Для репетиторов» показывается' });
  }

  const dir = path.join(APP, 'public/data/zadanie6');
  const nado = dannyeDlyaBrauzera(ISTOCHNIKI, ANALOGI_PO_PROTOTIPAM);
  for (const [fail, tekst] of Object.entries(nado)) {
    const full = path.join(dir, `${fail}.json`);
    if (!fs.existsSync(full) || fs.readFileSync(full, 'utf8') !== tekst) {
      problems.push({
        where: `public/data/zadanie6/${fail}.json`,
        what: 'устарел: pnpm build:bank-6',
      });
    }
  }
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    const t = fs.readFileSync(path.join(dir, name), 'utf8');
    if (/"answer"|"etapy"|"hints"/.test(t)) {
      problems.push({
        where: `public/data/zadanie6/${name}`,
        what: 'в данных для браузера есть ответ или разбор',
      });
    }
  }

  if (BLOKI_OPORNYH.length !== 7)
    problems.push({ where: 'опорные', what: `блоков ${BLOKI_OPORNYH.length}, нужно 7` });
  for (const b of BLOKI_OPORNYH) {
    if (b.zadachi.length !== 10)
      problems.push({ where: `опорные ${b.slug}`, what: `задач ${b.zadachi.length}, нужно 10` });
    if (/\$|\\/.test(b.opisanie) || /\$|\\/.test(b.nazvanie)) {
      problems.push({ where: `опорные ${b.slug}`, what: 'формула на карточке блока' });
    }
    for (const z of b.zadachi) {
      const v = z.proverka();
      if (Math.abs(v - z.answer) > 1e-9)
        problems.push({ where: `опорные ${z.id}`, what: `ответ ${z.answer}, пересчёт ${v}` });
      if (
        !Number.isFinite(z.answer) ||
        Math.abs(z.answer * 1e4 - Math.round(z.answer * 1e4)) > 1e-6
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
        const plain = stripDollarMath(t).replace(/\*\*/g, '');
        for (const f of [...findPlainMath(plain), ...findRawTex(plain)]) {
          problems.push({ where: `опорные ${z.id}`, what: `вне KaTeX (${f.rule}): «${f.match}»` });
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

  for (const p of PROTOTYPES) {
    if (!(GRUPPY_PROTOTIPOV[p.group] ?? []).includes(p.id)) {
      problems.push({ where: 'sborka.ts', what: `${p.id} нет в группе ${p.group}` });
    }
  }
  if (Object.values(GRUPPY_PROTOTIPOV).flat().length !== PROTOTYPES.length) {
    problems.push({ where: 'sborka.ts', what: 'в группах не все прототипы или лишние' });
  }
  for (const sh of SHABLONY_6) {
    for (const id of sh.tipy)
      if (!PROTOTYPES.some((p) => p.id === id))
        problems.push({ where: `шаблон ${sh.id}`, what: `нет прототипа ${id}` });
  }

  const indeks = BANK.map((b) => ({
    id: b.id,
    p: b.prototypeId,
    s: b.source === 'analog' ? 'a' : 'f',
    st: b.stil === 'syuzhet' ? 's' : 'f',
  }));
  const poId = new Map(BANK.map((b) => [b.id, b]));
  const zapros = {
    tipy: PROTOTYPES.map((p) => ({ id: p.id, n: 2 })),
    istochnik: 'mix',
    variantov: 3,
    primery: 2,
    stil: 'vse',
    seed: 'AB12',
  };
  const z2 = parseZapros(new URLSearchParams(zaprosQuery(zapros)));
  const list = sobratList(zapros, indeks);
  if (z2 === null || JSON.stringify(sobratList(z2, indeks)) !== JSON.stringify(list)) {
    problems.push({ where: 'sborka.ts', what: 'лист по адресу не совпал с листом по запросу' });
  }
  const ids = list.bloki.flatMap((b) => [...b.spiski.flat(), ...(b.primery ?? [])]);
  if (new Set(ids).size !== ids.length)
    problems.push({ where: 'sborka.ts', what: 'на листе генератора повторяются задачи' });
  if (ids.length !== PROTOTYPES.length * 2 * 3 + PROTOTYPES.length * 2) {
    problems.push({ where: 'sborka.ts', what: `на листе ${ids.length} задач — не хватило задач` });
  }
  const syuzh = sobratList({ ...zapros, stil: 'syuzhet', primery: 0, seed: 'SJ01' }, indeks);
  for (const id of syuzh.bloki.flatMap((b) => b.spiski.flat())) {
    if (poId.get(id)?.stil !== 'syuzhet')
      problems.push({ where: 'sborka.ts', what: `«только сюжетные» взял ${id}` });
  }
  const standart = sobratList({ ...zapros, stil: 'standart', primery: 0, seed: 'ST01' }, indeks);
  for (const id of standart.bloki.flatMap((b) => b.spiski.flat())) {
    if (poId.get(id)?.stil !== 'fipi')
      problems.push({ where: 'sborka.ts', what: `«стандартные» взял сюжетную ${id}` });
  }
  const fipiOnly = sobratList(
    { ...zapros, istochnik: 'fipi', variantov: 1, seed: 'CD34', primery: 0 },
    indeks,
  );
  const vzyato = fipiOnly.bloki.flatMap((b) => b.spiski.flat());
  for (const id of vzyato) {
    const it = poId.get(id);
    if (
      it &&
      it.source === 'analog' &&
      ISTOCHNIKI.some((f) => f.prototypeId === it.prototypeId && !vzyato.includes(f.id))
    ) {
      problems.push({
        where: 'sborka.ts',
        what: `«только исходные» взял аналог ${id}, хотя исходные остались`,
      });
    }
  }

  const r1 = rngOf('z6-plan');
  const r2 = rngOf('z6-plan');
  const n = { istochnik: 'mix', stil: 'vse', tipy: ['P01', 'P03', 'P10'], skolko: 20 };
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
  const pSyuzh = planTrenirovki(
    indeks,
    { istochnik: 'mix', stil: 'syuzhet', tipy: ['P04', 'P12'], skolko: 15 },
    Math.random,
  );
  if (pSyuzh.length !== 15 || pSyuzh.some((id) => poId.get(id)?.stil !== 'syuzhet')) {
    problems.push({
      where: 'trenazher.ts',
      what: 'план «только сюжетные» взял не сюжетную задачу',
    });
  }
  const pIsh = planTrenirovki(
    indeks,
    { istochnik: 'fipi', stil: 'vse', tipy: ['P04'], skolko: 4 },
    Math.random,
  );
  if (pIsh.length !== 4 || pIsh.some((id) => poId.get(id)?.source === 'analog')) {
    problems.push({
      where: 'trenazher.ts',
      what: '«только исходные» у 6.4 (4 исходные) взял аналог',
    });
  }

  const pecat = sealAnswer(0.75);
  for (const v of ['0,75', '0.75', '3/4', '75/100', ' 0,750 ', '+0,75', '−(−0,75)']) {
    if (!answerMatches6(v, pecat))
      problems.push({ where: 'otvet.ts', what: `«${v}» не принят как 0,75` });
  }
  for (const v of ['0,7', '-0,75', '4/3', 'abc', '', '75']) {
    if (answerMatches6(v, pecat))
      problems.push({ where: 'otvet.ts', what: `«${v}» принят как 0,75` });
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
console.log('Банк задания №6 в порядке.');
