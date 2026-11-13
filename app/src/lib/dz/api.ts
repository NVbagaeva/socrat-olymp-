'use client';

/**
 * Классы и домашние задания в базе (docs/kabinet-dz-8.md).
 *
 * Только то, что разрешают правила доступа: репетитор видит свои классы,
 * своих учеников и свои ДЗ с ключами; ученик — свои ДЗ без ключей, а
 * ответ проверяет база (homework_check). Модуль грузится динамически —
 * в первую загрузку страниц сайта SDK не попадает.
 */

import { getClient } from '@/lib/auth/client';
import { currentUser } from '@/lib/auth/session';
import type {
  AnswerKind,
  AttemptsLimit,
  HwAnswerView,
  HwCheck,
  HwIssuePartsInput,
  HwOrigin,
  HwPartView,
  HwRecipientView,
  HwSolution,
  HwTaskView,
  HwView,
  RazborDz,
  SolutionsWhen,
  VidDz,
} from './types';

/** Ошибка базы: стабильный код из начала сообщения («bad_code: …»). */
export class DzError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function fail(error: { message?: string } | null): never {
  const message = error?.message ?? 'unknown';
  const code = /^([a-z_]+)(?::|$)/.exec(message)?.[1] ?? 'unknown';
  throw new DzError(code, message);
}

function me(): string {
  const user = currentUser();
  if (user === null) throw new DzError('no_session', 'no_session');
  return user.id;
}

/* ── Классы ────────────────────────────────────────────────────── */

export interface ClassMember {
  userId: string;
  /** Имя из профиля ученика. */
  name: string;
  /** Как ученика называет репетитор; null — как в профиле. */
  alias: string | null;
  joinedAt: string;
}

export interface TutorClass {
  id: string;
  name: string;
  joinCode: string;
  joinOpen: boolean;
  createdAt: string;
  members: ClassMember[];
}

interface ClassRow {
  id: string;
  name: string;
  join_code: string;
  join_open: boolean;
  created_at: string;
}

export { memberNameOf as memberName } from './names';
import { memberNameOf as memberName } from './names';

async function studentNames(
  ids: readonly string[],
): Promise<Map<string, { name: string; alias: string | null }>> {
  const supabase = await getClient();
  if (ids.length === 0) return new Map();
  const [people, links] = await Promise.all([
    supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', [...ids]),
    /* Псевдоним видит только репетитор: представление my_students отдаёт его строки. */
    supabase
      .from('my_students')
      .select('user_id, alias')
      .in('user_id', [...ids]),
  ]);
  const alias = new Map(
    ((links.data ?? []) as { user_id: string; alias: string | null }[]).map((r) => [
      r.user_id,
      r.alias,
    ]),
  );
  return new Map(
    ((people.data ?? []) as { user_id: string; display_name: string }[]).map((r) => [
      r.user_id,
      { name: r.display_name, alias: alias.get(r.user_id) ?? null },
    ]),
  );
}

export async function loadTutorClasses(): Promise<TutorClass[]> {
  const supabase = await getClient();
  const classes = await supabase
    .from('classes')
    .select('id, name, join_code, join_open, created_at')
    .eq('tutor_id', me())
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (classes.error) fail(classes.error);
  const rows = (classes.data ?? []) as ClassRow[];
  if (rows.length === 0) return [];
  const members = await supabase
    .from('class_members')
    .select('class_id, user_id, joined_at')
    .in(
      'class_id',
      rows.map((r) => r.id),
    );
  if (members.error) fail(members.error);
  const list = (members.data ?? []) as { class_id: string; user_id: string; joined_at: string }[];
  const names = await studentNames([...new Set(list.map((m) => m.user_id))]);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    joinOpen: row.join_open,
    createdAt: row.created_at,
    members: list
      .filter((m) => m.class_id === row.id)
      .map((m) => ({
        userId: m.user_id,
        name: names.get(m.user_id)?.name ?? '',
        alias: names.get(m.user_id)?.alias ?? null,
        joinedAt: m.joined_at,
      }))
      .sort((a, b) => memberName(a).localeCompare(memberName(b), 'ru')),
  }));
}

