/**
 * №15: треугольная пирамида SABC, основание — равнобедренный
 * треугольник (AB = BC), высота SH, точка H внутри угла ABC; тангенс
 * угла между основанием и каждой из граней SAB, SBC задан.
 * а) Центр описанной сферы лежит на луче SH. б) Тангенс угла между
 * плоскостями ABC и SAC.
 *
 * Данные подобраны так, что H — центр описанной окружности основания:
 * расстояние от H до AB и BC равно d = SH/tg φ = l·m/(2·BM)
 * (l = AB, m = AC/2), H на биссектрисе BM и BH = d·l/m = R. Ответ
 * б) — SH/HM, HM = |R − BM|. Все длины — корни из дробей (ядро №15).
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { obernut3d } from '@/lib/stereo/zhivoy';
import { div, mul, rat, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PC15 {
  /** AB² = BC². */
  l2: number;
  /** AC². */
  ac2: number;
  /** SH² дробью [числитель, знаменатель]. */
  h2: readonly [number, number];
}

const kor = (x: Rat) => surdTex(sqrtRat(x));

export function chislaC15(p: PC15) {
  const l2 = rat(p.l2);
  const m2 = rat(p.ac2, 4);
  const bm2 = sub(l2, m2);
  const h2 = rat(p.h2[0], p.h2[1]);
  /* R = l²/(2BM), d = l·m/(2BM), HM = |2m² − l²|/(2BM). */
  const R2 = div(mul(l2, l2), mul(rat(4), bm2));
  const d2 = div(mul(l2, m2), mul(rat(4), bm2));
  const raz = sub(mul(rat(2), m2), l2);
  const hm2 = div(mul(raz, raz), mul(rat(4), bm2));
  const tg2 = div(h2, d2);
  const otv2 = div(h2, hm2);
  /* sin∠ABM = m/l. */
  const sin2 = div(m2, l2);
  /* Центр сферы на SH: HO' = (h² − R²)/(2h) от H к S. */
  return { l2, m2, bm2, h2, R2, d2, hm2, tg2, otv2, sin2, tupoy: toNumber(raz) > 0 };
}

/** Описание чертежей для голосового доступа (обычный текст, без формул). */
const ALT = {
  a: { alt: 'Пирамида SABC, высота SH, перпендикуляр HP к ребру AB и линейный угол SPH' },
  b: { alt: 'Пирамида SABC, высота SH, середина M ребра AC и линейный угол SMH' },
} as const;

