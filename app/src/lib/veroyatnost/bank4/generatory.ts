/**
 * Генераторы вариантов для прототипов задания №4.
 *
 * Каждый генератор отдаёт один случайный набор параметров в пределах
 * сюжета прототипа; допустимость чисел проверяет `dopustimo` самого
 * прототипа, отбор и воспроизводимость — `prototip()` из generator.ts.
 * Имена, страны, предметы и темы — из тех же списков, что в
 * задачнике, с небольшими добавлениями в том же духе.
 */

import type { Rng } from '../generator';
import type { Params } from '../types';

const IMENA_M = [
  'Дима',
  'Марат',
  'Петя',
  'Денис',
  'Лёня',
  'Максим',
  'Серёжа',
  'Саша',
  'Женя',
  'Толя',
  'Федя',
  'Миша',
  'Олег',
  'Артём',
  'Кирилл',
  'Ваня',
  'Коля',
  'Слава',
];
const IMENA_ZH = [
  'Надя',
  'Света',
  'Тоня',
  'Арина',
  'Маша',
  'Ира',
  'Соня',
  'Ксюша',
  'Настя',
  'Галя',
  'Оля',
  'Зина',
  'Лена',
  'Катя',
  'Юля',
  'Вера',
];
const STRANY = [
  'Эстонии',
  'Латвии',
  'Литвы',
  'Польши',
  'Великобритании',
  'Франции',
  'Германии',
  'Италии',
  'Аргентины',
  'Бразилии',
  'Парагвая',
  'Уругвая',
  'Греции',
  'Болгарии',
  'Румынии',
  'Венгрии',
  'Дании',
  'Сербии',
  'Швейцарии',
  'Голландии',
  'Австрии',
  'Швеции',
  'Норвегии',
  'Испании',
  'Португалии',
  'Чехии',
  'Финляндии',
];
const BILETY: readonly [string, string][] = [
  ['математике', 'Логарифмы'],
  ['истории', 'Смутное время'],
  ['химии', 'Кислоты'],
  ['математике', 'Неравенства'],
  ['географии', 'Страны Африки'],
  ['истории', 'Великая Отечественная война'],
  ['географии', 'Ресурсообеспеченность'],
  ['биологии', 'Клетка'],
  ['физике', 'Оптика'],
  ['литературе', 'Серебряный век'],
];
const OLIMPIADY = [
  'математике',
  'обществознанию',
  'русскому языку',
  'химии',
  'физике',
  'биологии',
  'истории',
  'информатике',
];
const VIDY = ['бадминтону', 'настольному теннису', 'шахматам', 'шашкам', 'теннису', 'волейболу'];
const FAMILII = [
  'Игорь Чаев',
  'Денис Полянкин',
  'Дмитрий Тоснин',
  'Андрей Фомин',
  'Павел Круглов',
  'Сергей Лапин',
  'Артём Зверев',
  'Максим Орлов',
  'Никита Белов',
  'Илья Громов',
];
const KOMANDY = [
  'Изумруд',
  'Геолог',
  'Биолог',
  'Физик',
  'Сапфир',
  'Труд',
  'Спартак',
  'Ротор',
  'Вымпел',
  'Метеор',
];
const INITSIALY = ['В.', 'Д.', 'Н.', 'К.', 'М.', 'П.', 'С.', 'Ж.'];

/** Один из четырёх вопросов жребия: мальчик, девочка, не такой-то. */
function zhrebiy(r: Rng): Params {
  const nb = r.int(1, 4);
  const ng = r.int(1, 4);
  const malchiki = r.sample(IMENA_M, nb);
  const devochki = r.sample(IMENA_ZH, ng);
  const imena = r.sample([...malchiki, ...devochki], nb + ng);
  const vid = r.int(1, 4);
  if (vid === 1) {
    return {
      imena: imena.join(', '),
      blag: malchiki.join(', '),
      vopros: 'начинать игру должен будет мальчик',
    };
  }
  if (vid === 2) {
    return {
      imena: imena.join(', '),
      blag: devochki.join(', '),
      vopros: 'начинать игру должна будет девочка',
    };
  }
  const kto = vid === 3 ? r.pick(devochki) : r.pick(malchiki);
  return {
    imena: imena.join(', '),
    blag: imena.filter((i) => i !== kto).join(', '),
    vopros: `начинать игру ${vid === 3 ? 'должна' : 'должен'} будет не ${kto}`,
  };
}

