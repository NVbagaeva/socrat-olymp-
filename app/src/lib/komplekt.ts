/**
 * Комплект печатных листов генератора: лист ученика и лист учителя
 * из одних и тех же заданий.
 *
 * Код комплекта — «7K3F-2B»: четыре знака — seed листа, два — версия
 * генератора, который его собрал (scripts/lib/generator-versions.mjs).
 * Код печатается мелко в колонтитуле обоих листов.
 *
 * Как комплект восстанавливается. Все генераторы детерминированы:
 * адрес листа (настройки + seed) всегда даёт тот же лист. Поэтому
 * комплект хранит не задания, а адреса обоих листов, — двадцать
 * комплектов с рисунками в localStorage не поместились бы. Чтобы
 * «тот же адрес — те же задания» было проверяемо, при первой печати
 * лист записывает отпечаток условий и ответов; при повторной сверяет
 * его. Генератор поменялся (другая версия в коде) и отпечаток не
 * сошёлся — лист честно говорит, что точно восстановить комплект
 * нельзя.
 *
 * Жизненный цикл комплекта на экране генератора:
 *   черновик  — ещё не скачан: следует за настройками, код тот же;
 *   скачан    — хоть один лист открыт на печать: комплект заморожен и
 *               лежит в «Моих комплектах» (последние 20). Смена
 *               настроек его не трогает;
 *   новый     — только кнопка «Новый комплект» даёт новый seed.
 *
 * Модуль без React: его же берёт автотест (scripts/check-komplekty.mjs).
 */

import { storage } from '@/lib/storage';

/** Область комплекта — задание, чей генератор его собрал. */
export type KitScope = '12' | '2' | '4' | '5' | '8' | '11';

export type SheetWhich = 'student' | 'teacher';

export interface Kit {
  /** «7K3F-2B». */
  code: string;
  /** Seed листа: «7K3F». */
  id: string;
  /** Версия генератора: «2B». */
  version: string;
  scope: KitScope;
  /** Экран генератора: у №12 их четыре — по подтеме. */
  slot: string;
  /** Раздел для «Моих комплектов»: «№12 · Линейная функция». */
  section: string;
  /** Адреса листов с кодом комплекта (параметр kit). */
  studentHref: string;
  teacherHref: string;
  /** Заданий на листе, во всех вариантах. */
  count: number;
  /** Настройки без seed: по ним черновик следует за экраном. */
  settings: string;
  /** Когда комплект скачан впервые, ISO. Черновик — null. */
  createdAt: string | null;
  /** Отпечатки листов (условия и ответы) — пишет лист при первой печати. */
  fingerprints: Record<SheetWhich, string | null>;
  downloaded: Record<SheetWhich, boolean>;
}

/** Сколько комплектов помнят «Мои комплекты». */
export const KIT_HISTORY = 20;

const HISTORY_KEY = 'komplekty';
const CURRENT_KEY = 'komplekt:';

/* Crockford base32: без I, L, O, U — код читают с бумаги. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/* ── Код ───────────────────────────────────────────────────────── */

let versions: Record<string, string> | null = null;

/** Версия генератора области: считает сборка (next.config.ts). */
export function generatorVersion(scope: KitScope): string {
  if (versions === null) {
    try {
      versions = JSON.parse(process.env.GENERATOR_VERSIONS ?? '{}') as Record<string, string>;
    } catch {
      versions = {};
    }
  }
  return versions[scope] ?? '00';
}

/** Для автотеста: версии без сборки Next. */
export function setGeneratorVersions(table: Record<string, string>): void {
  versions = { ...table };
}

/** Новый seed комплекта: четыре знака. random — для автотеста. */
export function newKitId(random: () => number = Math.random): string {
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    out += ALPHABET[Math.floor(random() * 32) % 32];
  }
  return out;
}

export function kitCode(id: string, version: string): string {
  return `${id}-${version}`;
}

/**
 * Код, набранный руками: регистр не важен, O читается как 0, I и L —
 * как 1, пробелы и лишние дефисы не мешают. null — это не код.
 */
