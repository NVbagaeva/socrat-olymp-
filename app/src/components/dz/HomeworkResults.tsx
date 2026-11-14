'use client';

/**
 * Результаты ДЗ для репетитора: таблица «ученик × задача» (верно /
 * неверно / не решал, попытки, время), сводка по типам, по клику на
 * клетку — что вводил ученик, верный ответ и решение. Здесь же
 * комментарии к заданию и к задачам, печать и работа над ошибками.
 */

import Link from 'next/link';
import { clsx } from 'clsx';
import { useId, useMemo, useState } from 'react';
import { Button, Card, Checkbox, FieldLabel, FieldMessage } from '@/components/ui';
import { Razbor8 } from '@/components/tasks/vychisleniya/Razbor8';
import type { Names8 } from '@/components/tasks/vychisleniya/Progress8';
import { DZ, SOLUTIONS_WHEN, dueRu, dzError } from '@/content/dz';
import type { HwFull } from '@/lib/dz/api';
import { DZ_HREF, issueHref, printHref } from '@/lib/dz/links';
import { byKind, mistakesPlan, table, type Cell, type CellMark, type Row } from '@/lib/dz/results';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import { displayAnswer } from '@/lib/otvet';
import { cleanRazbor } from './HomeworkSolve';
import { dzApi, errorCode } from './common';

const t = DZ.results;

const LEGEND: { mark: CellMark; label: string }[] = [
  { mark: 'right', label: t.legendRight },
  { mark: 'wrong', label: t.legendWrong },
  { mark: 'revealed', label: t.legendRevealed },
  { mark: 'trying', label: t.legendTrying },
  { mark: 'none', label: t.legendNone },
];

function minutes(seconds: number): string {
  if (seconds < 60) return `${seconds} с`;
  const m = Math.round(seconds / 60);
  return `${m} мин`;
}

