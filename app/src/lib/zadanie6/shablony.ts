/**
 * Шаблоны выбора задач тренажёра и генератора №6: одна кнопка — готовый
 * набор прототипов (и стиль задач). После выбора шаблона прототипы и
 * счётчики можно поправить вручную.
 */

export type Stil = 'vse' | 'syuzhet' | 'standart';

export interface Shablon6 {
  id: string;
  title: string;
  /** Короткое пояснение под кнопкой. */
  opisanie: string;
  tipy: string[];
  stil: Stil;
}

const VSE = [
  'P01',
  'P02',
  'P03',
  'P04',
  'P05',
  'P06',
  'P07',
  'P08',
  'P09',
  'P10',
  'P11',
  'P12',
  'P13',
  'P14',
  'P15',
];

export const SHABLONY_6: Shablon6[] = [
  { id: 'ves', title: 'Весь №6', opisanie: 'все 15 прототипов', tipy: VSE, stil: 'vse' },
  {
    id: 'ozhidanie-dispersiya',
    title: 'Ожидание и дисперсия',
    opisanie: 'лотереи, распределения, страхование, выборки',
    tipy: ['P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P12', 'P13', 'P14', 'P15'],
    stil: 'vse',
  },
  {
    id: 'diagrammy',
    title: 'Диаграммы и деревья',
    opisanie: 'диаграммы Эйлера и условная вероятность',
    tipy: ['P01', 'P02', 'P03'],
    stil: 'vse',
  },
  {
    id: 'syuzhetnye',
    title: 'Только сюжетные',
    opisanie: 'все прототипы, задачи с жизненными сюжетами',
    tipy: VSE,
    stil: 'syuzhet',
  },
];

/** Подходит ли задача индекса под стиль. */
export function podStil(st: 'f' | 's', stil: Stil): boolean {
  return stil === 'vse' || (stil === 'syuzhet' ? st === 's' : st === 'f');
}
