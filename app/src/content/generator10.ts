/**
 * Генератор №10 «Прикладные задачи»: слова и пресеты конфига. Группы
 * и прототипы приходят из движка (lib/zadanie10/protoInfo) через
 * lib/zadanie10/generator10.ts — здесь их не переписываем.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';

export const GENERATOR10_TEXTS = {
  section: '№10 · Прикладные задачи',
  sheet: {
    chip: 'Задание 10',
    title: 'Прикладные задачи',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
  /** Подзаголовок листа, когда вид работы не выбран. */
  podzagolovok: 'Задания для отработки',
  /** Прежняя настройка генератора — переключатель в «Дополнительно». */
  flag: {
    title: 'Картинки сюжетов',
    note: 'Тратят тонер; чертёж моста печатается всегда.',
  },
};

/**
 * Банк №10: задачи открытого банка ФИПИ (4–8 на прототип) и
 * сгенерированные аналоги (по 20). У прототипов «из курса» задач ФИПИ
 * нет — там только аналоги.
 */
export const GENERATOR10_SOURCES = [
  {
    id: 'bank' as const,
    title: 'Только ФИПИ',
    short: 'ФИПИ',
    note: 'Открытый банк; кончились — аналоги.',
  },
  {
    id: 'mix' as const,
    title: 'Вперемешку',
    short: 'вперемешку',
    note: 'Задачи ФИПИ и аналоги через одну.',
  },
  {
    id: 'new' as const,
    title: 'Только аналоги',
    short: 'аналоги',
    note: 'Сгенерированные задачи «не из открытого банка».',
  },
];

/** Пресеты: ключ — группа («II») или прототип («P11»). */
export const GENERATOR10_PRESETS: GenPreset[] = [
  {
    id: 'variant',
    title: 'По группе',
    sub: '5 задач · все группы',
    variants: 1,
    levels: [],
    sostav: { I: 1, II: 1, III: 1, IV: 1, V: 1 },
  },
  {
    id: 'dz',
    title: 'Домашка',
    sub: '10 задач · все группы',
    variants: 1,
    levels: [],
    sostav: { I: 2, II: 2, III: 2, IV: 2, V: 2 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '5 задач · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { I: 1, II: 1, III: 1, IV: 1, V: 1 },
    kind: 'sr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { II: 6 },
    pickTopic: 6,
  },
];
