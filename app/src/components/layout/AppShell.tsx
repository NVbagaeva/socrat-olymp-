import Image from 'next/image';
import { BottomNavigation, HandNote, Sidebar, Topbar, type NavItem } from '@/components/ui';
import {
  appNavMorePage,
  appNavPrimary,
  bottomNavActive,
  notificationsPage,
  sidebarExtras,
  topNav,
} from '@/content/appNav';
import { tasks, tasksPage } from '@/content/tasks';
import { demoUser } from '@/data/demo';

export interface AppShellProps {
  /** id раздела кабинета, который отмечается текущим в шапке. */
  active?: string;
  /** Поиск в шапке. false — у страницы свой, второго поля не нужно. */
  search?: boolean;
  children: React.ReactNode;
}

function withActive(items: NavItem[], active: string | undefined): NavItem[] {
  return items.map((item) => (item.id === active ? { ...item, active: true } : item));
}

/* Список заданий в сайдбаре целиком считается из конфига: номера,
   названия и статус берутся оттуда же, откуда карточки банка.
   Текущий пункт здесь не отмечается: сайдбар сам сверяет адрес
   пункта с открытым маршрутом, и странице сообщать об этом нечего. */
function taskItems(): NavItem[] {
  return tasks.map((task) => ({
    id: task.slug,
    no: task.no,
    label: task.name,
    /* Столбец узкий: длинные названия показываются короткой формой
       из конфига. Не задана — остаётся полная. */
    ...(task.shortTitle !== undefined ? { short: task.shortTitle } : {}),
    href: `${tasksPage.href}/${task.slug}`,
    disabled: task.status !== 'active',
  }));
}

/**
 * Оболочка кабинета: слева список заданий, сверху разделы, ниже
 * содержимое страницы.
 *
 * Одна на все страницы кабинета, поэтому меню не повторяется в
 * каждой из них. Ниже 768px сайдбар прячется и его место занимает
 * нижняя панель — пункты у неё те же, что в шапке.
 */
export function AppShell({ active, search = true, children }: AppShellProps) {
  const bottomItems = withActive(
    [...appNavPrimary, appNavMorePage],
    bottomNavActive(active),
  );

  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        caption={{ title: 'Задания ЕГЭ', subtitle: 'Профильная математика' }}
        label="Задания ЕГЭ"
        items={taskItems()}
        secondaryItems={withActive(sidebarExtras, active)}
        footer={
          /* Декор подвала: горы во всю ширину столбца, поверх них
             рукописная подпись. Картинка — фон, поэтому alt пустой. */
          <div className="sidebar__decor">
            <Image
              className="sidebar__mountains"
              src="/images/mountains-network.webp"
              alt=""
              width={900}
              height={329}
            />
            <HandNote className="sidebar__note">Математика делает сложное понятным.</HandNote>
          </div>
        }
      />

      <div className="app-col">
        <Topbar
          nav={withActive(topNav, active)}
          search={search}
          searchPlaceholder="Поиск по заданиям, темам, формулам…"
          notificationsHref={notificationsPage.href}
          user={demoUser}
        />
        {children}
      </div>

      <BottomNavigation className="bnav--shell" items={bottomItems} />
    </div>
  );
}
