/**
 * Решения прототипов раздела «Ежемесячные варианты»
 * (stseny/ezhemesyachnye.ts): те же шаги, вопросы и сверка, что у
 * прототипов Блока 1.
 */

import type { Params } from '../stseny/dsl';
import { gipotenuza201, radius204, ugol202 } from '../stseny/ezhemesyachnye';
import { n, shag, sokr, vopros } from './obshchee';
import type { Reshenie } from './types';

/** Синус по таблице Брадиса: четыре знака после запятой. */
const sin4 = (gradusy: number, minuty: number) =>
  Math.round(Math.sin(((gradusy + minuty / 60) * Math.PI) / 180) * 1e4) / 1e4;

/** Минуты строки таблицы, между которыми лежит синус: [g, m] и [g, m + 6]. */
function vilka202(s: number): { g: number; m: number } {
  for (let g = 0; g < 90; g += 1) {
    for (let m = 0; m < 60; m += 6) {
      const m2 = m + 6;
      const [g2, mm2] = m2 === 60 ? [g + 1, 0] : [g, m2];
      if (sin4(g, m) <= s && s <= sin4(g2, mm2)) return { g, m };
    }
  }
  throw new Error(`202: синус ${s} вне таблицы`);
}

const minTex = (g: number, m: number) => `${g}^\\circ${m === 0 ? '' : `${m}'`}`;

