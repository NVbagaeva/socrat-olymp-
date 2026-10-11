import type { Metadata } from 'next';
import { Chertezh } from '@/components/tasks/planimetriya/Chertezh';
import { ChertezhShagi } from '@/components/tasks/planimetriya/ChertezhShagi';
import { StressTest } from '@/components/tasks/planimetriya/StressTest';
import { VariantyDemo } from '@/components/tasks/planimetriya/VariantyDemo';
import { ZhivoyChertezh } from '@/components/tasks/planimetriya/ZhivoyChertezh';
import { Tex } from '@/components/ui/Tex';
import { POROG } from '@/lib/planimetriya/figury';
import { PROTOTIPY, prototip } from '@/lib/planimetriya/stseny';
import type { Blok, Nabor, Params } from '@/lib/planimetriya/stseny/dsl';
import { okr, otr, pryam, pryamaya, ug } from '@/lib/planimetriya/stseny/dsl';
import type { Scena } from '@/lib/planimetriya/types';
import { ZHIVYE } from '@/lib/planimetriya/zhivye';
import 'katex/dist/katex.min.css';
import '@/lib/planimetriya/planimetriya.css';
import './planimetriya-1.css';

/* Служебная витрина движка планиметрических чертежей (задание №1).

   По чертежу на каждый прототип — на числах первой задачи открытого
   банка (или образца для прототипов не из банка), с пошаговыми
   подсказками; схематичный режим; числа на чертеже; генератор
   вариантов; полоса шириной с телефон; стресс-тест в браузере.
   В меню страницы нет, поисковикам она закрыта. */

export const metadata: Metadata = {
  title: 'Чертежи задания №1 — витрина движка',
  robots: { index: false, follow: false },
};

const BLOKI: Record<Blok, string> = {
  I: 'I. Углы в треугольнике',
  II: 'II. Четырёхугольники и точки пересечения',
  III: 'III. Площадь, теорема Пифагора',
  IV: 'IV. Подобие, средняя линия',
  V: 'V. Синус, косинус, тангенс острого угла',
  VI: 'VI. Центральные и вписанные углы, касательные',
  VII: 'VII. Вписанная окружность',
  VIII: 'VIII. Описанная окружность',
  IX: 'IX. Расширенная теорема синусов',
  X: 'X. Дополнительные прототипы (не из Блока 1)',
};

const p = (x: Nabor) => x as Params;

const RAD = Math.PI / 180;

/* Выноска: три угла по 12° у одной вершины — числам тесно, к дальнему
   ведёт короткий отрезок. */
const VYNOSKA: Scena = {
  tochki: {
    V: [0, 0],
    A: [10, 0],
    B: [10 * Math.cos(12 * RAD), 10 * Math.sin(12 * RAD)],
    C: [10 * Math.cos(24 * RAD), 10 * Math.sin(24 * RAD)],
    E: [10 * Math.cos(36 * RAD), 10 * Math.sin(36 * RAD)],
  },
  elementy: [
    otr('V', 'A'),
    otr('V', 'B'),
    otr('V', 'C'),
    otr('V', 'E'),
    ug('A', 'V', 'B', { vydelit: 'dano', znachenie: '12°' }),
    ug('B', 'V', 'C', { vydelit: 'dano', dugi: 2, znachenie: '12°' }),
    ug('C', 'V', 'E', { vydelit: 'dano', dugi: 3, znachenie: '12°' }),
  ],
};

/* Касательная в точке T: построение kasatelnayaV, прямой угол с радиусом. */
const KASATELNAYA: Scena = {
  tochki: {
    O: [0, 0],
    T: { naDuge: { okr: 'w', gradus: 60 } },
    K: { kasatelnayaV: { tochka: 'T', okr: 'w', dlina: 1.3 } },
    L: { kasatelnayaV: { tochka: 'T', okr: 'w', dlina: -1.3 } },
  },
  okruzhnosti: { w: { centr: 'O', radius: 4 } },
  elementy: [
    okr('w'),
    otr('O', 'T'),
    pryamaya('K', 'L', { zaA: 0.1, zaB: 0.1, vydelit: 'iskomoe' }),
    pryam('O', 'T', 'K'),
  ],
  podpisi: ['O', 'T'],
};

