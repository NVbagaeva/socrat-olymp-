#!/usr/bin/env node
/* scripts/check-prikladnye.mjs — автотест задания №10
   «Задачи с прикладным (физическим) содержанием».

   Запуск: pnpm test:prikladnye

   Проверки — в lib/zadanie10/selftest.ts: пересчёт ответов ФИПИ и
   аналогов, отпечатки, распределение ответов, диапазоны величин,
   KaTeX в строгом режиме, «чистота» формул (нет «1x», «+ −», «−(−»,
   лишних скобок), подписи этапов и подсказки. Здесь же — формулы
   обычным текстом и сырой TeX вне $…$ (те же признаки, что у
   pnpm test:math-markup).

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { createRequire } from 'node:module';
import { requireSrc } from './lib/load-ts.mjs';
import { findPlainMath, findRawTex, stripDollarMath } from './lib/math-markup.mjs';

const require = createRequire(import.meta.url);
const katex = require('katex');
const typeset = (tex) => katex.renderToString(tex, { throwOnError: true, strict: 'error' });

const { checkBank, vseTeksty } = requireSrc('lib/zadanie10/selftest');
const { PROTOTYPES } = requireSrc('lib/zadanie10/prototypes');
const { ISKLYUCHENIYA } = requireSrc('lib/zadanie10/bank/analogi');

const { problems, solved } = checkBank(typeset);

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

/* Чертёж моста (П-01): все задачи банка, оба режима. */
const { chertezhMosta } = requireSrc('lib/zadanie10/chertezh/most');
let mostov = 0;
for (const { where, item } of solved.filter((x) => x.item.prototypeId === 'P01')) {
  const dlina = String(item.answer).replace('.', ',') + ' м';
  for (const rezhim of ['uchenik', 'uchitel']) {
    const { svg, report } = chertezhMosta(item.params, rezhim);
    mostov += 1;
    report.nalozheniya.forEach((n) =>
      problems.push({ where: `${where} мост (${rezhim})`, what: n }),
    );
    for (const slovo of ['цепь', 'ванта', 'пилон', 'полотно моста']) {
      if (!svg.includes(`>${slovo}<`)) {
        problems.push({ where: `${where} мост (${rezhim})`, what: `нет подписи «${slovo}»` });
      }
    }
    const vydelena = svg.includes('z10-most__vanta-iskomaya');
    const podpisana = svg.includes(`>${dlina}<`);
    if (rezhim === 'uchenik' && (vydelena || podpisana)) {
      problems.push({
        where: `${where} мост (ученик)`,
        what: 'ванта из условия выделена или подписана',
      });
    }
    if (rezhim === 'uchitel' && !(vydelena && podpisana)) {
      problems.push({
        where: `${where} мост (учитель)`,
        what: 'ванта из условия не выделена или длина не подписана',
      });
    }
  }
}
console.log(`Чертежей моста проверено: ${mostov}.`);

/* Теория: формулы рамок и строки с $…$ — KaTeX строго и «чисто»;
   примеры — задачи банка; «Где на ЕГЭ» — существующие прототипы. */
const { RAZDELY_TEORII_10, FIZIKA_10, bezSsylok } = requireSrc('content/teoriya10');
const kond = requireSrc('lib/zadanie10/teoriya-kondensator');
const { UROKI_10 } = requireSrc('content/uroki10');
const { gigienaFormuly, formuly } = requireSrc('lib/zadanie10/selftest');
const idsBanka = new Set(solved.map((x) => x.item.id));
const idsProto = new Set(PROTOTYPES.map((p) => p.id));
const strokiTeorii = [];
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
if (RAZDELY_TEORII_10.length !== 9) {
  problems.push({ where: 'теория', what: `разделов ${RAZDELY_TEORII_10.length}, нужно 9` });
}
/* Блоки раздела вместе с вложенными (пример под кнопкой «Пример ▸»). */
const vseBloki = (bloki) =>
  bloki.flatMap((b) => (b.vid === 'razvorot' ? [b, ...vseBloki([b.blok])] : [b]));
const primeryRazdela = (r) =>
  vseBloki(r.bloki)
    .filter((b) => ['primer', 'primerRuchnoy', 'primerKondensator'].includes(b.vid))
    .map((b) => b.title);
