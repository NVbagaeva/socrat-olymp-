/* scripts/audit-planimetry-hints.mjs — аудит и автопроверка подсказок №1.

   pnpm audit:planimetry-hints            отчёт docs/audit/planimetry-hints.md
   pnpm audit:planimetry-hints --snimok   запомнить находки «до правок»
   pnpm test:planimetry-hints             проверка: находок быть не должно

   Проходит по ВСЕМ задачам вкладок «Тренажёр» и «Опорные задачи»
   задания №1: каждая задача открытого банка, каждый аналог, новые
   задачи генератора (несколько seed на прототип), у опорных —
   зафиксированный вариант и несколько «Ещё вариант». Буквы проверяются
   после подстановки варианта (переименование, поворот, отражение).

   Правило, ради которого проверка заведена: любая буква, которую ученик
   видит в подсказке, подписана на чертеже, который он видит в этот
   момент. Остальные проверки — в таблице PROBLEMY ниже. */

import fs from 'node:fs';
import path from 'node:path';
import { APP, requireSrc } from './lib/load-ts.mjs';
import {
  PROTOTIPY,
  chislaTeksta,
  oboznacheniya,
  opornyeZadachi,
  planyTrenazhera,
  podpisi,
  zadachaTrenazhera,
} from './lib/planimetry-hints.mjs';

const args = process.argv.slice(2);
const CHECK = args.includes('--check');
const SNIMOK = args.includes('--snimok');
const iNovyh = args.indexOf('--novyh');
const NOVYH = iNovyh >= 0 ? Number(args[iNovyh + 1]) : 3;

const DOCS = path.join(APP, '..', 'docs', 'audit');
const FAYL_OTCHETA = path.join(DOCS, 'planimetry-hints.md');
const FAYL_SNIMKA = path.join(DOCS, 'planimetry-hints-do.json');

const { fakt1, FAKTY_1 } = requireSrc('content/spravochnik1/fakty');
const { BLOKI } = requireSrc('lib/planimetriya/prep/bloki');

/* ── Виды находок ────────────────────────────────────────────────── */

const PROBLEMY = {
  bukva: 'буква в тексте не подписана на чертеже',
  velichina: 'буквенная величина не подписана на чертеже',
  novaya: 'новая точка появляется без слов «обозначим…»',
  netChertezha: 'в тексте есть обозначения, а чертежа нет',
  vneKatex: 'математика набрана не в KaTeX',
  otvet: 'подсказка выдаёт ответ',
  chertezh: 'чертёж шага: замечание движка',
  fakt: 'шаг опирается на факт, а кнопки «Показать свойство» нет',
  faktNet: 'факт не найден в реестре',
  seredina: 'середина без засечек равных отрезков',
  pryamoy: 'основание перпендикуляра без значка прямого угла',
  chislo: 'длинная десятичная дробь в выкладке',
  sboy: 'задача не собралась',
};

/** Слова, которыми подсказка вводит новую точку. */
const VVOD = /(обознач|пусть|провед|назов|отметим|постро|опустим|соедин)/i;

/* ── Сбор ────────────────────────────────────────────────────────── */

/** Находка: где, на каком шаге, что. */
const nahodki = [];
function nahodka(razdel, gruppa, zadacha, shag, kod, podrobno) {
  nahodki.push({ razdel, gruppa, zadacha, shag, kod, podrobno });
}

/** Буквы варианта → буквы сцены: находки одного прототипа складываются. */
function obratno(variant) {
  const inv = {};
  for (const [k, v] of Object.entries(variant?.bukvy ?? {})) inv[v] = k;
  return (b) => inv[b] ?? b;
}

