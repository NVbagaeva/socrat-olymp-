/**
 * №15 (варианты 15–16): правильная четырёхугольная призма ABCDA1B1C1D1,
 * AB = a, AA1 = h.
 * а) AC ⊥ BD и AC ⊥ BB1 ⇒ AC ⊥ (BB1D1D) ⇒ AC ⊥ B1D.
 * б) DC ⊥ (BCC1): угол между B1D и (BCC1) — ∠DB1C,
 *    tg = DC/B1C = a/√(a² + h²).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI15 {
  a2: number;
  h2: number;
}

export function chislaI15(p: PI15) {
  const a2 = rat(p.a2);
  const h2 = rat(p.h2);
  const b1c2 = add(a2, h2);
  const tg2 = div(a2, b1c2);
  return { a2, h2, b1c2, tg2, ugol: Math.atan(Math.sqrt(toNumber(tg2))) };
}

function scenariy(p: PI15, punkt: 'a' | 'b'): Scenariy {
  const sc: Scenariy = {
    id: `PV-I15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная призма, диагональ основания и диагональ призмы'
        : 'Правильная четырёхугольная призма, угол между диагональю призмы и боковой гранью',
    telo: { vid: 'prizma', n: 4, a: Math.sqrt(p.a2), h: Math.sqrt(p.h2) },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    tochki: [],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'b1d', vid: 'otrezok', tochki: ['B1', 'D'], rol: 'uslovie' },
          ]
        : [
            { id: 'b1d', vid: 'otrezok', tochki: ['B1', 'D'], rol: 'uslovie' },
            { id: 'b1c', vid: 'otrezok', tochki: ['B1', 'C'] },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyI15(p: PI15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

const chertezh = (p: PI15, punkt: 'a' | 'b') =>
  chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });

function sobrat(p: PI15): Chast2Zadacha {
  const c = chislaI15(p);
  const kv = (x: ReturnType<typeof rat>) => surdTex(sqrtRat(x));
  const tgT = kv(c.tg2);
  const otvT = `\\operatorname{arctg}${tgT}`;
  return {
    no: 15,
    shablon: 'i15.prizmaDiag',
    uslovie:
      `В правильной четырёхугольной призме $ABCDA_1B_1C_1D_1$ сторона основания равна $${kv(c.a2)}$, а боковое ребро равно $${kv(c.h2)}$.\n` +
      `а) Докажите, что прямые $B_1D$ и $AC$ перпендикулярны.\n` +
      `б) Найдите угол между прямой $B_1D$ и плоскостью $BCC_1$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Угол',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Плоскость через диагональ',
        risunok: chertezh(p, 'a'),
        lines: [
          `Основание — квадрат, его диагонали перпендикулярны: $AC\\perp BD$ ({{t:romb-diagonali|диагонали ромба}}). Боковое ребро $BB_1$ перпендикулярно основанию, поэтому $AC\\perp BB_1$.`,
          `По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $AC\\perp(BB_1D)$, а прямая $B_1D$ лежит в этой плоскости: $AC\\perp B_1D$.`,
        ],
      },
      {
        title: 'б) Проекция на грань',
        risunok: chertezh(p, 'b'),
        lines: [
          `Ребро $DC$ перпендикулярно $BC$ и $CC_1$, значит, $DC\\perp(BCC_1)$, и $B_1C$ — проекция $B_1D$ на эту плоскость ({{t:naklonnye-proekcii|наклонная и проекция}}). Искомый угол — $\\angle DB_1C$ ({{t:ugol-pryamoy-ploskost|угол между прямой и плоскостью}}).`,
          `Треугольник $DCB_1$ прямоугольный с прямым углом $C$; по {{t:pifagor|теореме Пифагора}} $B_1C^2=BC^2+BB_1^2=${ratTex(c.b1c2)}$.`,
          `$\\operatorname{tg}\\angle DB_1C=\\dfrac{DC}{B_1C}=${tgT}$. Ответ: $${otvT}$.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [`б) $${otvT}$.`],
      },
    ],
    razbor: [
      { slovo: 'а) $AC\\perp BD$, $AC\\perp BB_1$', formula: 'AC\\perp(BB_1D)' },
      { slovo: 'б) $DC\\perp(BCC_1)$: угол $DB_1C$', formula: `B_1C^2=${ratTex(c.b1c2)}` },
      { slovo: 'Тангенс', formula: `\\operatorname{tg}\\varphi=${tgT}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: c.ugol, tg2: toNumber(c.tg2) },
  };
}

export const I15_PRIZMA_DIAG: Shablon2<PI15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная призма: перпендикулярность диагонали призмы и диагонали основания; угол диагонали с боковой гранью',
  sobrat,
};
