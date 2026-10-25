#!/usr/bin/env node
/* scripts/check-stereo-kachestvo.mjs — качество чертежей задания №3.

   Запуск: pnpm test:stereo-kachestvo

   На каждом шаблоне №3 (91 прототип: многогранники I–III — движок
   lib/chertezh3, тела вращения и комбинации IV–VIII — lib/solid) — на
   всех вариантах банка и на 50 случайных наборах параметров:

     1. Видимость. Каждый нарисованный кусок линии (ребро, отрезок
        условия и построения, сторона сечения, дуга основания, контур)
        сверяется с независимой проверкой лучом: точки внутри куска (без
        5 % у концов) выпускают луч к зрителю, и луч проверяется на вход
        внутрь тела по его собственному описанию — полупространствам
        выпуклой оболочки вершин, блокам составного тела, уравнениям
        цилиндра, конуса и шара. Кусок «видимый», а луч уходит в тело
        (или наоборот) — ошибка. Касательные лучи (контур тела вращения)
        не судятся: там тело и его гранёная модель расходятся на доли
        процента.
     2. Вид. Метрики читаемости (lib/stereo/metriki.ts): вершины не
        ближе 8 % размера фигуры, отрезки не сливаются (угол ≥ 12° или
        3 мм), вершина не ближе 2 мм к чужому отрезку, высота проекции
        основания ≥ 25 % ширины, пропорции рисунка 0,8–1,4. Годного
        вида нет — шаблон в отчёт, тест падает.
     3. Подписи. Не пересекают линии и друг друга (кадр листа №3 и
        статичный чертёж lib/solid).
     4. Оформление листа: видимые линии 1,2–1,5 pt, невидимые 0,8–1 pt
        штрихом 4/3 pt, заливка ≤ 0,15, числа не жирные, кегль ≥ 10 pt.

   В конце — отчёт: шаблоны, чей вид или пропорции изменены (ракурс не
   школьный, высота сжата или вытянута). --otchet <файл> пишет его в
   JSON (сводка для печати, scripts/build-stereo-svodka.mjs). */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';

const C = requireSrc('lib/chertezh3/index.ts');
const K = requireSrc('lib/chertezh3/kadr.ts');
const VD = requireSrc('lib/chertezh3/vid.ts');
const PR = requireSrc('lib/stereo/proekciya.ts');
const VI = requireSrc('lib/stereo/vidimost.ts');
const B = requireSrc('lib/zadanie3/chertezhi/index.ts');
const Z = requireSrc('lib/zadanie3/index.ts');
const R = requireSrc('lib/solid/render.ts');
const SV = requireSrc('lib/solid/vid.ts');
const FR = requireSrc('lib/sheet/figureRules.js');

const SLUCHAYNYH = Number(process.env.STEREO_SLUCHAYNYH ?? 50);
const argOtchet = process.argv.indexOf('--otchet');
const fileOtchet = argOtchet > 0 ? process.argv[argOtchet + 1] : null;

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};

/* ── Случайные параметры шаблона ─────────────────────────────────
   Числа варианта банка, умноженные на случайный множитель 0,5–1,8
   (целые остаются целыми, дробные — с одним знаком); строки и пары
   вершин — как в варианте. Годный набор проходит dopustimo и (у
   многогранников) валидатор сценария. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function sluchaynyeParametry(proto, n, rnd) {
  const out = [];
  for (let tries = 0; out.length < n && tries < n * 20; tries += 1) {
    const base = proto.varianty[Math.floor(rnd() * proto.varianty.length)].params;
    const p = {};
    for (const [k, v] of Object.entries(base)) {
      if (typeof v !== 'number') {
        p[k] = v;
        continue;
      }
      const f = 0.5 + rnd() * 1.3;
      if (Number.isInteger(v)) {
        /* Маленькое целое (номер вершины, выбор варианта) — как есть. */
        p[k] = Math.abs(v) <= 3 ? v : Math.max(1, Math.round(v * f));
      } else {
        p[k] = Math.max(0.1, Math.round(v * f * 10) / 10);
      }
    }
    let good = false;
    try {
      good = proto.dopustimo(p) && Number.isFinite(proto.otvet(p));
    } catch {
      good = false;
    }
    if (good) out.push(p);
  }
  return out;
}

