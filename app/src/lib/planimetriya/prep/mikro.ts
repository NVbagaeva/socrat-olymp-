/**
 * Микрозадачи тренировок навыков задания №1: девять блоков по десять.
 *
 * Каждая задача — одно действие с одним фактом теории. Числа целые
 * или с одним-двумя знаками после запятой, рисунок строится движком
 * из тех же чисел (угол 3° — схематично), данные подписаны на
 * чертеже, искомое выделено. Разбор — одна-три строки: какой факт и
 * какая выкладка.
 */

import {
  POROG,
  opisannayaTrapeciya,
  opisannyyPoStoronam,
  parallelogramm,
  poUglam,
  pravilnyy,
  pryamougolnyy,
  ravnobedrennyy,
  romb,
  trapeciya,
  vpisannyyPoDugam,
} from '../figury';
import { polar } from '../geom';
import { podobrat } from '../skhema';
import {
  chislo,
  clamp,
  duga,
  gr,
  mn,
  okr,
  otr,
  prod,
  pryam,
  pryamaya,
  shtrih,
  tochka,
  tri,
  ug,
} from '../stseny/dsl';
import type { Element, Scena, T2 } from '../types';
import {
  bissektrisySmezhnyh,
  neVyrozhdennyy,
  scenariyNaRaznost,
  scenariyVdvoe,
  scenariyUgolPriVershine,
  smezhnyeVOtnoshenii,
  sootvetstvennyySmezhnyy,
  sosedniyUgolParallelogramma,
} from './scenarii';
import {
  scenariyCentralnyyPoVpisannomu,
  scenariyDolyaOkruzhnosti,
  scenariyDugaPoVpisannomu,
  scenariyHordaDelitOkruzhnost,
  scenariyNaOdnuDugu,
  scenariyTreugolnikAOB,
  scenariyUgolNaDiametr,
  scenariyVpisannyyPoCentralnomu,
  scenariyVpisannyyPoDuge,
  scenariyVpisannyyPoDvumDugam,
} from './scenarii-p1-8';
import {
  scenariyChetvertayaStorona,
  scenariyHordaKasatelnaya,
  scenariyKasatelnayaSekushchaya,
  scenariyOtrezkiKasatelnyh,
  scenariyPerimetrOpisannogo,
  scenariyRadiusKasatelnaya,
  scenariySrednyayaOpisannoy,
  scenariyUgolMezhduKasatelnymi,
  scenariyUgolPravilnogo,
  scenariyVpisannyyChetyrehugolnik,
} from './scenarii-p1-9';
import {
  scenariyBissektrisaPryamogo,
  scenariyGipotenuza30,
  scenariyGipotenuzaPoMediane,
  scenariyKatet30,
  scenariyMedianaKatet,
  scenariyMedianaPoGipotenuze,
  scenariyOstryyUgol,
  scenariyUgolAMC,
  scenariyVysotaKatetCA,
  scenariyVysotaKatetCB,
} from './scenarii-p1-3';
import {
  scenariyDveStoronyUgol,
  scenariyParallelogramma,
  scenariyParallelogramma30,
  scenariyPodobnogo,
  scenariyPryamougolnogo,
  scenariyRomba,
  scenariySrednyayaTrapecii,
  scenariySrednyayaTreugolnika,
  scenariyStoronaVysota,
  scenariyTrapecii,
} from './scenarii-p1-5';
import {
  scenariyKatet30Trig,
  scenariyKatetCherezKosinus,
  scenariyKatetCherezSinus,
  scenariyKatetCherezTangens,
  scenariyKosinus,
  scenariyKosinusDrugogo,
  scenariyKosinusPoSinusu,
  scenariyKosinusRavnobedrennyy,
  scenariySinus,
  scenariyTangens,
} from './scenarii-p1-7';
import {
  scenariyNakrest,
  scenariyOdnostoronnie,
  scenariyOstryyUgolSumma,
  scenariyPeresechenie,
  scenariyPolovinaUgla,
  scenariySmezhnyeRaznost,
  scenariySmezhnyy,
  scenariyTretiyUgol,
  scenariyTupoyUgol,
  scenariyUgolPriOsnovanii,
  scenariyVertikalnye,
  scenariyVneshniyDvaUgla,
  scenariyVneshniyPriVershine,
  scenariyVneshniyVnutrenniy,
} from './scenarii-p1-12';
import type { Mikro } from './types';

/* ── Помощники ───────────────────────────────────────────────────── */

function mikro(id: string, nazvanie: string, formula: string, generate: Mikro['generate']): Mikro {
  return { id, nazvanie, formula, generate };
}

const t = (x: number) => chislo(x).replace(',', '{,}');
const g = (x: number) => `${t(x)}^\\circ`;
const zn = (a: string, b: string, z: string): Element =>
  ({ tip: 'otrezok', a, b, tolkoShtrihi: true, vydelit: 'dano', znachenie: z }) as Element;
const nod = (a: number, b: number): number => (b === 0 ? a : nod(b, a % b));

type Metka = { zn?: string; isk?: boolean; dugi?: 1 | 2 | 3 };
const UGOL: Record<'A' | 'B' | 'C', [string, string, string]> = {
  A: ['C', 'A', 'B'],
  B: ['A', 'B', 'C'],
  C: ['A', 'C', 'B'],
};

/**
 * Чертёж — схема, а не масштабный рисунок (skhema.ts): форма рисунка
 * подбирается по одному отображаемому параметру. Числа на чертеже
 * настоящие. Жёсткая конфигурация — угол не меньше 20°.
 */
const ZHESTKO = { minUgol: 20 } as const;
const forma = (x: number, lo: number, hi: number, postroit: (v: number) => Scena): Scena =>
  podobrat(null, { v: x }, { v: [lo, hi] }, ({ v }) => postroit(v), ZHESTKO);
/** Настоящая величина угла без подписи — для подбора формы и автотеста. */
const ist = (a: string, v: string, b: string, gradusy: number) =>
  ({ ugol: [a, v, b], gradusy }) as const;

/** Треугольник по углам A и B (основание AB) с отметками углов. */
function treugolnik(
  ugly: [number, number, number],
  metki: Partial<Record<'A' | 'B' | 'C', Metka>>,
  extra: Element[] = [],
  tochki: Scena['tochki'] = {},
  /* false — углы треугольника условны (в задаче их нет): порядок не важен. */
  nastoyashchie = true,
): Scena {
  const el: Element[] = [tri('A', 'B', 'C')];
  for (const [k, m] of Object.entries(metki) as ['A' | 'B' | 'C', Metka][]) {
    const [a, b, c] = UGOL[k];
    el.push(
      ug(a, b, c, {
        ...(m.isk
          ? { vydelit: 'iskomoe' as const }
          : m.zn !== undefined
            ? { vydelit: 'dano' as const, znachenie: m.zn }
            : {}),
        ...(m.dugi ? { dugi: m.dugi } : {}),
      }),
    );
  }
  const [a0, b0, c0] = ugly;
  const stsena = (a: number, b: number): Scena => ({
    tochki: { ...poUglam(a, b), ...tochki },
    elementy: [...el, ...extra],
    ...(nastoyashchie
      ? { proverki: (['A', 'B', 'C'] as const).map((k, i) => ist(...UGOL[k], ugly[i]!)) }
      : {}),
  });
  /* Прямой угол остаётся ровно прямым, равные углы — равными: тогда
     у формы один параметр, иначе два. */
  if (c0 === 90) return forma(a0, 15, 75, (a) => stsena(a, 90 - a));
  if (a0 === 90) return forma(b0, 15, 75, (b) => stsena(90, b));
  if (b0 === 90) return forma(a0, 15, 75, (a) => stsena(a, 90));
  if (a0 === b0) return forma(a0, 22, 80, (a) => stsena(a, a));
  if (a0 === c0) return forma(a0, 22, 80, (a) => stsena(a, 180 - 2 * a));
  if (b0 === c0) return forma(b0, 22, 80, (b) => stsena(180 - 2 * b, b));
  return podobrat(
    null,
    { a: a0, b: b0 },
    { a: [22, 125], b: [22, 125] },
    ({ a, b }) => stsena(a, b),
    ZHESTKO,
  );
}

/** Окружность радиуса 5 с центром O. */
const OKR = { w: { centr: 'O', radius: 5 } } as const;
const naDuge = (u: number) => ({ naDuge: { okr: 'w', gradus: u } });

/* ── 1. Сумма углов и равнобедренный треугольник ─────────────────── */

