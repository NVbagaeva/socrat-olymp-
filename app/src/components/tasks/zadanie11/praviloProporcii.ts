/**
 * Правило пропорции в разборе: в первой задаче тренировки или урока
 * карточка раскрыта, в следующих — свёрнута (кнопка «Напомнить
 * правило пропорции»). «Первая» — первая показанная на этой странице.
 */

let pokazano = false;

/** ref разбора: раскрыть правило, если его ещё не показывали. */
export function praviloOdinRaz(el: HTMLElement | null): void {
  if (el === null || pokazano) return;
  const card = el.querySelector<HTMLDetailsElement>('details.prc-pravilo');
  if (card !== null) {
    card.open = true;
    pokazano = true;
  }
}