/* ── Независимый луч: выпуклые тела полупространствами ──────────── */

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const lerp = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const len = (a) => Math.hypot(a[0], a[1], a[2]);

/** Полупространства выпуклой оболочки точек: n·x ≤ c, перебором троек. */
function obolochka(pts) {
  const out = [];
  const size = Math.max(...pts.map((p) => len(p)), 1);
  const eps = size * 1e-9;
  for (let i = 0; i < pts.length; i += 1)
    for (let j = i + 1; j < pts.length; j += 1)
      for (let k = j + 1; k < pts.length; k += 1) {
        let n = cross(sub(pts[j], pts[i]), sub(pts[k], pts[i]));
        const l = len(n);
        if (l < eps) continue;
        n = [n[0] / l, n[1] / l, n[2] / l];
        let c = dot(n, pts[i]);
        const d = pts.map((p) => dot(n, p) - c);
        if (d.every((x) => x <= eps)) {
          /* уже наружу */
        } else if (d.every((x) => x >= -eps)) {
          n = [-n[0], -n[1], -n[2]];
          c = -c;
        } else continue;
        if (!out.some((h) => Math.abs(dot(h.n, n) - 1) < 1e-9 && Math.abs(h.c - c) < eps * 10))
          out.push({ n, c });
      }
  return out;
}

/**
 * Насколько глубоко луч x + s·k (s > 0) заходит внутрь выпуклого тела
 * (наибольший по s запас min(c − n·x) по полупространствам). > 0 —
 * луч входит в тело.
 */
function glubinaLuchaPoluprostranstva(x, k, hs) {
  /* Запас — вогнутая кусочно-линейная функция s: максимум ищем по
     точкам излома и концам. */
  const cand = [1e-9];
  for (const h of hs) {
    const nk = dot(h.n, k);
    if (Math.abs(nk) > 1e-12) cand.push((h.c - dot(h.n, x)) / nk);
  }
  for (const a of hs)
    for (const b of hs) {
      const da = dot(a.n, k) - dot(b.n, k);
      if (Math.abs(da) > 1e-12) cand.push((a.c - dot(a.n, x) - (b.c - dot(b.n, x))) / da);
    }
  let best = -Infinity;
  for (const s of cand) {
    if (!(s > 0)) continue;
    const p = [x[0] + s * k[0], x[1] + s * k[1], x[2] + s * k[2]];
    const m = Math.min(...hs.map((h) => h.c - dot(h.n, p)));
    if (m > best) best = m;
  }
  return best;
}

/* ── Тела вращения: запас «внутри» аналитически, луч — шагами ───── */

function zapasTela(body, p) {
  switch (body.kind) {
    case 'cylinder': {
      const rho = Math.hypot(p[0] - body.base[0], p[1] - body.base[1]);
      return Math.min(body.r - rho, p[2] - body.base[2], body.base[2] + body.h - p[2]);
    }
    case 'cone': {
      const rho = Math.hypot(p[0] - body.base[0], p[1] - body.base[1]);
      if (body.inverted) {
        const z0 = body.base[2] - body.h;
        const t = (p[2] - z0) / body.h;
        return Math.min(body.r * t - rho, p[2] - z0, body.base[2] - p[2]) / 1.5;
      }
      const top = body.top ?? 0;
      const t = (p[2] - body.base[2]) / body.h;
      return (
        Math.min(
          body.r - (body.r - top) * t - rho,
          p[2] - body.base[2],
          body.base[2] + body.h - p[2],
        ) / 1.5
      );
    }
    case 'sphere':
      return body.r - len(sub(p, body.center));
    default:
      return -Infinity;
  }
}

