/**
 * Блок X. Дополнительные прототипы: темы курса планиметрии, которых
 * нет в Блоке 1 открытого банка, — отношение углов, внешний угол,
 * угол между высотами, биссектриса угла параллелограмма, высота к
 * гипотенузе, теорема косинусов, касательная и секущая, угол между
 * хордой и касательной, правильные многоугольники, радиусы вписанной
 * и описанной окружностей, площадь через синус и через полупериметр.
 *
 * Условия написаны заново, числа свои: задачи помечаются «не из
 * открытого банка» (fipi пуст).
 */

import { RAD, polar } from '../geom';
import {
  naOkruzhnosti,
  parallelogramm,
  poStoronam,
  poUglam,
  pravilnyy,
  romb,
  trapeciya,
  uglyTreugolnika,
  vpisannyyPoDugam,
} from '../figury';
import type { Element, T2 } from '../types';
import {
  type PrototipChertezha,
  chislo,
  clamp,
  duga,
  gr,
  grTex,
  mn,
  oblast,
  okr,
  otr,
  prod,
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
const O0: T2 = [0, 0];
const OKR = { w: { centr: 'O', radius: 5 } } as const;

/** Равнобедренная трапеция ABCD (AD — нижнее основание). */
function ravnobokaya(niz: number, verh: number, h: number) {
  return trapeciya(niz, verh, h, (niz - verh) / 2);
}

export const BLOK_X: PrototipChertezha[] = [
  {
    id: 50,
    blok: 'X',
    nazvanie: 'Углы треугольника относятся как $k:m:n$',
    fipi: [],
    uslovie: (p) =>
      `Углы треугольника относятся как $${p.a}:${p.b}:${p.c}$. Найдите ${p.k ? 'больший' : 'меньший'} из них. ${VGRADUSAH}`,
    otvet: (p) =>
      (180 * (p.k ? Math.max(p.a, p.b, p.c) : Math.min(p.a, p.b, p.c))) / (p.a + p.b + p.c),
    primer: { a: 2, b: 3, c: 4, k: 0 },
    sluchaynye: (r) => ({ a: r.int(1, 9), b: r.int(1, 9), c: r.int(1, 9), k: r.int(0, 1) }),
    stsena: (p, porog) => {
      const s = p.a + p.b + p.c;
      const u: [number, number, number] = [(180 * p.a) / s, (180 * p.b) / s, (180 * p.c) / s];
      const v = uglyTreugolnika(u, porog);
      const t = poUglam(v[0], v[1]);
      const isk = p.k ? u.indexOf(Math.max(...u)) : u.indexOf(Math.min(...u));
      const UG = [
        ['C', 'A', 'B'],
        ['A', 'B', 'C'],
        ['A', 'C', 'B'],
      ] as const;
      return scena(
        {
          tochki: t,
          elementy: [
            tri('A', 'B', 'C'),
            ...UG.map(([a, b, c], i) =>
              ug(a, b, c, {
                dugi: (i + 1) as 1 | 2 | 3,
                ...(i === isk
                  ? { vydelit: 'iskomoe' as const, znachenie: gr(u[i]!), otvet: true }
                  : {}),
              }),
            ),
            ...UG.map(([a, b, c], i) =>
              ug(a, b, c, {
                sloy: 1,
                dugi: (i + 1) as 1 | 2 | 3,
                znachenie: `${[p.a, p.b, p.c][i]}x`,
              }),
            ),
          ].filter((_e, i) => i < 3 || i - 3 !== isk),
          podpisi: false,
          otvet: gr(u[isk]!),
        },
        v.some((x, i) => Math.abs(x - u[i]!) > 1e-9),
      );
    },
  },
  {
    id: 51,
    blok: 'X',
    nazvanie: 'Внешний угол при $C$ и угол $B$ → угол $A$',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ внешний угол при вершине $C$ равен $${grTex(p.e)}$, угол $ABC$ равен $${grTex(p.b)}$. Найдите угол $BAC$. ${VGRADUSAH}`,
    otvet: (p) => p.e - p.b,
    primer: { e: 118, b: 47 },
    sluchaynye: (r) => {
      const e = r.int(20, 170);
      let b = r.int(2, e - 2);
      /* Угол C = 180° − e подписан в подсказке: не равен ответу e − b. */
      if (e - b === 180 - e) b = b > 2 ? b - 1 : b + 1;
      return { e, b };
    },
    stsena: (p, porog) => {
      const a = p.e - p.b;
      const v = uglyTreugolnika([a, 180 - p.e, p.b], porog);
      const t = poUglam(v[0], v[1]);
      return scena(
        {
          tochki: { A: t.A, C: t.B, B: t.C, D: { naPryamoy: ['A', 'C', 1.35] } },
          elementy: [
            tri('A', 'C', 'B'),
            prod('A', 'C', { doTochki: 'D', sploshnoe: true }),
            ug('B', 'C', 'D', { vydelit: 'dano', znachenie: gr(p.e) }),
            ug('A', 'B', 'C', { vydelit: 'dano', dugi: 2, znachenie: gr(p.b) }),
            ug('C', 'A', 'B', { vydelit: 'iskomoe', znachenie: gr(a), otvet: true }),
            ug('A', 'C', 'B', { sloy: 1, dugi: 3, znachenie: gr(180 - p.e) }),
          ],
          otvet: gr(a),
        },
        Math.abs(v[0] - a) > 1e-9 || Math.abs(v[2] - p.b) > 1e-9,
      );
    },
  },
  {
    id: 52,
    blok: 'X',
    nazvanie: 'Два угла треугольника → тупой угол между высотами из их вершин',
    fipi: [],
    uslovie: (p) =>
      `Два угла треугольника равны $${grTex(p.a)}$ и $${grTex(p.b)}$. Найдите тупой угол, который образуют высоты треугольника, выходящие из вершин этих углов. ${VGRADUSAH}`,
    otvet: (p) => p.a + p.b,
    primer: { a: 57, b: 71 },
    sluchaynye: (r) => {
      const a = r.int(20, 85);
      return { a, b: r.int(Math.max(91 - a, 20), 85) };
    },
    stsena: (p, porog) => {
      const v = uglyTreugolnika([p.a, p.b, 180 - p.a - p.b], porog, 78);
      return scena(
        {
          tochki: {
            ...poUglam(v[0], v[1]),
            D: { osnovanie: ['A', 'B', 'C'] },
            E: { osnovanie: ['B', 'A', 'C'] },
            H: { ortocentr: ['A', 'B', 'C'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('A', 'D'),
            otr('B', 'E'),
            pryam('A', 'D', 'C'),
            pryam('B', 'E', 'C'),
            ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(p.a) }),
            ug('A', 'B', 'C', { vydelit: 'dano', dugi: 2, znachenie: gr(p.b) }),
            ug('A', 'H', 'B', { vydelit: 'iskomoe', znachenie: gr(p.a + p.b), otvet: true }),
            ug('A', 'C', 'B', { sloy: 1, dugi: 3, znachenie: gr(180 - p.a - p.b) }),
          ],
          podpisi: false,
          otvet: gr(p.a + p.b),
        },
        Math.abs(v[0] - p.a) + Math.abs(v[1] - p.b) > 1e-9,
      );
    },
  },
  {
    id: 53,
    blok: 'X',
    nazvanie: 'Биссектриса угла параллелограмма делит сторону → периметр',
    fipi: [],
    uslovie: (p) =>
      `Биссектриса угла $A$ параллелограмма $ABCD$ пересекает сторону $BC$ в точке $K$. Найдите периметр параллелограмма, если $BK=${tex(p.m)}$, $CK=${tex(p.n)}$.`,
    otvet: (p) => 2 * (2 * p.m + p.n),
    primer: { m: 7, n: 12, u: 60 },
    sluchaynye: (r) => ({ m: r.int(2, 30), n: r.int(2, 30), u: r.int(40, 80) }),
    stsena: (p) => {
      const ratio = clamp(p.m / (p.m + p.n), 0.25, 0.8);
      const t = parallelogramm(p.u ?? 60, 10, 10 * ratio);
      return scena(
        {
          tochki: { ...t, K: { naPryamoy: ['B', 'C', ratio] } },
          elementy: [
            mn(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
            otr('A', 'K'),
            ug('B', 'A', 'K'),
            ug('K', 'A', 'D'),
            storona('B', 'K', chislo(p.m)),
            storona('K', 'C', chislo(p.n)),
            ug('B', 'K', 'A', { sloy: 1 }),
            shtrih('A', 'B', 1, { sloy: 2 }),
            shtrih('B', 'K', 1, { sloy: 2 }),
          ],
          otvet: chislo(2 * (2 * p.m + p.n)),
        },
        Math.abs(ratio - p.m / (p.m + p.n)) > 1e-9,
      );
    },
  },
  {
    id: 54,
    blok: 'X',
    nazvanie: 'Прямоугольник: диагонали под углом $60^\\circ$, меньшая сторона → диагональ',
    fipi: [],
    uslovie: (p) =>
      `Меньшая сторона прямоугольника равна $${tex(p.a)}$, диагонали пересекаются под углом $60^\\circ$. Найдите диагональ прямоугольника.`,
    otvet: (p) => 2 * p.a,
    primer: { a: 9 },
    sluchaynye: (r) => ({ a: r.int(1, 40) }),
    stsena: (p) => {
      const w = Math.sqrt(3);
      return {
        tochki: { A: [0, 0], B: [0, 1], C: [w, 1], D: [w, 0], O: { seredina: ['A', 'C'] } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C', { vydelit: 'iskomoe', znachenie: chislo(2 * p.a), otvet: true }),
          otr('B', 'D'),
          storona('A', 'B', chislo(p.a)),
          ug('A', 'O', 'B', { vydelit: 'dano', znachenie: '60°' }),
          shtrih('A', 'O', 1, { sloy: 1 }),
          shtrih('O', 'B', 1, { sloy: 1 }),
          shtrih('O', 'C', 1, { sloy: 1 }),
        ],
        otvet: chislo(2 * p.a),
      };
    },
  },
  {
    id: 55,
    blok: 'X',
    nazvanie: 'Высота к гипотенузе делит её на отрезки → высота',
    fipi: [],
    uslovie: (p) =>
      `Высота, проведённая из вершины прямого угла прямоугольного треугольника, делит гипотенузу на отрезки $${tex(p.p)}$ и $${tex(p.q)}$. Найдите эту высоту.`,
    otvet: (p) => Math.sqrt(p.p * p.q),
    primer: { p: 4, q: 9 },
    sluchaynye: (r) => ({ p: r.int(1, 30), q: r.int(1, 30) }),
    stsena: (p) => {
      const k = clamp(p.p / p.q, 0.2, 5);
      const pp = k;
      const qq = 1;
      return scena(
        {
          tochki: { A: [0, 0], B: [pp + qq, 0], H: [pp, 0], C: [pp, Math.sqrt(pp * qq)] },
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            ...vysota('C', 'A', 'B', 'H', null, {
              vydelit: 'iskomoe',
              znachenie: chislo(Math.sqrt(p.p * p.q)),
              otvet: true,
            }),
            storona('A', 'H', chislo(p.p)),
            storona('H', 'B', chislo(p.q)),
            ug('C', 'A', 'B', { sloy: 1 }),
            ug('H', 'C', 'B', { sloy: 1 }),
          ],
          otvet: chislo(Math.sqrt(p.p * p.q)),
        },
        Math.abs(k - p.p / p.q) > 1e-9,
      );
    },
  },
  {
    id: 56,
    blok: 'X',
    nazvanie: 'Катеты → высота к гипотенузе',
    fipi: [],
    uslovie: (p) =>
      `Катеты прямоугольного треугольника равны $${tex(p.a)}$ и $${tex(p.b)}$. Найдите высоту, проведённую к гипотенузе.`,
    otvet: (p) => (p.a * p.b) / Math.hypot(p.a, p.b),
    primer: { a: 15, b: 20 },
    sluchaynye: (r) => ({ a: r.int(2, 40), b: r.int(2, 40) }),
    stsena: (p, porog) => {
      const A0 = Math.atan(p.b / p.a) / RAD;
      const aV = clamp(A0, porog + 8, 90 - porog - 8);
      return scena(
        {
          tochki: { ...poUglam(aV, 90 - aV), H: { osnovanie: ['C', 'A', 'B'] } },
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'C', chislo(p.a)),
            storona('C', 'B', chislo(p.b)),
            ...vysota('C', 'A', 'B', 'H', null, { vydelit: 'iskomoe' }),
            oblast(['A', 'B', 'C'], { sloy: 1 }),
          ],
          podpisi: false,
          otvet: chislo((p.a * p.b) / Math.hypot(p.a, p.b)),
        },
        aV !== A0,
      );
    },
  },
  {
    id: 57,
    blok: 'X',
    nazvanie: 'Теорема косинусов: две стороны и угол $60^\\circ$ или $120^\\circ$ → третья сторона',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AC=${tex(p.b)}$, $BC=${tex(p.a)}$, угол $C$ равен $${grTex(p.g)}$. Найдите $AB$.`,
    otvet: (p) => Math.sqrt(p.a * p.a + p.b * p.b - 2 * p.a * p.b * Math.cos(p.g * RAD)),
    primer: { a: 8, b: 5, g: 60 },
    sluchaynye: (r) => ({ a: r.int(1, 30), b: r.int(1, 30), g: r.pick([60, 120]) }),
    stsena: (p) => {
      const rat = clamp(p.a / p.b, 0.35, 2.8);
      const a = rat;
      const b = 1;
      const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(p.g * RAD));
      return scena(
        {
          tochki: poStoronam(a, b, c),
          elementy: [
            tri('A', 'B', 'C'),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.g) }),
            storona('A', 'C', chislo(p.b)),
            storona('C', 'B', chislo(p.a)),
            otr('A', 'B', { vydelit: 'iskomoe' }),
          ],
          proverki: [{ ugol: ['A', 'C', 'B'], gradusy: p.g }],
        },
        Math.abs(rat - p.a / p.b) > 1e-9,
      );
    },
  },
  {
    id: 58,
    blok: 'X',
    nazvanie: 'Касательная и секущая из одной точки → отрезок касательной',
    fipi: [],
    uslovie: (p) =>
      `Через точку $A$, лежащую вне окружности, проведены две прямые. Одна прямая касается окружности в точке $K$. Другая прямая пересекает окружность в точках $B$ и $C$, причём $AB=${tex(p.m)}$, $AC=${tex(p.n)}$. Найдите $AK$.`,
    otvet: (p) => Math.sqrt(p.m * p.n),
    primer: { m: 4, n: 9 },
    sluchaynye: (r) => {
      const m = r.int(1, 20);
      return { m, n: m + r.int(1, 30) };
    },
    stsena: (p) => {
      const rat = clamp(p.m / p.n, 0.22, 0.7);
      const m = rat;
      const n = 1;
      const r0 = (n - m) / (2 * 0.8);
      const h = Math.sqrt(r0 * r0 - ((n - m) / 2) ** 2);
      const d = Math.sqrt(m * n + r0 * r0);
      const phi = Math.asin(h / d) / RAD;
      const A: T2 = [d, 0];
      const dir = polar(180 - phi);
      return scena(
        {
          tochki: {
            O: O0,
            A,
            B: [A[0] + dir[0] * m, A[1] + dir[1] * m],
            C: [A[0] + dir[0] * n, A[1] + dir[1] * n],
            K: { kasanie: { iz: 'A', okr: 'w', storona: -1 } },
          },
          okruzhnosti: { w: { centr: 'O', radius: r0 } },
          elementy: [
            okr('w'),
            otr('A', 'C'),
            otr('A', 'K', { vydelit: 'iskomoe' }),
            storona('A', 'B', chislo(p.m)),
            storona('B', 'C', chislo(p.n - p.m), { sloy: 1, vydelit: undefined }),
          ],
          bezPodpisi: ['O'],
          proverki: [{ naOkruzhnosti: 'w', tochki: ['B', 'C', 'K'] }],
          otvet: chislo(Math.sqrt(p.m * p.n)),
        },
        Math.abs(rat - p.m / p.n) > 1e-9,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 59,
    blok: 'X',
    nazvanie: 'Касательная $AB$ и отрезок $AO$ → радиус',
    fipi: [],
    uslovie: (p) =>
      `К окружности с центром в точке $O$ проведены касательная $AB$ ($B$ — точка касания) и секущая $AO$. Найдите радиус окружности, если $AB=${tex(p.t)}$, $AO=${tex(p.d)}$.`,
    otvet: (p) => Math.sqrt(p.d * p.d - p.t * p.t),
    primer: { t: 12, d: 13 },
    sluchaynye: (r) => {
      const d = r.int(3, 40);
      return { t: r.int(1, d - 1), d };
    },
    stsena: (p) => {
      const rat = clamp(Math.sqrt(1 - (p.t / p.d) ** 2), 0.3, 0.85);
      return scena(
        {
          tochki: { O: O0, A: [5 / rat, 0], B: { kasanie: { iz: 'A', okr: 'w', storona: 1 } } },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tochka('O'),
            otr('A', 'O', { vydelit: 'dano', znachenie: chislo(p.d) }),
            otr('A', 'B', { vydelit: 'dano', znachenie: chislo(p.t) }),
            otr('O', 'B', { vydelit: 'iskomoe' }),
            pryam('O', 'B', 'A', { sloy: 1 }),
          ],
          otvet: chislo(Math.sqrt(p.d * p.d - p.t * p.t)),
        },
        Math.abs(rat - Math.sqrt(1 - (p.t / p.d) ** 2)) > 1e-9,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 60,
    blok: 'X',
    nazvanie: 'Угол между хордой и касательной → дуга',
    fipi: [],
    uslovie: (p) =>
      `Угол между хордой $AB$ и касательной $BC$ к окружности равен $${grTex(p.f)}$. Найдите величину меньшей дуги, стягиваемой хордой $AB$. ${VGRADUSAH}`,
    otvet: (p) => 2 * p.f,
    primer: { f: 32 },
    sluchaynye: (r) => ({ f: r.int(2, 89) }),
    stsena: (p, porog) => {
      const fV = clamp(p.f, porog + 3, 85);
      return scena(
        {
          tochki: {
            O: O0,
            B: { naDuge: { okr: 'w', gradus: 270 } },
            A: { naDuge: { okr: 'w', gradus: 270 + 2 * fV } },
            C: [6, -5],
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            tochka('O'),
            otr('A', 'B'),
            pryamaya('B', 'C', { zaA: 0.5, zaB: 0.1 }),
            ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(p.f) }),
            duga('w', 'B', 'A', { vydelit: 'iskomoe', znachenie: gr(2 * p.f), otvet: true }),
            otr('O', 'A', { sloy: 1, stil: 'punktir' }),
            otr('O', 'B', { sloy: 1, stil: 'punktir' }),
            ug('B', 'O', 'A', { sloy: 2, dugi: 2 }),
          ],
          bezPodpisi: ['O'],
          otvet: gr(2 * p.f),
        },
        fV !== p.f,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 61,
    blok: 'X',
    nazvanie: 'Хорда делит окружность в отношении $k:m$ → угол из точки меньшей дуги',
    fipi: [],
    uslovie: (p) =>
      `Хорда $AB$ делит окружность на две части, градусные величины которых относятся как $${p.k}:${p.m}$. Под каким углом видна эта хорда из точки $C$, принадлежащей меньшей дуге окружности? ${VGRADUSAH}`,
    otvet: (p) => (180 * Math.max(p.k, p.m)) / (p.k + p.m),
    primer: { k: 5, m: 7 },
    sluchaynye: (r) => {
      const k = r.int(1, 10);
      return { k, m: k + r.int(1, 10) };
    },
    stsena: (p, porog) => {
      const mal = (360 * Math.min(p.k, p.m)) / (p.k + p.m);
      const malV = clamp(mal, 2 * porog + 20, 170);
      return scena(
        {
          tochki: {
            O: O0,
            A: { naDuge: { okr: 'w', gradus: 90 + malV / 2 } },
            B: { naDuge: { okr: 'w', gradus: 90 - malV / 2 } },
            C: { naDuge: { okr: 'w', gradus: 90 + malV * 0.1 } },
          },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            otr('A', 'B'),
            otr('C', 'A'),
            otr('C', 'B'),
            ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
            duga('w', 'B', 'A', { sloy: 1, znachenie: `${p.k}x` }),
            duga('w', 'A', 'B', { sloy: 1, znachenie: `${p.m}x` }),
          ],
          otvet: gr((180 * Math.max(p.k, p.m)) / (p.k + p.m)),
        },
        malV !== mal,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 62,
    blok: 'X',
    nazvanie: 'Правильный многоугольник: угол между сторонами → число вершин',
    fipi: [],
    uslovie: (p) =>
      `Угол между двумя соседними сторонами правильного многоугольника, вписанного в окружность, равен $${grTex(180 - 360 / p.n)}$. Найдите число вершин многоугольника.`,
    otvet: (p) => p.n,
    primer: { n: 5 },
    sluchaynye: (r) => ({ n: r.int(3, 18) }),
    stsena: (p) => {
      const v = pravilnyy(p.n);
      const imena = v.map((_, i) => `P${i + 1}`);
      return {
        tochki: { O: O0, ...Object.fromEntries(imena.map((n, i) => [n, v[i]!])) },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(imena, { vydelit: 'iskomoe' }),
          ug(imena[p.n - 1]!, imena[0]!, imena[1]!, {
            vydelit: 'dano',
            znachenie: gr(180 - 360 / p.n),
          }),
          tochka('O', { sloy: 1 }),
          otr('O', imena[0]!, { sloy: 1, stil: 'punktir' }),
          otr('O', imena[1]!, { sloy: 1, stil: 'punktir' }),
          ug(imena[0]!, 'O', imena[1]!, { sloy: 2, dugi: 2 }),
        ],
        podpisi: false,
      };
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 63,
    blok: 'X',
    nazvanie: 'Правильный шестиугольник: периметр → диаметр описанной окружности',
    fipi: [],
    uslovie: (p) =>
      `Периметр правильного шестиугольника равен $${tex(p.per)}$. Найдите диаметр описанной окружности.`,
    otvet: (p) => p.per / 3,
    primer: { per: 72 },
    sluchaynye: (r) => ({ per: 6 * r.int(1, 30) }),
    stsena: (p) => {
      const v = naOkruzhnosti([0, 60, 120, 180, 240, 300]);
      return {
        tochki: { O: O0, A: v[3]!, B: v[2]!, C: v[1]!, D: v[0]!, E: v[5]!, F: v[4]! },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'B', 'C', 'D', 'E', 'F']),
          otr('A', 'D', { vydelit: 'iskomoe', znachenie: chislo(p.per / 3), otvet: true }),
          tochka('O'),
          otr('O', 'B', { sloy: 1, stil: 'punktir' }),
          shtrih('A', 'B', 1, { sloy: 1 }),
          shtrih('O', 'A', 1, { sloy: 1 }),
          shtrih('O', 'B', 1, { sloy: 1 }),
        ],
        podpisi: false,
        otvet: chislo(p.per / 3),
      };
    },
    diapazon: { povorot: 30 },
  },
  {
    id: 64,
    blok: 'X',
    nazvanie: 'Правильный треугольник: высота → радиус вписанной окружности',
    fipi: [],
    uslovie: (p) =>
      `Найдите радиус окружности, вписанной в правильный треугольник, высота которого равна $${tex(p.h)}$.`,
    otvet: (p) => p.h / 3,
    primer: { h: 42 },
    sluchaynye: (r) => ({ h: 3 * r.int(1, 30) }),
    stsena: (p) => ({
      tochki: {
        ...poUglam(60, 60),
        H: { seredina: ['A', 'B'] },
        O: { centrVpisannoy: ['A', 'B', 'C'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        okr('w'),
        otr('C', 'O', { vydelit: 'dano', znachenie: chislo(p.h) }),
        otr('O', 'H', { vydelit: 'iskomoe' }),
        pryam('C', 'H', 'B'),
        tochka('O'),
        otr('A', 'O', { sloy: 1, stil: 'punktir' }),
      ],
      podpisi: false,
      otvet: chislo(p.h / 3),
    }),
  },
  {
    id: 65,
    blok: 'X',
    nazvanie: 'Площадь треугольника по двум сторонам и синусу угла между ними',
    fipi: [],
    uslovie: (p) =>
      `В треугольнике $ABC$ $AB=${tex(p.a)}$, $BC=${tex(p.b)}$, $\\sin\\angle ABC=${tex(p.s)}$. Найдите площадь треугольника $ABC$.`,
    otvet: (p) => (p.a * p.b * p.s) / 2,
    primer: { a: 12, b: 15, s: 0.4 },
    sluchaynye: (r) => ({ a: r.int(2, 30), b: r.int(2, 30), s: r.int(1, 99) / 100 }),
    stsena: (p, porog) => {
      const B0 = Math.asin(p.s) / RAD;
      const bV = clamp(B0, porog + 10, 85);
      const rat = clamp(p.b / p.a, 0.4, 2.5);
      /* B в начале, BA по оси x, BC под углом B. */
      return scena(
        {
          tochki: { B: [0, 0], A: [10, 0], C: polar(bV, 10 * rat) },
          elementy: [
            tri('A', 'B', 'C'),
            oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
            ug('A', 'B', 'C', { vydelit: 'dano' }),
            storona('B', 'A', chislo(p.a)),
            storona('B', 'C', chislo(p.b)),
          ],
          otvet: chislo((p.a * p.b * p.s) / 2),
        },
        bV !== B0 || rat !== p.b / p.a,
      );
    },
  },
  {
    id: 66,
    blok: 'X',
    nazvanie: 'Площадь через периметр и радиус вписанной окружности',
    fipi: [],
    uslovie: (p) =>
      `Периметр треугольника равен $${tex(p.per)}$, а радиус вписанной в него окружности равен $${tex(p.r)}$. Найдите площадь этого треугольника.`,
    otvet: (p) => (p.per * p.r) / 2,
    primer: { per: 46, r: 3 },
    sluchaynye: (r) => ({ per: r.int(10, 80), r: r.int(1, 9) }),
    stsena: (p) => ({
      tochki: {
        ...poUglam(68, 52),
        O: { centrVpisannoy: ['A', 'B', 'C'] },
        T: { osnovanie: ['O', 'A', 'B'] },
      },
      okruzhnosti: { w: { vpisannaya: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        okr('w'),
        tochka('O'),
        otr('O', 'T', { vydelit: 'dano', znachenie: chislo(p.r) }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        otr('O', 'A', { sloy: 1, stil: 'punktir' }),
        otr('O', 'B', { sloy: 1, stil: 'punktir' }),
        otr('O', 'C', { sloy: 1, stil: 'punktir' }),
      ],
      podpisi: false,
      otvet: chislo((p.per * p.r) / 2),
    }),
  },
  {
    id: 67,
    blok: 'X',
    nazvanie: 'Прямоугольник: стороны → радиус описанной окружности',
    fipi: [],
    uslovie: (p) =>
      `Найдите радиус окружности, описанной около прямоугольника, две стороны которого равны $${tex(p.a)}$ и $${tex(p.b)}$.`,
    otvet: (p) => Math.hypot(p.a, p.b) / 2,
    primer: { a: 6, b: 8 },
    sluchaynye: (r) => ({ a: r.int(1, 30), b: r.int(1, 30) }),
    stsena: (p) => {
      const rat = clamp(p.b / p.a, 0.4, 2.5);
      return scena(
        {
          tochki: { A: [0, 0], B: [0, 1], C: [rat, 1], D: [rat, 0], O: { seredina: ['A', 'C'] } },
          okruzhnosti: { w: { centr: 'O', cherez: 'A' } },
          elementy: [
            okr('w'),
            mn(['A', 'B', 'C', 'D']),
            pryam('B', 'A', 'D'),
            storona('A', 'B', chislo(p.a)),
            storona('A', 'D', chislo(p.b)),
            tochka('O'),
            otr('O', 'C', { vydelit: 'iskomoe' }),
            otr('A', 'O', { sloy: 1, stil: 'punktir' }),
          ],
          podpisi: false,
          otvet: chislo(Math.hypot(p.a, p.b) / 2),
        },
        rat !== p.b / p.a,
      );
    },
  },
  {
    id: 68,
    blok: 'X',
    nazvanie: 'Вписанный четырёхугольник: дуги под сторонами $BC$ и $CD$ → угол $C$',
    fipi: [],
    uslovie: (p) =>
      `Стороны $BC$ и $CD$ четырёхугольника $ABCD$ стягивают дуги описанной окружности, градусные величины которых равны соответственно $${grTex(p.b)}$ и $${grTex(p.c)}$. Найдите угол $C$ этого четырёхугольника. ${VGRADUSAH}`,
    otvet: (p) => (360 - p.b - p.c) / 2,
    primer: { b: 107, c: 39 },
    sluchaynye: (r) => {
      const b = r.int(30, 150);
      return { b, c: r.int(30, 300 - b) };
    },
    stsena: (p, porog) => {
      const ost = 360 - p.b - p.c;
      const ab = Math.max(ost * 0.45, 2 * porog);
      const v = vpisannyyPoDugam([ab, p.b, p.c]);
      return {
        tochki: { O: O0, ...v },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          mn(['A', 'B', 'C', 'D']),
          ug('B', 'C', 'D', { vydelit: 'iskomoe', znachenie: gr(ost / 2), otvet: true }),
          duga('w', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.b) }),
          duga('w', 'D', 'C', { vydelit: 'dano', znachenie: gr(p.c) }),
          duga('w', 'B', 'D', { sloy: 1, znachenie: gr(ost), otvet: true }),
        ],
        bezPodpisi: ['O'],
        otvet: gr(ost / 2),
      };
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 69,
    blok: 'X',
    nazvanie: 'Катеты → медиана к гипотенузе',
    fipi: [],
    uslovie: (p) =>
      `Катеты прямоугольного треугольника равны $${tex(p.a)}$ и $${tex(p.b)}$. Найдите медиану, проведённую к гипотенузе.`,
    otvet: (p) => Math.hypot(p.a, p.b) / 2,
    primer: { a: 12, b: 16 },
    sluchaynye: (r) => ({ a: r.int(2, 40), b: r.int(2, 40) }),
    stsena: (p, porog) => {
      const A0 = Math.atan(p.b / p.a) / RAD;
      const aV = clamp(A0, porog + 8, 90 - porog - 8);
      return scena(
        {
          tochki: { ...poUglam(aV, 90 - aV), M: { seredina: ['A', 'B'] } },
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B'),
            storona('A', 'C', chislo(p.a)),
            storona('C', 'B', chislo(p.b)),
            otr('C', 'M', { vydelit: 'iskomoe' }),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
          ],
          podpisi: false,
          otvet: chislo(Math.hypot(p.a, p.b) / 2),
        },
        aV !== A0,
      );
    },
  },
  {
    id: 70,
    blok: 'X',
    nazvanie: 'Равнобедренная трапеция с перпендикулярными диагоналями: высота → средняя линия',
    fipi: [],
    uslovie: (p) =>
      `В равнобедренной трапеции диагонали перпендикулярны. Высота трапеции равна $${tex(p.h)}$. Найдите её среднюю линию.`,
    otvet: (p) => p.h,
    primer: { h: 12 },
    sluchaynye: (r) => ({ h: r.int(1, 40) }),
    stsena: (p) => ({
      tochki: {
        ...ravnobokaya(10, 4, 7),
        O: {
          peresechenie: [
            ['A', 'C'],
            ['B', 'D'],
          ],
        },
        H: { osnovanie: ['B', 'A', 'D'] },
        M: { seredina: ['A', 'B'] },
        N: { seredina: ['D', 'C'] },
      },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        otr('A', 'C'),
        otr('B', 'D'),
        pryam('B', 'O', 'C'),
        ...vysota('B', 'A', 'D', 'H', null, { vydelit: 'dano', znachenie: chislo(p.h) }),
        otr('M', 'N', { vydelit: 'iskomoe' }),
      ],
      podpisi: false,
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['C', 'D'],
          ],
        },
      ],
      otvet: chislo(p.h),
    }),
  },
  {
    id: 71,
    blok: 'X',
    nazvanie: 'Трапеция: основания → отрезок между серединами диагоналей',
    fipi: [],
    uslovie: (p) =>
      `Основания трапеции равны $${tex(p.a)}$ и $${tex(p.b)}$. Найдите отрезок, соединяющий середины диагоналей трапеции.`,
    otvet: (p) => Math.abs(p.a - p.b) / 2,
    primer: { a: 32, b: 24 },
    sluchaynye: (r) => {
      const b = r.int(2, 30);
      return { a: b + 2 * r.int(1, 15), b };
    },
    stsena: (p) => {
      const bol = Math.max(p.a, p.b);
      const mal = Math.min(p.a, p.b);
      const verh = clamp(mal / bol, 0.25, 0.75) * 10;
      return scena(
        {
          tochki: {
            ...trapeciya(10, verh, 5, (10 - verh) * 0.4),
            P: { seredina: ['A', 'C'] },
            Q: { seredina: ['B', 'D'] },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('A', 'C'),
            otr('B', 'D'),
            otr('P', 'Q', { vydelit: 'iskomoe' }),
            storona('A', 'D', chislo(bol)),
            storona('B', 'C', chislo(mal)),
            shtrih('A', 'P', 1),
            shtrih('P', 'C', 1),
            shtrih('B', 'Q', 2),
            shtrih('Q', 'D', 2),
          ],
          podpisi: false,
          otvet: chislo((bol - mal) / 2),
        },
        Math.abs(verh - (mal / bol) * 10) > 1e-9,
      );
    },
  },
  {
    id: 72,
    blok: 'X',
    nazvanie: 'Ромб с углом $30^\\circ$: радиус вписанной окружности → сторона',
    fipi: [],
    uslovie: (p) =>
      `Острый угол ромба равен $30^\\circ$. Радиус вписанной в этот ромб окружности равен $${tex(p.r)}$. Найдите сторону ромба.`,
    otvet: (p) => 4 * p.r,
    primer: { r: 2 },
    sluchaynye: (r) => ({ r: r.int(1, 20) }),
    stsena: (p) => ({
      tochki: {
        ...romb(30),
        O: { seredina: ['A', 'C'] },
        T: { osnovanie: ['O', 'A', 'D'] },
        H: { osnovanie: ['B', 'A', 'D'] },
      },
      okruzhnosti: { w: { centr: 'O', kasaetsya: ['A', 'D'] } },
      elementy: [
        mn(['A', 'B', 'C', 'D']),
        okr('w'),
        tochka('O'),
        otr('O', 'T', { vydelit: 'dano', znachenie: chislo(p.r) }),
        ug('D', 'A', 'B', { vydelit: 'dano', znachenie: '30°' }),
        otr('A', 'B', { vydelit: 'iskomoe' }),
        ...vysota('B', 'A', 'D', 'H', null, { sloy: 1, znachenie: chislo(2 * p.r) }),
      ],
      podpisi: false,
      otvet: chislo(4 * p.r),
    }),
  },
  {
    id: 73,
    blok: 'X',
    nazvanie: 'Хорда $AB$ и угол $OAB=60^\\circ$ → радиус',
    fipi: [],
    uslovie: (p) =>
      `Центральный угол $AOB$ опирается на хорду $AB$ длиной $${tex(p.c)}$. При этом угол $OAB$ равен $60^\\circ$. Найдите радиус окружности.`,
    otvet: (p) => p.c,
    primer: { c: 6 },
    sluchaynye: (r) => ({ c: r.int(1, 40) }),
    stsena: (p) => ({
      tochki: {
        O: O0,
        A: { naDuge: { okr: 'w', gradus: 210 } },
        B: { naDuge: { okr: 'w', gradus: 270 } },
      },
      okruzhnosti: OKR,
      elementy: [
        okr('w'),
        tri('O', 'A', 'B'),
        ug('O', 'A', 'B', { vydelit: 'dano', znachenie: '60°' }),
        storona('A', 'B', chislo(p.c)),
        otr('O', 'A', { vydelit: 'iskomoe' }),
        shtrih('O', 'A', 1, { sloy: 1 }),
        shtrih('O', 'B', 1, { sloy: 1 }),
      ],
      otvet: chislo(p.c),
    }),
    diapazon: { povorot: 180 },
  },
  {
    id: 74,
    blok: 'X',
    nazvanie: 'Вписанный четырёхугольник: углы $A$, $B$, $C$ относятся как $k:m:n$ → угол $D$',
    fipi: [],
    uslovie: (p) =>
      `Углы $A$, $B$, $C$ четырёхугольника $ABCD$ относятся как $${p.k}:${p.m}:${p.n}$. Найдите угол $D$, если около данного четырёхугольника можно описать окружность. ${VGRADUSAH}`,
    otvet: (p) => 180 - (180 * p.m) / (p.k + p.n),
    primer: { k: 1, m: 2, n: 3 },
    sluchaynye: (r) => {
      const k = r.int(1, 6);
      const n = r.int(1, 6);
      return { k, m: r.int(1, k + n - 1), n };
    },
    stsena: (p, porog) => {
      const A = (180 * p.k) / (p.k + p.n);
      const B = (180 * p.m) / (p.k + p.n);
      /* ∠A опирается на дугу BCD = 2A, ∠B — на дугу CDA = 2B. */
      const lo = Math.max(0, 2 * A + 2 * B - 360);
      const hi = Math.min(2 * A, 2 * B);
      const cd = (lo + hi) / 2;
      const d: [number, number, number] = [360 - 2 * A - 2 * B + cd, 2 * A - cd, cd];
      const ok = d.every((x) => x >= 2 * porog) && 360 - d[0] - d[1] - d[2] >= 2 * porog;
      return scena(
        {
          tochki: { O: O0, ...vpisannyyPoDugam(ok ? d : [90, 90, 90]) },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            mn(['A', 'B', 'C', 'D']),
            ug('D', 'A', 'B', { vydelit: 'dano', znachenie: `${p.k}x` }),
            ug('A', 'B', 'C', { vydelit: 'dano', dugi: 2, znachenie: `${p.m}x` }),
            ug('B', 'C', 'D', { vydelit: 'dano', dugi: 3, znachenie: `${p.n}x` }),
            ug('C', 'D', 'A', { vydelit: 'iskomoe' }),
          ],
          bezPodpisi: ['O'],
          otvet: gr(180 - B),
        },
        !ok,
      );
    },
    diapazon: { povorot: 180 },
  },
  {
    id: 75,
    blok: 'X',
    nazvanie: 'Внешний угол, несмежные углы в отношении $k:m$ → больший из них',
    fipi: [],
    uslovie: (p) =>
      `Один из внешних углов треугольника равен $${grTex(p.e)}$. Углы, не смежные с данным внешним углом, относятся как $${p.k}:${p.m}$. Найдите наибольший из них. ${VGRADUSAH}`,
    otvet: (p) => (p.e * Math.max(p.k, p.m)) / (p.k + p.m),
    primer: { e: 85, k: 2, m: 3 },
    sluchaynye: (r) => ({ e: r.int(30, 170), k: r.int(1, 7), m: r.int(1, 7) }),
    stsena: (p, porog) => {
      const a = (p.e * p.k) / (p.k + p.m);
      const b = (p.e * p.m) / (p.k + p.m);
      const v = uglyTreugolnika([a, 180 - p.e, b], porog);
      const t = poUglam(v[0], v[1]);
      const bolA = a >= b;
      return scena(
        {
          tochki: { A: t.A, C: t.B, B: t.C, D: { naPryamoy: ['A', 'C', 1.35] } },
          elementy: [
            tri('A', 'C', 'B'),
            prod('A', 'C', { doTochki: 'D', sploshnoe: true }),
            ug('B', 'C', 'D', { vydelit: 'dano', znachenie: gr(p.e) }),
            ug('C', 'A', 'B', bolA ? { vydelit: 'iskomoe', dugi: 2 } : { dugi: 2 }),
            ug('A', 'B', 'C', bolA ? { dugi: 3 } : { vydelit: 'iskomoe', dugi: 3 }),
            ug('C', 'A', 'B', { sloy: 1, dugi: 2, znachenie: `${p.k}x` }),
            ug('A', 'B', 'C', { sloy: 1, dugi: 3, znachenie: `${p.m}x` }),
          ],
          podpisi: false,
          otvet: gr(Math.max(a, b)),
        },
        v.some((x, i) => Math.abs(x - [a, 180 - p.e, b][i]!) > 1e-9),
      );
    },
  },
];
