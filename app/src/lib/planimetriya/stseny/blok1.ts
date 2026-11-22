/**
 * Блок I. Углы в треугольнике: равнобедренный, внешний угол,
 * медиана, биссектриса и высота из прямого угла, биссектриса угла.
 * Прототипы 1–9 (задачи 1–36 Блока 1).
 */

import { poUglam, ravnobedrennyy } from '../figury';
import { podobrat } from '../skhema';
import type { Scena } from '../types';
import {
  type PrototipChertezha,
  gr,
  grTex,
  klyuch,
  otr,
  prod,
  pryam,
  shtrih,
  tri,
  ug,
} from './dsl';

const VGRADUSAH = 'Ответ дайте в градусах.';

/**
 * Наименьший угол сцен с биссектрисой прямого угла: она делит 90° на
 * 45° и 45°, и две части одной половины не могут быть обе больше 22,5°.
 */
const UGOL_BISSEKTRISY = 20;

/* 1–2. Равнобедренный треугольник AC = BC: угол при основании ↔ угол C. */
type Vershina = 'A' | 'B' | 'C';
const UGOL_PRI: Record<Vershina, readonly [string, string, string]> = {
  A: ['C', 'A', 'B'],
  B: ['A', 'B', 'C'],
  C: ['A', 'C', 'B'],
};

function ravnobedrennayaStsena(
  apex: number,
  porog: number,
  dano: Vershina,
  iskomoe: Vershina,
  danoZn: number,
  ans: number,
): Scena {
  void porog;
  const [da, dv, db] = UGOL_PRI[dano];
  const [ia, iv, ib] = UGOL_PRI[iskomoe];
  /* Шаг 1: «углы при основании равны» — дуга на втором угле при основании. */
  const vtoroy: Vershina = dano === 'C' ? (iskomoe === 'A' ? 'B' : 'A') : dano === 'A' ? 'B' : 'A';
  const [oa, ov, ob] = UGOL_PRI[vtoroy];
  return podobrat(
    klyuch('ravn', [apex, dano, iskomoe]),
    { g: apex },
    { g: [20, 150] },
    ({ g }) => ({
      tochki: ravnobedrennyy(g),
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1, { podsvetka: [1] }),
        shtrih('B', 'C', 1, { podsvetka: [1] }),
        ug(da, dv, db, { vydelit: 'dano', znachenie: gr(danoZn) }),
        ug(
          oa,
          ov,
          ob,
          dano === 'C' ? { sloy: 1 } : { sloy: 1, vydelit: 'dano', znachenie: gr(danoZn) },
        ),
        ug(ia, iv, ib, { vydelit: 'iskomoe', znachenie: gr(ans), otvet: true, podsvetka: [2] }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: apex },
      ],
      otvet: gr(ans),
      shagov: 2,
    }),
  );
}

