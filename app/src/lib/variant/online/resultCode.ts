/**
 * Код результата: вариант, ответы и время одной строкой.
 *
 *   K7M2-1Z0GH-4F_1A3QZ…        код партии _ данные
 *
 * Ученик присылает код (или QR со ссылкой на /variant/proverka/)
 * учителю; страница проверки собирает тот же вариант по коду партии и
 * показывает полный разбор. Верно/неверно в код не входит — его
 * считает страница проверки по ключу варианта.
 *
 * Данные — поток битов, записанный знаками Crockford base32 (как коды
 * партий: читаются с бумаги):
 *
 *   4  версия формата (1)
 *   4  номер варианта − 1
 *   1  режим: 0 — тренировка, 1 — контрольная
 *   2  таймер: 0 — нет, 1 — секундомер, 2 — обратный отсчёт
 *   9  минут отсчёта (только при таймере 2)
 *   16 день завершения: дней с 01.01.2020
 *   4  число заданий
 *   на каждое задание:
 *      ответ — знаки по 4 бита (0–9, «.» = 10, «-» = 11), конец — 15;
 *      время, секунды — группы по 5 бит (4 бита числа + бит «дальше»);
 *      2 бита: подсказка открыта, исправлено со второй попытки (тренировка)
 *   время всей работы, секунды — как время задания
 *   12 контрольная сумма (FNV-1a по коду партии и всем битам выше)
 *
 * Контрольная сумма ловит опечатки при переписывании, а не подделку:
 * на этапе 1 сервера нет, и ученик может собрать код руками. Этап 2
 * (результаты через кабинет) этого ограничения не имеет.
 */

import type { Mode, Timer } from './link';
import { normalizeAnswer } from './normalize';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const VERSION = 1;
const SEP = '_';
const DAY0 = Date.UTC(2020, 0, 1);

export interface TaskRecord {
  /** Первая попытка в нормальной записи («-2.25»); '' — нет ответа. */
  answer: string;
  /** Время на задание, секунды. */
  seconds: number;
  /** Тренировка: открывал подсказку. */
  hinted: boolean;
  /** Тренировка: первая попытка неверна, вторая верна. */
  fixed: boolean;
}

export interface ResultData {
  /** Код партии. */
  code: string;
  variant: number;
  mode: Mode;
  timer: Timer;
  /** Дата завершения, ГГГГ-ММ-ДД (UTC). */
  date: string;
  tasks: TaskRecord[];
  /** Время всей работы, секунды. */
  seconds: number;
}

/* ── Биты ───────────────────────────────────────────────────────── */

class Writer {
  bits: number[] = [];
  put(value: number, len: number): void {
    for (let i = len - 1; i >= 0; i -= 1) this.bits.push(Math.floor(value / 2 ** i) % 2);
  }
  varint(value: number): void {
    let v = Math.max(0, Math.round(value));
    do {
      const part = v % 16;
      v = Math.floor(v / 16);
      this.put(v > 0 ? 1 : 0, 1);
      this.put(part, 4);
    } while (v > 0);
  }
}

class Reader {
  at = 0;
  constructor(readonly bits: readonly number[]) {}
  get(len: number): number {
    if (this.at + len > this.bits.length) throw new Error('short');
    let v = 0;
    for (let i = 0; i < len; i += 1) v = v * 2 + (this.bits[this.at + i] ?? 0);
    this.at += len;
    return v;
  }
  varint(): number {
    let v = 0;
    let scale = 1;
    for (let guard = 0; guard < 8; guard += 1) {
      const more = this.get(1);
      v += this.get(4) * scale;
      scale *= 16;
      if (more === 0) return v;
    }
    throw new Error('varint');
  }
}

