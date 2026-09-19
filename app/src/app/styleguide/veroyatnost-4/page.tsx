import type { Metadata } from 'next';
import {
  CircularRatio,
  CoordinateLine,
  HundredGrid,
  OutcomeGrid,
  OutcomeTiles,
  ProbabilityTree,
} from '@/components/probability';
import { ProblemCard } from '@/components/tasks/card';
import { METODY } from '@/lib/veroyatnost/model';
import { bank4Pool, bank5Pool, prep4Pool } from '@/lib/veroyatnost/pool';
import 'katex/dist/katex.min.css';
import '@/components/probability/probability.css';
import '@/components/tasks/card/problem-card.css';
import './veroyatnost-4.css';

/* Служебная витрина компонентов вероятности (раздел 04 референса).

   Каждый компонент показан на двух разных наборах параметров: это и
   есть проверка того, что рисунок собирается из параметров, а не
   нарисован под одну задачу. Страница в меню не входит и не
   индексируется. */

export const metadata: Metadata = {
  title: 'Компоненты вероятности — витрина',
  robots: { index: false, follow: false },
};

interface Pokaz {
  title: string;
  note: string;
  node: React.ReactNode;
}

interface Razdel {
  id: string;
  title: string;
  lead: string;
  metod: string;
  pokazy: [Pokaz, Pokaz];
}

/* ── Наборы параметров ──────────────────────────────────────────── */

const PIROZHKI = [
  ...Array.from({ length: 5 }, () => 'мясо'),
  ...Array.from({ length: 4 }, () => 'капуста'),
  ...Array.from({ length: 3 }, () => 'вишня'),
];

const BILETY = [
  ...Array.from({ length: 10 }, () => 'логарифмы'),
  ...Array.from({ length: 15 }, () => 'другая тема'),
];

/** Дерево двух пирожков: 0,8 с мясом на каждом шаге. */
const PIROZHKI_TREE = [
  { id: 'a', parent: null, label: 'с мясом', p: 0.8 },
  { id: 'b', parent: null, label: 'без мяса', p: 0.2 },
  { id: 'aa', parent: 'a', label: 'с мясом', p: 0.8 },
  { id: 'ab', parent: 'a', label: 'без мяса', p: 0.2 },
  { id: 'ba', parent: 'b', label: 'с мясом', p: 0.8 },
  { id: 'bb', parent: 'b', label: 'без мяса', p: 0.2 },
];

/** Дерево трёх выстрелов: попадание с вероятностью 0,7. */
const VYSTRELY = [
  { id: 'p', parent: null, label: 'попал', p: 0.7 },
  { id: 'm', parent: null, label: 'мимо', p: 0.3 },
  { id: 'pp', parent: 'p', label: 'попал', p: 0.7 },
  { id: 'pm', parent: 'p', label: 'мимо', p: 0.3 },
  { id: 'mp', parent: 'm', label: 'попал', p: 0.7 },
  { id: 'mm', parent: 'm', label: 'мимо', p: 0.3 },
];

