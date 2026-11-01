/**
 * Карточки по теории задания №4 «Вероятность: простая».
 *
 * `source` — якорь блока вкладки «Теория» №4: «t4-vid-…», «t4-klass-…»,
 * «t4-izo-…» (lib/veroyatnost/teoriya-yakorya.ts). Написаны разделы
 * «Виды событий», «Как изображать события» и «Классическая
 * вероятность»; раздел «Противоположное событие» пока пуст, поэтому
 * формула $P(\bar A) = 1 - P(A)$ и доля длины ведут в теорию №5 —
 * там они разобраны на координатной прямой (`teoriyaNomera: 5`).
 *
 * «Добавлено» — два факта, на которых стоят методы №4 «Игральные кости»
 * и «Броски монеты», а в теории их нет: у двух костей 36 исходов, у
 * $n$ бросков монеты — $2^n$.
 *
 * Рисунки — диаграммы Эйлера теории (lib/veroyatnost/risunkiKartochek).
 * Примеры с числами — свои, не задачи банка и не примеры теории;
 * ответы и формулы проверяет scripts/verify_cards.
 */

import type { Kartochka, Koloda, ProverkaFormuly } from '@/lib/kartochki/tipy';
import { DOBAVLENO } from '@/lib/kartochki/tipy';
import type { EylerVid } from '@/lib/veroyatnost/risunkiKartochek';
import { YAKOR_4, YAKOR_5 } from '@/lib/veroyatnost/teoriya-yakorya';

const B = 'база' as const;
const E = 'важно для ЕГЭ' as const;

/** Диаграмма Эйлера из таблицы «Как изображать события». */
const eyler = ({ zakraska, alt }: { zakraska: EylerVid; alt: string }) => ({
  dvizhok: 'veroyatnost' as const,
  risunok: { vid: 'eyler' as const, zakraska, alt },
});

/** Числа от 1 до n. */
const ot1do = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

/** Доля исходов, где выполнено условие: m / n перебором. */
const dolya = <T>(ishody: readonly T[], uslovie: (x: T) => boolean): number =>
  ishody.filter(uslovie).length / ishody.length;

/** Все исходы бросков: «ОР», «РО»… — перебором, без формулы 2^n. */
function broski(n: number): string[] {
  let out = [''];
  for (let i = 0; i < n; i += 1) out = out.flatMap((s) => [`${s}О`, `${s}Р`]);
  return out;
}

/** Пары очков двух костей перебором. */
const dveKosti = (): [number, number][] =>
  ot1do(6).flatMap((a) => ot1do(6).map((b): [number, number] => [a, b]));

