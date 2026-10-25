/**
 * Фильтр тренажёра без React: что подходит, сколько на чипах, ссылка,
 * «Расширить фильтры», строка-сводка, готовые наборы и состав
 * тренировки. Один модуль на все разделы; раздел даёт конфиг и список
 * задач (types.ts).
 */

import { levelsText, tasksText } from '@/lib/generator/obshchiy/state';
import type {
  Filtr,
  FiltrPole,
  FiltrTema,
  IstochnikFiltra,
  Moi,
  Poryadok,
  Rezhim,
  Skolko,
  Statistika,
  TrenazherConfig,
  Uroven,
  ZadachaRef,
} from './types';

export const SKOLKO: readonly Skolko[] = [5, 10, 20, 0];
export const REZHIMY: readonly Rezhim[] = ['podskazki', 'bez', 'vremya'];
export const PORYADKI: readonly Poryadok[] = ['prostye', 'sluchayno'];
export const MOI: readonly Moi[] = ['vse', 'nereshennye', 'oshibki'];
export const ISTOCHNIKI: readonly IstochnikFiltra[] = ['vse', 'fipi', 'new'];

/** Фильтр по умолчанию: все типы, 10 задач, с подсказками, вперемешку. */
export const NACHALNYY: Filtr = {
  tipy: [],
  istochnik: 'vse',
  urovni: [],
  skolko: 10,
  rezhim: 'podskazki',
  poryadok: 'sluchayno',
  moi: 'vse',
  pravila: [],
  poryadokSuzheniya: [],
};

const PUSTAYA: Statistika = { resheno: new Set(), oshibki: new Set() };

/* ── Что подходит под фильтр ─────────────────────────────────── */

/**
 * Подходит ли задача. bez — какое поле не учитывать: число на чипе
 * типа считается при всех остальных фильтрах, но без выбора типов.
 */
export function podhodit(
  ref: ZadachaRef,
  f: Filtr,
  stat: Statistika = PUSTAYA,
  bez: FiltrPole | null = null,
): boolean {
  if (bez !== 'tipy' && f.tipy.length > 0 && !f.tipy.includes(ref.podtip)) {
    return false;
  }
  if (bez !== 'istochnik' && f.istochnik !== 'vse' && ref.istochnik !== f.istochnik) {
    return false;
  }
  if (
    bez !== 'urovni' &&
    f.urovni.length > 0 &&
    (ref.uroven === null || !f.urovni.includes(ref.uroven))
  ) {
    return false;
  }
  if (bez !== 'pravila' && f.pravila.length > 0 && !f.pravila.includes(ref.pravilo ?? '')) {
    return false;
  }
  if (bez !== 'moi') {
    if (f.moi === 'nereshennye' && stat.resheno.has(ref.key)) {
      return false;
    }
    if (f.moi === 'oshibki' && !stat.oshibki.has(ref.key)) {
      return false;
    }
  }
  return true;
}

/** Задачи под фильтром: счётчик «Найдено N». */
export function naydeno(refs: readonly ZadachaRef[], f: Filtr, stat?: Statistika): ZadachaRef[] {
  return refs.filter((ref) => podhodit(ref, f, stat));
}

export interface ChisloChipa {
  /** Задач под остальными фильтрами. 0 — чип неактивен. */
  n: number;
  /** Из них решено верно: «8/12». */
  resheno: number;
}

/**
 * Числа на чипах типов: у каждого подтипа и у каждой темы. Чип
 * считается при всех фильтрах, кроме выбора типов: так видно, что
 * даст нажатие.
 */
export function chislaChipov(
  config: TrenazherConfig,
  refs: readonly ZadachaRef[],
  f: Filtr,
  stat: Statistika = PUSTAYA,
): Record<string, ChisloChipa> {
  const out: Record<string, ChisloChipa> = {};
  for (const tema of config.temy) {
    out[tema.id] = { n: 0, resheno: 0 };
    for (const p of tema.podtipy) {
      out[p.id] = { n: 0, resheno: 0 };
    }
  }
  const temaOf = temaPodtipa(config);
  for (const ref of refs) {
    if (!podhodit(ref, f, stat, 'tipy')) {
      continue;
    }
    const solved = stat.resheno.has(ref.key) ? 1 : 0;
    for (const id of [ref.podtip, temaOf[ref.podtip]]) {
      const c = id === undefined ? undefined : out[id];
      if (c !== undefined) {
        c.n += 1;
        c.resheno += solved;
      }
    }
  }
  return out;
}

