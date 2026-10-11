import Image from 'next/image';
import { clsx } from 'clsx';
import { istoriya, razgovor, type Replika, type Storona } from '@/content/theoryQuadratic';
import { Prodolzhenie } from './Prodolzhenie';

/**
 * Врезка «Откуда взялось слово „парабола“» — разговор двух Аполлониев.
 *
 * Говорит один и тот же человек: он в своём времени и он сегодня.
 * Античный стоит слева и говорит с терракотовой плашки, современный
 * справа и с голубой; подпись каждого — в тон своей плашке.
 *
 * Широкая врезка: портреты по краям, реплики между ними прижаты
 * каждая к своей стороне. Портрет стоит один раз сверху своей колонки
 * и держится на месте, пока реплики прокручиваются мимо.
 *
 * Узкая врезка: портреты уходят, вместо них перед подписью реплики
 * стоит кружок с лицом говорящего — как в переписке. Появления реплик
 * не анимируются: это не чат, а страница учебника.
 *
 * Разговор идёт в две части: вторая свёрнута под плашкой и
 * раскрывается по кнопке — её собирает Prodolzhenie.
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

/**
 * Лента реплик. Подпись стоит над первой репликой говорящего: когда
 * он говорит подряд, второй раз имя не повторяется — как в переписке.
 */
function Lenta({ repliki }: { repliki: Replika[] }) {
  return (
    <ol className="razgovor__lenta">
      {repliki.map((replika, i) => {
        const lico = istoriya[replika.kto];
        const podryad = repliki[i - 1]?.kto === replika.kto;
        return (
          <li
            className={clsx(
              'razgovor__replika',
              `razgovor__replika--${replika.kto}`,
              podryad && 'razgovor__replika--podryad',
            )}
            key={replika.text}
          >
            {podryad ? null : (
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
            )}
            <p className="razgovor__slova">{replika.text}</p>
          </li>
        );
      })}
    </ol>
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

        <div className="razgovor__stolb">
          <Lenta repliki={razgovor.nachalo} />
          <Prodolzhenie>
            <Lenta repliki={razgovor.dalshe} />
          </Prodolzhenie>
        </div>

        <Lico kto="sovremennyy" />
      </div>
    </section>
  );
}
