/**
 * Журнал решения задач — запись браузера (docs/kabinet-zhurnal.md).
 *
 * Одна запись — одна задача, которую ученик открыл. Запись копится в
 * браузере и уходит на сервер функцией zhurnal_push; повтор той же записи
 * её дополняет, поэтому браузер присылает запись целиком при каждом
 * изменении. Чистые функции, без браузера.
 */

export type Mesto = 'trenazher' | 'opornye' | 'kartochki' | 'variant' | 'povyshennye' | 'dz';

/**
 * Чем закрылась задача. Первые четыре — как в журнале прогресса
 * (lib/progressLog): right — верно с первой попытки без подсказки;
 * hinted — верно, но с подсказкой; revealed — решение открыто до верного
 * ответа; wrong — ошибка. skipped — «Пропустить», left — ушёл с задачи.
 */
export type Iskhod = 'right' | 'hinted' | 'wrong' | 'revealed' | 'skipped' | 'left';

/** answer — засчитанная попытка; format и fraction попытку не тратят. */
export type VidPopytki = 'answer' | 'format' | 'fraction';

export interface Popytka {
  n: number;
  answer: string;
  ok: boolean;
  vid: VidPopytki;
  /** ISO-время. */
  at: string;
}

export interface ZapisZadachi {
  id: string;
  task_no: number;
  kind: string;
  task_ref: string;
  gen_hash?: string;
  uslovie_tex?: string;
  risunok?: string;
  level?: 1 | 2 | 3;
  place: Mesto;
  place_ref?: string;
  outcome: Iskhod | null;
  answer_key?: string;
  attempts_n: number;
  hint_steps: number;
  hint_wrong: number[];
  shown_fact: boolean;
  shown_solution: boolean;
  skipped: boolean;
  active_ms: number;
  total_ms: number;
  started_at: string;
  closed_at: string | null;
  popytki: Popytka[];
}

export interface ZapisVarianta {
  id: string;
  source: 'sobrat' | 'seriya' | 'povyshennye' | 'rabota';
  set_code: string;
  variant_no?: number;
  title?: string;
  started_at: string;
  finished_at: string | null;
  primary_score?: number;
  max_score?: number;
  test_score?: number;
  active_ms: number;
  total_ms: number;
}

/** Пределы базы: длиннее она не примет. */
export const PREDELY = {
  popytok: 20,
  otvet: 40,
  uslovie: 2000,
  zadachVPachke: 50,
  variantovVPachke: 10,
} as const;

export interface NovayaZadacha {
  id: string;
  task_no: number;
  kind: string;
  task_ref: string;
  place: Mesto;
  place_ref?: string;
  level?: 1 | 2 | 3;
  gen_hash?: string;
  uslovie_tex?: string;
  /** Путь картинки сайта к задаче банка. */
  risunok?: string;
}

export function novayaZapis(z: NovayaZadacha, at: number): ZapisZadachi {
  const out: ZapisZadachi = {
    id: z.id,
    task_no: z.task_no,
    kind: z.kind.slice(0, 40),
    task_ref: z.task_ref.slice(0, 160),
    place: z.place,
    outcome: null,
    attempts_n: 0,
    hint_steps: 0,
    hint_wrong: [],
    shown_fact: false,
    shown_solution: false,
    skipped: false,
    active_ms: 0,
    total_ms: 0,
    started_at: new Date(at).toISOString(),
    closed_at: null,
    popytki: [],
  };
  if (z.place_ref !== undefined) out.place_ref = z.place_ref.slice(0, 64);
  if (z.level !== undefined) out.level = z.level;
  if (z.gen_hash !== undefined) out.gen_hash = z.gen_hash.slice(0, 16);
  if (z.uslovie_tex !== undefined && z.uslovie_tex.length <= PREDELY.uslovie) {
    out.uslovie_tex = z.uslovie_tex;
  }
  if (z.risunok !== undefined && /^\/[A-Za-z0-9_./-]{1,200}$/.test(z.risunok)) out.risunok = z.risunok;
  return out;
}

