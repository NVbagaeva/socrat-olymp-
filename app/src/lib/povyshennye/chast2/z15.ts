/**
 * №15: пирамида SABCD, основание — ромб, высота SO (O — центр ромба).
 * На ребре SC точка K, прямая DK образует с основанием угол φ.
 * а) Докажите SK : KC = (1 − k) : k. б) Расстояние между DK и BC.
 *
 * Как в образце, высота связана с основанием так, что h = OC·tg φ:
 * тогда в уравнении на k квадраты сокращаются и k = (OC² + OD²)/(2·OC²)
 * находится линейным уравнением. Основание задаётся углом 120° и
 * стороной или двумя диагоналями.
 *
 * Все длины — корни из дробей (ядро №15): ответ б) — точное число.
 * Чертежи — к решению (в условии, как на экзамене, чертежа нет).
 */

import { chertezhSvg, sVidom, vybratVid, postroit, type Scenariy } from '@/lib/chertezh3';
import {
  add,
  div,
  isZero,
  mul,
  neg,
  rat,
  sub,
  toNumber,
  type Rat,
} from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import { ratTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** tg²φ для 30°, 45°, 60°. */
const TG2: Record<number, Rat> = { 30: rat(1, 3), 45: rat(1), 60: rat(3) };

export type P15 =
  /**
   * Ромб с углом ABC = 120° и стороной √a2. h2 — квадрат высоты SO
   * дробью [числитель, знаменатель]; без него SO = OC·tg φ, и уравнение
   * на k линейное (вариант 1). С ним — квадратное (вариант 2).
   */
  | { osn: 'ugol'; a2: number; phi: 30 | 45 | 60; h2?: readonly [number, number] }
  /** Ромб с диагоналями AC = 2c, BD = 2d (c > d). */
  | { osn: 'diag'; ac: number; bd: number; phi: 30 | 45 | 60 };

const kor = (x: Rat) => surdTex(sqrtRat(x));

export function chisla15(p: P15) {
  const c2 = p.osn === 'ugol' ? mul(rat(3, 4), rat(p.a2)) : rat(p.ac * p.ac, 4);
  const d2 = p.osn === 'ugol' ? mul(rat(1, 4), rat(p.a2)) : rat(p.bd * p.bd, 4);
  const a2 = add(c2, d2);
  const t = TG2[p.phi]!;
  const zadana = p.osn === 'ugol' && p.h2 !== undefined;
  const h2 = zadana ? rat(p.h2![0], p.h2![1]) : mul(t, c2);
  /* k²h² = t(d² + c²(1 − k)²): (h² − tc²)k² + 2tc²·k − t(c² + d²) = 0. */
  const kvA = sub(h2, mul(t, c2));
  const kvB = mul(rat(2), mul(t, c2));
  const kvC = neg(mul(t, a2));
  let korni: Rat[];
  if (isZero(kvA)) {
    korni = [div(neg(kvC), kvB)];
  } else {
    const disk = sub(mul(kvB, kvB), mul(rat(4), mul(kvA, kvC)));
    const kd = sqrtRat(disk);
    if (kd.m !== 1n) throw new Error('z15: k иррационально');
    korni = [-1, 1].map((z) => div(add(neg(kvB), mul(rat(z), kd.k)), mul(rat(2), kvA)));
  }
  const vRebre = korni.filter((r) => toNumber(r) > 0 && toNumber(r) < 1);
  if (vRebre.length !== 1) throw new Error('z15: точка K на ребре не одна');
  const k = vRebre[0]!;
  const on2 = div(mul(c2, d2), a2);
  const fn2 = mul(rat(4), on2);
  const et2 = mul(mul(k, k), h2);
  const dk = sub(rat(2), k);
  const nt2 = mul(mul(dk, dk), on2);
  const en2 = add(et2, nt2);
  const fh2 = div(mul(et2, fn2), en2);
  return { c2, d2, a2, t, h2, k, on2, fn2, et2, nt2, en2, fh2, kvA, kvB, kvC, korni };
}

/** Ak² + Bk + C в TeX без «+ −» и единичных множителей. */
function kvadrat(A: Rat, B: Rat, C: Rat): string {
  const chlen = (q: Rat, x: string, first: boolean) => {
    if (isZero(q)) return '';
    const neg = q.n < 0n;
    const mod = neg ? rat(-q.n, q.d) : q;
    const one = mod.n === 1n && mod.d === 1n && x !== '';
    const body = `${one ? '' : ratTex(mod)}${x}`;
    return `${neg ? '-' : first ? '' : '+'}${body}`;
  };
  return chlen(A, 'k^2', true) + chlen(B, 'k', false) + chlen(C, '', false);
}

/** Отношение (1 − k) : k несократимыми целыми. */
function otnoshenie(k: Rat): [bigint, bigint] {
  const sk = sub(rat(1), k);
  /* sk = (d − n)/d, k = n/d — общий знаменатель. */
  const a = sk.n * k.d;
  const b = k.n * sk.d;
  const g = gcd(a, b);
  return [a / g, b / g];
}
function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

/** Описание чертежей для голосового доступа (обычный текст, без формул). */
const ALT_15 = {
  a: {
    alt: 'Пирамида SABCD с ромбом в основании, высота SO, точка K на ребре SC, проекция P точки K на основание',
  },
  b: {
    alt: 'Пирамида SABCD, общий перпендикуляр: прямая FN через центр ромба, точка E на SF, высота FH треугольника FNE',
  },
} as const;

/** Сценарий чертежа: ученику — пирамида, K и DK; учителю — построения пункта. */
function scenariy(p: P15, punkt: 'a' | 'b'): Scenariy {
  const n = chisla15(p);
  const c = Math.sqrt(toNumber(n.c2));
  const d = Math.sqrt(toNumber(n.d2));
  const h = Math.sqrt(toNumber(n.h2));
  const k = toNumber(n.k);
  const sc: Scenariy = {
    id: `PV-15-${punkt}`,
    alt: ALT_15[punkt].alt,
    telo: {
      vid: 'piramida-proizv',
      osnovanie: [
        [-c, 0],
        [0, -d],
        [c, 0],
        [0, d],
      ],
      vershina: [0, 0, h],
    },
    imena: ['A', 'D', 'C', 'B', 'S'],
    tochki: [
      { imya: 'O', gde: { seredina: ['A', 'C'] }, rol: 'uslovie' },
      { imya: 'K', gde: { naOtrezke: ['C', 'S', k] }, rol: 'uslovie' },
      ...(punkt === 'a'
        ? [{ imya: 'P', gde: { proekciya: 'K', na: ['A', 'B', 'C'] } }]
        : [
            { imya: 'N', gde: { proekciya: 'O', na: ['A', 'D'] } },
            { imya: 'F', gde: { proekciya: 'O', na: ['B', 'C'] } },
            { imya: 'E', gde: { naOtrezke: ['F', 'S', k] } },
            { imya: 'H', gde: { proekciya: 'F', na: ['N', 'E'] } },
          ]),
    ] as Scenariy['tochki'],
    elementy: [
      { id: 'so', vid: 'vysota', tochki: ['S', 'O'], rol: 'uslovie' },
      { id: 'dk', vid: 'otrezok', tochki: ['D', 'K'], rol: 'uslovie' },
      ...(punkt === 'a'
        ? [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'], rol: 'uslovie' },
            { id: 'bd', vid: 'diagonal', tochki: ['B', 'D'], rol: 'uslovie' },
            { id: 'kp', vid: 'otrezok', tochki: ['K', 'P'] },
            { id: 'dp', vid: 'otrezok', tochki: ['D', 'P'] },
            { id: 'ugol', vid: 'ugol', tochki: ['K', 'D', 'P'] },
          ]
        : [
            { id: 'fn', vid: 'otrezok', tochki: ['F', 'N'] },
            { id: 'sf', vid: 'otrezok', tochki: ['S', 'F'] },
            { id: 'ek', vid: 'otrezok', tochki: ['E', 'K'] },
            { id: 'ne', vid: 'otrezok', tochki: ['N', 'E'] },
            /* Высота FH может упасть на продолжение NE (тупой угол E). */
            { id: 'eh', vid: 'otrezok', tochki: ['E', 'H'] },
            { id: 'ak', vid: 'otrezok', tochki: ['A', 'K'] },
            { id: 'fh', vid: 'otrezok', tochki: ['F', 'H'] },
            { id: 'pr', vid: 'pryamoy-ugol', tochki: ['F', 'H', 'E'] },
          ]),
    ] as Scenariy['elementy'],
    proverki: [
      {
        otnoshenie: [
          ['S', 'K'],
          ['K', 'C'],
        ],
        ravno: (1 - k) / k,
      },
    ],
  };
  /* Ракурс — по чертежу пункта а: оба чертежа решения смотрят на
     пирамиду одинаково, а построения пункта б не уводят вид вбок. */
  if (punkt === 'b') {
    const a = scenariy(p, 'a');
    return { ...sc, rakurs: a.rakurs, szhatie: a.szhatie };
  }
  const vid = vybratVid(postroit(sc));
  return sVidom(sc, vid);
}

export function chertezh15(p: P15, punkt: 'a' | 'b'): string {
  return chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' });
}

export function scenariy15(p: P15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function sobrat(p: P15): Chast2Zadacha {
  const n = chisla15(p);
  if (!(toNumber(n.k) > 0 && toNumber(n.k) < 1)) throw new Error('z15: точка K не на ребре');
  const [o1, o2] = otnoshenie(n.k);
  const h = kor(n.h2);
  const phi = `${p.phi}^\\circ`;
  const osnText =
    p.osn === 'ugol'
      ? `ромб $ABCD$, в котором $\\angle ABC=120^\\circ$ и $AB=${kor(rat(p.a2))}$`
      : `ромб $ABCD$ с диагоналями $AC=${p.ac}$ и $BD=${p.bd}$`;
  const uslovie =
    `Основание пирамиды $SABCD$ — ${osnText}. Высота пирамиды $SO$ равна $${h}$, где $O$ — точка пересечения диагоналей основания. ` +
    `На ребре $SC$ отмечена точка $K$ такая, что прямая $DK$ образует с плоскостью основания угол $${phi}$.\n` +
    `а) Докажите, что $SK:KC=${o1}:${o2}$.\n` +
    `б) Найдите расстояние между прямыми $DK$ и $BC$.`;

  const c = kor(n.c2);
  const d = kor(n.d2);
  const a = kor(n.a2);
  const kT = ratTex(n.k);
  const otvet = kor(n.fh2);

  const razmery =
    p.osn === 'ugol'
      ? [
          `В ромбе $\\angle BAD=180^\\circ-120^\\circ=60^\\circ$ и $AB=AD$, поэтому треугольник $ABD$ равносторонний: $BD=AB=${a}$, $OD=${d}$.`,
          `{{t:romb-diagonali|Диагонали ромба перпендикулярны и делятся точкой пересечения пополам}}, поэтому по {{t:pifagor|теореме Пифагора}} в треугольнике $AOD$: $OC=OA=\\sqrt{AD^2-OD^2}=${c}$.`,
        ]
      : [
          `{{t:romb-diagonali|Диагонали ромба перпендикулярны и делятся точкой пересечения пополам}}: $OC=OA=${c}$, $OD=OB=${d}$.`,
          `По {{t:pifagor|теореме Пифагора}} в треугольнике $AOD$: $AD=\\sqrt{OA^2+OD^2}=${a}$.`,
        ];

  const t = n.t;
  const h2 = n.h2;
  const lev = ratTex(h2);
  const svobod = add(mul(t, n.d2), h2);
  /* tg 45° = 1: множитель и скобки не пишем. */
  const odin = t.n === 1n && t.d === 1n;

  return {
    no: 15,
    shablon: 'z15.rombPiramida',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: 'Расстояние',
        pole: { vid: 'chislo', verno: otvet.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvet}$`,
    reshenie: [
      { title: 'Размеры основания', lines: razmery },
      {
        title: 'а) Угол между DK и основанием',
        risunok: chertezh15(p, 'a'),
        lines: [
          `Пусть $P$ — проекция точки $K$ на плоскость основания. Прямая $KP$ параллельна $SO$, а $SO$ перпендикулярна основанию, поэтому и $KP\\perp(ABC)$ — {{t:perp-parallel|если одна из двух параллельных прямых перпендикулярна плоскости, то и другая}}. Точка $P$ лежит на $OC$: прямые $KP$ и $SO$ лежат в одной плоскости $SOC$.`,
          `$DP$ — проекция $DK$ на основание, поэтому {{t:ugol-pryamoy-ploskost|угол между прямой и плоскостью}} — это $\\angle KDP=${phi}$, и $KP=PD\\cdot\\operatorname{tg}${phi}$.`,
        ],
      },
      {
        title: 'а) Выражаем отрезки через $k$',
        lines: [
          `Пусть $\\dfrac{CK}{CS}=k$. Прямоугольные треугольники $CKP$ и $CSO$ {{t:podobie-uu|подобны по двум углам}} (угол $C$ общий), поэтому $KP=k\\cdot SO$, $CP=k\\cdot OC$, $OP=(1-k)\\,OC$.`,
          `$OD\\perp OC$, и по теореме Пифагора в треугольнике $DOP$: $PD^2=OD^2+OP^2=${ratTex(n.d2)}+${ratTex(n.c2)}(1-k)^2$.`,
        ],
      },
      {
        title: 'а) Находим $k$',
        lines: [
          `Из $KP^2=PD^2\\operatorname{tg}^2${phi}$: $${lev}k^2=${odin ? '' : `${ratTex(t)}\\left(`}${ratTex(n.d2)}+${ratTex(n.c2)}(1-k)^2${odin ? '' : '\\right)'}$.`,
          isZero(n.kvA)
            ? `Раскрываем скобки: $${lev}k^2=${ratTex(svobod)}-${ratTex(mul(rat(2), h2))}k+${lev}k^2$, откуда $k=${kT}$.`
            : `Раскрываем скобки и приводим подобные: $${kvadrat(n.kvA, n.kvB, n.kvC)}=0$. Корни: ${n.korni
                .map((r) => `$k=${ratTex(r)}$`)
                .join(' и ')}. Точка $K$ лежит на ребре, поэтому $0<k<1$, и $k=${kT}$.`,
          `Значит, $CK=${kT}\\,CS$ и $SK:KC=${o1}:${o2}$, что и требовалось доказать.`,
        ],
      },
      {
        title: 'б) Сводим к расстоянию от точки до плоскости',
        risunok: chertezh15(p, 'b'),
        lines: [
          `$BC\\parallel AD$, а $AD$ лежит в плоскости $ADK$, поэтому $BC\\parallel(ADK)$ — {{t:priznak-par-pryamoy-ploskosti|признак параллельности прямой и плоскости}}.`,
          `Значит, {{t:rasst-skreshch|расстояние между скрещивающимися прямыми}} $DK$ и $BC$ равно расстоянию от любой точки прямой $BC$ до плоскости $ADK$.`,
        ],
      },
      {
        title: 'б) Строим перпендикуляр к плоскости ADK',
        lines: [
          `Через $O$ в плоскости основания проведём прямую, перпендикулярную $AD$; она пересекает $AD$ в точке $N$ и $BC$ в точке $F$ (так как $BC\\parallel AD$, то и $FN\\perp BC$), причём $OF=ON$.`,
          `Плоскость $ADK$ проходит через прямую $AD\\parallel(SBC)$ и пересекает плоскость $SBC$ по прямой $KE\\parallel BC$, где $E$ — точка на $SF$ ({{t:sled-par-ploskosti|линия пересечения параллельна прямой}}).`,
          `$AD\\perp FN$ и $AD\\perp SO$, значит, $AD\\perp(SFN)$ — {{t:priznak-perp-ploskosti|признак перпендикулярности прямой и плоскости}}. Пусть $FH$ — высота треугольника $FNE$. Тогда $FH\\perp NE$ и $FH\\perp AD$, то есть $FH\\perp(ADK)$, и искомое расстояние равно $FH$.`,
        ],
      },
      {
        title: 'б) Вычисляем FH',
        lines: [
          `$ON$ — высота прямоугольного треугольника $AOD$, проведённая к гипотенузе: $ON=\\dfrac{OA\\cdot OD}{AD}=${kor(n.on2)}$, $FN=2\\,ON=${kor(n.fn2)}$.`,
          `$KE\\parallel CF$, поэтому $\\dfrac{FE}{FS}=\\dfrac{CK}{CS}=${kT}$. Пусть $T$ — проекция $E$ на основание; $T$ лежит на $FO$, $ET=${kT}\\,SO=${kor(n.et2)}$, $FT=${kT}\\,FO$, $NT=FN-FT=${kor(n.nt2)}$.`,
          `По теореме Пифагора $EN=\\sqrt{ET^2+NT^2}=${kor(n.en2)}$.`,
          `{{t:ploshchad-treugolnika|Площадь треугольника}} $FNE$ равна $\\dfrac12 FN\\cdot ET=\\dfrac12 EN\\cdot FH$, откуда $FH=\\dfrac{FN\\cdot ET}{EN}=${otvet}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Находим половины диагоналей ромба', formula: `OC=${c},\\ OD=${d}` },
      {
        slovo: 'Проекция $K$ лежит на $OC$, угол $KDP$ — данный',
        formula: `KP=PD\\operatorname{tg}${phi}`,
      },
      {
        slovo: 'Пусть $CK=k\\cdot CS$; из подобия $KP$ и $OP$ выражаются через $k$',
        formula: `KP=k\\cdot ${h},\\ OP=(1-k)\\cdot ${c}`,
      },
      {
        slovo: 'Уравнение на $k$ линейное — квадраты сокращаются',
        formula: `k=${kT},\\ SK:KC=${o1}:${o2}`,
      },
      {
        slovo: '$BC\\parallel(ADK)$: ищем расстояние от точки $F$ прямой $BC$ до плоскости $ADK$',
        formula: 'FH\\perp(ADK)',
      },
      {
        slovo: 'Считаем FH через площадь треугольника FNE',
        formula: `FH=\\dfrac{FN\\cdot ET}{EN}=${otvet}`,
      },
    ],
    kontrol: {
      k: toNumber(n.k),
      h: Math.sqrt(toNumber(n.h2)),
      otvet: Math.sqrt(toNumber(n.fh2)),
      c: Math.sqrt(toNumber(n.c2)),
      d: Math.sqrt(toNumber(n.d2)),
      phi: p.phi,
    },
  };
}

export const Z15_ROMB_PIRAMIDA: Shablon2<P15> = {
  no: 15,
  prototip:
    'Пирамида над ромбом: точка на боковом ребре по углу с основанием; расстояние между скрещивающимися прямыми',
  sobrat,
};