/** Середины и основания перпендикуляров на чертеже — с пометками. */
function pometki(scena, optsii) {
  const { vidim } = requireSrc('lib/planimetriya/render');
  const rezhim = optsii.rezhim ?? { rezhim: 'uchenik' };
  const vid = scena.elementy.filter((e) => vidim(e.sloy ?? 'uslovie', rezhim));
  const out = [];
  const estOtrezok = (a, b, f) =>
    vid.some(
      (e) =>
        e.tip === 'otrezok' && ((e.a === a && e.b === b) || (e.a === b && e.b === a)) && f(e),
    );
  for (const [n, def] of Object.entries(scena.tochki)) {
    if (Array.isArray(def)) continue;
    /* Точка участвует в чертеже, если через неё идёт отрезок из другой точки. */
    const luchi = vid.filter((e) => e.tip === 'otrezok' && !e.tolkoShtrihi && (e.a === n || e.b === n));
    if (luchi.length === 0) continue;
    if ('seredina' in def) {
      const [p, q] = def.seredina;
      const iz = luchi.filter((e) => ![p, q].includes(e.a === n ? e.b : e.a));
      if (iz.length === 0) continue;
      const shtrih = (x) => estOtrezok(x, n, (e) => e.shtrihi !== undefined);
      if (!shtrih(p) || !shtrih(q)) out.push({ kod: 'seredina', podrobno: `${n} — середина ${p}${q}` });
    }
    if ('osnovanie' in def) {
      const [p] = def.osnovanie;
      if (!luchi.some((e) => (e.a === n ? e.b : e.a) === p)) continue;
      const znak = vid.some((e) => e.tip === 'ugol' && e.pryamoy === true && e.v === n);
      if (!znak) out.push({ kod: 'pryamoy', podrobno: `${p}${n} ⟂ ${def.osnovanie[1]}${def.osnovanie[2]}` });
    }
  }
  return out;
}

/** Величины, которые не рисуют: число вершин, коэффициент, счётчик частей. */
const NE_RISUYUT = new Set(['n', 'k']);

function proverkaTeksta(ctx, shag, tekst, p, { tex = false } = {}) {
  const o = oboznacheniya(tekst, { tex, tochkiSceny: ctx.tochkiSceny });
  const inv = ctx.inv;
  const net = o.tochki.filter((b) => !p.bukvy.includes(b));
  if (net.length > 0) {
    ctx.n(shag, p.estChertezh ? 'bukva' : 'netChertezha', net.map(inv).sort().join(', '));
  }
  const vel = o.velichiny.filter(
    (b) => !NE_RISUYUT.has(b) && !p.znacheniya.some((z) => z.includes(b.replace('\\', ''))),
  );
  if (vel.length > 0 && p.estChertezh) ctx.n(shag, 'velichina', vel.sort().join(', '));
  if (!tex && o.vneFormul.length > 0) ctx.n(shag, 'vneKatex', o.vneFormul.join(' '));
  return o;
}

function auditTrenazhera() {
  const plany = planyTrenazhera(NOVYH);
  let zadach = 0;
  for (const plan of plany) {
    let z;
    try {
      z = zadachaTrenazhera(plan);
    } catch (e) {
      nahodka('Тренажёр', plan.id, plan.id, '—', 'sboy', String(e.message ?? e));
      continue;
    }
    zadach += 1;
    const ctx = {
      tochkiSceny: z.tochkiSceny,
      inv: obratno(z.variant),
      n: (shag, kod, podrobno) => nahodka('Тренажёр', z.proto, z.kod, shag, kod, podrobno),
    };
    const chertezh = (optsii) => ({ ...podpisi(z.scena, optsii), estChertezh: true });

    /* Условие и основной чертёж. */
    const pu = chertezh(z.risunokUsloviya);
    const usl = proverkaTeksta(ctx, 'условие', z.uslovie, { ...pu, znacheniya: ['x', 'a', 'b', 'c', 'h', 'r', 'm', 'd'] });
    for (const pr of pu.problems) ctx.n('условие', 'chertezh', pr);
    const chislaUsloviya = chislaTeksta(z.uslovie);
    const otvetVidno = !chislaUsloviya.has(z.otvetTekst);

    /* Подсказка: шаг за шагом. */
    const znakomye = new Set(usl.tochki);
    z.voprosy.forEach((v, i) => {
      const shag = `подсказка ${i + 1}`;
      const p = chertezh(v.optsii);
      const tekst = [v.vvod ?? '', v.vopros, ...v.knopki, v.poyasnenie].join(' ');
      const o = proverkaTeksta(ctx, shag, tekst, p);
      const novye = o.tochki.filter((b) => !znakomye.has(b));
      if (novye.length > 0 && !VVOD.test(`${v.vvod ?? ''} ${v.vopros}`)) {
        ctx.n(shag, 'novaya', novye.map(ctx.inv).sort().join(', '));
      }
      o.tochki.forEach((b) => znakomye.add(b));
      if (p.oshibka !== null) ctx.n(shag, 'chertezh', p.oshibka);
      for (const pr of p.problems) ctx.n(shag, 'chertezh', pr);
      for (const m of pometki(z.scena, v.optsii)) ctx.n(shag, m.kod, m.podrobno);
      if (otvetVidno && chislaTeksta(tekst).has(z.otvetTekst)) {
        const gde = chislaTeksta(v.knopki[v.verno] ?? '').has(z.otvetTekst)
          ? 'верная кнопка — число ответа'
          : 'число ответа среди кнопок или в пояснении';
        ctx.n(shag, 'otvet', gde);
      }
      if (v.fakt === undefined) ctx.n(shag, 'fakt', '');
      else if (v.fakt !== null) {
        if (fakt1(v.fakt) === undefined) ctx.n(shag, 'faktNet', v.fakt);
        if (v.vNashey !== undefined) proverkaTeksta(ctx, `${shag}, «В нашей задаче»`, v.vNashey, p);
      }
    });

    /* Решение: шаги и чертёж со всеми построениями. */
    const pr = chertezh(z.risunokResheniya);
    z.shagi.forEach((s, i) => {
      const shag = `решение ${i + 1}`;
      const tekst = [s.zagolovok, ...s.tekst].join(' ');
      proverkaTeksta(ctx, shag, tekst, pr);
      for (const f of s.formuly) {
        proverkaTeksta(ctx, shag, f, pr, { tex: true });
        if (/\d\{,\}\d{5,}/.test(f)) ctx.n(shag, 'chislo', f.match(/\d+\{,\}\d{5,}/)[0].replace('{,}', ','));
      }
      if (/\d\{,\}\d{5,}/.test(tekst)) ctx.n(shag, 'chislo', '');
      if (s.fakt !== undefined && s.fakt !== null && fakt1(s.fakt) === undefined) {
        ctx.n(shag, 'faktNet', s.fakt);
      }
    });
    for (const m of pometki(z.scena, z.risunokResheniya)) ctx.n('решение', m.kod, m.podrobno);
    for (const x of pr.problems) ctx.n('решение', 'chertezh', x);
    proverkaTeksta(ctx, 'сверка', z.sverka, pr);
  }
  return zadach;
}