/** Попытка ответа. Закрытая задача попыток не принимает. */
export function sPopytkoy(z: ZapisZadachi, answer: string, ok: boolean, vid: VidPopytki, at: number): ZapisZadachi {
  if (z.outcome !== null || z.popytki.length >= PREDELY.popytok) return z;
  return {
    ...z,
    attempts_n: vid === 'answer' ? z.attempts_n + 1 : z.attempts_n,
    popytki: [
      ...z.popytki,
      { n: z.popytki.length + 1, answer: answer.slice(0, PREDELY.otvet), ok, vid, at: new Date(at).toISOString() },
    ],
  };
}

/** Открыт шаг подсказки (номер с 1): запоминается наибольший. */
export function sShagomPodskazki(z: ZapisZadachi, shag: number): ZapisZadachi {
  return shag > z.hint_steps ? { ...z, hint_steps: Math.min(shag, 20) } : z;
}

/** Неверная кнопка на шаге подсказки. */
export function sOshibkoyPodskazki(z: ZapisZadachi, shag: number): ZapisZadachi {
  if (z.hint_wrong.includes(shag) || z.hint_wrong.length >= 20) return z;
  return { ...z, hint_wrong: [...z.hint_wrong, shag].sort((a, b) => a - b) };
}

export function sOtmetkoy(
  z: ZapisZadachi,
  chto: 'shown_fact' | 'shown_solution' | 'skipped',
): ZapisZadachi {
  return z[chto] ? z : { ...z, [chto]: true };
}

/** Время записи: активное не больше общего. */
export function sVremenem(z: ZapisZadachi, activeMs: number, totalMs: number): ZapisZadachi {
  const total = Math.max(z.total_ms, Math.round(totalMs));
  const active = Math.min(total, Math.max(z.active_ms, Math.round(activeMs)));
  return active === z.active_ms && total === z.total_ms ? z : { ...z, active_ms: active, total_ms: total };
}

/** Закрыть задачу. Уже закрытая не меняется: первое закрытие главное. */
export function zakryta(z: ZapisZadachi, outcome: Iskhod, at: number, answerKey?: string): ZapisZadachi {
  if (z.outcome !== null) return z;
  const out: ZapisZadachi = { ...z, outcome, closed_at: new Date(at).toISOString() };
  if (outcome === 'skipped') out.skipped = true;
  if (answerKey !== undefined) out.answer_key = answerKey.slice(0, PREDELY.otvet);
  return out;
}

/**
 * Исход по ходу решения — то же правило, что у тренажёров: верно с
 * первой попытки без подсказки — right; верно, но с подсказкой или
 * открытым свойством — hinted; решение открыто до верного ответа —
 * revealed; ошибки — wrong.
 */
export function iskhodPoKhodu(z: ZapisZadachi, verno: boolean): Iskhod {
  if (!verno) return z.shown_solution ? 'revealed' : 'wrong';
  if (z.popytki.some((p) => p.vid === 'answer' && !p.ok)) return 'wrong';
  if (z.shown_solution) return 'revealed';
  if (z.hint_steps > 0 || z.shown_fact) return 'hinted';
  return 'right';
}

/**
 * Идентификатор записи из строки: та же задача той же тренировки после
 * перезагрузки страницы получает тот же id, и запись дополняется, а не
 * дублируется. Формат UUID — его ждёт база. Хеш не криптографический:
 * совпадение у одного ученика возможно лишь теоретически, а чужие id
 * не пересекаются — ключ записи в базе (ученик, id).
 */
