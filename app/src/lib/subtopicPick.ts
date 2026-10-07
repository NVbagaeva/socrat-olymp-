'use client';

/**
 * Последняя нажатая карточка подтемы.
 *
 * Стрелка на карточках подтем в покое серая и синеет только у той
 * карточки, на которую нажали. Нажатие запоминается на время вкладки
 * браузера (sessionStorage): вернулся назад — подсветка на месте,
 * открыл сайт заново — все стрелки снова серые.
 *
 * Хранится один адрес: подсветка одна на страницу, и выбор другой
 * карточки просто переносит её. Устройство то же, что у прочитанных
 * разделов теории (lib/theoryRead.ts): внешний источник, который React
 * читает через useSyncExternalStore. На сервере источник пуст, поэтому
 * первая отрисовка — все стрелки серые, и расхождению при гидратации
 * взяться неоткуда.
 */

import { useSyncExternalStore } from 'react';

const KEY = 'budetege:subtopic-pick';

const listeners = new Set<() => void>();
let current: string | null | undefined;

/* В приватном окне доступ к хранилищу выбрасывает исключение,
   поэтому каждое обращение — в try/catch: выбор живёт в памяти. */
function read(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function snapshot(): string | null {
  if (current === undefined) {
    current = read();
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Запомнить нажатую карточку: подсветка переходит к ней. */
export function pickSubtopic(href: string): void {
  current = href;
  try {
    window.sessionStorage.setItem(KEY, href);
  } catch {
    /* см. read */
  }
  listeners.forEach((listener) => listener());
}

/** Нажата ли карточка с этим адресом последней. */
export function useSubtopicPicked(href: string | null): boolean {
  const picked = useSyncExternalStore(subscribe, snapshot, () => null);
  return href !== null && picked === href;
}