export const BLOK_SUMMA: Mikro[] = [
  mikro(
    'P1-1-01',
    'Третий угол треугольника',
    '\\angle A + \\angle B + \\angle C = 180^\\circ',
    (r) => {
      const a = r.int(25, 85);
      const b = r.int(20, 150 - a);
      const c = 180 - a - b;
      return {
        uslovie: `В треугольнике $ABC$ $\\angle A = ${g(a)}$, $\\angle B = ${g(b)}$. Найдите угол $C$.`,
        risunok: treugolnik(
          [a, b, c],
          { A: { zn: gr(a) }, B: { zn: gr(b), dugi: 2 }, C: { isk: true } },
          /* Подсказка, шаг «Составь уравнение»: x у угла C. */
          [ug('A', 'C', 'B', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 })],
        ),
        otvet: c,
        razbor: [
          `Сумма углов треугольника $180^\\circ$. Угол $C$ обозначим $x$: $${g(a)} + ${g(b)} + x = 180^\\circ$.`,
          `$x = \\angle C = 180^\\circ - ${g(a)} - ${g(b)} = ${g(c)}$.`,
        ],
        scenariy: scenariyTretiyUgol(a, b),
      };
    },
  ),
  mikro(
    'P1-1-02',
    'Острый угол прямоугольного треугольника',
    '\\angle A + \\angle B = 90^\\circ',
    (r) => {
      const a = r.int(8, 82);
      return {
        uslovie: `В треугольнике $ABC$ угол $C$ прямой, $\\angle A = ${g(a)}$. Найдите угол $B$.`,
        risunok: treugolnik([a, 90 - a, 90], { A: { zn: gr(a) }, B: { isk: true } }, [
          pryam('A', 'C', 'B'),
          /* Подсказка, шаг «Составь уравнение»: x у угла B. */
          ug('A', 'B', 'C', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
        ]),
        otvet: 90 - a,
        razbor: [
          `Острые углы прямоугольного треугольника в сумме дают $90^\\circ$. Угол $B$ обозначим $x$: $${g(a)} + x = 90^\\circ$.`,
          `$x = \\angle B = 90^\\circ - ${g(a)} = ${g(90 - a)}$.`,
        ],
        scenariy: scenariyOstryyUgolSumma(a),
      };
    },
  ),
  mikro(
    'P1-1-03',
    'Угол при вершине равнобедренного',
    '\\angle C = 180^\\circ - 2\\angle A',
    (r) => {
      const a = r.int(20, 85);
      const c = 180 - 2 * a;
      return {
        uslovie: `В треугольнике $ABC$ $AC = BC$, $\\angle A = ${g(a)}$. Найдите угол $C$.`,
        risunok: forma(c, 22, 150, (v) => ({
          tochki: ravnobedrennyy(v),
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
            ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
            /* Подсказка, шаг «Какой угол равен углу A?»: угол B — тот же. */
            ug('A', 'B', 'C', { sloy: 1, znachenie: gr(a) }),
          ],
          proverki: [ist('A', 'C', 'B', c)],
        })),
        otvet: c,
        razbor: [
          '$AC = BC$ — треугольник равнобедренный с основанием $AB$; углы при основании равны: $\\angle B = \\angle A$.',
          `$\\angle C = 180^\\circ - 2\\cdot ${g(a)} = ${g(c)}$.`,
        ],
        scenariy: scenariyUgolPriVershine(a),
      };
    },
  ),
  mikro(
    'P1-1-04',
    'Угол при основании равнобедренного',
    '\\angle A = \\dfrac{180^\\circ - \\angle C}{2}',
    (r) => {
      const c = 2 * r.int(8, 82);
      const a = (180 - c) / 2;
      return {
        uslovie: `В треугольнике $ABC$ $AC = BC$, $\\angle C = ${g(c)}$. Найдите угол $A$.`,
        risunok: forma(c, 22, 150, (v) => ({
          tochki: ravnobedrennyy(v),
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(c) }),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            /* Подсказка, шаг «Составь уравнение»: x у углов при основании. */
            ug('C', 'A', 'B', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
            ug('A', 'B', 'C', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
          ],
          proverki: [ist('C', 'A', 'B', a)],
        })),
        otvet: a,
        razbor: [
          `$AC = BC$: углы при основании равны, $\\angle A = \\angle B = x$. Сумма углов: $2x + ${g(c)} = 180^\\circ$.`,
          `$x = \\angle A = (180^\\circ - ${g(c)}) : 2 = ${g(a)}$.`,
        ],
        scenariy: scenariyUgolPriOsnovanii(c),
      };
    },
  ),
  mikro(
    'P1-1-05',
    'Внешний угол — сумма двух несмежных',
    '\\angle_{\\text{внеш}} = \\angle A + \\angle B',
    (r) => {
      const a = r.int(25, 80);
      const b = r.int(25, 80);
      const e = a + b;
      return {
        uslovie: `Внешний угол треугольника $ABC$ при вершине $C$ равен $${g(e)}$, $\\angle A = ${g(a)}$. Найдите угол $B$.`,
        risunok: treugolnik(
          [a, b, 180 - e],
          { A: { zn: gr(a) }, B: { isk: true, dugi: 2 } },
          [
            prod('A', 'C', { doTochki: 'D', sploshnoe: true }),
            ug('B', 'C', 'D', { vydelit: 'dano', znachenie: gr(e) }),
            /* Подсказка, шаг «Составь уравнение»: x у угла B. */
            ug('A', 'B', 'C', { sloy: 1, dugi: 2, znachenie: 'x', cvet: 1 }),
          ],
          { D: { naPryamoy: ['A', 'C', 1.4] } },
        ),
        otvet: b,
        razbor: [
          `Внешний угол равен сумме двух внутренних, не смежных с ним. Угол $B$ обозначим $x$: $${g(a)} + x = ${g(e)}$.`,
          `$x = \\angle B = ${g(e)} - ${g(a)} = ${g(b)}$.`,
        ],
        scenariy: scenariyVneshniyDvaUgla(e, a),
      };
    },
  ),
  mikro(
    'P1-1-06',
    'Внутренний угол по внешнему',
    '\\angle B = 180^\\circ - \\angle_{\\text{внеш}}',
    (r) => {
      const e = r.int(95, 170);
      return {
        uslovie: `Внешний угол треугольника $ABC$ при вершине $B$ равен $${g(e)}$. Найдите угол $ABC$.`,
        risunok: treugolnik(
          [40, 180 - e, e - 40],
          { B: { isk: true } },
          [
            prod('A', 'B', { doTochki: 'D', sploshnoe: true }),
            ug('C', 'B', 'D', { vydelit: 'dano', znachenie: gr(e) }),
            /* Подсказка, шаг «Составь уравнение»: x у угла ABC. */
            ug('A', 'B', 'C', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
          ],
          { D: { naPryamoy: ['A', 'B', 1.3] } },
          false,
        ),
        otvet: 180 - e,
        razbor: [
          `Внешний и внутренний углы при одной вершине — смежные. Угол $ABC$ обозначим $x$: $x + ${g(e)} = 180^\\circ$.`,
          `$x = \\angle ABC = 180^\\circ - ${g(e)} = ${g(180 - e)}$.`,
        ],
        scenariy: scenariyVneshniyVnutrenniy(e),
      };
    },
  ),
  mikro(
    'P1-1-07',
    'Угол вдвое больше другого',
    '\\angle A + \\angle B + \\angle C = 180^\\circ',
    (r) => {
      /* B = 36° дал бы ответ 72° = данному углу C, B = 45° — прямой угол A. */
      let b = r.int(15, 44);
      if (b === 36) b = 37;
      /* Угол C — из суммы углов: A + B + C = 2B + B + C = 180°. Прежде C
         брался случайно, и ответ 2B не сходился с условием. */
      const c = 180 - 3 * b;
      const a = 2 * b;
      return {
        uslovie: `В треугольнике $ABC$ угол $A$ вдвое больше угла $B$, $\\angle C = ${g(c)}$. Найдите угол $A$.`,
        risunok: treugolnik(
          [a, b, c],
          {
            A: { isk: true },
            B: { dugi: 2 },
            C: { zn: gr(c), dugi: 3 },
          },
          [
            /* Подсказка, шаг «Чему тогда равен угол A?»: x и 2x у углов. */
            ug('A', 'B', 'C', { sloy: 2, dugi: 2, znachenie: 'x', cvet: 1 }),
            ug('C', 'A', 'B', { sloy: 2, znachenie: '2x', cvet: 1 }),
          ],
        ),
        otvet: a,
        razbor: [
          'Меньший угол $B$ обозначим $x$: тогда $\\angle A = 2x$.',
          `Сумма углов треугольника: $2x + x + ${g(c)} = 180^\\circ$, $3x = ${g(180 - c)}$, $x = ${g(b)}$.`,
          `$\\angle A = 2x = ${g(a)}$.`,
        ],
        scenariy: scenariyVdvoe(b, c),
      };
    },
  ),
  mikro(
    'P1-1-08',
    'Угол на $d$ больше другого',
    '\\angle A + \\angle B + \\angle C = 180^\\circ',
    (r) => {
      const a = r.int(20, 60);
      const d = r.int(5, 40);
      const b = a + d;
      const c = 180 - a - b;
      if (c < 15) return null;
      return {
        uslovie: `В треугольнике $ABC$ $\\angle A = ${g(a)}$, а угол $B$ на $${g(d)}$ больше угла $A$. Найдите угол $C$.`,
        risunok: treugolnik([a, b, c], { A: { zn: gr(a) }, B: { dugi: 2 }, C: { isk: true } }, [
          /* Подсказка, шаг «Чему тогда равен угол B?»: x и x + d у углов. */
          ug('C', 'A', 'B', { sloy: 2, znachenie: 'x', cvet: 1, radiusPx: 26 }),
          ug('A', 'B', 'C', { sloy: 2, dugi: 2, znachenie: `x + ${gr(d)}`, cvet: 1 }),
        ]),
        otvet: c,
        razbor: [
          `Меньший угол $A$ обозначим $x$: тогда $\\angle B = x + ${g(d)}$.`,
          `Сумма углов треугольника: $x + (x + ${g(d)}) + \\angle C = 180^\\circ$, отсюда $\\angle C = 180^\\circ - 2x - ${g(d)}$.`,
          `$x = \\angle A = ${g(a)}$: $\\angle C = 180^\\circ - 2\\cdot ${g(a)} - ${g(d)} = ${g(c)}$.`,
        ],
        scenariy: scenariyNaRaznost(a, d),
      };
    },
  ),
  mikro('P1-1-09', 'Тупой угол равнобедренного', '\\text{тупой угол — только при вершине}', (r) => {
    const c = 2 * r.int(46, 84);
    const a = (180 - c) / 2;
    return {
      uslovie: `Один из углов равнобедренного треугольника равен $${g(c)}$. Найдите один из других его углов.`,
      risunok: forma(c, 22, 150, (v) => ({
        tochki: ravnobedrennyy(v),
        elementy: [
          tri('A', 'B', 'C'),
          shtrih('A', 'C', 1),
          shtrih('B', 'C', 1),
          ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(c) }),
          ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг «Составь уравнение»: x у углов при основании. */
          ug('C', 'A', 'B', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
          ug('A', 'B', 'C', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
        ],
        podpisi: false,
        proverki: [ist('C', 'A', 'B', a)],
      })),
      otvet: a,
      razbor: [
        'Тупой угол не может быть при основании — два тупых угла дали бы больше $180^\\circ$. Значит, он при вершине.',
        `Углы при основании равны, обозначим их $x$: $2x + ${g(c)} = 180^\\circ$, $x = (180^\\circ - ${g(c)}) : 2 = ${g(a)}$.`,
      ],
      scenariy: scenariyTupoyUgol(c),
    };
  }),
  mikro(
    'P1-1-10',
    'Внешний угол при вершине равнобедренного',
    '\\angle_{\\text{внеш}\\,C} = 2\\angle A',
    (r) => {
      const a = r.int(20, 80);
      const e = 2 * a;
      return {
        uslovie: `В треугольнике $ABC$ $AC = BC$, внешний угол при вершине $C$ равен $${g(e)}$. Найдите угол $A$.`,
        risunok: forma(180 - e, 22, 150, (v) => ({
          tochki: { ...ravnobedrennyy(v), D: { naPryamoy: ['A', 'C', 1.4] } },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            prod('A', 'C', { doTochki: 'D', sploshnoe: true }),
            ug('B', 'C', 'D', { vydelit: 'dano', znachenie: gr(e) }),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            /* Подсказка, шаг «Внешний угол»: x у равных углов A и B. */
            ug('C', 'A', 'B', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
            ug('A', 'B', 'C', { sloy: 1, znachenie: 'x', cvet: 1, radiusPx: 26 }),
          ],
          proverki: [ist('C', 'A', 'B', a)],
        })),
        otvet: a,
        razbor: [
          'Углы при основании равны: $\\angle A = \\angle B = x$. Внешний угол при $C$ равен $\\angle A + \\angle B = 2x$.',
          `$2x = ${g(e)}$, $x = \\angle A = ${g(e)} : 2 = ${g(a)}$.`,
        ],
        scenariy: scenariyVneshniyPriVershine(e),
      };
    },
  ),
];

/* ── 2. Смежные, вертикальные углы, параллельные прямые ──────────── */

function smezhnye(u: number, metkaCOB: Metka, metkaAOC: Metka, extra: Element[] = []): Scena {
  return forma(u, 28, 152, (v) => ({
    tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(v, 5) },
    proverki: [ist('C', 'O', 'B', u), ist('A', 'O', 'C', 180 - u)],
    elementy: [
      otr('A', 'B'),
      otr('O', 'C'),
      ug(
        'C',
        'O',
        'B',
        metkaCOB.isk
          ? { vydelit: 'iskomoe' }
          : metkaCOB.zn
            ? { vydelit: 'dano', znachenie: metkaCOB.zn }
            : {},
      ),
      ug('A', 'O', 'C', {
        dugi: 2,
        ...(metkaAOC.isk
          ? { vydelit: 'iskomoe' as const }
          : metkaAOC.zn
            ? { vydelit: 'dano' as const, znachenie: metkaAOC.zn }
            : {}),
      }),
      ...extra,
    ],
  }));
}

function parallel(u: number, el: (m: string, n: string) => Element[]): Scena {
  const v = clamp(u, 30, 150);
  const d = polar(v, 1);
  const k = 4 / d[1];
  return {
    tochki: {
      A: [-7, 0],
      B: [7, 0],
      C: [-7, 4],
      D: [7, 4],
      M: [-d[0] * k * 0.5, 0],
      N: [d[0] * k * 0.5, 4],
      P: [-d[0] * k * 0.9, -1.6],
      Q: [d[0] * k * 0.9, 5.6],
    },
    elementy: [otr('A', 'B'), otr('C', 'D'), otr('P', 'Q'), ...el('M', 'N')],
    podpisi: false,
  };
}

