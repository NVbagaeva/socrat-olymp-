'use client';

import Image from 'next/image';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { assetUrl } from '@/lib/assetUrl';
import { KindName } from '../trainer/KindName';
import { sessionText, timeText } from './text';

/** Чем закончилось задание на итоговом экране. */
export type SummaryMark = 'right' | 'wrong' | 'hinted' | 'skipped';

export interface SummaryItem {
  /** Номер задания в пуле — по нему собирается «Прорешать ошибки». */
  poolIndex: number;
  kind: string;
  /** Условие, набранное KaTeX. */
  html: string;
  mark: SummaryMark;
  review?: () => ReactNode;
}

export interface SummaryData {
  /** Задания в том порядке, в котором их решали. */
  items: SummaryItem[];
  seconds: number;
  /** Задания тренировки: нужны, чтобы собрать из них часть заново. */
  payload: unknown;
}

export interface TrainerSummaryProps {
  data: SummaryData;
  backHref?: string | undefined;
  onNew: () => void;
  /** Не задан — кнопки «Прорешать ошибки» нет. */
  onRetry?: (() => void) | undefined;
}

interface KindRow {
  title: string;
  right: number;
  total: number;
}

function kindRows(items: SummaryItem[]): KindRow[] {
  const rows: KindRow[] = [];
  for (const item of items) {
    let row = rows.find((candidate) => candidate.title === item.kind);
    if (row === undefined) {
      row = { title: item.kind, right: 0, total: 0 };
      rows.push(row);
    }
    row.total += 1;
    if (item.mark === 'right') {
      row.right += 1;
    }
  }
  return rows;
}

/** Строка задания: номер, отметка, условие и разбор по нажатию. */
function Row({ item, no }: { item: SummaryItem; no: number }) {
  const [open, setOpen] = useState(false);
  const { review } = item;
  return (
    <li className={clsx('tsum__item', `tsum__item--${item.mark}`)}>
      <div className="tsum__head">
        <span className="tsum__no">{no}</span>
        <span className={clsx('tsum__mark', `tsum__mark--${item.mark}`)}>
          {sessionText.marks[item.mark]}
        </span>
        <KindName className="tsum__kind" title={item.kind} />
      </div>
      {item.html === '' ? null : (
        <div className="tsum__question" dangerouslySetInnerHTML={{ __html: item.html }} />
      )}
      {review === undefined ? null : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="tsum__toggle"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? sessionText.summary.hideReview : sessionText.summary.showReview}
          </Button>
          {open ? <div className="tsum__review">{review()}</div> : null}
        </>
      )}
    </li>
  );
}

/**
 * Итоги тренировки — один экран на все тренажёры: сколько верно,
 * неверно и пропущено, время, каждое задание с отметкой и разбором,
 * а под ними «Новая тренировка» и «Прорешать ошибки».
 *
 * Класс tdone — оформление итога из тренажёра №12, чтобы выглядел
 * он так же, как раньше.
 */
export function TrainerSummary({ data, backHref, onNew, onRetry }: TrainerSummaryProps) {
  const t = sessionText.summary;
  const { items } = data;
  const total = items.length;
  const count = (mark: SummaryMark) => items.filter((item) => item.mark === mark).length;
  const right = count('right');
  const wrong = count('wrong');
  const skipped = count('skipped');
  const hinted = count('hinted');
  const percent = total === 0 ? 0 : Math.round((right / total) * 100);
  const retryCount = wrong + hinted;

  return (
    <section className="tdone tsum">
      <Image
        className="tdone__cup"
        src={assetUrl('/images/trophy-glass.webp')}
        alt={t.trophyAlt}
        width={1147}
        height={1201}
      />

      <header className="tdone__head">
        <h3 className="tdone__title">{t.title}</h3>
        <p className="tdone__lead">{t.lead}</p>
      </header>

      <div className="tdone__score">
        <p className="tdone__cell">
          <span className="tdone__big">
            {right} / {total}
          </span>
          <span className="tdone__cap">{t.scoreLabel}</span>
        </p>
        <p className="tdone__cell">
          <span className="tdone__big">{percent}%</span>
          <span className="tdone__cap">{t.percentLabel}</span>
        </p>
      </div>

      <dl className="tdone__rows">
        <div className="tdone__row">
          <dt>{t.rows.total}</dt>
          <dd>{total}</dd>
        </div>
        <div className="tdone__row">
          <dt>{t.rows.right}</dt>
          <dd>{right}</dd>
        </div>
        <div className="tdone__row">
          <dt>{t.rows.wrong}</dt>
          <dd>{wrong}</dd>
        </div>
        <div className="tdone__row">
          <dt>{t.rows.skipped}</dt>
          <dd>{skipped}</dd>
        </div>
        {hinted === 0 ? null : (
          <div className="tdone__row">
            <dt>{t.rows.hinted}</dt>
            <dd>{hinted}</dd>
          </div>
        )}
        <div className="tdone__row">
          <dt>{t.rows.time}</dt>
          <dd>{timeText(data.seconds)}</dd>
        </div>
      </dl>

      <div className="tdone__actions">
        <Button onClick={onNew}>{t.newTraining}</Button>
        {onRetry === undefined || retryCount === 0 ? null : (
          <Button variant="secondary" onClick={onRetry}>
            {t.retry(retryCount)}
          </Button>
        )}
        {backHref === undefined ? null : (
          <Link className="btn btn--ghost" href={backHref}>
            {t.back}
          </Link>
        )}
      </div>

      {kindRows(items).length < 2 ? null : (
        <section className="tdone__kinds">
          <h4 className="tdone__kinds-title">{t.kinds}</h4>
          <ul className="tdone__list">
            {kindRows(items).map((row) => (
              <li className="tkind" key={row.title}>
                <KindName className="tkind__name" title={row.title} />
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

      <section className="tsum__list-wrap">
        <h4 className="tdone__kinds-title">{t.list}</h4>
        <ol className="tsum__list">
          {items.map((item, i) => (
            <Row key={`${i}-${item.poolIndex}`} item={item} no={i + 1} />
          ))}
        </ol>
      </section>
    </section>
  );
}
