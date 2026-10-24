'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, Card, ErrorState, FieldMessage, Input } from '@/components/ui';
import { KabinetLoading } from '@/components/kabinet/KabinetGate';
import { errorText, useKabinet } from '@/components/kabinet/useKabinet';
import type { KabinetApi } from '@/lib/kabinet/api';
import { GOTOVY } from '@/lib/povyshennye/dannye';
import { povKod } from '@/lib/povyshennye/kod';
import { VERSIY } from '@/lib/povyshennye/types';
import { rabotyApi } from '@/lib/raboty/client';
import type { Part2Mode } from '@/lib/raboty/types';
import { RABOTY_HREF } from './RabotyPage';
import { vydatText as T } from './text';
import './raboty.css';

const loadTutor = (api: KabinetApi) => api.tutorHome();

/** Выдать вариант раздела «Варианты повышенной сложности» ученикам или классу. */
export function VydatVariant() {
  const home = useKabinet(loadTutor);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [k, setK] = useState(GOTOVY[0] ?? 1);
  const [v, setV] = useState(1);
  const [mode, setMode] = useState<Part2Mode>('teacher');
  const [due, setDue] = useState('');
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<string[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (home.status === 'loading') return <KabinetLoading />;
  if (home.status === 'error') return <ErrorState title={T.title} description={home.message} />;
  const { classes, students: all } = home.data;

  async function vydat() {
    setProblem(null);
    setBusy(true);
    try {
      await rabotyApi().issueWork({
        title: title.trim() === '' ? T.versiyaLabel(k, v) : title,
        note: note.trim() === '' ? null : note,
        dueAt: due === '' ? null : new Date(due).toISOString(),
        classId: classId === '' ? null : classId,
        students,
        code: povKod(k),
        versiya: v,
        part2Mode: mode,
      });
      setDone(true);
    } catch (e) {
      setProblem(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card title={T.done}>
        <Link className="btn btn--primary" href={RABOTY_HREF} data-testid="vydat-back">
          {T.back}
        </Link>
      </Card>
    );
  }

  return (
    <form
      className="kab-stack rab-form"
      onSubmit={(e) => {
        e.preventDefault();
        void vydat();
      }}
    >
      <h1 className="t-h1">{T.title}</h1>
      <Card>
        <div className="rab-fields">
          <label className="rab-field">
            <span>{T.name}</span>
            <Input
              value={title}
              placeholder={T.versiyaLabel(k, v)}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              data-testid="vydat-title"
            />
          </label>
          <div className="rab-row">
            <label className="rab-field">
              <span>{T.variant}</span>
              <select
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                data-testid="vydat-k"
              >
                {GOTOVY.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="rab-field">
              <span>{T.versiya}</span>
              <select
                value={v}
                onChange={(e) => setV(Number(e.target.value))}
                data-testid="vydat-v"
              >
                {Array.from({ length: VERSIY }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {T.versiyaLabel(k, n)}
                  </option>
                ))}
              </select>
            </label>
            <label className="rab-field">
              <span>{T.due}</span>
              <input
                type="datetime-local"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                data-testid="vydat-due"
              />
            </label>
          </div>
          <p className="t-caption muted">{T.onlyReady}</p>
          <fieldset className="rab-field">
            <legend>{T.part2}</legend>
            {(['teacher', 'self'] as const).map((m) => (
              <label key={m} className="rab-radio">
                <input
                  type="radio"
                  name="part2"
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  data-testid={`vydat-mode-${m}`}
                />
                {m === 'teacher' ? T.part2Teacher : T.part2Self}
              </label>
            ))}
          </fieldset>
          <label className="rab-field">
            <span>{T.note}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={2000}
            />
          </label>
        </div>
      </Card>
      <Card title={T.whom}>
        <label className="rab-field">
          <span>{T.klass}</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">{T.noClass}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="rab-field">
          <legend>{T.students}</legend>
          {all.map((s) => (
            <label key={s.id} className="rab-radio">
              <input
                type="checkbox"
                checked={students.includes(s.id)}
                onChange={(e) =>
                  setStudents((x) =>
                    e.target.checked ? [...x, s.id] : x.filter((y) => y !== s.id),
                  )
                }
                data-testid={`vydat-st-${s.id}`}
              />
              {s.name}
            </label>
          ))}
        </fieldset>
      </Card>
      {problem === null ? null : <FieldMessage tone="error">{problem}</FieldMessage>}
      <div className="kab-actions">
        <Button type="submit" loading={busy} data-testid="vydat-submit">
          {T.submit}
        </Button>
        <Link className="vo-link" href={RABOTY_HREF}>
          {T.back}
        </Link>
      </div>
    </form>
  );
}
