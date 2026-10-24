'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, ErrorState, FieldMessage } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { Reshenie, Uslovie } from '@/components/chast2/Chast2Card';
import { Kriterii } from '@/components/chast2/Kriterii';
import { KabinetLoading } from '@/components/kabinet/KabinetGate';
import { errorText, useQueryParam } from '@/components/kabinet/useKabinet';
import { MAX_BALL, PART2_NUMBERS, type Part2No } from '@/content/variantOnline/bally';
import { kriteriiZadaniya } from '@/content/variantOnline/kriterii';
import { readVvod, vvodTex } from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import type { RabotyApi } from '@/lib/raboty/api';
import { rabotyApi } from '@/lib/raboty/client';
import type { CheckWork, Grade } from '@/lib/raboty/types';
import { displayAnswer } from '@/lib/variant/online/normalize';
import { testScore } from '@/lib/variant/online/proverka';
import { buildWork, type WorkPayload } from '@/lib/variant/online/sessionUi';
import { FotoProverka } from './FotoProverka';
import { RABOTY_HREF } from './RabotyPage';
import { proverkaText as T, STATUS_TEXT } from './text';
import { kogda, useRaboty } from './useRaboty';
import './raboty.css';

type Tab = 'part1' | Part2No;

/**
 * Проверка работы учителем: слева фото решения (масштаб, поворот, во
 * весь экран, пометки), справа — ответ ученика с автопроверкой, эталон и
 * баллы по критериям. На телефоне — одно под другим. Наверху — живой
 * счётчик баллов; «Завершить проверку» — только когда оценены все 14–20.
 */
