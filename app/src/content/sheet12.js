/* content/sheet12.js — слова печатного сборника «Задание 12.
   Линейная функция».

   Здесь и только здесь лежат тексты листа: шапка, название, пункты
   «Повторяем», заголовки блоков, подвал. Шаблон листа (lib/sheet/)
   своих слов не содержит, а движок графиков отдаёт только условия
   задач — значит, придумать текст мимо этого файла нельзя.

   Порядок блоков и их заголовки утверждены автором. Соответствие
   блока набору движка — единственное место, где сборник знает про
   устройство банка.
*/

/** Шапка листа. */
export const head = {
  course: 'Профильная математика',
  author: 'Багаева Н.В.',
  motto: 'Больше, чем подготовка',
};

/** Блок названия. Даты на листе нет намеренно. */
export const title = {
  chip: 'Задание 12',
  text: 'Линейная функция',
  subtitle: 'Задания для отработки',
};

/** Строка компактной шапки следующих страниц. */
export const runner = 'Задание 12 · Линейная функция';

/**
 * Рамка «Повторяем:». Пункты взяты из теории задания №12
 * и утверждены автором.
 *
 * phrase — рукописная надпись на полях. Набирается шрифтом
 * --font-hand, не курсивом: курсив в проекте занят чужими
 * цитатами с автором.
 */
export const recap = {
  title: 'Повторяем:',
  items: [
    'Угловой коэффициент <span class="math" data-tex="k"><i>k</i></span>',
    'Свободный член <span class="math" data-tex="b"><i>b</i></span>',
    'Уравнение прямой по графику',
    'Принадлежность точки графику',
    'Пересечение двух прямых',
  ],
  phrase: 'ВПИШИТЕ ФРАЗУ',
};

/** Подвал. Две соцсети и ровно два адреса — других на листе нет. */
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
 * Блоки сборника по порядку.
 *
 * set — набор движка graph/, откуда приходят задачи блока.
 * note — приписка справа в полосе заголовка.
 */
export const blocks = [
  { set: 'P12-1', title: 'Угловой коэффициент <span class="math" data-tex="k"><i>k</i></span> по графику', note: 'найти наклон по двум точкам' },
  { set: 'P12-2', title: 'Свободный член <span class="math" data-tex="b"><i>b</i></span> по графику', note: 'найти, где прямая пересекает ось <span class="math" data-tex="y"><i>y</i></span>' },
  { set: 'P12-3', title: 'Уравнение прямой по графику', note: 'выбрать формулу функции' },
  { set: 'P12-4', title: 'Принадлежность точки: по графику', note: 'лежит ли точка на прямой' },
  { set: 'P12-5', title: 'Принадлежность точки: подстановкой', note: 'без чертежа, вычислением' },
  { set: '12.A', title: 'Значение функции по значению аргумента', note: 'найти <span class="math" data-tex="y"><i>y</i></span>, если известен <span class="math" data-tex="x"><i>x</i></span>' },
  { set: '12.B', title: 'Значение аргумента по значению функции', note: 'найти <span class="math" data-tex="x"><i>x</i></span>, если известен <span class="math" data-tex="y"><i>y</i></span>' },
  { set: '12.C', title: 'Абсцисса точки пересечения графиков', note: 'найти <span class="math" data-tex="x"><i>x</i></span> точки пересечения' },
  { set: '12.D', title: 'Ордината точки пересечения графиков', note: 'найти <span class="math" data-tex="y"><i>y</i></span> точки пересечения' },
];

/** Названия файлов сборника. */
export const files = {
  uchenik: 'zadanie-12-lineynaya-funkciya-uchenik',
  uchenikChb: 'zadanie-12-lineynaya-funkciya-uchenik-chb',
  uchitel: 'zadanie-12-lineynaya-funkciya-uchitel',
  uchitelChb: 'zadanie-12-lineynaya-funkciya-uchitel-chb',
};

export default { head, title, runner, recap, foot, blocks, files };