for (const r of RAZDELY_TEORII_10) {
  const where = `теория ${r.id}`;
  strokiTeorii.push([where, r.lead]);
  /* Пример про конденсатор: шаги и «Почему так» считает сервер — сверяем
     ответ с решателем банка и таблицу с формулой. */
  for (const b of vseBloki(r.bloki)) {
    if (b.vid !== 'primerKondensator' && b.vid !== 'pochemuKondensator') continue;
    const item = solved.find((x) => x.item.id === b.zadacha);
    if (!item) {
      problems.push({ where, what: `пример ${b.zadacha} не из банка` });
      continue;
    }
    const p = kond.paramsKondensatora(item.item.params);
    if (b.vid === 'primerKondensator') {
      const pr = kond.primerKondensatora(p, b.zametka ?? false);
      if (
        Math.abs(pr.answer - item.s.answer) > 1e-9 ||
        Math.abs(pr.answer - item.item.answer) > 1e-9
      ) {
        problems.push({
          where,
          what: `${b.zadacha}: ответ примера ${pr.answer}, банк ${item.item.answer}, решатель ${item.s.answer}`,
        });
      }
      if (pr.shagi.length !== 7)
        problems.push({ where, what: `${b.zadacha}: шагов ${pr.shagi.length}, нужно 7` });
      for (const sh of pr.shagi) {
        strokiTeorii.push([where, sh.label], ...(sh.paras ?? []).map((t) => [where, t]));
        (sh.formuly ?? []).forEach((f) => display(f, `${where} ${b.zadacha}`));
      }
      strokiTeorii.push([where, pr.otvet]);
    } else {
      const pq = kond.pochemuKondensatora(p);
      const r0 = kond.raschet(p);
      for (const t of pq.tochki) {
        const nado = p.alpha * p.Cm * p.Rm * Math.log2(p.U0 / t.U);
        if (Math.abs(nado - t.t) > 1e-9)
          problems.push({ where, what: `«Почему так»: при U=${t.U} t=${t.t}, по формуле ${nado}` });
      }
      const gran = pq.tochki.find((t) => Math.abs(t.t - p.t) < 1e-9);
      if (!gran || Math.abs(gran.U - item.s.answer) > 1e-9) {
        problems.push({
          where,
          what: `«Почему так»: в таблице нет точки (${p.t}; ${item.s.answer})`,
        });
      }
      if (r0.k !== Math.log2(p.U0 / item.s.answer))
        problems.push({ where, what: '«Почему так»: k не совпадает с ответом' });
      [...pq.paras, pq.podpis, ...pq.head, ...pq.rows.flat()].forEach((t) =>
        strokiTeorii.push([where, t]),
      );
      kond.chertezhRazryada(p);
    }
  }
  /* Отсылки «(см. пример «…»)» ведут на пример этой карточки
     или указанного раздела; на печати (bezSsylok) их не остаётся. */
  for (const b of vseBloki(r.bloki)) {
    const teksty = [...(b.paras ?? []), b.oshibka, b.pravilno].filter(Boolean);
    for (const t of teksty) {
      for (const m of t.matchAll(/\(см\. ([^)]*)\)/g)) {
        const nRazdela = /в разделе (\d+)/.exec(m[1])?.[1];
        const gde = nRazdela ? RAZDELY_TEORII_10.find((x) => x.no === Number(nRazdela)) : r;
        const imena = [...m[1].matchAll(/«([^»]+)»/g)].map((x) => x[1]);
        for (const imya of imena) {
          if (imya === 'Почему так' || imya === 'Важно!') continue;
          if (!gde || !primeryRazdela(gde).some((title) => title.startsWith(imya))) {
            problems.push({
              where,
              what: `отсылка «${imya}» не ведёт на пример ${nRazdela ? `раздела ${nRazdela}` : 'этой карточки'}`,
            });
          }
        }
        if (
          /шаг (\d+)/.test(m[1]) &&
          !vseBloki(r.bloki).some((x) => x.vid === 'primerKondensator')
        ) {
          problems.push({ where, what: `отсылка к шагу без примера: «${m[0]}»` });
        }
      }
    }
    const pechat = bezSsylok(b);
    const ostalos = [...(pechat.paras ?? []), pechat.oshibka, pechat.pravilno]
      .filter(Boolean)
      .filter((t) => /\(см\./.test(t));
    if (ostalos.length > 0)
      problems.push({ where, what: `на печати осталась отсылка: «${ostalos[0].slice(0, 60)}»` });
  }
  r.prototipy.forEach(
    (id) => idsProto.has(id) || problems.push({ where, what: `нет прототипа ${id}` }),
  );
  for (const b of vseBloki(r.bloki)) {
    for (const k of ['paras', 'spisok']) {
      (b[k] ?? []).forEach((t) => strokiTeorii.push([where, t]));
    }
    for (const k of ['title', 'podpis', 'oshibka', 'pravilno']) {
      if (typeof b[k] === 'string') strokiTeorii.push([where, b[k]]);
    }
    if (b.formula) display(b.formula, where);
    /* Плашки рамок (Определение, Важно!, Вывод) — обычный текст без KaTeX. */
    if (
      ['opredelenie', 'vazhno', 'vyvod', 'tablica', 'lovushka'].includes(b.vid) &&
      /\$/.test(b.title ?? '')
    ) {
      problems.push({ where, what: `формула в плашке рамки: «${b.title}»` });
    }
    if (b.rows) [b.head, ...b.rows].flat().forEach((t) => strokiTeorii.push([where, t]));
    if (b.vid === 'razvorot' && /\$/.test(b.knopka))
      problems.push({ where, what: `формула на кнопке: «${b.knopka}»` });
    if ((b.vid === 'primer' || b.vid === 'most') && !idsBanka.has(b.zadacha)) {
      problems.push({ where, what: `пример ${b.zadacha} не из банка` });
    }
  }
}
for (const p of PROTOTYPES) {
  if (!FIZIKA_10[p.id])
    problems.push({ where: `теория fizika ${p.id}`, what: 'нет карточки «Физика в двух словах»' });
  else strokiTeorii.push([`теория fizika ${p.id}`, FIZIKA_10[p.id]]);
}
const vUrokah = UROKI_10.flatMap((u) => u.prototipy);
for (const p of PROTOTYPES) {
  if (vUrokah.filter((x) => x === p.id).length !== 1) {
    problems.push({ where: `уроки`, what: `прототип ${p.id} должен быть ровно в одном уроке` });
  }
}
for (const [where, t] of strokiTeorii) {
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
/* «Вывод» раздела 6: в задачах про конденсатор RC — целое и после
   деления на αRC получается целое k. Проверяем на всём банке П-24. */
const kondensatory = solved.filter((x) => x.item.prototypeId === 'P24');
for (const x of kondensatory) {
  try {
    const p = kond.paramsKondensatora(x.item.params);
    const r0 = kond.raschet(p);
    if (r0.RC.m !== 1) problems.push({ where: `П-24 ${x.item.id}`, what: `RC нецелое` });
    if (Math.abs(r0.U.n / r0.U.m - x.s.answer) > 1e-9)
      problems.push({ where: `П-24 ${x.item.id}`, what: 'U₀:2ᵏ не равно ответу' });
  } catch (e) {
    problems.push({ where: `П-24 ${x.item.id}`, what: e.message });
  }
}
console.log(
  `Теория: разделов ${RAZDELY_TEORII_10.length}, строк проверено ${strokiTeorii.length}; задач про конденсатор с целым k: ${kondensatory.length}.`,
);

/* Данные для браузера (public/data/zadanie10): совпадают с банком и без ответов. */
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { APP } = await import('./lib/load-ts.mjs');
  const { dannyeDlyaBrauzera } = requireSrc('lib/zadanie10/dannye-server');
  const { FIPI, ANALOGI_PO_PROTOTIPAM } = requireSrc('lib/zadanie10/bank/index');
  for (const [fail, nado] of Object.entries(dannyeDlyaBrauzera(FIPI, ANALOGI_PO_PROTOTIPAM))) {
    const f = path.join(APP, 'public/data/zadanie10', `${fail}.json`);
    const est = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
    if (est !== nado) {
      problems.push({
        where: `public/data/zadanie10/${fail}.json`,
        what: 'файл устарел — запустите pnpm build:bank-10',
      });
    }
    if (/"answer"/.test(nado)) {
      problems.push({
        where: `public/data/zadanie10/${fail}.json`,
        what: 'в данных для браузера есть ответ',
      });
    }
  }
  /* Опорные задачи: 7 блоков по 10, ответы — для бланка ЕГЭ, формулы чистые. */
  const { BLOKI_OPORNYH } = requireSrc('lib/zadanie10/opornye');
  if (BLOKI_OPORNYH.length !== 7) {
    problems.push({ where: 'опорные', what: `блоков ${BLOKI_OPORNYH.length}, нужно 7` });
  }
  for (const b of BLOKI_OPORNYH) {
    if (b.zadachi.length !== 10) {
      problems.push({ where: `опорные ${b.id}`, what: `задач ${b.zadachi.length}, нужно 10` });
    }
    if (/\$/.test(b.opisanie) || /\$/.test(b.nazvanie)) {
      problems.push({ where: `опорные ${b.id}`, what: 'формула на карточке блока' });
    }
    for (const z of b.zadachi) {
      if (
        !Number.isFinite(z.answer) ||
        Math.abs(z.answer * 1000 - Math.round(z.answer * 1000)) > 1e-7
      ) {
        problems.push({ where: z.id, what: `ответ не для бланка: ${z.answer}` });
      }
      strokiTeorii.push([z.id, z.uslovie], [z.id, z.podskazka], ...z.razbor.map((r) => [z.id, r]));
    }
    strokiTeorii.push([`опорные ${b.id}`, b.zapomni]);
  }
  for (const [where, t] of strokiTeorii.slice(-200)) {
    for (const f of formuly(t)) {
      try {
        typeset(f);
      } catch (e) {
        problems.push({ where, what: `KaTeX: ${e.message.slice(0, 100)}` });
      }
      gigienaFormuly(f).forEach((x) =>
        problems.push({ where, what: `формула: ${x} в «${f.slice(0, 60)}»` }),
      );
    }
  }
}

const fipi = solved.filter((x) => x.item.source === 'fipi').length;
const analogi = solved.filter((x) => x.item.source === 'analog').length;
console.log(`Прототипов: ${PROTOTYPES.length}; задач ФИПИ: ${fipi}; аналогов: ${analogi}.`);
console.log(`Исключения по разнообразию ответов: ${Object.keys(ISKLYUCHENIYA).join(', ')}.`);

if (problems.length > 0) {
  console.error(`Проблем: ${problems.length}`);
  for (const p of problems.slice(0, 200)) {
    console.error(`  ${p.where}: ${p.what}`);
  }
  process.exit(1);
}
console.log('Задание №10: все проверки пройдены.');
