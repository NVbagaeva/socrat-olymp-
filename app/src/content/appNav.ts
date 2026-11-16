/**
 * Навигация кабинета. Один источник пунктов на все раскладки:
 * верхнее меню на широком экране, нижняя панель на мобильном и
 * экран «Ещё» берут свои пункты отсюда, а не заводят свои списки.
 *
 * Список заданий в сайдбаре сюда не входит: он целиком считается
 * из tasks.ts.
 */

import type { NavItem } from '@/components/ui';
import { HOWTO_HREF } from '@/content/howto';
import { tasksPage } from '@/content/tasks';
import { EZH_HREF } from '@/content/ezhemesyachnye';
import { POV_HREF } from '@/content/povyshennye';
import { href, USTNYY } from '@/lib/paths';
import { VARIANT_HREF } from '@/content/variant';

/* Разделы кабинета. Прежние пункты сайдбара разложены по ним так:
   «Прогресс» и «Статистика» → «Статистика», «Материалы» →
   «Мои материалы», «Учитель» и «Домашние работы» → «Для учителя»,
   «Уведомления» → колокольчик в шапке. */
const vseRazdely: NavItem[] = [
  { id: 'home', label: 'Главная', href: '/', icon: 'home' },
  /* В нижней панели пункт называется полным именем страницы —
     «Банк заданий»: он ведёт на список всех заданий, а не в раздел. */
  { id: 'tasks', label: 'Задания', panel: 'Банк заданий', href: tasksPage.href, icon: 'tasks' },
  /* Устный счёт — общий для профиля и базы (lib/paths.ts, USTNYY). В
     нижнюю панель не входит: попадает на экран «Ещё». */
  /* Устный счёт — общий для профиля и базы (lib/paths.ts, USTNYY).
     Выделен тёплым акцентом и стоит в нижней панели среди главных. */
  {
    id: 'ustnyy',
    label: 'Устный счёт',
    short: 'Счёт',
    href: href(USTNYY),
    icon: 'schet',
    akcent: true,
  },
  /* Генератор варианта из всех заданий первой части (/variant/). */
  {
    id: 'variant',
    label: 'Собрать вариант',
    short: 'Вариант',
    href: VARIANT_HREF,
    icon: 'variant',
  },
  /* 36 вариантов × 6 версий: решать онлайн и печатать (/povyshennye/). */
  {
    id: 'povyshennye',
    label: 'Варианты повышенной сложности',
    short: 'Повышенные',
    href: POV_HREF,
    icon: 'povyshennye',
  },
  /* 4 варианта по месяцам (октябрь 2026 — январь 2027): решать и печатать. */
  {
    id: 'ezhemesyachnye',
    label: 'Ежемесячные варианты',
    short: 'Ежемесячные',
    href: EZH_HREF,
    icon: 'ezhemesyachnye',
  },
  { id: 'stats', label: 'Статистика', href: '/statistika/', icon: 'stats' },
  /* Короткая подпись — для нижней панели и экрана «Ещё»: полное
     название в ячейку шириной в четверть экрана не помещается. */
  {
    id: 'materials',
    label: 'Мои материалы',
    short: 'Материалы',
    href: '/moi-materialy/',
    icon: 'materials',
  },
  {
    id: 'teacher',
    label: 'Для учителя',
    short: 'Учитель',
    href: '/dlya-uchitelya/',
    icon: 'teacher',
  },
  /* Инструкция и тур. В нижнюю панель не входит — живёт на экране «Ещё». */
  {
    id: 'help',
    label: 'Как пользоваться',
    short: 'Инструкция',
    href: HOWTO_HREF,
    icon: 'help',
  },
];

/**
 * Разделы, которых ещё нет: их страницы — заглушки «Раздел в разработке»
 * (components/layout/StubPage.tsx). В меню, нижнюю панель, экран «Ещё»,
 * сайдбар и колокольчик они не попадают — ни одна кнопка навигации не
 * ведёт в тупик (docs/design-audit.md, п. 13.1). Страницы по прямому
 * адресу остаются. Раздел готов — убрать его id отсюда, и он вернётся
 * на своё место во всех раскладках.
 */
const NE_GOTOVY = new Set([
  'stats',
  'materials',
  'teacher',
  'notifications',
  'my-tasks',
  'favourites',
  'history',
  'settings',
]);

const gotovye = (items: NavItem[]): NavItem[] => items.filter((item) => !NE_GOTOVY.has(item.id));

/** Верхнее меню кабинета: только готовые разделы. */
export const topNav: NavItem[] = gotovye(vseRazdely);

/** Уведомления живут за колокольчиком, в списке меню их нет. */
export const notificationsPage: NavItem = {
  id: 'notifications',
  label: 'Уведомления',
  href: '/uvedomleniya/',
  icon: 'notifications',
};

/** Личные разделы под списком заданий в сайдбаре. */
const lichnye: NavItem[] = [
  { id: 'my-tasks', label: 'Мои задания', href: '/moi-zadaniya/', icon: 'assignments' },
  { id: 'favourites', label: 'Избранное', href: '/izbrannoe/', icon: 'favourites' },
  { id: 'history', label: 'История решений', href: '/istoriya-resheniy/', icon: 'history' },
  { id: 'settings', label: 'Настройки', href: '/nastroyki/', icon: 'settings' },
];

/** Готовые личные разделы; пусто — блока в сайдбаре нет. */
export const sidebarExtras: NavItem[] = gotovye(lichnye);

/** Колокольчик в шапке — только когда страница уведомлений готова. */
export const notificationsReady = !NE_GOTOVY.has(notificationsPage.id);

/* «Мои конспекты» из этого списка убраны по макету. Маршрут
   /moi-konspekty остался: страница есть, ссылки в меню нет. */

/* ── Мобильная панель ─────────────────────────────────────────────
   Пунктов помещается пять: четыре раздела из верхнего меню и вход в
   остальные. «Устный счёт» — среди главных и выделен акцентом; пока
   статистики нет, четвёртая ячейка — «Вариант». Здесь перечислены
   только идентификаторы — названия и адреса те же, что наверху. */

const PRIMARY_IDS = ['home', 'tasks', 'ustnyy', 'variant'];

/** Экран со списком разделов, не поместившихся в панель. */
export const appNavMorePage: NavItem = {
  id: 'more',
  label: 'Ещё',
  href: '/eshche/',
  icon: 'more',
};

/** Главные пункты панели — в порядке PRIMARY_IDS. */
export const appNavPrimary: NavItem[] = PRIMARY_IDS.flatMap((id) => {
  const item = topNav.find((candidate) => candidate.id === id);
  return item !== undefined ? [item] : [];
});

/** Экран «Ещё»: всё, что не попало в панель. Считается, не задаётся. */
export const appNavMore: NavItem[] = gotovye([
  ...topNav.filter((item) => !PRIMARY_IDS.includes(item.id)),
  notificationsPage,
]);

/** id пункта панели, который подсвечивается на странице раздела active. */
export function bottomNavActive(active: string | undefined): string | undefined {
  if (active === undefined) {
    return undefined;
  }
  /* Разделы с экрана «Ещё» подсвечивают сам вход в него: своей ячейки
     в панели у них нет. */
  return PRIMARY_IDS.includes(active) ? active : appNavMorePage.id;
}
