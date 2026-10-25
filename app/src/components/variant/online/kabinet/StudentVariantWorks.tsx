'use client';

import Link from 'next/link';
import { Badge, Card } from '@/components/ui';
import { formatDate } from '@/components/kabinet/useKabinet';
import { kabinetText } from '@/components/kabinet/text';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import type { StudentHome, VariantResult, VariantWorkSummary } from '@/lib/kabinet/types';
import type { ArchivedWork } from '@/lib/variant/online/archive';
import { fullPartOne, testScore } from '@/lib/variant/online/proverka';
import type { EgeNo } from '@/lib/variant/types';
import { StatsView } from '../StatsView';
import '../online.css';

const T = ONLINE_TEXT.kab;

/** Итог попытки с сервера → строка статистики (та же, что у архива устройства). */
export function archivedOf(w: VariantWorkSummary, a: VariantResult): ArchivedWork {
  const numbers = a.tasks.map((t) => t.egeNo as EgeNo);
  return {
    id: a.id,
    code: w.id,
    variant: a.variant,
    mode: w.mode,
    title: w.title,
    finishedAt: Date.parse(a.finishedAt ?? a.startedAt),
    resultCode: '',
    primary: a.primary ?? 0,
    max: a.max ?? 0,
    test: fullPartOne(numbers) ? testScore(a.primary ?? 0) : null,
    seconds: a.seconds ?? 0,
    tasks: a.tasks.map((t) => ({
      egeNumber: t.egeNo as EgeNo,
      right: t.right,
      empty: t.answer === null,
      seconds: t.seconds,
    })),
  };
}

/**
 * Кабинет ученика: выданные варианты и статистика по ним — график
 * баллов, решаемость по номерам, время, слабые номера. Данные — с
 * сервера, на любом устройстве.
 */
export function StudentVariantWorks({ works }: { works: StudentHome['variantWorks'] }) {
  const all = works.flatMap((w) => w.attempts.map((a) => archivedOf(w, a)));
  return (
    <>
      <Card title={T.studentWorks}>
        {works.length === 0 ? (
          <p className="t-caption muted">{T.noStudentWorks}</p>
        ) : (
          <ul className="kab-list" data-testid="student-variants">
            {works.map((w) => {
              const done = w.attempts.length > 0;
              const run = w.open.length > 0;
              return (
                <li key={w.id} className="kab-list__row kab-list__row--wrap">
                  <span>
                    <Link href={`/kabinet/rabota/?id=${w.id}`} className="kab-strong">
                      {w.title}
                    </Link>
                    <span className="t-caption muted kab-block">
                      {w.tutor.name} · {T.variants(w.variants)} · {T.mode2[w.mode]} ·{' '}
                      {w.dueAt === null
                        ? kabinetText.homework.noDue
                        : kabinetText.homework.due(formatDate(w.dueAt))}
                    </span>
                  </span>
                  <Badge tone={done ? 'success' : run ? 'info' : 'neutral'}>
                    {done ? T.statusDone : run ? T.statusRun : T.statusNone}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      {all.length > 0 ? (
        <Card title={T.stats}>
          <StatsView works={all} code={null} />
        </Card>
      ) : null}
    </>
  );
}
