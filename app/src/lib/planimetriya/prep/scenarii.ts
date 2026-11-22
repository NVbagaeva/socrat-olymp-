/**
 * Опорные задачи №1, переписанные подсказкой-сценарием: вопросы, которые
 * ученик учится задавать себе сам («Как использовать биссектрисы?»,
 * «Как обозначить равные углы?», «Это уже ответ?»), уточнение после
 * ошибки, чертёж растёт по шагам. Здесь — сцена, сценарий и разбор;
 * числа подбирает генератор микрозадачи (mikro.ts).
 */

import { parallelogramm } from '../figury';
import { polar } from '../geom';
import type { Scenariy } from '../scenariy';
import { podobrat } from '../skhema';
import { gr, mn, otr, ug } from '../stseny/dsl';
import type { Element, Scena } from '../types';
import type { FaktPamyatki, MikroGenerated } from './types';

const g = (x: number) => `${String(Math.round(x * 1e6) / 1e6).replace('.', '{,}')}^\\circ`;
const ist = (a: string, v: string, b: string, gradusy: number) =>
  ({ ugol: [a, v, b], gradusy }) as const;

/** Угол, который не может быть данным: при 80°–100° задача вырождается или ответ читается с чертежа. */
export function neVyrozhdennyy(
  int: (lo: number, hi: number) => number,
  lo: number,
  hi: number,
): number {
  for (let i = 0; i < 50; i += 1) {
    const u = int(lo, hi);
    if (u < 80 || u > 100) return u;
  }
  return lo;
}

/* ── П. 5. Биссектрисы смежных углов ──────────────────────────────── */

