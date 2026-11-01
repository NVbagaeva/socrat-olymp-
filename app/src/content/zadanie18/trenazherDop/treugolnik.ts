/**
 * Задачи тренажёра №18, тема «Треугольник». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/dop/treugolnik.ts, проверка —
 * scripts/verify_schemes/trenazherDop/treugolnik.mjs.
 */

import type { ZadachaDop18 } from './tipy';

export const TR18_SREDLIN: ZadachaDop18 = {
  id: 'tr-sredlin',
  uroven: 1,
  nazvanie: 'Середины трёх сторон',
  uslovie: 'Точки $M$, $N$ и $K$ — середины сторон $AB$, $BC$ и $CA$ треугольника $ABC$.',
  a: 'Докажите, что четырёхугольник $AMNK$ — параллелограмм.',
  b: 'Найдите периметр четырёхугольника $AMNK$, если $AB = 10$ и $AC = 14$.',
  skhemy: [
    {
      id: 'sredlin-treug',
      zachem: '$MN$ и $NK$ — средние линии: каждая параллельна стороне и равна её половине',
    },
  ],
  podskazka:
    'Найди в треугольнике две средние линии с концом в точке $N$. Чему они параллельны и чему равны?',
  dokazatelstvo: [
    {
      tekst:
        '$MN$ — средняя линия треугольника $ABC$ (соединяет середины $AB$ и $BC$), поэтому $MN \\parallel AC$ и $MN = \\dfrac12 AC$.',
      gruppy: ['mn'],
    },
    {
      tekst:
        'Точно так же $NK$ — средняя линия: $NK \\parallel AB$. Значит, в четырёхугольнике $AMNK$ противоположные стороны попарно параллельны ($MN \\parallel AK$, $NK \\parallel AM$), и это параллелограмм.',
      gruppy: ['nk', 'par'],
    },
  ],
  reshenieB: [
    {
      tekst: 'Стороны параллелограмма: $AM = \\dfrac12 AB = 5$ и $AK = \\dfrac12 AC = 7$.',
      gruppy: ['per'],
    },
    {
      tekst:
        'Противоположные стороны параллелограмма равны: $MN = AK = 7$, $NK = AM = 5$. Периметр $P = 2(5 + 7) = 24$.',
      gruppy: ['par'],
    },
  ],
  otvet: 24,
};

export const TR18_INCENTR: ZadachaDop18 = {
  id: 'tr-incentr',
  uroven: 2,
  nazvanie: 'Как центр вписанной окружности делит биссектрису',
  uslovie: 'Биссектрисы $AA_1$ и $BB_1$ треугольника $ABC$ пересекаются в точке $I$.',
  a: 'Докажите, что $AI : IA_1 = (AB + AC) : BC$.',
  b: 'Найдите $AI : IA_1$, если $AB = 6$, $AC = 9$ и $BC = 10$.',
  skhemy: [
    {
      id: 'bissektrisa',
      zachem:
        'биссектриса делит противоположную сторону в отношении прилежащих сторон — её применяют дважды',
    },
  ],
  podskazka:
    'Сначала найди $BA_1$ через стороны треугольника. Потом посмотри на треугольник $ABA_1$: кто в нём биссектриса?',
  dokazatelstvo: [
    {
      tekst:
        '$AA_1$ — биссектриса треугольника $ABC$: $\\dfrac{BA_1}{A_1C} = \\dfrac{AB}{AC}$, откуда $BA_1 = \\dfrac{AB\\cdot BC}{AB + AC}$.',
      gruppy: ['bisA'],
    },
    {
      tekst:
        'В треугольнике $ABA_1$ отрезок $BI$ — биссектриса угла $B$, поэтому $\\dfrac{AI}{IA_1} = \\dfrac{AB}{BA_1} = AB : \\dfrac{AB\\cdot BC}{AB + AC} = \\dfrac{AB + AC}{BC}$.',
      gruppy: ['bisB'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По пункту а) $\\dfrac{AI}{IA_1} = \\dfrac{AB + AC}{BC} = \\dfrac{6 + 9}{10} = \\dfrac32$.',
      gruppy: ['otv'],
    },
  ],
  otvet: 3 / 2,
};
