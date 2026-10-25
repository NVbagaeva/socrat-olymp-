'use client';

/**
 * Пробный кабинет в браузере — пока у сайта нет сервера.
 *
 * Те же правила, что в базе (supabase/migrations/20261015120000_kabinet.sql):
 * регистрация только по приглашению, администратор один, роль — из
 * приглашения, репетитор видит только своих учеников, ученик — только
 * выданные ему ДЗ, школьник до согласия родителя прогресс не пишет.
 * Проверки «кто что видит» сделаны здесь функциями-представлениями —
 * так же, как политики RLS в базе.
 *
 * Всё лежит в localStorage этого браузера (ключ budetege:kabinet:v1) и
 * никуда не отправляется. Пароль в пробном режиме не хранится: вход —
 * выбором аккаунта. С сервером этот файл заменит реализация поверх
 * Supabase с тем же интерфейсом.
 */

import { documentsVersion } from '@/lib/legal/operator';
import { parentConsentNeeded, type ConsentRecord } from '@/lib/account/consents';
import { KabinetError, type KabinetApi } from './api';
import { KABINET_KEY, readDb, writeDb, type Db, type DbUser } from './localDb';
import {
  localVariantMethods,
  resultOf,
  attemptSummary,
  workSummary,
  type LocalCtx,
} from './localVariant';
import type {
  AttemptOutcome,
  ClassSummary,
  HomeworkItem,
  HomeworkProgress,
  HomeworkSummary,
  Invitation,
  InviteRegistration,
  Me,
  Person,
  TaskProgressRow,
} from './types';

const DAY = 24 * 60 * 60 * 1000;
const INVITE_TTL = 14 * DAY;
/* Без похожих символов (0/O, 1/I) — как create_invitation в базе. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function newCode(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join('');
}

/** Отпечаток кода (FNV-1a): сам код, как и в базе, не хранится. */
export function codeHash(code: string): string {
  let h = 0x811c9dc5;
  for (const ch of code.trim().toUpperCase()) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0') + code.trim().length.toString(16);
}

const now = () => new Date().toISOString();

function fail(code: string, message: string): never {
  throw new KabinetError(code, message);
}

function person(u: DbUser): Person {
  return { id: u.id, role: u.role, name: u.name };
}

