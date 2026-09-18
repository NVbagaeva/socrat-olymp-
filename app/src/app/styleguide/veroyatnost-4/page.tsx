import type { Metadata } from 'next';
import {
  CircularRatio,
  CoordinateLine,
  HundredGrid,
  OutcomeGrid,
  OutcomeTiles,
  ProbabilityTree,
} from '@/components/probability';
import '@/components/probability/probability.css';
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
    metod: 'Метод 5 — удобное число',
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

export default function Page() {
  return (
    <main className="v4">
      <h1>Компоненты вероятности</h1>
      <p className="v4__lead">
        Шесть рисунков к пяти методам решения задания №4. Каждый показан на двух наборах параметров:
        рисунок собирается из параметров, а не нарисован под конкретную задачу. Ни одного значения
        цвета и кегля в компонентах нет — только токены проекта.
      </p>
      <p className="v4__lead">
        Подсветка благоприятного здесь включена у всех, чтобы было видно оформление. В самой
        карточке задачи она появляется только вместе с решением: до ответа эти параметры не
        передаются, иначе ответ оказался бы в разметке страницы.
      </p>

      {RAZDELY.map((razdel) => (
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
    </main>
  );
}
