/**
 * Блоки II–IV. Четырёхугольники и точки пересечения (прототипы
 * 10–13), площадь и теорема Пифагора (14–18), подобие и средняя
 * линия (19–22). Задачи 37–84 Блока 1.
 */

import { RAD, projT } from '../geom';
import {
  parallelogramm,
  poStoronam,
  poUglam,
  ravnobedrennyy,
  romb,
  trapeciya,
  uglyTreugolnika,
} from '../figury';
import type { Element, T2 } from '../types';
import {
  type PrototipChertezha,
  chislo,
  clamp,
  gr,
  grTex,
  mn,
  oblast,
  otr,
  pryam,
  scena,
  shtrih,
  tex,
  tri,
  ug,
  vysota,
} from './dsl';

const VGRADUSAH = 'Ответ дайте в градусах.';

/** Значение у стороны без линии (сторона уже нарисована многоугольником). */
const storona = (a: string, b: string, zn: string, o: Partial<Element> = {}): Element =>
  ({
    tip: 'otrezok',
    a,
    b,
    tolkoShtrihi: true,
    vydelit: 'dano',
    znachenie: zn,
    ...o,
  }) as Element;

const nod = (x: number, y: number): number => (y === 0 ? x : nod(y, x % y));

/** Где основание перпендикуляра из P на AB: внутри отрезка или за концом. */
function gdeOsnovanie(p: T2, a: T2, b: T2): 'a' | 'b' | null {
  const t = projT(p, a, b);
  return t < -1e-9 ? 'a' : t > 1 + 1e-9 ? 'b' : null;
}

