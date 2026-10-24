/**
 * Прототипы раздела «Варианты повышенной сложности»: той же формы, что
 * прототипы Блока 1, но с «подвохом» задачи варианта (данные с корнем
 * и т. п.). В общий реестр PROTOTIPY они не входят — в банк, тренажёр
 * и генератор №1 не попадают; `prototip(id)` и `reshenie(id)` находят
 * их по номеру, поэтому чертёж, решение и разбор строит тот же движок.
 *
 * Номера — от 101.
 */

import { ravnobedrennyy } from '../figury';
import { type PrototipChertezha, chislo, oblast, shtrih, tri, ug, vysota } from './dsl';

export const PROTOTIPY_POVYSHENNYE: readonly PrototipChertezha[] = [
  {
    id: 101,
    blok: 'III',
    nazvanie:
      'Равнобедренный с углом $30^\\circ$ при вершине: боковая сторона $\\sqrt{n}$ → площадь',
    fipi: [],
    uslovie: (p) =>
      `В равнобедренном треугольнике угол между боковыми сторонами равен $30^\\circ$, а каждая боковая сторона равна $\\sqrt{${p.a}}$. Найдите площадь треугольника.`,
    otvet: (p) => p.a / 4,
    primer: { a: 10 },
    sluchaynye: (r) => ({ a: r.int(2, 60) }),
    stsena: (p) => ({
      tochki: { ...ravnobedrennyy(30), H: { osnovanie: ['A', 'B', 'C'] } },
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1, { znachenie: `√${p.a}`, vydelit: 'dano' }),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '30°' }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
        ...vysota('A', 'B', 'C', 'H', null, {
          sloy: 1,
          znachenie: `√${p.a}/2`,
        }),
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
      otvet: chislo(p.a / 4),
    }),
  },
  {
    id: 102,
    blok: 'III',
    nazvanie:
      'Равнобедренный с углом $150^\\circ$ при вершине: боковая сторона $\\sqrt{n}$ → площадь',
    fipi: [],
    uslovie: (p) =>
      `Угол при вершине равнобедренного треугольника, противолежащий основанию, равен $150^\\circ$, а боковая сторона равна $\\sqrt{${p.a}}$. Найдите площадь треугольника.`,
    otvet: (p) => p.a / 4,
    primer: { a: 10 },
    sluchaynye: (r) => ({ a: r.int(2, 60) }),
    stsena: (p) => ({
      tochki: ravnobedrennyy(150),
      elementy: [
        tri('A', 'B', 'C'),
        shtrih('A', 'C', 1),
        shtrih('B', 'C', 1, { znachenie: `√${p.a}`, vydelit: 'dano' }),
        ug('A', 'C', 'B', { vydelit: 'dano', znachenie: '150°' }),
        oblast(['A', 'B', 'C'], { vydelit: 'iskomoe' }),
      ],
      proverki: [
        {
          ravny: [
            ['A', 'C'],
            ['B', 'C'],
          ],
        },
        { ugol: ['A', 'C', 'B'], gradusy: 150 },
      ],
      otvet: chislo(p.a / 4),
    }),
  },
];
