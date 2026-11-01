/**
 * №15 (варианты 11–12): правильная четырёхугольная пирамида SABCD,
 * AB = a, SA = b.
 *
 * а) BC ∥ AD (стороны квадрата), поэтому угол между скрещивающимися SA
 *    и BC равен углу между SA и AD, то есть ∠SAD.
 * б) Грань SAD — равнобедренный треугольник, SK — высота и медиана
 *    (K — середина AD): cos∠SAD = AK/SA = a/(2b).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { rat, ratTex } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA15 {
  a: number;
  b: number;
}

export function chislaA15(p: PA15) {
  if (!(2 * p.b > p.a * Math.SQRT2)) throw new Error('a15: пирамида не существует');
  const cos = rat(p.a, 2 * p.b);
  return { cos, ugol: Math.acos(p.a / (2 * p.b)) };
}

function scenariy(p: PA15, punkt: 'a' | 'b'): Scenariy {
  const h = Math.sqrt(p.b * p.b - (p.a * p.a) / 2);
  const sc: Scenariy = {
    id: `PV-A15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная пирамида, боковое ребро и сторона основания'
        : 'Правильная четырёхугольная пирамида, высота боковой грани',
    telo: { vid: 'piramida', n: 4, a: p.a, h },
    imena: ['A', 'B', 'C', 'D', 'S'],
    tochki: [{ imya: 'K', gde: { seredina: ['A', 'D'] } }],
    elementy:
      punkt === 'a'
        ? [
            { id: 'sa', vid: 'otrezok', tochki: ['S', 'A'], rol: 'uslovie' },
            { id: 'bc', vid: 'otrezok', tochki: ['B', 'C'], rol: 'uslovie' },
          ]
        : [
            { id: 'sa', vid: 'otrezok', tochki: ['S', 'A'], rol: 'uslovie' },
            { id: 'sk', vid: 'otrezok', tochki: ['S', 'K'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyA15(p: PA15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PA15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PA15): Chast2Zadacha {
  const ch = chislaA15(p);
  const cosT = ratTex(ch.cos);
  const otv = `\\arccos${cosT}`;
  const sk2 = rat(4 * p.b * p.b - p.a * p.a, 4);
  return {
    no: 15,
    shablon: 'a15.piramidaSkreshch',
    uslovie:
      `В правильной четырёхугольной пирамиде $SABCD$ сторона основания равна $${p.a}$, а боковое ребро равно $${p.b}$.\n` +
      `а) Докажите, что угол между прямыми $SA$ и $BC$ равен углу $SAD$.\n` +
      `б) Найдите угол между прямыми $SA$ и $BC$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Угол',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      {
        title: 'а) Переносим прямую $BC$',
        risunok: chertezh(p, 'a'),
        lines: [
          'Основание правильной пирамиды — квадрат, поэтому $BC\\parallel AD$.',
          `Угол между скрещивающимися прямыми равен углу между пересекающимися прямыми, им параллельными ({{t:priznak-par-pryamyh|параллельные прямые}}): угол между $SA$ и $BC$ равен углу между $SA$ и $AD$, то есть $\\angle SAD$ (он острый — угол при основании равнобедренного треугольника, {{t:ravnobedr-ugly|углы при основании равны}}).`,
        ],
      },
      {
        title: 'б) Боковая грань',
        risunok: chertezh(p, 'b'),
        lines: [
          `Треугольник $SAD$ равнобедренный: $SA=SD=${p.b}$. Пусть $K$ — середина $AD$, тогда $SK$ — медиана и высота ({{t:ravnobedr-vysota|медиана к основанию равнобедренного треугольника}}), $AK=\\dfrac{${p.a}}{2}$.`,
        ],
      },
      {
        title: 'б) Косинус угла',
        lines: [
          `В прямоугольном треугольнике $SAK$: $\\cos\\angle SAD=\\dfrac{AK}{SA}=${cosT}$ (высота грани по {{t:pifagor|теореме Пифагора}}: $SK^2=SA^2-AK^2=${ratTex(sk2)}$).`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Параллельный перенос прямой $BC$ в $AD$', formula: 'BC\\parallel AD' },
      {
        slovo: 'б) Высота равнобедренного треугольника $SAD$',
        formula: `\\cos\\angle SAD=\\frac{AK}{SA}=${cosT}`,
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: ch.ugol },
  };
}

export const A15_PIRAMIDA_SKRESHCH: Shablon2<PA15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная пирамида: угол между боковым ребром и скрещивающейся стороной основания',
  sobrat,
};