export const BLOK_II_IV: PrototipChertezha[] = [
  {
    id: 10,
    blok: 'II',
    nazvanie: 'Высоты $BD$ и $CE$ пересекаются в $O$: угол $A$ → угол $DOE$',
    fipi: [37, 38, 39, 40],
    uslovie: (p) =>
      p.k
        ? `В остроугольном треугольнике $ABC$ угол $A$ равен $${grTex(p.a)}$, $BD$ и $CE$ — высоты, пересекающиеся в точке $O$. Найдите угол $DOE$. ${VGRADUSAH}`
        : `В треугольнике $ABC$ угол $A$ равен $${grTex(p.a)}$, углы $B$ и $C$ — острые, высоты $BD$ и $CE$ пересекаются в точке $O$. Найдите угол $DOE$. ${VGRADUSAH}`,
    otvet: (p) => 180 - p.a,
    primer: { a: 44, b: 64, k: 0 },
    sluchaynye: (r) => {
      const a = r.int(14, 80);
      const b = r.int(Math.max(91 - a, 14), 86);
      return { a, b, k: r.int(0, 1) };
    },
    stsena: (p, porog) => {
      const c = 180 - p.a - p.b;
      /* Остроугольный: на рисунке углы не ближе 12° к прямому — основания высот не сливаются с вершинами. */
      const [aV, bV, cV] = uglyTreugolnika([p.a, p.b, c], porog, 78);
      /* k = 0: A сверху, основание BC; k = 1: A слева внизу, основание AB. */
      const t = p.k ? poUglam(aV, bV) : poUglam(bV, cV);
      const tochki = p.k ? { A: t.A, B: t.B, C: t.C } : { B: t.A, C: t.B, A: t.C };
      return scena(
        {
          tochki: {
            ...tochki,
            D: { osnovanie: ['B', 'A', 'C'] },
            E: { osnovanie: ['C', 'A', 'B'] },
            O: {
              peresechenie: [
                ['B', 'D'],
                ['C', 'E'],
              ],
            },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('B', 'D'),
            otr('C', 'E'),
            pryam('A', 'D', 'B', { podsvetka: [1] }),
            pryam('A', 'E', 'C', { podsvetka: [1] }),
            ug('B', 'A', 'C', { vydelit: 'dano', znachenie: gr(p.a), podsvetka: [2] }),
            ug('D', 'O', 'E', {
              vydelit: 'iskomoe',
              znachenie: gr(180 - p.a),
              otvet: true,
              podsvetka: [2],
            }),
          ],
          proverki: [
            { ugol: ['B', 'A', 'C'], gradusy: p.a },
            { ugol: ['A', 'D', 'B'], vid: 'pryamoy' },
            { ugol: ['A', 'B', 'C'], vid: 'ostryy' },
            { ugol: ['A', 'C', 'B'], vid: 'ostryy' },
          ],
          otvet: gr(180 - p.a),
          shagov: 2,
        },
        Math.abs(aV - p.a) + Math.abs(bV - p.b) > 1e-9,
      );
    },
  },
  {
    id: 11,
    blok: 'II',
    nazvanie: 'Биссектрисы $AD$ и $BE$: угол $C$ → угол $AOB$',
    fipi: [41, 42, 43, 44],
    uslovie: (p) =>
      `В треугольнике $ABC$ угол $C$ равен $${grTex(p.c)}$, биссектрисы $AD$ и $BE$ пересекаются в точке $O$. Найдите угол $AOB$. ${VGRADUSAH}`,
    otvet: (p) => 90 + p.c / 2,
    primer: { c: 58, a: 61 },
    sluchaynye: (r) => {
      const c = r.int(10, 150);
      const a = r.int(Math.ceil((180 - c) * 0.3), Math.floor((180 - c) * 0.7));
      return { c, a };
    },
    stsena: (p, porog) => {
      const b = 180 - p.c - p.a;
      /* Угол C не больше 120°: иначе треугольник плоский и точке O негде подписаться. */
      const [aV, bV] = uglyTreugolnika([p.a, b, p.c], 2 * porog, 120);
      const { A, B, C } = poUglam(aV, bV);
      return scena(
        {
          tochki: {
            A,
            B,
            C,
            D: { bissektrisa: ['A', 'B', 'C'] },
            E: { bissektrisa: ['B', 'A', 'C'] },
            O: {
              peresechenie: [
                ['A', 'D'],
                ['B', 'E'],
              ],
            },
          },
          elementy: [
            tri('A', 'B', 'C'),
            otr('A', 'D'),
            otr('B', 'E'),
            ug('C', 'A', 'D', { podsvetka: [1] }),
            ug('D', 'A', 'B', { podsvetka: [1] }),
            ug('A', 'B', 'E', { dugi: 2, podsvetka: [1] }),
            ug('E', 'B', 'C', { dugi: 2, podsvetka: [1] }),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(p.c) }),
            ug('A', 'O', 'B', {
              vydelit: 'iskomoe',
              znachenie: gr(90 + p.c / 2),
              otvet: true,
              podsvetka: [2],
            }),
          ],
          proverki: [{ ugol: ['A', 'C', 'B'], gradusy: p.c }],
          otvet: gr(90 + p.c / 2),
          shagov: 2,
        },
        Math.abs(aV - p.a) > 1e-9 || Math.abs(bV - b) > 1e-9,
      );
    },
  },
  {
    id: 12,
    blok: 'II',
    nazvanie: 'Параллелограмм: углы отличаются на $d$ → меньший или больший угол',
    fipi: [45, 46, 47, 48],
    uslovie: (p) =>
      `Один угол параллелограмма больше другого на $${grTex(p.d)}$. Найдите ${p.k ? 'больший' : 'меньший'} угол. ${VGRADUSAH}`,
    otvet: (p) => (p.k ? (180 + p.d) / 2 : (180 - p.d) / 2),
    primer: { d: 36, k: 0 },
    sluchaynye: (r) => ({ d: r.int(2, 160), k: r.int(0, 1) }),
    stsena: (p, porog) => {
      const m = (180 - p.d) / 2;
      const mV = clamp(m, Math.max(porog, 35), 85);
      const t = parallelogramm(mV, 10, 6);
      const ans = p.k ? 180 - m : m;
      return scena(
        {
          tochki: t,
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            p.k
              ? ug('A', 'B', 'C', {
                  vydelit: 'iskomoe',
                  znachenie: gr(ans),
                  otvet: true,
                  podsvetka: [2],
                })
              : ug('D', 'A', 'B', {
                  vydelit: 'iskomoe',
                  znachenie: gr(ans),
                  otvet: true,
                  podsvetka: [2],
                }),
            p.k
              ? ug('D', 'A', 'B', { sloy: 1, dugi: 2, znachenie: 'x' })
              : ug('A', 'B', 'C', { sloy: 1, dugi: 2, znachenie: `x + ${chislo(p.d)}°` }),
          ],
          podpisi: false,
          proverki: [
            {
              parallelny: [
                ['A', 'B'],
                ['D', 'C'],
              ],
            },
          ],
          otvet: gr(ans),
          shagov: 2,
        },
        mV !== m,
      );
    },
  },
  {
    id: 13,
    blok: 'II',
    nazvanie: 'Ромб: угол ромба → угол между диагональю и стороной',
    fipi: [49, 50, 51, 52],
    uslovie: (p) => {
      const [dano, isk] = ROMB[p.k]!;
      return `В ромбе $ABCD$ угол $${dano.join('')}$ равен $${grTex(p.g)}$. Найдите угол $${isk.join('')}$. ${VGRADUSAH}`;
    },
    otvet: (p) => (180 - p.g) / 2,
    primer: { g: 148, k: 0 },
    sluchaynye: (r) => ({ g: r.int(4, 176), k: r.int(0, 3) }),
    stsena: (p, porog) => {
      const gV = clamp(p.g, Math.max(porog, 30), 180 - 2 * porog);
      const alfa = p.k < 2 ? gV : 180 - gV;
      const [dano, isk, diag] = ROMB[p.k]!;
      const ans = (180 - p.g) / 2;
      return scena(
        {
          tochki: romb(alfa),
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr(diag[0], diag[1]),
            ug(dano[0], dano[1], dano[2], { vydelit: 'dano', znachenie: gr(p.g) }),
            ug(isk[0], isk[1], isk[2], {
              vydelit: 'iskomoe',
              znachenie: gr(ans),
              otvet: true,
              podsvetka: [2],
            }),
            shtrih('A', 'B', 1, { sloy: 1 }),
            shtrih('B', 'C', 1, { sloy: 1 }),
            shtrih('C', 'D', 1, { sloy: 1 }),
            shtrih('D', 'A', 1, { sloy: 1 }),
          ],
          proverki: [
            {
              ravny: [
                ['A', 'B'],
                ['B', 'C'],
                ['C', 'D'],
                ['D', 'A'],
              ],
            },
          ],
          otvet: gr(ans),
          shagov: 2,
        },
        gV !== p.g,
      );
    },
  },
  {
    id: 14,
    blok: 'III',
    nazvanie: 'Параллелограмм: стороны и высота к меньшей → высота к большей',
    fipi: [53, 54, 55, 56],
    uslovie: (p) =>
      `Стороны параллелограмма равны $${tex(p.a)}$ и $${tex(p.b)}$. Высота, опущенная на меньшую из этих сторон, равна $${tex(p.h)}$. Найдите высоту, опущенную на большую сторону параллелограмма.`,
    otvet: (p) => (p.a * p.h) / p.b,
    primer: { a: 5, b: 10, h: 3 },
    /* Ответ ЕГЭ — целое: высота h кратна b / НОД(a, b). */
    sluchaynye: (r) => {
      for (;;) {
        const a = r.int(3, 30);
        const b = r.int(a + 1, a + 20);
        const shag = b / nod(a, b);
        if (shag < b) return { a, b, h: shag * r.int(1, Math.floor((b - 1) / shag)) };
      }
    },
    stsena: (p, porog) => {
      const A0 = Math.asin(p.h / p.b) / RAD;
      /* Основание высоты к CD не должно слипаться с вершиной D: угол
         рисунка растёт, пока основание не отойдёт на 15% стороны. */
      let aV = clamp(A0, Math.max(porog, 25), 80);
      let t = parallelogramm(aV, p.b, p.a);
      for (let i = 0; i < 12 && Math.abs(projT(t.B, t.D, t.C)) < 0.15; i += 1) {
        aV = Math.min(aV + 5, 85);
        t = parallelogramm(aV, p.b, p.a);
      }
      const vne = gdeOsnovanie(t.B, t.D, t.C);
      return scena(
        {
          tochki: { ...t, H: { osnovanie: ['B', 'A', 'D'] }, K: { osnovanie: ['B', 'D', 'C'] } },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            ...vysota('B', 'D', 'C', 'K', vne, { vydelit: 'dano', znachenie: chislo(p.h) }),
            ...vysota('B', 'A', 'D', 'H', null, {
              vydelit: 'iskomoe',
              znachenie: chislo((p.a * p.h) / p.b),
              otvet: true,
            }),
            storona('A', 'D', chislo(p.b)),
            storona('D', 'C', chislo(p.a)),
          ],
          podpisi: false,
          proverki: [
            {
              parallelny: [
                ['A', 'B'],
                ['D', 'C'],
              ],
            },
          ],
          otvet: chislo((p.a * p.h) / p.b),
        },
        Math.abs(aV - A0) > 1e-9,
      );
    },
  },
  {
    id: 15,
    blok: 'III',
    nazvanie: 'Площадь параллелограмма и середина стороны → площадь трапеции',
    fipi: [57, 58, 59, 60],
    uslovie: (p) => {
      const [t, storonaS, trap] = SEREDINA[p.k]!;
      return `Площадь параллелограмма $ABCD$ равна $${tex(p.s)}$. Точка $${t}$ — середина стороны $${storonaS}$. Найдите площадь трапеции $${trap}$.`;
    },
    otvet: (p) => (3 * p.s) / 4,
    primer: { s: 92, k: 0, u: 55 },
    sluchaynye: (r) => ({ s: r.int(4, 200), k: r.int(0, 3), u: r.int(40, 75) }),
    stsena: (p) => {
      const t = parallelogramm(p.u ?? 55, 10, 6);
      const [m, , trap, konci, otrezok] = SEREDINA[p.k]!;
      return {
        tochki: { ...t, [m]: { seredina: konci } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr(otrezok[0], otrezok[1]),
          shtrih(konci[0], m, 1),
          shtrih(m, konci[1], 1),
          oblast(trap.split(''), { vydelit: 'iskomoe' }),
        ],
        proverki: [
          {
            parallelny: [
              ['A', 'B'],
              ['D', 'C'],
            ],
          },
        ],
        otvet: chislo((3 * p.s) / 4),
      };
    },
  },
  {
    id: 16,
    blok: 'III',
    nazvanie: 'Треугольник: две стороны и высота к большей → высота к меньшей',
    fipi: [61, 62, 63, 64],
    uslovie: (p) =>
      `Две стороны треугольника равны $${tex(p.a)}$ и $${tex(p.b)}$. Высота, опущенная на бо́льшую из этих сторон, равна $${tex(p.h)}$. Найдите высоту, опущенную на меньшую из этих сторон треугольника.`,
    otvet: (p) => (p.b * p.h) / p.a,
    primer: { a: 21, b: 28, h: 15 },
    sluchaynye: (r) => {
      const a = r.int(5, 40);
      return { a, b: r.int(a + 1, a + 30), h: r.int(1, a - 1) };
    },
    stsena: (p, porog) => {
      const g0 = Math.asin(p.h / p.a) / RAD;
      /* CA = b (бо́льшая), CB = a; основание AB горизонтально. */
      const bV = Math.min(p.b, p.a * 2.2);
      const postroit = (g: number) => {
        const c = Math.sqrt(p.a * p.a + bV * bV - 2 * p.a * bV * Math.cos(g * RAD));
        return poStoronam(p.a, bV, c);
      };
      /* Основания высот не слипаются с вершинами: угол C рисунка
         подбирается ближайшим к настоящему, при котором оба основания
         отходят от вершин на 12% стороны. */
      const daleko = (t: ReturnType<typeof postroit>) =>
        [projT(t.B, t.C, t.A), projT(t.A, t.C, t.B)].every(
          (x) => Math.abs(x) > 0.12 && Math.abs(x - 1) > 0.12,
        );
      let gV = clamp(g0, Math.max(porog, 30), 80);
      for (const d of [0, 5, -5, 10, -10, 15, -15, 20, 25, 30]) {
        const g = clamp(g0 + d, Math.max(porog, 30), 80);
        if (daleko(postroit(g))) {
          gV = g;
          break;
        }
      }
      const t = postroit(gV);
      return scena(
        {
          tochki: { ...t, K: { osnovanie: ['B', 'A', 'C'] }, H: { osnovanie: ['A', 'B', 'C'] } },
          elementy: [
            tri('A', 'B', 'C'),
            ...vysota('B', 'C', 'A', 'K', gdeOsnovanie(t.B, t.C, t.A), {
              vydelit: 'dano',
              znachenie: chislo(p.h),
            }),
            ...vysota('A', 'C', 'B', 'H', gdeOsnovanie(t.A, t.C, t.B), {
              vydelit: 'iskomoe',
              znachenie: chislo((p.b * p.h) / p.a),
              otvet: true,
            }),
            storona('C', 'A', chislo(p.b)),
            storona('C', 'B', chislo(p.a)),
          ],
          podpisi: false,
          otvet: chislo((p.b * p.h) / p.a),
        },
        Math.abs(gV - g0) > 1e-9 || bV !== p.b,
      );
    },
  },
  {
    id: 17,
    blok: 'III',
    nazvanie: 'Равнобедренный с углом $30^\\circ$ при вершине: боковая сторона → площадь',
    fipi: [65, 66, 67, 68],
    uslovie: (p) =>
      `Угол при вершине, противолежащей основанию равнобедренного треугольника, равен $30^\\circ$. Боковая сторона треугольника равна $${tex(p.a)}$. Найдите площадь этого треугольника.`,
    otvet: (p) => (p.a * p.a) / 4,
    primer: { a: 11 },
    sluchaynye: (r) => ({ a: r.int(3, 40) }),
    stsena: (p) => ({
      tochki: { ...ravnobedrennyy(30), H: { osnovanie: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1, { znachenie: chislo(p.a), vydelit: 'dano' }),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '30°' }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        ...vysota('A', 'B', 'C', 'H', null, { sloy: 1, znachenie: chislo(p.a / 2) }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: 30 },
      ],
      otvet: chislo((p.a * p.a) / 4),
    }),
  },
  {
    id: 18,
    blok: 'III',
    nazvanie: 'Равносторонний: высота $k\\sqrt3$ → сторона',
    fipi: [69, 70, 71, 72],
    uslovie: (p) =>
      `В равностороннем треугольнике $ABC$ высота $CH$ равна $${tex(p.k)}\\sqrt{3}$. Найдите $AB$.`,
    otvet: (p) => 2 * p.k,
    primer: { k: 45 },
    sluchaynye: (r) => ({ k: r.int(1, 60) }),
    stsena: (p) => ({
      tochki: { ...poUglam(60, 60), H: { seredina: ['A', 'B'] } },
      elementy: [
        tri('A', 'B', 'C'),
        otr('C', 'H', { vydelit: 'dano', znachenie: `${chislo(p.k)}√3` }),
        pryam('C', 'H', 'B'),
        otr('A', 'B', { vydelit: 'iskomoe', znachenie: chislo(2 * p.k), otvet: true }),
        /* Угол равностороннего треугольника — известное число, не вычисленное. */
        ug('C', 'A', 'B', { sloy: 1, vydelit: 'dano', znachenie: '60°' }),
        shtrih('A', 'C', 1, { sloy: 1 }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'B'],
            ['B', 'C'],
            ['A', 'C'],
          ],
        },
      ],
      otvet: chislo(2 * p.k),
    }),
  },
  {
    id: 19,
    blok: 'IV',
    nazvanie: 'Средняя линия: площадь $ABC$ → площадь $CDE$',
    fipi: [73, 74],
    uslovie: (p) =>
      `Площадь треугольника $ABC$ равна $${tex(p.s)}$, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь треугольника $CDE$.`,
    otvet: (p) => p.s / 4,
    primer: { s: 36, u: 30 },
    sluchaynye: (r) => ({ s: r.int(4, 200), u: r.int(25, 60) }),
    stsena: (p) => sredLiniya(p.u ?? 30, ['C', 'D', 'E'], 'iskomoe', p.s / 4),
  },
  {
    id: 20,
    blok: 'IV',
    nazvanie: 'Средняя линия: площадь $ABC$ → площадь трапеции $ABED$',
    fipi: [75, 76],
    uslovie: (p) =>
      `Площадь треугольника $ABC$ равна $${tex(p.s)}$, $DE$ — средняя линия, параллельная стороне $AB$. Найдите площадь трапеции $ABED$.`,
    otvet: (p) => (3 * p.s) / 4,
    primer: { s: 24, u: 30 },
    sluchaynye: (r) => ({ s: r.int(4, 200), u: r.int(25, 60) }),
    stsena: (p) => sredLiniya(p.u ?? 30, ['A', 'B', 'E', 'D'], 'iskomoe', (3 * p.s) / 4),
  },
  {
    id: 21,
    blok: 'IV',
    nazvanie: 'Средняя линия: площадь отсечённого треугольника → площадь $ABC$',
    fipi: [77, 78, 79, 80],
    uslovie: (p) => {
      const [ml, tr] = OTSECHENNYY[p.k]!;
      return `В треугольнике $ABC$ $${ml}$ — средняя линия. Площадь треугольника $${tr}$ равна $${tex(p.s)}$. Найдите площадь треугольника $ABC$.`;
    },
    otvet: (p) => 4 * p.s,
    primer: { s: 4, k: 0 },
    sluchaynye: (r) => ({ s: r.int(1, 60), k: r.int(0, 2) }),
    stsena: (p) => {
      const [ml, tr, tochki] = OTSECHENNYY[p.k]!;
      const t = poUglam(72, 58);
      return {
        tochki: { ...t, ...tochki },
        elementy: [
          tri('A', 'B', 'C', { vydelit: 'iskomoe' }),
          otr(ml[0]!, ml[1]!),
          oblast(tr.split(''), { vydelit: 'dano' }),
          ...SHTRIHI_SEREDIN[p.k]!.map(([a, b, n]) => shtrih(a, b, n, { sloy: 1 })),
        ],
        proverki: [{ parallelny: PARALLEL[p.k]! }],
        otvet: chislo(4 * p.s),
      };
    },
  },
  {
    id: 22,
    blok: 'IV',
    nazvanie: 'Трапеция: основания → больший отрезок средней линии',
    fipi: [81, 82, 83, 84],
    uslovie: (p) =>
      `Основания трапеции равны $${tex(p.a)}$ и $${tex(p.b)}$. Найдите больший из отрезков, на которые делит среднюю линию этой трапеции одна из её диагоналей.`,
    otvet: (p) => Math.max(p.a, p.b) / 2,
    primer: { a: 4, b: 10 },
    sluchaynye: (r) => {
      const a = r.int(1, 20);
      return { a, b: r.int(a + 1, a + 30) };
    },
    stsena: (p) => {
      const mal = Math.min(p.a, p.b);
      const bol = Math.max(p.a, p.b);
      const verh = clamp(mal / bol, 0.3, 0.8) * 10;
      return scena(
        {
          tochki: {
            ...trapeciya(10, verh, 5, (10 - verh) * 0.35),
            M: { seredina: ['A', 'B'] },
            N: { seredina: ['D', 'C'] },
            K: {
              peresechenie: [
                ['M', 'N'],
                ['A', 'C'],
              ],
            },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('M', 'K'),
            otr('K', 'N', { vydelit: 'iskomoe', znachenie: chislo(bol / 2), otvet: true }),
            otr('A', 'C'),
            storona('A', 'D', chislo(bol)),
            storona('B', 'C', chislo(mal)),
            shtrih('A', 'M', 1, { sloy: 1 }),
            shtrih('M', 'B', 1, { sloy: 1 }),
            shtrih('D', 'N', 2, { sloy: 1 }),
            shtrih('N', 'C', 2, { sloy: 1 }),
            oblast(['A', 'C', 'D'], { sloy: 2 }),
          ],
          podpisi: false,
          proverki: [
            {
              parallelny: [
                ['A', 'D'],
                ['B', 'C'],
              ],
            },
          ],
          otvet: chislo(bol / 2),
        },
        Math.abs(verh - (mal / bol) * 10) > 1e-9,
      );
    },
  },
];

