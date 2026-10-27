'use client';

import { clsx } from 'clsx';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MAX_TOTAL } from '@/content/variantOnline/bally';
import { CHAST2_TEXT } from '@/content/variantOnline/chast2Text';
import { TESTOVYJ_33 } from '@/content/variantOnline/shkala';
import { ONLINE_TEXT as T } from '@/content/variantOnline/text';
import { katex } from '@/lib/graph/katex';
import { upgrade } from '@/lib/graph/katex-upgrade.js';
import { qrSvg } from '@/lib/qr';
import { proverkaHref, sectionLinks } from '@/lib/variant/online/link';
import { displayAnswer } from '@/lib/variant/online/normalize';
import { scoreWork } from '@/lib/variant/online/proverka';
import type { ResultData } from '@/lib/variant/online/resultCode';
import type { VariantTask } from '@/lib/variant/types';
import { dateText, secondsText } from './format';

export interface WorkResultProps {
  tasks: readonly VariantTask[];
  data: ResultData;
  /** Верно ли каждое задание (первая попытка). */
  rights: readonly boolean[];
  /** Верные ответы в записи бланка. */
  correct: readonly string[];
  /** Название работы: «Пробный ЕГЭ · Вариант 3». */
  title: string;
  /** Код результата; null — не показывать блок кода (работа над ошибками). */
  resultCode: string | null;
  /** Страница учителя: «Ответ ученика» вместо «Ваш ответ». */
  teacher?: boolean;
  /** Без баллов: «Работа над ошибками». */
  noScore?: boolean;
  outdated?: boolean;
  /** Кнопки под результатом: работа над ошибками, серия, ещё раз. */
  actions?: ReactNode;
  /** Предупреждение над результатом. */
  notice?: string | null;
  /**
   * Вариант из двух частей: баллы части 2 (самопроверка). Итог — часть 1
   * из 13, часть 2 из 20, всего из 33; тестовый балл — только когда
   * оценена вся часть 2.
   */
  chast2?: { summa: number; oceneno: number; vsego: number; max: number };
  /** Блок под таблицей части 1 — задания части 2. */
  posleTablicy?: ReactNode;
}

/**
 * Результаты варианта: баллы, таблица «№ — ответ — верный — ✓/✗ —
 * время — разбор», код результата с QR и ссылки на разделы для
 * неверных номеров. Один компонент для ученика (после «Завершить») и
 * для учителя (страница «Проверить результат ученика»): учитель видит
 * ровно то же, что ученик.
 */
