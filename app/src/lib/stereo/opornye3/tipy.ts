/**
 * Опорные задачи №3 (новая методика): формат задачи.
 *
 * Формат совместим с тренажёром и генератором с фильтрами
 * (lib/trenazher): у задачи есть ключ, подтип (блок), уровень ★–★★★ и
 * источник «банк / не из банка».
 *
 * Четыре вида ответа — все удобны на телефоне:
 *   chislo  — числовой ответ;
 *   vybor   — выбор из вариантов («почему угол прямой?»);
 *   nazhmi  — нажать на чертеже отрезок или треугольник;
 *   ploskiy — выбрать плоский чертёж, который соответствует задаче.
 */

import type { Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import type { PloskiyTreugolnik } from '../ploskiy';

export type Vid = 'chislo' | 'vybor' | 'nazhmi' | 'ploskiy';
export type Uroven = 1 | 2 | 3;

/** Цель касания на чертеже: отрезок или многоугольник, с подписью для кнопки. */
export interface Cel {
  id: string;
  points: Vec3[];
  /** Подпись в списке под чертежом: «$CC_1$», «треугольник $AFC_2$». */
  label: string;
}

/** Шаг подсказки — вопрос с кнопками по шагу главного алгоритма. */
export interface ShagPodskazki {
  /** Номер шага главного алгоритма, 1–5. */
  n: 1 | 2 | 3 | 4 | 5;
  vopros: string;
  varianty: readonly string[];
  /** Номер верного варианта. */
  verno: number;
  /** Вывод после верного ответа. */
  vyvod: string;
}

/** Этап решения учителя: подпись этапа и выкладка. */
export interface EtapUchitelya {
  etap: string;
  formuly: readonly string[];
}

/** Шаг разбора для ученика: словами (что и почему) и формулой. */
export interface ShagUchenika {
  n: 1 | 2 | 3 | 4 | 5;
  chto: string;
  formula?: string;
}

export interface ZadachaOp3 {
  /** Ключ: «o3-2-01». */
  id: string;
  /** Короткое название — плитка задачи в итоге блока. */
  kratko: string;
  /**
   * Рабочий треугольник и вершина прямого угла — чертёж подсказки
   * по шагам: на шаге ② треугольник выделен, с шага ③ отмечен прямой
   * угол. Подсказывает решение, поэтому уходит только запечатанным.
   */
  rabochaya?: { points: readonly [Vec3, Vec3, Vec3]; pryamoy: Vec3 };
  /** Блок — подтип для фильтров тренажёра. */
  blok: string;
  uroven: Uroven;
  istochnik: 'fipi' | 'new';
  /** Номер задачи в открытом банке ФИПИ — у задач с меткой «банк». */
  fipi?: string;
  vid: Vid;
  uslovie: string;
  model: Model;
  /** nazhmi: цели касания; ответ — id цели. */
  celi?: readonly Cel[];
  /** vybor: варианты; ответ — номер варианта (с нуля). */
  varianty?: readonly string[];
  /** ploskiy: плоские чертежи на выбор; ответ — номер (с нуля). */
  ploskie?: readonly PloskiyTreugolnik[];
  /** Ответ: число, id цели или номер варианта строкой. */
  otvet: string;
  podskazka: readonly ShagPodskazki[];
  uchitel: readonly EtapUchitelya[];
  uchenik: readonly ShagUchenika[];
  /** Пересчёт ответа независимо — по координатам чертежа (автотест). */
  pereschet: () => number | string;
}

export interface BlokOp3 {
  id: string;
  slug: string;
  no: number;
  /** Название без формул. */
  nazvanie: string;
  /** Умение блока. */
  umenie: 'читать' | 'рисовать' | 'считать' | 'читать и рисовать' | 'читать и считать';
  lead: string;
  /** Глава теории блока (id из content/stereo/glavy.ts): ссылка в итоге. */
  glava: string;
  /** Блок написан: задачи есть, страница открывается. */
  gotov: boolean;
}
