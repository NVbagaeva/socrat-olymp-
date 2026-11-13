'use client';

/**
 * Раскладка кабинета с картой: шапка и подвал сайта (вход, кружок
 * аккаунта и меню телефона — там), под шапкой слева меню кабинета (как в
 * макете), справа содержимое. На телефоне меню — полоска вкладок над
 * картой, карта занимает экран.
 *
 * Пункты, которых на сайте ещё нет («Статистика», «Мои заметки»,
 * «Избранное»), не показываются — пустых страниц не делаем.
 */

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { NavIcon, type NavIconName } from '@/components/ui/NavIcons';
import { tasksPage } from '@/content/tasks';
import { VARIANT_HREF } from '@/content/variant';
import { AUTH_HREF } from '@/lib/auth/config';
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
  return (
    <>
      <SiteHeader />
      <div className="kab">
        <aside className="kab-menu" aria-label="Меню кабинета">
          <nav className="kab-menu__nav">
            <ul className="kab-menu__spisok">
              {PUNKTY.map((p) => (
                <li key={p.id}>
                  <Link
                    className={clsx('kab-menu__punkt', tekushchiy(pathname, p) && 'is-tekushchiy')}
                    href={p.href}
                    aria-current={tekushchiy(pathname, p) ? 'page' : undefined}
                  >
                    <NavIcon name={p.icon} />
                    <span>{p.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
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
        </aside>
        <div className="kab-telo">{children}</div>
      </div>
      <SiteFooter />
    </>
  );
}
