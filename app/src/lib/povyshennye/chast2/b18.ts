/**
 * №18 (варианты 3–4): прямоугольник ABCD, точка E на BC, луч DB —
 * биссектриса угла ADE (в образце DB и DE делят прямой угол ADC на три
 * равные части — частный случай AB² : AD² = 1 : 3). O = AC ∩ BD,
 * N = AE ∩ BD, P = AC ∩ DE.
 *
 * ∠EBD = ∠BDA = ∠BDE, поэтому BE = DE, и по теореме Пифагора
 * BE/AD = (a² + d²)/(2d²); все нужные отношения выражаются через a² и d²
 * рационально. а) BN : ND = BE : AD. б) отношение площадей частей —
 * через подобие и площади треугольников с общим углом.
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element, Scena } from '@/lib/planimetriya/types';
import { add, div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

export type Vopros18 = 'AEP_BD' | 'ONEC_DE' | 'BCD_AE' | 'ONEC_S';

export interface PB18 {
  /** 'tri' — DB и DE делят угол ADC на три равные части; 'bis' — DB — биссектриса угла ADE при AB² : AD² = a2 : d2. */
  vid: 'tri' | 'bis';
  a2?: number;
  d2?: number;
  vopros: Vopros18;
}

export function chislaB18(p: PB18) {
  const a2 = p.vid === 'tri' ? rat(1) : rat(p.a2!);
  const d2 = p.vid === 'tri' ? rat(3) : rat(p.d2!);
  const one = rat(1);
  /* x = BE/AD, e = EC/AD. */
  const x = div(add(a2, d2), mul(rat(2), d2));
  const e = sub(one, x);
  /* а) BN : ND = x : 1. */
  const bnBd = div(x, add(x, one));
  /* б) */
  const anAe = div(one, add(one, x));
  const apAc = div(one, add(one, e));
  const aoAp = div(add(one, e), rat(2));
  const kAEP = mul(anAe, aoAp);
  const sBOC = rat(1, 4);
  const sBNE = mul(sBOC, mul(mul(rat(2), bnBd), x));
  const sONEC = sub(sBOC, sBNE);
  const cpCa = div(e, add(one, e));
  const sEPC = mul(rat(1, 2), mul(e, cpCa));
  const sONEP = sub(sONEC, sEPC);
  const sBCD = rat(1, 2);
  return { a2, d2, x, e, bnBd, anAe, apAc, aoAp, kAEP, sBOC, sBNE, sONEC, cpCa, sEPC, sONEP, sBCD };
}

/** Ответ пункта б. */
export function otvetB18(p: PB18): Rat {
  const c = chislaB18(p);
  switch (p.vopros) {
    case 'AEP_BD':
      return div(c.kAEP, sub(rat(1), c.kAEP));
    case 'ONEC_DE':
      return div(c.sEPC, c.sONEP);
    case 'BCD_AE': {
      const t = mul(c.sBOC, mul(mul(rat(2), c.bnBd), c.x));
      const k = div(t, c.sBCD);
      return div(k, sub(rat(1), k));
    }
    case 'ONEC_S':
      return c.sONEC;
  }
}

const n = toNumber;

/** Сторона из квадрата: 4 → «2», 2 → «\\sqrt2». */
const storona = (q: number) => surdTex(sqrtRat(rat(q)));

