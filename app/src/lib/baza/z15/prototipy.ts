/**
 * База, задание №15 «Текстовые задачи на проценты»: прототипы тренажёра.
 *
 * Прототип — группа однотипных задач: текст один и тот же с точностью
 * до чисел. Числа задач хранятся в analogi.ts (по строке на задачу),
 * условие собирается из них с согласованием слов, ответ и разбор
 * считаются по тем же числам. proverka — пересчёт другим путём: история
 * из условия моделируется точными дробями или перебором.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { slovo, tex, zapis } from '../chisla';
import type { Etap, GruppaBazy, Params, Prototip, Resheno } from '../types';
import { ANALOGI_15 } from './analogi';
import {
  T,
  Tili,
  chasti,
  del,
  fm,
  itog,
  izmenenie,
  minus,
  naSkolkoProcentov,
  plus,
  pr,
  procentOt,
  q,
  tseloePoChasti,
  umn,
  vopros,
  zapisQ,
  type Q,
} from './reshenie';
import {
  CHELOVEK,
  GEKTAR,
  GRAMM,
  KOPEYKA,
  RUBL,
  VYPUSKNIK,
  dolyaSlovami,
  razr,
  sChislom,
  vRaz,
  voStolko,
} from './slova';

export const GRUPPY_15: GruppaBazy[] = [
  { id: 'A', nazvanie: 'Доли и «во сколько раз»', znak: '\\tfrac{3}{4}', ton: 'blue' },
  { id: 'B', nazvanie: 'Отношения', znak: 'a:b', ton: 'navy' },
  { id: 'C', nazvanie: 'Процент от числа', znak: 'p\\%', ton: 'orange' },
  { id: 'D', nazvanie: 'Целое и изменение в процентах', znak: '100\\%', ton: 'terra' },
  { id: 'E', nazvanie: 'Задачи в несколько действий', znak: '\\%\\!+\\!\\%', ton: 'green' },
];

/** Числа задачи по именам полей. */
type G<K extends string> = Readonly<Record<K, number>>;

interface Opisanie<K extends string> {
  id: string;
  gruppa: string;
  title: string;
  /** Имена чисел строки analogi.ts по порядку. */
  polya: readonly K[];
  text(g: G<K>): string;
  solve(g: G<K>): Resheno;
  proverka(g: G<K>): string;
}

function stroki(id: string): readonly (readonly number[])[] {
  const d = ANALOGI_15[id];
  if (d === undefined || d.length === 0) throw new Error(`База №15: нет задач ${id}`);
  return d;
}

function vParametry(polya: readonly string[], row: readonly number[]): Params {
  if (row.length !== polya.length) throw new Error(`строка ${row.join(',')}: полей не столько`);
  return Object.fromEntries(polya.map((k, i) => [k, row[i] ?? 0]));
}

function chisla<K extends string>(polya: readonly K[], p: Params): G<K> {
  const g: Partial<Record<K, number>> = {};
  for (const k of polya) {
    const v = p[k];
    if (typeof v !== 'number') throw new Error(`нет числа ${k}`);
    g[k] = v;
  }
  return g as G<K>;
}

/** Имена полей строк analogi.ts по прототипам. */
const POLYA: Record<string, readonly string[]> = {};

function prototip<const K extends string>(o: Opisanie<K>): Prototip {
  const dannye = stroki(o.id);
  POLYA[o.id] = o.polya;
  return {
    id: o.id,
    gruppa: o.gruppa,
    title: o.title,
    tip: 'chislo',
    zadach: dannye.length,
    generate: (rng: Rng) => vParametry(o.polya, rng.pick(dannye)),
    text: (p) => o.text(chisla(o.polya, p)),
    solve: (p) => o.solve(chisla(o.polya, p)),
    proverka: (p) => o.proverka(chisla(o.polya, p)),
  };
}

/** n — целое, иначе ошибка (проверка перебором не нашла ответа). */
function tseloe(n: number | undefined, chto: string): string {
  if (n === undefined || !Number.isInteger(n)) throw new Error(`перебор: нет ${chto}`);
  return zapis(n, 1);
}

/** Модуль дроби. */
const abs = (a: Q): Q => q(Math.abs(a.n), a.d);
/** p копий числа x (сложением). */
function slozhit(x: Q, raz: number): Q {
  let s = q(0);
  for (let i = 0; i < raz; i += 1) s = plus(s, x);
  return s;
}
/** Изменение «было → стало» в процентах, по модулю. */
const vProcentah = (bylo: Q, stalo: Q): string =>
  zapisQ(umn(abs(minus(del(stalo, bylo), q(1))), q(100)));

const CHASTEY = ['часть', 'части', 'частей'] as const;

/* ════ A. Доли и «во сколько раз» ════════════════════════════════ */

