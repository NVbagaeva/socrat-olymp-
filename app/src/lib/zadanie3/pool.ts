/**
 * Банк задания №3 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Условия набирает KaTeX, чертежи рисует
 * движок solid/ — в браузер уходит готовая разметка, ни движка, ни
 * KaTeX там не нужно.
 *
 * Чертёж хранится один на прототип, а не на вариант: у десяти
 * вариантов одного прототипа чертёж совпадает — числа стоят в
 * условии, а не на картинке. Исключение — ступенчатые тела, у них
 * числа на самом чертеже, и там чертёж свой у каждого варианта.
 * Иначе банк весил бы вдесятеро больше без единого нового пикселя.
 *
 * Ответы и разборы закрыты (см. secret.ts): открытым текстом в
 * бандл они не попадают.
 */

import { renderSolid } from '../solid';
import { nabratVykladku, typeset, type AtomVykladki } from '../tex';
import { RAZDELY, type Razdel } from './index';
import { klyuchZadachi, sealAnswer, sealText } from './secret';
import { type Prototype, type Step } from './types';

/** Шаг разбора для показа: пояснение и выкладка, уже разобранная. */
export interface PoolShag {
  text: string;
  /**
   * Выкладка атомами: тренажёр собирает их в строки по ширине
   * колонки. Её нет у шага без формулы.
   */
  vykladka?: AtomVykladki[][];
}

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  uslovieHtml: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: шаги списком (PoolShag) в JSON. */
  steps: string;
  /** Чертёж варианта. null — берётся общий чертёж прототипа. */
  svg: string | null;
}

export interface PoolKind {
  /** Идентификатор прототипа: он же тип задания для фильтра. */
  id: string;
  /** Название типа на кнопке фильтра. */
  title: string;
  /** Римский номер раздела: по нему фильтрует общий тренажёр. */
  group: string;
  /** Название раздела на кнопке фильтра общего тренажёра. */
  groupTitle: string;
  /** Формат ответа: подсказывает, чего ждать от поля ввода. */
  format: Prototype['format'];
  /** Общий чертёж прототипа. */
  svg: string;
  variants: PoolVariant[];
}

export interface Pool {
  /** Римский номер раздела или 'all' у общего тренажёра. */
  razdel: string;
  title: string;
  kinds: PoolKind[];
}

/** У прототипа числа стоят на самом чертеже — чертёж свой у варианта. */
function perVariant(prototype: Prototype): boolean {
  const first = prototype.varianty[0];
  if (first === undefined) {
    return false;
  }
  return (prototype.chertezh(first.params).measures ?? []).length > 0;
}

/**
 * Шаг банка → шаг для показа: текст и, если есть, выкладка атомами.
 *
 * Набор строгий: ошибка в записи TeX роняет сборку с указанием, где
 * она, а не оставляет формулу голым текстом на глазах у ученика.
 * Набор выключной — дроби и корни в полный рост, как у формулы
 * отдельной строкой.
 */
function shagPokaza(shag: Step): PoolShag {
  return shag.formula === undefined
    ? { text: shag.text }
    : { text: shag.text, vykladka: nabratVykladku(shag.formula, true, true) };
}

function kindOf(razdel: Razdel, prototype: Prototype): PoolKind {
  const first = prototype.varianty[0];
  if (first === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет вариантов`);
  }
  const own = perVariant(prototype);
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    group: razdel.nomer,
    groupTitle: razdel.nazvanie,
    format: prototype.format,
    svg: renderSolid(prototype.chertezh(first.params)),
    variants: prototype.varianty.map((variant) => {
      /* Отпечаток — с ключом задачи: у одного ответа в двух вариантах
         отпечатки разные. */
      const seal = sealAnswer(
        prototype.otvet(variant.params),
        klyuchZadachi(prototype.id, variant.n),
      );
      const steps = prototype.shagi(variant.params).map(shagPokaza);
      return {
        n: variant.n,
        uslovieHtml: typeset(prototype.uslovie(variant.params)),
        seal,
        /* Разбор закрыт тем же отпечатком: без него не раскрыть. */
        steps: sealText(JSON.stringify(steps), seal),
        svg: own ? renderSolid(prototype.chertezh(variant.params)) : null,
      };
    }),
  };
}

/** Банк одного раздела. */
export function razdelPool(razdel: Razdel): Pool {
  return {
    razdel: razdel.nomer,
    title: razdel.nazvanie,
    kinds: razdel.prototipy.map((prototype) => kindOf(razdel, prototype)),
  };
}

/** Банк целиком: общий смешанный тренажёр по всем восьми разделам. */
export function wholePool(): Pool {
  return {
    razdel: 'all',
    title: 'Весь банк задания №3',
    kinds: RAZDELY.flatMap((razdel) =>
      razdel.prototipy.map((prototype) => kindOf(razdel, prototype)),
    ),
  };
}
