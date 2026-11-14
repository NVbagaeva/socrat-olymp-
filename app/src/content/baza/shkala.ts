/**
 * Базовая математика: формат экзамена и шкала перевода первичного
 * балла в отметку — отдельный конфиг, один источник для варианта базы,
 * итогов и текстов.
 *
 * Формат (спецификация КИМ ЕГЭ по математике, базовый уровень; на 2027
 * год без изменений): 21 задание с кратким ответом, по 1 баллу,
 * 180 минут.
 *
 * Шкала: 0–6 → «2», 7–11 → «3», 12–16 → «4», 17–21 → «5». Значения
 * согласованы с заказчиком 13.11.2026 по действующей шкале
 * Рособрнадзора; из сессии сборки документ на fipi.ru и
 * obrnadzor.gov.ru не открывался, сверено по вторичным источникам.
 * Вышла новая шкала — меняется только массив OTMETKI.
 */

export const BAZA_FORMAT = {
  /** Заданий в варианте. */
  zadaniy: 21,
  /** Баллов за одно задание. */
  ball: 1,
  /** Максимальный первичный балл. */
  max: 21,
  /** Время на экзамен, минут. */
  minut: 180,
} as const;

export type Otmetka = 2 | 3 | 4 | 5;

/** Границы отметок: первичный балл от и до включительно. */
export const OTMETKI: readonly { otmetka: Otmetka; ot: number; do: number }[] = [
  { otmetka: 2, ot: 0, do: 6 },
  { otmetka: 3, ot: 7, do: 11 },
  { otmetka: 4, ot: 12, do: 16 },
  { otmetka: 5, ot: 17, do: 21 },
];

export const SHKALA_BAZY_ISTOCHNIK =
  'Шкала перевода первичных баллов ЕГЭ по базовой математике в отметку (Рособрнадзор)';

/** Отметка за первичный балл. Балл вне 0…21 прижимается к границе. */
export function otmetkaZa(ball: number): Otmetka {
  const b = Math.min(BAZA_FORMAT.max, Math.max(0, Math.floor(ball)));
  return OTMETKI.find((row) => b >= row.ot && b <= row.do)?.otmetka ?? 2;
}

/** Минимальный балл для отметки: «3» — с 7 баллов. */
export function porog(otmetka: Otmetka): number {
  return OTMETKI.find((row) => row.otmetka === otmetka)?.ot ?? 0;
}
