'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, FieldMessage } from '@/components/ui';
import { KabinetLoading } from '@/components/kabinet/KabinetGate';
import { errorText } from '@/components/kabinet/useKabinet';
import type { Me } from '@/lib/kabinet/types';
import type { RabotyApi } from '@/lib/raboty/api';
import { rabotyApi } from '@/lib/raboty/client';
import { statistikaZadaniy, tablitsaExcel } from '@/lib/raboty/otchet';
import type { CheckRow, IssuedWork, Notice, StudentWork, SubStatus } from '@/lib/raboty/types';
import { XLSX_MIME, xlsx } from '@/lib/raboty/xlsx';
import { rabotaHref } from '@/lib/variant/online/link';
import { rabotyText as T, STATUS_TEXT } from './text';
import { kogda, skachat, useRaboty } from './useRaboty';
import '@/components/variant/online/online.css';
import '@/components/chast2/chast2.css';
import './raboty.css';

export const RABOTY_HREF = '/kabinet/raboty/';
export const PROVERKA_HREF = (id: string) => `/kabinet/proverka/?id=${encodeURIComponent(id)}`;
export const VYDAT_HREF = '/kabinet/vydat-variant/';

type Filter = 'wait' | 'returned' | 'checked' | 'all';
const WAIT: readonly SubStatus[] = ['submitted', 'checking'];

/** Число работ, ждущих проверки, — для счётчика в кабинете. */
export function zhdut(rows: readonly CheckRow[]): number {
  return rows.filter((r) => WAIT.includes(r.status)).length;
}

export function RabotyPage({ me }: { me: Me }) {
  return me.role === 'tutor' ? <RabotyUchitelya /> : <RabotyUchenika />;
}

/* ── Учитель ────────────────────────────────────────────────────── */

const loadTutor = (api: RabotyApi) =>
  Promise.all([api.checkList(), api.issuedWorks(), api.notices()]);