const RAZDELY: Razdel[] = [
  {
    id: 'tiles',
    title: 'OutcomeTiles',
    metod: 'Метод 1 — прямой пересчёт исходов',
    lead: 'Одна плитка — один исход. Ученик видит n и m как количество плиток.',
    pokazy: [
      {
        title: '12 пирожков, благоприятны 3',
        note: 'outcomes — 12 подписей, favorable — три последних индекса, showCounts.',
        node: (
          <OutcomeTiles
            outcomes={PIROZHKI}
            favorable={[9, 10, 11]}
            showCounts
            groups={[
              { label: 'с мясом', count: 5 },
              { label: 'с капустой', count: 4 },
              { label: 'с вишней', count: 3 },
            ]}
          />
        ),
      },
      {
        title: '25 билетов, благоприятны 10',
        note: 'Другое n, другая ширина ряда: columns = 5. Тот же компонент.',
        node: (
          <OutcomeTiles
            outcomes={BILETY}
            favorable={Array.from({ length: 10 }, (_, i) => i)}
            columns={5}
            showCounts
          />
        ),
      },
    ],
  },
  {
    id: 'grid',
    title: 'OutcomeGrid',
    metod: 'Метод 2 — таблица исходов',
    lead: 'Строки — первый объект, столбцы — второй, клетка — пара. m считается по клеткам.',
    pokazy: [
      {
        title: 'Две кости, сумма 7',
        note: 'rows = columns = 6, в клетке сумма, благоприятны шесть клеток диагонали.',
        node: (
          <OutcomeGrid
            rows={6}
            columns={6}
            rowTitle="1-й кубик"
            columnTitle="2-й кубик"
            cellContent={(r, c) => String(r + c + 2)}
            favorableCells={[
              [0, 5],
              [1, 4],
              [2, 3],
              [3, 2],
              [4, 1],
              [5, 0],
            ]}
            showCounts
          />
        ),
      },
      {
        title: 'Две монеты, орёл не выпал ни разу',
        note: 'Тот же компонент при rows = columns = 2 и текстовых подписях.',
        node: (
          <OutcomeGrid
            rows={2}
            columns={2}
            rowLabels={['орёл', 'решка']}
            columnLabels={['орёл', 'решка']}
            rowTitle="1-й бросок"
            columnTitle="2-й бросок"
            cellContent={(r, c) =>
              r === 1 && c === 1 ? 'РР' : `${r === 0 ? 'О' : 'Р'}${c === 0 ? 'О' : 'Р'}`
            }
            favorableCells={[[1, 1]]}
            selectedCell={[1, 1]}
            showCounts
          />
        ),
      },
    ],
  },
  {
    id: 'line',
    title: 'CoordinateLine',
    metod: 'Метод 3 — координатная прямая, случай отрезка',
    lead: 'Два условия на разных уровнях: x > c — верхний, область вправо; x < d — нижний, область влево. Пересечение темнее за счёт прозрачности.',
    pokazy: [
      {
        title: 'Масса хлеба: [600; 1000], больше 700 и меньше 900',
        note: 'Обе границы строгие — кружки пустые. highlightMode = answer, showLength.',
        node: (
          <CoordinateLine min={600} max={1000} c={700} d={900} showLength highlightMode="answer" />
        ),
      },
      {
        title: 'Время ожидания: [0; 30], не меньше 10 минут',
        note: 'Правой границы нет вовсе — один уровень. Левая нестрогая, кружок закрашен.',
        node: (
          <CoordinateLine
            min={0}
            max={30}
            c={10}
            leftBoundary="inclusive"
            showLength
            unit="мин"
            highlightMode="answer"
          />
        ),
      },
    ],
  },
  {
    id: 'circle',
    title: 'CircularRatio',
    metod: 'Метод 3 — те же отношения мер, но дуга и площадь',
    lead: 'Круг вместо отрезка: мера — длина дуги или площадь. CoordinateLine при этом не меняется.',
    pokazy: [
      {
        title: 'Часы: стрелка прошла 10, но не дошла до 1',
        note: 'mode = arc, divisions = 12, дуга перехлёстывает через ноль.',
        node: <CircularRatio mode="arc" divisions={12} from={10} to={1} showLength />,
      },
      {
        title: 'Озеро радиусом 5 м, домик диаметром 1 м',
        note: 'mode = area. Радиус внутренней фигуры считается по площади, поэтому доля на глаз не врёт.',
        node: (
          <CircularRatio
            mode="area"
            total={Math.PI * 25}
            favorable={Math.PI * 0.25}
            unit="м²"
            showLength
          />
        ),
      },
    ],
  },
  {
    id: 'tree',
    title: 'ProbabilityTree',
    metod: 'Метод 4 — дерево вероятностей',
    lead: 'Сверху вниз: одно испытание — один уровень. Подходящие пути усилены, остальные приглушены.',
    pokazy: [
      {
        title: 'Два пирожка, оба с мясом',
        note: 'Подходит один путь. Под листьями — произведения, под деревом — сумма.',
        node: (
          <ProbabilityTree
            levels={['1-й пирожок', '2-й пирожок']}
            branches={PIROZHKI_TREE}
            highlightedPaths={['aa']}
            showProducts
            showSum
          />
        ),
      },
      {
        title: 'Два выстрела, попал хотя бы раз',
        note: 'Те же уровни, но подходят три пути из четырёх — сумма складывается из трёх слагаемых.',
        node: (
          <ProbabilityTree
            levels={['1-й выстрел', '2-й выстрел']}
            branches={VYSTRELY}
            highlightedPaths={['pp', 'pm', 'mp']}
            showProducts
            showSum
          />
        ),
      },
    ],
  },
  {
    id: 'hundred',
    title: 'HundredGrid',
    metod: 'Метод 5 — условная вероятность (приём удобного числа)',
    lead: 'Берём 100 объектов и раскладываем сеткой 10×10: проценты становятся клетками.',
    pokazy: [
      {
        title: 'Чайники: больше года 0,93, больше двух лет 0,87',
        note: 'Три группы, искомая — средняя. showConversion переводит долю в штуки.',
        node: (
          <HundredGrid
            groups={[
              { label: 'больше двух лет', share: 0.87, tone: 'strong' },
              { label: 'от года до двух', share: 0.06, tone: 'mid' },
              { label: 'меньше года', share: 0.07, tone: 'soft' },
            ]}
            highlightedGroup={1}
            showConversion
            unit="чайников"
          />
        ),
      },
      {
        title: 'Брак 3 %: годных 97',
        note: 'Две группы и другое удобное число — 1000. Сетка та же, в клетке десять объектов.',
        node: (
          <HundredGrid
            baseNumber={1000}
            groups={[
              { label: 'годные', share: 0.97, tone: 'mid' },
              { label: 'с браком', share: 0.03, tone: 'soft' },
            ]}
            highlightedGroup={1}
            showConversion
            unit="штук"
          />
        ),
      },
    ],
  },
];

