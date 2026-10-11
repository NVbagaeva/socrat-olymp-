/**
 * Группа V — тригонометрия (П-26 … П-29) и прототипы из курса
 * П-33 (дифракционная решётка) и П-34 (доля периода).
 *
 * Все углы — табличные: синус и косинус дают $\frac12$, $\frac{\sqrt2}{2}$,
 * $\frac{\sqrt3}{2}$, $0$, $1$. Неравенство «$\sin\alpha\ge s$» для острого
 * угла решается так: синус на $[0^\circ;90^\circ]$ растёт, значит,
 * наименьший угол — тот, у которого синус ровно $s$.
 */

import { add, div, mul, sub } from '../../zadanie11/num';
import {
  chtoNayti,
  d,
  dano,
  fq,
  num,
  q,
  razbor,
  str,
  val,
  vKakihEdinicah,
  vopros,
  type Q,
} from '../kit';
import type { Prototype } from '../types';

const key = (x: Q) => `${x.n}/${x.m}`;

/** Угол 0…90° по квадрату синуса. */
const UGOL_PO_SIN2: Record<string, number> = {
  '0/1': 0,
  '1/4': 30,
  '1/2': 45,
  '3/4': 60,
  '1/1': 90,
};
/** Синус в TeX по квадрату синуса. */
const SIN_TEX: Record<string, string> = {
  '0/1': '0',
  '1/4': '\\dfrac{1}{2}',
  '1/2': '\\dfrac{\\sqrt{2}}{2}',
  '3/4': '\\dfrac{\\sqrt{3}}{2}',
  '1/1': '1',
};
/** Угол 0…180° по косинусу. */
const UGOL_PO_COS: Record<string, number> = {
  '1/1': 0,
  '1/2': 60,
  '0/1': 90,
  '-1/2': 120,
  '-1/1': 180,
};

function ugolSin2(s2: Q, gde: string): number {
  const u = UGOL_PO_SIN2[key(s2)];
  if (u === undefined) {
    throw new Error(`${gde}: sin² = ${fq(s2)} — не табличный`);
  }
  return u;
}

function sinTex(s2: Q): string {
  return SIN_TEX[key(s2)] ?? fq(s2);
}

/** sin²θ для угла θ в градусах (кратного 30° или 45°). */
function sin2Gradusy(theta: number): Q {
  const t = ((theta % 180) + 180) % 180;
  const u = t > 90 ? 180 - t : t;
  const map: Record<number, Q> = { 0: q(0), 30: q(1, 4), 45: q(1, 2), 60: q(3, 4), 90: q(1) };
  const v = map[u];
  if (v === undefined) {
    throw new Error(`угол ${theta}° не табличный`);
  }
  return v;
}

/* ── П-26 Время полёта мяча ─────────────────────────────────────── */

