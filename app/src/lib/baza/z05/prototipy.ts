/**
 * База, задание №5 «Теория вероятностей»: прототипы задач.
 *
 * Одиннадцать типов — те, что встречаются в №5 базового ЕГЭ: доля
 * (классическое определение), противоположное событие, сумма
 * несовместных и произведение независимых событий. Числа подбирает
 * генератор; тексты — свои, не копии задач открытого банка.
 *
 * Вероятность считается в целых (подходящих исходов и всех исходов),
 * в запись бланка переводится делением в столбик (lib/baza/chisla.ts).
 * Генератор берёт только такие числа, при которых ответ — конечная
 * десятичная дробь: в №5 базы ответ не округляют.
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { konechna, slovo, sotye, tex, texDrob, zapis } from '../chisla';
import type { GruppaBazy, HintStep, Params, Prototip, Resheno } from '../types';

export const GRUPPY_05: GruppaBazy[] = [
  { id: 'A', nazvanie: 'Классическая вероятность', znak: '\\dfrac{m}{n}', ton: 'blue' },
  { id: 'B', nazvanie: 'Противоположное событие', znak: '1-p', ton: 'orange' },
  { id: 'C', nazvanie: 'Сумма и произведение', znak: 'p_1 p_2', ton: 'green' },
];

const num = (p: Params, key: string): number => {
  const v = p[key];
  if (typeof v !== 'number') throw new Error(`нет числа ${key}`);
  return v;
};

/** Подобрать числа: повторять, пока условие не выполнится. */
function podobrat<T>(_rng: Rng, shag: () => T, goditsya: (x: T) => boolean): T {
  for (let i = 0; i < 500; i += 1) {
    const x = shag();
    if (goditsya(x)) return x;
  }
  throw new Error('числа не подобрались');
}

/**
 * Подсказка-вопрос: верный вариант и отвлекающие. Повторы отвлекающих
 * убираются, место верного ответа зависит от sdvig — оно разное у
 * разных задач, но одно и то же при пересборке.
 */
function vopros(
  question: string,
  verno: string,
  drugie: string[],
  sdvig: number,
  comment?: string,
): HintStep {
  const prochie = [...new Set(drugie)].filter((d) => d !== verno).slice(0, 2);
  const mesto = prochie.length === 0 ? 0 : sdvig % (prochie.length + 1);
  const options = [...prochie.slice(0, mesto), verno, ...prochie.slice(mesto)];
  return { question, options, correct: mesto, ...(comment === undefined ? {} : { comment }) };
}

/** Разбор задачи на долю: m подходящих исходов из n. */
function dolya(o: {
  vsego: number;
  podhodit: number;
  chtoVsego: string;
  chtoPodhodit: string;
  kakNashli?: string;
  lovushka: number;
}): Resheno {
  const { vsego: n, podhodit: m } = o;
  const otvet = zapis(m, n);
  return {
    otvet,
    etapy: [
      { title: 'Все исходы', lines: [`${o.chtoVsego}: $n = ${n}$. Все исходы равновозможны.`] },
      {
        title: 'Подходящие исходы',
        lines: [
          ...(o.kakNashli === undefined ? [] : [o.kakNashli]),
          `${o.chtoPodhodit}: $m = ${m}$.`,
        ],
      },
      {
        title: 'Вероятность',
        lines: [`$P = \\dfrac{m}{n} = \\dfrac{${m}}{${n}} = ${tex(otvet)}$.`],
      },
    ],
    hints: [
      vopros(
        'Сколько всего равновозможных исходов?',
        String(n),
        [String(o.lovushka), String(m)],
        n,
        o.chtoVsego + '.',
      ),
      vopros(
        'Сколько исходов подходит?',
        String(m),
        [String(o.lovushka), String(n)],
        m + 1,
        o.chtoPodhodit + '.',
      ),
      vopros(
        'Как найти вероятность?',
        `$\\dfrac{${m}}{${n}}$`,
        [`$\\dfrac{${n}}{${m}}$`, `$\\dfrac{${o.lovushka}}{${n}}$`],
        n + m,
        'Подходящие исходы делим на все.',
      ),
    ],
  };
}

/* ── P01. Изделия с дефектом ─────────────────────────────────── */

