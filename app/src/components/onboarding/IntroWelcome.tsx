'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { markWelcomeSeen, startTour } from '@/lib/onboarding';

/* Заставка со слоями — отдельный чанк: грузится только при показе. */
const loadSplash = () => import('./intro/IntroSplash');
const IntroSplash = dynamic(() => loadSplash().then((m) => m.IntroSplash), {
  ssr: false,
});

/** Через сколько после открытия страницы показать заставку. */
const DELAY_MS = 1200;
/** Если на странице уже открыто другое окно — подождать и проверить снова. */
const RETRY_MS = 1000;

/** Открыто ли на странице другое окно или меню. */
function somethingOpen(): boolean {
  return document.querySelector('[aria-modal="true"], .site-menu, .tour') !== null;
}

/**
 * Вызвать, когда страница под заставкой догрузилась (событие load) и
 * браузер свободен. Код и слои заставки не делят сеть и главный поток
 * с картинками и скриптами самой страницы. На быстром соединении load
 * наступает раньше DELAY_MS, и заставка выходит в прежний момент.
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

  /* Первый визит: с задержкой, не поверх другого окна и не раньше,
     чем догрузится сама страница. Код заставки забирается заранее,
     в свободное время после load: к показу он уже на месте. */
  useEffect(() => {
    if (!first) return;
    let loaded = false;
    let due = false;
    const show = () => {
      if (somethingOpen()) {
        timer = window.setTimeout(show, RETRY_MS);
        return;
      }
      markWelcomeSeen();
      setOpen(true);
    };
    let timer = window.setTimeout(() => {
      due = true;
      if (loaded) show();
    }, DELAY_MS);
    const cancelLoad = afterPageLoad(() => {
      loaded = true;
      void loadSplash();
      if (due) show();
    });
    return () => {
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