export function ProverkaRaboty() {
  const id = useQueryParam('id');
  const loader = useCallback(
    (api: RabotyApi) => (id === null ? Promise.resolve(null) : api.checkWork(id)),
    [id],
  );
  const data = useRaboty(loader);
  const [payload, setPayload] = useState<WorkPayload | null>(null);
  const [tab, setTab] = useState<Tab>(14);
  const [problem, setProblem] = useState<string | null>(null);
  const [general, setGeneral] = useState<string | null>(null);
  const cw = data.status === 'ready' ? data.data : null;
  const code = cw?.work.code;
  const versiya = cw?.work.versiya;

  useEffect(() => {
    if (code === undefined || versiya === undefined) return undefined;
    let alive = true;
    void buildWork(
      { code, variant: versiya, mode: 'kontrol', timer: { kind: 'none' }, kind: 'ege', title: '' },
      null,
    ).then((p) => alive && setPayload(p));
    return () => {
      alive = false;
    };
  }, [code, versiya]);

  if (data.status === 'loading') return <KabinetLoading />;
  if (data.status === 'error') return <ErrorState title={T.notFound} description={data.message} />;
  if (cw === null) {
    return (
      <EmptyState
        title={T.notFound}
        description=""
        action={
          <Link className="btn btn--primary" href={RABOTY_HREF}>
            {T.back}
          </Link>
        }
      />
    );
  }
  if (payload === null) return <KabinetLoading />;

  const api = rabotyApi();
  const sub = cw.submission;
  const checking = sub.status === 'checking';
  const grade = (no: number) => cw.grades.find((g) => g.taskNo === no);
  const p1 = cw.grades.filter((g) => g.taskNo <= 13).reduce((s, g) => s + g.ball, 0);
  const p2 = cw.grades
    .filter((g) => g.taskNo >= 14 && !g.naDorabotke)
    .reduce((s, g) => s + g.ball, 0);
  const left = PART2_NUMBERS.filter((no) => {
    const g = grade(no);
    return g === undefined || g.naDorabotke;
  });
  const act = (fn: () => Promise<unknown>) => {
    setProblem(null);
    fn().catch((e: unknown) => setProblem(errorText(e)));
  };
  const part2 = payload.part2 ?? [];
  const z = tab === 'part1' ? null : (part2.find((x) => x.no === tab) ?? null);

  return (
    <div className="kab-stack rab-check" data-testid="rab-check">
      <Link className="vo-link" href={RABOTY_HREF}>
        ← {T.back}
      </Link>
      <header className="rab-check__head">
        <h1 className="t-h2">
          {cw.student.name} · {cw.work.title}{' '}
          <span className={`c2-status is-${sub.status}`} data-testid="rab-check-status">
            {STATUS_TEXT[sub.status]}
          </span>
        </h1>
        <p className="t-caption muted">
          {cw.work.code} · {cw.work.versiya} · {kogda(sub.submittedAt)}
        </p>
      </header>
      <p className="c2-counter rab-counter" aria-live="polite" data-testid="rab-check-counter">
        {T.counter(p1, p2, p1 + p2, testScore(p1 + p2))}{' '}
        <span className="vo-tag vo-tag--approx">{T.approx}</span>
      </p>

      <div className="kab-actions">
        {sub.status === 'submitted' ? (
          <Button onClick={() => act(() => api.startCheck(sub.id))} data-testid="rab-start">
            {T.start}
          </Button>
        ) : null}
        {sub.status === 'checked' ? (
          <Button
            variant="secondary"
            onClick={() => act(() => api.startCheck(sub.id))}
            data-testid="rab-reopen"
          >
            {T.reopen}
          </Button>
        ) : null}
        {sub.status === 'returned' ? <p className="vo-note">{T.waitingRework}</p> : null}
        {!checking ? <p className="vo-note">{T.readonly}</p> : null}
      </div>
      {problem === null ? null : <FieldMessage tone="error">{problem}</FieldMessage>}

      <nav className="rab-tabs" aria-label="Задания">
        <button
          type="button"
          className={clsx('rab-tab', tab === 'part1' && 'is-current')}
          aria-current={tab === 'part1' ? 'page' : undefined}
          onClick={() => setTab('part1')}
          data-testid="rab-tab-part1"
        >
          {T.part1} · {p1}
        </button>
        {PART2_NUMBERS.map((no) => {
          const g = grade(no);
          const st = g === undefined ? 'none' : g.naDorabotke ? 'returned' : 'graded';
          return (
            <button
              key={no}
              type="button"
              className={clsx('rab-tab', `is-${st}`, tab === no && 'is-current')}
              aria-current={tab === no ? 'page' : undefined}
              aria-label={`№${no}: ${T.states[st]}`}
              onClick={() => setTab(no)}
              data-testid={`rab-tab-${no}`}
            >
              {no}
              <span className="rab-tab__b">
                {g === undefined || g.naDorabotke ? '·' : `${g.ball}/${MAX_BALL[no]}`}
              </span>
            </button>
          );
        })}
      </nav>

      {tab === 'part1' ? (
        <Part1 cw={cw} payload={payload} checking={checking} act={act} />
      ) : z === null ? null : (
        <Zadanie key={z.no} cw={cw} z={z} g={grade(z.no)} checking={checking} act={act} />
      )}

      <section className="rab-finish">
        <label className="rab-field">
          <span>{T.general}</span>
          <textarea
            rows={2}
            maxLength={4000}
            value={general ?? sub.comment ?? ''}
            onChange={(e) => setGeneral(e.target.value)}
            disabled={!checking}
            data-testid="rab-general"
          />
        </label>
        {checking ? (
          <>
            {left.length > 0 ? (
              <p className="vo-note">{T.finishLeft(left.map((n) => `№${n}`).join(', '))}</p>
            ) : null}
            <Button
              disabled={left.length > 0}
              onClick={() => act(() => api.finishCheck(sub.id, general))}
              data-testid="rab-finish"
            >
              {T.finish}
            </Button>
          </>
        ) : sub.status === 'checked' ? (
          <p className="vo-note" data-testid="rab-finished">
            {T.finished}
          </p>
        ) : null}
      </section>

      <details className="rab-history">
        <summary>{T.history}</summary>
        <ul data-testid="rab-history">
          {cw.history.map((h, i) => (
            <li key={i}>
              {T.historyRow(h.by, kogda(h.at), h.taskNo, h.oldBall, h.newBall)} ·{' '}
              <span className="muted">{T.reason[h.reason]}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/* ── Часть 1 ────────────────────────────────────────────────────── */

function Part1({
  cw,
  payload,
  checking,
  act,
}: {
  cw: CheckWork;
  payload: WorkPayload;
  checking: boolean;
  act: (fn: () => Promise<unknown>) => void;
}) {
  const api = rabotyApi();
  const [why, setWhy] = useState('');
  return (
    <section className="rab-part1" data-testid="rab-part1">
      <div className="vo-table-wrap">
        <table className="vo-table">
          <thead>
            <tr>
              {T.part1Head.map((h, i) => (
                <th key={i} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payload.tasks.map((t) => {
              const a = cw.answers.find((x) => x.taskNo === t.egeNumber && x.punkt === '');
              const g = cw.grades.find((x) => x.taskNo === t.egeNumber);
              const ok = (g?.ball ?? 0) > 0;
              return (
                <tr key={t.taskId} className={ok ? 'is-right' : 'is-wrong'}>
                  <th scope="row">{t.egeNumber}</th>
                  <td>
                    {typeof a?.vvod === 'string' && a.vvod !== '' ? displayAnswer(a.vvod) : '—'}
                  </td>
                  <td>{displayAnswer(t.answer)}</td>
                  <td>
                    {g?.ball ?? 0}
                    {g?.vruchnuyu ? <span className="vo-mini">{T.manual}</span> : null}
                  </td>
                  <td>
                    {checking ? (
                      <button
                        type="button"
                        className="c2-mini"
                        onClick={() =>
                          act(() =>
                            api.overridePart1(cw.submission.id, t.egeNumber, !ok, why || null),
                          )
                        }
                        data-testid={`rab-p1-${t.egeNumber}`}
                      >
                        {ok ? T.snyat : T.zaschitat}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {checking ? (
        <label className="rab-field">
          <span>{T.overrideComment}</span>
          <input value={why} onChange={(e) => setWhy(e.target.value)} maxLength={300} />
        </label>
      ) : null}
    </section>
  );
}

/* ── Задание 14–20 ──────────────────────────────────────────────── */

function Zadanie({
  cw,
  z,
  g,
  checking,
  act,
}: {
  cw: CheckWork;
  z: Chast2Zadacha;
  g: Grade | undefined;
  checking: boolean;
  act: (fn: () => Promise<unknown>) => void;
}) {
  const api = rabotyApi();
  const [comment, setComment] = useState(g?.comment ?? '');
  const [usl, setUsl] = useState(false);
  const [resh, setResh] = useState(false);
  const photos = cw.photos.filter((p) => p.taskNo === z.no);
  const kriterii = kriteriiZadaniya(z.no, z.utochnenie);
  const stroka =
    g === undefined || g.kriteriy === null
      ? undefined
      : `${kriterii[g.kriteriy]?.ball ?? g.ball}:${g.ili ?? 0}`;
  const postavit = (ball: number, row: string | null) => {
    const ili = row === null ? null : Number(row.split(':')[1]);
    const kr = kriterii.findIndex((k) => k.ball === ball);
    act(() =>
      api.setGrade(
        cw.submission.id,
        z.no,
        ball,
        row === null || kr < 0 ? null : kr,
        ili,
        comment || null,
      ),
    );
  };

  return (
    <section className="rab-zad" data-testid={`rab-zad-${z.no}`}>
      <div className="rab-zad__foto">
        {photos.length === 0 ? (
          <p className="vo-warn">{T.noPhotos}</p>
        ) : (
          <FotoProverka
            key={z.no}
            api={api}
            photos={photos}
            marks={cw.marks}
            editable={checking}
            testId={`rab-foto-${z.no}`}
          />
        )}
      </div>
      <div className="rab-zad__side">
        <div className="rab-block">
          <button
            type="button"
            className="vo-link"
            onClick={() => setUsl(!usl)}
            aria-expanded={usl}
          >
            {T.uslovie}: {usl ? T.hide : T.show}
          </button>
          {usl ? <Uslovie text={z.uslovie} /> : null}
        </div>
        <div className="rab-block">
          <h3 className="c2-h">{T.answer}</h3>
          {z.punkty.map((p, i) => {
            if (p.pole === null) return null;
            const a = cw.answers.find((x) => x.taskNo === z.no && x.punkt === String(i));
            const tex = a === undefined ? '' : vvodTex(p.pole, readVvod(a.vvod));
            return (
              <p key={i} className="rab-otvet" data-testid={`rab-otvet-${z.no}-${i}`}>
                {p.bukva === null ? '' : `${p.bukva}) `}
                {tex === '' ? (
                  <span className="muted">{T.noAnswer}</span>
                ) : (
                  <Tex text={`$${tex}$`} />
                )}
                {a?.auto ? (
                  <span className={`c2-sverka is-${a.auto}`}> · {T.auto[a.auto]}</span>
                ) : null}
              </p>
            );
          })}
          <p className="rab-otvet">
            <b>{T.verno}:</b> <Tex text={z.otvet} krupno />
          </p>
          <button
            type="button"
            className="vo-link"
            onClick={() => setResh(!resh)}
            aria-expanded={resh}
          >
            {T.reshenie}: {resh ? T.hide : T.show}
          </button>
          {resh ? <Reshenie z={z} /> : null}
        </div>
        <div className="rab-block">
          <h3 className="c2-h">{T.kriterii}</h3>
          {g?.nePristupal ? <p className="vo-note">{T.nePristupal}</p> : null}
          <Kriterii
            kriterii={kriterii}
            max={MAX_BALL[z.no]}
            ball={g === undefined || g.naDorabotke ? undefined : g.ball}
            stroka={stroka}
            onPick={postavit}
            readOnly={!checking}
            testId={`rab-krit-${z.no}`}
            itog={T.ocenka}
          />
          <label className="rab-field">
            <span>{T.comment}</span>
            <textarea
              rows={2}
              maxLength={2000}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onBlur={() => {
                /* Комментарий к уже оценённому заданию сохраняется сам. */
                if (
                  checking &&
                  g !== undefined &&
                  !g.naDorabotke &&
                  (g.comment ?? '') !== comment
                ) {
                  act(() =>
                    api.setGrade(
                      cw.submission.id,
                      z.no,
                      g.ball,
                      g.kriteriy,
                      g.ili,
                      comment || null,
                    ),
                  );
                }
              }}
              disabled={!checking}
              data-testid={`rab-comment-${z.no}`}
            />
          </label>
          {checking ? (
            <div className="kab-actions">
              <Button
                variant="secondary"
                size="sm"
                disabled={g === undefined}
                onClick={() =>
                  g !== undefined &&
                  act(() =>
                    api.setGrade(
                      cw.submission.id,
                      z.no,
                      g.ball,
                      g.kriteriy,
                      g.ili,
                      comment || null,
                    ),
                  )
                }
              >
                {T.commentSave}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  comment.trim() === ''
                    ? window.alert(T.vernutNeed)
                    : act(() => api.returnTask(cw.submission.id, z.no, comment))
                }
                data-testid={`rab-vernut-${z.no}`}
              >
                {T.vernut}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
