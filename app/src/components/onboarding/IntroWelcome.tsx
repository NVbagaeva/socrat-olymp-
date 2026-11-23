'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { markWelcomeSeen, startTour } from '@/lib/onboarding';

/* Заставка со слоями — отдельный чанк: грузится только при показе. */
const loadSplash = () => import('./intro/IntroSplash');
const IntroSplash = dynamic(() => loadSplash().then((m) => m.IntroSplash), {
  ssr: false,
});

/** Пауза после загрузки страницы до заставки: дать первому экрану отрисоваться. */
const DELAY_MS = 2500;
/** Если на странице уже открыто другое окно — подождать и проверить снова. */
const RETRY_MS = 1000;

/** Открыто ли на странице другое окно или меню. */
function somethingOpen(): boolean {
  return document.querySelector('[aria-modal="true"], .site-menu, .tour') !== null;
}

/**
 * Вызвать, когда страница под заставкой догрузилась (событие load) и
 * браузер свободен. Тяжёлый чанк заставки будет запрошен позже, после паузы.
 */
function afterPageLoad(run: () => void): () => void {
  let idle = 0;
  let timer = 0;
  const go = () => {
    if (typeof window.requestIdleCallback === 'function') {
      idle = window.requestIdleCallback(run, { timeout: 500 });
    } else {
      timer = window.setTimeout(run, 0);
    }
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once: true });
  return () => {
    window.removeEventListener('load', go);
    if (idle !== 0) window.cancelIdleCallback(idle);
    window.clearTimeout(timer);
  };
}

/**
 * Заставка первого визита на сайте: октаэдр → цветок → окно «Добро
 * пожаловать» (intro/IntroSplash). Один раз за всё время на этом
 * устройстве: через секунду после открытия страницы и не поверх другого
 * окна. «Уже видел» помнит тот же ключ, что и прежнее окно «Впервые
 * здесь?». Повторно — по просьбе (replay > 0), тогда сразу.
 *
 * «Тур для ученика» и «Тур для репетитора» запускают свой тур.
 */
export function IntroWelcome({ first, replay }: { first: boolean; replay: number }) {
  const [open, setOpen] = useState(false);
  const [shownReplay, setShownReplay] = useState(0);

  /* Первый визит: после load и idle выдержать паузу, чтобы главный экран
     завершил отрисовку до запроса кода и картинок заставки. */
  useEffect(() => {
    if (!first) return;
    let cancelled = false;
    let timer = 0;
    const show = () => {
      if (cancelled) return;
      if (somethingOpen()) {
        timer = window.setTimeout(show, RETRY_MS);
        return;
      }
      markWelcomeSeen();
      setOpen(true);
    };
    const cancelLoad = afterPageLoad(() => {
      timer = window.setTimeout(() => {
        void loadSplash().then(show);
      }, DELAY_MS);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelLoad();
    };
  }, [first]);

  /* Повтор по просьбе: сразу, со свежей анимацией. */
  useEffect(() => {
    if (replay === 0) return;
    const timer = window.setTimeout(() => {
      setShownReplay(replay);
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [replay]);

  if (!open) return null;
  const close = () => setOpen(false);
  return (
    <IntroSplash
      key={shownReplay}
      onChoose={(choice) => {
        close();
        startTour(choice, 0);
      }}
      onLater={close}
      onClose={close}
    />
  );
}
