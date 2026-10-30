/**
 * Тексты раздела задания №19 «Задача с параметром»: шапка, вкладки,
 * «О задании», подписи блоков. Главы теории — content/teoriya19/.
 *
 * Обращение к ученику — на «ты» (docs/razdel-pravila.md, п. 4).
 */

import { OPORNYE } from './opornye';
import { taskName } from './tasks';
import type { Uroven19 } from './teoriya19/tipy';
import type { RazdelTab } from './vkladki';

export const ZADANIE19 = {
  no: '19',
  slug: '19',
  title: taskName('19'),
  lead: 'Уравнения, неравенства и системы с параметром: 14 методов решения, разборы и тренировка с полными решениями.',
  badge: 'Профильный уровень',
  tabs: [
    { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
    { id: 'teoriya', label: 'Теория', tail: 'teoriya/', icon: 'book' },
    { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
    { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
    { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  ] as readonly RazdelTab[],
} as const;

/** Заголовок окна браузера: «Вкладка · Задача с параметром — Будет на ЕГЭ». */
export function zadanie19Title(tab: string): string {
  return `${tab} · ${ZADANIE19.title} — Будет на ЕГЭ`;
}

export const PROGRESS_19 = {
  /** Ключ прочитанных глав теории в lib/theoryRead. */
  teoriyaKey: '19',
} as const;

export const O_ZADANII_19 = {
  title: 'Задание 19. Задача с параметром',
  lead: 'Развёрнутый ответ, максимум — 4 балла. Ответ — множество значений параметра.',
  about:
    'В задании нужно найти все значения параметра, при которых уравнение, неравенство или система ведёт себя нужным образом: имеет ровно два решения, хотя бы одно, ни одного. Раздел построен на 14 методах решения. В каждой главе — плашка метода (когда применять, алгоритм, ловушки, образец оформления), подробные разборы с рисунками, опорные задачи и тренировочная работа с проверкой ответа и полным решением.',
  plan: 'Главы теории',
  kTeorii: 'Открыть теорию',
} as const;

export const BLOKI_19 = {
  teoriya: 'Теория',
  razbor: 'Разбор',
  rabota: (n: number) => `Тренировочная работа (${n})`,
  skoro: 'Скоро',
  skoroText: 'Глава метода в работе: появится вслед за предыдущими.',
  pochemu: 'Почему этот метод',
  otvet: 'Ответ',
  opornye: 'Опорные задачи',
  razbory: 'Разборы',
  reshenie: 'Решение',
  drugoy: 'Другой способ',
  metod: (n: number) => `Метод ${n}`,
} as const;

export const UROVNI_19: Record<Uroven19, string> = {
  razminka: 'Разминка',
  ege: 'Уровень ЕГЭ',
  povyshennyy: 'Повышенный',
};

export const RABOTA_19 = {
  primer:
    'Ответ записывай множеством значений параметра через «;», например: $(-1;\\,0)\\cup\\left(\\frac15;\\,\\frac13\\right)$ или $\\{-2\\}\\cup(1;\\,2)$.',
  pole: 'Ответ',
  polePodskazka: 'Например: (-1; 0) ∪ (1/5; 1/3)',
  proverit: 'Проверить',
  verno: 'Верно!',
  neverno: 'Пока неверно — проверь особые значения и скобки.',
  podskazka: 'Подсказка',
  reshenie: 'Показать решение',
  skrytReshenie: 'Скрыть решение',
  resheno: (k: number, n: number) => `Решено ${k} из ${n}`,
} as const;

export const ZHIVOY_19 = {
  title: 'Поверни прямую сам',
  resheniy: (n: number) =>
    n === Infinity
      ? 'бесконечно много решений'
      : `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'решение' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'решения' : 'решений'}`,
  osobye: 'Особые значения',
} as const;

export const TRENAZHER_19 = {
  lead: 'Все задания тренировочных работ открытых глав. Выбери метод и уровень; у каждого задания — проверка ответа, подсказка и полное решение.',
  vse: 'Все методы',
  vseUrovni: 'Все уровни',
  metod: 'Метод',
  uroven: 'Уровень',
  pusto: 'Под эти фильтры заданий пока нет.',
} as const;

export const OPORNYE_19 = {
  lead: 'Короткие «кирпичики», из которых собирается решение задачи уровня ЕГЭ: по методам, с решением и ответом.',
} as const;

export const ZAGLUSHKA_19 = {
  title: 'Вкладка готовится',
  text: 'Генератор листов №19 появится, когда в банке будут задания всех методов. Пока задания собраны в тренажёре.',
  kTrenazher: 'Перейти в тренажёр',
} as const;
