/**
 * №17 (варианты 3–4): источник с ЭДС ε и внутренним сопротивлением r
 * питает нагрузку R; мощность на нагрузке P = I²R, I = ε/(r + R).
 * При каком R мощность наибольшая (ответ R = r) — или какова она
 * (ε²/(4r)).
 */

import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Сюжеты: источник и нагрузка (род. и вин. падежи там, где нужны). */
const SYUZHETY = [
  { ist: 'Ветрогенератору', nagr: 'обогреватель теплицы', nagrRod: 'обогревателя' },
  { ist: 'Дизельному генератору', nagr: 'электрический котёл', nagrRod: 'котла' },
  { ist: 'Аккумулятору лодки', nagr: 'грелку для двигателя', nagrRod: 'грелки' },
  { ist: 'Термоэлектрическому генератору', nagr: 'походный паяльник', nagrRod: 'паяльника' },
  { ist: 'Гидрогенератору малой ГЭС', nagr: 'водонагреватель', nagrRod: 'водонагревателя' },
  { ist: 'Батарее гальванических элементов', nagr: 'нагревательную спираль', nagrRod: 'спирали' },
  { ist: 'Аккумуляторной батарее метеостанции', nagr: 'обогрев датчиков', nagrRod: 'обогрева' },
  { ist: 'Солнечной электростанции турбазы', nagr: 'сушильный шкаф', nagrRod: 'шкафа' },
] as const;

export interface PB17 {
  /** ЭДС ε, В. */
  E: number;
  /** Внутреннее сопротивление r, Ом. */
  r: number;
  syuzhet: number;
  /** Что спрашивается: сопротивление (как в образце) или наибольшая мощность. */
  vopros?: 'R' | 'P';
}

function sobrat(p: PB17): Chast2Zadacha {
  const S = SYUZHETY[p.syuzhet];
  if (S === undefined) throw new Error('b17: нет сюжета');
  const vopros = p.vopros ?? 'R';
  const r = dec(p.r);
  const Pmax = (p.E * p.E) / (4 * p.r);
  if (vopros === 'P' && Math.abs(Pmax * 100 - Math.round(Pmax * 100)) > 1e-9)
    throw new Error('b17: мощность не конечная десятичная');
  const otvet = vopros === 'R' ? `$R=${r}$ Ом` : `$P=${dec(Pmax)}$ Вт`;
  const uslovie =
    `${S.ist} с электродвижущей силой $\\varepsilon=${p.E}$ В и внутренним сопротивлением $r=${r}$ Ом подключили ${S.nagr}. ` +
    `Сила тока в цепи определяется законом Ома для полной цепи:\n` +
    `$\\displaystyle I=\\dfrac{\\varepsilon}{r+R},$\n` +
    `где $R$ — сопротивление ${S.nagrRod} (в омах). Тепловая мощность (в ваттах), которая выделяется на нём, по закону Джоуля — Ленца равна $P=I^2R$. ` +
    (vopros === 'R'
      ? `При каком сопротивлении $R$ ${S.nagrRod} эта мощность будет наибольшей?`
      : `Какую наибольшую тепловую мощность можно получить на нём, подбирая сопротивление $R$?`);

  return {
    no: 17,
    shablon: 'b17.dzhoul',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: vopros === 'R' ? 'Сопротивление $R$, Ом' : 'Мощность $P$, Вт',
        pole: { vid: 'chislo', verno: vopros === 'R' ? String(p.r) : String(Pmax) },
      },
    ],
    otvet,
    reshenie: [
      {
        title: 'Мощность как функция $R$',
        lines: [
          `$P(R)=\\dfrac{\\varepsilon^2R}{(r+R)^2}=\\dfrac{${p.E * p.E}R}{(${r}+R)^2}$, $R>0$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$P'(R)=\\varepsilon^2\\cdot\\dfrac{(r+R)^2-2R(r+R)}{(r+R)^4}=\\dfrac{\\varepsilon^2(r-R)}{(r+R)^3}$.`,
          `При $0<R<${r}$ производная положительна — мощность растёт, при $R>${r}$ отрицательна — убывает.`,
        ],
      },
      {
        title: 'Наибольшее значение',
        lines: [
          `Значит, $R=${r}$ — точка максимума, и на промежутке $R>0$ мощность наибольшая при $R=r=${r}$ Ом.`,
          ...(vopros === 'P'
            ? [
                `Наибольшая мощность: $P(${r})=\\dfrac{\\varepsilon^2}{4r}=\\dfrac{${p.E * p.E}}{4\\cdot${r}}=${dec(Pmax)}$ Вт.`,
              ]
            : []),
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Подставляем силу тока в формулу мощности',
        formula: 'P=\\dfrac{\\varepsilon^2R}{(r+R)^2}',
      },
      { slovo: 'Находим производную по $R$', formula: "P'=\\dfrac{\\varepsilon^2(r-R)}{(r+R)^3}" },
      { slovo: 'Знак производной меняется с «+» на «−» при $R=r$', formula: `R=${r}` },
      ...(vopros === 'P'
        ? [
            {
              slovo: 'Считаем мощность в точке максимума',
              formula: `P=\\dfrac{\\varepsilon^2}{4r}=${dec(Pmax)}`,
            },
          ]
        : []),
    ],
    kontrol: { E: p.E, r: p.r, otvet: vopros === 'R' ? p.r : Pmax },
  };
}

export const B17_DZHOUL: Shablon2<PB17> = {
  no: 17,
  prototip: 'Наибольшая мощность на нагрузке источника с внутренним сопротивлением',
  sobrat,
};