export default function PlanimetriyaShowcasePage() {
  const bloki = Object.keys(BLOKI) as Blok[];
  const shkema = [
    { id: 8, params: { a: 84 }, podpis: 'Острые углы 84° и 6°: угол 6° нарисован как 12°' },
    { id: 8, params: { a: 87 }, podpis: 'Острые углы 87° и 3°: тоже 12°, порядок точек прежний' },
    { id: 6, params: { f: 9 }, podpis: 'Угол между высотой и биссектрисой 9° → 12°' },
    { id: 9, params: { c: 104, d: 6 }, podpis: 'Угол CAD = 6° → 12°, угол C тупой' },
  ];
  return (
    <main className="pl1">
      <header className="pl1__head">
        <h1 className="t-h1">Чертежи задания №1</h1>
        <p className="pl1__lead">
          Витрина движка lib/planimetriya: {PROTOTIPY.length} прототипов (1–49 — Блок 1 открытого
          банка, дальше — дополнительные). Каждый чертёж построен из чисел условия; кнопками под
          рисунком — слои подсказки по шагам и решение учителя. Порог схематичного рисунка — {POROG}
          °. Те же рисунки в ч/б теме печати — на странице <a href="pechat/">pechat/</a>.
        </p>
        <nav className="pl1__toc" aria-label="Блоки">
          {bloki.map((b) => (
            <a key={b} href={`#blok-${b}`}>
              {BLOKI[b]}
            </a>
          ))}
          <a href="#shema">Схематичный режим</a>
          <a href="#chisla">Числа на чертеже</a>
          <a href="#varianty">Генератор вариантов</a>
          <a href="#telefon">Ширина телефона</a>
          <a href="#zhivye">Живые чертежи</a>
          <a href="#vynoska">Выноска и касательная в точке</a>
          <a href="#stress">Стресс-тест</a>
        </nav>
      </header>

      {bloki.map((b) => (
        <section className="pl1__section" id={`blok-${b}`} key={b}>
          <h2 className="t-h2">{BLOKI[b]}</h2>
          <div className="pl1__grid">
            {PROTOTIPY.filter((x) => x.blok === b).map((x) => {
              const params = p(x.primer);
              return (
                <figure className="pl1__card" key={x.id} id={`p${x.id}`}>
                  <figcaption>
                    <p className="pl1__title">
                      <b>{x.id}.</b> <Tex text={x.nazvanie} />
                    </p>
                    <p className="t-sm pl1__meta">
                      {x.fipi.length > 0
                        ? `Блок 1 ФИПИ, задачи ${x.fipi[0]}–${x.fipi[x.fipi.length - 1]}`
                        : 'Не из открытого банка'}
                    </p>
                    <Tex text={x.uslovie(params)} className="pl1__uslovie" />
                  </figcaption>
                  <ChertezhShagi
                    scena={x.stsena(params, POROG)}
                    optsii={{ alt: `Чертёж прототипа ${x.id}` }}
                  />
                </figure>
              );
            })}
          </div>
        </section>
      ))}

      <section className="pl1__section" id="shema">
        <h2 className="t-h2">Схематичный режим</h2>
        <p className="pl1__lead">
          Угол меньше порога ({POROG}°) рисуется порогом: фигура остаётся читаемой, порядок точек и
          топология — те же. Числа в условии не меняются.
        </p>
        <div className="pl1__grid">
          {shkema.map((s, i) => (
            <figure className="pl1__card" key={i}>
              <Chertezh
                scena={prototip(s.id).stsena(p({ ...prototip(s.id).primer, ...s.params }), POROG)}
              />
              <figcaption className="t-sm pl1__meta">{s.podpis}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="pl1__section" id="chisla">
        <h2 className="t-h2">Числа на чертеже</h2>
        <p className="pl1__lead">
          По умолчанию — как в ФИПИ, без чисел. С настройкой chisla: true подписываются только
          данные условия; искомое не подписывается никогда (кроме листа учителя).
        </p>
        <div className="pl1__grid">
          {[1, 14, 34, 45].map((id) => {
            const x = prototip(id);
            return (
              <figure className="pl1__card" key={id}>
                <Chertezh scena={x.stsena(p(x.primer), POROG)} optsii={{ chisla: true }} />
                <figcaption className="t-sm pl1__meta">Прототип {id}, chisla: true</figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <section className="pl1__section" id="varianty">
        <h2 className="t-h2">Генератор вариантов</h2>
        <p className="pl1__lead">
          Случайные числа, поворот, отражение и новые буквы — согласованно на рисунке и в тексте
          условия.
        </p>
        <VariantyDemo />
      </section>

      <section className="pl1__section" id="telefon">
        <h2 className="t-h2">Ширина телефона</h2>
        <div className="pl1__phones">
          {[5, 40, 45, 31].map((id) => {
            const x = prototip(id);
            return (
              <div className="pl1__phone" key={id}>
                <Tex text={x.uslovie(p(x.primer))} className="pl1__uslovie" />
                <Chertezh scena={x.stsena(p(x.primer), POROG)} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="pl1__section" id="zhivye">
        <h2 className="t-h2">Живые чертежи</h2>
        <p className="pl1__lead">
          Вершину можно тянуть мышью, пальцем или стрелками клавиатуры: фигура перерисовывается,
          величины под чертежом пересчитываются. Ограничения не дают фигуре выродиться; при печати —
          кадр в нынешнем положении.
        </p>
        <div className="pl1__grid">
          {ZHIVYE.map((z) => (
            <div className="pl1__card" key={z.id}>
              <p className="pl1__title">{z.nazvanie}</p>
              <ZhivoyChertezh id={z.id} />
            </div>
          ))}
        </div>
      </section>

      <section className="pl1__section" id="vynoska">
        <h2 className="t-h2">Выноска и касательная в точке</h2>
        <p className="pl1__lead">
          Если рядом с углом или точкой чистого места нет, подпись уходит дальше, и к ней ведёт
          короткий отрезок-выноска; он не пересекает другие подписи. Касательная в точке окружности
          строится перпендикулярно радиусу.
        </p>
        <div className="pl1__grid">
          <figure className="pl1__card">
            <Chertezh scena={VYNOSKA} optsii={{ chisla: true }} />
            <figcaption className="t-sm pl1__meta">Три угла по 12°: выноска к числу</figcaption>
          </figure>
          <figure className="pl1__card">
            <Chertezh scena={KASATELNAYA} />
            <figcaption className="t-sm pl1__meta">Касательная в точке T ⟂ OT</figcaption>
          </figure>
        </div>
      </section>

      <section className="pl1__section" id="stress">
        <h2 className="t-h2">Стресс-тест</h2>
        <p className="pl1__lead">
          Тот же тест, что pnpm test:planimetriya в CI: образцы всех прототипов во всех режимах и
          1000 случайных генераций — подписи не касаются линий и друг друга, фигуры не вырождены, на
          листе ученика нет подсказок и чисел, ответ не читается с рисунка.
        </p>
        <StressTest />
      </section>
    </main>
  );
}
