/** Слова настройки «Место для решения» (components/tasks/space/SpaceOption.tsx). */
export const SPACE_TEXT = {
  title: 'Место для решения',
  modes: [
    { id: 'none', label: 'Нет' },
    { id: 'blank', label: 'Пустое место' },
    { id: 'grid', label: 'В клетку' },
  ],
  size: 'Размер',
  sizes: [
    { id: 'S', label: 'Маленький' },
    { id: 'M', label: 'Средний' },
    { id: 'L', label: 'Большой' },
    { id: 'auto', label: 'Авто' },
  ],
  sizeNote: 'Примерно 5, 9 и 14 строк клеток. «Авто» — по длине решения учителя: от 5 до 14 строк.',
  note: 'Поле — на листе ученика, под условием и рисунком; строка «Ответ» — после него. На задачи не влияет.',
  perTitle: 'Настроить по заданиям',
  perNote: 'Свой размер для номера или «без места».',
  perLabel: (n: number) => `№ ${n}`,
  perSame: 'Как у всех',
  perNone: 'Без места',
} as const;
