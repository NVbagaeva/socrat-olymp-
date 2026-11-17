/**
 * Деревья опорных задач №5 блока «Ветви исходов: рисуем дерево»
 * (podgotovka5.ts): метод и рисунок к задаче. Из рисунка экран задачи
 * растит дерево в подсказке-вопросах (components/tasks/veroyatnost/
 * trening/shagi45.tsx, DerevoPodskazki) и показывает его после ответа
 * с подсвеченными путями.
 *
 * Числа — из условия задачи. Автотест (selftest.ts, risunokVret)
 * складывает произведения подсвеченных путей и сверяет с ответом.
 *
 * Подмешиваются там, где задачи уходят на экран и в автотест (pool.ts,
 * selftest.ts, sDerevom): сами задачи (podgotovka5.ts — содержание
 * раздела, его сторожит check-redesign) не меняются, дерево — подача.
 *
 * Задачи k5-47 (яйца двух хозяйств) здесь нет: доля хозяйства в ней
 * неизвестна и находится из уравнения, а не обходом дерева.
 */

import { derevo, type Vetv } from './bank5/vizual5';
import type { Metodika, PrepZadacha } from './types';

const FRAZA_GRUPPY =
  'дерево вероятностей — случаи делятся на группы, событие подходит по нескольким путям: умножаем вдоль каждого и складываем.';

const PRIZNAKI_GRUPPY = [
  'случаи делятся на группы, в каждой своя вероятность события',
  'спрашивают вероятность события «вообще», без условия о группе',
] as const;

/** Две группы, в каждой событие и его противоположность. */
function dveGruppy(
  urovni: readonly [string, string],
  grupy: readonly [[string, number], [string, number]],
  sobytie: readonly [string, string],
  q: readonly [number, number],
): Metodika {
  const [[g1, a], [g2, b]] = grupy;
  const [s1, s2] = sobytie;
  const branches: Vetv[] = [
    { id: 'g1', parent: null, label: g1, p: a },
    { id: 'g2', parent: null, label: g2, p: b },
    { id: 'g1s', parent: 'g1', label: s1, p: q[0] },
    { id: 'g1n', parent: 'g1', label: s2, p: Math.round((1 - q[0]) * 1e9) / 1e9 },
    { id: 'g2s', parent: 'g2', label: s1, p: q[1] },
    { id: 'g2n', parent: 'g2', label: s2, p: Math.round((1 - q[1]) * 1e9) / 1e9 },
  ];
  return {
    metod: 'probability-tree',
    methodHints: PRIZNAKI_GRUPPY,
    fraza: () => FRAZA_GRUPPY,
    vizual: () => derevo([...urovni], branches, ['g1s', 'g2s']),
  };
}

/** Три рабочих: три группы, в каждой брак и годная. */
const RABOCHIE: Metodika = {
  metod: 'probability-tree',
  methodHints: PRIZNAKI_GRUPPY,
  fraza: () => FRAZA_GRUPPY,
  vizual: () =>
    derevo(
      ['рабочий', 'деталь'],
      [
        { id: 'r1', parent: null, label: '1-й', p: 0.5 },
        { id: 'r2', parent: null, label: '2-й', p: 0.3 },
        { id: 'r3', parent: null, label: '3-й', p: 0.2 },
        { id: 'r1b', parent: 'r1', label: 'брак', p: 0.01 },
        { id: 'r1g', parent: 'r1', label: 'годная', p: 0.99 },
        { id: 'r2b', parent: 'r2', label: 'брак', p: 0.02 },
        { id: 'r2g', parent: 'r2', label: 'годная', p: 0.98 },
        { id: 'r3b', parent: 'r3', label: 'брак', p: 0.05 },
        { id: 'r3g', parent: 'r3', label: 'годная', p: 0.95 },
      ],
      ['r1b', 'r2b', 'r3b'],
    ),
};