export function bissektrisySmezhnyh(u: number): MikroGenerated {
  const risunok = podobrat(null, { v: u }, { v: [40, 140] }, ({ v }) => ({
    tochki: {
      A: [-5, 0],
      O: [0, 0],
      B: [5, 0],
      C: polar(v, 5),
      K: polar(90 + v / 2, 4.6),
      L: polar(v / 2, 4.6),
    },
    elementy: [
      otr('A', 'B'),
      otr('O', 'C'),
      otr('O', 'K'),
      otr('O', 'L'),
      /* 66° — дуга ровно от OB до OC, подпись внутри этого угла. */
      ug('C', 'O', 'B', { vydelit: 'dano', znachenie: gr(u), radiusPx: 46 }),
      /* Угол между биссектрисами — другим цветом со знаком «?»; без
           значка прямого угла: он выдал бы ответ. */
      ug('K', 'O', 'L', {
        vydelit: 'iskomoe',
        znachenie: '?',
        cvet: 2,
        podsvetka: [4],
        radiusPx: 34,
      }),
      /* Половинки: угла AOC — одна дуга (синий), угла COB — две (янтарь). */
      ug('A', 'O', 'K', { sloy: 1, cvet: 1, radiusPx: 16 }),
      ug('K', 'O', 'C', { sloy: 1, cvet: 1, radiusPx: 16 }),
      ug('C', 'O', 'L', { sloy: 1, cvet: 3, dugi: 2, radiusPx: 24 }),
      ug('L', 'O', 'B', { sloy: 1, cvet: 3, dugi: 2, radiusPx: 24 }),
      ug('A', 'O', 'K', { sloy: 2, cvet: 1, znachenie: 'α', radiusPx: 16 }),
      ug('K', 'O', 'C', { sloy: 2, cvet: 1, znachenie: 'α', radiusPx: 16 }),
      ug('C', 'O', 'L', { sloy: 2, cvet: 3, dugi: 2, znachenie: 'β', radiusPx: 24 }),
      ug('L', 'O', 'B', { sloy: 2, cvet: 3, dugi: 2, znachenie: 'β', radiusPx: 24 }),
    ],
    podpisi: ['A', 'O', 'B', 'C'],
    podpisiPodskazki: ['K', 'L'],
    proverki: [ist('C', 'O', 'B', u)],
  }));
  const sc: Scenariy = {
    sposoby: [
      {
        nazvanie: 'Половинки углов',
        shagi: [
          {
            vopros: 'Как использовать биссектрисы?',
            knopki: [
              'Биссектриса делит угол пополам — отметим равные половинки',
              'Биссектриса перпендикулярна стороне угла',
              'Биссектриса делит сторону пополам',
            ],
            verno: 0,
            da: 'биссектриса делит угол на два равных угла. Отмечаем половинки: у угла $AOC$ — одной дугой, у угла $COB$ — двумя.',
            utochnenie:
              'Вспомни определение: что именно биссектриса делит пополам — сторону или угол?',
            sloy: 1,
            fakt: 'bissektrisa-ugla',
          },
          {
            vvod: 'Обозначим биссектрисы $OK$ (угла $AOC$) и $OL$ (угла $COB$).',
            vopros: 'Как обозначить равные половинки?',
            knopki: [
              'Одной буквой: половинки угла $AOC$ — $\\alpha$, угла $COB$ — $\\beta$',
              'Каждую своей буквой: $\\alpha$, $\\beta$, $\\gamma$, $\\delta$',
              'Сразу числами',
            ],
            verno: 0,
            da: 'равные углы — одной буквой. Тогда весь угол — две такие буквы.',
            formuly: ['\\angle AOC = 2\\alpha,\\quad \\angle COB = 2\\beta'],
            utochnenie: 'Половинки одного угла равны. Нужны ли для равных углов разные буквы?',
            sloy: 2,
            fakt: 'priem-ravnye-ugly',
          },
          {
            vopros: 'Что мы знаем про углы $AOC$ и $COB$ вместе?',
            knopki: [
              'Они смежные: вместе — развёрнутый угол $AOB$',
              'Они равны',
              'Вместе они дают $90^\\circ$',
            ],
            verno: 0,
            da: 'углы $AOC$ и $COB$ смежные: вместе они образуют развёрнутый угол $AOB$, а он равен $180^\\circ$.',
            formuly: ['2\\alpha + 2\\beta = 180^\\circ'],
            utochnenie:
              'Посмотри на лучи $OA$ и $OB$: они лежат на одной прямой. Какой угол между ними?',
            fakt: 'smezhnye-ugly',
          },
          {
            vopros: 'Из чего состоит угол между биссектрисами $KOL$?',
            knopki: [
              'Из $\\alpha$ и $\\beta$',
              'Из $2\\alpha$ и $\\beta$',
              'Из $2\\alpha$ и $2\\beta$',
            ],
            verno: 0,
            da: 'угол $KOL$ — одна половинка угла $AOC$ и одна половинка угла $COB$. Делим равенство на $2$.',
            formuly: ['\\angle KOL = \\alpha + \\beta = 90^\\circ'],
            utochnenie: 'Посмотри на чертёж: сколько дуг каждого цвета попадает внутрь угла $KOL$?',
            sloy: 4,
            fakt: null,
          },
          {
            vopros: `Понадобилось ли число $${g(u)}$?`,
            knopki: ['Нет: при любом угле ответ $90^\\circ$', 'Да: без него не решить'],
            verno: 0,
            da: `биссектрисы смежных углов перпендикулярны — при любом угле. Проверка числами: $${g(u)} : 2 = ${g(u / 2)}$, $(180^\\circ - ${g(u)}) : 2 = ${g((180 - u) / 2)}$, $${g(u / 2)} + ${g((180 - u) / 2)} = 90^\\circ$.`,
            utochnenie:
              'Посмотри на равенство $\\alpha + \\beta = 90^\\circ$: есть ли в нём данное число?',
            fakt: 'bissektrisy-smezhnyh',
          },
        ],
      },
    ],
    priem: { nazvanie: 'Равные углы обозначаем одной буквой', fakt: 'priem-ravnye-ugly' },
  };
  return {
    uslovie: `Углы $AOC$ и $COB$ смежные, $\\angle COB = ${g(u)}$. Найдите угол между биссектрисами этих углов.`,
    risunok,
    otvet: 90,
    razbor: [
      'Половинки угла $AOC$ обозначим $\\alpha$, угла $COB$ — $\\beta$: $\\angle AOC = 2\\alpha$, $\\angle COB = 2\\beta$.',
      'Смежные углы вместе дают развёрнутый угол: $2\\alpha + 2\\beta = 180^\\circ$, значит, $\\alpha + \\beta = 90^\\circ$.',
      `Угол между биссектрисами — $\\alpha + \\beta = 90^\\circ$. Проверка: $${g(u / 2)} + ${g((180 - u) / 2)} = 90^\\circ$.`,
    ],
    scenariy: sc,
  };
}

/* ── П. 6. Смежные углы в отношении ──────────────────────────────── */

