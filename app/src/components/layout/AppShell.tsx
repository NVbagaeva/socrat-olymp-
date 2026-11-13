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
import { taskHasPage, taskHref, taskParts, tasksOf, type ExamTask } from '@/content/tasks';
import { LevelSwitch } from '@/components/level/LevelSwitch';
import { levelInfo, type Level } from '@/lib/level';
import { AuthWidget } from '@/components/auth/AuthWidget';

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
  /**
   * Уровень экзамена: чьи задания в сайдбаре и куда ведут «Задания» и
   * «Собрать вариант». Не задан — профиль; страницы /baza/… передают 'base'.
   */
  level?: Level;
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
function taskGroups(level: Level): NavGroup[] {
  const tasks = tasksOf(level);
  return taskParts
    .map((part) => ({
      /* В базе частей нет: одна группа с номерами заданий. */
      label: level === 'base' ? `Задания ${levelInfo(level).range}` : part.title,
      items: tasks.filter((task) => task.part === part.part).map(taskItem),
    }))
    .filter((group) => group.items.length > 0);
}

/* Меню кабинета уровня. «Задания» знают оба адреса: на странице без
   своего уровня (статистика, настройки) пункт ведёт в банк запомненного
   уровня. На страницах базы в банк и сборщик базы ведут и остальные
   раскладки меню — нижняя панель берёт пункты отсюда же. */
function levelNav(items: NavItem[], level: Level): NavItem[] {
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

/**
 * Оболочка кабинета: слева список заданий, сверху разделы, ниже
 * содержимое страницы.
 *
 * Одна на все страницы кабинета, поэтому меню не повторяется в
 * каждой из них. Ниже 768px сайдбар прячется и его место занимает
 * нижняя панель — пункты у неё те же, что в шапке.
 */
export function AppShell({ active, search = false, level = 'profile', children }: AppShellProps) {
  const bottomItems = withActive(
    levelNav([...appNavPrimary, appNavMorePage], level),
    bottomNavActive(active),
  );
  const tasks = tasksOf(level);

  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        caption={{ title: 'Задания ЕГЭ', subtitle: levelInfo(level).name }}
        label="Задания ЕГЭ"
        items={tasks.map(taskItem)}
        groups={taskGroups(level)}
        secondaryItems={withActive(sidebarExtras, active)}
        footer={
          /* Декор подвала: горы во всю ширину столбца, поверх них
             рукописная подпись. Картинка — фон, поэтому alt пустой.
             Подвал приезжает из серверной оболочки в клиентский Sidebar
             и встаёт там в ряд детей подвала — нужен явный ключ, иначе
             React в разработке пишет «unique key». */
          <div key="decor" className="sidebar__decor">
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
          lead={<LevelSwitch className="topbar__level" />}
          nav={withActive(levelNav(topNav, level), active)}
          search={search}
          searchPlaceholder="Поиск по заданиям, темам, формулам…"
          notificationsHref={notificationsPage.href}
          /* Аккаунт — настоящий: «Войти» или кружок с инициалами.
             Выдуманного пользователя в шапке больше нет. */
          userSlot={<AuthWidget variant="app" />}
        />
        {children}
      </div>

      <BottomNavigation className="bnav--shell" items={bottomItems} />
    </div>
  );
}
