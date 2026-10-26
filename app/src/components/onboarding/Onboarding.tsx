'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { HOWTO_HREF } from '@/content/onboarding';
import { useIntroRequest, useOnboarding, useWelcomeAtLoad } from '@/lib/onboarding';
import { POV_HREF } from '@/content/povyshennye';
import { HelpFab } from './HelpFab';
import { IntroWelcome } from './IntroWelcome';
import './onboarding.css';

/* Тур грузится, только когда идёт: онбординг стоит на каждой странице. */
const Tour = dynamic(() => import('./Tour').then((m) => m.Tour), { ssr: false });

/** Страницы без онбординга: печатные листы, PDF, служебные витрины и прототипы. */
function quiet(path: string): boolean {
  return (
    path.includes('/pechat') ||
    path.includes('/pdf') ||
    path.startsWith('/styleguide') ||
    path.includes('/vitrina') ||
    path.startsWith('/dev/')
  );
}

const noSubscribe = () => () => {};

/** Страница открыта во фрейме (фон прототипа заставки): там онбординг лишний. */
function useFramed(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => window.self !== window.top,
    () => false,
  );
}

/**
 * Где заставку первого визита не показывать, хотя человек здесь впервые:
 * пришёл по ссылке с кодом комплекта или на конкретную тренировку —
 * ему нужна она, а не приветствие; поисковый робот — ему нужна страница.
 * Считается один раз при загрузке: адрес на тот момент и есть «как пришёл».
 */
function useIntroBlocked(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      const { pathname, search } = window.location;
      const params = new URLSearchParams(search);
      if (params.has('kit') || params.has('seed')) return true;
      if (pathname.includes('/trenazher')) return true;
      return /bot|crawl|spider|slurp|yandex|google|bing|baidu|duckduck|lighthouse/i.test(
        navigator.userAgent,
      );
    },
    () => true,
  );
}

/**
 * Онбординг на всех страницах сайта: заставка первого визита с окном
 * «Добро пожаловать», кнопка «?» и тур. Стоит в корневом layout, поэтому
 * тур переживает переходы между страницами.
 */
export function Onboarding() {
  const path = usePathname();
  const state = useOnboarding();
  const welcomeNeeded = useWelcomeAtLoad();
  const blocked = useIntroBlocked();
  const replay = useIntroRequest();
  const framed = useFramed();
  if (quiet(path) || framed) return null;
  /* На странице инструкции заставка лишняя: человек уже читает, как
     пользоваться сайтом. Повторный показ по просьбе — и там тоже. */
  const onHowto = path.startsWith(HOWTO_HREF.replace(/\/$/, ''));
  const first = welcomeNeeded && !blocked && !onHowto && state.active === null;
  return (
    <>
      {first || replay > 0 ? <IntroWelcome first={first} replay={replay} /> : null}
      {/* На экране «Вариантов повышенной сложности» помощь — в шторке «i»
          у заголовка: вторая кнопка в углу закрывала бы карточки. */}
      {path.startsWith(POV_HREF.replace(/\/$/, '')) ? null : <HelpFab />}
      {state.active !== null ? <Tour /> : null}
    </>
  );
}
