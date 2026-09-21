import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { AlertIcon, EmptyState, GlassBadge, HandNote } from '@/components/ui';
import { vkladka } from '@/content/veroyatnost';
import { FOTO_4, O_ZADANII_4, STATISTIKA_4, V_ZADANII_5 } from '@/content/veroyatnost-o-zadanii';
import { HintIcon } from '../prep/PrepIcons';
import { Roscherk, ShapochkaIcon } from './Ikonki4';

export interface OZadanii4Props {
  /** Адрес раздела без хвоста: /zadaniya/4. */
  base: string;
}

/**
 * Вкладка «О задании» задания №4 — по утверждённому макету.
 *
 * Две колонки: слева история с фотографией и рукописной подписью,
 * справа три карточки — решаемость, какие задачи встречаются, о чём
 * помнить. Все тексты и числа приходят из content/veroyatnost-o-zadanii:
 * в разметке строк нет.
 *
 * Значки берутся готовыми: столбики статистики и восклицательный знак
 * из общего набора, лампочка из подготовки. Своя здесь одна шапочка
 * выпускника — см. Ikonki4.
 */

/**
 * Лежит ли фотография на месте. Смотрится на сборке, в Node: файла
 * нет — вкладка показывает пустое место, а не битую картинку и не
 * чужой снимок.
 */
function fotoEst(): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), 'public', FOTO_4.src)).isFile();
  } catch {
    return false;
  }
}

export function OZadanii4({ base }: OZadanii4Props) {
  const { istoriya, reshaemost, zadachi, vazhno } = O_ZADANII_4;

  return (
    <>
      {/* Название вкладки — H2: заголовок задания (H1) один на все
          вкладки и живёт в шапке раздела. */}
      <h2 className="t-h2 vtab__title">{vkladka('4', 'o-zadanii')}</h2>
      <div className="z4-about">
        <section className="z4-about__istoriya">
          <h3 className="z4-about__h2">{istoriya.title}</h3>
          <p className="z4-about__text">{istoriya.text}</p>

          <figure className="z4-about__figura">
            {fotoEst() ? (
              <Image
                className="z4-about__foto"
                src={FOTO_4.src}
                alt={FOTO_4.alt}
                width={FOTO_4.width}
                height={FOTO_4.height}
              />
            ) : (
              <EmptyState
                className="z4-about__pusto"
                title={FOTO_4.pusto.title}
                description={FOTO_4.pusto.description}
              />
            )}
            <figcaption className="z4-about__podpis">
              <HandNote className="z4-about__ruka">{istoriya.podpis}</HandNote>
              <Roscherk />
            </figcaption>
          </figure>
        </section>

        <div className="z4-about__karty">
          {/* Решаемость: значок и число, под линией — пояснение. */}
          <section className="z4-karta z4-stat">
            <div className="z4-stat__chislo">
              <GlassBadge />
              <p className="z4-stat__value">{STATISTIKA_4.znachenie}</p>
              <p className="z4-stat__label">{STATISTIKA_4.podpis(STATISTIKA_4.god)}</p>
              <p className="z4-stat__istochnik">{STATISTIKA_4.istochnik}</p>
            </div>
            <p className="z4-stat__text">{reshaemost.text}</p>
          </section>

          {/* Какие задачи встречаются. */}
          <section className="z4-karta z4-zadachi">
            <h3 className="z4-karta__title">
              <span className="z4-karta__ico" aria-hidden="true">
                <ShapochkaIcon />
              </span>
              {zadachi.title}
            </h3>
            <p className="z4-karta__text">{zadachi.text}</p>

            {/* Методы, которых в №4 нет: они составляют задание №5,
              и плашка ведёт прямо в его раздел. */}
            <div className="z4-shire">
              <p className="z4-shire__title">
                <span className="z4-shire__ico" aria-hidden="true">
                  <AlertIcon />
                </span>
                {V_ZADANII_5.title}
              </p>
              <p className="z4-shire__text">{V_ZADANII_5.text}</p>
              <p className="z4-shire__text">
                <a className="z4-zadachi__link" href={V_ZADANII_5.href}>
                  {V_ZADANII_5.ssylka}
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

          {/* О чём помнить. */}
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