const GENERATORY: Record<string, (r: Rng) => Params> = {
  'p4-01': (r) => {
    const k = r.int(2, 25);
    return { N: k * r.int(2, 12), k, kto: r.pick(INITSIALY) };
  },
  'p4-02': (r) => {
    const N = r.int(5, 20);
    return { N, k: r.int(2, Math.min(10, N - 1)), kto: r.pick(INITSIALY) };
  },
  'p4-03': (r) => {
    const [strA, strB] = r.sample(STRANY, 2) as [string, string];
    const N = r.int(20, 75);
    return {
      N,
      a: r.int(2, 15),
      b: r.int(2, 15),
      m: r.int(1, N),
      ischem: r.pick(['a', 'b']),
      strA,
      strB,
    };
  },
  'p4-04': zhrebiy,
  'p4-05': (r) => {
    const a = r.int(1, 12);
    const d = r.pick([3, 6, 9]);
    return { a, b: ((a + d - 1) % 12) + 1 };
  },
  'p4-06': (r) => {
    const [s1, s2, s3, s4] = r.sample(STRANY, 4) as [string, string, string, string];
    return {
      k1: r.int(2, 9),
      s1,
      k2: r.int(2, 9),
      s2,
      k3: r.int(2, 9),
      s3,
      k4: r.int(2, 9),
      s4,
      ischem: r.int(1, 4),
      poryadok: r.pick(['первым', 'последним']),
    };
  },
  'p4-07': (r) => {
    const [s1, s2, s3] = r.sample(STRANY, 3) as [string, string, string];
    const k1 = r.int(2, 7);
    const k2 = r.int(2, 7);
    const k3 = r.int(2, 7);
    return { k1, s1, k2, s2, k3, s3, ischem: r.int(1, 3), m: r.int(1, k1 + k2 + k3) };
  },
  'p4-08': (r) => {
    const [predmet, tema] = r.pick(BILETY);
    const N = r.pick([15, 20, 25, 30, 40, 45, 48, 50, 60]);
    return { N, k: r.int(1, N - 1), predmet, tema, ne: r.int(0, 1) };
  },
  'p4-09': (r) => {
    const N = r.int(40, 80);
    return { N, k: r.int(5, N - 5) };
  },
  'p4-10': (r) => {
    const [sA, sB, sC] = r.sample(STRANY, 3) as [string, string, string];
    const N = r.int(25, 70);
    return { N, a: r.int(4, Math.floor(N / 2)), sA, b: r.int(4, Math.floor(N / 2)), sB, sC };
  },
  'p4-11': (r) => {
    const d = r.int(3, 5);
    const m = r.pick([0, d - 2]);
    const k = r.int(5, 30);
    const ostatok = r.int(5, 30);
    return {
      d,
      N: m === 0 ? d * ostatok : m * k + 2 * ostatok,
      m,
      k: m === 0 ? 0 : k,
      prof: r.pick(['М.', 'К.', 'Н.', 'С.']),
    };
  },
  'p4-12': (r) => {
    const m = r.int(3, 7);
    const k = r.int(5, 15) * 10;
    return { N: (m - 1) * k + r.int(20, 150), m, k, predmet: r.pick(OLIMPIADY) };
  },
  'p4-13': (r) => {
    const d = r.int(3, 6);
    const k = r.int(8, 30);
    return {
      d,
      N: k + (d - 1) * r.int(5, 30),
      k,
      den: r.int(2, d),
      strana: r.pick(['России', 'Франции', 'Италии', 'Испании', 'Германии', 'Польши']),
    };
  },
  'p4-14': (r) => {
    const N = 2 * r.int(13, 38);
    return { N, r: r.int(2, N), vid: r.pick(VIDY), imya: r.pick(FAMILII) };
  },
  'p4-15': (r) => {
    const g = r.int(2, 7);
    const N = g * r.int(2, 17);
    const devochki = r.int(0, 1) === 1;
    const [a, b] = r.sample(devochki ? IMENA_ZH : IMENA_M, 2) as [string, string];
    const [gde, kogo1, kogo2] = r.pick<[string, string, string]>([
      ['В классе', 'учащийся', 'учащихся'],
      ['В классе', 'семиклассник', 'семиклассников'],
      ['В школе', 'пятиклассник', 'пятиклассников'],
    ]);
    return {
      gde,
      kogo1,
      kogo2,
      N,
      g,
      a,
      b,
      para: r.pick(devochki ? ['две подруги', ''] : ['два друга', 'два близнеца', '']),
      vmeste: r.int(0, 1),
    };
  },
  'p4-16': (r) => {
    const n = r.int(2, 4);
    return {
      n,
      storona: r.pick(['орёл', 'решка']),
      rezhim: r.pick(['ni-razu', 'vse', 'bolshe', 'rovno']),
      k: r.int(1, n),
    };
  },
  'p4-17': (r) => {
    const n = r.pick([2, 3]);
    return {
      n,
      komanda: r.pick(KOMANDY),
      rezhim: r.pick(['vse', 'rovno', 'ne-bolee']),
      k: r.int(1, n),
    };
  },
  'p4-18': (r) => ({ s: r.int(2, 12), znakov: r.pick([2, 3]) }),
  'p4-19': (r) => {
    const N = r.int(5, 20) * 100;
    return { N, k: r.int(1, N / 10) };
  },
  'p4-20': (r) => {
    const N = r.int(50, 300);
    return { N, k: r.int(1, Math.floor(N / 5)), znakov: r.pick([0, 2]) };
  },
  'p4-21': (r) => ({ q: r.int(50, 200), d: r.int(1, 20) }),
};

/** Генератор прототипа по идентификатору; нет — ошибка сборки. */
export function gen(id: string): (r: Rng) => Params {
  const g = GENERATORY[id];
  if (g === undefined) {
    throw new Error(`Нет генератора для ${id}`);
  }
  return g;
}
