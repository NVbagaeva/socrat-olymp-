#!/usr/bin/env node
/* scripts/check-skrytye.mjs — скрытый раздел не виден посетителю
   и доступен администратору.

   Запуск после сборки: pnpm test:skrytye
     --apache        правила сервера обязательны (без флага — если apache2 установлен)
     --webkit        эмуляция iPhone — в настоящем WebKit (без флага — если он установлен,
                     иначе в Chromium с параметрами iPhone)
     --kabinet       кабинет администратора обязателен (сборка со входом, см. ниже)
     --shots <папка> снимки: посетитель, администратор, кабинет

   Скрытый раздел — раздел, которого нет в действующей структуре
   экзамена (src/content/struktura.js, skryt). Какие разделы скрыты,
   проверка берёт из структуры — той же, по которой собран сайт:

     pnpm build && pnpm test:skrytye
         структура из 20 заданий: скрытых разделов нет; проверяется,
         что правил в .htaccess нет и страницы разделов на месте.
     STRUKTURA_EGE=2027-19 pnpm build && STRUKTURA_EGE=2027-19 pnpm test:skrytye
         пробная сборка по ЕГЭ-2027: скрыт раздел «Случайные величины».

   Что проверяется у каждого скрытого раздела:

   1. Правила сервера записаны сборкой (scripts/build-skrytye.mjs) и
      совпадают со структурой.
   2. Страницы раздела собраны, на каждой noindex; в заранее собранной
      разметке раздела нет — он появляется в браузере после проверки
      метки администратора.
   3. Публичные страницы (все index.html и index.txt сборки, кроме
      страниц самого раздела): нет ссылок на раздел и нет его названия.
      Это банк, меню и сайдбар, переключатели разделов, главная, карта,
      варианты, карточки. Что ещё не убрано — список POKA ниже, с
      номером PR, в котором уйдёт.
   4. Настоящий Apache с .htaccess сборки: без метки любой адрес
      раздела — 404 (не редирект) и noindex; с меткой — 200 и noindex;
      соседние разделы не задеты.
   5. Браузер — десктоп и эмуляция iPhone, сервер без правил (так файл
      отдал бы хостинг мимо .htaccess): без метки — «Страница не
      найдена» и раздела на экране нет; с меткой — раздел с плашкой
      причины. Поиск по банку раздел не находит.
   6. Кабинет администратора: карточка «Скрытые разделы», кнопка
      «Открыть» ставит метку и открывает раздел с плашкой; у репетитора
      карточки нет. Нужна сборка со входом и подменой сервера входа
      (как у scripts/check-auth.mjs):
        NEXT_PUBLIC_AUTH_ENABLED=1 NEXT_PUBLIC_AUTH_IN_HEADER=1
        NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
        NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, devices, webkit } from 'playwright';
import { APP, requireSrc } from './lib/load-ts.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';
import {
  KONEC,
  METKA_SKRYTYH,
  NACHALO,
  pravila,
  skrytyeVSborke,
  tekushchie,
} from './build-skrytye.mjs';
import { STRUKTURA } from '../src/content/struktura.js';

bezBanneraCookieVsyudu(chromium, webkit);

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const argOf = (name) => (flag(name) ? args[args.indexOf(name) + 1] : null);
const OUT = path.join(APP, 'out');
const SHOTS = argOf('--shots');
const VSEM = process.env.SKRYTYE === '1';

if (!fs.existsSync(path.join(OUT, 'index.html'))) {
  console.error('Нет сборки: сначала pnpm build.');
  process.exit(1);
}

const oshibki = [];
let proverok = 0;
function ok(uslovie, chto) {
  proverok += 1;
  if (!uslovie) {
    oshibki.push(chto);
    console.log(`  ✗ ${chto}`);
  }
  return uslovie;
}
const propushcheno = [];

/* ── Что ещё не убрано ───────────────────────────────────────────────

   Места, где скрытый раздел пока виден посетителю в пробной сборке по
   ЕГЭ-2027. Каждое уходит в своём PR перестройки (план —
   docs/ege-2027-struktura-shag-0.md); правило убирают вместе с местом.
   Правило, которому в сборке ничего не соответствует, — ошибка: список
   не должен залёживаться.

   gde — адрес страницы (RegExp от пути в сборке без index.html);
   chto — 'ssylka' (ссылка на раздел) или 'nazvanie' (название на экране). */

const POKA = [
  {
    gde: /^karta\/$/,
    chto: 'nazvanie',
    pochemu: '«Карта ЕГЭ»: остров раздела (подпись для экранного диктора)',
    kogda: 'PR 6, переключение на 19 заданий',
  },
];

/* ── Скрытые разделы сборки ──────────────────────────────────────── */

