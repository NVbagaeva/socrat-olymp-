/**
 * Отпечатки ответов задания «Наибольшее и наименьшее значение функции»:
 * тот же механизм, что у №2, №3, №8, №9, со своей солью
 * (lib/otpechatok.ts).
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z21:v1:');

export const { sealAnswer, answerMatches, sealText, openText } = sekret;
