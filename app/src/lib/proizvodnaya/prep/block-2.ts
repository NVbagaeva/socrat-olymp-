/** Блок P9-2 · Смежный угол и знак наклона. */

import type { Rng } from '../../veroyatnost/generator';
import { shag } from '../prototypes/common';
import { para } from './block-1';
import { d, figPryamaya, micro, qChislo, razborIz, vopros, vybor } from './pomoshniki';
import type { PrepGenerated, PrepMicro } from './types';

const OSTR = 'острый';
const TUP = 'тупой';

function risunok(r: Rng, ks: number[]) {
  const p = para(r, ks, 3, 8);
  if (p === null) {
    return null;
  }
  const fig = figPryamaya(p.A, p.B, [{ t: 'treugolnik', shag: 2 }]);
  return fig === null ? null : { fig, p };
}

function znakK(k: number): string {
  return k > 0 ? '$k>0$' : k < 0 ? '$k<0$' : '$k=0$';
}

/** Выбор знака k по рисунку. */
const m01 = micro(
  'P9-2-01',
  'Знак углового коэффициента по рисунку',
  'choice',
  (r): PrepGenerated | null => {
    const g = risunok(r, [1, 2, 0.5, -1, -2, -0.5, 0, 0.25, -0.25, 1.5, -1.5]);
    if (g === null) {
      return null;
    }
    const { fig, p } = g;
    const v = vybor(
      r,
      znakK(p.k),
      ['$k>0$', '$k<0$', '$k=0$'].filter((s) => s !== znakK(p.k)),
    );
    const dir = p.k > 0 ? 'вверх' : p.k < 0 ? 'вниз' : 'горизонтально';
    return {
      uslovie: 'На рисунке изображена прямая $y=kx+m$. Какой знак имеет угловой коэффициент $k$?',
      risunok: fig,
      varianty: v.varianty,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag('Смотрим слева направо', `Прямая идёт ${dir}.`),
        shag(
          'Связь с углом',
          p.k > 0
            ? 'Угол $\\alpha$ острый, $\\operatorname{tg}\\alpha>0$.'
            : p.k < 0
              ? 'Угол $\\alpha$ тупой, $\\operatorname{tg}\\alpha<0$.'
              : 'Угол $\\alpha=0^\\circ$, $\\operatorname{tg}\\alpha=0$.',
        ),
        shag('Ответ', znakK(p.k)),
      ]),
      podskazka: [
        vopros(
          r,
          'Куда идёт прямая, если смотреть слева направо?',
          p.k > 0 ? 'Вверх' : p.k < 0 ? 'Вниз' : 'Горизонтально',
          ['Вверх', 'Вниз', 'Горизонтально']
            .filter((s) => s !== (p.k > 0 ? 'Вверх' : p.k < 0 ? 'Вниз' : 'Горизонтально'))
            .map((s) => ({
              tekst: s,
              pochemu:
                s === 'Горизонтально'
                  ? 'Узлы стоят на разной высоте: наклон есть.'
                  : s === 'Вверх'
                    ? 'Правая точка ниже левой: прямая опускается.'
                    : 'Правая точка выше левой: прямая поднимается.',
            })),
          `Прямая идёт ${dir}.`,
          1,
        ),
        vopros(
          r,
          'Каким получается угол $\\alpha$ с положительным направлением $Ox$?',
          p.k > 0 ? 'Острым' : p.k < 0 ? 'Тупым' : 'Нулевым',
          ['Острым', 'Тупым', 'Нулевым']
            .filter((s) => s !== (p.k > 0 ? 'Острым' : p.k < 0 ? 'Тупым' : 'Нулевым'))
            .map((s) => ({
              tekst: s,
              pochemu:
                s === 'Острым'
                  ? 'Острый угол даёт подъём вверх, а здесь иначе.'
                  : s === 'Тупым'
                    ? 'Тупой угол — прямая опускается, а здесь иначе.'
                    : 'Нулевой угол — горизонтальная прямая, а здесь иначе.',
            })),
          p.k > 0 ? 'Угол острый.' : p.k < 0 ? 'Угол тупой.' : 'Угол нулевой.',
          2,
        ),
        vopros(
          r,
          'Какой знак у тангенса такого угла?',
          znakK(p.k),
          ['$k>0$', '$k<0$', '$k=0$']
            .filter((s) => s !== znakK(p.k))
            .map((s) => ({
              tekst: s,
              pochemu:
                'Тангенс острого угла положителен, тупого — отрицателен, нулевого — равен нулю.',
            })),
          `Знак: ${znakK(p.k)}.`,
          2,
        ),
      ],
      params: { k: p.k, ax: p.A[0], ay: p.A[1] },
    };
  },
);

