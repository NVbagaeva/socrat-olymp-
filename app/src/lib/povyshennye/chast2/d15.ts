/**
 * №15 (варианты 7–8): прямая призма ABCDEA₁B₁C₁D₁E₁, в основании
 * пятиугольник: ABCE и OCDE — квадраты, O = AC ∩ BE.
 *
 * Пусть OA = a. Условие а) (треугольник A₁OC₁ равносторонний или
 * AB₁ = AD) задаёт высоту h = a√3; второе из этих равенств доказывается.
 * б) Угол между прямой и плоскостью — в координатах: O — начало,
 * Ox по OC, Oy по OE, Oz вверх; все векторы после деления на a имеют
 * вид (x; y; z√3) с целыми x, y, z, поэтому синус — корень из дроби.
 */

import { chertezhSvg, postroit, sVidom, vybratVid, type Scenariy } from '@/lib/chertezh3';
import { obernut3d } from '@/lib/stereo/zhivoy';
import { rat, sub, type Rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber, type Surd } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

type V3 = readonly [number, number, number];

/** Вершины в единицах (a, a, h). */
const T: Record<string, V3> = {
  O: [0, 0, 0],
  A: [-1, 0, 0],
  B: [0, -1, 0],
  C: [1, 0, 0],
  D: [1, 1, 0],
  E: [0, 1, 0],
  A1: [-1, 0, 1],
  B1: [0, -1, 1],
  C1: [1, 0, 1],
  D1: [1, 1, 1],
  E1: [0, 1, 1],
};

export interface PD15 {
  /** 'tri' — дано: A₁OC₁ равносторонний (а: ρ(D, AB₁) = ρ(B₁, AD)); 'ravn' — дано: AB₁ = AD (а: три расстояния равны). */
  vid: 'tri' | 'ravn';
  /** Прямая б). */
  pr: readonly [string, string];
  /** Плоскость б). */
  pl: readonly [string, string, string];
  /** Что найти. */
  fn: 'sin' | 'cos';
  /** Размер: AB = k√2 или AA₁ = k√3 при OA = k (k² — дробь). */
  dano: 'AB' | 'AA1';
  /** Квадрат OA. */
  a2: number;
}

