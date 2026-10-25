/**
 * Онлайн-вариант в пробном кабинете: те же правила, что у функций базы
 * supabase/migrations/20261025120000_variant_works.sql (issue_variant_work,
 * variant_start, variant_check, variant_save_draft, variant_submit,
 * variant_result).
 *
 * Ключ (variantKeys) читают только функции этого модуля: экраны получают
 * условия без ответа, верный ответ — после «Завершить работу». В пробном
 * режиме всё лежит в браузере, поэтому это правило — договорённость кода;
 * с сервером его обеспечивает база (RLS и security definer).
 */

import { normalizeAnswer } from '@/lib/variant/online/normalize';
import type { KabinetApi } from './api';
import type { Db, DbUser } from './localDb';
import type {
  Person,
  VariantAttemptSummary,
  VariantResult,
  VariantWorkSummary,
  VariantWorkTask,
} from './types';

export interface LocalCtx {
  change: <T>(fn: (db: Db) => T) => T;
  read: () => Db;
  requireRole: (db: Db, ...roles: DbUser['role'][]) => DbUser;
  current: (db: Db) => DbUser;
  myStudents: (db: Db, tutorId: string) => string[];
  personOf: (db: Db, id: string) => Person;
  canSaveProgress: (u: DbUser) => boolean;
  fail: (code: string, message: string) => never;
  newId: () => string;
  now: () => string;
}

type VariantMethods = Pick<
  KabinetApi,
  | 'issueVariantWork'
  | 'variantWork'
  | 'variantStart'
  | 'variantCheck'
  | 'variantSaveDraft'
  | 'variantSubmit'
  | 'variantResult'
>;

const norm = (s: string | null | undefined): string | null => {
  const n = normalizeAnswer(s ?? '');
  return n.ok ? n.value : null;
};

export function workSummary(
  ctx: LocalCtx,
  db: Db,
  w: Db['variantWorks'][number],
): VariantWorkSummary {
  return {
    id: w.id,
    title: w.title,
    kind: w.kind,
    setCode: w.setCode,
    variants: w.variants,
    setVariants: w.setVariants,
    mode: w.mode,
    timer: w.timer,
    tutor: ctx.personOf(db, w.tutorId),
    className: db.classes.find((c) => c.id === w.classId)?.name ?? null,
    dueAt: w.dueAt,
    createdAt: w.createdAt,
    closedAt: w.closedAt,
  };
}

export function attemptSummary(a: Db['variantAttempts'][number]): VariantAttemptSummary {
  return {
    id: a.id,
    variant: a.variant,
    startedAt: a.startedAt,
    deadlineAt: a.deadlineAt,
    finishedAt: a.finishedAt,
    late: a.late,
    primary: a.primary,
    max: a.max,
    seconds: a.seconds,
  };
}

/** Итог завершённой попытки — как variant_result. */
export function resultOf(db: Db, a: Db['variantAttempts'][number]): VariantResult {
  const tasks = db.variantTasks
    .filter((t) => t.workId === a.workId && t.variant === a.variant)
    .sort((x, y) => x.position - y.position);
  return {
    ...attemptSummary(a),
    tasks: tasks.map((t) => {
      const r = db.variantAnswers.find((x) => x.attemptId === a.id && x.position === t.position);
      const k = db.variantKeys.find(
        (x) => x.workId === a.workId && x.variant === a.variant && x.position === t.position,
      );
      return {
        position: t.position,
        egeNo: t.egeNo,
        answer: r?.first ?? null,
        right: r?.firstRight === true,
        second: r?.second ?? null,
        secondRight: r?.secondRight ?? null,
        hinted: r?.hinted ?? false,
        seconds: r?.seconds ?? 0,
        key: k?.answer ?? '',
      };
    }),
  };
}

