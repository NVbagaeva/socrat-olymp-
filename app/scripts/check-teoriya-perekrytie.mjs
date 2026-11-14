#!/usr/bin/env node
/* scripts/check-teoriya-perekrytie.mjs — в теории стереометрии текст
   ничем не закрыт, карточки типов — шахматкой.

   Запуск: pnpm build && pnpm test:teoriya-perekrytie [префикс адреса…]

   Собранный сайт открывается в Chromium и WebKit (движок Safari на
   iPhone) на ширинах 360, 375, 390, 430 (телефон, сенсорный экран) и
   1280 (компьютер). На каждой странице:

     — каждая строка текста в основном содержимом видна: страница
       проходится сверху вниз шагом в экран, и в двух точках каждой строки
       стек элементов (elementsFromPoint, pointer-events включены у всех,
       чтобы попадали и «прозрачные для мыши» украшения) доходит до
       самого текста, не встретив выше него непрозрачного элемента
       (фон, картинка, залитая фигура SVG). Если текста в стеке нет вовсе —
       он обрезан предком (overflow, contain: paint, content-visibility),
       это тоже ошибка. Точки, где сверху липкий или закреплённый элемент
       (лента вкладок, «Содержание», нижнее меню, «?»), пропускаются:
       при прокрутке текст под них уходить может, в покое — нет;
     — лид главы (.o3-glava__lead) начинается не выше чем на 8 px ниже
       заголовка главы — прежняя ошибка: лид тянулся вверх отрицательным
       полем и обрезался content-visibility главы;
     — в самом низу страницы ни одна строка не стоит под закреплённым
       элементом у низа экрана («?», нижнее меню): дочитать можно всё;
     — счётчик раздела «k / n» на телефоне не сжимает лид раздела:
       лид не уже 80 % заголовка раздела;
     — карточки типов (.tipk__karta): соседи по ряду и по колонке разного
       цвета; номер-кружок и текст читаются с контрастом не ниже AA (по
       снимку карточки со скрытым текстом — худший пиксель фона);
       ссылки-пилюли на телефоне не ниже 44 px;
     — страница не шире окна. */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';
import { APP } from './lib/load-ts.mjs';
import { welcomeSeen } from './lib/onboarding.mjs';
import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs';

bezBanneraCookieVsyudu(chromium, webkit);

/* OUT_DIR — другая папка сборки (например, снимок «до» правки). */
const OUT = process.env.OUT_DIR ?? path.join(APP, 'out');
if (!fs.existsSync(OUT)) {
  console.error('Нет папки сборки out: сначала pnpm build');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const BASE = 'http://127.0.0.1:' + server.address().port;

const ONLY = process.argv.slice(2).filter((arg) => arg.startsWith('/'));
const ALL_PAGES = [
  '/zadaniya/3/teoriya/',
  '/zadaniya/15/teoriya/',
  /* Карточки типов — общие (KartochkiTipov): «О задании» №3, №15, №14. */
  '/zadaniya/3/',
  '/zadaniya/15/',
  '/zadaniya/14/',
];
const PAGES =
  ONLY.length === 0 ? ALL_PAGES : ALL_PAGES.filter((url) => ONLY.some((p) => url.startsWith(p)));

/* SHIRINY=390,1280 и DVIZHKI=webkit — сузить прогон при отладке. */
const WIDTHS = (process.env.SHIRINY ?? '360,375,390,430,1280').split(',').map(Number);
const ENGINES = [
  ['Chromium', chromium],
  ['WebKit', webkit],
].filter(([name]) =>
  (process.env.DVIZHKI ?? 'chromium,webkit').toLowerCase().includes(name.toLowerCase()),
);

const problems = [];
const check = (ok, what) => {
  if (!ok) {
    problems.push(what);
  }
};

/* В браузере: строки текста основного содержимого, видимые в окне
   (с запасом). Поддеревья вне окна и свёрнутые <details> не обходятся. */
function sobratStroki() {
  const root = document.querySelector('main') ?? document.body;
  const H = innerHeight;
  const skipSel =
    'svg, script, style, noscript, template, .katex-mathml, .sr-only, .visually-hidden, [hidden], [inert], [aria-hidden="true"].help-fab';
  const lines = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (n.nodeType === Node.TEXT_NODE) {
        return n.textContent.trim() === '' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
      if (n.matches(skipSel)) {
        return NodeFilter.FILTER_REJECT;
      }
      const up = n.parentElement;
      if (up !== null && up.tagName === 'DETAILS' && !up.open && n.tagName !== 'SUMMARY') {
        return NodeFilter.FILTER_REJECT;
      }
      const cs = getComputedStyle(n);
      if (cs.display === 'none') {
        return NodeFilter.FILTER_REJECT;
      }
      if (cs.position !== 'absolute' && cs.position !== 'fixed') {
        const r = n.getBoundingClientRect();
        if ((r.width > 0 || r.height > 0) && (r.bottom < -50 || r.top > H + 50)) {
          return NodeFilter.FILTER_REJECT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    },
  });
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const el = node.parentElement;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || Number(cs.opacity) < 0.1) {
      continue;
    }
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 4 || r.height < 6) {
        continue;
      }
      lines.push({
        node,
        top: r.top + scrollY,
        bottom: r.bottom + scrollY,
        left: r.left,
        right: r.right,
      });
    }
  }
  return lines;
}

