'use client';

/**
 * Журнал решения задач в браузере (docs/plans/cabinet-v2.md, этап 1).
 *
 * Экран сообщает, что делает ученик: `nachat(описание)` возвращает
 * запись с методами `popytka`, `podskazka`, `reshenie`, `propusk`,
 * `zakryt`… Время считает счётчик активности (aktivnost.ts), очередь
 * (model.ts) лежит в хранилище браузера и уходит на сервер пачками.
 *
 * Журнал пишется только вошедшему ученику, только при флаге сборки и
 * только в разделах из списка (lib/flags.ts). Иначе запись «пустая»:
 * экран вызывает те же методы, и ничего не происходит. Прежние журналы
 * браузера (lib/progressLog) работают как раньше.
 */

import { sozdatAktivnost, type Aktivnost } from './aktivnost';
import {
  PUSTAYA,
  novoeSobytie,
  otmetitPrinyatoe,
  otpechatok,
  otpechatokRaboty,
  sobratPachku,
  ubratStarye,
  vybrositPachku,
  type Ishod,
  type Ochered,
  type OpisanieZadachi,
  type Rabota,
  type Zapis,
} from './model';
import { ZHURNAL_ON, razdelVklyuchen } from '../flags';
import { currentUser } from '../auth/session';
import { browserStorage } from '../storage';

export type { Ishod, OpisanieZadachi, Rabota } from './model';

export const OCHERED_KEY = 'budetege:zhurnal:ochered:v1';
/** Отправка: не чаще раза в 15 секунд, сразу — при закрытии задачи. */
const OTPRAVKA_MS = 15_000;
const POVTOR_MS = 60_000;

export interface ZapisZhurnala {
  /** Проверенный ответ: как введён, верно или нет. Неверная запись (формат) сюда не идёт. */
  popytka(answer: string, ok: boolean): void;
  /** Подсказка открыта. */
  podskazka(): void;
  /** Открыт шаг подсказки (с единицы). */
  shagPodskazki(step: number): void;
  /** Ошибка на вопросе подсказки. */
  oshibkaPodskazki(step: number): void;
  /** «Показать свойство». */
  svoystvo(): void;
  /** «Показать решение». */
  reshenie(): void;
  /** «Пропустить». */
  propusk(): void;
  /** «Похожая задача». */
  pohozhaya(): void;
  /** Задача закрыта с исходом. Повторный вызов ничего не делает. */
  zakryt(outcome: Ishod): void;
  /** Экран ушёл с задачи, не закрыв её: время останавливается. */
  ostavit(): void;
  /** Идентификатор записи (пусто — журнал выключен). */
  id: string | null;
}

const PUSTAYA_ZAPIS: ZapisZhurnala = {
  popytka() {},
  podskazka() {},
  shagPodskazki() {},
  oshibkaPodskazki() {},
  svoystvo() {},
  reshenie() {},
  propusk() {},
  pohozhaya() {},
  zakryt() {},
  ostavit() {},
  id: null,
};

/** Журнал пишется: флаг, раздел из списка, вошёл ученик. */
export function zhurnalVklyuchen(taskNo: number): boolean {
  if (!ZHURNAL_ON || !razdelVklyuchen(taskNo) || typeof window === 'undefined') {
    return false;
  }
  return currentUser()?.role === 'student';
}

/* ── Очередь в хранилище ───────────────────────────────────────── */

let ochered: Ochered | null = null;

function chitat(): Ochered {
  const user = currentUser()?.id ?? null;
  if (ochered === null) {
    try {
      const raw = browserStorage()?.getItem(OCHERED_KEY) ?? null;
      const parsed = raw === null ? null : (JSON.parse(raw) as Ochered);
      ochered =
        parsed !== null && parsed.v === 1 && Array.isArray(parsed.zapisi) && Array.isArray(parsed.raboty)
          ? parsed
          : structuredClone(PUSTAYA);
    } catch {
      ochered = structuredClone(PUSTAYA);
    }
  }
  /* Сменился аккаунт — чужая очередь не отправляется. */
  if (ochered.user !== user) {
    ochered = { ...structuredClone(PUSTAYA), user };
  }
  return ochered;
}

function sohranit(): void {
  if (ochered === null) {
    return;
  }
  const store = browserStorage();
  try {
    store?.setItem(OCHERED_KEY, JSON.stringify(ochered));
  } catch {
    /* Места нет: снимки условий тяжелее всего — без них запись остаётся. */
    for (const z of ochered.zapisi) {
      z.snapshot = null;
    }
    try {
      store?.setItem(OCHERED_KEY, JSON.stringify(ochered));
    } catch {
      /* Хранилище недоступно: журнал живёт до закрытия вкладки. */
    }
  }
}

/* ── Активность: один набор слушателей на страницу ─────────────── */

const zhivye = new Map<string, { zapis: Zapis; schet: Aktivnost }>();
let slushaem = false;
let poslednee = 0;

function now(): number {
  return Date.now();
}

