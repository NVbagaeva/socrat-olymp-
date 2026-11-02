/* scripts/check-chertezhi-18.mjs — чертежи генератора и тренажёра №18.

   pnpm test:chertezhi-18 [--brauzer]   (VSE=1 — все примеры, не первые пять;
   DUMP=«id из отчёта» — записать чертёж в файл для просмотра)

   Все прототипы (content/zadanie18/trenazher.ts, TIPY_18) × 20
   вариантов: три набора чисел как на листе (360 × 250, без поворота),
   остальные — те же числа со случайным поворотом, отражением и
   размером экрана (зерно постоянное — выборка одна и та же).

   Подписи (по раскладке движка lib/skhemy/ekran.ts):
     • прямоугольник подписи (вершины, числа, «S = ?», углы, буквенные
       величины) не пересекает другие подписи — с зазором 2 px;
     • не задевает отрезков (и засечек, выносок, дуг углов, дуг),
       окружностей и точек — зазор 1 px;
     • подписи площадей («S… = ?», «S… = 24») — под чертежом, друг под
       другом, ниже всех линий и букв;
     • подпись угла — у дуги своего угла (не дальше 22 px от дуги); если
       там нет чистого места — строкой под чертежом: «∠ACB = 150°»;
     • подпись в кадре;
     • кегль величин не меньше кегля вершин.
   Линии:
     • пунктир (построения, продолжения) не идёт вдоль другой линии
       ближе 6 px — двойная линия;
   Заливки:
     • заливки непрозрачные (в CSS темы и оформлении чертежа нет
       fill-opacity между 0 и 1 у многоугольников и секторов) — две
       полупрозрачные заливки не накладываются;
     • меньшая заливка не спрятана под большей (порядок слоёв);
     • у каждого чертежа в цвете есть заливка основной фигуры;
     • искомая площадь — сплошной толстый контур поверх линий, без
       пунктира внутри фигуры; в ч/б — штриховка 45°, других заливок нет.
   С --brauzer (Chromium): чертежи листа (3 варианта × цвет и ч/б)
   отрисованы, ширина каждой подписи по шрифту браузера не выходит за
   прямоугольник раскладки (± 1 px) — значит, проверки выше по модели
   верны и для настоящего текста.
   Пропорции:
     • отрезки с числами (или с x, 2x, 3x) на чертеже соотносятся как
       числа — на глаз, с допуском 25 % (подпись целого отрезка). */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireSrc } from './lib/load-ts.mjs';

const BRAUZER = process.argv.includes('--brauzer');
/** Чертежи листа для проверки в браузере: svg и прямоугольники модели. */
const dlyaBrauzera = [];

const N = 20;
const ZAZOR_PODPISEY = 2;
const ZAZOR_LINIY = 1;
const PUNKTIR_BLIZHE = 6;
const DOPUSK_PROPORCIY = 1.25;

let plokho = 0;
const schet = new Map();
function fakt(imya, ok, podrobno = '') {
  const s = schet.get(imya) ?? { ok: 0, vsego: 0, primery: [] };
  s.vsego += 1;
  if (ok) s.ok += 1;
  else {
    plokho += 1;
    if (s.primery.length < (process.env.VSE ? 9999 : 5)) s.primery.push(podrobno);
  }
  schet.set(imya, s);
}

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

const ekranLib = requireSrc('lib/skhemy/ekran');
const podpisiLib = requireSrc('lib/skhemy/podpisi');
const { svgSkhemy, STIL_SAM } = requireSrc('lib/skhemy/svg');
const { cssTemy } = requireSrc('lib/skhemy/tema');
const { scena18 } = requireSrc('lib/zadanie18/trenazher/sceny');
const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
const { SK, raskladka, ramkaKadra } = ekranLib;

/* ── Геометрия ─────────────────────────────────────────────────── */