export function smezhnyeVOtnoshenii(k: number, m: number): MikroGenerated {
  const x = 180 / (k + m);
  const mal = k * x;
  const bol = m * x;
  const risunok = podobrat(null, { v: mal }, { v: [30, 75] }, ({ v }) => ({
    tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(v, 5) },
    elementy: [
      otr('A', 'B'),
      otr('O', 'C'),
      /* Искомый меньший угол — другим цветом со знаком «?». */
      ug('C', 'O', 'B', { vydelit: 'iskomoe', znachenie: '?', cvet: 2 }),
      ug('A', 'O', 'C', { dugi: 2, cvet: 1, sloy: 'uslovie' }),
      ug('C', 'O', 'B', { cvet: 2, znachenie: `${k}x`, sloy: 2, radiusPx: 24 }),
      ug('A', 'O', 'C', { cvet: 1, dugi: 2, znachenie: `${m}x`, sloy: 2 }),
    ],
    proverki: [ist('C', 'O', 'B', mal)],
  }));
  const sc: Scenariy = {
    sposoby: [
      {
        nazvanie: 'Части',
        shagi: [
          {
            vopros: `Что значит «углы относятся как $${k} : ${m}$»?`,
            knopki: [
              `Меньший угол — $${k}$ одинаковых частей, больший — $${m}$ таких же частей`,
              `Углы равны $${k}^\\circ$ и $${m}^\\circ$`,
              `Один угол больше другого на $${m - k}^\\circ$`,
            ],
            verno: 0,
            da: `отношение говорит, во сколько раз одно больше другого, а не сами числа. Если девочек и мальчиков в классе $1 : 2$, это не значит, что девочка одна, а мальчиков двое: их может быть $10$ и $20$ или $5$ и $10$. Настоящие числа разделили на одно и то же число — его мы не знаем и обозначаем $x$.`,
            utochnenie:
              'Пример: девочек и мальчиков в классе $1 : 2$. Значит ли это, что в классе одна девочка?',
            fakt: 'priem-otnoshenie',
          },
          {
            vopros: 'Как тогда обозначить углы?',
            knopki: [`$${k}x$ и $${m}x$`, `$${k}$ и $${m}$`, `$x$ и $${m}x$`],
            verno: 0,
            da: `меньший угол $COB = ${k}x$, больший $AOC = ${m}x$: $x$ — одна «часть».`,
            utochnenie: `Если одна часть — $x$, то сколько это — $${k}$ частей?`,
            sloy: 2,
            fakt: 'priem-otnoshenie',
          },
          {
            vopros: 'Что мы знаем про смежные углы?',
            knopki: ['Их сумма равна $180^\\circ$', 'Они равны', 'Их сумма равна $90^\\circ$'],
            verno: 0,
            da: 'смежные углы вместе образуют развёрнутый угол.',
            formuly: [`${k}x + ${m}x = 180^\\circ`, `${k + m}x = 180^\\circ,\\quad x = ${g(x)}`],
            utochnenie: 'Лучи $OA$ и $OB$ лежат на одной прямой. Какой угол они образуют?',
            fakt: 'smezhnye-ugly',
          },
          {
            vopros: '$x$ — это уже ответ?',
            knopki: [`Нет: меньший угол — это $${k}x$`, 'Да, $x$ — это меньший угол'],
            verno: 0,
            da: `$x$ — одна «часть», а меньший угол — $${k}$ части. Типичная ошибка — записать в ответ саму «часть». Умножь $x = ${g(x)}$ на $${k}$ и посчитай сам.`,
            formuly: [`\\text{меньший угол} = ${k}x = ${k} \\cdot ${g(x)}`],
            utochnenie: 'Что обозначает $x$ — угол или одну «часть»?',
            fakt: null,
          },
          {
            vopros: 'Как проверить ответ?',
            knopki: [
              `Найти больший угол $${m}x$ и сложить углы — должно получиться $180^\\circ$`,
              'Сравнить меньший угол с $x$',
            ],
            verno: 0,
            da: 'смежные углы вместе дают $180^\\circ$. И по чертежу меньший угол острый.',
            utochnenie: 'Что мы знаем про сумму смежных углов?',
            fakt: null,
          },
        ],
      },
    ],
    priem: { nazvanie: 'Отношение $a : b$ записываем как $ax$ и $bx$', fakt: 'priem-otnoshenie' },
  };
  return {
    uslovie: `Смежные углы относятся как $${k} : ${m}$. Найдите меньший угол.`,
    risunok,
    otvet: mal,
    razbor: [
      `Обозначим одну «часть» $x$: меньший угол $${k}x$, больший $${m}x$.`,
      `Смежные углы вместе дают $180^\\circ$: $${k}x + ${m}x = 180^\\circ$, $x = ${g(x)}$.`,
      `$x$ — ещё не ответ: меньший угол $${k}x = ${g(mal)}$. Проверка: $${g(mal)} + ${g(bol)} = 180^\\circ$.`,
    ],
    scenariy: sc,
  };
}

/* ── П. 7. Соседний угол параллелограмма ──────────────────────────── */

