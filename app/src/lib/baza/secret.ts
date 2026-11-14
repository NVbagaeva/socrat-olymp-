/**
 * Отпечаток ответа задач базы. Ответ в браузер открытым текстом не
 * уходит — как в тренажёрах профиля (lib/otpechatok.ts).
 *
 * Отпечаток знает тип ответа: «chislo:…», «cifry:…», «nomera:…»,
 * «lyuboe:…|…|…» (все допустимые ответы). Сверяется нормальная запись:
 * у числа — запись бланка без лишних нулей, у номеров утверждений —
 * цифры по возрастанию.
 */

import { normalizeAnswer, readAnswer, type Reading } from '../otvet';
import { normalnyeNomera, type Klyuch, type TipOtveta } from '../otvet/tipy';
import { createOtpechatok } from '../otpechatok';

const sekret = createOtpechatok('baza:v1:');

export const { sealText, openText } = sekret;

function normalnoe(tip: TipOtveta, otvet: string): string {
  if (tip === 'cifry') return otvet.replace(/\s+/g, '');
  if (tip === 'nomera') return normalnyeNomera(otvet.replace(/\s+/g, ''));
  const n = normalizeAnswer(otvet);
  if (!n.ok) throw new Error(`ответ не в записи бланка: «${otvet}»`);
  return n.value;
}

/** Отпечаток ключа задачи. */
export function zapechatat(klyuch: Klyuch): string {
  const vse = klyuch.tip === 'lyuboe' ? (klyuch.dopustimye ?? [klyuch.otvet]) : [klyuch.otvet];
  return `${klyuch.tip}:${vse.map((v) => sekret.sealChoice(normalnoe(klyuch.tip, v))).join('|')}`;
}

function razobrat(seal: string): { tip: TipOtveta; otpechatki: string[] } {
  const at = seal.indexOf(':');
  return { tip: seal.slice(0, at) as TipOtveta, otpechatki: seal.slice(at + 1).split('|') };
}

export function tipOtpechatka(seal: string): TipOtveta {
  return razobrat(seal).tip;
}

/** Ответ ученика против отпечатка — по правилам типа ответа. */
export function prochitat(vvod: string, seal: string): Reading {
  const { tip, otpechatki } = razobrat(seal);
  const verno = (value: string) => otpechatki.some((o) => sekret.choiceMatches(value, o));
  if (tip === 'chislo' || tip === 'lyuboe') return readAnswer(vvod, 'trenazher', verno);
  const cifry = vvod.replace(/^[\s ]+|[\s ]+$/g, '');
  if (!/^\d+$/.test(cifry) || (tip === 'nomera' && new Set(cifry).size !== cifry.length)) {
    return { kind: 'format', problem: cifry === '' ? 'empty' : 'other', meant: null };
  }
  const value = tip === 'nomera' ? normalnyeNomera(cifry) : cifry;
  return { kind: 'answer', value, right: verno(value), viaFraction: false };
}
