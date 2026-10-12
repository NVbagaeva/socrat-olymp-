/**
 * Отпечатки ответов задания №7: общая фабрика lib/otpechatok.ts со
 * своей солью. В браузер уходит не число ответа, а его отпечаток.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z7:v1:');

export const { canonical, fingerprint, sealAnswer, sealText, openText } = sekret;

export { answerMatches7 as answerMatches } from './otvet';
