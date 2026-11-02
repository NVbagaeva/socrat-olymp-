/* scripts/verify_schemes/geometriya.mjs — чертежи №18: геометрия не сдвигается, роли темы размечены.

   1. Эталон (etalon-geometrii-18.json): экранные координаты точек,
      подписей вершин и записей данных у всех шаблонов генератора и
      тренажёра — 13 типов × 3 набора чисел × 3 размера чертежа.
      Оформление (тема чертежа, lib/skhemy/tema.ts) не должно двигать
      ни точки, ни буквы, ни числа. Эталон снят до введения темы;
      записи площадей в menelay-pl и obshchiy-ugol переехали внутрь
      фигуры намеренно (роль region) — эталон записей снят после.
      Искомые площади (region-sought: menelay-pl, obshchiy-ugol,
      trap-seredina, ravnobok-perp) добавили подписи «S = ?», а пунктир
      искомой фигуры стал препятствием подписям — записи этих шаблонов и
      буквы menelay-pl сняты заново намеренно. Так же — diag-trap,
      vnevpis и vpis-lmn (тренажёр опорных задач 656–669). Записи с
      градусами сняты заново: ширина «°» — 0,5 кегля (замер KaTeX_Main),
      а не 0,4 — запись угла больше не ложится вплотную к линии.
      Записи 18 перенесённых задач тренажёра (main, trenazherDop) добавлены
      при слиянии; прежние записи не изменились; их второй и третий наборы чисел
      добавлены позже — записи первого набора при этом тоже не изменились.
      Раскладка держит зазор 2,05 px вместо 2 (после округления до сотых
      буква не касается линии): буквы, стоявшие ровно на зазоре, сдвинулись
      на шаг (4–5 px; O в diag-trap №2 и C в kvadraty №2 — на другое место).
      «R = …» в ok-ortocentr — в сегменте под хордой BC (у радиуса OC при
      большой хорде тесно).
      ot-cheva снят заново: буква
      C₁ у нижнего края выходила за рамку — фигура теперь мельчает.
      Обновить эталон после намеренной правки геометрии:
        node scripts/verify_schemes/geometriya.mjs --obnovit
   2. Роли темы: у каждого шаблона есть основная фигура (figure или
      region); запись через x — у части part-x, через y — part-y;
      запись площади — роль region; у части с засечками засечки того же
      цвета (роль на самом отрезке).
   3. Цвет линии — только смысловые связи (тема, lib/skhemy/tema.ts):
      • part-x / part-y — только у частей через переменные: у такого
        отрезка есть запись той же роли с буквой; запись-число — без
        роли части (линия navy, цветная только подпись);
      • отрезки с одинаковыми засечками равенства — одного цвета;
      • задача ищет площадь — на чертеже искомая фигура (region-sought)
        и подпись «S… = ?» той же роли; данная площадь — region и число. */

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

/** Цвет линии отрезка в теме по роли: navy, x, y или построение. */
const cvetLinii = (rol) =>
  rol === 'part-x' ? 'x' : rol === 'part-y' ? 'y' : rol === 'construction' ? 'post' : 'navy';
/** Есть буква-переменная (x, 2y, a + b), а не только число или функция (cos, sin). */
const sPeremennoy = (tekst) => /(^|[^a-zA-Z])[a-z]($|[^a-zA-Z])/.test(tekst.replace(/S_\w+/g, ''));
const odnaTochka = (p, q) => Math.abs(p[0] - q[0]) < 1e-9 && Math.abs(p[1] - q[1]) < 1e-9;

/** Правила цвета линий и площадей на чертеже одного набора чисел. */
export function proveritCveta(sch, id, sk, tekstB) {
  const el = sk.postroit(sk.nachalo).elementy.filter((x) => !x.skrytyy);
  const zapisi = el.filter((x) => x.vid === 'velichina');
  for (const v of zapisi) {
    if (v.rol === 'part-x' || v.rol === 'part-y')
      sch.fakt(
        'запись части — через переменную, не число',
        sPeremennoy(v.tekst),
        `${id}: ${v.tekst}`,
      );
  }
  for (const o of el.filter(
    (x) => x.vid === 'otrezok' && (x.rol === 'part-x' || x.rol === 'part-y'),
  )) {
    const est = zapisi.some(
      (v) =>
        v.rol === o.rol &&
        'otrezok' in v.yakor &&
        sPeremennoy(v.tekst) &&
        ((odnaTochka(v.yakor.otrezok[0], o.a) && odnaTochka(v.yakor.otrezok[1], o.b)) ||
          (odnaTochka(v.yakor.otrezok[0], o.b) && odnaTochka(v.yakor.otrezok[1], o.a))),
    );
    sch.fakt('цветная линия части — только у части через переменную', est, `${id}: ${o.id}`);
  }
  const poShtriham = new Map();
  for (const o of el.filter((x) => x.vid === 'otrezok' && x.shtrihi !== undefined)) {
    const cvet = cvetLinii(o.rol);
    const byl = poShtriham.get(o.shtrihi);
    if (byl === undefined) poShtriham.set(o.shtrihi, { cvet, rol: o.rol, id: o.id });
    else
      sch.fakt(
        'равные отрезки (одинаковые засечки) — одного цвета и вида',
        byl.cvet === cvet && byl.rol === o.rol,
        `${id}: ${byl.id} и ${o.id}`,
      );
  }
  const plIshchetsya = /Найдите площадь/.test(tekstB);
  const iskomaya = el.filter((x) => x.vid === 'mnogougolnik' && x.rol === 'region-sought');
  const podpisIskomoy = zapisi.filter((v) => /= \?$/.test(v.tekst));
  sch.fakt(
    'площадь ищется — искомая фигура на чертеже',
    !plIshchetsya || iskomaya.length === 1,
    id,
  );
  sch.fakt('площадь ищется — подпись «S = ?»', !plIshchetsya || podpisIskomoy.length === 1, id);
  sch.fakt('площадь не ищется — искомой фигуры нет', plIshchetsya || iskomaya.length === 0, id);
  for (const v of podpisIskomoy)
    sch.fakt(
      'подпись «S = ?» — роль region-sought',
      v.rol === 'region-sought',
      `${id}: ${v.tekst}`,
    );
  for (const v of zapisi.filter((x) => /^S_/.test(x.tekst) && !/= \?$/.test(x.tekst)))
    sch.fakt('данная площадь — роль region', v.rol === 'region', `${id}: ${v.tekst}`);
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
        sch.fakt(
          'запись площади — роль region (данная) или region-sought (искомая)',
          v.rol === (/= \?$/.test(tekst) ? 'region-sought' : 'region'),
          `${t.id}: ${tekst}`,
        );
    }
    for (const o of el.filter((x) => x.vid === 'otrezok' && x.shtrihi !== undefined && !x.skrytyy))
      sch.fakt(
        'у отрезка с засечками есть роль (засечки — его цвета)',
        o.rol !== undefined,
        `${t.id}: ${o.id}`,
      );
    for (const t2 of t.varianty) proveritCveta(sch, t.id, scena18(t.id, t2), t.tekst(t2).b);
  }
  /* Опорные задачи №18: те же правила цвета и площадей на их чертежах. */
  const { OPORNYE_18 } = requireSrc('content/zadanie18/opornye');
  const { trebuetsyaScenaOpornoy18 } = requireSrc('lib/zadanie18/opornye');
  for (const o of OPORNYE_18)
    proveritCveta(sch, `опорная ${o.no}`, trebuetsyaScenaOpornoy18(o.id), o.b);
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
