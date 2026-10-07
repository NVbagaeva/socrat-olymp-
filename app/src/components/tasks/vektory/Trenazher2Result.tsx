'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { trainerResult } from '@/content/trainerModes';
import { TRENAZHER_2 } from '@/content/vektory';
import { assetUrl } from '@/lib/assetUrl';
import { kindTitle, type Task2 } from '@/lib/vektory/session';

/** Чем закончилось задание: решено само или с подсказками/решением. */
export type Mark2 = 'right' | 'hinted';

export interface Trenazher2ResultProps {
  tasks: Task2[];
  marks: Record<number, Mark2>;
  misses: number;
  seconds: number;
  backHref: string;
  onAgain: () => void;
}

function timeText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

interface KindRow {
  title: string;
  right: number;
  total: number;
}

function kindRows(tasks: Task2[], marks: Record<number, Mark2>): KindRow[] {
  const rows: KindRow[] = [];
  tasks.forEach((task, index) => {
    const title = kindTitle(task.prototype);
    const found = rows.find((row) => row.title === title);
    const row = found ?? { title, right: 0, total: 0 };
    if (found === undefined) {
      rows.push(row);
    }
    row.total += 1;
    if (marks[index] === 'right') {
      row.right += 1;
    }
  });
  return rows;
}

/** Итог тренировки №2: та же разметка, что у №8 и №12, свои данные. */
export function Trenazher2Result({
  tasks,
  marks,
  misses,
  seconds,
  backHref,
  onAgain,
}: Trenazher2ResultProps) {
  const total = tasks.length;
  const right = tasks.filter((_, index) => marks[index] === 'right').length;
  const hinted = tasks.filter((_, index) => marks[index] === 'hinted').length;
  const percent = total === 0 ? 0 : Math.round((right / total) * 100);

  return (
    <section className="tdone">
      <Image
        className="tdone__cup"
        src={assetUrl('/images/trophy-glass.webp')}
        alt={trainerResult.trophyAlt}
        width={1147}
        height={1201}
      />

      <header className="tdone__head">
        <h3 className="tdone__title">{trainerResult.title}</h3>
        <p className="tdone__lead">{trainerResult.lead}</p>
      </header>

      <div className="tdone__score">
        <p className="tdone__cell">
          <span className="tdone__big">
            {right} / {total}
          </span>
          <span className="tdone__cap">{trainerResult.scoreLabel}</span>
        </p>
        <p className="tdone__cell">
          <span className="tdone__big">{percent}%</span>
          <span className="tdone__cap">{trainerResult.percentLabel}</span>
        </p>
      </div>

      <dl className="tdone__rows">
        <div className="tdone__row">
          <dt>{trainerResult.rows.total}</dt>
          <dd>{total}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.right}</dt>
          <dd>{right}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.wrong}</dt>
          <dd>{misses}</dd>
        </div>
        <div className="tdone__row">
          <dt>{TRENAZHER_2.sOtkrytymResheniem}</dt>
          <dd>{hinted}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.time}</dt>
          <dd>{timeText(seconds)}</dd>
        </div>
      </dl>

      <section className="tdone__kinds">
        <h4 className="tdone__kinds-title">{trainerResult.kinds}</h4>
        <ul className="tdone__list">
          {kindRows(tasks, marks).map((row) => (
            <li className="tkind" key={row.title}>
              <span className="tkind__name">{row.title}</span>
              <span className="tkind__bar">
                <span
                  className="tkind__fill"
                  style={{ width: `${row.total === 0 ? 0 : (row.right / row.total) * 100}%` }}
                />
              </span>
              <span className="tkind__score">
                {row.right}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="tdone__actions">
        <Button onClick={onAgain}>{trainerResult.again}</Button>
        <Link className="btn btn--ghost" href={backHref}>
          {trainerResult.back}
        </Link>
      </div>
    </section>
  );
}
