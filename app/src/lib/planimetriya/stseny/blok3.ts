/**
 * Блоки V–IX. Синус, косинус и тангенс острого угла (прототипы
 * 23–32), центральные и вписанные углы и касательные (33–40),
 * вписанная окружность (41–44), описанная окружность (45–48),
 * расширенная теорема синусов (49). Задачи 85–214 Блока 1.
 */

import { RAD } from '../geom';
import {
  opisannayaTrapeciya,
  opisannyyPoStoronam,
  pryamougolnyy,
  ravnobedrennyy,
  vpisannyyPoDugam,
} from '../figury';
import type { Element, Scena } from '../types';
import {
  type Nabor,
  type Params,
  type PrototipChertezha,
  chislo,
  clamp,
  drobTex,
  duga,
  gr,
  grTex,
  koren,
  korenTex,
  mn,
  okr,
  otr,
  pryam,
  pryamaya,
  scena,
  shtrih,
  tex,
  tochka,
  tri,
  ug,
  vysota,
} from './dsl';

const VGRADUSAH = 'Ответ дайте в градусах.';

const storona = (a: string, b: string, zn: string, o: Partial<Element> = {}): Element =>
  ({ tip: 'otrezok', a, b, tolkoShtrihi: true, vydelit: 'dano', znachenie: zn, ...o }) as Element;

/** Прямоугольный треугольник ABC (C = 90°) по углу B: раскладка и проверки. */
function pryamoy(ugolB: number, porog: number, raskladka: 'gipotenuza' | 'katety') {
  const bV = clamp(ugolB, porog, 90 - porog);
  return { t: pryamougolnyy(bV, raskladka), sk: Math.abs(bV - ugolB) > 1e-9 };
}

const PRYAMOY_C = 'В треугольнике $ABC$ угол $C$ равен $90^\\circ$';

/** Окружность радиуса 5 с центром O в начале координат. */
const OKR = { w: { centr: 'O', radius: 5 } } as const;
const O0 = [0, 0] as const;

function vpisannyyChetyrehugolnik(
  dugi: [number, number, number],
  porog: number,
  extra: Element[],
  podpisi: Scena['podpisi'] = true,
  sk = false,
): Scena {
  const v = vpisannyyPoDugam(dugi);
  void porog;
  return scena(
    {
      tochki: { O: O0, ...v },
      okruzhnosti: OKR,
      elementy: [okr('w'), mn(['A', 'B', 'C', 'D']), ...extra],
      podpisi,
      bezPodpisi: ['O'],
      proverki: [{ naOkruzhnosti: 'w', tochki: ['A', 'B', 'C', 'D'] }],
    },
    sk,
  );
}

/** Дуги вписанного четырёхугольника не меньше 2·порога (углы на них не меньше порога). */
function dugiVidimye(
  d: [number, number, number],
  porog: number,
): { d: [number, number, number]; sk: boolean } {
  /* Дуга между соседними вершинами не меньше 36°: вершины не слипаются. */
  const min = Math.max(2 * porog, 36);
  const vse = [...d, 360 - d[0] - d[1] - d[2]];
  if (vse.every((x) => x >= min)) return { d, sk: false };
  const kl = vse.map((x) => Math.max(x, min));
  const s = kl.reduce((a, b) => a + b, 0);
  const zapas = kl.map((x) => x - min);
  const z = zapas.reduce((a, b) => a + b, 0);
  const out = kl.map((x, i) => x - ((s - 360) * zapas[i]!) / z);
  return { d: [out[0]!, out[1]!, out[2]!], sk: true };
}