/* ── Задание №5: обрезанное дерево, дроби на ветках, сетка 10 000 ── */

/** Три лампы, «хотя бы одна целая»: до конца раскрыт только путь «все перегорели». */
const LAMPY = [
  { id: 'b', parent: null, label: 'перегорела', p: 0.8 },
  { id: 'c', parent: null, label: 'целая', p: 0.2 },
  { id: 'bb', parent: 'b', label: 'перегорела', p: 0.8 },
  { id: 'bc', parent: 'b', label: 'целая', p: 0.2 },
  { id: 'bbb', parent: 'bb', label: 'перегорела', p: 0.8 },
  { id: 'bbc', parent: 'bb', label: 'целая', p: 0.2 },
];

/** Два фломастера без возвращения: вероятности подписаны дробями. */
const FLOMASTERY = [
  { id: 's', parent: null, label: 'синий', p: 11 / 25, pLabel: '11/25' },
  { id: 'k', parent: null, label: 'красный', p: 6 / 25, pLabel: '6/25' },
  { id: 'z', parent: null, label: 'зелёный', p: 8 / 25, pLabel: '8/25' },
  { id: 'ss', parent: 's', label: 'синий', p: 10 / 24, pLabel: '10/24' },
  { id: 'sk', parent: 's', label: 'красный', p: 6 / 24, pLabel: '6/24' },
  { id: 'sz', parent: 's', label: 'зелёный', p: 8 / 24, pLabel: '8/24' },
  { id: 'ks', parent: 'k', label: 'синий', p: 11 / 24, pLabel: '11/24' },
  { id: 'kk', parent: 'k', label: 'красный', p: 5 / 24, pLabel: '5/24' },
  { id: 'kz', parent: 'k', label: 'зелёный', p: 8 / 24, pLabel: '8/24' },
];