const vec = (P: string, Q: string): V3 => {
  const p = T[P]!;
  const q = T[Q]!;
  return [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
};

const gcd = (x: number, y: number): number => (y === 0 ? Math.abs(x) : gcd(y, x % y));

/** Нормаль плоскости в виде (√3·n1; √3·n2; n3), целые n, сокращённая. */
export function normalD15(pl: PD15['pl']): V3 {
  const u = vec(pl[0], pl[1]);
  const v = vec(pl[0], pl[2]);
  let n: [number, number, number] = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const g = gcd(gcd(n[0], n[1]), n[2]) || 1;
  n = [n[0] / g, n[1] / g, n[2] / g];
  if (n[2] < 0 || (n[2] === 0 && (n[0] < 0 || (n[0] === 0 && n[1] < 0)))) n = [-n[0], -n[1], -n[2]];
  return n;
}

export function chislaD15(p: PD15) {
  const d = vec(p.pr[0], p.pr[1]);
  const n = normalD15(p.pl);
  const S = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
  const dd = d[0] ** 2 + d[1] ** 2 + 3 * d[2] ** 2;
  const nn = 3 * n[0] ** 2 + 3 * n[1] ** 2 + n[2] ** 2;
  const sin2 = rat(3 * S * S, dd * nn);
  const cos2 = sub(rat(1), sin2);
  const otvet: Surd = sqrtRat(p.fn === 'sin' ? sin2 : cos2);
  return { d, n, S, dd, nn, sin2, cos2, otvet };
}

const kTex = (v: number) => (v === 0 ? '0' : v === 1 ? 'a' : v === -1 ? '-a' : `${v}a`);
const hTex = (v: number) =>
  v === 0 ? '0' : v === 1 ? 'a\\sqrt3' : v === -1 ? '-a\\sqrt3' : `${v}a\\sqrt3`;
const pTex = (P: string) => {
  const t = T[P]!;
  const im = P.replace(/(\d)/, '_$1');
  return `${im}\\left(${kTex(t[0])};\\,${kTex(t[1])};\\,${hTex(t[2])}\\right)`;
};
const imTex = (P: string) => P.replace(/(\d)/, '_$1');
const v3Tex = (v: V3, s3: boolean) =>
  `\\left(${v[0]};\\,${v[1]};\\,${s3 ? (v[2] === 0 ? '0' : `${v[2] === 1 ? '' : v[2] === -1 ? '-' : v[2]}\\sqrt3`) : v[2]}\\right)`;
const nTex = (n: V3) => {
  const f = (x: number) => (x === 0 ? '0' : `${x === 1 ? '' : x === -1 ? '-' : x}\\sqrt3`);
  return `\\left(${f(n[0])};\\,${f(n[1])};\\,${n[2]}\\right)`;
};

function scenariy(p: PD15, punkt: 'a' | 'b'): Scenariy {
  const h = Math.sqrt(3);
  const sc: Scenariy = {
    id: `PV-D15-${punkt}`,
    alt:
      punkt === 'a'
        ? 'Прямая призма над пятиугольником ABCDE, треугольники A1OC1 и AB1D'
        : 'Прямая призма над пятиугольником ABCDE, прямая и плоскость пункта б',
    telo: {
      vid: 'pryamaya-prizma',
      osnovanie: [
        [-1, 0],
        [0, -1],
        [1, 0],
        [1, 1],
        [0, 1],
      ],
      h,
    },
    imena: ['A', 'B', 'C', 'D', 'E', 'A1', 'B1', 'C1', 'D1', 'E1'],
    tochki: [{ imya: 'O', gde: { seredina: ['A', 'C'] }, rol: 'uslovie' }],
    elementy:
      punkt === 'a'
        ? [
            { id: 'ac', vid: 'diagonal', tochki: ['A', 'C'], rol: 'uslovie' },
            { id: 'be', vid: 'diagonal', tochki: ['B', 'E'], rol: 'uslovie' },
            {
              id: 'tri',
              vid: 'treugolnik',
              tochki: ['A1', 'O', 'C1'],
              rol: p.vid === 'tri' ? 'uslovie' : undefined,
            },
            {
              id: 'abd',
              vid: 'treugolnik',
              tochki: ['A', 'B1', 'D'],
              rol: p.vid === 'ravn' ? 'uslovie' : undefined,
            },
          ]
        : [
            { id: 'pr', vid: 'otrezok', tochki: [p.pr[0], p.pr[1]], rol: 'uslovie' },
            { id: 'pl', vid: 'ploskost', tochki: [p.pl[0], p.pl[1], p.pl[2]], rol: 'uslovie' },
          ],
  };
  if (punkt === 'b') {
    const a = scenariy(p, 'a');
    return { ...sc, rakurs: a.rakurs, szhatie: a.szhatie };
  }
  return sVidom(sc, vybratVid(postroit(sc)));
}

export function scenariyD15(p: PD15, punkt: 'a' | 'b'): Scenariy {
  return scenariy(p, punkt);
}

function sobrat(p: PD15): Chast2Zadacha {
  const c = chislaD15(p);
  if (c.S === 0) throw new Error('d15: прямая параллельна плоскости');
  const otv = surdTex(c.otvet);
  const a = sqrtRat(rat(p.a2));
  const danoVal =
    p.dano === 'AB' ? surdTex(sqrtRat(rat(2 * p.a2))) : surdTex(sqrtRat(rat(3 * p.a2)));
  const danoTxt = p.dano === 'AB' ? `AB=${danoVal}` : `AA_1=${danoVal}`;
  const fnTxt = p.fn === 'sin' ? 'синус' : 'косинус';
  const uslovie =
    `Основанием прямой призмы $ABCDEA_1B_1C_1D_1E_1$ является пятиугольник $ABCDE$, в котором $ABCE$ и $OCDE$ — квадраты, где точка $O$ — пересечение прямых $AC$ и $BE$. ` +
    (p.vid === 'tri'
      ? 'Треугольник $A_1OC_1$ равносторонний.\n'
      : 'Треугольник $AB_1D$ равнобедренный с основанием $B_1D$.\n') +
    (p.vid === 'tri'
      ? 'а) Докажите, что расстояния от точки $D$ до прямой $AB_1$ и от точки $B_1$ до прямой $AD$ равны.\n'
      : 'а) Докажите, что расстояния от точки $O$ до прямой $A_1C_1$, от точки $A_1$ до прямой $OC_1$ и от точки $C_1$ до прямой $OA_1$ равны.\n') +
    `б) Найдите ${fnTxt} угла между прямой $${imTex(p.pr[0])}${imTex(p.pr[1])}$ и плоскостью $${p.pl.map(imTex).join('')}$, если $${danoTxt}$.`;

  const obshchee = `Диагонали квадрата $ABCE$ {{t:romb-diagonali|перпендикулярны и точкой пересечения делятся пополам}}, и они равны: $OA=OB=OC=OE=a$, $AC=2a$. Сторона квадрата $OCDE$ равна $a$, $CD\\perp OC$, поэтому $CD\\perp AC$.`;
  const bokovye = `Боковые рёбра прямой призмы перпендикулярны основанию, пусть $AA_1=h$.`;
  const etapA =
    p.vid === 'tri'
      ? [
          `${obshchee} ${bokovye}`,
          `По {{t:pifagor|теореме Пифагора}} $OA_1^2=OA^2+AA_1^2=a^2+h^2$, а $A_1C_1=AC=2a$. Треугольник $A_1OC_1$ равносторонний: $a^2+h^2=4a^2$, $h^2=3a^2$.`,
          `Тогда $AB_1^2=AB^2+BB_1^2=2a^2+3a^2=5a^2$, а в прямоугольном треугольнике $ACD$: $AD^2=AC^2+CD^2=4a^2+a^2=5a^2$. Значит, $AB_1=AD$.`,
          `Искомые расстояния — высоты треугольника $AB_1D$, проведённые к равным сторонам $AB_1$ и $AD$. {{t:ploshchad-treugolnika|Высота равна удвоенной площади, делённой на сторону}}, поэтому они равны.`,
        ]
      : [
          `${obshchee} ${bokovye}`,
          `По {{t:pifagor|теореме Пифагора}} $AB_1^2=AB^2+h^2=2a^2+h^2$ и $AD^2=AC^2+CD^2=5a^2$. Из $AB_1=AD$ получаем $h^2=3a^2$.`,
          `Тогда $OA_1^2=OA^2+h^2=4a^2$, $OC_1^2=4a^2$, $A_1C_1=AC=2a$: треугольник $OA_1C_1$ равносторонний.`,
          `Искомые расстояния — высоты равностороннего треугольника, проведённые к его равным сторонам; {{t:ploshchad-treugolnika|высота равна удвоенной площади, делённой на сторону}}, поэтому они равны.`,
        ];

  const u = vec(p.pl[0], p.pl[1]);
  const v = vec(p.pl[0], p.pl[2]);
  const im = (P: string) => imTex(P);
  return {
    no: 15,
    shablon: 'd15.prizmaPyatiugolnik',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.fn === 'sin' ? 'Синус угла' : 'Косинус угла',
        pole: { vid: 'chislo', verno: otv.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otv}$`,
    reshenie: [
      { title: 'а) Высота призмы', risunok: chertezhD15(p, 'a'), lines: etapA.slice(0, 2) },
      { title: 'а) Равные отрезки и высоты', lines: etapA.slice(2) },
      {
        title: 'б) Координаты',
        risunok: chertezhD15(p, 'b'),
        lines: [
          `По пункту а) $h=a\\sqrt3$, а $OA=a$: ${p.dano === 'AB' ? `$AB=a\\sqrt2=${danoVal}$` : `$AA_1=a\\sqrt3=${danoVal}$`}, $a=${surdTex(a)}$. Угол от размеров не зависит, поэтому пишем координаты через $a$.`,
          `Начало — в точке $O$, ось $Ox$ — по лучу $OC$, $Oy$ — по лучу $OE$, $Oz$ — вверх. Тогда $${[
            p.pr[0],
            p.pr[1],
            ...p.pl,
          ]
            .filter((x, i, arr) => arr.indexOf(x) === i)
            .map(pTex)
            .join(',\\ ')}$.`,
        ],
      },
      {
        title: 'б) Направляющий вектор и нормаль',
        lines: [
          `$\\overrightarrow{${im(p.pr[0])}${im(p.pr[1])}}=a${v3Tex(c.d, true)}$, направляющий вектор $\\vec d=${v3Tex(c.d, true)}$.`,
          `В плоскости $${p.pl.map(im).join('')}$: $\\overrightarrow{${im(p.pl[0])}${im(p.pl[1])}}=a${v3Tex(u, true)}$, $\\overrightarrow{${im(p.pl[0])}${im(p.pl[2])}}=a${v3Tex(v, true)}$. Вектор $\\vec n=${nTex(c.n)}$ перпендикулярен обоим (скалярные произведения равны нулю) — это нормаль плоскости.`,
        ],
      },
      {
        title: 'б) Угол',
        lines: [
          `{{t:ugol-pryamoy-ploskost|Угол между прямой и плоскостью}} $\\varphi$ дополняет до $90^\\circ$ угол между прямой и нормалью: $\\sin\\varphi=\\dfrac{|\\vec d\\cdot\\vec n|}{|\\vec d|\\cdot|\\vec n|}=\\dfrac{${Math.abs(c.S)}\\sqrt3}{\\sqrt{${c.dd}}\\cdot\\sqrt{${c.nn}}}=${surdTex(sqrtRat(c.sin2))}$.`,
          ...(p.fn === 'cos'
            ? [`$\\cos\\varphi=\\sqrt{1-\\sin^2\\varphi}=${otv}$ (угол острый).`]
            : []),
        ],
      },
    ],
    razbor: [
      { slovo: 'а) Находим высоту призмы через сторону $OA=a$', formula: 'h=a\\sqrt3' },
      {
        slovo: 'а) Равные стороны — равные высоты',
        formula: p.vid === 'tri' ? 'AB_1=AD' : 'OA_1=OC_1=A_1C_1',
      },
      { slovo: 'б) Вводим координаты и нормаль плоскости', formula: `\\vec n=${nTex(c.n)}` },
      { slovo: `б) Считаем ${fnTxt} угла`, formula: otv },
    ],
    kontrol: { S: c.S, dd: c.dd, nn: c.nn, otvet: surdToNumber(c.otvet), a2: p.a2 },
  };
}

export function chertezhD15(p: PD15, punkt: 'a' | 'b'): string {
  /* На экране чертёж решения вращается руками (lib/stereo/zhivoy.ts). */
  return obernut3d(
    chertezhSvg(scenariy(p, punkt), { rezhim: 'uchitel', shirina: 300, klass: 'ch3-svg' }),
    { sc: scenariy(p, punkt), vspom: true },
  );
}

void ({} as Rat);

export const D15_PRIZMA_PYATIUGOLNIK: Shablon2<PD15> = {
  no: 15,
  prototip:
    'Призма над пятиугольником из двух квадратов: равные расстояния, угол прямой и плоскости координатами',
  sobrat,
};
