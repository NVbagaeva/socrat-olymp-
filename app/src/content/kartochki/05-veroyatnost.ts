/**
 * Карточки по теории задания №5 «Вероятность: сложная».
 *
 * Теория вероятностей на сайте одна на два номера, и колоды поделены
 * по тому, что нужно номеру. Во вкладке «Теория» №5 написан раздел
 * «Координатная прямая» — якоря «t5-pryamaya-…»
 * (lib/veroyatnost/teoriya-yakorya.ts). Определения событий, с
 * которыми работает №5 (противоположные, несовместные, совместные,
 * независимые, пересечение и объединение), написаны во вкладке №4 —
 * такие карточки ведут туда (`teoriyaNomera: 4`).
 *
 * Разделы №5 «Независимые события» и «Совместные события» пока стоят
 * «Материал готовится». Без теорем сложения и умножения колода №5 не
 * проверяла бы то, на чём стоят его методы 1, 4, 6 и 7 (формулы есть
 * на их карточках во вкладке «Ключевые методы»), поэтому эти карточки
 * помечены «добавлено»: формула, пример и для совместных — ловушка.
 *
 * Рисунки — лучи на координатной прямой (lib/veroyatnost/risunkiKartochek).
 * Примеры с числами — свои, не задачи банка и не примеры теории;
 * ответы и формулы проверяет scripts/verify_cards.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { DOBAVLENO } from '@/lib/kartochki/tipy';
import type { Luch } from '@/lib/veroyatnost/risunkiKartochek';
import { YAKOR_4, YAKOR_5 } from '@/lib/veroyatnost/teoriya-yakorya';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

/** Карточка ведёт в теорию №4: там написаны определения событий. */
const T4 = 4;

/** Два события-луча над координатной прямой. */
const luchi = (dva: readonly [Luch, Luch], deleniya: readonly number[], alt: string) => ({
  dvizhok: 'veroyatnost' as const,
  risunok: { vid: 'luchi' as const, luchi: dva, deleniya, alt },
});

