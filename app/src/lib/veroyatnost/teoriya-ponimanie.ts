/**
 * Вопросы блока «Проверь понимание» раздела «Классическая вероятность».
 *
 * Отдельно от teoriya.ts по одной причине: здесь набираются формулы, а
 * KaTeX должен остаться на сборке. Модуль teoriya.ts читает и клиентский
 * блок самопроверки — потянув туда `tex`, мы отправили бы библиотеку
 * в браузер. Сюда же ходит только серверная разметка раздела.
 *
 * Правило раздела то же, что у задач: верного ответа в бандле нет.
 * Вниз уезжает отпечаток варианта, а разбор — он называет ответ
 * словами — закрыт потоком от того же отпечатка и раскрывается, когда
 * ученик уже ответил.
 *
 * Формулы вариантов и разбора набираются здесь же и уезжают готовой
 * вёрсткой: в браузере набирать их нечем и незачем.
 */

import { typeset } from '../tex';
import { sealText } from './secret';
import { sealVariant } from './teoriya';

/** Вариант ответа: значение для сверки и его готовая вёрстка. */
export interface VariantVid {
  /** Строка TeX — она же значение, по которому идёт сверка. */
  value: string;
  /** Набранная формула. */
  html: string;
}

/** Разбор вопроса: обе части в закрытом виде. */
export interface RazborSeal {
  /** Пояснение словами. */
  text: string;
  /** Набранная формула. */
  formula: string;
}

/** Вопрос, как он уезжает в браузер. */
export interface VoprosPonimaniya {
  id: string;
  /** Условие. Пусто — вопрос ещё не написан. */
  text: string;
  /** Варианты на кнопках. Их читает ученик. */
  otvety: readonly VariantVid[];
  /** Отпечаток верного варианта. Самого варианта здесь нет. */
  seal: string;
  /** Закрытый разбор. Нет — вопроса ещё нет. */
  razbor: RazborSeal | null;
}

/** Вопрос в исходнике: условие, варианты, верный ответ и разбор. */
interface Vopros {
  id: string;
  text: string;
  /** Варианты в TeX, в порядке макета. */
  otvety: readonly string[];
  otvet: string;
  razbor: { text: string; formula: string };
}

/*
 * Три вопроса блока. Написан первый — второй и третий ещё не
 * переданы, и на их месте стоит null: блок покажет «Вопрос
 * готовится». Чтобы добавить вопрос, достаточно заменить null
 * записью такого же вида; счётчик «1 / 3» считает длину списка.
 */
const PONIMANIE: readonly (Vopros | null)[] = [
  {
    id: 'shary-3-krasnyh',
    text: 'В коробке 8 шаров: 3 красных и 5 синих. Наугад достают один шар. Чему равна вероятность достать красный?',
    otvety: ['\\dfrac{3}{8}', '\\dfrac{5}{8}', '\\dfrac{3}{5}', '\\dfrac{8}{3}'],
    otvet: '\\dfrac{3}{8}',
    razbor: {
      text: 'Благоприятных исходов 3, всего исходов 8.',
      formula: 'P(A) = \\dfrac{3}{8}.',
    },
  },
  null,
  null,
];

/** Пустое место вопроса: блок скажет «Вопрос готовится». */
function zaglushka(nomer: number): VoprosPonimaniya {
  return { id: `gotovitsya-${nomer}`, text: '', otvety: [], seal: '', razbor: null };
}

/**
 * Вопросы блока для браузера: условие, набранные варианты, отпечаток
 * верного и закрытый разбор. Считается на сборке.
 */
export function voprosyPonimaniya(): VoprosPonimaniya[] {
  return PONIMANIE.map((vopros, i) => {
    if (vopros === null) {
      return zaglushka(i + 1);
    }
    const seal = sealVariant(vopros.otvet);
    return {
      id: vopros.id,
      text: vopros.text,
      otvety: vopros.otvety.map((value) => ({ value, html: typeset(`$${value}$`, true) })),
      seal,
      razbor: {
        text: sealText(vopros.razbor.text, seal),
        formula: sealText(typeset(`$${vopros.razbor.formula}$`, true), seal),
      },
    };
  });
}
