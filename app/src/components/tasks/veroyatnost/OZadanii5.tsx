import { AlertIcon } from '@/components/ui';
import { vkladka } from '@/content/veroyatnost';
import { O_ZADANII_5, V_ZADANII_4 } from '@/content/veroyatnost-o-zadanii';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { HintIcon } from '../prep/PrepIcons';
import { ShapochkaIcon } from './Ikonki4';
import { MetodIkonka } from './MetodIkonka';

export interface OZadanii5Props {
  /** Адрес раздела без хвоста: /zadaniya/5. */
  base: string;
}

/**
 * Вкладка «О задании» задания №5 — устроена как у №4: слева рассказ
 * о задании, справа карточки — какие задачи встречаются (десять методов
 * автора из lib/veroyatnost/metody5.ts, со значками) и о чём помнить.
 * Карточки статистики нет: числа решаемости задания 5 автор не давал,
 * а придуманного здесь не будет. Тексты — content/veroyatnost-o-zadanii.
 */
export function OZadanii5({ base }: OZadanii5Props) {
  const { o, zadachi, vazhno } = O_ZADANII_5;
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka('5', 'o-zadanii')}</h2>
      <div className="z4-about z5-about">
        <section className="z4-about__istoriya">
          <h3 className="z4-about__h2">{o.title}</h3>
          {o.text.map((abzats) => (
            <p key={abzats} className="z4-about__text z5-about__text">
              {abzats}
            </p>
          ))}
        </section>

        <div className="z4-about__karty">
          <section className="z4-karta z4-zadachi">
            <h3 className="z4-karta__title">
              <span className="z4-karta__ico" aria-hidden="true">
                <ShapochkaIcon />
              </span>
              {zadachi.title}
            </h3>
            <p className="z4-karta__text">{zadachi.text}</p>
            <ul className="z5-metody">
              {METODY_5.map((m) => (
                <li key={m.id} className="z5-metody__item">
                  <MetodIkonka zadanie={5} metod={m.id} size="sm" />
                  <span>{m.nazvanie}</span>
                </li>
              ))}
            </ul>

            {/* Методы, которых в №5 нет: они составляют задание №4. */}
            <div className="z4-shire">
              <p className="z4-shire__title">
                <span className="z4-shire__ico" aria-hidden="true">
                  <AlertIcon />
                </span>
                {V_ZADANII_4.title}
              </p>
              <p className="z4-shire__text">{V_ZADANII_4.text}</p>
              <p className="z4-shire__text">
                <a className="z4-zadachi__link" href={V_ZADANII_4.href}>
                  {V_ZADANII_4.ssylka}
                </a>
              </p>
            </div>

            <p className="z4-karta__text z4-zadachi__razbor">
              {zadachi.razbor.do}
              <a className="z4-zadachi__link" href={`${base}/metody/`}>
                {zadachi.razbor.ssylka}
              </a>
              {zadachi.razbor.posle}
            </p>
          </section>

          <section className="z4-karta z4-vazhno">
            <h3 className="z4-karta__title">
              <span className="z4-karta__ico" aria-hidden="true">
                <HintIcon />
              </span>
              {vazhno.title}
            </h3>
            <p className="z4-karta__text">{vazhno.text}</p>
          </section>
        </div>
      </div>
    </>
  );
}