export function idIz(stroka: string): string {
  const h = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  for (let i = 0; i < stroka.length; i += 1) {
    const c = stroka.charCodeAt(i);
    for (let k = 0; k < 4; k += 1) {
      h[k] = Math.imul((h[k] ?? 0) ^ (c + k * 31), 0x01000193 + k * 0x2f) >>> 0;
    }
  }
  const hex = h.map((x) => x.toString(16).padStart(8, '0')).join('');
  /* Версия 8 (свой формат) и вариант RFC 4122. */
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${(
    (parseInt(hex.slice(16, 17), 16) & 0x3) |
    0x8
  ).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Случайный id для записи без естественного ключа. */
export function sluchaynyyId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return idIz(`${Date.now()}:${Math.random()}`);
}

/* ── Очередь отправки ───────────────────────────────────────────── */

export interface Ochered {
  v: 1;
  /** id → запись и номер её версии: отправленная версия снимается, более новая остаётся. */
  zadachi: Record<string, { z: ZapisZadachi; ver: number }>;
  varianty: Record<string, { z: ZapisVarianta; ver: number }>;
}

export const PUSTAYA_OCHERED: Ochered = { v: 1, zadachi: {}, varianty: {} };

/** Сколько записей держать без связи. Старые закрытые уходят первыми. */
export const PREDEL_OCHEREDI = 600;

export function vOchered(q: Ochered, z: ZapisZadachi): Ochered {
  const ver = (q.zadachi[z.id]?.ver ?? 0) + 1;
  let zadachi = { ...q.zadachi, [z.id]: { z, ver } };
  const ids = Object.keys(zadachi);
  if (ids.length > PREDEL_OCHEREDI) {
    const lishnie = ids
      .filter((id) => id !== z.id)
      .sort((a, b) => (zadachi[a]?.z.started_at ?? '').localeCompare(zadachi[b]?.z.started_at ?? ''))
      .slice(0, ids.length - PREDEL_OCHEREDI);
    zadachi = Object.fromEntries(Object.entries(zadachi).filter(([id]) => !lishnie.includes(id)));
  }
  return { ...q, zadachi };
}

export function variantVOchered(q: Ochered, v: ZapisVarianta): Ochered {
  const ver = (q.varianty[v.id]?.ver ?? 0) + 1;
  return { ...q, varianty: { ...q.varianty, [v.id]: { z: v, ver } } };
}

export interface Pachka {
  zadachi: ZapisZadachi[];
  varianty: ZapisVarianta[];
  /** Какие версии ушли: их и снять после ответа сервера. */
  versii: { zadachi: Record<string, number>; varianty: Record<string, number> };
}

/** Следующая пачка: варианты раньше задач (задачи на них ссылаются). */
export function pachka(q: Ochered): Pachka | null {
  const varianty = Object.values(q.varianty).slice(0, PREDELY.variantovVPachke);
  const zadachi = Object.values(q.zadachi)
    .sort((a, b) => a.z.started_at.localeCompare(b.z.started_at))
    .slice(0, PREDELY.zadachVPachke);
  if (varianty.length === 0 && zadachi.length === 0) return null;
  return {
    zadachi: zadachi.map((e) => e.z),
    varianty: varianty.map((e) => e.z),
    versii: {
      zadachi: Object.fromEntries(zadachi.map((e) => [e.z.id, e.ver])),
      varianty: Object.fromEntries(varianty.map((e) => [e.z.id, e.ver])),
    },
  };
}

/** Снять отправленное. Запись, изменённую после отправки, — оставить. */
export function bezOtpravlennogo(q: Ochered, p: Pachka): Ochered {
  const zadachi = { ...q.zadachi };
  for (const [id, ver] of Object.entries(p.versii.zadachi)) {
    if (zadachi[id]?.ver === ver) delete zadachi[id];
  }
  const varianty = { ...q.varianty };
  for (const [id, ver] of Object.entries(p.versii.varianty)) {
    if (varianty[id]?.ver === ver) delete varianty[id];
  }
  return { ...q, zadachi, varianty };
}

export function razobratOchered(raw: unknown): Ochered {
  if (typeof raw !== 'object' || raw === null) return PUSTAYA_OCHERED;
  const v = raw as Partial<Ochered>;
  if (v.v !== 1 || typeof v.zadachi !== 'object' || typeof v.varianty !== 'object') return PUSTAYA_OCHERED;
  return { v: 1, zadachi: v.zadachi ?? {}, varianty: v.varianty ?? {} };
}

export function razmerOcheredi(q: Ochered): number {
  return Object.keys(q.zadachi).length + Object.keys(q.varianty).length;
}

/**
 * Отпечаток условия (gen_hash): 16 знаков. Учитель собирает задачу по
 * task_ref заново и сверяет отпечаток; не совпал — генератор с тех пор
 * изменился, и задача показывается по сохранённому условию.
 */
export function otpechatokUsloviya(uslovie: string): string {
  return idIz(uslovie).replace(/-/g, '').slice(0, 16);
}
