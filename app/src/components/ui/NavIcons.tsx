/**
 * Значки меню. Библиотеки иконок в проекте нет и не заводится: значки
 * рисуются теми же средствами, что уже приняты — инлайновый SVG,
 * обводка currentColor, заливки нет. Цвет и размер задаёт место
 * вставки, сам значок ни того, ни другого не выбирает.
 *
 * Поле 24×24 у всех, поэтому значки одного веса и не пляшут в ряду.
 */

export type NavIconName =
  | 'home'
  | 'tasks'
  | 'homework'
  | 'progress'
  | 'stats'
  | 'materials'
  | 'teacher'
  | 'notifications'
  | 'assignments'
  | 'settings'
  | 'favourites'
  | 'notes'
  | 'history'
  | 'more';

const PATHS: Record<NavIconName, React.ReactNode> = {
  /* Дом. */
  home: <path d="M4 10.4 12 4l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5H15V14H9v6.5H5.5A1.5 1.5 0 0 1 4 19z" />,
  /* Список заданий: строки с отметками. */
  tasks: (
    <>
      <path d="m3.5 6.5 1.6 1.6 2.6-2.9M3.5 12.6l1.6 1.6 2.6-2.9M3.5 18.7l1.6 1.6 2.6-2.9" />
      <path d="M11.5 6.7h9M11.5 12.8h9M11.5 18.9h9" />
    </>
  ),
  /* Папка домашних работ. */
  homework: <path d="M3.5 7.2a1.5 1.5 0 0 1 1.5-1.5h4l2 2.6h8a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z" />,
  /* Кривая роста со стрелкой. */
  progress: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="m4.5 16.5 5-5 3.5 3.5 7-7" />
      <path d="M15.5 8h4.5v4.5" />
    </>
  ),
  /* Столбики статистики. */
  stats: <path d="M6 20.5v-6.5M12 20.5V7M18 20.5v-9.5M3.5 20.5h17" />,
  /* Лист материалов с загнутым углом. */
  materials: (
    <>
      <path d="M6 3.5h8l4.5 4.5v12.5H6z" />
      <path d="M14 3.5V8h4.5" />
      <path d="M9 13h6M9 16.5h6" />
    </>
  ),
  /* Учитель. */
  teacher: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.5c0-3.8 3.1-6.2 7-6.2s7 2.4 7 6.2" />
    </>
  ),
  /* Колокольчик уведомлений. */
  notifications: (
    <>
      <path d="M12 3.5a5.8 5.8 0 0 0-5.8 5.8c0 3.9-1.2 5.2-1.9 6.2h15.4c-.7-1-1.9-2.3-1.9-6.2A5.8 5.8 0 0 0 12 3.5z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  /* Планшет с листом: мои задания. */
  assignments: (
    <>
      <path d="M6.5 4.5h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1z" />
      <path d="M9.5 3.2h5a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4.2a1 1 0 0 1 1-1z" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  /* Шестерёнка настроек. */
  settings: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 3.2v2.1M12 18.7v2.1M20.8 12h-2.1M5.3 12H3.2M18.2 5.8l-1.5 1.5M7.3 16.7l-1.5 1.5M18.2 18.2l-1.5-1.5M7.3 7.3 5.8 5.8" />
    </>
  ),
  /* Звезда избранного. */
  favourites: <path d="m12 3.8 2.6 5.2 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  /* Тетрадь конспектов: обложка с корешком. */
  notes: (
    <>
      <path d="M6.5 3.5h13v17h-13a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M9.5 3.5v17M12.5 9h4M12.5 13h4" />
    </>
  ),
  /* История: стрелка назад по кругу и стрелки часов. */
  history: (
    <>
      <path d="M4.2 12a7.8 7.8 0 1 0 2.4-5.6" />
      <path d="M3.8 5.5V10h4.5" />
      <path d="M12 8.2V12l2.8 1.8" />
    </>
  ),
  /* Три точки: остальные разделы. */
  more: (
    <g fill="currentColor" stroke="none">
      <circle cx="5.5" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.5" cy="12" r="1.7" />
    </g>
  ),
};

export interface NavIconProps {
  name: NavIconName;
}

/** Значок пункта меню. Размер и цвет наследуются от пункта. */
export function NavIcon({ name }: NavIconProps) {
  return (
    <svg
      className="nav-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