const P26: Prototype = {
  id: 'P26',
  no: 26,
  group: 'V',
  title: 'Мяч под углом: время полёта',
  formula: 't=\\dfrac{2v_0\\sin\\alpha}{g}',
  ask: 'наименьший угол броска',
  skills: ['trigonometriya'],
  fipiNos: '139–142',
  alt: 'Футбольный мяч летит по дуге, у ноги игрока отмечен угол броска',
  solve(p) {
    const t = num(p, 't');
    const v0 = num(p, 'v0');
    const g = num(p, 'g');
    const s = div(mul(q(t), q(g)), q(2 * v0));
    const alpha = ugolSin2(mul(s, s), 'П-26');
    const dn = [
      dano('v_0', v0, 'м/с', 'начальная скорость'),
      dano('g', g, 'м/с²', 'ускорение свободного падения'),
      dano('t', `\\ge${d(t)}`, 'с', 'время полёта'),
    ];
    return {
      answer: alpha,
      iskomoe: '\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Нужно $\\dfrac{2\\cdot${d(v0)}\\cdot\\sin\\alpha}{${d(g)}}\\ge${d(t)}$. Ищем наименьший угол $\\alpha$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `$\\sin\\alpha\\ge\\dfrac{${d(t)}\\cdot${d(g)}}{2\\cdot${d(v0)}}=${fq(s, true)}$.`,
          `Угол броска острый (от $0^\\circ$ до $90^\\circ$), там синус растёт. Значит, наименьший угол — тот, у которого $\\sin\\alpha=${sinTex(mul(s, s))}$: $\\alpha=${alpha}^\\circ$.`,
        ],
        proverka: [
          alpha === 90
            ? 'Угол $90^\\circ$ — мяч брошен вертикально вверх: только так он продержится в воздухе нужное время.'
            : `Чем круче бросок, тем дольше полёт; при $\\alpha=${alpha}^\\circ$ время ровно $${d(t)}$ с, при большем угле — больше.`,
        ],
        answer: alpha,
        ed: '°',
      }),
      vychisleniya: [
        { tekst: 'Табличное значение:', tex: `\\sin${alpha}^\\circ=${sinTex(mul(s, s))}` },
      ],
      hints: [
        chtoNayti('наименьший угол $\\alpha$', ['время полёта', 'начальную скорость']),
        vopros('Какое неравенство на синус получается?', `$\\sin\\alpha\\ge${fq(s, true)}$`, [
          `$\\sin\\alpha\\le${fq(s, true)}$`,
          `$\\sin\\alpha\\ge${d(t)}$`,
        ]),
        vopros(
          `При каком остром угле $\\sin\\alpha=${fq(s, true)}$?`,
          `$${alpha}^\\circ$`,
          alpha === 30 ? ['$60^\\circ$', '$45^\\circ$'] : ['$45^\\circ$', '$0^\\circ$'],
        ),
        vKakihEdinicah('в градусах', ['в радианах', 'в секундах']),
      ],
    };
  },
};

/* ── П-27 Груз на пружине ───────────────────────────────────────── */

