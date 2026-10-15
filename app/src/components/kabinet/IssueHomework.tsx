'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
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
import { catalogTask, catalogTasks, taskLabel } from '@/lib/kabinet/catalog';
import { kabinetApi } from '@/lib/kabinet/client';
import type { KabinetApi } from '@/lib/kabinet/api';
import type { HomeworkItem } from '@/lib/kabinet/types';
import { KabinetLoading } from './KabinetGate';
import { kabinetText } from './text';
import { errorText, useKabinet, useQueryParam } from './useKabinet';

const loadTutor = (api: KabinetApi) => api.tutorHome();
const readyTasks = catalogTasks.filter((t) => t.ready);
const firstTask = readyTasks[0]?.no ?? 1;

/** Одна строка «номер → прототип → сколько». */
function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: HomeworkItem;
  index: number;
  onChange: (next: HomeworkItem) => void;
  onRemove: (() => void) | null;
}) {
  const t = kabinetText.issue;
  const id = useId();
  const task = catalogTask(item.taskNo);
  return (
    <fieldset className="kab-item" data-testid={`item-${index}`}>
      <legend className="sr-only">Задача {index + 1}</legend>
      <div className="field">
        <FieldLabel htmlFor={`${id}-no`}>{t.taskNo}</FieldLabel>
        <Select
          id={`${id}-no`}
          value={item.taskNo}
          onChange={(e) =>
            onChange({ taskNo: Number(e.target.value), prototypeCode: null, count: item.count })
          }
        >
          {readyTasks.map((x) => (
            <option key={x.no} value={x.no}>
              {taskLabel(x.no)} · {x.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="field kab-item__proto">
        <FieldLabel htmlFor={`${id}-proto`}>{t.prototype}</FieldLabel>
        <Select
          id={`${id}-proto`}
          value={item.prototypeCode ?? ''}
          onChange={(e) =>
            onChange({ ...item, prototypeCode: e.target.value === '' ? null : e.target.value })
          }
        >
          <option value="">{t.anyPrototype}</option>
          {task?.prototypes.map((p) => (
            <option key={p.code} value={p.code}>
              {p.code.split(':')[1]} · {p.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="field kab-item__count">
        <FieldLabel htmlFor={`${id}-count`}>{t.count}</FieldLabel>
        <Input
          id={`${id}-count`}
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={item.count}
          onChange={(e) =>
            onChange({ ...item, count: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })
          }
        />
      </div>
      {onRemove !== null ? (
        <Button variant="ghost" size="sm" onClick={onRemove} className="kab-item__remove">
          {t.remove}
        </Button>
      ) : null}
    </fieldset>
  );
}

export function IssueHomework() {
  const home = useKabinet(loadTutor);
  const presetClass = useQueryParam('klass');
  const t = kabinetText.issue;
  const id = useId();
  const [classId, setClassId] = useState<string | null>(null);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const [items, setItems] = useState<HomeworkItem[]>([
    { taskNo: firstTask, prototypeCode: null, count: 5 },
  ]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [issuedId, setIssuedId] = useState<string | null>(null);

  if (home.status === 'loading') return <KabinetLoading />;
  if (home.status === 'error') {
    return <ErrorState title={kabinetText.loadError} description={home.message} />;
  }
  const { classes, students } = home.data;
  const cls =
    classId ??
    (presetClass !== null && classes.some((c) => c.id === presetClass) ? presetClass : null);

  if (issuedId !== null) {
    return (
      <SuccessState
        title={t.done}
        description={title}
        action={
          <span className="kab-actions">
            <Link className="btn btn--primary" href={`/kabinet/dz/?id=${issuedId}`}>
              Открыть задание
            </Link>
            <Link className="btn btn--ghost" href="/kabinet/">
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
        title={t.title}
        description={t.noStudents}
        action={
          <Link className="btn btn--primary" href="/kabinet/">
            {kabinetText.toHome}
          </Link>
        }
      />
    );
  }

  const inClass = new Set(classes.find((c) => c.id === cls)?.students.map((s) => s.id) ?? []);
  const canSubmit =
    title.trim() !== '' && items.length > 0 && (cls !== null || studentIds.length > 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setProblem(null);
    kabinetApi()
      .issueHomework({
        title,
        note,
        dueAt: due === '' ? null : new Date(due).toISOString(),
        classId: cls,
        studentIds,
        items,
      })
      .then(setIssuedId, (err: unknown) => setProblem(errorText(err)))
      .finally(() => setBusy(false));
  };

  return (
    <form className="kab-stack" onSubmit={submit} noValidate>
      <h1 className="t-h1">{t.title}</h1>

      <Card title={t.whom}>
        <div className="field">
          <FieldLabel htmlFor={`${id}-class`}>{t.wholeClass}</FieldLabel>
          <Select
            id={`${id}-class`}
            value={cls ?? ''}
            onChange={(e) => setClassId(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">{t.noClass}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.students.length})
              </option>
            ))}
          </Select>
        </div>
        <p className="field__label kab-sub">{t.students}</p>
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
      </Card>

      <Card>
        <div className="field">
          <FieldLabel htmlFor={`${id}-title`}>{t.name}</FieldLabel>
          <Input
            id={`${id}-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor={`${id}-note`}>{t.note}</FieldLabel>
          <Input
            id={`${id}-note`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
          />
        </div>
        <div className="field">
          <FieldLabel htmlFor={`${id}-due`}>{t.due}</FieldLabel>
          <Input
            id={`${id}-due`}
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </Card>

      <Card title={t.tasks}>
        <div className="kab-stack kab-stack--tight">
          {items.map((item, i) => (
            <ItemRow
              key={i}
              item={item}
              index={i}
              onChange={(next) => setItems((list) => list.map((x, k) => (k === i ? next : x)))}
              onRemove={
                items.length > 1 ? () => setItems((list) => list.filter((_, k) => k !== i)) : null
              }
            />
          ))}
        </div>
        {items.length < 30 ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setItems((list) => [...list, { taskNo: firstTask, prototypeCode: null, count: 5 }])
            }
          >
            {t.addTask}
          </Button>
        ) : null}
      </Card>

      {problem !== null ? <FieldMessage tone="error">{problem}</FieldMessage> : null}
      <div>
        <Button type="submit" size="lg" disabled={!canSubmit} loading={busy}>
          {t.submit}
        </Button>
      </div>
    </form>
  );
}