async function proverkaStranicy(page, where, phone) {
  /* Ширина. */
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(wide <= 1, `${where}: страница шире окна на ${wide}px`);

  /* Лид главы ниже заголовка главы. */
  const leads = await page.evaluate(() =>
    [...document.querySelectorAll('.o3-glava__lead')].map((lead) => {
      const razdel = lead.closest('.vteor-razdel');
      const title = razdel?.querySelector('.vteor-razdel__title');
      return {
        id: razdel?.id ?? '?',
        gap:
          title === undefined || title === null
            ? null
            : lead.getBoundingClientRect().top - title.getBoundingClientRect().bottom,
      };
    }),
  );
  for (const { id, gap } of leads) {
    check(
      gap !== null && gap >= 8,
      `${where} #${id}: лид главы на ${gap}px от заголовка (нужно ≥ 8)`,
    );
  }

  /* Счётчик раздела не сжимает лид. */
  if (phone) {
    const uzkie = await page.evaluate(() =>
      [...document.querySelectorAll('.o3-razdel__head')]
        .map((head) => {
          const lead = head.querySelector('.o3-razdel__lead');
          return lead === null
            ? null
            : {
                id: head.parentElement.id,
                dolya: lead.getBoundingClientRect().width / head.getBoundingClientRect().width,
              };
        })
        .filter((x) => x !== null && x.dolya < 0.8),
    );
    for (const { id, dolya } of uzkie) {
      check(false, `${where} #${id}: лид раздела занимает ${Math.round(dolya * 100)}% ширины`);
    }
  }

  /* Строки текста: шаг в экран, стек элементов в двух точках строки. */
  await page.addStyleTag({
    content: '*, *::before, *::after { pointer-events: auto !important; }',
  });
  const itog = await page.evaluate(async (sobrat) => {
    const collect = new Function(`return (${sobrat})()`);
    const kadr = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const zakreplyon = (el) => {
      for (let e = el; e !== null && e !== document.documentElement; e = e.parentElement) {
        const p = getComputedStyle(e).position;
        if (p === 'fixed' || p === 'sticky') {
          return true;
        }
      }
      return false;
    };
    const neprozrachny = (el) => {
      const cs = getComputedStyle(el);
      if (el instanceof SVGElement && !(el instanceof SVGSVGElement)) {
        const fill = cs.fill;
        return (
          fill !== 'none' && !/rgba\(.*,\s*0(\.\d*)?\)$/.test(fill) && Number(cs.fillOpacity) >= 0.5
        );
      }
      if (['IMG', 'CANVAS', 'VIDEO'].includes(el.tagName)) {
        return true;
      }
      if (cs.backgroundImage !== 'none') {
        return true;
      }
      const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m === null) {
        return false;
      }
      const parts = m[1].split(/[\s,/]+/).filter(Boolean);
      const a = parts.length > 3 ? Number(parts[3]) : 1;
      return a >= 0.5;
    };
    /* Точка вне прокручиваемого предка — текст просто прокручен,
       не закрыт. */
    const vneProkrutki = (node, x, y) => {
      for (let e = node.parentElement; e !== null && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const scroll = /auto|scroll/.test(cs.overflowX + cs.overflowY);
        if (scroll) {
          const r = e.getBoundingClientRect();
          if (x < r.left || x > r.right || y < r.top || y > r.bottom) {
            return true;
          }
        }
      }
      return false;
    };
    const opis = (e) =>
      e === undefined || e === null
        ? '?'
        : `${e.tagName.toLowerCase()}.${String(e.className?.baseVal ?? e.className)
            .trim()
            .split(/\s+/)
            .join('.')}`;
    const oshibki = [];
    const done = new Set();
    const ids = new WeakMap();
    let next = 0;
    const idOf = (node) => {
      if (!ids.has(node)) ids.set(node, next++);
      return ids.get(node);
    };
    let all = [];
    const H = innerHeight;
    const maxY = () => document.documentElement.scrollHeight - H;
    for (let y = 0; ; y = Math.min(y + Math.floor(H * 0.6), maxY())) {
      scrollTo(0, y);
      await kadr();
      await kadr();
      /* content-visibility: главы, вошедшие в экран, дорисовались —
         строки пересобираются (их координаты могли сдвинуться). */
      all = collect();
      /* Строка проверяется в четырёх точках: у начала и в середине, на
         30 % и 70 % высоты — полуобрезанная строка тоже ловится. */
      const proverit = (line) => {
        const top = line.top - scrollY;
        const bottom = line.bottom - scrollY;
        const lx = line.left + Math.min(4, (line.right - line.left) / 2);
        const mx = (line.left + line.right) / 2;
        const y1 = top + (bottom - top) * 0.3;
        const y2 = top + (bottom - top) * 0.7;
        const own = line.node.parentElement;
        let proveryeno = false;
        for (const [x, cy] of [
          [lx, y1],
          [mx, y1],
          [lx, y2],
          [mx, y2],
        ]) {
          if (x < 0 || x > innerWidth || vneProkrutki(line.node, x, cy)) {
            continue;
          }
          const stack = document.elementsFromPoint(x, cy);
          const idx = stack.findIndex((e) => e === own || own.contains(e));
          const above = idx === -1 ? stack : stack.slice(0, idx);
          if (above.some(zakreplyon)) {
            continue;
          }
          proveryeno = true;
          if (idx === -1) {
            return {
              proveryeno,
              zakryto: `обрезан (сверху ${opis(stack[0])}; текст в ${opis(own)}, y=${Math.round(cy + scrollY)})`,
            };
          }
          const kto = above.find(neprozrachny);
          if (kto !== undefined) {
            return { proveryeno, zakryto: `под ${opis(kto)} (текст в ${opis(own)})` };
          }
        }
        return { proveryeno, zakryto: null };
      };
      const vOkne = (line) => line.top - scrollY >= 0 && line.bottom - scrollY <= H;
      const plohie = new Set();
      for (const line of all) {
        const key = `${idOf(line.node)}:${Math.round(line.top)}`;
        if (!vOkne(line) || done.has(key) || zakreplyon(line.node.parentElement)) {
          continue;
        }
        const { proveryeno, zakryto } = proverit(line);
        if (zakryto !== null) {
          plohie.add(line.node);
        } else if (proveryeno) {
          done.add(key);
        }
      }
      /* Подозрительные строки — ещё раз, после паузы: глава с
         content-visibility могла не успеть дорисоваться к хит-тесту. */
      if (plohie.size > 0) {
        await new Promise((r) => setTimeout(r, 400));
        await kadr();
        await kadr();
        for (const line of collect()) {
          if (!plohie.has(line.node) || !vOkne(line)) {
            continue;
          }
          const { proveryeno, zakryto } = proverit(line);
          if (proveryeno) {
            done.add(`${idOf(line.node)}:${Math.round(line.top)}`);
          }
          if (zakryto !== null) {
            oshibki.push(`«${line.node.textContent.trim().slice(0, 50)}» — ${zakryto}`);
          }
        }
      }
      if (y >= maxY()) {
        break;
      }
    }

    /* Низ страницы: строки не под закреплённым у низа экрана. Главы
       с content-visibility дорисовываются и меняют высоту — до низа
       прокручивается, пока высота не перестанет меняться. */
    for (let h = -1; h !== document.documentElement.scrollHeight;) {
      h = document.documentElement.scrollHeight;
      scrollTo(0, maxY());
      await kadr();
      await kadr();
    }
    all = collect();
    const nizhnie = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility !== 'visible') {
        return false;
      }
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top > H / 2;
    });
    const pod = [];
    for (const line of all) {
      const top = line.top - scrollY;
      const bottom = line.bottom - scrollY;
      for (const f of nizhnie) {
        if (f.contains(line.node)) {
          continue;
        }
        const r = f.getBoundingClientRect();
        if (
          top < r.bottom - 1 &&
          bottom > r.top + 1 &&
          line.left < r.right - 1 &&
          line.right > r.left + 1
        ) {
          pod.push(
            `«${line.node.textContent.trim().slice(0, 40)}» под ${f.className || f.tagName}`,
          );
        }
      }
    }
    return { oshibki: [...new Set(oshibki)], pod: [...new Set(pod)], vsego: done.size };
  }, sobratStroki.toString());

  check(itog.vsego > 20, `${where}: проверено всего ${itog.vsego} строк`);
  for (const o of itog.oshibki.slice(0, 15)) {
    check(false, `${where}: текст закрыт: ${o}`);
  }
  for (const o of itog.pod.slice(0, 10)) {
    check(false, `${where}: внизу страницы не дочитать: ${o}`);
  }
  return itog.vsego;
}

