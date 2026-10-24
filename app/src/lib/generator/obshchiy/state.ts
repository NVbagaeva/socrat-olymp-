/**
 * Состояние общего генератора: чистые функции, без React и браузера.
 * Их же проверяет автотест (scripts/check-generator.mjs).
 *
 * План — позиции варианта: подтип и номер внутри подтипа (GenSlot).
 * Пресет раскладывает темы блоками в порядке конфига; дальше порядок
 * задаёт учитель. Число задач темы меняется степпером: к теме добавляется
 * следующий подходящий подтип по кругу — после задач того же подтипа или
 * в конец темы, — убирается последняя. Новой позиции достаётся
 * наименьший свободный номер: «−» и «+» возвращают ту же задачу.
 */

import { plural } from '@/lib/plural';
import type {
  GenConfig,
  GenExtras,
  GenPreset,
  GenSlot,
  GenState,
  GenSubtype,
  GenTopic,
  Level,
  SourceId,
} from './types';

/* ── Справочники ────────────────────────────────────────────────── */

export function topicOfSubtype(config: GenConfig, subtypeId: string): GenTopic | undefined {
  return config.topics.find((t) => t.subtypes.some((s) => s.id === subtypeId));
}

export function subtypeById(config: GenConfig, id: string): GenSubtype | undefined {
  for (const t of config.topics) {
    const s = t.subtypes.find((x) => x.id === id);
    if (s !== undefined) return s;
  }
  return undefined;
}

export function topicAllowed(topic: GenTopic, source: SourceId): boolean {
  return topic.sources === undefined || topic.sources.includes(source);
}

/** Ключ позиции: «PR-04_0». */
export function slotKey(s: GenSlot): string {
  return `${s.id}_${s.k}`;
}

/** Ключ замены: «2.PR-04_0». */
export function posKey(variant: number, s: GenSlot): string {
  return `${variant}.${slotKey(s)}`;
}

/** Номер позиции в плане по ключу замены; -1 — такой позиции нет. */
export function indexOfPos(plan: readonly GenSlot[], pos: string): number {
  const key = pos.slice(pos.indexOf('.') + 1);
  return plan.findIndex((s) => slotKey(s) === key);
}

/** Задач по темам: { PR: 1, SM: 2 }. */
export function countsByTopic(config: GenConfig, plan: readonly GenSlot[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const { id } of plan) {
    const t = topicOfSubtype(config, id);
    if (t !== undefined) out[t.id] = (out[t.id] ?? 0) + 1;
  }
  return out;
}

/* ── Подбор подтипов ────────────────────────────────────────────── */

/**
 * Подтипы темы под выбранные уровни: сначала точные, по уровню и по
 * числу задач в банке. Нет ни одного точного — ближайший уровень: фильтр
 * сложности не выкидывает тему из состава.
 */
export function candidates(topic: GenTopic, levels: readonly Level[]): GenSubtype[] {
  const order = (a: GenSubtype, b: GenSubtype) =>
    a.level - b.level || b.bank - a.bank || a.id.localeCompare(b.id);
  const exact = topic.subtypes.filter((s) => umeet(s, levels)).sort(order);
  if (exact.length > 0) return exact;
  const dist = (s: GenSubtype) =>
    Math.min(...levels.flatMap((l) => urovniPodtipa(s).map((u) => Math.abs(l - u))));
  const best = Math.min(...topic.subtypes.map(dist));
  return topic.subtypes.filter((s) => dist(s) === best).sort(order);
}

/** Уровни подтипа: несколько (levels) или один (level). */
export function urovniPodtipa(s: GenSubtype): Level[] {
  return s.levels ?? [s.level];
}

/** Умеет ли подтип хотя бы один из уровней. */
function umeet(s: GenSubtype, levels: readonly Level[]): boolean {
  return urovniPodtipa(s).some((l) => levels.includes(l));
}

/** Есть ли у темы задачи точно выбранных уровней. */
export function topicHasLevels(topic: GenTopic, levels: readonly Level[]): boolean {
  return topic.subtypes.some((s) => umeet(s, levels));
}

