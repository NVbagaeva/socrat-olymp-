/**
 * База, №17: теория. Пять видов уравнений номера — линейные,
 * квадратные, с корнем, показательные, логарифмические — и запись
 * ответа. Каждый раздел — в рамках сайта (свой файл teoriya-*.ts):
 * определения, случаи, схемы-развилки, разборы по шагам и «Проверь
 * себя». Корни каждого разобранного уравнения сверяет перебором
 * scripts/check-baza.mjs (pnpm test:baza).
 */

import type { RazdelTeorii } from '@/lib/baza/types';
import { KOREN_17 } from './teoriya-koren';
import { KVADRATNYE_17 } from './teoriya-kvadratnye';
import { LINEYNYE_17 } from './teoriya-lineynye';
import { LOGARIFMY_17 } from './teoriya-logarifmy';
import { OTVET_17 } from './teoriya-otvet';
import { POKAZATELNYE_17 } from './teoriya-pokazatelnye';

export const TEORIYA_17: RazdelTeorii[] = [
  LINEYNYE_17,
  KVADRATNYE_17,
  KOREN_17,
  POKAZATELNYE_17,
  LOGARIFMY_17,
  OTVET_17,
];
