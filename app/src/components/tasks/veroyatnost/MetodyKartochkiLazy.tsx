'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MetodyKartochki as Cards } from './MetodyKartochki';

/**
 * Карточки методов с отложенной загрузкой.
 *
 * Сами карточки считают примеры движком graph/ и набирают формулы
 * KaTeX в браузере — это сотни килобайт кода. Страница темы открывается
 * на вкладке «О задании», методов на ней ещё нет, а React загружает
 * сразу все клиентские модули, упомянутые в странице. Через эту
 * обёртку упоминается только она сама: движок подтягивается, когда
 * ученик открыл вкладку методов.
 */
const Lazy = dynamic(() => import('./MetodyKartochki').then((m) => m.MetodyKartochki), {
  loading: () => (
    <p className="lazy-loading" role="status">
      Загружаем методы…
    </p>
  ),
});

export function MetodyKartochkiLazy(props: ComponentProps<typeof Cards>) {
  return <Lazy {...props} />;
}
