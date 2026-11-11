#!/usr/bin/env node
/* scripts/check-stereo-ekran.mjs — чертежи №3 в экранной теме
   («Стеклянная сцена»): буквы вершин, величины и видимость рёбер.

   Без браузера: движок lib/solid читается из исходников.

     1. Буквы вершин — синие и жирные (class="solid-bukva", вес 700,
        цвет токеном --chertezh-vershina); числа-величины — цветом
        величин (solid-chislo), ребро с величиной — тем же цветом и
        толще (solid-velichina). В строгой теме (листы, PDF) разметка
        прежняя: этих классов нет.
     2. Подписи не налезают друг на друга на четырёх ракурсах — на
        чертежах всех 92 прототипов банка, всех 15 разобранных примеров
        и блока «Что нужно знать». Ширина жирной буквы посчитана с
        поправкой. Подпись на линии — не больше 1 % подписей.
     3. Видимость рёбер считается из геометрии и пересчитывается при
        повороте: у параллелепипеда на каждом из четырёх ракурсов
        невидимы ровно три ребра, сходящиеся в одной вершине, и эта
        вершина у разных ракурсов разная; у пирамиды невидимые рёбра
        меняются с ракурсом; у цилиндра задняя половина нижнего
        основания — пунктиром.

   Запуск: node scripts/check-stereo-ekran.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const R = requireSrc('lib/solid/render.ts');
const { orthoAt } = requireSrc('lib/solid/project.ts');
const { vybratVidSolid } = requireSrc('lib/solid/vid.ts');
const F = requireSrc('lib/solid/figures.ts');
const { BANK } = requireSrc('lib/zadanie3/index.ts');
const { RAZBORY_3 } = requireSrc('lib/stereo/razbory3.ts');
const { CHERTEZHI_FORMUL, chertezhPodobiya } = requireSrc(
  'components/tasks/zadanie3/chertezhiFormul.ts',
);

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* Четыре ракурса: исходный и три поворота, включая вид «сзади» и крутой подъём. */
const RAKURSY = [
  [28, 25],
  [-40, 15],
  [118, 40],
  [205, 60],
];

/* ── 1. Разметка ─────────────────────────────────────────────── */
{
  const b = F.box(4, 3, 2);
  const model = {
    alt: 'Параллелепипед',
    bodies: [b],
    measures: [{ a: F.vertex(b, 'A'), b: F.vertex(b, 'B'), text: '4' }],
  };
  const ekran = R.renderSolid(model, { tema: 'ekran', ustoychivo: true });
  const strogo = R.renderSolid(model, { ustoychivo: true });
  const bukvy = [...ekran.matchAll(/<text class="solid-bukva"[^>]*>/g)].map((m) => m[0]);
  check(bukvy.length === 8, `экран: букв вершин ${bukvy.length}, а не 8`);
  check(
    bukvy.every((t) => t.includes('font-weight="700"') && t.includes('--chertezh-vershina')),
    'экран: буква вершины не синяя или не жирная',
  );
  const chisla = [...ekran.matchAll(/<text class="solid-chislo"[^>]*>/g)].map((m) => m[0]);
  check(
    chisla.length === 1 && chisla[0].includes('--chertezh-velichina'),
    'экран: число-величина не цветом величин',
  );
  const rebra = [...ekran.matchAll(/<path[^>]*class="solid-velichina"[^>]*>/g)].map((m) => m[0]);
  check(
    rebra.length >= 1 && rebra.every((t) => t.includes('--chertezh-velichina')),
    'экран: ребро с величиной не выделено цветом величин',
  );
  const tolshchina = Number(/stroke-width="([\d.]+)"/.exec(rebra[0] ?? '')?.[1]);
  const obychnoe = Number(
    /class="solid-rebro" stroke="[^"]*" stroke-width="([\d.]+)"/.exec(ekran)?.[1],
  );
  check(
    tolshchina > obychnoe,
    `экран: ребро с величиной не толще обычного (${tolshchina} и ${obychnoe})`,
  );
  check(
    !/solid-bukva|solid-chislo|solid-velichina|font-weight="700"/.test(strogo),
    'строгая тема: появились экранные классы или жирное начертание',
  );
  /* Величина шага, которого ещё нет, ребро не красит. */
  const poShagam = {
    ...model,
    measures: [{ a: F.vertex(b, 'A'), b: F.vertex(b, 'B'), text: '4', shag: 2 }],
  };
  check(
    !R.renderSolid(poShagam, { tema: 'ekran', shag: 1 }).includes('solid-velichina'),
    'экран: ребро окрашено величиной будущего шага',
  );
  check(
    R.renderSolid(poShagam, { tema: 'ekran', shag: 3 }).includes('solid-velichina'),
    'экран: ребро не окрашено величиной пройденного шага',
  );
}

/* ── 2. Подписи не пересекаются ──────────────────────────────── */
const modeli = [
  ...BANK.map((p) => ({
    imya: p.id,
    model: vybratVidSolid(p.chertezh(p.varianty[0].params)).model,
  })),
  ...RAZBORY_3.map((r) => ({ imya: `пример ${r.tip}`, model: r.model() })),
  ...Object.entries(CHERTEZHI_FORMUL).map(([id, m]) => ({ imya: `формулы ${id}`, model: m() })),
  { imya: 'подобие', model: chertezhPodobiya('Два куба') },
];

function nalozhenie(a, b) {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0.5 && h > 0.5;
}

function naLinii(label, strokes) {
  /* Подпись на линии: отрезок проходит через середину рамки подписи. */
  const cx = label.x + label.w / 2;
  const cy = label.y + label.h / 2;
  const r = Math.min(label.w, label.h) * 0.3;
  return strokes.some((s) => {
    for (let i = 0; i + 1 < s.points.length; i += 1) {
      const [x1, y1] = s.points[i];
      const [x2, y2] = s.points[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / len2));
      if (Math.hypot(x1 + t * dx - cx, y1 + t * dy - cy) < r) return true;
    }
    return false;
  });
}

