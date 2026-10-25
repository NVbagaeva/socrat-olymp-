/**
 * Привязка задачи к позиции в составе (схема ps=2) — общая для листов
 * разделов, которые собирает общий генератор (№11, №1).
 *
 * Позиция — «подтип + номер внутри подтипа», ключ «PR-04_0». Задача
 * позиции — функция ключа, варианта и seed листа: добавление и удаление
 * тем, перестановка задач и «Убрать» не меняют остальные задачи и не
 * сдвигают замены (docs/generator/02-design.md, раздел 9).
 *
 * Здесь — только раскладка: ключи, состав в адресе, пулы банка и выбор
 * задачи по позиции. Что такое задача банка, аналог и новая задача,
 * решает лист раздела через обратные вызовы; генераторы задач не
 * трогаются.
 */

import { rngOf } from '@/lib/vychisleniya/rng';

/** Позиция состава: подтип и номер внутри подтипа. */
export interface Slot {
  id: string;
  k: number;
}

export function klyuchSlota(s: Slot): string {
  return `${s.id}_${s.k}`;
}

/** Позиции состава по порядку; без k — следующий ключ после прежних. */
export function slotySostava(sostav: readonly { id: string; n: number; k?: number }[]): Slot[] {
  const next = new Map<string, number>();
  const seen = new Set<string>();
  const out: Slot[] = [];
  for (const x of sostav) {
    let k = x.k ?? next.get(x.id) ?? 0;
    for (let j = 0; j < x.n; j += 1, k += 1) {
      const key = `${x.id}_${k}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: x.id, k });
    }
    next.set(x.id, k);
  }
  return out;
}

/** Позиции → состав: подряд идущие ключи одного подтипа склеиваются. */
export function sostavIzSlotov(sloty: readonly Slot[]): { id: string; n: number; k: number }[] {
  const out: { id: string; n: number; k: number }[] = [];
  for (const s of sloty) {
    const last = out[out.length - 1];
    if (last !== undefined && last.id === s.id && last.k + last.n === s.k) last.n += 1;
    else out.push({ id: s.id, n: 1, k: s.k });
  }
  return out;
}

/** «PR-04:2,SM-04.3:1»: ключ пишется, только если он не следующий. */
export function sostavStroka(sostav: readonly { id: string; n: number; k?: number }[]): string {
  const next = new Map<string, number>();
  return sostav
    .map((x) => {
      const k = x.k ?? next.get(x.id) ?? 0;
      const tok = k === (next.get(x.id) ?? 0) ? x.id : `${x.id}.${k}`;
      next.set(x.id, k + x.n);
      return `${tok}:${x.n}`;
    })
    .join(',');
}

/**
 * Состав из адреса. Токен — «ID:n» или, в схеме ps=2, «ID.k:n»; idRe —
 * вид идентификатора раздела, est — есть ли такой подтип. Ключ без
 * схемы ps=2 делает токен недействительным, как в прежних адресах.
 */
export function razobratSostav(
  s: string,
  poKlyucham: boolean,
  idRe: RegExp,
  est: (id: string) => boolean,
): { id: string; n: number; k?: number }[] {
  return s
    .split(',')
    .map((x) => x.split(':'))
    .map(([tok = '', n = '1']) => {
      const m = new RegExp(`^(${idRe.source})(?:\\.(\\d{1,2}))?$`).exec(tok);
      const id = m === null || (!poKlyucham && m[2] !== undefined) ? '' : (m[1] ?? '');
      const k = m?.[2] !== undefined && id !== '' ? { k: Number(m[2]) } : {};
      return { id, n: Math.max(1, Math.min(20, Number(n) || 1)), ...k };
    })
    .filter((x) => x.id !== '' && est(x.id));
}

/**
 * Пул задач подтипа без повторов. У каждой позиции своё место в пуле —
 * «номер × число вариантов + вариант», — его она берёт первой: задачи не
 * зависят от соседей. Места плотные, чтобы маленького банка хватало на
 * весь лист; цена — при смене числа вариантов вторые и дальше задачи
 * одного подтипа берут другие места. Место занято или его нет — берётся
 * задача с конца пула: новые позиции занимают места с начала, так их
 * появление реже задевает остальные.
 */
export class Pul<T> {
  private zanyato: boolean[];
  constructor(private items: readonly T[]) {
    this.zanyato = items.map(() => false);
  }
  svoyo(i: number): T | undefined {
    if (i >= this.items.length || this.zanyato[i] === true) return undefined;
    this.zanyato[i] = true;
    return this.items[i];
  }
  sKontsa(): T | undefined {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      if (this.zanyato[i] !== true) return this.svoyo(i);
    }
    return undefined;
  }
}

/** Шаблон позиции: ключ и откуда брать задачу. */
export interface SlotShablon extends Slot {
  istochnik: string;
}

/** Ячейка листа: позиция i варианта v (с единицы), её место в пуле и seed. */
export interface Yacheyka<S extends SlotShablon> {
  s: S;
  i: number;
  v: number;
  mesto: number;
  seed: string;
}

export interface PlanPoKlyuchamOpts<S extends SlotShablon, B, P> {
  sh: readonly S[];
  variants: number;
  seed: string;
  zameny: Record<string, number>;
  /** Соль случайного выбора «банк или новая» в «банк + новые»: «z11-mix». */
  mixSol: string;
  /** Задачи банка и аналоги подтипа — уже перемешанные по seed листа. */
  bank: (id: string) => readonly B[];
  analogi: (id: string) => readonly B[];
  bankPoz: (b: B) => P;
  analogPoz: (b: B) => P;
  /** Новая задача по seed; zanyato — числа, уже стоящие на листе. */
  novaya: (c: Yacheyka<S>, seed: string, zanyato: Set<string>) => P;
  /** Seed новой задачи — чтобы замена не совпала с прежней. */
  seedNovoy: (p: P) => string | undefined;
}

/** Задачи листа по позициям: банк → аналоги → новые, затем замены. */
export function planPoKlyucham<S extends SlotShablon, B, P>(
  o: PlanPoKlyuchamOpts<S, B, P>,
): { poVariantam: P[][]; nehvatka: number } {
  const banki = new Map<string, Pul<B>>();
  const analogi = new Map<string, Pul<B>>();
  const bankDlya = (id: string) => {
    let x = banki.get(id);
    if (x === undefined) banki.set(id, (x = new Pul(o.bank(id))));
    return x;
  };
  const analogDlya = (id: string) => {
    let x = analogi.get(id);
    if (x === undefined) analogi.set(id, (x = new Pul(o.analogi(id))));
    return x;
  };
  /* Ячейки листа в порядке «подтип → ключ → вариант»: от него зависят
     только задачи одного подтипа, порядок на листе не важен. */
  const yacheyki: Yacheyka<S>[] = o.sh
    .flatMap((s, i) =>
      Array.from({ length: o.variants }, (_, vi) => ({
        s,
        i,
        v: vi + 1,
        mesto: s.k * o.variants + vi,
        seed: `${o.seed}|${vi + 1}|${klyuchSlota(s)}`,
      })),
    )
    .sort((a, b) => a.s.id.localeCompare(b.s.id) || a.s.k - b.s.k || a.v - b.v);
  const izBanka = (c: Yacheyka<S>) =>
    c.s.istochnik === 'bank' ||
    (c.s.istochnik === 'mix' && rngOf(`${o.mixSol}|${c.seed}`).next() < 0.5);

  const poVariantam: (P | undefined)[][] = Array.from({ length: o.variants }, () =>
    o.sh.map(() => undefined),
  );
  const postavit = (c: Yacheyka<S>, poz: P) => {
    const row = poVariantam[c.v - 1];
    if (row !== undefined) row[c.i] = poz;
  };
  let nehvatka = 0;

  /* Банк: сначала свои места, потом остаток с конца. */
  const bezBanka = yacheyki.filter(izBanka).filter((c) => {
    const b = bankDlya(c.s.id).svoyo(c.mesto);
    if (b !== undefined) postavit(c, o.bankPoz(b));
    return b === undefined;
  });
  const nuzhenAnalog = yacheyki.filter((c) => !izBanka(c));
  for (const c of bezBanka) {
    const b = bankDlya(c.s.id).sKontsa();
    if (b !== undefined) postavit(c, o.bankPoz(b));
    else {
      if (c.s.istochnik === 'bank') nehvatka += 1;
      nuzhenAnalog.push(c);
    }
  }
  /* Аналоги — так же; не хватило — новая задача по своему seed. */
  nuzhenAnalog.sort((a, b) => yacheyki.indexOf(a) - yacheyki.indexOf(b));
  const bezAnaloga = nuzhenAnalog.filter((c) => {
    const a = analogDlya(c.s.id).svoyo(c.mesto);
    if (a !== undefined) postavit(c, o.analogPoz(a));
    return a === undefined;
  });
  const zanyatoNovye = new Set<string>();
  for (const c of bezAnaloga) {
    const a = analogDlya(c.s.id).sKontsa();
    postavit(c, a !== undefined ? o.analogPoz(a) : o.novaya(c, c.seed, zanyatoNovye));
  }

  /* Замены: k-я замена берёт k-ю ещё не занятую задачу пула с конца;
     пул кончился — следующий источник, затем новая задача. */
  for (const c of yacheyki) {
    const n = o.zameny[`${c.v}.${klyuchSlota(c.s)}`] ?? 0;
    if (n <= 0) continue;
    const old = poVariantam[c.v - 1]?.[c.i];
    let left = n;
    let next: P | undefined;
    if (izBanka(c)) {
      while (left > 0) {
        const b = bankDlya(c.s.id).sKontsa();
        if (b === undefined) break;
        next = o.bankPoz(b);
        left -= 1;
      }
    }
    while (left > 0) {
      const a = analogDlya(c.s.id).sKontsa();
      if (a === undefined) break;
      next = o.analogPoz(a);
      left -= 1;
    }
    if (left > 0) {
      let seed = `${c.seed}|z${n}`;
      /* Замена должна отличаться от прежней задачи. */
      if (old !== undefined && o.seedNovoy(old) === seed) seed = `${c.seed}|z${n + 100}`;
      next = o.novaya(c, seed, zanyatoNovye);
    }
    if (next !== undefined) postavit(c, next);
  }
  return {
    poVariantam: poVariantam.map((row) => row.filter((x): x is P => x !== undefined)),
    nehvatka,
  };
}
