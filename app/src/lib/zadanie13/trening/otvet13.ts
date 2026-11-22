/**
 * Ответ ученика в тренажёре №13 — по общему правилу записи ответа
 * (lib/otvet), как в №8, №3, №7 и №6: в бланк записывают целое число
 * или конечную десятичную дробь; обыкновенная дробь с верным значением —
 * подсказка, попытка не тратится. Своё у №13 — «число верное, единицы
 * нет»: ответ совпал с тем же числом в чужих денежных единицах
 * (lib/zadanie13/edinicy.ts). На ЕГЭ это 0 баллов — ошибка со своим
 * вердиктом. «Определи тип» — выбор схемы, отпечаток выбора.
 */

import { readAnswer, type Reading } from '@/lib/otvet';
import { answerMatches, choiceMatches } from '../secret';

export function proverit13(
  vvod: string,
  z: { seal: string; wrongUnits: readonly string[]; sealTip: string },
  tip: boolean,
): Reading | { kind: 'edinicy' } {
  if (tip) {
    const right = choiceMatches(vvod, z.sealTip);
    return { kind: 'answer', value: vvod, right, viaFraction: false };
  }
  const reading = readAnswer(vvod, 'trenazher', (value) => answerMatches(value, z.seal));
  if (reading.kind === 'answer' && !reading.right) {
    const vChuzhih = z.wrongUnits.some((seal) => answerMatches(reading.value, seal));
    if (vChuzhih) return { kind: 'edinicy' };
  }
  return reading;
}
