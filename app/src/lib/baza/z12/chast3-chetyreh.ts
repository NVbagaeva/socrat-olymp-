/**
 * База №12, часть 3: тригонометрия в четырёхугольниках — трапеция,
 * прямоугольник, ромб (задачи 341–370 задачника, прототипы P73–P76).
 *
 * Чертежи как в задачнике: у прямоугольника A слева внизу, B над A,
 * диагональ AC; у ромба A слева, B сверху, C справа, D снизу.
 */

import { mn, otr, pryam, scena as sc, ug } from '@/lib/planimetriya/stseny/dsl';
import type { Element, T2 } from '@/lib/planimetriya/types';
import { tex } from '../chisla';
import {
  POROG_UGLA,
  type PrototipChasti3,
  type Q,
  RAD,
  drob,
  izFloat,
  kor,
  korChertezh,
  korKv,
  num,
  q,
  qAdd,
  qDiv,
  qKoren,
  qKv,
  qMul,
  qSub,
  qTex,
  qZapis,
  rasst,
  sobrat,
  ugolMezhdu,
  v$,
  vopros,
  zazhat,
} from './chast3-obshchee';

const st = (a: string, b: string, zn: string): Element => ({
  tip: 'otrezok',
  a,
  b,
  tolkoShtrihi: true,
  vydelit: 'dano',
  znachenie: zn,
});

/* ── P73. Равнобедренная трапеция: тангенс острого угла ──────── */

const P73 = sobrat({
  id: 'P73',
  gruppa: '3C',
  title: 'Равнобедренная трапеция: основания и высота → $\\mathrm{tg}$ острого угла',
  polya: ['a', 'b', 'h'],
  alt: 'Равнобедренная трапеция с проведённой высотой',
  text(p) {
    return `В равнобедренной трапеции одно из оснований равно $${num(p, 'a')}$, а другое — $${num(p, 'b')}$. Высота трапеции равна $${num(p, 'h')}$. Найдите тангенс острого угла трапеции.`;
  },
  solve(p) {
    const a = num(p, 'a');
    const b = num(p, 'b');
    const h = num(p, 'h');
    const big = Math.max(a, b);
    const mal = Math.min(a, b);
    const x = q(big - mal, 2);
    const otvet = qZapis(qDiv(q(h), x));
    return {
      otvet,
      etapy: [
        {
          title: 'Отрезок от вершины до высоты',
          lines: [
            'Опустим высоты из концов меньшего основания. Они отсекают от большего основания отрезок, равный меньшему основанию, и два равных отрезка по краям:',
            `$x=\\dfrac{${big}-${mal}}{2}=${qTex(x)}$.`,
          ],
        },
        {
          title: 'Тангенс острого угла',
          lines: [
            'В прямоугольном треугольнике у острого угла высота — противолежащий катет, отрезок $x$ — прилежащий:',
            `$\\mathrm{tg}\\,\\alpha=\\dfrac{h}{x}=\\dfrac{${h}}{${qTex(x)}}=${tex(otvet)}$.`,
          ],
        },
      ],
      hints: [
        vopros(
          'Чему равен прилежащий катет $x$ у острого угла?',
          v$(qTex(x)),
          [v$(big - mal), v$(qTex(q(big + mal, 2)))],
          h,
          'Разность оснований делится пополам.',
        ),
        vopros(
          'Чему равен тангенс острого угла?',
          '$\\dfrac{h}{x}$',
          ['$\\dfrac{x}{h}$', '$\\dfrac{h}{b}$'],
          a + b,
        ),
      ],
    };
  },
  proverka(p) {
    const big = Math.max(num(p, 'a'), num(p, 'b'));
    const mal = Math.min(num(p, 'a'), num(p, 'b'));
    const h = num(p, 'h');
    const B: T2 = [(big - mal) / 2, h];
    return izFloat(Math.tan(ugolMezhdu([big, 0], [0, 0], B) * RAD));
  },
  scena(p) {
    const big = Math.max(num(p, 'a'), num(p, 'b'));
    const mal = Math.min(num(p, 'a'), num(p, 'b'));
    const h = num(p, 'h');
    /* Рисунок: острый угол не уже порога и не круче 75°. */
    const u0 = Math.atan2(h, (big - mal) / 2) / RAD;
    const u = zazhat(u0, 25, 75);
    const hv = ((big - mal) / 2) * Math.tan(u * RAD) || h;
    const x = (big - mal) / 2;
    return sc(
      {
        tochki: {
          A: [0, 0],
          B: [x, hv],
          C: [x + mal, hv],
          D: [big, 0],
          H: { osnovanie: ['B', 'A', 'D'] },
        },
        elementy: [
          mn(['A', 'B', 'C', 'D']),
          otr('B', 'H', { vydelit: 'dano', znachenie: String(h) }),
          pryam('B', 'H', 'D'),
          st('B', 'C', String(mal)),
          st('A', 'D', String(big)),
          ug('D', 'A', 'B', { vydelit: 'iskomoe' }),
        ],
        podpisi: false,
      },
      Math.abs(u - u0) > 1e-9,
    );
  },
});

