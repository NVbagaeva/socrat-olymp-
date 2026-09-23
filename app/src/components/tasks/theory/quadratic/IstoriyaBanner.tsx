import Image from 'next/image';
import { istoriya } from '@/content/theoryQuadratic';
import { katex } from '@/lib/graph/katex';

/**
 * Баннер раздела «Немного истории».
 *
 * Слева Аполлоний в своём времени, справа он же сегодня, между ними
 * конус, рассечённый плоскостью. Оба портрета повёрнуты к центру —
 * поэтому местами их менять нельзя, зеркалить тоже.
 *
 * Кривой сечения на картинке нет намеренно: её рисует SVG поверх
 * картинки, чтобы геометрия была верной. Подписи от руки — текст
 * рукописным шрифтом, а не картинка.
 */

/* Сечение конуса плоскостью, параллельной образующей, — парабола.
   Координаты в системе самой картинки (1254 × 1254): плоскость взята
   та же, что нарисована, и подогнана по двум её приметам — точке, где
   она режет правую образующую у вершины, и точке, где выходит через
   основание. Проекция параболы — снова парабола, поэтому каждый кусок
   дуги точно ложится на квадратичную кривую Безье; расхождение
   с настоящим сечением меньше двух единиц из 1254, то есть доли
   пикселя на экране.

   Первый кусок идёт по передней половине конуса и виден, второй
   уходит за конус — он штриховой. */
const SECHENIE = {
  vidno: 'M 560.4 1142.4 Q 743.8 344.3 699 210.1',
  skryto: 'M 699 210.1 Q 640.2 34 188 1002.2',
};

/** Стрелка от подписи к тому, что она подписывает. */
function Strelka({ d, ostriyo }: { d: string; ostriyo: string }) {
  return (
    <svg className="istor__strelka" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path d={d} />
      <path d={ostriyo} />
    </svg>
  );
}

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
          {/* Сечение: система координат — сама картинка, поэтому кривая
              держится на конусе при любой ширине. Толщина линии не
              тянется вместе с картинкой: она задана в пикселях экрана,
              как у линий чертежей движка. */}
          <svg
            className="istor__sechenie"
            viewBox="0 0 1254 1254"
            aria-hidden="true"
            focusable="false"
          >
            <path className="istor__krivaya" d={SECHENIE.vidno} />
            <path className="istor__krivaya istor__krivaya--za" d={SECHENIE.skryto} />
          </svg>
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
        <Strelka d="M 10 20 C 45 35 70 60 86 88" ostriyo="M 74 84 L 88 92 L 82 78" />
      </span>

      <span className="istor__zametka istor__zametka--konus">
        {istoriya.zametki.konus}
        <Strelka d="M 8 24 C 44 36 72 56 92 84" ostriyo="M 80 80 L 94 88 L 88 74" />
      </span>

      <span className="istor__zametka istor__zametka--sprava">
        {istoriya.zametki.sprava}
        <Strelka d="M 110 20 C 76 36 50 60 34 88" ostriyo="M 46 84 L 32 92 L 38 78" />
      </span>
    </figure>
  );
}
