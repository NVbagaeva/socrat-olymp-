/**
 * Шапка и подвал печатных листов №6, №7 и №10 на общем шаблоне
 * lib/sheet (buildDocument): как у листов остальных генераторов.
 */
export const LIST_HEAD = {
  course: 'Профильная математика',
  author: 'Багаева Н.В.',
  motto: 'Больше, чем подготовка',
} as const;

export const LIST_FOOT = {
  course: 'Профильная математика',
  social: [
    { icon: 'telegram', label: 't.me/budet_na_ege_math', href: 'https://t.me/budet_na_ege_math' },
    {
      icon: 'youtube',
      label: 'youtube.com/@math_princess',
      href: 'https://youtube.com/@math_princess',
    },
  ],
  rights:
    'Материалы платформы "Будет на ЕГЭ". Авторские материалы Багаевой Н.В. ' +
    'Распространение без разрешения автора запрещено.',
} as const;

/** Подписи листа: ученика и учителя. */
export const LIST_TEXT = {
  uchenik: 'Лист ученика',
  uchitel: 'Лист учителя',
  variant: (n: number) => `Вариант ${n}`,
  otvety: 'Ответы',
  otvet: 'Ответ',
} as const;