const IZDELIYA = [
  {
    iz: 'садовых насосов, поступивших в продажу,',
    def: 'подтекают',
    vopros: 'один случайно выбранный для контроля насос не подтекает',
    odno: 'насос',
  },
  {
    iz: 'сумок, которые выпускает фабрика,',
    def: 'имеют скрытые дефекты',
    vopros: 'купленная сумка окажется без скрытых дефектов',
    odno: 'сумка',
  },
  {
    iz: 'карманных фонариков, поступивших в магазин,',
    def: 'неисправны',
    vopros: 'выбранный наудачу в магазине фонарик окажется исправным',
    odno: 'фонарик',
  },
  {
    iz: 'аккумуляторов, поступивших в продажу,',
    def: 'не заряжены',
    vopros: 'купленный аккумулятор окажется заряженным',
    odno: 'аккумулятор',
  },
] as const;

const P01: Prototip = {
  id: 'P01',
  gruppa: 'A',
  title: 'Изделия с дефектом',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const { n, k } = podobrat(
      rng,
      () => ({ n: rng.pick([50, 80, 100, 125, 150, 200, 250, 400, 500]), k: rng.int(2, 30) }),
      ({ n, k }) => k % 10 !== 1 && k * 4 <= n && konechna(n - k, n),
    );
    return { n, k, v: rng.int(0, IZDELIYA.length - 1) };
  },
  text(p) {
    const t = IZDELIYA[num(p, 'v')];
    if (t === undefined) throw new Error('нет сюжета');
    return `В среднем из ${num(p, 'n')} ${t.iz} ${num(p, 'k')} ${t.def}. Найдите вероятность того, что ${t.vopros}.`;
  },
  solve(p) {
    const n = num(p, 'n');
    const k = num(p, 'k');
    return dolya({
      vsego: n,
      podhodit: n - k,
      chtoVsego: 'Всего изделий',
      chtoPodhodit: 'Изделий без дефекта',
      kakNashli: `Спрашивают про изделие без дефекта. Таких $${n} - ${k} = ${n - k}$.`,
      lovushka: k,
    });
  },
  proverka(p) {
    const izdeliya = Array.from({ length: num(p, 'n') }, (_, i) => i < num(p, 'k'));
    return zapis(izdeliya.filter((defekt) => !defekt).length, izdeliya.length);
  },
};

/* ── P02. Экзаменационные билеты ─────────────────────────────── */

const BILETY = [
  ['биологии', 'Членистоногие'],
  ['химии', 'Кислоты'],
  ['физике', 'Оптика'],
  ['географии', 'Реки и озёра'],
  ['истории', 'Древний мир'],
  ['математике', 'Неравенства'],
] as const;

const P02: Prototip = {
  id: 'P02',
  gruppa: 'A',
  title: 'Экзаменационные билеты',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const { n, k } = podobrat(
      rng,
      () => ({ n: rng.pick([20, 25, 40, 50]), k: rng.int(2, 24) }),
      ({ n, k }) => k * 2 < n && konechna(k, n),
    );
    return { n, k, ne: rng.int(0, 1), v: rng.int(0, BILETY.length - 1) };
  },
  text(p) {
    const [predmet, tema] = BILETY[num(p, 'v')] ?? BILETY[0];
    const ne = num(p, 'ne') === 1 ? 'не достанется вопроса' : 'достанется вопрос';
    return `В сборнике билетов по ${predmet} всего ${num(p, 'n')} билетов, в ${num(p, 'k')} из них встречается вопрос по теме «${tema}». Найдите вероятность того, что в случайно выбранном на экзамене билете школьнику ${ne} по теме «${tema}».`;
  },
  solve(p) {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const ne = num(p, 'ne') === 1;
    return dolya({
      vsego: n,
      podhodit: ne ? n - k : k,
      chtoVsego: 'Всего билетов',
      chtoPodhodit: ne ? 'Билетов без вопроса по теме' : 'Билетов с вопросом по теме',
      ...(ne ? { kakNashli: `Нужны билеты без этого вопроса. Их $${n} - ${k} = ${n - k}$.` } : {}),
      lovushka: ne ? k : n - k,
    });
  },
  proverka(p) {
    const bilety = Array.from({ length: num(p, 'n') }, (_, i) => i < num(p, 'k'));
    const nuzhny = bilety.filter((sTemoy) => sTemoy === (num(p, 'ne') === 0)).length;
    return zapis(nuzhny, bilety.length);
  },
};

/* ── P03. Жеребьёвка спортсменов ─────────────────────────────── */

const SPORT = ['толканию ядра', 'прыжкам в воду', 'метанию копья', 'гимнастике'] as const;
const STRANY = [
  ['Финляндии', 'Дании', 'Швеции', 'Норвегии'],
  ['Сербии', 'Хорватии', 'Словении', 'Чехии'],
  ['Аргентины', 'Бразилии', 'Парагвая', 'Уругвая'],
  ['Китая', 'Японии', 'Кореи', 'Индии'],
] as const;
const MESTO = ['первым', 'последним'] as const;
const SPORTSMEN = ['спортсмен', 'спортсмена', 'спортсменов'] as const;

