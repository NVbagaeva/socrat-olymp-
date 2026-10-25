/**
 * Что экранам кабинета нужно от сервера. Каждый метод соответствует
 * функции или таблице миграции supabase/migrations/20261015120000_kabinet.sql.
 *
 * Реализаций две: пробная в браузере (localApi.ts) — пока сервера нет,
 * и серверная (появится в сессии С-3) — поверх Supabase. Экраны знают
 * только этот интерфейс.
 */

import type {
  AdminHome,
  ClassView,
  HomeworkView,
  InvitePreview,
  InviteRegistration,
  IssueHomeworkInput,
  IssueVariantInput,
  Me,
  Person,
  SessionResultInput,
  StudentHome,
  TutorHome,
  VariantCheck,
  VariantResult,
  VariantStart,
  VariantWorkView,
} from './types';

/** Ошибка с кодом — тем же, что поднимает функция базы. */
export class KabinetError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export interface KabinetApi {
  /** Вошедший пользователь; null — никто не вошёл. */
  me(): Promise<Me | null>;
  signOut(): Promise<void>;

  /** Есть ли администратор (первый запуск — нет). */
  hasAdmin(): Promise<boolean>;
  /** Первый запуск: аккаунт администратора (bootstrap_admin). Второй раз — ошибка. */
  bootstrapAdmin(form: InviteRegistration): Promise<Me>;

  /** Что за приглашение — до регистрации. null — код не действует. */
  previewInvite(code: string): Promise<InvitePreview | null>;
  /** Регистрация по приглашению (триггер handle_new_user_invite). */
  register(code: string, form: InviteRegistration): Promise<Me>;
  /** Создать приглашение (create_invitation). Код показывается один раз. */
  createInvitation(role: 'student' | 'tutor', classId?: string | null): Promise<string>;
  revokeInvitation(id: string): Promise<void>;

  studentHome(): Promise<StudentHome>;
  tutorHome(): Promise<TutorHome>;
  adminHome(): Promise<AdminHome>;

  createClass(name: string): Promise<string>;
  classView(id: string): Promise<ClassView | null>;
  addToClass(classId: string, studentId: string): Promise<void>;
  removeFromClass(classId: string, studentId: string): Promise<void>;

  /** Выдать ДЗ (issue_homework). Возвращает id. */
  issueHomework(input: IssueHomeworkInput): Promise<string>;
  homework(id: string): Promise<HomeworkView | null>;
  startHomework(id: string): Promise<void>;
  submitHomework(id: string): Promise<void>;

  /* ── Онлайн-вариант (миграция 20261025120000_variant_works.sql) ── */

  /** Выдать вариант или серию (issue_variant_work). Возвращает id работы. */
  issueVariantWork(input: IssueVariantInput): Promise<string>;
  /** Работа: условия без ключа; ученику — его попытки, репетитору — итоги. */
  variantWork(id: string): Promise<VariantWorkView | null>;
  /** Начать или продолжить вариант (variant_start). */
  variantStart(workId: string, variant: number): Promise<VariantStart>;
  /** Тренировка: проверить ответ сразу (variant_check); position — с 1. */
  variantCheck(attemptId: string, position: number, answer: string): Promise<VariantCheck>;
  /** Контрольная: черновик без проверки (variant_save_draft). */
  variantSaveDraft(attemptId: string, draft: Record<string, unknown>): Promise<void>;
  /** «Завершить работу» (variant_submit): баллы и ключ — только теперь. */
  variantSubmit(
    attemptId: string,
    answers: (string | null)[],
    seconds: number[],
    hinted: number[],
  ): Promise<VariantResult>;
  /** Итог завершённой попытки (variant_result). */
  variantResult(attemptId: string): Promise<VariantResult>;

  /** Завершённая тренировка: строка trainer_sessions и попытки (record_attempt). */
  saveSessionResult(result: SessionResultInput): Promise<void>;

  /** Перерисовать экраны, когда данные изменились. Возвращает отписку. */
  subscribe(listener: () => void): () => void;

  /** Только пробный режим: аккаунты этого браузера и вход без пароля. */
  trial?: {
    accounts(): Person[];
    signIn(id: string): void;
    /** Отметить, что родитель подтвердил согласие (в жизни — ссылка из письма). */
    confirmParent(): void;
  };
}
