/**
 * Серия уроков «Для репетиторов» задания №1: 13 уроков по коду
 * комплекта.
 *
 * Код комплекта — шесть знаков (четыре знака комплекта и версия
 * генератора, lib/komplekt.ts) и, если урок перегенерировали, хвост
 * «-урок.раз»: «K7Q2AB-5.2» — урок 5 перегенерирован дважды. Код
 * восстанавливает всю серию на любом устройстве: seed урока —
 * детерминированно из кода и номера урока (и номера перегенерации),
 * ничего не хранится в браузере.
 *
 * Правила серии:
 *   — внутри комплекта задачи не повторяются: уроки собираются по
 *     порядку 1 → 11, каждая взятая задача (банка, аналог, новая)
 *     отмечается занятой для всех следующих;
 *   — итоговая работа (урок 13) — два варианта по 12 задач, по одной
 *     на урок, только открытый банк. Её задачи откладываются до
 *     раздачи уроков, поэтому перегенерация итоговой не меняет уроки;
 *   — «Перегенерировать урок» берёт задачи, которых не было ни в
 *     серии, ни в прежних поколениях этого урока; если открытый банк
 *     прототипа кончился — добирает аналогами «не из открытого банка»,
 *     затем новыми задачами;
 *   — мини-проверка урока N (4 задачи) и разминка (3 задачи по уроку
 *     N) печатаются в начале урока N + 1. Под них откладывается запас
 *     на наибольшее число задач блока, чтобы настройки учителя не
 *     сдвигали серию.
 */

import {
  BLOKI_UROKA_1,
  ITOG_1,
  KOLICHESTVO_1,
  UROKI_1,
  type BlokUroka1,
  type Urok1,
} from '../../content/repetitory1';
import { rngOf } from '../vychisleniya/rng';
import { klyuchProto, type UslovieBanka, type ZadachaPlan } from './trenazher/sessiya';

/* ── Код комплекта ───────────────────────────────────────────────── */

export interface KodSerii {
  /** Шесть знаков: комплект и версия генератора. */
  osnova: string;
  /** Перегенерации: урок → сколько раз. */
  regen: Readonly<Record<number, number>>;
}

const ZNAKI = /^[0-9A-HJKMNP-TV-Z]{6}$/;

export function kodSeriiText(k: KodSerii): string {
  const hvost = Object.entries(k.regen)
    .map(([u, g]) => [Number(u), g] as const)
    .filter(([u, g]) => g > 0 && UROKI_1.some((x) => x.no === u))
    .sort((a, b) => a[0] - b[0])
    .map(([u, g]) => `-${u}.${g}`)
    .join('');
  return `${k.osnova}${hvost}`;
}

/**
 * Код, набранный руками: регистр не важен, O читается как 0, I и L —
 * как 1, пробелы не мешают. null — это не код.
 */
export function parseKodSerii(text: string): KodSerii | null {
  const chasti = text
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .split(/[-‐–—]/)
    .filter((x) => x !== '');
  let osnova = '';
  const regen: Record<number, number> = {};
  for (const ch of chasti) {
    const m = /^(\d{1,2})\.(\d{1,3})$/.exec(ch);
    if (osnova.length === 6 && m !== null) {
      const u = Number(m[1]);
      const g = Number(m[2]);
      if (UROKI_1.some((x) => x.no === u) && g > 0) regen[u] = g;
      continue;
    }
    if (osnova.length < 6) {
      osnova += ch.replace(/O/g, '0').replace(/[IL]/g, '1');
      continue;
    }
    return null;
  }
  return ZNAKI.test(osnova) ? { osnova, regen } : null;
}

/* ── Пул задач ───────────────────────────────────────────────────── */

const kBank = (no: number) => `b${no}`;

function klyuchPoz(p: ZadachaPlan): string {
  return p.vid === 'new' ? `n${p.id}|${p.seed}` : `${p.vid === 'bank' ? 'b' : 'a'}${p.no}`;
}

interface Pul {
  fipi: Map<string, number[]>;
  analogi: Map<string, number[]>;
}

function pulIz(bank: readonly UslovieBanka[]): Pul {
  const fipi = new Map<string, number[]>();
  const analogi = new Map<string, number[]>();
  for (const b of bank) {
    const m = b.analog ? analogi : fipi;
    const spisok = m.get(b.id) ?? [];
    spisok.push(b.no);
    m.set(b.id, spisok);
  }
  return { fipi, analogi };
}

