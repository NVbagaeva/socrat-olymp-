/**
 * Шаблоны раздела «Варианты повышенной сложности» для задания №6.
 *
 * Прототипы того же устройства, что банк раздела (types.ts, `Prototype`):
 * условие, решение по этапам с таблицей, подсказки и независимый
 * пересчёт. В PROTOTYPES они не входят — в тренажёр и генератор раздела
 * не попадают; числа задаёт вариант.
 */

import {
  add,
  etapy,
  mul,
  num,
  otvetLine,
  q,
  strOpt,
  sub,
  t,
  tablica,
  tq,
  tx,
  vopros,
} from '../kit';
import type { Params, Prototype } from '../types';

/* ════════════════════ как 6.9: страхование в тысячах рублей ════════════════════ */

/** Что страхуют: начало условия и слово «полис» в нужной форме. */
interface SyuzhetPolisa {
  /** Первое предложение условия. */
  nachalo: string;
  /** Что случается: «при страховом случае», «если квартиру зальют». */
  sluchay: string;
}

const SYUZHETY_POLISA: Record<string, SyuzhetPolisa> = {
  kvartira: {
    nachalo: 'Страховая компания продаёт полисы страхования квартиры от залива.',
    sluchay: 'Если квартиру зальют, владелец получит выплату',
  },
  dacha: {
    nachalo: 'Страховая компания страхует дачные дома от пожара.',
    sluchay: 'При пожаре владелец дома получит выплату',
  },
  avto: {
    nachalo: 'Страховая компания продаёт водителям полисы страхования автомобиля от угона.',
    sluchay: 'При угоне владелец получит выплату',
  },
};

function sluchayText(p: Params): { nachalo: string; sluchay: string } {
  const sj = strOpt(p, 'sj');
  if (sj === undefined) {
    return {
      nachalo: 'Страховая компания продаёт клиентам страховые полисы.',
      sluchay: 'При наступлении страхового случая клиент получает выплату',
    };
  }
  const s = SYUZHETY_POLISA[sj];
  if (s === undefined) throw new Error(`pv6-strahovka-tys: нет сюжета ${sj}`);
  return s;
}

/**
 * Как 6.9 (P09), но суммы в тысячах рублей: выплата V тыс. руб. с
 * вероятностью pn/pden, ожидаемый доход компании с полиса R тыс. руб.;
 * найти цену полиса в тысячах рублей. Подвох тот же: доход — случайная
 * величина «c или c − V», M = c − V·p, а не c − V.
 */
export const PV6_STRAHOVKA_TYS: Prototype = {
  id: 'pv6-strahovka-tys',
  no: 9,
  group: 'III',
  title: 'Страхование: стоимость полиса по ожидаемому доходу, в тысячах рублей',
  formula: '$\\mathrm{M}(\\text{дохода})=c-V\\cdot p$, отсюда $c=\\mathrm{M}+V\\cdot p$',
  skills: ['stroka-xp'],
  istochnik: '',
  ris: () => undefined,
  uslovie(p) {
    const s = sluchayText(p);
    return {
      text: `${s.nachalo} ${s.sluchay} ${tx(num(p, 'V'))} тыс. рублей. Вероятность того, что по отдельно взятому полису придётся платить, равна ${tx(num(p, 'pn') / num(p, 'pden'))}. Математическое ожидание случайной величины «доход компании от продажи одного полиса» равно ${tx(num(p, 'R'))} тыс. рублей. Найдите стоимость полиса в тысячах рублей.`,
    };
  },
  solve(p) {
    const V = num(p, 'V');
    const R = num(p, 'R');
    const pr = q(num(p, 'pn'), num(p, 'pden'));
    const ne = sub(q(1), pr);
    const Vp = mul(q(V), pr);
    const c = add(q(R), Vp);
    const answer = c.n / c.m;
    const tab = tablica([
      { zag: 'Доход (тыс. руб.)', yach: ['$c$', `$c-${t(V)}$`] },
      { zag: 'Вероятность', yach: [`$${tq(ne)}$`, `$${tq(pr)}$`] },
    ]);
    return {
      answer,
      etapy: etapy(
        {
          t: 'Записываем доход как случайную величину',
          lines: [
            `Пусть полис стоит $c$ тыс. рублей. Если платить не придётся (вероятность $1-${tq(pr)}=${tq(ne)}$), доход равен $c$. Если выплата есть (вероятность $${tq(pr)}$), доход равен $c-${t(V)}$.`,
          ],
          tablica: tab,
        },
        {
          t: 'Находим математическое ожидание дохода',
          lines: [
            `$\\mathrm{M}=c\\cdot${tq(ne)}+(c-${t(V)})\\cdot${tq(pr)}=c-${t(V)}\\cdot${tq(pr)}=c-${tq(Vp)}$.`,
          ],
        },
        {
          t: 'Выражаем стоимость полиса',
          lines: [
            `По условию $c-${tq(Vp)}=${t(R)}$, откуда $c=${t(R)}+${tq(Vp)}=${tq(c)}$ тыс. рублей.`,
            otvetLine(answer),
          ],
        },
      ),
      vychisleniya: [
        {
          tekst: `Умножаем выплату на вероятность: $${t(V)}\\cdot${tq(pr)}=${tq(Vp)}$.`,
        },
      ],
      hints: [
        vopros(
          'Чему равен доход компании с полиса, если произошла выплата?',
          `$c-${t(V)}$`,
          [`$-${t(V)}$`, '$c$', `$${t(V)}-c$`],
          'Деньги за полис компания уже получила, а выплату отдаёт.',
        ),
        vopros('Чему равно математическое ожидание дохода?', `$c-${tq(Vp)}$`, [
          `$c-${t(V)}$`,
          `$c\\cdot${tq(ne)}$`,
        ]),
        vopros('Сколько тысяч рублей стоит полис?', `$${tq(c)}$`, [
          `$${tq(sub(q(R), Vp))}$`,
          `$${tq(add(q(R), q(V)))}$`,
          `$${t(R)}$`,
        ]),
      ],
    };
  },
  /* Другим путём: цена, при которой средний доход с pden полисов равен pden·R. */
  pereschet(p) {
    const pden = num(p, 'pden');
    const vyplat = num(p, 'pn');
    return Math.round(((pden * num(p, 'R') + vyplat * num(p, 'V')) / pden) * 1e9) / 1e9;
  },
  summy(p) {
    const pn = num(p, 'pn');
    const pden = num(p, 'pden');
    return [{ chto: 'выплата есть или нет', doli: [pn, pden - pn], nado: pden }];
  },
};
