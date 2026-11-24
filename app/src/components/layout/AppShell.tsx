import Image from 'next/image';
import { BottomNavigation, HandNote, Sidebar, type NavGroup, type NavItem } from '@/components/ui';
import {
  appNavMorePage,
  appNavPrimary,
  bottomNavActive,
  notificationsPage,
  notificationsReady,
  sidebarExtras,
} from '@/content/appNav';
import { taskHasPage, taskHref, taskParts, tasksOf, type ExamTask } from '@/content/tasks';
import { LevelSwitch } from '@/components/level/LevelSwitch';
import { levelInfo, type Level } from '@/lib/level';

import { assetUrl } from '@/lib/assetUrl';
import { NavIcon } from '@/components/ui/NavIcons';
import { SiteHeader } from './SiteHeader';
import { levelNav, withActive } from './navUrovnya';
export interface AppShellProps {
  /** id раздела кабинета, который отмечается текущим в шапке. */
  active?: string;
  /**
   * Уровень экзамена: чьи задания в сайдбаре и куда ведут «Задания» и
   * «Собрать вариант». Не задан — профиль; страницы /baza/… передают 'base'.
   */
  level?: Level;
  children: React.ReactNode;
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

/* Список по частям экзамена: «ЧАСТЬ 1» с её номерами, разделитель,
   «ЧАСТЬ 2» (номера и части — content/struktura.js). */
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

/**
 * Оболочка кабинета: слева список заданий, сверху разделы, ниже
 * содержимое страницы.
 *
 * Одна на все страницы кабинета, поэтому меню не повторяется в
 * каждой из них. Ниже 768px сайдбар прячется и его место занимает
 * нижняя панель — пункты у неё те же, что в шапке.
 */
export function AppShell({ active, level = 'profile', children }: AppShellProps) {
  const bottomItems = withActive(
    levelNav([...appNavPrimary, appNavMorePage], level),
    bottomNavActive(active),
  );
  const tasks = tasksOf(level);
  return (
    <div className="shell shell--responsive app-shell">
      <Sidebar
        brand="Будет на ЕГЭ"
        /* Уровень экзамена — сразу после логотипа. В узкой полосе
           сайдбара (до 1024px) он уходит в верхнюю панель: там меню
           разделов уже спрятано и место есть (components/level/level.css). */
        afterBrand={<LevelSwitch className="sidebar__level" />}
        caption={{ title: 'Задания ЕГЭ', subtitle: levelInfo(level).name }}
        label="Задания ЕГЭ"
        items={tasks.map(taskItem)}
        groups={taskGroups(level)}
        secondaryItems={sidebarExtras.length > 0 ? withActive(sidebarExtras, active) : undefined}
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
        {/* Шапка — та же, что у страниц сайта: одно верхнее меню на весь
            сайт (VerhneeMenu). Логотип и «Профиль / База» на компьютере —
            в сайдбаре, на телефоне — в шапке. */}
        <SiteHeader
          kabinet
          current={active}
          level={level}
          bell={
            notificationsReady ? (
              <a className="bell" href={notificationsPage.href} aria-label="Уведомления">
                <NavIcon name="notifications" />
              </a>
            ) : null
          }
        />
        {children}
      </div>

      <BottomNavigation className="bnav--shell" items={bottomItems} />
    </div>
  );
}
