#!/usr/bin/env node
/* scripts/check-chertezh3.mjs — автотест чертежей задания №3.

   Запуск: pnpm test:chertezh3

   Проверяется:
     — видимость рёбер общим ядром (lib/stereo) при разных ракурсах:
       куб, правильная пирамида, призмы, составные тела (объединение
       и вычитание блоков); правило граней и луч к зрителю дают
       одно и то же на выпуклых телах;
     — сборка составного тела по сетке: склейка блоков, число рёбер;
     — валидатор сценариев: годный сценарий проходит, каждая ошибка
       ловится (несуществующая точка, повтор id и имён, размер не
       сходится с условием, подпись числа, которого нет в условии,
       дубль подписи, неплоский многоугольник, ссылка шага, тело
       вращения);
     — банк: все варианты многогранников (разделы I–III) собираются
       из условий и проходят валидатор; ссылки шагов ведут на
       элементы; у ученика нет вспомогательных построений;
     — подписи: не налезают друг на друга и не ложатся на линии —
       при трёх ракурсах на каждый вариант;
     — печать: листы ученика и учителя по одному адресу — один набор.

   Ненулевой код возврата — есть проблемы, они печатаются списком. */

import { requireSrc } from './lib/load-ts.mjs';

const S = requireSrc('lib/stereo/index.ts');
const C = requireSrc('lib/chertezh3/index.ts');
const G = requireSrc('lib/chertezh3/geometriya.ts');
const B = requireSrc('lib/zadanie3/chertezhi/index.ts');
const Z = requireSrc('lib/zadanie3/index.ts');
const PD = requireSrc('lib/zadanie3/pechat-dannye.ts');
const PL = requireSrc('lib/zadanie3/pechat.ts');

const problems = [];
let checks = 0;
const ok = (cond, what) => {
  checks += 1;
  if (!cond) problems.push(what);
};
const eq = (got, want, what) => ok(got === want, `${what}: ${got} вместо ${want}`);

const kam = (azimut, vysota) => ({ vid: 'orto', k: S.napravlenie({ azimut, vysota }) });

/** Линии тела сценария при ракурсе; невидимые — ключами рёбер. */
function rebra(sc, azimut, vysota) {
  const scena = C.postroit(sc);
  return scena.telo.linii(kam(azimut, vysota));
}
const skrytye = (ls) => [...new Set(ls.filter((l) => !l.vidno).map((l) => l.id))].sort();

const KUB = {
  id: 'kub',
  alt: 'куб',
  telo: { vid: 'kub', a: 4 },
  imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
};

/* ── Видимость: куб ─────────────────────────────────────── */
{
  // Спереди-справа-сверху: невидимы три ребра из D.
  eq(skrytye(rebra(KUB, 24, 24)).join(' '), 'A-D C-D D-D1', 'куб, справа сверху — невидимые');
  // Спереди-слева-сверху: невидимы рёбра из C.
  eq(skrytye(rebra(KUB, -30, 25)).join(' '), 'B-C C-C1 C-D', 'куб, слева сверху — невидимые');
  // Справа снизу: невидимы рёбра из D1.
  eq(skrytye(rebra(KUB, 30, -25)).join(' '), 'A1-D1 C1-D1 D-D1', 'куб, справа снизу — невидимые');
  // Сзади-справа-сверху (азимут 150): ближе всех C1, невидима A.
  eq(skrytye(rebra(KUB, 150, 25)).join(' '), 'A-A1 A-B A-D', 'куб, сзади сверху — невидимые');
}

/* ── Видимость: пирамида и призмы ───────────────────────── */
{
  const P = {
    id: 'p',
    alt: 'p',
    telo: { vid: 'piramida', n: 4, a: 4, h: 4 },
    imena: ['A', 'B', 'C', 'D', 'S'],
  };
  eq(skrytye(rebra(P, 24, 85)).length, 0, 'пирамида сверху — все рёбра видны');
  eq(
    skrytye(rebra(P, 24, 60)).join(' '),
    'C-D',
    'пирамида, круто сверху — скрыто заднее ребро основания',
  );
  eq(
    skrytye(rebra(P, 24, -85)).join(' '),
    'A-S B-S C-S D-S',
    'пирамида снизу — боковые рёбра скрыты',
  );
  eq(
    skrytye(rebra(P, 24, 20)).join(' '),
    'A-D C-D D-S',
    'пирамида, школьный ракурс — скрыты рёбра из D',
  );
  const T = {
    id: 't',
    alt: 't',
    telo: { vid: 'prizma', n: 3, a: 4, h: 4 },
    imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
  };
  eq(skrytye(rebra(T, 24, 24)).join(' '), 'A-C B-C C-C1', 'треугольная призма — скрыты рёбра из C');
  const H = {
    id: 'h',
    alt: 'h',
    telo: { vid: 'prizma', n: 6, a: 2, h: 4 },
    imena: ['A', 'B', 'C', 'D', 'E', 'F', 'A1', 'B1', 'C1', 'D1', 'E1', 'F1'],
  };
  const h = skrytye(rebra(H, 24, 24));
  ok(
    h.includes('E-E1') && h.includes('D-E') && h.includes('E-F'),
    `шестиугольная призма: скрыты рёбра из E (${h})`,
  );
  ok(
    !h.some((x) => x.includes('1-') || (/1$/.test(x.split('-')[0]) && /1$/.test(x.split('-')[1]))),
    'шестиугольная призма: верхнее основание видно целиком',
  );
}

