/**
 * Сигналы между тренажёром окружности и котиком: экран раунда сообщает
 * о проверках, котик и кнопка «Погладь котика» слушают. Через события
 * окна — баннер с котиком собирается на сервере и пропсов от экрана не
 * получает.
 */

export const KOTIK_RAD = 'kotik:rad';
export const KOTIK_PROVERKA = 'kotik:proverka';

export interface ProverkaDetail {
  /** Раунд разложен верно. */
  verno: boolean;
}

/** Окружность разложена верно — котик поднимает голову. */
export function kotikRad(): void {
  window.dispatchEvent(new Event(KOTIK_RAD));
}

/** Итог проверки — для подсказки «Устал? Погладь котика». */
export function kotikProverka(verno: boolean): void {
  window.dispatchEvent(new CustomEvent<ProverkaDetail>(KOTIK_PROVERKA, { detail: { verno } }));
}
