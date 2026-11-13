/**
 * Почтовые домены, с которых открыта регистрация: российские почтовые
 * сервисы (запрет на регистрацию по иностранной почте с 7 июля 2026).
 *
 * Тот же список — в базе (supabase/migrations/20261113120000_pochtovye_domeny.sql,
 * таблица auth_hooks.signup_domains): решает база, форма лишь заранее
 * подсказывает. Списки сверяет pnpm test:domeny. Добавить домен — в оба
 * места, новой миграцией.
 *
 * Школьная или рабочая почта добавляется вручную, без правки кода:
 * секрет SIGNUP_EXTRA и кнопка «Сервер: миграции» (docs/AUTH.md). Тех
 * адресов форма не знает — для них в подсказке есть «Мой адрес уже
 * добавили».
 *
 * Уже зарегистрированных пользователей правило не касается: вход, смена
 * и восстановление пароля работают с любой почтой. Ограничены только
 * новый аккаунт и смена почты на неразрешённую.
 */

export const ALLOWED_EMAIL_DOMAINS = [
  // Яндекс
  'yandex.ru',
  'ya.ru',
  'yandex.com',
  'yandex.by',
  'yandex.kz',
  'narod.ru',
  // Mail.ru (VK)
  'mail.ru',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'internet.ru',
  // Рамблер
  'rambler.ru',
  'lenta.ru',
  'autorambler.ru',
  'myrambler.ru',
  'ro.ru',
  // Сайт
  'budetege.ru',
] as const;

const ALLOWED = new Set<string>(ALLOWED_EMAIL_DOMAINS);

/** Слово, которым база отказывает: хук службы входа и триггеры. */
export const DOMAIN_REJECTED_MARK = 'domain_not_allowed';

/**
 * Домен адреса так, как его сравнивает база: без пробелов по краям,
 * строчными. null — не похоже на адрес (нет «@», пробел внутри).
 */
export function emailDomain(email: string): string | null {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+$/.test(clean)) return null;
  return clean.slice(clean.indexOf('@') + 1);
}

/**
 * Домен из списка — точное совпадение: поддомен (mail.yandex.ru) и
 * похожий адрес (mail.ru.example.com, mymail.ru) не проходят.
 */
export function emailDomainAllowed(email: string): boolean {
  const domain = emailDomain(email);
  return domain !== null && ALLOWED.has(domain);
}
