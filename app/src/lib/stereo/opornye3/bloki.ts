/**
 * Блоки опорных задач №3 — двенадцать, по одному умению каждый. На
 * карточке блока — умение и название, без формул. Ненаписанные блоки
 * видны в списке как «скоро». У каждого блока — глава теории для итога.
 */

import type { BlokOp3, ZadachaOp3 } from './tipy';
import { zadachiBloka1 } from './blok1';
import { zadachiBloka2 } from './blok2';
import { zadachiBloka3 } from './blok3';
import { zadachiBloka10 } from './blok10';

export const BLOKI_3: readonly BlokOp3[] = [
  { id: 'chitayu', glava: 'chertezh', slug: 'chitayu-chertezh', no: 1, nazvanie: 'Читаю чертёж', umenie: 'читать', lead: 'Найти на рисунке прямоугольный треугольник, равные и перпендикулярные элементы', gotov: true },
  { id: 'treugolnik', glava: 'treugolnik', slug: 'prostranstvo-treugolnik', no: 2, nazvanie: 'Пространство → треугольник', umenie: 'читать и рисовать', lead: 'Диагонали, высоты и расстояния между вершинами через рабочий треугольник', gotov: true },
  { id: 'piramida', glava: 'mnogogranniki', slug: 'piramida', no: 3, nazvanie: 'Пирамида', umenie: 'читать', lead: 'Высота, боковое ребро, апофема и половина диагонали', gotov: true },
  { id: 'obem', glava: 'obem', slug: 'obem-i-ploshchad', no: 4, nazvanie: 'Объём и площадь', umenie: 'считать', lead: 'Куб, параллелепипед, призма', gotov: false },
  { id: 'sostavnye-obem', glava: 'obem', slug: 'sostavnye-obem', no: 5, nazvanie: 'Составные многогранники: объём', umenie: 'считать', lead: 'Сложить коробки или вычесть вырез', gotov: false },
  { id: 'sostavnye-ploshchad', glava: 'obem', slug: 'sostavnye-ploshchad', no: 6, nazvanie: 'Составные многогранники: площадь поверхности', umenie: 'считать', lead: 'Проекции на три плоскости и лишние стенки выемок', gotov: false },
  { id: 'vrashcheniya', glava: 'vrashcheniya', slug: 'cilindr-konus-shar', no: 7, nazvanie: 'Цилиндр, конус, шар', umenie: 'читать и считать', lead: 'Формулы и осевое сечение', gotov: false },
  { id: 'vo-skolko-raz', glava: 'podobie', slug: 'vo-skolko-raz', no: 8, nazvanie: 'Во сколько раз', umenie: 'считать', lead: 'Подобие и уровень жидкости', gotov: false },
  { id: 'kombinacii', glava: 'kombinacii', slug: 'kombinacii', no: 9, nazvanie: 'Комбинации тел', umenie: 'рисовать', lead: 'Вписанные и описанные тела через осевое сечение', gotov: false },
  { id: 'ugly', glava: 'ugly', slug: 'ugly', no: 10, nazvanie: 'Углы в многогранниках', umenie: 'читать', lead: 'Градусы и тангенс', gotov: true },
  { id: 'chasti', glava: 'obem', slug: 'chasti-tel', no: 11, nazvanie: 'Части тел', umenie: 'рисовать', lead: 'Вершины параллелепипеда, сектор конуса, середины рёбер тетраэдра', gotov: false },
  { id: 'schet', glava: 'schet', slug: 'schitayu-udobno', no: 12, nazvanie: 'Считаю удобно', umenie: 'считать', lead: 'Корни разложением, пифагоровы тройки, ответ «делённый на пи»', gotov: false },
];

/** Задачи написанных блоков: блок → его десять задач. */
const ZADACHI: Readonly<Record<string, () => ZadachaOp3[]>> = {
  chitayu: zadachiBloka1,
  treugolnik: zadachiBloka2,
  piramida: zadachiBloka3,
  ugly: zadachiBloka10,
};

export function zadachiBloka(id: string): ZadachaOp3[] {
  return ZADACHI[id]?.() ?? [];
}

export function blokBySlug(slug: string): BlokOp3 | undefined {
  return BLOKI_3.find((b) => b.slug === slug);
}
