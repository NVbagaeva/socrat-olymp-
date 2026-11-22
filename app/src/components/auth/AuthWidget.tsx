'use client';

import dynamic from 'next/dynamic';
import { AUTH_IN_HEADER } from '@/lib/auth/config';
import { StartButton } from './StartButton';

export interface AuthWidgetProps {
  /**
   * site — шапка публичных страниц: рядом с входом стоит «Начать
   * бесплатно». app — шапка оболочки заданий: только вход или кружок.
   */
  variant: 'site' | 'app';
  className?: string;
}

/* Живой блок (AuthLive.tsx) — отдельным куском и только при включённом
   входе: AUTH_ON подставляется при сборке (next.config.ts), и при
   выключенном входе ветка с import() выбрасывается вместе с кодом сессии,
   как SDK в lib/auth/client.ts. На сервере блок не рисуется — сессия
   живёт в хранилище браузера; место под «Войти» держит заглушка. */
const LiveWidget =
  process.env.AUTH_ON === '1'
    ? dynamic(() => import('./AuthLive').then((m) => m.LiveWidget), {
        ssr: false,
        /* Пока кусок грузится — пустое место под «Войти». Класс нужен
           шапке оболочки на телефоне (auth-widget.css): она сразу
           раскладывается так, как будет со входом, и колокольчик не
           мелькает. Без кнопки в шапке места не держим: гостю там
           ничего не покажут. */
        loading: () =>
          AUTH_IN_HEADER ? <span className="auth-widget__wait" aria-hidden="true" /> : null,
      })
    : null;

/**
 * Блок аккаунта в шапке: «Войти», а после входа — кружок с инициалами
 * и меню «Мой кабинет», «Выйти». SDK здесь не грузится: сессия читается
 * из хранилища (lib/auth/session.ts), SDK подтягивается только для
 * выхода и для записи комплектов репетитора.
 *
 * Вход выключен — блок пустой (в публичной шапке на компьютере
 * остаётся одна кнопка «Начать бесплатно»).
 */
export function AuthWidget({ variant, className }: AuthWidgetProps) {
  if (LiveWidget === null) {
    return variant === 'site' ? <StartButton /> : null;
  }
  return <LiveWidget variant={variant} className={className} />;
}