export const BLOK_SMEZHNYE: Mikro[] = [
  mikro('P1-2-01', 'Смежный угол', '\\alpha + \\beta = 180^\\circ', (r) => {
    const u = neVyrozhdennyy(r.int, 20, 160);
    return {
      uslovie: `Один из смежных углов равен $${g(u)}$. Найдите другой угол.`,
      risunok: smezhnye(u, { zn: gr(u) }, { isk: true }, [
        /* Подсказка, шаг «Составь уравнение»: x у искомого угла AOC. */
        ug('A', 'O', 'C', { sloy: 1, dugi: 2, znachenie: 'x', cvet: 1 }),
      ]),
      otvet: 180 - u,
      razbor: [
        `Смежные углы дают в сумме $180^\\circ$. Угол $AOC$ обозначим $x$: $x + ${g(u)} = 180^\\circ$.`,
        `$x = 180^\\circ - ${g(u)} = ${g(180 - u)}$.`,
      ],
      scenariy: scenariySmezhnyy(u),
    };
  }),
  mikro('P1-2-02', 'Разность смежных углов', '\\alpha + \\beta = 180^\\circ', (r) => {
    const d = 2 * r.int(11, 60);
    const b = (180 + d) / 2;
    return {
      uslovie: `Один из смежных углов на $${g(d)}$ больше другого. Найдите больший угол.`,
      risunok: smezhnye(180 - b, {}, { isk: true }, [
        /* Подсказка, шаг «Чему равен больший угол?»: x и x + d у углов. */
        ug('C', 'O', 'B', { sloy: 1, znachenie: 'x', cvet: 1 }),
        ug('A', 'O', 'C', { sloy: 1, dugi: 2, znachenie: `x + ${gr(d)}`, cvet: 1 }),
      ]),
      otvet: b,
      razbor: [
        `Обозначим меньший угол $x$: $x + (x + ${g(d)}) = 180^\\circ$, $x = ${g((180 - d) / 2)}$.`,
        `$x$ — меньший угол. Больший: $x + ${g(d)} = ${g(b)}$.`,
      ],
      scenariy: scenariySmezhnyeRaznost(d),
    };
  }),
  mikro('P1-2-03', 'Смежные углы в отношении', '\\alpha + \\beta = 180^\\circ', (r) => {
    const k = r.int(1, 5);
    const m = k + r.int(1, 7);
    if ((180 * k) % (k + m) !== 0) return null;
    /* Меньший угол 80°–89° на чертеже не отличить от прямого. */
    if ((180 * k) / (k + m) >= 80) return null;
    return smezhnyeVOtnoshenii(k, m);
  }),
  mikro('P1-2-04', 'Вертикальные углы', '\\text{вертикальные углы равны}', (r) => {
    const s = 2 * r.int(20, 79);
    return {
      uslovie: `Сумма двух вертикальных углов равна $${g(s)}$. Найдите каждый из них.`,
      risunok: forma(s / 2, 14, 76, (h) => ({
        tochki: {
          A: polar(180 + h, 5),
          B: polar(h, 5),
          C: polar(180 - h, 5),
          D: polar(-h, 5),
          O: [0, 0],
        },
        proverki: [ist('D', 'O', 'B', s), ist('C', 'O', 'A', s)],
        elementy: [
          otr('A', 'B'),
          otr('C', 'D'),
          ug('D', 'O', 'B', { vydelit: 'iskomoe' }),
          ug('C', 'O', 'A', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг «Составь уравнение»: x у обоих углов. */
          ug('D', 'O', 'B', { sloy: 1, znachenie: 'x', cvet: 1 }),
          ug('C', 'O', 'A', { sloy: 1, znachenie: 'x', cvet: 1 }),
        ],
        podpisi: false,
      })),
      otvet: s / 2,
      razbor: [
        `Вертикальные углы равны, обозначим каждый $x$: $2x = ${g(s)}$.`,
        `$x = ${g(s)} : 2 = ${g(s / 2)}$.`,
      ],
      scenariy: scenariyVertikalnye(s),
    };
  }),
  mikro('P1-2-05', 'Угол при пересечении прямых', '\\alpha + \\beta = 180^\\circ', (r) => {
    const u = r.int(25, 79);
    return {
      uslovie: `При пересечении двух прямых один из углов равен $${g(u)}$. Найдите больший из оставшихся углов.`,
      risunok: forma(u, 28, 88, (v) => ({
        tochki: {
          A: polar(180, 5),
          B: polar(0, 5),
          C: polar(v, 5),
          D: polar(180 + v, 5),
          O: [0, 0],
        },
        proverki: [ist('C', 'O', 'A', 180 - u)],
        elementy: [
          otr('A', 'B'),
          otr('C', 'D'),
          ug('B', 'O', 'C', { vydelit: 'dano', znachenie: gr(u) }),
          ug('C', 'O', 'A', { vydelit: 'iskomoe' }),
          /* Подсказка: угол, вертикальный данному (слой 1), x у искомого (слой 2). */
          ug('A', 'O', 'D', { sloy: 1, znachenie: gr(u), cvet: 1 }),
          ug('C', 'O', 'A', { sloy: 2, znachenie: 'x', cvet: 1 }),
        ],
        podpisi: false,
      })),
      otvet: 180 - u,
      razbor: [
        'Соседние углы при пересечении — смежные, противоположные — вертикальные: остались угол, равный данному, и два равных тупых угла.',
        `Тупой угол $x$ смежный с данным: $x = 180^\\circ - ${g(u)} = ${g(180 - u)}$.`,
      ],
      scenariy: scenariyPeresechenie(u),
    };
  }),
  mikro('P1-2-06', 'Накрест лежащие углы', '\\text{накрест лежащие углы равны}', (r) => {
    const u = neVyrozhdennyy(r.int, 30, 150);
    return {
      uslovie: `Две параллельные прямые пересечены секущей. Один из накрест лежащих углов равен $${g(u)}$. Найдите второй.`,
      risunok: parallel(u, (m, n) => [
        ug('B', m, n, { vydelit: 'dano', znachenie: gr(u) }),
        ug('C', n, m, { vydelit: 'iskomoe' }),
      ]),
      otvet: u,
      razbor: ['При параллельных прямых накрест лежащие углы равны.', `Ответ: $${g(u)}$.`],
      scenariy: scenariyNakrest(u),
    };
  }),
  mikro('P1-2-07', 'Односторонние углы', '\\alpha + \\beta = 180^\\circ', (r) => {
    const u = neVyrozhdennyy(r.int, 30, 150);
    return {
      uslovie: `Две параллельные прямые пересечены секущей. Один из односторонних углов равен $${g(u)}$. Найдите второй.`,
      risunok: parallel(u, (m, n) => [
        ug('B', m, n, { vydelit: 'dano', znachenie: gr(u) }),
        ug('D', n, m, { vydelit: 'iskomoe' }),
        /* Подсказка, шаг «Составь уравнение»: x у искомого угла. */
        ug('D', n, m, { sloy: 1, znachenie: 'x', cvet: 1 }),
      ]),
      otvet: 180 - u,
      razbor: [
        `Односторонние углы при параллельных прямых дают в сумме $180^\\circ$. Искомый угол обозначим $x$: $x + ${g(u)} = 180^\\circ$.`,
        `$x = 180^\\circ - ${g(u)} = ${g(180 - u)}$.`,
      ],
      scenariy: scenariyOdnostoronnie(u),
    };
  }),
  mikro('P1-2-08', 'Половина угла', '\\text{биссектриса делит угол пополам}', (r) => {
    const u = 2 * r.int(15, 75);
    if (u >= 80 && u <= 100) return null;
    return {
      uslovie: `Луч $OK$ — биссектриса угла $AOB$, равного $${g(u)}$. Найдите угол $AOK$.`,
      risunok: forma(u / 2, 26, 75, (h) => ({
        tochki: { O: [0, 0], A: polar(0, 6), B: polar(2 * h, 6), K: polar(h, 6) },
        elementy: [
          otr('O', 'A'),
          otr('O', 'B'),
          otr('O', 'K'),
          ug('A', 'O', 'K', { vydelit: 'iskomoe' }),
          ug('K', 'O', 'B'),
          /* Подсказка, шаг «Составь уравнение»: x у половинок и весь угол AOB. */
          ug('A', 'O', 'K', { sloy: 1, znachenie: 'x', cvet: 1 }),
          ug('K', 'O', 'B', { sloy: 1, znachenie: 'x', cvet: 1 }),
          ug('A', 'O', 'B', { sloy: 1, znachenie: gr(u), dolyaRadiusa: 0.6 }),
        ],
        proverki: [ist('A', 'O', 'K', u / 2)],
      })),
      otvet: u / 2,
      razbor: [
        `Биссектриса делит угол на две равные части, обозначим каждую $x$: $2x = ${g(u)}$.`,
        `$x = \\angle AOK = ${g(u)} : 2 = ${g(u / 2)}$.`,
      ],
      scenariy: scenariyPolovinaUgla(u),
    };
  }),
  mikro(
    'P1-2-09',
    'Биссектрисы смежных углов',
    '\\dfrac{\\alpha}{2} + \\dfrac{180^\\circ - \\alpha}{2} = 90^\\circ',
    (r) => {
      /* Данный угол 80°–100° на чертеже не отличить от прямого. */
      const u = 2 * r.int(15, 75);
      return u >= 80 && u <= 100 ? null : bissektrisySmezhnyh(u);
    },
  ),
  mikro('P1-2-10', 'Соответственные углы', '\\text{соответственные углы равны}', (r) =>
    sootvetstvennyySmezhnyy(neVyrozhdennyy(r.int, 30, 150)),
  ),
];

/* ── 3. Прямоугольный треугольник ────────────────────────────────── */

function pryamoyGip(b: number): Scena['tochki'] {
  const v = clamp(b, POROG + 2, 90 - POROG - 2);
  return poUglam(90 - v, v);
}

export const BLOK_PRYAMOUGOLNYY: Mikro[] = [
  mikro('P1-3-01', 'Медиана к гипотенузе', 'CM = \\dfrac{AB}{2}', (r) => {
    const c = r.int(4, 60);
    return {
      uslovie: `Гипотенуза прямоугольного треугольника равна $${t(c)}$. Найдите медиану, проведённую к ней.`,
      risunok: {
        tochki: { ...pryamoyGip(35), M: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'M', { vydelit: 'iskomoe' }),
          /* Медиана: половины гипотенузы равны. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          zn('A', 'B', t(c).replace('{,}', ',')),
          /* Подсказка, шаг «Что мы знаем про медиану к гипотенузе?»: CM = AM = MB. */
          shtrih('C', 'M', 1, { sloy: 2 }),
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'M'],
      },
      otvet: c / 2,
      razbor: ['Медиана к гипотенузе равна её половине.', `$${t(c)} : 2 = ${t(c / 2)}$.`],
      scenariy: scenariyMedianaPoGipotenuze(c),
    };
  }),
  mikro('P1-3-02', 'Гипотенуза по медиане', 'AB = 2\\cdot CM', (r) => {
    const m = r.int(3, 40);
    return {
      uslovie: `Медиана, проведённая к гипотенузе прямоугольного треугольника, равна $${t(m)}$. Найдите гипотенузу.`,
      risunok: {
        tochki: { ...pryamoyGip(30), M: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'M', { vydelit: 'dano', znachenie: chislo(m) }),
          /* Медиана: половины гипотенузы равны. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          otr('A', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка: CM = AM = MB (слой 2), затем длины половин (слой 3). */
          shtrih('C', 'M', 1, { sloy: 2 }),
          { tip: 'otrezok', a: 'A', b: 'M', tolkoShtrihi: true, znachenie: chislo(m), sloy: 3 },
          { tip: 'otrezok', a: 'M', b: 'B', tolkoShtrihi: true, znachenie: chislo(m), sloy: 3 },
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'M'],
      },
      otvet: 2 * m,
      razbor: ['Медиана к гипотенузе — половина гипотенузы.', `$2\\cdot ${t(m)} = ${t(2 * m)}$.`],
      scenariy: scenariyGipotenuzaPoMediane(m),
    };
  }),
  mikro('P1-3-03', 'Катет против 30°', 'a = \\dfrac{c}{2}', (r) => {
    const c = 2 * r.int(2, 30);
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ с прямым углом $C$ $\\angle B = 30^\\circ$, $AB = ${t(c)}$. Найдите $AC$.`,
      risunok: {
        tochki: pryamougolnyy(30, 'katety'),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '30°' }),
          zn('A', 'B', chislo(c)),
          otr('A', 'C', { vydelit: 'iskomoe' }),
        ],
      },
      otvet: c / 2,
      razbor: [
        'Катет против угла $30^\\circ$ равен половине гипотенузы.',
        `$AC = ${t(c)} : 2 = ${t(c / 2)}$.`,
      ],
      scenariy: scenariyKatet30(c),
    };
  }),
  mikro('P1-3-04', 'Гипотенуза по катету против 30°', 'c = 2a', (r) => {
    const a = r.int(2, 30);
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ с прямым углом $C$ $\\angle B = 30^\\circ$, $AC = ${t(a)}$. Найдите $AB$.`,
      risunok: {
        tochki: pryamougolnyy(30, 'katety'),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: '30°' }),
          zn('A', 'C', chislo(a)),
          otr('A', 'B', { vydelit: 'iskomoe' }),
        ],
      },
      otvet: 2 * a,
      razbor: [
        '$AC$ лежит против угла $30^\\circ$ — это половина гипотенузы.',
        `$AB = 2\\cdot ${t(a)} = ${t(2 * a)}$.`,
      ],
      scenariy: scenariyGipotenuza30(a),
    };
  }),
  mikro('P1-3-05', 'Угол между медианой и катетом', '\\angle MCB = \\angle B', (r) => {
    const b = r.int(15, 75);
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ $\\angle C = 90^\\circ$, $CM$ — медиана, $\\angle B = ${g(b)}$. Найдите угол $MCB$.`,
      risunok: {
        tochki: { ...pryamoyGip(b), M: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'M'),
          /* Медиана: половины гипотенузы равны. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(b) }),
          ug('M', 'C', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка: CM = MB (слой 1), равные углы при основании CB (слой 2). */
          shtrih('C', 'M', 1, { sloy: 1 }),
          ug('M', 'C', 'B', { sloy: 2, cvet: 1, radiusPx: 30 }),
          ug('A', 'B', 'C', { sloy: 2, cvet: 1, radiusPx: 30 }),
        ],
      },
      otvet: b,
      razbor: [
        '$CM = MB$ — медиана к гипотенузе равна её половине, треугольник $CMB$ равнобедренный.',
        `$\\angle MCB = \\angle B = ${g(b)}$.`,
      ],
      scenariy: scenariyMedianaKatet(),
    };
  }),
  mikro('P1-3-06', 'Угол между высотой и катетом', '\\angle HCB = \\angle A', (r) => {
    const a = r.int(15, 75);
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ $\\angle C = 90^\\circ$, $CH$ — высота, $\\angle A = ${g(a)}$. Найдите угол $HCB$.`,
      risunok: {
        tochki: { ...pryamoyGip(90 - a), H: { osnovanie: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'H'),
          pryam('C', 'H', 'B'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('H', 'C', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка: угол B (слой 1), равные углы HCB и A (слой 2). */
          ug('A', 'B', 'C', { sloy: 1, cvet: 3 }),
          ug('H', 'C', 'B', { sloy: 2, cvet: 1, radiusPx: 30 }),
          ug('C', 'A', 'B', { sloy: 2, cvet: 1, radiusPx: 30 }),
        ],
      },
      otvet: a,
      razbor: [
        `$\\angle B = 90^\\circ - ${g(a)}$; в треугольнике $CHB$ $\\angle HCB = 90^\\circ - \\angle B$.`,
        `$\\angle HCB = \\angle A = ${g(a)}$.`,
      ],
      scenariy: scenariyVysotaKatetCB(),
    };
  }),
  mikro('P1-3-07', 'Угол между высотой и катетом $CA$', '\\angle ACH = \\angle B', (r) => {
    const a = r.int(15, 75);
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ $\\angle C = 90^\\circ$, $CH$ — высота, $\\angle A = ${g(a)}$. Найдите угол $ACH$.`,
      risunok: {
        tochki: { ...pryamoyGip(90 - a), H: { osnovanie: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'H'),
          pryam('C', 'H', 'B'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('A', 'C', 'H', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг «Какой треугольник ACH?»: угол AHC прямой. */
          pryam('A', 'H', 'C', { sloy: 1 }),
        ],
      },
      otvet: 90 - a,
      razbor: [
        'В треугольнике $ACH$ острые углы дают $90^\\circ$.',
        `$\\angle ACH = 90^\\circ - ${g(a)} = ${g(90 - a)}$.`,
      ],
      scenariy: scenariyVysotaKatetCA(a),
    };
  }),
  mikro('P1-3-08', 'Биссектриса прямого угла', '\\angle ACL = 45^\\circ', (r) => {
    const a = r.int(20, 70);
    const ans = 180 - 45 - a;
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ $\\angle C = 90^\\circ$, $CL$ — биссектриса, $\\angle A = ${g(a)}$. Найдите угол $ALC$.`,
      risunok: forma(a, 20, 70, (v) => ({
        tochki: { ...poUglam(v, 90 - v), L: { bissektrisa: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'L'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('A', 'L', 'C', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг «Как использовать биссектрису?»: по 45° у C. */
          ug('A', 'C', 'L', { sloy: 1, cvet: 1, znachenie: '45°' }),
          ug('L', 'C', 'B', { sloy: 1, cvet: 1, znachenie: '45°' }),
        ],
        proverki: [ist('A', 'L', 'C', ans)],
      })),
      otvet: ans,
      razbor: [
        'Биссектриса делит прямой угол: $\\angle ACL = 45^\\circ$.',
        `В треугольнике $ACL$: $180^\\circ - 45^\\circ - ${g(a)} = ${g(ans)}$.`,
      ],
      scenariy: scenariyBissektrisaPryamogo(a),
    };
  }),
  mikro('P1-3-09', 'Угол $AMC$ при медиане', '\\angle AMC = 180^\\circ - 2\\angle A', (r) => {
    const a = r.int(20, 70);
    if (a === 45) return null;
    const ans = 180 - 2 * a;
    return {
      uslovie: `В прямоугольном треугольнике $ABC$ $\\angle C = 90^\\circ$, $CM$ — медиана, $\\angle A = ${g(a)}$. Найдите угол $AMC$.`,
      risunok: {
        tochki: { ...pryamoyGip(90 - a), M: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'M'),
          /* Медиана: половины гипотенузы равны. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('A', 'M', 'C', { vydelit: 'iskomoe' }),
          /* Подсказка: AM = CM (слой 1), угол ACM равен углу A (слой 2). */
          shtrih('C', 'M', 1, { sloy: 1 }),
          ug('A', 'C', 'M', { sloy: 2, cvet: 1, znachenie: gr(a) }),
        ],
      },
      otvet: ans,
      razbor: [
        '$AM = CM$ — треугольник $AMC$ равнобедренный, $\\angle ACM = \\angle A$.',
        `$\\angle AMC = 180^\\circ - 2\\cdot ${g(a)} = ${g(ans)}$.`,
      ],
      scenariy: scenariyUgolAMC(a),
    };
  }),
  mikro('P1-3-10', 'Острый угол по другому', '\\angle A + \\angle B = 90^\\circ', (r) => {
    const a = r.int(5, 85);
    return {
      uslovie: `Один острый угол прямоугольного треугольника равен $${g(a)}$. Найдите другой острый угол.`,
      risunok: {
        tochki: pryamoyGip(90 - a),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
        /* Подсказка называет вершины: буквы — только на её чертежах. */
        podpisiPodskazki: ['A', 'B', 'C'],
        ...(a < POROG + 2 || a > 90 - POROG - 2 ? { skhematichno: true } : {}),
      },
      otvet: 90 - a,
      razbor: ['Сумма острых углов — $90^\\circ$.', `$90^\\circ - ${g(a)} = ${g(90 - a)}$.`],
      scenariy: scenariyOstryyUgol(a),
    };
  }),
];

