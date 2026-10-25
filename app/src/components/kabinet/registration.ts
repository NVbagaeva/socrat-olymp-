import type { RegistrationForm } from '@/lib/account/consents';
import type { InviteRegistration } from '@/lib/kabinet/types';

/** Поля формы регистрации (строки) → данные регистрации кабинета. Пароль в пробном режиме не хранится. */
export function formFromRegistration(form: RegistrationForm): InviteRegistration {
  const year = Number(form.birthYear);
  return {
    name: form.name,
    email: form.email,
    birthYear: form.role === 'student' && Number.isInteger(year) && year > 0 ? year : null,
    parentEmail: form.parentEmail.trim() === '' ? null : form.parentEmail,
    grade: null,
    acceptSoglashenie: form.acceptSoglashenie,
    acceptSoglasie: form.acceptSoglasie,
  };
}

/** Ссылка-приглашение: код в параметре адреса. */
export function inviteUrl(code: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/kabinet/priglashenie/?kod=${encodeURIComponent(code)}`;
}
