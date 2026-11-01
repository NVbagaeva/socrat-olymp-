/* scripts/verify_schemes/geometriya.mjs — чертежи №18: геометрия не сдвигается, роли темы размечены.

   1. Эталон (etalon-geometrii-18.json): экранные координаты точек,
      подписей вершин и записей данных у всех шаблонов генератора и
      тренажёра — 13 типов × 3 набора чисел × 3 размера чертежа.
      Оформление (тема чертежа, lib/skhemy/tema.ts) не должно двигать
      ни точки, ни буквы, ни числа. Эталон снят до введения темы;
      записи площадей в menelay-pl и obshchiy-ugol переехали внутрь
      фигуры намеренно (роль region) — эталон записей снят после.
      Обновить эталон после намеренной правки геометрии:
        node scripts/verify_schemes/geometriya.mjs --obnovit
   2. Роли темы: у каждого шаблона есть основная фигура (figure или
      region); запись через x — у части part-x, через y — part-y;
      запись площади — роль region; у части с засечками засечки того же
      цвета (роль на самом отрезке). */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireSrc } from '../lib/load-ts.mjs';
import { schetchik } from './obshchee.mjs';

const ETALON = path.join(path.dirname(fileURLToPath(import.meta.url)), 'etalon-geometrii-18.json');
const RAZMERY = [
  [360, 250],
  [343, 247],
  [640, 460],
];

/** «S_ABC = 60» → «SABC=60»: запись без пробелов (обычных и неразрывных). */
const zapis = (v) =>
  v.chasti
    .map((c) => (c.koren ? `√${c.t}` : c.t))
    .join('')
    .replace(/[\s ]/g, '');

export function snyat() {
  const ekran = requireSrc('lib/skhemy/ekran');
  const { scena18 } = requireSrc('lib/zadanie18/trenazher/sceny');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  const sost = { lit: new Set(), shag: null, podpisi: true };
  const vid = { ugol: 0, otrazhenie: 1 };
  const out = {};
  for (const t of TIPY_18)
    t.varianty.forEach((p, i) => {
      for (const [W, H] of RAZMERY) {
        const sk = scena18(t.id, p);
        const kadr = sk.postroit(sk.nachalo);
        const e = ekran.raskladka(kadr, vid, ekran.ramkaKadra(kadr, vid, sost), W, H, sost);
        out[`${t.id}#${i + 1}@${W}`] = {
          tochki: e.tochki.map((q) => [q.imya, q.x, q.y]),
          podpisi: e.podpisi.map((q) => [q.bukva + q.indeks, q.x, q.y]),
          velichiny: e.velichiny.map((v) => [zapis(v), v.x, v.y]),
        };
      }
    });
  return out;
}

export function proverit() {
  const sch = schetchik('Чертежи №18: геометрия и роли темы');
  const seychas = snyat();
  const etalon = JSON.parse(fs.readFileSync(ETALON, 'utf8'));
  const odinakovo = (a, b) =>
    a.length === b.length &&
    a.every(
      (x, i) =>
        x[0] === b[i][0] && Math.abs(x[1] - b[i][1]) < 0.01 && Math.abs(x[2] - b[i][2]) < 0.01,
    );
  sch.fakt('эталон на все шаблоны', Object.keys(etalon).length === Object.keys(seychas).length);
  for (const [k, e] of Object.entries(etalon)) {
    const s = seychas[k];
    sch.fakt('точки на месте', s !== undefined && odinakovo(e.tochki, s.tochki), k);
    sch.fakt('подписи вершин на месте', s !== undefined && odinakovo(e.podpisi, s.podpisi), k);
    sch.fakt('записи данных на месте', s !== undefined && odinakovo(e.velichiny, s.velichiny), k);
  }

  const { scena18 } = requireSrc('lib/zadanie18/trenazher/sceny');
  const { TIPY_18 } = requireSrc('content/zadanie18/trenazher');
  for (const t of TIPY_18) {
    const sk = scena18(t.id, t.varianty[0]);
    const el = sk.postroit(sk.nachalo).elementy;
    sch.fakt(
      'у шаблона есть основная фигура (figure или region)',
      el.some((x) => x.rol === 'figure' || x.rol === 'region'),
      t.id,
    );
    for (const v of el.filter((x) => x.vid === 'velichina')) {
      const tekst = v.tekst;
      if (/^\d*x$/.test(tekst))
        sch.fakt('запись через x — у части part-x', v.rol === 'part-x', `${t.id}: ${tekst}`);
      if (/^\d*y$/.test(tekst))
        sch.fakt('запись через y — у части part-y', v.rol === 'part-y', `${t.id}: ${tekst}`);
      if (/^S_/.test(tekst))
        sch.fakt('запись площади — роль region', v.rol === 'region', `${t.id}: ${tekst}`);
    }
    for (const o of el.filter((x) => x.vid === 'otrezok' && x.shtrihi !== undefined && !x.skrytyy))
      sch.fakt(
        'у отрезка с засечками есть роль (засечки — его цвета)',
        o.rol !== undefined,
        `${t.id}: ${o.id}`,
      );
  }
  return { plokho: sch.itog() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes('--obnovit')) {
    /* В оформлении репозитория (prettier), чтобы format:check не спорил. */
    const { format } = await import('prettier');
    fs.writeFileSync(ETALON, await format(JSON.stringify(snyat()), { parser: 'json' }));
    console.log(`Эталон обновлён: ${ETALON}`);
  } else process.exit(proverit().plokho === 0 ? 0 : 1);
}
