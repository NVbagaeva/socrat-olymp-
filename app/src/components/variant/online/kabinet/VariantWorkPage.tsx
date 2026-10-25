'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ErrorState } from '@/components/ui';
import { KabinetLoading } from '@/components/kabinet/KabinetGate';
import { kabinetText } from '@/components/kabinet/text';
import { formatDate, useKabinet, useQueryParam } from '@/components/kabinet/useKabinet';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import type { KabinetApi } from '@/lib/kabinet/api';
import { kabinetApi } from '@/lib/kabinet/client';
import type { Me, VariantResult, VariantWorkView } from '@/lib/kabinet/types';
import { downloadXlsx, xlsx } from '@/lib/xlsx';
import { classTable, excelName, excelRows } from '@/lib/variant/online/classResults';
import { kabinetPayload, linkOf, taskOf, withSolutions } from '@/lib/variant/online/kabinetWork';
import { displayAnswer } from '@/lib/variant/online/normalize';
import type { ResultData } from '@/lib/variant/online/resultCode';
import { tasksSignature } from '@/lib/variant/online/work';
import type { VariantTask } from '@/lib/variant/types';
import { heatLevel } from '@/lib/variant/online/stats';
import { WorkResult } from '../WorkResult';
import { WorkRun, kindTitle } from '../WorkRun';
import { secondsText } from '../format';

const T = ONLINE_TEXT.kab;

/** Итог попытки с сервера → данные экрана результатов. */
export function resultDataOf(view: VariantWorkView, r: VariantResult): ResultData {
  return {
    code: view.work.setCode,
    variant: view.work.setVariants[r.variant - 1] ?? r.variant,
    mode: view.work.mode,
    timer: view.work.timer,
    date: (r.finishedAt ?? new Date().toISOString()).slice(0, 10),
    seconds: r.seconds ?? 0,
    tasks: r.tasks.map((t) => ({
      answer: t.answer ?? '',
      seconds: t.seconds,
      hinted: t.hinted,
      fixed: t.right === false && t.secondRight === true,
    })),
  };
}

/** Итог одной попытки: та же таблица, что после «Завершить работу». */
function AttemptResult({
  view,
  result,
  teacher,
  title,
}: {
  view: VariantWorkView;
  result: VariantResult;
  teacher: boolean;
  title: string;
}) {
  const base = useMemo(
    () => (view.tasks[result.variant - 1] ?? []).map(taskOf),
    [view, result.variant],
  );
  const [tasks, setTasks] = useState<VariantTask[]>(base);
  const setVariant = view.work.setVariants[result.variant - 1] ?? result.variant;
  useEffect(() => {
    let alive = true;
    void withSolutions(base, view.work.setCode, setVariant).then((t) => {
      if (alive) setTasks(t);
    });
    return () => {
      alive = false;
    };
  }, [base, view.work.setCode, setVariant]);
  return (
    <WorkResult
      tasks={tasks}
      data={resultDataOf(view, result)}
      rights={result.tasks.map((t) => t.right)}
      correct={result.tasks.map((t) => displayAnswer(t.key))}
      title={title}
      resultCode={null}
      teacher={teacher}
      notice={result.late ? T.late : null}
    />
  );
}

/* ── Репетитор: результаты класса ──────────────────────────────── */

