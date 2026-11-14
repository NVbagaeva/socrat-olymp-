/**
 * Список заданий ЕГЭ. Из него строятся плашки банка, список в сайдбаре,
 * страницы-заглушки и счётчики частей.
 *
 * Здесь — как раздел выглядит: название, статус, значки. На каком
 * номере ЕГЭ он стоит и в какой части — записано в одном месте,
 * content/struktura.js; список заданий собирается по нему. Раздел вне
 * экзамена в список не попадает, но остаётся в vseRazdely: его страницы
 * собираются.
 *
 * Раздел описывается данными, а не разметкой. Чтобы открыть новое
 * задание, достаточно поменять статус здесь — страница списка
 * и маршруты подхватят это сами.
 */

import { levelInfo, type Level } from '@/lib/level';
import { href, ZADANIYA } from '@/lib/paths';
import { bazaTasks } from './baza/tasks';
import {
  RAZDELY,
  chastRazdela,
  nomerDvumya,
  razdel,
  zadaniyaEge,
  type RazdelKod,
} from './struktura';

/**
 * ready — раздел открыт: плашка ведёт в него.
 * soon — раздела ещё нет: плашка приглушена и помечена «Скоро».
 *        Ссылки у неё нет, если не задан stub.
 */
export type TaskStatus = 'ready' | 'soon';

/** Часть экзамена: 1 — краткий ответ, 2 — развёрнутый ответ. */
export type TaskPart = 1 | 2;

/** Как раздел выглядит в банке и меню. Номера и части здесь нет. */
interface RazdelVid {
  name: string;
  /**
   * Короткое название для узких мест — списка в сайдбаре. Не задано —
   * берётся полное. На карточках банка всегда полное название.
   */
  shortTitle?: string;
  status: TaskStatus;
  /**
   * У неоткрытого задания есть страница-заглушка /zadaniya/{slug}/:
   * плашка и пункт сайдбара остаются приглушёнными, но ведут на неё.
   * Когда раздел откроется (status: 'ready'), поле не нужно.
   */
  stub?: true;
  /** Голубые бейджи на плашке: пометка о смене структуры экзамена и т. п. */
  badges?: readonly string[];
  /**
   * Иконка плашки: файл /images/task-{номер файла}.{icon} (taskIconNo).
   * Не задана — растровый webp, как у большинства заданий; svg — у
   * векторных чертежей.
   */
  icon?: 'webp' | 'svg';
  /**
   * Номер файла иконки, если он не свой: задание базы берёт картинку
   * профильного задания той же темы. null — картинки нет.
   */
  image?: string | null;
}

export interface ExamTask extends RazdelVid {
  /**
   * Код раздела: постоянное имя (content/struktura.js). Есть у заданий
   * профиля; у заданий базы своя нумерация, она не менялась.
   */
  kod?: RazdelKod;
  /**
   * Номер хранения раздела профиля: под ним раздел записан в базе, в
   * ключах прогресса, в именах файлов. Не меняется вместе со структурой
   * экзамена.
   */
  hranenie?: number;
  /**
   * Номер задания в экзамене, две цифры. У раздела профиля вне экзамена
   * — его номер хранения (nomerRazdela).
   */
  no: string;
  /** Часть адреса: /zadaniya/{slug}/. */
  slug: string;
  part: TaskPart;
  /**
   * Уровень экзамена. Не задан — профиль; у заданий базы — 'base':
   * адрес раздела тогда /baza/zadaniya/{slug}/.
   */
  level?: Level;
}

/** Задание профиля: у него всегда есть код раздела и номер хранения. */
export type ProfilTask = ExamTask & { kod: RazdelKod; hranenie: number };

export const tasksPage = {
  eyebrow: 'Банк заданий',
  title: 'Банк заданий ЕГЭ',
  lead: 'Все задания в одном месте. Выбирайте тему и переходите к изучению.',
  /* Нижний блок страницы. Диагностики в проекте нет: кнопка ведёт на
     честную заглушку, а не изображает работающий разбор. */
  start: {
    title: 'Не знаете, с чего начать?',
    lead: 'Пройдите диагностику и получите персональный план подготовки.',
    action: 'Пройти диагностику',
    href: '/diagnostika/',
  },

  /** Адрес страницы списка: шапка, нижняя панель, хлебные крошки разделов. */
  href: href(ZADANIYA),
  /* Страница-заглушка неоткрытого задания: /zadaniya/{slug}/. */
  stub: {
    crumb: 'Банк заданий ЕГЭ',
    badge: 'Скоро',
    title: 'Раздел в разработке',
    text: 'Мы готовим теорию, опорные задачи, тренажёр и генератор. Раздел скоро появится. А пока можно заниматься другими заданиями.',
    action: 'К банку заданий',
  },
} as const;

