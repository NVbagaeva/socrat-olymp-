import Image from 'next/image';
import { whatIsFunction } from '@/content/theoryLinear';
import { MappingDiagram } from './MappingDiagram';

/**
 * Раздел «Что такое функция?».
 *
 * Тексты приходят из content/theoryLinear.ts, картинка — готовый
 * растр: пузыри с подписями и рукописная надпись нарисованы внутри
 * него, поэтому рядом нет ни карточек, ни HandNote.
 */
export function WhatIsFunction() {
  const { lead, intro, accent, after, illustration, mapping, rule, note } = whatIsFunction;

  return (
    <div className="what">
      <div className="what__top">
        <div className="what__story">
          <p className="what__lead">{lead}</p>
          <p className="what__text">{intro}</p>
          {/* Акцентная строка: синяя и полужирная, без плашки. */}
          <p className="what__accent">{accent}</p>
          <p className="what__text">
            {after.map((part, index) =>
              part.strong === true ? (
                <strong key={index}>{part.text}</strong>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
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

      <div className="what__cols">
        <figure className="mapping">
          <figcaption className="mapping__title">{mapping.title}</figcaption>
          <MappingDiagram setX={mapping.setX} setY={mapping.setY} />
          <p className="mapping__caption">{mapping.caption}</p>
        </figure>
      </div>

      <div className="what__plates">
        <div className="rule rule--warm">
          {/* Лампочка — та же, что в подсказках банка заданий. Она стоит
              слева от заголовка, а текст идёт под ними во всю ширину. */}
          <h4 className="rule__title">
            <Image
              className="rule__art"
              src="/images/lightbulb.webp"
              alt=""
              width={200}
              height={181}
            />
            {rule.title}
          </h4>
          <p className="rule__text">
            {rule.text.map((part, index) =>
              part.strong === true ? (
                <strong key={index}>{part.text}</strong>
              ) : (
                <span key={index}>{part.text}</span>
              ),
            )}
          </p>
        </div>

        <div className="rule rule--note">
          {note.map((line, index) => (
            <p className={index === 0 ? 'rule__lead' : 'rule__text'} key={line}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