/** add подтипов темы по кругу, продолжая после уже выбранных. */
function nextIds(
  topic: GenTopic,
  levels: readonly Level[],
  have: readonly string[],
  add: number,
): string[] {
  const c = candidates(topic, levels);
  if (c.length === 0) return [];
  const last = have[have.length - 1];
  let k = last === undefined ? 0 : (c.findIndex((s) => s.id === last) + 1) % c.length;
  const out: string[] = [];
  while (out.length < add) {
    const s = c[k % c.length];
    if (s !== undefined) out.push(s.id);
    k += 1;
  }
  return out;
}

/** Наименьший номер подтипа, которого нет в плане. */
function freeK(plan: readonly GenSlot[], id: string): number {
  const used = new Set(plan.filter((s) => s.id === id).map((s) => s.k));
  let k = 0;
  while (used.has(k)) k += 1;
  return k;
}

/** Позиции по списку подтипов: номера по порядку, без повторов. */
export function slotsOf(ids: readonly string[]): GenSlot[] {
  const out: GenSlot[] = [];
  for (const id of ids) out.push({ id, k: freeK(out, id) });
  return out;
}

/**
 * Новая позиция подтипа: после задач того же подтипа, иначе после задач
 * темы, иначе там, где тема стоит в конфиге.
 */
function insertSlot(config: GenConfig, plan: readonly GenSlot[], id: string): GenSlot[] {
  const topic = topicOfSubtype(config, id);
  const out = plan.slice();
  const slot = { id, k: freeK(plan, id) };
  const lastOf = (pred: (s: GenSlot) => boolean) => {
    for (let i = out.length - 1; i >= 0; i -= 1) {
      const s = out[i];
      if (s !== undefined && pred(s)) return i;
    }
    return -1;
  };
  let at = lastOf((s) => s.id === id);
  if (at < 0) at = lastOf((s) => topicOfSubtype(config, s.id) === topic);
  if (at >= 0) {
    out.splice(at + 1, 0, slot);
    return out;
  }
  const order = (s: GenSlot) => config.topics.findIndex((t) => t === topicOfSubtype(config, s.id));
  const mine = config.topics.findIndex((t) => t === topic);
  const before = out.findIndex((s) => order(s) > mine);
  out.splice(before < 0 ? out.length : before, 0, slot);
  return out;
}

/** План из блоков тем в порядке конфига. */
function assemble(config: GenConfig, byTopic: Record<string, string[]>): string[] {
  return config.topics.flatMap((t) => byTopic[t.id] ?? []);
}

/* ── Изменения плана ────────────────────────────────────────────── */

export function setTopicCount(
  config: GenConfig,
  plan: readonly GenSlot[],
  topicId: string,
  n: number,
  levels: readonly Level[],
): GenSlot[] {
  const topic = config.topics.find((t) => t.id === topicId);
  if (topic === undefined) return plan.slice();
  const own = plan.filter((s) => topicOfSubtype(config, s.id) === topic);
  const room = config.limits.maxTasks - (plan.length - own.length);
  const want = Math.max(0, Math.min(n, config.limits.maxPerTopic, room));
  if (want <= own.length) {
    const drop = new Set(own.slice(want));
    return plan.filter((s) => !drop.has(s));
  }
  const ids = nextIds(
    topic,
    levels,
    own.map((s) => s.id),
    want - own.length,
  );
  return ids.reduce((acc, id) => insertSlot(config, acc, id), plan.slice());
}

export function setSubtypeCount(
  config: GenConfig,
  plan: readonly GenSlot[],
  subtypeId: string,
  n: number,
): GenSlot[] {
  const topic = topicOfSubtype(config, subtypeId);
  if (topic === undefined) return plan.slice();
  const ofTopic = plan.filter((s) => topicOfSubtype(config, s.id) === topic);
  const own = plan.filter((s) => s.id === subtypeId);
  const room = Math.min(
    config.limits.maxPerTopic - (ofTopic.length - own.length),
    config.limits.maxTasks - (plan.length - own.length),
  );
  const want = Math.max(0, Math.min(n, room));
  if (want <= own.length) {
    const drop = new Set(own.slice(want));
    return plan.filter((s) => !drop.has(s));
  }
  let out = plan.slice();
  for (let i = own.length; i < want; i += 1) out = insertSlot(config, out, subtypeId);
  return out;
}

