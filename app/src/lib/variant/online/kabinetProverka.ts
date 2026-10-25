/**
 * Проверка онлайн-варианта через кабинет (этап 2): ответы проверяет
 * сервер — функции базы variant_check и variant_submit
 * (supabase/migrations/20261025120000_variant_works.sql). Верные ответы
 * приходят в браузер только после «Завершить работу».
 *
 * Тот же интерфейс `Proverka`, что у проверки в браузере (proverka.ts):
 * экран решения не знает, где проверяют.
 */

import type { KabinetApi } from '@/lib/kabinet/api';
import type { VariantResult } from '@/lib/kabinet/types';
import { displayAnswer, normalizeAnswer } from './normalize';
import type { Proverka } from './proverka';

export interface KabinetProverka extends Proverka {
  /** Итог последнего завершения — для экрана результатов. */
  lastResult(): VariantResult | null;
}

export function kabinetProverka(api: KabinetApi, attemptId: string): KabinetProverka {
  let last: VariantResult | null = null;
  return {
    async checkOne(index, input) {
      const n = normalizeAnswer(input);
      if (!n.ok) return { kind: 'format', problem: n.problem };
      const r = await api.variantCheck(attemptId, index + 1, input);
      if (r.verdict === 'format') return { kind: 'format', problem: 'other' };
      if (r.verdict === 'right') return { kind: 'right' };
      return r.hints === undefined ? { kind: 'wrong' } : { kind: 'wrong', hints: r.hints };
    },
    async finish(answers, extra) {
      last = await api.variantSubmit(
        attemptId,
        answers.map((a) => (a === '' ? null : a)),
        [...(extra?.seconds ?? [])],
        (extra?.hinted ?? []).map((i) => i + 1),
      );
      return {
        right: last.tasks.map((t) => t.right),
        answers: last.tasks.map((t) => displayAnswer(t.key)),
      };
    },
    lastResult: () => last,
  };
}
