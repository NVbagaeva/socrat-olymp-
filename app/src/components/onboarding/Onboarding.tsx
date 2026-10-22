'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { HOWTO_HREF } from '@/content/onboarding';
import { useOnboarding, useWelcomeAtLoad } from '@/lib/onboarding';
import { HelpFab } from './HelpFab';
import './onboarding.css';

/* Тур и окно приветствия грузятся, только когда нужны: онбординг стоит
   на каждой странице, а тур идёт редко, окно — один раз. */
const Tour = dynamic(() => import('./Tour').then((m) => m.Tour), { ssr: false });
const Welcome = dynamic(() => import('./Welcome').then((m) => m.Welcome), { ssr: false });

/** Страницы без онбординга: печатные листы и служебные витрины. */
function quiet(path: string): boolean {
  return path.includes('/pechat') || path.startsWith('/styleguide') || path.includes('/vitrina');
}

/**
 * Онбординг на всех страницах сайта: окно «Впервые здесь?», кнопка «?»
 * и тур. Стоит в корневом layout, поэтому тур переживает переходы
 * между страницами.
 */
export function Onboarding() {
  const path = usePathname();
  const state = useOnboarding();
  const welcomeNeeded = useWelcomeAtLoad();
  if (quiet(path)) return null;
  const onHowto = path.startsWith(HOWTO_HREF.replace(/\/$/, ''));
  return (
    <>
      {/* На странице инструкции окно «Впервые здесь?» лишнее: человек
          уже читает, как пользоваться сайтом. */}
      {welcomeNeeded ? <Welcome allowed={!onHowto} /> : null}
      <HelpFab />
      {state.active !== null ? <Tour /> : null}
    </>
  );
}
