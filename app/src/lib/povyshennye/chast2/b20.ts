/**
 * №20 (варианты 3–4): покупка товара четырёх видов по ценам
 * p₁ < p₂ < p₃ < p₄ на сумму не больше M; количества, упорядоченные по
 * убыванию, отличаются соседние не больше чем на 2.
 * а) можно ли купить A штук (да); б) B штук (нет); в) наименьшее число
 * штук, если сдача меньше p₁ (вид «min»), или наибольшее (вид «max»).
 *
 * Ответы — полным перебором; доказательства «нельзя» — оценками:
 * упорядоченные количества m₁ ≥ m₂ ≥ m₃ ≥ m₄ при сумме N удовлетворяют
 * m₂ ≥ (N − 2)/4, m₃ ≥ (N − 6)/4, m₄ ≥ (N − 12)/4, а стоимость не меньше
 * p₁m₁ + p₂m₂ + p₃m₃ + p₄m₄ и не больше p₄m₁ + p₃m₂ + p₂m₃ + p₁m₄.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

/** Сюжеты: что покупают, четыре вида (в порядке возрастания цены). */
const TOVARY = [
  {
    chto: 'наборы фломастеров',
    vidy: ['на 6 цветов', 'на 12 цветов', 'на 18 цветов', 'на 24 цвета'],
    ed: 'набор',
    mn: 'наборов',
    rod: 'наборов',
  },
  {
    chto: 'тетради',
    vidy: [
      'в клетку на 12 листов',
      'в линейку на 48 листов',
      'в клетку на 48 листов',
      'в клетку на 96 листов',
    ],
    ed: 'тетрадь',
    mn: 'тетрадей',
    rod: 'тетрадей',
  },
  {
    chto: 'горшки для рассады',
    vidy: ['торфяные', 'пластиковые', 'керамические малые', 'керамические большие'],
    ed: 'горшок',
    mn: 'горшков',
    rod: 'горшков',
  },
  {
    chto: 'мячи',
    vidy: ['теннисные', 'для настольного тенниса', 'резиновые', 'волейбольные тренировочные'],
    ed: 'мяч',
    mn: 'мячей',
    rod: 'мячей',
  },
  {
    chto: 'карандаши',
    vidy: ['простые', 'цветные', 'акварельные', 'угольные'],
    ed: 'карандаш',
    mn: 'карандашей',
    rod: 'карандашей',
  },
  {
    chto: 'кисти',
    vidy: ['щетинные', 'синтетические', 'беличьи', 'колонковые'],
    ed: 'кисть',
    mn: 'кистей',
    rod: 'кистей',
  },
] as const;

export interface PB20 {
  ceny: readonly [number, number, number, number];
  M: number;
  A: number;
  B: number;
  vid: 'min' | 'max';
  tovar: number;
}

/** Все допустимые наборы (n₁…n₄ по видам) со стоимостью ≤ M. */
export function nabory(p: PB20): number[][] {
  const [c1, c2, c3, c4] = p.ceny;
  const out: number[][] = [];
  for (let a = 0; a * c1 <= p.M; a += 1)
    for (let b = 0; a * c1 + b * c2 <= p.M; b += 1)
      for (let c = 0; a * c1 + b * c2 + c * c3 <= p.M; c += 1)
        for (let d = 0; a * c1 + b * c2 + c * c3 + d * c4 <= p.M; d += 1) {
          const s = [a, b, c, d].sort((x, y) => y - x);
          if (s[0]! - s[1]! <= 2 && s[1]! - s[2]! <= 2 && s[2]! - s[3]! <= 2)
            out.push([a, b, c, d]);
        }
  return out;
}

const cena = (p: PB20, n: readonly number[]) => n.reduce((s, x, i) => s + x * p.ceny[i]!, 0);
const sum = (n: readonly number[]) => n.reduce((s, x) => s + x, 0);

/** Нижние оценки m₂, m₃, m₄ при сумме N. */
export function ocenki(N: number): [number, number, number] {
  const c = (x: number) => Math.max(0, Math.ceil(x / 4));
  return [c(N - 2), c(N - 6), c(N - 12)];
}

/** Оценка снизу наименьшей стоимости N штук. */
export function nizhnyaya(p: PB20, N: number): number {
  const [c1, c2, c3, c4] = p.ceny;
  const [l2, l3, l4] = ocenki(N);
  return c1 * N + (c2 - c1) * l2 + (c3 - c1) * l3 + (c4 - c1) * l4;
}

