#!/usr/bin/env node
/* scripts/check-vstrecha-11.mjs — модель сцены «Встречное движение»
   (lib/zadanie11/vstrecha.ts, блок на «О задании» текстовых задач).

   Без браузера и сборки. Для всех чисел, которые дают ползунки, и для
   ширин сцены от телефона 343 px до компьютера:
     1. числа «красивые»: S, путь каждого и время встречи — целые;
        пример по умолчанию — 14 км, 4 и 3 км/ч, 2 ч, 8 и 6 км;
     2. на каждом шаге времени подписи пройденного пути не налезают
        друг на друга и не выходят за сцену; плашки скорости — тоже;
        остаток помещается в сцену;
     3. ряды сцены идут сверху вниз без наложения: плашки, фигурки,
        дорога, отметки, путь, остаток;
     4. ход времени: разгон и торможение без рывка, остановка точно
        на отметке 1 ч и на встрече.

   Запуск: node scripts/check-vstrecha-11.mjs */

import { requireSrc } from './lib/load-ts.mjs';

const V = requireSrc('lib/zadanie11/vstrecha.ts');
const { VSTRECHA11: T } = requireSrc('content/tekstovye11.ts');

const failures = [];
let checks = 0;
function check(ok, what) {
  checks += 1;
  if (!ok) failures.push(what);
}

/* Ширины подписей — с запасом (оценка шире настоящего текста Inter 13 px). */
const FONT = 13;
const w = (text) => V.shirinaPriblizitelno(text, FONT) * 1.05;

/* ── 1. Числа ── */
const d = V.VSTRECHA_DEFAULT;
check(V.rasstoyanie(d) === 14, 'по умолчанию расстояние 14 км');
check(d.v1 === 4 && d.v2 === 3 && d.T === 2, 'по умолчанию 4 и 3 км/ч, встреча через 2 ч');
check(d.v1 * d.T === 8 && d.v2 * d.T === 6, 'по умолчанию 8 км и 6 км');

const kombinacii = [];
const { v, T: dT } = V.VSTRECHA_DIAPAZON;
for (let v1 = v.min; v1 <= v.max; v1 += 1)
  for (let v2 = v.min; v2 <= v.max; v2 += 1)
    for (let Tt = dT.min; Tt <= dT.max; Tt += 1) kombinacii.push({ v1, v2, T: Tt });

for (const c of kombinacii) {
  const S = V.rasstoyanie(c);
  check(Number.isInteger(S) && S / (c.v1 + c.v2) === c.T, `S : (v1+v2) = T для ${JSON.stringify(c)}`);
  check(V.variantyRasstoyaniya(c.v1, c.v2).includes(S), `ползунок даёт S=${S}`);
  const { x1, x2 } = V.polozhenie(c, c.T);
  check(Math.abs(x1 - x2) < 1e-9, `встреча в одной точке ${JSON.stringify(c)}`);
}

