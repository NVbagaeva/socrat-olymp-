/**
 * Сущности кабинета — те же, что в supabase/migrations/20261015120000_kabinet.sql.
 * Экраны знают только эти типы и интерфейс KabinetApi (api.ts): пробная
 * реализация в браузере и будущая серверная отдают одно и то же.
 */

import type { ConsentRecord } from '@/lib/account/consents';

export type KabinetRole = 'student' | 'tutor' | 'admin';

/** Исход попытки — как attempt_outcome в базе. */
export type AttemptOutcome = 'right' | 'hinted' | 'wrong';

export interface Person {
  id: string;
  role: KabinetRole;
  name: string;
}

/** Вошедший пользователь. */
export interface Me extends Person {
  email: string;
  grade: number | null;
  /** Ученик младше 18 ждёт согласия родителя: прогресс не сохраняется. */
  parentPending: boolean;
  parentEmail: string | null;
  consents: ConsentRecord[];
}

export interface Invitation {
  id: string;
  role: 'student' | 'tutor';
  createdBy: Person;
  /** Чьим учеником станет приглашённый. */
  tutor: Person | null;
  className: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  usedBy: Person | null;
  revokedAt: string | null;
}

export interface ClassSummary {
  id: string;
  name: string;
  students: Person[];
  createdAt: string;
}

/** Задача ДЗ: номер задания, прототип (пусто — любой), сколько решить. */
export interface HomeworkItem {
  taskNo: number;
  prototypeCode: string | null;
  count: number;
}

export interface HomeworkSummary {
  id: string;
  title: string;
  note: string | null;
  tutor: Person;
  className: string | null;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
  items: HomeworkItem[];
}

/** Как идёт ДЗ у одного ученика. */
export interface HomeworkProgress {
  student: Person;
  startedAt: string | null;
  submittedAt: string | null;
  /** По позициям items: сколько задач решено верно (без подсказки) в рамках ДЗ. */
  doneByItem: number[];
  /** Всего решено верно, но не больше, чем задано по каждой позиции. */
  done: number;
  total: number;
}

/** Строка прогресса по номеру ЕГЭ: считается из попыток. */
export interface TaskProgressRow {
  taskNo: number;
  solved: number;
  right: number;
  lastAt: string | null;
}

/** Завершённая тренировка в кабинете (trainer_sessions со status = finished). */
export interface FinishedSession {
  id: string;
  scope: string;
  taskNo: number;
  total: number;
  solved: number;
  right: number;
  activeMs: number;
  homeworkId: string | null;
  finishedAt: string;
}

export interface StudentHome {
  tutors: Person[];
  classes: { id: string; name: string; tutor: Person }[];
  homework: (HomeworkSummary & { progress: HomeworkProgress })[];
  progress: TaskProgressRow[];
  finished: FinishedSession[];
  /** Выданные варианты и серии: свои попытки с итогами (для статистики). */
  variantWorks: (VariantWorkSummary & {
    attempts: VariantResult[];
    open: VariantAttemptSummary[];
  })[];
}

export interface TutorStudent extends Person {
  classNames: string[];
  /** Решено задач за последние 7 дней. */
  solvedWeek: number;
  lastAt: string | null;
}

export interface TutorHome {
  classes: ClassSummary[];
  students: TutorStudent[];
  homework: (HomeworkSummary & { submitted: number; recipients: number })[];
  invitations: Invitation[];
  /** Выданные варианты: сколько получателей и сколько завершили. */
  variantWorks: (VariantWorkSummary & { recipients: number; finished: number })[];
}

export interface AdminHome {
  invitations: Invitation[];
  users: (Person & { email: string; createdAt: string })[];
}

export interface HomeworkView {
  homework: HomeworkSummary;
  /** Ученику — только его строка; репетитору — все получатели. */
  progress: HomeworkProgress[];
}

export interface ClassView {
  cls: ClassSummary;
  /** Ученики репетитора, которых ещё нет в классе. */
  candidates: Person[];
  invitations: Invitation[];
}

/** Форма регистрации по приглашению. */
export interface InviteRegistration {
  name: string;
  email: string;
  birthYear: number | null;
  parentEmail: string | null;
  grade: number | null;
  acceptSoglashenie: boolean;
  acceptSoglasie: boolean;
}

