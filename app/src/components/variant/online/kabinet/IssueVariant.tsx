'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  FieldLabel,
  FieldMessage,
  Input,
  Select,
  SuccessState,
} from '@/components/ui';
import { KabinetLoading } from '@/components/kabinet/KabinetGate';
import { kabinetText } from '@/components/kabinet/text';
import { errorText, useKabinet } from '@/components/kabinet/useKabinet';
import { ONLINE_TEXT } from '@/content/variantOnline/text';
import type { KabinetApi } from '@/lib/kabinet/api';
import { kabinetApi } from '@/lib/kabinet/client';
import { issueInput } from '@/lib/variant/online/issue';
import { MAX_MINUTES, parseSeriya, type Mode, type Timer } from '@/lib/variant/online/link';
import { loadSet, seriesRepeats, type LoadedSet } from '@/lib/variant/online/work';
import { kindTitle } from '../WorkRun';

const T = ONLINE_TEXT.kab;
const loadTutor = (api: KabinetApi) => api.tutorHome();

/**
 * Репетитор выдаёт вариант или серию «Собрать вариант» классу или
 * ученикам: код партии (с экрана /variant/ — кнопкой «Выдать через
 * кабинет» или вручную), режим, таймер, срок. Браузер собирает партию по
 * коду и отправляет условия и ключ; ученикам уходят только условия.
 */
