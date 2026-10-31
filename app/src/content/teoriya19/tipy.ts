/**
 * Типы раздела задания №19 «Задача с параметром».
 *
 * Теория устроена главами, как у №16 (content/teoriya16.ts): вводные
 * главы и по главе на каждый из 14 методов. У главы метода три вкладки:
 * «Теория» (плашка метода карточками), «Разбор» (подробно разобранные
 * примеры и опорные задачи) и «Тренировочная работа» (задания с
 * проверкой ответа и полным решением).
 *
 * Формулы — только $…$ (KaTeX), выделение — **…**. Ответ — TeX-запись
 * множества значений параметра: «(-1;\,0)\cup\left(\frac15;\,\frac13\right)»;
 * её разбирает автопроверка (lib/zadanie16/otvet.ts) и проверочные
 * скрипты scripts/verify_param/.
 *
 * Источник задачи хранится служебным полем и на экран не выводится —
 * как у банков №4 и №5. Названий сторонних пособий и имён авторов в
 * репозитории нет: источники описаны обезличенно (ISTOCHNIKI_19).
 */

import type { Ton16 } from '@/content/teoriya16';
import type { Scena19 } from '@/lib/zadanie19/risunok';

/** Откуда задача: документ из исходных материалов и номер в нём. */
export type Istochnik19 =
  | { dok: keyof typeof ISTOCHNIKI_19; nomer: string; pravka?: string }
  /** Составлено по прототипу: числа другие, идея прототипа сохранена. */
  | { sostavleno: string };

/**
 * Исходные материалы — обезличенно. Ключ — номер файла в подборке
 * автора раздела; сами файлы в репозиторий не кладутся.
 */
export const ISTOCHNIKI_19 = {
  '00': 'методичка «12 методов» с примерами',
  '01': 'разборы 16 задач (полная версия)',
  '03': 'подборка «необычные формулировки», без решений',
  '04': 'подборка «графический метод, метод областей», без решений',
  '05': 'подборка «свойства функций, упрощающее значение», без решений',
  '06': 'подготовительные задачи: графики и множества точек',
  '46': 'курс, тема «Базовые элементы»',
  '47': 'курс, тема «Графические методы»',
  '48': 'курс, тема «Аналитические методы»',
  kurs: 'курс, задания темы «Аналитические методы» (номер задания курса)',
} as const;

/** Рисунок: сцена движка и подпись под ним. */
export interface Risunok19 {
  scena: Scena19;
  podpis?: string;
}

/** Карточка теории — вид, метка, текст, шаги, формула, рисунок. */
export interface Kartochka19 {
  ton: Ton16;
  metka?: string;
  title?: string;
  /** Абзацы. */
  text?: string[];
  /** Формула крупно, TeX без долларов. */
  tex?: string;
  /** Нумерованные шаги. */
  shagi?: string[];
  /** Маркированный список. */
  punkty?: string[];
  risunok?: Risunok19;
  /** Плашка-вывод внизу карточки. */
  itog?: string;
  /** Ширина на широком экране, из шести колонок; по умолчанию 2. */
  shirina?: 2 | 3 | 4 | 6;
}

export interface Punkt19 {
  id: string;
  title: string;
  kartochki: Kartochka19[];
}

/** Этап решения: подзаголовок, строки, формулы крупно, рисунок. */
export interface Etap19 {
  title?: string;
  lines: string[];
  /** Формулы крупно (системы, совокупности) — TeX без долларов. */
  tex?: string[];
  /** Строки после формул. */
  posle?: string[];
  /** Нумерованный список случаев. */
  spisok?: string[];
  risunok?: Risunok19;
  /** Живой рисунок с ползунком параметра — id из lib/zadanie19/zhivye. */
  zhivoy?: string;
}

/** Буква параметра: ответ показывается как «a ∈ …», «k ∈ …». */
export type Bukva19 = 'a' | 'b' | 'c' | 'k' | 'p';

/** Подробно разобранный пример. */
export interface Razbor19 {
  id: string;
  title: string;
  uslovie: string;
  istochnik: Istochnik19;
  bukva: Bukva19;
  /** Строка «Почему этот метод». */
  pochemu: string;
  etapy: Etap19[];
  otvet: string;
  /** «Другой способ» — коротко. */
  drugoy?: Etap19;
}

/** Опорная задача — короткий «кирпичик» решения. */
export interface Opornaya19 {
  id: string;
  title: string;
  uslovie: string;
  istochnik: Istochnik19;
  bukva: Bukva19;
  shagi: string[];
  risunok?: Risunok19;
  otvet: string;
}

export type Uroven19 = 'razminka' | 'ege' | 'povyshennyy';

/** Задание тренировочной работы — элемент банка №19. */
export interface Zadacha19 {
  id: string;
  uroven: Uroven19;
  istochnik: Istochnik19;
  bukva: Bukva19;
  uslovie: string;
  otvet: string;
  /** Подсказка: с чего начать. */
  podskazka: string;
  reshenie: Etap19[];
}

export interface Glava19 {
  id: string;
  title: string;
  /** Номер метода 1–14; у вводных глав нет. */
  metod?: number;
  skoro?: true;
  lead?: string;
  teoriya: Punkt19[];
  razbory: Razbor19[];
  opornye: Opornaya19[];
  zadachi: Zadacha19[];
}
