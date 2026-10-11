/**
 * Блок I. Углы в треугольнике: равнобедренный, внешний угол,
 * медиана, биссектриса и высота из прямого угла, биссектриса угла.
 * Прототипы 1–9 (задачи 1–36 Блока 1).
 */

import { poUglam, ravnobedrennyy } from '../figury';
import type { Scena } from '../types';
import {
  type PrototipChertezha,
  clamp,
  gr,
  grTex,
  otr,
  prod,
  pryam,
  razdelit,
  scena,
  shtrih,
  tri,
  ug,
} from './dsl';

const VGRADUSAH = 'Ответ дайте в градусах.';

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
  const apexVis = clamp(apex, porog, 180 - 2 * porog);
  const { A, B, C } = ravnobedrennyy(apexVis);
  const [da, dv, db] = UGOL_PRI[dano];
  const [ia, iv, ib] = UGOL_PRI[iskomoe];
  /* Шаг 1: «углы при основании равны» — дуга на втором угле при основании. */
  const vtoroy: Vershina = dano === 'C' ? (iskomoe === 'A' ? 'B' : 'A') : dano === 'A' ? 'B' : 'A';
  const [oa, ov, ob] = UGOL_PRI[vtoroy];
  return scena(
    {
      tochki: { A, B, C },
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
    },
    apexVis !== apex,
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
    stsena: (p, porog) => {
      const apex = 2 * p.b - 180;
      const apexVis = clamp(apex, porog, 180 - 2 * porog);
      const { A, B, C } = ravnobedrennyy(apexVis);
      return scena(
        {
          tochki: { A, B, C, D: { naPryamoy: ['A', 'B', 1.4] } },
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
        },
        apexVis !== apex,
      );
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
    stsena: (p, porog) => {
      const bVis = clamp(p.b, porog, 90 - porog);
      const { A, B, C } = poUglam(90 - bVis, bVis);
      return scena(
        {
          tochki: { A, B, C, D: { seredina: ['A', 'B'] } },
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
        },
        bVis !== p.b,
      );
    },
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
    stsena: (p, porog) => {
      /* |45 − B| не меньше порога, сторона от 45° сохраняется. */
      const znak = p.b <= 45 ? -1 : 1;
      let bVis = clamp(p.b, porog, 90 - porog);
      if (Math.abs(45 - bVis) < porog) bVis = 45 + znak * porog;
      const { A, B, C } = poUglam(90 - bVis, bVis);
      const ans = Math.abs(45 - p.b);
      return scena(
        {
          tochki: { A, B, C, D: { bissektrisa: ['C', 'A', 'B'] }, M: { seredina: ['A', 'B'] } },
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
        },
        bVis !== p.b,
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
    stsena: (p, porog) => {
      const fVis = clamp(p.f, porog, 45 - porog);
      const a = 45 - fVis;
      const { A, B, C } = poUglam(a, 90 - a);
      return scena(
        {
          tochki: {
            A,
            B,
            C,
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
          proverki: [
            { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
            { ugol: ['L', 'C', 'H'], gradusy: p.f },
          ],
          otvet: gr(45 - p.f),
        },
        fVis !== p.f,
      );
    },
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
    stsena: (p, porog) => {
      const fVis = clamp(p.f, porog, 45 - porog);
      const a = 45 - fVis;
      const { A, B, C } = poUglam(a, 90 - a);
      return scena(
        {
          tochki: { A, B, C, M: { seredina: ['A', 'B'] }, L: { bissektrisa: ['C', 'A', 'B'] } },
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
          proverki: [
            { ugol: ['A', 'C', 'B'], vid: 'pryamoy' },
            { ugol: ['M', 'C', 'L'], gradusy: p.f },
          ],
          otvet: gr(45 - p.f),
        },
        fVis !== p.f,
      );
    },
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
    stsena: (p, porog) => {
      const bolshiy = Math.max(p.a, 90 - p.a);
      const menshiy = 90 - bolshiy;
      const mVis = clamp(menshiy, porog, (90 - porog) / 2);
      const { A, B, C } = poUglam(mVis, 90 - mVis);
      const ans = bolshiy - menshiy;
      return scena(
        {
          tochki: { A, B, C, H: { osnovanie: ['C', 'A', 'B'] }, M: { seredina: ['A', 'B'] } },
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
          proverki: [{ ugol: ['A', 'C', 'B'], vid: 'pryamoy' }],
          otvet: gr(ans),
        },
        mVis !== menshiy,
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
    stsena: (p, porog) => {
      const b = 180 - p.c - 2 * p.d;
      const dVis = Math.max(p.d, porog / 1);
      const [cVis] = razdelit(180 - 2 * dVis, p.c, b, porog);
      /* Основание AC горизонтально, B сверху: как на рисунках ФИПИ. */
      const t = poUglam(2 * dVis, cVis);
      return scena(
        {
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
        },
        dVis !== p.d || Math.abs(cVis - p.c) > 1e-9,
      );
    },
  },
];
