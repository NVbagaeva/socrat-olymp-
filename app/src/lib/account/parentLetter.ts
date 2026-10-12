/**
 * Письмо родителю ученика младше 18 лет. Текст согласия — вариант Б
 * со страницы /soglasie/ (lib/legal/documents.ts → parentConsentText),
 * ссылку подтверждения сервер создаёт сам: в ней одноразовый токен.
 */

import { legalDocs, soglasieAnchors } from '@/content/legal/documents';

export const parentLetterText = {
  subject: 'Подтвердите согласие: аккаунт ученика на «Будет на ЕГЭ»',
  intro: (childName: string) =>
    `Здравствуйте! ${childName} зарегистрировался(-ась) на сайте budetege.ru и указал(а) вашу почту как почту родителя или законного представителя. Пока вы не подтвердите согласие, прогресс в аккаунте не сохраняется.`,
  consentTitle: 'Согласие на обработку персональных данных (вариант Б)',
  action: 'Чтобы дать согласие, перейдите по ссылке:',
  ignore:
    'Если вы не знаете, о ком речь, просто не переходите по ссылке — аккаунт останется ограниченным.',
  docs: 'Тексты документов:',
};

export interface ParentLetter {
  subject: string;
  text: string;
}

export function buildParentLetter(opts: {
  childName: string;
  confirmUrl: string;
  /** Вариант Б согласия, уже с подставленными [ФИО] и [ПОЧТА]. */
  consentText: string;
  siteUrl?: string;
}): ParentLetter {
  const site = opts.siteUrl ?? 'https://budetege.ru';
  const t = parentLetterText;
  return {
    subject: t.subject,
    text: [
      t.intro(opts.childName.trim()),
      `${t.consentTitle}\n\n${opts.consentText}`,
      `${t.action}\n${opts.confirmUrl}`,
      t.ignore,
      `${t.docs}\n${site}${legalDocs.soglasie.href}#${soglasieAnchors.roditel}\n${site}${legalDocs.politika.href}\n${site}${legalDocs.soglashenie.href}`,
    ].join('\n\n'),
  };
}