/* Яркость по WCAG. */
function lum([r, g, b]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function kontrast(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
const rgb = (s) =>
  s
    .match(/\d+(\.\d+)?/g)
    .slice(0, 3)
    .map(Number);

/* Худший (самый тёмный и самый светлый) пиксель снимка. */
async function kraynieTsveta(page, handle, kray = 0.12) {
  const png = await handle.screenshot();
  return page.evaluate(
    async ([b64, kray]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      /* Края — тень и кромка карточки, не фон под текстом. */
      const m = Math.round(Math.min(c.width, c.height) * kray);
      const d = ctx.getImageData(m, m, c.width - 2 * m, c.height - 2 * m).data;
      let dark = [255, 255, 255];
      let light = [0, 0, 0];
      const l = ([r, g, bl]) => 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      for (let i = 0; i < d.length; i += 4) {
        const p = [d[i], d[i + 1], d[i + 2]];
        if (l(p) < l(dark)) dark = p;
        if (l(p) > l(light)) light = p;
      }
      return { dark, light };
    },
    [png.toString('base64'), kray],
  );
}

async function proverkaKartochek(page, where, phone) {
  const karty = page.locator('.tipk__karta');
  const n = await karty.count();
  if (n === 0) {
    return;
  }
  const info = await karty.evaluateAll((list) =>
    list.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top + scrollY),
        fon: getComputedStyle(el).backgroundImage,
      };
    }),
  );
  for (let i = 0; i < info.length; i++) {
    for (let j = i + 1; j < info.length; j++) {
      const a = info[i];
      const b = info[j];
      const ryad = a.y === b.y;
      const kolonka = a.x === b.x;
      if (!ryad && !kolonka) continue;
      /* Ближайший сосед в ряду / колонке. */
      const mezhdu = info.some(
        (c, k) =>
          k !== i &&
          k !== j &&
          (ryad
            ? c.y === a.y && c.x > Math.min(a.x, b.x) && c.x < Math.max(a.x, b.x)
            : c.x === a.x && c.y > Math.min(a.y, b.y) && c.y < Math.max(a.y, b.y)),
      );
      if (!mezhdu) {
        check(a.fon !== b.fon, `${where}: карточки ${i + 1} и ${j + 1} — соседи одного цвета`);
      }
    }
  }
  if (phone) {
    const nizkie = await page
      .locator('.tipk__ssylka')
      .evaluateAll((list) => list.filter((a) => a.getBoundingClientRect().height < 44).length);
    check(nizkie === 0, `${where}: ${nizkie} ссылок карточек ниже 44 px`);
  }
  /* Контраст: первая (белая) и вторая (голубая) карточки. */
  await page.addStyleTag({
    content:
      '.help-fab, .bnav { visibility: hidden !important; } .tipk__karta.kontrast-proba * { color: transparent !important; } .tipk__karta.kontrast-proba .tipk__ssylka, .tipk__karta.kontrast-proba .tipk__no { visibility: hidden; } .tipk__karta.kontrast-proba .tipk__formula, .tipk__karta.kontrast-proba .tipk__chip, .tipk__karta.kontrast-proba .badge { visibility: hidden; }',
  });
  for (const k of [0, 1].filter((x) => x < n)) {
    const karta = karty.nth(k);
    /* По центру экрана: ни липкая лента сверху, ни «?» снизу на снимок
       не попадают. */
    await karta.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    const cveta = await karta.evaluate((el) => {
      const c = (s) => (s === null ? null : getComputedStyle(s).color);
      return {
        title: c(el.querySelector('.tipk__title')),
        tekst: c(el.querySelector('.tipk__tekst')),
      };
    });
    await karta.evaluate((el) => el.classList.add('kontrast-proba'));
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const { dark } = await kraynieTsveta(page, karta);
    await karta.evaluate((el) => el.classList.remove('kontrast-proba'));
    for (const [imya, cvet, porog] of [
      ['заголовок', cveta.title, 4.5],
      ['текст', cveta.tekst, 4.5],
    ]) {
      if (cvet === null) continue;
      const kr = kontrast(rgb(cvet), dark);
      check(
        kr >= porog,
        `${where}: карточка ${k + 1}, ${imya}: контраст ${kr.toFixed(2)} < ${porog}`,
      );
    }
  }
  /* Номер-кружок: белая цифра на самом светлом пикселе кружка. */
  const no = page.locator('.tipk__no').first();
  if ((await no.count()) > 0) {
    const cvet = await no.evaluate((el) => getComputedStyle(el).color);
    await no.evaluate((el) => (el.style.color = 'transparent'));
    /* Середина кружка: углы снимка — фон карточки. */
    const { light } = await kraynieTsveta(page, no, 0.3);
    await no.evaluate((el) => (el.style.color = ''));
    const kr = kontrast(rgb(cvet), light);
    check(kr >= 4.5, `${where}: номер-кружок: контраст ${kr.toFixed(2)} < 4.5`);
  }
}

for (const [engName, engine] of ENGINES) {
  const browser = await engine.launch();
  for (const width of WIDTHS) {
    const phone = width < 768;
    const context = await browser.newContext({
      viewport: { width, height: phone ? 800 : 860 },
      ...(phone ? { isMobile: true, hasTouch: true } : {}),
    });
    await welcomeSeen(context);
    for (const url of PAGES) {
      const page = await context.newPage();
      const where = `${engName} ${width}px ${url}`;
      await page.goto(BASE + url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await proverkaKartochek(page, where, phone);
      await page.reload({ waitUntil: 'networkidle' });
      const n = await proverkaStranicy(page, where, phone);
      console.log(`${where}: строк проверено ${n}`);
      await page.close();
    }
    await context.close();
  }
  await browser.close();
}
server.close();

if (problems.length > 0) {
  console.error(`\nПроблем: ${problems.length}`);
  for (const p of problems) console.error(' — ' + p);
  process.exit(1);
}
console.log('\nТекст теории не закрыт, карточки типов в порядке.');
