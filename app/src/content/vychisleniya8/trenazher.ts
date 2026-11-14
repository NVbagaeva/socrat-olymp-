/**
 * Подписи тренажёра №8: стартовые режимы, выбор тем, экран задачи,
 * итоги. Обращение к ученику — на «вы», без технического жаргона.
 */

import { nomerRazdela } from '../struktura';

export const TRENAZHER8 = {
  title: 'Тренажёр',
  rezhimy: {
    title: 'Как потренируемся',
    mix: {
      zag: 'Все типы вперемешку',
      lead: (n: number) => `${n} задач из всех пяти групп — как на экзамене`,
    },
    temy: { zag: 'Выбрать темы', lead: 'Группы и типы, число задач, таймер' },
    oshibki: {
      zag: 'Работа над ошибками',
      lead: (n: number) =>
        n === 0
          ? 'Пока нет ошибок — появятся после тренировки'
          : `${tipov(n)}, где были ошибки, — новые задачи на них`,
    },
    otlozhennye: (n: number) => `Отложенные задачи · ${n}`,
  },
  vybor: {
    title: 'Что тренируем',
    vse: 'Выбрать все',
    nichego: 'Снять все',
    skolko: 'Сколько задач',
    bezKonca: 'Без конца',
    taymer: 'Таймер',
    sTaymerom: 'С таймером',
    bezTaymera: 'Без таймера',
    bezPodskazok: 'Без подсказок и решений',
    bezPodskazokLead: 'Как на экзамене: решение откроется только в итогах',
    nachat: 'Начать тренировку',
    nazad: 'К режимам',
    itog: (tipov: number, zadach: number | null, taymer: boolean) =>
      `${tipovSlovo(tipov)} · ${zadach === null ? 'без конца' : `${zadach} задач`} · ${taymer ? 'с таймером' : 'без таймера'}`,
    pusto: 'Выберите хотя бы один тип',
  },
  ekran: {
    otvet: 'Ответ',
    placeholder: 'Число',
    proverit: 'Проверить',
    podskazka: 'Подсказка',
    reshenie: 'Решение',
    skrytReshenie: 'Скрыть решение',
    pohozhaya: 'Похожая задача',
    dalshe: 'Дальше',
    itogi: 'К итогам',
    otlozhit: 'Отложить на потом',
    otlozheno: 'Отложено',
    verno: 'Верно!',
    vernoLead: (sek: number | null) =>
      sek === null ? 'Идём дальше.' : `Решено за ${vremya(sek)}.`,
    neverno: 'Пока не так',
    nevernoLead: 'Посмотрите подсказку или решение — и попробуйте ещё раз.',
    nevernoDrob:
      'Ответ не сошёлся. И ещё: в бланк ЕГЭ записывают десятичную дробь, а не обыкновенную.',
    sRazborom: 'Решено с разбором',
    sRazboromLead: 'В прогресс как верная не пойдёт — но тип засчитан как пройденный.',
    shagi: 'Решение по шагам',
    bezPodskazok: 'Режим без подсказок: решение откроется в итогах.',
    iz: 'из',
    reshenoShtuk: 'решено',
  },
  itogi: {
    title: (dolya: number) =>
      dolya >= 0.9
        ? 'Отличная тренировка'
        : dolya >= 0.6
          ? 'Хорошая тренировка'
          : 'Есть над чем поработать',
    lead: (sek: number, srednee: number | null, sRazborom: number) =>
      [
        `время ${vremya(sek)}`,
        srednee === null ? null : `в среднем ${vremya(srednee)} на задачу`,
        sRazborom === 0 ? null : `${sRazborom} с разбором`,
      ]
        .filter((s): s is string => s !== null)
        .join(' · '),
    poTipam: 'По типам',
    prosel: 'Просел',
    rabota: (n: number) => `Работа над ошибками · ${n}`,
    rabotaLead: 'Новые задачи тех же типов, а не те же самые.',
    eshcheRaz: 'Ещё раз',
    kVyboru: 'К выбору тем',
    zadachi: 'Задачи',
    razbor: 'Разбор',
    skrytRazbor: 'Скрыть разбор',
    otmetki: { right: 'Верно', wrong: 'Неверно', hinted: 'С разбором', skipped: 'Пропущено' },
  },
  progress: {
    title: 'Мой прогресс',
    povtorit: 'Стоит повторить',
    pusto: 'Здесь появится прогресс: сколько решено и какие группы стоит повторить.',
    oshibki: 'Мои ошибки',
    oshibokNet: 'Ошибок нет. Задачи с ошибкой или открытым решением появятся здесь.',
    otlozhennye: 'Отложенные',
    otlozhennyhNet: 'Ничего не отложено. Кнопка «Отложить на потом» есть у каждой задачи.',
    istoriya: 'История тренировок',
    istoriiNet: 'Завершённых тренировок пока нет.',
    sbros: 'Сбросить прогресс',
    sbrosVopros: `Сбросить прогресс по заданию №${nomerRazdela('vychisleniya')}? Счётчики и список ошибок будут удалены.`,
  },
};

function tipov(n: number): string {
  return `${n} ${n === 1 ? 'тип' : n < 5 ? 'типа' : 'типов'}`;
}

function tipovSlovo(n: number): string {
  if (n === 26) {
    return 'Все типы';
  }
  return tipov(n);
}

/** «0:48», «12:05». */
export function vremya(sek: number): string {
  const whole = Math.max(0, Math.round(sek));
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
