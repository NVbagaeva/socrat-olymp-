#!/usr/bin/env node
/* scripts/check-stereo-vrashchenie.mjs — чертежи стереометрии при вращении руками.

   Запуск: pnpm test:stereo-vrashchenie

   Без браузера, на всех чертежах, которые на сайте вращаются: банк №3
   (сценарии I–III — lib/chertezh3, тела вращения IV–VIII — lib/solid),
   120 опорных задач, разборы №3 и №15. Каждый чертёж — в пяти ракурсах:
   по умолчанию, повёрнутый влево и вправо, почти сверху и почти сбоку.

     1. Подписи не налезают друг на друга ни в одном ракурсе.
     2. Подпись не лежит на линии (видимой или пунктирной): не чаще
        0,5 % подписей по всем ракурсам.
     3. Буквы условия — на чертеже: каждая точка из условия («$AC_1$»,
        «точка $M$») подписана на рисунке задачи.
     4. Подпись закрытой вершины помечена бледнее (data-skryt) хотя бы
        на одном ракурсе у каждого многогранника с подписями: невидимые
        вершины есть у любого тела, и пометка не потерялась.
     5. Пунктир пересчитывается: у тела в разных ракурсах набор
        невидимых линий разный (иначе пунктир «приклеен» к виду).

   Ненулевой код возврата — проверка не прошла. */

import { requireSrc } from './lib/load-ts.mjs';

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

const R = requireSrc('lib/solid/render.ts');
const P = requireSrc('lib/solid/project.ts');
const V = requireSrc('lib/solid/vid.ts');
const C3 = requireSrc('lib/chertezh3/index.ts');
const { RAZDELY } = requireSrc('lib/zadanie3/index.ts');
const { chertezhVarianta, estScenariy } = requireSrc('lib/zadanie3/chertezhi/index.ts');
const BL = requireSrc('lib/stereo/opornye3/bloki.ts');
const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');
const { RAZBORY_15 } = requireSrc('lib/stereo/razbory15.ts');

/** Ракурсы проверки относительно исходного: [Δазимут, подъём или null — исходный]. */
const RAKURSY = [
  [0, null],
  [55, null],
  [-80, null],
  [0, 78],
  [130, 12],
];

/** «A_{1}», «A_1», «A1», «A'» → «A1», «A'»: одно имя для условия и чертежа. */
const imya = (t) => t.replace(/[{}_\\]/g, '').replace(/\s+/g, '');

/**
 * Точки условия: формула из одних имён точек («AC_1», «ABCDA_1B_1C_1D_1»)
 * или одна буква после слов «точка», «вершина». Буквы величин ($V$, $S$,
 * $R$) так не ловятся.
 */
function tochkiUsloviya(text) {
  const out = new Set();
  const IMYA = String.raw`[A-Z](?:_\{?\d+\}?|_\{?[a-z]\}?)?'*`;
  const seq = new RegExp(String.raw`^(?:${IMYA}){2,}$`);
  const odna = new RegExp(String.raw`^${IMYA}$`);
  const re = /(\S*)\s*\$([^$]+)\$/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const pered = m[1].toLowerCase();
    const tex = m[2].replace(/\s+/g, '');
    for (const kusok of tex.split(/[,;=()]/)) {
      if (seq.test(kusok) || (odna.test(kusok) && /(точк|вершин|центр)/.test(pered))) {
        for (const t of kusok.match(new RegExp(IMYA, 'g')) ?? []) out.add(imya(t));
      }
    }
  }
  return out;
}

const peresek = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function otrezokVPryamougolnike(p, q, r) {
  /* Отрезок задевает прямоугольник подписи (с полем 0,5 px внутрь). */
  const x0 = r.x + 0.5;
  const y0 = r.y + 0.5;
  const x1 = r.x + r.w - 0.5;
  const y1 = r.y + r.h - 0.5;
  if (x1 <= x0 || y1 <= y0) return false;
  let t0 = 0;
  let t1 = 1;
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  for (const [pp, qq] of [
    [-dx, p[0] - x0],
    [dx, x1 - p[0]],
    [-dy, p[1] - y0],
    [dy, y1 - p[1]],
  ]) {
    if (pp === 0) {
      if (qq < 0) return false;
    } else {
      const t = qq / pp;
      if (pp < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
  }
  return t0 < t1;
}

let podpisey = 0;
let naLinii = 0;
const naLiniiPrimery = [];

/** Подписи и линии кадра → проверки 1, 2; возвращает подписи и невидимые линии. */
function kadrOk(where, labels, segs) {
  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      check(
        !peresek(labels[i], labels[j]),
        `${where}: подписи «${labels[i].text}» и «${labels[j].text}» налезают`,
      );
    }
  }
  for (const l of labels) {
    podpisey += 1;
    if (segs.some(([p, q]) => otrezokVPryamougolnike(p, q, l))) {
      naLinii += 1;
      if (naLiniiPrimery.length < 12) naLiniiPrimery.push(`${where} «${l.text}»`);
    }
  }
}