export function HomeworkResults({
  full,
  names,
  reload,
}: {
  full: HwFull;
  names: Names8;
  reload: () => Promise<void>;
}) {
  const hw = full.hw;
  const rows = useMemo(() => table(full.tasks, full.recipients, full.answers), [full]);
  const kinds = useMemo(() => byKind(rows), [rows]);
  const plan = useMemo(() => mistakesPlan(rows), [rows]);
  const [open, setOpen] = useState<{ row: Row; cell: Cell } | null>(null);
  const [grid, setGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const width = Math.max(0, ...rows.map((r) => r.cells.length));
  const submitted = rows.filter((r) => r.student.submittedAt !== null).length;

  async function act(run: () => Promise<unknown>) {
    setError(null);
    try {
      await run();
      await reload();
    } catch (e) {
      setError(dzError(errorCode(e)));
    }
  }

  return (
    <div className="dz-page dz-results" data-page="domashka-repetitor">
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {t.back}
      </Link>
      <header className="dz-head">
        <h1 className="dz-head__title">{hw.title}</h1>
        <p className="dz-head__due">
          {hw.dueAt === null ? DZ.list.noDue : DZ.list.due(dueRu(hw.dueAt))} ·{' '}
          {submitted === 0 ? DZ.list.nobodySubmitted : DZ.list.submitted(submitted, rows.length)}
        </p>
        <p className="auth-form__muted">
          {t.settings(
            hw.attemptsLimit === null ? DZ.issue.attemptsOptions.null! : String(hw.attemptsLimit),
            SOLUTIONS_WHEN[hw.solutionsWhen],
          )}
        </p>
      </header>

      <NoteEditor
        label={t.note}
        value={hw.note}
        onSave={(note) => act(async () => (await dzApi()).updateHomework(hw.id, { note }))}
        section="note"
      />

      <Card className="kabinet__card" title={t.table} data-section="table">
        {rows.length === 0 ? (
          <p className="auth-form__text">{t.nobody}</p>
        ) : (
          <div className="dz-table-wrap">
            <table className="dz-table">
              <thead>
                <tr>
                  <th scope="col">{t.student}</th>
                  {Array.from({ length: width }, (_, i) => (
                    <th key={i} scope="col">
                      {i + 1}
                    </th>
                  ))}
                  <th scope="col">{t.total}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.student.userId} data-student={row.student.userId}>
                    <th scope="row" className="dz-table__name">
                      {row.student.name}
                      {row.student.submittedAt === null ? null : (
                        <span className="dz-table__done">{DZ.status.submitted}</span>
                      )}
                    </th>
                    {Array.from({ length: width }, (_, i) => {
                      const cell = row.cells[i];
                      if (cell === undefined) return <td key={i} />;
                      return (
                        <td key={i}>
                          <button
                            type="button"
                            className={clsx('dz-cell', `dz-cell--${cell.mark}`)}
                            data-mark={cell.mark}
                            aria-label={`${row.student.name}, ${t.cell.toLowerCase()} ${i + 1}: ${LEGEND.find((l) => l.mark === cell.mark)?.label}`}
                            onClick={() => setOpen({ row, cell })}
                          >
                            {cell.answer === null || cell.answer.attempts === 0
                              ? ''
                              : cell.answer.attempts}
                          </button>
                        </td>
                      );
                    })}
                    <td className="dz-table__total">
                      {row.right}/{row.total}
                      <span className="dz-table__time">{minutes(row.seconds)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <ul className="dz-legend">
          {LEGEND.map((l) => (
            <li key={l.mark}>
              <span
                className={clsx('dz-cell', 'dz-cell--legend', `dz-cell--${l.mark}`)}
                aria-hidden="true"
              />
              {l.label}
            </li>
          ))}
        </ul>
        <p className="auth-form__muted">{t.cellHint}</p>
      </Card>

      {open === null ? null : (
        <CellDetails
          key={`${open.row.student.userId}-${open.cell.task.id}`}
          full={full}
          names={names}
          row={open.row}
          cell={open.cell}
          onClose={() => setOpen(null)}
          onComment={(comment) =>
            act(async () => (await dzApi()).updateTaskComment(open.cell.task.id, comment))
          }
        />
      )}

      <Card className="kabinet__card" title={t.byKind} data-section="kinds">
        <ul className="dz-kinds-summary">
          {kinds.map((k) => (
            <li key={k.kind} data-kind={k.kind} className={k.erred > 0 ? 'has-errors' : undefined}>
              <span dangerouslySetInnerHTML={{ __html: names[k.kind] ?? k.kind }} /> —{' '}
              {t.kindLine(k.erred, k.assigned)}
            </li>
          ))}
        </ul>
        {plan.length === 0 ? (
          <p className="auth-form__muted">{t.mistakesNone}</p>
        ) : (
          <Link
            className="btn btn--primary"
            href={issueHref({ origin: 'oshibki', mistakesOf: hw.id })}
          >
            {t.mistakes}
          </Link>
        )}
      </Card>

      <Card className="kabinet__card" title={t.print} data-section="print">
        <Checkbox checked={grid} onChange={(e) => setGrid(e.target.checked)}>
          {t.grid}
        </Checkbox>
        <div className="dz-actions">
          <a
            className="btn btn--secondary"
            href={printHref(hw.id, 'uchenik', grid)}
            target="_blank"
            rel="noreferrer"
          >
            {t.printStudent}
          </a>
          <a
            className="btn btn--secondary"
            href={printHref(hw.id, 'uchitel', grid)}
            target="_blank"
            rel="noreferrer"
          >
            {t.printTeacher}
          </a>
        </div>
      </Card>

      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
      <div className="dz-actions dz-actions--end">
        {hw.closedAt === null ? (
          <Button
            variant="ghost"
            onClick={() =>
              void act(async () => (await dzApi()).updateHomework(hw.id, { closed: true }))
            }
          >
            {t.close}
          </Button>
        ) : (
          <>
            <span className="auth-form__muted">{t.closed}</span>
            <Button
              variant="ghost"
              onClick={() =>
                void act(async () => (await dzApi()).updateHomework(hw.id, { closed: false }))
              }
            >
              {t.reopen}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CellDetails({
  full,
  names,
  row,
  cell,
  onClose,
  onComment,
}: {
  full: HwFull;
  names: Names8;
  row: Row;
  cell: Cell;
  onClose: () => void;
  onComment: (comment: string) => Promise<void>;
}) {
  const key = full.keys.get(cell.task.id);
  const answer = cell.answer;
  return (
    <Card
      className="kabinet__card dz-detail"
      data-section="cell"
      title={`${row.student.name} · ${t.cell} ${row.cells.indexOf(cell) + 1}`}
      action={
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t.closeCell}
        </Button>
      }
    >
      <p
        className="dz-task__no"
        dangerouslySetInnerHTML={{ __html: names[cell.task.kind] ?? cell.task.kind }}
      />
      <div
        className="dz-task__q"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(cell.task.questionHtml) }}
      />
      <dl className="dz-facts">
        <div>
          <dt>{t.entered}</dt>
          <dd data-field="entered">
            {answer === null || answer.entries.length === 0
              ? t.noEntries
              : answer.entries.map((e, i) => (
                  <span key={i} className={clsx('dz-entry', e.ok ? 'is-right' : 'is-wrong')}>
                    {e.a}
                  </span>
                ))}
          </dd>
        </div>
        <div>
          <dt>{t.attemptsTitle}</dt>
          <dd>{t.attempts(answer?.attempts ?? 0)}</dd>
        </div>
        <div>
          <dt>{t.time}</dt>
          <dd>{minutes(answer?.seconds ?? 0)}</dd>
        </div>
        {key === undefined ? null : (
          <>
            <div>
              <dt>{t.correct}</dt>
              <dd data-field="correct">{displayAnswer(key.answer)}</dd>
            </div>
            <div>
              <dt>{t.source}</dt>
              <dd>{key.source}</dd>
            </div>
          </>
        )}
      </dl>
      {key === undefined ? null : <Razbor8 razbor={cleanRazbor(key.razbor)} title={t.solution} />}
      <NoteEditor
        label={t.comment}
        hint={t.commentHint}
        value={cell.task.comment ?? ''}
        onSave={onComment}
        section="task-comment"
      />
    </Card>
  );
}

function NoteEditor({
  label,
  hint,
  value,
  onSave,
  section,
}: {
  label: string;
  hint?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  section: string;
}) {
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(false);
  const id = useId();
  return (
    <form
      className="dz-note-editor"
      data-section={section}
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(false);
        void onSave(text).then(() => setSaved(true));
      }}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        className="input dz-textarea"
        value={text}
        maxLength={section === 'note' ? 2000 : 1000}
        rows={2}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
      />
      {hint === undefined ? null : <p className="auth-form__muted">{hint}</p>}
      <div className="dz-actions">
        <Button type="submit" size="sm" variant="secondary">
          {t.save}
        </Button>
        {saved ? <span className="dz-ok">{t.saved}</span> : null}
      </div>
    </form>
  );
}
