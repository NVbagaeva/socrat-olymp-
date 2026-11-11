/**
 * Опорные задачи №3: семь навыков над двенадцатью блоками.
 *
 * Блоки и их задачи — lib/stereo/opornye3 (12 блоков по 10 задач).
 * Навык — заголовок, под которым стоят его блоки; «Считаю удобно» —
 * отдельный, седьмой навык (решение заказчика). Названия блоков для
 * ученика — здесь; на карточках формул нет.
 */

import type { Ton3 } from './gruppy';

export interface Navyk3 {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton3;
  /** Блоки навыка: slug из lib/stereo/opornye3/bloki. */
  bloki: string[];
}

export const NAVYKI3: Navyk3[] = [
  {
    id: 'vizhu',
    nazvanie: 'Видим фигуру в пространстве',
    lead: 'Рёбра, грани, прямые углы на чертеже',
    ton: 'blue',
    bloki: ['chitayu-chertezh', 'prostranstvo-treugolnik', 'ugly'],
  },
  {
    id: 'kub',
    nazvanie: 'Объём и площадь куба и параллелепипеда',
    lead: 'Три ребра — объём, поверхность, диагональ',
    ton: 'navy',
    bloki: ['obem-i-ploshchad'],
  },
  {
    id: 'prizma-piramida',
    nazvanie: 'Призма и пирамида',
    lead: 'Основание, высота и одна треть',
    ton: 'orange',
    bloki: ['piramida', 'chasti-tel'],
  },
  {
    id: 'vrashcheniya',
    nazvanie: 'Тела вращения',
    lead: 'Цилиндр, конус, шар и их комбинации',
    ton: 'blue',
    bloki: ['cilindr-konus-shar', 'kombinacii'],
  },
  {
    id: 'k',
    nazvanie: 'Что будет, если увеличить в k раз',
    lead: 'Длины, площади и объёмы растут по-разному',
    ton: 'terra',
    bloki: ['vo-skolko-raz'],
  },
  {
    id: 'sostavnye',
    nazvanie: 'Разбиваем составную фигуру на простые',
    lead: 'Объём по частям, поверхность по граням',
    ton: 'orange',
    bloki: ['sostavnye-obem', 'sostavnye-ploshchad'],
  },
  {
    id: 'schet',
    nazvanie: 'Считаем удобно',
    lead: 'Сокращаем до умножения, а не после',
    ton: 'green',
    bloki: ['schitayu-udobno'],
  },
];

/** Название блока для ученика: slug → название. Нет — остаётся прежнее. */
export const BLOKI3_NAZVANIYA: Record<string, string> = {
  'chitayu-chertezh': 'Читаем чертёж',
  'prostranstvo-treugolnik': 'Находим прямоугольный треугольник',
  ugly: 'Углы между прямыми',
  'obem-i-ploshchad': 'Объём и площадь поверхности',
  piramida: 'Пирамида: высота и рёбра',
  'chasti-tel': 'Части призмы и пирамиды',
  'cilindr-konus-shar': 'Цилиндр, конус, шар',
  kombinacii: 'Вписанные и описанные тела',
  'vo-skolko-raz': 'Во сколько раз изменится',
  'sostavnye-obem': 'Составные тела: объём',
  'sostavnye-ploshchad': 'Составные тела: площадь поверхности',
  'schitayu-udobno': 'Считаем без калькулятора',
};

export const OPORNYE3 = {
  title: 'Блоки по навыкам',
  lead: 'Семь навыков, двенадцать блоков по десять задач. В блоке задачи идут от простой к сложной.',
  blokov: (n: number) => `${n} ${n === 1 ? 'блок' : n < 5 ? 'блока' : 'блоков'}`,
  zadach: (resheno: number, vsego: number) =>
    resheno === 0 ? `${vsego} задач` : `${resheno} из ${vsego}`,
  neNachato: 'ещё не начато',
  gotovo: 'Пройдено',
};