export function parseKitCode(text: string): { id: string; version: string } | null {
  const clean = text
    .toUpperCase()
    .replace(/[\s‐-―-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (!/^[0-9A-HJKMNP-TV-Z]{6}$/.test(clean)) {
    return null;
  }
  return { id: clean.slice(0, 4), version: clean.slice(4) };
}

/* ── Адреса ────────────────────────────────────────────────────── */

/** Адрес листа с кодом комплекта: лист печатает код в колонтитуле. */
export function withKit(href: string, code: string): string {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('kit', code);
  return `${path}?${params.toString()}`;
}

/** Настройки листа без seed и кода: ключ черновика. */
export function settingsOf(href: string): string {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.delete('seed');
  params.delete('kit');
  params.delete('oba');
  return `${path}?${params.toString()}`;
}

/** Адрес «Скачать оба»: лист ученика, после печати — лист учителя. */
export function bothHref(kit: Kit): string {
  return `${kit.studentHref}&oba=1`;
}

/** Лист учителя по адресу листа ученика: /pechat/ → /pechat/otvety/. */
export function teacherPathOf(pathname: string): string {
  return pathname.replace(/\/pechat\/?$/, '/pechat/otvety/');
}

/* ── Отпечаток ─────────────────────────────────────────────────── */

/* FNV-1a, 32 бита: отпечатку нужна только чувствительность к любой
   правке, а не криптостойкость. */
function fnv(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).padStart(7, '0');
}

interface SpecTask {
  questionHtml?: string;
  figureSvg?: string | null;
  options?: unknown;
  answer?: string;
}

interface SpecLike {
  blocks?: { tasks?: SpecTask[] }[];
  variants?: { blocks?: { tasks?: SpecTask[] }[] }[];
}

/** Задачи спецификации листа: все варианты подряд. */
export function specTasks(spec: SpecLike): SpecTask[] {
  const lists =
    spec.variants !== undefined && spec.variants.length > 0
      ? spec.variants.map((variant) => variant.blocks ?? [])
      : [spec.blocks ?? []];
  return lists.flatMap((blocks) => blocks.flatMap((block) => block.tasks ?? []));
}

/**
 * Отпечаток листа: текст, рисунок, варианты и ответ каждой задачи.
 * У листа ученика ответов нет — отпечаток по условиям; у листа
 * учителя в него входят и ответы. Сравнивается с отпечатком того же
 * листа при первой печати: один и тот же адрес обязан дать побайтно
 * тот же лист.
 */
export function sheetFingerprint(spec: SpecLike): string {
  return fnv(
    specTasks(spec)
      .map((task) =>
        [task.questionHtml ?? '', task.figureSvg ?? '', JSON.stringify(task.options ?? null), task.answer ?? ''].join(
          '\u0001',
        ),
      )
      .join('\u0002'),
  );
}

/* ── Хранилище ─────────────────────────────────────────────────
   Комплекты — внешний источник для React (useSyncExternalStore):
   снимки кэшируются до записи, а запись из другой вкладки (лист
   отметил себя скачанным) приходит событием storage. */

const listeners = new Set<() => void>();
let historyCache: Kit[] | null = null;
const currentCache = new Map<string, Kit | null>();

function changed(): void {
  historyCache = null;
  currentCache.clear();
  listeners.forEach((listener) => listener());
}

/** Подписка на комплекты: своя запись и запись из другой вкладки. */
export function subscribeKits(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = () => changed();
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', onStorage);
    }
  };
}

function isKit(value: unknown): value is Kit {
  const kit = value as Kit | null;
  return (
    kit !== null &&
    typeof kit === 'object' &&
    typeof kit.code === 'string' &&
    typeof kit.studentHref === 'string' &&
    typeof kit.teacherHref === 'string'
  );
}

/** «Мои комплекты»: скачанные, новые сверху, не больше двадцати. */
export function loadKits(): Kit[] {
  if (historyCache === null) {
    const list = storage.get<unknown[]>(HISTORY_KEY, []);
    historyCache = Array.isArray(list) ? list.filter(isKit) : [];
  }
  return historyCache;
}

/** Снимок для сборки: браузера нет — истории нет. */
export const NO_KITS: Kit[] = [];

function saveKits(list: Kit[]): void {
  storage.set(HISTORY_KEY, list.slice(0, KIT_HISTORY));
  changed();
}

/** Комплект по коду из истории; null — не скачивали на этом устройстве. */
export function findKit(code: string, scope?: KitScope): Kit | null {
  return (
    loadKits().find((kit) => kit.code === code && (scope === undefined || kit.scope === scope)) ??
    null
  );
}

/** Текущий комплект экрана генератора: черновик или скачанный. */
export function currentKit(slot: string): Kit | null {
  if (!currentCache.has(slot)) {
    const kit = storage.get<unknown>(CURRENT_KEY + slot, null);
    currentCache.set(slot, isKit(kit) ? kit : null);
  }
  return currentCache.get(slot) ?? null;
}

export function setCurrentKit(kit: Kit): void {
  storage.set(CURRENT_KEY + kit.slot, kit);
  changed();
}

/** Тот же ли комплект: код, настройки и адреса. */
export function sameKit(a: Kit | null, b: Kit | null): boolean {
  return (
    a !== null &&
    b !== null &&
    a.code === b.code &&
    a.settings === b.settings &&
    a.count === b.count &&
    a.section === b.section &&
    a.studentHref === b.studentHref &&
    a.teacherHref === b.teacherHref
  );
}

/** Комплект в историю: тот же код — запись обновляется и поднимается. */
export function rememberKit(kit: Kit): Kit {
  const stamped: Kit = { ...kit, createdAt: kit.createdAt ?? new Date().toISOString() };
  saveKits([stamped, ...loadKits().filter((item) => item.code !== kit.code)]);
  return stamped;
}