export async function createClass(name: string): Promise<string> {
  const supabase = await getClient();
  const result = await supabase
    .from('classes')
    .insert({ tutor_id: me(), name: name.trim() })
    .select('id')
    .single();
  if (result.error) fail(result.error);
  return (result.data as { id: string }).id;
}

export async function renameClass(id: string, name: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.from('classes').update({ name: name.trim() }).eq('id', id);
  if (result.error) fail(result.error);
}

export async function setJoinOpen(id: string, open: boolean): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.from('classes').update({ join_open: open }).eq('id', id);
  if (result.error) fail(result.error);
}

export async function rotateCode(id: string): Promise<string> {
  const supabase = await getClient();
  const result = await supabase.rpc('rotate_class_code', { p_class: id });
  if (result.error) fail(result.error);
  return result.data as string;
}

export async function archiveClass(id: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase
    .from('classes')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (result.error) fail(result.error);
}

export async function removeMember(classId: string, userId: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('user_id', userId);
  if (result.error) fail(result.error);
}

export async function setAlias(userId: string, alias: string): Promise<void> {
  const supabase = await getClient();
  const value = alias.trim();
  const result = await supabase
    .from('tutor_students')
    .update({ alias: value === '' ? null : value })
    .eq('tutor_id', me())
    .eq('user_id', userId);
  if (result.error) fail(result.error);
}

export interface Joined {
  classId: string;
  className: string;
  tutorName: string;
}

export async function joinClass(code: string): Promise<Joined> {
  const supabase = await getClient();
  const result = await supabase.rpc('join_class', { p_code: code });
  if (result.error) fail(result.error);
  /* Неверный код база возвращает данными, а не ошибкой: иначе откатилась
     бы и запись о неудачной попытке, и лимит попыток не работал бы. */
  const data = result.data as
    | { class_id: string; class_name: string; tutor_name: string; error?: undefined }
    | { error: string };
  if (data.error !== undefined) throw new DzError(data.error, data.error);
  return { classId: data.class_id, className: data.class_name, tutorName: data.tutor_name ?? '' };
}

/* ── Домашние задания ──────────────────────────────────────────── */

interface HomeworkRow {
  id: string;
  tutor_id: string;
  class_id: string | null;
  title: string;
  note: string | null;
  due_at: string | null;
  created_at: string;
  closed_at: string | null;
  task_no: number | null;
  sections: number[] | null;
  attempts_limit: number | null;
  solutions_when: SolutionsWhen;
  show_memo: boolean;
  show_example: boolean;
  no_hints: boolean;
  individual: boolean;
  origin: HwOrigin;
  parent_id: string | null;
}

const HOMEWORK_COLUMNS =
  'id, tutor_id, class_id, title, note, due_at, created_at, closed_at, task_no, sections, ' +
  'attempts_limit, solutions_when, show_memo, show_example, no_hints, individual, origin, parent_id';

function hwView(row: HomeworkRow): HwView {
  return {
    id: row.id,
    tutorId: row.tutor_id,
    classId: row.class_id,
    title: row.title,
    note: row.note ?? '',
    dueAt: row.due_at,
    createdAt: row.created_at,
    closedAt: row.closed_at,
    taskNo: row.task_no ?? row.sections?.[0] ?? 8,
    sections: row.sections ?? (row.task_no === null ? [] : [row.task_no]),
    attemptsLimit: (row.attempts_limit ?? null) as AttemptsLimit,
    solutionsWhen: row.solutions_when,
    showMemo: row.show_memo,
    showExample: row.show_example,
    noHints: row.no_hints,
    individual: row.individual,
    origin: row.origin,
    parentId: row.parent_id,
  };
}

