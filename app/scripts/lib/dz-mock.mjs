/* scripts/lib/dz-mock.mjs — классы и домашние задания в моке службы входа.

   Подключается к моку scripts/check-auth.mjs: тот разбирает вход и
   токены, этот — таблицы и функции этапа 3 (docs/kabinet-dz-8.md) так,
   как их видит браузер через PostgREST. Правила доступа и проверка
   ответа повторяют миграцию 20261111120000_dz.sql в упрощённом виде;
   сама миграция проверяется на настоящей базе (pnpm test:soglasiya-sql),
   здесь — экраны сайта. */

import crypto from 'node:crypto';
import { requireSrc } from './load-ts.mjs';

/* Проверка ответа — та же, что у сайта и базы (lib/otvet/proverkaDz.ts,
   таблица примеров proverkaDzCases.json). */
const { proveritOtvetDz, normalizeEge: normalizeEgeTs } = requireSrc('lib/otvet/proverkaDz.ts');
export const proveritMock = (input, answer) => proveritOtvetDz(String(input ?? ''), answer);

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Ошибка PostgREST: supabase-js кладёт message в error.message. */
const pgErr = (status, message) => ({
  status,
  body: { code: 'P0001', message, details: null, hint: null },
});

/** normalize_ege_answer: целое или конечная десятичная дробь, иначе null. */
export const normalizeEge = (raw) => normalizeEgeTs(String(raw ?? ''));

/** Фильтры PostgREST из адреса: eq., in.(…), is.null, not.is.null; order. */
export function applyFilters(rows, params) {
  let out = [...rows];
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'].includes(key)) continue;
    const value = String(raw);
    if (value.startsWith('eq.')) {
      const want = value.slice(3);
      out = out.filter((r) => String(r[key]) === want);
    } else if (value.startsWith('in.(')) {
      const list = value
        .slice(4, -1)
        .split(',')
        .map((s) => s.trim().replace(/^"(.*)"$/, '$1'));
      out = out.filter((r) => list.includes(String(r[key])));
    } else if (value === 'is.null') {
      out = out.filter((r) => r[key] === null || r[key] === undefined);
    } else if (value === 'not.is.null') {
      out = out.filter((r) => r[key] !== null && r[key] !== undefined);
    }
  }
  const order = params.get('order');
  if (order) {
    const [col, dir = 'asc'] = order.split('.');
    out.sort(
      (a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (dir === 'desc' ? -1 : 1),
    );
  }
  return out;
}

