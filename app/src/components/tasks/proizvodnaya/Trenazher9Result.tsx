'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { trainerResult } from '@/content/trainerModes';
import { assetUrl } from '@/lib/assetUrl';
import type { Result9 } from '@/lib/proizvodnaya/sessionStore';

export interface Trenazher9ResultProps {
  result: Result9;
  backHref: string;
  /** Та же тренировка с новыми задачами. */
  onAgain: () => void;
  /** Закрыть итог и вернуться к конфигуратору. */
  onNew: () => void;
}

function timeText(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return minutes === 0 ? `${rest} с` : `${minutes} мин ${rest} с`;
}

/** Итог тренировки №9: та же разметка, что у №2 и №8, свои данные. */
export function Trenazher9Result({ result, backHref, onAgain, onNew }: Trenazher9ResultProps) {
  const { total, solved, right, hinted, misses, seconds, early, rows } = result;
  const percent = solved === 0 ? 0 : Math.round((right / solved) * 100);

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
        <p className="tdone__lead">
          {early
            ? `Тренировка завершена досрочно. Итог подведён по решённым заданиям: ${solved} из ${total}.`
            : trainerResult.lead}
        </p>
      </header>

      <div className="tdone__score">
        <p className="tdone__cell">
          <span className="tdone__big">
            {right} / {solved}
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
          <dt>Решено</dt>
          <dd>{solved}</dd>
        </div>
        {early ? (
          <div className="tdone__row">
            <dt>Не решено</dt>
            <dd>{total - solved}</dd>
          </div>
        ) : null}
        <div className="tdone__row">
          <dt>{trainerResult.rows.right}</dt>
          <dd>{right}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.wrong}</dt>
          <dd>{misses}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.hinted}</dt>
          <dd>{hinted}</dd>
        </div>
        <div className="tdone__row">
          <dt>{trainerResult.rows.time}</dt>
          <dd>{timeText(seconds)}</dd>
        </div>
      </dl>

      {rows.length === 0 ? null : (
        <section className="tdone__kinds">
          <h4 className="tdone__kinds-title">{trainerResult.kinds}</h4>
          <ul className="tdone__list">
            {rows.map((row) => (
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
      )}

      <div className="tdone__actions">
        <Button onClick={onAgain}>{trainerResult.again}</Button>
        <Button variant="secondary" onClick={onNew}>
          Настроить новую тренировку
        </Button>
        <Link className="btn btn--ghost" href={backHref}>
          {trainerResult.back}
        </Link>
      </div>
    </section>
  );
}
