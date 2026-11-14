/**
 * Тренировка №12 на общем тренажёре по банку (lib/trening/bank.ts):
 * ключи задач и запись прежнего тренажёра.
 *
 * Задача — шаблон набора движка: «12Q.B-07» (набор «12Q.B», шаблон 07).
 * Числа шаблона даёт движок по seed; в тренировке seed у шаблона
 * постоянный (lib/ves12/trening/zagruzka.ts), поэтому задача по ключу
 * собирается одной и той же — после перезагрузки, в «Работе над
 * ошибками», в закладке.
 */

import { isRecord } from '@/lib/trainerSession/restore';
import type { PayloadBanka, TaskBanka } from '@/lib/trening/bank';

/** Ключ задачи №12: шаблон набора — «12Q.B-07», у задач ФИПИ «12E.A-F1». */
export const KLYUCH12 = /^12[A-Z]?\.[A-Z]-(\d{2,3}|F\d{1,2})$/;

/** Набор шаблона: «12Q.B-07» → «12Q.B». */
export function naborKlyucha(id: string): string {
  return id.split('-')[0] ?? id;
}

/**
 * Seed сборки набора в тренировке: постоянный у набора, следующая
 * попытка (набор не собрался или задача без проверяемого ответа) — с
 * номером.
 */
export function seedNabora12(nabor: string): (attempt: number) => string {
  return (attempt) => (attempt === 0 ? `trening:${nabor}` : `trening:${nabor}:${attempt}`);
}

function zadacha(id: unknown): TaskBanka | null {
  return typeof id === 'string' && KLYUCH12.test(id) ? { id, p: naborKlyucha(id) } : null;
}

/**
 * Незаконченная тренировка прежнего тренажёра №12 (ключ сессии тот же —
 * budetege:trainer:12:session) → тренировка по банку с теми же
 * шаблонами в том же порядке. Понимаются оба прежних формата:
 *
 *  - тренажёр с фильтрами: { v: 1, rezhim, items: [{ k, seed? }] };
 *    «Без подсказок» → «Без подсказок и решений», «На время» → таймер;
 *  - самый первый экран: { recipe: 1, control, tasks: [{ set, seed, id }] }.
 *
 * Числа в шаблонах прежняя тренировка брала со своим seed; теперь у
 * шаблона seed постоянный, так что ещё не решённые задачи могут прийти
 * с другими числами. Отметки решённых остаются на местах.
 */
export function perenos12(packed: unknown): PayloadBanka | null {
  if (!isRecord(packed)) return null;
  if (packed['v'] === 1 && Array.isArray(packed['items'])) {
    const tasks = (packed['items'] as unknown[]).map((item) =>
      isRecord(item) ? zadacha(item['k']) : null,
    );
    if (tasks.length === 0 || tasks.some((t) => t === null)) return null;
    const rezhim = packed['rezhim'];
    return {
      tasks: tasks as TaskBanka[],
      control: rezhim === 'bez',
      timer: rezhim === 'vremya',
    };
  }
  if (packed['recipe'] === 1 && Array.isArray(packed['tasks'])) {
    const tasks = (packed['tasks'] as unknown[]).map((item) =>
      isRecord(item) ? zadacha(item['id']) : null,
    );
    if (tasks.length === 0 || tasks.some((t) => t === null)) return null;
    return { tasks: tasks as TaskBanka[], control: packed['control'] === true, timer: true };
  }
  return null;
}
