/**
 * Задание №5, прототипы на произведение вероятностей и на схемы.
 *
 * Задачи 29–58 задачника Е. А. Ширяевой «ЕГЭпроф 2025». Семь
 * прототипов: два на умножение независимых событий, по одному на
 * «хотя бы один раз», схему без возвращения, перебор исходов,
 * формулу полной вероятности и испытания Бернулли.
 *
 * Схема без возвращения стоит отдельным блоком намеренно: задачу с
 * фломастерами массово решают как произведение независимых событий и
 * получают неверный ответ — после первого фломастера в коробке их
 * становится на один меньше.
 *
 * Ограничения на числа здесь тоже не косметические. У футбольной
 * команды вероятность ничьей равна 1 − 2p, поэтому p не может
 * превышать 0,5. У фломастеров ответ обязан быть конечной дробью, и
 * это сильно сужает набор допустимых составов коробки. У стрелка
 * порог не должен попадать ровно на границу, иначе ответ «наименьшее
 * количество патронов» становится спорным.
 */

import { skl, tvoritelnoe } from '../morfologia';
import { dec, konechnaya, num, type Prototype } from '../types';

/* ── Общее ───────────────────────────────────────────────────────── */

const tochno = (): null => null;

function tochnee(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * Перебор независимых испытаний: все 2ⁿ исходов с их вероятностями.
 * Это второй способ счёта — не формула, а сумма по дереву.
 */
function derevo(n: number, p: number, podhodit: (uspehi: readonly boolean[]) => boolean): number {
  let itog = 0;
  for (let mask = 0; mask < 2 ** n; mask += 1) {
    const uspehi: boolean[] = [];
    let veroyatnost = 1;
    for (let bit = 0; bit < n; bit += 1) {
      const uspeh = (mask >> bit) % 2 === 1;
      uspehi.push(uspeh);
      veroyatnost *= uspeh ? p : 1 - p;
    }
    if (podhodit(uspehi)) {
      itog += veroyatnost;
    }
  }
  return tochnee(itog);
}

/* ── 9. Шахматист: две партии ────────────────────────────────────── */

const P09: Prototype = {
  id: 'p5-09',
  blok: 'umnozhenie',
  nazvanie: 'Шахматист: выиграет обе партии',
  tip: 'Умножение вероятностей независимых событий',
  zadachnik: [29, 32],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Если шахматист А. играет белыми фигурами, то он выигрывает у шахматиста Б. с вероятностью ${dec(num(p, 'belye'))}. Если А. играет чёрными, то А. выигрывает у Б. с вероятностью ${dec(num(p, 'chernye'))}. Шахматисты А. и Б. играют две партии, причём во второй партии меняют цвет фигур. Найдите вероятность того, что А. выиграет оба раза.`,
  dopustimo: (p) => {
    const belye = num(p, 'belye');
    const chernye = num(p, 'chernye');
    return (
      belye > 0 && belye < 1 && chernye > 0 && chernye < 1 && konechnaya(tochnee(belye * chernye))
    );
  },
  otvet: (p) => tochnee(num(p, 'belye') * num(p, 'chernye')),
  /* Второй путь: единица минус три оставшиеся ветви дерева. */
  perebor: (p) => {
    const b = num(p, 'belye');
    const c = num(p, 'chernye');
    const proigral = (1 - b) * (1 - c) + b * (1 - c) + (1 - b) * c;
    return tochnee(1 - proigral);
  },
  shagi: (p) => {
    const b = num(p, 'belye');
    const c = num(p, 'chernye');
    return [
      { text: 'Партии независимы: исход первой не влияет на вторую.', value: 2 },
      {
        text: `Вероятности перемножаются: ${dec(b)} · ${dec(c)} = ${dec(tochnee(b * c))}`,
        value: tochnee(b * c),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 29',
      params: { belye: 0.5, chernye: 0.32 },
    },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 30', params: { belye: 0.6, chernye: 0.45 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 31', params: { belye: 0.5, chernye: 0.3 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 32', params: { belye: 0.6, chernye: 0.4 } },
    { n: 5, source: 'конспект', ref: 'конспект, № 34', params: { belye: 0.56, chernye: 0.3 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { belye: 0.7, chernye: 0.5 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { belye: 0.8, chernye: 0.45 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { belye: 0.55, chernye: 0.4 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { belye: 0.65, chernye: 0.3 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { belye: 0.75, chernye: 0.2 } },
  ],
};

/* ── 10. Стрелок по четырём мишеням ──────────────────────────────── */

/** Как задачник описывает, куда попал стрелок и куда нет. */
function mishenSlova(k: number): string {
  if (k === 1) {
    return 'попадёт в первую мишень и не попадёт в три последние';
  }
  if (k === 2) {
    return 'попадёт в две первые мишени и не попадёт в две последние';
  }
  return 'попадёт в три первые мишени и не попадёт в последнюю';
}

const P10: Prototype = {
  id: 'p5-10',
  blok: 'umnozhenie',
  nazvanie: 'Стрелок: четыре мишени по одному выстрелу',
  tip: 'Умножение вероятностей независимых событий',
  zadachnik: [33, 36],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Стрелок стреляет по одному разу в каждую из четырёх мишеней. Вероятность попадания в мишень при каждом отдельном выстреле равна ${dec(num(p, 'p'))}. Найдите вероятность того, что стрелок ${mishenSlova(num(p, 'k'))}.`,
  dopustimo: (p) => {
    const value = num(p, 'p');
    const k = num(p, 'k');
    return (
      value > 0 &&
      value < 1 &&
      k >= 1 &&
      k <= 3 &&
      konechnaya(tochnee(value ** k * (1 - value) ** (4 - k)))
    );
  },
  otvet: (p) => {
    const value = num(p, 'p');
    const k = num(p, 'k');
    return tochnee(value ** k * (1 - value) ** (4 - k));
  },
  /* Второй путь: обход всех шестнадцати исходов четырёх выстрелов
     с отбором ровно нужной картины попаданий. */
  perebor: (p) => {
    const k = num(p, 'k');
    return derevo(4, num(p, 'p'), (uspehi) => uspehi.every((uspeh, i) => uspeh === i < k));
  },
  shagi: (p) => {
    const value = num(p, 'p');
    const k = num(p, 'k');
    const promah = tochnee(1 - value);
    return [
      {
        text: `Вероятность промаха при одном выстреле: 1 − ${dec(value)} = ${dec(promah)}.`,
        value: promah,
      },
      {
        text: `Выстрелы независимы, поэтому перемножаем: ${dec(value)} в степени ${k} и ${dec(promah)} в степени ${4 - k}.`,
        value: k,
      },
      {
        text: `P = ${dec(tochnee(value ** k * promah ** (4 - k)))}`,
        value: tochnee(value ** k * promah ** (4 - k)),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 33', params: { p: 0.9, k: 1 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 34', params: { p: 0.8, k: 1 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 35', params: { p: 0.6, k: 3 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 36', params: { p: 0.7, k: 2 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { p: 0.5, k: 2 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { p: 0.2, k: 1 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { p: 0.9, k: 3 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { p: 0.8, k: 2 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { p: 0.7, k: 3 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { p: 0.6, k: 1 } },
  ],
};

/* ── 11. Лампы: хотя бы одна не перегорит ────────────────────────── */

const P11: Prototype = {
  id: 'p5-11',
  blok: 'hotya-by',
  nazvanie: 'Лампы: хотя бы одна не перегорит',
  tip: '«Хотя бы один раз» через противоположное событие',
  zadachnik: [37, 40],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const n = num(p, 'n');
    return `Помещение освещается ${tvoritelnoe(n)} ${skl(n, 'лампой', 'лампами', 'лампами')}. Вероятность перегорания каждой лампы в течение года равна ${dec(num(p, 'p'))}. Лампы перегорают независимо друг от друга. Найдите вероятность того, что в течение года хотя бы одна лампа не перегорит.`;
  },
  dopustimo: (p) => {
    const n = num(p, 'n');
    const value = num(p, 'p');
    return n >= 2 && n <= 4 && value > 0 && value < 1 && konechnaya(tochnee(1 - value ** n));
  },
  otvet: (p) => tochnee(1 - num(p, 'p') ** num(p, 'n')),
  /* Второй путь: сумма по дереву всех исходов, где перегорели не все. */
  perebor: (p) => derevo(num(p, 'n'), num(p, 'p'), (peregoreli) => peregoreli.some((x) => !x)),
  shagi: (p) => {
    const n = num(p, 'n');
    const value = num(p, 'p');
    return [
      {
        text: `Противоположное событие — перегорят все ${n}: ${dec(value)} в степени ${n} = ${dec(tochnee(value ** n))}.`,
        value: tochnee(value ** n),
      },
      {
        text: `P = 1 − ${dec(tochnee(value ** n))} = ${dec(tochnee(1 - value ** n))}`,
        value: tochnee(1 - value ** n),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 37', params: { n: 3, p: 0.8 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 38', params: { n: 3, p: 0.9 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 39', params: { n: 3, p: 0.7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 40', params: { n: 3, p: 0.6 } },
    { n: 5, source: 'конспект', ref: 'конспект, № 43', params: { n: 2, p: 0.3 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { n: 3, p: 0.5 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { n: 3, p: 0.4 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { n: 2, p: 0.5 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { n: 2, p: 0.7 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { n: 2, p: 0.8 } },
  ],
};

/* ── 12. Коробка фломастеров ─────────────────────────────────────── */

const P12: Prototype = {
  id: 'p5-12',
  blok: 'bez-vozvrata',
  nazvanie: 'Фломастеры: один синий и один красный',
  tip: 'Выбор двух предметов без возвращения',
  zadachnik: [41, 44],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `В коробке ${num(p, 'sinih')} синих, ${num(p, 'krasnyh')} красных и ${num(p, 'zelenyh')} зелёных фломастеров. Случайным образом выбирают два фломастера. Найдите вероятность того, что окажутся выбраны один синий и один красный фломастеры.`,
  dopustimo: (p) => {
    const s = num(p, 'sinih');
    const k = num(p, 'krasnyh');
    const z = num(p, 'zelenyh');
    const vsego = s + k + z;
    return (
      s >= 1 && k >= 1 && z >= 1 && vsego >= 4 && konechnaya((2 * s * k) / (vsego * (vsego - 1)))
    );
  },
  otvet: (p) => {
    const s = num(p, 'sinih');
    const k = num(p, 'krasnyh');
    const vsego = s + k + num(p, 'zelenyh');
    return (2 * s * k) / (vsego * (vsego - 1));
  },
  /* Второй путь: прямой перебор всех упорядоченных пар «первый —
     второй» без возвращения. Именно он показывает, почему схема не
     сводится к произведению независимых событий. */
  perebor: (p) => {
    const s = num(p, 'sinih');
    const k = num(p, 'krasnyh');
    const z = num(p, 'zelenyh');
    const vsego = s + k + z;
    /* Фломастеры нумеруем: 1…s синие, дальше красные, дальше зелёные. */
    const sinii = (i: number): boolean => i <= s;
    const krasnyi = (i: number): boolean => i > s && i <= s + k;
    let ok = 0;
    let par = 0;
    for (let i = 1; i <= vsego; i += 1) {
      for (let j = 1; j <= vsego; j += 1) {
        if (i === j) {
          continue;
        }
        par += 1;
        if ((sinii(i) && krasnyi(j)) || (krasnyi(i) && sinii(j))) {
          ok += 1;
        }
      }
    }
    return ok / par;
  },
  shagi: (p) => {
    const s = num(p, 'sinih');
    const k = num(p, 'krasnyh');
    const vsego = s + k + num(p, 'zelenyh');
    const otvet = (2 * s * k) / (vsego * (vsego - 1));
    return [
      {
        text: `Всего фломастеров ${vsego}. Первый вынимается из ${vsego}, второй уже из ${vsego - 1} — возвращения нет.`,
        value: vsego,
      },
      {
        text: `Подходящих упорядоченных пар 2 · ${s} · ${k} = ${2 * s * k}: синий-красный и красный-синий.`,
        value: 2 * s * k,
      },
      {
        text: `P = ${2 * s * k} : (${vsego} · ${vsego - 1}) = ${dec(otvet)}`,
        value: otvet,
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 41',
      params: { sinih: 11, krasnyh: 6, zelenyh: 8 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 42',
      params: { sinih: 12, krasnyh: 6, zelenyh: 7 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 43',
      params: { sinih: 10, krasnyh: 3, zelenyh: 12 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 44',
      params: { sinih: 12, krasnyh: 4, zelenyh: 9 },
    },
    {
      n: 5,
      source: 'конспект',
      ref: 'конспект, № 40',
      params: { sinih: 7, krasnyh: 3, zelenyh: 5 },
    },
    {
      n: 6,
      source: 'новый',
      ref: 'создан заново',
      params: { sinih: 9, krasnyh: 5, zelenyh: 11 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { sinih: 13, krasnyh: 6, zelenyh: 6 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { sinih: 10, krasnyh: 9, zelenyh: 6 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { sinih: 14, krasnyh: 3, zelenyh: 8 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { sinih: 12, krasnyh: 9, zelenyh: 4 },
    },
  ],
};

/* ── 13. Футбольная команда: хотя бы 4 очка ──────────────────────── */

/** Очки за одну игру по её исходу. */
const OCHKI = { vyigrysh: 3, nichya: 1, proigrysh: 0 };

const P13: Prototype = {
  id: 'p5-13',
  blok: 'perebor',
  nazvanie: 'Футбол: хотя бы 4 очка в двух играх',
  tip: 'Перебор исходов двух игр',
  zadachnik: [45, 48],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Чтобы пройти в следующий круг соревнований, футбольной команде нужно набрать хотя бы 4 очка в двух играх. Если команда выигрывает, она получает 3 очка, в случае ничьей — 1 очко, если проигрывает — 0 очков. Найдите вероятность того, что команде удастся выйти в следующий круг соревнований. Считайте, что в каждой игре вероятности выигрыша и проигрыша одинаковы и равны ${dec(num(p, 'p'))}.`,
  dopustimo: (p) => {
    const value = num(p, 'p');
    /* Вероятность ничьей равна 1 − 2p: при p = 0,5 ничьих не бывает
       вовсе, хотя условие про них говорит, а при большем p она стала
       бы отрицательной. Поэтому строго меньше половины. */
    return (
      value > 0 && value < 0.5 && konechnaya(tochnee(value ** 2 + 2 * value * (1 - 2 * value)))
    );
  },
  otvet: (p) => {
    const value = num(p, 'p');
    return tochnee(value ** 2 + 2 * value * (1 - 2 * value));
  },
  /* Второй путь: обход всех девяти пар исходов двух игр с подсчётом
     очков — ровно то, что рисуют на дереве. */
  perebor: (p) => {
    const value = num(p, 'p');
    const nichya = 1 - 2 * value;
    const ishody = [
      { ochki: OCHKI.vyigrysh, veroyatnost: value },
      { ochki: OCHKI.nichya, veroyatnost: nichya },
      { ochki: OCHKI.proigrysh, veroyatnost: value },
    ];
    let itog = 0;
    for (const pervaya of ishody) {
      for (const vtoraya of ishody) {
        if (pervaya.ochki + vtoraya.ochki >= 4) {
          itog += pervaya.veroyatnost * vtoraya.veroyatnost;
        }
      }
    }
    return tochnee(itog);
  },
  shagi: (p) => {
    const value = num(p, 'p');
    const nichya = tochnee(1 - 2 * value);
    const dveP = tochnee(value ** 2);
    const pobedaNichya = tochnee(2 * value * nichya);
    return [
      {
        text: `Вероятность ничьей: 1 − 2 · ${dec(value)} = ${dec(nichya)}.`,
        value: nichya,
      },
      {
        text: `Хотя бы 4 очка дают две победы (3 + 3 = 6) и победа с ничьей в любом порядке (3 + 1 = 4).`,
        value: 4,
      },
      {
        text: `P = ${dec(dveP)} + ${dec(pobedaNichya)} = ${dec(tochnee(dveP + pobedaNichya))}`,
        value: tochnee(dveP + pobedaNichya),
      },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 45', params: { p: 0.3 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 46', params: { p: 0.4 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 47', params: { p: 0.2 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 48', params: { p: 0.1 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { p: 0.05 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { p: 0.15 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { p: 0.25 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { p: 0.35 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { p: 0.45 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { p: 0.12 } },
  ],
};

/* ── 14. Батарейки: формула полной вероятности ───────────────────── */

const P14: Prototype = {
  id: 'p5-14',
  blok: 'polnaya',
  nazvanie: 'Батарейки: система контроля забракует',
  tip: 'Формула полной вероятности',
  zadachnik: [49, 54],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) =>
    `Автоматическая линия изготавливает батарейки. Вероятность того, что готовая батарейка неисправна, равна ${dec(num(p, 'brak'))}. Перед упаковкой каждая батарейка проходит систему контроля качества. Вероятность того, что система забракует неисправную батарейку, равна ${dec(num(p, 'nayti'))}. Вероятность того, что система по ошибке забракует исправную батарейку, равна ${dec(num(p, 'oshibka'))}. Найдите вероятность того, что случайно выбранная изготовленная батарейка будет забракована системой контроля.`,
  dopustimo: (p) => {
    const brak = num(p, 'brak');
    const nayti = num(p, 'nayti');
    const oshibka = num(p, 'oshibka');
    return (
      brak > 0 &&
      brak < 0.5 &&
      nayti > 0.5 &&
      nayti <= 1 &&
      oshibka > 0 &&
      oshibka < 0.5 &&
      konechnaya(tochnee(brak * nayti + (1 - brak) * oshibka))
    );
  },
  otvet: (p) =>
    tochnee(num(p, 'brak') * num(p, 'nayti') + (1 - num(p, 'brak')) * num(p, 'oshibka')),
  /* Второй путь: обход всех четырёх ветвей дерева с проверкой, что
     вероятности ветвей в сумме дают единицу. */
  perebor: (p) => {
    const brak = num(p, 'brak');
    const nayti = num(p, 'nayti');
    const oshibka = num(p, 'oshibka');
    const vetvi = [
      { zabrakovana: true, veroyatnost: brak * nayti },
      { zabrakovana: false, veroyatnost: brak * (1 - nayti) },
      { zabrakovana: true, veroyatnost: (1 - brak) * oshibka },
      { zabrakovana: false, veroyatnost: (1 - brak) * (1 - oshibka) },
    ];
    const vsego = vetvi.reduce((s, v) => s + v.veroyatnost, 0);
    if (Math.abs(vsego - 1) > 1e-9) {
      throw new Error('Ветви дерева не дают в сумме единицу');
    }
    return tochnee(vetvi.filter((v) => v.zabrakovana).reduce((s, v) => s + v.veroyatnost, 0));
  },
  shagi: (p) => {
    const brak = num(p, 'brak');
    const nayti = num(p, 'nayti');
    const oshibka = num(p, 'oshibka');
    const put1 = tochnee(brak * nayti);
    const put2 = tochnee((1 - brak) * oshibka);
    return [
      {
        text: `Забраковать можно двумя путями. Неисправную и нашли: ${dec(brak)} · ${dec(nayti)} = ${dec(put1)}.`,
        value: put1,
      },
      {
        text: `Исправную забраковали по ошибке: ${dec(tochnee(1 - brak))} · ${dec(oshibka)} = ${dec(put2)}.`,
        value: put2,
      },
      {
        text: `Пути несовместны, складываем: ${dec(put1)} + ${dec(put2)} = ${dec(tochnee(put1 + put2))}`,
        value: tochnee(put1 + put2),
      },
    ];
  },
  varianty: [
    {
      n: 1,
      source: 'задачник',
      ref: 'задачник 05, № 49',
      params: { brak: 0.01, nayti: 0.96, oshibka: 0.06 },
    },
    {
      n: 2,
      source: 'задачник',
      ref: 'задачник 05, № 50',
      params: { brak: 0.01, nayti: 0.95, oshibka: 0.05 },
    },
    {
      n: 3,
      source: 'задачник',
      ref: 'задачник 05, № 51',
      params: { brak: 0.02, nayti: 0.97, oshibka: 0.02 },
    },
    {
      n: 4,
      source: 'задачник',
      ref: 'задачник 05, № 52',
      params: { brak: 0.02, nayti: 0.98, oshibka: 0.03 },
    },
    {
      n: 5,
      source: 'задачник',
      ref: 'задачник 05, № 53',
      params: { brak: 0.05, nayti: 0.99, oshibka: 0.01 },
    },
    {
      n: 6,
      source: 'задачник',
      ref: 'задачник 05, № 54',
      params: { brak: 0.03, nayti: 0.91, oshibka: 0.01 },
    },
    {
      n: 7,
      source: 'новый',
      ref: 'создан заново',
      params: { brak: 0.04, nayti: 0.95, oshibka: 0.02 },
    },
    {
      n: 8,
      source: 'новый',
      ref: 'создан заново',
      params: { brak: 0.01, nayti: 0.9, oshibka: 0.04 },
    },
    {
      n: 9,
      source: 'новый',
      ref: 'создан заново',
      params: { brak: 0.05, nayti: 0.96, oshibka: 0.03 },
    },
    {
      n: 10,
      source: 'новый',
      ref: 'создан заново',
      params: { brak: 0.02, nayti: 0.94, oshibka: 0.05 },
    },
  ],
};

/* ── 15. Стрелок стреляет до попадания ───────────────────────────── */

/** Наименьшее n, при котором 1 − (1 − p)ⁿ ≥ nado. */
function naimenshee(p: number, nado: number): number {
  let n = 1;
  while (1 - (1 - p) ** n < nado - 1e-12 && n < 100) {
    n += 1;
  }
  return n;
}

const P15: Prototype = {
  id: 'p5-15',
  blok: 'bernulli',
  nazvanie: 'Стрелок стреляет, пока не попадёт',
  tip: 'Наименьшее число испытаний',
  zadachnik: [55, 58],
  format: 'целое',
  okruglenie: tochno,
  uslovie: (p) =>
    `Стрелок в тире стреляет по мишени до тех пор, пока не поразит её. Известно, что он попадает в цель с вероятностью ${dec(num(p, 'p'))} при каждом отдельном выстреле. Какое наименьшее количество патронов нужно дать стрелку, чтобы он поразил цель с вероятностью не меньше ${dec(num(p, 'nado'))}?`,
  dopustimo: (p) => {
    const value = num(p, 'p');
    const nado = num(p, 'nado');
    if (value <= 0 || value >= 1 || nado <= 0 || nado >= 1) {
      return false;
    }
    const n = naimenshee(value, nado);
    /* Порог не должен лечь ровно на границу: при равенстве ответ
       «наименьшее количество» становится спорным для ученика. */
    const zdes = 1 - (1 - value) ** n;
    const ranshe = 1 - (1 - value) ** (n - 1);
    return n >= 2 && n <= 8 && zdes - nado > 1e-6 && nado - ranshe > 1e-6;
  },
  otvet: (p) => naimenshee(num(p, 'p'), num(p, 'nado')),
  /* Второй путь: наращиваем вероятность промахов подряд, пока она не
     станет достаточно малой, — без возведения в степень. */
  perebor: (p) => {
    const value = num(p, 'p');
    const nado = num(p, 'nado');
    let promahi = 1;
    let n = 0;
    while (1 - promahi < nado - 1e-12 && n < 100) {
      promahi *= 1 - value;
      n += 1;
    }
    return n;
  },
  shagi: (p) => {
    const value = num(p, 'p');
    const nado = num(p, 'nado');
    const n = naimenshee(value, nado);
    const promah = tochnee(1 - value);
    return [
      {
        text: `Цель не поражена, только если промахнулись все разы. Вероятность одного промаха: 1 − ${dec(value)} = ${dec(promah)}.`,
        value: promah,
      },
      {
        text: `Нужно, чтобы ${dec(promah)} в степени n не превышало 1 − ${dec(nado)} = ${dec(tochnee(1 - nado))}.`,
        value: tochnee(1 - nado),
      },
      { text: `Наименьшее такое n равно ${n}.`, value: n },
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 55', params: { p: 0.5, nado: 0.7 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 56', params: { p: 0.5, nado: 0.8 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 57', params: { p: 0.4, nado: 0.7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 58', params: { p: 0.6, nado: 0.8 } },
    { n: 5, source: 'новый', ref: 'создан заново', params: { p: 0.5, nado: 0.9 } },
    { n: 6, source: 'новый', ref: 'создан заново', params: { p: 0.3, nado: 0.8 } },
    { n: 7, source: 'новый', ref: 'создан заново', params: { p: 0.8, nado: 0.99 } },
    { n: 8, source: 'новый', ref: 'создан заново', params: { p: 0.2, nado: 0.5 } },
    { n: 9, source: 'новый', ref: 'создан заново', params: { p: 0.7, nado: 0.95 } },
    { n: 10, source: 'новый', ref: 'создан заново', params: { p: 0.6, nado: 0.9 } },
  ],
};

export const PROIZVEDENIYA: readonly Prototype[] = [P09, P10, P11, P12, P13, P14, P15];
