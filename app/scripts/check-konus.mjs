#!/usr/bin/env node
/* check-konus.mjs — проверка чертежа «конус, плоскость, парабола».

   Проверяется не картинка, а геометрия: плоскость параллельна
   образующей, кривая лежит и на конусе, и в плоскости, концы сидят
   на окружности основания, дуга разомкнута. Каждое утверждение
   печатается числом — чтобы было видно, чем оно подтверждено.

   Запуск: node scripts/check-konus.mjs
*/

import { chertyozh } from '../src/lib/graph/konus3d.js';

const DOPUSK = 1e-9;
let bed = 0;
function sudit(imya, znachenie, predel, kak) {
  const ok = Math.abs(znachenie) <= predel;
  if (!ok) { bed += 1; }
  const chislo = Math.abs(znachenie) < 1e-6 ? znachenie.toExponential(2) : znachenie.toFixed(6);
  console.log(`  ${ok ? 'ок ' : 'БЕДА'}  ${imya}: ${chislo} ${kak}`);
}

function proverit(nastr, imya) {
  const c = chertyozh(nastr);
  const s = c.svedeniya;
  const { R, H, n, d, obrazuyushchaya: g } = s;
  console.log(`\n${imya}: R = ${R}, H = ${H}, вершина параболы на ${(s.vershinaParaboly[2] / H * 100).toFixed(1)}% высоты`);

  /* 1. Плоскость параллельна образующей: n · g = 0. */
  const parallel = n[0] * g[0] + n[1] * g[1] + n[2] * g[2];
  sudit('n · g (условие параболы)', parallel, DOPUSK, '— плоскость параллельна образующей');

  /* 2. Каждая точка дуги лежит на конусе и в плоскости. */
  let naKonuse = 0, vPloskosti = 0;
  for (const p of s.tochkiDugi) {
    const radius = (R * (H - p[2])) / H;
    naKonuse = Math.max(naKonuse, Math.abs(p[0] * p[0] + p[1] * p[1] - radius * radius));
    vPloskosti = Math.max(vPloskosti, Math.abs(n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - d));
  }
  sudit('наибольший промах точки мимо конуса', naKonuse, 1e-12,
        `— по всем ${s.tochkiDugi.length} точкам дуги`);
  sudit('наибольший промах точки мимо плоскости', vPloskosti, 1e-12,
        `— по всем ${s.tochkiDugi.length} точкам дуги`);

  /* 3. Концы дуги сидят на окружности основания. */
  for (const [nomer, p] of [['первый', s.konec1], ['второй', s.konec2]]) {
    sudit(`${nomer} конец: высота над основанием`, p[2], 1e-12, '— конец лежит в плоскости основания');
    sudit(`${nomer} конец: промах мимо окружности`, p[0] * p[0] + p[1] * p[1] - R * R, 1e-12,
          '— конец лежит на окружности основания');
  }

  /* 4. Дуга разомкнута: концы не сходятся. */
  const razryv = Math.hypot(s.konec1[0] - s.konec2[0], s.konec1[1] - s.konec2[1], s.konec1[2] - s.konec2[2]);
  console.log(`  ${razryv > 0.5 * R ? 'ок ' : 'БЕДА'}  расстояние между концами: ${razryv.toFixed(6)} — дуга разомкнута, петли нет`);
  if (razryv <= 0.5 * R) { bed += 1; }

  /* 5. Вершина параболы ниже вершины конуса с запасом. */
  const zapas = H - s.vershinaParaboly[2];
  console.log(`  ${zapas > 0.15 * H ? 'ок ' : 'БЕДА'}  запас до вершины конуса: ${zapas.toFixed(6)} (${(zapas / H * 100).toFixed(1)}% высоты)`);
  if (zapas <= 0.15 * H) { bed += 1; }

  /* 6. Высота вдоль дуги растёт до вершины и убывает после: один
        подъём и один спуск, значит это ветви, а не петля. */
  let perelomov = 0;
  const t = s.tochkiDugi;
  for (let i = 1; i + 1 < t.length; i++) {
    const do_ = t[i][2] - t[i - 1][2];
    const posle = t[i + 1][2] - t[i][2];
    if (do_ > 0 && posle < 0) { perelomov += 1; }
  }
  console.log(`  ${perelomov === 1 ? 'ок ' : 'БЕДА'}  перемен подъёма на спуск: ${perelomov} — ровно одна вершина, две ветви вниз`);
  if (perelomov !== 1) { bed += 1; }

  /* 7. Углы прямоугольника плоскости — в той же плоскости. */
  let ugly = 0;
  for (const p of s.uglyPloskosti) {
    ugly = Math.max(ugly, Math.abs(n[0] * p[0] + n[1] * p[1] + n[2] * p[2] - d));
  }
  sudit('промах углов плоскости мимо самой плоскости', ugly, 1e-12, '— прямоугольник лежит в плоскости сечения');
}

console.log('Чертёж «конус, секущая плоскость, парабола»');
proverit({}, 'по умолчанию');
/* Петли не должно быть ни при каких разумных параметрах. */
for (const H of [1.2, 1.6, 2.2]) {
  for (const azimut of [0, 12, 35]) {
    const c = chertyozh({ H, azimut });
    const s = c.svedeniya;
    const razryv = Math.hypot(s.konec1[0] - s.konec2[0], s.konec1[1] - s.konec2[1], s.konec1[2] - s.konec2[2]);
    const parallel = Math.abs(s.n[0] * s.obrazuyushchaya[0] + s.n[2] * s.obrazuyushchaya[2]);
    const ok = razryv > 0.5 && parallel < DOPUSK;
    if (!ok) { bed += 1; }
    console.log(`  ${ok ? 'ок ' : 'БЕДА'}  H = ${H}, азимут ${azimut}°: разрыв между концами ${razryv.toFixed(4)}, n · g = ${parallel.toExponential(1)}`);
  }
}

console.log(bed === 0 ? '\nвсё чисто' : `\nнеладно: ${bed}`);
process.exit(bed === 0 ? 0 : 1);
