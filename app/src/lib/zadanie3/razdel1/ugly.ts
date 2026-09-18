/**
 * Раздел I, прототипы P03-06 … P03-10: углы между прямыми.
 *
 * У первых четырёх числовых параметров нет: вариант — это другая пара
 * прямых. Ответ внутри прототипа один и тот же (90°, 45°, 60°) —
 * так устроен и задачник. Проверяется он по координатам куба или
 * призмы: если пара прямых выбрана неверно, угол выйдет другой,
 * и автотест это покажет.
 */

import { vertex } from '../../solid/figures';
import { angleBetweenLines, sinBetweenLines } from '../../solid/measure';
import { NAMES, shapeLines } from '../../solid/drawings/section1';
import { type Vec3, sub } from '../../solid/vec';
import { gradusy, imya, otr, ru, segment } from '../format';
import {
  type Zadacha,
  chertezhRazbora,
  chertezhUslovia,
  perenos,
  peresekayutsya,
} from '../zadacha';
import { type Params, type Prototype, type Variant, num, pair } from '../types';
import { boxOf, directionOf } from './common';
import { distance } from '../../solid/measure';
import { solveBySearch } from '../search';

function variant(
  n: number,
  source: Variant['source'],
  ref: string,
  params: Params,
  sourceAnswer?: number,
): Variant {
  return sourceAnswer === undefined
    ? { n, source, ref, params }
    : { n, source, ref, params, sourceAnswer };
}

/** Направление прямой по модели движка, а не по формуле. */
function modelDirection(
  size: readonly [number, number, number],
  line: readonly [string, string],
): Vec3 {
  const body = boxOf(size[0], size[1], size[2]);
  return sub(vertex(body, line[1]), vertex(body, line[0]));
}

/** Угол между двумя прямыми куба по модели. */
function cubeAngle(p: Params): number {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  return angleBetweenLines(modelDirection([4, 4, 4], l1), modelDirection([4, 4, 4], l2));
}

/** Имя куба без индексов: из него собираются и текст, и структура. */
const KUB = 'ABCDA1B1C1D1';

function cubeUslovie(p: Params): string {
  return (
    `В кубе ${imya(KUB)} найдите угол между прямыми ${otr(pair(p, 'l1'))} ` +
    `и ${otr(pair(p, 'l2'))}. Ответ дайте в градусах.`
  );
}

/**
 * Структура варианта: две прямые — искомый угол, а параллельный
 * перенос одной из них — построение разбора. Скрещивающиеся прямые
 * угла на чертеже не образуют, поэтому дуга появляется только после
 * переноса, то есть только на чертеже разбора.
 */
function cubeZadacha(p: Params, answer: number): Zadacha {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  /* Перенос нужен только скрещивающимся: пересекающиеся дают
     угол сразу, и пересечься они могут не в вершине — диагонали
     основания сходятся в его центре. */
  const shift = peresekayutsya('cube', l1, l2) ? null : perenos('cube', l1, l2);
  return {
    telo: 'cube',
    imya: KUB,
    iskomoe: 'угол между прямыми',
    elementy: [
      { vid: 'угол', a: l1, b: l2, rol: 'искомое', podpis: `${ru(answer)}°` },
      ...(shift === null
        ? []
        : ([
            { vid: 'отрезок', ot: shift[0], do: shift[1], rol: 'построение' },
            { vid: 'угол', a: l1, b: shift, rol: 'построение', podpis: `${ru(answer)}°` },
          ] as const)),
    ],
  };
}

function cubeChertezh(p: Params, answer: number) {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  return chertezhUslovia(
    cubeZadacha(p, answer),
    `Куб ${NAMES}, выделены прямые ${segment(l1)} и ${segment(l2)}`,
  );
}

function cubeChertezhRazbora(p: Params, answer: number) {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  const shift = peresekayutsya('cube', l1, l2) ? null : perenos('cube', l1, l2);
  return chertezhRazbora(
    cubeZadacha(p, answer),
    shift === null
      ? `Тот же куб: прямые ${segment(l1)} и ${segment(l2)} пересекаются, отмечен угол между ними`
      : `Тот же куб: прямая ${segment(l2)} перенесена параллельно себе в ${segment(shift)}, ` +
          `отмечен угол между ${segment(l1)} и ${segment(shift)}`,
  );
}

/** Прямые в кубе задают угол только если они не параллельны. */
function differentLines(p: Params): boolean {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  const u = directionOf(l1, 1, 1, 1);
  const v = directionOf(l2, 1, 1, 1);
  const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return cross.some((x) => Math.abs(x) > 1e-9);
}

