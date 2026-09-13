import { Sidebar, type NavItem } from '@/components/ui';
import { appNav, appNavSecondary } from '@/content/appNav';

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
 */
export function AppShell({ active, children }: AppShellProps) {
  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        items={withActive(appNav, active)}
        secondaryItems={withActive(appNavSecondary, active)}
      />
      {children}
    </div>
  );
}