export function sosedniyUgolParallelogramma(a: number): MikroGenerated {
  /* Непрямой угол не выглядит прямым: 85° рисуется около 65–70°. */
  const risunok = podobrat(null, { v: a }, { v: [35, 70] }, ({ v }) => ({
    tochki: parallelogramm(v),
    elementy: [
      mn(['A', 'B', 'C', 'D']),
      ug('D', 'A', 'B', { vydelit: 'dano', znachenie: gr(a) }),
      ug('A', 'B', 'C', { vydelit: 'iskomoe', znachenie: '?', cvet: 2 }),
      /* Подсказка: BC ∥ AD — значки параллельности, AB — секущая. */
      { tip: 'otrezok', a: 'B', b: 'C', tolkoShtrihi: true, strelki: 1, sloy: 1 } as Element,
      { tip: 'otrezok', a: 'A', b: 'D', tolkoShtrihi: true, strelki: 1, sloy: 1 } as Element,
      otr('A', 'B', { sloy: 1 }),
    ],
    proverki: [ist('A', 'B', 'C', 180 - a), ist('D', 'A', 'B', a)],
  }));
  const b = 180 - a;
  const sc: Scenariy = {
    sposoby: [
      {
        nazvanie: 'Односторонние углы',
        shagi: [
          {
            vopros: 'Чему равна сумма углов параллелограмма, прилежащих к одной стороне?',
            knopki: ['$90^\\circ$', '$180^\\circ$', '$360^\\circ$', 'Они равны'],
            verno: 1,
            da: 'углы $A$ и $B$ прилежат к стороне $AB$. $BC \\parallel AD$, а $AB$ — секущая, поэтому $\\angle A$ и $\\angle B$ — односторонние, их сумма $180^\\circ$.',
            formuly: ['\\angle A + \\angle B = 180^\\circ'],
            utochnenie: 'Разберёмся, какие это углы при параллельных прямых.',
            podvoprosy: [
              {
                vopros:
                  '$BC \\parallel AD$, $AB$ — секущая. Какие это углы при параллельных прямых — $\\angle A$ и $\\angle B$?',
                knopki: ['Накрест лежащие', 'Соответственные', 'Односторонние'],
                verno: 2,
                da: 'они лежат между параллельными прямыми по одну сторону от секущей $AB$ — это односторонние углы.',
                utochnenie: 'Оба угла лежат между $BC$ и $AD$ и по одну сторону от $AB$.',
                sloy: 1,
              },
              {
                vopros: 'Чему равна сумма односторонних углов?',
                knopki: ['$180^\\circ$', 'Они равны', '$90^\\circ$'],
                verno: 0,
                da: 'сумма односторонних углов при параллельных прямых равна $180^\\circ$.',
                utochnenie: 'Вспомни карточку «Параллельные прямые».',
                sloy: 1,
              },
            ],
            sloy: 1,
            fakt: 'parallelogramm-sosednie',
          },
          {
            vopros: 'Как найти угол $B$?',
            knopki: ['$180^\\circ - \\angle A$', '$\\angle A$', '$90^\\circ - \\angle A$'],
            verno: 0,
            da: 'вычитаем данный угол из $180^\\circ$. Посчитай сам.',
            formuly: [`\\angle B = 180^\\circ - ${g(a)}`],
            utochnenie: '$\\angle A + \\angle B = 180^\\circ$. Как тогда выразить $\\angle B$?',
            fakt: null,
          },
          {
            vopros: 'Каким должен получиться угол $B$ — проверь по чертежу',
            knopki: ['Тупым: больше $90^\\circ$', 'Острым: меньше $90^\\circ$'],
            verno: 0,
            da: `угол $A$ острый, а вместе с $B$ они дают $180^\\circ$ — значит, $B$ тупой. Если получилось меньше $90^\\circ$, ищи ошибку.`,
            utochnenie: 'Сравни угол $B$ на чертеже с прямым.',
            fakt: null,
          },
        ],
      },
    ],
  };
  return {
    uslovie: `В параллелограмме $ABCD$ $\\angle A = ${g(a)}$. Найдите угол $B$.`,
    risunok,
    otvet: b,
    razbor: [
      '$BC \\parallel AD$, $AB$ — секущая: углы $A$ и $B$ односторонние, их сумма $180^\\circ$.',
      `$\\angle B = 180^\\circ - ${g(a)} = ${g(b)}$. Угол $B$ тупой — сходится с чертежом.`,
    ],
    scenariy: sc,
  };
}

/* ── П. 8. Параллельные прямые: соответственный и смежный ─────────── */

function parallelnye(u: number, el: (m: string, n: string) => Element[]): Scena {
  return podobrat(null, { v: u }, { v: [35, 145] }, ({ v }) => {
    const d = polar(v, 1);
    const k = 4 / d[1];
    return {
      tochki: {
        A: [-7, 0],
        B: [7, 0],
        C: [-7, 4],
        D: [7, 4],
        M: [-d[0] * k * 0.5, 0],
        N: [d[0] * k * 0.5, 4],
        P: [-d[0] * k * 0.9, -1.6],
        Q: [d[0] * k * 0.9, 5.6],
      },
      elementy: [
        /* Прямые подписаны буквами a, b, c. */
        otr('A', 'B', { znachenie: 'a' }),
        otr('C', 'D', { znachenie: 'b' }),
        otr('P', 'Q', { znachenie: 'c' }),
        ...el('M', 'N'),
      ],
      podpisi: false,
      proverki: [ist('B', 'M', 'N', u)],
    };
  });
}

