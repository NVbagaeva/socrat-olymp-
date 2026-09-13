import { BottomNavigation, Sidebar, type NavItem } from '@/components/ui';
import {
  appNav,
  appNavMorePage,
  appNavPrimary,
  appNavSecondary,
  bottomNavActive,
} from '@/content/appNav';

export interface AppShellProps {
  /** id пункта меню, который отмечается текущим. */
  active?: string;
  children: React.ReactNode;
}

function withActive(items: NavItem[], active: string | undefined): NavItem[] {
  return items.map((item) => (item.id === active ? { ...item, active: true } : item));
}

/**
 * Оболочка раздела приложения: сайдбар слева, содержимое справа.
 *
 * Та же обвязка, что у списка заданий, — поэтому она здесь одна на все
 * страницы раздела, а не скопирована в каждую.
 *
 * Ниже 768px сайдбар скрывается и его место занимает нижняя панель:
 * пункты у обеих одни и те же, разная только раскладка.
 */
export function AppShell({ active, children }: AppShellProps) {
  const bottomItems = withActive(
    [...appNavPrimary, appNavMorePage],
    bottomNavActive(active),
  );

  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        items={withActive(appNav, active)}
        secondaryItems={withActive(appNavSecondary, active)}
      />
      {children}
      <BottomNavigation className="bnav--shell" items={bottomItems} />
    </div>
  );
}
