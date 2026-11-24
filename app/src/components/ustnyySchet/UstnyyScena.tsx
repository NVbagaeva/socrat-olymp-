import { kartinkaUs, type KartinkaUsId } from '@/lib/ustnyySchet/kartinki';
import { USTNYY } from '@/content/ustnyySchet';
import { ScenaUskorenie } from './ScenaUskorenie';
import './scena.css';

const ZNAKI: readonly KartinkaUsId[] = ['znak-plyus', 'znak-umnozhit', 'znak-minus', 'znak-delit'];

/**
 * Стеклянная сцена шапки «Устного счёта»: секундомер в центре, вокруг
 * по эллиптической орбите (оборот ≈ 20 с) летают четыре знака-слоя,
 * каждый со своим покачиванием; ближние крупнее, дальние меньше и
 * прозрачнее. Наведение ускоряет знаки (ScenaUskorenie). Оранжевый
 * ободок секундомера заполняет «Реши за 10 секунд» (атрибут
 * data-vyzov), верный ответ — «всплеск» знаков (класс is-vsplesk).
 * Всё движение — CSS: при reduce оно выключено (scena.css).
 */
export function UstnyyScena() {
  const sek = kartinkaUs('shapka-sekundomer');
  return (
    <div className="us-scena" id="us-scena" role="img" aria-label={USTNYY.vitrina.scena}>
      <div className="us-scena__orbita" aria-hidden="true">
        {ZNAKI.map((id, i) => {
          const k = kartinkaUs(id);
          return (
            <span key={id} className={`us-scena__put us-scena__put--${i + 1}`}>
              <img
                className={`us-scena__znak us-scena__znak--${i + 1}`}
                src={k.src}
                srcSet={k.srcSet}
                sizes="72px"
                width={k.width}
                height={k.height}
                alt=""
                loading="lazy"
                decoding="async"
              />
            </span>
          );
        })}
      </div>
      <div className="us-scena__sekundomer" aria-hidden="true">
        <img
          src={sek.src}
          srcSet={sek.srcSet}
          sizes="(max-width: 1023.98px) 110px, 190px"
          width={sek.width}
          height={sek.height}
          alt=""
          loading="lazy"
          decoding="async"
        />
        <svg className="us-scena__obodok" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="us-scena__obodok-lozhe" cx="50" cy="50" r="46" pathLength={100} />
          <circle className="us-scena__obodok-hod" cx="50" cy="50" r="46" pathLength={100} />
        </svg>
      </div>
      <ScenaUskorenie />
    </div>
  );
}