/* ── Правило граней = луч к зрителю (выпуклые тела) ─────── */
{
  const tela = [
    KUB,
    {
      id: 'p6',
      alt: '',
      telo: { vid: 'piramida', n: 6, a: 2, h: 5 },
      imena: ['A', 'B', 'C', 'D', 'E', 'F', 'S'],
    },
    { id: 'tet', alt: '', telo: { vid: 'tetraedr', a: 3 }, imena: ['A', 'B', 'C', 'D'] },
    {
      id: 'pr',
      alt: '',
      telo: { vid: 'parallelepiped', a: 5, b: 2, c: 3 },
      imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    },
  ];
  let raznye = 0;
  for (const sc of tela) {
    const scena = C.postroit(sc);
    const luch = S.izChastey(
      scena.telo.chasti,
      scena.telo.chasti[0].rebra.map((r, i) => ({ a: r.a, b: r.b, id: `r${i}` })),
      scena.geom.razmer,
    );
    for (let az = -170; az <= 180; az += 37) {
      for (const v of [-70, -35, -5, 15, 40, 80]) {
        const k = kam(az, v);
        const f = scena.telo.linii(k).map((l) => l.vidno);
        const r = scena.telo.chasti[0].rebra.map((_, i) =>
          luch
            .linii(k)
            .filter((l) => l.id === `r${i}`)
            .every((l) => l.vidno),
        );
        f.forEach((x, i) => {
          if (x !== r[i]) raznye += 1;
        });
      }
    }
  }
  eq(raznye, 0, 'выпуклые тела: правило граней и луч расходятся');
}

/* ── Составное тело ─────────────────────────────────────── */
{
  // Два блока встык — это один параллелепипед: 12 рёбер, как у бокса.
  const dva = G.sostavnoe([
    { op: '+', ot: [0, 0, 0], razmer: [2, 3, 2] },
    { op: '+', ot: [2, 0, 0], razmer: [2, 3, 2] },
  ]);
  eq(dva.rebraSostavnogo.length, 12, 'два блока встык — рёбер');
  eq(dva.obem, 24, 'два блока встык — объём');
  // Куб без угла: V = 14, F = 9, E = 21 (Эйлер).
  const ugol = G.sostavnoe([
    { op: '+', ot: [0, 0, 0], razmer: [2, 2, 2] },
    { op: '-', ot: [1, 0, 1], razmer: [1, 1, 1] },
  ]);
  eq(ugol.rebraSostavnogo.length, 21, 'куб без угла — рёбер (Эйлер)');
  eq(ugol.obem, 7, 'куб без угла — объём');
  // Вырез у переднего правого верхнего угла виден целиком спереди-справа-сверху.
  const sc = {
    id: 'u',
    alt: '',
    telo: {
      vid: 'sostavnoy',
      bloki: [
        { op: '+', ot: [0, 0, 0], razmer: [2, 2, 2] },
        { op: '-', ot: [1, 0, 1], razmer: [1, 1, 1] },
      ],
    },
  };
  const scena = C.postroit(sc);
  const ls = scena.telo.linii(kam(24, 24));
  const vnutr = scena.geom.rebraSostavnogo.filter((r) =>
    [r.a, r.b].some((p) => p[0] === 1 && p[1] === 1 && p[2] === 1),
  );
  eq(vnutr.length, 3, 'вырез: рёбер из внутренней вершины');
  ok(
    vnutr.every((r) => ls.filter((l) => l.id === r.id).every((l) => l.vidno)),
    'вырез спереди-справа-сверху: внутренние рёбра видны',
  );
  // Сзади-слева-снизу внутренняя вершина не видна.
  const ls2 = scena.telo.linii(kam(-150, -30));
  ok(
    vnutr.every((r) => ls2.filter((l) => l.id === r.id).some((l) => !l.vidno)),
    'вырез сзади-слева-снизу: внутренние рёбра скрыты',
  );
  // Ступенька: задняя нижняя левая вершина скрыта, вогнутое ребро видно сверху.
  const st = {
    id: 's',
    alt: '',
    telo: {
      vid: 'sostavnoy',
      bloki: [
        { op: '+', ot: [0, 0, 0], razmer: [5, 4, 2] },
        { op: '+', ot: [0, 0, 2], razmer: [2, 4, 1] },
      ],
    },
  };
  const sc2 = C.postroit(st);
  const ls3 = sc2.telo.linii(kam(24, 24));
  const vognutoe = sc2.geom.rebraSostavnogo.find(
    (r) => r.a[0] === 2 && r.b[0] === 2 && r.a[2] === 2 && r.b[2] === 2,
  );
  ok(
    vognutoe && ls3.filter((l) => l.id === vognutoe.id).every((l) => l.vidno),
    'ступенька: вогнутое ребро видно сверху',
  );
  const zad = sc2.geom.rebraSostavnogo.filter(
    (r) =>
      [r.a, r.b].every((p) => p[0] === 0 || p[1] === 4 || p[2] === 0) &&
      [r.a, r.b].some((p) => p[0] === 0 && p[1] === 4 && p[2] === 0),
  );
  ok(
    zad.length === 3 && zad.every((r) => ls3.filter((l) => l.id === r.id).every((l) => !l.vidno)),
    'ступенька: рёбра из задней нижней левой вершины скрыты',
  );
}