const P27: Prototype = {
  id: 'P27',
  no: 27,
  group: 'V',
  title: 'Груз на пружине: кинетическая энергия',
  formula: 'v=v_0\\sin\\dfrac{2\\pi t}{T},\\ E=\\dfrac{mv^2}{2}',
  ask: 'кинетическую энергию груза в момент $t$',
  skills: ['trigonometriya', 'podstanovka'],
  fipiNos: '143–150',
  alt: 'Груз на вертикальной пружине колеблется вверх-вниз',
  solve(p) {
    const m = num(p, 'm');
    const T = num(p, 'T');
    const v0 = num(p, 'v0');
    const t = num(p, 't');
    const fn = str(p, 'fn', ['sin', 'cos'] as const);
    const ugol = div(mul(q(2), q(t)), q(T));
    const theta = val(ugol) * 180;
    const s2 = fn === 'sin' ? sin2Gradusy(theta) : sub(q(1), sin2Gradusy(theta));
    const v02 = mul(q(v0), q(v0));
    const E = div(mul(mul(q(m), v02), s2), q(2));
    const ans = val(E);
    const arg = `\\dfrac{2\\pi\\cdot${d(t)}}{${d(T)}}`;
    const argPi =
      ugol.m === 1
        ? `${ugol.n === 1 ? '' : d(ugol.n)}\\pi`
        : `\\dfrac{${ugol.n === 1 ? '' : d(ugol.n)}\\pi}{${d(ugol.m)}}`;
    const dn = [
      dano('m', m, 'кг', 'масса груза'),
      dano('T', T, 'с', 'период колебаний'),
      dano('v_0', v0, 'м/с', 'амплитуда скорости'),
      dano('t', t, 'с', 'момент времени'),
    ];
    return {
      answer: ans,
      iskomoe: 'E',
      edinicy: 'Дж',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Сначала найдём скорость в момент $t=${d(t)}$ с, потом энергию. $v=${v0 === 1 ? '' : d(v0)}\\${fn}${arg}=${v0 === 1 ? '' : d(v0)}\\${fn}${argPi}$.`,
        ],
        vid: 'vychislyaem',
        reshaem: [
          `$\\${fn}^2${argPi}=${fq(s2)}$ (угол $${d(theta)}^\\circ$, табличное значение).`,
          v0 === 1
            ? `$v^2=${fq(s2)}$.`
            : s2.n === s2.m
              ? `$v^2=${d(v0)}^2=${fq(v02, true)}$.`
              : `$v^2=${d(v0)}^2\\cdot${fq(s2)}=${fq(mul(v02, s2), true)}$.`,
          `$E=\\dfrac{${d(m)}\\cdot${fq(mul(v02, s2), true)}}{2}=${fq(E, true)}$.`,
        ],
        proverka: [
          `Энергия не больше наибольшей $\\dfrac{mv_0^2}{2}=${fq(div(mul(q(m), v02), q(2)), true)}$ Дж — так и должно быть.`,
        ],
        answer: ans,
        ed: 'Дж',
      }),
      vychisleniya: [
        { tekst: 'Аргумент в градусах:', tex: `${argPi}=${d(theta)}^\\circ` },
        { tekst: 'Синус или косинус в квадрате:', tex: `\\${fn}^2${d(theta)}^\\circ=${fq(s2)}` },
      ],
      hints: [
        chtoNayti('кинетическую энергию $E$', ['скорость $v$', 'период $T$']),
        vopros('Чему равен аргумент $\\dfrac{2\\pi t}{T}$?', `$${argPi}$`, [
          `$${d(2 * t)}\\pi$`,
          `$\\dfrac{\\pi}{${d(T)}}$`,
        ]),
        vopros('Что нужно возвести в квадрат для энергии?', 'скорость $v$', [
          'массу $m$',
          'период $T$',
        ]),
        vKakihEdinicah('в джоулях', ['в ваттах', 'в м/с']),
      ],
    };
  },
};

/* ── П-28 Неупругое соударение ──────────────────────────────────── */

const P28: Prototype = {
  id: 'P28',
  no: 28,
  group: 'V',
  title: 'Неупругое соударение двух тел',
  formula: 'Q=mv^2\\sin^2\\alpha',
  ask: 'угол $2\\alpha$ между направлениями движения',
  skills: ['trigonometriya'],
  fipiNos: '151–156',
  alt: 'Два одинаковых шара катятся под углом друг к другу и сталкиваются',
  solve(p) {
    const m = num(p, 'm');
    const v = num(p, 'v');
    const Q = num(p, 'Q');
    const mv2 = m * v * v;
    const s2 = div(q(Q), q(mv2));
    const a = ugolSin2(s2, 'П-28');
    const ans = 2 * a;
    const dn = [
      dano('m', m, 'кг', 'масса каждого тела'),
      dano('v', v, 'м/с', 'скорость каждого тела'),
      dano('Q', Q, 'Дж', 'выделившаяся энергия'),
    ];
    return {
      answer: ans,
      iskomoe: '2\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Ищем угол $2\\alpha$. Подставляем: $${d(Q)}=${d(m)}\\cdot${d(v)}^2\\cdot\\sin^2\\alpha$.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$${d(m)}\\cdot${d(v * v)}=${d(mv2)}$, $\\sin^2\\alpha=\\dfrac{${d(Q)}}{${d(mv2)}}=${fq(s2)}$.`,
          `$\\alpha$ — половина угла между направлениями, он от $0^\\circ$ до $90^\\circ$, синус положителен: $\\sin\\alpha=${sinTex(s2)}$, $\\alpha=${a}^\\circ$.`,
        ],
        koren: [`Спрашивают не $\\alpha$, а $2\\alpha$: $2\\cdot${a}^\\circ=${ans}^\\circ$.`],
        proverka: [
          ans === 180
            ? 'Угол $180^\\circ$ — лобовое столкновение: выделяется вся энергия движения $mv^2$.'
            : `Чем больше угол между направлениями, тем сильнее удар; при $${ans}^\\circ$ выделяется часть наибольшей энергии $mv^2=${d(mv2)}$ Дж.`,
        ],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [{ tekst: 'Табличное значение:', tex: `\\sin${a}^\\circ=${sinTex(s2)}` }],
      hints: [
        chtoNayti('угол $2\\alpha$', ['угол $\\alpha$', 'энергию $Q$']),
        vopros('Чему равен $\\sin^2\\alpha$?', `$${fq(s2)}$`, [
          `$${fq(div(q(mv2), q(Q)))}$`,
          `$${fq(div(q(Q), q(m)))}$`,
        ]),
        vopros('Что записать в ответ?', `$2\\alpha=${ans}$`, [`$\\alpha=${a}$`, `$\\sin\\alpha$`]),
      ],
    };
  },
};

