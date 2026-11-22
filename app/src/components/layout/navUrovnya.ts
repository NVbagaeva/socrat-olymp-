import type { NavItem } from '@/components/ui';
import { levelInfo, type Level } from '@/lib/level';

/**
 * Меню кабинета уровня. «Задания» знают оба адреса: на странице без
 * своего уровня (статистика, настройки) пункт ведёт в банк запомненного
 * уровня. На страницах базы в банк и сборщик базы ведут и остальные
 * раскладки меню — нижняя панель берёт пункты отсюда же (AppShell,
 * SaytPanel).
 */
export function levelNav(items: NavItem[], level: Level): NavItem[] {
  const base = levelInfo('base');
  return items.map((item) => {
    if (item.id === 'tasks') {
      return { ...item, href: level === 'base' ? base.bank : item.href, hrefBase: base.bank };
    }
    if (item.id === 'variant' && level === 'base') return { ...item, href: base.variant };
    if (item.id === 'home' && level === 'base') return { ...item, href: base.home };
    return item;
  });
}

export function withActive(items: NavItem[], active: string | undefined): NavItem[] {
  return items.map((item) => (item.id === active ? { ...item, active: true } : item));
}