export function createLocalApi(): KabinetApi {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === null || e.key === KABINET_KEY) emit();
    });
  }

  /** Изменить базу и сообщить экранам. */
  function change<T>(fn: (db: Db) => T): T {
    const db = readDb();
    const out = fn(db);
    writeDb(db);
    emit();
    return out;
  }

  const user = (db: Db, id: string | null) => db.users.find((u) => u.id === id);
  const personOf = (db: Db, id: string): Person => {
    const u = user(db, id);
    return u ? person(u) : { id, role: 'student', name: 'Удалённый аккаунт' };
  };

  function current(db: Db): DbUser {
    const u = user(db, db.currentUserId);
    if (!u) fail('not_authenticated', 'Войдите в кабинет');
    return u;
  }

  function requireRole(db: Db, ...roles: DbUser['role'][]): DbUser {
    const u = current(db);
    if (!roles.includes(u.role)) fail('forbidden', 'Это действие недоступно для вашей роли');
    return u;
  }

  const myStudents = (db: Db, tutorId: string) =>
    db.links.filter((l) => l.tutorId === tutorId && l.endedAt === null).map((l) => l.studentId);

  const canSaveProgress = (u: DbUser) => !(u.parentEmail !== null && u.parentConfirmedAt === null);

  function toMe(u: DbUser): Me {
    return {
      ...person(u),
      email: u.email,
      grade: u.grade,
      parentPending: u.parentEmail !== null && u.parentConfirmedAt === null,
      parentEmail: u.parentEmail,
      consents: u.consents,
    };
  }

  function invitationView(db: Db, inv: Db['invitations'][number]): Invitation {
    return {
      id: inv.id,
      role: inv.role,
      createdBy: personOf(db, inv.createdBy),
      tutor: inv.tutorId === null ? null : personOf(db, inv.tutorId),
      className: db.classes.find((c) => c.id === inv.classId)?.name ?? null,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy === null ? null : personOf(db, inv.usedBy),
      revokedAt: inv.revokedAt,
    };
  }

  function classSummary(db: Db, id: string): ClassSummary | null {
    const c = db.classes.find((x) => x.id === id && x.archivedAt === null);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      students: db.members.filter((m) => m.classId === c.id).map((m) => personOf(db, m.studentId)),
    };
  }

  function homeworkSummary(db: Db, h: Db['homework'][number]): HomeworkSummary {
    return {
      id: h.id,
      title: h.title,
      note: h.note,
      tutor: personOf(db, h.tutorId),
      className: db.classes.find((c) => c.id === h.classId)?.name ?? null,
      dueAt: h.dueAt,
      createdAt: h.createdAt,
      closedAt: h.closedAt,
      items: h.items,
    };
  }

  /**
   * Выполнение ДЗ у ученика: верные попытки в рамках ДЗ раскладываются
   * по позициям того же номера. Прототип у попытки есть — должен
   * совпасть; нет (тренажёр не знает прототипа) — идёт в любую позицию
   * этого номера.
   */
  function progressOf(db: Db, h: Db['homework'][number], studentId: string): HomeworkProgress {
    const r = db.recipients.find((x) => x.homeworkId === h.id && x.studentId === studentId);
    const doneByItem = h.items.map(() => 0);
    for (const a of db.attempts) {
      if (a.homeworkId !== h.id || a.studentId !== studentId || a.outcome !== 'right') continue;
      const i = h.items.findIndex(
        (item, k) =>
          item.taskNo === a.taskNo &&
          (item.prototypeCode === null ||
            a.prototypeCode === null ||
            item.prototypeCode === a.prototypeCode) &&
          (doneByItem[k] ?? 0) < item.count,
      );
      if (i >= 0) doneByItem[i] = (doneByItem[i] ?? 0) + 1;
    }
    return {
      student: personOf(db, studentId),
      startedAt: r?.startedAt ?? null,
      submittedAt: r?.submittedAt ?? null,
      doneByItem,
      done: doneByItem.reduce((s, n) => s + n, 0),
      total: h.items.reduce((s, item) => s + item.count, 0),
    };
  }

  function taskProgress(db: Db, studentId: string): TaskProgressRow[] {
    const rows = new Map<number, TaskProgressRow>();
    for (const a of db.attempts) {
      if (a.studentId !== studentId) continue;
      const row = rows.get(a.taskNo) ?? { taskNo: a.taskNo, solved: 0, right: 0, lastAt: null };
      row.solved += 1;
      if (a.outcome === 'right') row.right += 1;
      if (row.lastAt === null || a.solvedAt > row.lastAt) row.lastAt = a.solvedAt;
      rows.set(a.taskNo, row);
    }
    return [...rows.values()];
  }

  function checkForm(form: InviteRegistration, role: DbUser['role']) {
    if (!form.acceptSoglashenie || !form.acceptSoglasie) {
      fail(
        'consents_required',
        'Без согласия с соглашением и на обработку ПДн регистрация невозможна',
      );
    }
    if (form.name.trim() === '') fail('name_required', 'Напишите имя');
    if (role === 'student') {
      if (form.birthYear === null) fail('birth_year_required', 'Ученик указывает год рождения');
      if (parentConsentNeeded(form.birthYear) && !form.parentEmail) {
        fail('parent_email_required', 'Ученику младше 18 нужна почта родителя');
      }
    }
  }

  function newUser(db: Db, form: InviteRegistration, role: DbUser['role']): DbUser {
    const email = form.email.trim().toLowerCase();
    if (db.users.some((u) => u.email === email))
      fail('email_taken', 'Эта почта уже зарегистрирована');
    const at = now();
    const consents: ConsentRecord[] = (['soglashenie', 'soglasie'] as const).map((kind) => ({
      kind,
      version: documentsVersion,
      acceptedAt: at,
      ip: null,
    }));
    const minor =
      role === 'student' && form.birthYear !== null && parentConsentNeeded(form.birthYear);
    const u: DbUser = {
      id: newId(),
      email,
      role,
      name: form.name.trim(),
      grade: role === 'student' ? form.grade : null,
      birthYear: role === 'student' ? form.birthYear : null,
      parentEmail: minor ? (form.parentEmail?.trim().toLowerCase() ?? null) : null,
      parentConfirmedAt: null,
      createdAt: at,
      consents,
    };
    db.users.push(u);
    db.currentUserId = u.id;
    return u;
  }

  function liveInvitation(db: Db, code: string) {
    const hash = codeHash(code);
    const at = now();
    return db.invitations.find(
      (i) => i.codeHash === hash && i.usedAt === null && i.revokedAt === null && i.expiresAt > at,
    );
  }

  /* Онлайн-вариант: те же помощники, что у остальных методов. */
  const variantCtx: LocalCtx = {
    change,
    read: readDb,
    requireRole,
    current,
    myStudents,
    personOf,
    canSaveProgress,
    fail,
    newId,
    now,
  };

  const api: KabinetApi = {
    async me() {
      const u = user(readDb(), readDb().currentUserId);
      return u ? toMe(u) : null;
    },

    async signOut() {
      change((db) => {
        db.currentUserId = null;
      });
    },

    async hasAdmin() {
      return readDb().users.some((u) => u.role === 'admin');
    },

    async bootstrapAdmin(form) {
      return change((db) => {
        if (db.users.length > 0) fail('admin_exists', 'Администратор создаётся один раз');
        checkForm(form, 'admin');
        return toMe(newUser(db, form, 'admin'));
      });
    },

    async previewInvite(code) {
      const db = readDb();
      const inv = liveInvitation(db, code);
      if (!inv) return null;
      return {
        role: inv.role,
        tutorName: inv.tutorId === null ? null : personOf(db, inv.tutorId).name,
        className: db.classes.find((c) => c.id === inv.classId)?.name ?? null,
      };
    },

    async register(code, form) {
      return change((db) => {
        const inv = liveInvitation(db, code);
        if (!inv) fail('invite_required', 'Приглашение не действует: попросите новое');
        checkForm(form, inv.role);
        const u = newUser(db, form, inv.role);
        inv.usedAt = now();
        inv.usedBy = u.id;
        if (inv.tutorId !== null) {
          db.links.push({ tutorId: inv.tutorId, studentId: u.id, linkedAt: now(), endedAt: null });
        }
        if (inv.classId !== null) {
          db.members.push({ classId: inv.classId, studentId: u.id, joinedAt: now() });
        }
        return toMe(u);
      });
    },

    async createInvitation(role, classId = null) {
      return change((db) => {
        const me = requireRole(db, 'admin', 'tutor');
        let tutorId: string | null = null;
        if (me.role === 'tutor') {
          if (role !== 'student') fail('forbidden', 'Репетитор приглашает только учеников');
          tutorId = me.id;
        }
        if (classId !== null) {
          const cls = db.classes.find((c) => c.id === classId);
          if (!cls || (me.role === 'tutor' && cls.tutorId !== me.id))
            fail('forbidden', 'Чужой класс');
          tutorId = cls.tutorId;
        }
        if (role === 'tutor' && (tutorId !== null || classId !== null)) {
          fail('bad_role', 'Репетитора приглашают без класса');
        }
        const code = newCode();
        const at = new Date();
        db.invitations.push({
          id: newId(),
          codeHash: codeHash(code),
          role,
          createdBy: me.id,
          tutorId,
          classId,
          createdAt: at.toISOString(),
          expiresAt: new Date(at.getTime() + INVITE_TTL).toISOString(),
          usedAt: null,
          usedBy: null,
          revokedAt: null,
        });
        return code;
      });
    },

    async revokeInvitation(id) {
      change((db) => {
        const me = current(db);
        const inv = db.invitations.find((i) => i.id === id);
        if (!inv || inv.usedAt !== null || inv.revokedAt !== null)
          fail('not_found', 'Приглашение уже не действует');
        if (inv.createdBy !== me.id && me.role !== 'admin') fail('forbidden', 'Чужое приглашение');
        inv.revokedAt = now();
      });
    },

    async studentHome() {
      const db = readDb();
      const me = requireRole(db, 'student');
      const tutorIds = db.links
        .filter((l) => l.studentId === me.id && l.endedAt === null)
        .map((l) => l.tutorId);
      const classes = db.members
        .filter((m) => m.studentId === me.id)
        .flatMap((m) => {
          const c = db.classes.find((x) => x.id === m.classId && x.archivedAt === null);
          return c ? [{ id: c.id, name: c.name, tutor: personOf(db, c.tutorId) }] : [];
        });
      const homework = db.recipients
        .filter((r) => r.studentId === me.id)
        .flatMap((r) => {
          const h = db.homework.find((x) => x.id === r.homeworkId);
          return h ? [{ ...homeworkSummary(db, h), progress: progressOf(db, h, me.id) }] : [];
        })
        .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999'));
      return {
        tutors: tutorIds.map((id) => personOf(db, id)),
        classes,
        homework,
        progress: taskProgress(db, me.id),
        finished: db.sessions
          .filter((s) => s.studentId === me.id)
          .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
          .map(({ studentId: _ignored, ...rest }) => rest),
        variantWorks: db.variantRecipients
          .filter((r) => r.studentId === me.id)
          .flatMap((r) => {
            const w = db.variantWorks.find((x) => x.id === r.workId);
            if (!w) return [];
            const mine = db.variantAttempts.filter(
              (a) => a.workId === w.id && a.studentId === me.id,
            );
            return [
              {
                ...workSummary(variantCtx, db, w),
                attempts: mine.filter((a) => a.finishedAt !== null).map((a) => resultOf(db, a)),
                open: mine.filter((a) => a.finishedAt === null).map(attemptSummary),
              },
            ];
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      };
    },

    async tutorHome() {
      const db = readDb();
      const me = requireRole(db, 'tutor');
      const classes = db.classes
        .filter((c) => c.tutorId === me.id && c.archivedAt === null)
        .flatMap((c) => classSummary(db, c.id) ?? []);
      const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
      const students = myStudents(db, me.id).map((id) => {
        const mine = db.attempts.filter((a) => a.studentId === id);
        return {
          ...personOf(db, id),
          classNames: classes.filter((c) => c.students.some((s) => s.id === id)).map((c) => c.name),
          solvedWeek: mine.filter((a) => a.solvedAt >= weekAgo).length,
          lastAt: mine.reduce<string | null>(
            (m, a) => (m === null || a.solvedAt > m ? a.solvedAt : m),
            null,
          ),
        };
      });
      const homework = db.homework
        .filter((h) => h.tutorId === me.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((h) => {
          const rs = db.recipients.filter((r) => r.homeworkId === h.id);
          return {
            ...homeworkSummary(db, h),
            recipients: rs.length,
            submitted: rs.filter((r) => r.submittedAt !== null).length,
          };
        });
      return {
        classes,
        students,
        homework,
        invitations: db.invitations
          .filter((i) => i.createdBy === me.id)
          .map((i) => invitationView(db, i)),
        variantWorks: db.variantWorks
          .filter((w) => w.tutorId === me.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((w) => {
            const rs = db.variantRecipients.filter((r) => r.workId === w.id);
            return {
              ...workSummary(variantCtx, db, w),
              recipients: rs.length,
              finished: rs.filter((r) =>
                db.variantAttempts.some(
                  (a) => a.workId === w.id && a.studentId === r.studentId && a.finishedAt !== null,
                ),
              ).length,
            };
          }),
      };
    },

    async adminHome() {
      const db = readDb();
      requireRole(db, 'admin');
      return {
        invitations: [...db.invitations]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((i) => invitationView(db, i)),
        users: db.users.map((u) => ({ ...person(u), email: u.email, createdAt: u.createdAt })),
      };
    },

    async createClass(name) {
      return change((db) => {
        const me = requireRole(db, 'tutor');
        if (name.trim() === '') fail('name_required', 'Напишите название класса');
        const id = newId();
        db.classes.push({
          id,
          tutorId: me.id,
          name: name.trim(),
          createdAt: now(),
          archivedAt: null,
        });
        return id;
      });
    },

    async classView(id) {
      const db = readDb();
      const me = requireRole(db, 'tutor', 'admin');
      const c = db.classes.find((x) => x.id === id);
      if (!c || (me.role === 'tutor' && c.tutorId !== me.id)) return null;
      const cls = classSummary(db, id);
      if (!cls) return null;
      return {
        cls,
        candidates: myStudents(db, c.tutorId)
          .filter((sid) => !cls.students.some((s) => s.id === sid))
          .map((sid) => personOf(db, sid)),
        invitations: db.invitations
          .filter((i) => i.classId === id)
          .map((i) => invitationView(db, i)),
      };
    },

    async addToClass(classId, studentId) {
      change((db) => {
        const me = requireRole(db, 'tutor');
        const c = db.classes.find((x) => x.id === classId && x.tutorId === me.id);
        if (!c) fail('forbidden', 'Чужой класс');
        if (!myStudents(db, me.id).includes(studentId)) {
          fail('not_your_student', 'В класс можно добавить только своего ученика');
        }
        if (!db.members.some((m) => m.classId === classId && m.studentId === studentId)) {
          db.members.push({ classId, studentId, joinedAt: now() });
        }
      });
    },

    async removeFromClass(classId, studentId) {
      change((db) => {
        const me = requireRole(db, 'tutor');
        if (!db.classes.some((x) => x.id === classId && x.tutorId === me.id))
          fail('forbidden', 'Чужой класс');
        db.members = db.members.filter(
          (m) => !(m.classId === classId && m.studentId === studentId),
        );
      });
    },

    async issueHomework(input) {
      return change((db) => {
        const me = requireRole(db, 'tutor');
        if (input.title.trim() === '') fail('title_required', 'Напишите название');
        if (input.items.length === 0) fail('no_items', 'В ДЗ нет задач');
        if (input.dueAt !== null && input.dueAt <= now()) fail('bad_due', 'Срок уже прошёл');
        const items: HomeworkItem[] = input.items.map((i) => ({
          taskNo: i.taskNo,
          prototypeCode: i.prototypeCode,
          count: Math.min(50, Math.max(1, Math.round(i.count))),
        }));
        const mine = myStudents(db, me.id);
        const ids = new Set(input.studentIds);
        if (input.classId !== null) {
          const c = db.classes.find((x) => x.id === input.classId && x.tutorId === me.id);
          if (!c) fail('forbidden', 'Чужой класс');
          db.members.filter((m) => m.classId === c.id).forEach((m) => ids.add(m.studentId));
        }
        for (const id of ids) {
          if (!mine.includes(id)) fail('not_your_student', 'ДЗ можно выдать только своим ученикам');
        }
        if (ids.size === 0) fail('no_recipients', 'Некому выдать: выберите класс или учеников');
        const id = newId();
        db.homework.push({
          id,
          tutorId: me.id,
          classId: input.classId,
          title: input.title.trim(),
          note: input.note.trim() === '' ? null : input.note.trim(),
          dueAt: input.dueAt,
          createdAt: now(),
          closedAt: null,
          items,
        });
        ids.forEach((studentId) =>
          db.recipients.push({
            homeworkId: id,
            studentId,
            assignedAt: now(),
            startedAt: null,
            submittedAt: null,
          }),
        );
        return id;
      });
    },

    async homework(id) {
      const db = readDb();
      const me = current(db);
      const h = db.homework.find((x) => x.id === id);
      if (!h) return null;
      const recipients = db.recipients.filter((r) => r.homeworkId === id);
      if (me.role === 'tutor' && h.tutorId === me.id) {
        return {
          homework: homeworkSummary(db, h),
          progress: recipients.map((r) => progressOf(db, h, r.studentId)),
        };
      }
      if (me.role === 'admin') {
        return {
          homework: homeworkSummary(db, h),
          progress: recipients.map((r) => progressOf(db, h, r.studentId)),
        };
      }
      if (me.role === 'student' && recipients.some((r) => r.studentId === me.id)) {
        return { homework: homeworkSummary(db, h), progress: [progressOf(db, h, me.id)] };
      }
      return null;
    },

    async startHomework(id) {
      change((db) => {
        const me = requireRole(db, 'student');
        const r = db.recipients.find((x) => x.homeworkId === id && x.studentId === me.id);
        if (r && r.startedAt === null) r.startedAt = now();
      });
    },

    async submitHomework(id) {
      change((db) => {
        const me = requireRole(db, 'student');
        const r = db.recipients.find((x) => x.homeworkId === id && x.studentId === me.id);
        const h = db.homework.find((x) => x.id === id);
        if (!r || !h || r.submittedAt !== null || h.closedAt !== null) {
          fail('cannot_submit', 'ДЗ закрыто, уже сдано или не ваше');
        }
        r.startedAt ??= now();
        r.submittedAt = now();
      });
    },

    async saveSessionResult(result) {
      change((db) => {
        const me = requireRole(db, 'student');
        if (!canSaveProgress(me)) fail('progress_not_allowed', 'Ждём согласия родителя');
        if (db.sessions.some((s) => s.studentId === me.id && s.id === result.id)) return;
        const homeworkId =
          result.homeworkId !== null &&
          db.recipients.some((r) => r.homeworkId === result.homeworkId && r.studentId === me.id)
            ? result.homeworkId
            : null;
        const at = now();
        let right = 0;
        for (const a of result.attempts) {
          if (a.outcome === 'right') right += 1;
          db.attempts.push({
            id: newId(),
            studentId: me.id,
            taskNo: a.taskNo,
            prototypeCode: a.prototypeCode,
            taskRef: a.taskRef,
            outcome: a.outcome as AttemptOutcome,
            timeMs: a.timeMs,
            homeworkId,
            sessionId: result.id,
            solvedAt: at,
          });
        }
        db.sessions.push({
          studentId: me.id,
          id: result.id,
          scope: result.scope,
          taskNo: Number(result.scope.split(':')[0]),
          total: result.total,
          solved: result.attempts.length,
          right,
          activeMs: result.activeMs,
          homeworkId,
          finishedAt: at,
        });
        if (homeworkId !== null) {
          const r = db.recipients.find((x) => x.homeworkId === homeworkId && x.studentId === me.id);
          if (r) r.startedAt ??= at;
        }
      });
    },

    ...localVariantMethods(variantCtx),

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    trial: {
      accounts() {
        return readDb().users.map(person);
      },
      signIn(id) {
        change((db) => {
          if (db.users.some((u) => u.id === id)) db.currentUserId = id;
        });
      },
      confirmParent() {
        change((db) => {
          const u = current(db);
          if (u.parentEmail !== null && u.parentConfirmedAt === null) {
            u.parentConfirmedAt = now();
            u.consents.push({
              kind: 'soglasie_roditelya',
              version: documentsVersion,
              acceptedAt: now(),
              ip: null,
            });
          }
        });
      },
    },
  };
  return api;
}