/**
 * Уровни сменились: темы сохраняют число задач и места на листе, подтипы
 * подбираются заново. Позиция, чей подтип остался, сохраняет задачу.
 */
export function relayout(
  config: GenConfig,
  plan: readonly GenSlot[],
  levels: readonly Level[],
): GenSlot[] {
  const fresh = new Map<GenTopic, string[]>();
  for (const t of config.topics) {
    const n = plan.filter((s) => topicOfSubtype(config, s.id) === t).length;
    if (n > 0) fresh.set(t, nextIds(t, levels, [], n));
  }
  const out = plan.slice();
  out.forEach((s, i) => {
    const t = topicOfSubtype(config, s.id);
    const id = t === undefined ? undefined : fresh.get(t)?.shift();
    if (id === undefined || id === s.id) return;
    out[i] = { id, k: freeK(out, id) };
  });
  return out;
}

/** Источник сменился: темы, которых нет в этом источнике, уходят из плана. */
export function filterBySource(
  config: GenConfig,
  plan: readonly GenSlot[],
  source: SourceId,
): GenSlot[] {
  return plan.filter((s) => {
    const t = topicOfSubtype(config, s.id);
    return t !== undefined && topicAllowed(t, source);
  });
}

/** «Другой уровень» у одной позиции: другой подтип той же темы. */
export function changeLevelAt(
  config: GenConfig,
  plan: readonly GenSlot[],
  index: number,
  level: Level,
): GenSlot[] {
  const cur = plan[index];
  if (cur === undefined) return plan.slice();
  const topic = topicOfSubtype(config, cur.id);
  if (topic === undefined) return plan.slice();
  const pool = candidates(topic, [level]);
  const next = pool.find((s) => s.id !== cur.id) ?? pool[0];
  if (next === undefined) return plan.slice();
  const rest = plan.filter((_, i) => i !== index);
  const out = plan.slice();
  out[index] = next.id === cur.id ? cur : { id: next.id, k: freeK(rest, next.id) };
  return out;
}

export function removeAt(plan: readonly GenSlot[], index: number): GenSlot[] {
  return plan.filter((_, i) => i !== index);
}

/** Перестановка: позиция from встаёт на место to, задачи едут с ней. */
export function moveSlot(plan: readonly GenSlot[], from: number, to: number): GenSlot[] {
  const out = plan.slice();
  const [s] = out.splice(from, 1);
  if (s === undefined || to < 0 || to > out.length) return plan.slice();
  out.splice(to, 0, s);
  return out;
}

/** Замены только для позиций и вариантов, которые есть в наборе. */
export function pruneZameny(
  zameny: Record<string, number>,
  plan: readonly GenSlot[],
  variants: number,
): Record<string, number> {
  const keys = new Set(plan.map(slotKey));
  const out: Record<string, number> = {};
  for (const [pos, k] of Object.entries(zameny)) {
    const v = Number(pos.slice(0, pos.indexOf('.')));
    if (v >= 1 && v <= variants && keys.has(pos.slice(pos.indexOf('.') + 1))) out[pos] = k;
  }
  return out;
}

/* ── Пресеты ────────────────────────────────────────────────────── */

export function planFromPreset(config: GenConfig, preset: GenPreset, source: SourceId): GenSlot[] {
  const by: Record<string, string[]> = {};
  for (const [key, n] of Object.entries(preset.sostav)) {
    const topic = config.topics.find((x) => x.id === key);
    if (topic === undefined) {
      const t = topicOfSubtype(config, key);
      if (t !== undefined) (by[t.id] ??= []).push(...Array.from({ length: n }, () => key));
    } else {
      const have = by[topic.id] ?? [];
      by[topic.id] = [...have, ...nextIds(topic, preset.levels, have, n)];
    }
  }
  return filterBySource(config, slotsOf(assemble(config, by)), source);
}

/** «Дополнительно» по умолчанию: лист без рамок, примеров и QR. */
export function defaultExtras(config: GenConfig): GenExtras {
  return {
    theory: false,
    examples: 0,
    qr: false,
    kind: null,
    date: '',
    teacher: config.sheet.teacher,
  };
}

