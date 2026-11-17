'use client';

import { usePathname } from 'next/navigation';
import { BottomNavigation } from '@/components/ui';
import { appNavMorePage, appNavPrimary, bottomNavActive, topNav } from '@/content/appNav';
import { levelInfo } from '@/lib/level';
import { levelNav, withActive } from './navUrovnya';

/* Главные страницы уровней: панели на них нет — первый экран главной
   держит свои двери и кнопки, панель снизу его бы перекрывала. */
const GLAVNYE = new Set(['/', levelInfo('base').home]);

/**
 * Нижняя панель на публичных страницах (шапка SiteHeader): тарифы,
 * «Об авторе», правовые, вход. Та же, что в оболочке приложения
 * (AppShell), — пункты, порядок, вид; на телефоне и планшете она
 * везде, кроме главных. Текущий пункт — по адресу страницы: разделы
 * с экрана «Ещё» подсвечивают сам вход в него.
 */
export function SaytPanel() {
  const put = usePathname();
  if (GLAVNYE.has(put)) {
    return null;
  }
  const level = put.startsWith(levelInfo('base').home) ? 'base' : 'profile';
  const tekushchiy = topNav.find((item) => item.href === put)?.id;
  const items = withActive(
    levelNav([...appNavPrimary, appNavMorePage], level),
    bottomNavActive(tekushchiy),
  );
  return <BottomNavigation className="bnav--shell bnav--sayt" items={items} />;
}
