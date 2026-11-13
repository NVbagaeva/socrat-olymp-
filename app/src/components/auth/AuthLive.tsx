'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AUTH_UI } from '@/content/auth-ui';
import { site } from '@/content/site';
import { AUTH_HREF, AUTH_IN_HEADER } from '@/lib/auth/config';
import { initialsOf, useSessionUser } from '@/lib/auth/session';
import type { AuthWidgetProps } from './AuthWidget';
import './auth-widget.css';

/**
 * Живой блок аккаунта: «Войти» или кружок с инициалами и меню. Отдельный
 * кусок кода: AuthWidget грузит его, только когда вход включён, — при
 * выключенном входе ни этого кода, ни чтения сессии в сборке нет, и
 * первая загрузка страниц не тяжелеет.
 */
export function LiveWidget({ variant, className }: AuthWidgetProps) {
  const user = useSessionUser();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();

  /* Вошёл — прогресс (журнал, закладки, история, тренировка) живёт и в
     аккаунте и сливается между устройствами. Код синхронизации грузится
     только сейчас. */
  const userId = user?.id ?? null;
  useEffect(() => {
    if (userId === null) return undefined;
    let stop: (() => void) | null = null;
    let cancelled = false;
    void import('@/lib/accountSync').then(({ startAccountSync }) => {
      if (!cancelled) stop = startAccountSync();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [userId]);

  /* Репетитор вошёл — его комплекты уходят и в аккаунт. */
  useEffect(() => {
    if (user === null || user.role !== 'tutor') return undefined;
    let stop: (() => void) | null = null;
    let cancelled = false;
    void import('@/lib/auth/kits').then(({ watchKits }) => {
      if (!cancelled) stop = watchKits();
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [user]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event: MouseEvent) => {
      if (root.current !== null && !root.current.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  if (user === null) {
    /* Пробный режим: вход работает, но в шапке его не видно — она
       выглядит как без входа. На /voyti/ попадают по прямой ссылке. */
    if (!AUTH_IN_HEADER) {
      return variant === 'site' ? (
        <a className="btn btn--primary btn--sm" href={site.headerActions.signup.href}>
          {site.headerActions.signup.label}
        </a>
      ) : null;
    }
    /* «Войти» — стеклянная таблетка со значком в голубом кружке: тот же
       кружок, что станет кружком с инициалами после входа. На телефоне
       и в тесной шапке оболочки остаётся один кружок, слово «Войти»
       читает скринридер (auth-widget.css).
       «Начать бесплатно» ведёт на регистрацию (content/site.ts). */
    return (
      <>
        <Link
          className={clsx('auth-login auth-widget__login', `auth-login--${variant}`, className)}
          href={AUTH_HREF.voyti}
        >
          <span className="auth-login__ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
              <circle cx="12" cy="8.5" r="3.75" />
              <path d="M5 19.5c1.3-3.4 3.9-5.25 7-5.25s5.7 1.85 7 5.25" />
            </svg>
          </span>
          <span className="auth-login__text">{AUTH_UI.login}</span>
        </Link>
        {variant === 'site' ? (
          <a className="btn btn--primary btn--sm" href={site.headerActions.signup.href}>
            {site.headerActions.signup.label}
          </a>
        ) : null}
      </>
    );
  }

  const label = user.name !== '' ? user.name : user.email;

  return (
    <div className={clsx('auth-widget', className)} ref={root}>
      <button
        type="button"
        className="auth-widget__button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${AUTH_UI.userMenu}: ${label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar avatar--sm" aria-hidden="true">
          {initialsOf(user)}
        </span>
      </button>
      {open ? (
        <div className="auth-widget__menu" id={menuId} role="menu">
          <p className="auth-widget__who">
            <span className="auth-widget__name">{label}</span>
            {user.name !== '' ? <span className="auth-widget__email">{user.email}</span> : null}
          </p>
          <Link
            className="auth-widget__item"
            role="menuitem"
            href={AUTH_HREF.kabinet}
            onClick={close}
          >
            {AUTH_UI.kabinet}
          </Link>
          <LogoutItem onDone={close} role="menuitem" />
        </div>
      ) : null}
    </div>
  );
}

/** «Выйти»: SDK грузится по нажатию, сессия отзывается на сервере. */
export function LogoutItem({
  onDone,
  className,
  role,
}: {
  onDone?: () => void;
  className?: string;
  /** menuitem — внутри меню аккаунта; в бургере роль не нужна. */
  role?: 'menuitem';
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={clsx('auth-widget__item', className)}
      role={role}
      aria-busy={busy || undefined}
      onClick={async () => {
        if (busy) return;
        setBusy(true);
        try {
          const { signOut } = await import('@/lib/auth/client');
          await signOut();
        } finally {
          setBusy(false);
          onDone?.();
        }
      }}
    >
      {AUTH_UI.logout}
    </button>
  );
}