/** Пресет заполняет состав, уровни, варианты и вид работы; остальное «Дополнительно» — как было. */
export function stateFromPreset(
  config: GenConfig,
  preset: GenPreset,
  source: SourceId,
  extras: GenExtras = defaultExtras(config),
): GenState {
  return {
    source,
    levels: preset.levels.slice(),
    variants: Math.min(preset.variants, config.limits.variantsMax),
    plan: planFromPreset(config, preset, source),
    seed: null,
    zameny: {},
    extras: { ...extras, kind: preset.kind ?? null },
  };
}

export function defaultState(config: GenConfig): GenState {
  const preset = config.presets[0];
  const source = config.sources[0]?.id ?? 'mix';
  if (preset === undefined)
    return {
      source,
      levels: [1, 2, 3],
      variants: 1,
      plan: [],
      seed: null,
      zameny: {},
      extras: defaultExtras(config),
    };
  return stateFromPreset(config, preset, source);
}

/** Сколько пунктов «Дополнительно» включено: для подписи кнопки. */
export function extrasOn(extras: GenExtras): number {
  return [extras.theory, extras.examples > 0, extras.qr].filter(Boolean).length;
}

/** Какой пресет совпадает с экраном: число вариантов, уровни и темы. */
export function matchPreset(config: GenConfig, state: GenState): string | null {
  const counts = countsByTopic(config, state.plan);
  const same = (a: Record<string, number>, b: Record<string, number>) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].every((k) => (a[k] ?? 0) === (b[k] ?? 0));
  };
  for (const p of config.presets) {
    const want = countsByTopic(config, planFromPreset(config, p, state.source));
    const lv = [...p.levels].sort().join() === [...state.levels].sort().join();
    if (p.variants === state.variants && lv && same(counts, want)) return p.id;
  }
  return null;
}

/* ── Слова ──────────────────────────────────────────────────────── */

export function levelsText(levels: readonly Level[]): string {
  const s = [...levels].sort();
  const star = (l: number) => '★'.repeat(l);
  if (s.length === 0) return '';
  if (s.length === 3) return '★–★★★';
  if (s.length === 1) return star(s[0] ?? 1);
  const [a = 1, b = 1] = s;
  return b - a === 1 ? `${star(a)}–${star(b)}` : `${star(a)} и ${star(b)}`;
}

export function tasksText(n: number): string {
  return `${n} ${plural(n, 'задача', 'задачи', 'задач')}`;
}

export function variantsText(n: number): string {
  return `${n} ${plural(n, 'вариант', 'варианта', 'вариантов')}`;
}

export function summary(
  config: GenConfig,
  state: GenState,
): { main: string; rest: string; full: string } {
  const main = `${tasksText(state.plan.length)} · ${variantsText(state.variants)}`;
  const src = config.sources.find((s) => s.id === state.source)?.short ?? '';
  const rest = [levelsText(state.levels), config.sources.length > 1 ? src : '']
    .filter(Boolean)
    .join(' · ');
  return { main, rest, full: rest === '' ? main : `${main} · ${rest}` };
}

/* ── Проверка ───────────────────────────────────────────────────── */

/** Нарушения ограничений; пустой список — состояние годно. */
export function problems(config: GenConfig, state: GenState): string[] {
  const out: string[] = [];
  if (state.plan.length === 0) out.push('нет задач');
  if (state.plan.length > config.limits.maxTasks)
    out.push(`больше ${config.limits.maxTasks} задач`);
  for (const [t, n] of Object.entries(countsByTopic(config, state.plan))) {
    if (n > config.limits.maxPerTopic) out.push(`${t}: больше ${config.limits.maxPerTopic}`);
  }
  if (state.variants < 1 || state.variants > config.limits.variantsMax) out.push('число вариантов');
  if (config.levels.length > 0 && state.levels.length === 0) out.push('нет уровней');
  if (new Set(state.plan.map(slotKey)).size !== state.plan.length) out.push('повтор позиции');
  for (const { id } of state.plan) {
    const t = topicOfSubtype(config, id);
    if (t === undefined) out.push(`неизвестный подтип ${id}`);
    else if (!topicAllowed(t, state.source)) out.push(`${t.id} нет в источнике ${state.source}`);
  }
  return out;
}