function checksum(code: string, bits: readonly number[]): number {
  let h = 0x811c9dc5;
  const feed = (byte: number) => {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  for (const ch of code) feed(ch.charCodeAt(0) & 0xff);
  feed(0);
  for (const b of bits) feed(b);
  return h % 4096;
}

const CHARS = '0123456789.-';

function dayOf(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (m === null) return 0;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.max(0, Math.min(65535, Math.round((t - DAY0) / 86_400_000)));
}

function dateOf(day: number): string {
  return new Date(DAY0 + day * 86_400_000).toISOString().slice(0, 10);
}

/* ── Код ────────────────────────────────────────────────────────── */

export function encodeResult(r: ResultData): string {
  const w = new Writer();
  w.put(VERSION, 4);
  w.put(Math.max(0, Math.min(15, r.variant - 1)), 4);
  w.put(r.mode === 'kontrol' ? 1 : 0, 1);
  w.put(r.timer.kind === 'up' ? 1 : r.timer.kind === 'down' ? 2 : 0, 2);
  if (r.timer.kind === 'down') w.put(Math.min(511, r.timer.minutes), 9);
  w.put(dayOf(r.date), 16);
  w.put(Math.min(15, r.tasks.length), 4);
  for (const t of r.tasks.slice(0, 15)) {
    const n = normalizeAnswer(t.answer);
    const text = n.ok ? n.value : '';
    for (const ch of text.slice(0, 20)) w.put(CHARS.indexOf(ch), 4);
    w.put(15, 4);
    w.varint(t.seconds);
    w.put(t.hinted ? 1 : 0, 1);
    w.put(t.fixed ? 1 : 0, 1);
  }
  w.varint(r.seconds);
  w.put(checksum(r.code, w.bits), 12);
  while (w.bits.length % 5 !== 0) w.bits.push(0);
  let out = '';
  for (let i = 0; i < w.bits.length; i += 5) {
    let v = 0;
    for (let j = 0; j < 5; j += 1) v = v * 2 + (w.bits[i + j] ?? 0);
    out += ALPHABET[v];
  }
  return `${r.code}${SEP}${out}`;
}

/** Код с бумаги: регистр, пробелы и похожие буквы прощаются. */
function clean(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[ОO]/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[–—]/g, '-');
}

/** Код результата → данные. null — код не читается или сумма не сошлась. */
export function decodeResult(raw: string): ResultData | null {
  const text = clean(raw);
  const cut = text.lastIndexOf(SEP);
  if (cut <= 0) return null;
  const code = text.slice(0, cut);
  const body = text.slice(cut + 1);
  const bits: number[] = [];
  for (const ch of body) {
    const d = ALPHABET.indexOf(ch);
    if (d < 0) return null;
    for (let j = 4; j >= 0; j -= 1) bits.push(Math.floor(d / 2 ** j) % 2);
  }
  try {
    const r = new Reader(bits);
    if (r.get(4) !== VERSION) return null;
    const variant = r.get(4) + 1;
    const mode: Mode = r.get(1) === 1 ? 'kontrol' : 'trening';
    const tk = r.get(2);
    const timer: Timer =
      tk === 1 ? { kind: 'up' } : tk === 2 ? { kind: 'down', minutes: r.get(9) } : { kind: 'none' };
    const date = dateOf(r.get(16));
    const count = r.get(4);
    const tasks: TaskRecord[] = [];
    for (let i = 0; i < count; i += 1) {
      let answer = '';
      for (let guard = 0; guard <= 20; guard += 1) {
        const c = r.get(4);
        if (c === 15) break;
        const ch = CHARS[c];
        if (ch === undefined || guard === 20) return null;
        answer += ch;
      }
      const seconds = r.varint();
      const hinted = r.get(1) === 1;
      const fixed = r.get(1) === 1;
      tasks.push({ answer, seconds, hinted, fixed });
    }
    const seconds = r.varint();
    const sumAt = r.at;
    const sum = r.get(12);
    if (sum !== checksum(code, bits.slice(0, sumAt))) return null;
    /* Хвост — только выравнивание нулями до знака. */
    if (bits.length - r.at >= 5 || bits.slice(r.at).some((b) => b !== 0)) return null;
    if (tasks.some((t) => t.answer !== '' && !normalizeAnswer(t.answer).ok)) return null;
    return { code, variant, mode, timer, date, tasks, seconds };
  } catch {
    return null;
  }
}
