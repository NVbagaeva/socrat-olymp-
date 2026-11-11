/**
 * Ответ в формате ЕГЭ для онлайн-варианта — общий модуль lib/otvet.
 *
 * Файл оставлен ради прежних импортов. Правила записи, причины неверной
 * записи и подсказки живут в lib/otvet/index.ts; та же таблица случаев
 * (normalizeCases.json) проверяет модуль сайта и функцию базы
 * public.normalize_ege_answer, чтобы сайт и сервер понимали ответ
 * одинаково.
 */

export {
  displayAnswer,
  normalizeAnswer,
  sameAnswer,
  type FormatProblem,
  type NormalAnswer,
  type Normalized,
} from '@/lib/otvet';
