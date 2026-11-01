/**
 * №15 (варианты 31–36), свои задачи раздела. Три конфигурации:
 *   kvPrizma — правильная четырёхугольная призма ABCDA₁B₁C₁D₁, AB = a,
 *              AA₁ = h, M — середина CC₁, плоскость BDM:
 *              а) сечение — равнобедренный треугольник; б) его площадь
 *              S = ½·BD·OM = ½·a·√(a² + h²/2);
 *   piramida — правильная четырёхугольная пирамида SABCD, AB = a, SO = h,
 *              M — середина SC: а) SA ∥ (BDM); б) угол между (BDM) и
 *              основанием: tg φ = h√2/a;
 *   trPrizma — правильная треугольная призма ABCA₁B₁C₁, AB = a, AA₁ = h,
 *              M — середина CC₁: а) сечение ABM — равнобедренный
 *              треугольник; б) расстояние от C до (ABM):
 *              d = CK·CM/KM, CK = a√3/2, CM = h/2.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { add, div, mul, rat, ratTex, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PR15 {
  vid: 'kvPrizma' | 'piramida' | 'trPrizma';
  a: number;
  /** h = hN/hD (или √h2, если задано h2). */
  hN: number;
  hD: number;
}

export function chislaR15(p: PR15) {
  const a = rat(p.a);
  const h = rat(p.hN, p.hD);
  const a2 = mul(a, a);
  const h2 = mul(h, h);
  if (p.vid === 'kvPrizma') {
    /* OM² = a²/2 + h²/4, S² = (½·a√2)²·OM² = a²/2 · OM². */
    const OM2 = add(div(a2, rat(2)), div(h2, rat(4)));
    const S2 = mul(div(a2, rat(2)), OM2);
    return { OM2, otv2: S2, otv: surdTex(sqrtRat(S2)), num: surdToNumber(sqrtRat(S2)) };
  }
  if (p.vid === 'piramida') {
    /* tg² φ = h²/(a²/2) = 2h²/a². */
    const tg2 = div(mul(rat(2), h2), a2);
    const tg = sqrtRat(tg2);
    return {
      tg2,
      otv2: tg2,
      otv: `\\operatorname{arctg}${surdTex(tg)}`,
      num: Math.atan(surdToNumber(tg)),
    };
  }
  /* d² = CK²·CM²/(CK² + CM²), CK² = 3a²/4, CM² = h²/4. */
  const CK2 = div(mul(rat(3), a2), rat(4));
  const CM2 = div(h2, rat(4));
  const d2 = div(mul(CK2, CM2), add(CK2, CM2));
  return { CK2, CM2, otv2: d2, otv: surdTex(sqrtRat(d2)), num: surdToNumber(sqrtRat(d2)) };
}

function hTex(p: PR15): string {
  return ratTex(rat(p.hN, p.hD));
}

