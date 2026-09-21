import Image from 'next/image';
import { NavIcon } from '@/components/ui';
import { CoordinateLine } from '@/components/probability';
import { PRYAMAYA } from '@/content/veroyatnost-teoriya';
import { HintIcon } from '../../prep/PrepIcons';
import { Tex } from '../Tex';
import { Vykladka } from './Vykladka';

/**
 * Раздел теории «Координатная прямая» задания №5 — по утверждённому
 * макету. Переехал из теории №4: здесь разбираются два
 * события-промежутка и их вложенность, а это метод 3 задания №5.
 * Случайная точка на отрезке осталась в №4 — там другой приём.
 *
 * Разбор идёт двумя случаями: когда один промежуток лежит внутри
 * другого и вычесть можно, и когда они пересекаются и напрямую
 * вычитать нельзя. У каждого случая одна и та же раскладка:
 * слева условие с картинкой, в середине схема, справа решение.
 *
 * Все схемы рисует CoordinateLine из тренажёра — той же прямой
 * ученик пользуется в подходе, и второй её здесь не заводится.
 * Тексты и формулы приходят из content/veroyatnost-teoriya —
 * общего файла вкладки: в разметке строк нет, формулы набираются
 * KaTeX на сборке.
 */

/** Ось в теории названа заглавной X — так на макете и в условиях. */
const OS = 'X';

/**
 * Метка случая: кружок без цифры перед заголовком.
 *
 * Номер в кружке на вкладке значит только номер раздела темы, и
 * второго такого числа на странице быть не должно. Случаи здесь
 * называют себя заголовками — «когда можно вычесть» и «когда
 * нельзя», — порядковый номер им ничего не добавлял.
 */
function Metka() {
  return <span className="vteor-sluchay__metka" aria-hidden="true" />;
}

/**
 * Шапка случая — по макету: слева картинка на круглой подложке,
 * справа заголовок с точкой, условие и вопрос. Без картинки текст
 * занимает всю ширину, подложка не рисуется. На узкой карточке
 * картинка стоит сверху по центру, текст под ней.
 */
function Shapka({
  kartinka,
  zagolovok,
  uslovie,
  vopros,
}: {
  kartinka?: { src: string; width: number; height: number; alt: string };
  zagolovok: string;
  uslovie: string;
  vopros: string;
}) {
  return (
    <header className="vteor-sluchay__head">
      {kartinka !== undefined ? (
        <div className="vteor-sluchay__figura">
          <Image
            className="vteor-sluchay__kartinka"
            src={kartinka.src}
            alt={kartinka.alt}
            width={kartinka.width}
            height={kartinka.height}
          />
        </div>
      ) : null}
      <div className="vteor-sluchay__text">
        <h4 className="vteor-sluchay__title">
          <Metka />
          {zagolovok}
        </h4>
        <p className="vteor-sluchay__uslovie">{uslovie}</p>
        <p className="vteor-sluchay__vopros">{vopros}</p>
      </div>
    </header>
  );
}

/**
 * Плашка «важно» под чертежом: оранжевый кружок со знаком,
 * разделительная черта и текст — как на макете.
 */
function Vazhno({ children }: { children: string }) {
  return (
    <p className="vteor-vazhno">
      <span className="vteor-vazhno__znak" aria-hidden="true">
        !
      </span>
      <span className="vteor-vazhno__text">{children}</span>
    </p>
  );
}

