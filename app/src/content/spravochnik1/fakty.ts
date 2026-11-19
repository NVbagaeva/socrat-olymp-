/**
 * Реестр фактов планиметрии (задание №1): id → утверждение справочника.
 *
 * Источник текста один — карточки справочника (./r01…r11). Запись
 * реестра только указывает на утверждение: тема, блок («Определение»,
 * «Свойство», «Признак», «Теорема»), его номер в блоке и несколько слов
 * из формулировки — по ним сборка проверяет, что указатель не съехал.
 * Своё у факта — название для кнопки «Показать свойство»: точное, про
 * один факт («Свойство медианы, проведённой к гипотенузе»).
 *
 * Отсюда факт берут подсказки тренажёра, опорные задачи и шаги
 * решений; карточка факта (components/tasks/planimetriya/fakt) — те же
 * блоки, чертёж и разбор, что в справочнике. Копий формулировок нет.
 */

import { RAZDELY_SPRAVOCHNIKA_1 } from './index';
import type { Razdel1, Tema1, Teorema, Utverzhdenie } from './tipy';

export type VidFakta = 'opredeleniya' | 'svoystva' | 'priznaki' | 'teoremy';

/** Подпись вида на карточке: свойство и признак — разные вещи. */
export const VID_FAKTA: Record<VidFakta, string> = {
  opredeleniya: 'Определение',
  svoystva: 'Свойство',
  priznaki: 'Признак',
  teoremy: 'Теорема',
};

/** Запись реестра: тема, блок, номер в блоке, слова формулировки, название. */
type Zapis = readonly [
  tema: string,
  vid: VidFakta,
  n: number,
  klyuch: string,
  nazvanie: string,
  /** Номер разбора темы для кнопки «Пример» (по умолчанию первый). */
  primer?: number,
];

const o = 'opredeleniya';
const s = 'svoystva';
const p = 'priznaki';
const t = 'teoremy';