function scenariy(p: PR15, punkt: 'a' | 'b'): Scenariy {
  const a = 4;
  const h = (a * p.hN) / (p.hD * p.a);
  let sc: Scenariy;
  if (p.vid === 'kvPrizma') {
    sc = {
      id: `PV-R15K-${punkt}`,
      alt: 'Правильная четырёхугольная призма, сечение BDM',
      telo: { vid: 'prizma', n: 4, a, h },
      imena: ['A', 'B', 'C', 'D', 'A1', 'B1', 'C1', 'D1'],
      tochki: [
        { imya: 'M', gde: { seredina: ['C', 'C1'] }, rol: 'uslovie' },
        { imya: 'O', gde: { seredina: ['A', 'C'] } },
      ],
      elementy: [
        { id: 'sech', vid: 'treugolnik', tochki: ['B', 'D', 'M'], rol: 'uslovie' },
        ...(punkt === 'b'
          ? [
              { id: 'ac', vid: 'diagonal' as const, tochki: ['A', 'C'] },
              { id: 'om', vid: 'otrezok' as const, tochki: ['O', 'M'] },
            ]
          : [
              { id: 'bm', vid: 'otrezok' as const, tochki: ['B', 'M'] },
              { id: 'dm', vid: 'otrezok' as const, tochki: ['D', 'M'] },
            ]),
      ],
    };
  } else if (p.vid === 'piramida') {
    sc = {
      id: `PV-R15P-${punkt}`,
      alt: 'Правильная четырёхугольная пирамида, плоскость BDM',
      telo: { vid: 'piramida', n: 4, a, h },
      imena: ['A', 'B', 'C', 'D', 'S'],
      tochki: [
        { imya: 'M', gde: { seredina: ['S', 'C'] }, rol: 'uslovie' },
        { imya: 'O', gde: { seredina: ['A', 'C'] } },
      ],
      elementy: [
        { id: 'bdm', vid: 'treugolnik', tochki: ['B', 'D', 'M'], rol: 'uslovie' },
        { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'] },
        { id: 'om', vid: 'otrezok', tochki: ['O', 'M'] },
        ...(punkt === 'b' ? [{ id: 'so', vid: 'vysota' as const, tochki: ['S', 'O'] }] : []),
      ],
    };
  } else {
    sc = {
      id: `PV-R15T-${punkt}`,
      alt: 'Правильная треугольная призма, сечение ABM',
      telo: { vid: 'prizma', n: 3, a, h },
      imena: ['A', 'B', 'C', 'A1', 'B1', 'C1'],
      tochki: [
        { imya: 'M', gde: { seredina: ['C', 'C1'] }, rol: 'uslovie' },
        { imya: 'K', gde: { seredina: ['A', 'B'] } },
        ...(punkt === 'b' ? [{ imya: 'H', gde: { proekciya: 'C', na: ['K', 'M'] } }] : []),
      ] as Scenariy['tochki'],
      elementy: [
        { id: 'sech', vid: 'treugolnik', tochki: ['A', 'B', 'M'], rol: 'uslovie' },
        { id: 'ck', vid: 'otrezok', tochki: ['C', 'K'] },
        { id: 'km', vid: 'otrezok', tochki: ['K', 'M'] },
        ...(punkt === 'b' ? [{ id: 'ch', vid: 'otrezok' as const, tochki: ['C', 'H'] }] : []),
      ],
    };
  }
  if (punkt === 'b') {
    const s = scenariy(p, 'a');
    return { ...sc, rakurs: s.rakurs, szhatie: s.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyR15(p: PR15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function chertezh(p: PR15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

function sobrat(p: PR15): Chast2Zadacha {
  const ch = chislaR15(p);
  const hT = hTex(p);
  const a = p.a;
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  let podpis = '';
  if (p.vid === 'kvPrizma') {
    const c = ch as { OM2: Rat };
    podpis = 'Площадь сечения';
    uslovie =
      `В правильной четырёхугольной призме $ABCDA_1B_1C_1D_1$ сторона основания равна $${a}$, а боковое ребро равно $${hT}$. Точка $M$ — середина ребра $CC_1$. Через точки $B$, $D$ и $M$ проведена плоскость.\n` +
      'а) Докажите, что сечение призмы этой плоскостью — равнобедренный треугольник.\n' +
      'б) Найдите площадь этого сечения.';
    reshenie = [
      {
        title: 'а) Доказательство',
        risunok: chertezh(p, 'a'),
        lines: [
          'Точка $M$ лежит внутри ребра $CC_1$, поэтому плоскость $BDM$ пересекает призму по треугольнику $BDM$.',
          'Ребро $CC_1$ перпендикулярно основанию, значит, треугольники $BCM$ и $DCM$ прямоугольные с прямым углом $C$. У них $BC=DC$ (основание — квадрат) и катет $CM$ общий, поэтому они равны и $BM=DM$ — {{t:pifagor|по теореме Пифагора}} $BM^2=BC^2+CM^2=DM^2$. Треугольник $BDM$ равнобедренный.',
        ],
      },
      {
        title: 'б) Высота сечения',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $O$ — центр квадрата $ABCD$. {{t:romb-diagonali|Диагонали квадрата перпендикулярны}}: $BD\\perp AC$; кроме того, $BD\\perp CC_1$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности прямой и плоскости}} $BD\\perp(ACC_1)$, поэтому $BD\\perp OM$.`,
          `Это и следует из того, что {{t:ravnobedr-vysota|медиана $MO$ равнобедренного треугольника $BDM$ — его высота}}. {{t:pifagor|По теореме Пифагора}} в треугольнике $OCM$: $OM^2=OC^2+CM^2=\\left(\\dfrac{${a}\\sqrt2}{2}\\right)^2+\\left(\\dfrac{${hT}}{2}\\right)^2=${ratTex(c.OM2)}$.`,
        ],
      },
      {
        title: 'б) Площадь',
        lines: [
          `{{t:ploshchad-treugolnika|Площадь треугольника}} $S=\\dfrac12\\cdot BD\\cdot OM=\\dfrac12\\cdot${a}\\sqrt2\\cdot\\sqrt{${ratTex(c.OM2)}}=${ch.otv}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Равные прямоугольные треугольники', formula: 'BM=DM' },
      { slovo: '$BD$ перпендикулярна плоскости $ACC_1$', formula: 'BD\\perp OM' },
      { slovo: 'Высота сечения по теореме Пифагора', formula: `OM^2=${ratTex(c.OM2)}` },
      { slovo: 'Площадь', formula: `S=${ch.otv}` },
    ];
  } else if (p.vid === 'piramida') {
    const c = ch as { tg2: Rat };
    podpis = 'Угол';
    uslovie =
      `В правильной четырёхугольной пирамиде $SABCD$ сторона основания $ABCD$ равна $${a}$, а высота $SO$ равна $${hT}$. Точка $M$ — середина бокового ребра $SC$.\n` +
      'а) Докажите, что прямая $SA$ параллельна плоскости $BDM$.\n' +
      'б) Найдите угол между плоскостью $BDM$ и плоскостью основания пирамиды.';
    reshenie = [
      {
        title: 'а) Доказательство',
        risunok: chertezh(p, 'a'),
        lines: [
          `Основание высоты правильной пирамиды — центр $O$ квадрата, то есть середина $AC$. В треугольнике $SAC$ отрезок $OM$ соединяет середины сторон $AC$ и $SC$ — это {{t:srednyaya-liniya-treugolnika|средняя линия}}, $OM\\parallel SA$.`,
          `Прямая $OM$ лежит в плоскости $BDM$ ($O$ — середина $BD$), поэтому по {{t:priznak-par-pryamoy-ploskosti|признаку параллельности прямой и плоскости}} $SA\\parallel(BDM)$.`,
        ],
      },
      {
        title: 'б) Линейный угол',
        risunok: chertezh(p, 'b'),
        lines: [
          `{{t:romb-diagonali|Диагонали квадрата перпендикулярны}}: $BD\\perp AC$, а $BD\\perp SO$ (высота перпендикулярна основанию). По {{t:priznak-perp-ploskosti|признаку перпендикулярности}} $BD\\perp(SAC)$, значит, $BD\\perp OM$ и $BD\\perp OC$.`,
          `Плоскости $BDM$ и $ABC$ пересекаются по $BD$, поэтому {{t:ugol-mezhdu-ploskostyami|угол между ними}} равен углу $MOC$. Так как $OM\\parallel SA$, $\\angle MOC=\\angle SAC$.`,
        ],
      },
      {
        title: 'б) Вычисление',
        lines: [
          `В прямоугольном треугольнике $SOA$: $AO=\\dfrac{${a}\\sqrt2}{2}$, $\\operatorname{tg}\\angle SAO=\\dfrac{SO}{AO}$, $\\operatorname{tg}^2\\angle SAO=${ratTex(c.tg2)}$. Искомый угол равен $${ch.otv}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Средняя линия треугольника SAC', formula: 'OM\\parallel SA' },
      { slovo: 'BD перпендикулярна плоскости SAC', formula: 'BD\\perp OM,\\ BD\\perp OC' },
      { slovo: 'Линейный угол равен углу SAC', formula: '\\angle MOC=\\angle SAC' },
      { slovo: 'Тангенс угла', formula: ch.otv },
    ];
  } else {
    const c = ch as { CK2: Rat; CM2: Rat };
    podpis = 'Расстояние';
    uslovie =
      `В правильной треугольной призме $ABCA_1B_1C_1$ сторона основания равна $${a}$, а боковое ребро равно $${hT}$. Точка $M$ — середина ребра $CC_1$.\n` +
      'а) Докажите, что сечение призмы плоскостью $ABM$ — равнобедренный треугольник.\n' +
      'б) Найдите расстояние от точки $C$ до плоскости $ABM$.';
    reshenie = [
      {
        title: 'а) Доказательство',
        risunok: chertezh(p, 'a'),
        lines: [
          'Плоскость $ABM$ пересекает призму по треугольнику $ABM$. Треугольники $ACM$ и $BCM$ прямоугольные с прямым углом $C$ ($CC_1$ перпендикулярно основанию), $AC=BC$, катет $CM$ общий.',
          '{{t:pifagor|По теореме Пифагора}} $AM^2=AC^2+CM^2=BM^2$, значит, $AM=BM$, и треугольник $ABM$ равнобедренный.',
        ],
      },
      {
        title: 'б) Перпендикуляр к плоскости',
        risunok: chertezh(p, 'b'),
        lines: [
          `Пусть $K$ — середина $AB$. {{t:ravnobedr-vysota|Медианы $CK$ и $MK$ равнобедренных треугольников $ABC$ и $ABM$ — высоты}}: $AB\\perp CK$, $AB\\perp MK$. По {{t:priznak-perp-ploskosti|признаку перпендикулярности}} $AB\\perp(CKM)$.`,
          `Проведём в плоскости $CKM$ высоту $CH\\perp KM$. Тогда $CH\\perp AB$, и $CH$ — {{t:rasst-do-ploskosti|перпендикуляр к плоскости}} $ABM$: искомое расстояние равно $CH$.`,
        ],
      },
      {
        title: 'б) Вычисление',
        lines: [
          `$CK^2=\\left(\\dfrac{${a}\\sqrt3}{2}\\right)^2=${ratTex(c.CK2)}$, $CM^2=\\left(\\dfrac{${hT}}{2}\\right)^2=${ratTex(c.CM2)}$. {{t:vysota-pryamougolnogo|В прямоугольном треугольнике $KCM$ высота}} $CH=\\dfrac{CK\\cdot CM}{KM}$, $CH^2=\\dfrac{CK^2\\cdot CM^2}{CK^2+CM^2}=${ratTex(ch.otv2)}$, $CH=${ch.otv}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Равные прямоугольные треугольники', formula: 'AM=BM' },
      { slovo: 'AB перпендикулярна плоскости CKM', formula: 'AB\\perp CK,\\ AB\\perp MK' },
      { slovo: 'Высота прямоугольного треугольника', formula: 'CH=\\frac{CK\\cdot CM}{KM}' },
      { slovo: 'Ответ', formula: ch.otv },
    ];
  }
  return {
    no: 15,
    shablon: 'r15.stereo',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      { bukva: 'б', podpis, pole: { vid: 'chislo', verno: ch.otv.replace(/\\dfrac/g, '\\frac') } },
    ],
    otvet: `б) $${ch.otv}$`,
    reshenie,
    razbor,
    kontrol: { otv: ch.num, otv2: toNumber(ch.otv2) },
  };
}

export const R15_STEREO: Shablon2<PR15> = {
  no: 15,
  prototip:
    'Стереометрия: сечение правильной четырёхугольной призмы через диагональ основания; угол плоскости BDM с основанием пирамиды; расстояние от C до сечения треугольной призмы',
  sobrat,
};
