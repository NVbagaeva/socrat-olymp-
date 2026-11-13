/**
 * «Выдать работу над ошибками»: каждому ученику — новое по тому, где он
 * ошибся (решение владельца от 13.11):
 *   - тренажёр — аналог каждой задачи с ошибкой (тот же тип, новые числа
 *     или другая задача банка);
 *   - опорные — аналог с новым зерном (№8) или та же задача (№7: зерна нет);
 *   - карточки — набор из карточек с ошибкой и «Повторить».
 * Ошибка — неверно, открыто решение или неверные попытки без верного
 * ответа (lib/dz/results.ts, mistakesPlan).
 *
 * Пункты — «каждому свои»: у каждого ученика только его задачи.
 */

import { randomSeed } from '@/lib/randomSeed';
import type { HwKeyView } from '../api';
import { markOf, tasksOf } from '../results';
import type { HwAnswerView, HwPartInput, HwPartView, HwTaskView, HwUnitInput } from '../types';
import { kartochkaVDz } from './obshchee';
import type { Katalogi } from './index';

export interface OshibkiVhod {
  parts: readonly HwPartView[];
  tasks: readonly HwTaskView[];
  answers: readonly HwAnswerView[];
  keys: readonly HwKeyView[];
  students: readonly string[];
}

/** Ошибся ли ученик в единице: задача — неверно, решение, попытки; карточка — неверно или «Повторить». */
export function oshibka(answer: HwAnswerView | null): boolean {
  if (answer?.state === 'repeat') return true;
  const m = markOf(answer);
  return m === 'wrong' || m === 'revealed' || m === 'trying';
}

export async function sobratOshibki(
  vhod: OshibkiVhod,
  katalogi: Katalogi,
  zernoVydachi: string = randomSeed(),
): Promise<{ parts: HwPartInput[]; students: string[] }> {
  const byAnswer = new Map(vhod.answers.map((a) => [`${a.taskId}|${a.userId}`, a]));
  const keyOf = new Map(vhod.keys.map((k) => [k.taskId, k]));
  const parts: HwPartInput[] = [];
  const komu = new Set<string>();
  const avoid = new Set<string>();

  for (const [pi, part] of [...vhod.parts].sort((a, b) => a.position - b.position).entries()) {
    const kat = katalogi.get(part.taskNo);
    if (kat === undefined) continue;
    const units: HwUnitInput[] = [];
    for (const student of vhod.students) {
      const svoi = tasksOf(vhod.tasks, student).filter((t) => t.partId === part.id);
      for (const [ti, t] of svoi.entries()) {
        if (!oshibka(byAnswer.get(`${t.id}|${student}`) ?? null)) continue;
        const zerno = `${zernoVydachi}:${pi + 1}:${student}:${ti}`;
        const key = keyOf.get(t.id);
        let u: HwUnitInput | null = null;
        if (part.source === 'kartochki') {
          const k = kat.kartochki?.flatMap((p) => p.kartochki).find((x) => x.id === t.kind);
          u = k === undefined ? null : { ...kartochkaVDz(k), studentId: student };
        } else if (part.source === 'opornye') {
          const blok = kat.opornye.find((b) => b.slug === String(part.rule['blok'] ?? ''));
          if (blok !== undefined && part.taskNo === 7) {
            u = (await import('./r7')).opornaya7(blok, t.kind, student);
          } else if (blok !== undefined && part.taskNo === 8 && key !== undefined) {
            u = (await import('./r8')).analogOpornoy8(blok, key.ref, zerno, student);
          }
        } else if (key !== undefined) {
          if (part.taskNo === 7) {
            u = await (await import('./r7')).analogZadachi7(kat, key.ref, student, zerno, avoid);
          } else if (part.taskNo === 8) {
            u = (await import('./r8')).analogZadachi8(kat, key.ref, student, avoid);
          }
        }
        if (u !== null) {
          units.push(u);
          komu.add(student);
        }
      }
    }
    if (units.length > 0) {
      parts.push({
        source: part.source,
        taskNo: part.taskNo,
        ref: part.ref,
        titleHtml: part.titleHtml,
        rule: { oshibki: part.id, zerno: `${zernoVydachi}:${pi + 1}` },
        perStudent: true,
        comment: null,
        units,
      });
    }
  }
  return { parts, students: vhod.students.filter((s) => komu.has(s)) };
}