const P03: Prototip = {
  id: 'P03',
  gruppa: 'A',
  title: 'Жеребьёвка спортсменов',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const sostav = podobrat(
      rng,
      () => {
        const n = rng.pick([20, 25, 40, 50]);
        const a = rng.int(3, 12);
        const b = rng.int(3, 12);
        const c = rng.int(3, 12);
        return { a, b, c, d: n - a - b - c, kto: rng.int(0, 3) };
      },
      ({ a, b, c, d, kto }) => {
        const vse = [a, b, c, d];
        return d >= 3 && new Set(vse).size === 4 && konechna(vse[kto] ?? 1, a + b + c + d);
      },
    );
    return { ...sostav, s: rng.int(0, 3), g: rng.int(0, 3), m: rng.int(0, 1) };
  },
  text(p) {
    const strany = STRANY[num(p, 'g')] ?? STRANY[0];
    const [a, b, c, d] = [num(p, 'a'), num(p, 'b'), num(p, 'c'), num(p, 'd')];
    return `В соревнованиях по ${SPORT[num(p, 's')]} участвуют ${a} ${slovo(a, SPORTSMEN)} из ${strany[0]}, ${b} — из ${strany[1]}, ${c} — из ${strany[2]} и ${d} — из ${strany[3]}. Порядок, в котором выступают спортсмены, определяется жребием. Найдите вероятность того, что спортсмен, который выступает ${MESTO[num(p, 'm')]}, окажется из ${strany[num(p, 'kto')]}.`;
  },
  solve(p) {
    const vse = [num(p, 'a'), num(p, 'b'), num(p, 'c'), num(p, 'd')];
    const n = vse.reduce((s, x) => s + x, 0);
    const m = vse[num(p, 'kto')] ?? 0;
    const strana = (STRANY[num(p, 'g')] ?? STRANY[0])[num(p, 'kto')];
    return dolya({
      vsego: n,
      podhodit: m,
      chtoVsego: 'Всего спортсменов',
      chtoPodhodit: `Спортсменов из ${strana}`,
      kakNashli: `Всего $${vse.join(' + ')} = ${n}$. На любом месте по жребию может оказаться каждый — и на первом, и на последнем.`,
      lovushka: n - m,
    });
  },
  proverka(p) {
    const strany = [num(p, 'a'), num(p, 'b'), num(p, 'c'), num(p, 'd')].flatMap((k, i) =>
      Array.from({ length: k }, () => i),
    );
    return zapis(strany.filter((i) => i === num(p, 'kto')).length, strany.length);
  },
};

/* ── P04. Такси ──────────────────────────────────────────────── */

const CVETA = [
  ['чёрных', 'чёрное'],
  ['жёлтых', 'жёлтое'],
  ['зелёных', 'зелёное'],
] as const;
const MASHIN = ['машина', 'машины', 'машин'] as const;

const P04: Prototip = {
  id: 'P04',
  gruppa: 'A',
  title: 'Такси трёх цветов',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    return podobrat(
      rng,
      () => {
        const n = rng.pick([10, 20, 25, 40, 50]);
        const a = rng.int(2, 20);
        const b = rng.int(2, 20);
        return { a, b, c: n - a - b, kto: rng.int(0, 2) };
      },
      ({ a, b, c, kto }) => {
        const vse = [a, b, c];
        return (
          c >= 2 &&
          new Set(vse).size === 3 &&
          vse.every((x) => x % 10 !== 1) &&
          konechna(vse[kto] ?? 1, a + b + c)
        );
      },
    );
  },
  text(p) {
    const [a, b, c] = [num(p, 'a'), num(p, 'b'), num(p, 'c')];
    const n = a + b + c;
    return `В фирме такси в данный момент свободно ${n} ${slovo(n, MASHIN)}: ${a} ${CVETA[0][0]}, ${b} ${CVETA[1][0]} и ${c} ${CVETA[2][0]}. По вызову выехала одна из машин, случайно оказавшаяся ближе всего к заказчику. Найдите вероятность того, что к нему приедет ${(CVETA[num(p, 'kto')] ?? CVETA[0])[1]} такси.`;
  },
  solve(p) {
    const vse = [num(p, 'a'), num(p, 'b'), num(p, 'c')];
    const n = vse.reduce((s, x) => s + x, 0);
    const m = vse[num(p, 'kto')] ?? 0;
    return dolya({
      vsego: n,
      podhodit: m,
      chtoVsego: 'Всего свободных машин',
      chtoPodhodit: `Машин нужного цвета (${(CVETA[num(p, 'kto')] ?? CVETA[0])[0]})`,
      lovushka: n - m,
    });
  },
  proverka(p) {
    const mashiny = [num(p, 'a'), num(p, 'b'), num(p, 'c')].flatMap((k, i) =>
      Array.from({ length: k }, () => i),
    );
    return zapis(mashiny.filter((i) => i === num(p, 'kto')).length, mashiny.length);
  },
};