const kartochki: Kartochka[] = [
  /* ── События ── */
  {
    id: '5-protivopolozhnye',
    task: 5,
    topic: 'sobytiya',
    type: 'svoystvo',
    front: 'Какие события $A$ и $\\bar A$ называют **противоположными**?',
    back: 'Они не происходят одновременно и вместе дают всё пространство исходов: $A \\cup \\bar A = \\Omega$.',
    level: B,
    source: YAKOR_4.izo('protivopolozhnoe'),
    teoriyaNomera: T4,
  },
  {
    id: '5-nesovmestnye',
    task: 5,
    topic: 'sobytiya',
    type: 'svoystvo',
    front: 'Какие события называют **несовместными** и как это записать?',
    back: 'Не могут произойти одновременно: $A \\cap B = \\varnothing$.',
    level: B,
    source: YAKOR_4.izo('nesovmestnye'),
    teoriyaNomera: T4,
  },
  {
    id: '5-sovmestnye',
    task: 5,
    topic: 'sobytiya',
    type: 'svoystvo',
    front: 'Какие события называют **совместными**?',
    back: 'Такие, которые могут произойти одновременно: у них есть общие исходы, $A \\cap B \\ne \\varnothing$.',
    level: B,
    source: YAKOR_4.svyaz('sovmestnye'),
    teoriyaNomera: T4,
  },
  {
    id: '5-nezavisimye',
    task: 5,
    topic: 'sobytiya',
    type: 'svoystvo',
    front: 'Какие события называют **независимыми**?',
    back: 'Наступление одного из них не изменяет вероятность наступления другого.',
    pochemu: 'Обычно это разные опыты: два броска, два выстрела, две партии.',
    level: B,
    source: YAKOR_4.svyaz('nezavisimye'),
    teoriyaNomera: T4,
  },
  {
    id: '5-peresechenie',
    task: 5,
    topic: 'sobytiya',
    type: 'svoystvo',
    front: 'Что означают записи $A \\cap B$ и $A \\cup B$?',
    back: '$A \\cap B$ — происходят **оба** события. $A \\cup B$ — происходит **хотя бы одно** из них.',
    level: B,
    source: YAKOR_4.izo('peresechenie'),
    teoriyaNomera: T4,
  },
  {
    id: '5-protiv-nesovm',
    task: 5,
    topic: 'sobytiya',
    type: 'verno',
    front: 'Противоположные события всегда несовместны.',
    verno: true,
    back: 'Верно: $A$ и $\\bar A$ не происходят одновременно, $A \\cap \\bar A = \\varnothing$.',
    level: E,
    source: YAKOR_4.izo('protivopolozhnoe'),
    teoriyaNomera: T4,
  },
  {
    id: '5-nesovm-protiv-l',
    task: 5,
    topic: 'sobytiya',
    type: 'verno',
    front: 'Любые два несовместных события противоположны друг другу.',
    verno: false,
    back: 'Неверно: несовместные события могут вместе не покрывать всех исходов. «Выпало $1$» и «выпало $2$» на кости несовместны, но не противоположны.',
    level: E,
    source: YAKOR_4.izo('nesovmestnye'),
    teoriyaNomera: T4,
  },
  {
    id: '5-nezav-nesovm-l',
    task: 5,
    topic: 'sobytiya',
    type: 'verno',
    front: '«Несовместные» и «независимые» — два названия одного и того же.',
    verno: false,
    back: 'Неверно: несовместность — про один опыт (не случаются вместе), независимость — про разные опыты (не влияют друг на друга).',
    level: E,
    source: YAKOR_4.svyaz('sovmestnye'),
    teoriyaNomera: T4,
  },

  /* ── Противоположное событие ── */
  {
    id: '5-protiv',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'formula',
    front: 'Вероятность противоположного события $\\bar A$ через $P(A)$?',
    back: '$P(\\bar A) = 1 - P(A)$',
    level: B,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-summa-1',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'verno',
    front: 'Сумма вероятностей события и противоположного ему события равна $1$.',
    verno: true,
    back: 'Верно: $P(A) + P(\\bar A) = 1$, ведь $A \\cup \\bar A$ — всё пространство исходов.',
    level: B,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-protiv-gran',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'svoystvo',
    front: 'Какое событие противоположно событию «$X > 1$» — «прослужит больше года»?',
    back: '«$X \\le 1$» — прослужит год или меньше. Знак меняется на противоположный, граница переходит к новому событию.',
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-protiv-gran-l',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'verno',
    front: 'Событие, противоположное «$X < 2$», — это «$X > 2$».',
    verno: false,
    back: 'Неверно: противоположное — «$X \\ge 2$». Точка $2$ не входит в «$X < 2$», значит входит в противоположное.',
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-protiv-v',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'vychislenie',
    front:
      'Вероятность того, что новый принтер прослужит больше года, равна $0{,}91$. Найдите вероятность, что он прослужит год или меньше.',
    back: 'События противоположные: $P = 1 - 0{,}91 = 0{,}09$',
    otvet: '0,09',
    proverka: () => 1 - 0.91,
    level: B,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-ruchka-v',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'vychislenie',
    front:
      'Вероятность того, что новый фломастер из коробки окажется засохшим, равна $0{,}16$. Найдите вероятность, что случайно выбранный фломастер пишет.',
    back: '«Пишет» противоположно «засох»: $P = 1 - 0{,}16 = 0{,}84$',
    otvet: '0,84',
    proverka: () => 1 - 0.16,
    level: B,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-temperatura',
    task: 5,
    topic: 'protivopolozhnoe',
    type: 'verno',
    front:
      'События «температура ниже $36{,}8$°» и «температура $36{,}8$° или выше» противоположны.',
    verno: true,
    back: 'Верно: одно из них обязательно происходит, вместе — никогда. Граница $36{,}8$ входит во второе событие.',
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },

  /* ── Промежутки на координатной прямой ── */
  {
    id: '5-ideya',
    task: 5,
    topic: 'pryamaya',
    type: 'svoystvo',
    front: 'В чём главная идея метода координатной прямой?',
    back: 'Возможные значения случайной величины изображают на прямой, события — промежутками. Тогда видно, лежит ли один промежуток внутри другого.',
    level: B,
    source: YAKOR_5.pryamaya('ideya'),
  },
  {
    id: '5-vychest',
    task: 5,
    topic: 'pryamaya',
    type: 'formula',
    front: 'Событие «$X > b$» — часть события «$X > a$» ($a < b$). Чему равна $P(a < X \\le b)$?',
    back: '$P(a < X \\le b) = P(X > a) - P(X > b)$',
    pochemu: 'Один промежуток лежит внутри другого — вероятности вычитаем.',
    level: E,
    source: YAKOR_5.pryamaya('vlozhenie'),
  },
  {
    id: '5-ch-vlozh',
    task: 5,
    topic: 'pryamaya',
    type: 'chertezh',
    front:
      'Верхний луч — «$X > 3$», его вероятность $0{,}88$; нижний — «$X > 5$», вероятность $0{,}61$. Как найти $P(3 < X \\le 5)$?',
    back: 'Луч «$X > 5$» лежит внутри «$X > 3$» — вычитаем: $0{,}88 - 0{,}61 = 0{,}27$.',
    figure: luchi(
      [
        { ot: 3, kuda: 'vpravo', podpis: '0,88' },
        { ot: 5, kuda: 'vpravo', podpis: '0,61' },
      ],
      [0, 3, 5],
      'Координатная прямая: луч от 3 вправо целиком содержит луч от 5 вправо',
    ),
    level: E,
    source: YAKOR_5.pryamaya('vlozhenie'),
  },
  {
    id: '5-vlozh-l',
    task: 5,
    topic: 'pryamaya',
    type: 'verno',
    front: 'Событие «$X > 5$» лежит внутри события «$X > 3$», поэтому $P(X > 5) \\le P(X > 3)$.',
    verno: true,
    back: 'Верно: если одно событие целиком содержится в другом, его вероятность не больше.',
    level: B,
    source: YAKOR_4.izoVlozhenie,
    teoriyaNomera: T4,
  },
  {
    id: '5-srok-v',
    task: 5,
    topic: 'pryamaya',
    type: 'vychislenie',
    front:
      'Вероятность того, что холодильник прослужит больше $3$ лет, равна $0{,}88$, больше $5$ лет — $0{,}61$. Найдите вероятность, что он прослужит больше $3$, но не больше $5$ лет.',
    back: '«Больше $5$» лежит внутри «больше $3$»: $P = 0{,}88 - 0{,}61 = 0{,}27$',
    otvet: '0,27',
    proverka: () => 0.88 - 0.61,
    level: E,
    source: YAKOR_5.pryamaya('vlozhenie'),
  },
  {
    id: '5-test-v',
    task: 5,
    topic: 'pryamaya',
    type: 'vychislenie',
    front:
      'Вероятность того, что ученик верно решит больше $9$ задач теста, равна $0{,}81$, больше $10$ задач — $0{,}74$. Найдите вероятность, что он решит ровно $10$ задач.',
    back: '«Больше $10$» лежит внутри «больше $9$», разница — ровно $10$ задач: $P = 0{,}81 - 0{,}74 = 0{,}07$',
    otvet: '0,07',
    proverka: () => 0.81 - 0.74,
    level: E,
    source: YAKOR_5.pryamaya('vlozhenie'),
  },
  {
    id: '5-avtobus-v',
    task: 5,
    topic: 'pryamaya',
    type: 'vychislenie',
    front:
      'Вероятность того, что в автобусе меньше $20$ пассажиров, равна $0{,}92$, меньше $15$ — $0{,}48$. Найдите вероятность, что пассажиров от $15$ до $19$.',
    back: '«Меньше $15$» лежит внутри «меньше $20$»: $P = 0{,}92 - 0{,}48 = 0{,}44$',
    pochemu: 'Здесь вложенность в другую сторону: оба луча смотрят влево.',
    otvet: '0,44',
    proverka: () => 0.92 - 0.48,
    level: E,
    source: YAKOR_5.pryamaya('vlozhenie'),
  },
  {
    id: '5-nelzya',
    task: 5,
    topic: 'pryamaya',
    type: 'svoystvo',
    front: 'Даны $P(X < 2)$ и $P(X > 1)$. Почему нельзя просто вычесть одно из другого?',
    back: 'Промежутки пересекаются, но ни один не лежит в другом: разность не равна вероятности ни одного участка. Нужно противоположное событие.',
    level: E,
    source: YAKOR_5.pryamaya('peresechenie'),
  },
  {
    id: '5-nelzya-l',
    task: 5,
    topic: 'pryamaya',
    type: 'verno',
    front:
      'Если промежутки двух событий пересекаются, искомую вероятность всегда даёт разность их вероятностей.',
    verno: false,
    back: 'Неверно: вычитать можно, только когда один промежуток лежит внутри другого. Иначе — через противоположное событие.',
    level: E,
    source: YAKOR_5.pryamaya('peresechenie'),
  },
  {
    id: '5-perekryt',
    task: 5,
    topic: 'pryamaya',
    type: 'formula',
    front:
      'Даны $P(X < b)$ и $P(X > a)$, $a < b$, лучи смотрят навстречу. Чему равна $P(a < X < b)$?',
    back: '$P(a < X < b) = P(X < b) - P(X \\le a) = P(X < b) - (1 - P(X > a))$',
    pochemu: 'Сначала противоположное к «$X > a$», потом убираем этот участок из «$X < b$».',
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-ch-perekryt',
    task: 5,
    topic: 'pryamaya',
    type: 'chertezh',
    front:
      'Верхний луч — «$X < 4$», вероятность $0{,}9$; нижний — «$X > 2$», вероятность $0{,}95$. Как найти $P(2 < X < 4)$?',
    back: 'Лучи перекрываются, вложенности нет. $P(X \\le 2) = 1 - 0{,}95 = 0{,}05$, $P(2 < X < 4) = 0{,}9 - 0{,}05 = 0{,}85$.',
    figure: luchi(
      [
        { ot: 4, kuda: 'vlevo', podpis: '0,9' },
        { ot: 2, kuda: 'vpravo', podpis: '0,95' },
      ],
      [0, 2, 4],
      'Координатная прямая: луч от 4 влево и луч от 2 вправо перекрываются, ни один не лежит в другом',
    ),
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-chaynik-v',
    task: 5,
    topic: 'pryamaya',
    type: 'vychislenie',
    front:
      'Вероятность того, что утюг прослужит меньше $3$ лет, равна $0{,}9$, больше года — $0{,}97$. Найдите вероятность, что он прослужит больше года, но меньше $3$ лет.',
    back: '$P(X \\le 1) = 1 - 0{,}97 = 0{,}03$, $P(1 < X < 3) = 0{,}9 - 0{,}03 = 0{,}87$',
    otvet: '0,87',
    proverka: () => 0.9 - (1 - 0.97),
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-hleb-v',
    task: 5,
    topic: 'pryamaya',
    type: 'vychislenie',
    front:
      'Вероятность того, что буханка тяжелее $790$ г, равна $0{,}96$, легче $810$ г — $0{,}82$. Найдите вероятность, что её масса больше $790$ г, но меньше $810$ г.',
    back: '$P(\\text{не тяжелее } 790) = 1 - 0{,}96 = 0{,}04$, $P = 0{,}82 - 0{,}04 = 0{,}78$',
    otvet: '0,78',
    proverka: () => 0.82 - (1 - 0.96),
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
  },
  {
    id: '5-vyvod',
    task: 5,
    topic: 'pryamaya',
    type: 'svoystvo',
    front: 'Что обязательно проверить, прежде чем вычитать вероятности двух событий-промежутков?',
    back: 'Изобразить события на координатной прямой и проверить, **содержится ли один промежуток в другом**.',
    level: B,
    source: YAKOR_5.pryamaya('vyvod'),
  },
  {
    id: '5-algoritm',
    task: 5,
    topic: 'pryamaya',
    type: 'svoystvo',
    front: 'Алгоритм задачи с двумя событиями-промежутками — четыре шага?',
    back: '1) Изобразить события на прямой. 2) Проверить, содержится ли один промежуток в другом. 3) Если да — вычесть. 4) Если нет — через противоположное событие.',
    level: B,
    source: YAKOR_5.pryamaya('algoritm'),
  },
  {
    id: '5-syuzhety',
    task: 5,
    topic: 'pryamaya',
    type: 'svoystvo',
    front: 'По каким признакам в условии узнать задачу на промежутки?',
    back: 'Даны вероятности «больше» или «меньше» для одной величины: срок службы, время ожидания, масса изделия, рост, число пассажиров.',
    level: B,
    source: YAKOR_5.pryamaya('syuzhety'),
  },

  /* ── Сложение вероятностей: «добавлено» ── */
  {
    id: '5-slozh-nesovm',
    task: 5,
    topic: 'slozhenie',
    type: 'formula',
    front: 'События $A$ и $B$ несовместны. Чему равна $P(A \\cup B)$?',
    back: '$P(A \\cup B) = P(A) + P(B)$',
    pochemu: 'Общих исходов нет — ничего не посчитано дважды.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-slozh-nesovm-v',
    task: 5,
    topic: 'slozhenie',
    type: 'vychislenie',
    front:
      'На зачёте вероятность вопроса по теме «Логарифмы» равна $0{,}25$, по теме «Тригонометрия» — $0{,}3$. Вопросов сразу по обеим темам нет. Найдите вероятность вопроса по одной из этих тем.',
    back: 'События несовместны: $P = 0{,}25 + 0{,}3 = 0{,}55$',
    otvet: '0,55',
    proverka: () => 0.25 + 0.3,
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-slozh-sovm',
    task: 5,
    topic: 'slozhenie',
    type: 'formula',
    front: 'События $A$ и $B$ совместны. Чему равна $P(A \\cup B)$?',
    back: '$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$',
    pochemu: 'Общая часть входит и в $A$, и в $B$ — без вычитания она посчитана дважды.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-slozh-sovm-l',
    task: 5,
    topic: 'slozhenie',
    type: 'verno',
    front: 'Для любых двух событий $P(A \\cup B) = P(A) + P(B)$.',
    verno: false,
    back: 'Неверно: так только для несовместных. У совместных вычитают общую часть: $P(A) + P(B) - P(A \\cap B)$.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-kofe-v',
    task: 5,
    topic: 'slozhenie',
    type: 'vychislenie',
    front:
      'В холле два автомата с кофе. Вероятность, что к вечеру кофе закончится в первом, $0{,}25$, во втором — тоже $0{,}25$, в обоих — $0{,}1$. Найдите вероятность, что к вечеру кофе останется в обоих.',
    back: '$P(\\text{закончится хотя бы в одном}) = 0{,}25 + 0{,}25 - 0{,}1 = 0{,}4$, $P = 1 - 0{,}4 = 0{,}6$',
    otvet: '0,6',
    proverka: () => 1 - (0.25 + 0.25 - 0.1),
    level: E,
    source: DOBAVLENO,
  },

  /* ── Независимые события: «добавлено» ── */
  {
    id: '5-umnozh',
    task: 5,
    topic: 'umnozhenie',
    type: 'formula',
    front: 'События $A$ и $B$ независимы. Чему равна вероятность, что произойдут оба?',
    back: '$P(A \\cap B) = P(A) \\cdot P(B)$',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-strelok-v',
    task: 5,
    topic: 'umnozhenie',
    type: 'vychislenie',
    front:
      'Стрелок попадает в мишень с вероятностью $0{,}8$. Он стреляет дважды. Найдите вероятность, что оба раза он попадёт.',
    back: 'Выстрелы независимы: $P = 0{,}8 \\cdot 0{,}8 = 0{,}64$',
    otvet: '0,64',
    proverka: () => 0.8 * 0.8,
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-hotya-by',
    task: 5,
    topic: 'umnozhenie',
    type: 'formula',
    front:
      'Каждая из $n$ ламп независимо перегорает с вероятностью $p$. Найдите вероятность, что хотя бы одна не перегорит.',
    back: '$1 - p^n$: «хотя бы одна не перегорит» противоположно «перегорели все».',
    pochemu: 'Вероятность «перегорели все» — произведение $n$ множителей $p$.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '5-hotya-by-v',
    task: 5,
    topic: 'umnozhenie',
    type: 'vychislenie',
    front:
      'В магазине два продавца, каждый занят с клиентом с вероятностью $0{,}4$ независимо от другого. Найдите вероятность, что хотя бы один продавец свободен.',
    back: 'Оба заняты: $0{,}4 \\cdot 0{,}4 = 0{,}16$. Хотя бы один свободен: $1 - 0{,}16 = 0{,}84$',
    otvet: '0,84',
    proverka: () => 1 - 0.4 * 0.4,
    level: E,
    source: DOBAVLENO,
  },
];

