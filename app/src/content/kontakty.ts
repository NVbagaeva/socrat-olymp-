/**
 * Страница «Контакты»: как связаться с автором сайта. Почта и личный
 * Telegram — из реквизитов продавца (content/legal/prodavets.json),
 * ИНН и статус показываются вместе с остальными реквизитами — только с
 * флагом NEXT_PUBLIC_LEGAL_READY (lib/legal/prodavets.ts).
 */

import { prodavets, TELEGRAM_LICHNYY } from '@/lib/legal/prodavets';

export const KONTAKTY_HREF = '/kontakty/';

/** Telegram-канал сайта — тот же, что на печатных листах. */
export const TELEGRAM_KANAL = 'https://t.me/budet_na_ege_math';

export const KONTAKTY = {
  meta: {
    title: 'Контакты — Будет на ЕГЭ',
    description:
      'Как связаться с автором сайта «Будет на ЕГЭ»: Telegram и почта для вопросов о тарифах, оплате и возврате, реквизиты.',
  },
  zagolovok: 'Контакты',
  lid: 'Сайт делает один человек — учитель математики. Пишите напрямую.',
  sposoby: [
    {
      id: 'telegram',
      nazvanie: 'Telegram',
      znachenie: `@${prodavets.telegram}`,
      href: TELEGRAM_LICHNYY,
      vneshnyaya: true,
      zachem: 'Вопросы о сайте, тарифах и оплате.',
    },
    {
      id: 'pochta',
      nazvanie: 'Почта',
      znachenie: prodavets.pochta,
      href: `mailto:${prodavets.pochta}`,
      vneshnyaya: false,
      zachem:
        'Заявления о возврате денег и вопросы о персональных данных — с той почты, на которую зарегистрирован аккаунт.',
    },
    {
      id: 'kanal',
      nazvanie: 'Telegram-канал',
      znachenie: '@budet_na_ege_math',
      href: TELEGRAM_KANAL,
      vneshnyaya: true,
      zachem: 'Новости сайта и новые материалы.',
    },
  ],
  rekvizity: {
    zagolovok: 'Реквизиты',
    status: 'Статус',
    inn: 'ИНН',
  },
  operator: 'Оператор персональных данных',
  dokumenty: 'Документы',
} as const;
