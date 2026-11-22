import Link from 'next/link';
import { PARY_PROFIL_BAZA } from '@/content/baza/tasks';
import { taskHref, tasksOf } from '@/content/tasks';
import type { Level } from '@/lib/level';
import './level.css';

/** Номер парного задания на другом уровне; undefined — пары нет. */
export function paraZadaniya(level: Level, slug: string): string | undefined {
  if (level === 'profile') return PARY_PROFIL_BAZA[slug];
  return Object.entries(PARY_PROFIL_BAZA).find(([, baza]) => baza === slug)?.[0];
}

/**
 * Плашка «Это же в базе» / «Это же в профиле» на странице задания:
 * ссылка на задание той же темы другого уровня (content/baza/tasks.ts,
 * PARY_PROFIL_BAZA). Нет пары — плашки нет.
 */
export function EtoZheV({ level, slug }: { level: Level; slug: string }) {
  const para = paraZadaniya(level, slug);
  const other: Level = level === 'profile' ? 'base' : 'profile';
  const task = tasksOf(other).find((t) => t.slug === para);
  if (task === undefined) return null;
  return (
    <p className="eto-zhe">
      <span className="eto-zhe__label">
        {other === 'base' ? 'Это же в базе' : 'Это же в профиле'}
      </span>
      <Link className="eto-zhe__link" href={taskHref(task)}>
        №{Number(task.no)} · {task.name}
        <span aria-hidden="true"> →</span>
      </Link>
    </p>
  );
}
