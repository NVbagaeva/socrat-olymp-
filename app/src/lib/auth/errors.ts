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

import { DOMAIN_REJECTED_MARK } from './allowed-domains';

/** Хук «перед созданием пользователя» отвечает этим словом, если адреса нет в списке. */
export const INVITE_ONLY_MARK = 'invite_only';

/** Хук и триггер базы: ученик младше 18 при открытой регистрации. */
export const MINOR_CLOSED_MARK = 'minor_closed';

export const AUTH_ERRORS = {
  inviteOnly: 'Регистрация пока по приглашению.',
  minorClosed:
    'Ученикам младше 18 лет регистрация пока закрыта: нужно согласие родителя. Бесплатная часть сайта работает и без регистрации.',
  /* Форма показывает вместо этой строки подсказку со ссылкой (VoytiScreen). */
  domainNotAllowed:
    'Регистрация доступна с адресами российских почтовых сервисов: Яндекс, Mail.ru, Рамблер.',
  invalidCredentials: 'Неверная почта или пароль.',
  emailNotConfirmed: (email: string) => `Подтвердите почту: письмо отправлено на ${email}.`,
  emailExists: 'Такая почта уже зарегистрирована. Попробуйте войти.',
  weakPassword: 'Пароль слишком простой. Нужно не меньше 8 знаков.',
  samePassword: 'Новый пароль совпадает со старым. Придумайте другой.',
  tooManyEmails: 'Письмо уже отправляли. Повторить можно через минуту.',
  tooManyRequests: 'Слишком много попыток. Подождите немного и попробуйте снова.',
  linkExpired: 'Ссылка устарела или уже использована. Запросите новую.',
  sessionExpired: 'Сеанс закончился. Войдите ещё раз.',
  /* База не создала аккаунт: не сошлись условия регистрации (редакция
     документов сменилась, пока форма была открыта, и т. п.). */
  documentsChanged:
    'Правовые документы обновились, пока форма была открыта. Обновите страницу и отметьте галочки заново.',
  signupRejected: 'Аккаунт не создан. Обновите страницу, проверьте форму и попробуйте ещё раз.',
  network: 'Нет связи с сервисом входа. Проверьте интернет и попробуйте снова.',
  unknown: 'Что-то пошло не так. Попробуйте ещё раз через минуту.',
} as const;

/** База отказала: почта не российского сервиса и не добавлена вручную. */
export function isDomainRejected(error: AuthFailure): boolean {
  return error.message?.includes(DOMAIN_REJECTED_MARK) === true;
}

export function isInviteOnly(error: AuthFailure): boolean {
  return (
    error.message?.includes(INVITE_ONLY_MARK) === true ||
    /* Тот же отбор повторяет триггер базы — на случай, если хук выключен. */
    error.message?.startsWith('invite_required') === true ||
    error.code === 'signup_disabled' ||
    (error.status === 403 && error.code === undefined)
  );
}

/** Текст ошибки для экрана. email — для «Подтвердите почту». */
export function describeAuthError(error: AuthFailure, email = ''): string {
  /* Раньше приглашения: отказ по домену — тоже 403. */
  if (isDomainRejected(error)) return AUTH_ERRORS.domainNotAllowed;
  /* Тоже 403 без кода — раньше проверки «по приглашению». */
  if (error.message?.includes(MINOR_CLOSED_MARK) === true) return AUTH_ERRORS.minorClosed;
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
  /* Отказ базы при регистрации (триггеры согласий и приглашений): служба
     входа передаёт его текст как есть, он начинается с кода причины. */
  const reason = /^([a-z_]+):/.exec(error.message ?? '')?.[1];
  if (reason === 'outdated_documents') return AUTH_ERRORS.documentsChanged;
  if (
    reason === 'consents_required' ||
    reason === 'birth_year_required' ||
    reason === 'parent_email_required' ||
    reason === 'bad_role' ||
    reason === 'role_mismatch' ||
    /saving new user/i.test(error.message ?? '')
  ) {
    return AUTH_ERRORS.signupRejected;
  }
  if (error.status === 400 && /password/i.test(error.message ?? '')) {
    return AUTH_ERRORS.weakPassword;
  }
  if (error.status === undefined && /fetch|network/i.test(error.message ?? '')) {
    return AUTH_ERRORS.network;
  }
  return AUTH_ERRORS.unknown;
}