/** Выдать ДЗ из пунктов (issue_homework_parts). Возвращает id. */
export async function issueHomeworkParts(input: HwIssuePartsInput): Promise<string> {
  const supabase = await getClient();
  const s = input.settings;
  const result = await supabase.rpc('issue_homework_parts', {
    p: {
      title: s.title.trim(),
      note: s.note.trim(),
      due_at: s.dueAt,
      class_id: input.classId,
      students: input.students,
      attempts_limit: s.attemptsLimit,
      solutions_when: s.solutionsWhen,
      show_memo: s.showMemo,
      show_example: s.showExample,
      no_hints: s.noHints,
      origin: input.origin,
      parent_id: input.parentId,
      parts: input.parts.map((p) => ({
        source: p.source,
        task_no: p.taskNo,
        ref: p.ref,
        title_html: p.titleHtml,
        rule: p.rule,
        per_student: p.perStudent,
        comment: p.comment,
        tasks: p.units.map((u) => ({
          student_id: u.studentId,
          kind: u.kind,
          ref: u.ref,
          answer_kind: u.answerKind,
          question_html: u.questionHtml,
          view: u.view,
          answer: u.answer,
          razbor: u.razbor,
          source: u.source,
        })),
      })),
    },
  });
  if (result.error) fail(result.error);
  return result.data as string;
}

/** ДЗ в списке: само задание и как идут дела у получателей. */
export interface HwListItem {
  hw: HwView;
  /** Ученику — его строка; репетитору — все получатели. */
  recipients: HwRecipientView[];
  /**
   * Сколько дел у ученика: задача — одно, набор карточек — одно (как в
   * пределе 60). Репетитору — у самого загруженного ученика.
   */
  tasks: number;
  /** Ученику: сколько дел сделано (задача закрыта, все карточки набора пройдены). */
  done: number;
  /** Ученику: сколько задач закрыто верно. */
  right: number;
}

interface TaskRowLite {
  id: string;
  homework_id: string;
  student_id: string | null;
  part_id: string;
}

/** Дела ученика в ДЗ: задача — одно, набор карточек — одно. */
export function delaUchenika(
  tasks: readonly { id: string; partId: string; studentId: string | null }[],
  cardParts: ReadonlySet<string>,
  studentId: string,
  closed: ReadonlySet<string>,
): { vsego: number; sdelano: number } {
  const mine = tasks.filter((t) => t.studentId === null || t.studentId === studentId);
  const nabory = new Map<string, boolean>();
  let vsego = 0;
  let sdelano = 0;
  for (const t of mine) {
    if (cardParts.has(t.partId)) {
      nabory.set(t.partId, (nabory.get(t.partId) ?? true) && closed.has(t.id));
    } else {
      vsego += 1;
      if (closed.has(t.id)) sdelano += 1;
    }
  }
  for (const done of nabory.values()) {
    vsego += 1;
    if (done) sdelano += 1;
  }
  return { vsego, sdelano };
}

