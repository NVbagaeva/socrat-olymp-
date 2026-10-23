'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { howtoHref } from '@/content/onboarding';
import { markWelcomeSeen, startTour } from '@/lib/onboarding';

/* Заставка со слоями — отдельный чанк: грузится только при показе. */
const IntroSplash = dynamic(() => import('./intro/IntroSplash').then((m) => m.IntroSplash), {
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
 * Заставка первого визита на сайте: октаэдр → цветок → окно «Добро
 * пожаловать» (intro/IntroSplash). Один раз за всё время на этом
 * устройстве: через секунду после открытия страницы и не поверх другого
 * окна. «Уже видел» помнит тот же ключ, что и прежнее окно «Впервые
 * здесь?». Повторно — по просьбе (replay > 0), тогда сразу.
 *
 * «Тур для репетитора» запускает тур. Тура для ученика пока нет —
 * «Тур для ученика» открывает инструкцию для ученика на странице
 * «Как пользоваться».
 */
export function IntroWelcome({ first, replay }: { first: boolean; replay: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shownReplay, setShownReplay] = useState(0);

  /* Первый визит: с задержкой, не поверх другого окна. */
  useEffect(() => {
    if (!first) return;
    let timer = window.setTimeout(function check() {
      if (somethingOpen()) {
        timer = window.setTimeout(check, RETRY_MS);
        return;
      }
      markWelcomeSeen();
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(timer);
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
        if (choice === 'repetitor') startTour('repetitor', 0);
        else router.push(howtoHref('uchenik'));
      }}
      onLater={close}
      onClose={close}
    />
  );
}