/* Ромб: [данный угол, искомый угол, диагональ] для четырёх задач ФИПИ 49–52. */
const ROMB: readonly (readonly [
  readonly [string, string, string],
  readonly [string, string, string],
  readonly [string, string],
])[] = [
  [
    ['D', 'A', 'B'],
    ['B', 'D', 'C'],
    ['B', 'D'],
  ],
  [
    ['B', 'C', 'D'],
    ['D', 'B', 'A'],
    ['B', 'D'],
  ],
  [
    ['A', 'B', 'C'],
    ['A', 'C', 'D'],
    ['A', 'C'],
  ],
  [
    ['C', 'D', 'A'],
    ['A', 'C', 'B'],
    ['A', 'C'],
  ],
];

/* Середина стороны параллелограмма: [точка, сторона, трапеция, концы, отрезок-разрез]. */
const SEREDINA: readonly (readonly [
  string,
  string,
  string,
  readonly [string, string],
  readonly [string, string],
])[] = [
  ['F', 'CD', 'ABCF', ['C', 'D'], ['A', 'F']],
  ['G', 'BC', 'ABGD', ['B', 'C'], ['G', 'D']],
  ['H', 'AB', 'AHCD', ['A', 'B'], ['H', 'C']],
  ['E', 'AD', 'BCDE', ['A', 'D'], ['B', 'E']],
];

