import Image from 'next/image';
import { clsx } from 'clsx';
import { istoriya, razgovor, type Storona } from '@/content/theoryQuadratic';

/**
 * Врезка «Откуда взялось слово „парабола“» — разговор двух Аполлониев.
 *
 * Говорит один и тот же человек: он в своём времени и он сегодня.
 * Античный стоит слева, современный справа — портреты повёрнуты друг
 * к другу, поэтому местами их не меняют и не зеркалят.
 *
 * Широкая врезка: портреты по краям, реплики между ними прижаты
 * каждая к своей стороне. Портрет стоит один раз сверху своей колонки
 * и держится на месте, пока реплики прокручиваются мимо.
 *
 * Узкая врезка: портреты уходят, вместо них перед подписью реплики
 * стоит кружок с лицом говорящего — как в переписке. Появления реплик
 * не анимируются: это не чат, а страница учебника.
 *
 * Разговор обрывается на вопросе о происхождении названия — ответ
 * будет в продолжении; пока врезку закрывает цитата.
 */

/** Портрет в колонке: он же несёт alt, кружки реплик — декор. */
function Lico({ kto }: { kto: Storona }) {
  const lico = istoriya[kto];
  return (
    <div className={clsx('razgovor__lico', `razgovor__lico--${kto}`)}>
      <Image
        className="razgovor__portret"
        src={lico.src}
        alt={lico.alt}
        width={lico.width}
        height={lico.height}
      />
    </div>
  );
}

export function RazgovorApolloniev() {
  return (
    <section className="razgovor" aria-labelledby="razgovor-title">
      <h4 className="razgovor__title" id="razgovor-title">
        {razgovor.title}
      </h4>

      <div className="razgovor__ryad">
        <Lico kto="antichnyy" />

        <ol className="razgovor__lenta">
          {razgovor.repliki.map((replika) => {
            const lico = istoriya[replika.kto];
            return (
              <li
                className={clsx('razgovor__replika', `razgovor__replika--${replika.kto}`)}
                key={replika.text}
              >
                <p className="razgovor__kto">
                  {/* Кружок повторяет портрет колонки, поэтому alt
                      пустой: имя говорящего стоит рядом словами. */}
                  <span className="razgovor__kruzhok" aria-hidden="true">
                    <Image
                      className={clsx('razgovor__avatar', `razgovor__avatar--${replika.kto}`)}
                      src={lico.src}
                      alt=""
                      width={lico.width}
                      height={lico.height}
                    />
                  </span>
                  {lico.podpis}
                </p>
                <p className="razgovor__slova">{replika.text}</p>
              </li>
            );
          })}
        </ol>

        <Lico kto="sovremennyy" />
      </div>

      {/* Разговор обрывается на вопросе — закрывает врезку цитата. */}
      <figure className="razgovor__citata">
        <blockquote className="razgovor__citata-text">{razgovor.citata.text}</blockquote>
        <figcaption className="razgovor__citata-avtor">— {razgovor.citata.avtor}</figcaption>
      </figure>
    </section>
  );
}