export async function listHomework(role: 'tutor' | 'student'): Promise<HwListItem[]> {
  const supabase = await getClient();
  const uid = me();
  /* Только ДЗ кабинета (у пробного кабинета разделов нет). */
  const query = supabase.from('homework').select(HOMEWORK_COLUMNS).not('sections', 'is', null);
  const hw = await (role === 'tutor' ? query.eq('tutor_id', uid) : query).order('created_at', {
    ascending: false,
  });
  if (hw.error) fail(hw.error);
  const rows = (hw.data ?? []) as unknown as HomeworkRow[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [recipients, tasks, parts, answers] = await Promise.all([
    supabase
      .from('homework_recipients')
      .select('homework_id, user_id, started_at, submitted_at')
      .in('homework_id', ids),
    supabase
      .from('homework_tasks')
      .select('id, homework_id, student_id, part_id')
      .in('homework_id', ids),
    supabase.from('homework_parts').select('id, source').in('homework_id', ids),
    role === 'student'
      ? supabase.from('homework_answers').select('task_id, state').eq('user_id', uid)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (recipients.error) fail(recipients.error);
  if (tasks.error) fail(tasks.error);
  if (parts.error) fail(parts.error);
  const recipientRows = (recipients.data ?? []) as {
    homework_id: string;
    user_id: string;
    started_at: string | null;
    submitted_at: string | null;
  }[];
  const taskRows = (tasks.data ?? []) as TaskRowLite[];
  const cardParts = new Set(
    ((parts.data ?? []) as { id: string; source: string }[])
      .filter((p) => p.source === 'kartochki')
      .map((p) => p.id),
  );
  const answerRows = (answers.data ?? []) as { task_id: string; state: string }[];
  const closed = new Set(answerRows.filter((a) => a.state !== 'open').map((a) => a.task_id));
  const rightIds = new Set(answerRows.filter((a) => a.state === 'right').map((a) => a.task_id));
  const names =
    role === 'tutor'
      ? await studentNames([...new Set(recipientRows.map((r) => r.user_id))])
      : new Map<string, { name: string; alias: string | null }>();
  return rows.map((row) => {
    const own = taskRows
      .filter((t) => t.homework_id === row.id)
      .map((t) => ({ id: t.id, partId: t.part_id, studentId: t.student_id }));
    const rec = recipientRows.filter((r) => r.homework_id === row.id);
    const dela =
      role === 'student'
        ? delaUchenika(own, cardParts, uid, closed)
        : {
            vsego: Math.max(
              0,
              ...rec.map((r) => delaUchenika(own, cardParts, r.user_id, closed).vsego),
            ),
            sdelano: 0,
          };
    return {
      hw: hwView(row),
      recipients: rec.map((r) => ({
        userId: r.user_id,
        name: names.get(r.user_id) ? memberName(names.get(r.user_id)!) : '',
        startedAt: r.started_at,
        submittedAt: r.submitted_at,
      })),
      tasks: dela.vsego,
      done: dela.sdelano,
      right: own.filter(
        (t) => (t.studentId === null || t.studentId === uid) && rightIds.has(t.id),
      ).length,
    };
  });
}

/** Ключ задачи — только репетитору ДЗ. */
export interface HwKeyView {
  taskId: string;
  ref: string;
  answer: string;
  razbor: RazborDz;
  source: string;
}

/** Всё о ДЗ, что разрешено вошедшему. Ключи — только у репетитора. */
export interface HwFull {
  hw: HwView;
  parts: HwPartView[];
  tasks: HwTaskView[];
  recipients: HwRecipientView[];
  answers: HwAnswerView[];
  /** Ключи по id задачи — только репетитору. */
  keys: Map<string, HwKeyView>;
  /** Когда загружено, мс: «срок прошёл» считается от него. */
  loadedAt: number;
}

export async function loadHomework(id: string): Promise<HwFull | null> {
  const supabase = await getClient();
  const hw = await supabase.from('homework').select(HOMEWORK_COLUMNS).eq('id', id).maybeSingle();
  if (hw.error) fail(hw.error);
  if (hw.data === null) return null;
  const view = hwView(hw.data as unknown as HomeworkRow);
  const tutor = view.tutorId === me();
  const [parts, tasks, recipients] = await Promise.all([
    supabase
      .from('homework_parts')
      .select('id, position, source, task_no, ref, title_html, rule, per_student, comment')
      .eq('homework_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('homework_tasks')
      .select('id, position, kind, question_html, comment, student_id, part_id, answer_kind, view')
      .eq('homework_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('homework_recipients')
      .select('user_id, started_at, submitted_at')
      .eq('homework_id', id),
  ]);
  if (parts.error) fail(parts.error);
  if (tasks.error) fail(tasks.error);
  if (recipients.error) fail(recipients.error);
  const taskIds = ((tasks.data ?? []) as { id: string }[]).map((t) => t.id);
  const [answers, keys] = await Promise.all([
    taskIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from('homework_answers')
          .select('task_id, user_id, state, attempts, entries, seconds')
          .in('task_id', taskIds),
    tutor && taskIds.length > 0
      ? supabase
          .from('homework_keys')
          .select('task_id, ref, answer, razbor, source')
          .in('task_id', taskIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (answers.error) fail(answers.error);
  if (keys.error) fail(keys.error);
  const recipientRows = (recipients.data ?? []) as {
    user_id: string;
    started_at: string | null;
    submitted_at: string | null;
  }[];
  const names = tutor
    ? await studentNames(recipientRows.map((r) => r.user_id))
    : new Map<string, { name: string; alias: string | null }>();
  return {
    hw: view,
    loadedAt: Date.now(),
    parts: (
      (parts.data ?? []) as {
        id: string;
        position: number;
        source: HwPartView['source'];
        task_no: number;
        ref: string;
        title_html: string;
        rule: Record<string, unknown> | null;
        per_student: boolean;
        comment: string | null;
      }[]
    ).map((p) => ({
      id: p.id,
      position: p.position,
      source: p.source,
      taskNo: p.task_no,
      ref: p.ref,
      titleHtml: p.title_html,
      rule: p.rule ?? {},
      perStudent: p.per_student,
      comment: p.comment,
    })),
    tasks: (
      (tasks.data ?? []) as {
        id: string;
        position: number;
        kind: string;
        question_html: string;
        comment: string | null;
        student_id: string | null;
        part_id: string;
        answer_kind: AnswerKind | null;
        view: VidDz | null;
      }[]
    ).map((t) => ({
      id: t.id,
      position: t.position,
      kind: t.kind,
      questionHtml: t.question_html,
      comment: t.comment,
      studentId: t.student_id,
      partId: t.part_id,
      answerKind: t.answer_kind ?? 'number',
      view: t.view ?? {},
    })),
    recipients: recipientRows
      .map((r) => ({
        userId: r.user_id,
        name: names.get(r.user_id) ? memberName(names.get(r.user_id)!) : '',
        startedAt: r.started_at,
        submittedAt: r.submitted_at,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    answers: (
      (answers.data ?? []) as {
        task_id: string;
        user_id: string;
        state: HwAnswerView['state'];
        attempts: number;
        entries: HwAnswerView['entries'] | null;
        seconds: number;
      }[]
    ).map((a) => ({
      taskId: a.task_id,
      userId: a.user_id,
      state: a.state,
      attempts: a.attempts,
      entries: a.entries ?? [],
      seconds: a.seconds,
    })),
    keys: new Map(
      (
        (keys.data ?? []) as {
          task_id: string;
          ref: string;
          answer: string;
          razbor: RazborDz;
          source: string | null;
        }[]
      ).map((k) => [
        k.task_id,
        { taskId: k.task_id, ref: k.ref, answer: k.answer, razbor: k.razbor, source: k.source ?? '' },
      ]),
    ),
  };
}

export async function startHomework(id: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.rpc('start_homework', { p_homework: id });
  if (result.error) fail(result.error);
}

export async function submitHomework(id: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.rpc('submit_homework', { p_homework: id });
  if (result.error) fail(result.error);
}

export async function checkAnswer(
  taskId: string,
  answer: string,
  seconds: number,
): Promise<HwCheck> {
  const supabase = await getClient();
  const result = await supabase.rpc('homework_check', {
    p_task: taskId,
    p_answer: answer,
    p_seconds: Math.max(0, Math.round(seconds)),
  });
  if (result.error) fail(result.error);
  return result.data as HwCheck;
}

/** Отметка карточки-самооценки: «Знаю» (known) или «Повторить» (repeat). */
export async function markCard(
  taskId: string,
  mark: 'known' | 'repeat',
  seconds: number,
): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.rpc('homework_mark', {
    p_task: taskId,
    p_mark: mark,
    p_seconds: Math.max(0, Math.round(seconds)),
  });
  if (result.error) fail(result.error);
}

export async function revealSolution(taskId: string): Promise<RazborDz> {
  const supabase = await getClient();
  const result = await supabase.rpc('homework_reveal', { p_task: taskId });
  if (result.error) fail(result.error);
  return result.data as RazborDz;
}

/** Решение, если его уже можно показать; иначе null. */
export async function loadSolution(taskId: string): Promise<HwSolution | null> {
  const supabase = await getClient();
  const result = await supabase.rpc('homework_solution', { p_task: taskId });
  if (result.error) {
    if (/^not_yet/.test(result.error.message ?? '')) return null;
    fail(result.error);
  }
  return result.data as HwSolution;
}

export async function updateHomework(
  id: string,
  patch: { note?: string; dueAt?: string | null; closed?: boolean },
): Promise<void> {
  const supabase = await getClient();
  const row: Record<string, unknown> = {};
  if (patch.note !== undefined) row.note = patch.note.trim() === '' ? null : patch.note.trim();
  if (patch.dueAt !== undefined) row.due_at = patch.dueAt;
  if (patch.closed !== undefined) row.closed_at = patch.closed ? new Date().toISOString() : null;
  const result = await supabase.from('homework').update(row).eq('id', id);
  if (result.error) fail(result.error);
}

/** Комментарий репетитора к пункту ДЗ. */
export async function updatePartComment(partId: string, comment: string): Promise<void> {
  const supabase = await getClient();
  const value = comment.trim();
  const result = await supabase
    .from('homework_parts')
    .update({ comment: value === '' ? null : value })
    .eq('id', partId);
  if (result.error) fail(result.error);
}

/* ── Черновик и шаблоны ────────────────────────────────────────── */

/** Черновик ДЗ репетитора; null — пусто. */
export async function loadDraft(): Promise<{ body: unknown; updatedAt: string } | null> {
  const supabase = await getClient();
  const result = await supabase
    .from('homework_drafts')
    .select('body, updated_at')
    .eq('user_id', me())
    .maybeSingle();
  if (result.error) fail(result.error);
  const row = result.data as { body: unknown; updated_at: string } | null;
  return row === null ? null : { body: row.body, updatedAt: row.updated_at };
}

export async function saveDraft(body: object): Promise<void> {
  const supabase = await getClient();
  const result = await supabase
    .from('homework_drafts')
    .upsert({ user_id: me(), body, updated_at: new Date().toISOString() });
  if (result.error) fail(result.error);
}

export async function clearDraft(): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.from('homework_drafts').delete().eq('user_id', me());
  if (result.error) fail(result.error);
}

export interface HwTemplate {
  id: string;
  title: string;
  body: unknown;
  updatedAt: string;
}

export async function listTemplates(): Promise<HwTemplate[]> {
  const supabase = await getClient();
  const result = await supabase
    .from('homework_templates')
    .select('id, title, body, updated_at')
    .eq('user_id', me())
    .order('updated_at', { ascending: false });
  if (result.error) fail(result.error);
  return ((result.data ?? []) as { id: string; title: string; body: unknown; updated_at: string }[]).map(
    (t) => ({ id: t.id, title: t.title, body: t.body, updatedAt: t.updated_at }),
  );
}

export async function saveTemplate(title: string, body: object): Promise<string> {
  const supabase = await getClient();
  const result = await supabase
    .from('homework_templates')
    .insert({ user_id: me(), title: title.trim(), body })
    .select('id')
    .single();
  if (result.error) fail(result.error);
  return (result.data as { id: string }).id;
}

export async function deleteTemplate(id: string): Promise<void> {
  const supabase = await getClient();
  const result = await supabase.from('homework_templates').delete().eq('id', id);
  if (result.error) fail(result.error);
}
