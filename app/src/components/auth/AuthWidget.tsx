'use client';

import dynamic from 'next/dynamic';
import { KnopkaStart } from './KnopkaStart';

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
        loading: () => (
          <span aria-hidden="true" style={{ display: 'inline-block', minWidth: '5.5rem' }} />
        ),
      })
    : null;

/**
 * Блок аккаунта в шапке: «Войти», а после входа — кружок с инициалами
 * и меню «Мой кабинет», «Выйти». SDK здесь не грузится: сессия читается
 * из хранилища (lib/auth/session.ts), SDK подтягивается только для
 * выхода и для записи комплектов репетитора.
 *
 * Вход выключен — в публичной шапке только «Начать бесплатно» (от
 * 768px; на телефоне она на первом экране главной).
 */
export function AuthWidget({ variant, className }: AuthWidgetProps) {
  if (LiveWidget === null) {
    return variant === 'site' ? <KnopkaStart /> : null;
  }
  return <LiveWidget variant={variant} className={className} />;
}
