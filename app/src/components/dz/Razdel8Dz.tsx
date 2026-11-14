'use client';

/**
 * Генератор №8: «Выдать домашнее задание» — выбранные в генераторе типы
 * уходят в черновик ДЗ (прежняя ссылка lib/dz/links.ts → issueHref,
 * конструктор кладёт их в черновик). Плашки и кнопки «В домашнее
 * задание» остальных вкладок — components/dz/razdel/DzVRazdele.tsx.
 * Гостю и при выключенном входе — ничего.
 */

import { DZ } from '@/content/dz';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { issueHref } from '@/lib/dz/links';
import './dz.css';

function useTutor(): boolean {
  const user = useSessionUser();
  return AUTH_ENABLED && user !== null && user.role === 'tutor';
}

/**
 * Генератор: выдать те типы, что выбраны в генераторе сейчас. Генератор
 * держит выбор в адресе страницы (lib/generatorQuery.ts), отсюда и берём.
 */
export function IssueHomeworkGenerator8() {
  const tutor = useTutor();
  if (!tutor) return null;
  return (
    <p className="dz-vydat-link" data-block="dz-vydat">
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => {
          void import('@/lib/generatorQuery').then(({ parseSheetQuery }) => {
            const params = parseSheetQuery(new URLSearchParams(window.location.search));
            const counts = new Map<string, number>();
            for (const item of params.sostav ?? []) {
              const kind = /^8\.[A-Z]/.exec(item.id)?.[0];
              if (kind !== undefined) counts.set(kind, (counts.get(kind) ?? 0) + item.n);
            }
            const kinds = [...counts.keys()];
            const per =
              kinds.length === 0
                ? 2
                : Math.round([...counts.values()].reduce((a, b) => a + b, 0) / kinds.length);
            window.location.assign(
              issueHref({ origin: 'generator', kinds, perKind: Math.min(5, Math.max(1, per)) }),
            );
          });
        }}
      >
        {DZ.list.issue}
      </button>
    </p>
  );
}
