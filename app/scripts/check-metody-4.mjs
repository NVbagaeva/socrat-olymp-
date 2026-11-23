/* scripts/check-metody-4.mjs — ответы глав «Ключевые методы» задания №4.

   Каждая разобранная задача глав (content/veroyatnost4-metody-teoriya.ts)
   решается здесь заново перебором исходов: конверты и фамилии по одному,
   все грани кости и пары граней, все цепочки монеты, все рассадки за
   круглым столом, все соперники в разбиении на пары. Ответ перебора
   сравнивается с ответом в тексте и с последней формулой решения.

   Ещё проверяется:
   - 0 ≤ P ≤ 1, ответ — конечная десятичная дробь, если условие не
     просит округлить;
   - каждое числовое равенство в формулах глав («\dfrac{7}{20}=0{,}35»,
     «50-17-22=11») — верное;
   - условия таблицы костей и дерево монет в интерактивах.

   Падает с кодом 1 и списком расхождений. */

import { requireSrc } from './lib/load-ts.mjs';

const { GLAVY_METODOV_4 } = requireSrc('content/veroyatnost4-metody-teoriya');
const { USLOVIYA_KOSTEY, kletokKostey, cepochki } = requireSrc(
  'lib/veroyatnost/metody4-interaktiv',
);

const oshibki = [];
const fail = (msg) => oshibki.push(msg);

/* ── Перебор ───────────────────────────────────────────────────────── */

/** Доля исходов, где выполнено условие: [m, n]. */
function dolya(ishody, podhodit) {
  return [ishody.filter(podhodit).length, ishody.length];
}

const GRANI = [1, 2, 3, 4, 5, 6];
const PARY = GRANI.flatMap((a) => GRANI.map((b) => [a, b]));

function monety(n) {
  let out = [''];
  for (let i = 0; i < n; i += 1) out = out.flatMap((c) => [`${c}О`, `${c}Р`]);
  return out;
}

/** Все перестановки массива (алгоритм Хипа), обход колбэком. */
function perestanovki(arr, cb) {
  const a = [...arr];
  const c = new Array(a.length).fill(0);
  cb(a);
  let i = 0;
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      [a[j], a[i]] = [a[i], a[j]];
      cb(a);
      c[i] += 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
}

/** Все разбиения участников на пары — список разбиений (для малых n). */
function razbieniya(lyudi) {
  if (lyudi.length === 0) return [[]];
  const [pervyy, ...ost] = lyudi;
  return ost.flatMap((para, i) =>
    razbieniya(ost.filter((_, k) => k !== i)).map((r) => [[pervyy, para], ...r]),
  );
}

/** Двойной факториал (n-1)!! — число разбиений n человек на пары. */
function razbieniyChislo(n) {
  let r = 1;
  for (let k = n - 1; k > 1; k -= 2) r *= k;
  return r;
}

/** Соперник Николая гусар: n участников, h гусар (Николай — гусар 0). */
function sopernikGusar(n, h) {
  const gusar = (i) => i < h;
  if (n <= 10) {
    /* Малый турнир — честный перебор всех разбиений. */
    const vse = razbieniya([...Array(n).keys()]);
    const m = vse.filter((r) => {
      const para = r.find((p) => p.includes(0));
      return gusar(para[0] === 0 ? para[1] : para[0]);
    }).length;
    return [m, vse.length];
  }
  /* Большой — разбиения по сопернику Николая: при каждом сопернике j
     остальные n−2 участника разбиваются на пары (n−3)!! способами. */
  let m = 0;
  let vsego = 0;
  for (let j = 1; j < n; j += 1) {
    const sposobov = razbieniyChislo(n - 2);
    vsego += sposobov;
    if (gusar(j)) m += sposobov;
  }
  return [m, vsego];
}

/** Рассадка 9 гостей за круглым столом: все 9! перестановок. */
function ryadomZaStolom(mest) {
  let m = 0;
  let n = 0;
  perestanovki([...Array(mest).keys()], (seat) => {
    /* seat[k] — гость на стуле k; Алиса — 0, Шляпник — 1. */
    const a = seat.indexOf(0);
    const h = seat.indexOf(1);
    const d = Math.abs(a - h);
    n += 1;
    if (d === 1 || d === mest - 1) m += 1;
  });
  return [m, n];
}

const PEREBOR = {
  'primer-1a': () => {
    const konverty = Array.from({ length: 20 }, (_, i) => ({ ulika: i < 7 }));
    return dolya(konverty, (k) => k.ulika);
  },
  'primer-1b': () => {
    const spisok = [...Array(17).fill('Собакевич'), ...Array(22).fill('Коробочка')];
    while (spisok.length < 50) spisok.push('Плюшкин');
    return dolya(spisok, (x) => x === 'Плюшкин');
  },
  'primer-2a': () => dolya(GRANI, (g) => g % 2 === 0),
  'primer-2': () => dolya(PARY, ([a, b]) => a + b === 8),
  'primer-3a': () => dolya(monety(2), (c) => [...c].filter((x) => x === 'О').length === 1),
  'primer-3b': () => dolya(monety(3), (c) => [...c].filter((x) => x === 'О').length === 2),
  'primer-4a': () => ryadomZaStolom(9),
  'primer-4b': () => {
    /* Метод сверяется на малом турнире полным перебором. */
    const [m8, n8] = sopernikGusar(8, 4);
    if (m8 * 7 !== n8 * 3) fail(`primer-4b: малый турнир 8/4 дал ${m8}/${n8}, а не 3/7`);
    return sopernikGusar(26, 10);
  },
  'primer-5a': () => {
    /* 0,19 = 19 исходов из 100 равновозможных. */
    const ishody = Array.from({ length: 100 }, (_, i) => ({ netanc: i < 19 }));
    return dolya(ishody, (x) => !x.netanc);
  },
  'primer-5b': () => {
    const pisma = Array.from({ length: 100 }, (_, i) => ({ poteryano: i < 4 }));
    return dolya(pisma, (x) => !x.poteryano);
  },
};