function slushat(): void {
  if (slushaem || typeof document === 'undefined') {
    return;
  }
  slushaem = true;
  const deystvie = () => {
    const t = now();
    /* Движение мыши и прокрутка сыплются десятками в секунду. */
    if (t - poslednee < 1000) {
      return;
    }
    poslednee = t;
    for (const { schet } of zhivye.values()) {
      schet.deystvie(t);
    }
  };
  for (const name of ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel', 'scroll']) {
    window.addEventListener(name, deystvie, { passive: true, capture: true });
  }
  document.addEventListener('visibilitychange', () => {
    const t = now();
    const vidna = document.visibilityState === 'visible';
    for (const { schet } of zhivye.values()) {
      schet.vidimost(vidna, t);
    }
    if (!vidna) {
      zafiksirovat();
      sohranit();
    }
  });
  window.addEventListener('pagehide', () => {
    zafiksirovat();
    sohranit();
  });
}

/** Время живых записей — в очередь (перед сохранением и отправкой). */
function zafiksirovat(): void {
  const t = now();
  for (const { zapis, schet } of zhivye.values()) {
    const snimok = schet.snimok(t);
    if (snimok.acc !== zapis.vremya.acc || snimok.obshchee !== zapis.vremya.obshchee) {
      zapis.vremya = snimok;
      zapis.touchedAt = t;
      zapis.dirty = true;
    }
  }
}

/* ── Отправка ──────────────────────────────────────────────────── */

let taymer: ReturnType<typeof setTimeout> | null = null;
let idet = false;
let vyklyucheno = false;

function zaplanirovat(cherez: number): void {
  if (taymer !== null || vyklyucheno) {
    return;
  }
  taymer = setTimeout(() => {
    taymer = null;
    void otpravit();
  }, cherez);
}

/** Ошибка, которую повтор не исправит: пачка убирается из очереди. */
function navsegda(code: string): boolean {
  return ['23514', '23503', '22P02', '22023', '42501', 'P0001'].includes(code);
}

export async function otpravit(): Promise<void> {
  if (process.env.KAB2_ZHURNAL !== '1') {
    return;
  }
  if (idet || vyklyucheno || currentUser() === null) {
    return;
  }
  const o = chitat();
  zafiksirovat();
  ubratStarye(o, now());
  const pachka = sobratPachku(o);
  if (pachka === null) {
    sohranit();
    return;
  }
  const snimki = new Map<string, string>();
  for (const item of pachka.zapisi) {
    const z = o.zapisi.find((zapis) => zapis.id === item.id);
    if (z !== undefined) {
      snimki.set(z.id, otpechatok(z));
    }
  }
  for (const id of pachka.raboty) {
    const r = o.raboty.find((rabota) => rabota.id === id);
    if (r !== undefined) {
      snimki.set(r.id, otpechatokRaboty(r));
    }
  }
  idet = true;
  let eshche = false;
  try {
    const { getClient } = await import('../auth/client');
    const supabase = await getClient();
    const { error } = await supabase.rpc('journal_push', { p: pachka.body });
    if (error === null) {
      otmetitPrinyatoe(o, pachka, snimki);
      eshche = sobratPachku(o) !== null;
    } else if (/forbidden|progress_not_allowed/.test(error.message)) {
      /* Не ученик или ждём согласия родителя: журнал не пишется. */
      vyklyucheno = true;
      o.zapisi = [];
      o.raboty = [];
    } else if (navsegda(error.code ?? '')) {
      vybrositPachku(o, pachka);
      eshche = sobratPachku(o) !== null;
    } else {
      zaplanirovat(POVTOR_MS);
    }
  } catch {
    /* Сети нет: очередь ждёт. */
    zaplanirovat(POVTOR_MS);
  } finally {
    idet = false;
    sohranit();
  }
  if (eshche) {
    zaplanirovat(1000);
  }
}

/* ── Запись ────────────────────────────────────────────────────── */

function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Начать (или продолжить после перезагрузки) запись задачи.
 * Пустая запись — если журнал выключен.
 */
