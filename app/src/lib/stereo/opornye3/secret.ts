/**
 * Отпечатки ответов опорных задач №3: общая фабрика lib/otpechatok.ts
 * со своей солью. В браузер уходит отпечаток ответа, а не ответ.
 */

import { createOtpechatok } from '../../otpechatok';

export const { sealAnswer, sealChoice, answerMatches, choiceMatches, sealText, openText } =
  createOtpechatok('z3o:v1:');
