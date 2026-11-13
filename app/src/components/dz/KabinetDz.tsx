'use client';

/**
 * Разделы кабинета про классы и домашние задания (docs/kabinet-dz-8.md):
 *   - репетитору — «Мои классы» (создать класс, код, перейти в класс) и
 *     «Домашние задания» (выдать, кто сдал, перейти к результатам);
 *   - ученику — «Домашние задания» (срок, сколько решено, решать) и
 *     «Вступить в класс по коду».
 * Модуль базы грузится только здесь и только у вошедшего.
 */

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, Card, FieldLabel, FieldMessage, Input } from '@/components/ui';
import { DZK } from '@/content/dzIstochniki';
import { DZ, dueRu, dzError } from '@/content/dz';
import type { HwListItem, TutorClass } from '@/lib/dz/api';
import { DZ_HREF, homeworkHref, issueHref, klassHref } from '@/lib/dz/links';
import { statusOf } from '@/lib/dz/results';
import './dz.css';

const api = () => import('@/lib/dz/api');

function errorCode(error: unknown): string {
  return error instanceof Error && 'code' in error
    ? String((error as { code: string }).code)
    : 'unknown';
}

/* ── Репетитор: классы ─────────────────────────────────────────── */

export function TutorClassesCard() {
  const [classes, setClasses] = useState<TutorClass[] | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameId = useId();

  const load = useCallback(async () => {
    try {
      setClasses(await (await api()).loadTutorClasses());
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await (await api()).loadTutorClasses();
        if (alive) setClasses(list);
      } catch {
        if (alive) setClasses([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (name.trim() === '') {
      setError(DZ.classes.nameRequired);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (await api()).createClass(name);
      setName('');
      await load();
    } catch (e) {
      setError(dzError(errorCode(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="kabinet__card" title={DZ.classes.title} data-section="classes">
      {classes === null ? (
        <p className="auth-form__muted">…</p>
      ) : classes.length === 0 ? (
        <div className="dz-empty">
          <p className="dz-empty__title">{DZ.classes.empty}</p>
          <p className="auth-form__text">{DZ.classes.emptyText}</p>
        </div>
      ) : (
        <ul className="dz-klassy">
          {classes.map((klass) => (
            <li key={klass.id} className="dz-klassy__item">
              <Link className="dz-klassy__name" href={klassHref(klass.id)}>
                {klass.name}
              </Link>
              <span className="dz-klassy__meta">{DZ.classes.students(klass.members.length)}</span>
              <span className="dz-klassy__code" aria-label={DZ.classes.code}>
                {klass.joinCode}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form className="dz-inline-form" onSubmit={(e) => void create(e)} noValidate>
        <FieldLabel htmlFor={nameId}>{DZ.classes.nameLabel}</FieldLabel>
        <div className="dz-inline-form__row">
          <Input
            id={nameId}
            name="class-name"
            value={name}
            maxLength={80}
            placeholder={DZ.classes.namePlaceholder}
            onChange={(e) => setName(e.target.value)}
            state={error === null ? 'default' : 'error'}
          />
          <Button type="submit" variant="secondary" disabled={busy}>
            {DZ.classes.create}
          </Button>
        </div>
        {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
      </form>
    </Card>
  );
}

/* ── Репетитор: ДЗ ─────────────────────────────────────────────── */

export function TutorHomeworkCard() {
  const [items, setItems] = useState<HwListItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await (await api()).listHomework('tutor');
        if (alive) setItems(list);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card
      className="kabinet__card"
      title={DZ.list.tutorTitle}
      data-section="homework"
      action={
        <Link className="btn btn--primary btn--sm" href={issueHref({ origin: 'kabinet' })}>
          {DZ.list.issue}
        </Link>
      }
    >
      {items === null ? (
        <p className="auth-form__muted">…</p>
      ) : items.length === 0 ? (
        <div className="dz-empty">
          <p className="dz-empty__title">{DZ.list.tutorEmpty}</p>
          <p className="auth-form__text">{DZ.list.tutorEmptyText}</p>
        </div>
      ) : (
        <ul className="dz-list">
          {items.map(({ hw, recipients }) => {
            const done = recipients.filter((r) => r.submittedAt !== null).length;
            return (
              <li key={hw.id} className="dz-list__item">
                <Link className="dz-list__title" href={homeworkHref(hw.id)}>
                  {hw.title}
                </Link>
                <span className="dz-list__meta">
                  {hw.dueAt === null ? DZ.list.noDue : DZ.list.due(dueRu(hw.dueAt))}
                  {' · '}
                  {done === 0
                    ? DZ.list.nobodySubmitted
                    : DZ.list.submitted(done, recipients.length)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ── Ученик: ДЗ ────────────────────────────────────────────────── */

export function StudentHomeworkCard() {
  const [items, setItems] = useState<HwListItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await (await api()).listHomework('student');
        if (alive) setItems(list);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Card className="kabinet__card" title={DZ.list.studentTitle} data-section="homework">
      {items === null ? (
        <p className="auth-form__muted">…</p>
      ) : items.length === 0 ? (
        <div className="dz-empty">
          <p className="dz-empty__title">{DZ.list.studentEmpty}</p>
          <p className="auth-form__text">{DZ.list.studentEmptyText}</p>
        </div>
      ) : (
        <ul className="dz-list">
          {items.map(({ hw, recipients, tasks, done }) => {
            const mine = recipients[0] ?? { startedAt: null, submittedAt: null };
            const status = statusOf(hw, mine);
            return (
              <li key={hw.id} className="dz-list__item" data-status={status}>
                <Link className="dz-list__title" href={homeworkHref(hw.id)}>
                  {hw.title}
                </Link>
                <span className="dz-list__meta">
                  {hw.dueAt === null ? DZ.list.noDue : DZ.list.due(dueRu(hw.dueAt))}
                  {' · '}
                  <span className={`dz-status dz-status--${status}`}>{DZ.status[status]}</span>
                  {' · '}
                  {DZK.uchenik.sdelano(done, tasks).toLowerCase()}
                </span>
                {hw.note === '' ? null : <p className="dz-list__note">{hw.note}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/* ── Ученик: вступить в класс ──────────────────────────────────── */

export function JoinClassForm({
  onJoined,
  initial = '',
}: {
  onJoined?: () => void;
  initial?: string;
}) {
  const [code, setCode] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function join(event: FormEvent) {
    event.preventDefault();
    if (code.trim() === '') {
      setError(DZ_ERRORS_EMPTY);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const joined = await (await api()).joinClass(code);
      setDone(DZ.join.done(joined.className, joined.tutorName));
      setCode('');
      onJoined?.();
    } catch (e) {
      setError(dzError(errorCode(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="dz-inline-form" onSubmit={(e) => void join(e)} noValidate data-form="join">
      <FieldLabel htmlFor={id}>{DZ.join.label}</FieldLabel>
      <div className="dz-inline-form__row">
        <Input
          id={id}
          name="class-code"
          value={code}
          maxLength={12}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder={DZ.join.placeholder}
          onChange={(e) => setCode(e.target.value)}
          state={error === null ? 'default' : 'error'}
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          {DZ.join.submit}
        </Button>
      </div>
      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
      {done === null ? null : (
        <p className="dz-ok" role="status">
          {done}
        </p>
      )}
    </form>
  );
}

const DZ_ERRORS_EMPTY = 'Введи код от репетитора.';

export { DZ_HREF };
