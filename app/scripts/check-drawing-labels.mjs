/* scripts/check-drawing-labels.mjs — подписи на чертежах: корни, дроби, пересечения.

   pnpm test:drawing-labels [--brauzer] [--snimki папка]

   Шаблоны чертежей с записями (числа, корни, дроби):
     • №18 — движок схем (lib/skhemy): все сцены тренажёра и генератора
       и чертежи опорных задач;
     • №3 — стереометрия (lib/chertezh3): варианты банка с корнем на чертеже;
     • №1 — планиметрия (lib/planimetriya): прототипы, где на чертеже корень.
   У каждого шаблона — 20 вариантов (числа, ракурс, поворот, размер).

   Без браузера (быстро, по раскладке движков):
     • знак корня — путь (lib/risunki/koren.js), а не символ «√» без черты;
       черта начинается до подкоренного и кончается после него;
     • подкоренное набрано заданной ширины (textLength) — черта над ним
       в любом браузере;
     • запись в кадре и не задевает линий, засечек, букв, других записей
       (№18 — по раскладке движка, №1 и №3 — свои проверки движков).

   С --brauzer (Chromium и WebKit, если установлен) — по отрисовке:
     • у каждого корня черта шире подкоренного выражения и выше его;
     • подписи не обрезаны: текст внутри чертежа, у формул KaTeX в
       foreignObject знак корня не сплющен (высота svg формулы > 0);
     • №18: прямоугольник записи не пересекает линии и засечки;
     • PDF листа: те же чертежи печатью Chromium (файл в папке снимков).

   Причина, ради которой проверка заведена: подпись «√10» была символом
   шрифта — у него нет черты, её рисует только набор формулы. */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireSrc } from './lib/load-ts.mjs';

const args = process.argv.slice(2);
const BRAUZER = args.includes('--brauzer');
const iSnimki = args.indexOf('--snimki');
const SNIMKI = iSnimki >= 0 ? args[iSnimki + 1] : null;
const N = 20;

let plokho = 0;
const schet = new Map();
function fakt(imya, ok, podrobno = '') {
  const s = schet.get(imya) ?? { ok: 0, vsego: 0, primery: [] };
  s.vsego += 1;
  if (ok) s.ok += 1;
  else {
    plokho += 1;
    if (s.primery.length < (process.env.VSE ? 999 : 5)) s.primery.push(podrobno);
  }
  schet.set(imya, s);
}

