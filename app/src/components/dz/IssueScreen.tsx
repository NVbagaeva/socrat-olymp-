'use client';

/**
 * «Выдать домашнее задание» — /kabinet/dz-vydat/.
 *
 * Открывается из кабинета и из раздела №8 (генератор, опорные задачи,
 * тренажёр) с уже заполненными типами или задачами (lib/dz/links.ts →
 * issueHref), и для работы над ошибками по выданному ДЗ. Задачи
 * собираются в браузере репетитора один раз: что видно в предпросмотре,
 * то и уходит ученику, на печать и в результаты.
 */

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  FieldLabel,
  FieldMessage,
  Input,
  Radio,
  Select,
} from '@/components/ui';
import type { Names8 } from '@/components/tasks/vychisleniya/Progress8';
import { DZ, SOLUTIONS_WHEN, dzError } from '@/content/dz';
import type { HwFull, TutorClass } from '@/lib/dz/api';
import { DZ_HREF, homeworkHref, readIssuePreset, type IssuePreset } from '@/lib/dz/links';
import { memberNameOf } from '@/lib/dz/names';
import { mistakesPlan, table } from '@/lib/dz/results';
import { sanitizeHtml } from '@/lib/dz/sanitize';
import type { AttemptsLimit, HwOrigin, HwTaskInput, SolutionsWhen } from '@/lib/dz/types';
import type { Built8 } from '@/lib/dz/z08';
import { BANK } from '@/lib/vychisleniya/bank';
import { PROTOTYPE_NAMES, taskId } from '@/lib/vychisleniya/ids';
import { texPlain } from '@/lib/texPlain';
import { SKILLS } from '@/lib/vychisleniya/skills';
import { NeedLogin, dzApi, errorCode, useUser } from './common';
import './dz.css';

const t = DZ.issue;
const z08 = () => import('@/lib/dz/z08');

