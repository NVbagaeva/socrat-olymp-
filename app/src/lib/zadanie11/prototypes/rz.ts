/**
 * Раздел РЗ — разминка: простейшие текстовые задачи (РЗ-01 … РЗ-18).
 *
 * В ЕГЭ таких задач сейчас нет, и это не открытый банк: свои сюжеты
 * и числа. Нужны как разгон — внимательное чтение, счёт без
 * калькулятора, здравый смысл при округлении.
 */

import { chtoSprashivayut, etapy, key, num, osh, slovo, str, vopros } from '../kit';
import {
  type Zveno,
  podskazkiZvena,
  reshitZveno,
  shag100,
  sverit,
  zapisBezNeizvestnogo,
} from '../proporciya/shagi';
import { d, div, fq, mul, q, round9, sub, txt, val } from '../num';
import { plural } from '../../plural';
import { chasy, sk, SLOVA } from '../sklonenie';
import type { Solved, Subtype } from '../types';
import { otvet, pct } from './common';

function rz(
  id: string,
  title: string,
  keywords: string[],
  solve: Subtype['solve'],
  oshibki?: readonly string[],
): Subtype {
  return { id, section: 'RZ', title, level: 1, keywords, solve, ...(oshibki ? { oshibki } : {}) };
}

/** Масса в граммах текстом: 1750 → «1 кг 750 г». */
function massa(g: number): string {
  const kg = Math.floor(g / 1000);
  const gr = g - kg * 1000;
  return [kg > 0 ? `${kg} кг` : '', gr > 0 ? `${gr} г` : ''].filter(Boolean).join(' ');
}

/** Округление вверх с разбором: есть ли остаток. */
function vverh(top: number, bottom: number): { n: number; ostatok: boolean; line: string } {
  const exact = q(top, bottom);
  const n = Math.ceil(val(exact) - 1e-12);
  const ostatok = exact.m !== 1;
  return {
    n,
    ostatok,
    line: ostatok
      ? `$${d(top)}:${d(bottom)}=${fq(exact, true)}$ — не целое. Меньше $${d(n)}$ не хватит, поэтому округляем **вверх**: $${d(n)}$.`
      : `$${d(top)}:${d(bottom)}=${d(n)}$ — делится нацело, округлять не нужно: ровно $${d(n)}$.`,
  };
}

/* ── РЗ-01 Покупка и сдача ───────────────────────────────────── */

