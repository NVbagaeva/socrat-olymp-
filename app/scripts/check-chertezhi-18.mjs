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
   Чертёж учителя (Sostoyanie.uchitel, с построениями решения) — те же
   проверки подписей и линий на трёх наборах чисел листа.

   Читаемость (чертёж условия на листе, 62 мм; пороги —
   lib/skhemy/vidimye.ts, POROGI_CHERTEZHA; мерки —
   scripts/lib/mery-chertezha.mjs) — у задач тренажёра, у опорных задач,
   ключевых схем и теории:
     • наименьший радиус — не меньше 9 % размера чертежа, радиусы — не
       больше 2,5 : 1;
     • подписанный отрезок — не короче 8 мм на листе, подписанные
       отрезки — не больше 3 : 1;
     • угол между линиями — не уже 14°; подписанные точки — не ближе
       3,5 мм; фигура — не уже 30 % кадра ни по ширине, ни по
       высоте (чертежи листа — примерно одного размера).
   Смысл (чертёж строится по видимым параметрам — trenazher/vidimye.ts —
   и сверяется с чертежом в точной пропорции):
     • касание остаётся касанием, взаимное положение окружностей и какая
       больше — те же;
     • точки на окружностях, порядок точек на отрезках, перпендикулярные
       и параллельные отрезки, тип углов треугольников, равные стороны,
       выпуклость — те же;
     • больший подписанный отрезок длиннее, равные — равны (± 3 %).
   Чертёж условия и текст (trenazher/uslovie.ts): подписанные точки
   чертежа условия — только те, что названы в задаче (кроме условий ФИПИ
   без букв — TEKST_FIPI_BEZ_BUKV_18). */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requireSrc } from './lib/load-ts.mjs';
import { meryChertezha } from './lib/mery-chertezha.mjs';
import { meryPlanSvg } from './lib/mery-svg-plan.mjs';

const BRAUZER = process.argv.includes('--brauzer');
/** Чертежи листа для проверки в браузере: svg и прямоугольники модели. */
const dlyaBrauzera = [];

const N = 20;
const ZAZOR_PODPISEY = 2;
const ZAZOR_LINIY = 1;
const PUNKTIR_BLIZHE = 6;

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
const { scena18, scena18Tochno } = requireSrc('lib/zadanie18/trenazher/sceny');
const { scenaOpornoy18, scenaOpornoyTochno18 } = requireSrc('lib/zadanie18/opornye/index');
const { zhivayaSkhema18 } = requireSrc('lib/zadanie18/skhemy/index');
const { risunokTeorii18, RISUNKI_TEORII_18 } = requireSrc('lib/zadanie18/teoriya');
const { POROGI_CHERTEZHA: POR } = requireSrc('lib/skhemy/vidimye');
const { TEKST_FIPI_BEZ_BUKV_18 } = requireSrc('lib/zadanie18/trenazher/uslovie');
const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye/index');
const SCENY_OPORNYH = OPORNYE_18.filter((o) => scenaOpornoy18(o.id) !== undefined);
const SKHEMY_18 = [
  'vysoty',
  'bissektrisa',
  'udvoenie-mediany',
  'dve-sekushchie',
  'ravnye-ugly',
  'pryamye-ugly',
  'trezubec',
  'ugly-i-dugi',
  'chetyrekhugolniki',
  'sredlin-treug',
  'sredlin-trap',
  'kasatelnaya-sekushchaya',
  'otrezki-kasatelnyh',
  'kasayushchiesya',
  'obshchaya-kasatelnaya',
  'babochka',
  'chetyre-tochki',
  'ravnobokaya',
  'menelay-cheva',
  'metod-ploshchadey',
  'obshchaya-vysota',
  'obshchiy-ugol',
  'relsy-evklida',
  'stepen-tochki',
];
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

/* ── Читаемость: мерки и пороги (lib/skhemy/vidimye.ts) ────────── */

const VID0 = { ugol: 0, otrazhenie: 1 };
const procent = (x) => `${(x * 100).toFixed(1)} %`;

/**
 * Углы, острее которых чертёж не сделать: их задаёт сама задача.
 * Остальные — не уже POR.ugol.
 */
const UGOL_IZ_ZADACHI = {
  /* ∠C = 150° дан: углы A и B вместе — 30°, каждый — около 15°. */
  kvadraty: 13,
};

