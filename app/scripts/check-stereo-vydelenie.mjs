#!/usr/bin/env node
/* scripts/check-stereo-vydelenie.mjs — видимость выделенных фигур №3.

   Запуск: pnpm test:stereo-vydelenie

   Выделенная фигура (сечение, треугольник, отрезок построения,
   диагональ) — не грань-заслонка: закрывать линии могут только грани
   самого тела, а у каждой её стороны видимость своя, как у рёбер. Цвет
   выделения на видимость не влияет.

   Что проверяется:
     1. Регрессия: призма ABCA₁B₁C₁ (P03-28S), треугольник ABC₁ — AC₁ и
        BC₁ невидимы (пунктир), AB видима; каждая сторона нарисована
        один раз. Раньше AC₁ шёл дважды навстречу (сторона сечения и
        отрезок построения): пунктиры со сдвигом фазы сливались в
        сплошную линию.
     2. Все чертежи с выделенными фигурами — шаблоны №3 (банк),
        опорные задачи (разборы типов) и шаблоны «Вариантов
        повышенной сложности» — при трёх ракурсах (выбранный и ±15° по
        азимуту):
        — каждый кусок стороны сверяется с независимой проверкой лучом
          (тело — выпуклая оболочка вершин и уравнения тел вращения);
        — на рисуемом ракурсе нет двух кусков выделения с одной
          видимостью, лежащих один на другом (двойной пунктир на глаз —
          сплошная линия).
     3. Отдельные случаи на кубе: диагональ задней грани — пунктир;
        пространственная диагональ — пунктир (внутри тела); сечение,
        пересекающее переднюю и заднюю грани, — стороны на передних
        гранях сплошные, на задних — пунктир.

   --spisok файл — JSON со списком чертежей (для сводного листа). */

import fs from 'node:fs';
import { requireSrc } from './lib/load-ts.mjs';
import {
  glubinaLuchaPoluprostranstva,
  glubinaLuchaTela,
  len,
  lerp,
  obolochka,
  sudKuska,
} from './lib/stereo-luch.mjs';

const R = requireSrc('lib/solid/render.ts');
const P = requireSrc('lib/solid/project.ts');
const SV = requireSrc('lib/solid/vid.ts');
const F = requireSrc('lib/solid/figures.ts');
const Z = requireSrc('lib/zadanie3/index.ts');
const B = requireSrc('lib/zadanie3/chertezhi/index.ts');
const C = requireSrc('lib/chertezh3/index.ts');
const K = requireSrc('lib/chertezh3/kadr.ts');
const PR = requireSrc('lib/stereo/proekciya.ts');
const VI = requireSrc('lib/stereo/vidimost.ts');
const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');

const argSpisok = process.argv.indexOf('--spisok');
const fileSpisok = argSpisok > 0 ? process.argv[argSpisok + 1] : null;

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};

const POVOROTY = [0, -15, 15];

/* ── lib/solid: видимость кусков выделения лучом ─────────────────── */

function razmer(model) {
  return Math.max(
    ...model.bodies.map((b) =>
      b.kind === 'polyhedron'
        ? Math.max(...b.vertices.map(len))
        : b.kind === 'sphere'
          ? b.r + len(b.center)
          : Math.max(b.r, b.h) + len(b.base),
    ),
    1,
  );
}