const ZAPISI: Record<string, Zapis> = {
  /* Углы и прямые. */
  'smezhnye-ugly': ['smezhnye', s, 0, 'Сумма смежных углов', 'Свойство смежных углов'],
  'vertikalnye-ugly': [
    'vertikalnye',
    s,
    0,
    'Вертикальные углы равны',
    'Свойство вертикальных углов',
  ],
  'bissektrisa-ugla': [
    'bissektrisa-ugla',
    o,
    0,
    'делит угол на два равных',
    'Определение биссектрисы угла',
  ],
  'bissektrisy-smezhnyh': [
    'bissektrisa-ugla',
    s,
    1,
    'смежных углов перпендикулярны',
    'Свойство биссектрис смежных углов',
  ],
  'nakrest-lezhashchie': [
    'parallelnye',
    s,
    0,
    'накрест лежащие углы равны',
    'Свойство накрест лежащих углов при параллельных прямых',
  ],
  sootvetstvennye: [
    'parallelnye',
    s,
    1,
    'соответственные углы равны',
    'Свойство соответственных углов при параллельных прямых',
  ],
  odnostoronnie: [
    'parallelnye',
    s,
    2,
    'сумма односторонних углов',
    'Свойство односторонних углов при параллельных прямых',
  ],

  /* Треугольник. */
  'summa-uglov': ['summa-uglov', t, 0, 'Сумма трёх углов', 'Теорема о сумме углов треугольника'],
  'vneshniy-ugol': [
    'vneshniy-ugol',
    t,
    0,
    'равен сумме двух углов',
    'Теорема о внешнем угле треугольника',
  ],
  'vneshniy-i-vnutrenniy': [
    'vneshniy-ugol',
    s,
    0,
    'смежные',
    'Свойство внешнего и внутреннего углов при одной вершине',
  ],
  'summa-vneshnih': ['vneshniy-ugol', s, 3, 'Сумма внешних углов', 'Свойство суммы внешних углов'],
  'ravnobedrennyy-opr': [
    'ravnobedrennyy',
    o,
    0,
    'две его стороны равны',
    'Определение равнобедренного треугольника',
  ],
  'ravnobedrennyy-ugly': [
    'ravnobedrennyy',
    s,
    0,
    'Углы при основании',
    'Свойство углов при основании равнобедренного треугольника',
  ],
  'ravnobedrennyy-vysota': [
    'ravnobedrennyy',
    s,
    1,
    'проведённые к основанию, совпадают',
    'Свойство медианы, биссектрисы и высоты к основанию равнобедренного треугольника',
    1,
  ],
  'ravnobedrennyy-priznak': [
    'ravnobedrennyy',
    p,
    0,
    'два угла треугольника равны',
    'Признак равнобедренного треугольника',
  ],
  'ravnostoronniy-ugly': [
    'ravnostoronniy',
    s,
    0,
    'равны $60^\\circ$',
    'Свойство углов равностороннего треугольника',
  ],
  'ravnostoronniy-vysota': [
    'ravnostoronniy',
    s,
    1,
    'Высота выражается через сторону',
    'Свойство высоты равностороннего треугольника',
  ],
  'ravnostoronniy-centr': [
    'ravnostoronniy',
    s,
    2,
    'делят высоту в отношении',
    'Свойство центра равностороннего треугольника',
  ],
  'ravnostoronniy-priznak': [
    'ravnostoronniy',
    p,
    1,
    'имеет угол $60^\\circ$',
    'Признак равностороннего треугольника',
  ],

  /* Элементы треугольника. */
  'mediana-opr': [
    'mediana',
    o,
    0,
    'с серединой противоположной стороны',
    'Определение медианы: она делит сторону пополам',
  ],
  'mediany-2-1': ['mediana', s, 0, 'в отношении $2:1$', 'Свойство точки пересечения медиан'],
  'mediana-ploshchad': [
    'mediana',
    s,
    1,
    'равной площади',
    'Свойство медианы: два равновеликих треугольника',
  ],
  'vysota-opr': ['vysota', o, 0, 'перпендикуляр', 'Определение высоты треугольника'],
  'vysoty-i-storony': [
    'vysota',
    s,
    1,
    'произведение стороны на высоту одинаково',
    'Свойство высот: произведение стороны на высоту',
  ],
  'srednyaya-liniya-opr': [
    'srednyaya-liniya-treugolnika',
    o,
    0,
    'середины двух его сторон',
    'Определение средней линии треугольника',
  ],
  'srednyaya-liniya': [
    'srednyaya-liniya-treugolnika',
    s,
    0,
    'параллельна третьей стороне',
    'Свойство средней линии треугольника',
  ],
  'srednyaya-liniya-ploshchad': [
    'srednyaya-liniya-treugolnika',
    s,
    1,
    'четверть площади',
    'Свойство треугольника, отсечённого средней линией',
  ],
  'ugol-mezhdu-vysotami': [
    'tochki-peresecheniya',
    s,
    5,
    'угол $DOE$ между высотами',
    'Свойство угла между высотами треугольника',
  ],

  /* Прямоугольный треугольник. */
  'ostrye-ugly': [
    'pryamougolnyy',
    s,
    0,
    'Сумма острых углов',
    'Свойство острых углов прямоугольного треугольника',
  ],
  pifagor: ['pifagor', t, 0, 'квадрат гипотенузы', 'Теорема Пифагора'],
  sinus: ['trig', o, 0, 'противолежащего катета к гипотенузе', 'Определение синуса острого угла'],
  kosinus: ['trig', o, 1, 'прилежащего катета к гипотенузе', 'Определение косинуса острого угла'],
  tangens: [
    'trig',
    o,
    2,
    'противолежащего катета к прилежащему',
    'Определение тангенса острого угла',
    1,
  ],
  'tablica-znacheniy': [
    'znacheniya',
    t,
    0,
    'стоит помнить',
    'Таблица значений синуса, косинуса и тангенса',
  ],
  'osnovnoe-tozhdestvo': [
    'osnovnoe-tozhdestvo',
    t,
    0,
    'Сумма квадратов синуса и косинуса',
    'Основное тригонометрическое тождество',
  ],
  'sinus-i-kosinus-ostryh': [
    'osnovnoe-tozhdestvo',
    s,
    0,
    'синус одного равен косинусу другого',
    'Свойство синуса и косинуса острых углов прямоугольного треугольника',
  ],
  'sinus-tupogo': [
    'trig-tupogo-ugla',
    t,
    0,
    'Синус тупого угла',
    'Формулы синуса и косинуса тупого угла',
  ],
  'katet-30': [
    'ugol-30',
    s,
    0,
    'против угла $30^\\circ$',
    'Свойство катета, лежащего против угла $30^\\circ$',
  ],
  'mediana-k-gipotenuze': [
    'mediana-k-gipotenuze',
    s,
    0,
    'равна половине гипотенузы',
    'Свойство медианы, проведённой к гипотенузе',
  ],
  'mediana-k-gipotenuze-ugly': [
    'mediana-k-gipotenuze',
    s,
    1,
    'на два равнобедренных',
    'Свойство углов при медиане к гипотенузе',
    1,
  ],
  'vysota-k-gipotenuze': [
    'vysota-k-gipotenuze',
    s,
    0,
    'произведению катетов, делённому на гипотенузу',
    'Свойство высоты к гипотенузе: через катеты',
  ],
  'vysota-k-gipotenuze-otrezki': [
    'vysota-k-gipotenuze',
    s,
    1,
    'произведению отрезков',
    'Свойство высоты к гипотенузе: через отрезки гипотенузы',
    1,
  ],
  'vysota-k-gipotenuze-ugol': [
    'vysota-k-gipotenuze',
    s,
    3,
    'угол между высотой и катетом',
    'Свойство угла между высотой к гипотенузе и катетом',
  ],

  /* Подобие и площади. */
  'podobie-ploshchadi': [
    'otnoshenie-ploshchadey',
    s,
    0,
    'квадрат коэффициента подобия',
    'Свойство площадей подобных фигур',
  ],
  'ploshchad-treugolnika': [
    'ploshchad-treugolnika',
    t,
    0,
    'стороны на высоту',
    'Формула площади треугольника через сторону и высоту',
  ],
  'ploshchad-cherez-sinus': [
    'ploshchad-treugolnika',
    t,
    1,
    'на синус угла между ними',
    'Формула площади треугольника через две стороны и угол',
    1,
  ],
  'ploshchad-cherez-radius': [
    'ploshchad-treugolnika',
    t,
    2,
    'полупериметра на радиус',
    'Формула площади через полупериметр и радиус вписанной окружности',
  ],
  'ploshchad-pryamougolnogo': [
    'ploshchad-treugolnika',
    s,
    0,
    'половине произведения катетов',
    'Свойство: площадь прямоугольного треугольника',
  ],
  'ploshchad-parallelogramma': [
    'ploshchad-parallelogramma',
    t,
    0,
    'стороны на высоту',
    'Формула площади параллелограмма',
  ],
  'ploshchad-parallelogramma-sinus': [
    'ploshchad-parallelogramma',
    t,
    1,
    'на синус угла между ними',
    'Формула площади параллелограмма через стороны и угол',
  ],
  'parallelogramm-vysoty': [
    'ploshchad-parallelogramma',
    s,
    0,
    'одно и то же для обеих пар',
    'Свойство высот параллелограмма',
  ],
  'ploshchad-pryamougolnika': [
    'ploshchad-pryamougolnika',
    t,
    0,
    'соседних сторон',
    'Формула площади прямоугольника',
  ],
  'ploshchad-romba': [
    'ploshchad-romba',
    t,
    0,
    'половине произведения диагоналей',
    'Формула площади ромба',
  ],
  'ploshchad-trapecii': [
    'ploshchad-trapecii',
    t,
    0,
    'полусуммы оснований на высоту',
    'Формула площади трапеции',
  ],

  /* Теоремы синусов и косинусов. */
  'teorema-kosinusov': [
    'teorema-kosinusov',
    t,
    0,
    'Квадрат стороны треугольника',
    'Теорема косинусов',
  ],
  'teorema-sinusov': ['teorema-sinusov', t, 0, 'диаметру описанной окружности', 'Теорема синусов'],

  /* Четырёхугольники. */
  'summa-uglov-chetyrehugolnika': [
    'summa-uglov-chetyrehugolnika',
    t,
    0,
    'равна $360^\\circ$',
    'Теорема о сумме углов четырёхугольника',
  ],
  'parallelogramm-ugly': [
    'parallelogramm',
    s,
    0,
    'противоположные углы равны',
    'Свойство противоположных сторон и углов параллелограмма',
  ],
  'parallelogramm-sosednie': [
    'parallelogramm',
    s,
    1,
    'прилежащих к одной стороне',
    'Свойство соседних углов параллелограмма',
  ],
  'parallelogramm-diagonali': [
    'parallelogramm',
    s,
    2,
    'делятся пополам',
    'Свойство диагоналей параллелограмма',
  ],
  'pryamougolnik-diagonali': [
    'pryamougolnik',
    s,
    0,
    'диагонали равны',
    'Свойство диагоналей прямоугольника',
  ],
  'pryamougolnik-okruzhnost': [
    'pryamougolnik',
    s,
    1,
    'центр описанной окружности',
    'Свойство окружности, описанной около прямоугольника',
    1,
  ],
  'romb-opr': ['romb', o, 0, 'все стороны равны', 'Определение ромба'],
  'romb-diagonali': [
    'romb',
    s,
    0,
    'диагонали перпендикулярны',
    'Свойство диагоналей ромба: перпендикулярны',
  ],
  'romb-bissektrisy': [
    'romb',
    s,
    1,
    'биссектрисами его углов',
    'Свойство диагоналей ромба: биссектрисы углов',
  ],
  'romb-vysota': ['romb', s, 2, 'диаметру вписанной окружности', 'Свойство высоты ромба'],
  'kvadrat-diagonal': ['kvadrat', s, 1, 'раз длиннее стороны', 'Свойство диагонали квадрата'],
  'trapeciya-ugly': [
    'trapeciya',
    s,
    0,
    'к одной боковой стороне',
    'Свойство углов при боковой стороне трапеции',
  ],
  'srednyaya-liniya-trapecii': [
    'trapeciya',
    s,
    1,
    'полусумма оснований',
    'Свойство средней линии трапеции',
  ],
  'trapeciya-diagonal-i-srednyaya': [
    'trapeciya',
    s,
    2,
    'делит среднюю линию',
    'Свойство диагонали и средней линии трапеции',
    1,
  ],
  'trapeciya-serediny-diagonaley': [
    'trapeciya',
    s,
    3,
    'полуразности оснований',
    'Свойство отрезка между серединами диагоналей трапеции',
  ],
  'ravnobedrennaya-trapeciya-ugly': [
    'ravnobedrennaya-trapeciya',
    s,
    0,
    'углы при каждом основании равны',
    'Свойство углов и диагоналей равнобедренной трапеции',
  ],
  'ravnobedrennaya-trapeciya-vysota': [
    'ravnobedrennaya-trapeciya',
    s,
    1,
    'полуразности оснований',
    'Свойство высоты равнобедренной трапеции',
  ],
  'trapeciya-perpendikulyarnye-diagonali': [
    'ravnobedrennaya-trapeciya',
    s,
    2,
    'высота равна средней линии',
    'Свойство равнобедренной трапеции с перпендикулярными диагоналями',
  ],

  /* Окружность. */
  'radiusy-i-horda': [
    'okruzhnost-elementy',
    s,
    0,
    'равнобедренный треугольник',
    'Свойство треугольника из двух радиусов и хорды',
  ],
  'gradusnaya-mera-dugi': [
    'okruzhnost-elementy',
    o,
    2,
    'Градусная мера дуги',
    'Определение градусной меры дуги',
  ],
  'kasatelnaya-i-radius': [
    'kasatelnaya',
    s,
    0,
    'перпендикулярна радиусу',
    'Свойство касательной и радиуса в точку касания',
  ],
  'otrezki-kasatelnyh': [
    'otrezki-kasatelnyh',
    s,
    0,
    'проведённые из одной точки, равны',
    'Свойство отрезков касательных из одной точки',
  ],
  'ugol-mezhdu-kasatelnymi': [
    'otrezki-kasatelnyh',
    s,
    2,
    'угол между касательными',
    'Свойство угла между двумя касательными',
  ],
  'kasatelnaya-i-sekushchaya': [
    'kasatelnaya-i-sekushchaya',
    t,
    0,
    'Квадрат отрезка касательной',
    'Теорема о касательной и секущей',
  ],
  'vpisannyy-ugol': [
    'centralnyy-vpisannyy',
    t,
    0,
    'равен половине дуги',
    'Теорема о вписанном угле',
  ],
  'vpisannye-na-odnu-dugu': [
    'vpisannye-ugly',
    s,
    0,
    'опираются на общую дугу',
    'Свойство вписанных углов, опирающихся на одну дугу',
  ],
  'ugol-na-diametr': [
    'vpisannye-ugly',
    s,
    1,
    'опирающийся на диаметр',
    'Свойство вписанного угла, опирающегося на диаметр',
    1,
  ],
  'ugol-kasatelnoy-i-hordy': [
    'ugol-kasatelnoy-i-hordy',
    t,
    0,
    'касательная и хорда',
    'Теорема об угле между касательной и хордой',
  ],
  'peresekayushchiesya-hordy': [
    'otrezki-hord-i-sekushchih',
    t,
    0,
    'хорды $AB$ и $CD$',
    'Теорема о пересекающихся хордах',
  ],
  'ugol-mezhdu-sekushchimi': [
    'ugly-hord-i-sekushchih',
    t,
    1,
    'полуразности',
    'Теорема об угле между секущими',
  ],

  /* Вписанные и описанные. */
  'radius-opisannoy': [
    'opisannaya-okruzhnost',
    s,
    2,
    'по теореме синусов',
    'Свойство радиуса описанной окружности',
  ],
  'radius-vpisannoy': [
    'vpisannaya-okruzhnost',
    s,
    1,
    'площади, делённой на полупериметр',
    'Свойство радиуса вписанной окружности',
  ],
  'vpisannyy-chetyrehugolnik': [
    'vpisannyy-chetyrehugolnik',
    s,
    0,
    'Сумма противоположных углов',
    'Свойство углов вписанного четырёхугольника',
  ],
  'vpisannyy-chetyrehugolnik-diagonali': [
    'vpisannyy-chetyrehugolnik',
    s,
    1,
    'между стороной и диагональю',
    'Свойство углов между стороной и диагональю вписанного четырёхугольника',
    1,
  ],
  'opisannyy-chetyrehugolnik': [
    'opisannyy-chetyrehugolnik',
    s,
    0,
    'суммы его противоположных сторон',
    'Свойство сторон описанного четырёхугольника',
  ],
  'opisannaya-trapeciya': [
    'opisannyy-chetyrehugolnik',
    s,
    1,
    'описанной около окружности',
    'Свойство трапеции, описанной около окружности',
    1,
  ],
  'pravilnyy-ugol': [
    'pravilnye-mnogougolniki',
    s,
    1,
    'Угол правильного',
    'Свойство: угол правильного многоугольника',
  ],
  'pravilnyy-vneshniy-ugol': [
    'pravilnye-mnogougolniki',
    s,
    2,
    'внешний угол равен центральному',
    'Свойство внешнего угла правильного многоугольника',
  ],
  'pravilnyy-shestiugolnik': [
    'pravilnye-mnogougolniki',
    s,
    3,
    'сторона равна радиусу',
    'Свойство правильного шестиугольника и правильного треугольника',
    1,
  ],

  /* Полезные факты. */
  'ugol-mezhdu-bissektrisami': [
    'ugol-mezhdu-bissektrisami',
    s,
    0,
    'плюс половина третьего угла',
    'Свойство угла между биссектрисами треугольника',
  ],
  'iz-pryamogo-ugla': [
    'iz-pryamogo-ugla',
    s,
    0,
    'между высотой и медианой',
    'Свойство биссектрисы прямого угла: между высотой и медианой',
  ],
  'vysota-i-mediana-iz-pryamogo': [
    'iz-pryamogo-ugla',
    s,
    1,
    'разности острых углов',
    'Свойство угла между высотой и медианой из прямого угла',
    1,
  ],
  'ugly-pri-osnovanii-i-vysoty': [
    'vysoty-ravnobedrennogo',
    s,
    0,
    'в любом прямоугольном треугольнике',
    'Свойство: синус и косинус угла при основании через высоты',
  ],
  'bissektrisa-parallelogramma': [
    'bissektrisa-parallelogramma',
    s,
    0,
    'отсекает от него равнобедренный',
    'Свойство биссектрисы угла параллелограмма',
  ],
};

