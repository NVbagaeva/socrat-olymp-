/**
 * Карточки по теории: система Лейтнера и сессия. Чистые функции без
 * React и без хранилища — их же проверяет scripts/verify_cards.
 *
 * Пять коробок. «Не знаю» — карточка в коробку 1 и снова появляется
 * в этой же сессии; «Знаю» — в следующую коробку. Выучена — в 5-й.
 * Новая карточка ни в одной коробке не лежит (коробка 0): первое
 * «Знаю» кладёт её во 2-ю, первое «Не знаю» — в 1-ю.
 *
 * «Быстрая проверка» коробки не трогает: 10 случайных карточек,
 * каждая один раз.
 */

export const KOROBOK = 5;

/** Запись карточки: коробка 1…5 и сколько раз её оценивали. */
export interface ZapisKartochki {
  b: number;
  n: number;
}

/** Прогресс колоды номера: id карточки → запись. Новых карточек в нём нет. */
export type ProgressKolody = Readonly<Record<string, ZapisKartochki>>;

export function korobka(p: ProgressKolody, id: string): number {
  return p[id]?.b ?? 0;
}

export function vyuchena(p: ProgressKolody, id: string): boolean {
  return korobka(p, id) >= KOROBOK;
}

/** Незнакомая: ещё не открывали или последний раз — «Не знаю». */
export function neznakoma(p: ProgressKolody, id: string): boolean {
  return korobka(p, id) <= 1;
}

/** Оценка карточки: новый прогресс, старый не меняется. */
export function otsenit(p: ProgressKolody, id: string, znayu: boolean): ProgressKolody {
  const bylo = p[id];
  const b = znayu ? Math.min(KOROBOK, Math.max(1, bylo?.b ?? 1) + 1) : 1;
  return { ...p, [id]: { b, n: (bylo?.n ?? 0) + 1 } };
}

/* ── Режимы ─────────────────────────────────────────────────────── */

export type Rezhim = 'vse' | 'temy' | 'neznakomye' | 'bystro';

export const BYSTRO_KARTOCHEK = 10;

export interface KartochkaOcheredi {
  id: string;
  topic: string;
}

function peremeshat<T>(items: readonly T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Очередь сессии. В обучающих режимах сначала младшие коробки —
 * то, что ученик знает хуже, — внутри коробки порядок случайный.
 * «По подтемам» — только отмеченные подтемы.
 */
export function sobratOchered(
  rezhim: Rezhim,
  kartochki: readonly KartochkaOcheredi[],
  p: ProgressKolody,
  rnd: () => number,
  temy: readonly string[] = [],
): string[] {
  if (rezhim === 'bystro') {
    return peremeshat(kartochki, rnd)
      .slice(0, BYSTRO_KARTOCHEK)
      .map((k) => k.id);
  }
  const otbor = kartochki.filter((k) => {
    if (rezhim === 'temy') return temy.includes(k.topic);
    if (rezhim === 'neznakomye') return neznakoma(p, k.id);
    return true;
  });
  /* Коробка 0 (новая) и 1 («Не знаю») — одна очередь: обе незнакомы. */
  const ves = (id: string) => Math.max(1, korobka(p, id));
  return peremeshat(otbor, rnd)
    .sort((a, b) => ves(a.id) - ves(b.id))
    .map((k) => k.id);
}

/* ── Сессия ─────────────────────────────────────────────────────── */

/** Через сколько карточек возвращается «Не знаю». */
export const SDVIG_POVTORA = 3;
/** Больше стольких показов за сессию карточка не возвращается. */
export const POKAZOV_MAKS = 3;

export interface Sessiya {
  rezhim: Rezhim;
  ochered: readonly string[];
  /** Номер текущей карточки в очереди. */
  poz: number;
  /** Сколько раз показана каждая карточка. */
  pokazy: Readonly<Record<string, number>>;
  /** Было ли у карточки хоть одно «Не знаю» в этой сессии. */
  oshibki: Readonly<Record<string, true>>;
  /** Последняя оценка каждой карточки. */
  posledniy: Readonly<Record<string, boolean>>;
}

export function novayaSessiya(rezhim: Rezhim, ochered: readonly string[]): Sessiya {
  return { rezhim, ochered, poz: 0, pokazy: {}, oshibki: {}, posledniy: {} };
}

export function tekushchaya(s: Sessiya): string | null {
  return s.ochered[s.poz] ?? null;
}

export function zakonchena(s: Sessiya): boolean {
  return s.poz >= s.ochered.length;
}

/**
 * Оценка текущей карточки в сессии. «Не знаю» вне быстрой проверки
 * ставит карточку обратно в очередь через SDVIG_POVTORA позиций.
 */
export function otmetit(s: Sessiya, znayu: boolean): Sessiya {
  const id = tekushchaya(s);
  if (id === null) return s;
  const pokazov = (s.pokazy[id] ?? 0) + 1;
  let ochered = s.ochered;
  if (!znayu && s.rezhim !== 'bystro' && pokazov < POKAZOV_MAKS) {
    const kuda = Math.min(ochered.length, s.poz + 1 + SDVIG_POVTORA);
    ochered = [...ochered.slice(0, kuda), id, ...ochered.slice(kuda)];
  }
  return {
    ...s,
    ochered,
    poz: s.poz + 1,
    pokazy: { ...s.pokazy, [id]: pokazov },
    oshibki: znayu ? s.oshibki : { ...s.oshibki, [id]: true },
    posledniy: { ...s.posledniy, [id]: znayu },
  };
}

/** Влияет ли сессия на коробки. */
export function menyaetKorobki(s: Sessiya): boolean {
  return s.rezhim !== 'bystro';
}

export interface ItogSessii {
  /** Знал с первого раза. */
  znayu: number;
  /** Хоть раз «Не знаю» — повторить. */
  povtorit: number;
  povtoritIds: string[];
  /** Подтемы, где больше всего «Не знаю», по убыванию. */
  slabye: { topic: string; oshibok: number }[];
}

export function itog(s: Sessiya, kartochki: readonly KartochkaOcheredi[]): ItogSessii {
  const temaPo = new Map(kartochki.map((k) => [k.id, k.topic]));
  const pokazany = Object.keys(s.pokazy);
  const povtoritIds = pokazany.filter((id) => s.oshibki[id] === true);
  const poTemam = new Map<string, number>();
  povtoritIds.forEach((id) => {
    const t = temaPo.get(id);
    if (t !== undefined) poTemam.set(t, (poTemam.get(t) ?? 0) + 1);
  });
  return {
    znayu: pokazany.length - povtoritIds.length,
    povtorit: povtoritIds.length,
    povtoritIds,
    slabye: [...poTemam.entries()]
      .map(([topic, oshibok]) => ({ topic, oshibok }))
      .sort((a, b) => b.oshibok - a.oshibok),
  };
}

/** Сколько карточек выучено: всего и по подтемам. */
export function vyuchenoPoTemam(
  kartochki: readonly KartochkaOcheredi[],
  p: ProgressKolody,
): { vsego: number; temy: Record<string, { vyucheno: number; vsego: number }> } {
  const temy: Record<string, { vyucheno: number; vsego: number }> = {};
  let vsego = 0;
  kartochki.forEach((k) => {
    const t = (temy[k.topic] ??= { vyucheno: 0, vsego: 0 });
    t.vsego += 1;
    if (vyuchena(p, k.id)) {
      t.vyucheno += 1;
      vsego += 1;
    }
  });
  return { vsego, temy };
}