const RZ01 = rz(
  'RZ-01',
  'Покупка и сдача: граммы в килограммы',
  ['сдача', 'клубника', 'граммы', 'покупка'],
  (p) => {
    const c = num(p, 'c');
    const g = num(p, 'g');
    const M = num(p, 'M');
    const cost = val(mul(q(c), q(g, 1000)));
    const ans = M - cost;
    return {
      uslovie: `Килограмм клубники стоит ${txt(c)} рублей. Маша купила ${massa(g)} клубники. Сколько рублей сдачи она получит с ${txt(M)} рублей?`,
      answer: ans,
      etapy: etapy(
        ['Перевод', [`${massa(g)} $=${fq(q(g, 1000), true)}$ кг.`]],
        ['Стоимость', [`$${d(c)}\\cdot${fq(q(g, 1000), true)}=${d(cost)}$ руб.`]],
        ['Ответ на вопрос задачи', [`Сдача: $${d(M)}-${d(cost)}=${d(ans)}$ руб.`, otvet(ans)]],
      ),
      hints: [
        vopros(`Сколько килограммов в ${massa(g)}?`, `$${fq(q(g, 1000), true)}$`, [
          `$${d(round9(Math.floor(g / 1000) + (g % 1000) / 100))}$`,
          `$${d(g)}$`,
        ]),
        vopros('Сколько стоит покупка?', `$${d(cost)}$ руб.`, [
          `$${d(c)}$ руб.`,
          `$${d(c * Math.ceil(g / 1000))}$ руб.`,
        ]),
        chtoSprashivayut('сдачу', ['стоимость покупки', `массу ${slovo(p, 'tovar', 'клубники')}`]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-02 м/с в км/ч ────────────────────────────────────────── */

const RZ02 = rz(
  'RZ-02',
  'Скорость из метров в секунду в км/ч',
  ['м/с', 'км/ч', 'велосипедист', 'перевод'],
  (p) => {
    const S = num(p, 'S');
    const t = num(p, 't');
    const ms = q(S, t);
    const ans = val(mul(ms, q(18, 5)));
    return {
      uslovie: `Велосипедист проехал ${txt(S)} м за ${sk(t, SLOVA.sekundu)}. Найдите его среднюю скорость. Ответ дайте в километрах в час.`,
      answer: ans,
      etapy: etapy(
        ['Скорость в м/с', [`$${frac2(S, t)}=${fq(ms, true)}$ м/с.`]],
        ['Перевод', ['$1$ м/с $=3{,}6$ км/ч: в часе $3600$ с, в километре $1000$ м.']],
        ['Ответ на вопрос задачи', [`$${fq(ms, true)}\\cdot3{,}6=${d(ans)}$ км/ч.`, otvet(ans)]],
      ),
      hints: [
        vopros('Какая скорость в м/с?', `$${fq(ms, true)}$`, [
          `$${fq(q(t, S), true)}$`,
          `$${d(S * t)}$`,
        ]),
        vopros('Как перевести м/с в км/ч?', 'умножить на $3{,}6$', [
          'разделить на $3{,}6$',
          'умножить на $60$',
        ]),
        chtoSprashivayut('скорость в км/ч', ['скорость в м/с', 'время']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

function frac2(a: number, b: number): string {
  return `\\dfrac{${d(a)}}{${d(b)}}`;
}

/** Города для РЗ-03: падежи и разница с Москвой. */
export const GORODA: Record<
  string,
  { iz: string; v: string; s: string; dh: number; km: [number, number] }
> = {
  vladivostok: {
    iz: 'Владивостока',
    v: 'Владивостоке',
    s: 'Владивостоком',
    dh: 7,
    km: [6300, 7000],
  },
  habarovsk: { iz: 'Хабаровска', v: 'Хабаровске', s: 'Хабаровском', dh: 7, km: [5900, 6400] },
  irkutsk: { iz: 'Иркутска', v: 'Иркутске', s: 'Иркутском', dh: 5, km: [4000, 4500] },
  novosibirsk: {
    iz: 'Новосибирска',
    v: 'Новосибирске',
    s: 'Новосибирском',
    dh: 4,
    km: [2800, 3300],
  },
  omsk: { iz: 'Омска', v: 'Омске', s: 'Омском', dh: 3, km: [2200, 2600] },
  ekaterinburg: {
    iz: 'Екатеринбурга',
    v: 'Екатеринбурге',
    s: 'Екатеринбургом',
    dh: 2,
    km: [1400, 1800],
  },
  krasnoyarsk: { iz: 'Красноярска', v: 'Красноярске', s: 'Красноярском', dh: 4, km: [3300, 3700] },
  barnaul: { iz: 'Барнаула', v: 'Барнауле', s: 'Барнаулом', dh: 4, km: [2900, 3300] },
  yakutsk: { iz: 'Якутска', v: 'Якутске', s: 'Якутском', dh: 6, km: [4800, 5200] },
  magadan: { iz: 'Магадана', v: 'Магадане', s: 'Магаданом', dh: 8, km: [5800, 6200] },
  petropavlovsk: {
    iz: 'Петропавловска-Камчатского',
    v: 'Петропавловске-Камчатском',
    s: 'Петропавловском-Камчатским',
    dh: 9,
    km: [6700, 7100],
  },
  chelyabinsk: { iz: 'Челябинска', v: 'Челябинске', s: 'Челябинском', dh: 2, km: [1500, 1900] },
};

/** Города банка: генератор берёт только их — так его задачи не меняются. */
export const GORODA_GENERATORA = [
  'vladivostok',
  'habarovsk',
  'irkutsk',
  'novosibirsk',
  'omsk',
  'ekaterinburg',
];

/* ── РЗ-03 Часовые пояса ─────────────────────────────────────── */

const RZ03 = rz(
  'RZ-03',
  'Часовые пояса',
  ['часовые пояса', 'самолёт', 'местному времени', 'Владивосток', 'Новосибирск'],
  (p) => {
    const t0 = num(p, 't0'); // минуты от полуночи, местное время вылета
    const t1 = num(p, 't1'); // минуты, местное время прилёта (Москва)
    const g = key(GORODA, str(p, 'gorod', Object.keys(GORODA)));
    const dh = g.dh;
    const S = num(p, 'S');
    const dep = t0 - dh * 60;
    const flight = t1 - dep;
    const T = q(flight, 60);
    const ans = val(div(q(S), T));
    const wrongDep = t0 + dh * 60;
    return {
      uslovie: `Самолёт вылетает из ${g.iz} в ${chasy(t0 / 60, false)} по местному времени и прилетает в Москву в ${chasy(t1 / 60, false)} по московскому времени того же дня. Разница во времени между ${g.s} и Москвой — ${sk(dh, SLOVA.chas)}. Найдите среднюю скорость самолёта (в км/ч), если длина воздушной трассы ${txt(S)} км.`,
      answer: ans,
      etapy: etapy(
        [
          'Одно время',
          [
            `В ${g.v} на $${d(dh)}$ ч больше. Значит, в момент вылета (${chasy(t0 / 60, false)} в ${g.v}) в Москве было на ${sk(dh, SLOVA.chas)} меньше: ${chasy(dep / 60)}.`,
          ],
        ],
        [
          'Время полёта',
          [
            `С ${chasy(dep / 60)} до ${chasy(t1 / 60, false)} по московскому времени: ${Math.floor(flight / 60)} ч ${flight % 60} мин $=${fq(T, true)}$ ч.`,
          ],
        ],
        ['Скорость', [`$${d(S)}:${fq(T, true)}=${d(ans)}$ км/ч.`]],
        [
          'Ответ на вопрос задачи',
          [
            'Ловушка: вылет и прилёт указаны по местному времени — их нельзя просто вычитать.',
            otvet(ans),
          ],
        ],
      ),
      hints: [
        vopros('Сколько было в Москве в момент вылета?', chasy(dep / 60), [
          chasy(wrongDep / 60),
          chasy(t0 / 60),
        ]),
        vopros('Сколько длился полёт?', `${Math.floor(flight / 60)} ч ${flight % 60} мин`, [
          `${Math.floor(((t1 - t0 + 24 * 60) % (24 * 60)) / 60)} ч ${((t1 - t0 + 24 * 60) % (24 * 60)) % 60} мин`,
          `${Math.floor((flight + 120) / 60)} ч ${flight % 60} мин`,
        ]),
        vopros('Сколько это в часах?', `$${fq(T, true)}$`, [
          `$${d(round9(Math.floor(flight / 60) + (flight % 60) / 100))}$`,
          `$${d(flight)}$`,
        ]),
        chtoSprashivayut('среднюю скорость в км/ч', ['время полёта', 'разницу во времени']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-04 Округление вверх: вместимость ─────────────────────── */

const RZ04 = rz(
  'RZ-04',
  'Округление вверх: вместимость',
  ['автобус', 'вместимость', 'наименьшее число', 'округление вверх'],
  (p) => {
    const cap = num(p, 'cap');
    const a = num(p, 'a');
    const b = num(p, 'b');
    const r = vverh(a + b, cap);
    /* Слова сюжета аналога: катера, микроавтобусы, лодки. */
    const trRod = slovo(p, 'trRod', 'автобусов');
    const eshche = slovo(p, 'eshche', 'ещё один автобус');
    const ostavit = slovo(p, 'ostavit', 'дома');
    const tozhe = slovo(p, 'tozhe', 'учителя тоже едут');
    return {
      uslovie: `Автобус вмещает ${txt(cap)} пассажиров. Какое наименьшее число автобусов нужно заказать, чтобы отвезти на экскурсию ${txt(a)} школьников и ${txt(b)} учителей?`,
      answer: r.n,
      etapy: etapy(
        ['Сколько людей', [`$${d(a)}+${d(b)}=${d(a + b)}$ человек — ${tozhe}.`]],
        ['Деление', [r.line]],
        ['Ответ на вопрос задачи', [otvet(r.n)]],
      ),
      hints: [
        vopros('Сколько человек нужно отвезти?', `$${d(a + b)}$`, [`$${d(a)}$`, `$${d(a - b)}$`]),
        vopros(
          r.ostatok
            ? `Можно ли оставить ${sk((a + b) % cap, ['человека', 'человека', 'человек'])} ${ostavit}?`
            : 'Остаются ли лишние люди?',
          r.ostatok ? `нет — нужен ${eshche}` : 'нет — делится нацело',
          r.ostatok
            ? ['да, округляем как обычно', 'да, их можно не считать']
            : [`да, нужен ${eshche}`, 'нужно округлить вверх'],
        ),
        chtoSprashivayut(`наименьшее число ${trRod}`, ['число людей', 'число свободных мест']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-05 Округление вверх: расход материала ────────────────── */

const RZ05 = rz(
  'RZ-05',
  'Округление вверх: расход материала',
  ['лак', 'банки', 'расход', 'округление вверх'],
  (p) => {
    const g = num(p, 'g'); // г на м²
    const can = num(p, 'can'); // г в банке
    const area = num(p, 'area');
    const need = g * area;
    const r = vverh(need, can);
    /* Слова сюжета аналога: краска, грунтовка, семена газона. */
    const mat = slovo(p, 'mat', 'лака');
    const taraIm = slovo(p, 'taraIm', 'Банка');
    const taraPr = slovo(p, 'taraPr', 'банке');
    const taraRod = slovo(p, 'taraRod', 'банок');
    return {
      uslovie: `Для покрытия 1 м² пола лаком нужно ${txt(g)} г лака. Лак продаётся в банках по ${txt(can / 1000)} кг. Какое наименьшее число банок нужно купить, чтобы покрыть лаком пол площадью ${txt(area)} м²?`,
      answer: r.n,
      etapy: etapy(
        [`Сколько ${mat}`, [`$${d(g)}\\cdot${d(area)}=${d(need)}$ г.`]],
        ['Одни единицы', [`${taraIm} $${d(can / 1000)}$ кг $=${d(can)}$ г.`]],
        ['Деление', [r.line]],
        ['Ответ на вопрос задачи', [otvet(r.n)]],
      ),
      hints: [
        vopros(`Сколько граммов в ${taraPr}?`, `$${d(can)}$`, [
          `$${d(can / 10)}$`,
          `$${d(can / 1000)}$`,
        ]),
        vopros(`Сколько граммов ${mat} нужно?`, `$${d(need)}$`, [
          `$${d(g + area)}$`,
          `$${d(need / 10)}$`,
        ]),
        vopros(
          `Как округлить, если ${taraRod} получилось дробное число?`,
          `вверх: ${mat} должно хватить`,
          ['вниз', 'по обычному правилу'],
        ),
        chtoSprashivayut(`наименьшее число ${taraRod}`, [`массу ${mat}`, 'площадь']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-06 Округление вверх: курс лечения ────────────────────── */

const RZ06 = rz(
  'RZ-06',
  'Округление вверх: курс лечения',
  ['лекарство', 'таблетки', 'упаковки', 'курс'],
  (p) => {
    const dose = num(p, 'dose');
    const times = num(p, 'times');
    const days = num(p, 'days');
    const pack = num(p, 'pack');
    const tab = num(p, 'tab');
    const perDose = val(div(q(Math.round(dose * 1000)), q(Math.round(tab * 1000))));
    const tablets = perDose * times * days;
    const r = vverh(tablets, pack);
    return {
      uslovie: `Врач прописал лекарство по ${txt(dose)} г ${times} раза в день в течение ${txt(days)} ${plural(days, 'дня', 'дней', 'дней')}. В одной упаковке ${txt(pack)} таблеток по ${txt(tab)} г. Какого наименьшего количества упаковок хватит на весь курс?`,
      answer: r.n,
      etapy: etapy(
        ['Таблеток за приём', [`$${d(dose)}:${d(tab)}=${d(perDose)}$.`]],
        ['Таблеток за курс', [`$${d(perDose)}\\cdot${d(times)}\\cdot${d(days)}=${d(tablets)}$.`]],
        ['Упаковки', [r.line]],
        ['Ответ на вопрос задачи', [otvet(r.n)]],
      ),
      hints: [
        vopros('Сколько таблеток нужно на весь курс?', `$${d(tablets)}$`, [
          `$${d(times * days * dose)}$`,
          `$${d(days * perDose)}$`,
        ]),
        vopros(
          r.ostatok
            ? 'Последняя упаковка будет неполной. Что делать?'
            : 'Делится ли число таблеток на упаковки нацело?',
          r.ostatok ? 'покупать её целиком — округлить вверх' : 'да, округлять не нужно',
          r.ostatok
            ? ['не покупать — округлить вниз', 'округлить по правилу']
            : ['нет, округляем вверх', 'нет, округляем вниз'],
        ),
        chtoSprashivayut('наименьшее число упаковок', ['число таблеток', 'число дней']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-07 Округление по правилу ─────────────────────────────── */

const RZ07 = rz(
  'RZ-07',
  'Округление по правилу',
  ['узлы', 'морская миля', 'унция', 'округлите до целого'],
  (p) => {
    const form = str(p, 'form', ['yahta', 'unciya'] as const);
    const k = num(p, 'k');
    const unit = num(p, 'unit');
    if (form === 'yahta') {
      const kmh = round9((k * unit) / 1000);
      const ans = Math.round(kmh);
      return {
        uslovie: `Скорость яхты ${txt(k)} узлов, то есть ${txt(k)} морских миль в час. Морская миля равна ${txt(unit)} м. Какова скорость яхты в километрах в час? Ответ округлите до целого числа.`,
        answer: ans,
        etapy: etapy(
          ['В метрах', [`$${d(k)}\\cdot${d(unit)}=${d(k * unit)}$ м в час.`]],
          ['В километрах', [`$${d(k * unit)}$ м $=${d(kmh)}$ км, скорость $${d(kmh)}$ км/ч.`]],
          [
            'Округление',
            [`По правилу: смотрим на первую отбрасываемую цифру — $${d(kmh)}\\approx${d(ans)}$.`],
          ],
          ['Ответ на вопрос задачи', [otvet(ans)]],
        ),
        hints: [
          vopros('Сколько километров в морской миле?', `$${d(unit / 1000)}$`, [
            `$${d(unit)}$`,
            `$${d(unit / 100)}$`,
          ]),
          vopros(`Как округлить $${d(kmh)}$ до целого?`, `$${d(ans)}$`, [
            `$${d(Math.floor(kmh) === ans ? ans + 1 : Math.floor(kmh))}$`,
            `$${d(k)}$`,
          ]),
          chtoSprashivayut('скорость в км/ч, округлённую до целого', [
            'скорость в узлах',
            'длину мили',
          ]),
        ],
        lifehacks: ['fast-count'],
      };
    }
    const g = round9(k * unit);
    const ans = Math.round(g);
    return {
      uslovie: `В рецепте указано ${txt(k)} унций муки. Одна унция равна ${txt(unit)} г. Сколько граммов муки нужно? Ответ округлите до целого.`,
      answer: ans,
      etapy: etapy(
        ['Умножение', [`$${d(k)}\\cdot${d(unit)}=${d(g)}$ г.`]],
        ['Округление', [`По правилу: $${d(g)}\\approx${d(ans)}$.`]],
        ['Ответ на вопрос задачи', [otvet(ans)]],
      ),
      hints: [
        vopros('Сколько граммов в рецепте?', `$${d(g)}$`, [
          `$${d(round9(unit / k))}$`,
          `$${d(k + unit)}$`,
        ]),
        vopros(`Как округлить $${d(g)}$ до целого?`, `$${d(ans)}$`, [
          `$${d(ans === Math.floor(g) ? ans + 1 : Math.floor(g))}$`,
          `$${d(Math.round(g / 10) * 10 === ans ? ans + 10 : Math.round(g / 10) * 10)}$`,
        ]),
        chtoSprashivayut(`массу ${slovo(p, 'produkt', 'муки')} в граммах`, [
          `число ${slovo(p, 'edMn', 'унций')}`,
          `массу одной ${slovo(p, 'ed', 'унции')}`,
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-08 Округление вниз с дополнительным условием ─────────── */

const RZ08 = rz(
  'RZ-08',
  'Округление вниз с дополнительным условием',
  ['воздушные шары', 'чётное число', 'наибольшее число', 'округление вниз'],
  (p) => {
    const price = num(p, 'price');
    const money = num(p, 'money');
    /* Аналог: букет из нечётного числа роз — та же модель, другая чётность. */
    const nechet = str(p, 'chetnost', ['chet', 'nechet'] as const) === 'nechet';
    const formy = slovo(p, 'predmet', 'шар|шара|шаров').split('|') as [string, string, string];
    const lishniy = slovo(p, 'lishniy', 'на лишний шар');
    const chet = nechet ? 'нечётное' : 'чётное';
    const most = Math.floor(money / price);
    const ans = (most % 2 === 1) === nechet ? most : most - 1;
    return {
      uslovie: `Для праздника нужна связка из чётного числа воздушных шаров. Один шар стоит ${txt(price)} рублей. У Пети ${txt(money)} рублей. Из какого наибольшего числа шаров он может купить связку?`,
      answer: ans,
      etapy: etapy(
        [
          'Деление',
          [
            `$${d(money)}:${d(price)}=${fq(q(money, price), true)}$ — денег хватит не больше чем на $${d(most)}$ ${sk(most, formy).split(/\s/)[1]} (округляем **вниз**).`,
          ],
        ],
        [
          'Дополнительное условие',
          [
            most === ans
              ? `$${d(most)}$ — ${chet}, подходит.`
              : `$${d(most)}$ — ${nechet ? 'чётное' : 'нечётное'}, берём ближайшее меньшее ${chet}: $${d(ans)}$.`,
          ],
        ],
        ['Ответ на вопрос задачи', [otvet(ans)]],
      ),
      hints: [
        vopros(
          `Как округлить число ${formy[2]}, на которые хватит денег?`,
          `вниз — ${lishniy} денег нет`,
          ['вверх', 'по правилу'],
        ),
        vopros(`На сколько ${formy[2]} хватит денег?`, `$${d(most)}$`, [
          `$${d(most + 1)}$`,
          `$${d(ans === most ? most - 2 : ans)}$`,
        ]),
        chtoSprashivayut(`наибольшее ${chet} число ${formy[2]}`, [
          `наибольшее число ${formy[2]}`,
          'сдачу',
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-09 Наибольшее число после повышения цены ─────────────── */

const RZ09 = rz(
  'RZ-09',
  'Наибольшее число после повышения цены',
  ['тетрадь', 'повышения цены', 'наибольшее число'],
  (p) => {
    const price = num(p, 'price');
    const money = num(p, 'money');
    const pp = num(p, 'p');
    const nw = val(mul(q(price), q(100 + pp, 100)));
    const exact = div(q(money), q(nw));
    const ans = Math.floor(val(exact) + 1e-12);
    const whole = exact.m === 1;
    /* Слова сюжета аналога: ручки, билеты, шоколадки. */
    const tovar = slovo(p, 'tovar', 'тетрадь|тетради|тетрадей').split('|') as [
      string,
      string,
      string,
    ];
    const z: Zveno = {
      stroki: [
        [100, price],
        [100 + pp, null],
      ],
      ed: 'руб.',
      podpisi: ['проценты', 'рубли'],
      notes: ['цена была', 'цена стала'],
      prelyudiya: [`Цену повысили на $${pct(pp)}$: $100\\%+${pct(pp)}=${pct(100 + pp)}$.`],
      pervoe: true,
    };
    const r = reshitZveno(z);
    sverit(r, nw, 'РЗ-09');
    return {
      uslovie: `Тетрадь стоит ${txt(price)} рублей. Какое наибольшее число таких тетрадей можно купить на ${txt(money)} рублей после повышения цены на ${txt(pp)}%?`,
      answer: ans,
      etapy: etapy(
        shag100(`Повышение считают **от старой цены** — она $100\\%$.`),
        ...r.etapy,
        [
          'Сколько можно купить',
          [
            whole
              ? `$${d(money)}:${d(nw)}=${d(ans)}$ — нацело.`
              : `$${d(money)}:${d(nw)}=${fq(exact, true)}$ — на дробную часть ${tovar[1]} денег нет, округляем **вниз**.`,
          ],
        ],
        ['Ответ на вопрос задачи', [otvet(ans)]],
      ),
      hints: [
        vopros('Что принимаем за $100\\%$?', 'старую цену', ['новую цену', 'всю сумму денег']),
        ...podskazkiZvena(z, r),
        vopros(
          'Как округлить результат деления?',
          whole ? 'округлять не нужно — делится нацело' : 'вниз',
          whole ? ['вверх', 'вниз на единицу'] : ['вверх', 'по правилу'],
        ),
        chtoSprashivayut(`наибольшее число ${tovar[2]}`, ['новую цену', 'сдачу']),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-10 Цена до изменения ─────────────────────────────────── */

const RZ10 = rz(
  'RZ-10',
  'Цена до изменения',
  ['цена снизилась', 'до снижения', 'пылесос'],
  (p) => {
    const pp = num(p, 'p');
    const nw = num(p, 'N');
    /* «Найди ошибку»: снижение записано как повышение. */
    const znak = osh(p) === 'procent-znak' ? '+' : '-';
    const dolya = znak === '+' ? 100 + pp : 100 - pp;
    const old = val(div(q(nw * 100), q(dolya)));
    const z: Zveno = {
      stroki: [
        [100, null],
        [dolya, nw],
      ],
      ed: 'руб.',
      podpisi: ['проценты', 'рубли'],
      notes: ['цена до снижения', 'цена после снижения'],
      prelyudiya: [
        `Цена снизилась на $${pct(pp)}$: $100\\%${znak}${pct(pp)}=${pct(dolya)}$ — столько процентов старой цены осталось.`,
      ],
      pervoe: true,
    };
    const r = reshitZveno(z);
    sverit(r, old, 'РЗ-10');
    return {
      uslovie: `Цена пылесоса снизилась на ${txt(pp)}% и составила ${txt(nw)} рублей. Сколько рублей стоил пылесос до снижения цены?`,
      answer: old,
      etapy: etapy(
        shag100(
          'Скидку считают **от старой цены** — с ней сравнивают. Значит, старая цена — $100\\%$.',
        ),
        ...r.etapy,
        ['Ответ на вопрос задачи', ['Спрашивают цену до снижения — это и есть $x$.', otvet(old)]],
      ),
      hints: [
        vopros('Что принимаем за $100\\%$?', 'старую цену', ['новую цену', 'скидку']),
        vopros('Сколько процентов составляет новая цена?', `$${pct(100 - pp)}$`, [
          `$${pct(pp)}$`,
          `$${pct(100 + pp)}$`,
        ]),
        ...podskazkiZvena(z, r),
        chtoSprashivayut('цену до снижения', ['размер скидки', 'новую цену']),
      ],
      lifehacks: ['fast-count'],
    };
  },
  ['procent-znak'],
);

/* ── РЗ-11 Налог ─────────────────────────────────────────────── */

const RZ11 = rz(
  'RZ-11',
  'Налог: зарплата по сумме на руки',
  ['налог', 'зарплата', 'после удержания'],
  (p) => {
    const pp = num(p, 'p');
    const N = num(p, 'N');
    /* «Найди ошибку»: удержание налога записано как прибавка. */
    const znak = osh(p) === 'procent-znak' ? '+' : '-';
    const dolya = znak === '+' ? 100 + pp : 100 - pp;
    const x = val(div(q(N * 100), q(dolya)));
    const z: Zveno = {
      stroki: [
        [100, null],
        [dolya, N],
      ],
      ed: 'руб.',
      podpisi: ['проценты', 'рубли'],
      notes: ['зарплата', 'на руки'],
      prelyudiya: [
        `$100\\%${znak}${pct(pp)}=${pct(dolya)}$ — после удержания налога остаётся $${pct(dolya)}$ зарплаты.`,
      ],
      pervoe: true,
    };
    const r = reshitZveno(z);
    sverit(r, x, 'РЗ-11');
    return {
      uslovie: `Налог на доходы составляет ${txt(pp)}% от заработной платы. После удержания налога Ольга Петровна получила ${txt(N)} рублей. Сколько рублей составляет её заработная плата?`,
      answer: x,
      etapy: etapy(
        shag100(
          'Здесь налог берут **от** зарплаты, значит, вся зарплата (до налога) — это $100\\%$.',
        ),
        ...r.etapy,
        [
          'Ответ на вопрос задачи',
          ['Спрашивают зарплату до удержания налога — это и есть $x$.', otvet(x)],
        ],
      ),
      hints: [
        vopros('Что принимаем за $100\\%$?', 'зарплату до налога', ['сумму на руки', 'налог']),
        vopros('Сколько процентов зарплаты получено на руки?', `$${pct(100 - pp)}$`, [
          `$${pct(pp)}$`,
          `$${pct(100 + pp)}$`,
        ]),
        ...podskazkiZvena(z, r),
        chtoSprashivayut('зарплату до налога', ['сумму налога', 'сумму на руки']),
      ],
      lifehacks: ['fast-count'],
    };
  },
  ['procent-znak'],
);

/* ── РЗ-12 «За 100% — каждый раз своё» ───────────────────────── */

const RZ12 = rz(
  'RZ-12',
  'За 100% — каждый раз своё',
  ['жители', 'дети', 'пенсионеры', 'взрослые'],
  (p) => {
    const N = num(p, 'N');
    const p1 = num(p, 'p1');
    const p2 = num(p, 'p2');
    const adults = (N * (100 - p1)) / 100;
    const ans = (adults * (100 - p2)) / 100;
    /* Слова сюжета аналога: школа, ученики, мальчики, спортсмены… */
    const mesto = slovo(p, 'mesto', 'в посёлке');
    const vse = slovo(p, 'vse', 'все жители');
    const vseRod = slovo(p, 'vseRod', 'всех жителей');
    const gr = slovo(p, 'gr', 'взрослых');
    const detiRod = slovo(p, 'detiRod', 'детей');
    const chast = slovo(p, 'chast', 'пенсионеров');
    const otvetChto = slovo(p, 'otvetChto', 'число взрослых — не пенсионеров');
    const z1: Zveno = {
      stroki: [
        [100, N],
        [100 - p1, null],
      ],
      podpisi: ['проценты', 'количество'],
      notes: [vse, 'остальные'],
      prelyudiya: [`Без ${detiRod} остаётся $100\\%-${pct(p1)}=${pct(100 - p1)}$ ${vseRod}.`],
      pervoe: true,
      nomer: 1,
    };
    const r1 = reshitZveno(z1);
    sverit(r1, adults, 'РЗ-12, шаг 1');
    const z2: Zveno = {
      stroki: [
        [100, adults],
        [100 - p2, null],
      ],
      podpisi: ['проценты', 'количество'],
      notes: ['все остальные — новые 100 %', `кроме ${chast}`],
      bukva: 'y',
      nomer: 2,
      prelyudiya: [
        `**Новые $100\\%$:** теперь сравниваем с числом ${gr} — это $${d(adults)}$, а не ${vse}. Без ${chast} остаётся $100\\%-${pct(p2)}=${pct(100 - p2)}$.`,
      ],
    };
    const r2 = reshitZveno(z2);
    sverit(r2, ans, 'РЗ-12, шаг 2');
    return {
      uslovie: `В посёлке ${txt(N)} жителей. Из них ${txt(p1)}% — дети и подростки. Среди взрослых ${txt(p2)}% — пенсионеры. Сколько взрослых жителей посёлка не являются пенсионерами?`,
      answer: ans,
      etapy: etapy(
        shag100(
          `В первый раз проценты считают **от** числа ${vseRod} — оно $100\\%$.`,
          `**Важно:** во второй раз («среди ${gr}») проценты считают **от** числа ${gr} — тогда за $100\\%$ берём уже его.`,
        ),
        ...r1.etapy,
        ...r2.etapy,
        ['Ответ на вопрос задачи', [`Спрашивают ${otvetChto} — это $y$.`, otvet(ans)]],
      ),
      hints: [
        vopros('Что за $100\\%$ в первый раз?', `число ${vseRod}`, [
          `число ${gr}`,
          `число ${detiRod}`,
        ]),
        ...podskazkiZvena(z1, r1).slice(0, 1),
        vopros(`Сколько ${mesto} ${gr}?`, `$${d(adults)}$`, [
          `$${d((N * p1) / 100)}$`,
          `$${d(N)}$`,
        ]),
        vopros(`От чего считаются $${pct(p2)}$ ${chast}?`, `от числа ${gr}`, [
          `от числа ${vseRod}`,
          `от числа ${detiRod}`,
        ]),
        ...podskazkiZvena(z2, r2).slice(1),
        chtoSprashivayut(otvetChto, [`число ${chast}`, `число ${gr}`]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-13 На сколько процентов больше / меньше ──────────────── */

const RZ13 = rz(
  'RZ-13',
  'На сколько процентов больше или меньше',
  ['на сколько процентов больше', 'на сколько процентов меньше'],
  (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const ask = str(p, 'ask', ['bolshe', 'menshe'] as const);
    const bolshe = ask === 'bolshe';
    const base = bolshe ? b : a;
    const drugoe = bolshe ? a : b;
    const ans = val(div(q((a - b) * 100), q(base)));
    const vsego = round9((drugoe * 100) / base);
    const z: Zveno = {
      stroki: [
        [100, base],
        [null, drugoe],
      ],
      podpisi: ['проценты', 'числа'],
      notes: ['с чем сравниваем', 'что сравниваем'],
      pervoe: true,
    };
    const r = reshitZveno(z);
    sverit(r, vsego, 'РЗ-13');
    return {
      uslovie: bolshe
        ? `На сколько процентов ${txt(a)} больше, чем ${txt(b)}?`
        : `На сколько процентов ${txt(b)} меньше, чем ${txt(a)}?`,
      answer: ans,
      etapy: etapy(
        shag100(
          `Здесь сравнивают **с** числом $${d(base)}$ — оно стоит после слова «чем». Значит, $${d(base)}$ — это $100\\%$.`,
        ),
        ...r.etapy,
        [
          'Ответ на вопрос задачи',
          [
            bolshe
              ? `$${d(a)}$ — это $${pct(vsego)}$ от $${d(b)}$: $${pct(vsego)}-100\\%=${pct(ans)}$ — на столько больше.`
              : `$${d(b)}$ — это $${pct(vsego)}$ от $${d(a)}$: $100\\%-${pct(vsego)}=${pct(ans)}$ — на столько меньше.`,
            `Сравните с парной задачей: «${bolshe ? `на сколько процентов ${txt(b)} меньше ${txt(a)}` : `на сколько процентов ${txt(a)} больше ${txt(b)}`}» — ответ другой, $${pct(val(div(q((a - b) * 100), q(bolshe ? a : b))))}$: там за $100\\%$ берут другое число.`,
            otvet(ans),
          ],
        ],
      ),
      hints: [
        vopros('Что принимаем за $100\\%$?', `$${d(base)}$ — с чем сравниваем`, [
          `$${d(drugoe)}$`,
          `$${d(a + b)}$`,
        ]),
        ...podskazkiZvena(z, r),
        chtoSprashivayut(bolshe ? 'на сколько процентов больше' : 'на сколько процентов меньше', [
          'во сколько раз больше',
          'разницу чисел',
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-14 Обратное сравнение ────────────────────────────────── */

const RZ14 = rz(
  'RZ-14',
  'Обратное сравнение',
  ['одно число больше другого', 'на сколько процентов меньше'],
  (p) => {
    const pp = num(p, 'p');
    /* «a на p% больше b — на сколько b меньше a» (банк) и обратный
       вариант аналогов: «a на p% меньше b — на сколько b больше a». */
    const bolshe = str(p, 'ask', ['menshe', 'bolshe'] as const) === 'bolshe';
    const A = bolshe ? 100 - pp : 100 + pp;
    const vsego = round9(10_000 / A);
    const ans = round9(Math.abs(vsego - 100));
    /* Сюжет аналога: что обозначают a и b. */
    const oboz = slovo(p, 'oboz', '');
    const z: Zveno = {
      stroki: [
        [100, A],
        [null, 100],
      ],
      ed: 'ед.',
      podpisi: ['проценты', 'единицы'],
      notes: ['$a$ — теперь с ним сравниваем', '$b$'],
      prelyudiya: [
        `Теперь сравниваем **с** $a$ — оно за $100\\%$. Сколько процентов от $a$ составляет $b$?`,
      ],
      pervoe: true,
      nomer: 2,
    };
    const r = reshitZveno(z);
    sverit(r, vsego, 'РЗ-14');
    return {
      uslovie: bolshe
        ? `Число $a$ на ${txt(pp)}% меньше числа $b$. На сколько процентов $b$ больше $a$?`
        : `Число $a$ на ${txt(pp)}% больше числа $b$. На сколько процентов $b$ меньше $a$?`,
      answer: ans,
      etapy: etapy(
        shag100(
          `В условии сравнивают **с** $b$ («${bolshe ? 'меньше' : 'больше'} числа $b$») — оно $100\\%$. А в вопросе сравнивают **с** $a$ — тогда за $100\\%$ берём $a$.`,
        ),
        [
          'Краткая запись (шаг 1)',
          [
            ...(oboz === '' ? [] : [oboz]),
            `Чисел нет — удобно взять своё: **примем $b$ за $100$ единиц.** Тогда $a$ на $${pct(pp)}$ ${bolshe ? 'меньше' : 'больше'}: $100\\%${bolshe ? '-' : '+'}${pct(pp)}=${pct(A)}$, то есть $${d(A)}$ единиц.`,
            zapisBezNeizvestnogo([
              ['100\\%', '100\\ (\\text{ед.})', '$b$'],
              [pct(A), `${d(A)}\\ (\\text{ед.})`, '$a$'],
            ]),
          ],
        ],
        ...r.etapy,
        [
          'Ответ на вопрос задачи',
          [
            `$b$ — это $${pct(vsego)}$ от $a$: ${bolshe ? `$${pct(vsego)}-100\\%$` : `$100\\%-${pct(vsego)}$`}$=${pct(ans)}$.`,
            `Не $${pct(pp)}$: проценты берутся от разных чисел.`,
            otvet(ans),
          ],
        ],
      ),
      hints: [
        vopros('С чем сравнивают в вопросе?', 'с $a$', ['с $b$', 'с разницей']),
        vopros(`Если $b=100$, чему равно $a$?`, `$${d(A)}$`, [`$${d(200 - A)}$`, `$${d(pp)}$`]),
        ...podskazkiZvena(z, r),
        chtoSprashivayut(
          bolshe ? 'на сколько процентов $b$ больше $a$' : 'на сколько процентов $b$ меньше $a$',
          bolshe
            ? ['на сколько процентов $a$ меньше $b$', 'во сколько раз $b$ больше $a$']
            : ['на сколько процентов $a$ больше $b$', 'во сколько раз $a$ больше $b$'],
        ),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-15 Изменение дроби ───────────────────────────────────── */

const RZ15 = rz(
  'RZ-15',
  'Изменение дроби',
  ['числитель', 'знаменатель', 'дробь увеличилась'],
  (p) => {
    const p1 = num(p, 'p1');
    const p2 = num(p, 'p2');
    const k = div(q(100 + p1, 100), q(100 - p2, 100));
    const ans = val(mul(sub(k, q(1)), q(100)));
    /* Аналог: скорость = путь : время, цена = стоимость : масса… */
    const drob = slovo(p, 'drob', 'дробь');
    const chisl = slovo(p, 'chisl', 'числитель');
    const znam = slovo(p, 'znam', 'знаменатель');
    const vsego = round9(val(k) * 100);
    const z: Zveno = {
      stroki: [
        [100, 100 - p2],
        [null, 100 + p1],
      ],
      ed: 'ед.',
      podpisi: ['проценты', 'единицы'],
      notes: ['новый знаменатель', 'новый числитель'],
      prelyudiya: [
        `Новая ${drob} — это новый числитель, делённый на новый знаменатель, то есть сколько процентов **от нового знаменателя** составляет новый числитель:`,
      ],
      pochemu:
        'Величины прямо пропорциональны: чем больше единиц, тем больше процентов. Отношения в столбцах равны — составляем пропорцию.',
      pervoe: true,
      nomer: 2,
    };
    const r = reshitZveno(z);
    sverit(r, vsego, 'РЗ-15');
    return {
      uslovie: `Числитель дроби увеличили на ${txt(p1)}%, а знаменатель уменьшили на ${txt(p2)}%. На сколько процентов увеличилась дробь?`,
      answer: ans,
      etapy: etapy(
        shag100(
          `Изменения считают **от прежних** величин: прежний ${chisl} — $100\\%$, прежний ${znam} — тоже $100\\%$, прежняя ${drob} — $100\\%$.`,
        ),
        [
          'Краткая запись (шаг 1)',
          [
            `Чисел нет — удобно взять свои: **примем прежние ${chisl} и ${znam} за $100$ единиц** — тогда прежняя ${drob} равна $1$, то есть $100\\%$.`,
            zapisBezNeizvestnogo([
              [`100\\%\\to${pct(100 + p1)}`, `${d(100 + p1)}\\ (\\text{ед.})`, chisl],
              [`100\\%\\to${pct(100 - p2)}`, `${d(100 - p2)}\\ (\\text{ед.})`, znam],
            ]),
          ],
        ],
        ...r.etapy,
        [
          'Ответ на вопрос задачи',
          [
            `${(drob[0]?.toUpperCase() ?? '') + drob.slice(1)} стала $${pct(vsego)}$ прежней: $${pct(vsego)}-100\\%=${pct(ans)}$.`,
            otvet(ans),
          ],
        ],
      ),
      hints: [
        vopros(
          `Если прежние ${chisl} и ${znam} — по $100$ единиц, чему равны новые?`,
          `$${d(100 + p1)}$ и $${d(100 - p2)}$`,
          [`$${d(p1)}$ и $${d(p2)}$`, `$${d(100 - p1)}$ и $${d(100 + p2)}$`],
        ),
        ...podskazkiZvena(z, r),
        chtoSprashivayut(`на сколько процентов увеличилась ${drob}`, [
          `во сколько раз увеличилась ${drob}`,
          slovo(p, 'novyy', 'новый числитель'),
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-16 Изменение площади ─────────────────────────────────── */

const RZ16 = rz(
  'RZ-16',
  'Изменение площади',
  ['прямоугольник', 'площадь', 'сторону увеличили'],
  (p) => {
    const p1 = num(p, 'p1');
    const p2 = num(p, 'p2');
    const k = mul(q(100 + p1, 100), q(100 + p2, 100));
    const ans = val(mul(sub(k, q(1)), q(100)));
    /* Аналог: выручка = цена · количество, площадь грядки… */
    const vel = slovo(p, 'vel', 'площадь');
    const Vel = (vel[0]?.toUpperCase() ?? '') + vel.slice(1);
    const velVin = slovo(p, 'velVin', 'площадь');
    const vsego = round9(val(k) * 100);
    const z: Zveno = {
      stroki: [
        [100, 10_000],
        [null, (100 + p1) * (100 + p2)],
      ],
      ed: 'ед.',
      podpisi: ['проценты', 'единицы'],
      notes: [`прежняя ${vel}`, `новая ${vel}`],
      pervoe: true,
      nomer: 2,
    };
    const r = reshitZveno(z);
    sverit(r, vsego, 'РЗ-16');
    return {
      uslovie: `Одну сторону прямоугольника увеличили на ${txt(p1)}%, а другую — на ${txt(p2)}%. На сколько процентов увеличилась площадь?`,
      answer: ans,
      etapy: etapy(
        shag100(`Изменения считают **от прежних** величин: прежняя ${vel} — $100\\%$.`),
        [
          'Краткая запись (шаг 1)',
          [
            `Чисел нет — удобно взять свои: **примем оба множителя за $100$ единиц.** Тогда прежняя ${vel} — $100\\cdot100=10\\,000$, а новая — $${d(100 + p1)}\\cdot${d(100 + p2)}=${d((100 + p1) * (100 + p2))}$.`,
            zapisBezNeizvestnogo([
              [`100\\%\\to${pct(100 + p1)}`, `${d(100 + p1)}\\ (\\text{ед.})`, 'первый множитель'],
              [`100\\%\\to${pct(100 + p2)}`, `${d(100 + p2)}\\ (\\text{ед.})`, 'второй множитель'],
            ]),
          ],
        ],
        ...r.etapy,
        [
          'Ответ на вопрос задачи',
          [
            `${Vel} стала $${pct(vsego)}$ прежней: $${pct(vsego)}-100\\%=${pct(ans)}$.`,
            `Не $${pct(p1 + p2)}$: проценты не складываются.`,
            otvet(ans),
          ],
        ],
      ),
      hints: [
        vopros(
          `Если оба множителя — по $100$ единиц, чему равна новая ${velVin}?`,
          `$${d((100 + p1) * (100 + p2))}$`,
          [`$${d(10_000 + (p1 + p2) * 100)}$`, `$${d(100 + p1 + p2)}$`],
        ),
        ...podskazkiZvena(z, r),
        chtoSprashivayut(`на сколько процентов увеличилась ${vel}`, [
          'во сколько раз',
          `новую ${velVin}`,
        ]),
      ],
      lifehacks: ['fast-count'],
    };
  },
);

/* ── РЗ-17 a% от b = b% от a ─────────────────────────────────── */

const RZ17 = rz(
  'RZ-17',
  'Лайфхак: проценты и число можно поменять местами',
  ['процент от числа', 'что больше'],
  (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const v = round9((a * b) / 100);
    const options = [`${txt(a)}% от ${txt(b)}`, `${txt(b)}% от ${txt(a)}`, 'одинаково'];
    const z1: Zveno = {
      stroki: [
        [100, b],
        [a, null],
      ],
      podpisi: ['проценты', 'числа'],
      pervoe: true,
      nomer: 1,
    };
    const r1 = reshitZveno(z1);
    const z2: Zveno = {
      stroki: [
        [100, a],
        [b, null],
      ],
      podpisi: ['проценты', 'числа'],
      bukva: 'y',
      nomer: 2,
    };
    const r2 = reshitZveno(z2);
    sverit(r1, v, 'РЗ-17, первое');
    sverit(r2, v, 'РЗ-17, второе');
    const s: Solved = {
      uslovie: `Что больше: ${txt(a)}% от ${txt(b)} или ${txt(b)}% от ${txt(a)}?`,
      answer: v,
      etapy: etapy(
        shag100(
          `«${txt(a)}% **от** ${txt(b)}» — за $100\\%$ берём $${d(b)}$; «${txt(b)}% **от** ${txt(a)}» — за $100\\%$ берём $${d(a)}$.`,
        ),
        ...r1.etapy,
        ...r2.etapy,
        [
          'Почему так',
          [
            `Оба равны $\\dfrac{${d(a)}\\cdot${d(b)}}{100}$: от перестановки множителей произведение не меняется. Удобно: $${pct(a)}$ от $${d(b)}$ = $${pct(b)}$ от $${d(a)}$ — считаем то, что проще.`,
          ],
        ],
        ['Ответ на вопрос задачи', [`**Ответ:** одинаково, оба числа равны $${d(v)}$.`]],
      ),
      hints: [
        vopros(`Что за $100\\%$ в «$${pct(a)}$ от $${d(b)}$»?`, `$${d(b)}$`, [
          `$${d(a)}$`,
          '$100$',
        ]),
        ...podskazkiZvena(z1, r1),
        vopros(`А $${pct(b)}$ от $${d(a)}$?`, `$\\dfrac{${d(b)}\\cdot${d(a)}}{100}$`, [
          `$\\dfrac{${d(b)}}{${d(a)}}\\cdot100$`,
          `$${d(a)}+${d(b)}$`,
        ]),
      ],
      lifehacks: ['fast-count'],
      vybor: { options, correct: 2 },
    };
    return s;
  },
);

/* ── РЗ-18 Время по расписанию ───────────────────────────────── */

const RZ18 = rz('RZ-18', 'Время по расписанию', ['пара', 'перерыв', 'расписание'], (p) => {
  const t0 = num(p, 't0'); // минуты от полуночи
  const br = num(p, 'br');
  const t1 = num(p, 't1');
  const len = t1 - t0 - br;
  const ans = val(q(len, 60));
  /* Аналог: урок и перемена, сеанс и уборка зала, тренировка… */
  const zan = slovo(p, 'zan', 'пара');
  const zanRod = slovo(p, 'zanRod', 'пары');
  const pervaya = slovo(p, 'pervaya', 'первая пара');
  const dve = slovo(p, 'dve', 'две пары');
  const per = slovo(p, 'per', 'перерыв');
  const perRod = slovo(p, 'perRod', 'перерыва');
  const Zan = (zan[0]?.toUpperCase() ?? '') + zan.slice(1);
  return {
    uslovie: `Первая пара начинается в ${chasy(t0 / 60, false)}. Перерыв длится ${sk(br, SLOVA.minutu)}, а вторая пара начинается в ${chasy(t1 / 60, false)}. Сколько длится пара? Ответ выразите в часах.`,
    answer: ans,
    etapy: etapy(
      [
        'Промежуток',
        [
          `С ${chasy(t0 / 60, false)} до ${chasy(t1 / 60, false)} — $${d(t1 - t0)}$ мин: это ${zan} и ${per}.`,
        ],
      ],
      [Zan, [`$${d(t1 - t0)}-${d(br)}=${d(len)}$ мин.`]],
      ['В часах', [`$${d(len)}:60=${d(ans)}$ ч.`]],
      ['Ответ на вопрос задачи', [otvet(ans)]],
    ),
    hints: [
      vopros(
        `Сколько минут от ${chasy(t0 / 60, false)} до ${chasy(t1 / 60, false)}?`,
        `$${d(t1 - t0)}$`,
        [
          `$${d(t1 - t0 - 40)}$`,
          `$${d(Math.floor(t1 / 60) * 100 + (t1 % 60) - Math.floor(t0 / 60) * 100 - (t0 % 60))}$`,
        ],
      ),
      vopros('Что входит в этот промежуток?', `${pervaya} и ${per}`, [`только ${zan}`, dve]),
      chtoSprashivayut(`длину ${zanRod} в часах`, [`длину ${zanRod} в минутах`, `длину ${perRod}`]),
    ],
    lifehacks: ['fast-count'],
  };
});

export const RZ: Subtype[] = [
  RZ01,
  RZ02,
  RZ03,
  RZ04,
  RZ05,
  RZ06,
  RZ07,
  RZ08,
  RZ09,
  RZ10,
  RZ11,
  RZ12,
  RZ13,
  RZ14,
  RZ15,
  RZ16,
  RZ17,
  RZ18,
];
