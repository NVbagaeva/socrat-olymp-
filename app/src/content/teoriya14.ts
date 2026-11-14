/**
 * Теория задания №14: главы по типам уравнений. Готова глава
 * «Тригонометрические уравнения» — пункты 3.0–3.12 в папке teoriya14/
 * (по файлу на пункт). Остальные главы — «Скоро».
 *
 * Правила текста: формулы — только KaTeX в $…$; у каждой рамки
 * («Важно», «Запомни», «Вывод», «Лайфхак») — разобранный пример;
 * переходы — цепочкой ⇔ со знаками системы и совокупности; деление
 * и сокращение не выдаются за равносильный переход без обоснования.
 * Проверка — scripts/check-zadanie14.mjs (KaTeX, примеры у рамок).
 */

import type { Glava14 } from '@/lib/zadanie14/teoriyaTipy';
import { PUNKT_0 } from './teoriya14/p00-sistema';
import { PUNKT_1 } from './teoriya14/p01-okruzhnost';
import { PUNKT_2 } from './teoriya14/p02-sin-cos';
import { PUNKT_3 } from './teoriya14/p03-tg-ctg';
import { PUNKT_4 } from './teoriya14/p04-serii';
import { PUNKT_5 } from './teoriya14/p05-prosteyshie';
import { PUNKT_6 } from './teoriya14/p06-otbor';
import { PUNKT_7 } from './teoriya14/p07-privedenie';
import { PUNKT_8 } from './teoriya14/p08-dvoynoy';
import { PUNKT_9 } from './teoriya14/p09-zamena';
import { PUNKT_10 } from './teoriya14/p10-odnorodnye';
import { PUNKT_11 } from './teoriya14/p11-vspomogatelnyy';
import { PUNKT_12 } from './teoriya14/p12-abc';

export const GLAVY_14: Glava14[] = [
  {
    id: 'trig',
    title: 'Тригонометрические уравнения',
    lead: 'От единичной окружности до уравнения $a\\sin x+b\\cos x=c$. Каждое правило — с разобранной задачей.',
    punkty: [
      PUNKT_0,
      PUNKT_1,
      PUNKT_2,
      PUNKT_3,
      PUNKT_4,
      PUNKT_5,
      PUNKT_6,
      PUNKT_7,
      PUNKT_8,
      PUNKT_9,
      PUNKT_10,
      PUNKT_11,
      PUNKT_12,
    ].filter((p) => p.bloki.length > 0),
  },
  {
    id: 'pokaz',
    title: 'Показательные уравнения',
    skoro: true,
    lead: 'Приведение к одному основанию и замена переменной. Глава готовится.',
    punkty: [],
  },
  {
    id: 'log',
    title: 'Логарифмические уравнения',
    skoro: true,
    lead: 'Область допустимых значений, свойства логарифмов и замена. Глава готовится.',
    punkty: [],
  },
  {
    id: 'irr',
    title: 'Иррациональные уравнения',
    skoro: true,
    lead: 'Уравнения с корнем: возведение в квадрат с условием. Глава готовится.',
    punkty: [],
  },
  {
    id: 'komb',
    title: 'Комбинированные уравнения',
    skoro: true,
    lead: 'Тригонометрия внутри другого уравнения. Глава готовится, подтипы:',
    punkty: [],
  },
];
