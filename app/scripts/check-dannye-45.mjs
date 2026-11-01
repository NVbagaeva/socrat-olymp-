#!/usr/bin/env node
/* scripts/check-dannye-45.mjs — банк №4 и №5 файлами: выдача та же.

   Запуск: pnpm build && pnpm test:dannye-45

   Банк тренажёра и листа №4 и №5 больше не лежит в странице: в ней
   оглавление, а варианты — файлами сборки app/out/zadaniya/{4,5}/dannye/
   (lib/veroyatnost/dannye45.ts). Здесь проверяется, что ученик и
   учитель получают ровно то же, что раньше из полного банка страницы:

     1. Файлы. На каждый вариант банка и «Узнай метод» есть файл, и он
        совпадает с вариантом полного банка знак в знак; версия в
        оглавлении — та же, что у файла; лишних файлов нет.
     2. Подход. Тысячи подходов во всех режимах (отработка по случайным
        методам, «Вперемешку», «Повтор ошибок», «Узнай метод») с одним и
        тем же зерном: по полному банку, как раньше, и по оглавлению с
        загрузкой файлов, как теперь. Задачи совпадают целиком —
        условие, отпечаток, разбор, подсказка, рисунок, порядок.
     3. Запись тренировки. Упакованный подход восстанавливается через
        загрузку файлов в тот же payload; подменённая подпись — null.
     4. «Похожие задачи». Прежний выбор по полному банку (функция
        из main, ниже — образцом) и новый по оглавлению дают одно и то же.
     5. Лист печати. Листы ученика и учителя по прежнему адресу
        (s=…&n=…&seed=…) и по адресу генератора (ps=2) — по полному
        банку и по оглавлению с загрузкой только задач листа —
        совпадают целиком, и загружается не больше задач, чем на листе.
     6. Вес страниц. HTML тренажёра, его режимов и листов №4 и №5 —
        не больше 300 КБ.

   Сеть подменяется чтением файлов из app/out: fetch(адрес) → файл. */

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { APP, requireSrc } from './lib/load-ts.mjs';

const OUT = path.join(APP, 'out');
if (!fs.existsSync(path.join(OUT, 'zadaniya', '4', 'trenazher', 'index.html'))) {
  console.error('Нет сборки app/out: сначала pnpm build');
  process.exit(1);
}

const P = requireSrc('lib/veroyatnost/pool.ts');
const D = requireSrc('lib/veroyatnost/dannye45-server.ts');
const Z = requireSrc('lib/veroyatnost/zagruzka45.ts');
const S = requireSrc('lib/veroyatnost/sheet4.ts');
const R = requireSrc('lib/veroyatnost/useRound.ts');
const SP = requireSrc('components/tasks/veroyatnost/sessiyaPayload.ts');
const { navykKind, zadachaId } = requireSrc('components/tasks/veroyatnost/metody.ts');
const { listSlova } = requireSrc('content/veroyatnost.ts');

let checks = 0;
let failed = 0;
function check(name, ok, detail = '') {
  checks += 1;
  if (!ok) {
    failed += 1;
    console.log(`  FAIL  ${name}${detail === '' ? '' : ` — ${detail}`}`);
  }
}
function section(title) {
  console.log(`\n${title}`);
}

/* ── Сеть из app/out ─────────────────────────────────────────────── */

let zaprosov = 0;
globalThis.fetch = async (adres) => {
  zaprosov += 1;
  const [put] = String(adres).split('?');
  const fayl = path.join(OUT, put);
  if (!fs.existsSync(fayl)) {
    return { ok: false, status: 404, json: async () => null };
  }
  const text = fs.readFileSync(fayl, 'utf8');
  return { ok: true, status: 200, json: async () => JSON.parse(text) };
};

/* ── Повторяемый случай ──────────────────────────────────────────── */

function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const realRandom = Math.random;
const realNow = Date.now;
/** Выполнить f с подменённым случаем: одно зерно — один и тот же выбор. */
function soZernom(seed, f) {
  Math.random = prng(seed);
  Date.now = () => 1_700_000_000_000 + seed;
  try {
    return f();
  } finally {
    Math.random = realRandom;
    Date.now = realNow;
  }
}

/* ── Прежние функции из main — образец для сравнения ─────────────── */