function auditOpornyh() {
  const zadachi = opornyeZadachi(NOVYH);
  for (const t of zadachi) {
    const n = (shag, kod, podrobno) => nahodka('Опорные задачи', t.m.id, t.kod, shag, kod, podrobno);
    if (t.oshibka !== undefined) {
      n('—', 'sboy', t.oshibka);
      continue;
    }
    const tochkiSceny = t.g.risunok === null ? [] : Object.keys(t.g.risunok.tochki);
    const ctx = { tochkiSceny, inv: (b) => b, n };
    const pusto = { bukvy: [], znacheniya: [], problems: [], estChertezh: false };
    const pu =
      t.g.risunok === null
        ? pusto
        : { ...podpisi(t.g.risunok, { chisla: true }), estChertezh: true };
    const pt =
      t.scenaUchitelya === null
        ? pusto
        : { ...podpisi(t.scenaUchitelya, { rezhim: { rezhim: 'uchitel' }, chisla: true }), estChertezh: true };
    /* Условие: буквы без чертежа — не находка, чертёж задаче не обязателен. */
    if (pu.estChertezh) {
      proverkaTeksta(ctx, 'условие', t.g.uslovie, { ...pu, znacheniya: ['x', 'a', 'b', 'c', 'h', 'r', 'm', 'd', 'n'] });
    } else {
      const o = oboznacheniya(t.g.uslovie);
      if (o.vneFormul.length > 0) n('условие', 'vneKatex', o.vneFormul.join(' '));
    }
    for (const x of pu.problems) n('условие', 'chertezh', x);
    /* Подсказка: формула навыка (ученик видит её рядом с чертежом условия). */
    const podskazka = t.g.podskazka ?? t.m.formula;
    proverkaTeksta(ctx, 'подсказка', podskazka, pu, { tex: t.g.podskazka === undefined });
    if (chislaTeksta(`$${podskazka}$`).has(t.otvetTekst) && !chislaTeksta(t.g.uslovie).has(t.otvetTekst)) {
      n('подсказка', 'otvet', 'число ответа в подсказке');
    }
    if (t.m.fakt === undefined) n('подсказка', 'fakt', '');
    else if (t.m.fakt !== null) {
      if (fakt1(t.m.fakt) === undefined) n('подсказка', 'faktNet', t.m.fakt);
      if (t.g.vNashey !== undefined) proverkaTeksta(ctx, 'подсказка, «В нашей задаче»', t.g.vNashey, pu);
    }
    /* Разбор: строки и чертёж учителя. */
    t.g.razbor.forEach((s, i) => {
      proverkaTeksta(ctx, `решение ${i + 1}`, s, pt);
      if (/\d\{,\}\d{5,}/.test(s)) n(`решение ${i + 1}`, 'chislo', '');
    });
    if (t.scenaUchitelya !== null) {
      for (const m of pometki(t.scenaUchitelya, { rezhim: { rezhim: 'uchitel' } })) n('решение', m.kod, m.podrobno);
    }
    for (const x of pt.problems) n('решение', 'chertezh', x);
  }
  return zadachi.length;
}