export const RESHENIYA_EZHEMESYACHNYE: Record<number, (p: Params) => Reshenie> = {
  201: (p) => {
    const ac2 = p.k * p.k * p.m;
    const ab = gipotenuza201(p);
    const s = sokr([p.b], ab, '\\sin A');
    return {
      shagi: [
        shag(
          'Гипотенуза $AB$ по теореме Пифагора',
          'Синус угла $A$ — противолежащий катет $BC$, делённый на гипотенузу $AB$. Гипотенузы в условии нет — находим её по теореме Пифагора.',
          [
            `AB=\\sqrt{AC^2+BC^2}=\\sqrt{(${korenTex(p.k, p.m)})^2+${n(p.b)}^2}=\\sqrt{${n(ac2)}+${n(p.b * p.b)}}=\\sqrt{${n(ac2 + p.b * p.b)}}=${n(ab)}`,
          ],
          1,
        ),
        shag(
          'Синус угла $A$',
          'Против угла $A$ лежит катет $BC$.',
          [`\\sin A=\\dfrac{BC}{AB}=\\dfrac{${n(p.b)}}{${n(ab)}}=${n(s.itog)}`],
          undefined,
          s.shagi,
        ),
      ],
      voprosy: [
        vopros(
          'Какой катет лежит против угла $A$?',
          ['$BC$', '$AC$', '$AB$'],
          'Против угла $A$ — сторона $BC$; $AB$ — гипотенуза.',
        ),
        vopros(
          `Чему равен квадрат катета $AC=${korenTex(p.k, p.m)}$?`,
          [`$${n(ac2)}$`, `$${n(p.k * p.m)}$`, `$${n(p.k * p.k + p.m)}$`],
          `$(${korenTex(p.k, p.m)})^2=${n(p.k * p.k)}\\cdot${n(p.m)}=${n(ac2)}$.`,
          1,
        ),
        vopros(
          'Чему равна гипотенуза $AB$?',
          [`$${n(ab)}$`, `$${n(ac2 + p.b * p.b)}$`, `$${korenTex(p.k, p.m)}+${n(p.b)}$`],
          `$AB^2=${n(ac2)}+${n(p.b * p.b)}=${n(ac2 + p.b * p.b)}$.`,
          1,
        ),
      ],
      sverka: `Сверяем: синус острого угла — между $0$ и $1$, и $\\cos A=\\dfrac{AC}{AB}$ даёт $\\sin^2A+\\cos^2A=\\dfrac{${n(p.b * p.b)}+${n(ac2)}}{${n(ab * ab)}}=1$ — сходится.`,
      otvet: s.itog,
    };
  },
  202: (p) => {
    const s = p.h / p.l;
    const { g, m } = vilka202(s);
    const m2 = m + 6;
    const [g2, mm2] = m2 === 60 ? [g + 1, 0] : [g, m2];
    const u = ugol202(p);
    const ans = Math.round(u);
    return {
      shagi: [
        shag(
          'Прямоугольный треугольник',
          'Рельсы — гипотенуза прямоугольного треугольника, высота подъёма — катет, противолежащий углу наклона $\\alpha$.',
          [`\\sin\\alpha=\\dfrac{${n(p.h)}}{${n(p.l)}}=${n(s)}`],
          1,
        ),
        shag(
          'Ищем синус в таблице',
          `В строке $${g}^\\circ$ находим соседние значения: $\\sin ${minTex(g, m)}=${n(sin4(g, m))}$ и $\\sin ${minTex(g2, mm2)}=${n(sin4(g2, mm2))}$. Наше число $${n(s)}$ лежит между ними, а синус острого угла растёт вместе с углом, значит, $${minTex(g, m)}<\\alpha<${minTex(g2, mm2)}$.`,
        ),
        shag(
          'Округляем',
          `Угол больше $${g}^\\circ$ меньше чем на полградуса ($30'$), поэтому до целого числа градусов $\\alpha\\approx ${ans}^\\circ$.`,
          [`\\alpha\\approx ${ans}^\\circ`],
        ),
      ],
      voprosy: [
        vopros(
          'Какая тригонометрическая функция связывает подъём и длину рельсов?',
          ['синус', 'косинус', 'тангенс'],
          'Подъём — противолежащий катет, рельсы — гипотенуза: это синус.',
          1,
        ),
        vopros(
          `Чему равен $\\sin\\alpha$?`,
          [`$${n(s)}$`, `$\\dfrac{${n(p.l)}}{${n(p.h)}}$`, `$\\dfrac{${n(p.h)}}{${n(p.l - p.h)}}$`],
          `$\\sin\\alpha=\\dfrac{${n(p.h)}}{${n(p.l)}}$.`,
        ),
        vopros(
          'Между какими углами таблицы лежит $\\alpha$?',
          [
            `$${minTex(g, m)}$ и $${minTex(g2, mm2)}$`,
            `$${minTex(g + 1, m)}$ и $${minTex(g + 1, m + 6 === 60 ? 0 : m + 6)}$`,
            `$${g - 1}^\\circ$ и $${g}^\\circ$`,
          ],
          'Ищем в таблице два соседних синуса, между которыми лежит наше число.',
        ),
      ],
      sverka: `Сверяем: угол наклона маленький, подъём $${n(p.h)}$ м намного меньше длины рельсов $${n(p.l)}$ м, и $\\sin\\alpha\\approx\\alpha$ в радианах: $${n(s)}\\cdot\\dfrac{180^\\circ}{\\pi}\\approx${n(Math.round(s * (180 / Math.PI) * 100) / 100)}^\\circ$ — сходится.`,
      otvet: ans,
    };
  },
  203: (p) => {
    const ans = 2 * p.a;
    return {
      shagi: [
        shag(
          'Касательные из одной точки',
          'Отрезки касательных, проведённых к окружности из одной точки, равны. Пусть $EH$ касается окружности в точке $T$. Тогда $EL=ET$ (из точки $E$) и $HP=HT$ (из точки $H$).',
          ['EL=ET,\\qquad HP=HT'],
          1,
        ),
        shag(
          'Периметр $BEH$',
          'Сторону $EH$ разбиваем точкой $T$ и заменяем куски равными отрезками касательных.',
          ['P_{BEH}=BE+ET+TH+HB=BE+EL+HP+HB=BL+BP'],
        ),
        shag(
          'Отрезки касательных из $B$',
          `Из точки $B$ тоже проведены две касательные: $BL=BP=${n(p.a)}$.`,
          [`P_{BEH}=BL+BP=2\\cdot${n(p.a)}=${n(ans)}`],
          2,
        ),
      ],
      voprosy: [
        vopros(
          'Чему равен отрезок $ET$, если $T$ — точка касания на $EH$?',
          ['$EL$', '$EB$', '$EH$'],
          'Касательные из одной точки равны: $ET=EL$.',
          1,
        ),
        vopros(
          'Во что превращается периметр $BEH$ после замены $ET$ и $TH$?',
          ['$BL+BP$', '$AB+BC$', '$2EH$'],
          '$BE+EL=BL$, $HB+HP=BP$.',
        ),
        vopros(
          `Чему равен $BL$, если $BP=${n(p.a)}$?`,
          [`$${n(p.a)}$`, `$${n(p.a / 2)}$`, `$${n(2 * p.a)}$`],
          'Касательные из точки $B$ равны.',
          2,
        ),
      ],
      sverka: `Сверяем с рисунком: периметр $BEH$ равен $BL+BP$ и не зависит от того, где проведена касательная $EH$ — ответ $${n(ans)}$ вдвое больше $BP$, сходится.`,
      otvet: ans,
    };
  },
  204: (p) => {
    const r = radius204(p);
    const c1 = p.a;
    const c2 = 2 * p.b;
    return {
      shagi: [
        shag(
          'Формула радиуса',
          'В прямоугольном треугольнике радиус вписанной окружности равен полусумме катетов без гипотенузы: $r=\\dfrac{a+b-c}{2}$ (отрезки касательных из вершины прямого угла равны $r$).',
          ['r=\\dfrac{a+b-c}{2}'],
          1,
        ),
        shag(
          'Гипотенуза',
          'Треугольник равнобедренный, гипотенуза в $\\sqrt2$ раз длиннее катета.',
          [`c=(${n(p.a)}+${korenTex(p.b, 2)})\\sqrt2=${korenTex(c1, 2)}+${n(c2)}`],
        ),
        shag(
          'Радиус',
          'Корни сокращаются.',
          [
            `r=\\dfrac{2(${n(p.a)}+${korenTex(p.b, 2)})-(${korenTex(c1, 2)}+${n(c2)})}{2}=\\dfrac{${n(2 * p.a)}+${korenTex(2 * p.b, 2)}-${korenTex(c1, 2)}-${n(c2)}}{2}=\\dfrac{${n(2 * p.a - c2)}}{2}=${n(r)}`,
          ],
          2,
        ),
      ],
      voprosy: [
        vopros(
          'Как найти радиус окружности, вписанной в прямоугольный треугольник?',
          ['$r=\\dfrac{a+b-c}{2}$', '$r=\\dfrac{c}{2}$', '$r=\\dfrac{a+b+c}{2}$'],
          'Отрезки касательных из вершины прямого угла равны $r$, а две другие пары в сумме дают гипотенузу.',
          1,
        ),
        vopros(
          `Чему равна гипотенуза, если катет $${n(p.a)}+${korenTex(p.b, 2)}$?`,
          [
            `$${korenTex(c1, 2)}+${n(c2)}$`,
            `$${n(2 * p.a)}+${korenTex(2 * p.b, 2)}$`,
            `$${korenTex(c1, 2)}+${korenTex(p.b, 2)}$`,
          ],
          '$\\sqrt2\\cdot\\sqrt2=2$.',
        ),
      ],
      sverka: `Сверяем с рисунком: радиус меньше половины катета ($\\approx${n(Math.round(((p.a + p.b * Math.SQRT2) / 2) * 100) / 100)}$), $${n(r)}$ — сходится.`,
      otvet: r,
    };
  },
};

/** k√m в TeX (копия dsl.korenTex без запятых: числа здесь целые). */
function korenTex(k: number, m: number): string {
  return `${k === 1 ? '' : n(k)}\\sqrt{${m}}`;
}
