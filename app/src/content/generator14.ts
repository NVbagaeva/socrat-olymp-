/**
 * Тексты генератора и печатного листа задания №14. Устройство —
 * lib/zadanie14/generator14.ts и lib/zadanie14/sheet14.ts.
 */

import type { GenPreset } from '@/lib/generator/obshchiy/types';
import { SHEET_13 } from './generator13';

export const GENERATOR14_TEXTS = {
  section: '№14 · Тригонометрические уравнения',
  sheet: {
    chip: 'Задание 14',
    title: 'Тригонометрические уравнения',
    course: 'Профильная математика',
    teacher: 'Багаева Н.В.',
  },
  podzagolovok: 'Уравнение: пункты а и б',
} as const;

/** Откуда задачи: формат ЕГЭ, опорные или вперемешку. */
export const GENERATOR14_SOURCES = [
  {
    id: 'mix' as const,
    title: 'Вперемешку',
    short: 'вперемешку',
    note: 'Задачи формата ЕГЭ и опорные задачи с пунктом б.',
  },
  {
    id: 'bank' as const,
    title: 'Формат ЕГЭ',
    short: 'формат ЕГЭ',
    note: 'Задачи как на экзамене: пункт а и отбор корней.',
  },
  {
    id: 'new' as const,
    title: 'Опорные',
    short: 'опорные',
    note: 'Задачи блоков опорных задач: один метод на задачу.',
  },
];

/** Темы генератора — группы методов; подтипы — методы (блоки опорных задач). */
export const GRUPPY_14 = [
  {
    id: 'OS',
    title: 'Основа: простейшие и серии',
    metody: ['prosteyshie', 'argument', 'obedinenie'],
  },
  { id: 'OT', title: 'Отбор корней', metody: ['otbor-krug', 'otbor-nerav'] },
  {
    id: 'FO',
    title: 'Формулы',
    metody: ['privedenie', 'privedenie-kvadrat', 'dvoynoy', 'slozhenie'],
  },
  { id: 'ZA', title: 'Замена переменной', metody: ['zamena', 'zamena-preobr'] },
  {
    id: 'OD',
    title: 'Однородные и вспомогательный угол',
    metody: ['odnorodnye-1', 'odnorodnye-2', 'vspomogatelnyy', 'abc'],
  },
] as const;

export const GENERATOR14_PRESETS: GenPreset[] = [
  {
    id: 'dz',
    title: 'Домашка',
    sub: '6 задач · все темы',
    variants: 1,
    levels: [],
    sostav: { OS: 1, OT: 1, FO: 2, ZA: 1, OD: 1 },
    kind: 'dz',
  },
  {
    id: 'sr',
    title: 'Самостоятельная',
    sub: '4 задачи · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { FO: 2, ZA: 1, OD: 1 },
    kind: 'sr',
  },
  {
    id: 'kr',
    title: 'Контрольная',
    sub: '5 задач · 2 варианта',
    variants: 2,
    levels: [],
    sostav: { OT: 1, FO: 2, ZA: 1, OD: 1 },
    kind: 'kr',
  },
  {
    id: 'one',
    title: 'Один тип',
    sub: 'отработать · 6 задач',
    variants: 1,
    levels: [],
    sostav: { ZA: 6 },
    pickTopic: 6,
  },
];

export const SHEET_14 = {
  head: SHEET_13.head,
  chip: 'Задание 14',
  text: 'Тригонометрические уравнения',
  runner: 'Задание 14 · Уравнение',
  uchitel: 'Багаева Н.В.',
  resheniya: 'файл для учителя',
  svodka: 'Сводка ответов',
  ramka: 'Запомни',
  obrazec: 'Образец решения',
  foot: SHEET_13.foot,
  pechat: 'Распечатать',
  pechatLead: 'Лист собран — откройте печать или сохраните PDF.',
} as const;
