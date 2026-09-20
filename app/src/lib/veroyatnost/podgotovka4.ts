/**
 * Опорные задачи задания №4.
 *
 * Это авторский конспект урока 13–14 сентября, задачи 1–18, разложенные
 * по трём его же заголовкам. Условия перенесены дословно — это
 * проверяется при загрузке bank4/konspekt.ts, где каждая задача стала
 * параметрическим прототипом: вариант 1 — задача конспекта, ещё десять
 * вариантов с другими числами собрал генератор.
 *
 * Здесь задача конспекта получается из варианта 1 своего прототипа:
 * условие, ответ, второй счёт ответа, шаги и рисунок — всё оттуда.
 *
 * Шесть задач конспекта встречаются и в банке прототипов №4. Это не
 * дублирование, а задумка: сначала ученик решает конкретную задачу
 * автора в подготовке, потом получает тот же метод на новых числах в
 * тренажёре.
 */

import { KONSPEKT_4 } from './bank4/konspekt';
import { type PrepBlok, type PrepZadacha, type Prototype } from './types';

/** Задача конспекта из варианта 1 её прототипа. */
function izPrototipa(P: Prototype, nomer: number): PrepZadacha {
  const pervyy = P.varianty[0];
  if (pervyy === undefined) {
    throw new Error(`У прототипа ${P.id} нет вариантов`);
  }
  const p = pervyy.params;
  const znakov = P.okruglenie(p);
  const metodika = P.metodika;
  return {
    id: P.id,
    nomer,
    uslovie: P.uslovie(p),
    otvet: P.otvet(p),
    proverka: P.perebor(p),
    ...(znakov === null ? {} : { okruglenie: znakov }),
    shagi: P.shagi(p),
    ...(metodika === undefined
      ? {}
      : {
          metodika: {
            metod: metodika.metod,
            methodHints: metodika.methodHints,
            fraza: () => metodika.fraza(p),
            vizual: () => metodika.vizual(p),
          },
        }),
    prototip: P,
  };
}

function po(id: string, nomer: number): PrepZadacha {
  const P = KONSPEKT_4.find((k) => k.id === id);
  if (P === undefined) {
    throw new Error(`В конспекте нет прототипа ${id}`);
  }
  return izPrototipa(P, nomer);
}

/** Три блока подготовки задания №4 — заголовки из конспекта. */
export const PODGOTOVKA_4: readonly PrepBlok[] = [
  {
    id: 'opredelenie',
    nazvanie: 'Определение вероятности',
    tip: 'Считаем благоприятные исходы и делим на все',
    zadachi: Array.from({ length: 10 }, (_, i) =>
      po(`k4-${String(i + 1).padStart(2, '0')}`, i + 1),
    ),
  },
  {
    id: 'zhrebiy',
    nazvanie: 'Жребий, две группы, круглый стол',
    tip: 'Одного фиксируем, второй занимает одно из оставшихся мест',
    zadachi: Array.from({ length: 5 }, (_, i) => po(`k4-${i + 11}`, i + 11)),
  },
  {
    id: 'geometricheskaya',
    nazvanie: 'Геометрическая вероятность',
    tip: 'Делим не число исходов, а длину, площадь или время',
    zadachi: Array.from({ length: 3 }, (_, i) => po(`k4-${i + 16}`, i + 16)),
  },
];