const P01 = prototip({
  id: 'P01',
  gruppa: 'A',
  title: 'Доля словами — в проценты',
  polya: ['m', 'n'],
  text: ({ m, n }) =>
    `${dolyaSlovami(m, n)} всех отдыхающих в пансионате – дети. Какой процент от всех отдыхающих составляют дети?`,
  solve({ m, n }) {
    const otvet = zapis(100 * m, n);
    return {
      otvet,
      etapy: [
        { title: 'Что принимаем за 100 %', lines: ['Все отдыхающие — целое, это $100\\%$.'] },
        {
          title: 'Одна доля',
          lines: [`Делим целое на $${n}$ равных долей: $100\\% : ${n} = ${T(100, n)}\\%$.`],
        },
        itog(
          'Доля детей',
          [
            `Дети — $\\dfrac{${m}}{${n}}$, то есть $${m}$ ${slovo(m, ['доля', 'доли', 'долей'])}: $${T(100, n)}\\% \\cdot ${m} = ${tex(otvet)}\\%$.`,
          ],
          otvet,
        ),
      ],
      hints: [
        vopros(
          'Какая часть отдыхающих — дети?',
          `$\\dfrac{${m}}{${n}}$`,
          [`$\\dfrac{${n}}{${m}}$`, `$\\dfrac{${m}}{100}$`, `$\\dfrac{${n - m}}{${n}}$`],
          m + n,
        ),
        vopros(
          `Сколько процентов составляет $\\dfrac{1}{${n}}$ целого?`,
          `$${T(100, n)}\\%$`,
          [`$${n}\\%$`, `$${T(1, n)}\\%$`],
          n,
          'Целое — 100 %, делим его на число долей.',
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${T(m, n)}$`, fm(Tili(100 * (n - m), n))],
          m,
          'Ответ — в процентах: долю умножаем на 100.',
        ),
      ],
    };
  },
  proverka({ m, n }) {
    /* Пусть в пансионате 2000 отдыхающих. */
    const vsego = 2000;
    const deti = (vsego / n) * m;
    return zapisQ(umn(q(deti, vsego), q(100)));
  },
});

const P02 = prototip({
  id: 'P02',
  gruppa: 'A',
  title: 'Уменьшилось в несколько раз',
  polya: ['k100'],
  text: ({ k100 }) =>
    `Число больных гриппом в школе уменьшилось за месяц ${vRaz(k100)}. На сколько процентов уменьшилось число больных гриппом?`,
  solve({ k100 }) {
    const k = T(k100, 100);
    const ostalos = T(10000, k100);
    const otvet = zapis(100 * (k100 - 100), k100);
    return {
      otvet,
      etapy: [
        {
          title: 'Что принимаем за 100 %',
          lines: ['Число больных в начале месяца — $100\\%$.'],
        },
        {
          title: 'Сколько стало',
          lines: [`Уменьшилось ${vRaz(k100)}: стало $100\\% : ${k} = ${ostalos}\\%$.`],
        },
        itog('На сколько уменьшилось', [`$100\\% - ${ostalos}\\% = ${tex(otvet)}\\%$.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько процентов от прежнего числа больных осталось?',
          `$${ostalos}\\%$`,
          [`$${k}\\%$`, `$${tex(otvet)}\\%$`],
          k100,
          `«Уменьшилось ${vRaz(k100)}» — значит, делим на это число.`,
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${ostalos}$`, `$${T(k100 - 100)}$`],
          k100 + 1,
          'Спрашивают, на сколько уменьшилось: из 100 % вычитаем то, что осталось.',
        ),
      ],
    };
  },
  proverka({ k100 }) {
    /* Было 100·k100 больных, стало в k раз меньше. */
    const bylo = q(100 * k100);
    return vProcentah(bylo, del(bylo, q(k100, 100)));
  },
});

const P03 = prototip({
  id: 'P03',
  gruppa: 'A',
  title: 'Увеличилось в несколько раз',
  polya: ['k100'],
  text: ({ k100 }) =>
    `Число посетителей сайта увеличилось за месяц ${voStolko(k100)}. На сколько процентов увеличилось число посетителей сайта за этот месяц?`,
  solve({ k100 }) {
    const k = T(k100, 100);
    const otvet = zapis(k100 - 100, 1);
    return {
      otvet,
      etapy: [
        {
          title: 'Что принимаем за 100 %',
          lines: ['Число посетителей в начале месяца — $100\\%$.'],
        },
        {
          title: 'Сколько стало',
          lines: [`Увеличилось ${voStolko(k100)}: стало $100\\% \\cdot ${k} = ${k100}\\%$.`],
        },
        itog('На сколько увеличилось', [`$${k100}\\% - 100\\% = ${tex(otvet)}\\%$.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько процентов от прежнего числа составляет новое?',
          `$${k100}\\%$`,
          [`$${k}\\%$`, `$${k100 - 100}\\%$`],
          k100,
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${k100}$`, fm(Tili(100 * (k100 - 100), k100))],
          k100 + 2,
          'Спрашивают, на сколько увеличилось: из нового числа процентов вычитаем 100 %.',
        ),
      ],
    };
  },
  proverka({ k100 }) {
    /* Было 1000 посетителей. */
    const bylo = q(1000);
    return vProcentah(bylo, umn(bylo, q(k100, 100)));
  },
});

/* ════ B. Отношения ══════════════════════════════════════════════ */

/** Величина делится в отношении частей; ищем нужные части. */
function poChastyam(o: {
  vsego: number;
  ch: readonly number[];
  /** Номер нужной части. */
  nuzhna: number;
  /** «голосов», «млн рублей», «га». */
  ed: string;
  /** «Победителю». */
  komu: string;
  chto: string;
}): Resheno {
  const { s, tex: sumTex } = chasti(o.ch);
  const nuzhno = o.ch[o.nuzhna] ?? 0;
  const drugaya = o.ch.find((_, i) => i !== o.nuzhna) ?? 0;
  const otvet = zapis(o.vsego * nuzhno, s);
  /* «$5\%$» для процентов, «$27$ голосов» для остального. */
  const ed = o.ed === '%' ? '\\%$' : `$ ${o.ed}`;
  return {
    otvet,
    etapy: [
      {
        title: 'Сколько всего частей',
        lines: [
          `${o.chto} в отношении $${o.ch.join(':')}$: всего $${sumTex} = ${s}$ равных частей.`,
        ],
      },
      {
        title: 'Одна часть',
        lines: [`$${T(o.vsego)}${o.ed === '%' ? '\\%' : ''} : ${s} = ${T(o.vsego, s)}${ed}.`],
      },
      itog(
        'Нужные части',
        [
          `${o.komu} — $${nuzhno}$ ${slovo(nuzhno, CHASTEY)}: $${T(o.vsego, s)}${o.ed === '%' ? '\\%' : ''} \\cdot ${nuzhno} = ${tex(otvet)}${ed}.`,
        ],
        otvet,
      ),
    ],
    hints: [
      vopros(
        'На сколько равных частей делится целое?',
        `$${s}$`,
        [`$${nuzhno}$`, `$${o.ch.reduce((x, y) => x * y, 1)}$`, `$${s + 1}$`],
        o.vsego + s,
        'Складываем числа отношения.',
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [fm(Tili(o.vsego * drugaya, s)), fm(Tili(o.vsego, s)), fm(Tili(o.vsego * nuzhno))],
        nuzhno,
        'Одну часть умножаем на число нужных частей.',
      ),
    ],
  };
}

/** Перебор: делим vsego на две целые доли x и vsego − x в отношении a:b. */
function delimPerebor(vsego: number, a: number, b: number): [number, number] {
  for (let x = 0; x <= vsego; x += 1) {
    if (x * b === (vsego - x) * a) return [x, vsego - x];
  }
  throw new Error(`${vsego} не делится в отношении ${a}:${b}`);
}

const P04 = prototip({
  id: 'P04',
  gruppa: 'B',
  title: 'Голоса за победителя',
  polya: ['T', 'a', 'b'],
  text: ({ T: n, a, b }) =>
    `На пост председателя школьного совета претендовали два кандидата. В голосовании приняли участие ${sChislom(n, CHELOVEK)}. Голоса между кандидатами распределились в отношении ${a}:${b}. Сколько голосов получил победитель?`,
  solve: ({ T: n, a, b }) =>
    poChastyam({
      vsego: n,
      ch: [a, b],
      nuzhna: a > b ? 0 : 1,
      ed: 'голосов',
      komu: 'Победителю (большая доля)',
      chto: 'Голоса делятся',
    }),
  proverka({ T: n, a, b }) {
    const [x, y] = delimPerebor(n, a, b);
    return tseloe(Math.max(x, y), 'голосов');
  },
});

const P05 = prototip({
  id: 'P05',
  gruppa: 'B',
  title: 'Фарш: процент баранины',
  polya: ['a', 'b'],
  text: ({ a, b }) =>
    `Для приготовления фарша взяли говядину и баранину в отношении ${a}:${b} соответственно. Какой процент в фарше составляет баранина?`,
  solve: ({ a, b }) =>
    poChastyam({
      vsego: 100,
      ch: [a, b],
      nuzhna: 1,
      ed: '%',
      komu: 'Баранина',
      chto: 'Весь фарш ($100\\%$) делится',
    }),
  proverka({ a, b }) {
    /* Сначала доля говядины, баранина — остальное. */
    return zapisQ(umn(minus(q(1), q(a, a + b)), q(100)));
  },
});

const P06 = prototip({
  id: 'P06',
  gruppa: 'B',
  title: 'Прибыль по отношению акций',
  polya: ['a', 'b', 'S'],
  text: ({ a, b, S }) =>
    `Акции предприятия распределены между государством и частными акционерами в отношении ${a}:${b} соответственно. Общая прибыль предприятия после уплаты налогов за год составила ${S} млн рублей. Какая сумма из этой прибыли должна пойти на выплату частным акционерам? Ответ дайте в миллионах рублей.`,
  solve: ({ a, b, S }) =>
    poChastyam({
      vsego: S,
      ch: [a, b],
      nuzhna: 1,
      ed: 'млн руб.',
      komu: 'Частным акционерам',
      chto: 'Прибыль делится',
    }),
  proverka({ a, b, S }) {
    /* В сотых долях миллиона — перебором. */
    return zapis(delimPerebor(S * 100, a, b)[1], 100);
  },
});

const KULTURY = [
  { s: 'техническими', vopros: 'технические', nuzhna: 1, ga: true },
  { s: 'бахчевыми', vopros: 'бахчевые', nuzhna: 1, ga: false },
  { s: 'зернобобовыми', vopros: 'зерновые', nuzhna: 0, ga: true },
  { s: 'овощными', vopros: 'овощные', nuzhna: 1, ga: false },
] as const;

const P07 = prototip({
  id: 'P07',
  gruppa: 'B',
  title: 'Площадь под культуры',
  polya: ['v', 'S', 'a', 'b'],
  text({ v, S, a, b }) {
    const k = KULTURY[v] ?? KULTURY[0];
    const ed = k.ga ? `${S} га` : sChislom(S, GEKTAR);
    return `Площадь земель фермерского хозяйства, отведённых под посадку сельскохозяйственных культур, составляет ${ed} и распределена между зерновыми и ${k.s} культурами в отношении ${a}:${b} соответственно. Сколько гектаров занимают ${k.vopros} культуры?`;
  },
  solve({ v, S, a, b }) {
    const k = KULTURY[v] ?? KULTURY[0];
    return poChastyam({
      vsego: S,
      ch: [a, b],
      nuzhna: k.nuzhna,
      ed: 'га',
      komu: `${k.vopros[0]?.toUpperCase()}${k.vopros.slice(1)} культуры`,
      chto: 'Площадь делится',
    });
  },
  proverka({ v, S, a, b }) {
    const k = KULTURY[v] ?? KULTURY[0];
    return zapis(delimPerebor(S * 100, a, b)[k.nuzhna] ?? 0, 100);
  },
});

const P08 = prototip({
  id: 'P08',
  gruppa: 'B',
  title: 'Хвойные и лиственные',
  polya: ['a', 'b'],
  text: ({ a, b }) =>
    `Число хвойных деревьев в парке относится к числу лиственных как ${a}:${b}. Других деревьев в парке нет. Сколько процентов деревьев в парке составляют лиственные?`,
  solve: ({ a, b }) =>
    poChastyam({
      vsego: 100,
      ch: [a, b],
      nuzhna: 1,
      ed: '%',
      komu: 'Лиственные',
      chto: 'Все деревья ($100\\%$) делятся',
    }),
  proverka({ a, b }) {
    /* В парке 100·(a+b) деревьев. */
    const [, listv] = delimPerebor(100 * (a + b), a, b);
    return zapisQ(umn(q(listv, 100 * (a + b)), q(100)));
  },
});

const P09 = prototip({
  id: 'P09',
  gruppa: 'B',
  title: 'Выборы: процент голосов',
  polya: ['kto', 'a', 'b'],
  text: ({ kto, a, b }) =>
    `В выборах участвовали два кандидата. Голоса избирателей распределились между ними в отношении ${a}:${b}. Сколько процентов голосов ${kto === 0 ? 'получил проигравший' : 'было отдано за победителя'}?`,
  solve({ kto, a, b }) {
    const bolshe = a > b ? 0 : 1;
    return poChastyam({
      vsego: 100,
      ch: [a, b],
      nuzhna: kto === 0 ? 1 - bolshe : bolshe,
      ed: '%',
      komu: kto === 0 ? 'Проигравшему (меньшая доля)' : 'Победителю (большая доля)',
      chto: 'Все голоса ($100\\%$) делятся',
    });
  },
  proverka({ kto, a, b }) {
    const [x, y] = delimPerebor(100 * (a + b), a, b);
    const n = kto === 0 ? Math.min(x, y) : Math.max(x, y);
    return zapisQ(umn(q(n, 100 * (a + b)), q(100)));
  },
});

const P10 = prototip({
  id: 'P10',
  gruppa: 'B',
  title: 'Длины двух рек',
  polya: ['a', 'b', 'd'],
  text: ({ a, b, d }) =>
    `Длины двух рек относятся как ${a}:${b}, при этом одна из них длиннее другой на ${d} км. Найдите длину большей реки. Ответ дайте в километрах.`,
  solve({ a, b, d }) {
    const r = b - a;
    const otvet = zapis(b * d, r);
    return {
      otvet,
      etapy: [
        {
          title: 'Разница в частях',
          lines: [
            `Меньшая река — $${a}$ ${slovo(a, CHASTEY)}, большая — $${b}$. Разница: $${b} - ${a} = ${r}$ ${slovo(r, CHASTEY)}, это $${d}$ км.`,
          ],
        },
        { title: 'Одна часть', lines: [`$${d} : ${r} = ${T(d, r)}$ км.`] },
        itog('Большая река', [`$${T(d, r)} \\cdot ${b} = ${tex(otvet)}$ км.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько частей приходится на разницу длин?',
          `$${r}$`,
          [`$${a + b}$`, `$${b}$`],
          d,
          'Из большего числа частей вычитаем меньшее.',
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [fm(Tili(a * d, r)), fm(Tili((a + b) * d, r))],
          a + b,
          'Нужна большая река: одну часть умножаем на большее число отношения.',
        ),
      ],
    };
  },
  proverka({ a, b, d }) {
    /* Перебор длины большей реки. */
    for (let L = 1; L <= 100000; L += 1) {
      if ((L * a) % b === 0 && L - (L * a) / b === d) return zapis(L, 1);
    }
    throw new Error('реки: не нашлось');
  },
});