const m02 = micro(
  'P9-2-02',
  'Острый или тупой угол наклона',
  'choice',
  (r): PrepGenerated | null => {
    const g = risunok(r, [1, 2, 0.5, -1, -2, -0.5, 0.25, -0.25, 1.5, -1.5, -0.75, 0.75]);
    if (g === null) {
      return null;
    }
    const { fig, p } = g;
    const verno = p.k > 0 ? OSTR : TUP;
    const v = vybor(r, verno, [p.k > 0 ? TUP : OSTR, 'прямой']);
    return {
      uslovie:
        'На рисунке изображена прямая. Каким является угол $\\alpha$ между этой прямой и положительным направлением оси $Ox$?',
      risunok: fig,
      varianty: v.varianty,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag(
          'Направление',
          p.k > 0 ? 'Слева направо прямая поднимается.' : 'Слева направо прямая опускается.',
        ),
        shag(
          'Угол',
          p.k > 0
            ? 'Подъём вверх — угол между прямой и осью $Ox$ меньше $90^\\circ$.'
            : 'Спуск вниз — угол от оси $Ox$ до прямой, отсчитанный против часовой стрелки, больше $90^\\circ$.',
        ),
        shag('Ответ', verno),
      ]),
      podskazka: [
        vopros(
          r,
          'Прямая поднимается или опускается слева направо?',
          p.k > 0 ? 'Поднимается' : 'Опускается',
          [
            {
              tekst: p.k > 0 ? 'Опускается' : 'Поднимается',
              pochemu: p.k > 0 ? 'Правая точка выше левой.' : 'Правая точка ниже левой.',
            },
          ],
          p.k > 0 ? 'Поднимается.' : 'Опускается.',
          1,
        ),
        vopros(
          r,
          'Какому углу это соответствует?',
          p.k > 0 ? 'Меньше $90^\\circ$: острый' : 'Больше $90^\\circ$: тупой',
          [
            {
              tekst: p.k > 0 ? 'Больше $90^\\circ$: тупой' : 'Меньше $90^\\circ$: острый',
              pochemu:
                p.k > 0
                  ? 'Подъём вверх — это острый угол.'
                  : 'Спуск вниз — это тупой угол: поворачиваем от $Ox$ дальше вертикали.',
            },
            {
              tekst: 'Равен $90^\\circ$: прямой',
              pochemu: 'Прямой угол — вертикальная прямая, а эта наклонная.',
            },
          ],
          `Угол ${verno}.`,
          2,
        ),
      ],
      params: { k: p.k },
    };
  },
);

const m03 = micro(
  'P9-2-03',
  'Тангенс тупого угла по катетам смежного',
  'number',
  (r): PrepGenerated | null => {
    const q = r.pick([2, 4, 5, 8, 3, 6]);
    const p = r.int(1, 10);
    const k = -p / q;
    if (Math.abs(k * 1000 - Math.round(k * 1000)) > 1e-9) {
      return null;
    }
    return {
      uslovie: `Угол $\\alpha$ тупой. В прямоугольном треугольнике острый угол $180^\\circ-\\alpha$ имеет противолежащий катет ${p} и прилежащий катет ${q}. Найдите $\\operatorname{tg}\\alpha$.`,
      risunok: null,
      otvet: k,
      proverka: -(p / q),
      razbor: razborIz([
        shag(
          'Острый смежный угол',
          `$\\operatorname{tg}(180^\\circ-\\alpha)=\\dfrac{${p}}{${q}}=${d(p / q)}$.`,
        ),
        shag(
          'Переходим к тупому углу',
          'Тангенс тупого угла отрицателен: $\\operatorname{tg}\\alpha=-\\operatorname{tg}(180^\\circ-\\alpha)$.',
        ),
        shag('Ответ', `$\\operatorname{tg}\\alpha=${d(k)}$`),
      ]),
      podskazka: [
        qChislo(
          r,
          'Чему равен тангенс острого угла $180^\\circ-\\alpha$?',
          p / q,
          [
            { v: q / p, w: 'Дробь перевёрнута: тангенс — противолежащий катет к прилежащему.' },
            { v: p * q, w: 'Катеты перемножать не нужно, их делят.' },
          ],
          `$\\operatorname{tg}(180^\\circ-\\alpha)=${d(p / q)}$.`,
        ),
        vopros(
          r,
          'Какой знак у тангенса тупого угла?',
          'Минус',
          [
            {
              tekst: 'Плюс',
              pochemu: 'Тангенс положителен только у острого угла; у тупого он отрицателен.',
            },
          ],
          '$\\operatorname{tg}\\alpha<0$.',
        ),
        qChislo(
          r,
          'Чему равен $\\operatorname{tg}\\alpha$?',
          k,
          [
            { v: p / q, w: 'Знак потерян: у тупого угла тангенс отрицателен.' },
            { v: -q / p, w: 'Знак верный, но дробь перевёрнута.' },
          ],
          `$\\operatorname{tg}\\alpha=${d(k)}$.`,
        ),
      ],
      params: { p, q },
    };
  },
);