/* ── Валидатор ──────────────────────────────────────────── */
{
  const base = {
    id: 'v',
    alt: 'v',
    telo: { vid: 'parallelepiped', a: 6, b: 3, c: 2 },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    dannye: [{ id: 'd1', na: { otrezok: ['A', 'B'] }, tekst: '6' }],
    elementy: [{ id: 'AC1', vid: 'diagonal', tochki: ['A', 'C1'], rol: 'uslovie' }],
    proverki: [{ dlina: ['A', 'B'], ravno: 6 }],
  };
  const usl = 'AB=6, AD=3, AA1=2';
  eq(
    C.validirovat(base, { uslovie: usl, shagi: [['AC1', 'AB', 'd1', 'A']] }).length,
    0,
    'годный сценарий',
  );
  const est = (sc, slovo, what, k = { uslovie: usl }) => {
    const e = C.validirovat(sc, k);
    ok(
      e.some((x) => x.includes(slovo)),
      `${what}: ждали «${slovo}», получили ${JSON.stringify(e)}`,
    );
  };
  est(
    { ...base, elementy: [{ id: 'x', vid: 'otrezok', tochki: ['A', 'Q'] }] },
    'нет точки Q',
    'несуществующая точка',
  );
  est(
    { ...base, elementy: [...base.elementy, { id: 'AC1', vid: 'otrezok', tochki: ['A', 'B'] }] },
    'id повторяются',
    'повтор id',
  );
  est(
    { ...base, tochki: [{ imya: 'A', gde: { xyz: [0, 0, 0] } }] },
    'названа дважды',
    'повтор имени',
  );
  est(
    { ...base, proverki: [{ dlina: ['A', 'B'], ravno: 7 }] },
    'в условии 7',
    'размер не сходится с условием',
  );
  est(
    { ...base, dannye: [{ id: 'd1', na: { otrezok: ['A', 'B'] }, tekst: '9' }] },
    'такого числа нет в условии',
    'подпись не из условия',
  );
  est(
    { ...base, dannye: [...base.dannye, { id: 'd2', na: { otrezok: ['D', 'C'] }, tekst: '6' }] },
    'повторяется',
    'одна величина подписана дважды',
  );
  est(
    { ...base, dannye: [...base.dannye, { id: 'd2', na: { otrezok: ['B', 'A'] }, tekst: '6' }] },
    'подписан дважды',
    'две подписи на одном отрезке',
  );
  est(
    { ...base, elementy: [{ id: 'p', vid: 'mnogougolnik', tochki: ['A', 'B', 'C', 'C1'] }] },
    'не в одной плоскости',
    'неплоский многоугольник',
  );
  est(
    { ...base, elementy: [{ id: 'p', vid: 'otrezok', tochki: ['A', 'B', 'C'] }] },
    'две точки',
    'отрезок из трёх точек',
  );
  est(base, 'ни на что не указывает', 'ссылка шага', { shagi: [['AC']] });
  est(
    { ...base, telo: { vid: 'prizma', n: 5, a: 2, h: 3 } },
    'только 3, 4, 6',
    'пятиугольная призма',
  );
  est({ ...base, telo: { vid: 'cilindr', r: 1, h: 2 } }, 'следующий этап', 'тело вращения');
  est({ ...base, imena: ['A', 'B', 'C'] }, 'имён вершин 3', 'имён меньше, чем вершин');
  est(
    { ...base, elementy: [{ id: 'h', vid: 'vysota', tochki: ['A', 'A1'], podpis: '40' }] },
    'с числом',
    'число в обозначении',
  );
}