/**
 * Шаги разбора для угла в кубе: одинаковые для трёх прототипов.
 *
 * Подсказок две: скрещивающиеся прямые сначала переносят, а
 * пересекающимся переносить нечего — и говорить про перенос там
 * незачем.
 */
function cubeShagi(
  p: Params,
  answer: number,
  hintSkew: string,
  hintMeet: string,
): { text: string; value?: number }[] {
  const l1 = pair(p, 'l1');
  const l2 = pair(p, 'l2');
  const shift = peresekayutsya('cube', l1, l2) ? null : perenos('cube', l1, l2);
  return [
    {
      text:
        `Прямые ${otr(l1)} и ${otr(l2)} в кубе. Угол между прямыми не зависит ` +
        'от ребра куба.',
    },
    {
      /* Шаг из данных, а не из слов: перенос считает та же функция,
         что рисует его на чертеже разбора. */
      text:
        shift === null
          ? 'Прямые пересекаются — угол между ними виден сразу.'
          : `Перенесём ${otr(l2)} параллельно себе в ${otr(shift)}: теперь прямые ` +
            'пересекаются, и угол между ними — тот же самый.',
    },
    { text: shift === null ? hintMeet : hintSkew },
    {
      text: `Угол между ${otr(l1)} и ${otr(l2)} равен ${gradusy(answer)}.`,
      value: answer,
    },
  ];
}

/* ── P03-06. Угол между прямыми в кубе: 90° ─────────────────────── */

export const P03_06: Prototype = {
  id: 'P03-06',
  razdel: 'I',
  nazvanie: 'Угол между прямыми в кубе: 90°',
  tip: 'угол между прямыми, ответ 90°',
  zadachnik: [21, 24],
  status: 'добавить',
  format: 'целое',
  uslovie: cubeUslovie,
  dopustimo: differentLines,
  otvet: () => 90,
  poModeli: cubeAngle,
  chertezh: (p) => cubeChertezh(p, 90),
  chertezhRazbora: (p) => cubeChertezhRazbora(p, 90),
  shagi: (p) =>
    cubeShagi(
      p,
      90,
      'Перенесём одну из прямых параллельно себе так, чтобы прямые пересеклись: ' +
        'полученный угол — угол между ребром и перпендикулярной ему прямой грани.',
      'Полученный угол — угол между ребром и перпендикулярной ему прямой грани.',
    ),
  varianty: [
    variant(1, 'задачник', 'задачник 21', { l1: ['B', 'C1'], l2: ['A1', 'B1'] }),
    variant(2, 'задачник', 'задачник 22', { l1: ['C', 'D1'], l2: ['A', 'D'] }),
    variant(3, 'задачник', 'задачник 23', { l1: ['A', 'C'], l2: ['B', 'B1'] }),
    variant(4, 'задачник', 'задачник 24', { l1: ['C', 'B1'], l2: ['C1', 'D1'] }),
    variant(5, 'новый', 'новый', { l1: ['A', 'C'], l2: ['B', 'D'] }),
    variant(6, 'новый', 'новый', { l1: ['A', 'B1'], l2: ['C', 'D1'] }),
    variant(7, 'новый', 'новый', { l1: ['A', 'D1'], l2: ['C', 'B1'] }),
    variant(8, 'новый', 'новый', { l1: ['A', 'C'], l2: ['D', 'D1'] }),
    variant(9, 'новый', 'новый', { l1: ['B', 'D'], l2: ['A1', 'C1'] }),
    variant(10, 'новый', 'новый', { l1: ['A', 'D'], l2: ['A', 'B1'] }),
  ],
};

/* ── P03-07. Угол между прямыми в кубе: 45° ─────────────────────── */