export function sootvetstvennyySmezhnyy(u: number): MikroGenerated {
  const otvet = 180 - u;
  const risunok = parallelnye(u, (m, n) => [
    ug('B', m, n, { vydelit: 'dano', znachenie: gr(u), cvet: 1 }),
    ug('C', n, 'Q', { vydelit: 'iskomoe', znachenie: '?', cvet: 2 }),
    /* Кандидаты в соответственный угол — цифрами 1, 2, 3. */
    ug('C', n, m, { sloy: 1, znachenie: '1', radiusPx: 22 }),
    ug('D', n, 'Q', { sloy: 1, znachenie: '2', radiusPx: 22 }),
    ug('D', n, m, { sloy: 1, znachenie: '3', radiusPx: 22 }),
    ug('D', n, 'Q', { sloy: 2, cvet: 1, znachenie: gr(u), radiusPx: 17 }),
  ]);
  const sc: Scenariy = {
    sposoby: [
      {
        nazvanie: 'Соответственный и смежный',
        shagi: [
          {
            vopros: 'Найди угол, соответственный данному. Какой это угол на чертеже?',
            knopki: ['Угол 1', 'Угол 2', 'Угол 3'],
            verno: 1,
            da: 'соответственные углы стоят «в одинаковом положении»: данный — над прямой $a$ справа от секущей, угол 2 — над прямой $b$ справа от секущей.',
            utochnenie:
              'Соответственный угол стоит у второй прямой точно так же: с той же стороны от секущей и с той же стороны от прямой.',
            sloy: 1,
            pokazatDo: true,
            fakt: 'sootvetstvennye',
          },
          {
            vopros: 'Чему равны соответственные углы при параллельных прямых?',
            knopki: ['Они равны', 'Их сумма $180^\\circ$', 'Их сумма $90^\\circ$'],
            verno: 0,
            da: 'при параллельных прямых соответственные углы равны.',
            formuly: [`\\text{угол } 2 = ${g(u)}`],
            utochnenie:
              'Если сдвинуть прямую $a$ вдоль секущей до прямой $b$, данный угол совпадёт с соответственным.',
            sloy: 2,
            fakt: 'sootvetstvennye',
          },
          {
            vopros: 'Искомый угол и угол 2 — смежные. Чему равна сумма смежных углов?',
            knopki: ['$180^\\circ$', '$90^\\circ$', '$360^\\circ$'],
            verno: 0,
            da: 'смежные углы вместе образуют развёрнутый угол.',
            formuly: [`? = 180^\\circ - ${g(u)}`],
            utochnenie:
              'Искомый угол и угол 2 вместе образуют угол между частями прямой $b$. Какой это угол?',
            fakt: 'smezhnye-ugly',
          },
          {
            vopros: 'Каким должен получиться искомый угол — проверь по чертежу',
            knopki: [
              otvet > 90 ? 'Тупым: больше $90^\\circ$' : 'Острым: меньше $90^\\circ$',
              otvet > 90 ? 'Острым: меньше $90^\\circ$' : 'Тупым: больше $90^\\circ$',
            ],
            verno: 0,
            da: `на чертеже угол ${otvet > 90 ? 'тупой' : 'острый'}. Посчитай $180^\\circ - ${g(u)}$ сам и сверь.`,
            utochnenie: 'Сравни искомый угол на чертеже с прямым.',
            fakt: null,
          },
        ],
      },
    ],
  };
  return {
    uslovie: `Две параллельные прямые $a$ и $b$ пересечены секущей $c$. Один из углов равен $${g(u)}$. Найдите угол, смежный с соответственным ему углом.`,
    risunok,
    otvet,
    razbor: [
      `Соответственный угол равен данному: $${g(u)}$.`,
      `Смежный с ним: $180^\\circ - ${g(u)} = ${g(otvet)}$.`,
    ],
    scenariy: sc,
  };
}

/* ── П. 4. Памятка блока «Смежные углы и параллельные прямые» ─────── */

function smezhnyeRis(): Scena {
  return {
    tochki: { A: [-5, 0], O: [0, 0], B: [5, 0], C: polar(62, 5) },
    elementy: [
      otr('A', 'B'),
      otr('O', 'C'),
      ug('C', 'O', 'B', { cvet: 1, radiusPx: 13 }),
      ug('A', 'O', 'C', { cvet: 2, dugi: 2, radiusPx: 13 }),
    ],
    podpisi: false,
  };
}