function chitaemost(id, kadr, e, vidim, tip = '') {
  const m = meryChertezha(kadr, vidim, e, 360, POR.shirinaMm);
  if (m.minR !== null)
    fakt(
      `читаемость: наименьший радиус — не меньше ${procent(POR.radiusDolya)} размера чертежа`,
      m.minR.dolya >= POR.radiusDolya,
      `${id}: ${m.minR.id} — ${procent(m.minR.dolya)}`,
    );
  fakt(
    `читаемость: радиусы — не больше ${POR.otnoshenieRadiusov} : 1`,
    m.otnR <= POR.otnoshenieRadiusov + 0.01,
    `${id}: ${m.otnR.toFixed(2)} : 1`,
  );
  if (m.minOtr !== null)
    fakt(
      `читаемость: подписанный отрезок — не короче ${POR.otrezokMm} мм на листе`,
      m.minOtr.mm >= POR.otrezokMm,
      `${id}: «${m.minOtr.tekst}» — ${m.minOtr.mm.toFixed(1)} мм`,
    );
  fakt(
    `читаемость: подписанные отрезки — не больше ${POR.otnoshenieOtrezkov} : 1`,
    m.otnOtr <= POR.otnoshenieOtrezkov + 0.01,
    `${id}: ${m.otnOtr.toFixed(2)} : 1`,
  );
  if (m.minUgol !== null)
    fakt(
      `читаемость: угол между линиями — не уже ${POR.ugol}° (кроме заданных задачей)`,
      m.minUgol.ugol >= (UGOL_IZ_ZADACHI[tip] ?? POR.ugol),
      `${id}: ${m.minUgol.gde} — ${m.minUgol.ugol.toFixed(1)}°`,
    );
  if (m.minTochki !== null)
    fakt(
      `читаемость: подписанные точки — не ближе ${POR.tochkiMm} мм`,
      m.minTochki.mm >= POR.tochkiMm,
      `${id}: ${m.minTochki.gde} — ${m.minTochki.mm.toFixed(1)} мм`,
    );
  /* Чертежи листа — примерно одного размера: фигура не теряется в кадре. */
  const pole = 360 < 420 ? SK.poleUzkoe : SK.pole;
  fakt(
    'размер: фигура — не уже 30 % кадра ни по ширине, ни по высоте',
    m.zapolnenie >= 0.3,
    `${id}: ${procent(m.zapolnenie)}`,
  );
  void pole;
}

/* ── Сохранность смысла: точный чертёж ↔ видимый ──────────────── */

const dl = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function masshtab(kadr) {
  const xs = [];
  const ys = [];
  for (const el of kadr.elementy) {
    const pts =
      el.vid === 'otrezok'
        ? [el.a, el.b]
        : el.vid === 'tochka'
          ? [el.p]
          : el.vid === 'okruzhnost'
            ? [el.c]
            : [];
    for (const p of pts) (xs.push(p[0]), ys.push(p[1]));
  }
  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) || 1;
}

