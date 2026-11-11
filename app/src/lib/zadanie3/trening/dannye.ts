/**
 * Данные прототипа №3 для тренажёра: то, что уезжает в браузер.
 *
 * Файл на прототип (app/zadaniya/3/dannye/prototip/…): тренировка из
 * десяти задач качает до десяти небольших файлов, а не весь банк.
 * Условия набраны KaTeX на сборке. Ответ — отпечатком; решение и
 * подсказка закрыты этим же отпечатком (lib/zadanie3/secret.ts) и
 * лежат текстом с формулами $…$ — их набирает KaTeX в браузере, когда
 * ученик их открыл. Чертёж — модель движка lib/solid с выбранным видом:
 * первый кадр рисуется в браузере тем же движком, фигура вращается.
 */

import type { Model } from '../../solid/model';
import { vybratVidSolid } from '../../solid/vid';
import { typeset } from '../../tex';
import { fipiVarianta } from '../fipi';
import { BANK, prototypeById } from '../index';
import { klyuchZadachi, sealAnswer, sealText } from '../secret';
import type { Prototype, Step } from '../types';
import type { Katalog3 } from './session';

/** Шаг решения: подпись «что делаем» и выкладка; формулы — $…$. */
export interface ShagTekst3 {
  chto: string;
  formula: string;
}

export interface VariantDannye3 {
  n: number;
  uslovieHtml: string;
  /** Отпечаток верного ответа. */
  seal: string;
  /** Закрытое решение: JSON ShagTekst3[]. */
  reshenie: string;
  /** Закрытая подсказка-вопрос (первый шаг, без ответа); null — её нет. */
  podskazka: string | null;
  /** Модель чертежа варианта (JSON); null — общая модель прототипа. */
  model: string | null;
}

export interface PrototipDannye3 {
  id: string;
  format: Prototype['format'];
  /** Общая модель чертежа прототипа (JSON модели lib/solid). */
  model: string;
  variants: VariantDannye3[];
}

/**
 * Шаг банка → подпись и выкладка. Шаг вида «Диагональ основания: её
 * квадрат равен $6^2 + 3^2 = 45$.» делится по последней формуле:
 * слова — в подпись, формула — отдельной строкой. Шаг без формулы в
 * конце остаётся подписью целиком.
 */
export function shagTekst(step: Step): ShagTekst3 {
  const text = step.text.replace(/\n/g, ' ').trim();
  const m = /^(.*?)[:,—–-]?\s*(\$[^$]+\$)\s*\.?$/u.exec(text);
  const slova = m?.[1]?.trim() ?? '';
  /* Без слов перед формулой шаг остаётся одной строкой. */
  if (m === null || slova.length < 3) {
    return { chto: text, formula: '' };
  }
  return { chto: /[.!?…]$/u.test(slova) ? slova : `${slova}.`, formula: m[2] as string };
}

function modelJson(model: Model): string {
  return JSON.stringify(vybratVidSolid(model).model, (_k, v: unknown) =>
    typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v,
  );
}

export function dannyePrototipa(id: string): PrototipDannye3 | null {
  const prototype = prototypeById(id);
  const first = prototype?.varianty[0];
  if (prototype === undefined || first === undefined) {
    return null;
  }
  const obshchaya = modelJson(prototype.chertezh(first.params));
  return {
    id: prototype.id,
    format: prototype.format,
    model: obshchaya,
    variants: prototype.varianty.map((variant) => {
      const seal = sealAnswer(
        prototype.otvet(variant.params),
        klyuchZadachi(prototype.id, variant.n),
      );
      const svoya = modelJson(prototype.chertezh(variant.params));
      const vopros = prototype.podskazka?.(variant.params)[0]?.question;
      return {
        n: variant.n,
        uslovieHtml: typeset(prototype.uslovie(variant.params)),
        seal,
        reshenie: sealText(JSON.stringify(prototype.shagi(variant.params).map(shagTekst)), seal),
        podskazka: vopros === undefined ? null : sealText(vopros, seal),
        model: svoya === obshchaya ? null : svoya,
      };
    }),
  };
}

/** Каталог банка для сборки тренировок в браузере: без условий и ответов. */
export function katalog3(): Katalog3 {
  return Object.fromEntries(
    BANK.map((prototype) => [
      prototype.id,
      {
        n: prototype.varianty.map((v) => v.n),
        fipi: prototype.varianty
          .filter((v) => fipiVarianta(prototype.id, v.n).length > 0)
          .map((v) => v.n),
      },
    ]),
  );
}

export const PROTOTIPY3: string[] = BANK.map((p) => p.id);
