import { clsx } from 'clsx';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AuthWidget } from '@/components/auth/AuthWidget';
import { LevelSwitch } from '@/components/level/LevelSwitch';
import { site } from '@/content/site';
import type { Level } from '@/lib/level';
import { SiteMenu } from './SiteMenu';
import { idPoAdresu, VerhneeMenu } from './VerhneeMenu';

export interface ShapkaProps {
  /** Текущий пункт меню по адресу страницы (href из site.nav). */
  currentHref?: string;
  /** Текущий пункт меню по id (так отмечает раздел оболочка кабинета). */
  current?: string | undefined;
  /**
   * Шапка оболочки кабинета (AppShell): на компьютере логотип и
   * «Профиль / База» стоят в сайдбаре.
   */
  kabinet?: boolean;
  level?: Level;
  /** Колокольчик уведомлений — между аккаунтом и бургером. */
  bell?: ReactNode;
  className?: string;
}

/**
 * Шапка без нижней панели — её берёт оболочка кабинета (AppShell). Без
 * импорта SaytPanel: клиентский модуль, импортированный серверным, Next.js
 * кладёт в скрипты страницы, даже когда он не рисуется, — панель сайта и
 * её данные попадали бы в первую загрузку страниц заданий
 * (scripts/check-first-load.mjs).
 *
 * Шапка — одна на весь сайт: публичные страницы и кабинет. Слева знак с
 * названием и «Профиль / База» (в кабинете на компьютере — в сайдбаре),
 * дальше верхнее меню (VerhneeMenu), справа аккаунт, колокольчик и
 * бургер. Телефон (до 768px): знак (до 400px — без названия),
 * «Профиль / База», аккаунт и бургер. Вид и правила — site.css,
 * verh-menu.css.
 */
export function Shapka({
  currentHref,
  current,
  kabinet = false,
  level,
  bell,
  className,
}: ShapkaProps) {
  return (
    <header className={clsx('site-head', kabinet && 'site-head--kabinet', className)}>
      <div className="site-head__in">
        <Link className="logo" href="/">
          <i aria-hidden="true" />
          <span className="logo__name">{site.brand}</span>
        </Link>

        <LevelSwitch className="site-head__level" />

        <VerhneeMenu
          current={current ?? idPoAdresu(currentHref)}
          {...(level === undefined ? {} : { level })}
        />

        <div className="site-head__cta">
          {/* «Войти» или кружок аккаунта и «Начать бесплатно» (её на
            телефоне нет). Вход выключен — остаётся одна «Начать
            бесплатно». */}
          <AuthWidget variant="site" />
          {bell}
          <SiteMenu />
        </div>
      </div>
    </header>
  );
}