/* ── P74. Прямоугольник ──────────────────────────────────────── */

const P74 = sobrat({
  id: 'P74',
  gruppa: '3C',
  title: 'Прямоугольник: площадь, сторона и угол с диагональю',
  polya: ['v', 'x', 'y', 'z'],
  alt: 'Прямоугольник ABCD с диагональю AC',
  text(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const y = num(p, 'y');
    if (v === 0) {
      return `Площадь прямоугольника $ABCD$ равна $${x}$, $BC=${y}$. Найдите синус угла $CAB$.`;
    }
    if (v === 1) {
      return `Площадь прямоугольника $ABCD$ равна $${x}$, сторона $AB=${y}$. Найдите тангенс угла $CAD$.`;
    }
    return `В прямоугольнике $ABCD$ сторона $BC$ равна $${x}$, $\\mathrm{tg}\\angle CAD=${drob(y, num(p, 'z'))}$. Найдите площадь прямоугольника.`;
  },
  solve(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const y = num(p, 'y');
    if (v === 0) {
      const ab = q(x, y);
      const ac2 = qAdd(qKv(ab), q(y * y));
      const ac = qKoren(ac2);
      const otvet = qZapis(qDiv(q(y), ac));
      return {
        otvet,
        etapy: [
          {
            title: 'Сторона AB',
            lines: [`$S=AB\\cdot BC$, $AB=\\dfrac{S}{BC}=\\dfrac{${x}}{${y}}=${qTex(ab)}$.`],
          },
          {
            title: 'Диагональ AC',
            lines: [
              'Треугольник $ABC$ прямоугольный ($\\angle B=90^\\circ$):',
              `$AC^2=AB^2+BC^2=${qTex(qKv(ab))}+${y * y}=${qTex(ac2)}$, $AC=${qTex(ac)}$.`,
            ],
          },
          {
            title: 'Синус угла CAB',
            lines: [
              `Против угла $CAB$ лежит катет $BC$: $\\sin\\angle CAB=\\dfrac{BC}{AC}=\\dfrac{${y}}{${qTex(ac)}}=${tex(otvet)}$.`,
            ],
          },
        ],
        hints: [
          vopros(
            'Чему равна сторона $AB$?',
            v$(qTex(ab)),
            [v$(qTex(q(x, 2 * y))), v$(qTex(q(x - y)))],
            x,
            'Площадь прямоугольника — произведение сторон.',
          ),
          vopros(
            'Чему равен $\\sin\\angle CAB$?',
            '$\\dfrac{BC}{AC}$',
            ['$\\dfrac{AB}{AC}$', '$\\dfrac{BC}{AB}$'],
            y,
          ),
        ],
      };
    }
    if (v === 1) {
      const ad = q(x, y);
      const otvet = qZapis(qDiv(q(y), ad));
      return {
        otvet,
        etapy: [
          {
            title: 'Сторона AD',
            lines: [`$S=AB\\cdot AD$, $AD=\\dfrac{S}{AB}=\\dfrac{${x}}{${y}}=${qTex(ad)}$.`],
          },
          {
            title: 'Тангенс угла CAD',
            lines: [
              'В прямоугольном треугольнике $ACD$ против угла $CAD$ лежит $CD=AB$, прилежит $AD$:',
              `$\\mathrm{tg}\\angle CAD=\\dfrac{CD}{AD}=\\dfrac{${y}}{${qTex(ad)}}=${tex(otvet)}$.`,
            ],
          },
        ],
        hints: [
          vopros(
            'Чему равна сторона $AD$?',
            v$(qTex(ad)),
            [v$(qTex(q(x, 2 * y))), v$(qTex(q(x - y)))],
            x,
          ),
          vopros(
            'Чему равен $\\mathrm{tg}\\angle CAD$?',
            '$\\dfrac{CD}{AD}$',
            ['$\\dfrac{AD}{CD}$', '$\\dfrac{CD}{AC}$'],
            y,
            '$CD=AB$ — противоположные стороны прямоугольника равны.',
          ),
        ],
      };
    }
    const z = num(p, 'z');
    const cd = qMul(q(x), q(y, z));
    const s = qMul(q(x), cd);
    const otvet = qZapis(s);
    return {
      otvet,
      etapy: [
        {
          title: 'Сторона CD',
          lines: [
            '$AD=BC$. В прямоугольном треугольнике $ACD$:',
            `$\\mathrm{tg}\\angle CAD=\\dfrac{CD}{AD}$, $CD=AD\\cdot\\mathrm{tg}\\angle CAD=${x}\\cdot ${drob(y, z)}=${qTex(cd)}$.`,
          ],
        },
        {
          title: 'Площадь',
          lines: [`$S=AD\\cdot CD=${x}\\cdot ${qTex(cd)}=${tex(otvet)}$.`],
        },
      ],
      hints: [
        vopros(
          'Чему равна сторона $CD$?',
          v$(qTex(cd)),
          [v$(qTex(qDiv(q(x), q(y, z)))), v$(y)],
          x,
          '$CD=AD\\cdot\\mathrm{tg}\\angle CAD$, а $AD=BC$.',
        ),
        vopros(
          'Как найти площадь прямоугольника?',
          '$AD\\cdot CD$',
          ['$\\dfrac{AD\\cdot CD}{2}$', '$2(AD+CD)$'],
          z,
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const y = num(p, 'y');
    if (v === 0) {
      const ab = x / y;
      return izFloat(Math.sin(ugolMezhdu([y, ab], [0, 0], [0, ab]) * RAD));
    }
    if (v === 1) {
      const ad = x / y;
      return izFloat(Math.tan(ugolMezhdu([ad, y], [0, 0], [ad, 0]) * RAD));
    }
    const cd = (x * y) / num(p, 'z');
    return izFloat(rasst([0, 0], [x, 0]) * rasst([x, 0], [x, cd]));
  },
  scena(p) {
    const v = num(p, 'v');
    const x = num(p, 'x');
    const y = num(p, 'y');
    let w: number;
    let h: number;
    if (v === 0) [w, h] = [y, x / y];
    else if (v === 1) [w, h] = [x / y, y];
    else [w, h] = [x, (x * y) / num(p, 'z')];
    /* Пропорции рисунка: угол диагонали не уже 15° и не круче 75°. */
    const u0 = Math.atan2(h, w) / RAD;
    const u = zazhat(u0, 15, 75);
    const H = 10 * Math.tan(u * RAD);
    const el: Element[] = [mn(['A', 'B', 'C', 'D']), otr('A', 'C'), pryam('A', 'D', 'C')];
    if (v === 0) el.push(st('B', 'C', String(y)), ug('C', 'A', 'B', { vydelit: 'iskomoe' }));
    if (v === 1) el.push(st('A', 'B', String(y)), ug('D', 'A', 'C', { vydelit: 'iskomoe' }));
    if (v === 2) el.push(st('B', 'C', String(x)), ug('D', 'A', 'C', { vydelit: 'dano' }));
    return sc(
      { tochki: { A: [0, 0], B: [0, H], C: [10, H], D: [10, 0] }, elementy: el },
      Math.abs(u - u0) > 1e-9,
    );
  },
});

/* ── Ромб ────────────────────────────────────────────────────── */

/** Ромб: A слева, B сверху, C справа, D снизу, O — точка пересечения диагоналей. */
function romb(ao: number, bo: number): { t: Record<string, T2>; sk: boolean } {
  const u0 = Math.atan2(bo, ao) / RAD;
  const u = zazhat(u0, POROG_UGLA + 4, 90 - POROG_UGLA - 4);
  const b = 10 * Math.tan(u * RAD);
  return {
    t: { A: [-10, 0], B: [0, b], C: [10, 0], D: [0, -b], O: [0, 0] },
    sk: Math.abs(u - u0) > 1e-9,
  };
}

const rombEl = (): Element[] => [mn(['A', 'B', 'C', 'D']), otr('A', 'C'), otr('B', 'D')];

const DIAGONALI =
  'Диагонали ромба перпендикулярны и делятся точкой пересечения $O$ пополам: треугольник $AOB$ прямоугольный, $AO=\\dfrac{AC}{2}$, $BO=\\dfrac{BD}{2}$.';

/* ── P75. Ромб: синус угла между стороной и диагональю ───────── */

const P75 = sobrat({
  id: 'P75',
  gruppa: '3C',
  title: 'Ромб: синус угла между стороной и диагональю',
  polya: ['v', 'a', 'k', 'm'],
  alt: 'Ромб ABCD с диагоналями AC и BD',
  text(p) {
    const v = num(p, 'v');
    const a = num(p, 'a');
    const x = kor(num(p, 'k'), num(p, 'm'));
    if (v === 0) {
      return `В ромбе $ABCD$ диагональ $AC=${x}$, диагональ $BD=${a}$. Найдите синус угла $BAC$.`;
    }
    if (v === 1)
      return `В ромбе $ABCD$ известно, что $AB=${a}$, $BD=${x}$. Найдите синус угла $ABD$.`;
    return `В ромбе $ABCD$ известно, что $AB=${a}$, $AC=${x}$. Найдите синус угла $BAC$.`;
  },
  solve(p) {
    const v = num(p, 'v');
    const a = num(p, 'a');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const pol2 = q(k * k * m, 4);
    let ao2: Q;
    let bo2: Q;
    let ab2: Q;
    const shagi: { title: string; lines: string[] }[] = [
      { title: 'Диагонали ромба', lines: [DIAGONALI] },
    ];
    if (v === 0) {
      ao2 = pol2;
      bo2 = q(a * a, 4);
      ab2 = qAdd(ao2, bo2);
      shagi.push({
        title: 'Сторона AB по теореме Пифагора',
        lines: [
          `$AO^2=\\dfrac{${korKv(k, m)}}{4}=${qTex(ao2)}$, $BO=\\dfrac{${a}}{2}=${qTex(q(a, 2))}$.`,
          `$AB^2=AO^2+BO^2=${qTex(ao2)}+${qTex(bo2)}=${qTex(ab2)}$, $AB=${qTex(qKoren(ab2))}$.`,
        ],
      });
    } else {
      ab2 = q(a * a);
      if (v === 1) {
        bo2 = pol2;
        ao2 = qSub(ab2, bo2);
      } else {
        ao2 = pol2;
        bo2 = qSub(ab2, ao2);
      }
      const [dano, nado] = v === 1 ? ['BO', 'AO'] : ['AO', 'BO'];
      shagi.push({
        title: `Катет ${nado} по теореме Пифагора`,
        lines: [
          `$${dano}^2=\\dfrac{${korKv(k, m)}}{4}=${qTex(pol2)}$.`,
          `$${nado}^2=AB^2-${dano}^2=${a * a}-${qTex(pol2)}=${qTex(v === 1 ? ao2 : bo2)}$, $${nado}=${qTex(qKoren(v === 1 ? ao2 : bo2))}$.`,
        ],
      });
    }
    const ab = qKoren(ab2);
    const [protiv, ugol] = v === 1 ? ['AO', 'ABD'] : ['BO', 'BAC'];
    const pr = qKoren(v === 1 ? ao2 : bo2);
    const otvet = qZapis(qDiv(pr, ab));
    shagi.push({
      title: `Синус угла ${ugol}`,
      lines: [
        `В треугольнике $AOB$ против угла $${ugol}$ лежит катет $${protiv}$:`,
        `$\\sin\\angle ${ugol}=\\dfrac{${protiv}}{AB}=\\dfrac{${qTex(pr)}}{${qTex(ab)}}=${tex(otvet)}$.`,
      ],
    });
    return {
      otvet,
      etapy: shagi,
      hints: [
        vopros(
          'Какой угол образуют диагонали ромба?',
          '$90^\\circ$',
          ['$60^\\circ$', 'зависит от ромба'],
          a,
          'Диагонали ромба перпендикулярны.',
        ),
        vopros(
          `Чему равен $\\sin\\angle ${ugol}$?`,
          `$\\dfrac{${protiv}}{AB}$`,
          v === 1
            ? ['$\\dfrac{BO}{AB}$', '$\\dfrac{AO}{BO}$']
            : ['$\\dfrac{AO}{AB}$', '$\\dfrac{BO}{AO}$'],
          k + m,
        ),
      ],
    };
  },
  proverka(p) {
    const v = num(p, 'v');
    const a = num(p, 'a');
    const pol = (num(p, 'k') * Math.sqrt(num(p, 'm'))) / 2;
    let ao: number;
    let bo: number;
    if (v === 0) [ao, bo] = [pol, a / 2];
    else if (v === 1) [ao, bo] = [Math.sqrt(a * a - pol * pol), pol];
    else [ao, bo] = [pol, Math.sqrt(a * a - pol * pol)];
    const A: T2 = [-ao, 0];
    const B: T2 = [0, bo];
    const u = v === 1 ? ugolMezhdu(A, B, [0, -bo]) : ugolMezhdu(B, A, [ao, 0]);
    return izFloat(Math.sin(u * RAD));
  },
  scena(p) {
    const v = num(p, 'v');
    const a = num(p, 'a');
    const pol = (num(p, 'k') * Math.sqrt(num(p, 'm'))) / 2;
    const zn = korChertezh(num(p, 'k'), num(p, 'm'));
    let ao: number;
    let bo: number;
    if (v === 0) [ao, bo] = [pol, a / 2];
    else if (v === 1) [ao, bo] = [Math.sqrt(a * a - pol * pol), pol];
    else [ao, bo] = [pol, Math.sqrt(a * a - pol * pol)];
    const { t, sk } = romb(ao, bo);
    const el = rombEl();
    if (v === 0) {
      el.push(
        otr('A', 'C', { vydelit: 'dano', znachenie: zn }),
        otr('B', 'D', { vydelit: 'dano', znachenie: String(a) }),
        ug('B', 'A', 'C', { vydelit: 'iskomoe' }),
      );
    } else if (v === 1) {
      el.push(
        st('A', 'B', String(a)),
        otr('B', 'D', { vydelit: 'dano', znachenie: zn }),
        ug('A', 'B', 'D', { vydelit: 'iskomoe' }),
      );
    } else {
      el.push(
        st('A', 'B', String(a)),
        otr('A', 'C', { vydelit: 'dano', znachenie: zn }),
        ug('B', 'A', 'C', { vydelit: 'iskomoe' }),
      );
    }
    return sc({ tochki: t, elementy: el, bezPodpisi: ['O'] }, sk);
  },
});

/* ── P76. Ромб: тангенс угла BAC ─────────────────────────────── */

const P76 = sobrat({
  id: 'P76',
  gruppa: '3C',
  title: 'Ромб: $\\mathrm{tg}\\angle BAC$ по диагонали и стороне или площади',
  polya: ['v', 'c', 'k', 'm'],
  alt: 'Ромб ABCD с диагоналями AC и BD',
  text(p) {
    const c = num(p, 'c');
    return num(p, 'v') === 0
      ? `В ромбе $ABCD$ диагональ $AC=${c}$, сторона $AB=${kor(num(p, 'k'), num(p, 'm'))}$. Найдите тангенс угла $BAC$.`
      : `В ромбе $ABCD$ диагональ $AC=${c}$, площадь ромба равна $${num(p, 'k')}$. Найдите тангенс угла $BAC$.`;
  },
  solve(p) {
    const c = num(p, 'c');
    const k = num(p, 'k');
    const m = num(p, 'm');
    const ao = q(c, 2);
    let bo: Q;
    const shagi: { title: string; lines: string[] }[] = [
      { title: 'Диагонали ромба', lines: [DIAGONALI] },
    ];
    if (num(p, 'v') === 0) {
      const bo2 = qSub(q(k * k * m), qKv(ao));
      bo = qKoren(bo2);
      shagi.push({
        title: 'Катет BO по теореме Пифагора',
        lines: [
          `$AO=\\dfrac{${c}}{2}=${qTex(ao)}$.`,
          `$BO^2=AB^2-AO^2=${k * k * m}-${qTex(qKv(ao))}=${qTex(bo2)}$, $BO=${qTex(bo)}$.`,
        ],
      });
    } else {
      const bd = q(2 * k, c);
      bo = qDiv(bd, q(2));
      shagi.push({
        title: 'Вторая диагональ',
        lines: [
          'Площадь ромба — половина произведения диагоналей: $S=\\dfrac{AC\\cdot BD}{2}$.',
          `$BD=\\dfrac{2S}{AC}=\\dfrac{2\\cdot ${k}}{${c}}=${qTex(bd)}$, $BO=${qTex(bo)}$, $AO=${qTex(ao)}$.`,
        ],
      });
    }
    const otvet = qZapis(qDiv(bo, ao));
    shagi.push({
      title: 'Тангенс угла BAC',
      lines: [
        `В треугольнике $AOB$: $\\mathrm{tg}\\angle BAC=\\dfrac{BO}{AO}=\\dfrac{${qTex(bo)}}{${qTex(ao)}}=${tex(otvet)}$.`,
      ],
    });
    return {
      otvet,
      etapy: shagi,
      hints: [
        vopros(
          'Чему равен $\\mathrm{tg}\\angle BAC$?',
          '$\\dfrac{BO}{AO}$',
          ['$\\dfrac{AO}{BO}$', '$\\dfrac{BO}{AB}$'],
          c,
          'В прямоугольном треугольнике $AOB$ противолежащий катет делим на прилежащий.',
        ),
        vopros('Чему равен $BO$?', v$(qTex(bo)), [v$(qTex(qMul(bo, q(2)))), v$(qTex(ao))], k),
      ],
    };
  },
  proverka(p) {
    const c = num(p, 'c');
    const k = num(p, 'k');
    const bo =
      num(p, 'v') === 0
        ? Math.sqrt(k * k * num(p, 'm') - (c * c) / 4)
        : k / c; /* S = AC·BD/2 → BO = BD/2 = S/AC */
    return izFloat(Math.tan(ugolMezhdu([0, bo], [-c / 2, 0], [c / 2, 0]) * RAD));
  },
  scena(p) {
    const c = num(p, 'c');
    const k = num(p, 'k');
    const v = num(p, 'v');
    const bo = v === 0 ? Math.sqrt(k * k * num(p, 'm') - (c * c) / 4) : k / c;
    const { t, sk } = romb(c / 2, bo);
    const el = rombEl();
    el.push(otr('A', 'C', { vydelit: 'dano', znachenie: String(c) }));
    if (v === 0) el.push(st('A', 'B', korChertezh(k, num(p, 'm'))));
    el.push(ug('B', 'A', 'C', { vydelit: 'iskomoe' }));
    return sc({ tochki: t, elementy: el, bezPodpisi: ['O'] }, sk);
  },
});

export const PROTOTIPY_CHETYREH: PrototipChasti3[] = [P73, P74, P75, P76];
