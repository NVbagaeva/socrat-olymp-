/**
 * Задание №4, блок III: координатная прямая — геометрическая
 * вероятность на отрезке.
 *
 * Величина равномерно распределена на отрезке [a; b]; вероятность
 * попасть в промежуток равна отношению длин. В задачнике этого блока
 * нет: задачи составлены заново по схеме, утверждённой автором вместе
 * с рисунком карточки (первый вариант — задача с макета). Два
 * прототипа: промежуток с двумя границами, строгими или нестрогими,
 * и промежуток с одной границей, упирающийся в край отрезка.
 *
 * Вторая проверка — не та же формула, а перебор: отрезок делится на
 * клетки шага 10⁻ᵏ, где k такое, что все границы попадают в узлы
 * сетки, и клетки считаются по одной. У каждого варианта есть
 * `pryamaya`: по ней карточка рисует чертёж из тех же чисел.
 */

import type { Vizual } from '../model';
import type { Pryamaya } from '../pryamaya';
import { dec, konechnaya, num, text, type Params, type Prototype } from '../types';

/**
 * Рисунок метода «Координатная прямая» для карточки: отрезок [a; b]
 * и промежуток [c; d] с границами по строгости неравенств. Край
 * отрезка, в который упирается промежуток, — нестрогая граница.
 * Единица измерения на ось не идёт: «граммов» после каждого числа
 * загромождает подписи, она и так есть в условии.
 */
function otrezokVizual(a: number, b: number, c: number, d: number, nestrogo: boolean): Vizual {
  const granica = nestrogo ? 'inclusive' : 'strict';
  return {
    parametry: {
      method: 'coordinate-line',
      shape: 'segment',
      min: a,
      max: b,
      c,
      d,
      leftBoundary: c === a ? 'inclusive' : granica,
      rightBoundary: d === b ? 'inclusive' : granica,
    },
    podsvetka: { method: 'coordinate-line' },
  };
}

const PRIZNAKI = [
  'величина равномерно распределена на отрезке — исходов бесконечно много',
  'спрашивают про попадание в промежуток',
  'вероятность — отношение длины промежутка к длине отрезка',
];

const BLOK = 'pryamaya';

/** Без округления: ответ обязан быть конечной десятичной дробью. */
const tochno = (): null => null;

/** Число в TeX: запятая без пробела после неё. */
function tex(value: number): string {
  return dec(value).replace(',', '{,}');
}

/** Отрезок в тексте условия: «[5,9; 6,1]». */
function otrezok(a: number, b: number): string {
  return `[${dec(a)}; ${dec(b)}]`;
}

/**
 * Перебор клеток. Все границы умножаются на 10ᵏ до целых, отрезок
 * [A; B] режется на единичные клетки, и считается, сколько из них
 * лежат в [C; D]. Для равномерного распределения это и есть доля
 * благоприятных исходов, посчитанная штуками, а не вычитанием.
 */
function kletki(a: number, b: number, c: number, d: number): number {
  let k = 0;
  const celoe = (v: number): boolean => Math.abs(v - Math.round(v)) < 1e-9;
  while (k < 6 && ![a, b, c, d].every((v) => celoe(v * 10 ** k))) {
    k += 1;
  }
  const m = 10 ** k;
  const A = Math.round(a * m);
  const B = Math.round(b * m);
  const C = Math.round(c * m);
  const D = Math.round(d * m);
  let podhodit = 0;
  for (let i = A; i < B; i += 1) {
    if (i >= C && i + 1 <= D) {
      podhodit += 1;
    }
  }
  return podhodit / (B - A);
}

/* ── 1. Промежуток с двумя границами ─────────────────────────────── */

