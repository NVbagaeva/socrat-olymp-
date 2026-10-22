/**
 * Что кабинету нужно от сервера для согласий. Реализации пока нет:
 * сервер с аккаунтами появится в сессии С-3 (docs/CABINET_UX_SPEC.md).
 * Каждый метод соответствует функции из
 * supabase/migrations/20261011120000_soglasiya.sql — там же проверки
 * на стороне базы: без галочек регистрация не пройдёт и в обход формы.
 */

import type { ConsentKind, ConsentRecord, RegistrationForm, Role } from './consents';

export interface AccountSnapshot {
  email: string;
  name: string;
  role: Role;
  birthYear: number | null;
  parentEmail: string | null;
  parentRequired: boolean;
  parentConfirmedAt: string | null;
  /** Когда последний раз ушло письмо родителю — для «не чаще раза в минуту». */
  parentLetterSentAt: string | null;
  consents: ConsentRecord[];
}

export interface AccountApi {
  /** Регистрация вместе с записью согласий (register_with_consents). */
  register(form: RegistrationForm, version: string): Promise<AccountSnapshot>;
  /** Новая редакция: записать согласия заново (accept_documents). */
  acceptDocuments(kinds: ConsentKind[], version: string): Promise<AccountSnapshot>;
  /** Повторить письмо родителю (resend_parent_letter); сервер сам держит интервал. */
  resendParentLetter(): Promise<AccountSnapshot>;
  /** Все данные пользователя одним JSON (export_my_data). */
  exportMyData(): Promise<unknown>;
  /** Удалить аккаунт; записи о согласии остаются на 3 года (delete_my_account). */
  deleteAccount(): Promise<void>;
}