function TutorResults({ view }: { view: VariantWorkView }) {
  const table = classTable(view);
  const [open, setOpen] = useState<string | null>(null);
  const w = view.work;
  return (
    <div className="kab-stack">
      <div className="kab-title-row">
        <h1 className="t-h1">{w.title}</h1>
        <Button
          variant="secondary"
          data-testid="vo-excel"
          onClick={() =>
            downloadXlsx(
              excelName(view),
              xlsx(w.title, excelRows(table), [24, 9, 10, 6, 12, 10, 20]),
            )
          }
        >
          {T.excel}
        </Button>
      </div>
      <p className="t-caption muted">
        {w.className ?? ''} {w.className === null ? '' : '·'} {T.variants(w.variants)} ·{' '}
        {T.mode2[w.mode]} ·{' '}
        {w.dueAt === null
          ? kabinetText.homework.noDue
          : kabinetText.homework.due(formatDate(w.dueAt))}{' '}
        · {T.finished(table.finished, table.total)}
      </p>

      <Card title={T.table}>
        <p className="t-caption muted kab-lead">{T.tableLead}</p>
        <div className="vo-table-wrap">
          <table className="vo-class" data-testid="vo-class">
            <thead>
              <tr>
                <th scope="col">{T.student}</th>
                <th scope="col">{T.score}</th>
                {table.numbers.map((n, i) => (
                  <th scope="col" key={i}>
                    {n}
                  </th>
                ))}
                <th scope="col">{T.time}</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r) => {
                const a = r.attempt;
                return (
                  <Fragment key={r.student.id}>
                    <tr className={clsx(a === null && 'is-empty')}>
                      <th scope="row">
                        <button
                          type="button"
                          className="vo-link vo-class__name"
                          disabled={a === null}
                          aria-expanded={open === r.student.id}
                          onClick={() => setOpen(open === r.student.id ? null : r.student.id)}
                        >
                          {r.student.name}
                        </button>
                        {a !== null && w.variants > 1 ? (
                          <span className="vo-mini">{T.variant(a.variant)}</span>
                        ) : null}
                      </th>
                      <td className="vo-class__score">
                        {a === null ? (
                          <span className="vo-mini">{T.notDone}</span>
                        ) : (
                          <>
                            {a.primary}/{a.max}
                            {r.test !== null ? <span className="vo-mini">{r.test}</span> : null}
                          </>
                        )}
                      </td>
                      {table.numbers.map((_, i) => {
                        const t = a?.tasks[i];
                        return (
                          <td
                            key={i}
                            className={clsx(
                              'vo-class__cell',
                              t === undefined ? 'is-none' : t.right ? 'is-right' : 'is-wrong',
                            )}
                            title={
                              t === undefined
                                ? ''
                                : `${t.answer === null ? '—' : displayAnswer(t.answer)}`
                            }
                          >
                            {t === undefined ? '' : t.right ? '✓' : '✗'}
                          </td>
                        );
                      })}
                      <td>{a?.seconds == null ? '' : secondsText(a.seconds)}</td>
                    </tr>
                    {open === r.student.id && a !== null ? (
                      <tr className="vo-class__open">
                        <td colSpan={table.numbers.length + 3}>
                          <AttemptResult
                            view={view}
                            result={a}
                            teacher
                            title={`${r.student.name} · ${T.variant(a.variant)}`}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{T.average}</th>
                <td>
                  {table.averagePrimary === null ? '' : Math.round(table.averagePrimary * 10) / 10}
                </td>
                {table.average.map((x, i) => (
                  <td
                    key={i}
                    className="vo-class__avg heat__cell"
                    data-l={x === null ? undefined : heatLevel(x)}
                    data-testid={`vo-avg-${i}`}
                  >
                    {x === null ? '' : `${Math.round(x * 100)}%`}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Ученик: варианты работы и решение ─────────────────────────── */

function StudentVariants({ view, me }: { view: VariantWorkView; me: Me }) {
  const w = view.work;
  const [shown, setShown] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, VariantResult>>({});
  return (
    <div className="kab-stack">
      <h1 className="t-h1">{w.title}</h1>
      <p className="t-caption muted">
        {w.tutor.name} · {T.mode2[w.mode]} ·{' '}
        {w.dueAt === null
          ? kabinetText.homework.noDue
          : kabinetText.homework.due(formatDate(w.dueAt))}
      </p>
      <ul className="vo-cards" data-testid="vo-kab-variants">
        {Array.from({ length: w.variants }, (_, i) => i + 1).map((v) => {
          const mine = view.mine.filter((a) => a.variant === v);
          const open = mine.find((a) => a.finishedAt === null);
          const done = mine
            .filter((a) => a.finishedAt !== null)
            .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? ''))[0];
          const status = open !== undefined ? 'run' : done !== undefined ? 'done' : 'none';
          const href = `/kabinet/rabota/?id=${w.id}&v=${v}`;
          return (
            <li key={v} className={clsx('vo-vcard', `is-${status}`)} data-status={status}>
              <p className="vo-vcard__title">{T.variant(v)}</p>
              <p className="vo-vcard__status">
                {status === 'run' ? T.statusRun : status === 'done' ? T.statusDone : T.statusNone}
                {done !== undefined && status !== 'run' ? (
                  <b className="vo-vcard__score">
                    {done.primary} из {done.max}
                  </b>
                ) : null}
              </p>
              <div className="vo-vcard__actions">
                {status === 'done' && done !== undefined ? (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShown(shown === done.id ? null : done.id);
                        if (results[done.id] === undefined) {
                          void kabinetApi()
                            .variantResult(done.id)
                            .then((r) => setResults((x) => ({ ...x, [done.id]: r })));
                        }
                      }}
                    >
                      {shown === done.id ? T.close : T.result}
                    </Button>
                    {w.closedAt === null ? (
                      <Link className="vo-link" href={href}>
                        {T.again}
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <Link
                    className="btn btn--primary btn--sm"
                    href={href}
                    data-testid={`vo-kab-start-${v}`}
                  >
                    {status === 'run' ? T.resume : T.start}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {shown !== null && results[shown] !== undefined ? (
        <AttemptResult
          view={view}
          result={results[shown]}
          teacher={false}
          title={`${me.name} · ${T.variant(results[shown].variant)}`}
        />
      ) : null}
    </div>
  );
}

/** Решение варианта работы: тот же экран, проверка — на сервере. */
function SolveVariant({ view: fresh, variant }: { view: VariantWorkView; variant: number }) {
  /* Работа — та, с которой открыли: кабинет перечитывает данные при каждой
     записи (проверка ответа, завершение), а экрану решения это не нужно. */
  const [view] = useState(fresh);
  const link = linkOf(view, variant);
  const tasks = useMemo(() => (view.tasks[variant - 1] ?? []).map(taskOf), [view, variant]);
  const initial = useMemo(
    () => ({ ...link, tasks, oshibki: null, sig: tasksSignature(tasks) }),
    // link собирается из view и variant
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, variant, tasks],
  );
  const api = kabinetApi();
  const start = useCallback(
    async () => kabinetPayload(view, variant, await api.variantStart(view.work.id, variant)),
    [api, view, variant],
  );
  const kabinet = useMemo(
    () => ({ api, workId: view.work.id, start, backHref: `/kabinet/rabota/?id=${view.work.id}` }),
    [api, view.work.id, start],
  );
  return (
    <div className="vo-kab-solve">
      <p className="t-caption muted">
        <Link href={kabinet.backHref}>← {view.work.title}</Link> ·{' '}
        {kindTitle(view.work.kind, view.work.title)}
      </p>
      <WorkRun link={link} initial={initial} outdated={false} series={false} kabinet={kabinet} />
    </div>
  );
}

export function VariantWorkPage({ me }: { me: Me }) {
  const id = useQueryParam('id');
  const v = Number(useQueryParam('v') ?? '0');
  const loader = useCallback(
    (api: KabinetApi) => (id === null ? Promise.resolve(null) : api.variantWork(id)),
    [id],
  );
  const work = useKabinet(loader);
  if (work.status === 'loading') return <KabinetLoading />;
  if (work.status === 'error')
    return <ErrorState title={kabinetText.loadError} description={work.message} />;
  const view = work.data;
  if (view === null) return <ErrorState title={T.notFound} description="" />;
  if (view.results !== null) return <TutorResults view={view} />;
  if (Number.isInteger(v) && v >= 1 && v <= view.work.variants) {
    return <SolveVariant view={view} variant={v} />;
  }
  return <StudentVariants view={view} me={me} />;
}

/** Бейдж «сдали N из M» для списков кабинета. */
export function FinishedBadge({ finished, recipients }: { finished: number; recipients: number }) {
  return (
    <Badge tone={finished === recipients && recipients > 0 ? 'success' : 'neutral'}>
      {T.finished(finished, recipients)}
    </Badge>
  );
}