const P22: Prototype = {
  id: 'p4-22',
  blok: BLOK,
  nazvanie: 'Отрезок: промежуток внутри',
  tip: 'Отношение длины промежутка к длине отрезка',
  zadachnik: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const d = num(p, 'd');
    const ed = text(p, 'ed');
    const usl =
      text(p, 'granicy') === 'нестрогие'
        ? `не меньше ${dec(c)} ${ed} и не больше ${dec(d)} ${ed}`
        : `больше ${dec(c)} ${ed}, но меньше ${dec(d)} ${ed}`;
    return `В случайном эксперименте ${text(p, 'vstuplenie')}. Известно, что ${text(p, 'izvestno')} равномерно ${text(p, 'raspredelena')} на отрезке ${otrezok(a, b)} ${ed}. Найдите вероятность того, что ${text(p, 'chego')} ${usl}.`;
  },
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const d = num(p, 'd');
    return a < c && c < d && d < b && konechnaya((d - c) / (b - a));
  },
  otvet: (p) => (num(p, 'd') - num(p, 'c')) / (num(p, 'b') - num(p, 'a')),
  perebor: (p) => kletki(num(p, 'a'), num(p, 'b'), num(p, 'c'), num(p, 'd')),
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const c = num(p, 'c');
    const d = num(p, 'd');
    const n = b - a;
    const m = d - c;
    return [
      {
        text: 'Все исходы — длина отрезка распределения:',
        formula: `n = ${tex(b)} - ${tex(a)} = ${tex(n)}`,
        value: n,
      },
      {
        text: `Благоприятные исходы — ${text(p, 'chego')} от ${dec(c)} до ${dec(d)} ${text(p, 'ed')}:`,
        formula: `m = ${tex(d)} - ${tex(c)} = ${tex(m)}`,
        value: m,
      },
      {
        text: 'Вероятность:',
        formula: `P = \\dfrac{m}{n} = \\dfrac{${tex(m)}}{${tex(n)}} = ${tex(m / n)}`,
        value: m / n,
      },
    ];
  },
  pryamaya: (p): Pryamaya => ({
    a: num(p, 'a'),
    b: num(p, 'b'),
    c: num(p, 'c'),
    d: num(p, 'd'),
    nestrogo: text(p, 'granicy') === 'нестрогие',
  }),
  metodika: {
    metod: 'coordinate-line',
    methodHints: PRIZNAKI,
    fraza: () =>
      'координатная прямая — величина равномерна на отрезке, вероятность равна отношению длины промежутка к длине отрезка.',
    vizual: (p) =>
      otrezokVizual(
        num(p, 'a'),
        num(p, 'b'),
        num(p, 'c'),
        num(p, 'd'),
        text(p, 'granicy') === 'нестрогие',
      ),
  },
  varianty: [
    {
      n: 1,
      source: 'новый',
      ref: 'макет карточки',
      params: {
        vstuplenie: 'из печи вынимают один хлеб',
        izvestno: 'масса хлеба',
        raspredelena: 'распределена',
        chego: 'масса выбранного хлеба',
        ed: 'граммов',
        a: 600,
        b: 1000,
        c: 700,
        d: 900,
        granicy: 'строгие',
      },
    },
    {
      n: 2,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с конвейера берут одну пачку сахара',
        izvestno: 'масса пачки',
        raspredelena: 'распределена',
        chego: 'масса выбранной пачки',
        ed: 'граммов',
        a: 980,
        b: 1020,
        c: 995,
        d: 1010,
        granicy: 'строгие',
      },
    },
    {
      n: 3,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на рынке покупают одну дыню',
        izvestno: 'масса дыни',
        raspredelena: 'распределена',
        chego: 'масса купленной дыни',
        ed: 'килограммов',
        a: 2,
        b: 6,
        c: 3,
        d: 4,
        granicy: 'строгие',
      },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с конвейера снимают одну деталь',
        izvestno: 'длина детали',
        raspredelena: 'распределена',
        chego: 'длина снятой детали',
        ed: 'миллиметров',
        a: 40,
        b: 50,
        c: 42,
        d: 46,
        granicy: 'нестрогие',
      },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'пассажир приходит на остановку автобуса, который ходит каждые 20 минут',
        izvestno: 'время ожидания',
        raspredelena: 'распределено',
        chego: 'время ожидания',
        ed: 'минут',
        a: 0,
        b: 20,
        c: 5,
        d: 12,
        granicy: 'нестрогие',
      },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'из ящика берут одну лампочку',
        izvestno: 'срок службы лампочки',
        raspredelena: 'распределён',
        chego: 'срок службы выбранной лампочки',
        ed: 'часов',
        a: 800,
        b: 1200,
        c: 850,
        d: 1150,
        granicy: 'строгие',
      },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'из бака разливают воду по бутылкам и берут одну из них',
        izvestno: 'объём воды в бутылке',
        raspredelena: 'распределён',
        chego: 'объём воды в выбранной бутылке',
        ed: 'миллилитров',
        a: 480,
        b: 520,
        c: 484,
        d: 500,
        granicy: 'нестрогие',
      },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на складе взвешивают один мешок муки',
        izvestno: 'масса мешка',
        raspredelena: 'распределена',
        chego: 'масса взвешенного мешка',
        ed: 'килограммов',
        a: 48,
        b: 52,
        c: 49,
        d: 51.5,
        granicy: 'строгие',
      },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на стройку привозят одну доску',
        izvestno: 'длина доски',
        raspredelena: 'распределена',
        chego: 'длина привезённой доски',
        ed: 'метров',
        a: 5.9,
        b: 6.1,
        c: 5.92,
        d: 6.06,
        granicy: 'нестрогие',
      },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с плантации срывают один апельсин',
        izvestno: 'масса апельсина',
        raspredelena: 'распределена',
        chego: 'масса сорванного апельсина',
        ed: 'граммов',
        a: 150,
        b: 250,
        c: 175,
        d: 235,
        granicy: 'строгие',
      },
    },
  ],
};