const { skrytyeRazdely, tasks } = requireSrc('content/tasks');
function imenaRazdela(task) {
  return [
    ...new Set([task?.shortTitle, task?.name].filter((x) => typeof x === 'string' && x !== '')),
  ];
}
/** Первое из названий раздела, которое есть в тексте: { imya, mesto } или null. */
function nazvanieV(tekst, r) {
  for (const imya of r.imena) {
    const mesto = tekst.indexOf(imya);
    if (mesto !== -1) return { imya, mesto };
  }
  return null;
}
const razdely = skrytyeVSborke(OUT).map((r) => ({
  ...r,
  name: skrytyeRazdely.find((t) => t.kod === r.kod)?.name ?? '',
  /* Названия раздела, по которым его ищут на страницах: полное
     («Случайные величины и распределения») и короткое — с карты и плиток. */
  imena: imenaRazdela(skrytyeRazdely.find((t) => t.kod === r.kod)),
}));

console.log(
  `Структура экзамена: ${STRUKTURA.id}. Скрытых разделов со страницами: ${razdely.length}` +
    (razdely.length > 0
      ? ` — ${razdely.map((r) => `${r.kod} (${r.adresa.join(', ')})`).join('; ')}`
      : '') +
    '.',
);

/* ── 1. Правила сервера ──────────────────────────────────────────── */

console.log('\n1. Правила сервера в сборке');
{
  const ishodnyy = fs.readFileSync(path.join(APP, 'public', '.htaccess'), 'utf8');
  ravno(tekushchie(ishodnyy), [], 'public/.htaccess: между метками пусто — правила пишет сборка');
  const sobrannyy = fs.readFileSync(path.join(OUT, '.htaccess'), 'utf8');
  ravno(
    tekushchie(sobrannyy),
    pravila(razdely, { vsem: VSEM }),
    'out/.htaccess: правила скрытых разделов — по структуре (после next build идёт scripts/build-skrytye.mjs; ' +
      'структура сборки и проверки должна быть одна — STRUKTURA_EGE)',
  );
  ok(
    sobrannyy.indexOf(NACHALO) < sobrannyy.indexOf('RewriteRule') &&
      sobrannyy.indexOf(KONEC) < sobrannyy.indexOf('Косая черта на конце адреса'),
    'out/.htaccess: правила скрытых разделов стоят раньше остальных перенаправлений',
  );
  ravno(
    skrytyeRazdely.map((t) => t.kod),
    razdely.map((r) => r.kod),
    'список скрытых разделов сайта (content/tasks.ts) совпадает со списком сборки',
  );
}

function ravno(est, nado, chto) {
  return ok(
    JSON.stringify(est) === JSON.stringify(nado),
    `${chto}:\n      есть:  ${JSON.stringify(est)?.slice(0, 400)}\n      нужно: ${JSON.stringify(nado)?.slice(0, 400)}`,
  );
}

/* ── Страницы сборки ─────────────────────────────────────────────── */

