/**
 * Вопросы самопроверки вкладки «Теория» задания №4.
 *
 * Правило раздела то же, что у задач: верный ответ не попадает ни в
 * разметку, ни в бандл открытым текстом. Вниз уезжает не ответ, а его
 * отпечаток; нажатый вариант сверяется с ним в браузере (secret.ts).
 *
 * Варианты выбора в разметке, конечно, есть — их читает ученик. Нет
 * только того, какой из них верный.
 */

import { fingerprint, sealText } from './secret';

/** Вопрос, как он уезжает в браузер: условие и отпечаток ответа. */
export interface VoprosSeal {
  id: string;
  /** Формулировка события. */
  text: string;
  /** Отпечаток верного варианта. Самого варианта здесь нет. */
  seal: string;
}

/** Вопрос в исходнике: условие и верный вариант словом. */
interface Vopros {
  id: string;
  text: string;
  otvet: string;
}

/**
 * Отпечаток варианта ответа. Соль своя, не как у числового ответа
 * задачи: одно и то же слово в разных местах раздела даёт разные
 * отпечатки, и таблицу одного блока нельзя приложить к другому.
 */
export function sealVariant(variant: string): string {
  return fingerprint(`teoriya:${variant}`);
}

/** Сходится ли нажатый вариант с отпечатком. */
export function variantMatches(variant: string, sealed: string): boolean {
  return sealVariant(variant) === sealed;
}

/* Шесть событий из макета, в том же порядке. */
const VOPROSY: readonly Vopros[] = [
  { id: 'kost-8', text: 'При броске кости выпадает число 8.', otvet: 'Невозможное' },
  { id: 'kost-4', text: 'При броске кости выпадет число 4.', otvet: 'Случайное' },
  { id: 'kost-1-6', text: 'При броске кости выпадет число от 1 до 6.', otvet: 'Достоверное' },
  { id: 'solnce', text: 'Завтра взойдёт Солнце.', otvet: 'Достоверное' },
  { id: 'moneta', text: 'При подбрасывании монеты выпадет орёл.', otvet: 'Случайное' },
  { id: 'kost-2-5', text: 'При броске кости выпадет число 2 или 5.', otvet: 'Случайное' },
];

/**
 * Вопросы для браузера: условие и отпечаток. Считается на сборке —
 * страница серверная, и открытые ответы остаются здесь.
 */
export function voprosyVidovSobytiy(): VoprosSeal[] {
  return VOPROSY.map((vopros) => ({
    id: vopros.id,
    text: vopros.text,
    seal: sealVariant(vopros.otvet),
  }));
}

/* ── Блок «Проверь понимание» раздела «Классическая вероятность» ──
   Здесь вопрос показывается по одному, а варианты — дроби, набранные
   TeX. Отличие от блока выше: разбор называет ответ словами, поэтому
   открытым текстом вниз он не идёт — строки закрыты потоком от того
   же отпечатка и раскрываются, когда ученик уже ответил. */

/** Разбор вопроса: обе строки в закрытом виде. */
export interface RazborSeal {
  /** Пояснение словами. */
  text: string;
  /** Итоговая формула в TeX. */
  formula: string;
}

/** Вопрос с выбором дроби, как он уезжает в браузер. */
export interface VoprosVyboraSeal {
  id: string;
  /** Условие. Пусто — вопрос ещё не написан. */
  text: string;
  /** Варианты на кнопках, в TeX. Их читает ученик. */
  otvety: readonly string[];
  /** Отпечаток верного варианта. Самого варианта здесь нет. */
  seal: string;
  /** Закрытый разбор. Пусто — вопроса ещё нет. */
  razbor: RazborSeal | null;
}

/** Вопрос в исходнике: условие, варианты, верный ответ и разбор. */
interface VoprosVybora {
  id: string;
  text: string;
  otvety: readonly string[];
  otvet: string;
  razbor: RazborSeal;
}

/*
 * Три вопроса блока. Написан первый — второй и третий ещё не
 * переданы, и на их месте стоит null: блок покажет «Вопрос
 * готовится». Чтобы добавить вопрос, достаточно заменить null
 * записью такого же вида; счётчик «1 / 3» считает длину списка.
 */
const PONIMANIE: readonly (VoprosVybora | null)[] = [
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

/**
 * Вопросы блока для браузера: условие, варианты, отпечаток верного и
 * закрытый разбор. Считается на сборке.
 */
export function voprosyPonimaniya(): VoprosVyboraSeal[] {
  return PONIMANIE.map((vopros, i) => {
    if (vopros === null) {
      return { id: `gotovitsya-${i + 1}`, text: '', otvety: [], seal: '', razbor: null };
    }
    const seal = sealVariant(vopros.otvet);
    return {
      id: vopros.id,
      text: vopros.text,
      otvety: vopros.otvety,
      seal,
      razbor: {
        text: sealText(vopros.razbor.text, seal),
        formula: sealText(vopros.razbor.formula, seal),
      },
    };
  });
}