function glubinaLuchaTela(body, x, k, size) {
  if (body.kind === 'polyhedron') {
    body.__hs ??= obolochka(body.vertices);
    return glubinaLuchaPoluprostranstva(x, k, body.__hs);
  }
  let best = -Infinity;
  const N = 600;
  for (let i = 1; i <= N; i += 1) {
    const s = (4 * size * i) / N;
    const m = zapasTela(body, [x[0] + s * k[0], x[1] + s * k[1], x[2] + s * k[2]]);
    if (m > best) best = m;
  }
  return best;
}

/** Сравнить кусок с лучом: 'ok' | 'spor' (касание) | текст ошибки. */
function sudKuska(pts, vidno, glubina, size) {
  const STROGO = size * 4e-3;
  const MIMO = size * 4e-4;
  let spor = 0;
  /* Длина ломаной — точки по длине, без 5 % у концов. */
  const dl = [];
  let L = 0;
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const d = len(sub(pts[i + 1], pts[i]));
    dl.push(d);
    L += d;
  }
  if (L < size * 1e-3) return 'ok';
  const M = 9;
  for (let j = 0; j < M; j += 1) {
    const u = (0.05 + (0.9 * j) / (M - 1)) * L;
    let acc = 0;
    let i = 0;
    while (i < dl.length - 1 && acc + dl[i] < u) acc += dl[i++];
    const x = lerp(pts[i], pts[i + 1], dl[i] === 0 ? 0 : (u - acc) / dl[i]);
    const g = glubina(x);
    if (g > STROGO && vidno)
      return `видимый кусок закрыт телом (луч входит на ${((g / size) * 100).toFixed(2)} %)`;
    /* Точка на лицевой поверхности: запас по лучу сразу уходит в минус;
       у контура (скользящий луч) он около нуля в обе стороны — спор. */
    if (g < -MIMO && !vidno) return 'невидимый кусок ничем не закрыт';
    if (g >= -MIMO && g <= STROGO) spor += 1;
  }
  return spor > 0 ? 'spor' : 'ok';
}

/* ── Многогранники: куски движка и проверка ─────────────────────── */

function proveritVidimost3(scena, rakurs, sz, where) {
  const { kam } = K.vidKadra(rakurs, sz);
  const k = PR.bazis(PR.napravlenie(rakurs)).k;
  const S = (p) => [p[0], p[1], p[2] * sz];
  const eps = scena.geom.razmer * 1e-7;
  /* Тело в сжатой сцене — независимо от граней движка. */
  const tela = scena.geom.vypukloe
    ? [obolochka(scena.geom.vershiny.map(S))]
    : scena.geom.bloki.map((b) =>
        obolochka(
          [0, 1].flatMap((i) =>
            [0, 1].flatMap((j) =>
              [0, 1].map((l) => S([b.p[0] + i * b.d[0], b.p[1] + j * b.d[1], b.p[2] + l * b.d[2]])),
            ),
          ),
        ),
      );
  const size = scena.geom.razmer;
  const glubina = (x) => Math.max(...tela.map((hs) => glubinaLuchaPoluprostranstva(x, k, hs)));
  const kuski = [];
  for (const l of scena.telo.linii(kam))
    kuski.push({ a: l.a, b: l.b, vidno: l.vidno, chto: `ребро ${l.id}` });
  for (const e of scena.elementy) {
    const pts = e.pts;
    const pary =
      pts.length === 2
        ? [[pts[0], pts[1]]]
        : pts.length > 3 || C.MNOGOUGOLNIKI.includes(e.el.vid)
          ? pts.map((p, i) => [p, pts[(i + 1) % pts.length]])
          : [];
    for (const [a, c] of pary)
      for (const q of VI.kuskiOtrezka(a, c, scena.telo.chasti, kam, eps))
        kuski.push({
          a: lerp(a, c, q.t0),
          b: lerp(a, c, q.t1),
          vidno: q.vidno,
          chto: `${e.el.id}`,
        });
  }
  let n = 0;
  for (const q of kuski) {
    const sud = sudKuska([S(q.a), S(q.b)], q.vidno, glubina, size);
    n += 1;
    ok(sud === 'ok' || sud === 'spor', `${where}: ${q.chto} — ${sud}`);
  }
  return n;
}