export function WorkResult({
  tasks,
  data,
  rights,
  correct,
  title,
  resultCode,
  teacher = false,
  noScore = false,
  outdated = false,
  actions,
  notice,
  chast2,
  posleTablicy,
}: WorkResultProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const score = scoreWork(
    tasks.map((t) => t.egeNumber),
    rights,
  );
  useEffect(() => {
    if (root.current !== null) upgrade(root.current, katex);
  });

  const link = useMemo(
    () =>
      resultCode === null || typeof window === 'undefined'
        ? null
        : `${window.location.origin}${proverkaHref(resultCode)}`,
    [resultCode],
  );
  const qr = useMemo(() => (link === null ? null : qrSvg(link, T.result.qr)), [link]);

  const wrong = tasks.map((t, i) => ({ t, i })).filter(({ i }) => rights[i] !== true);
  /* Ссылки на разделы — по разу на номер (у №12 — на тип функции). */
  const links = [
    ...new Map(
      wrong.map(({ t }) => {
        const key = t.egeNumber === 12 ? `12:${t.subtype}` : String(t.egeNumber);
        return [key, { no: t.egeNumber, ...sectionLinks(t.egeNumber, t.subtype) }] as const;
      }),
    ).values(),
  ];

  return (
    <div className="vo-result" ref={root} data-testid="vo-result">
      <header className="vo-result__head">
        <h2 className="vo-result__title">{teacher ? T.result.teacherTitle : T.result.title}</h2>
        <p className="vo-result__meta">
          {title} · {T.result.mode[data.mode]} · {T.result.date(dateText(data.date))}
        </p>
      </header>
      {outdated ? <p className="vo-warn">{T.result.outdated}</p> : null}
      {notice === undefined || notice === null ? null : <p className="vo-warn">{notice}</p>}

      {noScore || chast2 === undefined ? null : (
        <Itog2 p1={score.primary} max1={score.max} c2={chast2} seconds={data.seconds} />
      )}

      {noScore || chast2 !== undefined ? null : (
        <div className="vo-score">
          {score.test !== null ? (
            <div className="vo-score__main" data-testid="vo-test">
              <span className="vo-score__label">{T.result.test}</span>
              <span className="vo-score__value">{score.test}</span>
              <span className="vo-tag vo-tag--approx" title={T.result.approxNote}>
                {T.result.approx}
              </span>
            </div>
          ) : null}
          <div className="vo-score__item" data-testid="vo-primary">
            <span className="vo-score__label">{T.result.primary}</span>
            <span className="vo-score__num">
              {score.primary} из {score.max}
            </span>
          </div>
          <div className="vo-score__item">
            <span className="vo-score__label">{T.result.percent}</span>
            <span className="vo-score__num">{score.percent}%</span>
          </div>
          <div className="vo-score__item">
            <span className="vo-score__label">{T.result.time}</span>
            <span className="vo-score__num">{secondsText(data.seconds)}</span>
          </div>
          {score.test !== null ? <p className="vo-score__note">{T.result.approxNote}</p> : null}
        </div>
      )}

      <div className="vo-table-wrap">
        <table className="vo-table">
          <thead>
            <tr>
              <th scope="col">{T.result.cols.no}</th>
              <th scope="col">{teacher ? T.result.cols.theirs : T.result.cols.mine}</th>
              <th scope="col">{T.result.cols.right}</th>
              <th scope="col">{T.result.cols.ok}</th>
              <th scope="col">{T.result.cols.time}</th>
              <th scope="col" className="vo-table__act">
                <span className="sr-only">{T.result.cols.razbor}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const rec = data.tasks[i];
              const mine =
                rec === undefined || rec.answer === '' ? T.result.empty : displayAnswer(rec.answer);
              const ok = rights[i] === true;
              return (
                <Fragment key={`${t.taskId}-${i}`}>
                  <tr className={ok ? 'is-right' : 'is-wrong'}>
                    <th scope="row">
                      <button
                        type="button"
                        className="vo-table__no"
                        aria-expanded={open === i}
                        aria-label={`${T.result.razbor}: №${t.egeNumber}`}
                        onClick={() => setOpen(open === i ? null : i)}
                      >
                        {t.egeNumber}
                      </button>
                    </th>
                    <td>
                      {mine}
                      {rec?.hinted ? <span className="vo-mini">{T.result.hinted}</span> : null}
                      {rec?.fixed ? <span className="vo-mini">{T.result.fixed}</span> : null}
                    </td>
                    <td>{correct[i] ?? '—'}</td>
                    <td className="vo-table__ok" aria-label={ok ? 'верно' : 'неверно'}>
                      {ok ? '✓' : '✗'}
                    </td>
                    <td>{secondsText(rec?.seconds ?? 0)}</td>
                    <td className="vo-table__act">
                      <button
                        type="button"
                        className="vo-link"
                        aria-expanded={open === i}
                        onClick={() => setOpen(open === i ? null : i)}
                      >
                        {T.result.razbor}
                      </button>
                    </td>
                  </tr>
                  {open === i ? (
                    <tr className="vo-table__razbor">
                      <td colSpan={6}>
                        <div
                          className="vo-razbor__task"
                          dangerouslySetInnerHTML={{ __html: t.statement }}
                        />
                        {t.solutionStudent === null ? (
                          <p className="vo-note">{T.run.noRazbor}</p>
                        ) : (
                          <div
                            className="vo-razbor__body"
                            dangerouslySetInnerHTML={{ __html: t.solutionStudent }}
                          />
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {posleTablicy}

      {links.length > 0 ? (
        <section className="vo-links" aria-label={T.result.links}>
          <h3 className="vo-h3">{T.result.links}</h3>
          <ul>
            {links.map((l) => (
              <li key={l.opornye}>
                <span className="vo-links__no">№{l.no}</span>
                <a href={l.opornye}>{T.result.opornye}</a>
                <a href={l.trenazher}>{T.result.trenazher}</a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {actions === undefined ? null : <div className="vo-actions">{actions}</div>}

      {resultCode === null || teacher ? null : (
        <section className="vo-code" aria-label={T.result.codeTitle}>
          <div className="vo-code__text">
            <h3 className="vo-h3">{T.result.codeTitle}</h3>
            <p className="vo-note">{T.result.codeLead}</p>
            <code className="vo-code__value" data-testid="vo-result-code">
              {resultCode}
            </code>
            <button
              type="button"
              className={clsx('vo-link', copied && 'is-done')}
              onClick={() => {
                void navigator.clipboard?.writeText(link ?? resultCode).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              {copied ? T.result.copied : T.result.copy}
            </button>
          </div>
          {qr === null ? null : <div className="vo-qr" dangerouslySetInnerHTML={{ __html: qr }} />}
        </section>
      )}
    </div>
  );
}

/** Итог варианта из двух частей. */
function Itog2({
  p1,
  max1,
  c2,
  seconds,
}: {
  p1: number;
  max1: number;
  c2: NonNullable<WorkResultProps['chast2']>;
  seconds: number;
}) {
  const T2 = CHAST2_TEXT.itog2;
  const gotovo = c2.oceneno === c2.vsego;
  const vsego = p1 + c2.summa;
  const max = max1 + c2.max;
  return (
    <div className="vo-score" data-testid="vo-itog2">
      {gotovo && max === MAX_TOTAL ? (
        <div className="vo-score__main" data-testid="vo-test">
          <span className="vo-score__label">{T.result.test}</span>
          <span className="vo-score__value">{TESTOVYJ_33[vsego] ?? 100}</span>
          <span className="vo-tag vo-tag--approx" title={T2.approx33}>
            {T.result.approx}
          </span>
        </div>
      ) : null}
      <div className="vo-score__item" data-testid="vo-part1">
        <span className="vo-score__label">{T2.part1}</span>
        <span className="vo-score__num">{T2.iz(p1, max1)}</span>
      </div>
      <div className="vo-score__item" data-testid="vo-part2">
        <span className="vo-score__label">{T2.part2}</span>
        <span className="vo-score__num">{gotovo ? T2.iz(c2.summa, c2.max) : T2.naProverke}</span>
      </div>
      <div className="vo-score__item" data-testid="vo-total">
        <span className="vo-score__label">{T2.total}</span>
        <span className="vo-score__num">{gotovo ? T2.iz(vsego, max) : '—'}</span>
      </div>
      <div className="vo-score__item">
        <span className="vo-score__label">{T.result.time}</span>
        <span className="vo-score__num">{secondsText(seconds)}</span>
      </div>
      <p className="vo-score__note">
        {gotovo ? T2.approx33 : T2.naProverkeNote(c2.oceneno, c2.vsego)}
      </p>
    </div>
  );
}