export interface Fakt1 {
  id: string;
  /** Название на кнопке: «Свойство медианы, проведённой к гипотенузе». */
  nazvanie: string;
  vid: VidFakta;
  /** Формулировка словами ($…$ и **жирное**) — та же строка, что в справочнике. */
  tekst: string;
  /** Формула (TeX без $). */
  formula?: string;
  /** Вторая формула теоремы с подписью. */
  dop?: { podpis: string; formula: string };
  /** Номер разбора темы для кнопки «Пример». */
  primer: number;
  tema: Tema1;
  razdel: Razdel1;
}

function sobrat(): Record<string, Fakt1> {
  const temy = new Map<string, { tema: Tema1; razdel: Razdel1 }>();
  for (const razdel of RAZDELY_SPRAVOCHNIKA_1) {
    for (const tema of razdel.temy) temy.set(tema.id, { tema, razdel });
  }
  const out: Record<string, Fakt1> = {};
  for (const [id, [temaId, vid, n, klyuch, nazvanie, primer]] of Object.entries(ZAPISI)) {
    const m = temy.get(temaId);
    if (m === undefined) throw new Error(`Факт ${id}: в справочнике нет темы ${temaId}`);
    const u = (m.tema[vid] as readonly (Utverzhdenie | Teorema)[] | undefined)?.[n];
    if (u === undefined)
      throw new Error(`Факт ${id}: в теме ${temaId} нет утверждения ${vid}[${n}]`);
    const tekst = 'slovami' in u ? u.slovami : u.tekst;
    const gde = 'slovami' in u ? `${u.nazvanie ?? ''} ${tekst}` : tekst;
    if (!gde.includes(klyuch)) {
      throw new Error(
        `Факт ${id}: утверждение ${temaId}.${vid}[${n}] изменилось — нет слов «${klyuch}»`,
      );
    }
    out[id] = {
      id,
      nazvanie,
      vid,
      tekst,
      ...(u.formula === undefined ? {} : { formula: u.formula }),
      ...('slovami' in u && u.dop !== undefined ? { dop: u.dop } : {}),
      primer: primer ?? 0,
      tema: m.tema,
      razdel: m.razdel,
    };
  }
  return out;
}

/** Все факты: id → утверждение справочника. */
export const FAKTY_1: Readonly<Record<string, Fakt1>> = sobrat();

export function fakt1(id: string): Fakt1 | undefined {
  return FAKTY_1[id];
}

/** Название факта для кнопки; неизвестный id — ошибка. */
export function nazvanieFakta1(id: string): string {
  const fakt = FAKTY_1[id];
  if (fakt === undefined) throw new Error(`Факт «${id}» не найден в реестре справочника`);
  return fakt.nazvanie;
}
