/**
 * №15 (варианты 7–8): правильная четырёхугольная призма ABCDA₁B₁C₁D₁,
 * AB = √a2, AA₁ = h, точка M на ребре CC₁, CM : MC₁ = m : n.
 *
 * а) BD ⊥ AC (диагонали квадрата) и BD ⊥ CC₁ (боковое ребро
 *    перпендикулярно основанию) ⇒ BD ⊥ (ACC₁), а AM лежит в этой
 *    плоскости ⇒ BD ⊥ AM.
 * б) C — проекция M на (ABC), AC — проекция AM, угол — ∠MAC:
 *    tg = CM / AC, AC = AB·√2.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { div, mul, rat, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PX15 {
  /** AB² (AB = √a2). */
  a2: number;
  /** AA₁. */
  h: number;
  /** CM : MC₁ = m : n. */
  m: number;
  n: number;
}

export function chislaX15(p: PX15) {
  const t = rat(p.m, p.m + p.n);
  const cm = mul(t, rat(p.h));
  const ac2 = mul(rat(2), rat(p.a2));
  const tg2 = div(mul(cm, cm), ac2);
  return { t, cm, ac2, tg2 };
}

function scenariy(p: PX15, punkt: 'a' | 'b'): Scenariy {
  const c = chislaX15(p);
  const sc: Scenariy = {
    id: `PV-X15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Правильная четырёхугольная призма, точка на боковом ребре, диагонали основания'
        : 'Правильная четырёхугольная призма, наклонная из вершины основания и её проекция',
    telo: { vid: 'prizma', n: 4, a: Math.sqrt(p.a2), h: p.h },
    imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
    tochki: [{ imya: 'M', gde: { naOtrezke: ['C', 'C1', toNumber(c.t)] }, rol: 'uslovie' }],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'] },
            { id: 'am', vid: 'otrezok', tochki: ['A', 'M'], rol: 'uslovie' },
          ]
        : [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
            { id: 'am', vid: 'otrezok', tochki: ['A', 'M'], rol: 'uslovie' },
          ],
  };
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyX15(p: PX15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PX15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PX15): Chast2Zadacha {
  if (!(p.m > 0 && p.n > 0 && p.h > 0 && p.a2 > 0)) throw new Error('x15: параметры');
  const c = chislaX15(p);
  const ab = surdTex(sqrtRat(rat(p.a2)));
  const ac = surdTex(sqrtRat(c.ac2));
  const cmT = surdTex(sqrtRat(mul(c.cm, c.cm)));
  const tgT = surdTex(sqrtRat(c.tg2));
  const otvT = `\\operatorname{arctg}${tgT}`;
  const uslovie =
    `В правильной четырёхугольной призме $ABCDA_1B_1C_1D_1$ сторона основания равна $${ab}$, а боковое ребро равно $${p.h}$. На ребре $CC_1$ отмечена точка $M$ так, что $CM:MC_1=${p.m}:${p.n}$.\n` +
    `а) Докажите, что прямые $BD$ и $AM$ перпендикулярны.\n` +
    `б) Найдите угол между прямой $AM$ и плоскостью $ABC$.`;
  return {
    no: 15,
    shablon: 'x15.prizmaBD',
    uslovie,
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
        title: 'а) Прямая $BD$ перпендикулярна плоскости $ACC_1$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Основание — квадрат, его диагонали перпендикулярны: $BD\\perp AC$ ({{t:romb-diagonali|диагонали ромба перпендикулярны}}).`,
          `Призма прямая, поэтому $CC_1\\perp(ABC)$ и, значит, $CC_1\\perp BD$.`,
          `Прямая $BD$ перпендикулярна двум пересекающимся прямым $AC$ и $CC_1$ плоскости $ACC_1$, поэтому $BD\\perp(ACC_1)$ ({{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}).`,
        ],
      },
      {
        title: 'а) Вывод',
        lines: [
          'Точки $A$, $C$ и $M$ лежат в плоскости $ACC_1$, значит, прямая $AM$ лежит в этой плоскости и $BD\\perp AM$.',
        ],
      },
      {
        title: 'б) Угол между прямой и плоскостью',
        risunok: chertezh(p, 'b'),
        lines: [
          `$MC\\perp(ABC)$, поэтому $AC$ — проекция наклонной $AM$, и искомый угол — $\\angle MAC$ ({{t:ugol-pryamoy-ploskost|угол между прямой и плоскостью}}).`,
          `$AC=AB\\sqrt2=${ac}$, $CM=\\dfrac{${p.m}}{${p.m + p.n}}\\cdot${p.h}=${cmT}$.`,
          `В прямоугольном треугольнике $ACM$ ({{t:pifagor|катеты}} $AC$ и $CM$): $\\operatorname{tg}\\angle MAC=\\dfrac{CM}{AC}=${tgT}$. Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Диагонали квадрата и боковое ребро', formula: 'BD\\perp AC,\\ BD\\perp CC_1' },
      {
        slovo: 'а) Признак перпендикулярности',
        formula: 'BD\\perp(ACC_1)\\Rightarrow BD\\perp AM',
      },
      {
        slovo: 'б) Проекция наклонной',
        formula: `\\operatorname{tg}\\angle MAC=\\frac{CM}{AC}=${tgT}`,
      },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: Math.atan(Math.sqrt(toNumber(c.tg2))) },
  };
}

export const X15_PRIZMA_BD: Shablon2<PX15> = {
  no: 15,
  prototip:
    'Правильная четырёхугольная призма: перпендикулярность диагонали основания и наклонной, угол наклонной с основанием',
  sobrat,
};