/** Подтип → тема. */
export function temaPodtipa(config: TrenazherConfig): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tema of config.temy) {
    for (const p of tema.podtipy) {
      out[p.id] = tema.id;
    }
  }
  return out;
}

/** Выбрана ли тема: целиком, частично или нет. */
export function vyborTemy(tema: FiltrTema, f: Filtr): 'vsya' | 'chast' | 'net' {
  const n = tema.podtipy.filter((p) => f.tipy.includes(p.id)).length;
  return n === 0 ? 'net' : n === tema.podtipy.length ? 'vsya' : 'chast';
}

/* ── Изменения фильтра ───────────────────────────────────────── */

function poUmolchaniyu(f: Filtr, pole: FiltrPole): boolean {
  switch (pole) {
    case 'tipy':
      return f.tipy.length === 0;
    case 'istochnik':
      return f.istochnik === 'vse';
    case 'urovni':
      return f.urovni.length === 0;
    case 'moi':
      return f.moi === 'vse';
    case 'pravila':
      return f.pravila.length === 0;
  }
}

/**
 * Применить правку. Сужающее поле переезжает в конец очереди
 * сужений («Расширить» снимет его первым); вернувшееся к значению по
 * умолчанию — уходит из очереди.
 */
export function izmenit(f: Filtr, patch: Partial<Filtr>): Filtr {
  const next: Filtr = { ...f, ...patch };
  let order = f.poryadokSuzheniya.filter((pole) => !poUmolchaniyu(next, pole));
  for (const pole of Object.keys(patch) as (keyof Filtr)[]) {
    if (isPole(pole) && !poUmolchaniyu(next, pole)) {
      order = [...order.filter((x) => x !== pole), pole];
    }
  }
  if (next.pravila.length === 0) {
    delete next.pravilaTitle;
  }
  return { ...next, poryadokSuzheniya: order };
}

function isPole(key: string): key is FiltrPole {
  return (
    key === 'tipy' || key === 'istochnik' || key === 'urovni' || key === 'moi' || key === 'pravila'
  );
}

/** Снять одно поле — крестик на чипе активного фильтра. */
export function snyat(f: Filtr, pole: FiltrPole): Filtr {
  return izmenit(f, sbros(pole));
}

function sbros(pole: FiltrPole): Partial<Filtr> {
  switch (pole) {
    case 'tipy':
      return { tipy: [] };
    case 'istochnik':
      return { istochnik: 'vse' };
    case 'urovni':
      return { urovni: [] };
    case 'moi':
      return { moi: 'vse' };
    case 'pravila':
      return { pravila: [] };
  }
}

/**
 * «Расширить фильтры»: снять последний добавленный фильтр. null —
 * сужать было нечем (тогда помогает только «Сбросить»).
 */
export function rasshirit(f: Filtr): Filtr | null {
  const last = f.poryadokSuzheniya[f.poryadokSuzheniya.length - 1];
  return last === undefined ? null : snyat(f, last);
}

/** Сбросить всё, что сужает выбор. Сколько задач и режим остаются. */
export function sbrositVse(f: Filtr): Filtr {
  return { ...NACHALNYY, skolko: f.skolko, rezhim: f.rezhim, poryadok: f.poryadok };
}

/** Переключить подтип. */
export function pereklyuchitTip(f: Filtr, id: string): Filtr {
  const tipy = f.tipy.includes(id) ? f.tipy.filter((x) => x !== id) : [...f.tipy, id];
  return izmenit(f, { tipy });
}

/** Переключить тему целиком: выбрана вся — снять, иначе — выбрать всю. */
export function pereklyuchitTemu(f: Filtr, tema: FiltrTema): Filtr {
  const ids = tema.podtipy.map((p) => p.id);
  const tipy =
    vyborTemy(tema, f) === 'vsya'
      ? f.tipy.filter((x) => !ids.includes(x))
      : [...f.tipy.filter((x) => !ids.includes(x)), ...ids];
  return izmenit(f, { tipy });
}

export function pereklyuchitUroven(f: Filtr, u: Uroven): Filtr {
  const urovni = f.urovni.includes(u) ? f.urovni.filter((x) => x !== u) : [...f.urovni, u].sort();
  return izmenit(f, { urovni });
}

/* ── Проверка и ссылка ───────────────────────────────────────── */

