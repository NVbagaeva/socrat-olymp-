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

import { METODY } from './metody';
import { OPORNYE } from './opornye';

/**
 * Значки вкладок. Здесь только имя: сам рисунок подставляет
 * components/tasks/VkladkaIkonka — значки лежат в разных файлах
 * (набор навигации, значки подготовки, книга теории), и конфигу
 * незачем про это знать.
 */
export type VkladkaIcon =
  | 'sheet'
  | 'book'
  | 'bulb'
  | 'target'
  | 'dumbbell'
  | 'settings'
  | 'tasks'
  | 'stats'
  | 'materials'
  | 'zachyot'
  | 'compass';

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
 * Вкладки подтемы задания №12. Раньше список лежал внутри TopicTabs.
 *
 * Хвостов у них нет: лента подтемы переключает содержимое на месте,
 * а те две вкладки, у которых свой адрес есть (опорные задачи и
 * тренажёр), получают его отдельным свойством — адрес зависит от
 * подтемы, и здесь его не записать.
 */
export const VKLADKI_PODTEMY: readonly RazdelTab[] = [
  { id: 'about', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'theory', label: 'Теория', tail: '', icon: 'book' },
  /* Вкладка есть не у всякой подтемы: без методов в конфиге лента её
     не показывает. Подпись и значок те же, что у №4 и №5. */
  { id: 'methods', label: METODY.title, tail: '', icon: 'bulb' },
  { id: 'prep', label: OPORNYE.title, tail: '', icon: 'target' },
  { id: 'trainer', label: 'Тренажёр', tail: '', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: '', icon: 'settings' },
];

/**
 * Вкладки страницы-заглушки неоткрытого задания (№14–20). Разделов
 * ещё нет, поэтому хвостов у вкладок нет: все ведут на саму заглушку,
 * активна «О задании». Когда раздел откроется, у вкладок появятся
 * хвосты, как у №2.
 */
export const VKLADKI_ZAGLUSHKI: readonly RazdelTab[] = [
  { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'teoriya', label: 'Теория', tail: '', icon: 'book' },
  { id: 'opornye', label: OPORNYE.title, tail: '', icon: 'target' },
  { id: 'trenazher', label: 'Тренажёр', tail: '', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: '', icon: 'settings' },
  { id: 'repetitory', label: 'Для репетиторов', tail: '', icon: 'materials' },
];

/**
 * Вкладки задания №12 — та же лента, что у №9–11. Тренажёр, генератор
 * и зачётная работа — по всем типам функций; отдельный тип выбирается
 * на «О задании» и открывает свою подтему. Зачётной работы у других
 * разделов нет, поэтому она стоит последней.
 */
export const VKLADKI_12: readonly RazdelTab[] = [
  { id: 'o-zadanii', label: 'О задании', tail: '', icon: 'sheet' },
  { id: 'trenazher', label: 'Тренажёр', tail: 'trenazher/', icon: 'dumbbell' },
  { id: 'generator', label: 'Генератор', tail: 'generator/', icon: 'settings' },
  { id: 'zachyot', label: 'Зачётная работа', tail: 'zachyot/', icon: 'zachyot' },
];
