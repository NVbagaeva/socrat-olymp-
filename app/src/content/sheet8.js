/* content/sheet8.js — слова печатного варианта «Задание 8.
   Вычисления и преобразования».

   Здесь и только здесь лежат тексты листа: шапка, название, подвал.
   Шаблон листа (lib/sheet/) своих слов не содержит, движок
   вычислений отдаёт только условия и разборы задач.
*/

/** Шапка листа — та же, что у сборников №4 и №12. */
export const head = {
  course: 'Профильная математика',
  author: 'Багаева Н.В.',
  motto: 'Больше, чем подготовка',
};

/** Блок названия. Даты на листе нет намеренно — она в подзаголовке. */
export const title = {
  chip: 'Задание 8',
  text: 'Вычисления и преобразования',
  subtitle: 'Задания для отработки',
};

/** Строка компактной шапки следующих страниц. */
export const runner = 'Задание 8 · Вычисления и преобразования';

/** Подвал — тот же, что у сборников №4 и №12. */
export const foot = {
  course: 'Профильная математика',
  social: [
    { icon: 'telegram', label: 't.me/budet_na_ege_math', href: 'https://t.me/budet_na_ege_math' },
    { icon: 'youtube', label: 'youtube.com/@math_princess', href: 'https://youtube.com/@math_princess' },
  ],
  rights: 'Материалы платформы "Будет на ЕГЭ". Авторские материалы Багаевой Н.В. ' +
    'Распространение без разрешения автора запрещено.',
};

/**
 * Одиннадцать навыков сборника по порядку S1…S11. Используется
 * сборкой PDF (этап 5); интерактивный генератор строит блоки сам
 * из выбора на экране.
 */
export const blocks = [
  { set: 'S1', title: 'Свойства степеней', note: '' },
  { set: 'S2', title: 'Свойства корней', note: '' },
  { set: 'S3', title: 'Сумма и разность логарифмов', note: '' },
  { set: 'S4', title: 'Новое основание логарифма', note: '' },
  { set: 'S5', title: 'Синус и косинус по четверти', note: '' },
  { set: 'S6', title: 'Тангенс и двойной угол', note: '' },
  { set: 'S7', title: 'Табличные значения', note: '' },
  { set: 'S8', title: 'Формулы двойного угла', note: '' },
  { set: 'S9', title: 'Формулы приведения', note: '' },
  { set: 'S10', title: 'Буквенные: дроби и степени', note: '' },
  { set: 'S11', title: 'Буквенные: корни и логарифмы', note: '' },
];

/** Названия файлов сборника — заполняются на этапе 5. */
export const files = {
  uchenik: 'zadanie-8-vychisleniya-uchenik',
  uchenikChb: 'zadanie-8-vychisleniya-uchenik-chb',
  uchitel: 'zadanie-8-vychisleniya-uchitel',
  uchitelChb: 'zadanie-8-vychisleniya-uchitel-chb',
};

const content = { head, title, runner, foot, blocks, files };

export default content;