/* ── P05. «На каждые … приходится …» ─────────────────────────── */

const NA_KAZHDYE = [
  {
    nachalo: 'Фабрика выпускает сумки.',
    horoshih: 'качественных сумок',
    plohie: ['сумка', 'сумки', 'сумок'],
    kakie: 'со скрытыми дефектами',
    vopros: 'купленная сумка окажется качественной',
  },
  {
    nachalo: 'Завод выпускает электрические лампы.',
    horoshih: 'исправных ламп',
    plohie: ['лампа', 'лампы', 'ламп'],
    kakie: 'с браком',
    vopros: 'купленная лампа окажется исправной',
  },
  {
    nachalo: 'Мастерская выпускает глиняные кружки.',
    horoshih: 'кружек без изъяна',
    plohie: ['кружка', 'кружки', 'кружек'],
    kakie: 'с изъяном',
    vopros: 'выбранная наудачу кружка окажется без изъяна',
  },
] as const;

const P05: Prototip = {
  id: 'P05',
  gruppa: 'A',
  title: 'На каждые … приходится …',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const { t, k } = podobrat(
      rng,
      () => ({ t: rng.pick([50, 80, 100, 125, 200, 250]), k: rng.int(2, 25) }),
      /* «на 190 качественных сумок»: число хороших — с окончанием под «сумок». */
      ({ t, k }) => {
        const q = t - k;
        return k % 10 !== 1 && (q % 10 === 0 || q % 10 >= 5) && k * 5 <= t && konechna(q, t);
      },
    );
    return { q: t - k, k, v: rng.int(0, NA_KAZHDYE.length - 1) };
  },
  text(p) {
    const t = NA_KAZHDYE[num(p, 'v')] ?? NA_KAZHDYE[0];
    const k = num(p, 'k');
    return `${t.nachalo} В среднем на ${num(p, 'q')} ${t.horoshih} приходится ${k} ${slovo(k, t.plohie)} ${t.kakie}. Найдите вероятность того, что ${t.vopros}.`;
  },
  solve(p) {
    const q = num(p, 'q');
    const k = num(p, 'k');
    return dolya({
      vsego: q + k,
      podhodit: q,
      chtoVsego: 'Всего изделий — хороших и с дефектом вместе',
      chtoPodhodit: 'Хороших изделий',
      kakNashli: `«На ${q} приходится ${k}» — это две разные группы, их нужно сложить: $${q} + ${k} = ${q + k}$.`,
      lovushka: k,
    });
  },
  proverka(p) {
    const izdeliya = [
      ...Array.from({ length: num(p, 'q') }, () => true),
      ...Array.from({ length: num(p, 'k') }, () => false),
    ];
    return zapis(izdeliya.filter(Boolean).length, izdeliya.length);
  },
};

/* ── P06. Конференция по дням ────────────────────────────────── */

const DOKLADOV = ['доклад', 'доклада', 'докладов'] as const;
const OSTALNYE: Record<number, string> = {
  3: 'остальные запланированы на третий день',
  4: 'остальные распределены поровну между третьим и четвёртым днями',
  5: 'остальные распределены поровну между третьим, четвёртым и пятым днями',
};
const DNEY: Record<number, string> = { 3: '3 дня', 4: '4 дня', 5: '5 дней' };

