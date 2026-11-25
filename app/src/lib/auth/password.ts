/**
 * Слишком простой пароль — до отправки на сервер входа.
 *
 * Служба входа (GoTrue) проверяет только длину (не меньше 8 знаков,
 * infra/lite/compose.yml). Здесь отсекаются пароли, которые подбирают
 * первыми: из списка самых частых, из одного знака, ряды клавиатуры и
 * цифр, совпадающие с почтой. Букв и цифр одновременно не требуем.
 * Проверка — scripts/check-password.mjs (pnpm test:password).
 */

import { PASSWORD_MIN } from '@/content/auth';

/* Самые частые пароли (8+ знаков) — в нижнем регистре. */
const CHASTYE = new Set([
  'password', 'password1', 'password12', 'password123', 'passw0rd', 'qwerty123', 'qwertyuiop',
  'qwerty12', 'qwerty1234', 'qwerty12345', '1q2w3e4r', '1q2w3e4r5t', 'q1w2e3r4', 'zaq12wsx',
  '1qaz2wsx', 'iloveyou', 'sunshine', 'football', 'baseball', 'princess', 'superman', 'starwars',
  'whatever', 'trustno1', 'letmein1', 'welcome1', 'admin123', 'administrator', 'abc12345',
  'abcd1234', 'aa123456', 'asdfghjkl', 'asdf1234', 'zxcvbnm1', 'pokemon1', 'minecraft',
  'roblox123', 'fortnite', 'samsung1', 'computer', 'internet', 'michael1', 'jordan23',
  'parol123', 'privet123', 'privetik', 'nastya123', 'natasha1', 'kristina', 'ekaterina',
  'alexander', 'aleksandr', 'vladimir', 'dragon123', 'master123', 'shadow123', 'monkey123',
  'пароль12', 'пароль123', 'парольпароль', 'привет123', 'йцукенгш', 'йцукенгшщз', 'ytrewq123',
  'budetege', 'budetnaege', 'ege2026', 'ege20262027', 'ege2027', 'egeege12',
]);

/* Ряды, по которым идут подряд: «12345678», «qwertyui», «йцукенгш». */
const RYADY = [
  '01234567890',
  '09876543210',
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'qazwsxedcrfvtgbyhnujmikolp',
  'йцукенгшщзхъ',
  'фывапролджэ',
  'ячсмитьбю',
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
];

export type PasswordProblem = 'short' | 'simple';

/** Что не так с паролем; null — подходит. */
export function passwordProblem(password: string, email = ''): PasswordProblem | null {
  if (password.length < PASSWORD_MIN) return 'short';
  const p = password.toLowerCase();
  if (CHASTYE.has(p)) return 'simple';
  /* Один и тот же знак или два знака по очереди: «aaaaaaaa», «abababab». */
  if (new Set(p).size <= 2) return 'simple';
  /* Целиком отрезок ряда — в любую сторону. */
  for (const ryad of RYADY) {
    if (ryad.includes(p) || [...ryad].reverse().join('').includes(p)) return 'simple';
  }
  /* Повтор короткого куска: «12341234», «qweqweqwe». */
  for (let n = 1; n <= p.length / 2; n++) {
    if (p.length % n === 0 && p.slice(0, n).repeat(p.length / n) === p) return 'simple';
  }
  /* Пароль — это почта или её имя («ivanov» → «ivanov123»). */
  const imya = email.trim().toLowerCase().split('@')[0] ?? '';
  if (imya.length >= 4 && (p.includes(imya) || p === email.trim().toLowerCase())) return 'simple';
  return null;
}