function vertikalnyeRis(): Scena {
  return {
    tochki: { O: [0, 0], A: polar(205, 5), B: polar(25, 5), C: polar(150, 5), D: polar(-30, 5) },
    elementy: [
      otr('A', 'B'),
      otr('C', 'D'),
      ug('D', 'O', 'B', { cvet: 1, radiusPx: 13 }),
      ug('C', 'O', 'A', { cvet: 1, radiusPx: 13 }),
    ],
    podpisi: false,
  };
}

function paraRis(el: (m: string, n: string) => Element[]): Scena {
  const d = polar(62, 1);
  const k = 4 / d[1];
  return {
    tochki: {
      A: [-6, 0],
      B: [6, 0],
      C: [-6, 4],
      D: [6, 4],
      /* Секущая правее середины: значки параллельности её не задевают. */
      M: [2.5 - d[0] * k * 0.5, 0],
      N: [2.5 + d[0] * k * 0.5, 4],
      P: [2.5 - d[0] * k * 0.95, -1.8],
      Q: [2.5 + d[0] * k * 0.95, 5.8],
    },
    elementy: [
      { tip: 'otrezok', a: 'A', b: 'B', strelki: 1 } as Element,
      { tip: 'otrezok', a: 'C', b: 'D', strelki: 1 } as Element,
      otr('P', 'Q'),
      ...el('M', 'N'),
    ],
    podpisi: false,
  };
}

/* ── Сумма углов: угол на d больше другого (P1-1-08) ─────────────── */

/** Кнопки-градусы: верная первой, без повторов и без числа ответа. */
function gradusy(verno: number, otvet: number, ...nevernye: number[]): string[] {
  const est = new Set([verno]);
  const out = [verno];
  for (const x of nevernye) {
    if (x <= 0 || est.has(x) || Math.abs(x - otvet) < 1e-9) continue;
    est.add(x);
    out.push(x);
  }
  return out.map((x) => `$${g(x)}$`);
}

/**
 * Подсказка к «угол $B$ на $d$ больше угла $A$, найдите угол $C$»: меньший
 * угол обозначаем $x$, больший выражаем через него, составляем сумму
 * углов. Слой 2 сцены — подписи $x$ и $x + d$ у углов $A$ и $B$.
 * Последнее действие — подставить $x$ — ученик делает сам.
 */
export function scenariyNaRaznost(a: number, d: number): Scenariy {
  const b = a + d;
  const c = 180 - a - b;
  return {
    sposoby: [
      {
        nazvanie: 'Меньший угол — $x$',
        shagi: [
          {
            vopros: 'Какой из углов $A$ и $B$ меньше?',
            knopki: ['$\\angle A$', '$\\angle B$', 'Они равны'],
            verno: 0,
            da: `угол $B$ на $${g(d)}$ больше угла $A$, значит, меньше угол $A$.`,
            utochnenie: `В условии: угол $B$ на $${g(d)}$ больше угла $A$. Какой же из них меньше?`,
            fakt: null,
          },
          {
            vvod: 'Обозначим меньший угол буквой $x$: $\\angle A = x$.',
            vopros: 'Чему тогда равен угол $B$?',
            knopki: [`$x + ${g(d)}$`, `$x - ${g(d)}$`, `$${String(d)}x$`],
            verno: 0,
            da: `угол $B$ на $${g(d)}$ больше угла $A$, то есть на $${g(d)}$ больше $x$.`,
            formuly: [`\\angle B = x + ${g(d)}`],
            utochnenie: `Угол $B$ больше, чем $x$, на $${g(d)}$. К $x$ надо прибавить или вычесть?`,
            sloy: 2,
            fakt: null,
          },
          {
            vopros: 'Чему равна сумма углов треугольника?',
            knopki: ['$180^\\circ$', '$360^\\circ$', c === 90 ? '$270^\\circ$' : '$90^\\circ$'],
            verno: 0,
            da: 'по теореме о сумме углов: три угла любого треугольника вместе дают $180^\\circ$.',
            formuly: [`x + (x + ${g(d)}) + \\angle C = 180^\\circ`],
            utochnenie: 'Если сложить все три угла любого треугольника, сколько получится?',
            fakt: 'summa-uglov',
          },
          {
            vopros: 'Как выразить угол $C$ через $x$?',
            knopki: [`$180^\\circ - 2x - ${g(d)}$`, `$180^\\circ - x - ${g(d)}$`, `$2x + ${g(d)}$`],
            verno: 0,
            da: `из $180^\\circ$ вычитаем оба угла: $x$ и $x + ${g(d)}$ — получается $x$ дважды.`,
            formuly: [`\\angle C = 180^\\circ - x - (x + ${g(d)}) = 180^\\circ - 2x - ${g(d)}`],
            utochnenie: `Из $180^\\circ$ надо вычесть угол $A$ и угол $B$, то есть $x$ и $x + ${g(d)}$. Сколько раз вычитаем $x$?`,
            fakt: null,
          },
          {
            vopros: 'Чему равно $x$?',
            knopki: gradusy(a, c, b, d, 180 - a),
            verno: 0,
            da: `$x$ — это угол $A$, а по условию $\\angle A = ${g(a)}$.`,
            formuly: [`x = ${g(a)},\\qquad \\angle B = ${g(a)} + ${g(d)} = ${g(b)}`],
            utochnenie:
              'Каким углом треугольника мы обозначили $x$? Что про этот угол сказано в условии?',
            fakt: null,
          },
          {
            vopros: '$x$ — это уже ответ?',
            knopki: ['Нет: найти надо угол $C$', 'Да'],
            verno: 0,
            da: `$x$ — это угол $A$. Подставь $x = ${g(a)}$ в $\\angle C = 180^\\circ - 2x - ${g(d)}$ и посчитай сам.`,
            utochnenie: 'Какой угол просят найти в задаче?',
            fakt: null,
          },
        ],
      },
    ],
    priem: {
      nazvanie: 'Неизвестный угол обозначаем $x$, другие выражаем через него',
      fakt: 'summa-uglov',
    },
  };
}

