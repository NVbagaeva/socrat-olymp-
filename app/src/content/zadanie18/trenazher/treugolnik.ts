/**
 * Задачи тренажёра №18, тема «Треугольник». Составлены для сайта.
 * Чертежи — lib/zadanie18/trenazher/treugolnik.ts, проверка —
 * scripts/verify_trenazher18/treugolnik.mjs.
 */

import type { Zadacha18 } from './tipy';

export const TR18_SREDLIN: Zadacha18 = {
  id: 'tr-sredlin',
  no: 1,
  gruppa: 'treugolnik',
  uroven: 'razminka',
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
  otvet: '$24$',
};

export const TR18_VYSOTY: Zadacha18 = {
  id: 'tr-vysoty',
  no: 2,
  gruppa: 'treugolnik',
  uroven: 'ege',
  nazvanie: 'Две высоты и отрезок между их основаниями',
  uslovie: 'В остроугольном треугольнике $ABC$ проведены высоты $AA_1$ и $BB_1$.',
  a: 'Докажите, что $\\angle AA_1B_1 = \\angle ABB_1$.',
  b: 'Найдите $A_1B_1$, если $AB = 12$ и $\\angle ACB = 45^\\circ$.',
  skhemy: [
    {
      id: 'pryamye-ugly',
      zachem:
        'точки $A_1$ и $B_1$ видят $AB$ под прямым углом — они на окружности с диаметром $AB$',
    },
    {
      id: 'vysoty',
      zachem: 'две высоты отсекают треугольник $A_1B_1C$, подобный $ABC$ с коэффициентом $\\cos C$',
    },
  ],
  podskazka:
    'Два прямых угла опираются на один и тот же отрезок $AB$. Какая окружность здесь спрятана?',
  dokazatelstvo: [
    {
      tekst:
        '$\\angle AA_1B = \\angle AB_1B = 90^\\circ$, поэтому точки $A_1$ и $B_1$ лежат на окружности с диаметром $AB$.',
      gruppy: ['okr'],
    },
    {
      tekst:
        'В этой окружности углы $AA_1B_1$ и $ABB_1$ — вписанные и опираются на одну дугу $AB_1$. Значит, $\\angle AA_1B_1 = \\angle ABB_1$.',
      gruppy: ['ugly', 'okr'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Из прямоугольных треугольников $AA_1C$ и $BB_1C$: $CA_1 = AC\\cos C$, $CB_1 = BC\\cos C$.',
      gruppy: ['pod'],
    },
    {
      tekst:
        'Угол $C$ у треугольников $A_1B_1C$ и $ABC$ общий, а прилежащие стороны пропорциональны с коэффициентом $\\cos C$. Значит, $\\triangle A_1B_1C \\sim \\triangle ABC$ и $A_1B_1 = AB\\cos C$.',
      gruppy: ['pod', 'otv'],
    },
    {
      tekst: '$A_1B_1 = 12\\cos 45^\\circ = 12\\cdot\\dfrac{\\sqrt2}{2} = 6\\sqrt2$.',
      gruppy: ['otv'],
    },
  ],
  otvet: '$6\\sqrt2$',
};

export const TR18_INCENTR: Zadacha18 = {
  id: 'tr-incentr',
  no: 3,
  gruppa: 'treugolnik',
  uroven: 'ege',
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
  otvet: '$\\dfrac{3}{2}$',
};

export const TR18_MEDIANA: Zadacha18 = {
  id: 'tr-mediana',
  no: 4,
  gruppa: 'treugolnik',
  uroven: 'povyshennyy',
  nazvanie: 'Медиана и площадь треугольника',
  uslovie: 'В треугольнике $ABC$ проведена медиана $AM$.',
  a: 'Докажите, что $AB^2 + AC^2 = 2AM^2 + \\dfrac12 BC^2$.',
  b: 'Найдите площадь треугольника $ABC$, если $AB = 7$, $AC = 9$ и $AM = 7$.',
  skhemy: [
    {
      id: 'udvoenie-mediany',
      zachem: 'продолжение медианы на её длину достраивает треугольник до параллелограмма',
    },
  ],
  podskazka:
    'Продли медиану $AM$ за точку $M$ на её длину. Что получилось и что известно о диагоналях такой фигуры?',
  dokazatelstvo: [
    {
      tekst:
        'Продлим $AM$ за точку $M$ на отрезок $MD = AM$. Диагонали $AD$ и $BC$ четырёхугольника $ABDC$ делятся точкой $M$ пополам, значит, $ABDC$ — параллелограмм: $BD = AC$, $CD = AB$.',
      gruppy: ['par', 'diag'],
    },
    {
      tekst:
        'В параллелограмме сумма квадратов диагоналей равна сумме квадратов всех сторон: $AD^2 + BC^2 = 2AB^2 + 2AC^2$. Это теорема косинусов для треугольников $ABD$ и $BAC$: углы $ABD$ и $BAC$ в сумме дают $180^\\circ$, и их косинусы противоположны.',
      gruppy: ['par'],
    },
    {
      tekst:
        'Подставим $AD = 2AM$: $4AM^2 + BC^2 = 2AB^2 + 2AC^2$. Разделив на 2, получаем $AB^2 + AC^2 = 2AM^2 + \\dfrac12 BC^2$.',
      gruppy: ['diag'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По пункту а): $49 + 81 = 2\\cdot 49 + \\dfrac12 BC^2$, откуда $BC^2 = 64$ и $BC = 8$.',
      gruppy: ['diag'],
    },
    {
      tekst:
        'Стороны треугольника — $7$, $8$, $9$. Полупериметр $p = 12$, по формуле Герона $S = \\sqrt{12\\cdot 5\\cdot 4\\cdot 3} = \\sqrt{720} = 12\\sqrt5$.',
      gruppy: ['geron'],
    },
  ],
  otvet: '$12\\sqrt5$',
};