export type Kolichestvo = Record<BlokUroka1, number>;

interface RaskladkaUroka {
  bloki: Record<'razbor' | 'sam' | 'dz', ZadachaPlan[]>;
  /** Запас для урока N + 1: мини-проверка и разминка по этому уроку. */
  proverka: ZadachaPlan[];
  razminka: ZadachaPlan[];
  /** Ключи задач блоков урока и запаса. */
  zanyatoBlokami: Set<string>;
  zanyatoZapasom: Set<string>;
  /** Задачи прежних поколений урока — их не берём, пока есть другие. */
  isklyuchit: Set<string>;
  /** Сколько мест блоков «из банка» заняли аналоги или новые: банк кончился. */
  nehvatka: number;
}

const ZAPAS_PROVERKA = BLOKI_UROKA_1.find((b) => b.id === 'proverka')?.max ?? 8;
const ZAPAS_RAZMINKA = BLOKI_UROKA_1.find((b) => b.id === 'razminka')?.max ?? 6;

/**
 * Раскладка одного урока одного поколения. zanyato — задачи, уже
 * занятые серией; функция их не меняет.
 */
function razlozhit(
  osnova: string,
  urok: Urok1,
  g: number,
  pul: Pul,
  zanyato: ReadonlySet<string>,
  isklyuchit: ReadonlySet<string>,
  k: Kolichestvo,
  sZapasom: boolean,
): RaskladkaUroka {
  const rng = rngOf(`z1-urok|${osnova}|${urok.no}|${g}`);
  const vzyato = new Set<string>();
  const svobodno = (key: string) => !zanyato.has(key) && !vzyato.has(key);
  /* Очередь прототипа без задач прежних поколений урока: перегенерация
     берёт только неиспользованные. Банк кончился — добираем аналогами
     «не из открытого банка», аналоги кончились — новыми задачами. */
  const ochered = (spisok: number[], pref: 'b' | 'a') =>
    rng.sample(spisok, spisok.length).filter((no) => !isklyuchit.has(`${pref}${no}`));
  const ocheredi = new Map<string, { fipi: number[]; analogi: number[]; novyh: number }>();
  const o = (id: string) => {
    let q = ocheredi.get(id);
    if (q === undefined) {
      q = {
        fipi: ochered(pul.fipi.get(id) ?? [], 'b'),
        analogi: ochered(pul.analogi.get(id) ?? [], 'a'),
        novyh: 0,
      };
      ocheredi.set(id, q);
    }
    return q;
  };
  const vzyat = (p: ZadachaPlan): ZadachaPlan => {
    vzyato.add(klyuchPoz(p));
    return p;
  };
  const novaya = (id: string): ZadachaPlan => {
    const q = o(id);
    for (;;) {
      q.novyh += 1;
      const p: ZadachaPlan = { vid: 'new', id, seed: `${osnova}|${urok.no}|${g}|${q.novyh}` };
      if (svobodno(klyuchPoz(p))) return vzyat(p);
    }
  };
  const analog = (id: string): ZadachaPlan => {
    const q = o(id);
    while (q.analogi.length > 0) {
      const no = q.analogi.shift()!;
      if (svobodno(`a${no}`)) return vzyat({ vid: 'analog', id, no });
    }
    return novaya(id);
  };
  let nehvatka = 0;
  const fipi = (id: string): ZadachaPlan => {
    const q = o(id);
    while (q.fipi.length > 0) {
      const no = q.fipi.shift()!;
      if (svobodno(kBank(no))) return vzyat({ vid: 'bank', id, no });
    }
    nehvatka += 1;
    return analog(id);
  };
  const bank = urok.bank.map(klyuchProto);
  const dop = urok.dop.map(klyuchProto);
  const raz = (n: number, f: () => ZadachaPlan) => Array.from({ length: n }, f);

  /* Сначала открытый банк — разбор и ДЗ, затем аналоги. Прототипы
     50+ (без ФИПИ): один аналог в «Разборе» — тип ученик впервые видит
     с учителем, в «Самостоятельно» их нет, в «ДЗ» — один аналог.
     ДЗ на прототип банка: половина (с округлением вверх) — ФИПИ,
     остальное — аналоги: по умолчанию 1 + 1. */
  const razbor = [
    ...bank.flatMap((id) => raz(k.razbor, () => fipi(id))),
    ...dop.flatMap((id) => raz(Math.min(1, k.razbor), () => analog(id))),
  ];
  const dzFipi = Math.ceil(k.dz / 2);
  const dzBank = new Map(bank.map((id) => [id, raz(dzFipi, () => fipi(id))]));
  const sam = bank.flatMap((id) => raz(k.sam, () => analog(id)));
  const dz = [
    ...bank.flatMap((id) => [...(dzBank.get(id) ?? []), ...raz(k.dz - dzFipi, () => analog(id))]),
    ...dop.flatMap((id) => raz(Math.min(1, k.dz), () => analog(id))),
  ];
  const zanyatoBlokami = new Set(vzyato);
  const nehvatkaBlokov = nehvatka;

  /* Запас для следующего урока (мини-проверка и разминка): только
     аналоги, по кругу прототипов урока — ФИПИ на них не тратим. */
  const krug = [...bank, ...dop];
  let i = 0;
  const sleduyushchaya = () => {
    const id = krug[i % krug.length]!;
    i += 1;
    return analog(id);
  };
  const proverka = sZapasom && krug.length > 0 ? raz(ZAPAS_PROVERKA, sleduyushchaya) : [];
  const razminka = sZapasom && krug.length > 0 ? raz(ZAPAS_RAZMINKA, sleduyushchaya) : [];
  const zanyatoZapasom = new Set([...vzyato].filter((x) => !zanyatoBlokami.has(x)));
  return {
    bloki: { razbor, sam, dz },
    proverka,
    razminka,
    zanyatoBlokami,
    zanyatoZapasom,
    isklyuchit: new Set(isklyuchit),
    nehvatka: nehvatkaBlokov,
  };
}