/** Качественное описание кадра: что должно совпасть у точного и видимого чертежа. */
function opisanie(kadr) {
  const L = masshtab(kadr);
  const eps = 1e-6 * L;
  const okr = kadr.elementy.filter((el) => el.vid === 'okruzhnost');
  const otr = kadr.elementy.filter((el) => el.vid === 'otrezok' && dl(el.a, el.b) > eps);
  const tochki = kadr.elementy.filter((el) => el.vid === 'tochka' && el.imya);
  const o = {
    okr: new Map(),
    naOkr: new Map(),
    poryadok: new Map(),
    ugly: new Map(),
    fig: new Map(),
  };
  /* Окружности попарно: касание, пересечение, одна в другой. */
  for (let i = 0; i < okr.length; i += 1)
    for (let j = i + 1; j < okr.length; j += 1) {
      const [a, b] = [okr[i], okr[j]];
      const d = dl(a.c, b.c);
      const vn = a.r + b.r;
      const vt = Math.abs(a.r - b.r);
      const k =
        Math.abs(d - vn) < eps
          ? 'касаются внешним образом'
          : d < eps && vt < eps
            ? 'совпадают'
            : Math.abs(d - vt) < eps
              ? 'касаются внутренним образом'
              : d > vn
                ? 'не пересекаются'
                : d < vt
                  ? 'одна внутри другой'
                  : 'пересекаются';
      o.okr.set(
        `${a.id}/${b.id}`,
        k + (vt < eps ? '' : a.r > b.r ? ', первая больше' : ', вторая больше'),
      );
    }
  /* Точки на окружностях. */
  for (const c of okr)
    o.naOkr.set(
      c.id,
      tochki
        .filter((t) => Math.abs(dl(t.p, c.c) - c.r) < eps)
        .map((t) => t.imya)
        .sort()
        .join(' '),
    );
  /* Порядок точек на отрезках (внутри) и концы. */
  for (const s of otr) {
    const l = dl(s.a, s.b);
    const na = tochki
      .map((t) => {
        const u =
          ((t.p[0] - s.a[0]) * (s.b[0] - s.a[0]) + (t.p[1] - s.a[1]) * (s.b[1] - s.a[1])) / (l * l);
        const q = [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u];
        return { imya: t.imya, u, d: dl(t.p, q) };
      })
      .filter((x) => x.d < eps && x.u > -1e-6 && x.u < 1 + 1e-6)
      .sort((x, y) => x.u - y.u)
      .map((x) => x.imya);
    o.poryadok.set(s.id, na.join('-'));
  }
  /* Перпендикулярность и параллельность отрезков. */
  for (let i = 0; i < otr.length; i += 1)
    for (let j = i + 1; j < otr.length; j += 1) {
      const u = [otr[i].b[0] - otr[i].a[0], otr[i].b[1] - otr[i].a[1]];
      const w = [otr[j].b[0] - otr[j].a[0], otr[j].b[1] - otr[j].a[1]];
      const n = Math.hypot(...u) * Math.hypot(...w);
      const c = (u[0] * w[0] + u[1] * w[1]) / n;
      const sn = (u[0] * w[1] - u[1] * w[0]) / n;
      const k = Math.abs(c) < 1e-6 ? '⊥' : Math.abs(sn) < 1e-6 ? '∥' : '';
      if (k) o.ugly.set(`${otr[i].id}/${otr[j].id}`, k);
    }
  /* Фигуры: тип углов треугольника, равные стороны, выпуклость. */
  for (const m of kadr.elementy.filter((el) => el.vid === 'mnogougolnik')) {
    const t = m.tochki;
    const n = t.length;
    const ugly = [];
    const storony = [];
    let znak = 0;
    let vypuklyy = true;
    for (let k = 0; k < n; k += 1) {
      const a = t[(k + n - 1) % n];
      const v = t[k];
      const b = t[(k + 1) % n];
      const u = [a[0] - v[0], a[1] - v[1]];
      const w = [b[0] - v[0], b[1] - v[1]];
      const c = (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w));
      ugly.push(Math.abs(c) < 1e-6 ? 'прямой' : c > 0 ? 'острый' : 'тупой');
      const cr = u[0] * w[1] - u[1] * w[0];
      if (Math.abs(cr) > eps * L) {
        const z = Math.sign(cr);
        if (znak !== 0 && z !== znak) vypuklyy = false;
        znak = z;
      }
      storony.push(dl(v, b));
    }
    const ravnye = [];
    for (let a = 0; a < n; a += 1)
      for (let b = a + 1; b < n; b += 1)
        if (Math.abs(storony[a] - storony[b]) < eps) ravnye.push(`${a}=${b}`);
    o.fig.set(
      m.id,
      `${n === 3 ? ugly.join(',') : vypuklyy ? 'выпуклый' : 'невыпуклый'}; ${ravnye.join(' ')}`,
    );
  }
  return o;
}

function sohrannost(id, kadrTochno, kadrVid) {
  const a = opisanie(kadrTochno);
  const b = opisanie(kadrVid);
  const sverit = (imya, ma, mb) => {
    for (const [k, v] of ma)
      fakt(imya, mb.get(k) === v, `${id}: ${k} — было «${v}», на чертеже «${mb.get(k) ?? '—'}»`);
    for (const [k, v] of mb) if (!ma.has(k)) fakt(imya, false, `${id}: ${k} — лишнее «${v}»`);
  };
  sverit('смысл: касания и взаимное положение окружностей — как в задаче', a.okr, b.okr);
  sverit('смысл: точки на окружностях — как в задаче', a.naOkr, b.naOkr);
  sverit('смысл: порядок точек на отрезках — как в задаче', a.poryadok, b.poryadok);
  sverit('смысл: перпендикулярные и параллельные — как в задаче', a.ugly, b.ugly);
  sverit('смысл: тип фигур и равные стороны — как в задаче', a.fig, b.fig);
  /* Подписанные отрезки: больший — длиннее, равные — равны (± 3 %). */
  /* Все данные условия на чертеже: у видимого — те же подписи (тексты). */
  const teksty = (k) =>
    k.elementy
      .filter((el) => el.vid === 'velichina')
      .map((el) => `${el.id}=${el.tekst}`)
      .sort()
      .join(' | ');
  fakt(
    'смысл: подписи данных — те же, что у чертежа в точной пропорции',
    teksty(kadrTochno) === teksty(kadrVid),
    `${id}: было «${teksty(kadrTochno)}», на чертеже «${teksty(kadrVid)}»`,
  );
  /* Только подпись целого отрезка чертежа: у части (AO на диагонали AC)
     число относится не к ней. */
  const sovp = (x, y) => dl(x, y) < 1e-9;
  const celyy = (a, b) =>
    kadrVid.elementy.some(
      (o) =>
        o.vid === 'otrezok' && ((sovp(o.a, a) && sovp(o.b, b)) || (sovp(o.a, b) && sovp(o.b, a))),
    );
  const podp = kadrVid.elementy
    .filter((el) => el.vid === 'velichina' && 'otrezok' in el.yakor && celyy(...el.yakor.otrezok))
    .map((el) => ({
      el,
      ch: chisloPodpisi(el.tekst),
      l: dl(el.yakor.otrezok[0], el.yakor.otrezok[1]),
    }))
    .filter((x) => x.ch !== null);
  for (let i = 0; i < podp.length; i += 1)
    for (let j = i + 1; j < podp.length; j += 1) {
      const [x, y] = [podp[i], podp[j]];
      if (x.ch.edinica !== y.ch.edinica) continue;
      const ok =
        x.ch.znachenie === y.ch.znachenie
          ? Math.abs(x.l / y.l - 1) < 0.03
          : x.ch.znachenie > y.ch.znachenie === x.l > y.l;
      fakt(
        'смысл: больший подписанный отрезок длиннее, равные — равны',
        ok,
        `${id}: «${x.el.tekst}» и «${y.el.tekst}» на чертеже ${(x.l / y.l).toFixed(2)} : 1`,
      );
    }
}

