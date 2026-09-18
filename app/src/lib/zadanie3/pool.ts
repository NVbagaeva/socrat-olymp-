/**
 * Банк задания №3 для тренажёра: то, что уезжает в браузер.
 *
 * Собирается на сборке. Условия набирает KaTeX, чертежи рисует
 * движок solid/ — в браузер уходит готовая разметка, ни движка, ни
 * KaTeX там не нужно.
 *
 * Чертёж хранится на вариант, но только если он отличается от
 * чертежа прототипа: у большинства прототипов картинка одна на
 * десятерых — числа стоят в условии, а не на ней. Сравниваются
 * сами чертежи, признака у прототипа нет: он легко забывается,
 * и тогда варианту молча достаётся чужой чертёж.
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
 * Чертёж варианта, если он отличается от общего; иначе null.
 *
 * Раньше решалось признаком прототипа: числа на чертеже есть —
 * значит чертёж свой. Там, где вариант меняет не число, а букву —
 * какую диагональ найти, между какими прямыми угол, — всем десяти
 * доставался чертёж первого: спрашивали DB₁, а выделена была AC₁.
 * Признак к тому же легко забыть, переводя прототип на новый
 * формат, и молча получить ту же ошибку обратно.
 *
 * Поэтому признака больше нет: сравниваются сами чертежи. Совпал
 * с общим — в банк не попадает, и вес не растёт там, где картинка
 * одна на десятерых.
 */
function ownSvg(prototype: Prototype, variant: Prototype['varianty'][number], common: string) {
  const svg = renderSolid(prototype.chertezh(variant.params));
  return svg === common ? null : svg;
}

function kindOf(razdel: Razdel, prototype: Prototype): PoolKind {
  const first = prototype.varianty[0];
  if (first === undefined) {
    throw new Error(`У прототипа ${prototype.id} нет вариантов`);
  }
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
        svg: ownSvg(prototype, variant, common),
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