function scenariy(p: PC15, punkt: 'a' | 'b'): Scenariy {
  const n = chislaC15(p);
  const m = Math.sqrt(toNumber(n.m2));
  const bm = Math.sqrt(toNumber(n.bm2));
  const R = Math.sqrt(toNumber(n.R2));
  const h = Math.sqrt(toNumber(n.h2));
  const sc: Scenariy = {
    id: `PV-C15-${punkt}`,
    alt: ALT[punkt].alt,
    telo: {
      vid: 'piramida-proizv',
      osnovanie: [
        [-m, 0],
        [0, -bm],
        [m, 0],
      ],
      vershina: [0, R - bm, h],
    },
    imena: ['A', 'B', 'C', 'S'],
    tochki: [
      { imya: 'H', gde: { proekciya: 'S', na: ['A', 'B', 'C'] }, rol: 'uslovie' },
      ...(punkt === 'a'
        ? [
            { imya: 'P', gde: { proekciya: 'H', na: ['A', 'B'] } },
            { imya: 'Q', gde: { proekciya: 'H', na: ['B', 'C'] } },
          ]
        : [{ imya: 'M', gde: { seredina: ['A', 'C'] } }]),
    ] as Scenariy['tochki'],
    elementy: [
      { id: 'sh', vid: 'vysota', tochki: ['S', 'H'], rol: 'uslovie' },
      ...(punkt === 'a'
        ? [
            { id: 'hp', vid: 'otrezok', tochki: ['H', 'P'] },
            { id: 'sp', vid: 'otrezok', tochki: ['S', 'P'] },
            { id: 'hq', vid: 'otrezok', tochki: ['H', 'Q'] },
            { id: 'bh', vid: 'otrezok', tochki: ['B', 'H'] },
            { id: 'ugol', vid: 'ugol', tochki: ['S', 'P', 'H'] },
            { id: 'pr', vid: 'pryamoy-ugol', tochki: ['H', 'P', 'B'] },
          ]
        : [
            { id: 'bm', vid: 'otrezok', tochki: ['B', 'M'] },
            { id: 'hm', vid: 'otrezok', tochki: ['H', 'M'] },
            { id: 'sm', vid: 'otrezok', tochki: ['S', 'M'] },
            { id: 'ha', vid: 'otrezok', tochki: ['H', 'A'] },
            { id: 'ugol', vid: 'ugol', tochki: ['S', 'M', 'H'] },
            { id: 'pr', vid: 'pryamoy-ugol', tochki: ['B', 'M', 'C'] },
          ]),
    ] as Scenariy['elementy'],
    proverki: [
      { dlina: ['A', 'B'], ravno: Math.sqrt(p.l2) },
      { dlina: ['B', 'C'], ravno: Math.sqrt(p.l2) },
      { dlina: ['A', 'C'], ravno: Math.sqrt(p.ac2) },
      { dlina: ['S', 'H'], ravno: h },
    ],
  };
  if (punkt === 'b') {
    const a = scenariy(p, 'a');
    return { ...sc, rakurs: a.rakurs, szhatie: a.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyC15(p: PC15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PC15, punkt: 'a' | 'b'): string {
  /* На экране чертёж решения вращается руками (lib/stereo/zhivoy.ts). */
  return obernut3d(
    chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' }),
    { sc: scenariy(p, punkt), vspom: true },
  );
}

function sobrat(p: PC15): Chast2Zadacha {
  const n = chislaC15(p);
  if (!(toNumber(n.bm2) > 0) || toNumber(n.hm2) === 0 || p.ac2 === p.l2)
    throw new Error('c15: основание вырождено');
  const l = kor(n.l2);
  const ac = kor(rat(p.ac2));
  const h = kor(n.h2);
  const tg = kor(n.tg2);
  const m = kor(n.m2);
  const bm = kor(n.bm2);
  const d = kor(n.d2);
  const R = kor(n.R2);
  const hm = kor(n.hm2);
  const otvet = kor(n.otv2);
  const sinT = kor(n.sin2);
  const uslovie =
    `В треугольной пирамиде $SABC$ высота $SH$ равна $${h}$, основание — равнобедренный треугольник $ABC$, в котором $AB=BC=${l}$, $AC=${ac}$. ` +
    `Точка $H$ лежит внутри угла $ABC$, а тангенс угла между плоскостью $ABC$ и каждой из граней $SAB$ и $SBC$ равен $${tg}$.\n` +
    `а) Докажите, что центр сферы, описанной около пирамиды $SABC$, лежит на луче $SH$.\n` +
    `б) Найдите тангенс угла между плоскостями $ABC$ и $SAC$.`;
  const gdeH = n.tupoy
    ? `Угол $B$ тупой ($AC^2>AB^2+BC^2$), поэтому $BH=${R}>BM=${bm}$: точка $H$ лежит на продолжении $BM$ за точку $M$, и $HM=BH-BM=${hm}$.`
    : `$BH=${R}<BM=${bm}$: точка $H$ лежит на отрезке $BM$, и $HM=BM-BH=${hm}$.`;

  return {
    no: 15,
    shablon: 'c15.sferaPiramida',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Тангенс угла',
        pole: { vid: 'chislo', verno: otvet.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvet}$`,
    reshenie: [
      {
        title: 'а) Расстояния от $H$ до $AB$ и $BC$',
        risunok: chertezh(p, 'a'),
        lines: [
          `Проведём $HP\\perp AB$ и $HQ\\perp BC$ ($P$, $Q$ — на прямых $AB$ и $BC$). $HP$ — проекция наклонной $SP$, поэтому по {{t:tri-perpendikulyara|теореме о трёх перпендикулярах}} $SP\\perp AB$.`,
          `Значит, $\\angle SPH$ — {{t:ugol-mezhdu-ploskostyami|линейный угол двугранного угла}} между плоскостями $ABC$ и $SAB$: $\\operatorname{tg}\\angle SPH=\\dfrac{SH}{HP}=${tg}$, откуда $HP=\\dfrac{${h}}{${tg}}=${d}$. Так же $HQ=${d}$.`,
        ],
      },
      {
        title: 'а) Точка $H$ — центр описанной окружности основания',
        lines: [
          `Точка $H$ лежит внутри угла $ABC$ и равноудалена от его сторон, поэтому {{t:bissektrisa-gmt|лежит на биссектрисе}} угла $B$. В равнобедренном треугольнике это медиана и высота $BM$, $M$ — середина $AC$.`,
          `По {{t:pifagor|теореме Пифагора}} $BM=\\sqrt{AB^2-AM^2}=\\sqrt{${p.l2}-${ratTexPlain(n.m2)}}=${bm}$, $\\sin\\angle ABM=\\dfrac{AM}{AB}=\\dfrac{${m}}{${l}}=${sinT}$. Из прямоугольного треугольника $BPH$: $BH=\\dfrac{HP}{\\sin\\angle ABM}=${R}$.`,
          gdeH,
          `$HA=\\sqrt{AM^2+HM^2}=\\sqrt{${ratTexPlain(n.m2)}+${ratTexPlain(n.hm2)}}=${R}=BH$, а $HC=HA$, так как $H$ лежит на {{t:seredinnyy-perp|серединном перпендикуляре}} $BM$ к $AC$. Итак, $HA=HB=HC$.`,
        ],
      },
      {
        title: 'а) Центр сферы на луче $SH$',
        lines: [
          `Пусть $O$ — центр описанной сферы и $O_1$ — его проекция на плоскость $ABC$. Наклонные $OA$, $OB$, $OC$ равны, поэтому {{t:naklonnye-proekcii|равны и их проекции}}: $O_1A=O_1B=O_1C$, и $O_1$ — центр окружности, описанной около $ABC$, то есть $O_1=H$. Значит, $O$ лежит на прямой $SH$.`,
          `Если бы $O$ лежал на продолжении $SH$ за точку $S$, то $OA>OH>OS$ — а должно быть $OA=OS$. Поэтому $O$ лежит на луче $SH$, что и требовалось доказать.`,
        ],
      },
      {
        title: 'б) Линейный угол',
        risunok: chertezh(p, 'b'),
        lines: [
          `$H$ лежит на прямой $BM$, а $BM\\perp AC$, поэтому $HM\\perp AC$, и по {{t:tri-perpendikulyara|теореме о трёх перпендикулярах}} $SM\\perp AC$.`,
          `$\\angle SMH$ — {{t:ugol-mezhdu-ploskostyami|линейный угол}} двугранного угла между плоскостями $ABC$ и $SAC$: $\\operatorname{tg}\\angle SMH=\\dfrac{SH}{HM}=\\dfrac{${h}}{${hm}}=${otvet}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Линейные углы при рёбрах $AB$ и $BC$ дают расстояния от $H$',
        formula: `HP=HQ=\\dfrac{SH}{\\operatorname{tg}\\varphi}=${d}`,
      },
      {
        slovo: '$H$ — на биссектрисе $BM$, считаем $BH$',
        formula: `BH=\\dfrac{HP}{\\sin\\angle ABM}=${R}`,
      },
      {
        slovo: '$HA=HB=HC$ — центр описанной окружности основания',
        formula: `HA=\\sqrt{AM^2+HM^2}=${R}`,
      },
      { slovo: 'Центр сферы проецируется в $H$ и лежит на луче $SH$', formula: 'O\\in SH' },
      {
        slovo: 'б) Линейный угол $SMH$',
        formula: `\\operatorname{tg}\\angle SMH=\\dfrac{SH}{HM}=${otvet}`,
      },
    ],
    kontrol: {
      otvet: Math.sqrt(toNumber(n.otv2)),
      R: Math.sqrt(toNumber(n.R2)),
      d: Math.sqrt(toNumber(n.d2)),
      sin: Math.sqrt(toNumber(n.sin2)),
      /* tg²φ из условия точно — для sympy. */
      tg2: [Number(n.tg2.n), Number(n.tg2.d)],
    },
  };
}

/** Дробь в простом TeX для подкоренного выражения: 9, \dfrac{9}{4}. */
function ratTexPlain(x: Rat): string {
  return x.d === 1n ? String(x.n) : `\\dfrac{${x.n}}{${x.d}}`;
}

export const C15_SFERA_PIRAMIDA: Shablon2<PC15> = {
  no: 15,
  prototip: 'Треугольная пирамида: центр описанной сферы на высоте; угол между плоскостями',
  sobrat,
};
