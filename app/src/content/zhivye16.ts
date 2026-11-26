/**
 * Тексты живой сцены «Как гасится кредит» (теория №16, экономическая
 * задача, глава «Две схемы кредита»): components/zhivye/kredit16.
 * Формулы — в $…$; ключи svg* и aria* — обычный текст.
 */

import type { TekstyUpravleniya } from '@/components/zhivye/Elementy';

export const KREDIT16 = {
  nad: 'Посмотри, как это работает',
  zag: 'Как гасится кредит',
  lead: 'Каждый год долг сначала растёт на $r\\%$, потом платёж срезает с него кусок: проценты (оранжевое) и часть самого долга (синее). Кусок уезжает в столбик платежей своего года.',
  alt: 'Слева столбик долга: он растёт на 10 % и уменьшается на платёж; справа по годам столбики платежей, у каждого снизу часть долга, сверху проценты.',
  zagruzka: 'Сцена загружается…',
  upravlenie: {
    zapustit: 'Запустить',
    prodolzhit: 'Продолжить',
    pauza: 'Пауза',
    snachala: 'Сначала',
    eshche: 'Ещё раз',
    skorostPokaza: 'Скорость показа',
    klaviatura: 'Пробел — пуск и пауза, стрелки — на год вперёд и назад.',
  } satisfies TekstyUpravleniya,
  shema: 'Схема',
  dif: 'Дифференцированная',
  ann: 'Аннуитетная',
  ariaVremya: 'Время, годы',
  puzyr: (god: number, chto: string) => `год ${god}: ${chto}`,
  puzyrStart: 'выдан кредит',
  puzyrNachislenie: 'начисляем проценты',
  puzyrPlatezh: 'платёж',
  puzyrKonec: 'долг погашен',
  /** Единицы и условие схемы. */
  usloviya: {
    dif: {
      edinica: 'млн ₽',
      tex: '$S=8$ млн ₽, $r=10\\%$, $4$ года; долг каждый год уменьшается на одну и ту же величину $\\dfrac{S}{4}=2$.',
    },
    ann: {
      edinica: 'тыс. ₽',
      tex: '$S=4641$ тыс. ₽, $r=10\\%$, $4$ года; все четыре платежа равны.',
    },
  },
  svgDolg: 'долг',
  svgPlatezhi: 'платежи по годам',
  svgGod: (n: number) => `${n}-й год`,
  status: {
    start: (usl: string) => `${usl} Запусти — посмотрим, из чего состоит каждый платёж.`,
    nachislenie: (god: number, dolg: string, p: string) =>
      `Год ${god}: на долг $${dolg}$ начисляются $10\\%$ — это $${p}$.`,
    god: (god: number, platezh: string, p: string, o: string, ostatok: string) =>
      `Год ${god}: платёж $${platezh}=${p}+${o}$ — проценты и часть долга. Осталось $${ostatok}$.`,
    konecDif: (vsego: string, pereplata: string) =>
      `Долг убывал равными ступеньками, поэтому проценты и платежи с каждым годом меньше. Всего выплачено $${vsego}$, переплата $${pereplata}$ млн ₽.`,
    konecAnn: (vsego: string, pereplata: string) =>
      `Платежи равны, но внутри них проценты тают, а часть долга растёт (в $1{,}1$ раза каждый год). Всего $${vsego}$, переплата $${pereplata}$ тыс. ₽.`,
  },
};
