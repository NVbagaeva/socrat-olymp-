/**
 * Отпечатки ответов задания №13: общая фабрика lib/otpechatok.ts со
 * своей солью. Вниз, в браузер, уходит не число ответа, а его отпечаток.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z13:v1:');

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