/** Срок по умолчанию: через неделю, 20:00 — в формате поля datetime-local. */
function defaultDue(): string {
  const d = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  d.setHours(20, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Mode = 'kinds' | 'hand';

interface Mistakes {
  hw: HwFull;
  /** Ученик → задачи с ошибкой («прототип|seed|уровень»). */
  refs: Map<string, string[]>;
}

export function IssueScreen({ names }: { names: Names8 }) {
  const user = useUser();
  const [preset, setPreset] = useState<IssuePreset | null>(null);
  const [classes, setClasses] = useState<TutorClass[] | null>(null);
  const [mistakes, setMistakes] = useState<Mistakes | null>(null);

  useEffect(() => {
    if (user === null || user.role !== 'tutor') return;
    const read = readIssuePreset(window.location.search);
    void (async () => {
      const api = await dzApi();
      const list = await api.loadTutorClasses().catch(() => []);
      setPreset(read);
      setClasses(list);
      if (read.mistakesOf !== undefined) {
        const hw = await api.loadHomework(read.mistakesOf).catch(() => null);
        if (hw !== null) {
          const rows = table(hw.tasks, hw.recipients, hw.answers);
          const refs = new Map(
            mistakesPlan(rows).map((plan) => [
              plan.studentId,
              plan.taskIds.map((id) => hw.keys.get(id)?.ref ?? '').filter((r) => r !== ''),
            ]),
          );
          setMistakes({ hw, refs });
        }
      }
    })();
  }, [user]);

  if (user === null) return <NeedLogin text="Войдите в кабинет репетитора." />;
  if (user.role !== 'tutor') {
    return (
      <EmptyState
        title="Эта страница — для репетитора."
        description="Задания выдаёт репетитор своим ученикам."
      />
    );
  }
  if (preset === null || classes === null) return <p className="auth-form__muted">…</p>;
  if (preset.mistakesOf !== undefined && mistakes === null)
    return <p className="auth-form__muted">…</p>;
  return <IssueForm names={names} preset={preset} classes={classes} mistakes={mistakes} />;
}

function IssueForm({
  names,
  preset,
  classes,
  mistakes,
}: {
  names: Names8;
  preset: IssuePreset;
  classes: TutorClass[];
  mistakes: Mistakes | null;
}) {
  const ids = {
    klass: useId(),
    title: useId(),
    due: useId(),
    note: useId(),
    per: useId(),
    proto: useId(),
  };
  const forMistakes = mistakes !== null;
  const firstClass =
    (mistakes?.hw.hw.classId !== undefined
      ? classes.find((k) => k.id === mistakes.hw.hw.classId)
      : undefined) ?? classes[0];
  const [classId, setClassId] = useState<string>(firstClass?.id ?? '');
  const klass = classes.find((k) => k.id === classId);
  const [students, setStudents] = useState<Set<string>>(
    () =>
      new Set(
        forMistakes ? [...mistakes.refs.keys()] : (firstClass?.members ?? []).map((m) => m.userId),
      ),
  );
  const [mode, setMode] = useState<Mode>((preset.refs?.length ?? 0) > 0 ? 'hand' : 'kinds');
  const [kinds, setKinds] = useState<Set<string>>(() => new Set(preset.kinds ?? []));
  const [perKind, setPerKind] = useState(preset.perKind ?? 2);
  const [refs, setRefs] = useState<string[]>(() => [...(preset.refs ?? [])]);
  const [proto, setProto] = useState<string>(preset.kinds?.[0] ?? '8.A');
  const [individual, setIndividual] = useState(forMistakes);
  const [title, setTitle] = useState(forMistakes ? t.fromMistakes(mistakes.hw.hw.title) : '');
  const [due, setDue] = useState(defaultDue);
  const [noDue, setNoDue] = useState(false);
  const [attempts, setAttempts] = useState<AttemptsLimit>(null);
  const [when, setWhen] = useState<SolutionsWhen>('after_submit');
  const [memo, setMemo] = useState(false);
  const [example, setExample] = useState(false);
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<Built8[][] | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);

  const recipients = useMemo(
    () => (klass?.members ?? []).filter((m) => students.has(m.userId)),
    [klass, students],
  );

  /** Собрать задачи: по набору на ученика при индивидуальной выдаче. */
  const build = useCallback(async (): Promise<Built8[][]> => {
    const lib = await z08();
    if (forMistakes) {
      return recipients.map((m) => lib.mistakesOf(mistakes.refs.get(m.userId) ?? []));
    }
    const sets = individual ? Math.max(1, recipients.length) : 1;
    return mode === 'kinds' ? lib.byKinds([...kinds], perKind, sets) : lib.byRefs(refs, sets);
  }, [forMistakes, mistakes, recipients, individual, mode, kinds, perKind, refs]);

  const rebuild = useCallback(async () => {
    setBuilding(true);
    try {
      setPreview(await build());
    } finally {
      setBuilding(false);
    }
  }, [build]);

  /* Нечего выдавать — предпросмотра нет. */
  const empty = !forMistakes && (mode === 'kinds' ? kinds.size === 0 : refs.length === 0);
  const shown = empty ? null : preview;

  /* Предпросмотр пересобирается, когда меняется состав задачи. */
  useEffect(() => {
    if (empty) return;
    const timer = setTimeout(() => void rebuild(), 250);
    return () => clearTimeout(timer);
  }, [rebuild, empty]);

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (title.trim() === '') return setError(t.nameRequired);
    if (recipients.length === 0) return setError(dzError('no_recipients'));
    if (shown === null || shown.every((set) => set.length === 0)) return setError(t.nothing);
    setSending(true);
    try {
      const { placeTasks } = await z08();
      const sets = shown;
      const people = recipients.map((m) => m.userId);
      const tasks: HwTaskInput[] = placeTasks(sets, people, individual);
      const origin: HwOrigin = forMistakes ? 'oshibki' : preset.origin;
      const id = await (
        await dzApi()
      ).issueHomework({
        classId: klass?.id ?? null,
        students: people,
        taskNo: 8,
        origin,
        parentId: forMistakes ? mistakes.hw.hw.id : null,
        settings: {
          title,
          note,
          dueAt: noDue ? null : new Date(due).toISOString(),
          attemptsLimit: attempts,
          solutionsWhen: when,
          showMemo: memo,
          showExample: example,
          individual,
        },
        tasks,
      });
      setIssued(id);
    } catch (e) {
      setError(dzError(errorCode(e)));
    } finally {
      setSending(false);
    }
  }

  if (issued !== null) {
    return (
      <div className="dz-page" data-page="vydano">
        <Card className="kabinet__card" title={t.done}>
          <p className="auth-form__text">{title}</p>
          <div className="dz-actions">
            <Link className="btn btn--primary" href={homeworkHref(issued)}>
              {t.open}
            </Link>
            <Link className="btn btn--ghost" href={DZ_HREF.kabinet}>
              {DZ.solve.back}
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (classes.length === 0) {
    return <EmptyState title={t.title} description={t.noClasses} />;
  }

  const first = shown?.[0] ?? [];

  return (
    <form
      className="dz-page dz-issue"
      data-page="dz-vydat"
      onSubmit={(e) => void submit(e)}
      noValidate
    >
      <Link className="dz-back" href={DZ_HREF.kabinet}>
        {DZ.solve.back}
      </Link>
      <header className="dz-head">
        <h1 className="dz-head__title">{t.title}</h1>
      </header>
      <p className="auth-form__text">{forMistakes ? t.mistakesLead : t.lead}</p>

      {/* Кому */}
      <Card className="kabinet__card" title={t.who} data-section="who">
        <FieldLabel htmlFor={ids.klass}>{t.klass}</FieldLabel>
        <Select
          id={ids.klass}
          value={classId}
          disabled={forMistakes}
          onChange={(e) => {
            const next = classes.find((k) => k.id === e.target.value);
            setClassId(e.target.value);
            setStudents(new Set((next?.members ?? []).map((m) => m.userId)));
          }}
        >
          {classes.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </Select>
        {(klass?.members.length ?? 0) === 0 ? (
          <p className="auth-form__muted">{t.noStudents}</p>
        ) : (
          <div className="dz-checks" data-list="students">
            {forMistakes ? null : (
              <Checkbox
                checked={recipients.length === klass!.members.length}
                indeterminate={recipients.length > 0 && recipients.length < klass!.members.length}
                onChange={(e) =>
                  setStudents(new Set(e.target.checked ? klass!.members.map((m) => m.userId) : []))
                }
              >
                {t.allStudents}
              </Checkbox>
            )}
            {klass!.members
              .filter((m) => !forMistakes || mistakes.refs.has(m.userId))
              .map((m) => (
                <Checkbox
                  key={m.userId}
                  checked={students.has(m.userId)}
                  onChange={() => setStudents((s) => toggle(s, m.userId))}
                >
                  {memberNameOf(m)}
                  {forMistakes ? ` — ${mistakes.refs.get(m.userId)?.length ?? 0}` : ''}
                </Checkbox>
              ))}
          </div>
        )}
      </Card>

      {/* Задачи */}
      {forMistakes ? null : (
        <Card className="kabinet__card" title={t.tasks} data-section="tasks">
          <div className="dz-seg" role="radiogroup" aria-label={t.tasks}>
            <Radio name="mode" checked={mode === 'kinds'} onChange={() => setMode('kinds')}>
              {t.byKinds}
            </Radio>
            <Radio name="mode" checked={mode === 'hand'} onChange={() => setMode('hand')}>
              {t.byHand}
            </Radio>
          </div>
          {mode === 'kinds' ? (
            <>
              <p className="auth-form__muted">{t.kindsHint}</p>
              <div className="dz-kinds" data-list="kinds">
                {SKILLS.map((skill) => (
                  <fieldset key={skill.id} className="dz-kinds__skill">
                    <legend>{skill.nazvanie}</legend>
                    {skill.prototypes.map((p) => (
                      <Checkbox
                        key={p}
                        value={p}
                        checked={kinds.has(p)}
                        onChange={() => setKinds((s) => toggle(s, p))}
                      >
                        <span dangerouslySetInnerHTML={{ __html: names[p] ?? p }} />
                      </Checkbox>
                    ))}
                  </fieldset>
                ))}
              </div>
              <FieldLabel htmlFor={ids.per}>{t.perKind}</FieldLabel>
              <Select
                id={ids.per}
                value={String(perKind)}
                onChange={(e) => setPerKind(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </>
          ) : (
            <HandPicker
              key={proto}
              proto={proto}
              protoId={ids.proto}
              onProto={setProto}
              refs={refs}
              onToggle={(ref) =>
                setRefs((list) =>
                  list.includes(ref) ? list.filter((r) => r !== ref) : [...list, ref],
                )
              }
            />
          )}
          <div className="dz-seg" role="radiogroup" aria-label={t.individual}>
            <Radio name="individual" checked={!individual} onChange={() => setIndividual(false)}>
              {t.together}
            </Radio>
            <Radio name="individual" checked={individual} onChange={() => setIndividual(true)}>
              {t.individual}
            </Radio>
          </div>
          {individual ? <p className="auth-form__muted">{t.individualHint}</p> : null}
        </Card>
      )}

      {/* Настройки */}
      <Card className="kabinet__card" title={t.settings} data-section="settings">
        <FieldLabel htmlFor={ids.title}>{t.name}</FieldLabel>
        <Input
          id={ids.title}
          name="title"
          value={title}
          maxLength={120}
          placeholder={t.namePlaceholder}
          onChange={(e) => setTitle(e.target.value)}
        />
        <FieldLabel htmlFor={ids.due}>{t.due}</FieldLabel>
        <div className="dz-inline-form__row">
          <Input
            id={ids.due}
            name="due"
            type="datetime-local"
            value={due}
            disabled={noDue}
            onChange={(e) => setDue(e.target.value)}
          />
          <Checkbox checked={noDue} onChange={(e) => setNoDue(e.target.checked)}>
            {t.noDue}
          </Checkbox>
        </div>
        <p className="dz-field-title">{t.attempts}</p>
        <div className="dz-seg" role="radiogroup" aria-label={t.attempts}>
          {([1, 2, null] as AttemptsLimit[]).map((n) => (
            <Radio
              key={String(n)}
              name="attempts"
              checked={attempts === n}
              onChange={() => setAttempts(n)}
            >
              {t.attemptsOptions[String(n)]}
            </Radio>
          ))}
        </div>
        <p className="dz-field-title">{t.solutions}</p>
        <div className="dz-seg" role="radiogroup" aria-label={t.solutions}>
          {(['instant', 'after_submit', 'after_due'] as SolutionsWhen[]).map((w) => (
            <Radio key={w} name="when" checked={when === w} onChange={() => setWhen(w)}>
              {SOLUTIONS_WHEN[w]}
            </Radio>
          ))}
        </div>
        <Checkbox checked={memo} onChange={(e) => setMemo(e.target.checked)}>
          {t.memo}
        </Checkbox>
        <Checkbox checked={example} onChange={(e) => setExample(e.target.checked)}>
          {t.example}
        </Checkbox>
        <p className="auth-form__muted">{t.offByDefault}</p>
        <FieldLabel htmlFor={ids.note}>{t.note}</FieldLabel>
        <textarea
          id={ids.note}
          className="input dz-textarea"
          value={note}
          maxLength={2000}
          rows={3}
          placeholder={t.notePlaceholder}
          onChange={(e) => setNote(e.target.value)}
        />
      </Card>

      {/* Предпросмотр */}
      <Card
        className="kabinet__card"
        title={t.preview}
        data-section="preview"
        action={
          forMistakes || shown === null ? undefined : (
            <Button size="sm" variant="ghost" onClick={() => void rebuild()} disabled={building}>
              {t.rebuild}
            </Button>
          )
        }
      >
        {building ? <p className="auth-form__muted">{t.building}</p> : null}
        {shown === null ? (
          <p className="auth-form__muted">{t.nothing}</p>
        ) : (
          <>
            {individual && !forMistakes ? (
              <p className="auth-form__muted">{t.previewIndividual}</p>
            ) : null}
            {forMistakes ? (
              <ul className="dz-preview-people">
                {recipients.map((m, i) => (
                  <li key={m.userId}>
                    {memberNameOf(m)}: {shown[i]?.length ?? 0}
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="dz-preview">
                {first.map((task, i) => (
                  <li key={`${task.ref}-${i}`} className="dz-preview__item" data-ref={task.ref}>
                    <span
                      className="dz-preview__kind"
                      dangerouslySetInnerHTML={{ __html: names[task.kind] ?? task.kind }}
                    />
                    <span
                      className="dz-preview__q"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.questionHtml) }}
                    />
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </Card>

      {error === null ? null : <FieldMessage tone="error">{error}</FieldMessage>}
      <div className="dz-actions dz-actions--end">
        <Button type="submit" disabled={sending || building}>
          {sending ? t.sending : t.submit}
        </Button>
      </div>
    </form>
  );
}

/** Ручной выбор: прототип → его задачи банка с галочками. */
function HandPicker({
  proto,
  protoId,
  onProto,
  refs,
  onToggle,
}: {
  proto: string;
  protoId: string;
  onProto: (p: string) => void;
  refs: readonly string[];
  onToggle: (ref: string) => void;
}) {
  const [items, setItems] = useState<Built8[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const { build8 } = await z08();
      const entry = BANK.find((e) => e.prototype === proto);
      const built = (entry?.variants ?? [])
        .map((v) => build8(taskId(proto, v.seed, v.level)))
        .filter((b): b is Built8 => b !== null);
      if (alive) setItems(built);
    })();
    return () => {
      alive = false;
    };
  }, [proto]);

  return (
    <>
      <p className="auth-form__muted">{t.handHint}</p>
      <FieldLabel htmlFor={protoId}>{DZ.results.cell}</FieldLabel>
      <Select id={protoId} value={proto} onChange={(e) => onProto(e.target.value)}>
        {SKILLS.flatMap((skill) =>
          skill.prototypes.map((p) => (
            <option key={p} value={p}>
              {/* В <option> KaTeX не набрать: название обычным текстом, как в каталоге кабинета. */}
              {p} · {texPlain(PROTOTYPE_NAMES[p] ?? '')}
            </option>
          )),
        )}
      </Select>
      <p className="auth-form__muted">{t.chosenFrom(refs.length)}</p>
      {items === null ? (
        <p className="auth-form__muted">{t.building}</p>
      ) : (
        <ul className="dz-hand" data-list="hand">
          {items.map((task) => (
            <li key={task.ref}>
              <Checkbox
                checked={refs.includes(task.ref)}
                onChange={() => onToggle(task.ref)}
                value={task.ref}
              >
                <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(task.questionHtml) }} />
              </Checkbox>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