/* ── 2. Промежуток с одной границей ──────────────────────────────── */

/** Какая граница задана: нижняя (x > c) или верхняя (x < d). */
type Storona = 'nizhnyaya' | 'verhnyaya';

function storona(p: Params): Storona {
  return text(p, 'storona') === 'верхняя' ? 'verhnyaya' : 'nizhnyaya';
}

/** Границы благоприятного промежутка с подставленным краем отрезка. */
function granicy(p: Params): { c: number; d: number } {
  const g = num(p, 'g');
  return storona(p) === 'nizhnyaya' ? { c: g, d: num(p, 'b') } : { c: num(p, 'a'), d: g };
}

const P23: Prototype = {
  id: 'p4-23',
  blok: BLOK,
  nazvanie: 'Отрезок: промежуток до края',
  tip: 'Одна граница; промежуток упирается в край отрезка',
  zadachnik: [0, 0],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const g = num(p, 'g');
    const ed = text(p, 'ed');
    const nestrogo = text(p, 'granicy') === 'нестрогие';
    const usl =
      storona(p) === 'nizhnyaya'
        ? `${nestrogo ? 'не меньше' : 'больше'} ${dec(g)} ${ed}`
        : `${nestrogo ? 'не больше' : 'меньше'} ${dec(g)} ${ed}`;
    return `В случайном эксперименте ${text(p, 'vstuplenie')}. Известно, что ${text(p, 'izvestno')} равномерно ${text(p, 'raspredelena')} на отрезке ${otrezok(num(p, 'a'), num(p, 'b'))} ${ed}. Найдите вероятность того, что ${text(p, 'chego')} ${usl}.`;
  },
  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const g = num(p, 'g');
    return a < g && g < b && konechnaya((granicy(p).d - granicy(p).c) / (b - a));
  },
  otvet: (p) => (granicy(p).d - granicy(p).c) / (num(p, 'b') - num(p, 'a')),
  perebor: (p) => kletki(num(p, 'a'), num(p, 'b'), granicy(p).c, granicy(p).d),
  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const { c, d } = granicy(p);
    const n = b - a;
    const m = d - c;
    const kray = storona(p) === 'nizhnyaya' ? 'до конца отрезка' : 'от начала отрезка';
    return [
      {
        text: 'Все исходы — длина отрезка распределения:',
        formula: `n = ${tex(b)} - ${tex(a)} = ${tex(n)}`,
        value: n,
      },
      {
        text:
          storona(p) === 'nizhnyaya'
            ? `Благоприятные исходы — от ${dec(c)} ${text(p, 'ed')} ${kray}:`
            : `Благоприятные исходы — ${kray} до ${dec(d)} ${text(p, 'ed')}:`,
        formula: `m = ${tex(d)} - ${tex(c)} = ${tex(m)}`,
        value: m,
      },
      {
        text: 'Вероятность:',
        formula: `P = \\dfrac{m}{n} = \\dfrac{${tex(m)}}{${tex(n)}} = ${tex(m / n)}`,
        value: m / n,
      },
    ];
  },
  pryamaya: (p): Pryamaya => ({
    a: num(p, 'a'),
    b: num(p, 'b'),
    ...(storona(p) === 'nizhnyaya' ? { c: num(p, 'g') } : { d: num(p, 'g') }),
    nestrogo: text(p, 'granicy') === 'нестрогие',
  }),
  metodika: {
    metod: 'coordinate-line',
    methodHints: PRIZNAKI,
    fraza: () =>
      'координатная прямая — величина равномерна на отрезке, промежуток упирается в его край: отношение длин.',
    vizual: (p) =>
      otrezokVizual(
        num(p, 'a'),
        num(p, 'b'),
        granicy(p).c,
        granicy(p).d,
        text(p, 'granicy') === 'нестрогие',
      ),
  },
  varianty: [
    {
      n: 1,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с дерева снимают одно яблоко',
        izvestno: 'масса яблока',
        raspredelena: 'распределена',
        chego: 'масса снятого яблока',
        ed: 'граммов',
        a: 120,
        b: 240,
        g: 210,
        storona: 'нижняя',
        granicy: 'строгие',
      },
    },
    {
      n: 2,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'из печи вынимают один хлеб',
        izvestno: 'масса хлеба',
        raspredelena: 'распределена',
        chego: 'масса выбранного хлеба',
        ed: 'граммов',
        a: 600,
        b: 1000,
        g: 750,
        storona: 'верхняя',
        granicy: 'строгие',
      },
    },
    {
      n: 3,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с конвейера снимают одну деталь',
        izvestno: 'длина детали',
        raspredelena: 'распределена',
        chego: 'длина снятой детали',
        ed: 'миллиметров',
        a: 40,
        b: 50,
        g: 43,
        storona: 'верхняя',
        granicy: 'нестрогие',
      },
    },
    {
      n: 4,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'пассажир приходит на остановку автобуса, который ходит каждые 20 минут',
        izvestno: 'время ожидания',
        raspredelena: 'распределено',
        chego: 'время ожидания',
        ed: 'минут',
        a: 0,
        b: 20,
        g: 16,
        storona: 'нижняя',
        granicy: 'строгие',
      },
    },
    {
      n: 5,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'из ящика берут одну лампочку',
        izvestno: 'срок службы лампочки',
        raspredelena: 'распределён',
        chego: 'срок службы выбранной лампочки',
        ed: 'часов',
        a: 800,
        b: 1200,
        g: 1150,
        storona: 'нижняя',
        granicy: 'нестрогие',
      },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'из бака разливают воду по бутылкам и берут одну из них',
        izvestno: 'объём воды в бутылке',
        raspredelena: 'распределён',
        chego: 'объём воды в выбранной бутылке',
        ed: 'миллилитров',
        a: 480,
        b: 520,
        g: 484,
        storona: 'верхняя',
        granicy: 'строгие',
      },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на складе взвешивают один мешок муки',
        izvestno: 'масса мешка',
        raspredelena: 'распределена',
        chego: 'масса взвешенного мешка',
        ed: 'килограммов',
        a: 48,
        b: 52,
        g: 50.2,
        storona: 'нижняя',
        granicy: 'строгие',
      },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на стройку привозят одну доску',
        izvestno: 'длина доски',
        raspredelena: 'распределена',
        chego: 'длина привезённой доски',
        ed: 'метров',
        a: 5.9,
        b: 6.1,
        g: 5.93,
        storona: 'верхняя',
        granicy: 'строгие',
      },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'с плантации срывают один апельсин',
        izvestno: 'масса апельсина',
        raspredelena: 'распределена',
        chego: 'масса сорванного апельсина',
        ed: 'граммов',
        a: 150,
        b: 250,
        g: 190,
        storona: 'нижняя',
        granicy: 'нестрогие',
      },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: {
        vstuplenie: 'на рынке покупают одну дыню',
        izvestno: 'масса дыни',
        raspredelena: 'распределена',
        chego: 'масса купленной дыни',
        ed: 'килограммов',
        a: 2,
        b: 6,
        g: 5,
        storona: 'верхняя',
        granicy: 'строгие',
      },
    },
  ],
};

export const PRYAMAYA: readonly Prototype[] = [P22, P23];
