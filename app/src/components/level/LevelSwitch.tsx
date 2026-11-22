'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentPropsWithoutRef } from 'react';
import { LEVELS, levelInfo, levelTwin, type Level } from '@/lib/level';
import { useLevel } from '@/lib/levelStore';
import './level.css';

/**
 * Переключатель «Профиль | База» в шапке — на всех страницах.
 *
 * Сегменты — ссылки: уровень живёт в адресе (/baza/…), поэтому работают
 * «назад» и открытие в новой вкладке. Со страницы банка переключатель
 * ведёт в банк другого уровня, со сборщика варианта — в сборщик,
 * с остальных — на главную уровня (lib/level.ts, levelTwin).
 */
export function LevelSwitch({ className }: { className?: string }) {
  const level = useLevel();
  const pathname = usePathname();
  return (
    <nav className={clsx('level-switch', className)} aria-label="Уровень экзамена">
      {LEVELS.map((id) => (
        <Link
          key={id}
          href={levelTwin(pathname, id)}
          className={clsx('level-switch__seg', id === level && 'is-active')}
          aria-current={id === level ? 'true' : undefined}
        >
          {levelInfo(id).label}
        </Link>
      ))}
    </nav>
  );
}

export interface LevelLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  /** Адрес для каждого уровня. */
  hrefs: Readonly<Record<Level, string>>;
  /** Обычная ссылка <a>, а не Link: там, где меню собрано из <a>. */
  plain?: boolean;
}

/**
 * Ссылка, адрес которой зависит от уровня: «Банк заданий» в режиме базы
 * ведёт на /baza/zadaniya/. В готовом HTML — адрес уровня страницы; на
 * страницах без своего уровня после загрузки подставляется запомненный.
 */
export function LevelLink({ hrefs, plain = false, children, ...rest }: LevelLinkProps) {
  const level = useLevel();
  if (plain) {
    return (
      <a href={hrefs[level]} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={hrefs[level]} {...rest}>
      {children}
    </Link>
  );
}