export const P03_07: Prototype = {
  id: 'P03-07',
  razdel: 'I',
  nazvanie: 'Угол между прямыми в кубе: 45°',
  tip: 'угол между прямыми, ответ 45°',
  zadachnik: [25, 28],
  status: 'добавить',
  format: 'целое',
  uslovie: cubeUslovie,
  dopustimo: differentLines,
  otvet: () => 45,
  poModeli: cubeAngle,
  chertezh: (p) => cubeChertezh(p, 45),
  chertezhRazbora: (p) => cubeChertezhRazbora(p, 45),
  shagi: (p) =>
    cubeShagi(
      p,
      45,
      'Одна из прямых — диагональ грани, другая параллельна стороне этой же грани: ' +
        'диагональ квадрата делит его угол пополам.',
      'Одна из прямых — диагональ грани, другая — сторона этой же грани: ' +
        'диагональ квадрата делит его угол пополам.',
    ),
  varianty: [
    variant(1, 'задачник', 'задачник 25', { l1: ['C', 'B1'], l2: ['A', 'D'] }),
    variant(2, 'задачник', 'задачник 26', { l1: ['A', 'B1'], l2: ['C', 'D'] }),
    variant(3, 'задачник', 'задачник 27', { l1: ['B', 'D'], l2: ['A1', 'D1'] }),
    variant(4, 'задачник', 'задачник 28', { l1: ['B', 'A1'], l2: ['D1', 'C1'] }),
    variant(5, 'новый', 'новый', { l1: ['A', 'C'], l2: ['A', 'B'] }),
    variant(6, 'новый', 'новый', { l1: ['B', 'D'], l2: ['A', 'B'] }),
    variant(7, 'новый', 'новый', { l1: ['A', 'B1'], l2: ['A', 'A1'] }),
    variant(8, 'новый', 'новый', { l1: ['C', 'D1'], l2: ['D', 'D1'] }),
    variant(9, 'новый', 'новый', { l1: ['A1', 'C1'], l2: ['A1', 'B1'] }),
    variant(10, 'новый', 'новый', { l1: ['B', 'C1'], l2: ['B', 'B1'] }),
  ],
};

/* ── P03-08. Угол между прямыми в кубе: 60° ─────────────────────── */

export const P03_08: Prototype = {
  id: 'P03-08',
  razdel: 'I',
  nazvanie: 'Угол между прямыми в кубе: 60°',
  tip: 'угол между прямыми, ответ 60°',
  zadachnik: [29, 30],
  status: 'есть',
  format: 'целое',
  uslovie: cubeUslovie,
  dopustimo: differentLines,
  otvet: () => 60,
  poModeli: cubeAngle,
  chertezh: (p) => cubeChertezh(p, 60),
  chertezhRazbora: (p) => cubeChertezhRazbora(p, 60),
  shagi: (p) =>
    cubeShagi(
      p,
      60,
      'Обе прямые — диагонали граней. Перенесём одну параллельно себе: ' +
        'три диагонали граней образуют равносторонний треугольник, все его углы по 60°.',
      'Обе прямые — диагонали граней. Три диагонали граней образуют равносторонний ' +
        'треугольник, все его углы по 60°.',
    ),
  varianty: [
    variant(1, 'задачник', 'задачник 29', { l1: ['C', 'D1'], l2: ['B', 'C1'] }),
    variant(2, 'задачник', 'задачник 30', { l1: ['A', 'C'], l2: ['B', 'C1'] }),
    variant(3, 'домашка', 'домашка 5, вариант 3', { l1: ['A', 'B1'], l2: ['B', 'C1'] }, 60),
    variant(4, 'новый', 'новый', { l1: ['A', 'C'], l2: ['A', 'B1'] }),
    variant(5, 'новый', 'новый', { l1: ['A', 'C'], l2: ['A', 'D1'] }),
    variant(6, 'новый', 'новый', { l1: ['B', 'D'], l2: ['A', 'B1'] }),
    variant(7, 'новый', 'новый', { l1: ['B', 'D'], l2: ['C', 'B1'] }),
    variant(8, 'новый', 'новый', { l1: ['A', 'B1'], l2: ['A', 'D1'] }),
    variant(9, 'новый', 'новый', { l1: ['A1', 'C1'], l2: ['A', 'B1'] }),
    variant(10, 'новый', 'новый', { l1: ['B1', 'D1'], l2: ['B', 'C1'] }),
  ],
};

/* ── P03-09. Угол между диагоналями правильной призмы ───────────── */

/**
 * Высота призмы из условия «диагональ равна k рёбрам основания»:
 * подбором, пока настоящая диагональ BD₁ модели не станет равна k·a.
 */
function prismHeight(a: number, k: number): number {
  return solveBySearch(k * a, (h) => {
    const body = boxOf(a, a, h);
    return distance(vertex(body, 'B'), vertex(body, 'D1'));
  });
}