/** Детерминированный генератор: одна и та же выборка при каждом запуске. */
function zerno(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const katexLib = requireSrc('lib/graph/katex.js');
const katex = katexLib.katex ?? katexLib.default ?? katexLib;
const tex = (t) => katex.renderToString(t, { throwOnError: false });

/** Чертежи для проверки в браузере: { id, svg }. */
const chertezhi = [];

/* ── №18: движок схем ───────────────────────────────────────────── */
{
  const ekran = requireSrc('lib/skhemy/ekran');
  const podpisi = requireSrc('lib/skhemy/podpisi');
  const { svgSkhemy } = requireSrc('lib/skhemy/svg');
  const { scena18 } = requireSrc('lib/zadanie18/trenazher/sceny');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  const { KOREN } = requireSrc('lib/risunki/koren.js');
  const rnd = zerno(1801);
  const sost = { lit: new Set(), shag: null, podpisi: true };
  /* Шаблоны движка схем с записями: сцены тренажёра и генератора №18
     (варианты чисел) и опорные задачи №18 (исходное положение и
     случайные положения). */
  const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye/index');
  const { trebuetsyaScenaOpornoy18 } = requireSrc('lib/zadanie18/opornye/index');
  const SHABLONY = [
    ...TIPY_18.map((t) => ({
      id: t.id,
      sk: (i) => {
        const z = scena18(t.id, t.varianty[i % t.varianty.length]);
        return { z, tt: z.nachalo };
      },
    })),
    ...OPORNYE_18.map((o) => ({
      id: `opornaya-${o.id}`,
      sk: (i) => {
        const z = trebuetsyaScenaOpornoy18(o.id);
        return { z, tt: i === 0 ? z.nachalo : z.sluchaynaya(rnd) };
      },
    })),
  ];
  for (const t of SHABLONY) {
    for (let i = 0; i < N; i += 1) {
      const { z: sk, tt } = t.sk(i);
      const kadr = sk.postroit(tt);
      /* Первые три — как на листе и в тренажёре, дальше — повороты,
         отражение и размеры экрана. */
      const vid =
        i < 3
          ? { ugol: 0, otrazhenie: 1 }
          : { ugol: rnd() * 360, otrazhenie: rnd() < 0.5 ? 1 : -1 };
      const [W, H] = [
        [360, 250],
        [343, 247],
        [640, 460],
      ][i % 3];
      const e = ekran.raskladka(kadr, vid, ekran.ramkaKadra(kadr, vid, sost), W, H, sost);
      const id = `18:${t.id}:${i}`;
      const prep = {
        otrezki: e.linii.map((l) => [
          [l.x1, l.y1],
          [l.x2, l.y2],
        ]),
        okruzhnosti: e.okr.map((o) => [[o.cx, o.cy], o.r]),
        tochki: e.tochki.map((q) => [q.x, q.y]),
      };
      /* Засечки — отдельные короткие отрезки пути. */
      for (const l of e.linii) {
        const re = /M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)/g;
        let m;
        while ((m = re.exec(l.shtrihi)) !== null)
          prep.otrezki.push([
            [+m[1], +m[2]],
            [+m[3], +m[4]],
          ]);
      }
      const bukvy = e.podpisi.map((q) => {
        const g = podpisi.gabaritBukvy(
          q.indeks ? `${q.bukva}_${q.indeks}` : q.bukva,
          ekran.SK.kegl,
        );
        return [q.x - g.hw, q.y - g.hh, q.x + g.hw, q.y + g.hh];
      });
      const ramki = e.velichiny.map((v) => {
        const g = ekran.gabaritVelichiny(v.chasti);
        return [v.x - g.hw, v.y - g.hh, v.x + g.hw, v.y + g.hh];
      });
      e.velichiny.forEach((v, j) => {
        const r = ramki[j];
        const zapis = v.chasti.map((c) => (c.koren ? `√${c.t}` : c.t)).join('');
        fakt(
          '№18: запись в кадре',
          r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] <= H,
          `${id} ${zapis}`,
        );
        fakt(
          '№18: запись не задевает линий, засечек, букв и других записей',
          podpisi.kasaniya(r, prep, [...bukvy, ...ramki.filter((_, k) => k !== j)], null) === 0,
          `${id} ${zapis}`,
        );
        fakt(
          '№18: в записи нет символа «√» — знак рисуется путём',
          !v.chasti.some((c) => c.t.includes('√')),
          `${id} ${zapis}`,
        );
        const korni = v.chasti.filter((c) => c.koren);
        fakt(
          '№18: у каждого корня — свой знак с чертой',
          korni.length === v.korni.length,
          `${id} ${zapis}`,
        );
        korni.forEach((c, k) => {
          const d = v.korni[k] ?? '';
          const xs = [...d.matchAll(/[MLH]([\d.-]+)/g)].map((m) => +m[1]);
          const nachalo = v.levo + c.dx;
          const konec = nachalo + c.w;
          fakt(
            '№18: черта корня над всем подкоренным',
            xs.length > 0 &&
              Math.min(...xs) < nachalo &&
              Math.max(...xs) >= konec + KOREN.hvost * ekran.SK.keglVel * 0.9,
            `${id} ${zapis}`,
          );
        });
      });
      if (i < 3 || e.velichiny.some((v) => v.korni.length > 0))
        chertezhi.push({
          id,
          dvizhok: '18',
          svg: svgSkhemy(sk, tt, vid, sost, { W, H, opisanie: '', samodostatochnyy: true }),
        });
    }
  }
}