const P11 = prototip({
  id: 'P11',
  gruppa: 'B',
  title: 'Чайная композиция',
  polya: ['a', 'b', 'c', 'm'],
  text: ({ a, b, c, m }) =>
    `Фирма «Лучший чай» специализируется на фасовке чая по заказу клиентов. Чайная композиция «Тонус», состоящая из листьев чёрного чая, мяты и жасмина, получается смешиванием этих листьев по массе в отношении ${a}:${b}:${c} соответственно. Анна заказала чай, в котором мяты ${sChislom(m, GRAMM)}. Какую массу будет иметь упаковка чая «Тонус», изготовленного по заказу Анны? Ответ дайте в граммах.`,
  solve({ a, b, c, m }) {
    const { s, tex: sumTex } = chasti([a, b, c]);
    const otvet = zapis(m * s, b);
    return {
      otvet,
      etapy: [
        {
          title: 'Одна часть',
          lines: [
            `Мята — $${b}$ ${slovo(b, CHASTEY)}, это $${m}$ г. Одна часть: $${m} : ${b} = ${T(m, b)}$ г.`,
          ],
        },
        { title: 'Сколько всего частей', lines: [`$${sumTex} = ${s}$.`] },
        itog('Вся упаковка', [`$${T(m, b)} \\cdot ${s} = ${tex(otvet)}$ г.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько граммов приходится на одну часть?',
          `$${T(m, b)}$`,
          [`$${m}$`, fm(Tili(m, s)), fm(Tili(m * b))],
          m,
          'Мята — это несколько частей, а не одна.',
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [fm(Tili(m * s)), fm(Tili(m * (a + c), b))],
          s,
          'Нужна масса всей упаковки — вместе с мятой.',
        ),
      ],
    };
  },
  proverka({ a, b, c, m }) {
    const chast = q(m, b);
    return zapisQ(plus(plus(umn(chast, q(a)), q(m)), umn(chast, q(c))));
  },
});

/* ════ C. Процент от числа ═══════════════════════════════════════ */

/** Процент от числа сложением сотых долей. */
const procentPerebor = (N: number, p: number): string => zapisQ(slozhit(q(N, 100), p));

const P12 = prototip({
  id: 'P12',
  gruppa: 'C',
  title: 'Пенсионеры в городе',
  polya: ['eto', 'N', 'p'],
  text: ({ eto, N, p }) =>
    `В городе ${razr(N)} жителей, причём ${p}% из них – ${eto === 1 ? 'это ' : ''}пенсионеры. Сколько пенсионеров в этом городе?`,
  solve: ({ N, p }) =>
    procentOt({
      N,
      p,
      tseloe: 'всех жителей города',
      iskomoe: 'Пенсионеры',
      neTseloe: ['пенсионеров', 'жителей моложе пенсионного возраста'],
    }),
  proverka: ({ N, p }) => procentPerebor(N, p),
});

const P13 = prototip({
  id: 'P13',
  gruppa: 'C',
  title: 'Статья бюджета',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Городской бюджет составляет ${S} млн рублей, а расходы на одну из его статей составили ${p}%. Сколько миллионов рублей потрачено на эту статью бюджета?`,
  solve: ({ S, p }) =>
    procentOt({
      N: S,
      p,
      tseloe: 'весь бюджет (млн руб.)',
      iskomoe: 'Расходы на статью',
      neTseloe: ['расходы на эту статью', 'остаток бюджета'],
    }),
  proverka: ({ S, p }) => procentPerebor(S, p),
});

const VYPUSKNIKI = {
  tseloe: 'всех выпускников',
  iskomoe: 'Решившие задачу',
  neTseloe: ['решивших задачу', 'не решивших задачу'],
};

const P14 = prototip({
  id: 'P14',
  gruppa: 'C',
  title: 'Решили задачу: «из … выпускников»',
  polya: ['N', 'p', 'z'],
  text: ({ N, p, z }) =>
    `Из ${razr(N)} выпускников школ города ${p}% правильно решили задачу № ${z}. Сколько выпускников школ этого города правильно решили задачу № ${z}?`,
  solve: ({ N, p }) => procentOt({ N, p, ...VYPUSKNIKI }),
  proverka: ({ N, p }) => procentPerebor(N, p),
});

const P15 = prototip({
  id: 'P15',
  gruppa: 'C',
  title: 'Решили задачу: «только …%»',
  polya: ['N', 'p', 'z'],
  text: ({ N, p, z }) =>
    `Только ${p}% из ${razr(N)} выпускников города правильно решили задачу № ${z}. Сколько выпускников из этого города правильно решили задачу № ${z}?`,
  solve: ({ N, p }) => procentOt({ N, p, ...VYPUSKNIKI }),
  proverka: ({ N, p }) => procentPerebor(N, p),
});

const P16 = prototip({
  id: 'P16',
  gruppa: 'C',
  title: 'Прибыль частным акционерам',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Государству принадлежит ${p}% акций предприятия, остальные акции принадлежат частным лицам. Общая прибыль предприятия после уплаты налогов за год составила ${S} млн рублей. Какая сумма из этой прибыли должна пойти на выплату частным акционерам? Ответ дайте в миллионах рублей.`,
  solve: ({ S, p }) =>
    procentOt({
      N: S,
      p: 100 - p,
      tseloe: 'всю прибыль (млн руб.)',
      iskomoe: 'Частным акционерам',
      neTseloe: ['долю государства', 'долю частных акционеров'],
      pered: [
        {
          title: 'Сколько процентов у частных лиц',
          lines: [`Частным лицам — остальные акции: $100\\% - ${p}\\% = ${100 - p}\\%$.`],
        },
      ],
      hintsPered: [
        vopros(
          'Сколько процентов акций у частных лиц?',
          `$${100 - p}\\%$`,
          [`$${p}\\%$`, `$${100 + p}\\%$`],
          S,
          `Государству — $${p}\\%$, частным лицам — всё остальное.`,
        ),
      ],
    }),
  proverka({ S, p }) {
    /* Сначала доля государства, затем остаток прибыли. */
    return zapisQ(minus(q(S), slozhit(q(S, 100), p)));
  },
});

/* ── Повышение и снижение ─────────────────────────────────────── */

/** Новая сумма: S · (1 ± p/100) · k — точными дробями. */
const posleIzmeneniya = (S: number, p: number, vverh: boolean, k = 1): string =>
  zapisQ(umn(plus(q(S), umn(q(S), pr(vverh ? p : -p))), q(k)));

function izmProto(o: {
  id: string;
  title: string;
  text: (g: G<'S' | 'p'>) => string;
  vverh: boolean;
  tseloe: string;
  izm: string;
}) {
  return prototip({
    id: o.id,
    gruppa: 'C',
    title: o.title,
    polya: ['S', 'p'],
    text: o.text,
    solve: ({ S, p }) => izmenenie({ S, p, vverh: o.vverh, tseloe: o.tseloe, izm: o.izm }),
    proverka: ({ S, p }) => posleIzmeneniya(S, p, o.vverh),
  });
}

const P17 = izmProto({
  id: 'P17',
  title: 'Вклад через год',
  text: ({ S, p }) =>
    `Банк начисляет на срочный вклад ${p}% годовых. Вкладчик положил на счёт ${razr(S)} рублей. Сколько рублей будет на этом счёте через год, если никаких операций, кроме начисления процентов, со счётом проводиться не будет?`,
  vverh: true,
  tseloe: 'вклад',
  izm: 'проценты банка',
});

const P18 = izmProto({
  id: 'P18',
  title: 'Шкаф со сборкой',
  text: ({ S, p }) =>
    `В магазине вся мебель продаётся в разобранном виде. Покупатель может заказать сборку мебели на дому, стоимость которой составляет ${p}% от стоимости купленной мебели. Шкаф стоит ${razr(S)} рублей. Во сколько рублей обойдётся покупка этого шкафа вместе со сборкой?`,
  vverh: true,
  tseloe: 'цену шкафа',
  izm: 'стоимость сборки',
});

const P19 = izmProto({
  id: 'P19',
  title: 'Подорожание слив',
  text: ({ S, p }) =>
    `В сентябре 1 кг слив стоил ${razr(S)} рублей. В октябре сливы подорожали на ${p}%. Сколько рублей стоил 1 кг слив после подорожания в октябре?`,
  vverh: true,
  tseloe: 'сентябрьскую цену',
  izm: 'подорожание',
});

const P20 = prototip({
  id: 'P20',
  gruppa: 'C',
  title: 'Плата за телефон',
  polya: ['vm', 'S', 'p'],
  text: ({ vm, S, p }) =>
    `Ежемесячная плата за телефон составляет ${razr(S)} рублей${vm === 1 ? ' в месяц' : ''}. В следующем году она увеличится на ${p}%. Сколько рублей будет составлять ежемесячная плата за телефон в следующем году?`,
  solve: ({ S, p }) => izmenenie({ S, p, vverh: true, tseloe: 'нынешнюю плату', izm: 'повышение' }),
  proverka: ({ S, p }) => posleIzmeneniya(S, p, true),
});

const P21 = prototip({
  id: 'P21',
  gruppa: 'C',
  title: 'Зарплата после налога',
  polya: ['vy', 'S', 'p'],
  text: ({ vy, S, p }) =>
    `Налог на доходы составляет ${p}% от заработной платы. Заработная плата Ивана Кузьмича равна ${razr(S)} рублей. Какую сумму он получит после ${vy === 1 ? 'уплаты' : 'вычета'} налога на доходы? Ответ дайте в рублях.`,
  solve: ({ S, p }) =>
    izmenenie({ S, p, vverh: false, tseloe: 'всю заработную плату', izm: 'налог' }),
  proverka: ({ S, p }) => posleIzmeneniya(S, p, false),
});

const P22 = izmProto({
  id: 'P22',
  title: 'Книга по дисконтной карте',
  text: ({ S, p }) =>
    `Держатели дисконтной карты книжного магазина получают при покупке скидку ${p}%. Книга стоит ${razr(S)} рублей. Сколько рублей заплатит держатель дисконтной карты за эту книгу?`,
  vverh: false,
  tseloe: 'цену книги',
  izm: 'скидку',
});

const P23 = izmProto({
  id: 'P23',
  title: 'Масло со скидкой',
  text: ({ S, p }) =>
    `Пачка сливочного масла стоит ${razr(S)} рублей. Пенсионерам магазин делает скидку ${p}%. Сколько рублей стоит пачка масла для пенсионера?`,
  vverh: false,
  tseloe: 'цену пачки',
  izm: 'скидку',
});

const P24 = prototip({
  id: 'P24',
  gruppa: 'C',
  title: 'Погремушки с наценкой',
  polya: ['S', 'p', 'k'],
  text: ({ S, p, k }) =>
    `Магазин детских товаров закупает погремушки по оптовой цене ${razr(S)} рублей за одну штуку и продаёт с наценкой ${p}%. Сколько рублей будут стоить ${k} такие погремушки, купленные в этом магазине?`,
  solve: ({ S, p, k }) =>
    izmenenie({
      S,
      p,
      vverh: true,
      tseloe: 'оптовую цену одной погремушки',
      izm: 'наценку',
      shtuk: k,
      shtukSlovo: 'Погремушек',
    }),
  proverka: ({ S, p, k }) => posleIzmeneniya(S, p, true, k),
});

const P25 = prototip({
  id: 'P25',
  gruppa: 'C',
  title: 'Скидка на второй свитер',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `В спортивном магазине любой свитер стоит ${razr(S)} рублей. Сейчас магазин проводит акцию: при покупке двух свитеров – скидка на второй свитер ${p}%. Сколько рублей придётся заплатить за покупку двух свитеров в период действия акции?`,
  solve({ S, p }) {
    const vtoroy = zapis(S * (100 - p), 100);
    const otvet = zapis(S * (200 - p), 100);
    return {
      otvet,
      etapy: [
        { title: 'Первый свитер', lines: [`Без скидки: $${S}$ руб.`] },
        {
          title: 'Второй свитер',
          lines: [
            `Скидка $${p}\\%$ — платим $100\\% - ${p}\\% = ${100 - p}\\%$ цены: $${S} \\cdot ${T(100 - p, 100)} = ${tex(vtoroy)}$ руб.`,
          ],
        },
        itog('Вся покупка', [`$${S} + ${tex(vtoroy)} = ${tex(otvet)}$ руб.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько процентов цены стоит второй свитер?',
          `$${100 - p}\\%$`,
          [`$${p}\\%$`, `$${100 + p}\\%$`],
          S,
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [fm(Tili(2 * S * (100 - p), 100)), fm(Tili(S * (100 - p), 100))],
          p,
          'Скидка только на второй свитер, первый — по полной цене.',
        ),
      ],
    };
  },
  proverka: ({ S, p }) => zapisQ(plus(q(S), minus(q(S), umn(q(S), pr(p))))),
});

const P26 = prototip({
  id: 'P26',
  gruppa: 'C',
  title: 'Два набора со скидкой',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Набор полотенец, который стоил ${razr(S)} рублей, продаётся со скидкой ${p}%. Сколько рублей стоят два набора полотенец со скидкой?`,
  solve: ({ S, p }) =>
    izmenenie({
      S,
      p,
      vverh: false,
      tseloe: 'цену одного набора',
      izm: 'скидку',
      shtuk: 2,
      shtukSlovo: 'Наборов',
    }),
  proverka: ({ S, p }) => posleIzmeneniya(S, p, false, 2),
});

const P27 = prototip({
  id: 'P27',
  gruppa: 'C',
  title: 'Скидка на тетради',
  polya: ['c', 'n', 'g', 'p'],
  text: ({ c, n, g, p }) =>
    `Тетрадь стоит ${sChislom(c, RUBL)}. Сколько рублей заплатит покупатель за ${n} тетрадей, если при покупке более ${g} тетрадей магазин делает скидку ${p}% от стоимости всей покупки?`,
  solve: ({ c, n, g, p }) =>
    izmenenie({
      S: c * n,
      p,
      vverh: false,
      tseloe: 'стоимость покупки без скидки',
      izm: 'скидку',
      pered: [
        {
          title: 'Стоимость без скидки',
          lines: [
            `Тетрадей $${n}$ — больше $${g}$, значит, скидка положена.`,
            `Без скидки: $${c} \\cdot ${n} = ${c * n}$ руб.`,
          ],
        },
      ],
      hintsPered: [
        vopros(
          'Сколько стоит покупка без скидки?',
          `$${c * n}$`,
          [`$${c * g}$`, `$${c * (n - g)}$`],
          n,
          'Скидка — от стоимости всей покупки: цену тетради умножаем на число тетрадей.',
        ),
      ],
    }),
  proverka({ c, n, g, p }) {
    if (n <= g) throw new Error('тетради: скидки нет');
    /* Скидку даём на каждую тетрадь — итог тот же. */
    return zapisQ(umn(minus(q(c), umn(q(c), pr(p))), q(n)));
  },
});

/** Два изменения цены подряд. */
function dvaIzmeneniya(o: {
  S: number;
  p1: number;
  p2: number;
  vverh: boolean;
  /** «первого снижения», «подорожания в октябре». */
  posle1: string;
  shag1: string;
  shag2: string;
}): Resheno {
  const { S, p1, p2, vverh } = o;
  const z = vverh ? 1 : -1;
  const k1 = 100 + z * p1;
  const k2 = 100 + z * p2;
  const c1 = zapis(S * k1, 100);
  const otvet = zapis(S * k1 * k2, 10000);
  const znak = vverh ? '+' : '-';
  return {
    otvet,
    etapy: [
      {
        title: o.shag1,
        lines: [
          `За $100\\%$ — начальная цена $${S}$ руб. Новая цена — $100\\% ${znak} ${p1}\\% = ${k1}\\%$ от неё: $${S} \\cdot ${T(k1, 100)} = ${tex(c1)}$ руб.`,
        ],
      },
      itog(
        o.shag2,
        [
          `Теперь за $100\\%$ — цена после ${o.posle1}, $${tex(c1)}$ руб. Новая цена — $100\\% ${znak} ${p2}\\% = ${k2}\\%$ от неё: $${tex(c1)} \\cdot ${T(k2, 100)} = ${tex(otvet)}$ руб.`,
        ],
        otvet,
      ),
    ],
    hints: [
      vopros(
        'От какой цены считают второе изменение?',
        `От цены после ${o.posle1}`,
        ['От начальной цены', 'От суммы двух изменений'],
        S + p1,
        'Каждое следующее изменение считают от уже изменённой цены.',
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [fm(Tili(S * (100 + z * (p1 + p2)), 100)), `$${tex(c1)}$`],
        p2,
        `Проценты нельзя просто сложить: $${p1}\\% ${znak} ${p2}\\%$ даст другой ответ.`,
      ),
    ],
  };
}

const P28 = prototip({
  id: 'P28',
  gruppa: 'C',
  title: 'Два снижения цены',
  polya: ['S', 'p1', 'p2'],
  text: ({ S, p1, p2 }) =>
    `В период распродажи магазин снижал цены дважды: в первый раз на ${p1}%, во второй – на ${p2}%. Сколько рублей стал стоить чайник после второго снижения цен, если до начала распродажи он стоил ${razr(S)} рублей?`,
  solve: ({ S, p1, p2 }) =>
    dvaIzmeneniya({
      S,
      p1,
      p2,
      vverh: false,
      posle1: 'первого снижения',
      shag1: 'Первое снижение',
      shag2: 'Второе снижение',
    }),
  proverka({ S, p1, p2 }) {
    const c1 = minus(q(S), umn(q(S), pr(p1)));
    return zapisQ(minus(c1, umn(c1, pr(p2))));
  },
});

const YAGODY = [
  { kg: 'винограда', im: 'виноград', podor: 'подорожал' },
  { kg: 'клубники', im: 'клубника', podor: 'подорожала' },
] as const;

const P29 = prototip({
  id: 'P29',
  gruppa: 'C',
  title: 'Два подорожания',
  polya: ['f', 'S', 'p1', 'p2'],
  text({ f, S, p1, p2 }) {
    const y = YAGODY[f] ?? YAGODY[0];
    return `В сентябре 1 кг ${y.kg} стоил ${razr(S)} рублей, в октябре ${y.im} ${y.podor} на ${p1}%, а в ноябре – ещё на ${p2}%. Сколько рублей стоил 1 кг ${y.kg} после подорожания в ноябре?`;
  },
  solve: ({ S, p1, p2 }) =>
    dvaIzmeneniya({
      S,
      p1,
      p2,
      vverh: true,
      posle1: 'октябрьского подорожания',
      shag1: 'Октябрь',
      shag2: 'Ноябрь',
    }),
  proverka({ S, p1, p2 }) {
    const c1 = plus(q(S), umn(q(S), pr(p1)));
    return zapisQ(plus(c1, umn(c1, pr(p2))));
  },
});

/* ════ D. Целое по части и «на сколько процентов» ═══════════════ */

/** Целое, если k — это p %: k / (p/100) точными дробями. */
const tseloeQ = (k: number, p: number): string => zapisQ(del(q(k), pr(p)));

const P30 = prototip({
  id: 'P30',
  gruppa: 'D',
  title: 'Изучают французский',
  polya: ['k', 'p'],
  text: ({ k, p }) =>
    `В школе французский язык изучают ${k} учащихся, что составляет ${p}% от числа всех учащихся школы. Сколько учащихся в школе?`,
  solve: ({ k, p }) =>
    tseloePoChasti({ k, p, chast: 'Изучающие французский', tseloe: 'всех учащихся школы' }),
  proverka: ({ k, p }) => tseloeQ(k, p),
});

const OLIMPIADA = [
  ['стали', 'учащихся'],
  ['стали', 'учеников'],
  ['стало', 'учеников'],
] as const;

const P31 = prototip({
  id: 'P31',
  gruppa: 'D',
  title: 'Призёры олимпиады',
  polya: ['v', 'k', 'p'],
  text({ v, k, p }) {
    const [st, uch] = OLIMPIADA[v] ?? OLIMPIADA[0];
    return `Призёрами городской олимпиады по математике ${st} ${k} ${uch}, что составило ${p}% от числа участников. Сколько человек участвовало в олимпиаде?`;
  },
  solve: ({ k, p }) =>
    tseloePoChasti({ k, p, chast: 'Призёры', tseloe: 'всех участников олимпиады' }),
  proverka: ({ k, p }) => tseloeQ(k, p),
});

const P32 = prototip({
  id: 'P32',
  gruppa: 'D',
  title: 'Выпускники в технические вузы',
  polya: ['vse', 'k', 'p'],
  text: ({ vse, k, p }) =>
    `В технических вузах собираются учиться ${sChislom(k, VYPUSKNIK)} школы. Они составляют ${p}% от числа ${vse === 1 ? 'всех ' : ''}выпускников. Сколько в школе выпускников?`,
  solve: ({ k, p }) =>
    tseloePoChasti({
      k,
      p,
      chast: 'Будущие студенты технических вузов',
      tseloe: 'всех выпускников школы',
    }),
  proverka: ({ k, p }) => tseloeQ(k, p),
});

/** Прежняя цена по новой: новая — это (100 ± p) % прежней. */
function prezhnyaya(o: {
  S: number;
  p: number;
  vverh: boolean;
  novaya: string;
  tseloe: string;
  izm: string;
}): Resheno {
  const { S, p, vverh } = o;
  const k = vverh ? 100 + p : 100 - p;
  return tseloePoChasti({
    k: S,
    p: k,
    chast: o.novaya,
    tseloe: o.tseloe,
    pered: [
      {
        title: 'Сколько процентов составляет новая сумма',
        lines: [
          `${o.izm} на $${p}\\%$: новая сумма — $100\\% ${vverh ? '+' : '-'} ${p}\\% = ${k}\\%$ прежней.`,
        ],
      },
    ],
  });
}

const P33 = prototip({
  id: 'P33',
  gruppa: 'D',
  title: 'Цена до уценки',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Товар на распродаже уценили на ${p}%, при этом он стал стоить ${sChislom(S, RUBL)}. Сколько рублей стоил товар до распродажи?`,
  solve: ({ S, p }) =>
    prezhnyaya({
      S,
      p,
      vverh: false,
      novaya: 'Новая цена',
      tseloe: 'цену до распродажи',
      izm: 'Уценили',
    }),
  proverka: ({ S, p }) => zapisQ(del(q(S), minus(q(1), pr(p)))),
});

const P34 = prototip({
  id: 'P34',
  gruppa: 'D',
  title: 'Зарплата до налога',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Налог на доходы составляет ${p}% от заработной платы. После удержания налога на доходы Мария Константиновна получила ${S} рублей. Сколько рублей составляет заработная плата Марии Константиновны?`,
  solve: ({ S, p }) =>
    prezhnyaya({
      S,
      p,
      vverh: false,
      novaya: 'Полученная сумма',
      tseloe: 'всю заработную плату',
      izm: 'Удержали налог',
    }),
  proverka: ({ S, p }) => zapisQ(del(q(S), minus(q(1), pr(p)))),
});

const P35 = prototip({
  id: 'P35',
  gruppa: 'D',
  title: 'Цена до повышения',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Цена на электрический чайник была повышена на ${p}% и составила ${razr(S)} ${slovo(S, RUBL)}. Сколько рублей стоил чайник до повышения цены?`,
  solve: ({ S, p }) =>
    prezhnyaya({
      S,
      p,
      vverh: true,
      novaya: 'Новая цена',
      tseloe: 'цену до повышения',
      izm: 'Цену повысили',
    }),
  proverka: ({ S, p }) => zapisQ(del(q(S), plus(q(1), pr(p)))),
});

/** «На сколько процентов»: отношение стало/было точными дробями. */
const naSkolkoQ = (bylo: number, stalo: number): string => vProcentah(q(bylo), q(stalo));

const P36 = prototip({
  id: 'P36',
  gruppa: 'D',
  title: 'Рост числа абонентов',
  polya: ['firm', 'a', 'b'],
  text: ({ firm, a, b }) =>
    `В начале года число абонентов телефонной компании «${firm === 1 ? 'Запад' : 'Восток'}» составляло ${a} тыс. человек, а в конце года их стало ${b} тыс. человек. На сколько процентов увеличилось за год число абонентов этой компании?`,
  solve: ({ a, b }) => naSkolkoProcentov({ bylo: a, stalo: b, chto: 'число абонентов (тыс.)' }),
  proverka: ({ a, b }) => naSkolkoQ(a, b),
});

const P37 = prototip({
  id: 'P37',
  gruppa: 'D',
  title: 'Рост числа учащихся',
  polya: ['a', 'b'],
  text: ({ a, b }) =>
    `В начале учебного года в школе было ${a} учащихся, а к концу года их стало ${b}. На сколько процентов увеличилось за учебный год число учащихся?`,
  solve: ({ a, b }) => naSkolkoProcentov({ bylo: a, stalo: b, chto: 'число учащихся' }),
  proverka: ({ a, b }) => naSkolkoQ(a, b),
});

const MESYATSY = [
  { m1: 'апреле', m2: 'мае', s: 'апреля', po: 'май', cena: 'мобильного телефона' },
  { m1: 'апреле', m2: 'августе', s: 'апреля', po: 'август', cena: 'на мобильный телефон' },
  { m1: 'сентябре', m2: 'октябре', s: 'сентября', po: 'октябрь', cena: 'мобильного телефона' },
  { m1: 'феврале', m2: 'июне', s: 'февраля', po: 'июнь', cena: 'мобильного телефона' },
] as const;

const P38 = prototip({
  id: 'P38',
  gruppa: 'D',
  title: 'Снижение цены телефона',
  polya: ['v', 'a', 'b'],
  text({ v, a, b }) {
    const m = MESYATSY[v] ?? MESYATSY[0];
    return `Поступивший в продажу в ${m.m1} мобильный телефон стоил ${razr(a)} рублей. В ${m.m2} он стал стоить ${razr(b)} ${slovo(b, RUBL)}. На сколько процентов снизилась цена ${m.cena} в период с ${m.s} по ${m.po}?`;
  },
  solve: ({ a, b }) => naSkolkoProcentov({ bylo: a, stalo: b, chto: 'цена телефона' }),
  proverka: ({ a, b }) => naSkolkoQ(a, b),
});

const P39 = prototip({
  id: 'P39',
  gruppa: 'D',
  title: 'Футболка подорожала',
  polya: ['a', 'b'],
  text: ({ a, b }) =>
    `Футболка стоила ${a} рублей. После повышения цены она стала стоить ${sChislom(b, RUBL)}. На сколько процентов была повышена цена футболки?`,
  solve: ({ a, b }) => naSkolkoProcentov({ bylo: a, stalo: b, chto: 'цена футболки' }),
  proverka: ({ a, b }) => naSkolkoQ(a, b),
});

const P40 = prototip({
  id: 'P40',
  gruppa: 'D',
  title: 'Футболка подешевела',
  polya: ['a', 'b'],
  text: ({ a, b }) =>
    `Футболка стоила ${a} рублей. После снижения цены она стала стоить ${sChislom(b, RUBL)}. На сколько процентов была снижена цена футболки?`,
  solve: ({ a, b }) => naSkolkoProcentov({ bylo: a, stalo: b, chto: 'цена футболки' }),
  proverka: ({ a, b }) => naSkolkoQ(a, b),
});

const TOVARY = [
  { im: 'Батон хлеба', za: 'него' },
  { im: 'Десяток яиц', za: 'них' },
  { im: 'Пакет сока', za: 'него' },
] as const;

const P41 = prototip({
  id: 'P41',
  gruppa: 'D',
  title: 'Скидка пенсионеру: рубли и копейки',
  polya: ['t', 'P', 'kop'],
  text({ t, P, kop }) {
    const tov = TOVARY[t] ?? TOVARY[0];
    const r = Math.floor(kop / 100);
    return `Магазин делает пенсионерам скидку. ${tov.im} стоит в магазине ${sChislom(P, RUBL)}, а пенсионер заплатил за ${tov.za} ${sChislom(r, RUBL)} ${sChislom(kop % 100, KOPEYKA)}. Сколько процентов составила скидка для пенсионера?`;
  },
  solve({ P, kop }) {
    const zaplatil = T(kop, 100);
    const skidka = P * 100 - kop;
    const otvet = zapis(skidka, P);
    return {
      otvet,
      etapy: [
        {
          title: 'Что принимаем за 100 %',
          lines: [
            `Цена в магазине $${P}$ руб. — это $100\\%$. Пенсионер заплатил $${zaplatil}$ руб. (копейки — сотые доли рубля).`,
          ],
        },
        {
          title: 'Скидка в рублях',
          lines: [`$${P} - ${zaplatil} = ${T(skidka, 100)}$ руб.`],
        },
        itog(
          'Скидка в процентах',
          [`$\\dfrac{${T(skidka, 100)}}{${P}} \\cdot 100\\% = ${tex(otvet)}\\%$.`],
          otvet,
        ),
      ],
      hints: [
        vopros(
          'Что принимаем за 100 %?',
          'Цену в магазине',
          ['Сумму, которую заплатил пенсионер', 'Размер скидки'],
          P,
        ),
        vopros(
          'Сколько рублей составила скидка?',
          `$${T(skidka, 100)}$`,
          [`$${zaplatil}$`, fm(Tili(skidka, 10)), fm(Tili(skidka))],
          kop,
          `${Math.floor(kop / 100)} руб. ${kop % 100} коп. — это $${zaplatil}$ руб.`,
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [fm(Tili(kop, P)), fm(Tili(skidka, 100))],
          skidka,
          'Скидку в рублях делим на цену в магазине и умножаем на 100 %.',
        ),
      ],
    };
  },
  proverka: ({ P, kop }) => naSkolkoQ(P * 100, kop),
});

function dolyaOtStarogo(o: { k100: number; staroe: string; novoe: string }): Resheno {
  const { k100 } = o;
  const otvet = zapis(100 - k100, 1);
  return {
    otvet,
    etapy: [
      {
        title: 'Что принимаем за 100 %',
        lines: [`${o.staroe} — это $1$, то есть $100\\%$.`],
      },
      {
        title: 'Новое в процентах',
        lines: [
          `${o.novoe} — $${T(k100, 100)}$ от него: $${T(k100, 100)} \\cdot 100\\% = ${k100}\\%$.`,
        ],
      },
      itog('На сколько уменьшилось', [`$100\\% - ${k100}\\% = ${tex(otvet)}\\%$.`], otvet),
    ],
    hints: [
      vopros(
        `Сколько процентов составляет $${T(k100, 100)}$?`,
        `$${k100}\\%$`,
        [`$${T(k100, 100)}\\%$`, `$${T(k100, 10)}\\%$`],
        k100,
        'Умножаем на 100 %.',
      ),
      vopros(
        'Какой получится ответ?',
        `$${tex(otvet)}$`,
        [`$${k100}$`, `$${T(100 - k100, 100)}$`],
        k100 + 1,
        'Спрашивают, на сколько уменьшилось: из 100 % вычитаем то, что стало.',
      ),
    ],
  };
}

const P42 = prototip({
  id: 'P42',
  gruppa: 'D',
  title: 'Уценка телевизора',
  polya: ['k100'],
  text: ({ k100 }) =>
    `После уценки телевизора его новая цена составила ${zapis(k100, 100)} от старой цены. На сколько процентов уменьшилась цена телевизора в результате уценки?`,
  solve: ({ k100 }) => dolyaOtStarogo({ k100, staroe: 'Старая цена', novoe: 'Новая цена' }),
  proverka: ({ k100 }) => naSkolkoQ(100, k100),
});

const P43 = prototip({
  id: 'P43',
  gruppa: 'D',
  title: 'ДТП летом и зимой',
  polya: ['k100'],
  text: ({ k100 }) =>
    `Число дорожно-транспортных происшествий (ДТП) в летний период составило ${zapis(k100, 100)} числа ДТП в зимний период. На сколько процентов уменьшилось число дорожно-транспортных происшествий летом по сравнению с зимой?`,
  solve: ({ k100 }) =>
    dolyaOtStarogo({ k100, staroe: 'Число ДТП зимой', novoe: 'Число ДТП летом' }),
  proverka: ({ k100 }) => naSkolkoQ(100, k100),
});

/* ════ E. В несколько действий ═══════════════════════════════════ */

const SHKOLA = [
  { im: 'девочки', rod: 'девочек', drIm: 'мальчики', drRod: 'мальчиков' },
  { im: 'мальчики', rod: 'мальчиков', drIm: 'девочки', drRod: 'девочек' },
] as const;

/** Разница групп в процентах — это d человек. */
function raznitsa(
  kto: number,
  p: number,
  d: number,
): { etapy: Etap[]; hint: ReturnType<typeof vopros> } {
  const s = SHKOLA[kto] ?? SHKOLA[0];
  const r = 2 * p - 100;
  return {
    etapy: [
      {
        title: 'Доли в процентах',
        lines: [
          `Все учащиеся — $100\\%$. ${s.im[0]?.toUpperCase()}${s.im.slice(1)} — $${p}\\%$, ${s.drIm} — $100\\% - ${p}\\% = ${100 - p}\\%$.`,
          `Разница: $${p}\\% - ${100 - p}\\% = ${r}\\%$ — это $${d}$ ${slovo(d, CHELOVEK)}.`,
        ],
      },
    ],
    hint: vopros(
      'Сколько процентов всех учащихся составляет разница?',
      `$${r}\\%$`,
      [`$${p}\\%$`, `$${100 - p}\\%$`],
      d,
      `${s.drIm[0]?.toUpperCase()}${s.drIm.slice(1)} — $${100 - p}\\%$, разница — $${p}\\% - ${100 - p}\\%$.`,
    ),
  };
}

/** Перебор числа учащихся: целые группы, разница d. */
function shkolaPerebor(p: number, d: number): number {
  for (let n = 1; n <= 100000; n += 1) {
    if ((n * p) % 100 !== 0) continue;
    const bolshe = (n * p) / 100;
    if (bolshe - (n - bolshe) === d) return n;
  }
  throw new Error('школа: не нашлось');
}

function shkolaVsego(kto: number, p: number, d: number): Resheno {
  const { etapy, hint } = raznitsa(kto, p, d);
  return tseloePoChasti({
    k: d,
    p: 2 * p - 100,
    chast: 'Разница',
    tseloe: 'всех учащихся школы',
    pered: etapy,
    hintsPered: [hint],
  });
}

const P44 = prototip({
  id: 'P44',
  gruppa: 'E',
  title: 'Школа: «на … меньше»',
  polya: ['kto', 'p', 'd'],
  text({ kto, p, d }) {
    const s = SHKOLA[kto] ?? SHKOLA[0];
    return `В школе ${s.im} составляют ${p}% числа всех учащихся. Сколько в этой школе всего учащихся, если ${s.drRod} в ней на ${sChislom(d, CHELOVEK)} меньше, чем ${s.rod}?`;
  },
  solve: ({ kto, p, d }) => shkolaVsego(kto, p, d),
  proverka: ({ p, d }) => tseloe(shkolaPerebor(p, d), 'учащихся'),
});

const P45 = prototip({
  id: 'P45',
  gruppa: 'E',
  title: 'Школа: «на … больше»',
  polya: ['kto', 'p', 'd'],
  text({ kto, p, d }) {
    const s = SHKOLA[kto] ?? SHKOLA[0];
    return `В школе ${s.im} составляют ${p}% числа всех учащихся. Сколько в этой школе всего учащихся, если ${s.rod} в ней на ${sChislom(d, CHELOVEK)} больше, чем ${s.drRod}?`;
  },
  solve: ({ kto, p, d }) => shkolaVsego(kto, p, d),
  proverka: ({ p, d }) => tseloe(shkolaPerebor(p, d), 'учащихся'),
});

const P46 = prototip({
  id: 'P46',
  gruppa: 'E',
  title: 'Школа: сколько девочек или мальчиков',
  polya: ['kto', 'p', 'd'],
  text({ kto, p, d }) {
    const s = SHKOLA[kto] ?? SHKOLA[0];
    return `В школе ${s.im} составляют ${p}% числа всех учащихся. Сколько в этой школе ${s.rod}, если их на ${sChislom(d, CHELOVEK)} больше, чем ${s.drRod}?`;
  },
  solve({ kto, p, d }) {
    const s = SHKOLA[kto] ?? SHKOLA[0];
    const { etapy, hint } = raznitsa(kto, p, d);
    const r = 2 * p - 100;
    const vsego = zapis(d * 100, r);
    const otvet = zapis(d * p, r);
    return {
      otvet,
      etapy: [
        ...etapy,
        {
          title: 'Все учащиеся',
          lines: [
            `$1\\% = ${d} : ${r} = ${T(d, r)}$, все учащиеся: $${T(d, r)} \\cdot 100 = ${tex(vsego)}$.`,
          ],
        },
        itog(
          `Сколько ${s.rod}`,
          [`$${p}\\%$ от $${tex(vsego)}$: $${T(d, r)} \\cdot ${p} = ${tex(otvet)}$.`],
          otvet,
        ),
      ],
      hints: [
        hint,
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${tex(vsego)}$`, fm(Tili(d * (100 - p), r))],
          p,
          `Спрашивают не всех учащихся, а только ${s.rod}: это $${p}\\%$ от всех.`,
        ),
      ],
    };
  },
  proverka: ({ p, d }) => zapisQ(umn(q(shkolaPerebor(p, d)), pr(p))),
});

const P47 = prototip({
  id: 'P47',
  gruppa: 'E',
  title: 'Мужской костюм',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `Мужской костюм состоит из брюк, жилета и пиджака. Пиджак дороже брюк на ${p} %, а жилет дешевле брюк на ${p} %. Сколько стоит мужской костюм, если брюки стоят ${S} рублей? Ответ дайте в рублях.`,
  solve({ S, p }) {
    const pidzhak = zapis(S * (100 + p), 100);
    const zhilet = zapis(S * (100 - p), 100);
    const otvet = zapis(3 * S, 1);
    return {
      otvet,
      etapy: [
        { title: 'Что принимаем за 100 %', lines: [`Цену брюк: $${S}$ руб.`] },
        {
          title: 'Пиджак и жилет',
          lines: [
            `Пиджак — $${100 + p}\\%$ цены брюк: $${S} \\cdot ${T(100 + p, 100)} = ${tex(pidzhak)}$ руб.`,
            `Жилет — $${100 - p}\\%$: $${S} \\cdot ${T(100 - p, 100)} = ${tex(zhilet)}$ руб.`,
          ],
        },
        itog(
          'Весь костюм',
          [`$${S} + ${tex(pidzhak)} + ${tex(zhilet)} = ${tex(otvet)}$ руб.`],
          otvet,
        ),
      ],
      hints: [
        vopros(
          'Сколько стоит пиджак?',
          `$${tex(pidzhak)}$`,
          [fm(Tili(S * p, 100)), `$${tex(zhilet)}$`],
          S,
          `Дороже на $${p}\\%$ — значит, $100\\% + ${p}\\%$ цены брюк.`,
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${2 * S}$`, fm(Tili(S * (300 + p), 100))],
          p,
          'Складываем все три вещи: брюки, пиджак и жилет.',
        ),
      ],
    };
  },
  proverka({ S, p }) {
    const bryuki = q(S);
    const pidzhak = plus(bryuki, umn(bryuki, pr(p)));
    const zhilet = minus(bryuki, umn(bryuki, pr(p)));
    return zapisQ(plus(plus(bryuki, pidzhak), zhilet));
  },
});