let podpisey = 0;
let naLiniyah = 0;
for (const { imya, model } of modeli) {
  for (const [az, el] of RAKURSY) {
    const d = R.solidDiagnostics(model, {
      view: orthoAt(az, el),
      ustoychivo: true,
      tema: 'ekran',
    });
    for (let i = 0; i < d.labels.length; i += 1) {
      for (let j = i + 1; j < d.labels.length; j += 1) {
        check(
          !nalozhenie(d.labels[i], d.labels[j]),
          `${imya}, ракурс ${az}/${el}: подписи «${d.labels[i].text}» и «${d.labels[j].text}» пересекаются`,
        );
      }
    }
    podpisey += d.labels.length;
    naLiniyah += d.labels.filter((l) => naLinii(l, d.strokes)).length;
  }
}
check(podpisey > 1000, `подписей проверено мало: ${podpisey}`);
check(naLiniyah / podpisey <= 0.01, `подписей на линии ${naLiniyah} из ${podpisey} — больше 1 %`);

/* ── 3. Видимость рёбер на четырёх ракурсах ──────────────────── */
const klyuch = (p) => p.map((x) => Math.round(x * 100) / 100).join(',');

function nevidimye(model, az, el) {
  return R.solidLinii(model, { view: orthoAt(az, el) }).filter(
    (s) => s.role === 'edge' && !s.visible,
  );
}

{
  const b = F.box(4, 3, 2);
  const model = { alt: 'Параллелепипед', bodies: [b] };
  const vershiny = new Set();
  for (const [az, el] of RAKURSY) {
    const skryty = nevidimye(model, az, el);
    /* Три невидимых ребра сходятся в одной вершине — дальней от зрителя. */
    const schet = new Map();
    for (const s of skryty) {
      for (const p of [s.p3[0], s.p3[s.p3.length - 1]]) {
        schet.set(klyuch(p), (schet.get(klyuch(p)) ?? 0) + 1);
      }
    }
    const obshchaya = [...schet.entries()].filter(([, n]) => n === 3);
    check(
      skryty.length === 3,
      `параллелепипед, ракурс ${az}/${el}: невидимых рёбер ${skryty.length}, а не 3`,
    );
    check(
      obshchaya.length === 1,
      `параллелепипед, ракурс ${az}/${el}: невидимые рёбра не сходятся в одной вершине`,
    );
    if (obshchaya.length === 1) vershiny.add(obshchaya[0][0]);
    const vidimye = R.solidLinii(model, { view: orthoAt(az, el) }).filter(
      (s) => s.role === 'edge' && s.visible,
    );
    check(
      vidimye.length === 9,
      `параллелепипед, ракурс ${az}/${el}: видимых рёбер ${vidimye.length}, а не 9`,
    );
  }
  check(
    vershiny.size >= 3,
    `параллелепипед: дальняя вершина не меняется с ракурсом (${vershiny.size})`,
  );
}
{
  const model = { alt: 'Пирамида', bodies: [F.regularPyramid(4, 2.2, 3)] };
  const nabory = RAKURSY.map(([az, el]) =>
    nevidimye(model, az, el)
      .map((s) => `${klyuch(s.p3[0])}|${klyuch(s.p3[s.p3.length - 1])}`)
      .sort()
      .join(';'),
  );
  check(new Set(nabory).size >= 3, 'пирамида: невидимые рёбра не меняются с ракурсом');
  /* Почти сверху (подъём 80°) все грани смотрят на зрителя: невидимых
     рёбер нет. На 60° дальняя боковая грань этой пирамиды уже
     отвёрнута (её наклон ≈ 62,6°) — и дальнее ребро основания скрыто. */
  check(nevidimye(model, 205, 80).length === 0, 'пирамида сверху: есть невидимые рёбра');
  check(
    nevidimye(model, 205, 60).length >= 1,
    'пирамида, подъём 60°: дальнее ребро основания видно',
  );
  /* Сбоку хотя бы одно ребро основания за телом. */
  check(nevidimye(model, 28, 25).length >= 1, 'пирамида сбоку: невидимых рёбер нет');
}
{
  const model = {
    alt: 'Цилиндр',
    bodies: [{ kind: 'cylinder', base: [0, 0, 0], r: 1.5, h: 3 }],
  };
  for (const [az, el] of RAKURSY) {
    const linii = R.solidLinii(model, { view: orthoAt(az, el) });
    const nizhnie = linii.filter((s) => s.p3.every((p) => Math.abs(p[2]) < 1e-6));
    check(
      nizhnie.some((s) => !s.visible) && nizhnie.some((s) => s.visible),
      `цилиндр, ракурс ${az}/${el}: нижнее основание не разделено на видимую и невидимую дуги`,
    );
    const verhnie = linii.filter((s) => s.p3.every((p) => Math.abs(p[2] - 3) < 1e-6));
    check(
      verhnie.length > 0 && verhnie.every((s) => s.visible),
      `цилиндр, ракурс ${az}/${el}: верхнее основание видно не целиком`,
    );
  }
}

if (failures.length > 0) {
  console.error(`check-stereo-ekran: ${failures.length} из ${checks} проверок не прошли`);
  failures.slice(0, 40).forEach((item) => console.error(` - ${item}`));
  process.exit(1);
}
console.log(
  `check-stereo-ekran: ${checks} проверок прошли (чертежей ${modeli.length}, подписей ${podpisey}, на линии ${naLiniyah})`,
);
