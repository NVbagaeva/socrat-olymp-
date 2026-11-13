/**
 * Подписи тренажёра по банку задач (components/tasks/trening/bank) —
 * общие для разделов №7, №6 и следующих. Раздел задаёт номер задания,
 * сколько у него групп и как называются источники задач; остальное
 * одинаково. Обращение к ученику — на «ты» (docs/razdel-pravila.md, п. 4).
 */

import { vremya } from './vychisleniya8/trenazher';

export function tipov(n: number): string {
  const d = n % 10;
  const s = n % 100;
  return `${n} ${d === 1 && s !== 11 ? 'тип' : d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'типа' : 'типов'}`;
}

export function zadach(n: number): string {
  const d = n % 10;
  const s = n % 100;
  return `${n} ${d === 1 && s !== 11 ? 'задача' : d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'задачи' : 'задач'}`;
}

export function tekstyTrenazheraBanka({
  nomer,
  grupp,
  istochniki,
}: {
  /** Номер задания: «7». */
  nomer: number;
  /** «пяти»: «10 задач из всех пяти групп». */
  grupp: string;
  /** Подписи источника задач в выборе тем. */
  istochniki: { vse: string; fipi: string; new: string };
}) {
  return {
    title: 'Тренажёр',
    rezhimy: {
      title: 'Как потренируемся',
      mix: {
        zag: 'Все типы вперемешку',
        lead: (n: number) => `${zadach(n)} из всех ${grupp} групп — как на экзамене`,
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
      itog: (n: number, vsegoTipov: number, skolko: number | null, taymer: boolean) =>
        `${n === vsegoTipov ? 'Все типы' : tipov(n)} · ${skolko === null ? 'без конца' : zadach(skolko)} · ${taymer ? 'с таймером' : 'без таймера'}`,
      pusto: 'Выбери хотя бы один тип',
      /* Источник задач: переключатель в выборе тем. */
      istochnik: 'Какие задачи',
      istochniki,
      istochnikPusto: 'В выбранных типах таких задач нет — смени источник или добавь типы.',
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
      verno: 'Верно!',
      vernoLead: (sek: number | null) =>
        sek === null ? 'Идём дальше.' : `Решено за ${vremya(sek)}.`,
      neverno: 'Пока не так',
      nevernoLead: 'Посмотри подсказку или решение — и попробуй ещё раз.',
      sRazborom: 'Решено с разбором',
      sRazboromLead: 'В прогресс как верная не пойдёт — но тип засчитан как пройденный.',
      shagi: 'Решение по шагам',
      bezPodskazok: 'Режим без подсказок: решение откроется в итогах.',
      iz: 'из',
      zagruzka: 'Открываем задачу…',
      oshibkaZagruzki: 'Задача не открылась. Проверь интернет и попробуй ещё раз.',
      povtorit: 'Попробовать ещё раз',
      /* Подсказки о записи ответа: попытка не тратится. */
      /* Подсказка идёт простым текстом под полем ответа — без формул. */
      piPodskazka: 'В ответе должно быть число без π: например, 0,5, а не π/6.',
      nevernoDrob:
        'Ответ не сошёлся. И ещё: в бланк ЕГЭ записывают десятичную дробь, а не обыкновенную.',
      zakladka: (tip: string) => `№${nomer} · тренажёр, ${tip}`,
      voprosy: {
        title: 'Подсказка — вопросами',
        verno: 'Верно.',
        podumayte: 'Подумай ещё.',
        varianty: 'Варианты ответа',
        gotovo: 'Все вопросы пройдены — теперь запиши ответ.',
      },
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
      poTipam: 'По группам',
      prosel: 'Просел',
      rabota: (n: number) => `Работа над ошибками · ${n}`,
      rabotaLead: 'Новые задачи тех же типов, а не те же самые.',
      eshcheRaz: 'Ещё раз',
      kVyboru: 'К выбору тем',
      zadachi: 'Задачи',
      razbor: 'Решение',
      skrytRazbor: 'Скрыть решение',
      otmetki: { right: 'Верно', wrong: 'Неверно', hinted: 'С разбором', skipped: 'Пропущено' },
    },
    progress: {
      title: 'Мой прогресс',
      povtorit: 'Стоит повторить',
      pusto: 'Здесь появится прогресс: сколько решено и какие группы стоит повторить.',
      schet: (resheno: number, vsego: number) => `Решено ${resheno} из ${vsego} задач банка`,
      oshibki: 'Мои ошибки',
      oshibokNet: 'Ошибок нет. Задачи с ошибкой или открытым решением появятся здесь.',
      otlozhennye: 'Отложенные',
      otlozhennyhNet: 'Ничего не отложено. Кнопка «Отложить на потом» есть у каждой задачи.',
      istoriya: 'История тренировок',
      istoriiNet: 'Завершённых тренировок пока нет.',
      sbros: 'Сбросить прогресс',
      sbrosVopros: `Сбросить прогресс по заданию №${nomer}? Счётчики и список ошибок будут удалены.`,
      otmena: 'Отмена',
    },
  };
}

/** Подписи опорных задач: список блоков и экран блока. */
export function tekstyOpornyh(lead: string) {
  return {
    title: 'Опорные задачи',
    lead,
    kListu: '← Все блоки',
    zapomni: 'Запомни.',
    gde: 'Где пригодится этот навык',
    spisok: {
      blokov: (n: number) => `${n} ${n === 1 ? 'блок' : n < 5 ? 'блока' : 'блоков'}`,
      neNachato: 'ещё не начато',
      zadach: (resheno: number, vsego: number) => `решено ${resheno} из ${vsego}`,
      gotovo: 'Готово',
    },
    zadacha: {
      zadacha: (k: number, n: number) => `Задача ${k} из ${n}`,
      nazad: 'Предыдущая задача',
      vpered: 'Следующая задача',
      otvet: 'Ответ',
      placeholder: 'Число',
      proverit: 'Проверить',
      podskazka: 'Подсказка',
      reshenie: 'Решение',
      skrytReshenie: 'Скрыть решение',
      propustit: 'Пропустить',
      sleduyushchaya: 'Следующая задача',
      verno: 'Верно!',
      vernoLead: 'Идём дальше.',
      neverno: 'Пока не так',
      nevernoLead: 'Посмотри подсказку или решение — и попробуй ещё раз.',
      shagi: 'Решение по шагам',
      zadachiBloka: 'Задачи блока',
      nomer: (k: number) => `Задача ${k}`,
    },
  };
}
