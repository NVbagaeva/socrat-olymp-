import { Tex } from '@/components/ui/Tex';
import { VSTRECHA11 } from '@/content/tekstovye11';
import { Vstrecha11Lazy } from './vstrecha/Vstrecha11Lazy';

/**
 * «Встречное движение» — живая иллюстрация на «О задании»: два путника
 * выходят из городов А и В навстречу друг другу. Заголовок и условие
 * набираются на сборке; сама сцена (часы-таймлайн, походка, таблица
 * S, v, t, решение) — отдельный ленивый кусок: vstrecha/Scena.tsx.
 * Числа и тексты — lib/zadanie11/vstrecha.ts и content/tekstovye11.ts.
 */
export function Vstrecha11() {
  const T = VSTRECHA11;
  return (
    <section className="z11-vst stk-glass" aria-labelledby="z11-vst-zag">
      <div className="z11-vst__text">
        <p className="stk-nad">{T.nad}</p>
        <h3 className="stk-h4" id="z11-vst-zag">
          {T.zag}
        </h3>
        <p className="z11-vst__lead">
          <Tex text={T.lead} />
        </p>
      </div>
      <Vstrecha11Lazy />
    </section>
  );
}