const kartochki: Kartochka[] = [
  /* ── Виды событий ── */
  {
    id: '4-nevozmozhnoe',
    task: 4,
    topic: 'vidy',
    type: 'svoystvo',
    front: 'Какое событие называют **невозможным**? Чему равна его вероятность?',
    back: 'Событие, которое не может произойти при данных условиях. $P(A) = 0$.',
    level: B,
    source: YAKOR_4.vid('nevozmozhnoe'),
  },
  {
    id: '4-sluchaynoe',
    task: 4,
    topic: 'vidy',
    type: 'svoystvo',
    front: 'Какое событие называют **случайным**? В каких пределах его вероятность?',
    back: 'Событие, которое при данных условиях может произойти, а может и не произойти. $0 < P(A) < 1$.',
    level: B,
    source: YAKOR_4.vid('sluchaynoe'),
  },
  {
    id: '4-dostovernoe',
    task: 4,
    topic: 'vidy',
    type: 'svoystvo',
    front: 'Какое событие называют **достоверным**? Чему равна его вероятность?',
    back: 'Событие, которое обязательно произойдёт при данных условиях. $P(A) = 1$.',
    pochemu: 'Все возможные исходы удовлетворяют условию.',
    level: B,
    source: YAKOR_4.vid('dostovernoe'),
  },
  {
    id: '4-tri-vida',
    task: 4,
    topic: 'vidy',
    type: 'svoystvo',
    front: 'Вероятность события $A$ — какое-то число. В каких границах оно может быть?',
    back: '$0 \\le P(A) \\le 1$: ноль у невозможного, единица у достоверного, между ними — у случайного.',
    level: E,
    source: YAKOR_4.zapomni,
  },
  {
    id: '4-kost-7',
    task: 4,
    topic: 'vidy',
    type: 'verno',
    front: 'При броске одной игральной кости выпадает $7$ очков. Это случайное событие.',
    verno: false,
    back: 'Неверно: на гранях кости числа от $1$ до $6$, семи очков не бывает. Событие невозможное, $P = 0$.',
    level: B,
    source: YAKOR_4.vid('nevozmozhnoe'),
  },
  {
    id: '4-kost-ne-bolshe-6',
    task: 4,
    topic: 'vidy',
    type: 'verno',
    front: 'При броске игральной кости выпадет не больше $6$ очков. Это достоверное событие.',
    verno: true,
    back: 'Верно: любой из исходов $1$, $2$, …, $6$ подходит, поэтому $P = 1$.',
    level: B,
    source: YAKOR_4.vid('dostovernoe'),
  },
  {
    id: '4-moneta-orel',
    task: 4,
    topic: 'vidy',
    type: 'verno',
    front: 'У монеты есть сторона с орлом, поэтому выпадение орла — достоверное событие.',
    verno: false,
    back: 'Неверно: орёл может выпасть, а может и нет. Событие случайное, $0 < P < 1$.',
    level: B,
    source: YAKOR_4.vid('sluchaynoe'),
  },
  {
    id: '4-usloviya',
    task: 4,
    topic: 'vidy',
    type: 'svoystvo',
    front: 'От чего зависит, невозможное событие, случайное или достоверное?',
    back: 'От **условий**, в которых его рассматривают. Изменились условия — невозможное может стать случайным.',
    pochemu: 'Подснежники в январе в обычную зиму невозможны, а в аномально тёплую — случаются.',
    level: B,
    source: YAKOR_4.vazhno,
  },
  {
    id: '4-otritsatelnaya',
    task: 4,
    topic: 'vidy',
    type: 'verno',
    front: 'Вероятность события может оказаться отрицательной, если событие очень маловероятно.',
    verno: false,
    back: 'Неверно: меньше всего вероятность у невозможного события, и она равна $0$. Отрицательной вероятности не бывает.',
    level: B,
    source: YAKOR_4.zapomni,
  },

  /* ── Связанные события ── */
  {
    id: '4-nezavisimye',
    task: 4,
    topic: 'svyaz',
    type: 'svoystvo',
    front: 'Какие события $A$ и $B$ называют **независимыми**?',
    back: 'Наступление одного из них не изменяет вероятность наступления другого.',
    pochemu: 'Второй бросок монеты не зависит от того, что выпало в первом.',
    level: B,
    source: YAKOR_4.svyaz('nezavisimye'),
  },
  {
    id: '4-sovmestnye',
    task: 4,
    topic: 'svyaz',
    type: 'svoystvo',
    front: 'Какие события $A$ и $B$ называют **совместными**?',
    back: 'Такие, которые могут произойти одновременно.',
    level: B,
    source: YAKOR_4.svyaz('sovmestnye'),
  },
  {
    id: '4-raznitsa',
    task: 4,
    topic: 'svyaz',
    type: 'svoystvo',
    front: 'Чем совместность событий отличается от их независимости?',
    back: 'Независимость — про **несколько опытов**: влияет ли один на другой. Совместность — про **один опыт**: могут ли два исхода случиться в нём вместе.',
    level: E,
    source: YAKOR_4.svyaz('sovmestnye'),
  },
  {
    id: '4-nezav-vmeste',
    task: 4,
    topic: 'svyaz',
    type: 'verno',
    front: 'Независимые события не могут произойти одновременно.',
    verno: false,
    back: 'Неверно: независимые события могут произойти одновременно — например, орёл в первом и во втором броске.',
    level: E,
    source: YAKOR_4.svyaz('nezavisimye'),
  },
  {
    id: '4-dva-broska',
    task: 4,
    topic: 'svyaz',
    type: 'verno',
    front:
      'Монету бросают дважды. Если в первый раз выпал орёл, во второй раз решка выпадет вероятнее.',
    verno: false,
    back: 'Неверно: броски независимы, результат первого никак не влияет на второй.',
    level: B,
    source: YAKOR_4.svyaz('nezavisimye'),
  },
  {
    id: '4-kofe',
    task: 4,
    topic: 'svyaz',
    type: 'verno',
    front:
      'При одном нажатии кнопки автомат готовит капучино или латте. События «приготовил капучино» и «приготовил латте» несовместны.',
    verno: true,
    back: 'Верно: за одно нажатие автомат не приготовит оба напитка сразу.',
    level: B,
    source: YAKOR_4.svyaz('sovmestnye'),
  },

  /* ── Как изображать события ── */
  {
    id: '4-dva-sposoba',
    task: 4,
    topic: 'izobrazhenie',
    type: 'svoystvo',
    front: 'Какими двумя способами изображают события и что видно на каждом?',
    back: '**Диаграмма Эйлера** показывает, как события связаны между собой. **Числовая прямая** — какие значения случайной величины входят в событие.',
    level: B,
    source: YAKOR_4.izoSposoby,
  },
  {
    id: '4-ch-dostovernoe',
    task: 4,
    topic: 'izobrazhenie',
    type: 'chertezh',
    front: 'Закрашен весь прямоугольник. Какое событие так изображают?',
    back: '**Достоверное** событие $\\Omega$: всё пространство исходов, $P = 1$. На числовой прямой — вся прямая.',
    figure: eyler({
      zakraska: 'dostovernoe',
      alt: 'Диаграмма Эйлера: закрашен весь прямоугольник исходов',
    }),
    level: B,
    source: YAKOR_4.izo('dostovernoe'),
  },
  {
    id: '4-ch-peresechenie',
    task: 4,
    topic: 'izobrazhenie',
    type: 'chertezh',
    front: 'Какое событие закрашено на диаграмме Эйлера?',
    back: 'Пересечение $A \\cap B$: происходят **одновременно** и $A$, и $B$.',
    figure: eyler({
      zakraska: 'peresechenie',
      alt: 'Два пересекающихся круга A и B, закрашена только их общая часть',
    }),
    level: B,
    source: YAKOR_4.izo('peresechenie'),
  },
  {
    id: '4-ch-obedinenie',
    task: 4,
    topic: 'izobrazhenie',
    type: 'chertezh',
    front: 'Какое событие закрашено на диаграмме Эйлера?',
    back: 'Объединение $A \\cup B$: происходит **хотя бы одно** из событий $A$ или $B$.',
    figure: eyler({
      zakraska: 'obedinenie',
      alt: 'Два пересекающихся круга A и B, закрашены оба целиком',
    }),
    level: B,
    source: YAKOR_4.izo('obedinenie'),
  },
  {
    id: '4-ch-protivopolozhnoe',
    task: 4,
    topic: 'izobrazhenie',
    type: 'chertezh',
    front: 'Закрашено всё, кроме круга $A$. Какое это событие?',
    back: 'Противоположное событие $\\bar A$: $A$ не произошло. Вместе $A$ и $\\bar A$ дают всё пространство исходов.',
    figure: eyler({
      zakraska: 'protivopolozhnoe',
      alt: 'Круг A в прямоугольнике исходов, закрашено всё вне круга',
    }),
    level: B,
    source: YAKOR_4.izo('protivopolozhnoe'),
  },
  {
    id: '4-ch-nesovmestnye',
    task: 4,
    topic: 'izobrazhenie',
    type: 'chertezh',
    front: 'Круги $A$ и $B$ не пересекаются. Как называют такие события и как это записать?',
    back: '**Несовместные**: не могут произойти одновременно, $A \\cap B = \\varnothing$.',
    pochemu: 'На числовой прямой — два непересекающихся отрезка.',
    figure: eyler({
      zakraska: 'nesovmestnye',
      alt: 'Два непересекающихся круга A и B в прямоугольнике исходов',
    }),
    level: E,
    source: YAKOR_4.izo('nesovmestnye'),
  },
  {
    id: '4-protiv-omega',
    task: 4,
    topic: 'izobrazhenie',
    type: 'formula',
    front: 'Чему равно объединение события $A$ и противоположного ему $\\bar A$?',
    back: '$A \\cup \\bar A = \\Omega$ — всё пространство исходов; общих исходов у них нет.',
    level: E,
    source: YAKOR_4.izo('protivopolozhnoe'),
  },
  {
    id: '4-peresech-l',
    task: 4,
    topic: 'izobrazhenie',
    type: 'verno',
    front: 'Событие $A \\cap B$ происходит, когда происходит хотя бы одно из событий $A$ и $B$.',
    verno: false,
    back: 'Неверно: «хотя бы одно» — это объединение $A \\cup B$. Пересечение $A \\cap B$ — когда происходят оба.',
    level: E,
    source: YAKOR_4.izo('peresechenie'),
  },
  {
    id: '4-dlinnee-l',
    task: 4,
    topic: 'izobrazhenie',
    type: 'verno',
    front:
      'На числовой прямой отрезок события $A$ длиннее отрезка события $B$. Значит, $P(A) > P(B)$.',
    verno: false,
    back: 'Неверно: по размеру фигуры судить о вероятности нельзя. Сравнить можно, только если одно событие лежит внутри другого.',
    level: E,
    source: YAKOR_4.izoVlozhenie,
  },
  {
    id: '4-vlozhenie',
    task: 4,
    topic: 'izobrazhenie',
    type: 'formula',
    front: 'Событие $A$ целиком лежит внутри события $B$. Что можно сказать об их вероятностях?',
    back: '$P(A) \\le P(B)$',
    pochemu: 'Каждый исход, при котором происходит $A$, входит и в $B$.',
    figure: eyler({ zakraska: 'vlozhenie', alt: 'Круг A целиком внутри круга B' }),
    level: E,
    source: YAKOR_4.izoVlozhenie,
  },
  {
    id: '4-chet-bolshe-3',
    task: 4,
    topic: 'izobrazhenie',
    type: 'verno',
    front:
      'Бросают игральную кость. События «выпало чётное число» и «выпало больше трёх» несовместны.',
    verno: false,
    back: 'Неверно: у них общие исходы $4$ и $6$ — события совместны, $A \\cap B = \\{4;\\ 6\\}$.',
    level: B,
    source: YAKOR_4.izoPrimer,
  },
  {
    id: '4-peresech-v',
    task: 4,
    topic: 'izobrazhenie',
    type: 'vychislenie',
    front:
      'Из чисел от $1$ до $20$ наугад выбирают одно. $A$ — число чётное, $B$ — делится на $5$. Найдите $P(A \\cap B)$.',
    back: '$A \\cap B = \\{10;\\ 20\\}$, $P = \\dfrac{2}{20} = 0{,}1$',
    otvet: '0,1',
    proverka: () => dolya(ot1do(20), (x) => x % 2 === 0 && x % 5 === 0),
    level: E,
    source: YAKOR_4.izo('peresechenie'),
  },
  {
    id: '4-obed-v',
    task: 4,
    topic: 'izobrazhenie',
    type: 'vychislenie',
    front:
      'Из чисел от $1$ до $20$ наугад выбирают одно. $A$ — число чётное, $B$ — делится на $5$. Найдите $P(A \\cup B)$.',
    back: 'Чётных $10$, кратных пяти $4$, из них $2$ общих: в $A \\cup B$ ровно $10 + 4 - 2 = 12$ чисел. $P = \\dfrac{12}{20} = 0{,}6$',
    pochemu: 'Общие числа $10$ и $20$ считаем один раз.',
    otvet: '0,6',
    proverka: () => dolya(ot1do(20), (x) => x % 2 === 0 || x % 5 === 0),
    level: E,
    source: YAKOR_4.izo('obedinenie'),
  },

  /* ── Классическая вероятность ── */
  {
    id: '4-klass',
    task: 4,
    topic: 'klassicheskaya',
    type: 'formula',
    front: 'Классическое определение вероятности: формула и что в ней что?',
    back: '$P(A) = \\dfrac{m}{n}$, где $m$ — число благоприятных исходов, $n$ — общее число равновозможных исходов.',
    level: B,
    source: YAKOR_4.klass('opredelenie'),
  },
  {
    id: '4-bukvy-l',
    task: 4,
    topic: 'klassicheskaya',
    type: 'verno',
    front: 'В формуле $P(A) = \\dfrac{m}{n}$ буква $n$ — число благоприятных исходов.',
    verno: false,
    back: 'Неверно: $n$ — общее число равновозможных исходов, благоприятные — $m$.',
    level: B,
    source: YAKOR_4.klass('opredelenie'),
  },
  {
    id: '4-ne-bolshe-1',
    task: 4,
    topic: 'klassicheskaya',
    type: 'svoystvo',
    front: 'Почему по классическому определению вероятность не бывает больше $1$?',
    back: 'Благоприятные исходы — часть всех исходов: $m \\le n$, значит $\\dfrac{m}{n} \\le 1$.',
    level: B,
    source: YAKOR_4.klass('pochemu'),
  },
  {
    id: '4-ravna-1',
    task: 4,
    topic: 'klassicheskaya',
    type: 'svoystvo',
    front: 'Что означает $P(A) = 1$ на языке исходов?',
    back: '$m = n$: благоприятными являются **все** возможные исходы, событие достоверно.',
    level: B,
    source: YAKOR_4.klass('pochemu'),
  },
  {
    id: '4-m-bolshe-n-l',
    task: 4,
    topic: 'klassicheskaya',
    type: 'verno',
    front: 'В решении получилось $m = 15$ и $n = 10$. Значит, ответ $1{,}5$.',
    verno: false,
    back: 'Неверно: благоприятных исходов не может быть больше всех, $m \\le n$. Ошибка в подсчёте исходов.',
    pochemu: 'Ответ больше $1$ в задаче на вероятность — всегда сигнал проверить решение.',
    level: E,
    source: YAKOR_4.klass('primer'),
  },
  {
    id: '4-ravnovozm',
    task: 4,
    topic: 'klassicheskaya',
    type: 'svoystvo',
    front: 'Когда можно пользоваться формулой $P(A) = \\dfrac{m}{n}$?',
    back: 'Когда все элементарные исходы **равновозможны**. Если нет — нужны другие методы.',
    level: E,
    source: YAKOR_4.klass('ravnovozmozhnye'),
  },
  {
    id: '4-ravnovozm-l',
    task: 4,
    topic: 'klassicheskaya',
    type: 'verno',
    front: 'Классическая формула $\\dfrac{m}{n}$ годится, даже если исходы опыта не равновозможны.',
    verno: false,
    back: 'Неверно: классическое определение работает, только когда элементарные исходы равновозможны.',
    level: E,
    source: YAKOR_4.klass('ravnovozmozhnye'),
  },
  {
    id: '4-kost-6',
    task: 4,
    topic: 'klassicheskaya',
    type: 'verno',
    front: 'При броске обычной игральной кости $6$ равновозможных исходов.',
    verno: true,
    back: 'Верно: каждый из результатов $1$, $2$, $3$, $4$, $5$, $6$ считается равновозможным.',
    level: B,
    source: YAKOR_4.klass('ravnovozmozhnye'),
  },
  {
    id: '4-shagi',
    task: 4,
    topic: 'klassicheskaya',
    type: 'svoystvo',
    front: 'Три шага решения задачи на классическую вероятность?',
    back: '1) Найти все возможные исходы. 2) Найти благоприятные. 3) Разделить число благоприятных на число всех.',
    pochemu: 'И проверить, что все исходы равновозможны.',
    level: B,
    source: YAKOR_4.klass('kak-uznat'),
  },

  /* ── Счёт по формуле m/n ── */
  {
    id: '4-shary-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front:
      'В урне $12$ шаров: $3$ белых, остальные чёрные. Наугад достают один. Найдите вероятность, что он белый.',
    back: '$m = 3$, $n = 12$, $P = \\dfrac{3}{12} = 0{,}25$',
    otvet: '0,25',
    proverka: () => 3 / 12,
    level: B,
    source: YAKOR_4.klass('opredelenie'),
  },
  {
    id: '4-bilety-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front:
      'На экзамене $40$ билетов, Оля не выучила $6$ из них. Найдите вероятность, что ей попадётся выученный билет.',
    back: 'Выученных $40 - 6 = 34$: $P = \\dfrac{34}{40} = 0{,}85$',
    otvet: '0,85',
    proverka: () => (40 - 6) / 40,
    level: B,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-chetnoe-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front: 'Бросают игральную кость. Найдите вероятность, что выпадет чётное число очков.',
    back: 'Благоприятные $2$, $4$, $6$: $P = \\dfrac{3}{6} = 0{,}5$',
    otvet: '0,5',
    proverka: () => dolya(ot1do(6), (x) => x % 2 === 0),
    level: B,
    source: YAKOR_4.klass('ravnovozmozhnye'),
  },
  {
    id: '4-sportsmeny-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front:
      'В соревнованиях $25$ спортсменов: $8$ из Сербии, $7$ из Чехии, остальные из Польши. Порядок выступлений — по жребию. Найдите вероятность, что первым выступит спортсмен из Польши.',
    back: 'Из Польши $25 - 8 - 7 = 10$: $P = \\dfrac{10}{25} = 0{,}4$',
    otvet: '0,4',
    proverka: () => (25 - 8 - 7) / 25,
    level: B,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-nasosy-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front:
      'Из $500$ насосов в среднем $15$ подтекают. Найдите вероятность, что случайно выбранный насос не подтекает.',
    back: 'Не подтекают $500 - 15 = 485$: $P = \\dfrac{485}{500} = 0{,}97$',
    pochemu: 'Благоприятные — исправные насосы, а не подтекающие.',
    otvet: '0,97',
    proverka: () => (500 - 15) / 500,
    level: E,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-dvuznachnoe-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front: 'Наугад выбирают двузначное число. Найдите вероятность, что оно делится на $5$.',
    back: 'Двузначных чисел $90$, кратных пяти среди них $18$ ($10$, $15$, …, $95$): $P = \\dfrac{18}{90} = 0{,}2$',
    pochemu: 'Двузначные — от $10$ до $99$, их $99 - 10 + 1 = 90$.',
    otvet: '0,2',
    proverka: () =>
      dolya(
        ot1do(99).filter((x) => x >= 10),
        (x) => x % 5 === 0,
      ),
    level: E,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-protiv',
    task: 4,
    topic: 'schet',
    type: 'formula',
    front: 'Известна вероятность $P(A)$. Как найти вероятность противоположного события $\\bar A$?',
    back: '$P(\\bar A) = 1 - P(A)$',
    pochemu: '$A$ и $\\bar A$ вместе дают всё пространство исходов, а у него вероятность $1$.',
    level: E,
    source: YAKOR_5.pryamaya('protivopolozhnoe'),
    teoriyaNomera: 5,
  },
  {
    id: '4-dlina-v',
    task: 4,
    topic: 'schet',
    type: 'vychislenie',
    front:
      'Точку наугад ставят на отрезок $[0;\\ 10]$. Найдите вероятность, что она попадёт на отрезок $[2;\\ 6]$.',
    back: 'Вероятность — доля длины: $P = \\dfrac{6 - 2}{10 - 0} = 0{,}4$',
    pochemu: 'Исходов бесконечно много, пересчитать их нельзя — сравниваем длины.',
    otvet: '0,4',
    proverka: () => (6 - 2) / (10 - 0),
    level: E,
    source: YAKOR_5.pryamaya('ideya'),
    teoriyaNomera: 5,
  },

  /* ── Кости и монеты: «добавлено» ── */
  {
    id: '4-dve-kosti',
    task: 4,
    topic: 'kosti',
    type: 'svoystvo',
    front: 'Бросают две игральные кости. Сколько равновозможных исходов у этого опыта?',
    back: '$6 \\cdot 6 = 36$: каждому числу на первой кости — шесть чисел на второй. Исходы удобно записать таблицей $6 \\times 6$.',
    pochemu: 'Пары $(1;\\ 2)$ и $(2;\\ 1)$ — разные исходы.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '4-kosti-nechet-v',
    task: 4,
    topic: 'kosti',
    type: 'vychislenie',
    front:
      'Бросают две игральные кости. Найдите вероятность, что на обеих выпадет нечётное число очков.',
    back: 'Нечётных на каждой кости $3$: $m = 3 \\cdot 3 = 9$, $n = 36$, $P = \\dfrac{9}{36} = 0{,}25$',
    otvet: '0,25',
    proverka: () => dolya(dveKosti(), ([a, b]) => a % 2 === 1 && b % 2 === 1),
    level: E,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-monety',
    task: 4,
    topic: 'kosti',
    type: 'formula',
    front: 'Монету бросают $n$ раз. Сколько равновозможных исходов?',
    back: '$2^n$: у каждого броска два исхода — орёл или решка.',
    pochemu: 'Два броска: ОО, ОР, РО, РР — четыре исхода, а не три.',
    level: E,
    source: DOBAVLENO,
  },
  {
    id: '4-monety-v',
    task: 4,
    topic: 'kosti',
    type: 'vychislenie',
    front: 'Монету бросают три раза. Найдите вероятность, что орёл выпадет ровно два раза.',
    back: 'Исходов $2^3 = 8$, благоприятные ООР, ОРО, РОО: $P = \\dfrac{3}{8} = 0{,}375$',
    otvet: '0,375',
    proverka: () => dolya(broski(3), (s) => s.split('О').length - 1 === 2),
    level: E,
    source: YAKOR_4.klass('kak-uznat'),
  },
  {
    id: '4-dve-monety-l',
    task: 4,
    topic: 'kosti',
    type: 'verno',
    front:
      'Монету бросают дважды. Исходов три: «два орла», «две решки», «орёл и решка», поэтому $P(\\text{орёл и решка}) = \\dfrac{1}{3}$.',
    verno: false,
    back: 'Неверно: эти три исхода не равновозможны. Равновозможных четыре — ОО, ОР, РО, РР, и $P = \\dfrac{2}{4} = \\dfrac{1}{2}$.',
    level: E,
    source: YAKOR_4.klass('ravnovozmozhnye'),
  },
];