/* ── Серия ───────────────────────────────────────────────────────── */

export interface Seriya {
  kod: KodSerii;
  uroki: Map<number, RaskladkaUroka>;
  /** Итоговая работа: варианты по 12 задач. */
  itog: ZadachaPlan[][];
  /** Всё, что занято серией (уроки, запас, итоговая). */
  zanyato: Set<string>;
  /** Занято до урока N (для раскладки урока с настройками учителя). */
  doUroka: Map<number, Set<string>>;
  /** Пул уроков: ФИПИ без резерва итоговой и все аналоги. */
  pul: Pul;
  rezerv: Rezerv;
}

/* ── Резерв итоговой работы ──────────────────────────────────────── */

/** ФИПИ на прототип для уроков по умолчанию: «Разбор» 1 + «ДЗ» 1. */
const FIPI_V_UROKAH = KOLICHESTVO_1.razbor + Math.ceil(KOLICHESTVO_1.dz / 2);

/**
 * Сколько ФИПИ прототипа отдать урокам. Где задач банка много (6 и
 * больше), уроки получают запас на одну перегенерацию — ещё
 * FIPI_V_UROKAH задач, а резерв итоговой сохраняет не меньше двух.
 * Где задач 3–5 — ровно норма урока, с одной задачей — 0, с двумя —
 * одна: итоговой всегда остаётся хотя бы одна.
 */
export function fipiDlyaUrokov(n: number): number {
  if (n >= 6) return Math.min(2 * FIPI_V_UROKAH, n - 2);
  return Math.max(0, Math.min(FIPI_V_UROKAH, n - 1));
}

export interface Rezerv {
  /** ФИПИ прототипа, которые могут взять уроки 1–12. */
  uroki: Map<string, number[]>;
  /** ФИПИ прототипа, отложенные для итоговой: в уроки не идут никогда. */
  itog: Map<string, number[]>;
}

/**
 * Резерв итоговой — до сборки серии. ФИПИ каждого прототипа банка
 * перемешиваются по коду: урокам — fipiDlyaUrokov (норма урока, а где
 * задач 6 и больше — с запасом на перегенерацию), итоговой — всё
 * остальное, хотя бы одна задача. Если ФИПИ не хватает и на уроки, и на резерв, урок
 * получает аналог, а задача банка остаётся итоговой.
 */
export function rezervItoga(osnova: string, pul: Pul): Rezerv {
  const uroki = new Map<string, number[]>();
  const itog = new Map<string, number[]>();
  for (const u of UROKI_1.slice(0, ITOG_1.uroki)) {
    for (const id of u.bank.map(klyuchProto)) {
      const vse = pul.fipi.get(id) ?? [];
      const smes = rngOf(`z1-rezerv|${osnova}|${id}`).sample(vse, vse.length);
      const vUroki = fipiDlyaUrokov(smes.length);
      uroki.set(id, smes.slice(0, vUroki));
      itog.set(id, smes.slice(vUroki));
    }
  }
  return { uroki, itog };
}

