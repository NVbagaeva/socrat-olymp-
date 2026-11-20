/**
 * Факты опорных задач №1: на какое утверждение справочника опирается
 * навык (кнопка «Показать свойство» в подсказке) и, если формула навыка
 * записана общими буквами ($a$, $c$, $\alpha$), которых нет на чертеже
 * задачи, — та же подсказка словами.
 *
 * Правило то же, что в тренажёре: любая буква подсказки подписана на
 * чертеже, который ученик видит рядом. Формула общими буквами живёт в
 * карточке факта — там у неё свой чертёж с этими буквами.
 */

export interface FaktMikro {
  /** Факт реестра (content/spravochnik1/fakty.ts); null — навык без факта. */
  fakt: string | null;
  /** Подсказка словами вместо формулы навыка (формулы в $…$). */
  podskazka?: string;
  /** «В нашей задаче»: факт на буквах этой задачи, без ответа. */
  vNashey?: string;
}

const SMEZHNYE = 'Смежные углы вместе дают $180^\\circ$.';
const UGLY_TRAPECII = 'Углы при боковой стороне трапеции вместе дают $180^\\circ$.';

export const FAKTY_MIKRO: Record<string, FaktMikro> = {
  /* 1. Сумма углов и равнобедренный треугольник. */
  'P1-1-01': { fakt: 'summa-uglov' },
  'P1-1-02': { fakt: 'ostrye-ugly', vNashey: 'прямой угол — $C$, острые углы — $A$ и $B$' },
  'P1-1-03': {
    fakt: 'ravnobedrennyy-ugly',
    vNashey: 'равные стороны — $AC$ и $BC$, основание — $AB$',
  },
  'P1-1-04': {
    fakt: 'ravnobedrennyy-ugly',
    vNashey: 'равные стороны — $AC$ и $BC$, основание — $AB$',
  },
  'P1-1-05': { fakt: 'vneshniy-ugol' },
  'P1-1-06': { fakt: 'vneshniy-i-vnutrenniy' },
  'P1-1-07': { fakt: 'summa-uglov' },
  'P1-1-08': { fakt: 'summa-uglov' },
  'P1-1-09': { fakt: 'ravnobedrennyy-ugly' },
  'P1-1-10': { fakt: 'vneshniy-ugol' },

  /* 2. Смежные углы и параллельные прямые. */
  'P1-2-01': { fakt: 'smezhnye-ugly', podskazka: SMEZHNYE },
  'P1-2-02': { fakt: 'smezhnye-ugly', podskazka: SMEZHNYE },
  'P1-2-03': { fakt: 'smezhnye-ugly', podskazka: SMEZHNYE },
  'P1-2-04': { fakt: 'vertikalnye-ugly' },
  'P1-2-05': {
    fakt: 'smezhnye-ugly',
    podskazka: 'Соседние углы при пересечении двух прямых — смежные: вместе $180^\\circ$.',
  },
  'P1-2-06': { fakt: 'nakrest-lezhashchie' },
  'P1-2-07': {
    fakt: 'odnostoronnie',
    podskazka: 'Односторонние углы при параллельных прямых вместе дают $180^\\circ$.',
  },
  'P1-2-08': {
    fakt: 'bissektrisa-ugla',
    vNashey: 'биссектриса $OK$ делит угол $AOB$ на углы $AOK$ и $KOB$',
  },
  'P1-2-09': {
    fakt: 'bissektrisy-smezhnyh',
    podskazka:
      'Биссектрисы делят каждый из смежных углов пополам, а сами смежные углы вместе дают $180^\\circ$.',
  },
  'P1-2-10': { fakt: 'sootvetstvennye' },

  /* 3. Прямоугольный треугольник. */
  'P1-3-01': {
    fakt: 'mediana-k-gipotenuze',
    podskazka: 'Медиана, проведённая к гипотенузе, равна половине гипотенузы.',
  },
  'P1-3-02': {
    fakt: 'mediana-k-gipotenuze',
    podskazka: 'Гипотенуза вдвое длиннее медианы, проведённой к ней.',
  },
  'P1-3-03': {
    fakt: 'katet-30',
    podskazka: 'Катет против угла $30^\\circ$ равен половине гипотенузы: $AC = \\dfrac{AB}{2}$.',
    vNashey: 'против угла $B = 30^\\circ$ лежит катет $AC$, гипотенуза — $AB$',
  },
  'P1-3-04': {
    fakt: 'katet-30',
    podskazka:
      'Гипотенуза вдвое длиннее катета, лежащего против угла $30^\\circ$: $AB = 2\\cdot AC$.',
    vNashey: 'против угла $B = 30^\\circ$ лежит катет $AC$, гипотенуза — $AB$',
  },
  'P1-3-05': {
    fakt: 'mediana-k-gipotenuze-ugly',
    vNashey:
      'гипотенуза — $AB$, медиана к ней — $CM$; в треугольнике $CMB$ стороны $CM$ и $MB$ равны',
  },
  'P1-3-06': {
    fakt: 'vysota-k-gipotenuze-ugol',
    vNashey: 'высота к гипотенузе — $CH$, катеты — $CA$ и $CB$',
  },
  'P1-3-07': {
    fakt: 'vysota-k-gipotenuze-ugol',
    vNashey: 'высота к гипотенузе — $CH$, катеты — $CA$ и $CB$',
  },
  'P1-3-08': {
    fakt: 'bissektrisa-ugla',
    vNashey: 'биссектриса $CL$ делит прямой угол $ACB$ на углы $ACL$ и $LCB$',
  },
  'P1-3-09': {
    fakt: 'mediana-k-gipotenuze-ugly',
    vNashey:
      'гипотенуза — $AB$, медиана к ней — $CM$; в треугольнике $AMC$ стороны $AM$ и $CM$ равны',
  },
  'P1-3-10': {
    fakt: 'ostrye-ugly',
    podskazka: 'Острые углы прямоугольного треугольника вместе дают $90^\\circ$.',
  },

  /* 4. Углы четырёхугольников. */
  'P1-4-01': { fakt: 'parallelogramm-sosednie' },
  'P1-4-02': {
    fakt: 'parallelogramm-ugly',
    podskazka: 'Противоположные углы параллелограмма равны, а соседние вместе дают $180^\\circ$.',
  },
  'P1-4-03': { fakt: 'romb-bissektrisy', vNashey: 'диагональ $AC$ делит угол $A$ ромба пополам' },
  'P1-4-04': {
    fakt: 'romb-opr',
    vNashey: 'стороны $AB$ и $BC$ ромба равны: треугольник $ABC$ равнобедренный',
  },
  'P1-4-05': {
    fakt: 'pryamougolnik-diagonali',
    vNashey: 'диагонали $AC$ и $BD$ равны и делятся точкой $O$ пополам',
  },
  'P1-4-06': { fakt: 'trapeciya-ugly', podskazka: UGLY_TRAPECII },
  'P1-4-07': {
    fakt: 'summa-uglov-chetyrehugolnika',
    podskazka: 'Сумма углов выпуклого четырёхугольника равна $360^\\circ$.',
  },
  'P1-4-08': {
    fakt: 'ugol-mezhdu-vysotami',
    vNashey: 'высоты $BD$ и $CE$ пересекаются в точке $O$; четырёхугольник — $ADOE$',
  },
  'P1-4-09': {
    fakt: 'ugol-mezhdu-bissektrisami',
    vNashey: 'биссектрисы углов $A$ и $B$ пересекаются в точке $O$; третий угол — $\\angle C$',
  },
  'P1-4-10': { fakt: 'trapeciya-ugly', podskazka: UGLY_TRAPECII },

  /* 5. Площади и средние линии. */
  'P1-5-01': {
    fakt: 'ploshchad-pryamougolnogo',
    podskazka: 'Площадь прямоугольного треугольника — половина произведения катетов.',
  },
  'P1-5-02': {
    fakt: 'ploshchad-treugolnika',
    podskazka: 'Площадь треугольника — половина произведения стороны на высоту, проведённую к ней.',
  },
  'P1-5-03': {
    fakt: 'ploshchad-parallelogramma',
    podskazka: 'Площадь параллелограмма — сторона, умноженная на высоту, проведённую к ней.',
  },
  'P1-5-04': {
    fakt: 'ploshchad-trapecii',
    podskazka: 'Площадь трапеции — полусумма оснований, умноженная на высоту.',
  },
  'P1-5-05': {
    fakt: 'ploshchad-romba',
    podskazka: 'Площадь ромба — половина произведения диагоналей.',
  },
  'P1-5-06': {
    fakt: 'ploshchad-cherez-sinus',
    podskazka: 'Площадь треугольника — половина произведения двух сторон на синус угла между ними.',
  },
  'P1-5-07': {
    fakt: 'ploshchad-parallelogramma-sinus',
    podskazka: 'Площадь параллелограмма — произведение соседних сторон на синус угла между ними.',
  },
  'P1-5-08': {
    fakt: 'srednyaya-liniya-trapecii',
    podskazka: 'Средняя линия трапеции равна полусумме оснований.',
  },
  'P1-5-09': { fakt: 'podobie-ploshchadi' },
  'P1-5-10': {
    fakt: 'srednyaya-liniya',
    vNashey: 'средняя линия — $DE$, параллельная ей сторона — $AB$',
  },

  /* 6. Теорема Пифагора и особые треугольники. */
  'P1-6-01': { fakt: 'pifagor', podskazka: 'Квадрат гипотенузы равен сумме квадратов катетов.' },
  'P1-6-02': {
    fakt: 'pifagor',
    podskazka: 'Квадрат катета равен квадрату гипотенузы минус квадрат другого катета.',
  },
  'P1-6-03': {
    fakt: 'pifagor',
    podskazka:
      'Диагональ прямоугольника — гипотенуза прямоугольного треугольника, катеты которого — стороны прямоугольника.',
  },
  'P1-6-04': {
    fakt: 'romb-diagonali',
    podskazka:
      'Диагонали ромба перпендикулярны и делятся пополам: сторона ромба — гипотенуза треугольника, катеты которого — половины диагоналей.',
  },
  'P1-6-05': {
    fakt: 'ravnobedrennyy-vysota',
    podskazka:
      'Высота к основанию делит его пополам: она — катет треугольника с гипотенузой — боковой стороной и вторым катетом — половиной основания.',
  },
  'P1-6-06': {
    fakt: 'pifagor',
    podskazka:
      'В равнобедренном прямоугольном треугольнике гипотенуза в $\\sqrt2$ раз длиннее катета.',
  },
  'P1-6-07': {
    fakt: 'kvadrat-diagonal',
    podskazka: 'Диагональ квадрата в $\\sqrt2$ раз длиннее его стороны.',
  },
  'P1-6-08': {
    fakt: 'ravnostoronniy-vysota',
    podskazka:
      'Высота равностороннего треугольника равна стороне, умноженной на $\\dfrac{\\sqrt3}{2}$.',
  },
  'P1-6-09': {
    fakt: 'vysota-k-gipotenuze',
    podskazka: 'Высота к гипотенузе равна произведению катетов, делённому на гипотенузу.',
  },
  'P1-6-10': {
    fakt: 'mediana-k-gipotenuze',
    podskazka: 'Медиана, проведённая к гипотенузе, равна половине гипотенузы.',
  },

  /* 7. Синус, косинус и тангенс. */
  'P1-7-01': { fakt: 'sinus', vNashey: 'прямой угол — $C$, гипотенуза — $AB$' },
  'P1-7-02': { fakt: 'kosinus', vNashey: 'прямой угол — $C$, гипотенуза — $AB$' },
  'P1-7-03': { fakt: 'tangens', vNashey: 'прямой угол — $C$, катеты — $AC$ и $BC$' },
  'P1-7-04': { fakt: 'kosinus', vNashey: 'прямой угол — $C$, гипотенуза — $AB$' },
  'P1-7-05': { fakt: 'sinus', vNashey: 'прямой угол — $C$, гипотенуза — $AB$' },
  'P1-7-06': { fakt: 'tangens', vNashey: 'прямой угол — $C$, катеты — $AC$ и $BC$' },
  'P1-7-07': {
    fakt: 'osnovnoe-tozhdestvo',
    podskazka: 'Сумма квадратов синуса и косинуса одного и того же угла равна единице.',
  },
  'P1-7-08': {
    fakt: 'sinus-i-kosinus-ostryh',
    vNashey: 'прямой угол — $C$, острые углы — $A$ и $B$',
  },
  'P1-7-09': {
    fakt: 'katet-30',
    vNashey: 'против угла $A = 30^\\circ$ лежит катет $BC$, гипотенуза — $AB$',
  },
  'P1-7-10': {
    fakt: 'ravnobedrennyy-vysota',
    vNashey: 'равные стороны — $AC$ и $BC$, основание — $AB$',
  },

  /* 8. Центральные и вписанные углы. */
  'P1-8-01': {
    fakt: 'vpisannyy-ugol',
    vNashey: 'вписанный угол — $\\angle ACB$, центральный — $\\angle AOB$, дуга — $AB$',
  },
  'P1-8-02': {
    fakt: 'vpisannyy-ugol',
    vNashey: 'вписанный угол — $\\angle ACB$, центральный — $\\angle AOB$, дуга — $AB$',
  },
  'P1-8-03': { fakt: 'vpisannyy-ugol', vNashey: 'вписанный угол — $\\angle ACB$, его дуга — $AB$' },
  'P1-8-04': { fakt: 'vpisannyy-ugol', vNashey: 'вписанный угол — $\\angle ACB$, его дуга — $AB$' },
  'P1-8-05': {
    fakt: 'ugol-na-diametr',
    vNashey: 'диаметр — $AB$, на него опирается вписанный угол $ACB$',
  },
  'P1-8-06': {
    fakt: 'vpisannyy-ugol',
    vNashey: 'вписанный угол — $\\angle ACB$, он опирается на дугу $AB$, не содержащую $C$',
  },
  'P1-8-07': {
    fakt: 'vpisannye-na-odnu-dugu',
    vNashey: 'углы $ACB$ и $ADB$ опираются на одну дугу $AB$',
  },
  'P1-8-08': { fakt: 'gradusnaya-mera-dugi' },
  'P1-8-09': {
    fakt: 'vpisannyy-ugol',
    vNashey: 'вершина угла — $C$, его стороны проходят через концы хорды $AB$',
  },
  'P1-8-10': { fakt: 'radiusy-i-horda', vNashey: 'радиусы — $OA$ и $OB$, хорда — $AB$' },

  /* 9. Касательные, вписанная и описанная окружности. */
  'P1-9-01': {
    fakt: 'kasatelnaya-i-radius',
    vNashey: 'касательная — $CA$, радиус в точку касания — $OA$',
  },
  'P1-9-02': {
    fakt: 'otrezki-kasatelnyh',
    vNashey: 'из точки $C$ проведены касательные $CA$ и $CB$',
  },
  'P1-9-03': {
    fakt: 'ugol-mezhdu-kasatelnymi',
    vNashey: 'угол между касательными — $\\angle ACB$, центральный угол — $\\angle AOB$',
  },
  'P1-9-04': {
    fakt: 'ugol-kasatelnoy-i-hordy',
    podskazka: 'Угол между касательной и хордой равен половине дуги, заключённой между ними.',
    vNashey: 'касательная — $BC$, хорда — $AB$',
  },
  'P1-9-05': {
    fakt: 'opisannyy-chetyrehugolnik',
    vNashey: 'противоположные стороны: $AB$ и $CD$, $BC$ и $AD$',
  },
  'P1-9-06': {
    fakt: 'opisannyy-chetyrehugolnik',
    vNashey: 'противоположные стороны: $AB$ и $CD$, $BC$ и $AD$',
  },
  'P1-9-07': { fakt: 'vpisannyy-chetyrehugolnik', vNashey: 'противоположные углы — $A$ и $C$' },
  'P1-9-08': {
    fakt: 'opisannaya-trapeciya',
    podskazka:
      'У трапеции, описанной около окружности, сумма оснований равна сумме боковых сторон; средняя линия — полусумма оснований.',
  },
  'P1-9-09': {
    fakt: 'pravilnyy-vneshniy-ugol',
    podskazka:
      'Внешний угол правильного $n$-угольника равен $\\dfrac{360^\\circ}{n}$, а внутренний дополняет его до $180^\\circ$.',
  },
  'P1-9-10': {
    fakt: 'kasatelnaya-i-sekushchaya',
    vNashey: 'касательная — $AK$, секущая — $AC$, её внешняя часть — $AB$',
  },
};