/** «Похожие задачи» в main: выбор и сборка по полному банку страницы. */
function pohozhieZadachiMain(payload, indexes, pool, uznay) {
  const byli = new Set(payload.tasks.map((t) => t.id));
  const kinds = payload.rezhim === 'uznay' ? uznay.kinds : pool.kinds;
  const tasks = [];
  for (const at of indexes) {
    const task = payload.tasks[at];
    const kind = task === undefined ? undefined : kinds.find((k) => k.id === task.kind);
    if (kind === undefined) continue;
    const svobodnye = kind.variants.filter((v) => !byli.has(zadachaId(kind.id, v.n)));
    const v = svobodnye[Math.floor(Math.random() * svobodnye.length)];
    const next =
      v === undefined
        ? null
        : (SP.zadachiPodhoda([{ kind: kind.id, n: v.n }], payload.rezhim, pool, uznay)[0] ?? null);
    if (next !== null) {
      byli.add(next.id);
      tasks.push(next);
    }
  }
  return tasks.length === 0 ? null : { ...payload, tasks };
}

/** Источник подхода в main (Trenazher.tsx: istochnik) — по любому банку с тем же видом. */
function istochnik(kinds, uznayKinds, rezhim, vybrannye, oshibki) {
  switch (rezhim) {
    case 'mistakes':
      return kinds
        .map((kind) => ({
          id: kind.id,
          variants: kind.variants
            .filter((v) => oshibki.has(zadachaId(kind.id, v.n)))
            .map((v) => ({ n: v.n })),
        }))
        .filter((kind) => kind.variants.length > 0);
    case 'uznay':
      return uznayKinds.map((kind) => ({
        id: kind.id,
        variants: kind.variants.map((v) => ({ n: v.n })),
      }));
    default:
      return kinds
        .filter((kind) => rezhim === 'mixed' || vybrannye.includes(navykKind(kind)))
        .map((kind) => ({ id: kind.id, variants: kind.variants.map((v) => ({ n: v.n })) }));
  }
}

/** Загрузка, как в Trenazher.tsx: только нужный набор. */
async function zagruzit(z, rezhim, ssylki, indeks, indeksU) {
  return rezhim === 'uznay'
    ? { p: Z.PUSTOY_POOL(indeks), u: await Z.uznayIz(z, indeksU, ssylki) }
    : { p: await Z.poolIz(z, indeks, ssylki), u: Z.PUSTOY_UZNAY };
}

/* ── Прогон ──────────────────────────────────────────────────────── */

const PODHODOV = Number(process.env.PODHODOV ?? 400);