/* ── 4. Четырёхугольники ─────────────────────────────────────────── */

export const BLOK_CHETYREHUGOLNIKI: Mikro[] = [
  mikro('P1-4-01', 'Соседний угол параллелограмма', '\\angle A + \\angle B = 180^\\circ', (r) =>
    sosedniyUgolParallelogramma(r.int(30, 79)),
  ),
  mikro('P1-4-02', 'Сумма двух углов параллелограмма', '\\angle A = \\angle C', (r) => {
    const a = r.int(30, 85);
    return {
      uslovie: `Сумма двух углов параллелограмма равна $${g(2 * a)}$. Найдите больший угол параллелограмма.`,
      risunok: forma(a, 30, 88, (v) => ({
        tochki: parallelogramm(v),
        elementy: [mn(['A', 'B', 'C', 'D']), ug('A', 'B', 'C', { vydelit: 'iskomoe' })],
        podpisi: false,
        proverki: [ist('A', 'B', 'C', 180 - a)],
      })),
      otvet: 180 - a,
      razbor: [
        `Сумма меньше $180^\\circ$ — это противолежащие углы, каждый $${g(a)}$.`,
        `Больший угол: $180^\\circ - ${g(a)} = ${g(180 - a)}$.`,
      ],
    };
  }),
  mikro('P1-4-03', 'Диагональ ромба и сторона', '\\angle CAB = \\dfrac{\\angle A}{2}', (r) => {
    const a = 2 * r.int(20, 70);
    return {
      uslovie: `В ромбе $ABCD$ $\\angle A = ${g(a)}$. Найдите угол $CAB$.`,
      risunok: forma(a, 56, 124, (v) => ({
        tochki: romb(v),
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C'),
          ug('D', 'A', 'C'),
          ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
          ug('D', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
        ],
      })),
      otvet: a / 2,
      razbor: ['Диагональ ромба — биссектриса его угла.', `$${g(a)} : 2 = ${g(a / 2)}$.`],
    };
  }),
  mikro('P1-4-04', 'Тупой угол ромба', '\\angle B = 180^\\circ - 2\\angle CAB', (r) => {
    const x = r.int(15, 40);
    return {
      uslovie: `Диагональ $AC$ ромба $ABCD$ образует со стороной $AB$ угол $${g(x)}$. Найдите угол $B$.`,
      risunok: forma(2 * x, 30, 88, (v) => ({
        tochki: romb(v),
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(x) }),
          ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
        ],
        proverki: [ist('A', 'B', 'C', 180 - 2 * x)],
      })),
      otvet: 180 - 2 * x,
      razbor: [
        `$\\angle A = 2\\cdot ${g(x)} = ${g(2 * x)}$.`,
        `$\\angle B = 180^\\circ - ${g(2 * x)} = ${g(180 - 2 * x)}$.`,
      ],
    };
  }),
  mikro(
    'P1-4-05',
    'Угол между диагоналями прямоугольника',
    '\\angle AOB = 180^\\circ - 2\\angle OAB',
    (r) => {
      const x = r.int(20, 70);
      if (x === 45) return null;
      return {
        uslovie: `Диагональ $AC$ прямоугольника $ABCD$ образует со стороной $AD$ угол $${g(x)}$. Найдите угол $AOD$, где $O$ — точка пересечения диагоналей.`,
        risunok: forma(x, 28, 62, (v) => ({
          tochki: {
            A: [0, 0],
            D: [4 / Math.tan((v * Math.PI) / 180), 0],
            C: [4 / Math.tan((v * Math.PI) / 180), 4],
            B: [0, 4],
            O: { seredina: ['A', 'C'] },
          },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('A', 'C'),
            otr('B', 'D'),
            ug('D', 'A', 'C', { vydelit: 'dano', znachenie: gr(x) }),
            ug('A', 'O', 'D', { vydelit: 'iskomoe' }),
          ],
          proverki: [ist('A', 'O', 'D', 180 - 2 * x)],
        })),
        otvet: 180 - 2 * x,
        razbor: [
          '$OA = OD$ — половины равных диагоналей, треугольник $AOD$ равнобедренный.',
          `$\\angle AOD = 180^\\circ - 2\\cdot ${g(x)} = ${g(180 - 2 * x)}$.`,
        ],
      };
    },
  ),
  mikro('P1-4-06', 'Равнобедренная трапеция', '\\angle A + \\angle B = 180^\\circ', (r) => {
    const a = r.int(40, 80);
    const h = 4.4;
    return {
      uslovie: `Угол при большем основании равнобедренной трапеции равен $${g(a)}$. Найдите тупой угол трапеции.`,
      risunok: forma(a, 40, 86, (v) => {
        const dx = h / Math.tan((v * Math.PI) / 180);
        if (10 - 2 * dx < 3) throw new Error('верхнее основание мало');
        return {
          tochki: trapeciya(10, 10 - 2 * dx, h, dx),
          proverki: [ist('A', 'B', 'C', 180 - a)],
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            shtrih('A', 'B', 1),
            shtrih('C', 'D', 1),
            ug('D', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
            ug('A', 'B', 'C', { vydelit: 'iskomoe' }),
          ],
          podpisi: false,
        };
      }),
      otvet: 180 - a,
      razbor: [
        'Углы, прилежащие к боковой стороне, — односторонние при параллельных основаниях.',
        `$180^\\circ - ${g(a)} = ${g(180 - a)}$.`,
      ],
    };
  }),
  mikro(
    'P1-4-07',
    'Четвёртый угол четырёхугольника',
    '\\angle A + \\angle B + \\angle C + \\angle D = 360^\\circ',
    (r) => {
      const a = r.int(60, 110);
      const b = r.int(60, 110);
      const c = r.int(60, 110);
      const d = 360 - a - b - c;
      if (d < 45 || d > 150) return null;
      return {
        uslovie: `Три угла выпуклого четырёхугольника равны $${g(a)}$, $${g(b)}$ и $${g(c)}$. Найдите четвёртый угол.`,
        risunok: null,
        otvet: d,
        razbor: [
          'Сумма углов выпуклого четырёхугольника $360^\\circ$.',
          `$360^\\circ - ${g(a)} - ${g(b)} - ${g(c)} = ${g(d)}$.`,
        ],
      };
    },
  ),
  mikro('P1-4-08', 'Угол между высотами', '\\angle DOE = 180^\\circ - \\angle A', (r) => {
    const a = r.int(35, 80);
    const b = r.int(Math.max(92 - a, 40), 80);
    return {
      uslovie: `В остроугольном треугольнике $ABC$ $\\angle A = ${g(a)}$, $BD$ и $CE$ — высоты, $O$ — их точка пересечения. Найдите угол $DOE$.`,
      risunok: podobrat(
        null,
        { b, c: 180 - a - b },
        { b: [35, 82], c: [35, 82] },
        ({ b: bV, c: cV }) => {
          const tt = poUglam(bV, cV);
          return {
            tochki: {
              B: tt.A,
              C: tt.B,
              A: tt.C,
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
              pryam('A', 'D', 'B'),
              pryam('A', 'E', 'C'),
              ug('B', 'A', 'C', { vydelit: 'dano', znachenie: gr(a) }),
              ug('D', 'O', 'E', { vydelit: 'iskomoe' }),
            ],
            proverki: [ist('D', 'O', 'E', 180 - a)],
          } as Scena;
        },
        ZHESTKO,
      ),
      otvet: 180 - a,
      razbor: [
        'В четырёхугольнике $ADOE$ два прямых угла.',
        `$\\angle DOE = 360^\\circ - 180^\\circ - ${g(a)} = ${g(180 - a)}$.`,
      ],
    };
  }),
  mikro(
    'P1-4-09',
    'Угол между биссектрисами',
    '\\angle AOB = 90^\\circ + \\dfrac{\\angle C}{2}',
    (r) => {
      const c = 2 * r.int(15, 60);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = ${g(c)}$, $O$ — точка пересечения биссектрис углов $A$ и $B$. Найдите угол $AOB$.`,
        risunok: forma(c, 40, 110, (v) => ({
          tochki: {
            ...poUglam((180 - v) / 2 + 5, (180 - v) / 2 - 5),
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
            otr('A', 'O'),
            otr('B', 'O'),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(c) }),
            ug('A', 'O', 'B', { vydelit: 'iskomoe' }),
          ],
          bezPodpisi: ['D', 'E'],
          proverki: [ist('A', 'O', 'B', 90 + c / 2)],
        })),
        otvet: 90 + c / 2,
        razbor: [
          `$\\angle OAB + \\angle OBA = \\dfrac{180^\\circ - ${g(c)}}{2} = ${g((180 - c) / 2)}$.`,
          `$\\angle AOB = 180^\\circ - ${g((180 - c) / 2)} = ${g(90 + c / 2)}$.`,
        ],
      };
    },
  ),
  mikro('P1-4-10', 'Прямоугольная трапеция', '\\angle A + \\angle B = 180^\\circ', (r) => {
    const a = r.int(35, 80);
    const h = 3;
    return {
      uslovie: `Один из углов прямоугольной трапеции равен $${g(a)}$. Найдите больший угол этой трапеции.`,
      risunok: {
        tochki: { A: [0, 0], B: [0, h], C: [4, h], D: [4 + h / Math.tan((a * Math.PI) / 180), 0] },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          pryam('B', 'A', 'D'),
          pryam('A', 'B', 'C'),
          ug('A', 'D', 'C', { vydelit: 'dano', znachenie: gr(a) }),
          ug('B', 'C', 'D', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      otvet: 180 - a,
      razbor: [
        'Два угла прямые, острый и тупой при боковой стороне дают $180^\\circ$.',
        `Больший: $180^\\circ - ${g(a)} = ${g(180 - a)}$.`,
      ],
    };
  }),
];

/* ── 5. Площади ──────────────────────────────────────────────────── */

export const BLOK_PLOSHCHADI: Mikro[] = [
  mikro('P1-5-01', 'Площадь прямоугольного треугольника', 'S = \\dfrac{ab}{2}', (r) => {
    const a = r.int(3, 20);
    const b = r.int(3, 20);
    return {
      uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$. Найдите его площадь.`,
      risunok: forma((Math.atan(a / b) * 180) / Math.PI, 30, 60, (v) => ({
        tochki: pryamougolnyy(v, 'katety'),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          /* Подсказка, шаг 1: данные подсвечены, вершины подписаны. */
          { ...zn('A', 'C', String(a)), podsvetka: [1] },
          { ...zn('C', 'B', String(b)), podsvetka: [1] },
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C'],
      })),
      otvet: (a * b) / 2,
      razbor: [
        'Катеты перпендикулярны: катет $CB$ — высота, проведённая к катету $AC$. Площадь — половина произведения катетов.',
        `$S = \\dfrac12\\cdot AC\\cdot CB = \\dfrac{${a}\\cdot ${b}}{2} = ${t((a * b) / 2)}$.`,
      ],
      scenariy: scenariyPryamougolnogo(a, b),
    };
  }),
  mikro('P1-5-02', 'Сторона и высота треугольника', 'S = \\dfrac12 a h', (r) => {
    const a = r.int(4, 20);
    const h = r.int(3, 15);
    return {
      uslovie: `Сторона треугольника равна $${a}$, а высота, проведённая к ней, равна $${h}$. Найдите площадь треугольника.`,
      risunok: {
        tochki: { ...poUglam(60, 50), H: { osnovanie: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          otr('C', 'H', { vydelit: 'dano', znachenie: String(h), podsvetka: [1] }),
          pryam('C', 'H', 'B'),
          { ...zn('A', 'B', String(a)), podsvetka: [1] },
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'H'],
      },
      otvet: (a * h) / 2,
      razbor: [
        '$CH \\perp AB$: основание — $AB$, высота — $CH$. Площадь — половина основания на высоту.',
        `$S = \\dfrac12\\cdot AB\\cdot CH = \\dfrac12\\cdot ${a}\\cdot ${h} = ${t((a * h) / 2)}$.`,
      ],
      scenariy: scenariyStoronaVysota(a, h),
    };
  }),
  mikro('P1-5-03', 'Площадь параллелограмма', 'S = a h', (r) => {
    const a = r.int(4, 20);
    const h = r.int(2, 12);
    return {
      uslovie: `Сторона параллелограмма равна $${a}$, а высота, проведённая к ней, равна $${h}$. Найдите площадь.`,
      risunok: {
        tochki: { ...parallelogramm(60, 10, 6), H: { osnovanie: ['B', 'A', 'D'] } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('B', 'H', { vydelit: 'dano', znachenie: String(h), podsvetka: [1] }),
          pryam('B', 'H', 'D'),
          { ...zn('A', 'D', String(a)), podsvetka: [1] },
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'D', 'H'],
      },
      otvet: a * h,
      razbor: [
        '$BH \\perp AD$: основание — $AD$, высота — $BH$. Площадь параллелограмма — основание на высоту.',
        `$S = AD\\cdot BH = ${a}\\cdot ${h} = ${a * h}$.`,
      ],
      scenariy: scenariyParallelogramma(a, h),
    };
  }),
  mikro('P1-5-04', 'Площадь трапеции', 'S = \\dfrac{a + b}{2}\\, h', (r) => {
    const a = r.int(6, 20);
    const b = r.int(2, a - 2);
    const h = r.int(2, 12);
    return {
      uslovie: `Основания трапеции равны $${a}$ и $${b}$, высота равна $${h}$. Найдите площадь трапеции.`,
      risunok: forma(b / a, 0.4, 0.75, (k) => ({
        tochki: {
          ...trapeciya(10, 10 * k, 4.4, (10 - 10 * k) * 0.4),
          H: { osnovanie: ['B', 'A', 'D'] },
        },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('B', 'H', { vydelit: 'dano', znachenie: String(h), podsvetka: [1] }),
          pryam('B', 'H', 'D'),
          { ...zn('A', 'D', String(a)), podsvetka: [1] },
          { ...zn('B', 'C', String(b)), podsvetka: [1] },
          /* Подсказка, шаг 2: диагональ BD делит трапецию на два треугольника. */
          otr('B', 'D', { sloy: 2, stil: 'punktir' }),
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'D', 'H'],
      })),
      otvet: ((a + b) * h) / 2,
      razbor: [
        'Диагональ $BD$ делит трапецию на треугольники $ABD$ и $BCD$ с общей высотой $BH$: $S = \\dfrac12\\cdot AD\\cdot BH + \\dfrac12\\cdot BC\\cdot BH = \\dfrac{AD + BC}{2}\\cdot BH$.',
        `$S = \\dfrac{${a} + ${b}}{2}\\cdot ${h} = ${t(((a + b) * h) / 2)}$.`,
      ],
      scenariy: scenariyTrapecii(a, b, h),
    };
  }),
  mikro('P1-5-05', 'Площадь ромба по диагоналям', 'S = \\dfrac{d_1 d_2}{2}', (r) => {
    const d1 = r.int(4, 20);
    const d2 = r.int(4, 20);
    return {
      uslovie: `Диагонали ромба равны $${d1}$ и $${d2}$. Найдите его площадь.`,
      risunok: forma(d1 / d2, 0.45, 2.2, (k) => ({
        tochki: { A: [-k, 0], C: [k, 0], B: [0, 1], D: [0, -1], O: [0, 0] },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C', { vydelit: 'dano', znachenie: String(d1), podsvetka: [1] }),
          otr('B', 'D', { vydelit: 'dano', znachenie: String(d2), podsvetka: [1] }),
          /* Подсказка, шаг 2: диагонали перпендикулярны. */
          pryam('B', 'O', 'C', { sloy: 2 }),
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'D', 'O'],
      })),
      otvet: (d1 * d2) / 2,
      razbor: [
        'Диагонали ромба перпендикулярны: $AC$ делит ромб на треугольники $ABC$ и $ADC$ с высотами $BO$ и $DO$, $BO + DO = BD$. Площадь — половина произведения диагоналей.',
        `$S = \\dfrac{${d1}\\cdot ${d2}}{2} = ${t((d1 * d2) / 2)}$.`,
      ],
      scenariy: scenariyRomba(d1, d2),
    };
  }),
  mikro('P1-5-06', 'Две стороны и угол 30°', 'S = \\dfrac12 ab\\sin C', (r) => {
    const a = r.int(2, 20);
    const b = r.int(2, 20);
    return {
      uslovie: `Две стороны треугольника равны $${a}$ и $${b}$, угол между ними $30^\\circ$. Найдите площадь.`,
      risunok: podobrat(
        null,
        { u: 30, k: b / a },
        { u: [28, 60], k: [0.6, 1.7] },
        ({ u, k }) => ({
          tochki: { C: [0, 0], A: polar(0, 10), B: polar(u, 10 * k) },
          elementy: [
            tri('A', 'B', 'C'),
            ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '30°', podsvetka: [1] }),
            { ...zn('C', 'A', String(a)), podsvetka: [1] },
            { ...zn('C', 'B', String(b)), podsvetka: [1] },
          ],
          podpisi: false,
          podpisiPodskazki: ['A', 'B', 'C'],
        }),
        ZHESTKO,
      ),
      otvet: (a * b) / 4,
      razbor: [
        'Угол $C$ — между сторонами $CA$ и $CB$: $S = \\dfrac12\\cdot CA\\cdot CB\\cdot \\sin C$, $\\sin 30^\\circ = \\dfrac12$.',
        `$S = \\dfrac12\\cdot ${a}\\cdot ${b}\\cdot \\dfrac12 = ${t((a * b) / 4)}$.`,
      ],
      scenariy: scenariyDveStoronyUgol(a, b),
    };
  }),
  mikro('P1-5-07', 'Параллелограмм с углом 30°', 'S = ab\\sin\\alpha', (r) => {
    const a = r.int(3, 20);
    const b = r.int(2, 12);
    return {
      uslovie: `Стороны параллелограмма равны $${a}$ и $${b}$, острый угол $30^\\circ$. Найдите площадь.`,
      risunok: podobrat(
        null,
        { u: 30, k: b / a },
        { u: [28, 65], k: [0.5, 1] },
        ({ u, k }) => ({
          tochki: { ...parallelogramm(u, 10, 10 * k), H: { osnovanie: ['B', 'A', 'D'] } },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            ug('D', 'A', 'B', { vydelit: 'dano', znachenie: '30°', podsvetka: [1] }),
            { ...zn('A', 'D', String(a)), podsvetka: [1] },
            { ...zn('A', 'B', String(b)), podsvetka: [1] },
            /* Подсказка, шаг 2: высота BH к стороне AD. */
            otr('B', 'H', { sloy: 2, stil: 'punktir' }),
            pryam('B', 'H', 'D', { sloy: 2 }),
          ],
          podpisi: false,
          podpisiPodskazki: ['A', 'B', 'C', 'D', 'H'],
        }),
        ZHESTKO,
      ),
      otvet: (a * b) / 2,
      razbor: [
        `Высота $BH$, проведённая к стороне $AD$, — катет против угла $30^\\circ$ в треугольнике $ABH$: она равна половине гипотенузы $AB$, $BH = \\dfrac{${b}}{2}$.`,
        `$S = AD\\cdot BH = ${a}\\cdot \\dfrac{${b}}{2} = ${t((a * b) / 2)}$.`,
      ],
      scenariy: scenariyParallelogramma30(a, b),
    };
  }),
  mikro('P1-5-08', 'Средняя линия трапеции', 'm = \\dfrac{a + b}{2}', (r) => {
    const a = r.int(6, 30);
    const b = r.int(2, a - 2);
    return {
      uslovie: `Основания трапеции равны $${a}$ и $${b}$. Найдите её среднюю линию.`,
      risunok: {
        tochki: {
          ...trapeciya(10, (10 * b) / a, 4, (10 - (10 * b) / a) * 0.4),
          M: { seredina: ['A', 'B'] },
          N: { seredina: ['D', 'C'] },
        },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('M', 'N', { vydelit: 'iskomoe' }),
          /* Средняя линия соединяет середины боковых сторон. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          shtrih('D', 'N', 2),
          shtrih('N', 'C', 2),
          { ...zn('A', 'D', String(a)), podsvetka: [1] },
          { ...zn('B', 'C', String(b)), podsvetka: [1] },
        ],
        podpisi: false,
        podpisiPodskazki: ['A', 'B', 'C', 'D', 'M', 'N'],
      },
      otvet: (a + b) / 2,
      razbor: [
        '$M$ и $N$ — середины боковых сторон: $MN$ — средняя линия, она равна полусумме оснований.',
        `$MN = \\dfrac{AD + BC}{2} = \\dfrac{${a} + ${b}}{2} = ${t((a + b) / 2)}$.`,
      ],
      scenariy: scenariySrednyayaTrapecii(a, b),
    };
  }),
  mikro('P1-5-09', 'Площадь подобного треугольника', 'S_2 = k^2 S_1', (r) => {
    const k = r.int(2, 4);
    const s = r.int(2, 20);
    return {
      uslovie: `Стороны треугольника увеличили в $${k}$ раза. Площадь исходного треугольника равна $${s}$. Найдите площадь нового.`,
      risunok: null,
      otvet: k * k * s,
      razbor: [
        `Треугольники подобны с коэффициентом $${k}$; площади подобных фигур относятся как квадрат коэффициента подобия.`,
        `$${k}^2\\cdot ${s} = ${k * k * s}$.`,
      ],
      scenariy: scenariyPodobnogo(k, s),
    };
  }),
  mikro('P1-5-10', 'Средняя линия треугольника', 'DE = \\dfrac{AB}{2}', (r) => {
    const a = r.int(4, 40);
    return {
      uslovie: `В треугольнике $ABC$ $D$ и $E$ — середины сторон $AC$ и $BC$, $AB = ${a}$. Найдите $DE$.`,
      risunok: {
        tochki: { ...poUglam(60, 55), D: { seredina: ['A', 'C'] }, E: { seredina: ['B', 'C'] } },
        elementy: [
          tri('A', 'B', 'C'),
          otr('D', 'E', { vydelit: 'iskomoe' }),
          shtrih('A', 'D', 1),
          shtrih('D', 'C', 1),
          shtrih('B', 'E', 2),
          shtrih('E', 'C', 2),
          zn('A', 'B', String(a)),
          /* Подсказка, шаг 2: DE ∥ AB — значки параллельности. */
          { tip: 'otrezok', a: 'D', b: 'E', tolkoShtrihi: true, strelki: 1, sloy: 2 } as Element,
          { tip: 'otrezok', a: 'A', b: 'B', tolkoShtrihi: true, strelki: 1, sloy: 2 } as Element,
        ],
      },
      otvet: a / 2,
      razbor: [
        '$DE$ соединяет середины сторон $AC$ и $BC$ — это средняя линия: она параллельна $AB$ и равна её половине.',
        `$DE = \\dfrac{AB}{2} = ${a} : 2 = ${t(a / 2)}$.`,
      ],
      scenariy: scenariySrednyayaTreugolnika(a),
    };
  }),
];