/** Тексты и адрес страницы банка уровня. У базы свои заголовок и лид. */
export function bankPageOf(level: Level) {
  if (level === 'profile') return tasksPage;
  return {
    ...tasksPage,
    title: 'Банк заданий ЕГЭ. Базовая математика',
    lead: 'Все 21 задание базового ЕГЭ в одном месте. Выбирайте задание и переходите к изучению.',
    href: levelInfo('base').bank,
  };
}

/**
 * Части экзамена: подписи переключателя и заголовков над сеткой.
 * Задания попадают в часть по полю part.
 */
export const taskParts = [
  {
    part: 1,
    title: 'Часть 1',
    caption: 'Задания с кратким ответом',
    heading: 'задания с кратким ответом',
  },
  {
    part: 2,
    title: 'Часть 2',
    caption: 'Задания с развёрнутым ответом',
    heading: 'задания с развёрнутым ответом',
  },
] as const satisfies readonly { part: TaskPart; title: string; caption: string; heading: string }[];

/** У задания есть своя страница: открытый раздел или заглушка. */
export function taskHasPage(task: ExamTask): boolean {
  return task.status === 'ready' || task.stub === true;
}

/** Начало адресов раздела задания без «/» на конце: к нему дописывают вкладку. */
export function taskBase(task: ExamTask): string {
  return `${levelInfo(task.level ?? 'profile').bankBase}/${task.slug}`;
}

/** Адрес страницы задания (ссылка): /zadaniya/4/. */
export function taskHref(task: ExamTask): string {
  return href(taskBase(task));
}

/** Все задания уровня в порядке номеров. */
export function tasksOf(level: Level): readonly ExamTask[] {
  return level === 'base' ? bazaTasks : tasks;
}

/** Задания уровня с кратким ответом: сетка на главной, счётчик «N из M». */
export function shortTasksOf(level: Level): readonly ExamTask[] {
  return tasksOf(level).filter((task) => task.part === 1);
}

/** Задания одной части в порядке номеров. */
export function tasksOfPart(part: TaskPart): ExamTask[] {
  return tasks.filter((task) => task.part === part);
}

/** «01–13»: первый и последний номер части. */
export function partRange(part: TaskPart): string {
  const list = tasksOfPart(part);
  return `${list[0]?.no ?? ''}–${list[list.length - 1]?.no ?? ''}`;
}

/**
 * Название задания по части адреса — для заголовков разделов, чтобы
 * они собирались из этого же списка, а не из своей копии строки.
 * Ищет среди всех разделов: и у раздела вне экзамена есть страницы.
 */
export function taskName(slug: string): string {
  const task = vseRazdely.find((t) => t.slug === slug);
  if (task === undefined) {
    throw new Error(`Нет задания ${slug}`);
  }
  return task.name;
}

/**
 * Номер файла иконки: «07». У раздела профиля — по номеру хранения, а не
 * по номеру ЕГЭ: номер задания может смениться, а картинка остаётся его.
 * У задания базы — указанная картинка профиля. null — картинки нет.
 */
export function taskIconNo(task: ExamTask): string | null {
  if (task.image !== undefined) return task.image;
  return task.hranenie === undefined ? task.no : String(task.hranenie).padStart(2, '0');
}

/**
 * Разделы по коду. Порядок в банке задаёт не эта таблица, а структура
 * экзамена. В комментариях «№7» — номер хранения раздела.
 */
