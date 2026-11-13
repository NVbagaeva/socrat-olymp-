/**
 * Тексты ДЗ из трёх источников: конструктор, черновик, кнопки в
 * разделах, решение ДЗ учеником, результаты (docs/kabinet-dz-istochniki.md).
 * Ученику — на «ты», репетитору — на «вы», как во всём кабинете.
 */

import { plural } from '@/lib/plural';
import type { Istochnik } from '@/lib/dz/types';

export const ISTOCHNIK: Record<Istochnik, string> = {
  kartochki: 'Карточки',
  opornye: 'Опорная',
  trenazher: 'Тренажёр',
};

export const ISTOCHNIK_VKLADKA: Record<Istochnik, string> = {
  kartochki: 'Карточки',
  opornye: 'Опорные задачи',
  trenazher: 'Тренажёр',
};

const zadach = (n: number) => `${n} ${plural(n, 'задача', 'задачи', 'задач')}`;
const naborov = (n: number) => `${n} ${plural(n, 'набор', 'набора', 'наборов')} карточек`;
const kartochek = (n: number) => `${n} ${plural(n, 'карточка', 'карточки', 'карточек')}`;

export const DZK = {
  zadach,
  naborov,
  kartochek,

  /* ── Кнопка в разделе и плашка черновика ── */
  knopka: {
    dobavit: 'В домашнее задание',
    dobavleno: 'В черновике ДЗ',
    aria: (chto: string) => `Добавить в домашнее задание: ${chto}`,
  },
  plashka: {
    text: (n: number) => `В черновике ДЗ: ${n}`,
    otkryt: 'Открыть',
    aria: 'Черновик домашнего задания',
  },

  /* ── Конструктор ── */
  title: 'Выдать домашнее задание',
  lead: 'Соберите задание из карточек, опорных задач и тренажёра — можно из разных разделов.',
  razdel: 'Раздел',
  zagruzka: 'Загружаем раздел…',
  oshibkaZagruzki: 'Не получилось загрузить раздел. Проверьте интернет.',
  povtorit: 'Повторить',

  schet: (z: number, n: number, minut: number) =>
    [z > 0 ? zadach(z) : null, n > 0 ? naborov(n) : null, `≈ ${minut} ${plural(minut, 'минута', 'минуты', 'минут')}`]
      .filter((x) => x !== null)
      .join(' · '),

  kartochki: {
    nabor: 'Весь набор',
    vybrat: 'Выбрать карточки',
    skryt: 'Свернуть',
    netKartochek: 'В этом разделе нет карточек.',
    predprosmotr: 'Посмотреть',
    oborot: 'Оборот',
    sProverkoy: 'с проверкой',
    dobavitVybrannye: (n: number) => `Добавить ${kartochek(n)}`,
  },
  opornye: {
    blok: 'Весь блок',
    vybrat: 'Выбрать задачи',
    dobavitVybrannye: (n: number) => `Добавить ${zadach(n)}`,
    analogi: 'При выдаче — аналог с новыми числами.',
    sama: 'При выдаче — эта же задача.',
  },
  trenazher: {
    tip: 'Тип',
    gruppa: 'Вся группа',
    skolko: 'Сколько задач',
    dobavit: 'Добавить',
    konkretnye: 'Конкретные задачи',
    predprosmotr: 'Пример задачи',
    eshchePrimer: 'Другой пример',
    vzyatEtu: 'Добавить эту задачу',
    zagruzkaPrimera: 'Собираем пример…',
  },

  sostav: {
    title: 'Состав ДЗ',
    pusto: 'Пока пусто. Добавьте карточки, опорные задачи или задачи тренажёра.',
    ubrat: 'Убрать',
    vverh: 'Выше',
    vniz: 'Ниже',
    peretashchit: 'Перетащите, чтобы поменять порядок',
    kazhdomu: 'Каждому свои',
    odinNabor: 'Один набор на всех',
    skolko: 'Сколько',
    ochistit: 'Очистить',
    ochistitVopros: 'Очистить черновик?',
    ochistitText: 'Все пункты и настройки черновика будут удалены.',
    razvernut: 'Показать состав',
    svernut: 'Свернуть состав',
    vsehKartochek: 'весь набор',
    vsegoBloka: 'весь блок',
  },

  nastroyki: {
    title: 'Настройки',
    nazvanie: 'Название',
    kommentariy: 'Комментарий ученикам',
    kommentariyPlaceholder: 'Например: сначала карточки, потом задачи',
    bezPodskazok: 'Без подсказок',
    bezPodskazokLead: 'Выключает пошаговые подсказки, «Запомни» и пример. Решение после ответа — по настройке ниже.',
    zapomni: 'Показывать «Запомни»',
    primer: 'Показывать разобранный пример',
  },

  shablony: {
    sohranit: 'Сохранить как шаблон',
    nazvanie: 'Название шаблона',
    sohraneno: 'Шаблон сохранён.',
    izShablona: 'Выдать из шаблона',
    pusto: 'Шаблонов пока нет.',
    vzyat: 'Взять',
    udalit: 'Удалить',
    vzyatVopros: 'Заменить черновик шаблоном?',
    vzyatText: 'Пункты черновика заменятся пунктами шаблона.',
    lead: 'В шаблоне — состав и настройки. Задачи тренажёра при каждой выдаче — новые.',
  },

  vydat: 'Выдать',
  vydaem: 'Собираем задачи…',
  predel: (n: number) => `${n} из 60 на ученика — уберите лишнее.`,
  vydano: 'Задание выдано',
  vydanoText: (n: number) => `Ученики увидят его в кабинете и в разделах: ${n} ${plural(n, 'ученик', 'ученика', 'учеников')}.`,
  kRezultatam: 'К результатам',
  eshche: 'Собрать ещё одно',

  oshibki: {
    title: 'Работа над ошибками',
    lead: 'Каждому ученику — новое по тому, где он ошибся: аналоги задач тренажёра и опорных, набор карточек с ошибками и «Повторить».',
    sobiraem: 'Смотрим ошибки…',
    netOshibok: 'Ошибок нет — выдавать нечего.',
    komu: (n: number) => `Получат ${n} ${plural(n, 'ученик', 'ученика', 'учеников')}`,
  },

  /* ── Ученик ── */
  uchenik: {
    plashka: (due: string | null, sdelano: number, vsego: number) =>
      `Домашнее задание${due === null ? '' : ` до ${due}`} · сделано ${sdelano} из ${vsego}`,
    otkryt: 'Открыть',
    punkty: 'Пункты задания',
    status: {
      ne: 'Не начато',
      nachato: 'Начато',
      gotovo: 'Готово',
    } as const,
    kartochki: {
      progress: (n: number, vsego: number) => `${n} из ${vsego}`,
      znayu: 'Знаю',
      povtorit: 'Повторить',
      gotovo: 'Все карточки пройдены',
      eshcheRaz: 'Пройти ещё раз',
    },
    sdat: 'Сдать',
    sdatVopros: 'Сдать задание?',
    sdatText: (sdelano: number, vsego: number, verno: number) =>
      `Сделано ${sdelano} из ${vsego}, верно ${verno}. После сдачи ответы изменить нельзя.`,
    sdano: 'Задание сдано',
    tolkoProsmotr: 'Срок прошёл — задание можно только посмотреть.',
    dalshe: 'Следующий пункт',
    nazad: 'Предыдущий пункт',
    zapomni: 'Запомни',
    primer: 'Разобранный пример',
    otvet: 'Ответ',
    vybor: 'Выбери вариант',
    popytki: (n: number) => `Осталось ${n} ${plural(n, 'попытка', 'попытки', 'попыток')}`,
    reshenieOtkroetsya: 'Решение откроется после сдачи.',
    reshenieOtkroetsyaSrok: 'Решение откроется после срока.',
    pokazatReshenie: 'Показать решение',
  },

  /* ── Результаты ── */
  rezultaty: {
    title: 'Результаты',
    uchenik: 'Ученик',
    nichego: 'не делал',
    verno: 'верно',
    neverno: 'неверно',
    znayu: (n: number) => `Знаю ${n}`,
    povtorit: (n: number) => `Повторить ${n}`,
    popytok: (n: number) => `${n} ${plural(n, 'попытка', 'попытки', 'попыток')}`,
    svodka: 'Сводка по типам и навыкам',
    oshiblis: (n: number, iz: number) => `ошиблись ${n} из ${iz}`,
    vydatOshibki: 'Выдать работу над ошибками',
    chtoVvel: 'Что вводил ученик',
    otvetVernyy: 'Верный ответ',
    zakryt: 'Закрыть',
    pechatUchenik: 'Лист ученика',
    pechatUchitel: 'Лист учителя',
  },
} as const;