export function localVariantMethods(ctx: LocalCtx): VariantMethods {
  const { change, read, requireRole, current, myStudents, newId, now } = ctx;
  /* Объявление функции, а не поле: так TypeScript сужает типы после fail(). */
  function fail(code: string, message: string): never {
    return ctx.fail(code, message);
  }

  /** Своя незавершённая попытка — как my_open_attempt. */
  function openAttempt(db: Db, attemptId: string) {
    const me = requireRole(db, 'student');
    const a = db.variantAttempts.find((x) => x.id === attemptId && x.studentId === me.id);
    if (!a) fail('not_your_attempt', 'Это не ваша работа');
    if (a.finishedAt !== null) fail('already_finished', 'Работа уже завершена');
    return a;
  }

  return {
    async issueVariantWork(input) {
      return change((db) => {
        const me = requireRole(db, 'tutor');
        if (input.title.trim() === '') fail('title_required', 'Напишите название');
        if (input.variants.length === 0 || input.variants.some((v) => v.tasks.length === 0)) {
          fail('no_tasks', 'В работе нет заданий');
        }
        if (input.dueAt !== null && input.dueAt <= now()) fail('bad_due', 'Срок уже прошёл');
        const mine = myStudents(db, me.id);
        const ids = new Set(input.studentIds);
        if (input.classId !== null) {
          const c = db.classes.find((x) => x.id === input.classId && x.tutorId === me.id);
          if (!c) fail('forbidden', 'Чужой класс');
          db.members.filter((m) => m.classId === c.id).forEach((m) => ids.add(m.studentId));
        }
        for (const id of ids) {
          if (!mine.includes(id))
            fail('not_your_student', 'Работу можно выдать только своим ученикам');
        }
        if (ids.size === 0) fail('no_recipients', 'Некому выдать: выберите класс или учеников');
        const id = newId();
        for (const v of input.variants) {
          for (const t of v.tasks) {
            const answer = norm(t.answer);
            if (answer === null) fail('bad_answer', `Ответ не в формате ЕГЭ (№${t.egeNo})`);
            const { answer: _a, hints, ...task } = t;
            db.variantTasks.push({ ...task, workId: id, variant: v.variant });
            db.variantKeys.push({
              workId: id,
              variant: v.variant,
              position: t.position,
              answer,
              hints,
            });
          }
        }
        db.variantWorks.push({
          id,
          tutorId: me.id,
          classId: input.classId,
          title: input.title.trim(),
          kind: input.kind,
          setCode: input.setCode,
          variants: input.variants.length,
          setVariants: input.variants.map((v) => v.setVariant),
          mode: input.mode,
          timer: input.timer,
          dueAt: input.dueAt,
          createdAt: now(),
          closedAt: null,
        });
        ids.forEach((studentId) =>
          db.variantRecipients.push({ workId: id, studentId, assignedAt: now() }),
        );
        return id;
      });
    },

    async variantWork(id) {
      const db = read();
      const me = current(db);
      const w = db.variantWorks.find((x) => x.id === id);
      if (!w) return null;
      const owner = w.tutorId === me.id || me.role === 'admin';
      const recipient = db.variantRecipients.some((r) => r.workId === id && r.studentId === me.id);
      if (!owner && !recipient) return null;
      const tasks: VariantWorkTask[][] = Array.from({ length: w.variants }, (_, i) =>
        db.variantTasks
          .filter((t) => t.workId === id && t.variant === i + 1)
          .sort((a, b) => a.position - b.position)
          .map(({ workId: _w, variant: _v, ...t }) => t),
      );
      return {
        work: workSummary(ctx, db, w),
        tasks,
        mine: db.variantAttempts
          .filter((a) => a.workId === id && a.studentId === me.id)
          .map(attemptSummary),
        results: owner
          ? db.variantRecipients
              .filter((r) => r.workId === id)
              .map((r) => ({
                student: ctx.personOf(db, r.studentId),
                attempts: db.variantAttempts
                  .filter(
                    (a) => a.workId === id && a.studentId === r.studentId && a.finishedAt !== null,
                  )
                  .map((a) => resultOf(db, a)),
              }))
          : null,
      };
    },

    async variantStart(workId, variant) {
      return change((db) => {
        const me = requireRole(db, 'student');
        const w = db.variantWorks.find((x) => x.id === workId);
        if (!w || !db.variantRecipients.some((r) => r.workId === workId && r.studentId === me.id)) {
          fail('not_your_work', 'Эта работа выдана не вам');
        }
        if (!ctx.canSaveProgress(me)) fail('progress_not_allowed', 'Ждём согласия родителя');
        if (w.closedAt !== null) fail('work_closed', 'Работа закрыта');
        if (variant < 1 || variant > w.variants) fail('bad_variant', 'Нет такого варианта');
        const open = db.variantAttempts.find(
          (a) =>
            a.workId === workId &&
            a.studentId === me.id &&
            a.variant === variant &&
            a.finishedAt === null,
        );
        if (open) return { attemptId: open.id, deadlineAt: open.deadlineAt, draft: open.draft };
        const a = {
          id: newId(),
          workId,
          studentId: me.id,
          variant,
          startedAt: now(),
          deadlineAt:
            w.mode === 'kontrol' && w.timer.kind === 'down'
              ? new Date(Date.now() + w.timer.minutes * 60_000).toISOString()
              : null,
          finishedAt: null,
          late: false,
          primary: null,
          max: null,
          seconds: null,
          draft: {},
        };
        db.variantAttempts.push(a);
        db.variantTasks
          .filter((t) => t.workId === workId && t.variant === variant)
          .forEach((t) =>
            db.variantAnswers.push({
              attemptId: a.id,
              studentId: me.id,
              position: t.position,
              first: null,
              firstRight: null,
              second: null,
              secondRight: null,
              hinted: false,
              seconds: 0,
            }),
          );
        return { attemptId: a.id, deadlineAt: a.deadlineAt, draft: a.draft };
      });
    },

    async variantCheck(attemptId, position, answer) {
      return change((db) => {
        const a = openAttempt(db, attemptId);
        const w = db.variantWorks.find((x) => x.id === a.workId);
        if (w?.mode !== 'trening')
          fail('kontrol', 'В контрольной ответы проверяются после завершения');
        const value = norm(answer);
        if (value === null) return { verdict: 'format' as const };
        const r = db.variantAnswers.find((x) => x.attemptId === a.id && x.position === position);
        const k = db.variantKeys.find(
          (x) => x.workId === a.workId && x.variant === a.variant && x.position === position,
        );
        if (!r || !k) fail('bad_position', 'Нет такого задания');
        const right = value === k.answer;
        if (r.first === null) {
          r.first = value;
          r.firstRight = right;
          return right
            ? { verdict: 'right' as const }
            : { verdict: 'wrong' as const, hints: k.hints };
        }
        if (r.firstRight === false && r.second === null) {
          r.second = value;
          r.secondRight = right;
          r.hinted = true;
          return { verdict: right ? ('right' as const) : ('wrong' as const) };
        }
        return fail('already_checked', 'Попытки по заданию кончились');
      });
    },

    async variantSaveDraft(attemptId, draft) {
      change((db) => {
        const a = openAttempt(db, attemptId);
        if (JSON.stringify(draft).length > 20_000)
          fail('draft_too_big', 'Черновик слишком большой');
        a.draft = draft;
      });
    },

    async variantSubmit(attemptId, answers, seconds, hinted) {
      return change((db) => {
        const a = openAttempt(db, attemptId);
        const w = db.variantWorks.find((x) => x.id === a.workId);
        const rows = db.variantAnswers.filter((x) => x.attemptId === a.id);
        for (const r of rows) {
          const i = r.position - 1;
          r.first ??= norm(answers[i]);
          r.seconds = Math.min(86_400, Math.max(0, Math.round(seconds[i] ?? r.seconds)));
          r.hinted = r.hinted || hinted.includes(r.position);
          const k = db.variantKeys.find(
            (x) => x.workId === a.workId && x.variant === a.variant && x.position === r.position,
          );
          r.firstRight = r.first !== null && r.first === k?.answer;
        }
        const tasks = db.variantTasks.filter(
          (t) => t.workId === a.workId && t.variant === a.variant,
        );
        const pts = (p: number) => tasks.find((t) => t.position === p)?.points ?? 1;
        const at = Date.now();
        a.finishedAt = new Date(at).toISOString();
        a.late =
          (w?.dueAt != null && at > Date.parse(w.dueAt)) ||
          (a.deadlineAt !== null && at > Date.parse(a.deadlineAt) + 60_000);
        a.seconds = Math.min(
          86_400,
          rows.reduce((s, r) => s + r.seconds, 0),
        );
        a.primary = rows.filter((r) => r.firstRight).reduce((s, r) => s + pts(r.position), 0);
        a.max = tasks.reduce((s, t) => s + t.points, 0);
        return resultOf(db, a);
      });
    },

    async variantResult(attemptId) {
      const db = read();
      const me = current(db);
      const a = db.variantAttempts.find((x) => x.id === attemptId);
      const w = a === undefined ? undefined : db.variantWorks.find((x) => x.id === a.workId);
      if (!a || !(a.studentId === me.id || w?.tutorId === me.id || me.role === 'admin')) {
        fail('not_your_attempt', 'Это не ваша работа');
      }
      if (a.finishedAt === null) fail('not_finished', 'Работа ещё идёт');
      return resultOf(db, a);
    },
  };
}
