import type { ComponentType } from 'react';
import type { TrenPayload } from '@/lib/trenazher/sessiya';

/** Движок раздела, загруженный по требованию: собирает задачу по заданию тренировки. */
export interface Postroitel<T> {
  /** Задача на месте at с номером «похожей». null — не собралась. */
  postroit: (payload: TrenPayload, at: number, pohozhaya: number) => T | null;
}

/** Что ученик сделал в подсказке по шагам — знает только карточка раздела. */
export type Shagi = Record<string, unknown>;

/**
 * Карточка задачи раздела — плагин общего тренажёра. Раздел отвечает
 * за то, как выглядит и проверяется его задача (условие, рисунок,
 * поле ответа, подсказка по шагам, разбор); ленту номеров, попытки,
 * режимы, время и итоги ведёт общий экран.
 */
export interface KartochkaRazdela<T> {
  /** Загрузить движок раздела: тяжёлые модули — через import(). */
  zagruzit: () => Promise<Postroitel<T>>;
  /** Условие для итогов, уже набранное KaTeX. */
  html: (task: T) => string;
  /** Условие и рисунок. shagi — состояние подсказки: шаг может менять рисунок. */
  Uslovie: ComponentType<{ task: T; nomer: number; shagi: Shagi | null }>;
  /**
   * Поле ответа — плагин: число, выбор варианта, таблица (№13).
   * value — строка: составной ответ раздел кодирует сам.
   */
  Otvet: ComponentType<{
    task: T;
    value: string;
    onChange: (value: string) => void;
    proverka: 'right' | 'wrong' | null;
    disabled: boolean;
    labelId: string;
  }>;
  proverit: (task: T, value: string) => boolean;
  /** Можно ли проверять: составной ответ (таблица) заполнен. Нет — непустая строка. */
  gotov?: (task: T, value: string) => boolean;
  /** Пояснение к ответу, HTML: что проверить при ошибке, откуда ответ при верном. */
  poyasnenie?: (task: T, value: string, right: boolean) => string;
  estPodskazka: (task: T) => boolean;
  /**
   * Подсказка ведёт к уравнению, а ответ ученик вводит сам: поле ответа
   * остаётся под подсказкой, задача закрывается ответом (с подсказкой).
   * Нет — подсказка доводит до ответа и сама закрывает задачу.
   */
  otvetPosleShagov?: boolean;
  /**
   * Подсказка по шагам. onMiss — неверный ответ на шаге, onDone —
   * цепочка пройдена (задача решена с подсказкой).
   */
  Podskazka: ComponentType<{
    task: T;
    shagi: Shagi;
    setShagi: (next: Shagi) => void;
    onMiss: () => void;
    onDone: () => void;
  }>;
  estRazbor: (task: T) => boolean;
  Razbor: ComponentType<{ task: T }>;
  /** Записать закрытую задачу в статистику раздела. */
  zapisat: (key: string, itog: { right: boolean; clean: boolean; sek: number }) => void;
}

/** Ссылки на теорию и опорные задачи типа: для итогов. */
export interface SsylkiTipa {
  teoriya?: string;
  opornye?: string;
}