/* ── Подписи ───────────────────────────────────────────────────── */

function segInBox(a, b, r) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const clip = (p, q) => {
    if (p === 0) return q >= 0;
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  return clip(-dx, a[0] - r.x0) &&
    clip(dx, r.x1 - a[0]) &&
    clip(-dy, a[1] - r.y0) &&
    clip(dy, r.y1 - a[1])
    ? Math.max(0, t1 - t0) * Math.hypot(dx, dy)
    : 0;
}

/** Подписи: пересечения с линиями (длина линии внутри рамки) и друг с другом. */
function proveritPodpisi(boxes, linii, where, dopusk) {
  boxes.forEach((r, i) => {
    /* Рамка подписи по глифам: чуть меньше оценки размера. */
    const sh = { x0: r.x0 + r.dx, y0: r.y0 + r.dy, x1: r.x1 - r.dx, y1: r.y1 - r.dy };
    const pod = linii.reduce((s, [a, b]) => s + segInBox(a, b, sh), 0);
    ok(pod <= dopusk, `${where}: подпись «${r.t}» лежит на линии (${pod.toFixed(1)} ед.)`);
    for (let j = i + 1; j < boxes.length; j += 1) {
      const o = boxes[j];
      const w = Math.min(sh.x1, o.x1 - o.dx) - Math.max(sh.x0, o.x0 + o.dx);
      const h = Math.min(sh.y1, o.y1 - o.dy) - Math.max(sh.y0, o.y0 + o.dy);
      ok(!(w > 0 && h > 0), `${where}: подписи «${r.t}» и «${o.t}» налезают`);
    }
  });
}

/* ── Оформление листа ───────────────────────────────────────────── */