const RAZDELY_5: Razdel[] = [
  {
    id: 'tree-5',
    title: 'ProbabilityTree — задание №5',
    metod: 'Метод 4 — ветви разной глубины и дроби на ветках',
    lead: 'Дерево может обрываться листьями там, где событие уже решено, а вероятность ветки — быть дробью, если десятичная запись некрасива.',
    pokazy: [
      {
        title: 'Три лампы, хотя бы одна целая',
        note: 'Раскрыт только путь «все перегорели»; листья «целая» на каждом уровне подсвечены, их сумма — ответ. Произведение стоит под своим листом.',
        node: (
          <ProbabilityTree
            levels={['1-я лампа', '2-я лампа', '3-я лампа']}
            branches={LAMPY}
            highlightedPaths={['c', 'bc', 'bbc']}
            showProducts
            showSum
          />
        ),
      },
      {
        title: 'Два фломастера без возвращения',
        note: 'pLabel — «11/25» вместо 0,44. Ветка «зелёный» к ответу не ведёт и остаётся листом; бесконечные произведения под приглушёнными листьями идут со знаком ≈.',
        node: (
          <ProbabilityTree
            levels={['1-й фломастер', '2-й фломастер']}
            branches={FLOMASTERY}
            highlightedPaths={['sk', 'ks']}
            showProducts
            showSum
          />
        ),
      },
    ],
  },
  {
    id: 'hundred-5',
    title: 'HundredGrid и OutcomeGrid — задание №5',
    metod: 'Методы 5 и 2 — удобное число 10 000 и таблица 5×5',
    lead: 'Полная вероятность: искомых групп несколько, их штуки складываются. Условная вероятность через таблицу: условие убирает одну грань у каждой кости.',
    pokazy: [
      {
        title: 'Батарейки: 10 000 штук, забракованы две группы',
        note: 'baseNumber = 10000, в клетке сто объектов; highlightedGroups = [0, 1], строка перевода складывает штуки.',
        node: (
          <HundredGrid
            baseNumber={10000}
            groups={[
              { label: 'неисправные, забракованы', share: 0.0096, tone: 'strong' },
              { label: 'исправные, забракованы по ошибке', share: 0.0594, tone: 'strong' },
              { label: 'неисправные, пропущены', share: 0.0004, tone: 'soft' },
              { label: 'исправные, прошли контроль', share: 0.9306, tone: 'soft' },
            ]}
            highlightedGroups={[0, 1]}
            showConversion
            unit="батареек"
          />
        ),
      },
      {
        title: 'Две кости без шестёрки, сумма 8',
        note: 'rows = columns = 5, подписи граней 1–5, в клетке сумма; благоприятны три клетки.',
        node: (
          <OutcomeGrid
            rows={5}
            columns={5}
            rowLabels={['1', '2', '3', '4', '5']}
            columnLabels={['1', '2', '3', '4', '5']}
            rowTitle="1-й бросок"
            columnTitle="2-й бросок"
            cellContent={(r, c) => String(r + c + 2)}
            favorableCells={[
              [2, 4],
              [3, 3],
              [4, 2],
            ]}
            showCounts
          />
        ),
      },
    ],
  },
];

/* ── Карточка задачи: три варианта ──────────────────────────────── */

const PREP = prep4Pool().flatMap((blok) => blok.zadachi);
const BANK = bank4Pool();
const BANK5 = bank5Pool();

function zadachaPrep(id: string) {
  const est = PREP.find((z) => z.id === id);
  if (est === undefined) {
    throw new Error(`Нет подготовительной задачи ${id}`);
  }
  return est;
}

function variantBanka(id: string, n: number, bank = BANK) {
  const kind = bank.kinds.find((k) => k.id === id);
  const variant = kind?.variants.find((v) => v.n === n);
  if (kind === undefined || variant === undefined) {
    throw new Error(`Нет варианта ${id}-${n}`);
  }
  return { ...variant, id: `${id}-${n}` };
}

/** Карточки задания №5: без рисунка, с широким деревом, с сеткой 10 000. */
const KARTOCHKI_5 = [
  {
    title: 'Метод «Формула»: рисунка нет',
    note: 'p5-01, вариант 1. Колонки под рисунок нет — условие и решение делят ширину пополам.',
    zadacha: variantBanka('p5-01', 1, BANK5),
    initial: { state: 'revealed' as const, shagov: 3 },
  },
  {
    title: 'Широкое дерево: рисунок под условием и решением',
    note: 'p5-10, вариант 1. У дерева больше четырёх листьев — в узкой колонке его не прочесть, карточка отдаёт ему всю ширину.',
    zadacha: variantBanka('p5-10', 1, BANK5),
    initial: { state: 'revealed' as const, shagov: 3 },
  },
  {
    title: 'Полная вероятность: сетка 10 000, две искомые группы',
    note: 'p5-11, вариант 1. Подпись над рисунком складывает штуки искомых групп.',
    zadacha: variantBanka('p5-11', 1, BANK5),
    initial: { state: 'revealed' as const, shagov: 4 },
  },
] as const;

function metodLabel(method: string | undefined): string | undefined {
  return METODY.find((m) => m.id === method)?.nazvanie;
}

