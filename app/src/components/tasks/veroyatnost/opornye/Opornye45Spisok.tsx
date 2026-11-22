'use client';

import type { ReactNode } from 'react';
import { OpornyeSpisok } from '../../opornye';
import { tekstyOpornyh45 } from '@/content/veroyatnost45';
import type { Ton } from '../../steklo';
import { prepResheno, prepStore } from '@/lib/veroyatnost/prepProgress';
import type { Zadanie45 } from '@/lib/veroyatnost/trening/links';

export interface Blok45 {
  slug: string;
  href: string;
  nazvanie: string;
  /** Значок блока: объёмная иллюстрация метода (готовый узел). */
  znak: ReactNode;
  /** Ключи задач блока: по ним считается «решено». */
  zadachi: string[];
}

export interface Navyk45 {
  id: string;
  nazvanie: string;
  lead: string;
  ton: Ton;
  bloki: Blok45[];
}

/**
 * Список блоков опорных задач №4 и №5 по навыкам — на общих карточках
 * (components/tasks/opornye). Прогресс — прежнее хранилище подготовки
 * (budetege:veroyatnost-N:prep:v1), решено — верный ответ своими силами.
 */
export function Opornye45Spisok({ zadanie, navyki }: { zadanie: Zadanie45; navyki: Navyk45[] }) {
  /* Подписи с функциями — здесь, в браузере: с сервера их не передать. */
  const labels = tekstyOpornyh45('').spisok;
  const progress = prepStore(zadanie).useProgress();
  return (
    <OpornyeSpisok
      navyki={navyki.map((navyk) => ({
        ...navyk,
        bloki: navyk.bloki.map(({ zadachi, ...blok }) => ({
          ...blok,
          znakHtml: '',
          vsego: zadachi.length,
          resheno: prepResheno(progress, zadachi),
        })),
      }))}
      labels={labels}
    />
  );
}