const P06: Prototip = {
  id: 'P06',
  gruppa: 'A',
  title: 'Доклады по дням',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    return podobrat(
      rng,
      () => ({ n: rng.pick([40, 50, 60, 75, 80]), a: rng.int(8, 30), d: rng.int(3, 5) }),
      ({ n, a, d }) => {
        const ost = n - 2 * a;
        return ost > 0 && ost % (d - 2) === 0 && ost / (d - 2) !== a && konechna(ost / (d - 2), n);
      },
    );
  },
  text(p) {
    const [n, a, d] = [num(p, 'n'), num(p, 'a'), num(p, 'd')];
    return `Научная конференция проводится в ${DNEY[d]}. Всего запланировано ${n} ${slovo(n, DOKLADOV)}: в первые два дня — по ${a} ${slovo(a, DOKLADOV)}, ${OSTALNYE[d]}. Порядок докладов определяется жеребьёвкой. Какова вероятность того, что доклад профессора М. окажется запланированным на последний день конференции?`;
  },
  solve(p) {
    const [n, a, d] = [num(p, 'n'), num(p, 'a'), num(p, 'd')];
    const ost = n - 2 * a;
    const m = ost / (d - 2);
    return dolya({
      vsego: n,
      podhodit: m,
      chtoVsego: 'Всего докладов (мест для доклада профессора)',
      chtoPodhodit: 'Докладов в последний день',
      kakNashli:
        `На первые два дня ушло $2 \\cdot ${a} = ${2 * a}$ докладов, осталось $${n} - ${2 * a} = ${ost}$.` +
        (d === 3
          ? ' Все они — в последний день.'
          : ` На каждый из оставшихся дней: $${ost} : ${d - 2} = ${m}$.`),
      lovushka: a,
    });
  },
  proverka(p) {
    const [n, a, d] = [num(p, 'n'), num(p, 'a'), num(p, 'd')];
    /* Расписание по дням: два дня по a, остальные поровну. */
    const dni = [a, a];
    while (dni.length < d) dni.push((n - 2 * a) / (d - 2));
    if (dni.reduce((s, x) => s + x, 0) !== n) throw new Error('расписание не сходится');
    return zapis(dni[dni.length - 1] ?? 0, n);
  },
};

/* ── P07. Жребий в группе ────────────────────────────────────── */

const SKOLKIH: Record<number, string> = {
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пятерых',
  6: 'шестерых',
  8: 'восьмерых',
};
const ZHREBIY = [
  {
    kto: 'В группе туристов',
    zachem: 'которые должны идти в село за продуктами',
    geroy: 'Турист А. хотел бы сходить в магазин, но он подчиняется жребию',
    vopros: 'А. пойдёт в магазин',
  },
  {
    kto: 'В классе',
    zachem: 'которые будут дежурить в столовой',
    geroy: 'Ученик К. дежурить не хочет, но подчиняется жребию',
    vopros: 'К. будет дежурить',
  },
  {
    kto: 'В отряде',
    zachem: 'которые поедут на экскурсию первым рейсом автобуса',
    geroy: 'Школьница В. хотела бы поехать первым рейсом',
    vopros: 'В. поедет первым рейсом',
  },
] as const;

const P07: Prototip = {
  id: 'P07',
  gruppa: 'A',
  title: 'Жребий в группе',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const { n, k } = podobrat(
      rng,
      () => ({ n: rng.pick([5, 8, 10, 16, 20, 25, 30, 40]), k: rng.pick([2, 3, 4, 5, 6, 8]) }),
      ({ n, k }) => k * 2 <= n && konechna(k, n),
    );
    return { n, k, v: rng.int(0, ZHREBIY.length - 1) };
  },
  text(p) {
    const t = ZHREBIY[num(p, 'v')] ?? ZHREBIY[0];
    return `${t.kto} ${num(p, 'n')} человек. С помощью жребия они выбирают ${SKOLKIH[num(p, 'k')]} человек, ${t.zachem}. ${t.geroy}. Какова вероятность того, что ${t.vopros}?`;
  },
  solve(p) {
    const n = num(p, 'n');
    const k = num(p, 'k');
    return dolya({
      vsego: n,
      podhodit: k,
      chtoVsego: 'Всего человек — у каждого шансы одинаковые',
      chtoPodhodit: 'Мест, на которые выбирает жребий',
      kakNashli: `Жребий выбирает ${k} из ${n}. Для одного человека подходящих «мест» ${k}.`,
      lovushka: n - k,
    });
  },
  proverka(p) {
    /* Герой — человек № 0; жребий — любые k подряд идущих мест по кругу:
       каждое место выбирается одинаково часто. */
    const n = num(p, 'n');
    const k = num(p, 'k');
    let vybran = 0;
    for (let start = 0; start < n; start += 1) {
      const mesta = Array.from({ length: k }, (_, i) => (start + i) % n);
      if (mesta.includes(0)) vybran += 1;
    }
    return zapis(vybran, n);
  },
};

/* ── P08. Противоположное событие ────────────────────────────── */

