/**
 * Тексты экрана «Карточки» — проверки теории по карточкам. Один набор
 * на все номера: номер и название подставляются из колоды.
 */

import { plural } from '@/lib/plural';
import type { Rezhim } from '@/lib/kartochki/leitner';
import type { TipKartochki } from '@/lib/kartochki/tipy';
import type { RazdelTab } from './vkladki';

/** Вкладка в ленте раздела: встаёт после «Теории» сама, если у номера есть колода. */
export const VKLADKA_KARTOCHKI: RazdelTab = {
  id: 'kartochki',
  label: 'Карточки',
  tail: 'kartochki/',
  icon: 'cards',
};

const kartochek = (n: number) => `${n} ${plural(n, 'карточка', 'карточки', 'карточек')}`;

export const KARTOCHKI_UI = {
  title: 'Проверка теории по карточкам',
  lead: 'Честно отмечайте «Знаю» или «Не знаю». Незнакомые карточки будут возвращаться чаще, выученные — реже.',
  vyucheno: (task: number, n: number, vsego: number) => `Теория №${task}: выучено ${n} из ${vsego}`,
  vyuchenoKorotko: (n: number, vsego: number) => `${n} из ${vsego}`,
  /** Подсказка к счётчику: что значит «выучено». */
  vyuchenoPoyasnenie:
    'Выучена — карточка, которую вы знали в нескольких сессиях подряд (5-я коробка).',
  kartochek,

  rezhimTitle: 'Что проверяем',
  rezhimy: {
    vse: { title: 'Вся теория номера', lead: 'Все карточки, сначала те, что вы знаете хуже.' },
    temy: { title: 'По подтемам', lead: 'Отметьте подтемы, которые хотите повторить.' },
    neznakomye: {
      title: 'Только незнакомые',
      lead: 'Новые карточки и те, на которых было «Не знаю».',
    },
    bystro: {
      title: 'Быстрая проверка',
      lead: '10 случайных карточек со всего номера. Прогресс не меняется — удобно перед пробником.',
    },
  } satisfies Record<Rezhim, { title: string; lead: string }>,
  vybratVse: 'Выбрать все',
  snyatVse: 'Снять все',
  nachat: 'Начать',
  nechego: {
    temy: 'Отметьте хотя бы одну подтему.',
    neznakomye: 'Незнакомых карточек нет — все уже в работе. Выберите «Вся теория номера».',
  },
  prodolzhit: (ostalos: number) => `Продолжить начатую проверку · осталось ${kartochek(ostalos)}`,

  poTemamTitle: 'Прогресс по подтемам',
  sbros: 'Сбросить прогресс карточек',
  sbrosPodtverdit: 'Точно сбросить? Все карточки вернутся в начало.',
  sbrosDa: 'Да, сбросить',
  sbrosNet: 'Отмена',
  klavishi: 'Клавиши: пробел — перевернуть, ← — «Не знаю», → — «Знаю».',

  /* Сессия */
  schyot: (n: number, vsego: number) => `${n} из ${vsego}`,
  sessiyaAria: 'Пройдено карточек',
  zakonchit: 'Закончить',
  tip: {
    formula: 'Формула',
    svoystvo: 'Определение и свойство',
    chertezh: 'По чертежу',
    verno: 'Верно или неверно',
    vychislenie: 'Вычисление',
  } satisfies Record<TipKartochki, string>,
  vazhno: 'важно для ЕГЭ',
  perevernut: 'Перевернуть',
  pokazatOtvet: 'Показать ответ',
  /** Подсказка внизу лицевой стороны. */
  nazhmite: 'Нажмите на карточку, чтобы перевернуть',
  pokazatOtvetAria: 'Перевернуть карточку и показать ответ',
  naLitse: 'Вопрос',
  naOborote: 'Ответ',
  verno: 'Верно',
  neverno: 'Неверно',
  pole: 'Ваш ответ',
  polePlaceholder: 'Число',
  proverit: 'Проверить',
  pustoyOtvet: 'Введите число: целое или десятичную дробь.',
  rezultat: {
    da: 'Правильно!',
    net: 'Ошибка',
    vashOtvet: (v: string) => `Ваш ответ: ${v}`,
  },
  pochemu: 'Почему',
  povtoritTeoriyu: 'Повторить теорию',
  dobavleno: 'Этой темы пока нет во вкладке «Теория».',
  znayu: 'Знаю',
  neZnayu: 'Не знаю',
  dalshe: 'Дальше',
  svaypPodskazka: 'Свайп вправо — «Знаю», влево — «Не знаю»',

  /* Итог */
  itogTitle: 'Итог проверки',
  itogZnayu: 'Знаю',
  itogPovtorit: 'Повторить',
  itogSlabye: 'Больше всего «Не знаю»',
  itogVseZnayu: 'Ни одного «Не знаю» — отличный результат.',
  itogBystro: 'Быстрая проверка не меняет прогресс карточек.',
  povtoritNeznakomye: 'Повторить незнакомые',
  gotovo: 'Закончить',

  /* Кнопка во вкладке «Теория» */
  proveritTeoriyu: 'Проверить теорию',
  proveritTeoriyuLead: 'Карточки по этой теории: формулы, свойства, чертежи.',
} as const;