/* ── П-29 Мячик над стеной ──────────────────────────────────────── */

const P29: Prototype = {
  id: 'P29',
  no: 29,
  group: 'V',
  title: 'Мячик над стеной',
  formula: 'H=\\dfrac{v_0^2}{4g}(1-\\cos2\\alpha)',
  ask: 'наименьший угол, при котором мячик перелетит стену',
  skills: ['trigonometriya'],
  fipiNos: '157–160',
  alt: 'Мячик летит по дуге над стеной, над стеной остаётся запас в 1 м',
  solve(p) {
    const v0 = num(p, 'v0');
    const g = num(p, 'g');
    const h = num(p, 'h');
    const gap = num(p, 'gap');
    const H = add(q(h), q(gap));
    const c = sub(q(1), div(mul(q(4 * g), H), q(v0 * v0)));
    const dva = UGOL_PO_COS[key(c)];
    if (dva === undefined) {
      throw new Error(`П-29: cos2α = ${fq(c)} — не табличный`);
    }
    const ans = dva / 2;
    const dn = [
      dano('v_0', v0, 'м/с', 'начальная скорость'),
      dano('g', g, 'м/с²', 'ускорение свободного падения'),
      dano('h', h, 'м', 'высота стены'),
      dano('\\Delta', gap, 'м', 'запас над стеной'),
    ];
    return {
      answer: ans,
      iskomoe: '\\alpha',
      edinicy: '°',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Мячик пролетит над стеной на расстоянии $${d(gap)}$ м, если наибольшая высота не меньше $${d(h)}+${d(gap)}=${fq(H, true)}$ м: $\\dfrac{${d(v0)}^2}{4\\cdot${d(g)}}(1-\\cos2\\alpha)\\ge${fq(H, true)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `$1-\\cos2\\alpha\\ge\\dfrac{4\\cdot${d(g)}\\cdot${fq(H, true)}}{${d(v0 * v0)}}=${fq(sub(q(1), c))}$, $\\cos2\\alpha\\le${fq(c)}$.`,
          `Угол $\\alpha$ острый, значит, $0^\\circ<2\\alpha<180^\\circ$; там косинус убывает. Наименьший угол — когда $\\cos2\\alpha=${fq(c)}$: $2\\alpha=${dva}^\\circ$.`,
        ],
        koren: [`Спрашивают $\\alpha$, а не $2\\alpha$: $\\alpha=${dva}^\\circ:2=${ans}^\\circ$.`],
        proverka: [
          `Чем круче бросок, тем выше летит мячик; при $\\alpha=${ans}^\\circ$ он поднимается ровно на $${fq(H, true)}$ м.`,
        ],
        answer: ans,
        ed: '°',
      }),
      vychisleniya: [
        {
          tekst: 'Высоту стены не забываем увеличить на запас:',
          tex: `${d(h)}+${d(gap)}=${fq(H, true)}`,
        },
        { tekst: 'Табличное значение:', tex: `\\cos${dva}^\\circ=${fq(c)}` },
      ],
      hints: [
        chtoNayti('наименьший угол $\\alpha$', ['наибольшую высоту', 'угол $2\\alpha$']),
        vopros('Какой должна быть наибольшая высота $H$?', `не меньше $${fq(H, true)}$ м`, [
          `не меньше $${d(h)}$ м`,
          `не больше $${fq(H, true)}$ м`,
        ]),
        vopros('Какое неравенство на косинус получится?', `$\\cos2\\alpha\\le${fq(c)}$`, [
          `$\\cos2\\alpha\\ge${fq(c)}$`,
          `$\\cos\\alpha\\le${fq(c)}$`,
        ]),
        vopros('Что записать в ответ?', `$\\alpha=${ans}$`, [
          `$2\\alpha=${dva}$`,
          `$\\cos2\\alpha$`,
        ]),
      ],
    };
  },
};

/* ── П-33 Дифракционная решётка ─────────────────────────────────── */

