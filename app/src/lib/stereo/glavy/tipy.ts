/**
 * Глава теории №3 данными (новая методика, этап 2). Текст, задачи и
 * чертежи — здесь, оформление — в общем компоненте
 * components/stereo/glavy/GlavaMetodiki.tsx (макеты этапа 1).
 *
 * У каждого «Важно», «Лайфхака» и «Ловушки» — своя задача; у каждой
 * задачи и разобранного примера — независимый пересчёт ответа
 * (pereschet), чаще всего по координатам того же чертежа. Автотест
 * (pnpm test:stereo-metodika) сверяет ответ с пересчётом, набирает все
 * формулы KaTeX и рисует все чертежи в обеих темах движка.
 *
 * Строки — «текст $формула$», как везде на сайте (lib/tex).
 */

import type { Model } from '../../solid/model';
import type { PloskiyTreugolnik } from '../ploskiy';

/** Шаг разобранного примера: что делаем, выкладка, почему. */
export interface ShagPrimera {
  title: string;
  paras: readonly string[];
  formuly?: readonly string[];
}

/**
 * Разобранный пример. С чертежом — «две панели» (объёмный чертёж и
 * плоская фигура), если задан ploskiy, или одна панель; без чертежа —
 * только «Задача», «Решение», «Ответ» (счёт без калькулятора).
 */
export interface PrimerGlavy {
  id: string;
  title: string;
  uslovie: string;
  model?: Model;
  /** Подписи шагов живого чертежа (элементы модели с shag 1…). */
  shagiChertezha?: readonly string[];
  ploskiy?: PloskiyTreugolnik;
  /** Подпись мостика между панелями; не задана — «Выносим треугольник …». */
  most?: string;
  shagi: readonly ShagPrimera[];
  /** «Ответ: $20$.» */
  otvet: string;
  chislo: number;
  /** Независимый пересчёт ответа. */
  pereschet: () => number;
}

/** Задача внутри «Важно» и «Лайфхака». */
export interface ZadachaBloka {
  uslovie: string;
  reshenie: readonly string[];
  formuly?: readonly string[];
  otvet: string;
  chislo: number;
  pereschet: () => number;
}

export interface RisunokSPodpisyu {
  model: Model;
  podpis: string;
  /** Галерея «Неудачно / Удачно»: оценка ракурса. */
  ocenka?: 'neudachno' | 'udachno';
}

export type BlokGlavy =
  | { vid: 'abzacy'; paras: readonly string[] }
  | { vid: 'ideya'; title?: string; paras: readonly string[] }
  | { vid: 'algoritm'; title: string; shagi: readonly { title: string; text: string }[] }
  | {
      vid: 'opredelenie';
      plashka: string;
      paras: readonly string[];
      formuly?: readonly string[];
    }
  /** Карточка формул: формула и подпись к ней. */
  | { vid: 'formuly'; title: string; stroki: readonly { tex: string; podpis: string }[] }
  | { vid: 'spisok'; items: readonly string[] }
  | { vid: 'formula'; tex: string }
  | { vid: 'primer'; primer: PrimerGlavy }
  | { vid: 'vazhno' | 'layfhak'; title: string; paras?: readonly string[]; zadacha: ZadachaBloka }
  | {
      vid: 'lovushka';
      title: string;
      neverno: readonly string[];
      verno: readonly string[];
      risunki?: { neverno: Model; verno: Model };
      /** Задача ловушки с верным ответом. */
      zadacha: ZadachaBloka;
    }
  /** Чертежи рядом: «Неудачно / Удачно» или просто несколько видов. */
  | { vid: 'risunki'; items: readonly RisunokSPodpisyu[] }
  /** Типы задач №3 со ссылками на разборы (глава 0). */
  | { vid: 'tipy' }
  /** Шпаргалки групп банка (глава 10). */
  | { vid: 'shpargalki' };

export interface RazdelGlavyDannye {
  id: string;
  title: string;
  lead?: string;
  bloki: readonly BlokGlavy[];
}

export interface GlavaDannye {
  /** id главы из content/stereo/glavy.ts. */
  id: string;
  /** Лид под заголовком: умения главы. */
  lead: string;
  /** Декор лида — чертёж «стекло» без подписей; нет — без декора. */
  dekor?: Model;
  razdely: readonly RazdelGlavyDannye[];
}
