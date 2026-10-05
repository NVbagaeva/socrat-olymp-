/**
 * Отпечатки ответов задания №2: тот же механизм, что у №3, №4–5 и
 * №8, со своей солью. Берётся из общей фабрики lib/otpechatok.ts.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z2:v1:');

export const {
  canonical,
  fingerprint,
  sealAnswer,
  sealChoice,
  answerMatches,
  choiceMatches,
  sealText,
  openText,
} = sekret;
