import { Tex } from '@/components/ui/Tex';
import { RASPAD10 } from '@/content/teoriya10';
import { RaspadLazy } from './RaspadLazy';
import '@/components/tasks/steklo/steklo.css';

/**
 * «Распад изотопа» — живая иллюстрация теории №9 (раздел «Показательные
 * и логарифмические зависимости»): 64 ядра в пробирке гаснут по одному,
 * столбик массы и график m(t) в одном масштабе опускаются вдвое каждые
 * 7 минут. Заголовок и условие набираются на сборке; сама сцена —
 * ленивый кусок raspad/Scena.tsx. Числа — lib/zadanie10/raspad.ts,
 * тексты — RASPAD10 в content/teoriya10.ts.
 */
export function Raspad10() {
  const T = RASPAD10;
  return (
    <section className="z10-my z10-rs stk-glass" aria-labelledby="z10-rs-zag">
      <div className="z10-my__text">
        <p className="stk-nad">{T.nad}</p>
        <h3 className="stk-h4" id="z10-rs-zag">
          {T.zag}
        </h3>
        <p className="z10-my__lead">
          <Tex text={T.lead} />
        </p>
      </div>
      <RaspadLazy />
    </section>
  );
}