/* ── №3: стереометрия, лист ─────────────────────────────────────── */
{
  const { RAZDELY } = requireSrc('lib/zadanie3/index');
  const { chertezhVarianta } = requireSrc('lib/zadanie3/chertezhi/index');
  const { chertezhSvg } = requireSrc('lib/chertezh3/index');
  const rnd = zerno(303);
  const shablony = new Map();
  for (const r of RAZDELY)
    for (const p of r.prototipy)
      for (const v of p.varianty) {
        let ch;
        try {
          ch = chertezhVarianta(p, v);
        } catch {
          continue;
        }
        if (ch === null) continue;
        if (!/\\(sqrt|frac|dfrac)/.test(JSON.stringify(ch.scenariy.dannye ?? []))) continue;
        shablony.set(p.id, [...(shablony.get(p.id) ?? []), ch.scenariy]);
      }
  fakt('№3: найдены шаблоны с корнем или дробью на чертеже', shablony.size > 0, '');
  for (const [pid, sceny] of shablony) {
    for (let i = 0; i < N; i += 1) {
      const sc = sceny[i % sceny.length];
      const rakurs =
        i < sceny.length ? sc.rakurs : { azimut: -60 + rnd() * 120, vysota: 12 + rnd() * 20 };
      const s = { ...sc, ...(rakurs ? { rakurs } : {}) };
      const svg = chertezhSvg(s, {
        rezhim: 'uchenik',
        shirina: 320,
        kegl: 15,
        pechatMm: 62,
        katex: tex,
        klass: 'sheet-solid ch3-svg',
      });
      const id = `3:${pid}:${i}`;
      const korney = JSON.stringify(s.dannye).match(/\\\\sqrt/g)?.length ?? 0;
      fakt('№3: нет черты корня через text-decoration', !svg.includes('text-decoration'), id);
      fakt('№3: нет символа «√» без черты', !svg.includes('√'), id);
      fakt(
        '№3: у каждого корня — знак с чертой (путь)',
        (svg.match(/class="ch3-koren"/g)?.length ?? 0) +
          (svg.match(/class="mord sqrt/g)?.length ?? 0) >=
          korney,
        id,
      );
      fakt(
        '№3: формулы KaTeX в foreignObject не обрезаются (overflow: visible)',
        !svg.includes('<foreignObject') || /<foreignObject[^>]*overflow:visible/.test(svg),
        id,
      );
      chertezhi.push({ id, dvizhok: '3', svg });
    }
  }
}

/* ── №1: планиметрия ────────────────────────────────────────────── */
{
  const { PROTOTIPY } = requireSrc('lib/planimetriya/stseny');
  const { POROG } = requireSrc('lib/planimetriya/figury');
  const { renderPlan } = requireSrc('lib/planimetriya/render');
  const { sluchaynyyVariant } = requireSrc('lib/planimetriya/variant');
  const { rngOf } = requireSrc('lib/vychisleniya/rng');
  const { risunokTeorii, KLYUCHI_TEORII } = requireSrc('lib/planimetriya/teoriya');
  let sKornem = 0;
  /* Теория: рисунки с записями «a√3», «a√2». */
  for (const k of KLYUCHI_TEORII) {
    let r;
    try {
      r = risunokTeorii(k);
    } catch {
      continue;
    }
    const svg = renderPlan(r.scena, r.optsii);
    if (!svg.includes('pl-koren') && !/√/.test(svg)) continue;
    sKornem += 1;
    fakt('№1: у корня — знак с чертой (путь), не символ', !svg.includes('√'), `теория ${k}`);
    chertezhi.push({ id: `1:teoriya:${k}`, dvizhok: '1', svg });
  }
  /* Прототипы: случайные числа и варианты рисунка, учитель (числа и ответ). */
  for (const p of PROTOTIPY) {
    const rng = rngOf(`drawing-labels-${p.id}`);
    let est = false;
    for (let i = 0; i < N; i += 1) {
      let scena;
      try {
        scena = p.stsena({ ...p.primer, ...(i === 0 ? {} : p.sluchaynye(rng)) }, POROG);
      } catch {
        continue;
      }
      const variant =
        i === 0 ? undefined : sluchaynyyVariant(rng, Object.keys(scena.tochki), p.diapazon);
      let svg;
      try {
        svg = renderPlan(scena, {
          rezhim: { rezhim: 'uchitel' },
          chisla: true,
          ...(variant ? { variant } : {}),
        });
      } catch {
        continue;
      }
      if (!svg.includes('pl-koren') && !svg.includes('√')) {
        if (!est) break;
        continue;
      }
      est = true;
      sKornem += 1;
      const id = `1:P${p.id}:${i}`;
      fakt('№1: у корня — знак с чертой (путь), не символ', !svg.includes('√'), id);
      chertezhi.push({ id, dvizhok: '1', svg });
    }
  }
  fakt('№1: найдены чертежи с корнем', sKornem > 0, '');
}

/* ── Браузер: отрисовка в Chromium и WebKit ─────────────────────── */

function stranica() {
  const css = path.resolve('node_modules/katex/dist/katex.min.css');
  /* Те же правила контейнеров, что на сайте и листе: svg чертежа во
     всю ширину — и защита svg внутри формулы (styles/base.css). */
  return `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width">
<link rel=stylesheet href="file://${css}">
<style>
body{margin:8px;font:12px sans-serif;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:6px}
.sheet-figure{border:1px solid #ddd;margin:0}.sheet-figure svg{display:block;width:100%;height:auto}
foreignObject .katex svg{width:100%!important;height:inherit!important;max-width:none!important;max-height:none!important}
</style>
<span class="katex" style="position:absolute;opacity:0">${tex('x\\sqrt{2}\\dfrac{1}{2}')}</span>
${chertezhi.map((c) => `<figure class="sheet-figure" data-id="${c.id}" data-dvizhok="${c.dvizhok}"><figcaption>${c.id}</figcaption>${c.svg}</figure>`).join('\n')}`;
}

/** Проверки на странице (выполняются в браузере). */
function proverkaVBrauzere() {
  const out = [];
  const zapis = (imya, ok, id) => out.push({ imya, ok, id });
  const segmenty = (d) => {
    const s = [];
    const re = /([ML])([\d.-]+)[ ,]([\d.-]+)/g;
    let m;
    let prev = null;
    while ((m = re.exec(d)) !== null) {
      const p = [+m[2], +m[3]];
      if (m[1] === 'L' && prev) s.push([prev, p]);
      prev = p;
    }
    return s;
  };
  const peresek = (r, [a, b]) => {
    /* Отрезок и прямоугольник (Лян — Барски). */
    let t0 = 0;
    let t1 = 1;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const p = [-dx, dx, -dy, dy];
    const q = [a[0] - r.x, r.x + r.width - a[0], a[1] - r.y, r.y + r.height - a[1]];
    for (let i = 0; i < 4; i += 1) {
      if (Math.abs(p[i]) < 1e-9) {
        if (q[i] < 0) return false;
      } else {
        const t = q[i] / p[i];
        if (p[i] < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }
    return true;
  };
  for (const fig of document.querySelectorAll('figure[data-id]')) {
    const id = fig.dataset.id;
    const svg = fig.querySelector(':scope > svg');
    if (!svg) continue;
    const vb = svg.viewBox.baseVal;
    /* Корни: путь знака и подкоренное (tspan с textLength) рядом. */
    for (const put of svg.querySelectorAll('path.skh-koren, path.ch3-koren, path.pl-koren')) {
      const b = put.getBBox();
      /* Подкоренное — ближайший справа tspan с textLength. */
      let luchshiy = null;
      for (const ts of svg.querySelectorAll('tspan[textLength]')) {
        const n = ts.getNumberOfChars();
        if (n === 0) continue;
        const x0 = ts.getStartPositionOfChar(0).x;
        const x1 = ts.getEndPositionOfChar(n - 1).x;
        const ext = ts.getExtentOfChar(0);
        if (x0 < b.x || x0 > b.x + b.width || ext.y > b.y + b.height || ext.y + ext.height < b.y)
          continue;
        /* Верх цифр: базовая линия минус высота прописных цифр (0,68 кегля
           у KaTeX_Main); у рамки знака (ext) верх выше самих цифр. */
        const kegl = parseFloat(getComputedStyle(ts).fontSize);
        const verh = ts.getStartPositionOfChar(0).y - 0.68 * kegl;
        if (luchshiy === null || x0 < luchshiy.x0) luchshiy = { x0, x1, verh };
      }
      zapis('браузер: у знака корня есть подкоренное', luchshiy !== null, id);
      if (luchshiy === null) continue;
      const shirinaCherty = b.x + b.width - luchshiy.x0;
      zapis(
        'браузер: черта корня не короче подкоренного выражения',
        shirinaCherty >= luchshiy.x1 - luchshiy.x0 - 0.5 && b.x + b.width >= luchshiy.x1 - 0.5,
        `${id}: черта ${shirinaCherty.toFixed(1)}, число ${(luchshiy.x1 - luchshiy.x0).toFixed(1)}`,
      );
      zapis(
        'браузер: черта корня над цифрами',
        b.y <= luchshiy.verh + 1.5,
        `${id}: черта ${b.y.toFixed(1)}, верх ${luchshiy.verh.toFixed(1)}`,
      );
    }
    /* Подписи не обрезаны: внутри чертежа. */
    for (const t of svg.querySelectorAll('text')) {
      const b = t.getBBox();
      if (b.width === 0) continue;
      zapis(
        'браузер: подпись внутри чертежа (не обрезана)',
        b.x >= vb.x - 1 &&
          b.y >= vb.y - 1 &&
          b.x + b.width <= vb.x + vb.width + 1 &&
          b.y + b.height <= vb.y + vb.height + 1,
        `${id}: «${t.textContent}»`,
      );
    }
    /* Формулы KaTeX в foreignObject: знак корня не сплющен. */
    for (const s of svg.querySelectorAll('foreignObject .sqrt svg')) {
      zapis(
        'браузер: знак корня KaTeX в формуле не сплющен',
        s.getBoundingClientRect().height > 1,
        id,
      );
    }
    /* №18: прямоугольник записи не пересекает линии и засечки. */
    if (fig.dataset.dvizhok === '18') {
      const seg = [];
      for (const l of svg.querySelectorAll('line'))
        seg.push([
          [+l.getAttribute('x1'), +l.getAttribute('y1')],
          [+l.getAttribute('x2'), +l.getAttribute('y2')],
        ]);
      for (const p of svg.querySelectorAll('path.skh-shtrih'))
        seg.push(...segmenty(p.getAttribute('d')));
      for (const t of svg.querySelectorAll('text.skh-velichina')) {
        const b = t.getBBox();
        const r = { x: b.x + 1, y: b.y + 2, width: b.width - 2, height: b.height - 4 };
        zapis(
          'браузер: запись №18 не пересекает линии и засечки',
          !seg.some((s) => peresek(r, s)),
          `${id}: «${t.textContent}»`,
        );
      }
    }
  }
  return out;
}

async function vBrauzere() {
  const { chromium, webkit } = await import('playwright');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drawing-labels-'));
  const fail = path.join(tmp, 'chertezhi.html');
  fs.writeFileSync(fail, stranica());
  const brauzery = [
    [
      'Chromium',
      () =>
        chromium.launch(
          fs.existsSync('/opt/pw-browsers/chromium')
            ? { executablePath: '/opt/pw-browsers/chromium' }
            : {},
        ),
    ],
    ['WebKit', () => webkit.launch()],
  ];
  for (const [imya, zapusk] of brauzery) {
    let b;
    try {
      b = await zapusk();
    } catch (e) {
      if (imya === 'WebKit' && !process.env.CI) {
        console.log(
          `  ${imya} не установлен — пропуск (в CI обязателен): ${String(e.message).split('\n')[0]}`,
        );
        continue;
      }
      throw e;
    }
    for (const [w, h, ekran] of [
      [390, 844, 'телефон'],
      [1440, 900, 'компьютер'],
    ]) {
      const p = await b.newPage({
        viewport: { width: w, height: h },
        deviceScaleFactor: w < 500 ? 2 : 1,
      });
      await p.goto(`file://${fail}`);
      await p.evaluate(() => document.fonts.ready);
      const rez = await p.evaluate(proverkaVBrauzere);
      for (const r of rez)
        fakt(`${imya}, ${ekran}: ${r.imya.replace('браузер: ', '')}`, r.ok, r.id);
      if (SNIMKI) {
        fs.mkdirSync(SNIMKI, { recursive: true });
        /* Снимок — начало страницы (у браузеров предел высоты снимка);
           проверки выше идут по всем чертежам. */
        const vysota = await p.evaluate(() => document.documentElement.scrollHeight);
        const dpr = w < 500 ? 2 : 1;
        await p.screenshot({
          path: path.join(SNIMKI, `${imya.toLowerCase()}-${w}.png`),
          fullPage: true,
          clip: { x: 0, y: 0, width: w, height: Math.min(vysota, Math.floor(30000 / dpr)) },
        });
        if (imya === 'Chromium' && w === 1440) {
          await p.emulateMedia({ media: 'print' });
          await p.pdf({
            path: path.join(SNIMKI, 'chertezhi.pdf'),
            format: 'A4',
            printBackground: true,
          });
        }
      }
      await p.close();
    }
    await b.close();
  }
}

if (BRAUZER) await vBrauzere();

console.log(`Подписи на чертежах: ${chertezhi.length} чертежей в браузерной выборке`);
for (const [imya, s] of schet) {
  console.log(`  ${s.ok === s.vsego ? '✓' : '✗'} ${imya}: ${s.ok}/${s.vsego}`);
  for (const p of s.primery) console.log(`      ${p}`);
}
if (plokho > 0) {
  console.log(`Ошибок: ${plokho}`);
  process.exit(1);
}
console.log('Подписи на чертежах: всё сходится.');
