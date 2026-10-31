/**
 * Отпечатки ответов карточек по теории: тот же устройство, что у
 * заданий (lib/otpechatok.ts), со своей солью. В браузер уходят
 * только отпечатки; текст обратной стороны карточек с автопроверкой
 * зашифрован и открывается после ответа ученика.
 */

import { createOtpechatok } from '../otpechatok';

export const otpechatok = createOtpechatok('kartochki:v1');

/** Выбор «верно / неверно» хешируется так же, как числовой ответ. */
export const VERNO = 'da';
export const NEVERNO = 'net';