function proveritOformlenie(ishodnyy, mm, where) {
  /* Как на листе: толщины пересчитаны под ширину рисунка (data-line-pt). */
  const svg = FR.strokeFloor(ishodnyy, mm);
  ok(svg !== ishodnyy || /data-line-pt/.test(ishodnyy), `${where}: у рисунка нет data-line-pt`);
  const vb = /viewBox="([\d.\- ]+)"/.exec(svg)[1].split(' ').map(Number);
  const pt = (w) => (w / vb[2]) * mm * (72 / 25.4);
  const lines = [...svg.matchAll(/<(?:line|path|polyline)\b[^>]*>/g)].map((m) => m[0]);
  for (const l of lines) {
    const w = Number(/stroke-width="([\d.]+)"/.exec(l)?.[1] ?? NaN);
    if (!Number.isFinite(w) || (/fill="(?!none)/.test(l) && !/stroke=/.test(l))) continue;
    const dash = /stroke-dasharray="([\d. ]+)"/.exec(l)?.[1];
    if (/stroke="none"/.test(l)) continue;
    if (dash) {
      const [d, g] = dash.split(' ').map(Number);
      ok(pt(w) >= 0.78 && pt(w) <= 1.02, `${where}: невидимая линия ${pt(w).toFixed(2)} pt`);
      ok(
        Math.abs(pt(d) - 4) < 0.6 && Math.abs(pt(g) - 3) < 0.5,
        `${where}: штрих ${pt(d).toFixed(1)}/${pt(g).toFixed(1)} pt`,
      );
    } else if (!/marker|angle/.test(l)) {
      ok(pt(w) >= 1.18 && pt(w) <= 1.52, `${where}: видимая линия ${pt(w).toFixed(2)} pt`);
    }
  }
  for (const f of svg.matchAll(/fill-opacity="([\d.]+)"/g)) {
    const ctx = svg.slice(Math.max(0, f.index - 200), f.index);
    if (/var\(--solid-face\)|var\(--solid-liquid\)|#e8eef9|--solid/.test(ctx.slice(-120))) continue;
    ok(Number(f[1]) <= 0.15 + 1e-9, `${where}: заливка ${f[1]}`);
  }
  ok(!/font-weight="(?:6|7|bold)/.test(svg), `${where}: жирная подпись`);
  for (const m of svg.matchAll(/<text\b[^>]*font-size="([\d.]+)"/g)) {
    ok(pt(Number(m[1])) >= 9.95, `${where}: кегль ${pt(Number(m[1])).toFixed(1)} pt`);
  }
}

/* ── Прогон ─────────────────────────────────────────────────────── */

const otchet = { izmeneny: [], plohie: [], shablonov: 0, chertezhey: 0, kuskov: 0 };
const rnd = rng(20261025);
const RAZDELY = Z.RAZDELY;

for (const razdel of RAZDELY) {
  for (const proto of razdel.prototipy) {
    otchet.shablonov += 1;
    const nabory = [
      ...proto.varianty.map((v) => ({ n: v.n, params: v.params, bank: true })),
      ...sluchaynyeParametry(proto, SLUCHAYNYH, rnd).map((params, i) => ({
        n: 100 + i,
        params,
        bank: false,
      })),
    ];
    ok(
      nabory.length >= proto.varianty.length + Math.min(SLUCHAYNYH, 10),
      `${proto.id}: случайных наборов параметров ${nabory.length - proto.varianty.length}`,
    );
    const vidy = new Map();
    for (const nab of nabory) {
      const where = `${proto.id}#${nab.n}${nab.bank ? '' : ' (случайный)'}`;
      if (B.estScenariy(proto)) {
        let ch;
        try {
          ch = B.chertezhVarianta(proto, {
            n: nab.n,
            source: 'новый',
            ref: '',
            params: nab.params,
          });
        } catch (e) {
          if (nab.bank) ok(false, `${where}: сценарий не собрался (${e.message})`);
          continue;
        }
        if (ch === null || (!nab.bank && ch.oshibki.length > 0)) continue;
        otchet.chertezhey += 1;
        const m = ch.vid.metriki;
        ok(
          m.narusheniya.length === 0,
          `${where}: вид — ${m.narusheniya.map((x) => x.chto).join('; ')}`,
        );
        if (m.narusheniya.length > 0) otchet.plohie.push({ id: where, narusheniya: m.narusheniya });
        const kl = `${m.rakurs.azimut}/${m.rakurs.vysota}${m.szhatie === 1 ? '' : ` ×${m.szhatie}`}`;
        if (nab.bank) vidy.set(kl, [...(vidy.get(kl) ?? []), nab.n]);
        const scena = C.postroit(ch.scenariy);
        otchet.kuskov += proveritVidimost3(
          scena,
          ch.scenariy.rakurs,
          ch.scenariy.szhatie ?? 1,
          where,
        );
        /* Подписи кадра листа — ученика и учителя. */
        for (const rezhim of ['uchenik', 'uchitel']) {
          const edPt = C.edPtPechati(VD.SHIRINA, VD.SHIRINA_MM);
          const kegl = Math.max(VD.KEGL, Math.ceil(C.OFORMLENIE.kegl * edPt * 10) / 10);
          const kd = C.kadr(scena, { vspom: rezhim === 'uchitel', shirina: VD.SHIRINA, kegl });
          const boxes = kd.podpisi.map((p) => ({
            t: p.tex,
            x0: p.x,
            y0: p.y,
            x1: p.x + p.w,
            y1: p.y + p.h,
            dx: p.w * 0.08,
            dy: p.h * 0.15,
          }));
          proveritPodpisi(
            boxes,
            kd.linii.map((l) => [l.a, l.b]),
            `${where} ${rezhim}`,
            2.5,
          );
          if (nab.bank && nab.n === 1) {
            const svg = C.chertezhSvg(ch.scenariy, {
              rezhim,
              shirina: VD.SHIRINA,
              kegl: VD.KEGL,
              pechatMm: VD.SHIRINA_MM,
            });
            proveritOformlenie(svg, VD.SHIRINA_MM, `${where} ${rezhim}`);
          }
        }
      } else {
        let model;
        try {
          model = proto.chertezh(nab.params);
        } catch (e) {
          if (nab.bank) ok(false, `${where}: модель не собралась (${e.message})`);
          continue;
        }
        otchet.chertezhey += 1;
        const vb = SV.vybratVidSolid(model);
        const m = vb.metriki;
        ok(
          m.narusheniya.length === 0,
          `${where}: вид — ${m.narusheniya.map((x) => x.chto).join('; ')}`,
        );
        if (m.narusheniya.length > 0) otchet.plohie.push({ id: where, narusheniya: m.narusheniya });
        const kl = `${m.rakurs.azimuth}/${m.rakurs.elevation}${m.szhatie === 1 ? '' : ` ×${m.szhatie}`}`;
        if (nab.bank) vidy.set(kl, [...(vidy.get(kl) ?? []), nab.n]);
        /* Видимость: каждая линия — против тел модели по их уравнениям. */
        const mv = vb.model;
        const view = R.modelView(mv);
        const k = view.toward;
        const size = Math.max(
          ...mv.bodies.map((b) =>
            b.kind === 'polyhedron'
              ? Math.max(...b.vertices.map(len))
              : b.kind === 'sphere'
                ? b.r + len(b.center)
                : Math.max(b.r, b.h) + len(b.base),
          ),
          1,
        );
        for (const l of R.solidLinii(mv)) {
          if (l.liquid) continue;
          const zasl = mv.bodies.filter((b, i) => !b.glass || i === l.owner);
          const glubina = (x) =>
            Math.max(-Infinity, ...zasl.map((b) => glubinaLuchaTela(b, x, k, size)));
          const sud = sudKuska(l.p3, l.visible, glubina, size);
          otchet.kuskov += 1;
          ok(
            sud === 'ok' || sud === 'spor',
            `${where}: ${l.role}${l.owner === undefined ? '' : ` тела ${l.owner}`} — ${sud} [${l.p3[0].map((x) => x.toFixed(2))}]`,
          );
        }
        const d = R.solidDiagnostics(mv);
        const boxes = d.labels.map((p) => ({
          t: p.text,
          x0: p.x,
          y0: p.y,
          x1: p.x + p.w,
          y1: p.y + p.h,
          dx: p.w * 0.08,
          dy: p.h * 0.15,
        }));
        proveritPodpisi(
          boxes,
          d.strokes.flatMap((s) => s.points.slice(1).map((q, i) => [s.points[i], q])),
          where,
          2.5,
        );
        if (nab.bank && nab.n === 1) {
          proveritOformlenie(R.renderSolid(mv), SV.SHIRINA_MM, where);
        }
      }
    }
    const shkolnyy = B.estScenariy(proto) ? '24/24' : '28/25';
    const izm = [...vidy.entries()].filter(([kl]) => kl !== shkolnyy);
    if (izm.length > 0) {
      otchet.izmeneny.push({
        id: proto.id,
        nazvanie: proto.nazvanie,
        vidy: izm.map(([kl, ns]) => ({ vid: kl, varianty: ns })),
      });
    }
  }
}

console.log(
  `Шаблонов ${otchet.shablonov}, чертежей ${otchet.chertezhey}, кусков линий ${otchet.kuskov}, проверок ${checks}.`,
);
console.log(`Вид или пропорции изменены у ${otchet.izmeneny.length} шаблонов (варианты банка):`);
for (const x of otchet.izmeneny) {
  console.log(
    `  ${x.id} ${x.nazvanie}: ${x.vidy.map((v) => `${v.vid} (${v.varianty.join(', ')})`).join('; ')}`,
  );
}
if (fileOtchet) fs.writeFileSync(fileOtchet, JSON.stringify(otchet, null, 1));
if (problems.length > 0) {
  console.log(`\nПроблем: ${problems.length}`);
  for (const p of problems.slice(0, 80)) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('Чертежи №3: видимость, вид, подписи и оформление — в порядке.');
