/**
 * Опорные задачи №18, тема «Окружность и вписанные углы». Составлены
 * для сайта. Проверка: scripts/verify_schemes/opornyeDop/okruzhnost.mjs.
 */

import type { OpornayaDop18 } from './tipy';

export const OP18_KVADRAT: OpornayaDop18 = {
  id: 'kvadrat-na-gipotenuze',
  no: 8,
  nazvanie: 'Квадрат на гипотенузе',
  uslovie:
    'На гипотенузе $AB$ прямоугольного треугольника $ABC$ вне его построен квадрат $ABDE$; $O$ — центр квадрата.',
  a: 'Докажите, что $CO$ — биссектриса угла $ACB$.',
  b: 'Найдите $CO$, если $AC = 6$ и $BC = 8$.',
  skhemy: [
    {
      id: 'pryamye-ugly',
      zachem:
        'из $C$ и $O$ гипотенуза видна под прямым углом — обе точки на окружности с диаметром $AB$',
    },
    {
      id: 'ugly-i-dugi',
      zachem: 'равные хорды $OA$ и $OB$ стягивают равные дуги, на них опираются равные углы',
    },
  ],
  reshenieA: [
    {
      tekst:
        '$\\angle ACB = 90^\\circ$ по условию, $\\angle AOB = 90^\\circ$, потому что диагонали квадрата перпендикулярны. Значит, точки $C$ и $O$ лежат на окружности с диаметром $AB$, причём по разные стороны от $AB$.',
      gruppy: ['okr'],
    },
    {
      tekst:
        '$OA = OB$ (половины равных диагоналей квадрата). Равные хорды стягивают равные дуги, поэтому вписанные углы $ACO$ и $OCB$, которые на них опираются, равны. Значит, $CO$ — биссектриса угла $ACB$.',
      gruppy: ['hord', 'bis'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'По теореме Пифагора $AB = \\sqrt{6^2 + 8^2} = 10$, поэтому $AO = \\dfrac{AB}{\\sqrt2} = 5\\sqrt2$. По пункту а) $\\angle ACO = 45^\\circ$.',
      gruppy: ['aco'],
    },
    {
      tekst:
        'Пусть $CO = x$. Теорема косинусов в треугольнике $ACO$: $AO^2 = AC^2 + CO^2 - 2\\cdot AC\\cdot CO\\cos 45^\\circ$, то есть $50 = 36 + x^2 - 6\\sqrt2\\,x$.',
      gruppy: ['aco'],
    },
    {
      tekst:
        '$x^2 - 6\\sqrt2\\,x - 14 = 0$, $x = \\dfrac{6\\sqrt2 + \\sqrt{72 + 56}}{2} = \\dfrac{6\\sqrt2 + 8\\sqrt2}{2} = 7\\sqrt2$; второй корень отрицательный.',
      gruppy: ['aco', 'bis'],
    },
  ],
  otvet: '$7\\sqrt2$',
  otvetChislo: 7 * Math.SQRT2,
};

export const OP18_DVE_VERSHINY: OpornayaDop18 = {
  id: 'okruzhnost-cherez-dve-vershiny',
  no: 9,
  nazvanie: 'Окружность через две вершины треугольника',
  uslovie:
    'Окружность проходит через вершины $A$ и $C$ треугольника $ABC$ и пересекает стороны $AB$ и $BC$ в точках $K$ и $M$ соответственно.',
  a: 'Докажите, что треугольник $BMK$ подобен треугольнику $BAC$.',
  b: 'Найдите $KM$, если $AB = 15$, $BC = 10$, $AC = 12$ и $BK = 4$.',
  skhemy: [
    {
      id: 'chetyrekhugolniki',
      zachem:
        'у вписанного четырёхугольника $AKMC$ внешний угол равен внутреннему противоположному',
    },
    {
      id: 'dve-sekushchie',
      zachem: 'две секущие $BA$ и $BC$ из одной точки отсекают подобные треугольники',
    },
  ],
  reshenieA: [
    {
      tekst:
        'Четырёхугольник $AKMC$ вписан в окружность, поэтому $\\angle AKM + \\angle ACM = 180^\\circ$. Смежный угол $BKM = 180^\\circ - \\angle AKM = \\angle ACB$.',
      gruppy: ['ugol'],
    },
    {
      tekst:
        'Угол $B$ у треугольников $BMK$ и $BAC$ общий, и $\\angle BKM = \\angle BCA$. По двум углам $\\triangle BMK \\sim \\triangle BAC$ (вершина $K$ соответствует $C$, вершина $M$ — вершине $A$).',
      gruppy: ['pod'],
    },
  ],
  reshenieB: [
    {
      tekst:
        'Из соответствия вершин: $\\dfrac{BK}{BC} = \\dfrac{BM}{BA} = \\dfrac{KM}{CA} = k$, и $k = \\dfrac{BK}{BC} = \\dfrac{4}{10} = \\dfrac25$.',
      gruppy: ['pod'],
    },
    {
      tekst:
        '$KM = k\\cdot AC = \\dfrac25\\cdot 12 = \\dfrac{24}{5}$. Заодно $BM = k\\cdot BA = 6 < BC$: точка $M$ действительно на стороне $BC$.',
      gruppy: ['koef'],
    },
  ],
  otvet: '$\\dfrac{24}{5}$',
  otvetChislo: 24 / 5,
};
