/**
 * Правила регистрации и согласий — без сервера и без React.
 *
 * Сервера с аккаунтами пока нет (сессии С-1 и С-3 в
 * docs/CABINET_UX_SPEC.md). Здесь то, что от него не зависит: кто
 * должен поставить какие галочки, когда нужен родитель, когда снова
 * спросить согласие и как часто можно повторить письмо. Таблица
 * согласий и удаление аккаунта — в supabase/migrations/.
 */

import { documentsVersion } from '@/lib/legal/operator';

/** Тип записи в таблице согласий — как в supabase/migrations. */
export type ConsentKind = 'soglashenie' | 'soglasie' | 'soglasie_roditelya';

export type Role = 'student' | 'tutor';

export interface ConsentRecord {
  kind: ConsentKind;
  /** Редакция документа: дата ГГГГ-ММ-ДД из operator.json. */
  version: string;
  /** Дата и время, ISO. */
  acceptedAt: string;
  ip: string | null;
}

/** Совершеннолетие. */
export const ADULT_AGE = 18;

/**
 * Нужно ли согласие родителя. Известен только год рождения, поэтому в
 * год, когда ученику исполняется 18, считаем его младше: точного дня
 * мы не знаем, а ошибиться в сторону «без родителя» нельзя.
 */
export function parentConsentNeeded(birthYear: number, now: Date = new Date()): boolean {
  return now.getFullYear() - birthYear <= ADULT_AGE;
}

/** Допустимый год рождения: от 100 лет назад до 5 лет назад. */
export function birthYearValid(year: number, now: Date = new Date()): boolean {
  const y = now.getFullYear();
  return Number.isInteger(year) && year >= y - 100 && year <= y - 5;
}

/** Не чаще раза в минуту — повторное письмо родителю. */
export const RESEND_INTERVAL_MS = 60_000;

/** Сколько секунд ждать до следующего письма; 0 — можно отправлять. */
export function resendWaitSeconds(lastSentAt: string | null, now: Date = new Date()): number {
  if (!lastSentAt) return 0;
  const left = new Date(lastSentAt).getTime() + RESEND_INTERVAL_MS - now.getTime();
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

/** Галочки, которые пользователь ставит сам, при регистрации и при новой редакции. */
export const OWN_CONSENTS: readonly ConsentKind[] = ['soglashenie', 'soglasie'];

/**
 * Какие документы текущей редакции пользователь ещё не принял.
 * Не пусто — при входе окно «Документы обновлены».
 */
export function outdatedConsents(
  records: readonly ConsentRecord[],
  version: string = documentsVersion,
): ConsentKind[] {
  return OWN_CONSENTS.filter(
    (kind) => !records.some((r) => r.kind === kind && r.version === version),
  );
}

export interface AccountState {
  role: Role;
  /** Ученик младше 18 — при регистрации указал почту родителя. */
  parentRequired: boolean;
  /** Родитель перешёл по ссылке из письма. */
  parentConfirmedAt: string | null;
}

/** Сохраняется ли прогресс. Нет — пока родитель не подтвердил согласие. */
export function progressSavingAllowed(a: AccountState): boolean {
  return !(a.role === 'student' && a.parentRequired && !a.parentConfirmedAt);
}

export interface RegistrationForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  /** Строкой — как в поле ввода. */
  birthYear: string;
  parentEmail: string;
  acceptSoglashenie: boolean;
  acceptSoglasie: boolean;
}

export type RegistrationField = keyof RegistrationForm;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

export const registrationErrors = {
  name: 'Напишите имя',
  email: 'Проверьте почту: в ней должны быть @ и точка',
  password: `Пароль — не короче ${PASSWORD_MIN} символов`,
  birthYear: 'Год рождения — четыре цифры, например 2009',
  parentEmail: 'Почта родителя нужна: без его согласия прогресс не сохранится',
  parentSame: 'Почта родителя должна отличаться от вашей',
  acceptSoglashenie: 'Без согласия с Пользовательским соглашением регистрация невозможна',
  acceptSoglasie: 'Без согласия на обработку персональных данных регистрация невозможна',
} as const;

export interface RegistrationCheck {
  /** Нужно поле «Почта родителя». */
  needsParent: boolean;
  errors: Partial<Record<RegistrationField, string>>;
  /** Кнопка «Зарегистрироваться» активна. */
  canSubmit: boolean;
}

export function checkRegistration(f: RegistrationForm, now: Date = new Date()): RegistrationCheck {
  const errors: Partial<Record<RegistrationField, string>> = {};
  if (f.name.trim() === '') errors.name = registrationErrors.name;
  if (!EMAIL.test(f.email.trim())) errors.email = registrationErrors.email;
  if (f.password.length < PASSWORD_MIN) errors.password = registrationErrors.password;

  let needsParent = false;
  if (f.role === 'student') {
    const year = Number(f.birthYear);
    if (!/^\d{4}$/.test(f.birthYear.trim()) || !birthYearValid(year, now)) {
      errors.birthYear = registrationErrors.birthYear;
    } else if (parentConsentNeeded(year, now)) {
      needsParent = true;
      const parent = f.parentEmail.trim().toLowerCase();
      if (!EMAIL.test(parent)) errors.parentEmail = registrationErrors.parentEmail;
      else if (parent === f.email.trim().toLowerCase())
        errors.parentEmail = registrationErrors.parentSame;
    }
  }

  if (!f.acceptSoglashenie) errors.acceptSoglashenie = registrationErrors.acceptSoglashenie;
  if (!f.acceptSoglasie) errors.acceptSoglasie = registrationErrors.acceptSoglasie;

  return { needsParent, errors, canSubmit: Object.keys(errors).length === 0 };
}