const PROTIV = [
  {
    text: (pr: string) =>
      `Вероятность того, что новая шариковая ручка пишет плохо (или не пишет), равна ${pr}. Покупатель в магазине выбирает одну шариковую ручку. Найдите вероятность того, что эта ручка пишет хорошо.`,
    a: 'ручка пишет плохо',
    neA: 'ручка пишет хорошо',
    ot: 2,
    do: 25,
  },
  {
    text: (pr: string) =>
      `Вероятность того, что батарейка бракованная, равна ${pr}. Покупатель в магазине выбирает случайную батарейку. Найдите вероятность того, что эта батарейка исправна.`,
    a: 'батарейка бракованная',
    neA: 'батарейка исправна',
    ot: 2,
    do: 15,
  },
  {
    text: (pr: string) =>
      `Вероятность того, что в случайный момент времени температура тела здорового человека окажется ниже 36,8 °C, равна ${pr}. Найдите вероятность того, что в случайный момент времени температура тела окажется 36,8 °C или выше.`,
    a: 'температура ниже 36,8 °C',
    neA: 'температура 36,8 °C или выше',
    ot: 70,
    do: 95,
  },
] as const;

const P08: Prototip = {
  id: 'P08',
  gruppa: 'B',
  title: 'Противоположное событие',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const v = rng.int(0, PROTIV.length - 1);
    const t = PROTIV[v] ?? PROTIV[0];
    return { v, s: rng.int(t.ot, t.do) };
  },
  text(p) {
    return (PROTIV[num(p, 'v')] ?? PROTIV[0]).text(sotye(num(p, 's')));
  },
  solve(p) {
    const s = num(p, 's');
    const t = PROTIV[num(p, 'v')] ?? PROTIV[0];
    const pr = tex(sotye(s));
    const otvet = sotye(100 - s);
    return {
      otvet,
      etapy: [
        {
          title: 'Два события',
          lines: [
            `Событие $A$ — ${t.a}, $P(A) = ${pr}$.`,
            `Спрашивают про противоположное событие: ${t.neA}. Одно из двух случится обязательно, вместе они не случаются.`,
          ],
        },
        {
          title: 'Вероятность',
          lines: [`$P(\\overline{A}) = 1 - P(A) = 1 - ${pr} = ${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Как связаны событие из условия и событие из вопроса?',
          'Они противоположные',
          ['Это одно и то же событие', 'Они независимые'],
          s,
          'Либо одно, либо другое — третьего нет.',
        ),
        vopros(
          'Чему равна сумма вероятностей противоположных событий?',
          '$1$',
          ['$0$', `$${pr}$`],
          s + 1,
        ),
        vopros('Как найти ответ?', `$1 - ${pr}$`, [`$1 + ${pr}$`, `$${pr} \\cdot ${pr}$`], s + 2),
      ],
    };
  },
  proverka(p) {
    /* В сотых: из 100 равных долей событие A занимает s. */
    const doli = Array.from({ length: 100 }, (_, i) => i < num(p, 's'));
    return zapis(doli.filter((a) => !a).length, 100);
  },
};

/* ── P09. Сумма несовместных событий ─────────────────────────── */

const TEMY = [
  ['геометрии', 'Вписанная окружность', 'Параллелограмм'],
  ['геометрии', 'Углы', 'Трапеция'],
  ['математике', 'Проценты', 'Уравнения'],
  ['физике', 'Механика', 'Электричество'],
  ['биологии', 'Ботаника', 'Зоология'],
] as const;

const P09: Prototip = {
  id: 'P09',
  gruppa: 'C',
  title: 'Одна из двух тем',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const { a, b } = podobrat(
      rng,
      () => ({ a: rng.int(5, 40), b: rng.int(5, 40) }),
      ({ a, b }) => a !== b && a + b <= 70,
    );
    return { a, b, v: rng.int(0, TEMY.length - 1) };
  },
  text(p) {
    const [predmet, t1, t2] = TEMY[num(p, 'v')] ?? TEMY[0];
    return `На экзамене по ${predmet} школьник отвечает на один вопрос из списка экзаменационных вопросов. Вероятность того, что это вопрос по теме «${t1}», равна ${sotye(num(p, 'a'))}. Вероятность того, что это вопрос по теме «${t2}», равна ${sotye(num(p, 'b'))}. Вопросов, которые одновременно относятся к этим двум темам, нет. Найдите вероятность того, что на экзамене школьнику достанется вопрос по одной из этих двух тем.`;
  },
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const [pa, pb] = [tex(sotye(a)), tex(sotye(b))];
    const otvet = sotye(a + b);
    return {
      otvet,
      etapy: [
        {
          title: 'Какие это события',
          lines: [
            'Вопрос один, и он не может быть сразу по двум темам. Значит, события несовместные: вместе они не наступают.',
          ],
        },
        {
          title: 'Вероятность',
          lines: [
            'Вероятность того, что наступит одно из несовместных событий, равна сумме их вероятностей.',
            `$P = ${pa} + ${pb} = ${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Может ли один вопрос относиться сразу к обеим темам?',
          'Нет, таких вопросов нет',
          ['Да, может', 'В условии об этом не сказано'],
          a,
          'В условии прямо сказано: общих вопросов нет. События несовместные.',
        ),
        vopros(
          'Что делают с вероятностями несовместных событий, когда подходит любое из них?',
          'Складывают',
          ['Перемножают', 'Вычитают из единицы'],
          b,
        ),
        vopros(
          'Как найти ответ?',
          `$${pa} + ${pb}$`,
          [`$${pa} \\cdot ${pb}$`, `$1 - ${pa} - ${pb}$`],
          a + b,
        ),
      ],
    };
  },
  proverka(p) {
    /* 100 вопросов: a по первой теме, b по второй, без общих. */
    const voprosy = Array.from({ length: 100 }, (_, i) =>
      i < num(p, 'a') ? 1 : i < num(p, 'a') + num(p, 'b') ? 2 : 0,
    );
    return zapis(voprosy.filter((t) => t !== 0).length, voprosy.length);
  },
};

/* ── P10. Два независимых автомата ───────────────────────────── */

const AVTOMATY = [
  { text: 'хотя бы один автомат исправен', id: 'hotya' },
  { text: 'оба автомата неисправны', id: 'oba-ne' },
  { text: 'оба автомата исправны', id: 'oba' },
] as const;

const P10: Prototip = {
  id: 'P10',
  gruppa: 'C',
  title: 'Два независимых автомата',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    return { s: rng.pick([5, 10, 15, 20, 25, 30, 40]), q: rng.int(0, AVTOMATY.length - 1) };
  },
  text(p) {
    return `В магазине стоят два платёжных автомата. Каждый из них может быть неисправен с вероятностью ${sotye(num(p, 's'))} независимо от другого автомата. Найдите вероятность того, что ${(AVTOMATY[num(p, 'q')] ?? AVTOMATY[0]).text}.`;
  },
  solve(p) {
    const s = num(p, 's');
    const vid = (AVTOMATY[num(p, 'q')] ?? AVTOMATY[0]).id;
    const pr = tex(sotye(s));
    const ispr = tex(sotye(100 - s));
    const obaNe = texDrob(s * s, 10000);
    const etapy =
      vid === 'oba-ne'
        ? [
            {
              title: 'Какие это события',
              lines: [
                'Автоматы ломаются независимо друг от друга. Нужно, чтобы неисправен был и первый, и второй.',
              ],
            },
            {
              title: 'Вероятность',
              lines: [
                'Вероятности независимых событий, которые должны наступить вместе, перемножают.',
                `$P = ${pr} \\cdot ${pr} = ${obaNe}$.`,
              ],
            },
          ]
        : vid === 'oba'
          ? [
              {
                title: 'Один автомат исправен',
                lines: [`Это событие, противоположное поломке: $1 - ${pr} = ${ispr}$.`],
              },
              {
                title: 'Оба исправны',
                lines: [
                  'Автоматы работают независимо, нужны оба — вероятности перемножаем.',
                  `$P = ${ispr} \\cdot ${ispr} = ${texDrob((100 - s) * (100 - s), 10000)}$.`,
                ],
              },
            ]
          : [
              {
                title: 'Противоположное событие',
                lines: [
                  '«Хотя бы один исправен» не выполняется только в одном случае: оба автомата неисправны. Проще найти эту вероятность.',
                  `Автоматы независимы: $${pr} \\cdot ${pr} = ${obaNe}$.`,
                ],
              },
              {
                title: 'Вероятность',
                lines: [`$P = 1 - ${obaNe} = ${texDrob(10000 - s * s, 10000)}$.`],
              },
            ];
    const m = vid === 'oba-ne' ? s * s : vid === 'oba' ? (100 - s) * (100 - s) : 10000 - s * s;
    const verno =
      vid === 'oba-ne'
        ? `$${pr} \\cdot ${pr}$`
        : vid === 'oba'
          ? `$${ispr} \\cdot ${ispr}$`
          : `$1 - ${pr} \\cdot ${pr}$`;
    return {
      otvet: zapis(m, 10000),
      etapy,
      hints: [
        vopros(
          'Что делают с вероятностями независимых событий, когда должны наступить оба?',
          'Перемножают',
          ['Складывают', 'Берут большую из двух'],
          s,
        ),
        vopros(
          'С какой вероятностью неисправны оба автомата?',
          `$${obaNe}$`,
          [`$${tex(sotye(Math.min(100, 2 * s)))}$`, `$${pr}$`],
          s + 1,
          `$${pr} \\cdot ${pr} = ${obaNe}$.`,
        ),
        vopros(
          'Как найти ответ?',
          verno,
          [`$${pr} + ${pr}$`, `$1 - ${pr}$`, `$${pr} \\cdot ${pr}$`].filter((x) => x !== verno),
          s + 2,
        ),
      ],
    };
  },
  proverka(p) {
    /* Сетка 100 × 100 равных клеток: строка — первый автомат, столбец —
       второй; неисправен в первых s долях. */
    const s = num(p, 's');
    const vid = (AVTOMATY[num(p, 'q')] ?? AVTOMATY[0]).id;
    let m = 0;
    for (let i = 0; i < 100; i += 1) {
      for (let j = 0; j < 100; j += 1) {
        const [x, y] = [i >= s, j >= s];
        if (vid === 'hotya' ? x || y : vid === 'oba' ? x && y : !x && !y) m += 1;
      }
    }
    return zapis(m, 10000);
  },
};

