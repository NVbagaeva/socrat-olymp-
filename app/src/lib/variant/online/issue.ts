/**
 * Выдать вариант или серию через кабинет (этап 2): партия по коду — та
 * же, что у печатного листа, — превращается в условия и ключ для
 * issue_variant_work. Условия получат ученики, ключ (ответ и подсказки)
 * останется на сервере.
 */

import { svgSDannymi } from '@/lib/stereo/zhivoy';
import { BALLY } from '@/content/variantOnline/bally';
import type { IssueVariantInput, VariantWorkTaskInput } from '@/lib/kabinet/types';
import type { VariantSet } from '../types';
import type { Mode, Timer } from './link';

export interface IssueSettings {
  title: string;
  kind: string;
  mode: Mode;
  timer: Timer;
  dueAt: string | null;
  classId: string | null;
  studentIds: string[];
  /** Какие варианты партии выдать (с 1). Пусто — все: серия. */
  variants: number[];
}

export function issueInput(set: VariantSet, s: IssueSettings): IssueVariantInput {
  const chosen = s.variants.length > 0 ? s.variants : set.variants.map((v) => v.index);
  return {
    title: s.title,
    kind: s.kind,
    setCode: set.code,
    mode: s.mode,
    timer: s.timer,
    dueAt: s.dueAt,
    classId: s.classId,
    studentIds: s.studentIds,
    /* Номера вариантов в работе — подряд с 1: «Вариант 3» партии
       становится вариантом 1 работы, если выдан он один. */
    variants: chosen.map((no, k) => ({
      variant: k + 1,
      setVariant: no,
      tasks: (set.variants[no - 1]?.tasks ?? []).map((t, i): VariantWorkTaskInput => ({
        position: i + 1,
        egeNo: t.egeNumber,
        prototypeId: t.prototypeId.slice(0, 64),
        taskRef: t.taskId.slice(0, 64),
        subtype: t.subtype.slice(0, 32),
        points: BALLY[t.egeNumber],
        statement: t.statement,
        /* Данные живого чертежа стереометрии — в той же строке (svgSDannymi). */
        figure: t.figure === null ? null : svgSDannymi(t.figure.svg, t.figure.zhivoy),
        answer: t.answer,
        hints: (t.hints ?? []).map((h) => ({ ...h, options: [...h.options] })),
      })),
    })),
  };
}
