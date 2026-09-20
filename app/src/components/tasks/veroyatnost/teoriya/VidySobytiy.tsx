import Image from 'next/image';
import { clsx } from 'clsx';
import { CheckIcon, HandNote } from '@/components/ui';
import { PROVER_SEBYA, SVYAZANY, VIDY_SOBYTIY } from '@/content/veroyatnost-teoriya';
import { typeset } from '@/lib/tex';
import { voprosyVidovSobytiy } from '@/lib/veroyatnost/teoriya';
import { HintIcon } from '../../prep/PrepIcons';
import { KrugiIcon, ZakladkaIcon, ZvenoIcon } from './IkonkiTeorii';
import { ProverSebya } from './ProverSebya';

/**
 * Раздел теории «Виды событий» — первый раздел вкладки.
 *
 * Три блока по макету: виды событий карточками, самопроверка и
 * связанные события. Тексты и формулы — из конфига раздела; формулы
 * набираются KaTeX на сборке, в браузер уходит готовая вёрстка.
 *
 * Верных ответов самопроверки здесь нет: блок получает вопросы с
 * отпечатками, а сверяет их уже в браузере (lib/veroyatnost/teoriya).
 */

/** Формула в рамке: набирается на сборке. */
function Formula({ tex }: { tex: string }) {
  return <p className="vteor-formula" dangerouslySetInnerHTML={{ __html: typeset(tex, true) }} />;
}

const ZNACHKI = { zveno: <ZvenoIcon />, krugi: <KrugiIcon /> };

export function VidySobytiy() {
  const { title, kartochki, primerLabel, vazhno, usloviya, zapomni } = VIDY_SOBYTIY;

  return (
    <>
      <h2 className="vteor-razdel__title">
        <span className="vteor-razdel__no" aria-hidden="true">
          1
        </span>
        {title}
      </h2>

      {/* Три карточки видов событий и правая колонка с пояснениями. */}
      <div className="vvidy">
        <ul className="vvidy__grid">
          {kartochki.map((karta) => (
            <li className={clsx('vvid', `vvid--${karta.ton}`)} key={karta.id}>
              <h3 className="vvid__title">{karta.title}</h3>
              <p className="vvid__opredelenie">{karta.opredelenie}</p>
              <Formula tex={karta.formula} />
              <p className="vvid__primer">
                <b>{primerLabel}</b> {karta.primer}
              </p>

              {'kartinka' in karta ? (
                <figure className="vvid__figura">
                  <Image
                    className="vvid__foto"
                    src={karta.kartinka.src}
                    alt={karta.kartinka.alt}
                    width={karta.kartinka.width}
                    height={karta.kartinka.height}
                  />
                  {'podpis' in karta ? (
                    <figcaption className="vvid__podpis">
                      <HandNote>{karta.podpis}</HandNote>
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}

              {'itog' in karta ? (
                <p className="vvid__itog">
                  <span className="vvid__galka" aria-hidden="true">
                    <CheckIcon />
                  </span>
                  {karta.itog}
                </p>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="vvidy__side">
          <section className="z4-karta">
            <h3 className="z4-karta__title">
              <span className="z4-karta__ico" aria-hidden="true">
                <HintIcon />
              </span>
              {vazhno.title}
            </h3>
            <p className="z4-karta__text">{vazhno.text}</p>
          </section>

          <section className="z4-karta vusloviya">
            <h3 className="vusloviya__title">{usloviya.title}</h3>
            <p className="z4-karta__text">{usloviya.text}</p>
            <figure className="vusloviya__figura">
              <Image
                className="vusloviya__foto"
                src={usloviya.kartinka.src}
                alt={usloviya.kartinka.alt}
                width={usloviya.kartinka.width}
                height={usloviya.kartinka.height}
              />
              <figcaption className="vusloviya__podpis">
                <HandNote>{usloviya.podpis}</HandNote>
              </figcaption>
            </figure>
          </section>
        </div>
      </div>

      {/* Плашка «Запомни»: три типа события цепочкой. */}
      <section className="vzapomni">
        <div className="vzapomni__text">
          <h3 className="vzapomni__title">
            <span className="vzapomni__ico" aria-hidden="true">
              <ZakladkaIcon />
            </span>
            {zapomni.title}
          </h3>
          <p className="vzapomni__lead">{zapomni.lead}</p>
        </div>
        <ol className="vzapomni__cep">
          {zapomni.zvenya.map((zveno, i) => (
            <li className="vzapomni__zveno" key={zveno.id}>
              <span className={clsx('vzveno', `vzveno--${zveno.ton}`)}>
                <span className="vzveno__title">{zveno.title}</span>
                <span
                  className="vzveno__formula"
                  dangerouslySetInnerHTML={{ __html: typeset(zveno.formula, true) }}
                />
              </span>
              {/* Стрелка между звеньями — за последним её нет. */}
              {i < zapomni.zvenya.length - 1 ? (
                <span className="vzapomni__strelka" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* Блок самопроверки. Кружка с номером нет: номера в кружках —
          это номера разделов темы, а здесь блок внутри раздела. */}
      <section className="vteor-blok">
        <h2 className="vteor-blok__title">{PROVER_SEBYA.title}</h2>
        <ProverSebya
          voprosy={voprosyVidovSobytiy()}
          otvety={PROVER_SEBYA.otvety}
          lead={PROVER_SEBYA.lead}
          knopka={PROVER_SEBYA.knopka}
        />
      </section>

      {/* Блок «События могут быть связаны» — тоже часть раздела. */}
      <section className="vteor-blok">
        <h2 className="vteor-blok__title">{SVYAZANY.title}</h2>
        <p className="vteor-blok__lead">{SVYAZANY.lead}</p>

        <ul className="vsvyaz__grid">
          {SVYAZANY.kartochki.map((karta) => (
            <li className="vsvyaz" key={karta.id}>
              <span className="vsvyaz__ico" aria-hidden="true">
                {ZNACHKI[karta.znachok]}
              </span>
              <div className="vsvyaz__text">
                <h3 className="vsvyaz__title">{karta.title}</h3>
                <p className="vsvyaz__opredelenie">{karta.opredelenie}</p>
                <Formula tex={karta.formula} />
                <p className="vsvyaz__primer">
                  <b>{primerLabel}</b> {karta.primer}
                </p>
              </div>
              <figure className="vsvyaz__figura">
                <Image
                  className="vsvyaz__foto"
                  src={karta.kartinka.src}
                  alt={karta.kartinka.alt}
                  width={karta.kartinka.width}
                  height={karta.kartinka.height}
                />
              </figure>
              <p className={clsx('vsvyaz__plashka', `vsvyaz__plashka--${karta.plashka.ton}`)}>
                <b>{karta.plashka.label}</b> {karta.plashka.text}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