/* ── 2–3. Разметка и подписи ── */
const SHIRINY = [343, 400, 520, 600, 760, 900];
for (const W of SHIRINY) {
  const r = V.razmetka(W);
  const ryady = [r.yPlashka + 13, r.yDoroga - 8, r.yDoroga + 8, r.yOtmetki - 7, r.yOtmetki + 7, r.yProydeno - 11, r.yProydeno + 11, r.yOstalos - 11, r.yOstalos + 11, r.H];
  check(
    ryady.every((y, i) => i === 0 || y >= ryady[i - 1]),
    `ряды сцены по порядку при ширине ${W}: ${ryady.join(', ')}`,
  );
  /* Голова фигурки ниже плашки скорости. */
  check(r.yDoroga - 92 * r.masshtab - 4 > r.yPlashka + 13, `фигурка не задевает плашку при ширине ${W}`);
  check(r.x0 - 27 - 13 >= 0 && r.xS + 27 + 13 <= W, `буквы городов в сцене при ширине ${W}`);

  for (const c of kombinacii) {
    const S = V.rasstoyanie(c);
    const vv = V.sblizhenie(c);
    const { podpisi } = V.otmetki(r, S);
    for (let i = 1; i < podpisi.length; i += 1) {
      const dx = V.kmVPx(r, S, podpisi[i]) - V.kmVPx(r, S, podpisi[i - 1]);
      const nado = (w(String(podpisi[i])) + w(String(podpisi[i - 1]))) / 2 + 4;
      check(dx >= nado, `отметки ${podpisi[i - 1]} и ${podpisi[i]} не слипаются (W=${W}, S=${S})`);
    }
    for (let k = 0; k <= 100; k += 1) {
      const t = (c.T * k) / 100;
      const tD = V.tPodpis(t);
      const vstr = k === 100;
      const { x1, x2 } = V.polozhenie(c, t);
      const p1 = V.kmVPx(r, S, x1);
      const p2 = V.kmVPx(r, S, x2);
      const l1 = T.proydeno(c.v1, V.ru(tD), V.ru(c.v1 * tD), vstr);
      const l2 = T.proydeno(c.v2, V.ru(tD), V.ru(c.v2 * tD), vstr);
      const a = { c: (r.x0 + p1) / 2, w: w(l1) + 14 };
      const b = { c: (p2 + r.xS) / 2, w: w(l2) + 14 };
      const [c1, c2] = V.razvesti(a, b, r.pole, W - r.pole, 8);
      const gde = `W=${W}, ${JSON.stringify(c)}, t=${t.toFixed(2)}`;
      check(c2 - c1 >= (a.w + b.w) / 2 + 7.99, `подписи пути не налезают: ${gde}`);
      check(c1 - a.w / 2 >= r.pole - 0.01 && c2 + b.w / 2 <= W - r.pole + 0.01, `подписи пути в сцене: ${gde}`);

      const o = T.ostalos(S, vv, V.ru(Math.max(0, S - vv * tD)));
      check(w(o) + 14 <= W - 2 * r.pole, `остаток помещается: ${gde}`);

      const pl1 = { c: p1 - 14 * r.masshtab, w: w(T.kmCh(String(c.v1))) + 32 };
      const pl2 = { c: p2 + 14 * r.masshtab, w: w(T.kmCh(String(c.v2))) + 32 };
      const [b1, b2] = V.razvesti(pl1, pl2, r.pole, W - r.pole, 8);
      check(b2 - b1 >= (pl1.w + pl2.w) / 2 + 7.99, `плашки скорости не налезают: ${gde}`);
    }
  }
}

/* ── 4. Ход времени ── */
{
  const c = V.VSTRECHA_DEFAULT;
  let t = 0;
  let start = 0;
  let snimok = false;
  let prev = 0;
  let maxSkachok = 0;
  let kadrov = 0;
  const ostanovki = [];
  while (t < c.T && kadrov < 10000) {
    const stop = V.sleduyushayaOstanovka(c, t, snimok);
    const nov = V.shagVremeni(1 / 60, 1, t, start, stop);
    const v1 = nov - t;
    if (kadrov > 0) maxSkachok = Math.max(maxSkachok, Math.abs(v1 - prev));
    prev = v1;
    t = nov;
    kadrov += 1;
    if (t >= stop) {
      ostanovki.push(t);
      if (stop < c.T) {
        snimok = true;
        start = t;
        prev = 0;
      }
    }
  }
  check(ostanovki.length === 2 && ostanovki[0] === 1 && ostanovki[1] === 2, `остановки на 1 ч и 2 ч: ${ostanovki}`);
  const polnyy = 1 / 60 / V.SEK_NA_CHAS;
  check(maxSkachok <= polnyy * 0.5, `скорость меняется плавно: скачок ${maxSkachok.toFixed(5)} при полном шаге ${polnyy.toFixed(5)}`);
  const sek = kadrov / 60;
  check(sek > 4 && sek < 9, `показ при ×1 длится разумно: ${sek.toFixed(1)} с без снимка`);
}

/* ── Тексты: без «мы», пешеходы «прошли» ── */
{
  const vse = JSON.stringify(T, (k, val) => (typeof val === 'function' ? String(val) : val));
  check(!/(^|[^а-яё])(мы|нам|нас|наш)([^а-яё]|$)/i.test(vse), 'в текстах нет «мы»');
  check(!/проехал/i.test(vse), 'путники «прошли», а не «проехали»');
}

if (failures.length > 0) {
  console.error(`✗ ${failures.length} из ${checks} проверок:`);
  for (const f of failures.slice(0, 30)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ Сцена «Встречное движение»: ${checks} проверок пройдено.`);