/* ── Проверки формул: случайные опыты ── */

/** Случайный опыт: n исходов со своими вероятностями (не обязательно равными). */
function opyt(rnd: () => number): number[] {
  const n = 3 + Math.floor(rnd() * 10);
  const w = Array.from({ length: n }, () => 0.05 + rnd());
  const s = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / s);
}

/** Случайное событие — набор номеров исходов. */
const sobytie = (n: number, rnd: () => number): Set<number> =>
  new Set(Array.from({ length: n }, (_, i) => i).filter(() => rnd() < 0.5));

const P = (p: readonly number[], a: Set<number>): number =>
  p.reduce((s, x, i) => s + (a.has(i) ? x : 0), 0);

const proverki: ProverkaFormuly[] = [
  {
    /* Равновозможные исходы: m/n — то же, что сумма вероятностей
       благоприятных исходов, каждый по 1/n. */
    kartochka: '4-klass',
    sluchay: (rnd) => {
      const n = 2 + Math.floor(rnd() * 40);
      const a = sobytie(n, rnd);
      const ravnye = Array.from({ length: n }, () => 1 / n);
      return { poFormule: a.size / n, pryamo: P(ravnye, a) };
    },
  },
  {
    /* A ∪ Ā: каждый исход ровно в одном из двух — вместе n исходов. */
    kartochka: '4-protiv-omega',
    sluchay: (rnd) => {
      const p = opyt(rnd);
      const a = sobytie(p.length, rnd);
      const ne = new Set(p.map((_, i) => i).filter((i) => !a.has(i)));
      const obshchie = [...a].filter((i) => ne.has(i)).length;
      return { poFormule: 1, pryamo: P(p, new Set([...a, ...ne])) + obshchie };
    },
  },
  {
    /* A ⊂ B на опыте с неравными исходами: P(A) ≤ P(B) всегда. */
    kartochka: '4-vlozhenie',
    sluchay: (rnd) => {
      const p = opyt(rnd);
      const b = sobytie(p.length, rnd);
      const a = new Set([...b].filter(() => rnd() < 0.5));
      return { poFormule: 1, pryamo: P(p, a) <= P(p, b) + 1e-12 ? 1 : 0 };
    },
  },
  {
    kartochka: '4-protiv',
    sluchay: (rnd) => {
      const p = opyt(rnd);
      const a = sobytie(p.length, rnd);
      const ne = new Set(p.map((_, i) => i).filter((i) => !a.has(i)));
      return { poFormule: 1 - P(p, a), pryamo: P(p, ne) };
    },
  },
  {
    /* 2^n — против перебора всех последовательностей бросков. */
    kartochka: '4-monety',
    sluchay: (rnd) => {
      const n = 1 + Math.floor(rnd() * 10);
      return { poFormule: 2 ** n, pryamo: broski(n).length };
    },
  },
];

const KOLODA_4: Koloda = {
  task: 4,
  slug: '4',
  title: 'Вероятность: простая',
  teoriya: 'teoriya/',
  podtemy: [
    { id: 'vidy', title: 'Виды событий' },
    { id: 'svyaz', title: 'Независимые и совместные события' },
    { id: 'izobrazhenie', title: 'Как изображать события' },
    { id: 'klassicheskaya', title: 'Классическая вероятность' },
    { id: 'schet', title: 'Подсчёт исходов' },
    { id: 'kosti', title: 'Кости и монеты' },
  ],
  kartochki,
  proverki,
};

export default KOLODA_4;
