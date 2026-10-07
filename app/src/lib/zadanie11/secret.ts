/**
 * Отпечатки ответов задания №11: тот же механизм, что у №2, №3, №4–5
 * и №8, со своей солью (общая фабрика lib/otpechatok.ts). Вниз, в
 * браузер, уходит не число ответа, а его отпечаток.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z11:v1:');

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
