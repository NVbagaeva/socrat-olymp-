/**
 * №18 (варианты 25–26): в параллелограмме ABCD биссектрисы углов A и D
 * пересекаются в точке K стороны BC.
 *
 * а) ∠BKA = ∠KAD = ∠BAK (накрест лежащие, AK — биссектриса) ⇒ AB = BK;
 *    так же CD = CK ⇒ BC = 2AB.
 * б) ∠A + ∠D = 180° ⇒ ∠KAD + ∠KDA = 90°, треугольник AKD прямоугольный,
 *    AD = 2a. AK : KD = m : n, m² + n² = k²: AK = 2am/k, KD = 2an/k.
 *    «r» — радиус вписанной окружности AKD: r = (AK + KD − AD)/2 = a(m + n − k)/k;
 *    «S» — площадь ABCD = 2·S(AKD) = AK·KD = 4a²mn/k².
 */

import { renderPlan } from '@/lib/planimetriya/render';
import type { Element } from '@/lib/planimetriya/types';
import { div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN18 {
  /** AB = a. */
  a: number;
  /** AK : KD = m : n, m² + n² — квадрат. */
  m: number;
  n: number;
  nado: 'r' | 'S';
}

export function chislaN18(p: PN18) {
  const k = Math.round(Math.sqrt(p.m * p.m + p.n * p.n));
  if (k * k !== p.m * p.m + p.n * p.n) throw new Error('n18: m² + n² не квадрат');
  const a = rat(p.a);
  const AK = div(mul(rat(2 * p.m), a), rat(k));
  const KD = div(mul(rat(2 * p.n), a), rat(k));
  const r = div(mul(a, rat(p.m + p.n - k)), rat(k));
  const S = mul(AK, KD);
  return { k, AK, KD, r, S };
}

function chertezh(p: PN18, punkt: 'a' | 'b'): string {
  const ch = chislaN18(p);
  const s = 2;
  /* ∠KAD = α/2, cos(α/2) = m/k. */
  const al = 2 * Math.acos(p.m / ch.k);
  const A: [number, number] = [0, 0];
  const D: [number, number] = [2 * s, 0];
  const B: [number, number] = [s * Math.cos(al), s * Math.sin(al)];
  const C: [number, number] = [B[0] + 2 * s, B[1]];
  const K: [number, number] = [B[0] + s, B[1]];
  const tochki: Record<string, [number, number]> = { A, B, C, D, K };
  const okr: Record<string, { centr: string; radius: number }> = {};
  const el: Element[] = [
    { tip: 'mnogougolnik', tochki: ['A', 'B', 'C', 'D'] },
    { tip: 'otrezok', a: 'A', b: 'K' },
    { tip: 'otrezok', a: 'D', b: 'K' },
    { tip: 'tochka', t: 'K' },
  ];
  if (punkt === 'b') {
    el.push({ tip: 'ugol', a: 'A', v: 'K', b: 'D', pryamoy: true });
    if (p.nado === 'r') {
      const AKd = Math.hypot(K[0], K[1]);
      const KDd = Math.hypot(D[0] - K[0], D[1] - K[1]);
      const ADd = 2 * s;
      const per = AKd + KDd + ADd;
      tochki.I = [
        (KDd * A[0] + ADd * K[0] + AKd * D[0]) / per,
        (KDd * A[1] + ADd * K[1] + AKd * D[1]) / per,
      ];
      okr.w = { centr: 'I', radius: (AKd + KDd - ADd) / 2 };
      el.push({ tip: 'okruzhnost', okr: 'w', sloy: 'reshenie' });
    }
  }
  return renderPlan(
    {
      tochki,
      okruzhnosti: okr,
      elementy: el,
      podpisi: ['A', 'B', 'C', 'D', 'K'],
    },
    {
      rezhim: { rezhim: 'uchitel' },
      shirina: 300,
      vysota: 200,
      alt: 'Параллелограмм ABCD, биссектрисы углов A и D пересекаются в точке K на стороне BC',
    },
  );
}

function sobrat(p: PN18): Chast2Zadacha {
  const ch = chislaN18(p);
  const otv = p.nado === 'r' ? ch.r : ch.S;
  const otvT = ratTex(otv);
  const uslovie =
    `Биссектрисы углов $A$ и $D$ параллелограмма $ABCD$ пересекаются в точке $K$, лежащей на стороне $BC$.\n` +
    `а) Докажите, что $BC=2AB$.\n` +
    `б) Найдите ${p.nado === 'r' ? 'радиус окружности, вписанной в треугольник $AKD$' : 'площадь параллелограмма $ABCD$'}, если $AB=${p.a}$ и $AK:KD=${p.m}:${p.n}$.`;
  const bLast =
    p.nado === 'r'
      ? `Радиус окружности, вписанной в прямоугольный треугольник, равен полуразности суммы катетов и гипотенузы (отрезки {{t:kasatelnye-otrezki|касательных}} из вершины прямого угла равны радиусу): $r=\\dfrac{AK+KD-AD}{2}=\\dfrac{${ratTex(ch.AK)}+${ratTex(ch.KD)}-${2 * p.a}}{2}=${otvT}$.`
      : `Треугольник $AKD$ и параллелограмм имеют общее основание $AD$ и одну высоту, поэтому $S_{ABCD}=2S_{AKD}=AK\\cdot KD$ ({{t:ploshchad-treugolnika|площадь прямоугольного треугольника}}): $S_{ABCD}=${ratTex(ch.AK)}\\cdot ${ratTex(ch.KD)}=${otvT}$.`;
  return {
    no: 18,
    shablon: 'n18.parallBiss',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: null },
      {
        bukva: 'б',
        podpis: p.nado === 'r' ? 'Радиус' : 'Площадь',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `б) $${otvT}$`,
    reshenie: [
      {
        title: 'а) Равнобедренные треугольники',
        risunok: chertezh(p, 'a'),
        lines: [
          `$AD\\parallel BC$, $AK$ — секущая: $\\angle BKA=\\angle KAD$ ({{t:nakrest-ugly|накрест лежащие углы}}). $AK$ — биссектриса: $\\angle KAD=\\angle BAK$. Значит, $\\angle BKA=\\angle BAK$, и треугольник $ABK$ {{t:ravnobedr-ugly|равнобедренный}}: $BK=AB$.`,
          `Точно так же $\\angle CKD=\\angle KDA=\\angle CDK$, треугольник $CDK$ равнобедренный: $CK=CD=AB$.`,
          `$BC=BK+KC=2AB$, что и требовалось доказать.`,
        ],
      },
      {
        title: 'б) Прямой угол',
        risunok: chertezh(p, 'b'),
        lines: [
          `Сумма соседних углов параллелограмма равна $180^\\circ$, их половины в сумме дают $90^\\circ$: $\\angle KAD+\\angle KDA=90^\\circ$, поэтому $\\angle AKD=90^\\circ$.`,
          `По пункту а) $AD=BC=2AB=${2 * p.a}$. Пусть $AK=${p.m}x$, $KD=${p.n}x$; по {{t:pifagor|теореме Пифагора}} $${p.m * p.m}x^2+${p.n * p.n}x^2=${4 * p.a * p.a}$, $x=\\dfrac{${2 * p.a}}{${ch.k}}$.`,
          `$AK=${ratTex(ch.AK)}$, $KD=${ratTex(ch.KD)}$.`,
        ],
      },
      { title: 'б) Ответ', lines: [bLast, `Ответ: $${otvT}$.`] },
    ],
    razbor: [
      { slovo: 'а) Накрест лежащие углы и биссектриса', formula: 'BK=AB,\\ CK=CD' },
      { slovo: 'б) Биссектрисы соседних углов перпендикулярны', formula: '\\angle AKD=90^\\circ' },
      {
        slovo: 'б) Катеты по отношению и гипотенузе',
        formula: `AK=${ratTex(ch.AK)},\\ KD=${ratTex(ch.KD)}`,
      },
      { slovo: 'б) Ответ', formula: otvT },
    ],
    kontrol: { otvet: toNumber(otv), AK: toNumber(ch.AK), KD: toNumber(ch.KD) },
  };
}

export const N18_PARALL_BISS: Shablon2<PN18> = {
  no: 18,
  prototip:
    'Параллелограмм: биссектрисы углов при стороне AD пересекаются на BC; BC = 2AB; радиус вписанной окружности AKD или площадь',
  sobrat,
};