/* ── Чертёж условия и текст: на чертеже — только буквы из задачи ──── */

function bukvyTeksta(t) {
  const math = [...`${t.uslovie} ${t.a} ${t.b}`.matchAll(/\$([^$]*)\$/g)]
    .map((m) => m[1])
    .join(' ')
    .replace(/\\(?:operatorname|text|mathrm)\{[^}]*\}/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ');
  return (imya) => {
    const [b, ind] = imya.split('_');
    const re = ind === undefined ? new RegExp(`${b}(?!_)`) : new RegExp(`${b}_\\{?${ind}\\}?`);
    return re.test(math);
  };
}

function bukvyIzUsloviya(id, tekst, kadr, sost) {
  const est = bukvyTeksta(tekst);
  for (const el of kadr.elementy) {
    if (el.vid !== 'tochka' || !el.imya || !ekranLib.vidimEl(el, sost)) continue;
    fakt('чертёж условия: подписанные точки — из текста задачи', est(el.imya), `${id}: ${el.imya}`);
  }
}

/* ── Чертежи ───────────────────────────────────────────────────── */

const rnd = zerno(1818);
const SOST_USLOVIE = { lit: new Set(), shag: null, podpisi: true };
const SOST_UCHITEL = { ...SOST_USLOVIE, uchitel: true };

for (const tip of TIPY_18) {
  /* Чертёж условия — все 20 вариантов; чертёж учителя (с построениями) —
     три набора чисел как на листе. */
  for (let j = 0; j < N + 3; j += 1) {
    const uchitel = j >= N;
    const i = uchitel ? j - N : j;
    const sost = uchitel ? SOST_UCHITEL : SOST_USLOVIE;
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
    const id = `${tip.id} #${(i % tip.varianty.length) + 1}${uchitel ? ' (учитель)' : ''}${i < 3 ? '' : ` (${i}: ${Math.round(vid.ugol)}°${vid.otrazhenie < 0 ? ' отр.' : ''} ${W}×${H})`}`;
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
        /* Снизу — запас на спуск шрифта величины (индексы, выносные): 4 px. */
        r[0] >= 0 && r[1] >= 0 && r[2] <= W && r[3] + (q.vel === null ? 0 : 4) <= H,
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
          ramki: podpisi.map((q) => ({
            imya: q.imya,
            r: q.r,
            kuski:
              q.vel === null
                ? ''
                : q.vel.chasti
                    .map((ch) => `${ch.t}:${(q.vel.levo + ch.dx).toFixed(1)}+${ch.w.toFixed(1)}`)
                    .join(' '),
          })),
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

    /* Читаемость и смысл — по листу (без поворота): чертёж условия. */
    if (i < 3 && !uchitel) {
      chitaemost(id, kadr, e, (el) => ekranLib.vidimEl(el, sost), tip.id);
      const tochnaya = scena18Tochno(tip.id, p);
      sohrannost(id, tochnaya.postroit(tochnaya.nachalo), kadr);
      if (!TEKST_FIPI_BEZ_BUKV_18.includes(tip.id)) bukvyIzUsloviya(id, tip.tekst(p), kadr, sost);
    }
  }
}