/* ── Проверки формул: случайные распределения ── */

/** Случайная величина: значения 0, 1, …, k − 1 со случайными вероятностями. */
function velichina(rnd: () => number): number[] {
  const k = 4 + Math.floor(rnd() * 12);
  const w = Array.from({ length: k }, () => 0.05 + rnd());
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

/** P(условие на значение X) прямым сложением вероятностей значений. */
const Pv = (p: readonly number[], uslovie: (x: number) => boolean): number =>
  p.reduce((s, px, x) => s + (uslovie(x) ? px : 0), 0);

/** Две границы a < b внутри значений. */
function granitsy(k: number, rnd: () => number): [number, number] {
  const a = Math.floor(rnd() * (k - 1));
  const b = a + 1 + Math.floor(rnd() * (k - 1 - a));
  return [a, b];
}

/** Случайное событие опыта — набор значений. */
const sobytie = (k: number, rnd: () => number): Set<number> =>
  new Set(Array.from({ length: k }, (_, i) => i).filter(() => rnd() < 0.5));

const Ps = (p: readonly number[], a: Set<number>): number => Pv(p, (x) => a.has(x));

const proverki: ProverkaFormuly[] = [
  {
    kartochka: '5-protiv',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const a = sobytie(p.length, rnd);
      return { poFormule: 1 - Ps(p, a), pryamo: Pv(p, (x) => !a.has(x)) };
    },
  },
  {
    kartochka: '5-vychest',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const [a, b] = granitsy(p.length, rnd);
      return {
        poFormule: Pv(p, (x) => x > a) - Pv(p, (x) => x > b),
        pryamo: Pv(p, (x) => a < x && x <= b),
      };
    },
  },
  {
    kartochka: '5-perekryt',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const [a, b] = granitsy(p.length, rnd);
      return {
        poFormule: Pv(p, (x) => x < b) - (1 - Pv(p, (x) => x > a)),
        pryamo: Pv(p, (x) => a < x && x < b),
      };
    },
  },
  {
    /* Несовместные: B берём из исходов, которых нет в A. */
    kartochka: '5-slozh-nesovm',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const a = sobytie(p.length, rnd);
      const b = new Set([...sobytie(p.length, rnd)].filter((x) => !a.has(x)));
      return { poFormule: Ps(p, a) + Ps(p, b), pryamo: Pv(p, (x) => a.has(x) || b.has(x)) };
    },
  },
  {
    kartochka: '5-slozh-sovm',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const a = sobytie(p.length, rnd);
      const b = sobytie(p.length, rnd);
      return {
        poFormule: Ps(p, a) + Ps(p, b) - Pv(p, (x) => a.has(x) && b.has(x)),
        pryamo: Pv(p, (x) => a.has(x) || b.has(x)),
      };
    },
  },
  {
    /* Два независимых опыта: исход — пара, её вероятность — p(i)·q(j). */
    kartochka: '5-umnozh',
    sluchay: (rnd) => {
      const p = velichina(rnd);
      const q = velichina(rnd);
      const a = sobytie(p.length, rnd);
      const b = sobytie(q.length, rnd);
      let pary = 0;
      p.forEach((pi, i) =>
        q.forEach((qj, j) => {
          if (a.has(i) && b.has(j)) pary += pi * qj;
        }),
      );
      return { poFormule: Ps(p, a) * Ps(q, b), pryamo: pary };
    },
  },
  {
    /* Перебор всех 2^n состояний ламп. */
    kartochka: '5-hotya-by',
    sluchay: (rnd) => {
      const n = 1 + Math.floor(rnd() * 8);
      const pp = rnd();
      let hotyaBy = 0;
      for (let mask = 0; mask < 2 ** n; mask += 1) {
        let ver = 1;
        let tseluh = 0;
        for (let i = 0; i < n; i += 1) {
          const peregorela = ((mask >> i) & 1) === 1;
          ver *= peregorela ? pp : 1 - pp;
          if (!peregorela) tseluh += 1;
        }
        if (tseluh > 0) hotyaBy += ver;
      }
      return { poFormule: 1 - pp ** n, pryamo: hotyaBy };
    },
  },
];

const KOLODA_5: Koloda = {
  task: 5,
  slug: '5',
  title: 'Вероятность: сложная',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'sobytiya', title: 'Противоположные, несовместные, независимые' },
    { id: 'protivopolozhnoe', title: 'Противоположное событие' },
    { id: 'pryamaya', title: 'Промежутки на координатной прямой' },
    { id: 'slozhenie', title: 'Сложение вероятностей' },
    { id: 'umnozhenie', title: 'Умножение и «хотя бы один»' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_5;