/* ── Сумма углов: угол вдвое больше другого (P1-1-07) ─────────────── */

/**
 * Подсказка к «угол $A$ вдвое больше угла $B$, $\angle C$ дан, найдите
 * угол $A$»: меньший угол $B$ обозначаем $x$, тогда $\angle A = 2x$;
 * сумма углов даёт $x$. Слой 2 сцены — подписи $x$ и $2x$. Последнее
 * действие — удвоить $x$ — ученик делает сам.
 */
export function scenariyVdvoe(b: number, c: number): Scenariy {
  const a = 2 * b;
  return {
    sposoby: [
      {
        nazvanie: 'Меньший угол — $x$',
        shagi: [
          {
            vopros: 'Какой из углов $A$ и $B$ меньше?',
            knopki: ['$\\angle B$', '$\\angle A$', 'Они равны'],
            verno: 0,
            da: 'угол $A$ вдвое больше угла $B$, значит, меньше угол $B$.',
            utochnenie: 'В условии: угол $A$ вдвое больше угла $B$. Какой же из них меньше?',
            fakt: null,
          },
          {
            vvod: 'Обозначим меньший угол буквой $x$: $\\angle B = x$.',
            vopros: 'Чему тогда равен угол $A$?',
            knopki: ['$2x$', '$x + 2$', '$\\dfrac{x}{2}$'],
            verno: 0,
            da: 'угол $A$ вдвое больше угла $B$, то есть вдвое больше $x$.',
            formuly: ['\\angle A = 2x'],
            utochnenie: '«Вдвое больше» — это прибавить $2$ или умножить на $2$?',
            sloy: 2,
            fakt: null,
          },
          {
            vopros: 'Чему равна сумма углов треугольника?',
            knopki: ['$180^\\circ$', '$360^\\circ$', '$90^\\circ$'],
            verno: 0,
            da: 'по теореме о сумме углов: три угла любого треугольника вместе дают $180^\\circ$.',
            formuly: [`2x + x + ${g(c)} = 180^\\circ`],
            utochnenie: 'Если сложить все три угла любого треугольника, сколько получится?',
            fakt: 'summa-uglov',
          },
          {
            vopros: 'Чему равно $x$?',
            knopki: gradusy(b, a, (180 - c) / 2, 180 - c, c),
            verno: 0,
            da: `$2x + x = 3x$, а $3x = 180^\\circ - ${g(c)}$. Делим на $3$.`,
            formuly: [
              `3x = 180^\\circ - ${g(c)} = ${g(180 - c)}`,
              `x = ${g(180 - c)} : 3 = ${g(b)}`,
            ],
            utochnenie: `Сложи $2x$ и $x$. Сколько всего $x$ получилось? Перенеси $${g(c)}$ в другую часть.`,
            fakt: null,
          },
          {
            vopros: '$x$ — это уже ответ?',
            knopki: ['Нет: $x$ — это угол $B$, а найти надо угол $A$', 'Да'],
            verno: 0,
            da: `$x$ — это угол $B$, а $\\angle A = 2x$. Удвой $x = ${g(b)}$ и посчитай сам.`,
            utochnenie: 'Какой угол просят найти в задаче? Каким углом мы обозначили $x$?',
            fakt: null,
          },
        ],
      },
    ],
    priem: {
      nazvanie: 'Неизвестный угол обозначаем $x$, другие выражаем через него',
      fakt: 'summa-uglov',
    },
  };
}

