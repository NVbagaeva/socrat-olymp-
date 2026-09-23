import Image from 'next/image';
import { istoriya } from '@/content/theoryQuadratic';
import { katex } from '@/lib/graph/katex';
import { Strelka } from './Strelka';

/**
 * Баннер раздела «Немного истории».
 *
 * Слева Аполлоний в своём времени, справа он же сегодня, между ними
 * конус, рассечённый плоскостью. Оба портрета повёрнуты к центру —
 * поэтому местами их менять нельзя, зеркалить тоже.
 *
 * Конус с секущей плоскостью и параболой сечения — картинка: кривая
 * нарисована на ней самой, поверх неё ничего не рисуется. Подписи от
 * руки — текст рукописным шрифтом, а не картинка.
 */

export function IstoriyaBanner() {
  const formula = katex.renderToString(istoriya.formula, {
    throwOnError: false,
    displayMode: false,
  });

  return (
    <figure className="istor">
      <div className="istor__ryad">
        <figure className="istor__lico istor__lico--antichnyy">
          <Image
            className="istor__portret"
            src={istoriya.antichnyy.src}
            alt={istoriya.antichnyy.alt}
            width={istoriya.antichnyy.width}
            height={istoriya.antichnyy.height}
          />
          <figcaption className="istor__podpis">{istoriya.antichnyy.podpis}</figcaption>
        </figure>

        <div className="istor__konus">
          <Image
            className="istor__konus-kartinka"
            src={istoriya.konus.src}
            alt={istoriya.konus.alt}
            width={istoriya.konus.width}
            height={istoriya.konus.height}
          />
          {/* Стрелка подписи живёт внутри картинки и меряется в её
              долях: остриё должно упираться в саму кривую сечения,
              а кривая нарисована на картинке и едет вместе с ней. */}
          <Strelka
            className="istor__strelka istor__strelka--konus"
            d="M 8 24 C 44 36 72 56 92 84"
            ostriyo="M 80 80 L 94 88 L 88 74"
          />
        </div>

        <figure className="istor__lico istor__lico--sovremennyy">
          <Image
            className="istor__portret"
            src={istoriya.sovremennyy.src}
            alt={istoriya.sovremennyy.alt}
            width={istoriya.sovremennyy.width}
            height={istoriya.sovremennyy.height}
          />
          <figcaption className="istor__podpis">{istoriya.sovremennyy.podpis}</figcaption>
        </figure>
      </div>

      {/* Формула над правым портретом: разметка своя, из конфига
          проекта, KaTeX собирает её на сборке. */}
      <span className="istor__formula" dangerouslySetInnerHTML={{ __html: formula }} />

      <span className="istor__zametka istor__zametka--sleva">
        {istoriya.zametki.sleva}
        <Strelka
          className="istor__strelka"
          d="M 10 20 C 45 35 70 60 86 88"
          ostriyo="M 74 84 L 88 92 L 82 78"
        />
      </span>

      <span className="istor__zametka istor__zametka--konus">{istoriya.zametki.konus}</span>

      <span className="istor__zametka istor__zametka--sprava">
        {istoriya.zametki.sprava}
        <Strelka
          className="istor__strelka"
          d="M 110 20 C 76 36 50 60 34 88"
          ostriyo="M 46 84 L 32 92 L 38 78"
        />
      </span>
    </figure>
  );
}
