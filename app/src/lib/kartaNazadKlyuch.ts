/**
 * Ключ метки «← К карте» в sessionStorage (lib/kartaNazad.ts). Отдельно
 * от неё: сторож в корневом layout и место кнопки в строке вкладок
 * смотрят только, есть ли метка, а код метки и кнопки грузят, когда она
 * есть, — в первую загрузку страниц он не входит.
 */
export const KARTA_NAZAD_KLYUCH = 'budetege:karta-nazad:v1';

/** Есть ли метка (без разбора). */
export function estMetka(): boolean {
  try {
    return window.sessionStorage.getItem(KARTA_NAZAD_KLYUCH) !== null;
  } catch {
    return false;
  }
}