const KARTOCHKI = [
  {
    title: 'Полная: условие · визуализация · решение',
    note: 'k4-01, решение раскрыто целиком, рисунок в режиме ответа. Так карточка выглядит после «Показать решение».',
    zadacha: zadachaPrep('k4-01'),
    initial: { state: 'revealed' as const, shagov: 4 },
  },
  {
    title: 'Решение раскрывается по шагам',
    note: 'p4-18, вариант 4: показаны два шага из трёх, кнопка ведёт к третьему, потом к ответу.',
    zadacha: variantBanka('p4-18', 4),
    initial: { state: 'revealed' as const, shagov: 2 },
  },
  {
    title: 'variant="condition" — только условие',
    note: 'k4-16: ни рисунка, ни решения, ни поля ответа. Для режима «Узнай метод».',
    zadacha: zadachaPrep('k4-16'),
    initial: undefined,
  },
] as const;

export default function Page() {
  return (
    <main className="v4">
      <h1>Компоненты вероятности</h1>
      <p className="v4__lead">
        Шесть рисунков к пяти методам решения задания №4; задание №5 использует те же рисунки и
        шестой метод «Формула» без рисунка. Каждый компонент показан на двух наборах параметров:
        рисунок собирается из параметров, а не нарисован под конкретную задачу. Ни одного значения
        цвета и кегля в компонентах нет — только токены проекта.
      </p>
      <p className="v4__lead">
        Подсветка благоприятного здесь включена у всех, чтобы было видно оформление. В самой
        карточке задачи она появляется только вместе с решением: до ответа эти параметры не
        передаются, иначе ответ оказался бы в разметке страницы.
      </p>

      <section className="v4__section">
        <h2 className="v4__title">ProblemCard</h2>
        <p className="v4__metod">Раздел 05 — карточка задачи</p>
        <p className="v4__lead">
          Общий компонент: условие, место под иллюстрацию, рисунок по модели задачи и решение по
          шагам. Данные — те же, что уезжают в тренажёр: отпечаток ответа и закрытый разбор. Здесь
          разбор открыт сразу, чтобы было видно оформление; в тренажёре он открывается только по
          действию ученика.
        </p>
        <div className="v4__stack">
          {KARTOCHKI.map((k, i) => (
            <figure key={i} className="v4__case">
              <figcaption className="v4__case-head">
                <b>{k.title}</b>
                <span>{k.note}</span>
              </figcaption>
              <ProblemCard
                variant={i === 2 ? 'condition' : 'full'}
                zadacha={k.zadacha}
                {...(i === 2 ? {} : { metodLabel: metodLabel(k.zadacha.model?.method) })}
                istochnik={k.zadacha.id.startsWith('k') ? 'Задача конспекта' : 'Прототип задания 4'}
                {...(k.initial === undefined ? {} : { initial: k.initial })}
              />
            </figure>
          ))}
        </div>
      </section>

      {[...RAZDELY, ...RAZDELY_5].map((razdel) => (
        <section key={razdel.id} className="v4__section">
          <h2 className="v4__title">{razdel.title}</h2>
          <p className="v4__metod">{razdel.metod}</p>
          <p className="v4__lead">{razdel.lead}</p>
          <div className="v4__pair">
            {razdel.pokazy.map((pokaz, i) => (
              <figure key={i} className="v4__case">
                <figcaption className="v4__case-head">
                  <b>{pokaz.title}</b>
                  <span>{pokaz.note}</span>
                </figcaption>
                <div className="v4__frame">{pokaz.node}</div>
              </figure>
            ))}
          </div>
        </section>
      ))}

      <section className="v4__section">
        <h2 className="v4__title">ProblemCard — задание №5</h2>
        <p className="v4__metod">Раздел 05 на задачах задания №5</p>
        <p className="v4__lead">
          Та же карточка на данных задания №5: метод «Формула» без рисунка, широкое дерево на всю
          ширину карточки и сетка удобного числа 10 000 с двумя искомыми группами.
        </p>
        <div className="v4__stack">
          {KARTOCHKI_5.map((k, i) => (
            <figure key={i} className="v4__case">
              <figcaption className="v4__case-head">
                <b>{k.title}</b>
                <span>{k.note}</span>
              </figcaption>
              <ProblemCard
                zadacha={k.zadacha}
                {...(metodLabel(k.zadacha.model?.method) === undefined
                  ? {}
                  : { metodLabel: metodLabel(k.zadacha.model?.method) })}
                istochnik="Прототип задания 5"
                initial={k.initial}
              />
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
