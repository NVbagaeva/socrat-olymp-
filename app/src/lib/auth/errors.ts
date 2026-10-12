/**
 * Ошибки сервиса входа — понятным русским текстом, без технических
 * деталей. Коды — из GoTrue (error_code в ответе), текст сообщения
 * на экран не выводится никогда.
 */

export interface AuthFailure {
  message?: string;
  status?: number;
  code?: string;
}

/** Хук «перед созданием пользователя» отвечает этим словом, если адреса нет в списке. */
export const INVITE_ONLY_MARK = 'invite_only';

export const AUTH_ERRORS = {
  inviteOnly: 'Регистрация пока по приглашению.',
  invalidCredentials: 'Неверная почта или пароль.',
  emailNotConfirmed: (email: string) => `Подтвердите почту: письмо отправлено на ${email}.`,
  emailExists: 'Такая почта уже зарегистрирована. Попробуйте войти.',
  weakPassword: 'Пароль слишком простой. Нужно не меньше 8 знаков.',
  samePassword: 'Новый пароль совпадает со старым. Придумайте другой.',
  tooManyEmails: 'Письмо уже отправляли. Повторить можно через минуту.',
  tooManyRequests: 'Слишком много попыток. Подождите немного и попробуйте снова.',
  linkExpired: 'Ссылка устарела или уже использована. Запросите новую.',
  sessionExpired: 'Сеанс закончился. Войдите ещё раз.',
  network: 'Нет связи с сервисом входа. Проверьте интернет и попробуйте снова.',
  unknown: 'Что-то пошло не так. Попробуйте ещё раз через минуту.',
} as const;

export function isInviteOnly(error: AuthFailure): boolean {
  return (
    error.message?.includes(INVITE_ONLY_MARK) === true ||
    error.code === 'signup_disabled' ||
    (error.status === 403 && error.code === undefined)
  );
}

/** Текст ошибки для экрана. email — для «Подтвердите почту». */
export function describeAuthError(error: AuthFailure, email = ''): string {
  if (isInviteOnly(error)) return AUTH_ERRORS.inviteOnly;
  switch (error.code) {
    case 'invalid_credentials':
      return AUTH_ERRORS.invalidCredentials;
    case 'email_not_confirmed':
      return AUTH_ERRORS.emailNotConfirmed(email);
    case 'email_exists':
    case 'user_already_exists':
      return AUTH_ERRORS.emailExists;
    case 'weak_password':
      return AUTH_ERRORS.weakPassword;
    case 'same_password':
      return AUTH_ERRORS.samePassword;
    case 'over_email_send_rate_limit':
      return AUTH_ERRORS.tooManyEmails;
    case 'over_request_rate_limit':
      return AUTH_ERRORS.tooManyRequests;
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return AUTH_ERRORS.linkExpired;
    case 'session_expired':
    case 'session_not_found':
    case 'refresh_token_not_found':
    case 'bad_jwt':
      return AUTH_ERRORS.sessionExpired;
    default:
      break;
  }
  if (error.status === 429) return AUTH_ERRORS.tooManyRequests;
  if (error.status === 400 && /password/i.test(error.message ?? '')) {
    return AUTH_ERRORS.weakPassword;
  }
  if (error.status === undefined && /fetch|network/i.test(error.message ?? '')) {
    return AUTH_ERRORS.network;
  }
  return AUTH_ERRORS.unknown;
}