function RabotyUchitelya() {
  const data = useRaboty(loadTutor);
  const [filter, setFilter] = useState<Filter>('wait');
  const [work, setWork] = useState('');
  const [student, setStudent] = useState('');

  if (data.status === 'loading') return <KabinetLoading />;
  if (data.status === 'error') return <ErrorState title={T.title} description={data.message} />;
  const [rows, issued, notices] = data.data;
  const shown = rows.filter(
    (r) =>
      (filter === 'all' || (filter === 'wait' && WAIT.includes(r.status)) || r.status === filter) &&
      (work === '' || r.workId === work) &&
      (student === '' || r.student.id === student),
  );
  const students = [...new Map(rows.map((r) => [r.student.id, r.student])).values()];
  const n = zhdut(rows);

  return (
    <div className="kab-stack rab">
      <div className="kab-title-row">
        <h1 className="t-h1">{T.title}</h1>
        <Link className="btn btn--primary" href={VYDAT_HREF} data-testid="rab-issue">
          {T.issue}
        </Link>
      </div>
      <p className="t-body muted">{T.lead}</p>
      <Notices list={notices} />

      <Card
        title={
          <span>
            {T.toCheck}{' '}
            <Badge tone={n > 0 ? 'warning' : 'neutral'} data-testid="rab-counter">
              {T.counter(n)}
            </Badge>
          </span>
        }
      >
        <div className="rab-filters" role="group" aria-label={T.filters.label}>
          {(['wait', 'returned', 'checked', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`rab-chip${filter === f ? ' is-on' : ''}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              data-testid={`rab-filter-${f}`}
            >
              {T.filters[f]}
            </button>
          ))}
          <label className="rab-select">
            <span className="sr-only">{T.filters.work}</span>
            <select value={work} onChange={(e) => setWork(e.target.value)}>
              <option value="">{T.filters.allWorks}</option>
              {issued.map((w) => (
                <option key={w.work.id} value={w.work.id}>
                  {w.work.title}
                </option>
              ))}
            </select>
          </label>
          <label className="rab-select">
            <span className="sr-only">{T.filters.student}</span>
            <select value={student} onChange={(e) => setStudent(e.target.value)}>
              <option value="">{T.filters.allStudents}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {shown.length === 0 ? (
          <p className="t-caption muted">{rows.length === 0 ? T.empty : T.emptyFilter}</p>
        ) : (
          <div className="vo-table-wrap">
            <table className="vo-table rab-table" data-testid="rab-list">
              <thead>
                <tr>
                  {T.head.map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.submissionId}>
                    <th scope="row">{r.student.name}</th>
                    <td>
                      {r.title}
                      <span className="vo-mini">
                        {r.code} · {r.versiya}
                      </span>
                    </td>
                    <td>
                      {kogda(r.submittedAt)}
                      {r.late ? <span className="vo-mini rab-late">{T.late}</span> : null}
                    </td>
                    <td>
                      <span className={`c2-status is-${r.status}`}>{STATUS_TEXT[r.status]}</span>
                    </td>
                    <td>
                      {r.status === 'checked'
                        ? `${r.score.total} / 33`
                        : `${r.score.part1} / 13 + часть 2`}
                      {r.score.test === null ? null : (
                        <span className="vo-mini">{r.score.test}</span>
                      )}
                    </td>
                    <td>
                      <Link
                        className={WAIT.includes(r.status) ? 'btn btn--primary btn--sm' : 'vo-link'}
                        href={PROVERKA_HREF(r.submissionId)}
                        data-testid="rab-open"
                      >
                        {WAIT.includes(r.status) ? T.open : T.view}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <section className="kab-stack--tight" aria-label={T.issued}>
        <h2 className="t-h3">{T.issued}</h2>
        {issued.length === 0 ? <p className="t-caption muted">{T.noIssued}</p> : null}
        {issued.map((w) => (
          <IssuedCard key={w.work.id} w={w} />
        ))}
      </section>
    </div>
  );
}

function IssuedCard({ w }: { w: IssuedWork }) {
  const [stats, setStats] = useState(false);
  const [extend, setExtend] = useState(false);
  const [until, setUntil] = useState('');
  const [who, setWho] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const loader = useCallback((api: RabotyApi) => api.workReport(w.work.id), [w.work.id]);
  const report = useRaboty(loader);
  const st = useMemo(
    () =>
      report.status === 'ready' && report.data !== null ? statistikaZadaniy(report.data) : null,
    [report],
  );

  const excel = () => {
    if (report.status !== 'ready' || report.data === null) return;
    const file = xlsx(w.work.title, tablitsaExcel(report.data), 2);
    skachat(`${w.work.title.replace(/[^\p{L}\p{N} .-]+/gu, '_')}.xlsx`, file, XLSX_MIME);
  };
  const prodlit = async () => {
    setProblem(null);
    try {
      await rabotyApi().extendWork(
        w.work.id,
        new Date(until).toISOString(),
        who === '' ? null : who,
      );
      setExtend(false);
    } catch (e) {
      setProblem(errorText(e));
    }
  };

  return (
    <Card title={w.work.title}>
      <p className="t-caption muted">
        {w.work.code} · {w.work.versiya} · {T.part2Mode[w.work.part2Mode]} ·{' '}
        {w.work.dueAt === null ? T.noDeadline : T.deadline(kogda(w.work.dueAt))} ·{' '}
        {T.recipients(w.recipients.length)}
      </p>
      <ul className="kab-list">
        {w.recipients.map((r) => (
          <li key={r.student.id} className="kab-list__row">
            <span className="kab-strong">{r.student.name}</span>
            <span className={`c2-status is-${r.status}`}>{STATUS_TEXT[r.status]}</span>
            <span className="t-caption muted">
              {r.deadline === null ? T.noDeadline : T.deadline(kogda(r.deadline))}
            </span>
            {r.submissionId !== null && r.status !== 'draft' ? (
              <Link className="vo-link" href={PROVERKA_HREF(r.submissionId)}>
                {T.view}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="kab-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setStats((x) => !x)}
          aria-expanded={stats}
        >
          {T.stats}
        </Button>
        <Button variant="ghost" size="sm" onClick={excel} data-testid="rab-excel">
          {T.excel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExtend((x) => !x)}
          aria-expanded={extend}
        >
          {T.extend}
        </Button>
      </div>
      {extend ? (
        <div className="rab-extend">
          <input
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            aria-label={T.extend}
          />
          <select
            value={who}
            onChange={(e) => setWho(e.target.value)}
            aria-label={T.filters.student}
          >
            <option value="">{T.extendAll}</option>
            {w.recipients.map((r) => (
              <option key={r.student.id} value={r.student.id}>
                {r.student.name}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={until === ''} onClick={() => void prodlit()}>
            {T.extendSave}
          </Button>
        </div>
      ) : null}
      {problem === null ? null : <FieldMessage tone="error">{problem}</FieldMessage>}
      {stats && st !== null ? (
        <div className="vo-table-wrap">
          <table className="vo-table rab-stat" data-testid="rab-stat">
            <thead>
              <tr>
                {T.statHead.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {st.map((s) => (
                <tr key={s.no}>
                  <th scope="row">{s.no}</th>
                  <td>
                    {s.sredniy === null
                      ? '—'
                      : s.sredniy.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}{' '}
                    / {s.max}
                  </td>
                  <td>
                    <span
                      className="rab-bar"
                      style={{ ['--p' as string]: `${(s.polnyh ?? 0) * 100}%` }}
                    >
                      {s.polnyh === null ? '—' : `${Math.round(s.polnyh * 100)}%`}
                    </span>
                  </td>
                  <td>{s.nuley === null ? '—' : `${Math.round(s.nuley * 100)}%`}</td>
                  <td>{s.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="t-caption muted">{T.statNote}</p>
        </div>
      ) : null}
    </Card>
  );
}

function Notices({ list }: { list: readonly Notice[] }) {
  const unread = list.filter((n) => n.readAt === null);
  if (unread.length === 0) return null;
  return (
    <Card title={T.notices}>
      <ul className="kab-list" data-testid="rab-notices">
        {unread.slice(0, 8).map((n) => (
          <li key={n.id} className="kab-list__row">
            <span>{T.notice[n.kind](n.payload)}</span>
            <span className="t-caption muted">{kogda(n.createdAt)}</span>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={() => void rabotyApi().readNotices()}>
        {T.readAll}
      </Button>
    </Card>
  );
}

/* ── Ученик ─────────────────────────────────────────────────────── */

const loadStudent = (api: RabotyApi) => Promise.all([api.myWorks(), api.notices()]);

function RabotyUchenika() {
  const data = useRaboty(loadStudent);
  if (data.status === 'loading') return <KabinetLoading />;
  if (data.status === 'error') return <ErrorState title={T.mine} description={data.message} />;
  const [works, notices] = data.data;
  return (
    <div className="kab-stack rab">
      <h1 className="t-h1">{T.mine}</h1>
      <Notices list={notices} />
      {works.length === 0 ? (
        <EmptyState title={T.mineEmpty} description="" />
      ) : (
        <ul className="kab-list" data-testid="rab-mine">
          {works.map((sw) => (
            <MoyaRabota key={sw.work.id} sw={sw} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MoyaRabota({ sw }: { sw: StudentWork }) {
  const status = sw.submission?.status ?? 'none';
  const href = rabotaHref(sw.work.code, sw.work.versiya, sw.work.id);
  const label =
    status === 'none'
      ? T.solve
      : status === 'draft'
        ? T.continue
        : status === 'returned'
          ? T.dorabotat
          : T.result;
  return (
    <li className="kab-list__row rab-mine">
      <span className="kab-strong">{sw.work.title}</span>
      <span className={`c2-status is-${status}`}>{STATUS_TEXT[status]}</span>
      <span className="t-caption muted">
        {sw.deadline === null ? T.noDeadline : T.deadline(kogda(sw.deadline))}
        {sw.score === null
          ? ''
          : ` · ${sw.score.part1}${status === 'checked' ? ` + ${sw.score.part2} = ${sw.score.total} / 33` : ' / 13'}`}
      </span>
      <a className="btn btn--primary btn--sm" href={href} data-testid="rab-mine-open">
        {label}
      </a>
    </li>
  );
}