const VID: Record<RazdelKod, RazdelVid> = {
  /* ── Задания с кратким ответом ── */

  /* Миниатюра №1 — вектор: чертёж посчитан точно, и в SVG касание
     окружностей не расплывается при любом масштабе. */
  planimetriya: { name: 'Планиметрия', status: 'ready', icon: 'svg' },
  /* Раздел открыт: шесть вкладок, генераторы 19 прототипов и банк
     для репетиторов — в lib/vektory. */
  vektory: { name: 'Векторы', status: 'ready' },
  /* Раздел собран шаблоном стереометрии вместе с №15
     (components/stereo); банк из 92 прототипов — lib/zadanie3. */
  stereometriya: { name: 'Стереометрия', status: 'ready' },
  /* Названия разделов вероятности — те же слова, что в заголовке
     страницы задания: заголовок раздела собирается из этого же
     списка (content/veroyatnost.ts), и двух имён у одной темы быть
     не должно. */
  veroyatnost: { name: 'Вероятность: простая', status: 'ready' },
  'slozhnaya-veroyatnost': { name: 'Вероятность: сложная', status: 'ready' },
  /* Раздел открыт: банк из 15 прототипов (исходные задачи и по 50
     аналогов) в lib/zadanie6, теория с «Проверь себя», опорные задачи,
     тренажёр и генератор. Вкладки «Для репетиторов» пока нет. */
  'sluchainye-velichiny': {
    name: 'Случайные величины и распределения',
    shortTitle: 'Случайные величины',
    status: 'ready',
    badges: ['структура 2027'],
  },
  /* Раздел открыт: банк из 30 прототипов в lib/zadanie7, теория с живым
     тригонометрическим кругом, тренажёр, опорные задачи и генератор. */
  uravneniya: { name: 'Уравнения', status: 'ready' },
  /* Раздел открыт: банк из 26 прототипов, тренажёр, опорные задачи,
     генератор и листы. Вкладка «Теория» пока с надписью «Материал
     готовится»: текст пишет автор отдельно. */
  vychisleniya: {
    name: 'Вычисления и преобразования',
    shortTitle: 'Вычисления',
    status: 'ready',
  },
  /* Раздел открыт: 31 прототип в lib/proizvodnaya, движок графиков
     производной, тренажёр, опорные задачи, генератор и листы. */
  proizvodnaya: {
    name: 'Производная и первообразная',
    shortTitle: 'Производная',
    status: 'ready',
  },
  /* Раздел открыт: 34 прототипа (банк ФИПИ + 20 аналогов на каждый),
     теория, опорные задачи, тренажёр, генератор и уроки — lib/zadanie10. */
  'prikladnye-zadachi': {
    name: 'Задачи с физическим смыслом',
    shortTitle: 'Физический смысл',
    status: 'ready',
  },
  'tekstovye-zadachi': { name: 'Текстовые задачи', status: 'ready' },
  'grafiki-funkciy': { name: 'Графики функций', status: 'ready' },
  ekonomika: {
    name: 'Финансовая грамотность и экономические задачи',
    shortTitle: 'Финансовая грамотность',
    status: 'ready',
    badges: ['структура 2027'],
  },
  /* Раздел ЕГЭ-2027 из 19 заданий: ни страницы, ни картинки ещё нет.
     В структуре из 20 заданий он вне экзамена и в банк не попадает. */
  'naibolshee-naimenshee': {
    name: 'Наибольшее и наименьшее значение функции',
    shortTitle: 'Наибольшее и наименьшее',
    status: 'soon',
    image: null,
  },

  /* ── Задания с развёрнутым ответом ──
     Иконки — векторные чертежи public/images/task-{номер хранения}.svg. */
  /* Раздел открыт главой «Тригонометрические уравнения»: теория,
     опорные задачи, тренажёр и генератор (lib/zadanie14). Остальные
     типы уравнений — главы «Скоро». */
  'uravnenie-s-otborom': { name: 'Уравнение', status: 'ready', icon: 'svg' },
  /* Раздел открыт каркасом вместе с №3 (components/stereo): шесть
     вкладок, главы теории с планом. Наполнение — docs/stereometry-plan.md. */
  'stereometriya-dokazatelstvo': { name: 'Стереометрия', status: 'ready', icon: 'svg' },
  /* Раздел открыт каркасом: вкладки «О задании» и «Теория», главы
     с заголовками и движок чертежей (lib/zadanie16). Содержание глав
     наполняется отдельно. */
  neravenstvo: { name: 'Неравенство', status: 'ready', icon: 'svg' },
  /* Раздела нет: плашка ведёт на заглушку /zadaniya/{slug}/. */
  optimizaciya: {
    name: 'Задача на оптимизацию',
    shortTitle: 'Оптимизация',
    status: 'soon',
    stub: true,
    icon: 'svg',
  },
  /* Раздел открыт вкладкой «Ключевые схемы» (lib/zadanie18, движок
     чертежей lib/skhemy); остальные вкладки — заглушки. */
  'planimetriya-dokazatelstvo': { name: 'Планиметрия', status: 'ready', icon: 'svg' },
  /* Раздел открыт: вводные главы и метод 1 из 14, тренажёр по
     открытым главам (content/teoriya19). Генератор — после банка. */
  parametr: {
    name: 'Задача с параметром',
    shortTitle: 'Параметр',
    status: 'ready',
    icon: 'svg',
  },
  /* Раздела нет: плашка ведёт на заглушку. */
  chisla: {
    name: 'Олимпиадная задача',
    shortTitle: 'Олимпиадная',
    status: 'soon',
    stub: true,
    icon: 'svg',
  },
};

function sobrat(kod: RazdelKod): ProfilTask {
  const { hranenie } = razdel(kod);
  return {
    ...VID[kod],
    kod,
    hranenie,
    no: nomerDvumya(kod),
    /* Адрес раздела пока по номеру хранения: /zadaniya/7/. */
    slug: String(hranenie),
    part: chastRazdela(kod),
  };
}

/**
 * Все разделы, в том числе вне экзамена и идущие внутри другого
 * раздела: по ним ищут название и адрес страницы самого раздела.
 * В банк, меню и переключатели идёт tasks.
 */
export const vseRazdely: readonly ProfilTask[] = RAZDELY.map((r) => sobrat(r.kod));

/** Задания экзамена по порядку номеров ЕГЭ: банк, меню, сайдбар. */
export const tasks: readonly ProfilTask[] = zadaniyaEge().map((z) => sobrat(z.kod));