function chertezh(p: PB18, punkt: 'a' | 'b'): string {
  const c = chislaB18(p);
  const a = Math.sqrt(n(c.a2));
  const d = Math.sqrt(n(c.d2));
  const xE = n(c.x) * d;
  const tochki: Scena['tochki'] = {
    A: [0, 0],
    B: [0, a],
    C: [d, a],
    D: [d, 0],
    E: [xE, a],
    O: [d / 2, a / 2],
  };
  /* N = AE ∩ BD, P = AC ∩ DE — по долям. */
  const bn = n(c.bnBd);
  tochki.N = [bn * d, a - bn * a];
  const ap = n(c.apAc);
  tochki.P = [ap * d, ap * a];
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'B', b: 'D' },
    { tip: 'otrezok', a: 'D', b: 'E' },
    { tip: 'otrezok', a: 'A', b: 'E' },
    { tip: 'otrezok', a: 'A', b: 'C' },
    { tip: 'tochka', t: 'O' },
    { tip: 'tochka', t: 'N' },
    { tip: 'tochka', t: 'E' },
  ];
  const podpisi = ['A', 'B', 'C', 'D', 'E', 'O', 'N'];
  if (punkt === 'a') {
    el.push({ tip: 'ugol', a: 'A', v: 'D', b: 'B', dugi: 1, sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'B', v: 'D', b: 'E', dugi: 1, sloy: 'reshenie' });
    el.push({ tip: 'ugol', a: 'D', v: 'B', b: 'E', dugi: 1, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'B', b: 'E', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
    el.push({ tip: 'otrezok', a: 'D', b: 'E', shtrihi: 1, tolkoShtrihi: true, sloy: 'reshenie' });
  } else {
    el.push({ tip: 'tochka', t: 'P' });
    podpisi.push('P');
    const oblast: Record<Vopros18, string[]> = {
      AEP_BD: ['A', 'N', 'O'],
      ONEC_DE: ['E', 'C', 'P'],
      BCD_AE: ['B', 'E', 'N'],
      ONEC_S: ['O', 'N', 'E', 'C'],
    };
    el.push({ tip: 'oblast', tochki: oblast[p.vopros], sloy: 'reshenie' });
  }
  return renderPlan(
    {
      tochki,
      elementy: el,
      podpisi,
      proverki: [{ naPryamoy: ['B', 'N', 'O', 'D'] }, { naPryamoy: ['A', 'O', 'P', 'C'] }],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 280,
      vysota: 200,
      alt: 'Прямоугольник ABCD с точкой E на стороне BC и отрезками BD, DE, AE, AC',
    },
  );
}

export function chertezhB18(p: PB18, punkt: 'a' | 'b'): string {
  return chertezh(p, punkt);
}

const VOPROS: Record<Vopros18, string> = {
  AEP_BD:
    'Найдите отношение площади треугольника к площади четырёхугольника, на которые прямая $BD$ делит треугольник $AEP$.',
  ONEC_DE:
    'Найдите отношение площади треугольника к площади четырёхугольника, на которые прямая $DE$ делит четырёхугольник $ONEC$.',
  BCD_AE:
    'Найдите отношение площади треугольника к площади четырёхугольника, на которые прямая $AE$ делит треугольник $BCD$.',
  ONEC_S: 'Какую часть площади прямоугольника $ABCD$ составляет площадь четырёхугольника $ONEC$?',
};

function sobrat(p: PB18): Chast2Zadacha {
  const c = chislaB18(p);
  if (p.vid === 'bis' && !(p.a2! < p.d2!)) throw new Error('b18: E не на стороне BC');
  if (p.vid === 'tri' && (p.vopros === 'AEP_BD' || p.vopros === 'ONEC_DE'))
    throw new Error('b18: этот вопрос с трисекцией — как в образце');
  const otv = otvetB18(p);
  /* BN : ND = x : 1 = (a² + d²) : 2d² — целыми. */
  const bnT = c.x.n;
  const ndT = c.x.d;

  const pervoe =
    p.vid === 'tri'
      ? 'В прямоугольнике $ABCD$ на стороне $BC$ отметили точку $E$. Лучи $DB$ и $DE$ делят угол $ADC$ на три равные части.'
      : `В прямоугольнике $ABCD$ стороны $AB$ и $AD$ относятся как $${storona(p.a2!)}:${storona(p.d2!)}$. На стороне $BC$ отметили точку $E$ так, что луч $DB$ — биссектриса угла $ADE$.`;
  const uslovie =
    `${pervoe} Отрезок $BD$ пересекает отрезки $AC$ и $AE$ в точках $O$ и $N$ соответственно.\n` +
    `а) Докажите, что $BN:ND=${bnT}:${ndT}$.\n` +
    `б) Прямые $AC$ и $DE$ пересекаются в точке $P$. ${VOPROS[p.vopros]}`;

  const xT = ratTex(c.x);
  const eT = ratTex(c.e);
  const otvT = ratTex(otv);
  const nachalo =
    p.vid === 'tri'
      ? [
          `Угол $ADC$ прямой, поэтому $\\angle ADB=\\angle BDE=\\angle EDC=30^\\circ$ и луч $DB$ — биссектриса угла $ADE$.`,
          `Пусть $AB=a$, $AD=d$. В прямоугольном треугольнике $ABD$: $\\dfrac{a}{d}=\\operatorname{tg}30^\\circ=\\dfrac{1}{\\sqrt3}$, то есть $a^2:d^2=1:3$.`,
        ]
      : [`Пусть $AB=a$, $AD=d$; из условия $a^2:d^2=${p.a2}:${p.d2}$.`];

  const reshB: { title: string; lines: string[] }[] = [];
  const podobieAN = `Треугольники $BNE$ и $DNA$ {{t:podobie-uu|подобны по двум углам}} ($BE\\parallel AD$), поэтому $AN:NE=AD:BE=1:${xT}$ и $\\dfrac{AN}{AE}=${ratTex(c.anAe)}$.`;
  const podobieP = `Треугольники $PCE$ и $PAD$ подобны ($CE\\parallel AD$), поэтому $CP:PA=CE:AD=${eT}$ и $\\dfrac{AP}{AC}=${ratTex(c.apAc)}$, $\\dfrac{CP}{CA}=${ratTex(c.cpCa)}$. В частности, $P$ лежит на отрезке $OC$.`;
  const ce = `$CE=BC-BE=\\left(1-${xT}\\right)d=${eT}\\,d$.`;
  if (p.vopros === 'AEP_BD') {
    reshB.push({
      title: 'б) Отношения отрезков',
      lines: [
        ce,
        podobieAN,
        podobieP,
        `$O$ — середина $AC$ (диагонали прямоугольника делятся пополам), поэтому $\\dfrac{AO}{AP}=\\dfrac{AC}{2AP}=${ratTex(c.aoAp)}$.`,
      ],
    });
    reshB.push({
      title: 'б) Площади',
      lines: [
        `Прямая $BD$ пересекает стороны $AE$ и $AP$ треугольника $AEP$ в точках $N$ и $O$ и делит его на треугольник $ANO$ и четырёхугольник $NEPO$.`,
        `По {{t:ploshchadi-obshchiy-ugol|теореме о площадях треугольников с общим углом}} $\\dfrac{S_{ANO}}{S_{AEP}}=\\dfrac{AN}{AE}\\cdot\\dfrac{AO}{AP}=${ratTex(c.anAe)}\\cdot${ratTex(c.aoAp)}=${ratTex(c.kAEP)}$.`,
        `Значит, $S_{ANO}:S_{NEPO}=${ratTex(c.kAEP)}:${ratTex(sub(rat(1), c.kAEP))}=${otvT}$.`,
      ],
    });
  } else if (p.vopros === 'ONEC_DE' || p.vopros === 'ONEC_S') {
    reshB.push({
      title: 'б) Площадь четырёхугольника $ONEC$',
      lines: [
        `Пусть $S$ — площадь прямоугольника. Диагонали делят его на четыре равновеликих треугольника, $S_{BOC}=\\dfrac{S}{4}$.`,
        `Из пункта а $\\dfrac{BN}{BD}=${ratTex(c.bnBd)}$, $BO=\\dfrac{BD}{2}$, поэтому $\\dfrac{BN}{BO}=${ratTex(mul(rat(2), c.bnBd))}$; $\\dfrac{BE}{BC}=${xT}$.`,
        `По {{t:ploshchadi-obshchiy-ugol|теореме о площадях треугольников с общим углом}} $S_{BNE}=S_{BOC}\\cdot\\dfrac{BN}{BO}\\cdot\\dfrac{BE}{BC}=${ratTex(c.sBNE)}S$, и $S_{ONEC}=S_{BOC}-S_{BNE}=${ratTex(c.sONEC)}S$.`,
      ],
    });
    if (p.vopros === 'ONEC_DE')
      reshB.push({
        title: 'б) Части, на которые делит прямая $DE$',
        lines: [
          ce,
          podobieP,
          `Прямая $DE$ проходит через вершину $E$ и пересекает сторону $OC$ в точке $P$: она делит $ONEC$ на треугольник $EPC$ и четырёхугольник $ONEP$.`,
          `$S_{EPC}=S_{CBA}\\cdot\\dfrac{CE}{CB}\\cdot\\dfrac{CP}{CA}=\\dfrac{S}{2}\\cdot${eT}\\cdot${ratTex(c.cpCa)}=${ratTex(c.sEPC)}S$, $S_{ONEP}=${ratTex(c.sONEC)}S-${ratTex(c.sEPC)}S=${ratTex(c.sONEP)}S$.`,
          `Отношение: $S_{EPC}:S_{ONEP}=${otvT}$.`,
        ],
      });
    else reshB[0]!.lines.push(`Ответ: $${otvT}$.`);
  } else {
    const t = mul(c.sBOC, mul(mul(rat(2), c.bnBd), c.x));
    const k = div(t, c.sBCD);
    reshB.push({
      title: 'б) Части треугольника $BCD$',
      lines: [
        `Прямая $AE$ пересекает стороны $BC$ и $BD$ треугольника $BCD$ в точках $E$ и $N$ и делит его на треугольник $BNE$ и четырёхугольник $NECD$.`,
        `Из пункта а $\\dfrac{BN}{BD}=${ratTex(c.bnBd)}$; $\\dfrac{BE}{BC}=${xT}$. По {{t:ploshchadi-obshchiy-ugol|теореме о площадях треугольников с общим углом}} $\\dfrac{S_{BNE}}{S_{BCD}}=${ratTex(c.bnBd)}\\cdot${xT}=${ratTex(k)}$.`,
        `Значит, $S_{BNE}:S_{NECD}=${ratTex(k)}:${ratTex(sub(rat(1), k))}=${otvT}$.`,
      ],
    });
  }
  reshB[0] = { ...reshB[0]!, ...{ risunok: chertezh(p, 'b') } };

  return {
    no: 18,
    shablon: 'b18.pryamougolnik',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.vopros === 'ONEC_S' ? 'Доля площади' : 'Отношение площадей',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Треугольник $BED$ равнобедренный',
        risunok: chertezh(p, 'a'),
        lines: [
          ...nachalo,
          `$BC\\parallel AD$, поэтому $\\angle EBD=\\angle BDA$ ({{t:nakrest-ugly|накрест лежащие углы}}). Луч $DB$ — биссектриса угла $ADE$: $\\angle BDA=\\angle BDE$. Значит, $\\angle EBD=\\angle EDB$, и по {{t:ravnobedr-ugly|признаку равнобедренного треугольника}} $BE=DE$.`,
        ],
      },
      {
        title: 'а) Длина $BE$',
        lines: [
          `Пусть $BE=DE=t$, тогда $EC=d-t$. По {{t:pifagor|теореме Пифагора}} в треугольнике $ECD$: $t^2=(d-t)^2+a^2$, откуда $t=\\dfrac{a^2+d^2}{2d}$ и $\\dfrac{BE}{AD}=\\dfrac{a^2+d^2}{2d^2}=${xT}$.`,
        ],
      },
      {
        title: 'а) Отношение $BN:ND$',
        lines: [
          `Треугольники $BNE$ и $DNA$ {{t:podobie-uu|подобны по двум углам}}: $\\angle NBE=\\angle NDA$ (накрест лежащие при $BC\\parallel AD$), $\\angle BNE=\\angle DNA$ (вертикальные).`,
          `Поэтому $BN:ND=BE:AD=${xT}=${bnT}:${ndT}$, что и требовалось.`,
        ],
      },
      ...reshB,
    ],
    razbor: [
      {
        slovo: 'а) Накрест лежащие углы и биссектриса дают равнобедренный треугольник',
        formula: 'BE=DE',
      },
      { slovo: 'а) Теорема Пифагора в треугольнике $ECD$', formula: `\\dfrac{BE}{AD}=${xT}` },
      { slovo: 'а) Подобие треугольников $BNE$ и $DNA$', formula: `BN:ND=${bnT}:${ndT}` },
      {
        slovo: 'б) Отношения отрезков на сторонах — из подобия',
        formula: `\\dfrac{CP}{CA}=${ratTex(c.cpCa)}`,
      },
      { slovo: 'б) Площади — через треугольники с общим углом', formula: otvT },
    ],
    kontrol: { bnNd: n(c.x), otvet: n(otv), a2: n(c.a2), d2: n(c.d2) },
  };
}

export const B18_PRYAMOUGOLNIK: Shablon2<PB18> = {
  no: 18,
  prototip:
    'Прямоугольник, биссектриса угла ADE из вершины D: отношение отрезков диагонали, отношения площадей',
  sobrat,
};