/* ── Равнобедренный: угол при вершине (P1-1-03) ──────────────────── */

/**
 * Подсказка к «$AC = BC$, $\angle A$ дан, найдите угол $C$»: какой это
 * треугольник → какой угол равен углу $A$ → сумма углов → как найти $C$.
 * Слой 1 сцены — дуга у угла $B$ с его величиной. Последнее действие —
 * посчитать — ученик делает сам.
 */
export function scenariyUgolPriVershine(a: number): Scenariy {
  return {
    sposoby: [
      {
        nazvanie: 'Углы при основании',
        shagi: [
          {
            vopros: '$AC = BC$. Какой это треугольник?',
            knopki: ['Равнобедренный с основанием $AB$', 'Равносторонний', 'Прямоугольный'],
            verno: 0,
            da: 'две стороны равны — треугольник равнобедренный. Равные стороны $AC$ и $BC$ — боковые, третья сторона $AB$ — основание.',
            utochnenie: 'Посмотри на засечки: сколько сторон треугольника равны?',
            fakt: 'ravnobedrennyy-opr',
          },
          {
            vopros: 'Какой угол равен углу $A$?',
            knopki: ['$\\angle B$', '$\\angle C$', 'Никакой'],
            verno: 0,
            da: 'углы при основании равнобедренного треугольника равны. Основание — $AB$, углы при нём — $A$ и $B$.',
            formuly: [`\\angle B = \\angle A = ${g(a)}`],
            utochnenie: 'Углы при основании — те, что прилежат к основанию $AB$. Какие это углы?',
            sloy: 1,
            fakt: 'ravnobedrennyy-ugly',
            vNashey:
              'равные стороны — $AC$ и $BC$, основание — $AB$, углы при основании — $\\angle A$ и $\\angle B$',
          },
          {
            vopros: 'Чему равна сумма углов треугольника?',
            knopki: [
              '$180^\\circ$',
              '$360^\\circ$',
              180 - 2 * a === 90 ? '$270^\\circ$' : '$90^\\circ$',
            ],
            verno: 0,
            da: 'по теореме о сумме углов: три угла любого треугольника вместе дают $180^\\circ$.',
            formuly: ['\\angle A + \\angle B + \\angle C = 180^\\circ'],
            utochnenie: 'Если сложить все три угла любого треугольника, сколько получится?',
            fakt: 'summa-uglov',
          },
          {
            vopros: 'Как найти угол $C$?',
            knopki: [
              '$180^\\circ - 2\\angle A$',
              '$180^\\circ - \\angle A$',
              '$\\dfrac{180^\\circ - \\angle A}{2}$',
            ],
            verno: 0,
            da: 'из $180^\\circ$ вычитаем два равных угла при основании. Осталось посчитать.',
            formuly: [`\\angle C = 180^\\circ - 2\\cdot ${g(a)}`],
            utochnenie:
              'Из $180^\\circ$ надо вычесть углы $A$ и $B$. Они равны — сколько раз вычитаем $\\angle A$?',
            fakt: null,
          },
        ],
      },
    ],
  };
}

export const PAMYATKA_SMEZHNYE: FaktPamyatki[] = [
  {
    tekst: 'Сумма смежных углов равна $180^\\circ$: вместе они образуют развёрнутый угол.',
    formula: '\\angle AOC + \\angle COB = 180^\\circ',
    risunok: smezhnyeRis(),
  },
  { tekst: 'Вертикальные углы равны.', risunok: vertikalnyeRis() },
  {
    tekst: 'Параллельные прямые и секущая: **накрест лежащие** углы равны.',
    risunok: paraRis((m, n) => [
      ug('B', m, n, { cvet: 1, radiusPx: 13 }),
      ug('C', n, m, { cvet: 1, radiusPx: 13 }),
    ]),
  },
  {
    tekst: 'Параллельные прямые и секущая: **соответственные** углы равны.',
    risunok: paraRis((m, n) => [
      ug('B', m, n, { cvet: 1, radiusPx: 13 }),
      ug('D', n, 'Q', { cvet: 1, radiusPx: 13 }),
    ]),
  },
  {
    tekst: 'Параллельные прямые и секущая: сумма **односторонних** углов равна $180^\\circ$.',
    formula: '\\alpha + \\beta = 180^\\circ',
    risunok: paraRis((m, n) => [
      ug('B', m, n, { cvet: 1, radiusPx: 13 }),
      ug('D', n, m, { cvet: 2, dugi: 2, radiusPx: 13 }),
    ]),
  },
];