const P33: Prototype = {
  id: 'P33',
  no: 33,
  group: 'V',
  title: 'Дифракционная решётка',
  formula: 'd\\sin\\varphi=k\\lambda',
  ask: 'наименьший угол максимума или наименьший период решётки',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Луч света проходит через дифракционную решётку, на экране — яркие полосы-максимумы',
  solve(p) {
    const form = str(p, 'form', ['ugol', 'period'] as const);
    const lam = num(p, 'lambda');
    const k = num(p, 'k');
    if (form === 'ugol') {
      const dmax = num(p, 'dmax');
      const s = q(k * lam, dmax);
      const phi = ugolSin2(mul(s, s), 'П-33');
      const dn = [
        dano('\\lambda', lam, 'нм', 'длина волны'),
        dano('k', k, '', 'номер максимума'),
        dano('d', `\\le${d(dmax)}`, 'нм', 'период решётки'),
      ];
      return {
        answer: phi,
        iskomoe: '\\varphi',
        edinicy: '°',
        dano: dn,
        etapy: razbor({
          dano: dn,
          ishchem: [
            `Из формулы $\\sin\\varphi=\\dfrac{k\\lambda}{d}$. Чем больше период $d$, тем меньше синус и угол; наименьший угол — при наибольшем $d=${d(dmax)}$ нм.`,
          ],
          vid: 'uravnenie',
          reshaem: [
            `$\\sin\\varphi=\\dfrac{${d(k)}\\cdot${d(lam)}}{${d(dmax)}}=${fq(s, true)}$, угол острый: $\\varphi=${phi}^\\circ$.`,
          ],
          proverka: [
            `Максимум ${k === 1 ? 'первого' : 'второго'} порядка отклонён на $${phi}^\\circ$ — для решётки с периодом в несколько длин волн это обычно.`,
          ],
          answer: phi,
          ed: '°',
        }),
        vychisleniya: [
          { tekst: 'Табличное значение:', tex: `\\sin${phi}^\\circ=${sinTex(mul(s, s))}` },
        ],
        hints: [
          chtoNayti('наименьший угол $\\varphi$', ['период решётки', 'длину волны']),
          vopros('Какой период подставить?', `наибольший, $${d(dmax)}$ нм`, [
            'наименьший',
            `$${d(lam)}$ нм`,
          ]),
          vKakihEdinicah('в градусах', ['в нанометрах', 'в радианах']),
        ],
      };
    }
    const phi = num(p, 'phi');
    const s2 = sin2Gradusy(phi);
    const s = phi === 30 ? q(1, 2) : q(1);
    const dmin = val(div(q(k * lam), s));
    const dn = [
      dano('\\lambda', lam, 'нм', 'длина волны'),
      dano('k', k, '', 'номер максимума'),
      dano('\\varphi', `\\le${phi}^\\circ`, '', 'угол максимума'),
    ];
    return {
      answer: dmin,
      iskomoe: 'd',
      edinicy: 'нм',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Из формулы $d=\\dfrac{k\\lambda}{\\sin\\varphi}$. Чем меньше угол, тем больше нужен период; при наибольшем угле $${phi}^\\circ$ период наименьший.`,
        ],
        vid: 'uravnenie',
        reshaem: [
          `$\\sin${phi}^\\circ=${sinTex(s2)}$, $d=\\dfrac{${d(k)}\\cdot${d(lam)}}{${fq(s, true)}}=${d(dmin)}$ нм.`,
        ],
        proverka: [
          `Период больше длины волны ($${d(dmin)}>${d(lam)}$ нм) — иначе максимум такого порядка вообще не наблюдался бы.`,
        ],
        answer: dmin,
        ed: 'нм',
      }),
      vychisleniya: [
        {
          tekst: 'Деление на $\\frac12$ — то же, что умножение на 2.',
          tex: `\\dfrac{${d(k * lam)}}{${fq(s, true)}}=${d(dmin)}`,
        },
      ],
      hints: [
        chtoNayti('наименьший период $d$', ['угол $\\varphi$', 'длину волны']),
        vopros(`Чему равен $\\sin${phi}^\\circ$?`, `$${sinTex(s2)}$`, [
          '$\\dfrac{\\sqrt{3}}{2}$',
          '$0$',
        ]),
        vKakihEdinicah('в нанометрах', ['в метрах', 'в градусах']),
      ],
    };
  },
};

/* ── П-34 Доля периода, когда энергия не меньше заданной ────────── */

const P34: Prototype = {
  id: 'P34',
  no: 34,
  group: 'V',
  title: 'Груз на пружине: сколько времени энергия велика',
  formula: 'v=v_0\\sin\\dfrac{2\\pi t}{T},\\ E=\\dfrac{mv^2}{2}',
  ask: 'сколько секунд за период энергия не меньше заданной',
  skills: ['trigonometriya'],
  fipiNos: '',
  alt: 'Груз на пружине и график кинетической энергии с отмеченными участками',
  solve(p) {
    const m = num(p, 'm');
    const v0 = num(p, 'v0');
    const T = num(p, 'T');
    const E0 = num(p, 'E0');
    const Emax = div(mul(q(m), mul(q(v0), q(v0))), q(2));
    const s2 = div(q(E0), Emax);
    const DOLI: Record<string, Q> = { '1/4': q(2, 3), '1/2': q(1, 2), '3/4': q(1, 3) };
    const dolya = DOLI[key(s2)];
    if (dolya === undefined) {
      throw new Error(`П-34: sin² ≥ ${fq(s2)} — нет табличной доли`);
    }
    const ans = val(mul(dolya, q(T)));
    const u = UGOL_PO_SIN2[key(s2)] ?? 0;
    const dn = [
      dano('m', m, 'кг', 'масса груза'),
      dano('v_0', v0, 'м/с', 'амплитуда скорости'),
      dano('T', T, 'с', 'период колебаний'),
      dano('E', `\\ge${d(E0)}`, 'Дж', 'нужная энергия'),
    ];
    return {
      answer: ans,
      iskomoe: '\\Delta t',
      edinicy: 'с',
      dano: dn,
      etapy: razbor({
        dano: dn,
        ishchem: [
          `Энергия $E=\\dfrac{mv_0^2}{2}\\sin^2\\dfrac{2\\pi t}{T}=${fq(Emax, true)}\\sin^2\\dfrac{2\\pi t}{T}$. Нужно $E\\ge${d(E0)}$: $\\sin^2\\dfrac{2\\pi t}{T}\\ge${fq(s2)}$.`,
        ],
        vid: 'neravenstvo',
        reshaem: [
          `$\\left|\\sin x\\right|\\ge${sinTex(s2)}$, где $x=\\dfrac{2\\pi t}{T}$ пробегает полный круг от $0^\\circ$ до $360^\\circ$ за один период.`,
          `На круге это дуги от $${u}^\\circ$ до $${180 - u}^\\circ$ и от $${180 + u}^\\circ$ до $${360 - u}^\\circ$: всего $2\\cdot${180 - 2 * u}^\\circ=${2 * (180 - 2 * u)}^\\circ$ из $360^\\circ$, то есть $${fq(dolya)}$ периода.`,
          `$${fq(dolya)}\\cdot${d(T)}=${d(ans)}$ с.`,
        ],
        proverka: [
          `Энергия большая около моментов наибольшей скорости — дважды за период; $${d(ans)}$ с из $${d(T)}$ с — разумная доля.`,
        ],
        answer: ans,
        ed: 'с',
      }),
      vychisleniya: [
        {
          tekst: 'Наибольшая энергия:',
          tex: `\\dfrac{${d(m)}\\cdot${d(v0)}^2}{2}=${fq(Emax, true)}`,
        },
        { tekst: 'Доля:', tex: `\\dfrac{${d(E0)}}{${fq(Emax, true)}}=${fq(s2)}` },
      ],
      hints: [
        chtoNayti('сколько секунд за период $E\\ge E_0$', ['наибольшую энергию', 'момент времени']),
        vopros('Какое неравенство на синус получится?', `$\\sin^2 x\\ge${fq(s2)}$`, [
          `$\\sin x\\ge${fq(s2)}$`,
          `$\\sin^2 x\\le${fq(s2)}$`,
        ]),
        vopros('Какую долю круга занимают подходящие дуги?', `$${fq(dolya)}$`, [
          '$\\dfrac{1}{4}$',
          '$1$',
        ]),
        vKakihEdinicah('в секундах', ['в долях периода', 'в джоулях']),
      ],
    };
  },
};

export const GRUPPA_V: Prototype[] = [P26, P27, P28, P29, P33, P34];
