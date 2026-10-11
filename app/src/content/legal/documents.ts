/**
 * Правовые документы сайта: адрес, заголовок, короткое имя для ссылок.
 * Сами тексты — в соседних .md, слово в слово из утверждённого файла
 * (docs/legal/ishodnik-dokumenty-pd.md); проверка — pnpm test:legal.
 */

export type LegalDocId = 'politika' | 'soglasie' | 'soglashenie';

export interface LegalDoc {
  id: LegalDocId;
  href: string;
  title: string;
  /** Подпись ссылки в подвале и в кабинете. */
  linkLabel: string;
  description: string;
}

export const legalDocs: Record<LegalDocId, LegalDoc> = {
  politika: {
    id: 'politika',
    href: '/politika/',
    title: 'Политика в отношении обработки персональных данных',
    linkLabel: 'Политика конфиденциальности',
    description:
      'Какие персональные данные обрабатывает сайт «Будет на ЕГЭ», зачем, как долго хранит и как их удалить.',
  },
  soglasie: {
    id: 'soglasie',
    href: '/soglasie/',
    title: 'Согласие на обработку персональных данных',
    linkLabel: 'Согласие на обработку персональных данных',
    description:
      'Текст согласия на обработку персональных данных: для совершеннолетнего пользователя и для родителя ученика младше 18 лет.',
  },
  soglashenie: {
    id: 'soglashenie',
    href: '/soglashenie/',
    title: 'Пользовательское соглашение',
    linkLabel: 'Пользовательское соглашение',
    description:
      'Условия использования сайта «Будет на ЕГЭ»: регистрация, аккаунт, материалы сайта.',
  },
};

/** Якоря вариантов на странице согласия. */
export const soglasieAnchors = {
  vzroslyy: 'variant-a',
  roditel: 'variant-b',
} as const;

export const legalPageText = {
  edition: 'Редакция от',
  toc: 'Содержание',
  otherDocs: 'Другие документы',
  draft:
    'Черновик: в src/content/legal/operator.json не заполнены ФИО, почта или дата редакции. На сайт такая версия не попадёт — сборка остановится.',
};