/* ── Запись ответа ─────────────────────────────────────────────────── */

function nod(a, b) {
  return b === 0 ? a : nod(b, a % b);
}

function konechnaya(m, n) {
  let q = n / nod(m, n);
  for (const p of [2, 5]) while (q % p === 0) q /= p;
  return q === 1;
}

function zapis(m, n, okruglit) {
  const x = m / n;
  const s = okruglit ? (Math.round(x * 100) / 100).toFixed(2) : String(Number(x.toFixed(9)));
  return s.replace(/0+$/, (z) => (okruglit ? z : '')).replace('.', ',');
}

/* ── Числовые равенства в формулах ─────────────────────────────────── */

function vychislit(kusok) {
  let s = kusok
    .replace(/\\left|\\right/g, '')
    .replace(/\\[,;! ]/g, '')
    .replace(/\{,\}/g, '.')
    .replace(/\\cdot/g, '*')
    .replace(/\s+/g, '');
  for (let i = 0; i < 5; i += 1) {
    s = s
      .replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/\\[dt]?frac(\d)(\d)/g, '(($1)/($2))')
      .replace(/\{([^{}]*)\}/g, '($1)');
  }
  if (!/^[0-9+\-*/().]+$/.test(s) || !/\d/.test(s)) return null;
  try {
    const v = Function(`"use strict";return (${s});`)();
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function proveritRavenstva(tex, gde) {
  for (const cep of tex.split(/\\Rightarrow|\\qquad|,\\ |\\text\{[^}]*\}/)) {
    const kuski = cep.split(/(=|\\approx)/);
    let prev = null;
    let znak = '=';
    for (const k of kuski) {
      if (k === '=' || k === '\\approx') {
        znak = k;
        continue;
      }
      const v = vychislit(k);
      if (v !== null && prev !== null) {
        const ok = znak === '=' ? Math.abs(v - prev) < 1e-9 : Math.abs(v - prev) <= 0.005 + 1e-9;
        if (!ok) fail(`${gde}: «${tex}» — ${prev} ${znak} ${v} неверно`);
      }
      prev = v;
    }
  }
}

function formulyTeksta(text) {
  return [...String(text).matchAll(/\$([^$]+)\$/g)].map((x) => x[1]);
}

function obhod(obj, gde, cb) {
  if (typeof obj === 'string') {
    cb(obj, gde);
  } else if (Array.isArray(obj)) {
    obj.forEach((x, i) => obhod(x, `${gde}[${i}]`, cb));
  } else if (obj !== null && typeof obj === 'object') {
    Object.entries(obj).forEach(([k, v]) => obhod(v, `${gde}.${k}`, cb));
  }
}

/* ── Проверка глав ─────────────────────────────────────────────────── */

let zadach = 0;
for (const glava of GLAVY_METODOV_4) {
  obhod(glava, glava.metod, (s, gde) => {
    if (gde.endsWith('.formula')) proveritRavenstva(s, gde);
    else formulyTeksta(s).forEach((f) => proveritRavenstva(f, gde));
  });

  for (const z of glava.zadachi) {
    zadach += 1;
    const perebor = PEREBOR[z.id];
    if (perebor === undefined) {
      fail(`${z.id}: нет перебора — добавьте задачу в PEREBOR`);
      continue;
    }
    const [m, n] = perebor();
    const okruglit = /округлите до сотых/i.test(z.uslovie);
    const p = m / n;
    if (!(p >= 0 && p <= 1)) fail(`${z.id}: P=${m}/${n} вне [0; 1]`);
    if (!okruglit && !konechnaya(m, n)) {
      fail(`${z.id}: ${m}/${n} — бесконечная дробь, а условие не просит округлить`);
    }
    const nado = zapis(m, n, okruglit);
    if (z.otvet !== nado)
      fail(`${z.id}: в тексте ответ ${z.otvet}, перебор даёт ${m}/${n} = ${nado}`);
    const posledniy = [...z.shagi].reverse().find((s) => s.formula !== undefined);
    const vFormule = (posledniy?.formula ?? '').replace(/\{,\}/g, ',');
    if (!vFormule.endsWith(nado)) {
      fail(
        `${z.id}: последняя формула решения «${posledniy?.formula}» не заканчивается ответом ${nado}`,
      );
    }
  }
}

/* ── Интерактивы ───────────────────────────────────────────────────── */

const KOSTI = { 'summa-8': 5, shesterka: 11, ravny: 6 };
for (const u of USLOVIYA_KOSTEY) {
  const m = PARY.filter(([a, b]) => u.podhodit(a, b)).length;
  if (KOSTI[u.id] !== m || kletokKostey(u) !== m) {
    fail(
      `таблица костей «${u.nazvanie}»: ${kletokKostey(u)} клеток, перебор ${m}, ждали ${KOSTI[u.id]}`,
    );
  }
}
for (const n of [2, 3]) {
  const a = cepochki(n).join(' ');
  const b = monety(n).join(' ');
  if (a !== b || new Set(cepochki(n)).size !== 2 ** n) fail(`дерево монет на ${n}: ${a} ≠ ${b}`);
}

if (oshibki.length > 0) {
  console.error(`check-metody-4: расхождений ${oshibki.length}`);
  oshibki.forEach((o) => console.error(`  ✗ ${o}`));
  process.exit(1);
}
console.log(
  `check-metody-4: глав ${GLAVY_METODOV_4.length}, задач ${zadach} — ответы совпали с перебором`,
);