export const P03_09: Prototype = {
  id: 'P03-09',
  razdel: 'I',
  nazvanie: 'Угол между диагоналями правильной четырёхугольной призмы',
  tip: 'угол между диагоналями, ответ 60°',
  zadachnik: [31, 34],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной призме ${NAMES} известно, что ` +
    `${segment(pair(p, 'd'))}=${ru(num(p, 'k'))}${segment(pair(p, 'e'))}. ` +
    `Найдите угол между диагоналями ${segment(pair(p, 'l1'))} и ${segment(pair(p, 'l2'))}. ` +
    'Ответ дайте в градусах.',

  dopustimo: (p) => {
    const k = num(p, 'k');
    if (k * k <= 2) {
      return false;
    }
    /* Диагонали не должны лежать в одной диагональной плоскости:
       там угол прямой, а не 60°. */
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    const plane = (l: readonly [string, string]) =>
      [l[0], l[1]]
        .map((v) => v.replace(/1$/, ''))
        .sort()
        .join('');
    return plane(l1) !== plane(l2);
  },

  otvet: () => 60,

  poModeli: (p) => {
    const a = 1;
    const h = prismHeight(a, num(p, 'k'));
    const size: [number, number, number] = [a, a, h];
    return angleBetweenLines(
      modelDirection(size, pair(p, 'l1')),
      modelDirection(size, pair(p, 'l2')),
    );
  },

  chertezh: (p) => {
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    return shapeLines(
      'prism',
      `Правильная четырёхугольная призма ${NAMES}, выделены диагонали ${segment(l1)} и ${segment(l2)}`,
      [l1, l2],
    );
  },

  shagi: (p) => {
    const k = num(p, 'k');
    const l1 = segment(pair(p, 'l1'));
    const l2 = segment(pair(p, 'l2'));
    return [
      {
        text: `Пусть ребро основания равно 1. Тогда диагональ призмы равна ${ru(k)}, а её квадрат: 1² + 1² + h² = ${ru(k * k)}.`,
      },
      {
        text: `Отсюда h² = ${ru(k * k - 2)}, то есть h = √${ru(k * k - 2)}.`,
        value: Math.sqrt(k * k - 2),
      },
      {
        text: `Диагонали ${l1} и ${l2} равны и пересекаются; по теореме косинусов угол между ними равен 60°.`,
        value: 60,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 31', {
      d: ['B', 'D1'],
      e: ['A', 'D'],
      k: 2,
      l1: ['D', 'B1'],
      l2: ['C', 'A1'],
    }),
    variant(2, 'задачник', 'задачник 32', {
      d: ['B', 'D1'],
      e: ['A', 'D'],
      k: 2,
      l1: ['D', 'B1'],
      l2: ['A', 'C1'],
    }),
    variant(3, 'задачник', 'задачник 33', {
      d: ['D1', 'B'],
      e: ['A', 'B'],
      k: 2,
      l1: ['B', 'D1'],
      l2: ['C', 'A1'],
    }),
    variant(4, 'задачник', 'задачник 34', {
      d: ['D', 'B1'],
      e: ['C', 'B'],
      k: 2,
      l1: ['B', 'D1'],
      l2: ['A', 'C1'],
    }),
    variant(
      5,
      'домашка',
      'домашка 6, вариант 1',
      { d: ['A1', 'C'], e: ['A', 'D'], k: 2, l1: ['A', 'C1'], l2: ['B', 'D1'] },
      60,
    ),
    variant(
      6,
      'домашка',
      'домашка 6, вариант 2',
      { d: ['A', 'C1'], e: ['A', 'B'], k: 2, l1: ['C', 'A1'], l2: ['D', 'B1'] },
      60,
    ),
    variant(7, 'новый', 'новый', {
      d: ['C', 'A1'],
      e: ['A', 'D'],
      k: 2,
      l1: ['A', 'C1'],
      l2: ['D', 'B1'],
    }),
    variant(8, 'новый', 'новый', {
      d: ['B1', 'D'],
      e: ['B', 'C'],
      k: 2,
      l1: ['B', 'D1'],
      l2: ['A', 'C1'],
    }),
    variant(9, 'новый', 'новый', {
      d: ['A1', 'C'],
      e: ['A', 'B'],
      k: 2,
      l1: ['C', 'A1'],
      l2: ['B', 'D1'],
    }),
    variant(10, 'новый', 'новый', {
      d: ['C1', 'A'],
      e: ['C', 'D'],
      k: 2,
      l1: ['A', 'C1'],
      l2: ['D', 'B1'],
    }),
  ],
};

/* ── P03-10. Синус угла между прямыми в параллелепипеде ─────────── */

export const P03_10: Prototype = {
  id: 'P03-10',
  razdel: 'I',
  nazvanie: 'Синус угла между прямыми в параллелепипеде',
  tip: 'синус угла между прямыми по трём рёбрам',
  zadachnik: [35, 40],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В прямоугольном параллелепипеде ${NAMES} известны длины рёбер: ` +
    `AB=${ru(num(p, 'a'))}, AD=${ru(num(p, 'b'))}, AA₁=${ru(num(p, 'c'))}. ` +
    `Найдите синус угла между прямыми ${segment(pair(p, 'l1'))} и ${segment(pair(p, 'l2'))}.`,

  dopustimo: (p) => num(p, 'a') > 0 && num(p, 'b') > 0 && num(p, 'c') > 0 && differentLines(p),

  /* Формула прототипа: синус через векторное произведение
     направляющих, выписанных по правилу букв. */
  otvet: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    return sinBetweenLines(
      directionOf(pair(p, 'l1'), a, b, c),
      directionOf(pair(p, 'l2'), a, b, c),
    );
  },

  /* Проверка: те же прямые, но координаты берутся у модели движка. */
  poModeli: (p) => {
    const size: [number, number, number] = [num(p, 'a'), num(p, 'b'), num(p, 'c')];
    return sinBetweenLines(
      modelDirection(size, pair(p, 'l1')),
      modelDirection(size, pair(p, 'l2')),
    );
  },

  chertezh: (p) => {
    const l1 = pair(p, 'l1');
    const l2 = pair(p, 'l2');
    return shapeLines(
      'box',
      `Прямоугольный параллелепипед ${NAMES}, выделены прямые ${segment(l1)} и ${segment(l2)}`,
      [l1, l2],
    );
  },

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const l1 = segment(pair(p, 'l1'));
    const l2 = segment(pair(p, 'l2'));
    const sin = sinBetweenLines(
      directionOf(pair(p, 'l1'), a, b, c),
      directionOf(pair(p, 'l2'), a, b, c),
    );
    return [
      {
        text: `Перенесём одну из прямых параллельно себе так, чтобы ${l1} и ${l2} пересеклись: получится прямоугольный треугольник со сторонами из рёбер ${ru(a)}, ${ru(b)} и ${ru(c)}.`,
      },
      {
        text: 'Синус угла — отношение противолежащего катета к гипотенузе.',
      },
      {
        text: `Синус угла между ${l1} и ${l2} равен ${ru(Math.round(sin * 1000) / 1000)}.`,
        value: sin,
      },
    ];
  },

  varianty: [
    variant(1, 'задачник', 'задачник 35', {
      a: 6,
      b: 8,
      c: 21,
      l1: ['A1', 'D1'],
      l2: ['A', 'C'],
    }),
    variant(2, 'задачник', 'задачник 36', { a: 6, b: 8, c: 9, l1: ['C', 'D'], l2: ['A1', 'C1'] }),
    variant(3, 'задачник', 'задачник 37', {
      a: 28,
      b: 16,
      c: 12,
      l1: ['D', 'D1'],
      l2: ['B1', 'C'],
    }),
    variant(4, 'задачник', 'задачник 38', {
      a: 9,
      b: 12,
      c: 18,
      l1: ['A1', 'D1'],
      l2: ['A', 'C'],
    }),
    variant(5, 'задачник', 'задачник 39', { a: 9, b: 12, c: 9, l1: ['D', 'D1'], l2: ['B1', 'C'] }),
    variant(6, 'задачник', 'задачник 40', { a: 8, b: 22, c: 6, l1: ['C1', 'D'], l2: ['A', 'B'] }),
    variant(
      7,
      'домашка',
      'домашка 7, вариант 1',
      { a: 12, b: 16, c: 9, l1: ['A1', 'D1'], l2: ['A', 'C'] },
      0.6,
    ),
    variant(
      8,
      'домашка',
      'домашка 7, вариант 2',
      { a: 21, b: 3, c: 4, l1: ['D', 'D1'], l2: ['B1', 'C'] },
      0.6,
    ),
    variant(
      9,
      'домашка',
      'домашка 7, вариант 3',
      { a: 6, b: 8, c: 5, l1: ['C', 'D'], l2: ['A1', 'C1'] },
      0.8,
    ),
    variant(
      10,
      'домашка',
      'домашка 7, вариант 4',
      { a: 12, b: 16, c: 13, l1: ['A1', 'D1'], l2: ['A', 'C'] },
      0.6,
    ),
  ],
};