const rasshirit = (r, g) => [r[0] - g, r[1] - g, r[2] + g, r[3] + g];
const peresek = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Отрезок задевает прямоугольник (Лян — Барски). */
function otrezokVPr(a, b, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const p = [-dx, dx, -dy, dy];
  const q = [a[0] - r[0], r[2] - a[0], a[1] - r[1], r[3] - a[1]];
  for (let i = 0; i < 4; i += 1) {
    if (Math.abs(p[i]) < 1e-12) {
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
}

/** Окружность (линия) задевает прямоугольник. */
function okrVPr(c, rad, r) {
  const nx = Math.max(r[0], Math.min(c[0], r[2]));
  const ny = Math.max(r[1], Math.min(c[1], r[3]));
  const blizh = Math.hypot(c[0] - nx, c[1] - ny);
  const dal = Math.max(
    ...[
      [r[0], r[1]],
      [r[2], r[1]],
      [r[0], r[3]],
      [r[2], r[3]],
    ].map((p) => Math.hypot(c[0] - p[0], c[1] - p[1])),
  );
  return blizh <= rad && rad <= dal;
}

/** Круг (точка чертежа) задевает прямоугольник. */
function krugVPr(c, rad, r) {
  const nx = Math.max(r[0], Math.min(c[0], r[2]));
  const ny = Math.max(r[1], Math.min(c[1], r[3]));
  return Math.hypot(c[0] - nx, c[1] - ny) < rad;
}

/** Путь SVG (M, L, H, V, A, Z) → ломаные; дуги — по 12 отрезков. */
function lomanyePuti(d) {
  const out = [];
  let tek = null;
  let nach = null;
  const re = /([MLAZHV])([^MLAZHV]*)/g;
  let m;
  while ((m = re.exec(d)) !== null) {
    const ch = m[2].trim().split(/[ ,]+/).filter(Boolean).map(Number);
    if (m[1] === 'M') {
      tek = [ch[0], ch[1]];
      nach = tek;
      out.push([tek]);
    } else if (m[1] === 'L') {
      tek = [ch[0], ch[1]];
      out[out.length - 1].push(tek);
    } else if (m[1] === 'H') {
      tek = [ch[0], tek[1]];
      out[out.length - 1].push(tek);
    } else if (m[1] === 'V') {
      tek = [tek[0], ch[0]];
      out[out.length - 1].push(tek);
    } else if (m[1] === 'Z') {
      if (nach) out[out.length - 1].push(nach);
    } else if (m[1] === 'A') {
      const [rx, , , bol, sweep, x, y] = ch;
      const p1 = tek;
      const p2 = [x, y];
      const dd = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const r = Math.max(rx, dd / 2);
      const h = Math.sqrt(Math.max(0, r * r - (dd / 2) ** 2));
      const mx = (p1[0] + p2[0]) / 2;
      const my = (p1[1] + p2[1]) / 2;
      const ux = (p2[0] - p1[0]) / (dd || 1);
      const uy = (p2[1] - p1[1]) / (dd || 1);
      /* Центр: слева или справа от хорды — по флагам. */
      const zn = bol === sweep ? -1 : 1;
      const c = [mx - uy * h * zn, my + ux * h * zn];
      let a1 = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
      let a2 = Math.atan2(p2[1] - c[1], p2[0] - c[0]);
      if (sweep === 1) while (a2 < a1) a2 += 2 * Math.PI;
      else while (a2 > a1) a2 -= 2 * Math.PI;
      for (let k = 1; k <= 12; k += 1) {
        const a = a1 + ((a2 - a1) * k) / 12;
        out[out.length - 1].push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
      }
      tek = p2;
    }
  }
  return out;
}

const otrezkiLomanyh = (lom) => lom.flatMap((l) => l.slice(1).map((p, i) => [l[i], p]));

/** Площадь и пересечение выпуклых многоугольников (Сазерленд — Ходжман). */
function ploshchad(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}
function otsech(subj, clip) {
  const orient = ploshchad(clip) > 0 ? 1 : -1;
  let out = subj;
  for (let i = 0; i < clip.length && out.length > 0; i += 1) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const vnutri = (p) =>
      orient * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= -1e-9;
    const vh = out;
    out = [];
    for (let j = 0; j < vh.length; j += 1) {
      const p = vh[j];
      const q = vh[(j + 1) % vh.length];
      const pin = vnutri(p);
      const qin = vnutri(q);
      if (pin) out.push(p);
      if (pin !== qin) {
        const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
        const t = d1 / (d1 - d2);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out;
}
const tochkiMnog = (s) => s.points.split(' ').map((p) => p.split(',').map(Number));

/* ── Числа подписей (пропорции) ────────────────────────────────── */

/** «12», «2,5», «2√5», «3x», «x», «AB = 15» → { edinica, znachenie } или null. */
function chisloPodpisi(tekst) {
  const t = tekst.includes('=') ? tekst.slice(tekst.lastIndexOf('=') + 1).trim() : tekst.trim();
  let m = /^(\d+(?:,\d+)?)$/.exec(t);
  if (m) return { edinica: '1', znachenie: Number(m[1].replace(',', '.')) };
  m = /^(\d+)?√(\d+)$/.exec(t);
  if (m) return { edinica: '1', znachenie: Number(m[1] ?? 1) * Math.sqrt(Number(m[2])) };
  m = /^(\d+)?\s?([a-z])$/.exec(t);
  if (m) return { edinica: m[2], znachenie: Number(m[1] ?? 1) };
  return null;
}

/* ── CSS заливок ───────────────────────────────────────────────── */
{
  const css = cssTemy() + STIL_SAM;
  const pravila = css.split('}').filter((r) => /skh-(mnog|sektor|zalivka)/.test(r));
  const prozrachnye = pravila.filter((r) => {
    const m = /fill-opacity:\s*(var\([^)]*\)|[\d.]+)/.exec(r);
    if (!m) return /[{;]opacity:\s*0?\.\d/.test(r);
    if (m[1].startsWith('var')) return true;
    const v = Number(m[1]);
    return v > 0 && v < 1;
  });
  fakt(
    'заливки: непрозрачные (нет fill-opacity между 0 и 1)',
    prozrachnye.length === 0,
    prozrachnye.join('}\n'),
  );
  /* Заливка в цвете не спрятана правилами оформления (только в ч/б). */
  const pryachut = css
    .split('}')
    .filter(
      (r) =>
        /skh-(mnog|zalivka-okr)/.test(r) && /display:\s*none/.test(r) && !r.includes('skh--pechat'),
    );
  fakt(
    'заливки фигур в цвете не спрятаны оформлением',
    pryachut.length === 0,
    pryachut.join('}\n'),
  );
  fakt(
    'кегль величин не меньше кегля вершин',
    SK.keglVel >= SK.kegl,
    `keglVel ${SK.keglVel}, kegl ${SK.kegl}`,
  );
}

/* ── Чертежи ───────────────────────────────────────────────────── */

const rnd = zerno(1818);
const sost = { lit: new Set(), shag: null, podpisi: true };

for (const tip of TIPY_18) {
  for (let i = 0; i < N; i += 1) {
    const p = tip.varianty[i % tip.varianty.length];
    const sk = scena18(tip.id, p);
    const tt = sk.nachalo;
    const kadr = sk.postroit(tt);
    const vid =
      i < 3 ? { ugol: 0, otrazhenie: 1 } : { ugol: rnd() * 360, otrazhenie: rnd() < 0.5 ? 1 : -1 };
    const [W, H] =
      i < 3
        ? [360, 250]
        : [
            [360, 250],
            [343, 247],
            [640, 460],
          ][i % 3];
    const e = raskladka(kadr, vid, ramkaKadra(kadr, vid, sost), W, H, sost);
    const id = `${tip.id} #${(i % tip.varianty.length) + 1}${i < 3 ? '' : ` (${i}: ${Math.round(vid.ugol)}°${vid.otrazhenie < 0 ? ' отр.' : ''} ${W}×${H})`}`;
    /* DUMP=«id из отчёта» — записать этот чертёж в файл (DUMP_FILE) для просмотра. */
    if (process.env.DUMP === id)
      fs.writeFileSync(
        process.env.DUMP_FILE ?? path.join(os.tmpdir(), 'chertezh-18.html'),
        `<!doctype html><meta charset=utf-8><link rel=stylesheet href="file://${path.resolve('node_modules/katex/dist/katex.min.css')}"><body style="margin:0">${svgSkhemy(sk, tt, vid, sost, { W, H, opisanie: '', samodostatochnyy: true, tema: 'cvet' })}<span class="katex" style="opacity:0">x</span>`,
      );
    const poId = new Map(kadr.elementy.map((el) => [el.id, el]));

    /* Подписи: прямоугольники. */
    const podpisi = [
      ...e.podpisi.map((q) => {
        const imya = q.indeks ? `${q.bukva}_${q.indeks}` : q.bukva;
        const g = podpisiLib.gabaritBukvy(imya, SK.kegl);
        return {
          imya,
          r: [q.x - g.hw, q.y - g.hh, q.x + g.hw, q.y + g.hh],
          vynoska: q.vynoska,
          vel: null,
        };
      }),
      ...e.velichiny.map((v) => {
        const g = ekranLib.gabaritVelichiny(v.chasti);
        return {
          imya: v.chasti.map((c) => (c.koren ? `√${c.t}` : c.t)).join(''),
          r: [v.x - g.hw, v.y - g.hh, v.x + g.hw, v.y + g.hh],
          vynoska: '',
          vel: v,
        };
      }),
    ];

    /* Линии: отрезки, засечки, выноски, дуги, углы. */
    const otrezki = [];
    for (const l of e.linii) {
      otrezki.push({
        ab: [
          [l.x1, l.y1],
          [l.x2, l.y2],
        ],
        chto: `отрезок ${l.id}`,
      });
      for (const s of otrezkiLomanyh(lomanyePuti(l.shtrihi)))
        otrezki.push({ ab: s, chto: `засечка ${l.id}` });
    }
    for (const d of e.dugi)
      for (const s of otrezkiLomanyh(lomanyePuti(d.d)))
        otrezki.push({ ab: s, chto: `дуга ${d.id}` });
    for (const u of e.ugly)
      for (const s of otrezkiLomanyh(lomanyePuti(u.d)))
        otrezki.push({ ab: s, chto: `угол ${u.id}` });
    for (const m of e.mnog)
      if (m.kontur)
        for (const s of otrezkiLomanyh(lomanyePuti(m.kontur)))
          otrezki.push({ ab: s, chto: `контур ${m.id}` });
    const vynoski = podpisi.map((q) => otrezkiLomanyh(lomanyePuti(q.vynoska)));

    podpisi.forEach((q, j) => {
      const r = q.r;
      fakt(
        'подпись в кадре',
        r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] <= H,
        `${id}: «${q.imya}»`,
      );
      for (let k = j + 1; k < podpisi.length; k += 1) {
        fakt(
          'подписи не задевают друг друга (зазор 2 px)',
          !peresek(rasshirit(r, ZAZOR_PODPISEY / 2), rasshirit(podpisi[k].r, ZAZOR_PODPISEY / 2)),
          `${id}: «${q.imya}» и «${podpisi[k].imya}»`,
        );
      }
      const rr = rasshirit(r, ZAZOR_LINIY);
      const zadeta = otrezki.find((o) => otrezokVPr(o.ab[0], o.ab[1], rr));
      fakt(
        'подпись не задевает отрезков, засечек и дуг',
        zadeta === undefined,
        `${id}: «${q.imya}» — ${zadeta?.chto}`,
      );
      const chuzhaya = vynoski.findIndex(
        (v, k) => k !== j && v.some((s) => otrezokVPr(s[0], s[1], rr)),
      );
      fakt(
        'подпись не задевает чужих выносок',
        chuzhaya < 0,
        `${id}: «${q.imya}» — выноска «${podpisi[chuzhaya]?.imya}»`,
      );
      const okr = e.okr.find((o) => okrVPr([o.cx, o.cy], o.r, rr));
      fakt('подпись не задевает окружностей', okr === undefined, `${id}: «${q.imya}» — ${okr?.id}`);
      const t = e.tochki.find((o) => krugVPr([o.x, o.y], o.r, rr));
      fakt(
        'подпись не закрывает точек',
        t === undefined,
        `${id}: «${q.imya}» — точка ${t?.imya ?? t?.id}`,
      );

      if (q.vel !== null) {
        const el = poId.get(q.vel.id);
        /* «∠ACB = 150°», «cos C = 0,6» — подпись угла, которой у дуги нет
           места: строкой под чертежом (по центру), как площади. */
        const podChertezhom = q.vel.vPolose;
        const pl =
          podChertezhom ||
          el?.rol === 'region' ||
          el?.rol === 'region-sought' ||
          /^S_/.test(el?.tekst ?? '');
        if (pl) {
          /* Под чертежом: ниже всех линий, окружностей, точек и букв. */
          const niz = Math.max(
            ...e.linii.flatMap((l) => [l.y1, l.y2]),
            ...e.okr.map((o) => o.cy + o.r),
            ...e.tochki.map((o) => o.y + o.r),
            ...podpisi.filter((x) => x.vel === null).map((x) => x.r[3]),
            ...podpisi.filter((x) => x.vel !== null && !x.vel.vPolose).map((x) => x.r[3]),
          );
          fakt(
            'подпись площади — под чертежом',
            r[1] >= niz + 2,
            `${id}: «${q.imya}» (верх ${r[1].toFixed(1)}, низ чертежа ${niz.toFixed(1)})`,
          );
        }
        if (el?.yakor && 'ugol' in el.yakor && !podChertezhom) {
          const [a, v, b] = el.yakor.ugol.map((x) => e.preob.vEkran(x));
          const nx = Math.max(r[0], Math.min(v[0], r[2]));
          const ny = Math.max(r[1], Math.min(v[1], r[3]));
          const d = Math.hypot(v[0] - nx, v[1] - ny);
          /* Радиус дуги — как у движка (ekran.ts, ugolPut). */
          const rDugi = Math.max(
            SK.ugol.min,
            Math.min(
              SK.ugol.r,
              SK.ugol.dolya *
                Math.min(
                  Math.hypot(a[0] - v[0], a[1] - v[1]),
                  Math.hypot(b[0] - v[0], b[1] - v[1]),
                ),
            ),
          );
          fakt(
            'подпись угла — у дуги своего угла (не дальше 22 px от дуги)',
            d <= rDugi + 22,
            `${id}: «${q.imya}» в ${d.toFixed(0)} px от вершины, дуга ${rDugi.toFixed(0)} px`,
          );
        }
      }
    });

    /* Пунктир вдоль другой линии. */
    const punktir = e.linii.filter((l) => l.stil !== 'linia' || l.rol === 'construction');
    for (const a of punktir) {
      const pa = [a.x1, a.y1];
      const qa = [a.x2, a.y2];
      const la = Math.hypot(qa[0] - pa[0], qa[1] - pa[1]);
      if (la < 1) continue;
      const u = [(qa[0] - pa[0]) / la, (qa[1] - pa[1]) / la];
      for (const b of e.linii) {
        if (b === a) continue;
        const pb = [b.x1, b.y1];
        const qb = [b.x2, b.y2];
        const lb = Math.hypot(qb[0] - pb[0], qb[1] - pb[1]);
        if (lb < 1) continue;
        const w = [(qb[0] - pb[0]) / lb, (qb[1] - pb[1]) / lb];
        if (Math.abs(u[0] * w[1] - u[1] * w[0]) > Math.sin((4 * Math.PI) / 180)) continue;
        /* Расстояние между прямыми и перекрытие проекций. */
        const dpr = Math.abs((pb[0] - pa[0]) * u[1] - (pb[1] - pa[1]) * u[0]);
        const t1 = (pb[0] - pa[0]) * u[0] + (pb[1] - pa[1]) * u[1];
        const t2 = (qb[0] - pa[0]) * u[0] + (qb[1] - pa[1]) * u[1];
        const perekr = Math.min(la, Math.max(t1, t2)) - Math.max(0, Math.min(t1, t2));
        fakt(
          'пунктир не идёт вдоль другой линии ближе 6 px',
          !(dpr < PUNKTIR_BLIZHE && perekr > 3),
          `${id}: ${a.id} вдоль ${b.id} (${dpr.toFixed(1)} px, ${perekr.toFixed(0)} px)`,
        );
      }
    }

    /* Заливки. */
    const mn = e.mnog.map((m) => ({ m, pts: tochkiMnog(m) }));
    for (let a = 0; a < mn.length; a += 1) {
      for (let b = a + 1; b < mn.length; b += 1) {
        const sa = Math.abs(ploshchad(mn[a].pts));
        const sb = Math.abs(ploshchad(mn[b].pts));
        const ob = Math.abs(ploshchad(otsech(mn[a].pts, mn[b].pts)));
        /* Нижняя заливка целиком под верхней — её не видно. */
        fakt(
          'заливка не спрятана под другой',
          !(ob > 2 && ob > 0.97 * sa && sb > sa + 2),
          `${id}: ${mn[a].m.id} под ${mn[b].m.id}`,
        );
      }
    }
    const isk = e.mnog.filter((m) => m.rol === 'region-sought');
    for (const m of isk)
      fakt('искомая площадь — со сплошным контуром', m.kontur !== '', `${id}: ${m.id}`);
    if (i < 3) {
      const svg = svgSkhemy(sk, tt, vid, sost, {
        W,
        H,
        opisanie: '',
        samodostatochnyy: true,
        tema: 'cvet',
      });
      const svgP = svgSkhemy(sk, tt, vid, sost, {
        W,
        H,
        opisanie: '',
        samodostatochnyy: true,
        tema: 'pechat',
      });
      fakt('нет пунктирного контура внутри фигуры', !svg.includes('skh-iskomaya'), id);
      for (const [tema, kod] of [
        ['цвет', svg],
        ['ч/б', svgP],
      ])
        dlyaBrauzera.push({
          id: `${id}, ${tema}`,
          svg: kod,
          ramki: podpisi.map((q) => ({ imya: q.imya, r: q.r })),
        });
      fakt(
        'у основной фигуры есть заливка',
        e.mnog.length > 0 || e.okr.some((o) => o.zalivka === true),
        id,
      );
      if (isk.length > 0)
        fakt(
          'ч/б: искомая площадь заштрихована под 45°',
          /<pattern[^>]*patternTransform="rotate\(45\)"/.test(svgP) &&
            svgP.includes('skh-shtrihovka'),
          id,
        );
    }

    /* Пропорции: по исходному положению (без поворота) достаточно. */
    if (i < 3) {
      const gruppy = new Map();
      for (const el of kadr.elementy) {
        if (el.vid !== 'velichina' || !el.yakor || !('otrezok' in el.yakor)) continue;
        const ch = chisloPodpisi(el.tekst);
        if (ch === null) continue;
        const [a, b] = el.yakor.otrezok;
        /* Только подпись целого отрезка чертежа: у части отрезка (AO на
           диагонали AC) число относится не к ней. */
        const sovp = (x, y) => Math.hypot(x[0] - y[0], x[1] - y[1]) < 1e-6;
        const celyy = kadr.elementy.some(
          (o) =>
            o.vid === 'otrezok' &&
            ((sovp(o.a, a) && sovp(o.b, b)) || (sovp(o.a, b) && sovp(o.b, a))),
        );
        if (!celyy) continue;
        const dl = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!(dl > 0)) continue;
        gruppy.set(ch.edinica, [...(gruppy.get(ch.edinica) ?? []), { ...ch, dl, tekst: el.tekst }]);
      }
      for (const g of gruppy.values()) {
        for (let a = 0; a < g.length; a += 1) {
          for (let b = a + 1; b < g.length; b += 1) {
            const k = g[a].dl / g[b].dl / (g[a].znachenie / g[b].znachenie);
            fakt(
              'пропорции: отрезки соотносятся как числа (± 25 %)',
              k < DOPUSK_PROPORCIY && k > 1 / DOPUSK_PROPORCIY,
              `${id}: «${g[a].tekst}» : «${g[b].tekst}» на чертеже ${(g[a].dl / g[b].dl).toFixed(2)}`,
            );
          }
        }
      }
    }
  }
}

/* ── Браузер: ширина подписей по настоящему шрифту ─────────────── */

if (BRAUZER) {
  const { chromium } = await import('playwright');
  const css = path.resolve('node_modules/katex/dist/katex.min.css');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chertezhi-18-'));
  const fail = path.join(tmp, 'chertezhi.html');
  fs.writeFileSync(
    fail,
    `<!doctype html><meta charset=utf-8><link rel=stylesheet href="file://${css}">
<span class="katex" style="position:absolute;opacity:0">x</span>
${dlyaBrauzera.map((c, i) => `<div data-i="${i}">${c.svg}</div>`).join('\n')}`,
  );
  const b = await chromium.launch(
    fs.existsSync('/opt/pw-browsers/chromium')
      ? { executablePath: '/opt/pw-browsers/chromium' }
      : {},
  );
  const p = await b.newPage({ viewport: { width: 400, height: 300 } });
  await p.goto(`file://${fail}`);
  /* Шрифты KaTeX грузятся по первому использованию — догрузить явно. */
  await p.evaluate(async () => {
    await Promise.all(
      [
        'italic 700 19px KaTeX_Math',
        'italic 19px KaTeX_Math',
        '19px KaTeX_Main',
        '700 19px KaTeX_Main',
      ].map((f) => document.fonts.load(f)),
    );
    await document.fonts.ready;
  });
  /* Порядок текстов в svg — как в раскладке: буквы, затем величины. */
  const shiriny = await p.evaluate(() =>
    [...document.querySelectorAll('div[data-i]')].map((d) =>
      [...d.querySelectorAll('text.skh-podpis, text.skh-velichina')].map((t) => {
        const r = t.getBBox();
        return [r.x, r.x + r.width];
      }),
    ),
  );
  await b.close();
  dlyaBrauzera.forEach((c, i) => {
    const izm = shiriny[i];
    fakt('браузер: подписей столько же, сколько в раскладке', izm.length === c.ramki.length, c.id);
    c.ramki.forEach((q, k) => {
      const x = izm[k];
      if (!x) return;
      fakt(
        'браузер: подпись в ширине раскладки (± 1 px)',
        x[0] >= q.r[0] - 1 && x[1] <= q.r[2] + 1,
        `${c.id}: «${q.imya}» ${x[0].toFixed(1)}…${x[1].toFixed(1)}, раскладка ${q.r[0].toFixed(1)}…${q.r[2].toFixed(1)}`,
      );
    });
  });
}

console.log(`Чертежи №18: ${TIPY_18.length} прототипов × ${N} вариантов\n`);
for (const [imya, s] of schet) {
  console.log(`${s.ok === s.vsego ? '✓' : '✗'} ${imya}: ${s.ok}/${s.vsego}`);
  for (const p of s.primery) console.log(`    ${p}`);
}
if (plokho > 0) {
  console.log(`\nНарушений: ${plokho}`);
  process.exit(1);
}
console.log('\nВсё в порядке.');