const COEF = [0.25, 0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 1.6, 2, 2.5, 3, 4, 5];

const m04 = micro(
  'P9-2-04',
  'Тангенс тупого угла по тангенсу смежного',
  'number',
  (r): PrepGenerated | null => {
    const c = r.pick(COEF);
    return {
      uslovie: `Известно, что $\\operatorname{tg}(180^\\circ-\\alpha)=${d(c)}$. Найдите $\\operatorname{tg}\\alpha$.`,
      risunok: null,
      otvet: -c,
      proverka: -Math.tan(Math.atan(c)),
      razbor: razborIz([
        shag(
          'Формула приведения',
          '$\\operatorname{tg}(180^\\circ-\\alpha)=-\\operatorname{tg}\\alpha$.',
        ),
        shag(
          'Выражаем',
          `$-\\operatorname{tg}\\alpha=${d(c)}$, значит $\\operatorname{tg}\\alpha=-${d(c)}$.`,
        ),
        shag('Ответ', `$${d(-c)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Как связаны $\\operatorname{tg}\\alpha$ и $\\operatorname{tg}(180^\\circ-\\alpha)$?',
          '$\\operatorname{tg}(180^\\circ-\\alpha)=-\\operatorname{tg}\\alpha$',
          [
            {
              tekst: '$\\operatorname{tg}(180^\\circ-\\alpha)=\\operatorname{tg}\\alpha$',
              pochemu: 'Так связаны тангенсы углов, отличающихся на $180^\\circ$, а не смежных.',
            },
            {
              tekst:
                '$\\operatorname{tg}(180^\\circ-\\alpha)=\\dfrac{1}{\\operatorname{tg}\\alpha}$',
              pochemu:
                'Обратная величина получается для тангенса дополнения до $90^\\circ$, а не до $180^\\circ$.',
            },
          ],
          'Тангенсы смежных углов противоположны.',
        ),
        qChislo(
          r,
          'Чему равен $\\operatorname{tg}\\alpha$?',
          -c,
          [
            { v: c, w: 'Забыт минус: тангенсы смежных углов отличаются знаком.' },
            {
              v: 1 / c,
              w: 'Это не связано со смежным углом: ответ — число, противоположное данному.',
            },
          ],
          `$\\operatorname{tg}\\alpha=${d(-c)}$.`,
        ),
      ],
      params: { c },
    };
  },
);

const m05 = micro(
  'P9-2-05',
  'Тангенс острого смежного угла',
  'number',
  (r): PrepGenerated | null => {
    const c = r.pick(COEF);
    return {
      uslovie: `Угол $\\alpha$ тупой и $\\operatorname{tg}\\alpha=${d(-c)}$. Найдите тангенс смежного с ним угла $\\operatorname{tg}(180^\\circ-\\alpha)$.`,
      risunok: null,
      otvet: c,
      proverka: -(-c),
      razbor: razborIz([
        shag('Связь', '$\\operatorname{tg}(180^\\circ-\\alpha)=-\\operatorname{tg}\\alpha$.'),
        shag('Подставляем', `$\\operatorname{tg}(180^\\circ-\\alpha)=-(${d(-c)})=${d(c)}$.`),
        shag('Проверка', 'Смежный угол острый, тангенс положителен: ответ верный по знаку.'),
        shag('Ответ', `$${d(c)}$`),
      ]),
      podskazka: [
        vopros(
          r,
          'Каким является угол $180^\\circ-\\alpha$, если $\\alpha$ тупой?',
          'Острым',
          [
            {
              tekst: 'Тупым',
              pochemu: 'Сумма смежных углов $180^\\circ$: если один тупой, другой острый.',
            },
          ],
          'Смежный угол острый, его тангенс положителен.',
        ),
        qChislo(
          r,
          'Чему равен $\\operatorname{tg}(180^\\circ-\\alpha)$?',
          c,
          [
            { v: -c, w: 'Знак не поменян: у острого угла тангенс положителен.' },
            { v: 1 / c, w: 'Нужно только сменить знак, дробь переворачивать не надо.' },
          ],
          `Ответ: $${d(c)}$.`,
        ),
      ],
      params: { c },
    };
  },
);

const m06 = micro(
  'P9-2-06',
  'Верная формула для тупого угла',
  'choice',
  (r): PrepGenerated | null => {
    const al = r.pick([100, 110, 120, 125, 130, 135, 140, 150, 155, 160, 170]);
    const be = 180 - al;
    const t = (x: number) => `\\operatorname{tg}${x}^\\circ`;
    const verno = `$${t(al)}=-${t(be)}$`;
    const v = vybor(r, verno, [
      `$${t(al)}=${t(be)}$`,
      `$${t(al)}=\\dfrac{1}{${t(be)}}$`,
      `$${t(al)}=-\\dfrac{1}{${t(be)}}$`,
    ]);
    return {
      uslovie: `Какое из равенств верно?`,
      risunok: null,
      varianty: v.varianty,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag('Смежный угол', `$180^\\circ-${al}^\\circ=${be}^\\circ$ — острый угол.`),
        shag(
          'Формула',
          `$\\operatorname{tg}(180^\\circ-\\varphi)=-\\operatorname{tg}\\varphi$, значит ${verno}.`,
        ),
      ]),
      podskazka: [
        vopros(
          r,
          `Каким углом является $${al}^\\circ$ и чему равен смежный с ним?`,
          `Тупым; смежный равен $${be}^\\circ$`,
          [
            {
              tekst: `Острым; смежный равен $${be}^\\circ$`,
              pochemu: `Угол $${al}^\\circ$ больше $90^\\circ$ — он тупой.`,
            },
            {
              tekst: `Тупым; смежный равен $${al - 90}^\\circ$`,
              pochemu: `Смежные углы дают в сумме $180^\\circ$, а не $90^\\circ$.`,
            },
          ],
          `Смежный угол: $${be}^\\circ$.`,
          1,
        ),
        vopros(
          r,
          `Какой знак у $${t(al)}$?`,
          'Минус',
          [{ tekst: 'Плюс', pochemu: 'Тангенс тупого угла отрицателен.' }],
          'Тангенс отрицателен, значит перед $\\operatorname{tg}$ смежного угла стоит минус.',
          1,
        ),
      ],
      params: { al },
    };
  },
);

const m07 = micro(
  'P9-2-07',
  'Тангенс острого угла между убывающей прямой и осью',
  'number',
  (r): PrepGenerated | null => {
    const g = risunok(r, [-1, -2, -0.5, -0.25, -0.75, -1.5, -3]);
    if (g === null) {
      return null;
    }
    const { fig, p } = g;
    const dx = p.B[0] - p.A[0];
    const dy = p.A[1] - p.B[1];
    return {
      uslovie:
        'На рисунке изображена прямая, образующая с положительным направлением оси $Ox$ тупой угол $\\alpha$. Найдите тангенс острого угла $180^\\circ-\\alpha$.',
      risunok: fig,
      otvet: -p.k,
      proverka: dy / dx,
      razbor: razborIz([
        shag('Катеты', `По узлам: $\\Delta x=${dx}$, $\\Delta y=${dy}$.`),
        shag(
          'Острый угол',
          `Он лежит внутри прямоугольного треугольника: $\\operatorname{tg}(180^\\circ-\\alpha)=\\dfrac{${dy}}{${dx}}=${d(-p.k)}$.`,
        ),
        shag('Ответ', `$${d(-p.k)}$`),
      ]),
      podskazka: [
        qChislo(
          r,
          'Чему равны катеты: найдите $\\Delta y$ (по модулю) между узлами.',
          dy,
          [
            { v: dx, w: 'Это горизонтальный катет.' },
            { v: dy + 1, w: 'Вертикальный катет посчитан с лишней клеткой.' },
          ],
          `$\\Delta y=${dy}$, $\\Delta x=${dx}$.`,
          2,
        ),
        qChislo(
          r,
          'Чему равен тангенс острого угла $180^\\circ-\\alpha$?',
          -p.k,
          [
            { v: p.k, w: 'Острый угол имеет положительный тангенс: минус не нужен.' },
            { v: dx / dy, w: 'Катеты поделены наоборот.' },
          ],
          `Ответ: $${d(-p.k)}$.`,
          2,
        ),
      ],
      params: { k: p.k },
    };
  },
);

const m08 = micro(
  'P9-2-08',
  'Какое число может быть угловым коэффициентом',
  'choice',
  (r): PrepGenerated | null => {
    const tup = r.next() < 0.5;
    const neg = [-0.5, -1, -2, -3, -1.5, -0.25, -4, -2.5];
    const pos = [0.5, 1, 2, 3, 1.5, 0.25, 4, 2.5];
    const verno = tup ? r.pick(neg) : r.pick(pos);
    const others = (tup ? pos : neg).filter((x) => Math.abs(x) !== Math.abs(verno));
    const wrong: number[] = [];
    while (wrong.length < 3 && others.length > 0) {
      const i = r.int(0, others.length - 1);
      wrong.push(others.splice(i, 1)[0] as number);
    }
    const v = vybor(
      r,
      `$${d(verno)}$`,
      wrong.map((x) => `$${d(x)}$`),
    );
    return {
      uslovie: `Прямая образует с положительным направлением оси $Ox$ ${tup ? 'тупой' : 'острый'} угол. Какое из чисел может быть её угловым коэффициентом?`,
      risunok: null,
      varianty: v.varianty,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag(
          'Знак тангенса',
          tup ? 'У тупого угла тангенс отрицателен.' : 'У острого угла тангенс положителен.',
        ),
        shag(
          'Отбор',
          `Из чисел подходит только ${tup ? 'отрицательное' : 'положительное'}: $${d(verno)}$.`,
        ),
      ]),
      podskazka: [
        vopros(
          r,
          `Какой знак имеет угловой коэффициент при ${tup ? 'тупом' : 'остром'} угле?`,
          tup ? 'Отрицательный' : 'Положительный',
          [
            {
              tekst: tup ? 'Положительный' : 'Отрицательный',
              pochemu: tup
                ? 'Положительный тангенс бывает только у острого угла.'
                : 'Отрицательный тангенс бывает только у тупого угла.',
            },
          ],
          tup ? '$k<0$.' : '$k>0$.',
        ),
        vopros(
          r,
          'Какое число подходит?',
          `$${d(verno)}$`,
          wrong.slice(0, 2).map((x) => ({
            tekst: `$${d(x)}$`,
            pochemu:
              x < 0
                ? 'Это число отрицательно, а нужен положительный коэффициент.'
                : 'Это число положительно, а нужен отрицательный коэффициент.',
          })),
          `Подходит $${d(verno)}$.`,
        ),
      ],
      params: { verno, tup: tup ? 1 : 0 },
    };
  },
);

const m09 = micro(
  'P9-2-09',
  'Произведение тангенсов смежных углов',
  'number',
  (r): PrepGenerated | null => {
    const c = r.pick([0.5, 1.5, 2, 2.5, 3, 4, 0.4, 0.8, 1.2]);
    const ans = -c * c;
    if (Math.abs(ans * 1000 - Math.round(ans * 1000)) > 1e-9) {
      return null;
    }
    return {
      uslovie: `Углы $\\alpha$ и $\\beta$ смежные, угол $\\beta$ острый и $\\operatorname{tg}\\beta=${d(c)}$. Найдите $\\operatorname{tg}\\alpha\\cdot\\operatorname{tg}\\beta$.`,
      risunok: null,
      otvet: ans,
      proverka: Math.round(-c * c * 1e6) / 1e6,
      razbor: razborIz([
        shag(
          'Тангенс угла $\\alpha$',
          `Смежные углы: $\\operatorname{tg}\\alpha=-\\operatorname{tg}\\beta=${d(-c)}$.`,
        ),
        shag(
          'Произведение',
          `$\\operatorname{tg}\\alpha\\cdot\\operatorname{tg}\\beta=${d(-c)}\\cdot ${d(c)}=-${d(c)}^2=${d(ans)}$.`,
        ),
        shag('Ответ', `$${d(ans)}$`),
      ]),
      podskazka: [
        qChislo(
          r,
          'Чему равен $\\operatorname{tg}\\alpha$?',
          -c,
          [
            { v: c, w: 'Тангенсы смежных углов противоположны по знаку.' },
            { v: 1 / c, w: 'Дробь переворачивать не нужно: нужно сменить знак.' },
          ],
          `$\\operatorname{tg}\\alpha=${d(-c)}$.`,
          0,
        ),
        qChislo(
          r,
          'Чему равно произведение?',
          ans,
          [
            { v: c * c, w: 'Произведение числа и ему противоположного отрицательно.' },
            { v: -c, w: 'Нужно умножить числа, а не взять одно из них.' },
            { v: 0, w: 'Сумма тангенсов равна нулю, а произведение — нет.' },
          ],
          `Ответ: $${d(ans)}$.`,
        ),
      ],
      params: { c },
    };
  },
);

const m10 = micro(
  'P9-2-10',
  'Угол наклона по уравнению прямой',
  'choice',
  (r): PrepGenerated | null => {
    const k = r.pick([1, 2, 3, -1, -2, -3, 0.5, -0.5, 1.5, -1.5, 0.25, -0.25, 0]);
    const m = r.int(-9, 9);
    const kk = k === 1 ? '' : k === -1 ? '-' : d(k);
    const tex = k === 0 ? `y=${d(m)}` : `y=${kk}x${m === 0 ? '' : m > 0 ? `+${m}` : String(m)}`;
    const verno = k > 0 ? OSTR : k < 0 ? TUP : 'нулевой';
    const v = vybor(
      r,
      verno,
      [OSTR, TUP, 'нулевой'].filter((s) => s !== verno),
    );
    return {
      uslovie: `Прямая задана уравнением $${tex}$. Каким является угол между этой прямой и положительным направлением оси $Ox$: острым, тупым или нулевым?`,
      risunok: null,
      varianty: v.varianty,
      otvet: v.otvet,
      proverka: v.otvet,
      razbor: razborIz([
        shag('Угловой коэффициент', `В уравнении $y=kx+m$ коэффициент при $x$ равен $k=${d(k)}$.`),
        shag(
          'Знак',
          k > 0
            ? '$k>0$, значит $\\operatorname{tg}\\alpha>0$: угол острый.'
            : k < 0
              ? '$k<0$, значит $\\operatorname{tg}\\alpha<0$: угол тупой.'
              : '$k=0$: прямая параллельна оси $Ox$, угол нулевой.',
        ),
        shag('Ответ', verno),
      ]),
      podskazka: [
        qChislo(
          r,
          'Чему равен угловой коэффициент $k$ — число перед $x$?',
          k,
          [
            {
              v: m,
              w: 'Это свободный член $m$ (где прямая пересекает ось $Oy$), а не угловой коэффициент.',
            },
            { v: -k, w: 'Знак коэффициента берём как в записи уравнения.' },
          ],
          `$k=${d(k)}$.`,
        ),
        vopros(
          r,
          'Какой угол отвечает такому знаку $k$?',
          verno === OSTR ? 'Острый ($k>0$)' : verno === TUP ? 'Тупой ($k<0$)' : 'Нулевой ($k=0$)',
          ['Острый ($k>0$)', 'Тупой ($k<0$)', 'Нулевой ($k=0$)']
            .filter(
              (s) =>
                !s.startsWith(
                  verno === 'нулевой' ? 'Нулевой' : verno === OSTR ? 'Острый' : 'Тупой',
                ),
            )
            .map((s) => ({
              tekst: s,
              pochemu:
                'Знак $k$ другой: острый угол при $k>0$, тупой при $k<0$, нулевой при $k=0$.',
            })),
          `Угол ${verno}.`,
        ),
      ],
      params: { k, m },
    };
  },
);

export const BLOCK_2: PrepMicro[] = [m01, m02, m03, m04, m05, m06, m07, m08, m09, m10];