/** Прототипы, где ФИПИ не хватает и на уроки, и на резерв: в уроки идёт аналог. */
export function nehvatkaFipi(pul: Pul): { proto: number; fipi: number }[] {
  return UROKI_1.slice(0, ITOG_1.uroki)
    .flatMap((u) => u.bank)
    .map((proto) => ({ proto, fipi: (pul.fipi.get(klyuchProto(proto)) ?? []).length }))
    .filter((x) => x.fipi - 1 < FIPI_V_UROKAH);
}

/**
 * Итоговая поколения g: по задаче на урок 1–12 в каждом варианте,
 * только из резерва. Каждое поколение берёт задачи, которых не было в
 * прежних поколениях; когда резерв урока кончается — хотя бы не из
 * предыдущего поколения, так что две перегенерации подряд не
 * пересекаются.
 */
function itogPokoleniya(
  osnova: string,
  g: number,
  rezerv: Rezerv,
  prezhnie: ReadonlySet<string>,
  predydushchee: ReadonlySet<string>,
): ZadachaPlan[][] {
  const rng = rngOf(`z1-itog|${osnova}|${g}`);
  const varianty: ZadachaPlan[][] = Array.from({ length: ITOG_1.variantov }, () => []);
  for (const u of UROKI_1.slice(0, ITOG_1.uroki)) {
    const ids = rng.sample(u.bank.map(klyuchProto), u.bank.length);
    const vzyato = new Set<string>();
    varianty.forEach((v, vi) => {
      /* Варианты — по возможности разные прототипы урока. */
      const poryadok = ids.map((_, t) => ids[(vi + t) % ids.length]!);
      for (const filtr of [
        (key: string) => !prezhnie.has(key),
        (key: string) => !predydushchee.has(key),
        () => true,
      ]) {
        for (const id of poryadok) {
          const svobodnye = (rezerv.itog.get(id) ?? []).filter(
            (no) => !vzyato.has(kBank(no)) && filtr(kBank(no)),
          );
          if (svobodnye.length === 0) continue;
          const no = rng.pick(svobodnye);
          vzyato.add(kBank(no));
          v.push({ vid: 'bank', id, no });
          return;
        }
      }
    });
  }
  return varianty;
}

export function seriya(kod: KodSerii, bank: readonly UslovieBanka[]): Seriya {
  const pul = pulIz(bank);
  const rezerv = rezervItoga(kod.osnova, pul);
  /* Уроки видят только свою часть ФИПИ: резерв итоговой им недоступен. */
  const pulUrokov: Pul = { fipi: rezerv.uroki, analogi: pul.analogi };
  const zanyato = new Set<string>();
  const uroki = new Map<number, RaskladkaUroka>();
  const doUroka = new Map<number, Set<string>>();
  for (const u of UROKI_1.slice(0, ITOG_1.uroki)) {
    doUroka.set(u.no, new Set(zanyato));
    const g = kod.regen[u.no] ?? 0;
    let isklyuchit = new Set<string>();
    let r: RaskladkaUroka | null = null;
    for (let h = 0; h <= g; h += 1) {
      r = razlozhit(kod.osnova, u, h, pulUrokov, zanyato, isklyuchit, KOLICHESTVO_1, true);
      if (h < g) isklyuchit = new Set([...isklyuchit, ...r.zanyatoBlokami, ...r.zanyatoZapasom]);
    }
    uroki.set(u.no, r!);
    for (const key of [...r!.zanyatoBlokami, ...r!.zanyatoZapasom]) zanyato.add(key);
  }
  const urokItoga = ITOG_1.uroki + 1;
  doUroka.set(urokItoga, new Set(zanyato));
  const g12 = kod.regen[urokItoga] ?? 0;
  let itog: ZadachaPlan[][] = [];
  const prezhnie = new Set<string>();
  let predydushchee = new Set<string>();
  for (let h = 0; h <= g12; h += 1) {
    itog = itogPokoleniya(kod.osnova, h, rezerv, prezhnie, predydushchee);
    predydushchee = new Set(itog.flat().map(klyuchPoz));
    for (const key of predydushchee) prezhnie.add(key);
  }
  for (const p of itog.flat()) zanyato.add(klyuchPoz(p));
  return { kod, uroki, itog, zanyato, doUroka, pul: pulUrokov, rezerv };
}