export function KoordinatnayaPryamaya() {
  const { lead, ideya, pervaya, vtoraya, vyvod, algoritm, syuzhety } = PRYAMAYA;

  return (
    <>
      <p className="vteor-blok__lead">{lead}</p>

      {/* ── Главная идея ─────────────────────────────────────────── */}

      <section className="vteor-ideya">
        <span className="vteor-ideya__znak" aria-hidden="true">
          <HintIcon />
        </span>
        <div className="vteor-ideya__text">
          <h4 className="vteor-ideya__title">{ideya.title}</h4>
          <p>{ideya.text}</p>
        </div>
        {/* Отрезок без чисел: показывает саму мысль, а не задачу.
            Концы закрашены: это отрезок с длиной, а не интервал. */}
        <CoordinateLine
          className="vteor-ideya__shema"
          min={0}
          max={10}
          c={3}
          d={7}
          leftBoundary="inclusive"
          rightBoundary="inclusive"
          highlightMode="segment"
          axisLabel="x"
          ticks={[
            { value: 0, label: '0' },
            { value: 7, label: 'x' },
          ]}
          alt="Отрезок на координатной прямой: от нуля до x выделен нужный кусок"
        />
        <p className="vteor-ideya__plashka">{ideya.plashka}</p>
      </section>

      {/* ── Случай 1: один промежуток внутри другого ─────────────── */}

      <article className="vteor-sluchay">
        <Shapka
          kartinka={pervaya.kartinka}
          zagolovok={pervaya.zagolovok}
          uslovie={pervaya.uslovie}
          vopros={pervaya.vopros}
        />

        <div className="vteor-sluchay__shema">
          {/* Оба условия со знаком «больше»: области смотрят вправо,
              и одна целиком лежит в другой — это и видно на рисунке.
              Рисунок компактный, по центру плашки; подписи считаются
              от его ширины (контейнер vteor-shema).

              Искомый промежуток — то, что осталось от «X > 1» после
              вычитания «X > 2»: точка 2 в него входит, точка 1 нет.
              Поэтому левый кружок пустой, правый закрашенный — как в
              скобе «1 < X ≤ 2» и в выкладке. */}
          <div className="vteor-sluchay__risunok vteor-shema">
            <CoordinateLine
              min={0}
              max={3}
              c={1}
              d={2}
              leftBoundary="strict"
              rightBoundary="inclusive"
              upper={{ value: 1, side: 'right', note: '0,96', boundary: 'strict' }}
              lower={{ value: 2, side: 'right', note: '0,85', boundary: 'strict' }}
              axisLabel={OS}
              ticks={[0, 1, 2]}
              brace={{ from: 1, to: 2, label: `1 < ${OS} ≤ 2` }}
              alt="Координатная прямая: область X больше единицы целиком содержит область X больше двух"
            />
          </div>
          <Vazhno>{pervaya.podskazka}</Vazhno>
        </div>

        <div className="vteor-reshenie">
          <h5 className="vteor-reshenie__title">{pervaya.reshenie.title}</h5>
          <p className="vteor-reshenie__text">
            <Tex text={pervaya.reshenie.text} />
          </p>
          <Vykladka stroki={pervaya.reshenie.stroki} />
          <p className="vteor-reshenie__otvet">{pervaya.reshenie.otvet}</p>
        </div>
      </article>

      {/* ── Случай 2: промежутки пересекаются ────────────────────── */}

      <article className="vteor-sluchay">
        <Shapka
          kartinka={vtoraya.kartinka}
          zagolovok={vtoraya.zagolovok}
          uslovie={vtoraya.uslovie}
          vopros={vtoraya.vopros}
        />

        <div className="vteor-sluchay__shema">
          {/* Условия разных знаков: области идут навстречу и
              накладываются, но ни одна не лежит в другой. Искомый
              промежуток «1 < X < 2» — обе границы строгие, оба
              кружка пустые. */}
          <div className="vteor-sluchay__risunok vteor-shema">
            <CoordinateLine
              min={0}
              max={3}
              c={1}
              d={2}
              leftBoundary="strict"
              rightBoundary="strict"
              upper={{ value: 2, side: 'left', note: '0,85', boundary: 'strict' }}
              lower={{ value: 1, side: 'right', note: '0,95', boundary: 'strict' }}
              axisLabel={OS}
              ticks={[0, 1, 2]}
              brace={{ from: 1, to: 2, label: `1 < ${OS} < 2` }}
              alt="Координатная прямая: области X меньше двух и X больше единицы пересекаются"
            />
          </div>
        </div>

        <div className="vteor-reshenie">
          <h5 className="vteor-reshenie__title">{vtoraya.pochemu.title}</h5>
          <p className="vteor-reshenie__text">
            <Tex text={vtoraya.pochemu.text} />
          </p>
          <Vazhno>{vtoraya.pochemu.preduprezhdenie}</Vazhno>
        </div>

        {/* Разбор через противоположное событие — во всю ширину
            карточки: шаги идут подряд и делят её на три. */}
        <section className="vteor-protivopolozhnoe">
          <h5 className="vteor-protivopolozhnoe__title">{vtoraya.protivopolozhnoe.title}</h5>
          <ol className="vteor-protivopolozhnoe__shagi">
            {vtoraya.protivopolozhnoe.shagi.map((shag, i) => (
              <li key={shag.text} className="vteor-shag">
                <span className="vteor-shag__nomer" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="vteor-shag__telo">
                  <p className="vteor-shag__text">
                    <Tex text={shag.text} />
                  </p>
                  <Vykladka stroki={shag.stroki} />
                </div>
              </li>
            ))}
            <li className="vteor-shag">
              <span className="vteor-shag__nomer" aria-hidden="true">
                {vtoraya.protivopolozhnoe.shagi.length + 1}
              </span>
              <div className="vteor-shag__telo">
                <p className="vteor-shag__text">{vtoraya.protivopolozhnoe.otvet.podpis}</p>
                <p className="vteor-shag__znachenie">{vtoraya.protivopolozhnoe.otvet.znachenie}</p>
              </div>
            </li>
          </ol>
        </section>
      </article>

      {/* ── Три карточки итога ───────────────────────────────────── */}

      <div className="vteor-itogi">
        <section className="vteor-itog">
          <h4 className="vteor-itog__title">
            <span className="vteor-itog__znak" aria-hidden="true">
              <NavIcon name="notes" />
            </span>
            {vyvod.title}
          </h4>
          <p>{vyvod.text}</p>
        </section>

        <section className="vteor-itog">
          <h4 className="vteor-itog__title">
            <span className="vteor-itog__znak" aria-hidden="true">
              <NavIcon name="assignments" />
            </span>
            {algoritm.title}
          </h4>
          <ol className="vteor-itog__shagi">
            {algoritm.shagi.map((shag, i) => (
              <li key={shag}>
                <span className="vteor-shag__nomer" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{shag}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="vteor-itog vteor-itog--syuzhety">
          <h4 className="vteor-itog__title">
            <span className="vteor-itog__znak" aria-hidden="true">
              <HintIcon />
            </span>
            {syuzhety.title}
          </h4>
          <ul className="vteor-itog__punkty">
            {syuzhety.punkty.map((punkt) => (
              <li key={punkt}>{punkt}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
