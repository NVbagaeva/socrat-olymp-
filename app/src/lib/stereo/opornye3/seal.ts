/**
 * Опорная задача №3 в закрытом виде — то, что уходит на страницу.
 * Собирается на сборке: условие и варианты набраны KaTeX, ответ —
 * отпечатком, подсказки и разбор закрыты и открываются по кнопке.
 * Модель чертежа уходит как есть: в ней только данные условия.
 */

import katex from 'katex';
import { typeset } from '../../tex';
import type { Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { renderPloskiy } from '../ploskiy';
import { sealAnswer, sealChoice, sealText } from './secret';
import type { Uroven, Vid, ZadachaOp3 } from './tipy';

/**
 * Шаг подсказки в закрытом виде: шаг главного алгоритма, вопрос с
 * вариантами и вывод. Рабочий треугольник — для чертежа шага: на
 * шаге ② он выделен, с ③ отмечен прямой угол (рисует браузер тем же
 * движком по открытой модели задачи).
 */
export interface ShagPodskazkiHtml {
  n: 1 | 2 | 3 | 4 | 5;
  title: string;
  voprosHtml: string;
  options: string[];
  correct: number;
  vyvodHtml: string;
  rabochaya: { points: [Vec3, Vec3, Vec3]; pryamoy: Vec3 } | null;
}

export interface ZadachaOp3Sealed {
  id: string;
  no: number;
  uroven: Uroven;
  istochnik: 'fipi' | 'new';
  vid: Vid;
  uslovieHtml: string;
  model: Model;
  /** Короткое название — плитка итога блока. */
  kratkoHtml: string;
  /** nazhmi: цели касания и подписи кнопок. */
  celi: { id: string; points: Vec3[]; labelHtml: string }[] | null;
  /** vybor: варианты, набранные KaTeX. */
  varianty: string[] | null;
  /** ploskiy: плоские чертежи SVG. */
  ploskie: string[] | null;
  seal: string;
  /** JSON ShagPodskazkiHtml[], закрыт. */
  podskazki: string;
  /** JSON RazborOp3, закрыт. */
  razbor: string;
}

/** Разбор: решение учителя по этапам и разбор для ученика — готовая разметка. */
export interface RazborOp3 {
  uchitelHtml: string;
  uchenikHtml: string;
  otvetHtml: string;
}

const NOMERA = ['①', '②', '③', '④', '⑤'];
export const SHAGI = ['Узнать тело', 'Найти рабочую фигуру', 'Обосновать прямой угол', 'Нарисовать отдельно', 'Посчитать удобно'];

function formula(tex: string): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode: true });
}

export function sealZadacha(z: ZadachaOp3, no: number): ZadachaOp3Sealed {
  const seal = z.vid === 'chislo' ? sealAnswer(Number(z.otvet.replace(',', '.'))) : sealChoice(z.otvet);
  const shagi: ShagPodskazkiHtml[] = z.podskazka.map((s) => ({
    n: s.n,
    title: SHAGI[s.n - 1] ?? '',
    voprosHtml: typeset(s.vopros),
    options: s.varianty.map((v) => typeset(v)),
    correct: s.verno,
    vyvodHtml: typeset(s.vyvod),
    rabochaya:
      z.rabochaya === undefined || s.n < 2
        ? null
        : { points: [...z.rabochaya.points], pryamoy: z.rabochaya.pryamoy },
  }));
  const otvetText =
    z.vid === 'chislo'
      ? `$${z.otvet.replace(',', '{,}')}$`
      : z.vid === 'nazhmi'
        ? (z.celi?.find((c) => c.id === z.otvet)?.label ?? z.otvet)
        : z.vid === 'vybor'
          ? (z.varianty?.[Number(z.otvet)] ?? '')
          : `чертёж ${Number(z.otvet) + 1}`;
  const razbor: RazborOp3 = {
    uchitelHtml: z.uchitel
      .map(
        (e, i) =>
          `<div class="o3-etap"><p class="o3-etap__t">Этап ${i + 1}. ${typeset(e.etap)}</p>${e.formuly.map(formula).join('')}</div>`,
      )
      .join(''),
    uchenikHtml: z.uchenik
      .map(
        (s) =>
          `<li class="o3-razbor__shag"><span class="o3-shag">${NOMERA[s.n - 1]} ${SHAGI[s.n - 1]}</span><p>${typeset(s.chto)}</p>${s.formula === undefined ? '' : formula(s.formula)}</li>`,
      )
      .join(''),
    otvetHtml: typeset(otvetText),
  };
  return {
    id: z.id,
    no,
    uroven: z.uroven,
    istochnik: z.istochnik,
    vid: z.vid,
    uslovieHtml: typeset(z.uslovie),
    kratkoHtml: typeset(z.kratko),
    model: z.model,
    celi: z.celi === undefined ? null : z.celi.map((c) => ({ id: c.id, points: c.points, labelHtml: typeset(c.label) })),
    varianty: z.varianty === undefined ? null : z.varianty.map((v) => typeset(v)),
    ploskie: z.ploskie === undefined ? null : z.ploskie.map((p) => renderPloskiy(p, 'ekran')),
    seal,
    podskazki: sealText(JSON.stringify(shagi), z.id),
    razbor: sealText(JSON.stringify(razbor), z.id),
  };
}
