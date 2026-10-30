/**
 * Карточки по теории: устройство данных. Одно на все номера.
 *
 * Колода номера — один файл content/kartochki/NN-*.ts. Движок
 * (lib/kartochki) и экран (components/kartochki) про номера ничего не
 * знают: всё, что отличает №1 от №3, лежит в колоде.
 *
 * Тексты — как везде на сайте: формулы в $…$, их набирает KaTeX на
 * сборке (lib/tex), **…** — выделение.
 */

import type { Model } from '../solid/model';
import type { Scena } from '../planimetriya/types';
import type { StsenaId } from '../vektory/stseny';
import type { Risunok as RisunokVektorov } from '../vektory/types';

/**
 * Тип карточки.
 * - `formula` — «Площадь трапеции?» → формула и мини-чертёж;
 * - `svoystvo` — определение или свойство;
 * - `chertezh` — чертёж с отмеченным элементом → название или формула;
 *   чертёж рисуется движком в случайном повороте;
 * - `verno` — утверждение «верно / неверно», проверяется автоматически;
 * - `vychislenie` — вычисление в одно действие, ответ числом в поле.
 *
 * Первые три ученик оценивает сам («Знаю / Не знаю»), последние два
 * проверяются автоматически, обоснование всё равно видно на обороте.
 */
export type TipKartochki = 'formula' | 'svoystvo' | 'chertezh' | 'verno' | 'vychislenie';

export const SAMOOCENKA: readonly TipKartochki[] = ['formula', 'svoystvo', 'chertezh'];

export type UrovenKartochki = 'база' | 'важно для ЕГЭ';

/**
 * Чертёж карточки — описание для движка номера или готовый SVG.
 * - `plan` — чертёж темы справочника №1 по её якорю (без «k-»);
 * - `plan-scena` — своя сцена движка планиметрии;
 * - `vektory` — сцена теории №2 по ключу или своя конфигурация;
 * - `solid` — модель движка стереометрии;
 * - `svg` — путь к файлу в public/.
 *
 * `povorot` — рисовать в случайном повороте (тип `chertezh`).
 */
export type FiguraKartochki =
  | { dvizhok: 'plan'; tema: string; povorot?: boolean }
  | { dvizhok: 'plan-scena'; scena: () => Scena; povorot?: boolean; alt: string }
  | { dvizhok: 'vektory'; stsena: StsenaId | RisunokVektorov }
  | { dvizhok: 'solid'; model: () => Model }
  | { svg: string; alt: string };

interface KartochkaObshchee {
  /** Уникален во всех колодах: «1-trapeciya-s». */
  id: string;
  /** Номер задания ЕГЭ. */
  task: number;
  /** Подтема — id из `podtemy` колоды. */
  topic: string;
  /** Вопрос. */
  front: string;
  /** Ответ: формула, свойство, вывод. */
  back: string;
  /** Одна строка «почему» под ответом. */
  pochemu?: string;
  figure?: FiguraKartochki;
  level: UrovenKartochki;
  /**
   * Фрагмент теории, который покрывает карточка: якорь во вкладке
   * «Теория» номера («k-ploshchad-trapecii», «g6-k»). «добавлено» —
   * в теории приложения этого нет, карточка добавлена сверх неё.
   */
  source: string;
}

export interface KartochkaSamoocenka extends KartochkaObshchee {
  type: 'formula' | 'svoystvo' | 'chertezh';
}

export interface KartochkaVerno extends KartochkaObshchee {
  type: 'verno';
  /** Верно ли утверждение `front`. */
  verno: boolean;
}

export interface KartochkaVychislenie extends KartochkaObshchee {
  type: 'vychislenie';
  /** Ответ как его пишут в бланк: «0,6», «12», «-3». */
  otvet: string;
  /**
   * Независимый пересчёт ответа по числам условия — его сверяет
   * scripts/verify_cards. Ошибочная карточка не публикуется.
   */
  proverka: () => number;
}

export type Kartochka = KartochkaSamoocenka | KartochkaVerno | KartochkaVychislenie;

/**
 * Численная проверка формулы карточки: случайные числа → значение
 * по формуле и прямым вычислением (scripts/verify_cards).
 */
export interface ProverkaFormuly {
  /** id карточки, которую проверяем. */
  kartochka: string;
  /** Случайная фигура: rnd() даёт число из [0; 1). */
  sluchay: (rnd: () => number) => { poFormule: number; pryamo: number };
}

export interface Podtema {
  id: string;
  title: string;
}

export interface Koloda {
  /** Номер задания ЕГЭ. */
  task: number;
  /** Часть адреса раздела: /zadaniya/{slug}/. */
  slug: string;
  /** «Планиметрия». */
  title: string;
  /** Хвост адреса вкладки «Теория» внутри раздела. */
  teoriya: string;
  podtemy: readonly Podtema[];
  kartochki: readonly Kartochka[];
  /** Проверки формул для scripts/verify_cards. */
  proverki?: readonly ProverkaFormuly[];
}

export const DOBAVLENO = 'добавлено';