/** Футбол: две игры, в каждой победа, ничья или поражение. */
const FUTBOL: Metodika = {
  metod: 'probability-tree',
  methodHints: [
    'в каждой игре три исхода: победа, ничья, поражение',
    'подходящих путей несколько: умножаем вдоль каждого и складываем',
  ],
  fraza: () =>
    'дерево вероятностей — две игры по три исхода; подходят пути, где набрано не меньше 4 очков.',
  vizual: () => {
    const ishody: readonly [string, string, number][] = [
      ['v', 'победа', 0.4],
      ['n', 'ничья', 0.2],
      ['p', 'поражение', 0.4],
    ];
    const branches: Vetv[] = [];
    for (const [id1, label1, p1] of ishody) {
      branches.push({ id: id1, parent: null, label: label1, p: p1 });
    }
    for (const [id1] of ishody) {
      for (const [id2, label2, p2] of ishody) {
        branches.push({ id: id1 + id2, parent: id1, label: label2, p: p2 });
      }
    }
    return derevo(['1-я игра', '2-я игра'], branches, ['vv', 'vn', 'nv']);
  },
};

/** Волшебная страна: три перехода погоды, смена — с вероятностью 0,2. */
const POGODA: Metodika = {
  metod: 'probability-tree',
  methodHints: [
    'погода переходит изо дня в день: каждый день новое разветвление',
    'подходят пути, где 6 июля погода отличная',
  ],
  fraza: () =>
    'дерево вероятностей — три перехода погоды; подходят пути, которые кончаются отличной погодой.',
  vizual: () => {
    /* Сегодня погода хорошая. «х» — хорошая, «о» — отличная. */
    const branches: Vetv[] = [];
    let uroven: { id: string; pogoda: 'х' | 'о' }[] = [{ id: '', pogoda: 'х' }];
    for (let den = 0; den < 3; den += 1) {
      const sleduyushchiy: { id: string; pogoda: 'х' | 'о' }[] = [];
      for (const uzel of uroven) {
        for (const pogoda of ['х', 'о'] as const) {
          const id = uzel.id + pogoda;
          branches.push({
            id,
            parent: uzel.id === '' ? null : uzel.id,
            label: pogoda === 'х' ? 'хорошая' : 'отличная',
            p: pogoda === uzel.pogoda ? 0.8 : 0.2,
          });
          sleduyushchiy.push({ id, pogoda });
        }
      }
      uroven = sleduyushchiy;
    }
    const podhodyat = uroven.filter((u) => u.pogoda === 'о').map((u) => u.id);
    return derevo(['4 июля', '5 июля', '6 июля'], branches, podhodyat);
  },
};

export const DEREVYA_OPORNYH_5: Readonly<Record<string, Metodika>> = {
  'k5-dr-1': dveGruppy(
    ['транспорт', 'в школу'],
    [
      ['автобус', 0.6],
      ['трамвай', 0.4],
    ],
    ['опоздал', 'вовремя'],
    [0.1, 0.05],
  ),
  'k5-44': dveGruppy(
    ['фабрика', 'стекло'],
    [
      ['1-я фабрика', 0.6],
      ['2-я фабрика', 0.4],
    ],
    ['брак', 'годное'],
    [0.03, 0.01],
  ),
  'k5-dr-2': dveGruppy(
    ['режим', 'уборка'],
    [
      ['обычный', 0.8],
      ['турбо', 0.2],
    ],
    ['застрял', 'не застрял'],
    [0.1, 0.25],
  ),
  'k5-46': dveGruppy(
    ['экономика', 'кредит'],
    [
      ['кризис', 0.45],
      ['рост', 0.55],
    ],
    ['не вернёт', 'вернёт'],
    [0.2, 0.04],
  ),
  'k5-45': dveGruppy(
    ['погода', 'лекция'],
    [
      ['солнце', 0.25],
      ['пасмурно', 0.75],
    ],
    ['пришёл', 'проспал'],
    [0.7, 0.2],
  ),
  'k5-dr-3': RABOCHIE,
  'k5-50': dveGruppy(
    ['пациент', 'анализ'],
    [
      ['болен', 0.05],
      ['здоров', 0.95],
    ],
    ['положительный', 'отрицательный'],
    [0.9, 0.01],
  ),
  'k5-48': FUTBOL,
  'k5-49': POGODA,
};

/** Опорная задача с деревом, если оно у неё есть; иначе — как есть. */
export function sDerevom(zadacha: PrepZadacha): PrepZadacha {
  const metodika = DEREVYA_OPORNYH_5[zadacha.id];
  return metodika === undefined || zadacha.metodika !== undefined
    ? zadacha
    : { ...zadacha, metodika };
}
