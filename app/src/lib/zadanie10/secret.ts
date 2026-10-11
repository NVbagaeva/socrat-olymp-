/**
 * Отпечатки ответов задания №10: общая фабрика lib/otpechatok.ts со
 * своей солью. В браузер уходит не число ответа, а его отпечаток.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z10:v1:');

export const { canonical, fingerprint, sealAnswer, answerMatches } = sekret;