export interface IssueHomeworkInput {
  title: string;
  note: string;
  dueAt: string | null;
  classId: string | null;
  studentIds: string[];
  items: HomeworkItem[];
}

/** Что известно о приглашении до регистрации. */
export interface InvitePreview {
  role: 'student' | 'tutor';
  tutorName: string | null;
  className: string | null;
}

/** Попытка, которую тренажёр передаёт в кабинет. */
export interface AttemptInput {
  taskNo: number;
  prototypeCode: string | null;
  taskRef: string | null;
  outcome: AttemptOutcome;
  timeMs: number | null;
  homeworkId: string | null;
  sessionId: string | null;
}

export interface SessionResultInput {
  id: string;
  scope: string;
  total: number;
  activeMs: number;
  homeworkId: string | null;
  attempts: AttemptInput[];
}

/* ── Онлайн-вариант (supabase/migrations/20261025120000_variant_works.sql) ── */

export type VariantMode = 'trening' | 'kontrol';

export type VariantTimer = { kind: 'none' } | { kind: 'up' } | { kind: 'down'; minutes: number };

/** Подсказка-вопрос (HTML). */
export interface VariantHint {
  question: string;
  options: string[];
  correct: number;
  comment: string | null;
}

/** Задание работы, как его видит получатель: без ответа и подсказок. */
export interface VariantWorkTask {
  /** С 1, как в базе. */
  position: number;
  egeNo: number;
  prototypeId: string;
  taskRef: string;
  subtype: string;
  points: number;
  statement: string;
  figure: string | null;
}

/** Задание при выдаче: с ключом. Ключ уходит в variant_work_keys. */
export interface VariantWorkTaskInput extends VariantWorkTask {
  answer: string;
  hints: VariantHint[];
}

export interface IssueVariantInput {
  title: string;
  /** Тип работы из шапки листа (ege, dz, probnik…). */
  kind: string;
  setCode: string;
  mode: VariantMode;
  timer: VariantTimer;
  dueAt: string | null;
  classId: string | null;
  studentIds: string[];
  /** variant — номер в работе (с 1), setVariant — номер в партии. */
  variants: { variant: number; setVariant: number; tasks: VariantWorkTaskInput[] }[];
}

export interface VariantWorkSummary {
  id: string;
  title: string;
  kind: string;
  setCode: string;
  /** Вариантов: 1 — вариант, больше — серия. */
  variants: number;
  /** Номер каждого варианта работы в партии (setVariants[v - 1]). */
  setVariants: number[];
  mode: VariantMode;
  timer: VariantTimer;
  tutor: Person;
  className: string | null;
  dueAt: string | null;
  createdAt: string;
  closedAt: string | null;
}

/** Итог задания в попытке. */
export interface VariantResultTask {
  position: number;
  egeNo: number;
  /** Первая попытка, нормальная запись; null — нет ответа. */
  answer: string | null;
  right: boolean;
  second: string | null;
  secondRight: boolean | null;
  hinted: boolean;
  seconds: number;
  /** Верный ответ — только у завершённой попытки. */
  key: string;
}

export interface VariantAttemptSummary {
  id: string;
  variant: number;
  startedAt: string;
  deadlineAt: string | null;
  finishedAt: string | null;
  late: boolean;
  primary: number | null;
  max: number | null;
  seconds: number | null;
}

export interface VariantResult extends VariantAttemptSummary {
  tasks: VariantResultTask[];
}

/** Работа на экране: ученику — его попытки, репетитору — все. */
export interface VariantWorkView {
  work: VariantWorkSummary;
  /** Условия по вариантам: tasks[variant - 1]. */
  tasks: VariantWorkTask[][];
  /** Ученику — свои попытки. */
  mine: VariantAttemptSummary[];
  /** Репетитору — получатели и их завершённые попытки с итогами. */
  results: { student: Person; attempts: VariantResult[] }[] | null;
}

export interface VariantStart {
  attemptId: string;
  deadlineAt: string | null;
  /** Черновик контрольной — продолжить на другом устройстве. */
  draft: Record<string, unknown>;
}

export interface VariantCheck {
  verdict: 'right' | 'wrong' | 'format';
  /** Первая ошибка в тренировке — подсказки-вопросы. */
  hints?: VariantHint[];
}
