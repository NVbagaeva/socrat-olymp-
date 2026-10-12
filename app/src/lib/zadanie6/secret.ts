/**
 * Отпечатки ответов задания №6: общая фабрика lib/otpechatok.ts со
 * своей солью. В браузер уходит не число ответа, а его отпечаток.
 */

import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('z6:v1:');

export const { sealAnswer, sealText, openText } = sekret;

export { answerMatches6 as answerMatches } from './otvet';
