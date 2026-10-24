import Link from 'next/link';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { RAZDELY_TEORII_11 } from '@/content/teoriya11';
import { O_ZADANII_11, VSTUPLENIYA_11, type Vstuplenie11 } from '@/content/zadanie11';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import { sectionsInfo } from '@/lib/zadanie11/taxonomy';
import type { SectionId } from '@/lib/zadanie11/types';
import { Piktogramma } from './Piktogrammy';
import { KartaRazdelov11, type KartaPunkt } from './KartaRazdelov11';

/**
 * Тело вступления раздела: что это, зачем и где на ЕГЭ, главное.
 * Набирается на сервере (формулы — KaTeX) и отдаётся карте готовым
 * узлом: сама карта — клиентская и KaTeX не везёт.
 */
function VstuplenieTelo({ v }: { v: Vstuplenie11 }) {
  const { vstup } = O_ZADANII_11;
  return (
    <>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.chto}</p>
        <p className="z11-vstup__chto">
          <Tex text={v.chto} />
        </p>
      </div>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.zachem}</p>
        <p className="z11-vstup__text">
          <Tex text={v.zachem} />
        </p>
      </div>
      <div className="z11-vstup__blok">
        <p className="z11-vstup__label">{vstup.glavnoe}</p>
        <ol className="z11-vstup__glavnoe">
          {v.glavnoe.map((t) => (
            <li key={t}>
              <Tex text={t} />
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

/**
 * Вкладка «О задании» задания №11: одна фраза о задании и три кнопки
 * маршрута, карта разделов в порядке изучения (карточка раскрывается
 * во вступление: что это, зачем, главное, «Теперь — задачи» с
 * переходами в теорию, опорные блоки и тренажёр), колонка «С чего
 * начать». Числа — из данных: подтипы и сложность — taxonomy.ts,
 * число опорных блоков — prep/bloki.ts и O_ZADANII_11.pered,
 * прогресс — хранилище тренажёра.
 */
export function OZadanii11({ base }: { base: string }) {
  const info = sectionsInfo();
  const teoriya = new Map(RAZDELY_TEORII_11.filter((r) => r.section).map((r) => [r.section, r.id]));
  const punkty: KartaPunkt[] = info.map((s) => {
    const pered = O_ZADANII_11.pered[s.id] ?? [];
    const blokov = BLOKI.filter((b) => b.razdel === s.id || pered.includes(b.nazvanie)).length;
    return {
      id: s.id,
      nazvanie: s.nazvanie,
      tipov: s.subtypes.length,
      subtypes: s.subtypes.map((st) => st.id),
      maxLevel: s.maxLevel,
      razminka: s.razminka === true,
      blokov,
      hrefTeoriya: `${base}/teoriya/#teoriya-${teoriya.get(s.id) ?? ''}`,
      hrefOpornye: blokov === 0 ? null : `${base}/opornye-zadachi/?razdel=${s.id}`,
      hrefTrenazher: `${base}/trenazher/?tipy=${s.subtypes.map((st) => st.id).join(',')}`,
    };
  });
  const vstupleniya = Object.fromEntries(
    info.map((s) => [s.id, <VstuplenieTelo v={VSTUPLENIYA_11[s.id]} key={s.id} />]),
  ) as Record<SectionId, ReactNode>;
  const { start } = O_ZADANII_11;

  return (
    <div className="z11-about">
      <div className="z11-about__main">
        <section className="z11-about__lead">
          <h2 className="t-h2 z11-about__title">{O_ZADANII_11.title}</h2>
          <p className="z11-about__answer">{O_ZADANII_11.lead}</p>
          <p className="z11-about__text">{O_ZADANII_11.about}</p>
          <ul className="z11-deystviya" aria-label="С чего начать прямо сейчас">
            {O_ZADANII_11.deystviya.map((d, i) => (
              <li key={d.id}>
                <Link
                  className={clsx('z11-deystvie', i === 0 && 'z11-deystvie--main')}
                  href={`${base}/${d.tail}`}
                >
                  <span className="z11-deystvie__ikonka" aria-hidden="true">
                    <Piktogramma name={d.ikonka} />
                  </span>
                  <span className="z11-deystvie__text">
                    <span className="z11-deystvie__label">{d.label}</span>
                    <span className="z11-deystvie__note">{d.note}</span>
                  </span>
                  <Piktogramma name="chevron" className="z11-deystvie__chev" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="z11-karta-title">
          <h3 className="t-h4 z11-about__sub" id="z11-karta-title">
            {O_ZADANII_11.kartaTitle}
          </h3>
          <p className="z11-about__karta-lead">{O_ZADANII_11.kartaLead}</p>
          <KartaRazdelov11 punkty={punkty} vstupleniya={vstupleniya} />
        </section>
      </div>

      <aside className="z11-start" aria-labelledby="z11-start-title">
        <h3 className="z11-start__title" id="z11-start-title">
          <Piktogramma name="flag" className="z11-start__flag" />
          {start.title}
        </h3>
        <ol className="z11-start__list">
          {start.shagi.map((shag, i) => (
            <li className="z11-start__step" key={shag.title}>
              <span className="z11-start__no" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="z11-start__step-title">{shag.title}</span>
                <span className="z11-start__step-text">{shag.text}</span>
                {shag.knopka === null || shag.tail === null ? null : (
                  <Link
                    className="btn btn--secondary btn--sm z11-start__btn"
                    href={`${base}/${shag.tail}`}
                  >
                    {shag.knopka}
                  </Link>
                )}
              </span>
            </li>
          ))}
        </ol>
        <div className="z11-sovet">
          <Piktogramma name="bulb" className="z11-sovet__icon" />
          <div>
            <p className="z11-sovet__title">{start.sovetTitle}</p>
            <p className="z11-sovet__text">{start.sovet}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
