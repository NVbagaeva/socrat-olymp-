/**
 * Общие тексты «Стеклянной сцены» заданий №4 и №5: подписи карты
 * задания, тренажёра (с режимом «Узнай метод») и опорных задач. Свои
 * тексты разделов — в content/veroyatnost4.ts и veroyatnost5.ts.
 *
 * Подписи тренажёра — общие с №7 и №6 (content/treningBanka.ts), здесь
 * только то, чем №4 и №5 отличаются: группы — это методы, источник
 * задач — сборник или новые, четвёртый режим «Узнай метод». Обращение к
 * ученику — на «ты» (docs/razdel-pravila.md, п. 4).
 */

import { tekstyOpornyh, tekstyTrenazheraBanka, tipov, zadach } from './treningBanka';

/** Подписи карты задания (components/tasks/karta), общие для №4 и №5. */
export const tekstyKarty45 = {
  opasnoTitle: 'Чем опасно',
  znatTitle: 'Что нужно знать',
  tipov,
  povtorit: 'Стоит повторить',
  neNachato: 'ещё не начато',
  resheno: (resheno: number, verno: number) => `решено ${resheno} · верно ${verno}`,
  primer: 'Разобранный пример',
  primerZhdyot: 'Открываем пример…',
  primerNet: 'Пример не открылся — обнови страницу.',
  otvet: 'Ответ',
  trenirovat: 'Потренировать этот тип',
  opornye: 'Опорные задачи',
  lovushka: 'Где теряют балл',
  metod: 'Метод',
  risunok: 'Рисунок к решению',
};

const GRUPP: Record<4 | 5, string> = { 4: 'семи', 5: 'десяти' };

/** Подписи тренажёра №4 и №5. */
export function tekstyTrenazhera45(nomer: 4 | 5) {
  const T = tekstyTrenazheraBanka({
    nomer,
    grupp: GRUPP[nomer],
    istochniki: { vse: 'Все', fipi: 'Из сборника', new: 'Новые' },
  });
  return {
    ...T,
    rezhimy: {
      ...T.rezhimy,
      mix: {
        zag: 'Все методы вперемешку',
        lead: (n: number) =>
          `${zadach(n)} из всех ${GRUPP[nomer]} методов — метод узнаёшь сам, как на экзамене`,
      },
      temy: { zag: 'Выбрать методы', lead: 'Методы и типы задач, число задач, таймер' },
      oshibki: {
        ...T.rezhimy.oshibki,
        lead: (n: number) =>
          n === 0
            ? 'Пока нет ошибок — появятся после тренировки'
            : `${tipov(n)}, где были ошибки, — новые задачи на них`,
      },
      uznay: {
        zag: 'Узнай метод',
        lead: (n: number) => `${zadach(n)}: только условие — назови метод, считать не нужно`,
      },
    },
    vybor: {
      ...T.vybor,
      title: 'Какие методы тренируем',
      itog: (n: number, vsegoTipov: number, skolko: number | null, taymer: boolean) =>
        `${n === vsegoTipov ? 'Все типы' : tipov(n)} · ${skolko === null ? 'без конца' : zadach(skolko)} · ${taymer ? 'с таймером' : 'без таймера'}`,
    },
    ekran: {
      ...T.ekran,
      istochnik: `Прототип задания ${nomer}`,
      zadacha: `Задание №${nomer}`,
      risunok: 'Рисунок к решению',
      metod: 'Метод',
    },
    itogi: { ...T.itogi, otvet: 'Ответ' },
    uznay: {
      metka: 'Узнай метод',
      vopros: 'Каким методом решается задача?',
      verno: 'Верно!',
      vernoLead: 'Метод узнан. Вот по каким словам это видно:',
      neverno: 'Не тот метод',
      nevernoLead: 'Посмотри, по каким словам в условии его узнают:',
      pravilnyy: 'Правильный метод:',
      priznaki: 'Признаки в условии',
      opornaya: 'Опорная задача',
      progress: 'Узнай метод: узнано верно',
      progressPusto: 'Пока ни одной задачи в режиме «Узнай метод».',
      schet: (verno: number, vsego: number) => `${verno} из ${vsego}`,
    },
  };
}

export type TekstyTrenazhera45 = ReturnType<typeof tekstyTrenazhera45>;

/** Подписи опорных задач №4 и №5: список блоков и экран блока. */
export function tekstyOpornyh45(lead: string) {
  return {
    ...tekstyOpornyh(lead),
    risunok: 'Рисунок к решению',
    voprosy: {
      title: 'Подсказка — вопросами',
      verno: 'Верно.',
      podumayte: 'Подумай ещё.',
      varianty: 'Варианты ответа',
      gotovo: 'Все вопросы пройдены — теперь запиши ответ.',
    },
  };
}