export function nachat(opis: OpisanieZadachi): ZapisZhurnala {
  /* Условие сборки: без флага тело функции в сборку не попадает. */
  if (process.env.KAB2_ZHURNAL !== '1') {
    return PUSTAYA_ZAPIS;
  }
  if (!zhurnalVklyuchen(opis.taskNo) || vyklyucheno) {
    return PUSTAYA_ZAPIS;
  }
  const o = chitat();
  slushat();
  const t = now();
  let zapis = o.zapisi.find((z) => z.klyuch === opis.klyuch && z.closedAt === null);
  if (zapis === undefined) {
    const { klyuch, statement, figure, answer, ...rest } = opis;
    zapis = {
      id: uuid(),
      klyuch,
      opis: rest,
      snapshot:
        statement === undefined || statement === ''
          ? null
          : {
              statement,
              ...(figure === undefined ? {} : { figure }),
              ...(answer === undefined ? {} : { answer }),
            },
      startedAt: new Date(t).toISOString(),
      closedAt: null,
      outcome: null,
      vremya: { acc: 0, obshchee: 0 },
      events: [],
      sent: 0,
      created: false,
      dirty: true,
      touchedAt: t,
    };
    o.zapisi.push(zapis);
  }
  const z = zapis;
  const schet = sozdatAktivnost(
    t,
    typeof document === 'undefined' || document.visibilityState === 'visible',
    z.vremya,
  );
  zhivye.set(z.id, { zapis: z, schet });
  sohranit();
  zaplanirovat(OTPRAVKA_MS);

  function sobytie(
    type: Parameters<typeof novoeSobytie>[1],
    extra?: { answer?: string; ok?: boolean; step?: number },
  ): void {
    const t2 = now();
    schet.deystvie(t2);
    if (novoeSobytie(z, type, new Date(t2).toISOString(), schet.aktivnoMs(t2), extra) !== null) {
      z.vremya = schet.snimok(t2);
      z.touchedAt = t2;
      sohranit();
      zaplanirovat(OTPRAVKA_MS);
    }
  }

  return {
    id: z.id,
    popytka: (answer, ok) => sobytie('attempt', { answer, ok }),
    podskazka: () => sobytie('hint_open'),
    shagPodskazki: (step) => sobytie('hint_step', { step }),
    oshibkaPodskazki: (step) => sobytie('hint_miss', { step }),
    svoystvo: () => sobytie('property'),
    reshenie: () => sobytie('solution'),
    propusk: () => sobytie('skip'),
    pohozhaya: () => sobytie('similar'),
    zakryt(outcome) {
      if (z.closedAt !== null) {
        return;
      }
      const t2 = now();
      schet.deystvie(t2);
      z.vremya = schet.snimok(t2);
      z.closedAt = new Date(t2).toISOString();
      z.outcome = outcome;
      z.dirty = true;
      z.touchedAt = t2;
      zhivye.delete(z.id);
      sohranit();
      /* Закрытая задача уходит сразу. */
      if (taymer !== null) {
        clearTimeout(taymer);
        taymer = null;
      }
      zaplanirovat(300);
    },
    ostavit() {
      if (!zhivye.has(z.id)) {
        return;
      }
      const t2 = now();
      z.vremya = schet.snimok(t2);
      z.dirty = true;
      z.touchedAt = t2;
      zhivye.delete(z.id);
      sohranit();
    },
  };
}

/** Готовая задача одной записью (вариант: итог известен в конце работы). */
export interface GotovayaZadacha {
  opis: OpisanieZadachi;
  startedAt: number;
  closedAt: number;
  outcome: Ishod;
  activeMs: number;
  popytki: Array<{ answer: string; ok: boolean }>;
  podskazka: boolean;
}

/**
 * Задачи завершённой работы. Раздел в списке флага не проверяется:
 * вариант записывается целиком, со всеми заданиями.
 */
export function zapisatGotovye(zadachi: GotovayaZadacha[]): void {
  if (!ZHURNAL_ON || vyklyucheno || typeof window === 'undefined' || currentUser()?.role !== 'student') {
    return;
  }
  const o = chitat();
  for (const g of zadachi) {
    if (o.zapisi.some((z) => z.klyuch === g.opis.klyuch)) {
      continue;
    }
    const { klyuch, statement, figure, answer, ...rest } = g.opis;
    const at = new Date(g.closedAt).toISOString();
    const ms = Math.max(0, Math.round(g.activeMs));
    const zapis: Zapis = {
      id: uuid(),
      klyuch,
      opis: rest,
      snapshot:
        statement === undefined || statement === ''
          ? null
          : {
              statement,
              ...(figure === undefined ? {} : { figure }),
              ...(answer === undefined ? {} : { answer }),
            },
      startedAt: new Date(g.startedAt).toISOString(),
      closedAt: null,
      outcome: null,
      vremya: { acc: ms, obshchee: ms },
      events: [],
      sent: 0,
      created: false,
      dirty: true,
      touchedAt: g.closedAt,
    };
    if (g.podskazka) {
      novoeSobytie(zapis, 'hint_open', at, ms);
    }
    for (const popytka of g.popytki) {
      novoeSobytie(zapis, 'attempt', at, ms, popytka);
    }
    zapis.closedAt = at;
    zapis.outcome = g.outcome;
    o.zapisi.push(zapis);
  }
  sohranit();
  zaplanirovat(300);
}

/** Результат варианта: идентификатор — тот же, что в `workId` его задач. */
export function zapisatRabotu(rabota: Omit<Rabota, 'dirty'>): void {
  if (!ZHURNAL_ON || vyklyucheno || currentUser()?.role !== 'student') {
    return;
  }
  const o = chitat();
  o.raboty = o.raboty.filter((r) => r.id !== rabota.id);
  o.raboty.push({ ...rabota, dirty: true });
  sohranit();
  zaplanirovat(300);
}

/** Новый идентификатор работы (варианта). */
export function novyyId(): string {
  return uuid();
}

/** Отправить накопленное при входе на страницу (остаток прошлого визита). */
export function dootpravit(): void {
  if (!ZHURNAL_ON || typeof window === 'undefined' || currentUser()?.role !== 'student') {
    return;
  }
  const o = chitat();
  if (o.zapisi.some((z) => z.dirty || !z.created) || o.raboty.length > 0) {
    zaplanirovat(2000);
  }
}
