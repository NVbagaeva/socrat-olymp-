'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AUTH_UI } from '@/content/auth-ui';
import { site } from '@/content/site';
import { AUTH_HREF } from '@/lib/auth/config';
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
    return (
      <>
        <Link
          className={clsx('btn btn--ghost btn--sm auth-widget__login', className)}
          href={AUTH_HREF.voyti}
        >
          {AUTH_UI.login}
        </Link>
        {variant === 'site' ? (
          <Link className="btn btn--primary btn--sm" href={AUTH_HREF.registraciya}>
            {site.headerActions.signup.label}
          </Link>
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
