/**
 * Вкладки разделов.
 *
 * Тип общий на все задания: лента у них одна (components/tasks/RazdelTabs),
 * и отличаются разделы только этим списком. Сами списки лежат рядом
 * с остальными текстами раздела — в veroyatnost.ts, vychisleniya.ts
 * и ниже в этом файле для тех разделов, у которых своего файла текстов
 * нет.
 *
 * Значок берётся по имени из набора NavIcon: своих значков у вкладок
 * нет, и заводить их по одному на раздел незачем.
 */

import { OPORNYE } from './opornye';

/**
 * Значки вкладок. Здесь только имя: сам рисунок подставляет
 * components/tasks/VkladkaIkonka — значки лежат в разных файлах
 * (набор навигации, значки подготовки, книга теории), и конфигу
 * незачем про это знать.
 */
export type VkladkaIcon =
  'sheet' | 'book' | 'bulb' | 'target' | 'dumbbell' | 'settings' | 'tasks' | 'stats' | 'materials';

/**
 * Хвост адреса страницы материалов для репетитора. Заход по нему
 * открывает первую вкладку с раскрытым меню материалов.
 */
export const TUTORS_TAIL = 'dlya-repetitorov/';

export interface RazdelTab {
  /** Идентификатор вкладки: по нему лента понимает, какая активна. */
  id: string;
  label: string;
  /**
   * Хвост адреса после адреса раздела. Пустая строка — вкладка живёт
   * на самом адресе раздела.
   */
  tail: string;
  /** Значок перед подписью. Не задан — вкладка остаётся текстовой. */
  icon?: VkladkaIcon;
}

/**
 * Вкладки страницы фигуры задания №3: теория живёт на самом адресе
 * раздела, остальные — в подпапках. Раньше список лежал внутри
 * компонента ленты; перенесён сюда, чтобы все разделы описывались
 * одинаково.
 */
export const VKLADKI_FIGURY: readonly RazdelTab[] = [
  { id: 'teoriya', label: 'Теория', tail: '', icon: 'book' },
  { id: 'opornye', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
];

/**
 * Вкладки подтемы задания №12. Раньше список лежал внутри TopicTabs.
 */
export const VKLADKI_PODTEMY: readonly RazdelTab[] = [
  { id: 'about', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'theory', label: 'Теория', tail: 'teoriya/', icon: 'book' },
  { id: 'prep', label: OPORNYE.title, tail: OPORNYE.tail, icon: 'target' },
  { id: 'trainer', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
];

/**
 * Вкладки оглавления задания №12. Здесь вкладки переключают
 * содержимое на одной странице, а не ведут на свои адреса, поэтому
 * хвоста у них нет — только идентификатор, подпись и значок.
 */
export const VKLADKI_OGLAVLENIYA: readonly RazdelTab[] = [
  { id: 'subtopics', label: 'Подтемы', tail: '', icon: 'tasks' },
  { id: 'about', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'prototypes', label: 'Прототипы', tail: '', icon: 'target' },
  { id: 'stats', label: 'Статистика', tail: '', icon: 'stats' },
  { id: 'materials', label: 'Материалы', tail: '', icon: 'materials' },
];