export function IssueVariant() {
  const home = useKabinet(loadTutor);
  const id = useId();
  const [code, setCode] = useState('');
  const [loaded, setLoaded] = useState<LoadedSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [which, setWhich] = useState(0);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('ege');
  const [mode, setMode] = useState<Mode>('kontrol');
  const [timerKind, setTimerKind] = useState<Timer['kind']>('none');
  const [minutes, setMinutes] = useState(90);
  const [due, setDue] = useState('');
  const [classId, setClassId] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [issuedId, setIssuedId] = useState<string | null>(null);

  async function show(text: string) {
    setLoading(true);
    setProblem(null);
    try {
      const l = await loadSet(text.trim());
      if (l === null) setProblem(T.codeBad);
      setLoaded(l);
      setWhich(0);
    } finally {
      setLoading(false);
    }
  }

  /* Вход с экрана «Собрать вариант»: код, режим, таймер и тип — из адреса. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const fromLink = parseSeriya(q);
    if (fromLink === null) return;
    const t = window.setTimeout(() => {
      setCode(fromLink.code);
      setKind(fromLink.settings.kind);
      setMode(q.get('r') === null ? 'kontrol' : fromLink.settings.mode);
      setTimerKind(fromLink.settings.timer.kind);
      if (fromLink.settings.timer.kind === 'down') setMinutes(fromLink.settings.timer.minutes);
      setTitle(kindTitle(fromLink.settings.kind, fromLink.settings.title));
      void show(fromLink.code);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (home.status === 'loading') return <KabinetLoading />;
  if (home.status === 'error') {
    return <ErrorState title={kabinetText.loadError} description={home.message} />;
  }
  const { classes, students } = home.data;

  if (issuedId !== null) {
    return (
      <SuccessState
        title={T.done}
        description={title}
        action={
          <span className="kab-actions">
            <Link
              className="btn btn--primary"
              href={`/kabinet/rabota/?id=${issuedId}`}
              data-testid="vo-issued"
            >
              {T.open}
            </Link>
            <Link className="btn btn--ghost" href="/kabinet/proba/">
              {kabinetText.toHome}
            </Link>
          </span>
        }
      />
    );
  }
  if (students.length === 0) {
    return (
      <EmptyState
        title={T.issueTitle}
        description={T.noStudents}
        action={
          <Link className="btn btn--primary" href="/kabinet/proba/">
            {kabinetText.toHome}
          </Link>
        }
      />
    );
  }

  const set = loaded?.set ?? null;
  const count = set?.variants.length ?? 0;
  const repeats = set === null || count < 2 ? [] : seriesRepeats(set);
  const inClass = new Set(classes.find((c) => c.id === classId)?.students.map((s) => s.id) ?? []);
  const timer: Timer =
    timerKind === 'down'
      ? { kind: 'down', minutes }
      : timerKind === 'up'
        ? { kind: 'up' }
        : { kind: 'none' };
  const canSubmit =
    set !== null &&
    title.trim() !== '' &&
    (classId !== null || studentIds.length > 0) &&
    repeats.length === 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (set === null || !canSubmit || busy) return;
    setBusy(true);
    setProblem(null);
    kabinetApi()
      .issueVariantWork(
        issueInput(set, {
          title: title.trim(),
          kind,
          mode,
          timer,
          dueAt: due === '' ? null : new Date(due).toISOString(),
          classId,
          studentIds,
          variants: which === 0 ? [] : [which],
        }),
      )
      .then(setIssuedId, (err: unknown) => setProblem(errorText(err)))
      .finally(() => setBusy(false));
  };

  return (
    <form className="kab-stack" onSubmit={submit} noValidate data-testid="vo-issue">
      <h1 className="t-h1">{T.issueTitle}</h1>
      <p className="t-caption muted">{T.issueLead}</p>

      <Card>
        <div className="kab-fields">
          <div className="field">
            <FieldLabel htmlFor={`${id}-code`}>{T.code}</FieldLabel>
            <div className="kab-inline-form">
              <Input
                id={`${id}-code`}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                data-testid="vo-issue-code"
              />
              <Button
                variant="secondary"
                onClick={() => void show(code)}
                disabled={code.trim() === ''}
                loading={loading}
              >
                {T.loadSet}
              </Button>
            </div>
            <p className="t-caption dim">{T.codeHint}</p>
          </div>
          {set === null ? null : (
            <div className="field">
              <FieldLabel htmlFor={`${id}-which`}>
                {T.which} · {T.variants(count)}
              </FieldLabel>
              <Select
                id={`${id}-which`}
                value={which}
                onChange={(e) => setWhich(Number(e.target.value))}
              >
                {count > 1 ? (
                  <option value={0}>{T.allSeries}</option>
                ) : (
                  <option value={0}>{T.one(1)}</option>
                )}
                {count > 1
                  ? set.variants.map((v) => (
                      <option key={v.index} value={v.index}>
                        {T.one(v.index)}
                      </option>
                    ))
                  : null}
              </Select>
            </div>
          )}
          {repeats.length > 0 ? (
            <FieldMessage tone="error">
              {ONLINE_TEXT.panel.seriesRepeats(repeats.map((n) => `№${n}`).join(', '))}
            </FieldMessage>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="kab-fields">
          <div className="field">
            <FieldLabel htmlFor={`${id}-title`}>{T.name}</FieldLabel>
            <Input
              id={`${id}-title`}
              value={title}
              maxLength={120}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <FieldLabel htmlFor={`${id}-mode`}>{T.mode}</FieldLabel>
            <Select
              id={`${id}-mode`}
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              {ONLINE_TEXT.panel.modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="field">
            <FieldLabel htmlFor={`${id}-timer`}>{T.timer}</FieldLabel>
            <Select
              id={`${id}-timer`}
              value={timerKind}
              onChange={(e) => setTimerKind(e.target.value as Timer['kind'])}
            >
              {ONLINE_TEXT.panel.timers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          {timerKind === 'down' ? (
            <div className="field">
              <FieldLabel htmlFor={`${id}-min`}>{T.minutes}</FieldLabel>
              <Input
                id={`${id}-min`}
                type="number"
                min={1}
                max={MAX_MINUTES}
                value={minutes}
                onChange={(e) =>
                  setMinutes(Math.min(MAX_MINUTES, Math.max(1, Number(e.target.value) || 90)))
                }
              />
            </div>
          ) : null}
          <div className="field">
            <FieldLabel htmlFor={`${id}-due`}>{T.due}</FieldLabel>
            <Input
              id={`${id}-due`}
              type="datetime-local"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
        </div>
        <p className="t-caption dim">{ONLINE_TEXT.panel.modeNote[mode]}</p>
      </Card>

      <Card title={T.whom}>
        <div className="kab-fields">
          <div className="field">
            <FieldLabel htmlFor={`${id}-class`}>{T.wholeClass}</FieldLabel>
            <Select
              id={`${id}-class`}
              value={classId ?? ''}
              onChange={(e) => setClassId(e.target.value === '' ? null : e.target.value)}
            >
              <option value="">{T.noClass}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.students.length})
                </option>
              ))}
            </Select>
          </div>
          <p className="field__label kab-sub">{T.students}</p>
          <div className="kab-checks">
            {students.map((s) => (
              <Checkbox
                key={s.id}
                checked={inClass.has(s.id) || studentIds.includes(s.id)}
                disabled={inClass.has(s.id)}
                onChange={(e) =>
                  setStudentIds((ids) =>
                    e.target.checked ? [...ids, s.id] : ids.filter((x) => x !== s.id),
                  )
                }
              >
                {s.name}
              </Checkbox>
            ))}
          </div>
        </div>
      </Card>

      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}
      <div>
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          loading={busy}
          data-testid="vo-issue-submit"
        >
          {T.submit}
        </Button>
      </div>
    </form>
  );
}