/**
 * Привести фильтр к разделу: чужие подтипы и уровни, выбор источника
 * у раздела без него — прочь. Всё выбранное — тоже «все».
 */
export function kRazdelu(f: Filtr, config: TrenazherConfig): Filtr {
  const ids = new Set(config.temy.flatMap((t) => t.podtipy.map((p) => p.id)));
  const urovni = new Set(config.urovni.map((u) => u.uroven));
  let tipy = f.tipy.filter((id, at) => ids.has(id) && f.tipy.indexOf(id) === at);
  if (tipy.length === ids.size) {
    tipy = [];
  }
  let ur = f.urovni.filter((u, at) => urovni.has(u) && f.urovni.indexOf(u) === at).sort();
  if (ur.length === urovni.size) {
    ur = [];
  }
  const next: Filtr = {
    ...f,
    tipy,
    urovni: ur,
    istochnik: config.istochnik ? f.istochnik : 'vse',
  };
  return {
    ...next,
    poryadokSuzheniya: f.poryadokSuzheniya.filter(
      (pole, at) => f.poryadokSuzheniya.indexOf(pole) === at && !poUmolchaniyu(next, pole),
    ),
  };
}

const REZHIM_V_SSYLKE: Record<Rezhim, string> = { podskazki: '', bez: 'bez', vremya: 'vremya' };
const MOI_V_SSYLKE: Record<Moi, string> = {
  vse: '',
  nereshennye: 'nereshennye',
  oshibki: 'oshibki',
};
const SUZH_V_SSYLKE: Record<FiltrPole, string> = {
  tipy: 't',
  istochnik: 'ist',
  urovni: 'ur',
  moi: 'moi',
  pravila: 'pr',
};

/**
 * Фильтр в адрес: только то, что отличается от начального. Учитель
 * отправляет ссылку — у ученика открывается ровно это. Порядок
 * сужений тоже в ссылке: «Расширить» у ученика снимет то же, что у
 * учителя.
 */
export function vSsylku(f: Filtr): string {
  const q = new URLSearchParams();
  if (f.tipy.length > 0) q.set('t', f.tipy.join(','));
  if (f.istochnik !== 'vse') q.set('ist', f.istochnik);
  if (f.urovni.length > 0) q.set('ur', f.urovni.join(''));
  if (f.skolko !== NACHALNYY.skolko) q.set('n', f.skolko === 0 ? 'vse' : String(f.skolko));
  if (f.rezhim !== NACHALNYY.rezhim) q.set('rezh', REZHIM_V_SSYLKE[f.rezhim]);
  if (f.poryadok !== NACHALNYY.poryadok) q.set('por', f.poryadok);
  if (f.moi !== NACHALNYY.moi) q.set('moi', MOI_V_SSYLKE[f.moi]);
  if (f.pravila.length > 0) {
    q.set('pr', f.pravila.join(','));
    if (f.pravilaTitle !== undefined) q.set('prn', f.pravilaTitle);
  }
  if (f.poryadokSuzheniya.length > 1) {
    q.set('s', f.poryadokSuzheniya.map((pole) => SUZH_V_SSYLKE[pole]).join(','));
  }
  return q.toString();
}

/** Есть ли в адресе фильтр тренажёра. */
export function estVSsylke(q: URLSearchParams): boolean {
  /* tip, tipy — прежние ссылки «Решать» из теории и маршрутов урока. */
  return ['t', 'ist', 'ur', 'n', 'rezh', 'por', 'moi', 'pr', 'tip', 'tipy'].some((key) =>
    q.has(key),
  );
}

