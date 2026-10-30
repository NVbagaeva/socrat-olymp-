/**
 * Шаблон ключевой схемы №18 — одинаковый у всех схем. Строки — с
 * формулами в долларах (lib/razmetka.ts), выделение — `**…**`.
 *
 * Подсветка: у следствия и у шага доказательства — группы элементов
 * чертежа (lib/zadanie18/skhemy/*.ts). Наведение на следствие или
 * переход к шагу зажигает ровно эти группы.
 */

export type Gruppa18 = 'treugolnik' | 'okruzhnost' | 'kasatelnye' | 'trapeciya' | 'otnosheniya';

export const GRUPPY_18: readonly { id: Gruppa18; title: string }[] = [
  { id: 'treugolnik', title: 'Треугольник' },
  { id: 'okruzhnost', title: 'Окружность и вписанные углы' },
  { id: 'kasatelnye', title: 'Касательные' },
  { id: 'trapeciya', title: 'Трапеция' },
  { id: 'otnosheniya', title: 'Отношения отрезков' },
];

export interface Podsvechennoe {
  tekst: string;
  /** Группы элементов чертежа, которые загораются. */
  gruppy: readonly string[];
  /** Сворачивающаяся плашка под пунктом: подробности, способы записи. */
  podrobno?: { title: string; abzacy: readonly string[] };
}

export interface Skhema18 {
  id: string;
  no: number;
  gruppa: Gruppa18;
  nazvanie: string;
  /** Одна строка сути. */
  sut: string;
  dano: string;
  sledstviya: readonly Podsvechennoe[];
  dokazatelstvo: readonly Podsvechennoe[];
  /** Сигналы на чертеже и в условии. */
  kakUznat: readonly string[];
  /** Типичные формулировки пунктов а) и б). */
  gde: readonly { punkt: 'а' | 'б'; tekst: string }[];
  zapominalka: string | null;
  /** Оборот карточки: ключевые следствия коротко. */
  kartochka: readonly string[];
}

/** Схема из списка, которая ещё не собрана: плитка «Скоро». */
export interface SkhemaVSpiske {
  id: string;
  no: number;
  gruppa: Gruppa18;
  nazvanie: string;
  /** Обязательная схема (из классического набора). */
  klassicheskaya: boolean;
}