/* ── P11. Монета ─────────────────────────────────────────────── */

const RAZ: Record<number, string> = { 2: 'дважды', 3: 'трижды' };
const ROVNO: Record<number, string> = {
  0: 'не выпадет ни разу',
  1: 'выпадет ровно один раз',
  2: 'выпадет ровно два раза',
  3: 'выпадет все три раза',
};
const STORONA = [
  ['орёл', 'О'],
  ['решка', 'Р'],
] as const;

/** Все исходы n бросков: строки из «О» и «Р». */
function ishody(n: number): string[] {
  return Array.from({ length: 2 ** n }, (_, i) =>
    Array.from({ length: n }, (_, j) => ((i >> (n - 1 - j)) & 1 ? 'Р' : 'О')).join(''),
  );
}

const P11: Prototip = {
  id: 'P11',
  gruppa: 'A',
  title: 'Броски монеты',
  tip: 'chislo',
  zadach: 12,
  generate(rng) {
    const n = rng.int(2, 3);
    return { n, k: rng.int(0, n), st: rng.int(0, 1) };
  },
  text(p) {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const chto = k === n && n === 2 ? 'выпадет оба раза' : ROVNO[k];
    return `В случайном эксперименте симметричную монету бросают ${RAZ[n]}. Найдите вероятность того, что ${(STORONA[num(p, 'st')] ?? STORONA[0])[0]} ${chto}.`;
  },
  solve(p) {
    const n = num(p, 'n');
    const k = num(p, 'k');
    const [storona, bukva] = STORONA[num(p, 'st')] ?? STORONA[0];
    const vse = ishody(n);
    const nuzhnye = vse.filter((s) => [...s].filter((c) => c === bukva).length === k);
    const otvet = zapis(nuzhnye.length, vse.length);
    return {
      otvet,
      etapy: [
        {
          title: 'Все исходы',
          lines: [
            `О — орёл, Р — решка. Выпишем все исходы ${n === 2 ? 'двух' : 'трёх'} бросков: ${vse.join(', ')}.`,
            `Всего $n = ${vse.length}$, все равновозможны.`,
          ],
        },
        {
          title: 'Подходящие исходы',
          lines: [
            `Нужны исходы, где ${storona} встречается ${k === 0 ? 'ноль раз' : `ровно ${k} ${slovo(k, ['раз', 'раза', 'раз'])}`}: ${nuzhnye.join(', ')}.`,
            `Их $m = ${nuzhnye.length}$.`,
          ],
        },
        {
          title: 'Вероятность',
          lines: [`$P = \\dfrac{${nuzhnye.length}}{${vse.length}} = ${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          `Сколько всего исходов у ${n === 2 ? 'двух' : 'трёх'} бросков монеты?`,
          String(vse.length),
          [String(n), String(2 * n), String(n + 1)],
          n + k,
          `У каждого броска два исхода: $2^{${n}} = ${vse.length}$.`,
        ),
        vopros(
          'Сколько исходов подходит?',
          String(nuzhnye.length),
          [String(k), String(vse.length - nuzhnye.length), String(nuzhnye.length + 1)],
          k,
          `Это ${nuzhnye.join(', ')}.`,
        ),
      ],
    };
  },
  proverka(p) {
    /* Число сочетаний вместо перебора строк. */
    const n = num(p, 'n');
    const k = num(p, 'k');
    let c = 1;
    for (let i = 0; i < k; i += 1) c = (c * (n - i)) / (i + 1);
    return zapis(c, 2 ** n);
  },
};

export const PROTOTIPY_05: Prototip[] = [P01, P02, P03, P04, P05, P06, P07, P08, P09, P10, P11];
