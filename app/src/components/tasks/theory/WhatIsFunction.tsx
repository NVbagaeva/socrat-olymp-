import Image from 'next/image';
import { whatIsFunction } from '@/content/theoryLinear';
import { BookIcon } from './BookIcon';
import { MappingDiagram } from './MappingDiagram';
import { Phrases } from './Phrases';

/**
 * Раздел «Что такое функция?».
 *
 * Тексты приходят из content/theoryLinear.ts, картинка — готовый
 * растр: пузыри с подписями и рукописная надпись нарисованы внутри
 * него, поэтому рядом нет ни карточек, ни HandNote.
 */
export function WhatIsFunction() {
  const { lead, intro, accent, after, illustration, mapping, rule } = whatIsFunction;

  return (
    <div className="what">
      <div className="what__top">
        <div className="what__story">
          <p className="what__lead">{lead}</p>
          <p className="what__text">{intro}</p>
          {/* Акцентная строка: синяя и полужирная, без плашки. */}
          <p className="what__accent">{accent}</p>
          <p className="what__text">
            <Phrases parts={after} />
          </p>
        </div>

        {/* Фон у файла прозрачный: ни рамки, ни подложки под ним нет. */}
        <Image
          className="what__art"
          src={illustration.src}
          alt={illustration.alt}
          width={illustration.width}
          height={illustration.height}
          loading="lazy"
        />
      </div>

      <div className="what__cards">
        <section className="card-map">
          <h4 className="card-map__title">{mapping.title}</h4>
          <div className="card-map__body">
            <MappingDiagram setX={mapping.setX} setY={mapping.setY} />
            {/* Вывод из схемы стоит рядом с ней, отделённый линией.
                Отдельной плашки под этот текст больше нет. */}
            <div className="card-map__aside">
              <p className="card-map__lead">
                <Phrases parts={mapping.caption} />
              </p>
              <p className="card-map__note">
                <Phrases parts={mapping.note} />
              </p>
            </div>
          </div>
        </section>

        <section className="rule">
          <h4 className="rule__title">
            <BookIcon />
            {rule.title}
          </h4>
          <p className="rule__text">
            <Phrases parts={rule.text} />
          </p>
          <span className="rule__line" aria-hidden="true" />
        </section>
      </div>

    </div>
  );
}
