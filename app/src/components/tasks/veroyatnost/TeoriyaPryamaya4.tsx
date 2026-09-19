import Image from 'next/image';
import { AlertIcon, NavIcon } from '@/components/ui';
import { CoordinateLine } from '@/components/probability';
import { PRYAMAYA_4 } from '@/content/veroyatnost-teoriya-4';
import { HintIcon } from '../prep/PrepIcons';
import { Tex } from './Tex';

/**
 * Раздел теории «03. Координатная прямая» задания №4 — по
 * утверждённому макету.
 *
 * Разбор идёт двумя случаями: когда один промежуток лежит внутри
 * другого и вычесть можно, и когда они пересекаются и напрямую
 * вычитать нельзя. У каждого случая одна и та же раскладка:
 * слева условие с картинкой, в середине схема, справа решение.
 *
 * Все схемы рисует CoordinateLine из тренажёра — той же прямой
 * ученик пользуется в подходе, и второй её здесь не заводится.
 * Тексты и формулы приходят из content/veroyatnost-teoriya-4:
 * в разметке строк нет, формулы набираются KaTeX на сборке.
 */

/** Ось в теории названа заглавной X — так на макете и в условиях. */
const OS = 'X';

/** Кружок с номером случая. */
function Nomer({ children }: { children: number }) {
  return <span className="z4-sluchay__nomer">{children}</span>;
}

/** Условие случая: картинка, данные и вопрос. */
function Uslovie({
  kartinka,
  uslovie,
  vopros,
}: {
  kartinka: { src: string; width: number; height: number; alt: string };
  uslovie: string;
  vopros: string;
}) {
  return (
    <div className="z4-sluchay__uslovie">
      <Image
        className="z4-sluchay__kartinka"
        src={kartinka.src}
        alt={kartinka.alt}
        width={kartinka.width}
        height={kartinka.height}
      />
      <div className="z4-sluchay__text">
        <p>{uslovie}</p>
        <p className="z4-sluchay__vopros">{vopros}</p>
      </div>
    </div>
  );
}

