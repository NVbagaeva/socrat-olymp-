/**
 * Хранение пробного кабинета: одна запись в localStorage. Таблицы — те
 * же, что в базе (supabase/migrations/20261015120000_kabinet.sql),
 * в упрощённом виде. Без React и без каталога: модуль читает и оболочка
 * тренажёра.
 */

import type { ConsentRecord } from '@/lib/account/consents';
import type {
  AttemptOutcome,
  HomeworkItem,
  KabinetRole,
  VariantHint,
  VariantMode,
  VariantTimer,
  VariantWorkTask,
} from './types';

/** Полный ключ в localStorage. */
export const KABINET_KEY = 'budetege:kabinet:v1';

export interface DbUser {
  id: string;
  email: string;
  role: KabinetRole;
  name: string;
  grade: number | null;
  birthYear: number | null;
  /** Есть — ученик младше 18. */
  parentEmail: string | null;
  parentConfirmedAt: string | null;
  createdAt: string;
  consents: ConsentRecord[];
}

export interface Db {
  v: 1;
  currentUserId: string | null;
  users: DbUser[];
  invitations: {
    id: string;
    codeHash: string;
    role: 'student' | 'tutor';
    createdBy: string;
    tutorId: string | null;
    classId: string | null;
    createdAt: string;
    expiresAt: string;
    usedAt: string | null;
    usedBy: string | null;
    revokedAt: string | null;
  }[];
  links: { tutorId: string; studentId: string; linkedAt: string; endedAt: string | null }[];
  classes: {
    id: string;
    tutorId: string;
    name: string;
    createdAt: string;
    archivedAt: string | null;
  }[];
  members: { classId: string; studentId: string; joinedAt: string }[];
  homework: {
    id: string;
    tutorId: string;
    classId: string | null;
    title: string;
    note: string | null;
    dueAt: string | null;
    createdAt: string;
    closedAt: string | null;
    items: HomeworkItem[];
  }[];
  recipients: {
    homeworkId: string;
    studentId: string;
    assignedAt: string;
    startedAt: string | null;
    submittedAt: string | null;
  }[];
  attempts: {
    id: string;
    studentId: string;
    taskNo: number;
    prototypeCode: string | null;
    taskRef: string | null;
    outcome: AttemptOutcome;
    timeMs: number | null;
    homeworkId: string | null;
    sessionId: string | null;
    solvedAt: string;
  }[];
  /** Завершённые тренировки. Незавершённые живут в хранилище тренажёров. */
  sessions: {
    studentId: string;
    id: string;
    scope: string;
    taskNo: number;
    total: number;
    solved: number;
    right: number;
    activeMs: number;
    homeworkId: string | null;
    finishedAt: string;
  }[];
  /* Онлайн-вариант — таблицы миграции 20261025120000_variant_works.sql.
     Ключ (variantKeys) читают только «функции базы» в localVariant.ts. */
  variantWorks: {
    id: string;
    tutorId: string;
    classId: string | null;
    title: string;
    kind: string;
    setCode: string;
    variants: number;
    setVariants: number[];
    mode: VariantMode;
    timer: VariantTimer;
    dueAt: string | null;
    createdAt: string;
    closedAt: string | null;
  }[];
  variantTasks: (VariantWorkTask & { workId: string; variant: number })[];
  variantKeys: {
    workId: string;
    variant: number;
    position: number;
    answer: string;
    hints: VariantHint[];
  }[];
  variantRecipients: { workId: string; studentId: string; assignedAt: string }[];
  variantAttempts: {
    id: string;
    workId: string;
    studentId: string;
    variant: number;
    startedAt: string;
    deadlineAt: string | null;
    finishedAt: string | null;
    late: boolean;
    primary: number | null;
    max: number | null;
    seconds: number | null;
    draft: Record<string, unknown>;
  }[];
  variantAnswers: {
    attemptId: string;
    studentId: string;
    position: number;
    first: string | null;
    firstRight: boolean | null;
    second: string | null;
    secondRight: boolean | null;
    hinted: boolean;
    seconds: number;
  }[];
}

export function emptyDb(): Db {
  return {
    v: 1,
    currentUserId: null,
    users: [],
    invitations: [],
    links: [],
    classes: [],
    members: [],
    homework: [],
    recipients: [],
    attempts: [],
    sessions: [],
    variantWorks: [],
    variantTasks: [],
    variantKeys: [],
    variantRecipients: [],
    variantAttempts: [],
    variantAnswers: [],
  };
}

function storageOrNull(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Есть ли пробный кабинет в этом браузере. */
export function hasKabinet(): boolean {
  try {
    return storageOrNull()?.getItem(KABINET_KEY) != null;
  } catch {
    return false;
  }
}

export function readDb(): Db {
  try {
    const raw = storageOrNull()?.getItem(KABINET_KEY);
    if (raw == null) return emptyDb();
    const data = JSON.parse(raw) as Partial<Db>;
    if (data.v !== 1) return emptyDb();
    return { ...emptyDb(), ...data } as Db;
  } catch {
    return emptyDb();
  }
}

export function writeDb(db: Db): void {
  try {
    storageOrNull()?.setItem(KABINET_KEY, JSON.stringify(db));
  } catch {
    /* Нет места или запись запрещена: пробный кабинет работает до перезагрузки. */
  }
}

/** Вошедший ученик пробного кабинета или null. */
export function currentStudentId(): string | null {
  if (!hasKabinet()) return null;
  const db = readDb();
  const u = db.users.find((x) => x.id === db.currentUserId);
  return u?.role === 'student' ? u.id : null;
}