/** Фильтр из адреса. Неизвестное — по умолчанию, чужие подтипы — прочь. */
export function izSsylki(q: URLSearchParams, config: TrenazherConfig): Filtr {
  const list = (key: string) => (q.get(key) ?? '').split(',').filter((x) => x !== '');
  const ist = q.get('ist');
  const n = q.get('n');
  const rezh = q.get('rezh');
  const por = q.get('por');
  const moi = q.get('moi');
  const urovni = [...(q.get('ur') ?? '')]
    .map(Number)
    .filter((u): u is Uroven => u === 1 || u === 2 || u === 3);
  const f: Filtr = {
    tipy: [...new Set([...list('t'), ...list('tipy'), ...list('tip')])],
    istochnik: ist === 'fipi' || ist === 'new' ? ist : 'vse',
    urovni,
    skolko: n === 'vse' ? 0 : n === '5' ? 5 : n === '20' ? 20 : 10,
    rezhim: rezh === 'bez' || rezh === 'vremya' ? rezh : 'podskazki',
    poryadok: por === 'prostye' ? 'prostye' : 'sluchayno',
    moi: moi === 'nereshennye' || moi === 'oshibki' ? moi : 'vse',
    pravila: list('pr'),
    poryadokSuzheniya: [],
  };
  const title = q.get('prn');
  if (f.pravila.length > 0 && title !== null && title !== '') {
    f.pravilaTitle = title;
  }
  /* Порядок сужений: из ссылки, а чего в ней нет — в порядке полей. */
  const fromLink = list('s').flatMap((code) => {
    const pole = (Object.keys(SUZH_V_SSYLKE) as FiltrPole[]).find((x) => SUZH_V_SSYLKE[x] === code);
    return pole === undefined ? [] : [pole];
  });
  const all: FiltrPole[] = ['tipy', 'istochnik', 'urovni', 'pravila', 'moi'];
  f.poryadokSuzheniya = [...fromLink, ...all.filter((pole) => !fromLink.includes(pole))];
  return kRazdelu(f, config);
}

/** Прочитать запомненный фильтр (JSON). Мусор — null. */
export function izZapisi(raw: unknown, config: TrenazherConfig): Filtr | null {
  if (typeof raw !== 'object' || raw === null || typeof (raw as { s?: unknown }).s !== 'string') {
    return null;
  }
  return izSsylki(new URLSearchParams((raw as { s: string }).s), config);
}

/* ── Подписи ─────────────────────────────────────────────────── */

export interface AktivnyyFiltr {
  pole: FiltrPole;
  label: string;
}

/** Активные фильтры строкой чипов с крестиками. */
export function aktivnye(f: Filtr, config: TrenazherConfig, slova: SlovaFiltra): AktivnyyFiltr[] {
  const out: AktivnyyFiltr[] = [];
  if (f.tipy.length > 0) out.push({ pole: 'tipy', label: nazvanieTipov(f, config, slova) });
  if (f.istochnik !== 'vse') out.push({ pole: 'istochnik', label: slova.istochnik[f.istochnik] });
  if (f.urovni.length > 0) out.push({ pole: 'urovni', label: levelsText(f.urovni) });
  if (f.pravila.length > 0) out.push({ pole: 'pravila', label: f.pravilaTitle ?? slova.pravila });
  if (f.moi !== 'vse') out.push({ pole: 'moi', label: slova.moi[f.moi] });
  return out;
}

/** Слова для подписей: из content/, чтобы модуль не знал языка интерфейса. */
export interface SlovaFiltra {
  vseTipy: string;
  /** «3 типа». */
  tipov: (n: number) => string;
  istochnik: Record<'fipi' | 'new', string>;
  moi: Record<'nereshennye' | 'oshibki', string>;
  pravila: string;
  bezOgranicheniya: string;
}

/** Выбранные типы одним словом: тема целиком — её короткое название. */
export function nazvanieTipov(f: Filtr, config: TrenazherConfig, slova: SlovaFiltra): string {
  if (f.tipy.length === 0) {
    /* Тренажёр подтемы: «все типы» — это сама подтема. */
    const only = config.temy.length === 1 ? config.temy[0] : undefined;
    return only === undefined ? slova.vseTipy : only.short;
  }
  const temy = config.temy.filter((t) => vyborTemy(t, f) !== 'net');
  if (temy.length === 1 && temy[0] !== undefined) {
    const tema = temy[0];
    if (vyborTemy(tema, f) === 'vsya' && config.temy.length > 1) {
      return tema.short;
    }
    if (f.tipy.length === 1) {
      const p = tema.podtipy.find((x) => x.id === f.tipy[0]);
      return p === undefined ? slova.tipov(1) : p.title;
    }
  }
  const celye = temy.filter((t) => vyborTemy(t, f) === 'vsya');
  if (celye.length === temy.length && config.temy.length > 1) {
    return celye.map((t) => t.short).join(', ');
  }
  return slova.tipov(f.tipy.length);
}

/** Строка-сводка во время тренировки: «№12 · параболы · ★★ · 10 задач». */
export function svodka(config: TrenazherConfig, f: Filtr, n: number, slova: SlovaFiltra): string {
  const parts = [`№${config.razdel}`, nazvanieTipov(f, config, slova)];
  if (f.istochnik !== 'vse') parts.push(slova.istochnik[f.istochnik]);
  if (f.urovni.length > 0) parts.push(levelsText(f.urovni));
  if (f.pravila.length > 0) parts.push(f.pravilaTitle ?? slova.pravila);
  if (f.moi !== 'vse') parts.push(slova.moi[f.moi]);
  parts.push(tasksText(n));
  return parts.join(' · ');
}