/* ── План листа урока ────────────────────────────────────────────── */

export interface NastroykiUroka {
  /** Выключенные блоки. */
  vykl: readonly BlokUroka1[];
  /** Число задач блока, если отличается от KOLICHESTVO_1. */
  n: Partial<Record<BlokUroka1, number>>;
  /** Лист учителя: полные решения у всех задач, а не только у «Разбора». */
  polnye?: boolean;
}

export const NASTROYKI_PO_UMOLCHANIYU: NastroykiUroka = { vykl: [], n: {} };

export interface BlokPlana {
  id: BlokUroka1 | 'v1' | 'v2';
  title: string;
  pozicii: ZadachaPlan[];
}

export interface PlanUroka {
  urok: Urok1;
  bloki: BlokPlana[];
  /** Сколько задач «из банка» заменены аналогами или новыми: банк кончился. */
  nehvatka: number;
}

export function kolichestvoUroka(n: NastroykiUroka): Kolichestvo {
  const out = { ...KOLICHESTVO_1 };
  for (const b of BLOKI_UROKA_1) {
    const x = n.n[b.id];
    if (x !== undefined) out[b.id] = Math.max(0, Math.min(b.max, Math.floor(x)));
  }
  return out;
}

/** Блоки урока N: из серии, а с настройками учителя — раскладка заново. */
export function planUroka(
  s: Seriya,
  no: number,
  nastroyki: NastroykiUroka = NASTROYKI_PO_UMOLCHANIYU,
): PlanUroka {
  const urok = UROKI_1.find((u) => u.no === no) ?? UROKI_1[0]!;
  const k = kolichestvoUroka(nastroyki);
  const vkl = (id: BlokUroka1) => !nastroyki.vykl.includes(id) && k[id] > 0;
  const title = (id: BlokUroka1) =>
    BLOKI_UROKA_1.find((b) => b.id === id)?.sheetTitle(urok.no - 1) ?? id;
  const bloki: BlokPlana[] = [];
  /* Шпаргалка — в начале листа: карточки справочника к этому уроку. */
  if (vkl('shpargalka') && urok.no <= ITOG_1.uroki)
    bloki.push({ id: 'shpargalka', title: title('shpargalka'), pozicii: [] });
  const proshlyy = s.uroki.get(urok.no - 1);
  if (proshlyy !== undefined) {
    if (vkl('proverka'))
      bloki.push({
        id: 'proverka',
        title: title('proverka'),
        pozicii: proshlyy.proverka.slice(0, k.proverka),
      });
    if (vkl('razminka') && urok.no <= ITOG_1.uroki)
      bloki.push({
        id: 'razminka',
        title: title('razminka'),
        pozicii: proshlyy.razminka.slice(0, k.razminka),
      });
  }
  if (urok.no > ITOG_1.uroki) {
    s.itog.forEach((v, i) =>
      bloki.push({ id: i === 0 ? 'v1' : 'v2', title: ITOG_1.title(i + 1), pozicii: v }),
    );
    return { urok, bloki, nehvatka: 0 };
  }
  let r = s.uroki.get(urok.no)!;
  const svoi = (['razbor', 'sam', 'dz'] as const).some((b) => k[b] !== KOLICHESTVO_1[b]);
  if (svoi) {
    /* Настройки учителя: тот же урок того же поколения, занятое серией
       (кроме блоков самого урока) не трогаем — повторов нет. */
    const zanyato = new Set([...s.zanyato].filter((x) => !r.zanyatoBlokami.has(x)));
    r = razlozhit(
      s.kod.osnova,
      urok,
      s.kod.regen[urok.no] ?? 0,
      s.pul,
      zanyato,
      r.isklyuchit,
      k,
      false,
    );
  }
  for (const id of ['razbor', 'sam', 'dz'] as const) {
    if (vkl(id)) bloki.push({ id, title: title(id), pozicii: r.bloki[id] });
  }
  return { urok, bloki, nehvatka: r.nehvatka };
}

/** Сколько задач на листе урока. */
export function zadachUroka(p: PlanUroka): number {
  return p.bloki.reduce((s, b) => s + b.pozicii.length, 0);
}

export { klyuchPoz, pulIz };