/** Оценка сверху наибольшей стоимости N штук. */
export function verhnyaya(p: PB20, N: number): number {
  const [c1, c2, c3, c4] = p.ceny;
  const [l2, l3, l4] = ocenki(N);
  return c4 * N - (c4 - c3) * l2 - (c4 - c2) * l3 - (c4 - c1) * l4;
}

export function otvety20(p: PB20) {
  const vse = nabory(p);
  const mozhno = (N: number) => vse.find((n) => sum(n) === N) ?? null;
  const sdacha = (N: number) =>
    vse.find((n) => sum(n) === N && p.M - cena(p, n) < p.ceny[0]) ?? null;
  let L: number;
  if (p.vid === 'max') L = Math.max(...vse.map(sum));
  else {
    L = 0;
    while (sdacha(L) === null) L += 1;
  }
  return { vse, mozhno, sdacha, L };
}

function sobrat(p: PB20): Chast2Zadacha {
  const T = TOVARY[p.tovar];
  if (T === undefined) throw new Error('b20: нет сюжета');
  const [c1, c2, c3, c4] = p.ceny;
  if (!(c1 < c2 && c2 < c3 && c3 < c4)) throw new Error('b20: цены не по возрастанию');
  const { mozhno, sdacha, L } = otvety20(p);
  const primA = mozhno(p.A);
  if (primA === null || mozhno(p.B) !== null) throw new Error('b20: пункты а/б не те');
  /* Доказательство б) оценкой. */
  if (nizhnyaya(p, p.B) <= p.M) throw new Error('b20: оценка б) не работает');
  const primL = p.vid === 'max' ? mozhno(L)! : sdacha(L)!;
  if (p.vid === 'max' && nizhnyaya(p, L + 1) <= p.M) throw new Error('b20: оценка в) не работает');
  if (p.vid === 'min' && verhnyaya(p, L - 1) > p.M - c1)
    throw new Error('b20: оценка в) не работает');
  /* Оценки монотонны по N — на этом держатся «и больше» / «и меньше». */
  for (let N = 1; N < 4 * L; N += 1)
    if (nizhnyaya(p, N + 1) < nizhnyaya(p, N) || verhnyaya(p, N + 1) < verhnyaya(p, N))
      throw new Error('b20: оценка не монотонна');

  const vidy = T.vidy;
  const uslovie =
    `Покупают ${T.chto} четырёх видов: ${vidy[0]} — по $${c1}$ руб., ${vidy[1]} — по $${c2}$ руб., ${vidy[2]} — по $${c3}$ руб., ${vidy[3]} — по $${c4}$ руб. ` +
    `На покупку есть $${p.M}$ руб. Покупка должна удовлетворять условию: если $n_1\\ge n_2\\ge n_3\\ge n_4$ — купленные количества товаров каждого вида, расставленные по убыванию, то $n_k-n_{k+1}\\le2$ при $k=1,\\,2,\\,3$.\n` +
    `а) Можно ли купить $${p.A}$ ${T.mn}?\n` +
    `б) Можно ли купить $${p.B}$ ${T.mn}?\n` +
    (p.vid === 'min'
      ? `в) Какое наименьшее количество ${T.rod} можно купить, если сдача с покупки должна быть меньше цены самого дешёвого товара?`
      : `в) Какое наибольшее количество ${T.rod} можно купить?`);

  const nabTex = (n: readonly number[]) =>
    n.map((x, i) => `${x}\\cdot${p.ceny[i]}`).join('+') + `=${cena(p, n)}`;
  /* Набор по видам (в порядке возрастания цены) и он же по убыванию. */
  const opis = (n: readonly number[]) =>
    `$${n.join(',\\ ')}$ штук по видам в порядке возрастания цены (по убыванию: $${[...n].sort((x, y) => y - x).join(',\\ ')}$ — соседние отличаются не больше чем на 2)`;

  /* Общая оценка — нужна в б) и в). */
  const ocTex = (N: number) => {
    const [l2, l3, l4] = ocenki(N);
    return { l2, l3, l4 };
  };
  const ob = ocTex(p.B);
  const lbB = nizhnyaya(p, p.B);

  const vLines: string[] = [];
  if (p.vid === 'max') {
    const N = L + 1;
    const o = ocTex(N);
    vLines.push(
      `Пример на $${L}$ штук: ${opis(primL)}; стоимость $${nabTex(primL)}\\le${p.M}$.`,
      `Оценка снизу из б) $${c1}N+${c2 - c1}m_2+${c3 - c1}m_3+${c4 - c1}m_4$ с границами для $m_2$, $m_3$, $m_4$ растёт вместе с $N$. При $N=${N}$: $m_2\\ge${o.l2}$, $m_3\\ge${o.l3}$, $m_4\\ge${o.l4}$, и стоимость не меньше $${c1}\\cdot${N}+${c2 - c1}\\cdot${o.l2}+${c3 - c1}\\cdot${o.l3}+${c4 - c1}\\cdot${o.l4}=${nizhnyaya(p, N)}>${p.M}$.`,
      `Значит, $${N}$ штук и больше купить нельзя.`,
    );
  } else {
    const N = L - 1;
    const o = ocTex(N);
    const ub = verhnyaya(p, N);
    vLines.push(
      `Сдача меньше $${c1}$ руб., значит, стоимость покупки не меньше $${p.M - c1 + 1}$ руб.`,
      `Пусть куплено $N$ штук. Стоимость не больше $${c4}m_1+${c3}m_2+${c2}m_3+${c1}m_4$ (если большее количество приходится на более дорогой товар, стоимость не меньше, чем при любой другой расстановке тех же количеств), то есть не больше $${c4}N-${c4 - c3}m_2-${c4 - c2}m_3-${c4 - c1}m_4$.`,
      `Эта оценка с границами $m_2\\ge\\dfrac{N-2}{4}$, $m_3\\ge\\dfrac{N-6}{4}$, $m_4\\ge\\dfrac{N-12}{4}$ из б) растёт вместе с $N$. При $N=${N}$: $m_2\\ge${o.l2}$, $m_3\\ge${o.l3}$, $m_4\\ge${o.l4}$, поэтому стоимость не больше $${c4 * N}-${c4 - c3}\\cdot${o.l2}-${c4 - c2}\\cdot${o.l3}-${c4 - c1}\\cdot${o.l4}=${ub}<${p.M - c1 + 1}$. Значит, $${N}$ штук и меньше не хватит.`,
      `Пример на $${L}$ штук: ${opis(primL)}; стоимость $${nabTex(primL)}$, сдача $${p.M - cena(p, primL)}<${c1}$.`,
    );
  }

  return {
    no: 20,
    shablon: 'b20.pokupka',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      { bukva: 'в', podpis: 'Количество, шт.', pole: { vid: 'chislo', verno: String(L) } },
    ],
    otvet: `а) да; б) нет; в) $${L}$`,
    reshenie: [
      {
        title: 'а) Пример',
        lines: [`Можно: ${opis(primA)}; стоимость $${nabTex(primA)}\\le${p.M}$.`],
      },
      {
        title: 'б) Оценка стоимости',
        lines: [
          `Пусть куплено $N=${p.B}$ штук и $m_1\\ge m_2\\ge m_3\\ge m_4$ — количества по убыванию. Из условия $m_1\\le m_2+2\\le m_3+4\\le m_4+6$.`,
          `Тогда $N\\le4m_2+2$, $N\\le4m_3+6$, $N\\le4m_4+12$, откуда $m_2\\ge${ob.l2}$, $m_3\\ge${ob.l3}$, $m_4\\ge${ob.l4}$.`,
          `Если поменять количества местами так, чтобы большее количество приходилось на более дешёвый товар, стоимость не увеличится. Поэтому стоимость не меньше $${c1}m_1+${c2}m_2+${c3}m_3+${c4}m_4=${c1}N+${c2 - c1}m_2+${c3 - c1}m_3+${c4 - c1}m_4$.`,
          `При $N=${p.B}$: $${c1}\\cdot${p.B}+${c2 - c1}\\cdot${ob.l2}+${c3 - c1}\\cdot${ob.l3}+${c4 - c1}\\cdot${ob.l4}=${lbB}>${p.M}$. Значит, купить $${p.B}$ штук нельзя.`,
        ],
      },
      {
        title: p.vid === 'max' ? 'в) Наибольшее количество' : 'в) Наименьшее количество',
        lines: [...vLines, `Ответ в): $${L}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) Подбираем пример и проверяем условие и стоимость', formula: nabTex(primA) },
      { slovo: 'б) Оцениваем количества снизу и стоимость снизу', formula: `${lbB}>${p.M}` },
      {
        slovo:
          p.vid === 'max'
            ? 'в) Пример и оценка для следующего количества'
            : 'в) Оценка сверху для меньшего количества и пример',
        formula: `${L}`,
      },
    ],
    kontrol: { A: true, B: false, L },
  };
}

export const B20_POKUPKA: Shablon2<PB20> = {
  no: 20,
  prototip:
    'Покупка четырёх видов товара с ограничением на разницу количеств: да / нет / наименьшее или наибольшее',
  sobrat,
};