/* ── Сводка ──────────────────────────────────────────────────────── */

/** Находки одной группы, шага и вида — одной строкой со счётчиком задач. */
function svodka(spisok) {
  const m = new Map();
  for (const x of spisok) {
    const k = [x.razdel, x.gruppa, x.shag, x.kod, x.podrobno].join('¦');
    const s = m.get(k) ?? { ...x, zadachi: new Set() };
    s.zadachi.add(x.zadacha);
    m.set(k, s);
  }
  return [...m.values()].map((s) => ({
    razdel: s.razdel,
    gruppa: s.gruppa,
    shag: s.shag,
    kod: s.kod,
    podrobno: s.podrobno,
    zadach: s.zadachi.size,
    primer: [...s.zadachi][0],
  }));
}

const t0 = Date.now();
const zadachTrenazhera = auditTrenazhera();
const zadachOpornyh = auditOpornyh();
const itog = svodka(nahodki);
const sek = ((Date.now() - t0) / 1000).toFixed(1);

/* ── Проверка ────────────────────────────────────────────────────── */

if (CHECK) {
  console.log(
    `Подсказки №1: задач тренажёра ${zadachTrenazhera}, опорных ${zadachOpornyh}, фактов в реестре ${Object.keys(FAKTY_1).length} (${sek} с)`,
  );
  if (itog.length === 0) {
    console.log('Находок нет.');
    process.exit(0);
  }
  const poKodu = new Map();
  for (const x of itog) poKodu.set(x.kod, [...(poKodu.get(x.kod) ?? []), x]);
  for (const [kod, spisok] of poKodu) {
    console.log(`\n✗ ${PROBLEMY[kod]} — ${spisok.length}`);
    for (const x of spisok.slice(0, process.env.VSE ? 9999 : 12)) {
      console.log(
        `   ${x.razdel} · ${x.gruppa} · ${x.shag}${x.podrobno ? ` · ${x.podrobno}` : ''} · задач ${x.zadach} (например, ${x.primer})`,
      );
    }
  }
  console.log(`\nНаходок: ${itog.length}. Правила — в шапке scripts/audit-planimetry-hints.mjs.`);
  process.exit(1);
}

if (SNIMOK) {
  fs.mkdirSync(DOCS, { recursive: true });
  fs.writeFileSync(
    FAYL_SNIMKA,
    `${JSON.stringify({ zadachTrenazhera, zadachOpornyh, nahodki: itog }, null, 1)}\n`,
  );
  console.log(`Снимок «до правок»: ${itog.length} находок → ${path.relative(APP, FAYL_SNIMKA)}`);
  process.exit(0);
}

/* ── Отчёт ───────────────────────────────────────────────────────── */

const { SDELANO, obshchee } = await import('./lib/planimetry-hints-sdelano.mjs');
const { otchet } = await import('./lib/planimetry-hints-otchet.mjs');
const do_ = fs.existsSync(FAYL_SNIMKA) ? JSON.parse(fs.readFileSync(FAYL_SNIMKA, 'utf8')) : null;
fs.mkdirSync(DOCS, { recursive: true });
fs.writeFileSync(
  FAYL_OTCHETA,
  otchet({
    do_,
    posle: { zadachTrenazhera, zadachOpornyh, nahodki: itog },
    PROBLEMY,
    SDELANO,
    obshchee,
    PROTOTIPY,
    BLOKI,
    NOVYH,
  }),
);
console.log(
  `Отчёт: ${path.relative(APP, FAYL_OTCHETA)} — до правок ${do_?.nahodki.length ?? '—'}, сейчас ${itog.length}`,
);