const P48 = prototip({
  id: 'P48',
  gruppa: 'E',
  title: 'Три сумки со скидкой',
  polya: ['S', 'p'],
  text: ({ S, p }) =>
    `В магазине дизайнерских сумок проходит акция. При покупке одновременно трёх сумок: большой, средней и маленькой, можно получить скидку ${p} % на каждую. Маленькая сумка стоит ${S} рублей, цена средней сумки в 1,5 раза больше цены маленькой сумки, а цена большой сумки в 1,5 раза больше цены средней. Сколько будут стоить три сумки со скидкой? Ответ дайте в рублях.`,
  solve({ S, p }) {
    const sred = zapis(3 * S, 2);
    const bol = zapis(9 * S, 4);
    const bez = zapis(19 * S, 4);
    const otvet = zapis(19 * S * (100 - p), 400);
    return {
      otvet,
      etapy: [
        {
          title: 'Цены без скидки',
          lines: [
            `Средняя: $${S} \\cdot 1{,}5 = ${tex(sred)}$ руб., большая: $${tex(sred)} \\cdot 1{,}5 = ${tex(bol)}$ руб.`,
            `Все три: $${S} + ${tex(sred)} + ${tex(bol)} = ${tex(bez)}$ руб.`,
          ],
        },
        {
          title: 'Скидка',
          lines: [
            `Скидка $${p}\\%$ на каждую — значит, на всю покупку: платим $100\\% - ${p}\\% = ${100 - p}\\%$.`,
          ],
        },
        itog('Со скидкой', [`$${tex(bez)} \\cdot ${T(100 - p, 100)} = ${tex(otvet)}$ руб.`], otvet),
      ],
      hints: [
        vopros(
          'Сколько стоит большая сумка без скидки?',
          `$${tex(bol)}$`,
          [`$${tex(sred)}$`, fm(Tili(3 * S))],
          S,
          'Большая в 1,5 раза дороже средней, а не маленькой.',
        ),
        vopros(
          'Какой получится ответ?',
          `$${tex(otvet)}$`,
          [`$${tex(bez)}$`, fm(Tili(19 * S * p, 400))],
          p,
          'Нужна стоимость со скидкой, а не размер скидки.',
        ),
      ],
    };
  },
  proverka({ S, p }) {
    const k = q(3, 2);
    const ceny = [q(S), umn(q(S), k), umn(umn(q(S), k), k)];
    return zapisQ(ceny.reduce((s, c) => plus(s, minus(c, umn(c, pr(p)))), q(0)));
  },
});

export const PROTOTIPY_15: Prototip[] = [
  P01,
  P02,
  P03,
  P04,
  P05,
  P06,
  P07,
  P08,
  P09,
  P10,
  P11,
  P12,
  P13,
  P14,
  P15,
  P16,
  P17,
  P18,
  P19,
  P20,
  P21,
  P22,
  P23,
  P24,
  P25,
  P26,
  P27,
  P28,
  P29,
  P30,
  P31,
  P32,
  P33,
  P34,
  P35,
  P36,
  P37,
  P38,
  P39,
  P40,
  P41,
  P42,
  P43,
  P44,
  P45,
  P46,
  P47,
  P48,
];

/** Все задачи прототипа (параметры по порядку analogi.ts) — для сверки с ключом. */
export function vseParametry15(id: string): Params[] {
  const polya = POLYA[id];
  if (polya === undefined) throw new Error(`нет полей ${id}`);
  return stroki(id).map((row) => vParametry(polya, row));
}
