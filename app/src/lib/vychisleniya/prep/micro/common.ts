import type { Rng } from '../../rng';
import type { PrepChoice, PrepGenerated, PrepMicro } from '../types';

export const ZNAK: PrepChoice[] = [
  { number: '1', label: 'плюс' },
  { number: '2', label: 'минус' },
];

export function micro(
  id: string,
  nazvanie: string,
  formula: string,
  generate: (r: Rng) => PrepGenerated | null,
  choices?: PrepChoice[],
): PrepMicro {
  return choices === undefined
    ? { id, nazvanie, formula, answerType: 'number', generate }
    : { id, nazvanie, formula, answerType: 'choice', choices, generate };
}

export function naydi(tex: string): string {
  return `Найдите значение выражения $${tex}$.`;
}