/* ── lib/solid: модель ─────────────────────────────────────────── */
function modelOk(where, model, uslovie) {
  const az0 = model.rakurs?.azimuth ?? P.ORTHO_AZIMUTH;
  const el0 = model.rakurs?.elevation ?? P.ORTHO_ELEVATION;
  const imena = new Set();
  const nevidimye = new Set();
  let skrytyh = 0;
  const estPodpisi =
    model.bodies.some((b) => (b.names ?? []).some((n) => n)) ||
    (model.marks ?? []).some((m) => m.label);
  for (const [da, el] of RAKURSY) {
    const opts = { view: P.orthoAt(az0 + da, el ?? el0), ustoychivo: true };
    const d = R.solidDiagnostics(model, opts);
    const labels = d.labels.filter((l) => l.kind === 'vertex');
    labels.forEach((l) => imena.add(imya(l.text)));
    kadrOk(
      `${where} (${da}°/${el ?? 'исх'})`,
      d.labels,
      d.strokes.flatMap((s) => s.points.slice(1).map((q, i) => [s.points[i], q])),
    );
    nevidimye.add(
      JSON.stringify(
        d.strokes.filter((s) => !s.visible).map((s) => s.points.map((p) => p.map(Math.round))),
      ),
    );
    skrytyh += (R.renderSolid(model, opts).match(/data-skryt="1"/g) ?? []).length;
  }
  for (const t of tochkiUsloviya(uslovie)) {
    check(imena.has(t), `${where}: точки «${t}» из условия нет на чертеже`);
  }
  const mnogogrannik = model.bodies.some((b) => b.kind === 'polyhedron');
  if (estPodpisi && mnogogrannik) {
    check(skrytyh > 0, `${where}: нет ни одной бледной подписи закрытой вершины`);
  }
  if (mnogogrannik) {
    check(nevidimye.size > 1, `${where}: пунктир одинаков во всех ракурсах`);
  }
}

/* ── lib/chertezh3: сценарий ───────────────────────────────────── */
function scenariyOk(where, sc, uslovie) {
  const scena = C3.postroit(sc);
  const r0 = sc.rakurs ?? { azimut: 24, vysota: 24 };
  const imena = new Set();
  const nevidimye = new Set();
  let skrytyh = 0;
  for (const [da, el] of RAKURSY) {
    const rakurs = { azimut: r0.azimut + da, vysota: el ?? r0.vysota };
    const k = C3.kadr(scena, { rakurs, vspom: false, shirina: 320, vysota: 280, kegl: 15 });
    k.podpisi.filter((p) => p.vid === 'imya').forEach((p) => imena.add(imya(p.tex)));
    skrytyh += k.podpisi.filter((p) => p.skryta === true).length;
    kadrOk(
      `${where} (${da}°/${el ?? 'исх'})`,
      k.podpisi.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h, text: p.tex })),
      k.linii.map((l) => [l.a, l.b]),
    );
    nevidimye.add(
      JSON.stringify(k.linii.filter((l) => !l.vidno).map((l) => [l.a, l.b].flat().map(Math.round))),
    );
  }
  for (const t of tochkiUsloviya(uslovie)) {
    check(imena.has(t), `${where}: точки «${t}» из условия нет на чертеже`);
  }
  if (imena.size > 0) {
    check(skrytyh > 0, `${where}: нет ни одной бледной подписи закрытой вершины`);
  }
  check(nevidimye.size > 1, `${where}: пунктир одинаков во всех ракурсах`);
}

/* ── Банк №3 ───────────────────────────────────────────────────── */
let chertezhey = 0;
for (const r of RAZDELY) {
  for (const p of r.prototipy) {
    const v = p.varianty[0];
    if (v === undefined) continue;
    const uslovie = p.uslovie(v.params);
    const where = `№3 ${p.id}#${v.n}`;
    chertezhey += 1;
    if (estScenariy(p)) {
      const ch = chertezhVarianta(p, v);
      if (ch !== null) scenariyOk(where, ch.scenariy, uslovie);
    } else {
      modelOk(where, V.vybratVidSolid(p.chertezh(v.params)).model, uslovie);
    }
  }
}

/* ── Опорные задачи и разборы ──────────────────────────────────── */
for (const b of BL.BLOKI_3) {
  for (const z of BL.zadachiBloka(b.id)) {
    chertezhey += 1;
    modelOk(`опорные ${z.klyuch ?? z.id ?? b.id}`, z.model, z.uslovie);
  }
}
for (const r of RAZBORY_3) {
  chertezhey += 1;
  modelOk(`разбор №3 ${r.id}`, r.model(), r.uslovie);
}
for (const r of RAZBORY_15) {
  chertezhey += 1;
  modelOk(`разбор №15 ${r.id}`, r.model(), r.uslovie);
}

const dolya = podpisey === 0 ? 0 : naLinii / podpisey;
check(
  dolya <= 0.005,
  `подписей на линии ${naLinii} из ${podpisey} (${(dolya * 100).toFixed(2)} %): ${naLiniiPrimery.join('; ')}`,
);

console.log(
  `Чертежей ${chertezhey}, ракурсов ${RAKURSY.length}; подписей ${podpisey}, на линии ${naLinii}.`,
);
if (failures.length > 0) {
  console.error(`check-stereo-vrashchenie: не прошли ${failures.length} из ${checks}`);
  for (const f of failures.slice(0, 60)) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`check-stereo-vrashchenie: ok (${checks} проверок)`);
