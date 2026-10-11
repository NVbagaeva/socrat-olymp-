/**
 * Отпечатки ответов задания №1: тот же механизм, что у №2, №3, №8 и
 * №11, со своей солью. Берётся из общей фабрики lib/otpechatok.ts.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z1:v1:');

export const { canonical, fingerprint, sealAnswer, answerMatches, sealText, openText } = sekret;
