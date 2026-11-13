'use client';

/**
 * Раскладка кабинета с картой: слева меню кабинета (как в макете), справа
 * содержимое. На телефоне меню прячется в верхнюю полоску: бренд, кружок
 * аккаунта и кнопка «Меню», карта занимает весь экран.
 *
 * Пункты, которых на сайте ещё нет («Статистика», «Мои заметки»,
 * «Избранное»), не показываются — пустых страниц не делаем.
 */

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useId, useState, type ReactNode } from 'react';
import { NavIcon, type NavIconName } from '@/components/ui/NavIcons';
import { site } from '@/content/site';
import { tasksPage } from '@/content/tasks';
import { VARIANT_HREF } from '@/content/variant';
import { AUTH_HREF } from '@/lib/auth/config';
import { initialsOf, useSessionUser } from '@/lib/auth/session';
import { href, ZADANIYA } from '@/lib/paths';
import './kabinet-raskladka.css';

export const KARTA_HREF = '/karta/';
export const SKHEMY_HREF = href(ZADANIYA, '18', 'skhemy');

interface Punkt {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
}

const PUNKTY: readonly Punkt[] = [
  { id: 'kabinet', label: 'Личный кабинет', href: AUTH_HREF.kabinet, icon: 'home' },
  { id: 'karta', label: 'Карта ЕГЭ', href: KARTA_HREF, icon: 'compass' },
  { id: 'zadaniya', label: 'Банк заданий', href: tasksPage.href, icon: 'tasks' },
  { id: 'varianty', label: 'Варианты', href: VARIANT_HREF, icon: 'variant' },
];

const SKHEMY = {
  title: 'Ключевые схемы ЕГЭ',
  text: 'Все формулы и идеи в одном месте',
  aria: 'Ключевые схемы ЕГЭ: открыть',
};

function tekushchiy(pathname: string | null, p: Punkt): boolean {
  if (pathname === null) return false;
  const chist = pathname.replace(/\/+$/, '');
  return chist === p.href.replace(/\/+$/, '');
}

export function KabinetRaskladka({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useSessionUser();
  const [otkryto, setOtkryto] = useState(false);
  const menuId = useId();

  const spisok = (
    <ul className="kab-menu__spisok">
      {PUNKTY.map((p) => (
        <li key={p.id}>
          <Link
            className={clsx('kab-menu__punkt', tekushchiy(pathname, p) && 'is-tekushchiy')}
            href={p.href}
            aria-current={tekushchiy(pathname, p) ? 'page' : undefined}
            onClick={() => setOtkryto(false)}
          >
            <NavIcon name={p.icon} />
            <span>{p.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  const akkaunt =
    user === null ? (
      <Link className="kab-menu__voyti" href={AUTH_HREF.voyti}>
        Войти
      </Link>
    ) : (
      <Link
        className="kab-menu__akkaunt"
        href={AUTH_HREF.kabinet}
        aria-label={`Аккаунт: ${user.name || user.email}`}
      >
        <span className="kab-menu__krug" aria-hidden="true">
          {initialsOf(user)}
        </span>
      </Link>
    );

  return (
    <div className={clsx('kab', otkryto && 'kab--menu-otkryto')}>
      <aside className="kab-menu" aria-label="Меню кабинета">
        <div className="kab-menu__shapka">
          <Link className="kab-menu__brend" href="/">
            <i aria-hidden="true" />
            {site.brand}
          </Link>
          <div className="kab-menu__dlya-telefona">
            {akkaunt}
            <button
              type="button"
              className="kab-menu__knopka"
              aria-expanded={otkryto}
              aria-controls={menuId}
              aria-label={otkryto ? 'Закрыть меню' : 'Меню'}
              onClick={() => setOtkryto((v) => !v)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {otkryto ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        <nav className="kab-menu__nav" id={menuId}>
          {spisok}
          <Link className="kab-skhemy stk-glass" href={SKHEMY_HREF} aria-label={SKHEMY.aria}>
            <span className="kab-skhemy__kartinka" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <defs>
                  <linearGradient id="kab-skhemy-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#dbeafe" />
                    <stop offset="1" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <path d="M32 8 L54 46 L10 46 Z" fill="url(#kab-skhemy-grad)" opacity="0.9" />
                <path
                  d="M32 8 L32 46 M32 8 L10 46 M32 8 L54 46"
                  stroke="#fff"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <path d="M10 46 L54 46" stroke="#1f5fd0" strokeWidth="2" />
              </svg>
            </span>
            <span className="kab-skhemy__tekst">
              <b>{SKHEMY.title}</b>
              <span>{SKHEMY.text}</span>
            </span>
            <span className="kab-skhemy__strelka" aria-hidden="true">
              →
            </span>
          </Link>
        </nav>
        <div className="kab-menu__niz">{akkaunt}</div>
      </aside>
      <div className="kab-telo">{children}</div>
    </div>
  );
}