export function TeoriyaPryamaya4() {
  const { nomer, title, lead, ideya, pervaya, vtoraya, vyvod, algoritm, syuzhety } = PRYAMAYA_4;

  return (
    <div className="z4-teoriya-razdel">
      <h2 className="z4-teoriya__h2">
        <span className="z4-teoriya__nomer">{nomer}.</span> {title}
      </h2>
      <p className="z4-teoriya__lead">{lead}</p>

      {/* ── Главная идея ─────────────────────────────────────────── */}

      <section className="z4-ideya">
        <span className="z4-ideya__znak" aria-hidden="true">
          <HintIcon />
        </span>
        <div className="z4-ideya__text">
          <h3 className="z4-ideya__title">{ideya.title}</h3>
          <p>{ideya.text}</p>
        </div>
        {/* Отрезок без чисел: показывает саму мысль, а не задачу. */}
        <CoordinateLine
          className="z4-ideya__shema"
          min={0}
          max={10}
          c={3}
          d={7}
          highlightMode="segment"
          axisLabel="x"
          ticks={[
            { value: 0, label: '0' },
            { value: 7, label: 'x' },
          ]}
          alt="Отрезок на координатной прямой: от нуля до x выделен нужный кусок"
        />
        <p className="z4-ideya__plashka">{ideya.plashka}</p>
      </section>

      {/* ── Случай 1: один промежуток внутри другого ─────────────── */}

      <article className="z4-sluchay">
        <header className="z4-sluchay__head">
          <Nomer>{pervaya.nomer}</Nomer>
          <h3 className="z4-sluchay__title">{pervaya.zagolovok}</h3>
        </header>

        <Uslovie kartinka={pervaya.kartinka} uslovie={pervaya.uslovie} vopros={pervaya.vopros} />

        <div className="z4-sluchay__shema">
          {/* Оба условия со знаком «больше»: области смотрят вправо,
              и одна целиком лежит в другой — это и видно на рисунке. */}
          <CoordinateLine
            min={0}
            max={3}
            c={1}
            d={2}
            upper={{ value: 1, side: 'right', note: '0,96' }}
            lower={{ value: 2, side: 'right', note: '0,85' }}
            axisLabel={OS}
            ticks={[0, 1, 2]}
            brace={{ from: 1, to: 2, label: `1 < ${OS} ≤ 2` }}
            alt="Координатная прямая: область X больше единицы целиком содержит область X больше двух"
          />
          <p className="z4-sluchay__podskazka">
            <span className="z4-sluchay__znak" aria-hidden="true">
              <AlertIcon />
            </span>
            {pervaya.podskazka}
          </p>
        </div>

        <div className="z4-reshenie">
          <h4 className="z4-reshenie__title">{pervaya.reshenie.title}</h4>
          <p className="z4-reshenie__text">
            <Tex text={pervaya.reshenie.text} />
          </p>
          {pervaya.reshenie.shagi.map((formula) => (
            <p key={formula} className="z4-reshenie__formula">
              <Tex text={`$${formula}$`} />
            </p>
          ))}
          <p className="z4-reshenie__otvet">{pervaya.reshenie.otvet}</p>
        </div>
      </article>

      {/* ── Случай 2: промежутки пересекаются ────────────────────── */}

      <article className="z4-sluchay">
        <header className="z4-sluchay__head">
          <Nomer>{vtoraya.nomer}</Nomer>
          <h3 className="z4-sluchay__title">{vtoraya.zagolovok}</h3>
        </header>

        <Uslovie kartinka={vtoraya.kartinka} uslovie={vtoraya.uslovie} vopros={vtoraya.vopros} />

        <div className="z4-sluchay__shema">
          {/* Условия разных знаков: области идут навстречу и
              накладываются, но ни одна не лежит в другой. */}
          <CoordinateLine
            min={0}
            max={3}
            c={1}
            d={2}
            upper={{ value: 2, side: 'left', note: '0,85' }}
            lower={{ value: 1, side: 'right', note: '0,95' }}
            axisLabel={OS}
            ticks={[0, 1, 2]}
            brace={{ from: 1, to: 2, label: `1 < ${OS} < 2` }}
            alt="Координатная прямая: области X меньше двух и X больше единицы пересекаются"
          />
        </div>

        <div className="z4-reshenie z4-reshenie--pochemu">
          <h4 className="z4-reshenie__title">{vtoraya.pochemu.title}</h4>
          <p className="z4-reshenie__text">
            <Tex text={vtoraya.pochemu.text} />
          </p>
          <p className="z4-reshenie__preduprezhdenie">
            <span className="z4-sluchay__znak" aria-hidden="true">
              <AlertIcon />
            </span>
            {vtoraya.pochemu.preduprezhdenie}
          </p>
        </div>

        {/* Разбор через противоположное событие — во всю ширину
            карточки: шаги идут подряд и делят её на три. */}
        <section className="z4-protivopolozhnoe">
          <h4 className="z4-protivopolozhnoe__title">{vtoraya.protivopolozhnoe.title}</h4>
          <ol className="z4-protivopolozhnoe__shagi">
            {vtoraya.protivopolozhnoe.shagi.map((shag, i) => (
              <li key={shag.text} className="z4-shag">
                <span className="z4-shag__nomer" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="z4-shag__telo">
                  <p className="z4-shag__text">
                    <Tex text={shag.text} />
                  </p>
                  {shag.formuly.map((formula) => (
                    <p key={formula} className="z4-reshenie__formula">
                      <Tex text={`$${formula}$`} />
                    </p>
                  ))}
                </div>
              </li>
            ))}
            <li className="z4-shag z4-shag--otvet">
              <span className="z4-shag__nomer" aria-hidden="true">
                {vtoraya.protivopolozhnoe.shagi.length + 1}
              </span>
              <div className="z4-shag__telo">
                <p className="z4-shag__text">{vtoraya.protivopolozhnoe.otvet.podpis}</p>
                <p className="z4-shag__znachenie">{vtoraya.protivopolozhnoe.otvet.znachenie}</p>
              </div>
            </li>
          </ol>
        </section>
      </article>

      {/* ── Три карточки итога ───────────────────────────────────── */}

      <div className="z4-teoriya__itogi">
        <section className="z4-itog">
          <h3 className="z4-itog__title">
            <span className="z4-itog__znak" aria-hidden="true">
              <NavIcon name="notes" />
            </span>
            {vyvod.title}
          </h3>
          <p>{vyvod.text}</p>
        </section>

        <section className="z4-itog">
          <h3 className="z4-itog__title">
            <span className="z4-itog__znak" aria-hidden="true">
              <NavIcon name="assignments" />
            </span>
            {algoritm.title}
          </h3>
          <ol className="z4-itog__shagi">
            {algoritm.shagi.map((shag, i) => (
              <li key={shag}>
                <span className="z4-shag__nomer" aria-hidden="true">
                  {i + 1}
                </span>
                <span>{shag}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="z4-itog z4-itog--syuzhety">
          <h3 className="z4-itog__title">
            <span className="z4-itog__znak" aria-hidden="true">
              <HintIcon />
            </span>
            {syuzhety.title}
          </h3>
          <ul className="z4-itog__punkty">
            {syuzhety.punkty.map((punkt) => (
              <li key={punkt}>{punkt}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