for (const z of [4, 5]) {
  const polny = z === 4 ? P.bank4Pool() : P.bank5Pool();
  const polnyU = P.uznayMetodPool(z);
  const indeks = D.indeksPool(z);
  const indeksU = D.indeksUznay(z);
  const indeksL = D.indeksLista(z);

  section(`№${z}. 1. Файлы вариантов`);
  let faylov = 0;
  for (const [nabor, kinds, ind] of [
    ['bank', polny.kinds, indeks.kinds],
    ['uznay', polnyU.kinds, indeksU.kinds],
  ]) {
    for (const kind of kinds) {
      const ik = ind.find((k) => k.id === kind.id);
      check(`${nabor} ${kind.id}: прототип в оглавлении`, ik !== undefined);
      for (const v of kind.variants) {
        faylov += 1;
        const put = path.join(
          OUT,
          `/zadaniya/${z}/dannye/${nabor === 'uznay' ? 'uznay/' : ''}${kind.id}/${v.n}.json`,
        );
        const est = fs.existsSync(put);
        check(`${nabor} ${kind.id}#${v.n}: файл есть`, est, put);
        if (est) {
          const text = fs.readFileSync(put, 'utf8');
          check(
            `${nabor} ${kind.id}#${v.n}: файл = вариант банка`,
            isDeepStrictEqual(JSON.parse(text), v),
          );
        }
        const iv = ik?.variants.find((x) => x.n === v.n);
        check(`${nabor} ${kind.id}#${v.n}: в оглавлении`, iv !== undefined);
      }
      check(
        `${nabor} ${kind.id}: варианты в том же порядке`,
        isDeepStrictEqual(
          ik?.variants.map((x) => x.n),
          kind.variants.map((x) => x.n),
        ),
      );
    }
    /* Лишних файлов нет: по папкам прототипов. */
    const papka = path.join(OUT, `zadaniya/${z}/dannye${nabor === 'uznay' ? '/uznay' : ''}`);
    const lishnie = fs
      .readdirSync(papka)
      .filter((d) => d !== 'uznay')
      .flatMap((d) => fs.readdirSync(path.join(papka, d)).map((f) => `${d}/${f}`))
      .filter((f) => {
        const [kid, fn] = f.split('/');
        return !kinds.some((k) => k.id === kid && k.variants.some((v) => `${v.n}.json` === fn));
      });
    check(`${nabor}: лишних файлов нет`, lishnie.length === 0, lishnie.slice(0, 5).join(', '));
  }
  check(
    'метаданные прототипов оглавления = банк',
    isDeepStrictEqual(
      indeks.kinds.map(({ variants: _v, ...k }) => k),
      polny.kinds.map(({ variants: _v, ...k }) => k),
    ),
  );
  console.log(`  файлов: ${faylov}`);

  section(`№${z}. 2–4. Подход, запись, похожие задачи`);
  const metodyVse = [...new Set(polny.kinds.map((k) => navykKind(k)))];
  const vseId = polny.kinds.flatMap((k) => k.variants.map((v) => zadachaId(k.id, v.n)));
  const rezhimy = ['practice', 'mixed', 'mistakes', 'uznay'];
  let zadach = 0;
  let pohozhih = 0;
  for (let i = 0; i < PODHODOV; i += 1) {
    const rezhim = rezhimy[i % rezhimy.length];
    const seed = z * 100000 + i;
    const r = prng(seed + 7);
    const vybrannye = metodyVse.filter(() => r() < 0.4);
    if (vybrannye.length === 0) vybrannye.push(metodyVse[i % metodyVse.length]);
    const oshibki = new Set(vseId.filter(() => r() < 0.05));
    const count = [5, 10, 15, 20, 30][i % 5];

    /* Как было: полный банк страницы. */
    const srcOld = istochnik(polny.kinds, polnyU.kinds, rezhim, vybrannye, oshibki);
    const srcNew = istochnik(indeks.kinds, indeksU.kinds, rezhim, vybrannye, oshibki);
    check(`подход ${i}: источник тот же`, isDeepStrictEqual(srcOld, srcNew));
    if (srcOld.length === 0) continue;
    const roundOld = soZernom(seed, () => R.sobratPodhod(srcOld, count));
    const roundNew = soZernom(seed, () => R.sobratPodhod(srcNew, count));
    check(`подход ${i}: состав тот же`, isDeepStrictEqual(roundOld, roundNew));
    const tasksOld = SP.zadachiPodhoda(roundOld, rezhim, polny, polnyU);

    /* Как стало: загрузка вариантов подхода. */
    const { p, u } = await zagruzit(z, rezhim, roundNew, indeks, indeksU);
    const tasksNew = SP.zadachiPodhoda(roundNew, rezhim, p, u);
    check(
      `подход ${i} (${rezhim}, ${count}): задачи те же`,
      isDeepStrictEqual(tasksOld, tasksNew),
      `было ${tasksOld.length}, стало ${tasksNew.length}`,
    );
    zadach += tasksNew.length;
    if (tasksOld.length === 0) continue;

    const payload = {
      zadanie: z,
      rezhim,
      metod: vybrannye[0],
      podskazki: i % 2 === 0,
      tasks: tasksOld,
    };
    check(`подход ${i}: payload годный`, SP.isSessiyaPayload(payload));

    /* Запись → восстановление через загрузку. */
    const packed = JSON.parse(JSON.stringify(SP.upakovat(payload)));
    const zapis = SP.ssylkiZapisi(packed);
    check(
      `подход ${i}: ссылки записи`,
      zapis !== null && zapis.ssylki.length === payload.tasks.length,
    );
    if (zapis !== null) {
      const zz = await zagruzit(z, zapis.rezhim, zapis.ssylki, indeks, indeksU);
      check(
        `подход ${i}: восстановление = исходный`,
        isDeepStrictEqual(SP.raspakovat(packed, zz.p, zz.u), payload),
      );
      check(
        `подход ${i}: восстановление по полному банку = исходный`,
        isDeepStrictEqual(SP.raspakovat(packed, polny, polnyU), payload),
      );
      const ispor = JSON.parse(JSON.stringify(packed));
      ispor.tasks[0][2] = '0000000000000000';
      check(`подход ${i}: чужая подпись — устарела`, SP.raspakovat(ispor, zz.p, zz.u) === null);
    }

    /* Похожие задачи: прежний выбор и новый. */
    const oshibkiPodhoda = payload.tasks.map((_, k) => k).filter((k) => k % 3 === 0);
    const staroe = soZernom(seed + 11, () =>
      pohozhieZadachiMain(payload, oshibkiPodhoda, polny, polnyU),
    );
    const ssylki = soZernom(seed + 11, () =>
      SP.pohozhieSsylki(payload, oshibkiPodhoda, rezhim === 'uznay' ? indeksU.kinds : indeks.kinds),
    );
    const zp = await zagruzit(z, rezhim, ssylki, indeks, indeksU);
    const novoe = ssylki.length === 0 ? null : SP.pohozhieIzSsylok(payload, ssylki, zp.p, zp.u);
    check(`подход ${i}: похожие задачи те же`, isDeepStrictEqual(staroe, novoe));
    pohozhih += novoe?.tasks.length ?? 0;
  }
  console.log(`  подходов: ${PODHODOV}, задач сверено: ${zadach}, похожих: ${pohozhih}`);

  section(`№${z}. 5. Лист печати`);
  const list = listSlova(z);
  const protos = polny.kinds.map((k) => k.id);
  let listov = 0;
  for (let i = 0; i < 120; i += 1) {
    const r = prng(z * 7919 + i);
    const vyb = protos.filter(() => r() < 0.3);
    if (vyb.length === 0) vyb.push(protos[i % protos.length]);
    const variants = 1 + (i % 4);
    const count = [4, 8, 10, 12, 20][i % 5];
    const poKlyucham = i % 2 === 1;
    const q = poKlyucham
      ? new URLSearchParams(
          `ps=2&s=${vyb.map((id, k) => `${id}:${1 + ((i + k) % 4)}`).join(',')}&v=${variants}&l=k&seed=list-${z}-${i}`,
        )
      : new URLSearchParams(`s=${vyb.join(',')}&n=${count}&v=${variants}&seed=list-${z}-${i}`);
    const zk = S.parseZapros45(q, z);
    const params = S.parseSheet4Query(q);
    if (poKlyucham && zk === null) {
      check(`лист ${i}: адрес ps=2 разобран`, false, q.toString());
      continue;
    }
    const zadachi = S.zadachiLista45(indeksL.kinds, zk === null ? { params } : { z: zk });
    const zadachiPolny = S.zadachiLista45(polny.kinds, zk === null ? { params } : { z: zk });
    check(`лист ${i}: выбор по оглавлению = по банку`, isDeepStrictEqual(zadachi, zadachiPolny));
    zaprosov = 0;
    const bank = await Z.poolLista(z, indeksL, zadachi);
    const unikalnyh = new Set(zadachi.map((x) => `${x.kind}#${x.n}`)).size;
    check(
      `лист ${i}: загружены только задачи листа`,
      zaprosov <= unikalnyh,
      `${zaprosov} > ${unikalnyh}`,
    );
    for (const otvety of [false, true]) {
      const staryy =
        zk === null
          ? S.sheet4Spec(polny, params, otvety, list)
          : S.sheet4SpecKlyuchi(polny, zk, otvety, list, {});
      const novyy =
        zk === null
          ? S.sheet4Spec(bank, params, otvety, list)
          : S.sheet4SpecKlyuchi(bank, zk, otvety, list, {});
      check(
        `лист ${i} (${poKlyucham ? 'ps=2' : 's='}, ${otvety ? 'учитель' : 'ученик'}): тот же`,
        isDeepStrictEqual(staryy, novyy),
      );
      listov += 1;
    }
  }
  console.log(`  листов сверено: ${listov}`);

  section(`№${z}. 6. Вес страниц`);
  const stranitsy = [
    `zadaniya/${z}/trenazher`,
    `zadaniya/${z}/pechat`,
    `zadaniya/${z}/pechat/otvety`,
    `zadaniya/${z}/pechat/vse`,
  ];
  const rezhimyPapka = path.join(OUT, `zadaniya/${z}/trenazher`);
  for (const d of fs.readdirSync(rezhimyPapka)) {
    if (fs.existsSync(path.join(rezhimyPapka, d, 'index.html')))
      stranitsy.push(`zadaniya/${z}/trenazher/${d}`);
  }
  for (const s of stranitsy) {
    const ves = fs.statSync(path.join(OUT, s, 'index.html')).size;
    check(
      `/${s}/: HTML ${Math.round(ves / 1024)} КБ ≤ 300 КБ`,
      ves <= 300 * 1024,
      `${Math.round(ves / 1024)} КБ`,
    );
  }
  console.log(
    `  страниц: ${stranitsy.length}, самая тяжёлая — ${Math.round(Math.max(...stranitsy.map((s) => fs.statSync(path.join(OUT, s, 'index.html')).size)) / 1024)} КБ`,
  );
}

console.log(`\nПроверок: ${checks}, не прошло: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