function fayly(dir, imena, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '_next') fayly(full, imena, out);
    } else if (imena.includes(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
const otKornya = (file) => path.relative(OUT, file).split(path.sep).join('/');
/** Адрес страницы: «zadaniya/6/teoriya/» для …/teoriya/index.html и index.txt. */
const adresFayla = (file) => otKornya(file).replace(/index\.(html|txt)$/, '');
const vRazdele = (adres, r) => r.adresa.some((slug) => adres.startsWith(`zadaniya/${slug}/`));

/** Текст, который человек видит на странице: без сценариев, стилей и тегов. */
function vidimyyTekst(html) {
  return html
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

if (razdely.length === 0) {
  /* Скрывать нечего: страницы разделов собраны как обычно. */
  console.log('\n2. Скрытых разделов нет: страницы разделов собраны как обычно');
  for (const task of tasks.filter((t) => t.status === 'ready')) {
    const file = path.join(OUT, 'zadaniya', task.slug, 'index.html');
    if (!ok(fs.existsSync(file), `нет страницы раздела ${task.kod}: /zadaniya/${task.slug}/`))
      continue;
    const html = fs.readFileSync(file, 'utf8');
    ok(/<main[\s>]/.test(html), `раздел ${task.kod}: страница собрана без содержимого`);
    ok(
      !/<meta name="robots" content="noindex/.test(html),
      `раздел ${task.kod}: главная страница раздела закрыта от поисковиков`,
    );
  }
  itog();
}

/* ── 2. Страницы скрытого раздела ────────────────────────────────── */

console.log('\n2. Страницы скрытого раздела в сборке');
const stranitsyRazdela = new Map();
for (const r of razdely) {
  const html = r.adresa.flatMap((slug) => fayly(path.join(OUT, 'zadaniya', slug), ['index.html']));
  stranitsyRazdela.set(r.kod, html.map(adresFayla));
  ok(html.length > 0, `${r.kod}: страниц нет`);
  for (const file of html) {
    const tekst = fs.readFileSync(file, 'utf8');
    const adres = adresFayla(file);
    ok(
      /<meta name="robots" content="noindex/.test(tekst),
      `/${adres}: нет <meta name="robots" content="noindex…">`,
    );
    if (!VSEM) {
      ok(
        !/<main[\s>]/.test(tekst),
        `/${adres}: раздел есть в заранее собранной разметке — должен появляться только после проверки метки`,
      );
    }
  }
  console.log(`  ${r.kod}: страниц — ${html.length}, на каждой noindex, в разметке раздела нет`);
}

/* ── 3. Публичные страницы ───────────────────────────────────────── */

console.log('\n3. Публичные страницы в сборке: ссылок на раздел и его названия нет');
/** Где скрытый раздел виден посетителю: { adres, chto, kod, primer, gde }. */
const nahodki = [];
{
  const vse = fayly(OUT, ['index.html', 'index.txt']);
  let posmotreno = 0;
  for (const file of vse) {
    const adres = adresFayla(file);
    if (razdely.some((r) => vRazdele(adres, r))) continue;
    posmotreno += 1;
    const tekst = fs.readFileSync(file, 'utf8');
    for (const r of razdely) {
      /* Ссылка: «/zadaniya/6/…» в href и в данных страницы. Не часть
         другого адреса («/images/zadaniya/6/», «/zadaniya/60/»). */
      const ssylka = new RegExp(
        `(?<![\\w/.-])/zadaniya/(${r.hranenie}|${r.kod})(?=[/"'?#\\\\]|$)[^"'\\\\\\s<)]*`,
      );
      const m = ssylka.exec(tekst);
      if (m) {
        nahodki.push({ adres, chto: 'ssylka', kod: r.kod, primer: m[0], gde: otKornya(file) });
      }
      if (file.endsWith('.html')) {
        const vidno = vidimyyTekst(tekst);
        const est = nazvanieV(vidno, r);
        if (est !== null) {
          nahodki.push({
            adres,
            chto: 'nazvanie',
            kod: r.kod,
            primer: vidno
              .slice(Math.max(0, est.mesto - 50), est.mesto + est.imya.length + 30)
              .trim(),
            gde: otKornya(file),
          });
        }
      }
    }
  }
  console.log(
    `  файлов просмотрено: ${posmotreno} (index.html и index.txt вне скрытых разделов), ` +
      `мест с разделом: ${nahodki.length}`,
  );
}

/** Итог по находкам: всё, чего нет в списке POKA, — ошибка. */
function proveritNahodki() {
  const srabotalo = new Set();
  const plohie = [];
  const razresheno = new Map();
  for (const n of nahodki) {
    const pravilo = POKA.find((p) => p.chto === n.chto && p.gde.test(n.adres));
    if (pravilo === undefined) {
      plohie.push(n);
    } else {
      srabotalo.add(pravilo);
      razresheno.set(pravilo, (razresheno.get(pravilo) ?? 0) + 1);
    }
  }
  proverok += 1;
  if (plohie.length > 0) {
    const poAdresu = new Map();
    for (const n of plohie) {
      const klyuch = `${n.chto === 'ssylka' ? 'ссылка' : 'название'} · /${n.adres} (${n.gde})`;
      if (!poAdresu.has(klyuch)) poAdresu.set(klyuch, n);
    }
    oshibki.push(`скрытый раздел виден на публичных страницах — мест: ${poAdresu.size}`);
    console.log(`  ✗ скрытый раздел виден на публичных страницах (${poAdresu.size}):`);
    for (const [klyuch, n] of [...poAdresu].slice(0, 60)) {
      console.log(`      ${klyuch}  «${n.primer.slice(0, 110)}»`);
    }
    if (poAdresu.size > 60) console.log(`      … и ещё ${poAdresu.size - 60}`);
  }
  for (const p of POKA) {
    ok(
      srabotalo.has(p),
      `список POKA: правилу ${p.gde} (${p.chto}) в сборке ничего не соответствует — уберите его`,
    );
  }
  for (const [p, n] of razresheno) {
    console.log(`  пока разрешено (уйдёт: ${p.kogda}): ${p.pochemu} — мест: ${n}`);
  }
  if (plohie.length === 0) {
    console.log('  кроме разрешённого, скрытый раздел на публичных страницах не виден');
  }
}

/* ── 4. Настоящий Apache ─────────────────────────────────────────── */

console.log('\n4. Сервер: Apache с .htaccess сборки');
{
  const estApache = ['/usr/sbin/apache2', '/usr/sbin/httpd'].some((bin) => fs.existsSync(bin));
  if (!estApache && !flag('--apache')) {
    propushcheno.push('правила сервера (Apache не установлен; в CI проверка обязательна)');
    console.log('  пропущено: Apache не установлен');
  } else if (VSEM) {
    console.log('  пробная сборка SKRYTYE=1: правил 404 нет, проверяется только noindex');
    await apache({ vsem: true });
  } else {
    await apache({ vsem: false });
  }
}

async function apache({ vsem }) {
  const { startApache } = await import('./lib/apache.mjs');
  const server = await startApache(OUT, 8493);
  const zapros = (adres, cookie) =>
    fetch(server.url + adres, {
      redirect: 'manual',
      headers: cookie === undefined ? {} : { cookie },
    });
  const noindex = (res) => (res.headers.get('x-robots-tag') ?? '').includes('noindex');
  const METKA = `${METKA_SKRYTYH}=1`;
  try {
    for (const r of razdely) {
      const stranitsy = stranitsyRazdela.get(r.kod).map((adres) => `/${adres}`);
      const glavnaya = `/zadaniya/${r.adresa[0]}/`;
      /* Адреса раздела: каждая страница, главная без косой черты, файлы
         страницы напрямую, адрес, которого в сборке нет, и оба имени
         раздела — номер хранения и код. */
      const adresa = [
        ...stranitsy,
        glavnaya.slice(0, -1),
        `${glavnaya}index.html`,
        `${glavnaya}index.txt`,
        `${glavnaya}net-takoy-stranitsy/`,
        `/zadaniya/${r.hranenie}/`,
        `/zadaniya/${r.kod}/`,
      ];
      if (!vsem) {
        let ne404 = 0;
        for (const adres of adresa) {
          const res = await zapros(adres);
          if (!ok(res.status === 404, `без метки ${adres} → ${res.status}, нужно 404`)) ne404 += 1;
          ok(noindex(res), `без метки ${adres}: в ответе нет X-Robots-Tag: noindex`);
        }
        console.log(
          `  ${r.kod}: без метки — 404 и noindex, адресов: ${adresa.length - ne404} из ${adresa.length}`,
        );
        /* Метка — ровно budetege_skrytye=1: похожие cookie раздел не открывают. */
        for (const cookie of [
          `${METKA_SKRYTYH}=0`,
          `${METKA_SKRYTYH}=10`,
          `x${METKA_SKRYTYH}=1`,
          `${METKA_SKRYTYH}x=1`,
          'drugaya=1',
        ]) {
          const res = await zapros(glavnaya, cookie);
          ok(res.status === 404, `cookie «${cookie}»: ${glavnaya} → ${res.status}, нужно 404`);
        }
      }
      /* С меткой — страницы отдаются, поисковикам закрыты. */
      let otdano = 0;
      for (const adres of stranitsy) {
        const res = await zapros(adres, vsem ? undefined : METKA);
        /* Переехавшая страница (…/razbor/P01/) отвечает своим 301 на
           новый адрес внутри раздела — как до скрытия; остальные отдаются. */
        const kuda = res.headers.get('location') ?? '';
        const pereehala =
          res.status === 301 && r.adresa.some((slug) => kuda.includes(`/zadaniya/${slug}/`));
        const mozhno = res.status === 200 || pereehala;
        if (ok(mozhno, `с меткой ${adres} → ${res.status}, нужно 200`)) otdano += 1;
        ok(noindex(res), `с меткой ${adres}: в ответе нет X-Robots-Tag: noindex`);
        if (!vsem && res.status === 200) {
          ok(
            /cookie/i.test(res.headers.get('vary') ?? ''),
            `с меткой ${adres}: в Vary нет Cookie — промежуточный кеш отдаст страницу посетителю`,
          );
        }
      }
      console.log(
        `  ${r.kod}: ${vsem ? 'без метки' : 'с меткой'} — 200 и noindex, страниц: ${otdano} из ${stranitsy.length}`,
      );
      if (!vsem) {
        for (const cookie of [`a=1; ${METKA}; b=2`, `a=1;${METKA}`, `${METKA}; b=2`]) {
          const res = await zapros(glavnaya, cookie);
          ok(res.status === 200, `cookie «${cookie}»: ${glavnaya} → ${res.status}, нужно 200`);
        }
        const bezCherty = await zapros(glavnaya.slice(0, -1), METKA);
        ok(
          bezCherty.status === 301 && (bezCherty.headers.get('location') ?? '').endsWith(glavnaya),
          `с меткой ${glavnaya.slice(0, -1)} → ${bezCherty.status} ${bezCherty.headers.get('location')}, нужно 301 на ${glavnaya}`,
        );
      }
    }
    /* Соседи не задеты: остальные разделы и главная. */
    const sosedi = [
      '/',
      '/zadaniya/',
      ...tasks.filter((t) => t.status === 'ready').map((t) => `/zadaniya/${t.slug}/`),
    ];
    let zhivyh = 0;
    for (const adres of sosedi) {
      const res = await zapros(adres);
      if (ok(res.status === 200, `сосед ${adres} → ${res.status}, нужно 200`)) zhivyh += 1;
      ok(!noindex(res), `сосед ${adres}: закрыт от поисковиков заголовком X-Robots-Tag`);
    }
    console.log(
      `  соседние страницы открыты и не закрыты от поисковиков: ${zhivyh} из ${sosedi.length}`,
    );
  } finally {
    const log = server.stop();
    if (/\[(error|crit|alert|emerg)\]/.test(log)) {
      ok(false, `Apache записал ошибки:\n${log.slice(0, 600)}`);
    }
  }
}

/* ── 5. Браузер ──────────────────────────────────────────────────── */

const TIP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
/* Сервер без правил: файл отдаётся, как лежит. Так его отдал бы
   хостинг мимо .htaccess — здесь проверяется страховка в браузере. */
const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let file = path.join(OUT, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader('content-type', TIP[path.extname(file)] ?? 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;

async function snimok(page, imya) {
  if (SHOTS === null) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${imya}.png`), fullPage: false });
}

/** Браузеры проверки: десктоп и iPhone. */
async function brauzery() {
  const out = [
    {
      imya: 'десктоп 1280, Chromium',
      metka: 'desktop',
      browser: await chromium.launch(
        process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
      ),
      ctx: { viewport: { width: 1280, height: 900 } },
    },
  ];
  const { defaultBrowserType: _tip, ...iphone } = devices['iPhone 13'];
  let safari = null;
  try {
    safari = await webkit.launch();
  } catch (error) {
    if (flag('--webkit')) {
      ok(false, `WebKit не запустился: ${String(error.message).split('\n')[0]}`);
    }
  }
  if (safari !== null) {
    out.push({ imya: 'iPhone 13, WebKit', metka: 'iphone', browser: safari, ctx: iphone });
  } else {
    propushcheno.push(
      'настоящий WebKit (не установлен; iPhone проверен в Chromium с его параметрами)',
    );
    out.push({
      imya: 'iPhone 13, параметры в Chromium',
      metka: 'iphone',
      browser: out[0].browser,
      ctx: iphone,
    });
  }
  return out;
}

console.log('\n5. Браузер: посетитель и администратор');
const spisok = await brauzery();
/* Страницы для осмотра на экране: главная и все страницы первых двух
   уровней — разделы сайта и главные страницы заданий. Глубже лежат
   вкладки разделов: их разметка собрана заранее и проверена в п. 3. */
const stranitsyDlyaBrauzera = fayly(OUT, ['index.html'])
  .map(adresFayla)
  .filter((adres) => adres.split('/').filter(Boolean).length <= 2)
  .filter((adres) => !/^(404|styleguide)\//.test(adres))
  .filter((adres) => !razdely.some((r) => vRazdele(adres, r)))
  .sort();
for (const b of spisok) {
  for (const r of razdely) {
    const stranitsy = stranitsyRazdela.get(r.kod);
    /* Главная раздела и ещё две страницы: вкладка и печать, если есть. */
    const proba = [
      stranitsy.find((a) => a === `zadaniya/${r.adresa[0]}/`),
      stranitsy.find((a) => /\/teoriya\/$/.test(a)),
      stranitsy.find((a) => /\/pechat\/$/.test(a)),
    ].filter((a) => a !== undefined);

    /* Посетитель: метки нет. */
    if (!VSEM) {
      const context = await b.browser.newContext(b.ctx);
      const page = await context.newPage();
      const sboi = [];
      page.on('pageerror', (e) => sboi.push(e.message));
      for (const adres of proba) {
        await page.goto(`${BASE}/${adres}`, { waitUntil: 'load' });
        const net = page.locator('[data-skrytyy-razdel="net"]');
        const viden = await net
          .waitFor({ state: 'visible', timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        ok(viden, `${b.imya}, посетитель /${adres}: нет экрана «Страница не найдена»`);
        const tekst = await page.evaluate(() => document.body.innerText);
        ok(
          nazvanieV(tekst, r) === null,
          `${b.imya}, посетитель /${adres}: на экране название раздела «${r.name}»`,
        );
        ok(
          (await page.locator('[data-skrytyy-razdel="est"]').count()) === 0,
          `${b.imya}, посетитель /${adres}: показана плашка администратора`,
        );
        ok(
          (await page.locator('main').count()) === 1,
          `${b.imya}, посетитель /${adres}: на странице есть содержимое раздела`,
        );
      }
      await snimok(page, `posetitel-${b.metka}-${r.kod}`);
      ok(sboi.length === 0, `${b.imya}, посетитель: ошибки на странице — ${sboi.join(' | ')}`);
      await context.close();
    }

    /* Администратор: метка стоит. */
    {
      const context = await b.browser.newContext(b.ctx);
      if (!VSEM) {
        await context.addCookies([{ name: METKA_SKRYTYH, value: '1', url: BASE }]);
      }
      const page = await context.newPage();
      const sboi = [];
      page.on('pageerror', (e) => sboi.push(e.message));
      for (const adres of proba) {
        await page.goto(`${BASE}/${adres}`, { waitUntil: 'load' });
        const plashka = page.locator('[data-skrytyy-razdel="est"]');
        const vidna = await plashka
          .waitFor({ state: adres.includes('/pechat/') ? 'attached' : 'visible', timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        ok(vidna, `${b.imya}, администратор /${adres}: нет плашки скрытого раздела`);
        if (vidna) {
          const tekst = (await plashka.textContent()) ?? '';
          ok(
            tekst.includes(r.prichina),
            `${b.imya}, администратор /${adres}: в плашке нет причины «${r.prichina}» — «${tekst.slice(0, 80)}»`,
          );
        }
        ok(
          (await page.locator('[data-skrytyy-razdel="net"]').count()) === 0,
          `${b.imya}, администратор /${adres}: показан экран «Страница не найдена»`,
        );
        /* Раздел на экране: текста заметно больше, чем в шапке и плашке.
           Печатный лист без кода в адресе почти пуст — у него
           проверяется только плашка. */
        if (!adres.includes('/pechat/')) {
          const soderzhimoe = await page.evaluate(() => document.body.innerText.trim().length);
          ok(
            soderzhimoe > 400,
            `${b.imya}, администратор /${adres}: раздел не показан (текста на странице — ${soderzhimoe} знаков)`,
          );
        }
        if (adres === proba[0]) {
          /* Плашка не шире экрана и горизонтальной прокрутки не добавляет:
             ширина страницы с плашкой и без неё одна. */
          const shirina = await page.evaluate(() => {
            const el = document.querySelector('[data-skrytyy-razdel="est"]');
            const okno = document.documentElement.clientWidth;
            const sPlashkoy = document.documentElement.scrollWidth;
            const pravyyKray = el.getBoundingClientRect().right;
            el.style.display = 'none';
            const bez = document.documentElement.scrollWidth;
            el.style.display = '';
            return { okno, sPlashkoy, bez, pravyyKray };
          });
          ok(
            shirina.sPlashkoy <= shirina.bez && shirina.pravyyKray <= shirina.okno + 1,
            `${b.imya}, администратор /${adres}: плашка шире экрана — ${JSON.stringify(shirina)}`,
          );
          await snimok(page, `administrator-${b.metka}-${r.kod}`);
        }
      }
      ok(sboi.length === 0, `${b.imya}, администратор: ошибки на странице — ${sboi.join(' | ')}`);
      await context.close();
    }
    console.log(
      `  ${b.imya}: ${r.kod} — посетителю «Страница не найдена», администратору раздел с плашкой`,
    );
  }

  /* Поиск по банку: раздел не находится. */
  {
    const context = await b.browser.newContext(b.ctx);
    const page = await context.newPage();
    await page.goto(`${BASE}/zadaniya/`, { waitUntil: 'load' });
    const pole = page.locator('.bank-search__input');
    await pole.waitFor({ state: 'visible', timeout: 15000 });
    /* Поиск работает: открытый раздел находится. */
    const otkrytyy = tasks.find((t) => t.status === 'ready');
    await pole.fill(otkrytyy.name.slice(0, 8));
    await page.waitForTimeout(300);
    ok(
      (await page.locator('.tasks-grid').innerText()).includes(otkrytyy.name),
      `${b.imya}, поиск по банку: открытый раздел «${otkrytyy.name}» не нашёлся — проверка поиска не работает`,
    );
    for (const r of razdely) {
      const zaprosy = [...r.imena, r.name.split(' ')[0], String(r.hranenie).padStart(2, '0')];
      for (const zapros of zaprosy) {
        await pole.fill(zapros);
        await page.waitForTimeout(300);
        const tekst = await page.evaluate(() => document.body.innerText);
        ok(
          nazvanieV(tekst, r) === null,
          `${b.imya}, поиск по банку «${zapros}»: найден скрытый раздел «${r.name}»`,
        );
      }
    }
    await context.close();
    console.log(`  ${b.imya}: поиск по банку скрытые разделы не находит`);
  }

  /* Страницы, которые дорисовываются в браузере (карта, «Собрать
     вариант», списки кабинета): в заранее собранной разметке их
     содержимого нет, поэтому смотрим готовый экран — текст, ссылки и
     подписи для экранного диктора (aria-label, alt, title). */
  {
    const context = await b.browser.newContext(b.ctx);
    const page = await context.newPage();
    for (const adres of stranitsyDlyaBrauzera) {
      await page.goto(`${BASE}/${adres}`, { waitUntil: 'load' }).catch(() => {});
      /* Карта и списки догружают данные после загрузки страницы. */
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(600);
      const vidno = await page
        .evaluate(() => ({
          tekst: document.body.innerText,
          ssylki: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
          podpisi: [
            ...[...document.querySelectorAll('[aria-label], [alt], [title]')].flatMap((el) =>
              ['aria-label', 'alt', 'title'].map((attr) => el.getAttribute(attr) ?? ''),
            ),
            /* Надписи на рисунках: в innerText страницы их нет. */
            ...[...document.querySelectorAll('svg text, svg title')].map(
              (el) => el.textContent ?? '',
            ),
          ],
        }))
        .catch(() => ({ tekst: '', ssylki: [], podpisi: [] }));
      for (const r of razdely) {
        const ssylka = vidno.ssylki.find((h) =>
          new RegExp(`^/zadaniya/(${r.hranenie}|${r.kod})(/|$)`).test(h ?? ''),
        );
        if (ssylka !== undefined) {
          nahodki.push({ adres, chto: 'ssylka', kod: r.kod, primer: ssylka, gde: b.imya });
        }
        const teksty = [vidno.tekst.replace(/\s+/g, ' '), ...vidno.podpisi];
        const tekst = teksty.find((t) => nazvanieV(t, r) !== null);
        if (tekst !== undefined) {
          const est = nazvanieV(tekst, r);
          nahodki.push({
            adres,
            chto: 'nazvanie',
            kod: r.kod,
            primer: tekst
              .slice(Math.max(0, est.mesto - 50), est.mesto + est.imya.length + 30)
              .trim(),
            gde: b.imya,
          });
        }
      }
    }
    await context.close();
    console.log(`  ${b.imya}: страниц осмотрено на экране — ${stranitsyDlyaBrauzera.length}`);
  }
}

console.log('\nИтог по публичным страницам (сборка и экран)');
proveritNahodki();

/* ── 6. Кабинет администратора ───────────────────────────────────── */

console.log('\n6. Кабинет администратора');
{
  const SUPABASE = 'http://127.0.0.1:54321';
  const chunks = path.join(OUT, '_next', 'static', 'chunks');
  const soVhodom =
    fs.existsSync(path.join(OUT, 'kabinet', 'index.html')) &&
    fayly2(chunks).some((file) => fs.readFileSync(file, 'utf8').includes(SUPABASE));
  if (!soVhodom) {
    if (flag('--kabinet')) {
      ok(
        false,
        `сборка без входа (нужны NEXT_PUBLIC_AUTH_ENABLED=1 и NEXT_PUBLIC_SUPABASE_URL=${SUPABASE})`,
      );
    } else {
      propushcheno.push('кабинет администратора (сборка без входа; в CI проверка обязательна)');
      console.log('  пропущено: сборка без входа');
    }
  } else {
    for (const b of spisok) {
      await kabinet(b, 'admin', SUPABASE);
      await kabinet(b, 'tutor', SUPABASE);
    }
  }
}

function fayly2(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) fayly2(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** Кабинет с подменой сервера входа: вошедший пользователь с ролью role. */
async function kabinet(b, role, supabase) {
  const context = await b.browser.newContext(b.ctx);
  const user = {
    id: '00000000-0000-4000-8000-00000000000a',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'proverka@yandex.ru',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    user_metadata: { name: 'Проверка', role: role === 'admin' ? 'tutor' : role },
    app_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
  };
  const session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'bearer',
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    user,
  };
  const profile = {
    user_id: user.id,
    display_name: 'Проверка',
    role,
    grade: null,
    welcome_seen_at: '2026-01-01T00:00:00Z',
    tour_id: 'tutor',
    tour_done: true,
    created_at: '2026-01-01T00:00:00Z',
  };
  await context.addInitScript((value) => {
    try {
      window.localStorage.setItem('budetege-auth', value);
    } catch {
      /* Страницы без хранилища проверке не нужны. */
    }
  }, JSON.stringify(session));
  /* Сервер входа и базы: вошедший пользователь, его профиль, остальное пусто. */
  await context.route(`${supabase}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const cors = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': '*',
    };
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: cors });
    }
    const json = (body) =>
      route.fulfill({
        status: 200,
        headers: { ...cors, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    if (url.pathname === '/auth/v1/user') return json(user);
    if (url.pathname === '/auth/v1/token') return json(session);
    if (url.pathname.startsWith('/auth/v1/')) return json({});
    if (url.pathname === '/rest/v1/profiles') {
      const odin = (req.headers().accept ?? '').includes('vnd.pgrst.object');
      return json(odin ? profile : [profile]);
    }
    if (url.pathname.startsWith('/rest/v1/rpc/')) return json(null);
    return json([]);
  });
  const page = await context.newPage();
  const sboi = [];
  /* «Открыть» уводит со страницы кабинета, пока та ещё догружает свои
     куски кода: WebKit сообщает о прерванной загрузке как об ошибке
     ChunkLoadError. Это не сбой страницы — такие сообщения пропускаем. */
  page.on('pageerror', (e) => {
    if (!/ChunkLoadError|Loading chunk \d+ failed/.test(e.message)) sboi.push(e.message);
  });
  await page.goto(`${BASE}/kabinet/`, { waitUntil: 'load' });
  const kartochka = page.locator('.skryt-admin');
  const kto = `${b.imya}, кабинет (${role})`;
  if (role !== 'admin') {
    /* Кабинет загрузился (есть вкладки), карточки скрытых разделов нет. */
    const zagruzhen = await page
      .locator('.kabinet__tabs')
      .waitFor({ state: 'visible', timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    ok(zagruzhen, `${kto}: кабинет не загрузился — проверка карточки не работает`);
    ok(
      (await kartochka.count()) === 0,
      `${kto}: карточка «Скрытые разделы» показана не администратору`,
    );
    const tekst = await page.evaluate(() => document.body.innerText);
    for (const r of razdely) {
      ok(nazvanieV(tekst, r) === null, `${kto}: на экране название скрытого раздела «${r.name}»`);
    }
    await context.close();
    console.log(`  ${kto}: карточки «Скрытые разделы» нет`);
    return;
  }
  const est = await kartochka
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  if (!ok(est, `${kto}: нет карточки «Скрытые разделы»`)) {
    await snimok(page, `kabinet-${b.metka}-net-kartochki`);
    await context.close();
    return;
  }
  await snimok(page, `kabinet-${b.metka}`);
  for (const r of razdely) {
    const stroka = page.locator(`.skryt-admin__razdel[data-skrytyy="${r.kod}"]`);
    const tekst = (await stroka.textContent().catch(() => '')) ?? '';
    ok(tekst.includes(r.name), `${kto}: в карточке нет раздела «${r.name}»`);
    ok(tekst.includes(r.prichina), `${kto}: у раздела «${r.name}» нет плашки «${r.prichina}»`);
    /* «Открыть»: метка ставится, раздел открывается с плашкой. */
    await Promise.all([
      page.waitForURL(`**/zadaniya/${r.adresa[0]}/`, { timeout: 20000 }),
      stroka.locator('button').click(),
    ]).catch(() => {});
    ok(
      new URL(page.url()).pathname === `/zadaniya/${r.adresa[0]}/`,
      `${kto}: «Открыть» привело на ${new URL(page.url()).pathname}, нужно /zadaniya/${r.adresa[0]}/`,
    );
    const metka = (await context.cookies(BASE)).find((c) => c.name === METKA_SKRYTYH);
    ok(metka?.value === '1', `${kto}: «Открыть» не поставило метку ${METKA_SKRYTYH}=1`);
    ok(metka?.path === '/', `${kto}: метка стоит не на весь сайт (path=${metka?.path})`);
    const plashka = await page
      .locator('[data-skrytyy-razdel="est"]')
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    ok(plashka, `${kto}: после «Открыть» раздел «${r.name}» без плашки`);
    await snimok(page, `kabinet-${b.metka}-otkryt-${r.kod}`);
    await page.goto(`${BASE}/kabinet/`, { waitUntil: 'load' });
    await kartochka.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  }
  /* «Закрыть доступ»: метка снимается, раздел снова закрыт. */
  await page.locator('.skryt-admin__zakryt').click();
  ok(
    (await context.cookies(BASE)).every((c) => c.name !== METKA_SKRYTYH),
    `${kto}: «Закрыть доступ в этом браузере» не сняло метку`,
  );
  if (!VSEM && razdely.length > 0) {
    await page.goto(`${BASE}/zadaniya/${razdely[0].adresa[0]}/`, { waitUntil: 'load' });
    const net = await page
      .locator('[data-skrytyy-razdel="net"]')
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);
    ok(net, `${kto}: после «Закрыть доступ» раздел всё ещё открыт`);
  }
  ok(sboi.length === 0, `${kto}: ошибки на странице — ${sboi.join(' | ')}`);
  await context.close();
  console.log(
    `  ${kto}: карточка есть, «Открыть» ставит метку и открывает раздел с плашкой, «Закрыть доступ» снимает`,
  );
}

await Promise.all([...new Set(spisok.map((b) => b.browser))].map((browser) => browser.close()));
server.close();
itog();

function itog() {
  console.log('');
  for (const p of propushcheno) console.log(`Пропущено: ${p}.`);
  if (oshibki.length > 0) {
    console.error(`Скрытые разделы: не прошло ${oshibki.length} из ${proverok}:\n`);
    for (const o of oshibki) console.error(`  ✗ ${o}`);
    process.exit(1);
  }
  console.log(
    razdely.length === 0
      ? `Скрытые разделы (${STRUKTURA.id}): скрытых разделов нет, проверок — ${proverok}.`
      : `Скрытые разделы (${STRUKTURA.id}): ${razdely.map((r) => r.kod).join(', ')} — ` +
          `посетителю не видны, администратору доступны. Проверок — ${proverok}.`,
  );
  process.exit(0);
}