export const BLOK_V_IX: PrototipChertezha[] = [
  /* ── V. Синус, косинус, тангенс ─────────────────────────────── */
  {
    id: 23,
    blok: 'V',
    nazvanie: '$AC=BC$ и $AB$ → $\\cos A$',
    fipi: [85, 86, 87, 88],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AC=BC=${tex(p.l)}$, $AB=${tex(p.c)}$. Найдите $\\cos A$.`,
    otvet: (p) => p.c / (2 * p.l),
    primer: { l: 16, c: 8 },
    sluchaynye: (r) => {
      const l = r.int(3, 40);
      return { l, c: r.int(1, 2 * l - 1) };
    },
    stsena: (p, porog) => {
      const A0 = Math.acos(p.c / (2 * p.l)) / RAD;
      const aV = clamp(A0, porog, 78);
      return scena(
        {
          tochki: { ...ravnobedrennyy(180 - 2 * aV), H: { seredina: ['A', 'B'] } },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1, { znachenie: chislo(p.l), vydelit: 'dano' }),
            shtrih('B', 'C', 1),
            storona('A', 'B', chislo(p.c)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            ...vysota('C', 'A', 'B', 'H', null, { sloy: 1 }),
            storona('A', 'H', chislo(p.c / 2), { sloy: 2, vydelit: undefined }),
          ],
          proverki: [
            {
              ravny: [
                ['A', 'C'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(p.c / (2 * p.l)),
        },
        Math.abs(aV - A0) > 1e-9,
      );
    },
  },
  {
    id: 24,
    blok: 'V',
    nazvanie: '$BC$ и $\\cos B$ → $AB$',
    fipi: [89, 90, 91, 92],
    uslovie: (p) =>
      `${PRYAMOY_C}, $BC=${tex(p.bc)}$, $\\cos B=${drobTex(p.n, p.d)}$. Найдите $AB$.`,
    otvet: (p) => (p.bc * p.d) / p.n,
    primer: { bc: 12, n: 3, d: 5 },
    sluchaynye: (r) => {
      const d = r.int(2, 12);
      return { bc: r.int(2, 40), n: r.int(1, d - 1), d };
    },
    stsena: (p, porog) => {
      const { t, sk } = pryamoy(Math.acos(p.n / p.d) / RAD, porog, 'katety');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('C', 'B', chislo(p.bc)),
            ug('A', 'B', 'C', { vydelit: 'dano' }),
            otr('A', 'B', {
              vydelit: 'iskomoe',
              znachenie: chislo((p.bc * p.d) / p.n),
              otvet: true,
            }),
          ],
          otvet: chislo((p.bc * p.d) / p.n),
        },
        sk,
      );
    },
  },
  {
    id: 25,
    blok: 'V',
    nazvanie: '$AB$ и $AC$ → $\\sin A$',
    fipi: [93, 94, 95, 96],
    uslovie: (p) =>
      `${PRYAMOY_C}, $AB=${tex(p.ab)}$, $AC=${korenTex(p.k, p.m)}$. Найдите $\\sin A$.`,
    otvet: (p) => Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab,
    primer: { ab: 10, k: 1, m: 91 },
    sluchaynye: (r) => {
      const ab = r.int(3, 40);
      return { ab, k: 1, m: r.int(1, ab * ab - 1) };
    },
    stsena: (p, porog) => {
      const A0 = Math.acos((p.k * Math.sqrt(p.m)) / p.ab) / RAD;
      const { t, sk } = pryamoy(90 - A0, porog, 'gipotenuza');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'B', chislo(p.ab)),
            storona('A', 'C', koren(p.k, p.m)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            storona('C', 'B', 'BC', { sloy: 1, vydelit: undefined }),
          ],
          otvet: chislo(Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab),
        },
        sk,
      );
    },
  },
  {
    id: 26,
    blok: 'V',
    nazvanie: '$AB$ и $BC$ → $\\cos A$',
    fipi: [97, 98, 99, 100],
    uslovie: (p) =>
      `${PRYAMOY_C}, $AB=${tex(p.ab)}$, $BC=${korenTex(p.k, p.m)}$. Найдите $\\cos A$.`,
    otvet: (p) => Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab,
    primer: { ab: 15, k: 9, m: 1 },
    sluchaynye: (r) => {
      const ab = r.int(3, 40);
      return { ab, k: r.int(1, ab - 1), m: 1 };
    },
    stsena: (p, porog) => {
      const A0 = Math.asin((p.k * Math.sqrt(p.m)) / p.ab) / RAD;
      const { t, sk } = pryamoy(90 - A0, porog, 'gipotenuza');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'B', chislo(p.ab)),
            storona('C', 'B', koren(p.k, p.m)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
          ],
          otvet: chislo(Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab),
        },
        sk,
      );
    },
  },
  {
    id: 27,
    blok: 'V',
    nazvanie: '$BC$ и $AB$ → $\\sin B$',
    fipi: [101, 102, 103, 104],
    uslovie: (p) =>
      `${PRYAMOY_C}, $BC=${korenTex(p.k, p.m)}$, $AB=${tex(p.ab)}$. Найдите $\\sin B$.`,
    otvet: (p) => Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab,
    primer: { ab: 10, k: 6, m: 1 },
    sluchaynye: (r) => {
      const ab = r.int(3, 40);
      return { ab, k: r.int(1, ab - 1), m: 1 };
    },
    stsena: (p, porog) => {
      const B0 = Math.acos((p.k * Math.sqrt(p.m)) / p.ab) / RAD;
      const { t, sk } = pryamoy(B0, porog, 'katety');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'B', chislo(p.ab)),
            storona('C', 'B', koren(p.k, p.m)),
            ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
          ],
          otvet: chislo(Math.sqrt(p.ab * p.ab - p.k * p.k * p.m) / p.ab),
        },
        sk,
      );
    },
  },
  {
    id: 28,
    blok: 'V',
    nazvanie: '$\\sin A$ → $\\sin B$',
    fipi: [105, 106],
    uslovie: (p) => `${PRYAMOY_C}, $\\sin A=${tex(p.s)}$. Найдите $\\sin B$.`,
    otvet: (p) => Math.round(Math.sqrt(1 - p.s * p.s) * 1e6) / 1e6,
    primer: { s: 0.8 },
    sluchaynye: (r) => ({ s: r.int(1, 99) / 100 }),
    stsena: (p, porog) => {
      const A0 = Math.asin(p.s) / RAD;
      const { t, sk } = pryamoy(90 - A0, porog, 'gipotenuza');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            ug('C', 'A', 'B', { vydelit: 'dano' }),
            ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
          ],
        },
        sk,
      );
    },
  },
  {
    id: 29,
    blok: 'V',
    nazvanie: '$AC$ и $\\operatorname{tg} A$ → $AB$',
    fipi: [107, 108, 109, 110],
    uslovie: (p) =>
      `${PRYAMOY_C}, $AC=${tex(p.ac)}$, $\\operatorname{tg} A=${drobTex(p.n, p.d, p.m)}$. Найдите $AB$.`,
    otvet: (p) => {
      const tg = (p.n * Math.sqrt(p.m)) / p.d;
      return Math.round(p.ac * Math.sqrt(1 + tg * tg) * 1e6) / 1e6;
    },
    primer: { ac: 10, n: 12, d: 5, m: 1 },
    sluchaynye: (r) => ({ ac: r.int(2, 40), n: r.int(1, 20), d: r.int(1, 12), m: 1 }),
    stsena: (p, porog) => {
      const A0 = Math.atan((p.n * Math.sqrt(p.m)) / p.d) / RAD;
      const { t, sk } = pryamoy(90 - A0, porog, 'katety');
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'C', chislo(p.ac)),
            ug('C', 'A', 'B', { vydelit: 'dano' }),
            otr('A', 'B', { vydelit: 'iskomoe' }),
            storona('C', 'B', 'BC', { sloy: 1, vydelit: undefined }),
          ],
        },
        sk,
      );
    },
  },
  {
    id: 30,
    blok: 'V',
    nazvanie: '$AC=BC$, высота $CH$ и $\\cos A$ → $AC$',
    fipi: [111, 112, 113, 114, 115, 116],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AC=BC$, высота $CH$ равна $${korenTex(p.hk, p.hm)}$, $\\cos A=${drobTex(p.n, p.d, p.m, p.dec === 1)}$. Найдите $AC$.`,
    otvet: (p) => {
      const c = (p.n * Math.sqrt(p.m)) / p.d;
      return Math.round(((p.hk * Math.sqrt(p.hm)) / Math.sqrt(1 - c * c)) * 1e6) / 1e6;
    },
    primer: { hk: 7.2, hm: 1, n: 4, d: 5, m: 1, dec: 0 },
    sluchaynye: (r) => {
      const d = r.int(2, 25);
      return { hk: r.int(1, 30), hm: 1, n: r.int(1, d - 1), d, m: 1, dec: 0 };
    },
    stsena: (p, porog) => {
      const A0 = Math.acos((p.n * Math.sqrt(p.m)) / p.d) / RAD;
      const aV = clamp(A0, porog, 90 - porog / 2);
      return scena(
        {
          tochki: { ...ravnobedrennyy(180 - 2 * aV), H: { seredina: ['A', 'B'] } },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            ...vysota('C', 'A', 'B', 'H', null, { vydelit: 'dano', znachenie: koren(p.hk, p.hm) }),
            ug('C', 'A', 'B', { vydelit: 'dano' }),
            otr('A', 'C', { vydelit: 'iskomoe' }),
          ],
          proverki: [
            {
              ravny: [
                ['A', 'C'],
                ['B', 'C'],
              ],
            },
          ],
        },
        Math.abs(aV - A0) > 1e-9,
      );
    },
  },
  {
    id: 31,
    blok: 'V',
    nazvanie: 'Равнобедренный: основание и высота к боковой стороне → синус угла при основании',
    fipi: [117, 118, 119, 120, 123, 124, 125, 126],
    uslovie: (p) =>
      p.k
        ? `В треугольнике $ABC$ $AB=BC$, $AC=${tex(p.a)}$, высота $CH$ равна $${tex(p.h)}$. Найдите синус угла $ACB$.`
        : `В треугольнике $ABC$ $AC=BC$, $AB=${tex(p.a)}$, высота $AH$ равна $${tex(p.h)}$. Найдите синус угла $BAC$.`,
    otvet: (p) => p.h / p.a,
    primer: { a: 20, h: 8, k: 0 },
    sluchaynye: (r) => {
      const a = r.int(4, 40);
      return { a, h: r.int(1, a - 1), k: r.int(0, 1) };
    },
    stsena: (p, porog) => {
      const b0 = Math.asin(p.h / p.a) / RAD;
      let bV = clamp(b0, porog, 78);
      /* Угол при вершине около 90°: основание высоты сливается с вершиной. */
      if (Math.abs(bV - 45) < 7) bV = bV < 45 ? 38 : 52;
      const t = ravnobedrennyy(180 - 2 * bV);
      /* k = 0: вершина C, высота AH на BC; k = 1: вершина B, высота CH на AB. */
      const tochki = p.k ? { A: t.A, C: t.B, B: t.C } : t;
      const [ot, s1, s2] = p.k ? (['C', 'B', 'A'] as const) : (['A', 'B', 'C'] as const);
      const vne = 180 - 2 * bV > 90 ? 'b' : null;
      const isk = p.k
        ? ug('A', 'C', 'B', { vydelit: 'iskomoe' })
        : ug('C', 'A', 'B', { vydelit: 'iskomoe' });
      return scena(
        {
          tochki: { ...tochki, H: { osnovanie: [ot, s1, s2] } },
          elementy: [
            p.k ? tri('A', 'B', 'C') : tri('A', 'B', 'C'),
            ...(p.k
              ? [shtrih('A', 'B', 1), shtrih('B', 'C', 1)]
              : [shtrih('A', 'C', 1), shtrih('B', 'C', 1)]),
            ...vysota(ot, s1, s2, 'H', vne, { vydelit: 'dano', znachenie: chislo(p.h) }),
            storona(p.k ? 'A' : 'A', p.k ? 'C' : 'B', chislo(p.a)),
            isk,
            p.k ? ug('C', 'A', 'B', { sloy: 1, dugi: 1 }) : ug('A', 'B', 'C', { sloy: 1 }),
          ],
          proverki: [
            p.k
              ? {
                  ravny: [
                    ['A', 'B'],
                    ['B', 'C'],
                  ],
                }
              : {
                  ravny: [
                    ['A', 'C'],
                    ['B', 'C'],
                  ],
                },
          ],
        },
        Math.abs(bV - b0) > 1e-9,
      );
    },
  },
  {
    id: 32,
    blok: 'V',
    nazvanie: '$AC=BC$, $AB$, высота $AH$ и $BH$ → $\\cos\\angle BAC$',
    fipi: [121, 122],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AC=BC$, $AB=${tex(p.c)}$, $AH$ — высота, $BH=${tex(p.m)}$. Найдите косинус угла $BAC$.`,
    otvet: (p) => p.m / p.c,
    primer: { c: 8, m: 2 },
    sluchaynye: (r) => {
      const c = r.int(4, 40);
      return { c, m: r.int(1, c - 1) };
    },
    stsena: (p, porog) => {
      const b0 = Math.acos(p.m / p.c) / RAD;
      const bV = clamp(b0, Math.max(porog, 50), 75);
      return scena(
        {
          tochki: { ...ravnobedrennyy(180 - 2 * bV), H: { osnovanie: ['A', 'B', 'C'] } },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            ...vysota('A', 'B', 'C', 'H', null),
            storona('A', 'B', chislo(p.c)),
            storona('B', 'H', chislo(p.m)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            ug('A', 'B', 'C', { sloy: 1 }),
          ],
          proverki: [
            {
              ravny: [
                ['A', 'C'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(p.m / p.c),
        },
        Math.abs(bV - b0) > 1e-9,
      );
    },
  },

  /* ── VI. Центральные и вписанные углы, касательные ─────────── */
  {
    id: 33,
    blok: 'VI',
    nazvanie: 'Центральный угол на $d$ больше вписанного → центральный или вписанный',
    fipi: [127, 128, 129, 130, 131, 132, 133, 134],
    uslovie: (p) =>
      p.k
        ? `Центральный угол на $${grTex(p.d)}$ больше острого вписанного угла, опирающегося на ту же дугу окружности. Найдите вписанный угол. ${VGRADUSAH}`
        : `Найдите центральный угол, если он на $${grTex(p.d)}$ больше острого вписанного угла, опирающегося на ту же дугу. ${VGRADUSAH}`,
    otvet: (p) => (p.k ? p.d : 2 * p.d),
    primer: { d: 28, k: 0 },
    sluchaynye: (r) => ({ d: r.int(2, 89), k: r.int(0, 1) }),
    stsena: (p, porog) => {
      const dV = clamp(p.d, porog, 80);
      return scena(
        {
          tochki: {
            O: O0,
            A: { naDuge: { okr: 'w', gradus: 270 - dV } },
            B: { naDuge: { okr: 'w', gradus: 270 + dV } },
            C: { naDuge: { okr: 'w', gradus: 125 } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            otr('O', 'A'),
            otr('O', 'B'),
            otr('C', 'A'),
            otr('C', 'B'),
            ug('A', 'O', 'B', p.k ? { dugi: 2 } : { vydelit: 'iskomoe', dugi: 2 }),
            ug('A', 'C', 'B', p.k ? { vydelit: 'iskomoe' } : {}),
            duga('w', 'A', 'B', { sloy: 1 }),
          ],
          podpisi: false,
          otvet: gr(p.k ? p.d : 2 * p.d),
        },
        dV !== p.d,
      );
    },
  },
  {
    id: 34,
    blok: 'VI',
    nazvanie: 'Диаметры $AC$ и $BD$: угол $AOD$ ↔ вписанный угол $ACB$',
    fipi: [135, 136, 137, 138, 139, 140, 141, 142],
    uslovie: (p) =>
      p.k
        ? `Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $ACB$ равен $${grTex(p.u)}$. Найдите угол $AOD$. ${VGRADUSAH}`
        : `Отрезки $AC$ и $BD$ — диаметры окружности с центром $O$. Угол $AOD$ равен $${grTex(p.u)}$. Найдите вписанный угол $ACB$. ${VGRADUSAH}`,
    otvet: (p) => (p.k ? 180 - 2 * p.u : (180 - p.u) / 2),
    primer: { u: 114, k: 0 },
    sluchaynye: (r) => {
      const k = r.int(0, 1);
      return { u: k ? r.int(2, 88) : r.int(2, 178), k };
    },
    stsena: (p, porog) => {
      const aod = p.k ? 180 - 2 * p.u : p.u;
      const aodV = clamp(aod, 2 * porog + 10, 180 - 2 * porog);
      const ans = p.k ? 180 - 2 * p.u : (180 - p.u) / 2;
      return scena(
        {
          tochki: {
            O: O0,
            D: { naDuge: { okr: 'w', gradus: 180 } },
            B: { naDuge: { okr: 'w', gradus: 0 } },
            A: { naDuge: { okr: 'w', gradus: 180 + aodV } },
            C: { naDuge: { okr: 'w', gradus: aodV } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            otr('D', 'B'),
            otr('A', 'C'),
            otr('C', 'B'),
            tochka('O'),
            ug(
              'A',
              'O',
              'D',
              p.k
                ? { vydelit: 'iskomoe', znachenie: gr(ans), otvet: true }
                : { vydelit: 'dano', znachenie: gr(p.u) },
            ),
            ug(
              'A',
              'C',
              'B',
              p.k
                ? { vydelit: 'dano', znachenie: gr(p.u) }
                : { vydelit: 'iskomoe', znachenie: gr(ans), otvet: true },
            ),
            ug('A', 'O', 'B', { sloy: 1, dugi: 2 }),
          ],
          otvet: gr(ans),
        },
        aodV !== aod,
      );
    },
  },
  {
    id: 35,
    blok: 'VI',
    nazvanie: 'Вписанный угол на дугу $\\frac{k}{n}$ окружности',
    fipi: [143, 144, 145, 146],
    uslovie: (p) =>
      `Найдите вписанный угол, опирающийся на дугу, равную $\\frac{${p.n}}{${p.d}}$ окружности. ${VGRADUSAH}`,
    otvet: (p) => (180 * p.n) / p.d,
    primer: { n: 1, d: 5 },
    sluchaynye: (r) => {
      const d = r.int(3, 40);
      return { n: r.int(1, d - 1), d };
    },
    stsena: (p, porog) => {
      const arc = (360 * p.n) / p.d;
      const arcV = clamp(arc, 2 * porog + 6, 360 - 2 * porog - 30);
      return scena(
        {
          tochki: {
            O: O0,
            A: { naDuge: { okr: 'w', gradus: 270 - arcV / 2 } },
            B: { naDuge: { okr: 'w', gradus: 270 + arcV / 2 } },
            C: { naDuge: { okr: 'w', gradus: 90 + (arcV > 180 ? 0 : 8) } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tochka('O'),
            otr('C', 'A'),
            otr('C', 'B'),
            ug('A', 'C', 'B', {
              vydelit: 'iskomoe',
              znachenie: gr((180 * p.n) / p.d),
              otvet: true,
            }),
            duga('w', 'A', 'B', { sloy: 1, znachenie: gr(arc) }),
          ],
          podpisi: false,
          otvet: gr((180 * p.n) / p.d),
        },
        arcV !== arc,
      );
    },
  },
  {
    id: 36,
    blok: 'VI',
    nazvanie: 'Дуги $AC$ и $BC$ → вписанный угол $ACB$',
    fipi: [147, 148, 149, 150],
    uslovie: (p) =>
      `На окружности отмечены точки $A$, $B$ и $C$. Дуга окружности $AC$, не содержащая точку $B$, составляет $${grTex(p.ac)}$. Дуга окружности $BC$, не содержащая точку $A$, составляет $${grTex(p.bc)}$. Найдите вписанный угол $ACB$. ${VGRADUSAH}`,
    otvet: (p) => (360 - p.ac - p.bc) / 2,
    primer: { ac: 120, bc: 82 },
    sluchaynye: (r) => {
      const ac = r.int(20, 250);
      return { ac, bc: r.int(20, 340 - ac) };
    },
    stsena: (p, porog) => {
      const ab = 360 - p.ac - p.bc;
      const { d, sk } = dugiVidimye([p.ac, ab, p.bc], porog);
      const c0 = 70;
      return scena(
        {
          tochki: {
            O: O0,
            C: { naDuge: { okr: 'w', gradus: c0 } },
            A: { naDuge: { okr: 'w', gradus: c0 + d[0] } },
            B: { naDuge: { okr: 'w', gradus: c0 - d[2] } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tochka('O'),
            otr('C', 'A'),
            otr('C', 'B'),
            ug('A', 'C', 'B', { vydelit: 'iskomoe', znachenie: gr(ab / 2), otvet: true }),
            duga('w', 'C', 'A', { sloy: 1, vydelit: 'dano', znachenie: gr(p.ac) }),
            duga('w', 'B', 'C', { sloy: 1, vydelit: 'dano', znachenie: gr(p.bc) }),
            duga('w', 'A', 'B', { sloy: 2, znachenie: gr(ab), otvet: true }),
          ],
          bezPodpisi: ['O'],
          otvet: gr(ab / 2),
        },
        sk,
      );
    },
  },
  {
    id: 37,
    blok: 'VI',
    nazvanie: 'Касательная $CA$: угол $ACO$ ↔ меньшая дуга $AB$',
    fipi: [151, 152, 153, 154, 155, 156, 157, 158],
    uslovie: (p) =>
      p.k
        ? `Найдите угол $ACO$, если его сторона $CA$ касается окружности с центром $O$, отрезок $CO$ пересекает окружность в точке $B$ (см. рис.), а дуга $AB$ окружности, заключённая внутри этого угла, равна $${grTex(p.u)}$. ${VGRADUSAH}`
        : `Угол $ACO$ равен $${grTex(p.u)}$, где $O$ — центр окружности. Его сторона $CA$ касается окружности. Сторона $CO$ пересекает окружность в точке $B$ (см. рис.). Найдите величину меньшей дуги $AB$ окружности. ${VGRADUSAH}`,
    otvet: (p) => 90 - p.u,
    primer: { u: 27, k: 0 },
    /* u = 45: угол AOB в подсказке равен ответу. */
    sluchaynye: (r) => {
      const u = r.int(2, 88);
      return { u: u === 45 ? 46 : u, k: r.int(0, 1) };
    },
    stsena: (p, porog) => kasatelnaya(p, porog, false),
  },
  {
    id: 38,
    blok: 'VI',
    nazvanie: 'Касательная $CA$, секущая через центр: угол $ACO$ → дуга $AD$',
    fipi: [159, 160, 161, 162],
    uslovie: (p) =>
      `Угол $ACO$ равен $${grTex(p.u)}$. Его сторона $CA$ касается окружности с центром в точке $O$. Сторона $CO$ пересекает окружность в точках $B$ и $D$ (см. рис.). Найдите градусную меру дуги $AD$ окружности, заключённой внутри этого угла. ${VGRADUSAH}`,
    otvet: (p) => 90 + p.u,
    primer: { u: 28, k: 0 },
    sluchaynye: (r) => ({ u: r.int(2, 88), k: 0 }),
    stsena: (p, porog) => kasatelnaya(p, porog, true),
  },
  {
    id: 39,
    blok: 'VI',
    nazvanie: 'Две касательные: меньшая дуга $AB$ → угол $ACB$',
    fipi: [163, 164, 165, 166],
    uslovie: (p) =>
      `Через концы $A$ и $B$ дуги окружности с центром $O$ проведены касательные $AC$ и $BC$. Меньшая дуга $AB$ равна $${grTex(p.g)}$. Найдите угол $ACB$. ${VGRADUSAH}`,
    otvet: (p) => 180 - p.g,
    primer: { g: 58 },
    sluchaynye: (r) => ({ g: r.int(2, 178) }),
    stsena: (p, porog) => {
      const gV = clamp(p.g, 30, 180 - Math.max(porog, 30));
      const r0 = 5;
      return scena(
        {
          tochki: {
            O: O0,
            A: { naDuge: { okr: 'w', gradus: gV / 2 } },
            B: { naDuge: { okr: 'w', gradus: -gV / 2 } },
            C: [r0 / Math.cos((gV / 2) * RAD), 0],
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            otr('O', 'A'),
            otr('O', 'B'),
            pryamaya('C', 'A', { zaA: 0, zaB: 0.35 }),
            pryamaya('C', 'B', { zaA: 0, zaB: 0.35 }),
            ug('A', 'C', 'B', { vydelit: 'iskomoe', znachenie: gr(180 - p.g), otvet: true }),
            duga('w', 'B', 'A', { vydelit: 'dano', znachenie: gr(p.g) }),
            pryam('O', 'A', 'C', { sloy: 1 }),
            pryam('O', 'B', 'C', { sloy: 1 }),
            ug('B', 'O', 'A', { sloy: 2, vydelit: 'dano', znachenie: gr(p.g) }),
          ],
          bezPodpisi: [],
          otvet: gr(180 - p.g),
        },
        gV !== p.g,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 40,
    blok: 'VI',
    nazvanie: 'Угол между секущими и дуга $AB$ → вписанный угол $DAE$',
    fipi: [167, 168, 169, 170],
    uslovie: (p) =>
      `Угол $ACB$ равен $${grTex(p.f)}$. Градусная мера дуги $AB$ окружности, не содержащей точек $D$ и $E$, равна $${grTex(p.t)}$. Найдите угол $DAE$. ${VGRADUSAH}`,
    otvet: (p) => p.t / 2 - p.f,
    primer: { f: 54, t: 138 },
    sluchaynye: (r) => {
      const t = r.int(60, 300);
      /* Секущие пересекаются вне окружности: f > t − 180. */
      return { f: r.int(Math.max(2, t - 175), Math.floor(t / 2) - 2), t };
    },
    stsena: (p, porog) => {
      let delta = p.t - 2 * p.f;
      let t = p.t;
      const sk0 = delta < 2 * porog;
      delta = Math.max(delta, 2 * porog);
      t = Math.min(Math.max(t, delta + 2 * porog + 20), 300);
      if (t + delta > 310) {
        const k = 310 / (t + delta);
        t *= k;
        delta = Math.max(delta * k, 2 * porog);
      }
      const x = (360 - t - delta) / 2;
      const sk = sk0 || t !== p.t || x < 25;
      const xV = Math.max(x, 25);
      return scena(
        {
          tochki: {
            O: O0,
            D: { naDuge: { okr: 'w', gradus: delta / 2 } },
            E: { naDuge: { okr: 'w', gradus: -delta / 2 } },
            B: { naDuge: { okr: 'w', gradus: delta / 2 + xV } },
            A: { naDuge: { okr: 'w', gradus: -delta / 2 - xV } },
            C: {
              peresechenie: [
                ['B', 'D'],
                ['A', 'E'],
              ],
            },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tochka('O'),
            otr('B', 'C'),
            otr('A', 'C'),
            otr('A', 'D'),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.f) }),
            ug('D', 'A', 'E', { vydelit: 'iskomoe', znachenie: gr(p.t / 2 - p.f), otvet: true }),
            duga('w', 'B', 'A', { vydelit: 'dano', znachenie: gr(p.t) }),
            ug('A', 'D', 'B', { sloy: 1, znachenie: gr(p.t / 2) }),
          ],
          otvet: gr(p.t / 2 - p.f),
        },
        sk,
      );
    },
    diapazon: { povorot: 180 },
  },

  /* ── VII. Вписанная окружность ─────────────────────────────── */
  {
    id: 41,
    blok: 'VII',
    nazvanie: 'Описанный четырёхугольник: три стороны → четвёртая',
    fipi: [171, 172, 173, 174],
    uslovie: (p) =>
      p.k
        ? `В четырёхугольник $ABCD$ вписана окружность, $AB=${tex(p.ab)}$, $BC=${tex(p.bc)}$ и $CD=${tex(p.cd)}$. Найдите четвёртую сторону четырёхугольника.`
        : `В четырёхугольник $ABCD$ вписана окружность, $AB=${tex(p.ab)}$, $BC=${tex(p.bc)}$ и $AD=${tex(p.da)}$. Найдите четвёртую сторону четырёхугольника.`,
    otvet: (p) => (p.k ? p.ab + p.cd - p.bc : p.bc + p.da - p.ab),
    primer: { ab: 13, bc: 7, cd: 5, da: 11, k: 0 },
    sluchaynye: sluchaynyyOpisannyy,
    stsena: (p) => {
      const isk = p.k ? (['A', 'D'] as const) : (['C', 'D'] as const);
      const dano: [string, string, number][] = p.k
        ? [
            ['A', 'B', p.ab],
            ['B', 'C', p.bc],
            ['C', 'D', p.cd],
          ]
        : [
            ['A', 'B', p.ab],
            ['B', 'C', p.bc],
            ['A', 'D', p.da],
          ];
      return opisannyyStsena(p, [
        ...dano.map(([a, b, v]) => storona(a, b, chislo(v))),
        otr(isk[0], isk[1], {
          vydelit: 'iskomoe',
          znachenie: chislo(p.k ? p.da : p.cd),
          otvet: true,
        }),
      ]);
    },
  },
  {
    id: 42,
    blok: 'VII',
    nazvanie: 'Описанный четырёхугольник: $AB$ и $CD$ → периметр',
    fipi: [175, 176, 177, 178],
    uslovie: (p) =>
      `В четырёхугольник $ABCD$ вписана окружность, $AB=${tex(p.ab)}$, $CD=${tex(p.cd)}$. Найдите периметр четырёхугольника $ABCD$.`,
    otvet: (p) => 2 * (p.ab + p.cd),
    primer: { ab: 22, bc: 12, cd: 17, da: 27, k: 0 },
    sluchaynye: sluchaynyyOpisannyy,
    stsena: (p) =>
      opisannyyStsena(p, [
        storona('A', 'B', chislo(p.ab)),
        storona('C', 'D', chislo(p.cd)),
        mn(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
      ]),
  },
  {
    id: 43,
    blok: 'VII',
    nazvanie: 'Прямоугольная описанная трапеция: периметр и большая боковая сторона → радиус',
    fipi: [179, 180, 181, 182],
    uslovie: (p) =>
      `Периметр прямоугольной трапеции, описанной около окружности, равен $${tex(p.per)}$, её большая боковая сторона равна $${tex(p.c)}$. Найдите радиус окружности.`,
    otvet: (p) => (p.per / 2 - p.c) / 2,
    primer: { per: 40, c: 11 },
    sluchaynye: (r) => {
      const c = r.int(3, 30);
      return { c, per: 2 * (c + r.int(1, c - 1)) };
    },
    stsena: (p, porog) => {
      const r0 = (p.per / 2 - p.c) / 2;
      const b0 = Math.asin(Math.min(1, (2 * r0) / p.c)) / RAD;
      const bV = clamp(b0, Math.max(porog, 35), 80);
      return scena(
        {
          tochki: {
            O: [0, 3],
            ...opisannayaTrapeciya(90, bV, 3),
            T: { osnovanie: ['O', 'A', 'D'] },
          },
          okruzhnosti: { w: { centr: 'O', radius: 3 } },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            okr('w'),
            tochka('O'),
            pryam('D', 'A', 'B'),
            pryam('A', 'B', 'C'),
            storona('C', 'D', chislo(p.c)),
            otr('O', 'T', { sloy: 1, vydelit: 'iskomoe', znachenie: 'r' }),
            storona('A', 'B', '2r', { sloy: 1, vydelit: undefined }),
          ],
          podpisi: false,
          otvet: chislo(r0),
        },
        Math.abs(bV - b0) > 1e-9,
      );
    },
  },
  {
    id: 44,
    blok: 'VII',
    nazvanie: 'Описанная трапеция: боковые стороны → средняя линия',
    fipi: [183, 184, 185, 186],
    uslovie: (p) =>
      `Боковые стороны трапеции, описанной около окружности, равны $${tex(p.c)}$ и $${tex(p.d)}$. Найдите среднюю линию трапеции.`,
    otvet: (p) => (p.c + p.d) / 2,
    primer: { c: 15, d: 22 },
    sluchaynye: (r) => {
      const c = r.int(2, 30);
      return { c, d: r.int(c, c + 20) };
    },
    stsena: (p, porog) => {
      const r0 = 3;
      const mal = Math.min(p.c, p.d);
      const bol = Math.max(p.c, p.d);
      /* Высота 2r = 0,85·меньшая боковая; углы — по своим сторонам. */
      const k = (2 * r0) / (0.85 * mal);
      const al = Math.asin(Math.min(1, (2 * r0) / (k * p.c))) / RAD;
      const be = Math.asin(Math.min(1, (2 * r0) / (k * p.d))) / RAD;
      const alV = Math.max(al, Math.max(porog, 35));
      const beV = Math.max(be, Math.max(porog, 35));
      void bol;
      return scena(
        {
          tochki: {
            O: [0, r0],
            ...opisannayaTrapeciya(alV, beV, r0),
            M: { seredina: ['A', 'B'] },
            N: { seredina: ['D', 'C'] },
          },
          okruzhnosti: { w: { centr: 'O', radius: r0 } },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            okr('w'),
            tochka('O'),
            storona('A', 'B', chislo(p.c)),
            storona('D', 'C', chislo(p.d)),
            otr('M', 'N', { vydelit: 'iskomoe', znachenie: chislo((p.c + p.d) / 2), otvet: true }),
          ],
          podpisi: false,
          otvet: chislo((p.c + p.d) / 2),
        },
        alV !== al || beV !== be,
      );
    },
  },

  /* ── VIII. Описанная окружность ────────────────────────────── */
  {
    id: 45,
    blok: 'VIII',
    nazvanie: 'Вписанный $ABCD$: $\\angle ABD$ и $\\angle CAD$ ↔ $\\angle ABC$',
    fipi: [187, 188, 189, 190, 191, 192, 193, 194],
    uslovie: (p) =>
      p.k
        ? `Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $${grTex(p.abd + p.cad)}$, угол $CAD$ равен $${grTex(p.cad)}$. Найдите угол $ABD$. ${VGRADUSAH}`
        : `Четырёхугольник $ABCD$ вписан в окружность. Угол $ABD$ равен $${grTex(p.abd)}$, угол $CAD$ равен $${grTex(p.cad)}$. Найдите угол $ABC$. ${VGRADUSAH}`,
    otvet: (p) => (p.k ? p.abd : p.abd + p.cad),
    primer: { abd: 61, cad: 37, k: 0 },
    sluchaynye: (r) => {
      const abd = r.int(10, 120);
      return { abd, cad: r.int(5, Math.min(160 - abd, 80)), k: r.int(0, 1) };
    },
    stsena: (p, porog) => {
      const ostatok = 360 - 2 * p.abd - 2 * p.cad;
      const { d, sk } = dugiVidimye([ostatok * 0.62, ostatok * 0.38, 2 * p.cad], porog);
      const abc = p.abd + p.cad;
      return vpisannyyChetyrehugolnik(
        d,
        porog,
        [
          otr('A', 'C'),
          otr('B', 'D'),
          ug(
            'A',
            'B',
            'D',
            p.k
              ? { vydelit: 'iskomoe', znachenie: gr(p.abd), otvet: true }
              : { vydelit: 'dano', znachenie: gr(p.abd) },
          ),
          ug('C', 'A', 'D', { vydelit: 'dano', dugi: 2, znachenie: gr(p.cad) }),
          ug(
            'A',
            'B',
            'C',
            p.k
              ? { vydelit: 'dano', znachenie: gr(abc) }
              : { vydelit: 'iskomoe', znachenie: gr(abc), otvet: true },
          ),
          ug('D', 'B', 'C', { sloy: 1, dugi: 2, znachenie: gr(p.cad) }),
        ],
        true,
        sk,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 46,
    blok: 'VIII',
    nazvanie: 'Вписанный $ABCD$: $\\angle ABC$ и $\\angle ABD$ → $\\angle CAD$',
    fipi: [195, 196, 197, 198],
    uslovie: (p) =>
      `Четырёхугольник $ABCD$ вписан в окружность. Угол $ABC$ равен $${grTex(p.abc)}$, угол $ABD$ равен $${grTex(p.abd)}$. Найдите угол $CAD$. ${VGRADUSAH}`,
    otvet: (p) => p.abc - p.abd,
    primer: { abc: 82, abd: 47 },
    sluchaynye: (r) => {
      const abd = r.int(10, 110);
      return { abd, abc: abd + r.int(5, Math.min(80, 168 - abd)) };
    },
    stsena: (p, porog) => {
      const cad = p.abc - p.abd;
      const ostatok = 360 - 2 * p.abd - 2 * cad;
      const { d, sk } = dugiVidimye([ostatok * 0.6, ostatok * 0.4, 2 * cad], porog);
      return {
        ...vpisannyyChetyrehugolnik(
          d,
          porog,
          [
            otr('A', 'C'),
            otr('B', 'D'),
            tochka('O'),
            ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(p.abc) }),
            ug('A', 'B', 'D', { vydelit: 'dano', dugi: 2, znachenie: gr(p.abd) }),
            ug('C', 'A', 'D', { vydelit: 'iskomoe', znachenie: gr(cad), otvet: true }),
            ug('D', 'B', 'C', { sloy: 1, znachenie: gr(cad), otvet: true }),
          ],
          true,
          sk,
        ),
        bezPodpisi: [],
      };
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 47,
    blok: 'VIII',
    nazvanie: 'Вписанный четырёхугольник: противоположные углы',
    fipi: [199, 200, 201, 202],
    uslovie: (p) =>
      p.k
        ? `Четырёхугольник $ABCD$ вписан в окружность. Угол $BCD$ равен $${grTex(p.u)}$. Найдите угол $BAD$. ${VGRADUSAH}`
        : `Четырёхугольник $ABCD$ вписан в окружность. Угол $BAD$ равен $${grTex(p.u)}$. Найдите угол $BCD$. ${VGRADUSAH}`,
    otvet: (p) => 180 - p.u,
    primer: { u: 136, k: 0 },
    sluchaynye: (r) => ({ u: r.int(10, 170), k: r.int(0, 1) }),
    stsena: (p, porog) => {
      const bad = p.k ? 180 - p.u : p.u;
      /* ∠BAD опирается на дугу BCD = 2·∠BAD. */
      const { d, sk } = dugiVidimye([(360 - 2 * bad) * 0.35, bad, bad], porog);
      return vpisannyyChetyrehugolnik(
        d,
        porog,
        [
          ug(
            'D',
            'A',
            'B',
            p.k
              ? { vydelit: 'iskomoe', znachenie: gr(bad), otvet: true }
              : { vydelit: 'dano', znachenie: gr(p.u) },
          ),
          ug(
            'B',
            'C',
            'D',
            p.k
              ? { vydelit: 'dano', znachenie: gr(p.u) }
              : { vydelit: 'iskomoe', znachenie: gr(180 - p.u), otvet: true },
          ),
        ],
        true,
        sk,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 48,
    blok: 'VIII',
    nazvanie: 'Вписанный четырёхугольник: два угла → меньший или больший из оставшихся',
    fipi: [203, 204, 205, 206, 207, 208, 209, 210],
    uslovie: (p) =>
      `Два угла вписанного в окружность четырёхугольника равны $${grTex(p.a)}$ и $${grTex(p.b)}$. Найдите ${p.k ? 'больший' : 'меньший'} из оставшихся углов. ${VGRADUSAH}`,
    otvet: (p) => (p.k ? 180 - Math.min(p.a, p.b) : 180 - Math.max(p.a, p.b)),
    primer: { a: 56, b: 77, k: 0 },
    sluchaynye: (r) => {
      const a = r.int(20, 160);
      let b = r.int(20, 160);
      if (a + b === 180) b += 1;
      return { a, b, k: r.int(0, 1) };
    },
    stsena: (p, porog) => {
      const lo = Math.max(0, 2 * p.a + 2 * p.b - 360);
      const hi = Math.min(2 * p.a, 2 * p.b);
      const rr = (lo + hi) / 2;
      const { d, sk } = dugiVidimye([360 - 2 * p.a - 2 * p.b + rr, 2 * p.a - rr, rr], porog);
      const c = 180 - p.a;
      const dd = 180 - p.b;
      const iskC = p.k ? c >= dd : c < dd;
      return vpisannyyChetyrehugolnik(
        d,
        porog,
        [
          ug('D', 'A', 'B', { vydelit: 'dano', znachenie: gr(p.a) }),
          ug('A', 'B', 'C', { vydelit: 'dano', dugi: 2, znachenie: gr(p.b) }),
          iskC
            ? ug('B', 'C', 'D', { vydelit: 'iskomoe', znachenie: gr(c), otvet: true })
            : ug('C', 'D', 'A', { vydelit: 'iskomoe', znachenie: gr(dd), otvet: true }),
        ],
        false,
        sk,
      );
    },
    diapazon: { povorot: 180 },
  },

  /* ── IX. Расширенная теорема синусов ───────────────────────── */
  {
    id: 49,
    blok: 'IX',
    nazvanie: '$AB$ и тупой угол $C$ → радиус описанной окружности',
    fipi: [211, 212, 213, 214],
    uslovie: (p) =>
      `В треугольнике $ABC$ сторона $AB$ равна $${korenTex(p.k, p.m)}$, угол $C$ равен $${grTex(p.g)}$. Найдите радиус описанной около этого треугольника окружности.`,
    otvet: (p) => Math.round(((p.k * Math.sqrt(p.m)) / (2 * Math.sin(p.g * RAD))) * 1e6) / 1e6,
    primer: { k: 3, m: 2, g: 135 },
    sluchaynye: (r) => ({ k: r.int(1, 20), m: r.pick([1, 2, 3]), g: r.int(95, 170) }),
    stsena: (p, porog) => {
      const gV = clamp(p.g, 91, 180 - 2 * porog);
      const s = 360 - 2 * gV; // дуга AB, содержащая C
      return scena(
        {
          tochki: {
            O: O0,
            A: { naDuge: { okr: 'w', gradus: 90 + s / 2 } },
            B: { naDuge: { okr: 'w', gradus: 90 - s / 2 } },
            C: { naDuge: { okr: 'w', gradus: 90 + s * 0.12 } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tri('A', 'B', 'C'),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.g) }),
            storona('A', 'B', koren(p.k, p.m)),
            tochka('O', { sloy: 1 }),
            otr('O', 'A', { sloy: 1, vydelit: 'iskomoe', znachenie: 'R' }),
            otr('O', 'B', { sloy: 1 }),
            ug('A', 'O', 'B', { sloy: 2, znachenie: gr(360 - 2 * p.g) }),
          ],
          proverki: [{ ugol: ['A', 'C', 'B'], vid: 'tupoy' }],
        },
        gV !== p.g,
      );
    },
  },
];

/* 37–38. Касательная CA и секущая CO. */
function kasatelnaya(p: Params, porog: number, sDiametrom: boolean): Scena {
  const u0 = p.k ? 90 - p.u : p.u;
  /* C не ближе к окружности, чем на 0,15 радиуса: иначе C и B сливаются. */
  const uV = clamp(u0, Math.max(porog, 15), 58);
  const r0 = 5;
  const ans = sDiametrom ? 90 + p.u : 90 - p.u;
  const elementy: Element[] = [
    okr('w'),
    otr('O', 'A'),
    otr(sDiametrom ? 'D' : 'O', 'C'),
    pryamaya('C', 'A', { zaA: 0, zaB: 0.3 }),
    sDiametrom || p.k === 0
      ? ug('A', 'C', 'O', { vydelit: 'dano', znachenie: gr(u0) })
      : ug('A', 'C', 'O', { vydelit: 'iskomoe', znachenie: gr(90 - p.u), otvet: true }),
    sDiametrom
      ? duga('w', 'A', 'D', { vydelit: 'iskomoe', znachenie: gr(ans), otvet: true })
      : p.k
        ? duga('w', 'B', 'A', { vydelit: 'dano', znachenie: gr(p.u) })
        : duga('w', 'B', 'A', { vydelit: 'iskomoe', znachenie: gr(ans), otvet: true }),
    pryam('O', 'A', 'C', { sloy: 1 }),
    ug('B', 'O', 'A', { sloy: 2, znachenie: gr(90 - u0), otvet: !sDiametrom && p.k === 0 }),
  ];
  return scena(
    {
      tochki: {
        O: O0,
        C: [r0 / Math.sin(uV * RAD), 0],
        A: { kasanie: { iz: 'C', okr: 'w', storona: 1 } },
        B: { naDuge: { okr: 'w', gradus: 0 } },
        ...(sDiametrom ? { D: { naDuge: { okr: 'w', gradus: 180 } } } : {}),
      },
      okruzhnosti: OKR,
      elementy: sDiametrom ? [...elementy, tochka('O')] : elementy,
      proverki: [{ naOkruzhnosti: 'w', tochki: ['A', 'B'] }],
      otvet: gr(sDiametrom ? ans : p.k ? 90 - p.u : ans),
    },
    uV !== u0,
  );
}

/* 41–42. Описанный четырёхугольник по четырём сторонам. */
function opisannyyStsena(p: Params, extra: Element[]): Scena {
  const f = opisannyyPoStoronam(p.ab, p.bc, p.cd, p.da);
  return {
    tochki: { O: O0, A: f.A, B: f.B, C: f.C, D: f.D },
    okruzhnosti: { w: { centr: 'O', radius: f.r } },
    elementy: [mn(['A', 'B', 'C', 'D']), okr('w'), ...extra],
    proverki: [],
  };
}

function sluchaynyyOpisannyy(r: { int(a: number, b: number): number }): Nabor {
  /* Отрезки касательных из вершин — стороны складываются из них. */
  const t = [r.int(3, 14), r.int(3, 14), r.int(3, 14), r.int(3, 14)];
  return {
    ab: t[0]! + t[1]!,
    bc: t[1]! + t[2]!,
    cd: t[2]! + t[3]!,
    da: t[3]! + t[0]!,
    k: r.int(0, 1),
  };
}