export const BLOK_I: PrototipChertezha[] = [
  {
    id: 1,
    blok: 'I',
    nazvanie: 'Равнобедренный: угол при основании → угол при вершине',
    fipi: [1, 2, 3, 4],
    uslovie: (p) =>
      `В треугольнике $ABC$ угол $${p.v ? 'B' : 'A'}$ равен $${grTex(p.a)}$, стороны $AC$ и $BC$ равны. Найдите угол $C$. ${VGRADUSAH}`,
    otvet: (p) => 180 - 2 * p.a,
    primer: { a: 37, v: 0 },
    sluchaynye: (r) => ({ a: r.int(5, 88), v: r.int(0, 1) }),
    stsena: (p, porog) =>
      ravnobedrennayaStsena(180 - 2 * p.a, porog, p.v ? 'B' : 'A', 'C', p.a, 180 - 2 * p.a),
  },
  {
    id: 2,
    blok: 'I',
    nazvanie: 'Равнобедренный: угол при вершине → угол при основании',
    fipi: [5, 6, 7, 8],
    uslovie: (p) =>
      `В треугольнике $ABC$ угол $C$ равен $${grTex(p.c)}$, стороны $AC$ и $BC$ равны. Найдите угол $${p.v ? 'B' : 'A'}$. ${VGRADUSAH}`,
    otvet: (p) => (180 - p.c) / 2,
    primer: { c: 102, v: 0 },
    sluchaynye: (r) => ({ c: r.int(2, 176), v: r.int(0, 1) }),
    stsena: (p, porog) =>
      ravnobedrennayaStsena(p.c, porog, 'C', p.v ? 'B' : 'A', p.c, (180 - p.c) / 2),
  },
  {
    id: 3,
    blok: 'I',
    nazvanie: 'Равнобедренный: внешний угол при $B$ → угол $C$',
    fipi: [9, 10, 11, 12],
    uslovie: (p) =>
      `В треугольнике $ABC$ стороны $AC$ и $BC$ равны. Внешний угол при вершине $B$ равен $${grTex(p.b)}$. Найдите угол $C$. ${VGRADUSAH}`,
    otvet: (p) => 2 * p.b - 180,
    primer: { b: 107 },
    /* b = 120: подсказка «угол B = 60°» совпала бы с ответом. */
    sluchaynye: (r) => {
      const b = r.int(91, 178);
      return { b: b === 120 ? 121 : b };
    },
    stsena: (p) => {
      const apex = 2 * p.b - 180;
      return podobrat(klyuch(3, p), { g: apex }, { g: [20, 150] }, ({ g }) => ({
        tochki: { ...ravnobedrennyy(g), D: { naPryamoy: ['A', 'B', 1.2] } },
        elementy: [
          tri('A', 'B', 'C'),
          shtrih('A', 'C', 1),
          shtrih('B', 'C', 1),
          prod('A', 'B', { doTochki: 'D', sploshnoe: true }),
          ug('C', 'B', 'D', { vydelit: 'dano', znachenie: gr(p.b) }),
          ug('A', 'B', 'C', { sloy: 1, znachenie: gr(180 - p.b) }),
          ug('C', 'A', 'B', { sloy: 2, znachenie: gr(180 - p.b) }),
          ug('A', 'C', 'B', {
            vydelit: 'iskomoe',
            znachenie: gr(apex),
            otvet: true,
            podsvetka: [3],
          }),
        ],
        proverki: [
          {
            ravny: [
              ['A', 'C'],
              ['B', 'C'],
            ],
          },
          { ugol: ['C', 'B', 'D'], gradusy: p.b },
        ],
        otvet: gr(apex),
        shagov: 3,
      }));
    },
  },
  {
    id: 4,
    blok: 'I',
    nazvanie: 'Медиана к гипотенузе: угол $B$ → угол $ACD$',
    fipi: [13, 14, 15, 16],
    uslovie: (p) =>
      `В треугольнике $ABC$ $CD$ — медиана, угол $C$ равен $90^\\circ$, угол $B$ равен $${grTex(p.b)}$. Найдите угол $ACD$. ${VGRADUSAH}`,
    otvet: (p) => 90 - p.b,
    primer: { b: 35 },
    sluchaynye: (r) => ({ b: r.int(3, 87) }),
    stsena: (p) =>
      podobrat(klyuch(4, p), { b: p.b }, { b: [15, 75] }, ({ b }) => ({
        tochki: { ...poUglam(90 - b, b), D: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          otr('C', 'D'),
          pryam('A', 'C', 'B'),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(p.b) }),
          ug('A', 'C', 'D', {
            vydelit: 'iskomoe',
            znachenie: gr(90 - p.b),
            otvet: true,
            podsvetka: [2],
          }),
          shtrih('A', 'D', 1, { sloy: 1 }),
          shtrih('D', 'B', 1, { sloy: 1 }),
          shtrih('C', 'D', 1, { sloy: 1 }),
          ug('B', 'A', 'C', { sloy: 2, dugi: 2, znachenie: gr(90 - p.b), otvet: true }),
        ],
        proverki: [
          { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
          {
            ravny: [
              ['A', 'D'],
              ['B', 'D'],
              ['C', 'D'],
            ],
          },
        ],
        otvet: gr(90 - p.b),
      })),
  },
  {
    id: 5,
    blok: 'I',
    nazvanie: 'Угол между биссектрисой и медианой из прямого угла',
    fipi: [17, 18, 19, 20],
    uslovie: (p) =>
      `Острый угол $B$ прямоугольного треугольника $ABC$ равен $${grTex(p.b)}$. Найдите величину угла между биссектрисой $CD$ и медианой $CM$, проведёнными из вершины прямого угла $C$. ${VGRADUSAH}`,
    otvet: (p) => Math.abs(45 - p.b),
    primer: { b: 21 },
    sluchaynye: (r) => ({ b: r.int(3, 87) }),
    stsena: (p) => {
      const ans = Math.abs(45 - p.b);
      /* Жёсткая конфигурация: биссектриса делит прямой угол на 45° и
         45°, медиана отсекает от одной половины угол, равный острому
         углу треугольника. Оба — искомый и меньший острый — не могут
         быть больше 22,5°: рисуются наибольшими возможными. */
      return podobrat(
        klyuch(5, p),
        { b: p.b },
        { b: p.b <= 45 ? [10, 44] : [46, 80] },
        ({ b }) => ({
          tochki: {
            ...poUglam(90 - b, b),
            D: { bissektrisa: ['C', 'A', 'B'] },
            M: { seredina: ['A', 'B'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('C', 'D'),
            otr('C', 'M'),
            pryam('A', 'C', 'B'),
            ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(p.b) }),
            ug('D', 'C', 'M', {
              vydelit: 'iskomoe',
              znachenie: gr(ans),
              otvet: true,
              podsvetka: [3],
            }),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('C', 'M', 1, { sloy: 1 }),
            ug('M', 'C', 'B', { sloy: 1, dugi: 2, znachenie: gr(p.b) }),
            ug('D', 'C', 'B', { sloy: 2, znachenie: '45°' }),
          ],
          proverki: [
            { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
            { ugol: ['A', 'B', 'C'], gradusy: p.b },
          ],
          otvet: gr(ans),
        }),
        { minUgol: UGOL_BISSEKTRISY },
      );
    },
  },
  {
    id: 6,
    blok: 'I',
    nazvanie: 'Угол между высотой и биссектрисой из прямого угла → меньший угол',
    fipi: [21, 22, 23, 24],
    uslovie: (p) =>
      `В прямоугольном треугольнике угол между высотой и биссектрисой, проведёнными из вершины прямого угла, равен $${grTex(p.f)}$. Найдите меньший угол прямоугольного треугольника. ${VGRADUSAH}`,
    otvet: (p) => 45 - p.f,
    primer: { f: 14 },
    sluchaynye: (r) => ({ f: r.int(1, 44) }),
    stsena: (p) =>
      podobrat(
        klyuch(6, p),
        { f: p.f },
        { f: [8, 37] },
        ({ f }) => ({
          tochki: {
            ...poUglam(45 - f, 45 + f),
            H: { osnovanie: ['C', 'A', 'B'] },
            L: { bissektrisa: ['C', 'A', 'B'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('C', 'H'),
            pryam('C', 'H', 'B'),
            otr('C', 'L'),
            pryam('A', 'C', 'B'),
            ug('L', 'C', 'H', { vydelit: 'dano', znachenie: gr(p.f) }),
            ug('C', 'A', 'B', {
              vydelit: 'iskomoe',
              znachenie: gr(45 - p.f),
              otvet: true,
              podsvetka: [3],
            }),
            ug('L', 'C', 'B', { sloy: 1, znachenie: '45°' }),
            ug('H', 'C', 'B', { sloy: 2, dugi: 2 }),
            ug('C', 'A', 'H', { sloy: 2, dugi: 2 }),
          ],
          podpisi: false,
          podpisiPodskazki: ['A', 'B', 'C', 'H', 'L'],
          proverki: [
            { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
            { ugol: ['L', 'C', 'H'], gradusy: p.f },
          ],
          otvet: gr(45 - p.f),
        }),
        { minUgol: UGOL_BISSEKTRISY },
      ),
  },
  {
    id: 7,
    blok: 'I',
    nazvanie: 'Угол между биссектрисой и медианой из прямого угла → меньший угол',
    fipi: [25, 26, 27, 28],
    uslovie: (p) =>
      `Угол между биссектрисой и медианой прямоугольного треугольника, проведёнными из вершины прямого угла, равен $${grTex(p.f)}$. Найдите меньший угол прямоугольного треугольника. ${VGRADUSAH}`,
    otvet: (p) => 45 - p.f,
    primer: { f: 12 },
    sluchaynye: (r) => ({ f: r.int(1, 44) }),
    stsena: (p) =>
      podobrat(
        klyuch(7, p),
        { f: p.f },
        { f: [8, 37] },
        ({ f }) => ({
          tochki: {
            ...poUglam(45 - f, 45 + f),
            M: { seredina: ['A', 'B'] },
            L: { bissektrisa: ['C', 'A', 'B'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('C', 'M'),
            otr('C', 'L'),
            pryam('A', 'C', 'B'),
            ug('M', 'C', 'L', { vydelit: 'dano', znachenie: gr(p.f) }),
            ug('C', 'A', 'B', {
              vydelit: 'iskomoe',
              znachenie: gr(45 - p.f),
              otvet: true,
              podsvetka: [2, 3],
            }),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('C', 'M', 1, { sloy: 1 }),
            ug('A', 'C', 'M', { sloy: 2, dugi: 2 }),
            ug('A', 'C', 'L', { sloy: 3, znachenie: '45°' }),
          ],
          podpisi: false,
          podpisiPodskazki: ['A', 'B', 'C', 'M', 'L'],
          proverki: [
            { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
            { ugol: ['M', 'C', 'L'], gradusy: p.f },
          ],
          otvet: gr(45 - p.f),
        }),
        { minUgol: UGOL_BISSEKTRISY },
      ),
  },
  {
    id: 8,
    blok: 'I',
    nazvanie: 'Острые углы → угол между высотой и медианой',
    fipi: [29, 30, 31, 32],
    uslovie: (p) =>
      `Острые углы прямоугольного треугольника равны $${grTex(p.a)}$ и $${grTex(90 - p.a)}$. Найдите угол между высотой и медианой, проведёнными из вершины прямого угла. ${VGRADUSAH}`,
    otvet: (p) => Math.abs(90 - 2 * p.a),
    primer: { a: 84 },
    /* a = 60: меньший угол 30° совпал бы с ответом. */
    sluchaynye: (r) => {
      const a = r.int(46, 89);
      return { a: a === 60 ? 61 : a };
    },
    stsena: (p) => {
      const bolshiy = Math.max(p.a, 90 - p.a);
      const menshiy = 90 - bolshiy;
      const ans = bolshiy - menshiy;
      /* Меньший угол m и угол между высотой и медианой 90° − 2m оба
         видны только при m около 28°–31°: форма почти одна и та же. */
      return podobrat(
        klyuch(8, p),
        { m: menshiy },
        { m: [15, 44] },
        ({ m }) => ({
          tochki: {
            ...poUglam(m, 90 - m),
            H: { osnovanie: ['C', 'A', 'B'] },
            M: { seredina: ['A', 'B'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('C', 'H'),
            pryam('C', 'H', 'B'),
            otr('C', 'M'),
            pryam('A', 'C', 'B'),
            ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(menshiy) }),
            ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(bolshiy) }),
            ug('M', 'C', 'H', {
              vydelit: 'iskomoe',
              znachenie: gr(ans),
              otvet: true,
              podsvetka: [3],
            }),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('C', 'M', 1, { sloy: 1 }),
            ug('A', 'C', 'M', { sloy: 1, dugi: 2, znachenie: gr(menshiy) }),
            ug('H', 'C', 'B', { sloy: 2, dugi: 2, znachenie: gr(menshiy) }),
          ],
          podpisi: ['A', 'B', 'C'],
          podpisiPodskazki: ['H', 'M'],
          proverki: [{ ugol: ['A', 'C', 'B'], vid: 'pryamoy' }],
          otvet: gr(ans),
        }),
        { minUgol: UGOL_BISSEKTRISY },
      );
    },
  },
  {
    id: 9,
    blok: 'I',
    nazvanie: 'Биссектриса $AD$: углы $C$ и $CAD$ → угол $B$',
    fipi: [33, 34, 35, 36],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AD$ — биссектриса, угол $C$ равен $${grTex(p.c)}$, угол $CAD$ равен $${grTex(p.d)}$. Найдите угол $B$. ${VGRADUSAH}`,
    otvet: (p) => 180 - p.c - 2 * p.d,
    primer: { c: 104, d: 6 },
    sluchaynye: (r) => {
      const c = r.int(20, 140);
      let d = r.int(2, Math.floor((178 - c) / 2) - 1);
      /* Угол BAC = 2d подписан в подсказке: он не должен совпасть с ответом. */
      if (180 - c - 2 * d === 2 * d) d -= 1;
      return { c, d };
    },
    stsena: (p) => {
      const b = 180 - p.c - 2 * p.d;
      /* Половина угла A меньше всех углов рисунка: при тупом угле C
         она не может быть больше 22°. */
      return podobrat(
        klyuch(9, p),
        { d: p.d, c: p.c },
        { d: [12, 60], c: [25, 140] },
        ({ d, c }) => {
          /* Основание AC горизонтально, B сверху: как на рисунках ФИПИ. */
          const t = poUglam(2 * d, c);
          return {
            tochki: { A: t.A, C: t.B, B: t.C, D: { bissektrisa: ['A', 'B', 'C'] } },
            elementy: [
              tri('A', 'C', 'B'),
              otr('A', 'D'),
              ug('C', 'A', 'D', { vydelit: 'dano', znachenie: gr(p.d) }),
              ug('D', 'A', 'B'),
              ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.c) }),
              ug('A', 'B', 'C', {
                vydelit: 'iskomoe',
                znachenie: gr(b),
                otvet: true,
                podsvetka: [2],
              }),
              ug('C', 'A', 'B', { sloy: 1, dugi: 2, znachenie: gr(2 * p.d) }),
            ],
            proverki: [{ naPryamoy: ['B', 'D', 'C'] }],
            otvet: gr(b),
          };
        },
        { minUgol: 18 },
      );
    },
  },
];