/* ── Опорные задачи, схемы и теория: читаемость начального чертежа ── */

for (const s of SCENY_OPORNYH) {
  const sk = scenaOpornoy18(s.id);
  const kadr = sk.postroit(sk.nachalo);
  const sost = SOST_USLOVIE;
  const e = raskladka(kadr, VID0, ramkaKadra(kadr, VID0, sost), 360, 250, sost);
  chitaemost(
    `опорная ${s.id}`,
    kadr,
    e,
    (el) => ekranLib.vidimEl(el, sost),
    s.id === 'kvadraty-na-storonah' ? 'kvadraty' : '',
  );
  const t = scenaOpornoyTochno18(s.id);
  sohrannost(`опорная ${s.id}`, t.postroit(t.nachalo), kadr);
}
for (const [kto, sk] of [
  ...SKHEMY_18.map((id) => [`схема ${id}`, zhivayaSkhema18(id)]),
  ...RISUNKI_TEORII_18.map((id) => [`теория ${id}`, risunokTeorii18(id)]),
]) {
  const kadr = sk.postroit(sk.nachalo);
  const e = raskladka(kadr, VID0, ramkaKadra(kadr, VID0, SOST_USLOVIE), 360, 250, SOST_USLOVIE);
  chitaemost(kto, kadr, e, (el) => ekranLib.vidimEl(el, SOST_USLOVIE));
}

/* ── Варианты повышенной сложности, часть 2: чертежи условий №18 ─── */

{
  const { zadacha2 } = requireSrc('lib/povyshennye/chast2/index');
  const zapisi = new Map();
  for (let k = 1; k <= 99; k += 1) {
    const f = path.resolve(`src/lib/povyshennye/dannye/v${String(k).padStart(2, '0')}.ts`);
    if (!fs.existsSync(f)) break;
    const v = requireSrc(`lib/povyshennye/dannye/v${String(k).padStart(2, '0')}`).VARIANT;
    for (const versiya of v.chast2 ?? [])
      for (const z of versiya) if (/^[a-z]+18\./.test(z.s)) zapisi.set(JSON.stringify(z), z);
  }
  for (const z of zapisi.values()) {
    const zad = zadacha2(z);
    if (zad.risunok === null) continue;
    const id = `повышенные ${z.s} ${JSON.stringify(z.p)}`;
    /* Чертёж листа — 60 мм (lib/variant/sheets.ts, card2). */
    const m = meryPlanSvg(zad.risunok, 60);
    /* Вневписанная окружность у тупоугольного треугольника (ae18) в разы
       больше вписанной: тип треугольника важнее пропорции (ae18.ts). */
    const vnevp = z.s === 'ae18.vnevpisannaya';
    if (m.minR !== null)
      fakt(
        `часть 2: наименьший радиус — не меньше ${procent(POR.radiusDolya)} размера чертежа (кроме вневписанной у тупого угла)`,
        m.minR >= POR.radiusDolya || vnevp,
        `${id}: ${procent(m.minR)}`,
      );
    fakt(
      `часть 2: радиусы — не больше ${POR.otnoshenieRadiusov} : 1 (кроме вневписанной у тупого угла)`,
      m.otnR <= POR.otnoshenieRadiusov + 0.01 || vnevp,
      `${id}: ${m.otnR.toFixed(2)} : 1`,
    );
    if (m.minUgol !== null)
      fakt(
        `часть 2: угол между линиями — не уже ${POR.ugol}°`,
        m.minUgol >= POR.ugol,
        `${id}: ${m.minUgol.toFixed(1)}°`,
      );
    if (m.minTochki !== null)
      fakt(
        `часть 2: точки чертежа — не ближе ${POR.tochkiMm} мм`,
        m.minTochki >= POR.tochkiMm,
        `${id}: ${m.minTochki.toFixed(1)} мм`,
      );
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
        /* Куски записи (tspan): начало и ширина — для разбора расхождений. */
        const kuski = [...t.querySelectorAll('tspan')].map((ts) => {
          const q = ts.getBBox();
          return `${ts.textContent}:${q.x.toFixed(1)}+${q.width.toFixed(1)}`;
        });
        return [r.x, r.x + r.width, kuski.join(' ')];
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
        `${c.id}: «${q.imya}» ${x[0].toFixed(1)}…${x[1].toFixed(1)}, раскладка ${q.r[0].toFixed(1)}…${q.r[2].toFixed(1)}` +
          (q.kuski ? `; куски в браузере ${x[2]}, по раскладке ${q.kuski}` : ''),
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