/** Сколько активных фильтров — для кнопки «Фильтры (3)» на телефоне. */
export function skolkoAktivnyh(f: Filtr): number {
  return (
    f.poryadokSuzheniya.length +
    (f.skolko !== NACHALNYY.skolko ? 1 : 0) +
    (f.rezhim !== NACHALNYY.rezhim ? 1 : 0) +
    (f.poryadok !== NACHALNYY.poryadok ? 1 : 0)
  );
}

/* ── Готовые наборы ──────────────────────────────────────────── */

export type NaborId = 'bystryy' | 'oshibki' | 'slozhnye';

/** Готовый набор одной кнопкой. null — у раздела его нет. */
export function nabor(id: NaborId, f: Filtr, config: TrenazherConfig): Filtr | null {
  switch (id) {
    case 'bystryy':
      return { ...NACHALNYY, rezhim: f.rezhim };
    case 'oshibki':
      return izmenit({ ...NACHALNYY, rezhim: f.rezhim, skolko: 0 }, { moi: 'oshibki' });
    case 'slozhnye': {
      const max = config.urovni.reduce<Uroven | 0>((m, u) => (u.uroven > m ? u.uroven : m), 0);
      return max === 0
        ? null
        : izmenit({ ...NACHALNYY, rezhim: f.rezhim, poryadok: 'sluchayno' }, { urovni: [max] });
    }
  }
}

/** Набор уже выбран: фильтр совпадает с ним. */
export function etoNabor(id: NaborId, f: Filtr, config: TrenazherConfig): boolean {
  const n = nabor(id, f, config);
  return n !== null && vSsylku(n) === vSsylku(f);
}

/* ── Состав тренировки ───────────────────────────────────────── */

export type Random = () => number;

function peremeshat<T>(list: readonly T[], random: Random): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

/** Сколько задач возьмёт тренировка из найденных. */
export function skolkoVozmyot(f: Filtr, found: number): number {
  return f.skolko === 0 ? found : Math.min(f.skolko, found);
}

/**
 * Задачи тренировки из найденных. Берутся поровну из подтипов
 * (по кругу, в случайном порядке), чтобы десять задач из пяти типов
 * не оказались задачами одного. Порядок: «от простых к сложным» —
 * по уровню, внутри уровня типы чередуются; «случайно» — вперемешку,
 * одинаковые типы подряд не идут, если есть из чего выбрать.
 */
export function sostav(found: readonly ZadachaRef[], f: Filtr, random: Random): ZadachaRef[] {
  const want = skolkoVozmyot(f, found.length);
  const groups = new Map<string, ZadachaRef[]>();
  for (const ref of peremeshat(found, random)) {
    const g = groups.get(ref.podtip);
    if (g === undefined) groups.set(ref.podtip, [ref]);
    else g.push(ref);
  }
  const queues = peremeshat([...groups.values()], random);
  const picked: ZadachaRef[] = [];
  while (picked.length < want) {
    let took = false;
    for (const q of queues) {
      const ref = q.shift();
      if (ref !== undefined && picked.length < want) {
        picked.push(ref);
        took = true;
      }
    }
    if (!took) break;
  }
  if (f.poryadok === 'prostye') {
    const byLevel = new Map<number, ZadachaRef[]>();
    for (const ref of picked) {
      const l = ref.uroven ?? 1;
      byLevel.set(l, [...(byLevel.get(l) ?? []), ref]);
    }
    return [...byLevel.keys()].sort().flatMap((l) => razvesti(byLevel.get(l) ?? []));
  }
  return razvesti(peremeshat(picked, random));
}

/** Развести одинаковые подтипы, чтобы не шли подряд. */
function razvesti(list: ZadachaRef[]): ZadachaRef[] {
  const out = list.slice();
  for (let i = 1; i < out.length; i += 1) {
    if (out[i]?.podtip !== out[i - 1]?.podtip) continue;
    const j = out.findIndex((ref, at) => at > i && ref.podtip !== out[i - 1]?.podtip);
    if (j === -1) continue;
    const a = out[i] as ZadachaRef;
    out[i] = out[j] as ZadachaRef;
    out[j] = a;
  }
  return out;
}