/* ── 6. Теорема Пифагора и особые треугольники ───────────────────── */

const TROYKI: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [6, 8, 10],
  [9, 12, 15],
  [20, 21, 29],
  [12, 16, 20],
  [9, 40, 41],
  [12, 35, 37],
];

function pryamoyKatety(a: number, b: number): Scena['tochki'] {
  return pryamougolnyy(
    clamp((Math.atan(a / b) * 180) / Math.PI, POROG + 3, 90 - POROG - 3),
    'katety',
  );
}

export const BLOK_PIFAGOR: Mikro[] = [
  mikro('P1-6-01', 'Гипотенуза', 'c = \\sqrt{a^2 + b^2}', (r) => {
    const [a, b, c] = r.pick(TROYKI);
    return {
      uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$. Найдите гипотенузу.`,
      risunok: {
        tochki: pryamoyKatety(a, b),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          zn('A', 'C', String(a)),
          zn('C', 'B', String(b)),
          otr('A', 'B', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      otvet: c,
      razbor: [`Гипотенуза: $\\sqrt{${a * a} + ${b * b}} = \\sqrt{${c * c}} = ${c}$.`],
    };
  }),
  mikro('P1-6-02', 'Катет', 'a = \\sqrt{c^2 - b^2}', (r) => {
    const [a, b, c] = r.pick(TROYKI);
    return {
      uslovie: `Гипотенуза прямоугольного треугольника равна $${c}$, один из катетов — $${b}$. Найдите другой катет.`,
      risunok: {
        tochki: pryamoyKatety(a, b),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('A', 'C', { vydelit: 'iskomoe' }),
          zn('C', 'B', String(b)),
          zn('A', 'B', String(c)),
        ],
        podpisi: false,
      },
      otvet: a,
      razbor: [`Катет: $\\sqrt{${c * c} - ${b * b}} = \\sqrt{${a * a}} = ${a}$.`],
    };
  }),
  mikro('P1-6-03', 'Диагональ прямоугольника', 'd = \\sqrt{a^2 + b^2}', (r) => {
    const [a, b, c] = r.pick(TROYKI);
    return {
      uslovie: `Стороны прямоугольника равны $${a}$ и $${b}$. Найдите его диагональ.`,
      risunok: forma(a / b, 0.45, 2.2, (k) => ({
        tochki: { A: [0, 0], B: [0, k], C: [1, k], D: [1, 0] },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C', { vydelit: 'iskomoe' }),
          zn('A', 'B', String(a)),
          zn('A', 'D', String(b)),
        ],
        podpisi: false,
      })),
      otvet: c,
      razbor: [
        'Диагональ — гипотенуза прямоугольного треугольника со сторонами-катетами.',
        `Диагональ: $\\sqrt{${a * a} + ${b * b}} = ${c}$.`,
      ],
    };
  }),
  mikro(
    'P1-6-04',
    'Сторона ромба',
    'a = \\sqrt{\\left(\\tfrac{d_1}{2}\\right)^2 + \\left(\\tfrac{d_2}{2}\\right)^2}',
    (r) => {
      const [a, b, c] = r.pick(TROYKI);
      return {
        uslovie: `Диагонали ромба равны $${2 * a}$ и $${2 * b}$. Найдите сторону ромба.`,
        risunok: forma(a / b, 0.45, 2.2, (k) => ({
          tochki: { A: [-k, 0], C: [k, 0], B: [0, 1], D: [0, -1] },
          elementy: [
            mn(['A', 'B', 'C', 'D']),
            otr('A', 'C', { vydelit: 'dano', znachenie: String(2 * a) }),
            otr('B', 'D', { vydelit: 'dano', znachenie: String(2 * b) }),
          ],
          podpisi: false,
        })),
        otvet: c,
        razbor: [
          'Диагонали ромба перпендикулярны и делятся пополам: катеты $' + a + '$ и $' + b + '$.',
          `$\\sqrt{${a * a} + ${b * b}} = ${c}$.`,
        ],
      };
    },
  ),
  mikro(
    'P1-6-05',
    'Высота равнобедренного',
    'h = \\sqrt{b^2 - \\left(\\tfrac{a}{2}\\right)^2}',
    (r) => {
      const [a, b, c] = r.pick(TROYKI);
      return {
        uslovie: `Боковая сторона равнобедренного треугольника равна $${c}$, основание — $${2 * a}$. Найдите высоту, проведённую к основанию.`,
        risunok: {
          tochki: { A: [-a, 0], B: [a, 0], C: [0, b], H: [0, 0] },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            otr('C', 'H', { vydelit: 'iskomoe' }),
            pryam('C', 'H', 'B'),
            zn('A', 'B', String(2 * a)),
            zn('B', 'C', String(c)),
          ],
          podpisi: false,
        },
        otvet: b,
        razbor: [
          'Высота к основанию делит его пополам.',
          `Высота: $\\sqrt{${c * c} - ${a * a}} = ${b}$.`,
        ],
      };
    },
  ),
  mikro('P1-6-06', 'Катет равнобедренного прямоугольного', 'c = a\\sqrt2', (r) => {
    const a = r.int(2, 20);
    return {
      uslovie: `Гипотенуза равнобедренного прямоугольного треугольника равна $${a}\\sqrt2$. Найдите катет.`,
      risunok: {
        tochki: pryamougolnyy(45, 'katety'),
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          shtrih('A', 'C', 1),
          shtrih('C', 'B', 1),
          zn('A', 'B', `${a}√2`),
          otr('C', 'B', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      otvet: a,
      razbor: [
        'Гипотенуза в $\\sqrt2$ раз больше катета.',
        `Катет: $\\dfrac{${a}\\sqrt2}{\\sqrt2} = ${a}$.`,
      ],
    };
  }),
  mikro('P1-6-07', 'Сторона квадрата по диагонали', 'd = a\\sqrt2', (r) => {
    const a = r.int(2, 20);
    return {
      uslovie: `Диагональ квадрата равна $${a}\\sqrt2$. Найдите сторону квадрата.`,
      risunok: {
        tochki: { A: [0, 0], B: [0, 4], C: [4, 4], D: [4, 0] },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('A', 'C', { vydelit: 'dano', znachenie: `${a}√2` }),
          otr('A', 'D', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      otvet: a,
      razbor: [
        'Диагональ квадрата в $\\sqrt2$ раз больше стороны.',
        `$${a}\\sqrt2 : \\sqrt2 = ${a}$.`,
      ],
    };
  }),
  mikro('P1-6-08', 'Сторона равностороннего по высоте', 'h = \\dfrac{a\\sqrt3}{2}', (r) => {
    const k = r.int(2, 30);
    return {
      uslovie: `Высота равностороннего треугольника равна $${k}\\sqrt3$. Найдите его сторону.`,
      risunok: {
        tochki: { ...poUglam(60, 60), H: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          otr('C', 'H', { vydelit: 'dano', znachenie: `${k}√3` }),
          pryam('C', 'H', 'B'),
          otr('A', 'B', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      otvet: 2 * k,
      razbor: [
        `Сторона — удвоенная высота, делённая на $\\sqrt3$: $\\dfrac{2\\cdot ${k}\\sqrt3}{\\sqrt3} = ${2 * k}$.`,
      ],
    };
  }),
  mikro('P1-6-09', 'Высота к гипотенузе', 'h = \\dfrac{ab}{c}', (r) => {
    const [a, b, c] = r.pick(TROYKI);
    const h = (a * b) / c;
    if (Math.abs(h * 100 - Math.round(h * 100)) > 1e-9) return null;
    return {
      uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$. Найдите высоту, проведённую к гипотенузе.`,
      risunok: {
        tochki: { ...pryamoyKatety(a, b), H: { osnovanie: ['C', 'A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'H', { vydelit: 'iskomoe' }),
          pryam('C', 'H', 'B'),
          zn('A', 'C', String(a)),
          zn('C', 'B', String(b)),
        ],
        podpisi: false,
      },
      otvet: h,
      razbor: [
        `Гипотенуза: $\\sqrt{${a * a} + ${b * b}} = ${c}$.`,
        `Высота: $\\dfrac{${a}\\cdot ${b}}{${c}} = ${t(h)}$.`,
      ],
    };
  }),
  mikro('P1-6-10', 'Медиана к гипотенузе по катетам', 'm = \\dfrac{c}{2}', (r) => {
    const [a, b, c] = r.pick(TROYKI);
    return {
      uslovie: `Катеты прямоугольного треугольника равны $${a}$ и $${b}$. Найдите медиану, проведённую к гипотенузе.`,
      risunok: {
        tochki: { ...pryamoyKatety(a, b), M: { seredina: ['A', 'B'] } },
        elementy: [
          tri('A', 'B', 'C'),
          pryam('A', 'C', 'B'),
          otr('C', 'M', { vydelit: 'iskomoe' }),
          /* Медиана: половины гипотенузы равны. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          zn('A', 'C', String(a)),
          zn('C', 'B', String(b)),
        ],
        podpisi: false,
      },
      otvet: c / 2,
      razbor: [`Гипотенуза $${c}$, медиана — её половина: $${t(c / 2)}$.`],
    };
  }),
];

/* ── 7. Синус, косинус, тангенс ──────────────────────────────────── */

export const BLOK_TRIG: Mikro[] = (() => {
  const kat = (a: number, b: number) => pryamoyKatety(a, b);
  /* Подсказка-сценарий, шаг 1 «Где прямой угол?»: значок прямого угла
     загорается (podsvetka 1). */
  const sc = (a: number, b: number, el: Element[]): Scena => ({
    tochki: kat(a, b),
    elementy: [tri('A', 'B', 'C'), pryam('A', 'C', 'B', { podsvetka: [1] }), ...el],
  });
  /* Сторона треугольника, которая загорается на шагах подсказки. */
  const svet = (a: string, b: string, ...shagi: number[]): Element =>
    otr(a, b, { podsvetka: shagi });
  const desyat = (x: number, y: number) => {
    const v = x / y;
    return Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;
  };
  return [
    mikro('P1-7-01', 'Синус по сторонам', '\\sin A = \\dfrac{BC}{AB}', (r) => {
      const [a, b, c] = r.pick(TROYKI);
      if (!desyat(b, c)) return null;
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $BC = ${b}$, $AB = ${c}$. Найдите $\\sin A$.`,
        risunok: sc(a, b, [
          zn('C', 'B', String(b)),
          zn('A', 'B', String(c)),
          ug('C', 'A', 'B', { vydelit: 'iskomoe', podsvetka: [2] }),
          /* Подсказка: гипотенуза (шаг 1), противолежащий катет (шаг 2). */
          svet('A', 'B', 1),
          svet('C', 'B', 2),
        ]),
        otvet: b / c,
        razbor: [
          'Прямой угол — $C$, гипотенуза — $AB$; углу $A$ противолежит катет $BC$.',
          `Синус — противолежащий катет к гипотенузе: $\\sin A = \\dfrac{BC}{AB} = \\dfrac{${b}}{${c}} = ${t(b / c)}$.`,
        ],
        scenariy: scenariySinus(b, c),
      };
    }),
    mikro('P1-7-02', 'Косинус по сторонам', '\\cos A = \\dfrac{AC}{AB}', (r) => {
      const [a, b, c] = r.pick(TROYKI);
      if (!desyat(a, c)) return null;
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $AC = ${a}$, $AB = ${c}$. Найдите $\\cos A$.`,
        risunok: sc(a, b, [
          zn('A', 'C', String(a)),
          zn('A', 'B', String(c)),
          ug('C', 'A', 'B', { vydelit: 'iskomoe', podsvetka: [2] }),
          /* Подсказка: гипотенуза (шаг 1), прилежащий катет (шаг 2). */
          svet('A', 'B', 1),
          svet('A', 'C', 2),
        ]),
        otvet: a / c,
        razbor: [
          'Прямой угол — $C$, гипотенуза — $AB$; к углу $A$ прилежит катет $AC$.',
          `Косинус — прилежащий катет к гипотенузе: $\\cos A = \\dfrac{AC}{AB} = \\dfrac{${a}}{${c}} = ${t(a / c)}$.`,
        ],
        scenariy: scenariyKosinus(a, c),
      };
    }),
    mikro('P1-7-03', 'Тангенс по катетам', '\\operatorname{tg} A = \\dfrac{BC}{AC}', (r) => {
      const [a, b] = r.pick(TROYKI);
      if (!desyat(b, a)) return null;
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $AC = ${a}$, $BC = ${b}$. Найдите $\\operatorname{tg} A$.`,
        risunok: sc(a, b, [
          zn('A', 'C', String(a)),
          zn('C', 'B', String(b)),
          ug('C', 'A', 'B', { vydelit: 'iskomoe', podsvetka: [2] }),
          /* Подсказка: катеты (шаг 1). */
          svet('A', 'C', 1),
          svet('C', 'B', 1),
        ]),
        otvet: b / a,
        razbor: [
          'Прямой угол — $C$; углу $A$ противолежит катет $BC$, прилежит — $AC$.',
          `Тангенс — противолежащий катет к прилежащему: $\\operatorname{tg} A = \\dfrac{BC}{AC} = \\dfrac{${b}}{${a}} = ${t(b / a)}$.`,
        ],
        scenariy: scenariyTangens(a, b),
      };
    }),
    mikro('P1-7-04', 'Прилежащий катет через косинус', 'AC = AB\\cdot\\cos A', (r) => {
      const [a, b, c] = r.pick(TROYKI);
      const k = r.int(1, 4);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $AB = ${c * k}$, $\\cos A = \\dfrac{${a}}{${c}}$. Найдите $AC$.`,
        risunok: sc(a, b, [
          zn('A', 'B', String(c * k)),
          ug('C', 'A', 'B', { vydelit: 'dano', podsvetka: [2] }),
          otr('A', 'C', { vydelit: 'iskomoe', podsvetka: [2] }),
          /* Подсказка: гипотенуза (шаг 1). */
          svet('A', 'B', 1),
        ]),
        otvet: a * k,
        razbor: [
          'Гипотенуза — $AB$, искомый $AC$ — прилежащий к углу $A$ катет: $\\cos A = \\dfrac{AC}{AB}$.',
          `$AC = AB\\cdot\\cos A = ${c * k}\\cdot\\dfrac{${a}}{${c}} = ${a * k}$.`,
        ],
        scenariy: scenariyKatetCherezKosinus(c * k, c),
      };
    }),
    mikro('P1-7-05', 'Противолежащий катет через синус', 'BC = AB\\cdot\\sin A', (r) => {
      const [a, b, c] = r.pick(TROYKI);
      const k = r.int(1, 4);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $AB = ${c * k}$, $\\sin A = \\dfrac{${b}}{${c}}$. Найдите $BC$.`,
        risunok: sc(a, b, [
          zn('A', 'B', String(c * k)),
          ug('C', 'A', 'B', { vydelit: 'dano', podsvetka: [2] }),
          otr('C', 'B', { vydelit: 'iskomoe', podsvetka: [2] }),
          /* Подсказка: гипотенуза (шаг 1). */
          svet('A', 'B', 1),
        ]),
        otvet: b * k,
        razbor: [
          'Гипотенуза — $AB$, искомый $BC$ — противолежащий углу $A$ катет: $\\sin A = \\dfrac{BC}{AB}$.',
          `$BC = AB\\cdot\\sin A = ${c * k}\\cdot\\dfrac{${b}}{${c}} = ${b * k}$.`,
        ],
        scenariy: scenariyKatetCherezSinus(c * k, c),
      };
    }),
    mikro('P1-7-06', 'Катет через тангенс', 'BC = AC\\cdot\\operatorname{tg} A', (r) => {
      const [a, b] = r.pick(TROYKI);
      const k = r.int(1, 4);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $AC = ${a * k}$, $\\operatorname{tg} A = \\dfrac{${b}}{${a}}$. Найдите $BC$.`,
        risunok: sc(a, b, [
          zn('A', 'C', String(a * k)),
          ug('C', 'A', 'B', { vydelit: 'dano', podsvetka: [2] }),
          otr('C', 'B', { vydelit: 'iskomoe', podsvetka: [1] }),
          /* Подсказка: катеты (шаг 1). */
          svet('A', 'C', 1),
        ]),
        otvet: b * k,
        razbor: [
          'Углу $A$ противолежит искомый катет $BC$, прилежит — данный $AC$: $\\operatorname{tg} A = \\dfrac{BC}{AC}$.',
          `$BC = AC\\cdot\\operatorname{tg} A = ${a * k}\\cdot\\dfrac{${b}}{${a}} = ${b * k}$.`,
        ],
        scenariy: scenariyKatetCherezTangens(a * k, a),
      };
    }),
    mikro('P1-7-07', 'Косинус по синусу', '\\sin^2 A + \\cos^2 A = 1', (r) => {
      const [s, c] = r.pick([
        [0.6, 0.8],
        [0.8, 0.6],
        [0.28, 0.96],
        [0.96, 0.28],
      ] as [number, number][]);
      return {
        uslovie: `Угол $A$ острый, $\\sin A = ${t(s)}$. Найдите $\\cos A$.`,
        risunok: null,
        otvet: c,
        razbor: [
          `Основное тождество: $\\cos^2 A = 1 - \\sin^2 A = 1 - ${t(s)}^2 = ${t(1 - s * s)}$.`,
          `Угол $A$ острый, косинус положителен: $\\cos A = \\sqrt{${t(1 - s * s)}} = ${t(c)}$.`,
        ],
        scenariy: scenariyKosinusPoSinusu(s),
      };
    }),
    mikro('P1-7-08', 'Синус одного угла — косинус другого', '\\cos B = \\sin A', (r) => {
      const s = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.25, 0.75, 0.35]);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $\\sin A = ${t(s)}$. Найдите $\\cos B$.`,
        risunok: sc(3, 4, [
          ug('C', 'A', 'B', { vydelit: 'dano', podsvetka: [2] }),
          ug('A', 'B', 'C', { vydelit: 'iskomoe', podsvetka: [3] }),
          /* Подсказка: гипотенуза (шаг 1); катет BC — противолежащий
             углу A (шаг 2) и прилежащий к углу B (шаг 3). */
          svet('A', 'B', 1),
          svet('C', 'B', 2, 3),
        ]),
        otvet: s,
        razbor: [
          'Противолежащий углу $A$ катет $BC$ прилежит к углу $B$: $\\sin A = \\dfrac{BC}{AB}$ и $\\cos B = \\dfrac{BC}{AB}$.',
          `Значит, $\\cos B = \\sin A = ${t(s)}$.`,
        ],
        scenariy: scenariyKosinusDrugogo(),
      };
    }),
    mikro('P1-7-09', 'Синус 30° в треугольнике', 'BC = AB\\sin 30^\\circ', (r) => {
      const c = 2 * r.int(2, 30);
      return {
        uslovie: `В треугольнике $ABC$ $\\angle C = 90^\\circ$, $\\angle A = 30^\\circ$, $AB = ${c}$. Найдите $BC$.`,
        risunok: {
          tochki: pryamougolnyy(60, 'katety'),
          elementy: [
            tri('A', 'B', 'C'),
            pryam('A', 'C', 'B', { podsvetka: [1] }),
            ug('C', 'A', 'B', { vydelit: 'dano', znachenie: '30°', podsvetka: [2] }),
            zn('A', 'B', String(c)),
            otr('C', 'B', { vydelit: 'iskomoe', podsvetka: [2] }),
            /* Подсказка: гипотенуза (шаг 1). */
            svet('A', 'B', 1),
          ],
        },
        otvet: c / 2,
        razbor: [
          'Гипотенуза — $AB$, против угла $A = 30^\\circ$ лежит катет $BC$.',
          `Катет против $30^\\circ$ — половина гипотенузы: $BC = \\dfrac{AB}{2} = \\dfrac{${c}}{2} = ${t(c / 2)}$.`,
        ],
        scenariy: scenariyKatet30Trig(c),
      };
    }),
    mikro('P1-7-10', 'Косинус в равнобедренном', '\\cos A = \\dfrac{AB/2}{AC}', (r) => {
      const l = r.int(2, 20) * 5;
      const c = r.pick([0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6]) * l;
      if (!Number.isInteger(c)) return null;
      return {
        uslovie: `В треугольнике $ABC$ $AC = BC = ${l}$, $AB = ${c}$. Найдите $\\cos A$.`,
        risunok: forma((Math.acos(c / (2 * l)) * 180) / Math.PI, 30, 76, (v) => ({
          tochki: {
            ...ravnobedrennyy(180 - 2 * v),
            H: { seredina: ['A', 'B'] },
          },
          elementy: [
            tri('A', 'B', 'C'),
            shtrih('A', 'C', 1),
            shtrih('B', 'C', 1),
            zn('A', 'C', String(l)),
            zn('A', 'B', String(c)),
            ug('C', 'A', 'B', { vydelit: 'iskomoe' }),
            /* Подсказка: высота CH (шаг 1), равные половины основания (шаг 2). */
            otr('C', 'H', { sloy: 1 }),
            pryam('C', 'H', 'A', { sloy: 1 }),
            shtrih('A', 'H', 2, { sloy: 2 }),
            shtrih('H', 'B', 2, { sloy: 2 }),
          ],
        })),
        otvet: c / (2 * l),
        razbor: [
          'Проведём высоту $CH$. Треугольник равнобедренный ($AC = BC$), высота к основанию — и медиана: $AH = \\dfrac{AB}{2}$.',
          `В прямоугольном треугольнике $ACH$: $\\cos A = \\dfrac{AH}{AC} = \\dfrac{${c} : 2}{${l}} = ${t(c / (2 * l))}$.`,
        ],
        scenariy: scenariyKosinusRavnobedrennyy(l, c),
      };
    }),
  ];
})();

/* ── 8. Центральные и вписанные углы ─────────────────────────────── */

function vpisannyy(dugaAB: number, el: Element[], extra: Scena['tochki'] = {}): Scena {
  return forma(dugaAB, 56, 300, (d) => ({
    tochki: { O: [0, 0], A: naDuge(270 - d / 2), B: naDuge(270 + d / 2), C: naDuge(100), ...extra },
    okruzhnosti: OKR,
    elementy: [okr('w'), ...el],
    bezPodpisi: [],
  }));
}

export const BLOK_OKRUZHNOST: Mikro[] = [
  mikro('P1-8-01', 'Вписанный по центральному', '\\angle ACB = \\dfrac{\\angle AOB}{2}', (r) => {
    const u = 2 * r.int(20, 80);
    return {
      uslovie: `Центральный угол $AOB$ равен $${g(u)}$. Найдите вписанный угол $ACB$, опирающийся на ту же дугу.`,
      risunok: vpisannyy(u, [
        otr('O', 'A'),
        otr('O', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        ug('A', 'O', 'B', { vydelit: 'dano', znachenie: gr(u), dugi: 2 }),
        ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
        /* Подсказка, шаг «На какую дугу опираются углы?»: дуга AB. */
        duga('w', 'A', 'B', { sloy: 1 }),
      ]),
      otvet: u / 2,
      razbor: [
        '$\\angle AOB$ — центральный, $\\angle ACB$ — вписанный; оба опираются на дугу $AB$, не содержащую $C$.',
        'Вписанный угол вдвое меньше центрального на ту же дугу.',
        `$\\angle ACB = ${g(u)} : 2 = ${g(u / 2)}$.`,
      ],
      scenariy: scenariyVpisannyyPoCentralnomu(u),
    };
  }),
  mikro('P1-8-02', 'Центральный по вписанному', '\\angle AOB = 2\\angle ACB', (r) => {
    const u = r.int(15, 85);
    return {
      uslovie: `Вписанный угол $ACB$ равен $${g(u)}$. Найдите центральный угол $AOB$, опирающийся на ту же дугу.`,
      risunok: vpisannyy(2 * u, [
        otr('O', 'A'),
        otr('O', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(u) }),
        ug('A', 'O', 'B', { vydelit: 'iskomoe', dugi: 2 }),
        /* Подсказка, шаг «На какую дугу опираются углы?»: дуга AB. */
        duga('w', 'A', 'B', { sloy: 1 }),
      ]),
      otvet: 2 * u,
      razbor: [
        '$\\angle ACB$ — вписанный, $\\angle AOB$ — центральный; оба опираются на дугу $AB$, не содержащую $C$.',
        `Центральный угол вдвое больше вписанного: $\\angle AOB = 2\\cdot ${g(u)} = ${g(2 * u)}$.`,
      ],
      scenariy: scenariyCentralnyyPoVpisannomu(u),
    };
  }),
  mikro('P1-8-03', 'Вписанный угол по дуге', '\\angle ACB = \\dfrac{\\arc{AB}}{2}', (r) => {
    const d = 2 * r.int(20, 150);
    return {
      uslovie: `Дуга $AB$, на которую опирается вписанный угол $ACB$, равна $${g(d)}$. Найдите угол $ACB$.`,
      risunok: vpisannyy(
        d,
        [
          otr('C', 'A'),
          otr('C', 'B'),
          duga('w', 'A', 'B', { vydelit: 'dano', znachenie: gr(d) }),
          ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
        ],
        d > 200 ? { C: naDuge(90) } : {},
      ),
      otvet: d / 2,
      razbor: [
        'Угол $ACB$ вписанный, он равен половине дуги $AB$, на которую опирается.',
        `$\\angle ACB = ${g(d)} : 2 = ${g(d / 2)}$.`,
      ],
      scenariy: scenariyVpisannyyPoDuge(d),
    };
  }),
  mikro('P1-8-04', 'Дуга по вписанному углу', '\\arc{AB} = 2\\angle ACB', (r) => {
    const u = r.int(15, 85);
    return {
      uslovie: `Вписанный угол $ACB$ равен $${g(u)}$. Найдите градусную меру дуги $AB$, на которую он опирается.`,
      risunok: vpisannyy(2 * u, [
        otr('C', 'A'),
        otr('C', 'B'),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(u) }),
        duga('w', 'A', 'B', { vydelit: 'iskomoe' }),
      ]),
      otvet: 2 * u,
      razbor: [
        'Угол $ACB$ вписанный и опирается на дугу $AB$: он равен её половине.',
        `Значит, дуга вдвое больше угла: $\\arc{AB} = 2\\cdot ${g(u)} = ${g(2 * u)}$.`,
      ],
      scenariy: scenariyDugaPoVpisannomu(u),
    };
  }),
  mikro('P1-8-05', 'Угол на диаметр', '\\angle ACB = 90^\\circ', (r) => {
    const a = r.int(15, 75);
    return {
      uslovie: `$AB$ — диаметр окружности, $C$ — точка на окружности, $\\angle CAB = ${g(a)}$. Найдите угол $CBA$.`,
      /* ∠CAB опирается на дугу CB: она равна 2·∠CAB. */
      risunok: forma(a, 20, 70, (v) => ({
        tochki: { O: [0, 0], A: naDuge(180), B: naDuge(0), C: naDuge(2 * v) },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          tri('A', 'B', 'C'),
          tochka('O'),
          ug('C', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
          ug('C', 'B', 'A', { vydelit: 'iskomoe' }),
          /* Подсказка: полуокружность, на которую опирается угол ACB, затем прямой угол. */
          duga('w', 'A', 'B', { sloy: 1 }),
          pryam('A', 'C', 'B', { sloy: 2 }),
        ],
        proverki: [ist('C', 'B', 'A', 90 - a)],
      })),
      otvet: 90 - a,
      razbor: [
        'Угол $ACB$ вписанный и опирается на диаметр $AB$ — он прямой.',
        'Сумма углов треугольника $ABC$ — $180^\\circ$, на острые углы остаётся $90^\\circ$.',
        `$\\angle CBA = 90^\\circ - ${g(a)} = ${g(90 - a)}$.`,
      ],
      scenariy: scenariyUgolNaDiametr(),
    };
  }),
  mikro(
    'P1-8-06',
    'Вписанный по двум дугам',
    '\\angle ACB = \\dfrac{360^\\circ - \\arc{AC} - \\arc{BC}}{2}',
    (r) => {
      const ac = r.int(60, 150);
      const bc = r.int(50, 280 - ac);
      if ((360 - ac - bc) % 2 !== 0) return null;
      return {
        uslovie: `Точки $A$, $B$, $C$ лежат на окружности. Дуга $AC$, не содержащая $B$, равна $${g(ac)}$, дуга $BC$, не содержащая $A$, — $${g(bc)}$. Найдите угол $ACB$.`,
        risunok: {
          tochki: { O: [0, 0], C: naDuge(70), A: naDuge(70 + ac), B: naDuge(70 - bc) },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            otr('C', 'A'),
            otr('C', 'B'),
            ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
            /* Подсказка: дуга AB, на которую опирается угол, затем данные дуги и её величина. */
            duga('w', 'A', 'B', { sloy: 1 }),
            duga('w', 'C', 'A', { sloy: 2, znachenie: gr(ac) }),
            duga('w', 'B', 'C', { sloy: 2, znachenie: gr(bc) }),
            duga('w', 'A', 'B', { sloy: 2, znachenie: gr(360 - ac - bc) }),
          ],
          bezPodpisi: ['O'],
        },
        otvet: (360 - ac - bc) / 2,
        razbor: [
          'Угол $ACB$ вписанный и опирается на дугу $AB$, не содержащую $C$.',
          `Дуга $AB$ — остаток окружности: $360^\\circ - ${g(ac)} - ${g(bc)} = ${g(360 - ac - bc)}$.`,
          `Вписанный угол — половина дуги: $\\angle ACB = ${g(360 - ac - bc)} : 2 = ${g((360 - ac - bc) / 2)}$.`,
        ],
        scenariy: scenariyVpisannyyPoDvumDugam(ac, bc),
      };
    },
  ),
  mikro('P1-8-07', 'Углы на одну дугу', '\\angle ACB = \\angle ADB', (r) => {
    const u = r.int(20, 80);
    return {
      uslovie: `Точки $A$, $B$, $C$, $D$ лежат на окружности, $C$ и $D$ — по одну сторону от $AB$, $\\angle ACB = ${g(u)}$. Найдите угол $ADB$.`,
      risunok: vpisannyy(
        2 * u,
        [
          otr('C', 'A'),
          otr('C', 'B'),
          otr('D', 'A'),
          otr('D', 'B'),
          ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(u) }),
          ug('A', 'D', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг «На какие дуги опираются углы?»: общая дуга AB. */
          duga('w', 'A', 'B', { sloy: 1 }),
        ],
        { C: naDuge(60), D: naDuge(130) },
      ),
      otvet: u,
      razbor: [
        'Углы $ACB$ и $ADB$ вписанные; $C$ и $D$ по одну сторону от $AB$ — оба опираются на одну дугу $AB$.',
        'Вписанные углы на одну дугу равны.',
        `$\\angle ADB = \\angle ACB = ${g(u)}$.`,
      ],
      scenariy: scenariyNaOdnuDugu(),
    };
  }),
  mikro('P1-8-08', 'Дуга как доля окружности', '\\arc{} = \\dfrac{k}{n}\\cdot 360^\\circ', (r) => {
    const d = r.pick([3, 4, 5, 6, 8, 9, 10, 12, 18, 20]);
    const n = r.int(1, d - 1);
    if (nod(n, d) !== 1) return null;
    const ans = (180 * n) / d;
    return {
      uslovie: `Найдите вписанный угол, опирающийся на дугу, равную $\\frac{${n}}{${d}}$ окружности.`,
      risunok: null,
      otvet: ans,
      razbor: [
        `Вся окружность — $360^\\circ$. Дуга: $\\frac{${n}}{${d}}\\cdot 360^\\circ = ${g((360 * n) / d)}$.`,
        `Вписанный угол — половина дуги: $${g((360 * n) / d)} : 2 = ${g(ans)}$.`,
      ],
      scenariy: scenariyDolyaOkruzhnosti(n, d),
    };
  }),
  mikro('P1-8-09', 'Хорда делит окружность', '\\angle = \\dfrac{\\arc{}}{2}', (r) => {
    const a = 2 * r.int(30, 80);
    return {
      uslovie: `Хорда $AB$ стягивает дугу $${g(a)}$. Под каким углом она видна из точки $C$ большей дуги?`,
      risunok: vpisannyy(a, [
        otr('A', 'B'),
        otr('C', 'A'),
        otr('C', 'B'),
        ug('A', 'C', 'B', { vydelit: 'iskomoe' }),
        /* Подсказка, шаг «На какую дугу опирается угол?»: меньшая дуга AB. */
        duga('w', 'A', 'B', { sloy: 1, znachenie: gr(a) }),
      ]),
      otvet: a / 2,
      razbor: [
        'Угол $ACB$ вписанный; точка $C$ на большей дуге, поэтому угол опирается на меньшую дугу $AB$.',
        `Вписанный угол — половина дуги: $${g(a)} : 2 = ${g(a / 2)}$.`,
      ],
      scenariy: scenariyHordaDelitOkruzhnost(a),
    };
  }),
  mikro('P1-8-10', 'Треугольник $AOB$', '\\angle AOB = 180^\\circ - 2\\angle OAB', (r) => {
    const x = r.int(20, 70);
    return {
      uslovie: `$O$ — центр окружности, $A$ и $B$ — точки на ней, $\\angle OAB = ${g(x)}$. Найдите угол $AOB$.`,
      risunok: forma(x, 28, 76, (v) => ({
        tochki: { O: [0, 0], A: naDuge(270 - (90 - v)), B: naDuge(270 + (90 - v)) },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          tri('O', 'A', 'B'),
          ug('O', 'A', 'B', { vydelit: 'dano', znachenie: gr(x) }),
          ug('A', 'O', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка: радиусы OA = OB, затем равный угол при основании AB. */
          shtrih('O', 'A', 1, { sloy: 1 }),
          shtrih('O', 'B', 1, { sloy: 1 }),
          ug('O', 'B', 'A', { sloy: 2, znachenie: gr(x) }),
        ],
        proverki: [ist('A', 'O', 'B', 180 - 2 * x)],
      })),
      otvet: 180 - 2 * x,
      razbor: [
        '$OA = OB$ — радиусы: треугольник $AOB$ равнобедренный с основанием $AB$.',
        `Углы при основании равны: $\\angle OBA = \\angle OAB = ${g(x)}$.`,
        `Сумма углов треугольника: $\\angle AOB = 180^\\circ - 2\\cdot ${g(x)} = ${g(180 - 2 * x)}$.`,
      ],
      scenariy: scenariyTreugolnikAOB(x),
    };
  }),
];

/* ── 9. Касательные, вписанная и описанная окружности ────────────── */

export const BLOK_KASATELNYE: Mikro[] = [
  mikro('P1-9-01', 'Радиус и касательная', '\\angle OAC = 90^\\circ', (r) => {
    const u = r.int(20, 58);
    return {
      uslovie: `$CA$ — касательная к окружности с центром $O$ ($A$ — точка касания), $\\angle ACO = ${g(u)}$. Найдите угол $AOC$.`,
      risunok: forma(u, 20, 62, (v) => ({
        tochki: {
          O: [0, 0],
          C: [5 / Math.sin((v * Math.PI) / 180), 0],
          A: { kasanie: { iz: 'C', okr: 'w', storona: 1 } },
        },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('O', 'A'),
          otr('O', 'C'),
          pryamaya('C', 'A', { zaA: 0, zaB: 0.3 }),
          ug('A', 'C', 'O', { vydelit: 'dano', znachenie: gr(u) }),
          ug('A', 'O', 'C', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг 1: радиус в точку касания — прямой угол. */
          pryam('O', 'A', 'C', { sloy: 1 }),
        ],
        proverki: [ist('A', 'O', 'C', 90 - u)],
      })),
      otvet: 90 - u,
      razbor: [
        'Радиус в точку касания перпендикулярен касательной: $\\angle OAC = 90^\\circ$, треугольник $OAC$ прямоугольный.',
        'Острые углы прямоугольного треугольника вместе дают $90^\\circ$: $\\angle AOC + \\angle ACO = 90^\\circ$.',
        `$\\angle AOC = 90^\\circ - ${g(u)} = ${g(90 - u)}$.`,
      ],
      scenariy: scenariyRadiusKasatelnaya(u),
    };
  }),
  mikro('P1-9-02', 'Отрезки касательных', 'CA = CB', (r) => {
    const x = r.int(3, 30);
    return {
      uslovie: `Из точки $C$ к окружности проведены касательные $CA$ и $CB$, $CA = ${x}$. Найдите $CB$.`,
      risunok: {
        tochki: {
          O: [0, 0],
          C: [10, 0],
          A: { kasanie: { iz: 'C', okr: 'w', storona: 1 } },
          B: { kasanie: { iz: 'C', okr: 'w', storona: -1 } },
        },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('C', 'A', { vydelit: 'dano', znachenie: String(x) }),
          otr('C', 'B', { vydelit: 'iskomoe' }),
          tochka('O'),
          /* Подсказка, шаг 2: отрезки касательных равны — штрихи. */
          shtrih('C', 'A', 1, { sloy: 1 }),
          shtrih('C', 'B', 1, { sloy: 1 }),
        ],
      },
      otvet: x,
      razbor: [
        '$CA$ и $CB$ — отрезки касательных, проведённых из одной точки $C$; такие отрезки равны.',
        `$CB = CA = ${x}$.`,
      ],
      scenariy: scenariyOtrezkiKasatelnyh(),
    };
  }),
  mikro('P1-9-03', 'Угол между касательными', '\\angle AOB = 180^\\circ - \\angle ACB', (r) => {
    const u = r.int(30, 140);
    return {
      uslovie: `Из точки $C$ проведены касательные $CA$ и $CB$ к окружности с центром $O$, $\\angle ACB = ${g(u)}$. Найдите угол $AOB$.`,
      risunok: {
        tochki: {
          O: [0, 0],
          A: naDuge((180 - u) / 2),
          B: naDuge(-(180 - u) / 2),
          C: [5 / Math.cos((((180 - u) / 2) * Math.PI) / 180), 0],
        },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('O', 'A'),
          otr('O', 'B'),
          otr('C', 'A'),
          otr('C', 'B'),
          ug('A', 'C', 'B', { vydelit: 'dano', znachenie: gr(u) }),
          ug('A', 'O', 'B', { vydelit: 'iskomoe' }),
          /* Подсказка, шаг 1: радиусы в точки касания — прямые углы. */
          pryam('O', 'A', 'C', { sloy: 1 }),
          pryam('O', 'B', 'C', { sloy: 1 }),
        ],
      },
      otvet: 180 - u,
      razbor: [
        'Радиусы в точки касания перпендикулярны касательным: в четырёхугольнике $OACB$ углы при $A$ и $B$ прямые.',
        'Сумма углов четырёхугольника $360^\\circ$, значит, $\\angle AOB + \\angle ACB = 180^\\circ$.',
        `$\\angle AOB = 180^\\circ - ${g(u)} = ${g(180 - u)}$.`,
      ],
      scenariy: scenariyUgolMezhduKasatelnymi(u),
    };
  }),
  mikro('P1-9-04', 'Хорда и касательная', '\\arc{AB} = 2\\varphi', (r) => {
    const f = r.int(15, 80);
    return {
      uslovie: `Угол между хордой $AB$ и касательной $BC$ равен $${g(f)}$. Найдите меньшую дугу $AB$.`,
      risunok: forma(f, 28, 75, (v) => ({
        tochki: { O: [0, 0], B: naDuge(270), A: naDuge(270 + 2 * v), C: [7, -5] },
        okruzhnosti: OKR,
        elementy: [
          okr('w'),
          otr('A', 'B'),
          pryamaya('B', 'C', { zaA: 0.5, zaB: 0.1 }),
          ug('A', 'B', 'C', { vydelit: 'dano', znachenie: gr(f) }),
          duga('w', 'B', 'A', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      })),
      otvet: 2 * f,
      razbor: [
        'Угол между касательной и хордой равен половине дуги между ними, значит, дуга вдвое больше угла.',
        `$\\arc{AB} = 2\\cdot ${g(f)} = ${g(2 * f)}$. Угол острый — дуга меньше $180^\\circ$, это меньшая дуга.`,
      ],
      scenariy: scenariyHordaKasatelnaya(f),
    };
  }),
  mikro('P1-9-05', 'Четвёртая сторона описанного', 'AB + CD = BC + AD', (r) => {
    const ts = [r.int(3, 10), r.int(3, 10), r.int(3, 10), r.int(3, 10)];
    const [ab, bc, cd, da] = [ts[0]! + ts[1]!, ts[1]! + ts[2]!, ts[2]! + ts[3]!, ts[3]! + ts[0]!];
    const f = opisannyyPoStoronam(ab, bc, cd, da);
    return {
      uslovie: `В четырёхугольник $ABCD$ вписана окружность, $AB = ${ab}$, $BC = ${bc}$, $CD = ${cd}$. Найдите $AD$.`,
      risunok: {
        tochki: { O: [0, 0], A: f.A, B: f.B, C: f.C, D: f.D },
        okruzhnosti: { w: { centr: 'O', radius: f.r } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          okr('w'),
          zn('A', 'B', String(ab)),
          zn('B', 'C', String(bc)),
          zn('C', 'D', String(cd)),
          otr('A', 'D', { vydelit: 'iskomoe' }),
        ],
        bezPodpisi: ['O'],
      },
      otvet: da,
      razbor: [
        'Противоположные стороны: $AB$ и $CD$, $BC$ и $AD$. У описанного четырёхугольника их суммы равны: $AB + CD = BC + AD$.',
        `$AD = AB + CD - BC = ${ab} + ${cd} - ${bc} = ${da}$.`,
      ],
      scenariy: scenariyChetvertayaStorona(ab, bc, cd),
    };
  }),
  mikro('P1-9-06', 'Периметр описанного четырёхугольника', 'P = 2(AB + CD)', (r) => {
    const ts = [r.int(3, 10), r.int(3, 10), r.int(3, 10), r.int(3, 10)];
    const [ab, bc, cd, da] = [ts[0]! + ts[1]!, ts[1]! + ts[2]!, ts[2]! + ts[3]!, ts[3]! + ts[0]!];
    const f = opisannyyPoStoronam(ab, bc, cd, da);
    return {
      uslovie: `В четырёхугольник $ABCD$ вписана окружность, $AB = ${ab}$, $CD = ${cd}$. Найдите периметр.`,
      risunok: {
        tochki: { O: [0, 0], A: f.A, B: f.B, C: f.C, D: f.D },
        okruzhnosti: { w: { centr: 'O', radius: f.r } },
        elementy: [
          mn(['A', 'B', 'C', 'D'], { vydelit: 'iskomoe' }),
          okr('w'),
          zn('A', 'B', String(ab)),
          zn('C', 'D', String(cd)),
        ],
        bezPodpisi: ['O'],
      },
      otvet: 2 * (ab + cd),
      razbor: [
        `У описанного четырёхугольника суммы противоположных сторон равны: $BC + AD = AB + CD = ${ab + cd}$.`,
        `Периметр — обе суммы: $P = 2\\cdot ${ab + cd} = ${2 * (ab + cd)}$.`,
      ],
      scenariy: scenariyPerimetrOpisannogo(ab, cd),
    };
  }),
  mikro('P1-9-07', 'Противолежащий угол вписанного', '\\angle A + \\angle C = 180^\\circ', (r) => {
    const a = r.int(40, 140);
    return {
      uslovie: `Четырёхугольник $ABCD$ вписан в окружность, $\\angle A = ${g(a)}$. Найдите угол $C$.`,
      risunok: (() => {
        const d = [Math.max(40, (360 - 2 * a) * 0.45), a, a] as [number, number, number];
        return {
          tochki: { O: [0, 0], ...vpisannyyPoDugam(d) },
          okruzhnosti: OKR,
          elementy: [
            okr('w'),
            mn(['A', 'B', 'C', 'D']),
            ug('D', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
            ug('B', 'C', 'D', { vydelit: 'iskomoe' }),
          ],
          bezPodpisi: ['O'],
        } as Scena;
      })(),
      otvet: 180 - a,
      razbor: [
        'Угол $C$ противолежит углу $A$; противолежащие углы вписанного четырёхугольника дают $180^\\circ$.',
        `$\\angle C = 180^\\circ - ${g(a)} = ${g(180 - a)}$.`,
      ],
      scenariy: scenariyVpisannyyChetyrehugolnik(a),
    };
  }),
  mikro('P1-9-08', 'Средняя линия описанной трапеции', 'm = \\dfrac{c + d}{2}', (r) => {
    const c = r.int(5, 20);
    const d = c + r.int(0, 10);
    return {
      uslovie: `Боковые стороны трапеции, описанной около окружности, равны $${c}$ и $${d}$. Найдите среднюю линию трапеции.`,
      risunok: {
        tochki: {
          O: [0, 3],
          ...opisannayaTrapeciya(62, 50, 3),
          M: { seredina: ['A', 'B'] },
          N: { seredina: ['D', 'C'] },
        },
        okruzhnosti: { w: { centr: 'O', radius: 3 } },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          okr('w'),
          zn('A', 'B', String(c)),
          zn('D', 'C', String(d)),
          otr('M', 'N', { vydelit: 'iskomoe' }),
          /* Средняя линия соединяет середины боковых сторон. */
          shtrih('A', 'M', 1),
          shtrih('M', 'B', 1),
          shtrih('D', 'N', 2),
          shtrih('N', 'C', 2),
        ],
        podpisi: false,
      },
      otvet: (c + d) / 2,
      razbor: [
        `Сумма оснований описанной трапеции равна сумме боковых сторон: $${c} + ${d} = ${c + d}$.`,
        `Средняя линия — полусумма оснований: $\\dfrac{${c + d}}{2} = ${t((c + d) / 2)}$.`,
      ],
      scenariy: scenariySrednyayaOpisannoy(c, d),
    };
  }),
  mikro(
    'P1-9-09',
    'Угол правильного многоугольника',
    '\\alpha = 180^\\circ - \\dfrac{360^\\circ}{n}',
    (r) => {
      const n = r.pick([5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]);
      /* Сторон на рисунке не больше двенадцати: дальше угол тупее 150°
         и многоугольник не отличить от окружности. */
      const nV = Math.min(n, 12);
      const v = pravilnyy(nV);
      const im = v.map((_, i) => `P${i + 1}`);
      return {
        uslovie: `Найдите угол правильного $${n}$-угольника.`,
        risunok: {
          tochki: Object.fromEntries(im.map((x, i) => [x, v[i]!])) as Record<string, T2>,
          elementy: [mn(im), ug(im[nV - 1]!, im[0]!, im[1]!, { vydelit: 'iskomoe' })],
          podpisi: false,
          ...(nV === n ? {} : { skhematichno: true }),
        },
        otvet: 180 - 360 / n,
        razbor: [
          `Сумма внешних углов $360^\\circ$, у правильного многоугольника они равны: внешний угол $360^\\circ : ${n} = ${g(360 / n)}$.`,
          `Угол многоугольника и внешний угол смежные: $180^\\circ - ${g(360 / n)} = ${g(180 - 360 / n)}$.`,
        ],
        scenariy: scenariyUgolPravilnogo(n),
      };
    },
  ),
  mikro('P1-9-10', 'Касательная и секущая', 'AK^2 = AB\\cdot AC', (r) => {
    const m = r.int(1, 12);
    const n = m + r.int(2, 30);
    const k = Math.sqrt(m * n);
    if (!Number.isInteger(k)) return null;
    return {
      uslovie: `Из точки $A$ к окружности проведены касательная $AK$ и секущая, пересекающая окружность в точках $B$ и $C$; $AB = ${m}$, $AC = ${n}$. Найдите $AK$.`,
      risunok: null,
      otvet: k,
      razbor: [
        '$AC$ — вся секущая, $AB$ — её внешняя часть: $AK^2 = AB\\cdot AC$.',
        `$AK^2 = ${m}\\cdot ${n} = ${m * n}$, $AK = ${k}$.`,
      ],
      scenariy: scenariyKasatelnayaSekushchaya(m, n),
    };
  }),
];