/**
 * Лист открыт на печать: комплект скачан. Кнопка на экране пишет это
 * сразу при нажатии, лист — ещё раз, если его открыли из истории.
 */
export function markDownloaded(kit: Kit, which: SheetWhich): Kit {
  const next = rememberKit({ ...kit, downloaded: { ...kit.downloaded, [which]: true } });
  const current = currentKit(kit.slot);
  if (current !== null && current.code === kit.code) {
    setCurrentKit(next);
  }
  return next;
}

/** Есть ли у комплекта скачанный лист. */
export function isDownloaded(kit: Kit): boolean {
  return kit.downloaded.student || kit.downloaded.teacher;
}

/**
 * Новый комплект для экрана: seed, код и адреса листов. hrefs строит
 * экран: у каждого генератора свои параметры.
 */
export function makeKit(options: {
  scope: KitScope;
  slot: string;
  section: string;
  count: number;
  id?: string;
  hrefs: (seed: string) => { student: string; teacher: string };
}): Kit {
  const id = options.id ?? newKitId();
  const version = generatorVersion(options.scope);
  const code = kitCode(id, version);
  const hrefs = options.hrefs(id);
  return {
    code,
    id,
    version,
    scope: options.scope,
    slot: options.slot,
    section: options.section,
    studentHref: withKit(hrefs.student, code),
    teacherHref: withKit(hrefs.teacher, code),
    count: options.count,
    settings: settingsOf(hrefs.student),
    createdAt: null,
    fingerprints: { student: null, teacher: null },
    downloaded: { student: false, teacher: false },
  };
}

/* ── Лист: проверка перед печатью ──────────────────────────────── */

export interface KitCheck {
  /** Код из адреса листа: для колонтитула. null — лист не из комплекта. */
  code: string | null;
  /** Предупреждение перед печатью; null — всё сходится. */
  warning: string | null;
}

/**
 * Лист перед печатью сверяет себя с сохранённым комплектом:
 *   • первая печать — записывает отпечаток листа;
 *   • отпечаток есть и сошёлся — молча печатает;
 *   • не сошёлся — генератор менялся, комплект точно не восстановить;
 *   • отпечатка нет, а версия в коде не та — совпадение не гарантировано.
 * Заодно отмечает лист скачанным.
 */
export function checkKitSheet(
  query: URLSearchParams,
  scope: KitScope,
  which: SheetWhich,
  spec: SpecLike,
): KitCheck {
  const raw = query.get('kit');
  const parsed = raw === null ? null : parseKitCode(raw);
  if (raw === null || parsed === null) {
    return { code: null, warning: null };
  }
  const code = kitCode(parsed.id, parsed.version);
  const fingerprint = sheetFingerprint(spec);
  const changed = parsed.version !== generatorVersion(scope);
  const saved = findKit(code, scope);
  const before = saved?.fingerprints?.[which] ?? null;
  let warning: string | null = null;
  if (before !== null && before !== fingerprint) {
    warning =
      `Комплект ${code} собран прежней версией генератора, и задания теперь другие: ` +
      'точно восстановить его нельзя. Напечатать лист с новыми заданиями?';
  } else if (before === null && changed) {
    warning =
      `Комплект ${code} собран прежней версией генератора (${parsed.version}, ` +
      `сейчас ${generatorVersion(scope)}). Задания могут не совпасть с теми, что ` +
      'печатали раньше. Напечатать всё равно?';
  }
  if (saved !== null) {
    const fingerprints = {
      student: saved.fingerprints?.student ?? null,
      teacher: saved.fingerprints?.teacher ?? null,
      [which]: before ?? (warning === null ? fingerprint : null),
    };
    markDownloaded({ ...saved, fingerprints }, which);
  }
  return { code, warning };
}

/**
 * После печати листа ученика по «Скачать оба» — лист учителя того же
 * комплекта. Возвращает адрес или null.
 */
export function nextSheetAfterPrint(location: { pathname: string; search: string }): string | null {
  const params = new URLSearchParams(location.search);
  if (params.get('oba') !== '1') {
    return null;
  }
  params.delete('oba');
  return `${teacherPathOf(location.pathname)}?${params.toString()}`;
}

/** Колонтитул листа: «Комплект 7K3F-2B». */
export function kitFootLabel(code: string | null): string | null {
  return code === null ? null : `Комплект ${code}`;
}

/**
 * Печать листа комплекта: предупреждение, если комплект точно не
 * восстановить, затем печать браузера; по «Скачать оба» — переход
 * к листу учителя, он напечатается так же.
 */
export function printKitSheet(warning: string | null): void {
  if (warning !== null && !window.confirm(warning)) {
    return;
  }
  window.print();
  const next = nextSheetAfterPrint(window.location);
  if (next !== null) {
    window.location.assign(next);
  }
}
