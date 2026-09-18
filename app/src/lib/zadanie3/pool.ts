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
import { typeset } from '../tex';
import { RAZDELY, type Razdel } from './index';
import { sealAnswer, sealText } from './secret';
import { type Prototype } from './types';

/**
 * Чем шаги разбора разделены в закрытой строке.
 *
 * Переводом строки — нельзя: KaTeX рисует знак корня контуром, и
 * внутри атрибута d у него стоят настоящие переводы строк. Шаг
 * разлетался на два десятка кусков прямо посреди формулы.
 * U+001F — разделитель единиц, в вёрстке не встречается.
 */
export const STEP_SEP = '\u001f';

export interface PoolVariant {
  /** Номер варианта в прототипе, 1…10. */
  n: number;
  uslovieHtml: string;
  /** Отпечаток верного ответа. Самого ответа здесь нет. */
  seal: string;
  /** Закрытый разбор: шаги через перевод строки. */
  steps: string;
  /** Чертёж варианта. null — берётся общий чертёж прототипа. */
  svg: string | null;
  /**
   * Чертёж разбора: с дополнительными построениями. Закрыт тем же
   * ключом, что и шаги: на нём отмечен искомый угол, а это ответ —
   * открытым текстом ему в бандле не место. null — у прототипа
   * своего чертежа разбора нет.
   */
  razbor: string | null;
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

/**
 * Нужен ли варианту свой чертёж.
 *
 * Раньше считалось, что чертёж у десяти вариантов один: числа стоят
 * в условии, а не на картинке. Для прототипов с числами на самом
 * чертеже — ступенчатых тел — делалось исключение. Но у прототипов,
 * где вариант меняет не число, а букву — какую диагональ найти,
 * между какими прямыми угол, — чертежи тоже разные, и всем десяти
 * доставался чертёж первого: спрашивали DB₁, а выделена была AC₁.
 *
 * Теперь так: чертёж свой у варианта, если он вообще отличается.
 * Сравнение по готовой разметке, поэтому совпавшие чертежи в банк
 * второй раз не попадают — вес не растёт там, где картинка одна.
 */
function perVariant(prototype: Prototype): boolean {
  const first = prototype.varianty[0];
  if (first === undefined) {
    return false;
  }
  return (
    (prototype.chertezh(first.params).measures ?? []).length > 0 ||
    prototype.zadacha !== undefined
  );
}

/** Чертёж варианта, если он отличается от общего; иначе null. */
function ownSvg(prototype: Prototype, variant: Prototype['varianty'][number], common: string) {
  const svg = renderSolid(prototype.chertezh(variant.params));
  return svg === common ? null : svg;
}

function kindOf(razdel: Razdel, prototype: Prototype): PoolKind {
  const first = prototype.varianty[0];
  if (first === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет вариантов`);
  }
  const own = perVariant(prototype);
  const common = renderSolid(prototype.chertezh(first.params));
  return {
    id: prototype.id,
    title: prototype.nazvanie,
    group: razdel.nomer,
    groupTitle: razdel.nazvanie,
    format: prototype.format,
    svg: common,
    variants: prototype.varianty.map((variant) => {
      const seal = sealAnswer(prototype.otvet(variant.params));
      /* Формулы в разборе набираются здесь же, на сборке: разбор
         уезжает закрытым, и в браузере KaTeX по нему уже не
         пройдёт — там только расшифровка и вставка готовой
         разметки. */
      const steps = prototype
        .shagi(variant.params)
        .map((step) => typeset(step.text))
        .join(STEP_SEP);
      return {
        n: variant.n,
        uslovieHtml: typeset(prototype.uslovie(variant.params)),
        seal,
        /* Разбор закрыт тем же отпечатком: без него не раскрыть. */
        steps: sealText(steps, seal),
        razbor:
          prototype.chertezhRazbora === undefined
            ? null
            : sealText(renderSolid(prototype.chertezhRazbora(variant.params)), seal),
        /* null — чертёж прототипа подходит и этому варианту. */
        svg: own ? ownSvg(prototype, variant, common) : null,
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
