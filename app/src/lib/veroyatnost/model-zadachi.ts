/**
 * Сборка модели задачи (раздел 04) из прототипа с вариантом или из
 * подготовительной задачи.
 *
 * Вынесено из model.ts намеренно: здесь нужен банк (ответ ученика
 * считается формулой прототипа), а model.ts читает и браузер — ради
 * каталога методов. Банк в клиентский бандл ехать не должен, и это
 * проверяет test:secrets.
 */

import {
  putIllyustratsii,
  type ModelShag,
  type Parametry,
  type ProblemModel,
  type Shape,
} from './model';
import {
  dec,
  type Params,
  type PrepZadacha,
  type Prototype,
  type Step,
  type Variant,
} from './types';
import { otvetUchenika, prepOtvet } from './index';

function shagiModeli(shagi: readonly Step[]): ModelShag[] {
  return shagi.map((s) =>
    s.formula === undefined ? { text: s.text } : { text: s.text, formula: s.formula },
  );
}

function shapeIz(parametry: Parametry): Shape | undefined {
  return parametry.method === 'coordinate-line' ? parametry.shape : undefined;
}

/** Модель варианта прототипа. Бросает, если у прототипа нет методики. */
export function modelVarianta(prototype: Prototype, variant: Variant): ProblemModel {
  const metodika = prototype.metodika;
  if (metodika === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет методики`);
  }
  const p: Params = variant.params;
  const vizual = metodika.vizual(p);
  const otvet = otvetUchenika(prototype, p);
  const id = `${prototype.id}-${variant.n}`;
  return {
    id,
    method: metodika.metod,
    ...(shapeIz(vizual.parametry) === undefined ? {} : { shape: shapeIz(vizual.parametry) }),
    condition: prototype.uslovie(p),
    parameters: vizual.parametry,
    solution: {
      method: metodika.fraza(p),
      steps: shagiModeli(prototype.shagi(p)),
      highlight: vizual.podsvetka,
    },
    answer: { value: otvet, display: dec(otvet) },
    illustration: {
      path: putIllyustratsii(prototype.id, variant.n),
      alt: prototype.nazvanie,
      ratio: '4:3',
    },
  };
}

/** Модель подготовительной задачи. */
export function modelPrep(zadacha: PrepZadacha): ProblemModel {
  const metodika = zadacha.metodika;
  if (metodika === undefined) {
    throw new Error(`У задачи ${zadacha.id} нет методики`);
  }
  const vizual = metodika.vizual({});
  const otvet = prepOtvet(zadacha);
  return {
    id: zadacha.id,
    method: metodika.metod,
    ...(shapeIz(vizual.parametry) === undefined ? {} : { shape: shapeIz(vizual.parametry) }),
    condition: zadacha.uslovie,
    parameters: vizual.parametry,
    solution: {
      method: metodika.fraza({}),
      steps: shagiModeli(zadacha.shagi),
      highlight: vizual.podsvetka,
    },
    answer: { value: otvet, display: dec(otvet) },
    illustration: {
      path: putIllyustratsii(zadacha.id),
      alt: `Задача ${zadacha.nomer} конспекта`,
      ratio: '4:3',
    },
  };
}