/** Отрезок 2D s лежит на t (с допуском d, px). */
function lezhit2(s, t, d) {
  const [a, b] = t;
  const ab = [b[0] - a[0], b[1] - a[1]];
  const l2 = ab[0] * ab[0] + ab[1] * ab[1];
  if (l2 < 1e-9) return false;
  return s.every((p) => {
    const u = ((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2;
    const q = [a[0] + ab[0] * u, a[1] + ab[1] * u];
    const tu = d / Math.sqrt(l2);
    return u >= -tu && u <= 1 + tu && Math.hypot(p[0] - q[0], p[1] - q[1]) <= d;
  });
}

/** Двойные куски: два куска выделения с одной видимостью один на другом. */
function dvoynye(kuski, d) {
  const out = [];
  for (let i = 0; i < kuski.length; i += 1)
    for (let j = i + 1; j < kuski.length; j += 1) {
      const s = kuski[i];
      const t = kuski[j];
      if (s.vidno !== t.vidno) continue;
      const dl = (k) => Math.hypot(k.pts[1][0] - k.pts[0][0], k.pts[1][1] - k.pts[0][1]);
      if (dl(s) < 1 || dl(t) < 1) continue;
      if (lezhit2(s.pts, t.pts, d) || lezhit2(t.pts, s.pts, d)) out.push([s, t]);
    }
  return out;
}

const spisok = [];
let chertezhey = 0;
let kuskov = 0;

function proveritSolid(model, where, sobrat = true) {
  const vydel = (model.sections ?? []).length + (model.lines ?? []).length;
  if (vydel === 0) return;
  const vb = SV.vybratVidSolid(model);
  const mv = vb.model;
  const baza = mv.rakurs ?? { azimuth: 28, elevation: 25 };
  if (sobrat) spisok.push({ where, engine: 'solid', svg: R.renderSolid(mv) });
  const size = razmer(mv);
  for (const d of POVOROTY) {
    const view = P.orthoAt(baza.azimuth + d, baza.elevation);
    const k = view.toward;
    const w = `${where} (азимут ${baza.azimuth + d}°)`;
    chertezhey += 1;
    for (const l of R.solidLinii(mv, { view })) {
      if (l.liquid || (l.role !== 'aux' && l.role !== 'section')) continue;
      const zasl = mv.bodies.filter((b, i) => !b.glass || i === l.owner);
      const glubina = (x) =>
        Math.max(-Infinity, ...zasl.map((b) => glubinaLuchaTela(b, x, k, size)));
      const sud = sudKuska(l.p3, l.visible, glubina, size);
      kuskov += 1;
      ok(
        sud === 'ok' || sud === 'spor',
        `${w}: ${l.role === 'section' ? 'сторона сечения' : 'отрезок'} — ${sud} [${l.p3[0].map((x) => x.toFixed(2))} → ${l.p3.at(-1).map((x) => x.toFixed(2))}]`,
      );
    }
    const kuski = R.solidDiagnostics(mv, { view })
      .strokes.filter((s) => (s.role === 'aux' || s.role === 'section') && s.points.length === 2)
      .map((s) => ({ pts: s.points, vidno: s.visible }));
    /* Двойные линии — на рисуемом ракурсе: в повёрнутом плоская фигура
       может встать ребром, и её стороны лягут на одну прямую. */
    const dv = d === 0 ? dvoynye(kuski, 0.6) : [];
    ok(
      dv.length === 0,
      `${w}: кусок выделения нарисован дважды (${dv.length}) — ${dv
        .slice(0, 2)
        .map(
          ([s]) =>
            `${s.vidno ? 'сплошная' : 'пунктир'} ${s.pts.map((p) => p.map((x) => x.toFixed(1)).join(',')).join('→')}`,
        )
        .join('; ')}`,
    );
  }
}

/* ── lib/chertezh3: видимость кусков выделения при трёх ракурсах ─── */

function proveritChertezh3(ch, where) {
  const sc = ch.scenariy;
  if (!sc.elementy || sc.elementy.length === 0) return;
  const scena = C.postroit(sc);
  if (scena.elementy.length === 0) return;
  const baza = sc.rakurs;
  const sz = sc.szhatie ?? 1;
  spisok.push({
    where,
    engine: 'chertezh3',
    svg: C.chertezhSvg(sc, { rezhim: 'uchitel', shirina: 280, kegl: 15 }),
  });
  const S = (p) => [p[0], p[1], p[2] * sz];
  const eps = scena.geom.razmer * 1e-7;
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
  for (const d of POVOROTY) {
    const rakurs = { ...baza, azimut: baza.azimut + d };
    const w = `${where} (азимут ${rakurs.azimut}°)`;
    chertezhey += 1;
    const { kam } = K.vidKadra(rakurs, sz);
    const k = PR.bazis(PR.napravlenie(rakurs)).k;
    const glubina = (x) => Math.max(...tela.map((hs) => glubinaLuchaPoluprostranstva(x, k, hs)));
    for (const e of scena.elementy) {
      const pts = e.pts;
      const pary =
        pts.length === 2
          ? [[pts[0], pts[1]]]
          : pts.length > 3 || C.MNOGOUGOLNIKI.includes(e.el.vid)
            ? pts.map((p, i) => [p, pts[(i + 1) % pts.length]])
            : [];
      for (const [a, c] of pary)
        for (const q of VI.kuskiOtrezka(a, c, scena.telo.chasti, kam, eps)) {
          const sud = sudKuska([S(lerp(a, c, q.t0)), S(lerp(a, c, q.t1))], q.vidno, glubina, size);
          kuskov += 1;
          ok(sud === 'ok' || sud === 'spor', `${w}: ${e.el.id} — ${sud}`);
        }
    }
    const kd = C.kadr(scena, { vspom: true, shirina: 280, kegl: 15, rakurs });
    const kuski = kd.linii
      .filter((l) => l.vid !== 'rebro')
      .map((l) => ({ pts: [l.a, l.b], vidno: l.vidno }));
    const dv = d === 0 ? dvoynye(kuski, 0.6) : [];
    ok(
      dv.length === 0,
      `${w}: кусок выделения нарисован дважды (${dv.length}) — ${dv
        .slice(0, 2)
        .map(([x, y]) =>
          [x, y]
            .map((q) => q.pts.map((p) => p.map((c) => c.toFixed(1)).join(',')).join('→'))
            .join(' и '),
        )
        .join('; ')}`,
    );
  }
}

/* ── 1. Регрессия: призма ABCA₁B₁C₁, треугольник ABC₁ ─────────────── */

{
  const proto =
    Z.prototypeById('P03-28S') ?? requireSrc('lib/zadanie3/razdel2/povyshennye.ts').P03_28S;
  const model = proto.chertezh({ V: 360 });
  const mv = SV.vybratVidSolid(model).model;
  const A = F.vertex(model.bodies[0], 'A');
  const Bv = F.vertex(model.bodies[0], 'B');
  const C1 = F.vertex(model.bodies[0], 'C1');
  const na = (p, a, b) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ap = [p[0] - a[0], p[1] - a[1], p[2] - a[2]];
    const cr = [
      ab[1] * ap[2] - ab[2] * ap[1],
      ab[2] * ap[0] - ab[0] * ap[2],
      ab[0] * ap[1] - ab[1] * ap[0],
    ];
    return len(cr) < 1e-6 * len(ab);
  };
  const kuski = (a, b) =>
    R.solidLinii(mv).filter(
      (l) => (l.role === 'aux' || l.role === 'section') && l.p3.every((p) => na(p, a, b)),
    );
  const AC1 = kuski(A, C1);
  const BC1 = kuski(Bv, C1);
  const AB = kuski(A, Bv);
  ok(AC1.length > 0 && AC1.every((l) => !l.visible), 'P03-28S: AC₁ должен быть пунктиром');
  ok(BC1.length > 0 && BC1.every((l) => !l.visible), 'P03-28S: BC₁ должен быть пунктиром');
  ok(AB.length > 0 && AB.every((l) => l.visible), 'P03-28S: AB должна быть сплошной');
  ok(AC1.length === 1, `P03-28S: AC₁ нарисован ${AC1.length} раз(а), нужен один`);
  ok(BC1.length === 1, `P03-28S: BC₁ нарисован ${BC1.length} раз(а), нужен один`);
  const svg = R.renderSolid(mv);
  const oranzh = [
    ...svg.matchAll(
      /<path d="M([\d.-]+) ([\d.-]+)L([\d.-]+) ([\d.-]+)"[^>]*stroke="#e07a2f"[^>]*>/g,
    ),
  ];
  ok(
    oranzh.length === 3,
    `P03-28S: в SVG сторон треугольника ${oranzh.length}, нужно 3 (каждая один раз)`,
  );
}

/* ── 3. Отдельные случаи на кубе ──────────────────────────────────── */

{
  const kub = F.box(4, 4, 4);
  const v = (n) => F.vertex(kub, n);
  const vid = { azimuth: 28, elevation: 25 };
  const model = (extra) => ({ alt: 'куб', bodies: [kub], rakurs: vid, ...extra });
  const linii = (m) => R.solidLinii(m).filter((l) => l.role === 'aux' || l.role === 'section');
  /* Какие вершины спереди: ближе к зрителю по направлению взгляда. */
  const k = P.orthoAt(vid.azimuth, vid.elevation).toward;
  const glub = (p) => p[0] * k[0] + p[1] * k[1] + p[2] * k[2];
  const imena = ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'];
  const nizhnie = imena.slice(0, 4).sort((a, b) => glub(v(a)) - glub(v(b)));
  const zad = nizhnie[0];
  /* Задняя грань — вертикальная грань через самую дальнюю нижнюю вершину,
     с соседней по дальности. */
  const sosed = nizhnie[1];
  const zadVerh = `${zad}1`;
  const sosedVerh = `${sosed}1`;
  {
    const m = model({ lines: [{ a: v(zad), b: v(sosedVerh) }] });
    const l = linii(m);
    ok(
      l.length > 0 && l.every((x) => !x.visible),
      `куб: диагональ задней грани ${zad}${sosedVerh} должна быть пунктиром`,
    );
  }
  {
    const pered = nizhnie[3];
    const protiv = { A: 'C1', B: 'D1', C: 'A1', D: 'B1' }[pered];
    const m = model({ lines: [{ a: v(pered), b: v(protiv) }] });
    const l = linii(m);
    ok(
      l.length > 0 && l.every((x) => !x.visible),
      `куб: пространственная диагональ ${pered}${protiv} должна быть пунктиром (внутри тела)`,
    );
  }
  {
    /* Сечение через середины рёбер: три вершины — на передних гранях и на
       задней; стороны на передних гранях — сплошные, на задних — пунктир. */
    const sredina = (a, b) => lerp(v(a), v(b), 0.5);
    const pered = nizhnie[3];
    const pts = [sredina(pered, `${pered}1`), sredina(zad, zadVerh), sredina(sosed, sosedVerh)];
    const m = model({ sections: [{ points: pts }] });
    const l = linii(m);
    ok(
      l.some((x) => x.visible) && l.some((x) => !x.visible),
      'куб: сечение через переднюю и заднюю грани — нужны и сплошные, и пунктирные стороны',
    );
    proveritSolid(m, 'куб: сечение через переднюю и заднюю грани', false);
  }
  proveritSolid(
    model({ lines: [{ a: v(zad), b: v(sosedVerh) }] }),
    'куб: диагональ задней грани',
    false,
  );
}

/* ── 2. Все чертежи с выделенными фигурами ───────────────────────── */

for (const razdel of Z.RAZDELY) {
  for (const proto of razdel.prototipy) {
    for (const varnt of proto.varianty.slice(0, 2)) {
      const where = `${proto.id}#${varnt.n}`;
      if (B.estScenariy(proto)) {
        const ch = B.chertezhVarianta(proto, varnt);
        if (ch !== null) proveritChertezh3(ch, where);
      } else {
        let model;
        try {
          model = proto.chertezh(varnt.params);
        } catch {
          continue;
        }
        proveritSolid(model, where);
      }
    }
  }
}

for (const r of RAZBORY_3) proveritSolid(r.model(), `разбор «${r.tip}» (${r.prototip})`);

/* Шаблоны «Вариантов повышенной сложности»: свои прототипы №3. Числа —
   из версий вариантов (данные раздела), чертёж собирается из них. */
const POV = ['razdel2', 'razdel3', 'razdel5', 'razdel7', 'razdel8'].flatMap((r) =>
  Object.values(requireSrc(`lib/zadanie3/${r}/povyshennye.ts`)).filter(
    (x) => x && typeof x === 'object' && typeof x.chertezh === 'function',
  ),
);
const { GOTOVY } = requireSrc('lib/povyshennye/dannye/index');
const paramy = [];
for (const kk of GOTOVY) {
  const { VARIANT } = requireSrc(`lib/povyshennye/dannye/v${String(kk).padStart(2, '0')}`);
  for (const v of VARIANT.versii) for (const z of v) if (z.p) paramy.push(z.p);
}
for (const proto of POV) {
  const vidano = new Set();
  for (const p of [{}, ...paramy]) {
    let model;
    try {
      model = proto.chertezh(p);
    } catch {
      continue;
    }
    /* Один чертёж — один раз: модели с одинаковыми телами и выделением. */
    const key = JSON.stringify([model.bodies, model.sections ?? [], model.lines ?? []]);
    if (vidano.has(key)) continue;
    vidano.add(key);
    proveritSolid(model, `${proto.id} (повышенной сложности)`);
    if (vidano.size >= 3) break;
  }
}

if (fileSpisok) fs.writeFileSync(fileSpisok, JSON.stringify(spisok));

console.log(
  `Чертежей с выделенными фигурами: ${spisok.length}; проверено видов ${chertezhey}, кусков ${kuskov}, проверок ${checks}.`,
);
if (problems.length > 0) {
  console.log(`\nПроблем: ${problems.length}`);
  for (const p of problems.slice(0, Number(process.env.VSE ?? 60))) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('Выделенные фигуры №3: видимость сторон — как у рёбер, двойных линий нет.');