export function createDzMock({ profiles, classes, members }) {
  const links = []; // { tutor_id, user_id, alias, ended_at }
  const tries = []; // { user_id, at }
  const homework = [];
  const recipients = [];
  const tasks = [];
  const keys = [];
  const answers = [];

  const newCode = () => {
    for (;;) {
      const code = Array.from(
        { length: 6 },
        () => ALPHABET[crypto.randomInt(ALPHABET.length)],
      ).join('');
      if (!classes.some((k) => k.join_code === code)) return code;
    }
  };
  /* Классы из тестовых данных (seedClass) — с кодом, как после миграции. */
  const ensureCodes = () => {
    for (const k of classes) {
      k.join_code ??= newCode();
      if (k.join_open === undefined) k.join_open = true;
    }
  };
  const roleOf = (id) => profiles.get(id)?.role ?? null;
  const nameOf = (id) => profiles.get(id)?.display_name ?? '';
  const hwById = (id) => homework.find((h) => h.id === id);
  const taskById = (id) => tasks.find((t) => t.id === id);
  const recipientOf = (hwId, uid) =>
    recipients.find((r) => r.homework_id === hwId && r.user_id === uid);
  const answerOf = (taskId, uid) => answers.find((a) => a.task_id === taskId && a.user_id === uid);

  const canSeeTask = (task, uid) => {
    const hw = hwById(task.homework_id);
    if (hw === undefined) return false;
    if (hw.tutor_id === uid) return true;
    return (
      recipientOf(hw.id, uid) !== undefined && (task.student_id === null || task.student_id === uid)
    );
  };

  const solutionReady = (task, uid) => {
    const hw = hwById(task.homework_id);
    if (hw.tutor_id === uid) return true;
    const rec = recipientOf(hw.id, uid);
    if (rec === undefined) return false;
    if (hw.solutions_when === 'instant') {
      return ['right', 'wrong', 'revealed'].includes(answerOf(task.id, uid)?.state ?? 'open');
    }
    if (hw.solutions_when === 'after_submit')
      return rec.submitted_at !== null || hw.closed_at !== null;
    return hw.due_at !== null && Date.parse(hw.due_at) < Date.now();
  };

  const visibleHomework = (uid) =>
    homework.filter((h) => h.tutor_id === uid || recipientOf(h.id, uid) !== undefined);

  /** Ответ на запрос к таблицам и функциям этапа 3 или null — не наше. */
  function handle(table, method, u, body, me, prefersObject) {
    const params = u.searchParams;
    const one = (rows) =>
      prefersObject ? { status: 200, body: rows[0] ?? null } : { status: 200, body: rows };

    /* ── Классы ── */
    if (table === 'classes') {
      ensureCodes();
      if (method === 'GET') {
        const visible = classes.filter(
          (k) =>
            k.tutor_id === me.id || members.some((m) => m.class_id === k.id && m.user_id === me.id),
        );
        return one(applyFilters(visible, params));
      }
      if (method === 'POST') {
        if (roleOf(me.id) !== 'tutor')
          return pgErr(403, 'new row violates row-level security policy');
        const row = {
          id: crypto.randomUUID(),
          tutor_id: me.id,
          name: String(body.name ?? '').trim(),
          created_at: new Date().toISOString(),
          archived_at: null,
          join_code: newCode(),
          join_open: true,
        };
        if (row.name === '') return pgErr(400, 'violates check constraint "classes_name_check"');
        classes.push(row);
        return { status: 201, body: prefersObject ? row : [row] };
      }
      if (method === 'PATCH') {
        const rows = applyFilters(
          classes.filter((k) => k.tutor_id === me.id),
          params,
        );
        for (const row of rows) {
          for (const k of ['name', 'join_open', 'archived_at']) if (k in body) row[k] = body[k];
        }
        return { status: 200, body: prefersObject ? (rows[0] ?? null) : rows };
      }
    }
    if (table === 'class_members') {
      if (method === 'GET') {
        const visible = members.filter((m) => {
          const k = classes.find((c) => c.id === m.class_id);
          return m.user_id === me.id || k?.tutor_id === me.id;
        });
        return one(
          applyFilters(
            visible.map((m) => ({ joined_at: m.joined_at ?? '2026-11-01T00:00:00Z', ...m })),
            params,
          ),
        );
      }
      if (method === 'DELETE') {
        const own = new Set(classes.filter((k) => k.tutor_id === me.id).map((k) => k.id));
        const doomed = new Set(
          applyFilters(
            members.filter((m) => own.has(m.class_id)),
            params,
          ),
        );
        for (let i = members.length - 1; i >= 0; i -= 1)
          if (doomed.has(members[i])) members.splice(i, 1);
        return { status: 204, body: null };
      }
    }
    if (table === 'my_students' && method === 'GET') {
      const ids = new Set([
        ...links.filter((l) => l.tutor_id === me.id).map((l) => l.user_id),
        ...members
          .filter((m) => classes.some((k) => k.id === m.class_id && k.tutor_id === me.id))
          .map((m) => m.user_id),
      ]);
      const rows = [...ids].map((id) => ({
        user_id: id,
        alias: links.find((l) => l.tutor_id === me.id && l.user_id === id)?.alias ?? null,
      }));
      return one(applyFilters(rows, params));
    }
    if (table === 'tutor_students' && method === 'PATCH') {
      const userId = (params.get('user_id') ?? '').replace(/^eq\./, '');
      let link = links.find((l) => l.tutor_id === me.id && l.user_id === userId);
      if (link === undefined) {
        link = { tutor_id: me.id, user_id: userId, alias: null, ended_at: null };
        links.push(link);
      }
      if ('alias' in body) link.alias = body.alias;
      return { status: 200, body: [] };
    }
    if (table === 'rpc/rotate_class_code' && method === 'POST') {
      const k = classes.find((c) => c.id === body.p_class && c.tutor_id === me.id);
      if (k === undefined) return pgErr(403, 'forbidden: чужой класс');
      k.join_code = newCode();
      return { status: 200, body: k.join_code };
    }
    if (table === 'rpc/join_class' && method === 'POST') {
      ensureCodes();
      if (roleOf(me.id) !== 'student') return pgErr(403, 'forbidden: вступает ученик');
      const hour = Date.now() - 3600 * 1000;
      if (tries.filter((t) => t.user_id === me.id && t.at > hour).length >= 10) {
        return pgErr(400, 'too_many_tries: попробуйте через час');
      }
      const code = String(body.p_code ?? '')
        .toUpperCase()
        .replace(/[\s-]/g, '');
      const k = classes.find((c) => c.join_code === code && c.join_open && c.archived_at === null);
      if (k === undefined) {
        tries.push({ user_id: me.id, at: Date.now() });
        return { status: 200, body: { error: 'bad_code' } };
      }
      const link = links.find((l) => l.tutor_id === k.tutor_id && l.user_id === me.id);
      if (link === undefined)
        links.push({ tutor_id: k.tutor_id, user_id: me.id, alias: null, ended_at: null });
      else link.ended_at = null;
      if (!members.some((m) => m.class_id === k.id && m.user_id === me.id)) {
        members.push({ class_id: k.id, user_id: me.id, joined_at: new Date().toISOString() });
      }
      return {
        status: 200,
        body: { class_id: k.id, class_name: k.name, tutor_name: nameOf(k.tutor_id) },
      };
    }

    /* ── Домашние задания ── */
    if (table === 'homework') {
      if (method === 'GET') return one(applyFilters(visibleHomework(me.id), params));
      if (method === 'PATCH') {
        const rows = applyFilters(
          homework.filter((h) => h.tutor_id === me.id),
          params,
        );
        for (const row of rows)
          for (const k of ['note', 'due_at', 'closed_at']) if (k in body) row[k] = body[k];
        return { status: 200, body: [] };
      }
    }
    if (table === 'homework_recipients' && method === 'GET') {
      const visible = recipients.filter((r) => {
        const hw = hwById(r.homework_id);
        return r.user_id === me.id || hw?.tutor_id === me.id;
      });
      return one(applyFilters(visible, params));
    }
    if (table === 'homework_tasks') {
      if (method === 'GET')
        return one(
          applyFilters(
            tasks.filter((t) => canSeeTask(t, me.id)),
            params,
          ),
        );
      if (method === 'PATCH') {
        const rows = applyFilters(
          tasks.filter((t) => hwById(t.homework_id)?.tutor_id === me.id),
          params,
        );
        if ('question_html' in body)
          return pgErr(403, 'permission denied for table homework_tasks');
        for (const row of rows) if ('comment' in body) row.comment = body.comment;
        return { status: 200, body: [] };
      }
    }
    if (table === 'homework_keys' && method === 'GET') {
      const visible = keys.filter(
        (k) => hwById(taskById(k.task_id)?.homework_id)?.tutor_id === me.id,
      );
      return one(applyFilters(visible, params));
    }
    if (table === 'homework_answers' && method === 'GET') {
      const visible = answers.filter(
        (a) => a.user_id === me.id || hwById(taskById(a.task_id)?.homework_id)?.tutor_id === me.id,
      );
      return one(applyFilters(visible, params));
    }
    if (table === 'rpc/issue_homework_tasks' && method === 'POST') {
      const p = body.p ?? {};
      if (roleOf(me.id) !== 'tutor') return pgErr(403, 'forbidden: ДЗ выдаёт репетитор');
      if (p.due_at && Date.parse(p.due_at) <= Date.now()) return pgErr(400, 'bad_due: срок прошёл');
      const list = Array.isArray(p.tasks) ? p.tasks : [];
      if (list.length === 0) return pgErr(400, 'no_tasks: в ДЗ нет задач');
      const students = Array.isArray(p.students) && p.students.length > 0 ? p.students : [];
      if (students.length === 0) return pgErr(400, 'no_recipients: некому выдать');
      for (const t of list)
        if (normalizeEge(t.answer) !== t.answer) return pgErr(400, 'bad_answer');
      const id = crypto.randomUUID();
      homework.push({
        id,
        tutor_id: me.id,
        class_id: p.class_id ?? null,
        title: String(p.title ?? '').trim(),
        note: p.note ? String(p.note) : null,
        due_at: p.due_at ?? null,
        created_at: new Date().toISOString(),
        closed_at: null,
        task_no: p.task_no ?? 8,
        attempts_limit: p.attempts_limit ?? null,
        solutions_when: p.solutions_when ?? 'after_submit',
        show_memo: p.show_memo === true,
        show_example: p.show_example === true,
        individual: p.individual === true,
        origin: p.origin ?? 'kabinet',
        parent_id: p.parent_id ?? null,
      });
      for (const s of students) {
        recipients.push({ homework_id: id, user_id: s, started_at: null, submitted_at: null });
      }
      for (const t of list) {
        const taskId = crypto.randomUUID();
        tasks.push({
          id: taskId,
          homework_id: id,
          student_id: t.student_id ?? null,
          position: t.position,
          kind: t.kind,
          question_html: t.question_html,
          comment: t.comment ?? null,
        });
        keys.push({
          task_id: taskId,
          ref: t.ref,
          answer: t.answer,
          razbor: t.razbor,
          source: t.source ?? null,
        });
      }
      return { status: 200, body: id };
    }
    if (table === 'rpc/start_homework' && method === 'POST') {
      const rec = recipientOf(body.p_homework, me.id);
      if (rec !== undefined) rec.started_at ??= new Date().toISOString();
      return { status: 204, body: null };
    }
    if (table === 'rpc/submit_homework' && method === 'POST') {
      const rec = recipientOf(body.p_homework, me.id);
      const hw = hwById(body.p_homework);
      if (rec === undefined || rec.submitted_at !== null || hw?.closed_at !== null) {
        return pgErr(400, 'cannot_submit: ДЗ закрыто, уже сдано или не ваше');
      }
      rec.started_at ??= new Date().toISOString();
      rec.submitted_at = new Date().toISOString();
      return { status: 204, body: null };
    }
    if (table === 'rpc/homework_check' && method === 'POST') {
      const task = taskById(body.p_task);
      if (
        task === undefined ||
        !canSeeTask(task, me.id) ||
        hwById(task.homework_id).tutor_id === me.id
      ) {
        return pgErr(403, 'not_your_task');
      }
      const hw = hwById(task.homework_id);
      const rec = recipientOf(hw.id, me.id);
      if (hw.closed_at !== null) return pgErr(400, 'homework_closed');
      if (rec.submitted_at !== null) return pgErr(400, 'already_submitted');
      if (
        hw.solutions_when === 'after_due' &&
        hw.due_at !== null &&
        Date.parse(hw.due_at) < Date.now()
      ) {
        return pgErr(400, 'due_passed');
      }
      rec.started_at ??= new Date().toISOString();
      let row = answerOf(task.id, me.id);
      if (row === undefined) {
        row = {
          task_id: task.id,
          user_id: me.id,
          state: 'open',
          attempts: 0,
          entries: [],
          seconds: 0,
        };
        answers.push(row);
      }
      if (row.state !== 'open') return { status: 200, body: { kind: 'closed', state: row.state } };
      const key = keys.find((k) => k.task_id === task.id).answer;
      const raw = String(body.p_answer ?? '').trim();
      const res = proveritMock(body.p_answer, key);
      if (res.kind === 'format' || res.kind === 'fractionRight') return { status: 200, body: res };
      const normal = res.norm;
      const ok = res.kind === 'right';
      row.attempts += 1;
      row.seconds += Math.max(0, Math.min(3600, Number(body.p_seconds) || 0));
      row.entries.push({ a: raw.slice(0, 40), n: normal, ok, at: new Date().toISOString() });
      if (ok) row.state = 'right';
      else if (hw.attempts_limit !== null && row.attempts >= hw.attempts_limit) row.state = 'wrong';
      const left =
        hw.attempts_limit === null ? null : Math.max(0, hw.attempts_limit - row.attempts);
      const solution = solutionReady(task, me.id)
        ? keys.find((k) => k.task_id === task.id).razbor
        : null;
      return {
        status: 200,
        body: {
          kind: ok ? 'right' : 'wrong',
          state: row.state,
          attempts: row.attempts,
          left,
          solution,
        },
      };
    }
    if (table === 'rpc/homework_reveal' && method === 'POST') {
      const task = taskById(body.p_task);
      if (task === undefined || !canSeeTask(task, me.id)) return pgErr(403, 'not_your_task');
      const hw = hwById(task.homework_id);
      const rec = recipientOf(hw.id, me.id);
      if (hw.solutions_when !== 'instant' || hw.closed_at !== null || rec?.submitted_at) {
        return pgErr(400, 'not_allowed');
      }
      let row = answerOf(task.id, me.id);
      if (row === undefined) {
        row = {
          task_id: task.id,
          user_id: me.id,
          state: 'open',
          attempts: 0,
          entries: [],
          seconds: 0,
        };
        answers.push(row);
      }
      if (row.state !== 'open') return pgErr(400, 'not_allowed');
      row.state = 'revealed';
      return { status: 200, body: keys.find((k) => k.task_id === task.id).razbor };
    }
    if (table === 'rpc/homework_solution' && method === 'POST') {
      const task = taskById(body.p_task);
      if (task === undefined || !canSeeTask(task, me.id)) return pgErr(403, 'not_your_task');
      if (!solutionReady(task, me.id)) return pgErr(400, 'not_yet: решение откроется позже');
      const key = keys.find((k) => k.task_id === task.id);
      return { status: 200, body: { razbor: key.razbor, answer: key.answer } };
    }
    return null;
  }

  return { handle, links, homework, recipients, tasks, keys, answers, tries };
}