function sredLiniya(u: number, figura: string[], rol: 'iskomoe', ans: number) {
  const t = poUglam(u, 62);
  return {
    tochki: { ...t, D: { seredina: ['A', 'C'] as const }, E: { seredina: ['B', 'C'] as const } },
    elementy: [
      tri('A', 'B', 'C'),
      otr('D', 'E'),
      shtrih('A', 'D', 1),
      shtrih('D', 'C', 1),
      shtrih('B', 'E', 2),
      shtrih('E', 'C', 2),
      oblast(figura, { vydelit: rol }),
    ] as Element[],
    proverki: [
      {
        parallelny: [
          ['D', 'E'],
          ['A', 'B'],
        ] as const,
      },
    ],
    otvet: chislo(ans),
  };
}

/* Средняя линия и отсечённый треугольник (задачи 77–80). */
const OTSECHENNYY: readonly (readonly [
  string,
  string,
  Record<string, { seredina: readonly [string, string] }>,
])[] = [
  ['EF', 'BEF', { E: { seredina: ['B', 'C'] }, F: { seredina: ['A', 'B'] } }],
  ['DE', 'CDE', { D: { seredina: ['A', 'C'] }, E: { seredina: ['B', 'C'] } }],
  ['DF', 'ADF', { D: { seredina: ['A', 'C'] }, F: { seredina: ['A', 'B'] } }],
];
const SHTRIHI_SEREDIN: readonly (readonly (readonly [string, string, 1 | 2])[])[] = [
  [
    ['B', 'E', 1],
    ['E', 'C', 1],
    ['A', 'F', 2],
    ['F', 'B', 2],
  ],
  [
    ['A', 'D', 1],
    ['D', 'C', 1],
    ['B', 'E', 2],
    ['E', 'C', 2],
  ],
  [
    ['A', 'D', 1],
    ['D', 'C', 1],
    ['A', 'F', 2],
    ['F', 'B', 2],
  ],
];
const PARALLEL: readonly (readonly [readonly [string, string], readonly [string, string]])[] = [
  [
    ['E', 'F'],
    ['C', 'A'],
  ],
  [
    ['D', 'E'],
    ['A', 'B'],
  ],
  [
    ['D', 'F'],
    ['C', 'B'],
  ],
];
