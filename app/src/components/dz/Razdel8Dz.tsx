'use client';

/**
 * ДЗ внутри раздела №8:
 *   - ученику — плашка «У вас домашнее задание до …» над вкладками;
 *   - репетитору — «Выдать домашнее задание» в генераторе, опорных
 *     задачах и тренажёре (по типу), с уже заполненной формой выдачи.
 * Гостю и при выключенном входе — ничего: страница та же, что без входа,
 * и SDK в первую загрузку не попадает (модуль базы — только у ученика).
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DZ, dueRu } from '@/content/dz';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import type { HwListItem } from '@/lib/dz/api';
import { homeworkHref, issueHref, type IssuePreset } from '@/lib/dz/links';
import { statusOf } from '@/lib/dz/results';
import { GROUPS, SKILLS } from '@/lib/vychisleniya/skills';
import './dz.css';

/** Открытые ДЗ ученика по №8, ближайший срок — первым. */
function openHomework(items: readonly HwListItem[]): HwListItem[] {
  return items
    .filter((item) => item.hw.taskNo === 8)
    .filter((item) => {
      const status = statusOf(
        item.hw,
        item.recipients[0] ?? { startedAt: null, submittedAt: null },
      );
      return status === 'new' || status === 'started' || status === 'late';
    })
    .sort((a, b) => Date.parse(a.hw.dueAt ?? '9999') - Date.parse(b.hw.dueAt ?? '9999'));
}

export function HomeworkBanner8() {
  const user = useSessionUser();
  const [items, setItems] = useState<HwListItem[]>([]);
  const student = AUTH_ENABLED && user !== null && user.role === 'student';

  useEffect(() => {
    if (!student) return;
    let alive = true;
    void (async () => {
      const { listHomework } = await import('@/lib/dz/api');
      const list = await listHomework('student').catch(() => []);
      if (alive) setItems(openHomework(list));
    })();
    return () => {
      alive = false;
    };
  }, [student]);

  const first = items[0];
  if (!student || first === undefined) return null;
  return (
    <p className="dz-plashka" role="status" data-block="dz-plashka">
      <span>
        {DZ.banner.text(first.hw.dueAt === null ? null : dueRu(first.hw.dueAt))}
        {DZ.banner.more(items.length)}
      </span>
      <Link className="btn btn--primary btn--sm" href={homeworkHref(first.hw.id)}>
        {DZ.banner.go}
      </Link>
    </p>
  );
}

function useTutor(): boolean {
  const user = useSessionUser();
  return AUTH_ENABLED && user !== null && user.role === 'tutor';
}

/** Кнопка «Выдать домашнее задание» с заполненной формой. Только репетитору. */
export function IssueHomework8({
  preset,
  label = DZ.list.issue,
}: {
  preset: IssuePreset;
  label?: string;
}) {
  if (!useTutor()) return null;
  return (
    <p className="dz-vydat-link" data-block="dz-vydat">
      <Link className="btn btn--secondary btn--sm" href={issueHref(preset)}>
        {label}
      </Link>
    </p>
  );
}

/** Опорные задачи блока: выдать типы этого блока. */
export function IssueHomeworkBlock8({ group }: { group: string }) {
  const kinds = SKILLS.filter((s) => s.group === group).flatMap((s) => s.prototypes);
  return <IssueHomework8 preset={{ origin: 'opornye', kinds, perKind: 2 }} />;
}

/** Тренажёр: выдать ДЗ по одному типу (навыку). */
export function IssueHomeworkSkills8() {
  if (!useTutor()) return null;
  return (
    <section className="dz-vydat-skills" data-block="dz-vydat-skills" aria-label={DZ.list.issue}>
      <p className="dz-field-title">{DZ.list.issue}: по типу</p>
      {GROUPS.map((group) => (
        <p key={group.id} className="dz-actions">
          {SKILLS.filter((s) => s.group === group.id).map((skill) => (
            <Link
              key={skill.id}
              className="btn btn--ghost btn--sm"
              href={issueHref({ origin: 'trenazher', kinds: skill.prototypes, perKind: 2 })}
            >
              {skill.nazvanie}
            </Link>
          ))}
        </p>
      ))}
    </section>
  );
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
