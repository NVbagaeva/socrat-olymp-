'use client';

import Link from 'next/link';
import { useSyncExternalStore, type ReactNode } from 'react';
import { SKRYTYE } from '@/content/skrytye';
import { tasksPage } from '@/content/tasks';
import { SKRYTYE_VSEM, estMetka } from '@/lib/skrytye';
import './skrytye.css';

type Dostup = 'proverka' | 'est' | 'net';

/* Метка — cookie: сама она не меняется, пока страница открыта, поэтому
   подписываться не на что. */
const bezPodpiski = () => () => {};
const vBrauzere = (): Dostup => (SKRYTYE_VSEM || estMetka() ? 'est' : 'net');
const priSborke = (): Dostup => (SKRYTYE_VSEM ? 'est' : 'proverka');

/**
 * Страницы скрытого раздела (content/struktura.js, skryt).
 *
 * Посетителю сервер отвечает 404 и до этой страницы не доходит. Здесь
 * — страховка в браузере: переход внутри сайта и хостинг, который
 * отдаёт файл мимо правил .htaccess (docs/DEPLOYMENT.md). Без метки
 * администратора вместо раздела — «Страница не найдена».
 *
 * В разметке, собранной заранее, раздела нет: до проверки метки
 * компонент ничего не рисует.
 */
export function SkrytyyRazdel({ prichina, children }: { prichina: string; children: ReactNode }) {
  /* При сборке и до оживления страницы — «проверка»: раздела в разметке
     нет. В браузере — по метке. */
  const dostup = useSyncExternalStore(bezPodpiski, vBrauzere, priSborke);

  if (dostup === 'proverka') {
    return null;
  }
  if (dostup === 'net') {
    return (
      <main className="app-main skryt-net" data-skrytyy-razdel="net">
        <h1 className="skryt-net__title">{SKRYTYE.netStranitsy.title}</h1>
        <p className="skryt-net__text">{SKRYTYE.netStranitsy.text}</p>
        <Link className="btn btn--primary" href={tasksPage.href}>
          {SKRYTYE.netStranitsy.vBank}
        </Link>
      </main>
    );
  }
  return (
    <>
      <p className="skryt-plashka" role="note" data-skrytyy-razdel="est">
        <b className="skryt-plashka__prichina">{prichina}</b>
        <span>{SKRYTYE_VSEM ? SKRYTYE.plashka.vsem : SKRYTYE.plashka.text}</span>
      </p>
      {children}
    </>
  );
}