/* ── Банк ───────────────────────────────────────────────── */
let variantov = 0;
let peresecheniy = 0;
let naLinii = 0;
const RAKURSY = [
  { azimut: 24, vysota: 24 },
  { azimut: -40, vysota: 35 },
  { azimut: 70, vysota: 10 },
];
const box = (p) => ({ x0: p.x + 1, y0: p.y + 1, x1: p.x + p.w - 1, y1: p.y + p.h - 1 });
for (const p of Z.BANK) {
  if (!B.estScenariy(p)) continue;
  const shagov = p.shagi(p.varianty[0].params).length;
  for (const v of p.varianty) {
    variantov += 1;
    const ch = B.chertezhVarianta(p, v);
    ok(ch.oshibki.length === 0, `${p.id}#${v.n}: ${ch.oshibki.join('; ')}`);
    ok(
      ch.shagi.length <= shagov,
      `${p.id}#${v.n}: ссылок шагов ${ch.shagi.length}, а шагов ${shagov}`,
    );
    const scena = C.postroit(ch.scenariy);
    for (const rk of RAKURSY) {
      const uch = C.kadr(scena, { rakurs: rk, vspom: false, shirina: 320, vysota: 280, kegl: 15 });
      ok(
        !uch.linii.some((l) => l.vid === 'vspom'),
        `${p.id}#${v.n}: у ученика есть вспомогательные построения`,
      );
      const tch = C.kadr(scena, { rakurs: rk, vspom: true, shirina: 320, vysota: 280, kegl: 15 });
      for (const k of [uch, tch]) {
        const bs = k.podpisi.map(box);
        for (let i = 0; i < bs.length; i += 1)
          for (let j = i + 1; j < bs.length; j += 1)
            if (S.overlap(bs[i], bs[j]) > 4) peresecheniy += 1;
        for (const b of bs) {
          const dl = k.linii.reduce((s, l) => s + S.segInBox(l.a, l.b, b), 0);
          if (dl > 6) naLinii += 1;
        }
      }
    }
  }
}
eq(variantov, 510, 'вариантов многогранников');
ok(peresecheniy === 0, `подписи налезают друг на друга: ${peresecheniy}`);
const podpisey = variantov * RAKURSY.length * 2;
ok(naLinii === 0, `подписи лежат на линиях: ${naLinii} (кадров ${podpisey})`);

/* ── Печать: один набор на два листа ─────────────────────── */
for (const r of Z.RAZDELY.filter((x) => x.prototipy.some(B.estScenariy))) {
  const dannye = PD.dannyePechati(r);
  for (const seed of [1, 7, 12345]) {
    const p = { n: 8, seed, theme: 'color' };
    const u = PL.specLista(dannye, r.nazvanie, p, 'uchenik');
    const t = PL.specLista(dannye, r.nazvanie, p, 'uchitel');
    eq(u.nabor.join(','), t.nabor.join(','), `${r.nomer}, seed ${seed}: наборы листов`);
    eq(
      new Set(u.nabor.map((x) => x.split('#')[0])).size,
      8,
      `${r.nomer}, seed ${seed}: прототипы не повторяются`,
    );
    ok(!u.blocks[0].tasks.some((x) => x.solutionHtml), `${r.nomer}: на листе ученика решения`);
    ok(
      t.blocks[0].tasks.every((x) => x.solutionHtml),
      `${r.nomer}: на листе учителя нет решений`,
    );
  }
}

/* ── Тела вращения: половины окружности ─────────────────── */
{
  const o = { centr: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0] };
  const { blizhnyaya } = S.polovinyOkruzhnosti(o, S.napravlenie({ azimut: 0, vysota: 30 }));
  const mid = S.tochkaOkruzhnosti(o, (blizhnyaya[0] + blizhnyaya[1]) / 2);
  ok(mid[1] < -0.99, `ближняя половина основания — к зрителю (${mid})`);
}

console.log(`Проверок чертежей №3: ${checks}`);
console.log(`вариантов: ${variantov}, на проверку прототипов: ${B.spisokNaProverku().length}`);
console.log(`проблем: ${problems.length}`);
for (const p of problems.slice(0, 60)) console.log(`  — ${p}`);
process.exit(problems.length === 0 ? 0 : 1);
