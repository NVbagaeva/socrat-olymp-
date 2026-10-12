import Image from 'next/image';
import {
  BottomNavigation,
  HandNote,
  Sidebar,
  Topbar,
  type NavGroup,
  type NavItem,
} from '@/components/ui';
import {
  appNavMorePage,
  appNavPrimary,
  bottomNavActive,
  notificationsPage,
  sidebarExtras,
  topNav,
} from '@/content/appNav';
import { taskHasPage, taskHref, taskParts, tasks, type ExamTask } from '@/content/tasks';

import { assetUrl } from '@/lib/assetUrl';
export interface AppShellProps {
  /** id раздела кабинета, который отмечается текущим в шапке. */
  active?: string;
  /**
   * Поле поиска в шапке. По умолчанию выключено: поиск по сайту ещё не
   * подключён, а поле, которое ничего не ищет, — обещание в никуда.
   * Поиск по заданиям есть на странице банка.
   */
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
function taskItem(task: ExamTask): NavItem {
  return {
    id: task.slug,
    no: task.no,
    label: task.name,
    /* Столбец узкий: длинные названия показываются короткой формой
       из конфига. Не задана — остаётся полная. */
    ...(task.shortTitle !== undefined ? { short: task.shortTitle } : {}),
    href: taskHref(task),
    /* Неоткрытый раздел приглушён; если у него есть заглушка, пункт
       остаётся ссылкой на неё. */
    disabled: !taskHasPage(task),
    dim: task.status !== 'ready',
  };
}

/* Список по частям экзамена: «ЧАСТЬ 1», под ней 01–13, разделитель,
   «ЧАСТЬ 2» и 14–20. */
function taskGroups(): NavGroup[] {
  return taskParts.map((part) => ({
    label: part.title,
    items: tasks.filter((task) => task.part === part.part).map(taskItem),
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
export function AppShell({ active, search = false, children }: AppShellProps) {
  const bottomItems = withActive([...appNavPrimary, appNavMorePage], bottomNavActive(active));

  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        caption={{ title: 'Задания ЕГЭ', subtitle: 'Профильная математика' }}
        label="Задания ЕГЭ"
        items={tasks.map(taskItem)}
        groups={taskGroups()}
        secondaryItems={withActive(sidebarExtras, active)}
        footer={
          /* Декор подвала: горы во всю ширину столбца, поверх них
             рукописная подпись. Картинка — фон, поэтому alt пустой. */
          <div className="sidebar__decor">
            <Image
              className="sidebar__mountains"
              src={assetUrl('/images/mountains-network.webp')}
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
          /* Входа на сайте нет, поэтому и «вошедшего» пользователя в шапке
             нет. Демо-имя лежит в data/demo.ts до появления аккаунтов. */
        />
        {children}
      </div>

      <BottomNavigation className="bnav--shell" items={bottomItems} />
    </div>
  );
}
