/**
 * Состояние общего генератора: чистые функции, без React и браузера.
 * Их же проверяет автотест (scripts/check-generator.mjs).
 *
 * План — подтип на каждой позиции варианта. Позиции идут блоками по
 * темам в порядке конфига, внутри темы — в порядке добавления. Число
 * задач темы меняется степпером: к теме добавляется следующий подходящий
 * подтип по кругу, убирается — последний.
 */

import { plural } from '@/lib/plural';
import type {
  GenConfig,
  GenPreset,
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

/** Задач по темам: { PR: 1, SM: 2 }. */
export function countsByTopic(config: GenConfig, plan: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of plan) {
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
  const exact = topic.subtypes.filter((s) => levels.includes(s.level)).sort(order);
  if (exact.length > 0) return exact;
  const dist = (s: GenSubtype) => Math.min(...levels.map((l) => Math.abs(l - s.level)));
  const best = Math.min(...topic.subtypes.map(dist));
  return topic.subtypes.filter((s) => dist(s) === best).sort(order);
}

/** Есть ли у темы задачи точно выбранных уровней. */
export function topicHasLevels(topic: GenTopic, levels: readonly Level[]): boolean {
  return topic.subtypes.some((s) => levels.includes(s.level));
}

/** n подтипов темы по кругу, продолжая после уже выбранных. */
function extend(topic: GenTopic, levels: readonly Level[], have: string[], n: number): string[] {
  const c = candidates(topic, levels);
  if (c.length === 0) return have.slice(0, n);
  const out = have.slice(0, n);
  const last = out[out.length - 1];
  let k = last === undefined ? 0 : (c.findIndex((s) => s.id === last) + 1) % c.length;
  while (out.length < n) {
    const s = c[k % c.length];
    if (s !== undefined) out.push(s.id);
    k += 1;
  }
  return out;
}

/** План из блоков тем в порядке конфига. */
function assemble(config: GenConfig, byTopic: Record<string, string[]>): string[] {
  return config.topics.flatMap((t) => byTopic[t.id] ?? []);
}

function groupByTopic(config: GenConfig, plan: readonly string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of plan) {
    const t = topicOfSubtype(config, id);
    if (t === undefined) continue;
    (out[t.id] ??= []).push(id);
  }
  return out;
}

/* ── Изменения плана ────────────────────────────────────────────── */

export function setTopicCount(
  config: GenConfig,
  plan: readonly string[],
  topicId: string,
  n: number,
  levels: readonly Level[],
): string[] {
  const topic = config.topics.find((t) => t.id === topicId);
  if (topic === undefined) return plan.slice();
  const room = config.limits.maxTasks - (plan.length - (countsByTopic(config, plan)[topicId] ?? 0));
  const want = Math.max(0, Math.min(n, config.limits.maxPerTopic, room));
  const by = groupByTopic(config, plan);
  by[topicId] = extend(topic, levels, by[topicId] ?? [], want);
  return assemble(config, by);
}

export function setSubtypeCount(
  config: GenConfig,
  plan: readonly string[],
  subtypeId: string,
  n: number,
): string[] {
  const topic = topicOfSubtype(config, subtypeId);
  if (topic === undefined) return plan.slice();
  const by = groupByTopic(config, plan);
  const own = by[topic.id] ?? [];
  const others = own.filter((id) => id !== subtypeId);
  const room = Math.min(
    config.limits.maxPerTopic - others.length,
    config.limits.maxTasks - (plan.length - own.filter((id) => id === subtypeId).length),
  );
  const want = Math.max(0, Math.min(n, room));
  /* Подтип остаётся на своих местах в блоке темы; новые — в конец блока. */
  const kept: string[] = [];
  let left = want;
  for (const id of own) {
    if (id !== subtypeId) kept.push(id);
    else if (left > 0) {
      kept.push(id);
      left -= 1;
    }
  }
  while (left > 0) {
    kept.push(subtypeId);
    left -= 1;
  }
  by[topic.id] = kept;
  return assemble(config, by);
}

/** Уровни сменились: темы сохраняют число задач, подтипы подбираются заново. */
export function relayout(
  config: GenConfig,
  plan: readonly string[],
  levels: readonly Level[],
): string[] {
  const counts = countsByTopic(config, plan);
  const by: Record<string, string[]> = {};
  for (const t of config.topics) {
    const n = counts[t.id] ?? 0;
    if (n > 0) by[t.id] = extend(t, levels, [], n);
  }
  return assemble(config, by);
}

/** Источник сменился: темы, которых нет в этом источнике, уходят из плана. */
export function filterBySource(
  config: GenConfig,
  plan: readonly string[],
  source: SourceId,
): string[] {
  return plan.filter((id) => {
    const t = topicOfSubtype(config, id);
    return t !== undefined && topicAllowed(t, source);
  });
}

/** «Другой уровень» у одной позиции: другой подтип той же темы. */
export function changeLevelAt(
  config: GenConfig,
  plan: readonly string[],
  index: number,
  level: Level,
): string[] {
  const id = plan[index];
  if (id === undefined) return plan.slice();
  const topic = topicOfSubtype(config, id);
  if (topic === undefined) return plan.slice();
  const pool = candidates(topic, [level]);
  const next = pool.find((s) => s.id !== id) ?? pool[0];
  const out = plan.slice();
  if (next !== undefined) out[index] = next.id;
  return out;
}

export function removeAt(plan: readonly string[], index: number): string[] {
  return plan.filter((_, i) => i !== index);
}

/** Замены после удаления позиции: дальше по листу номера сдвигаются. */
export function shiftZameny(
  zameny: Record<string, number>,
  removed: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [pos, k] of Object.entries(zameny)) {
    const [v, i] = pos.split('.').map(Number);
    if (v === undefined || i === undefined || !Number.isFinite(i)) continue;
    if (i - 1 === removed) continue;
    out[`${v}.${i - 1 > removed ? i - 1 : i}`] = k;
  }
  return out;
}

/* ── Пресеты ────────────────────────────────────────────────────── */

export function planFromPreset(config: GenConfig, preset: GenPreset, source: SourceId): string[] {
  const by: Record<string, string[]> = {};
  for (const [key, n] of Object.entries(preset.sostav)) {
    if (key.includes('-')) {
      const t = topicOfSubtype(config, key);
      if (t !== undefined) (by[t.id] ??= []).push(...Array.from({ length: n }, () => key));
    } else {
      const t = config.topics.find((x) => x.id === key);
      if (t !== undefined)
        by[t.id] = extend(t, preset.levels, by[t.id] ?? [], (by[t.id]?.length ?? 0) + n);
    }
  }
  return filterBySource(config, assemble(config, by), source);
}

export function stateFromPreset(config: GenConfig, preset: GenPreset, source: SourceId): GenState {
  return {
    source,
    levels: preset.levels.slice(),
    variants: Math.min(preset.variants, config.limits.variantsMax),
    plan: planFromPreset(config, preset, source),
    seed: null,
    zameny: {},
  };
}

export function defaultState(config: GenConfig): GenState {
  const preset = config.presets[0];
  const source = config.sources[0]?.id ?? 'mix';
  if (preset === undefined)
    return { source, levels: [1, 2, 3], variants: 1, plan: [], seed: null, zameny: {} };
  return stateFromPreset(config, preset, source);
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
  if (state.levels.length === 0) out.push('нет уровней');
  for (const id of state.plan) {
    const t = topicOfSubtype(config, id);
    if (t === undefined) out.push(`неизвестный подтип ${id}`);
    else if (!topicAllowed(t, state.source)) out.push(`${t.id} нет в источнике ${state.source}`);
  }
  return out;
}
