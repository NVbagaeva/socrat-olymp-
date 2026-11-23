import { Tex } from '@/components/ui/Tex';
import { MYACH10 } from '@/content/teoriya10';
import { MyachLazy } from './MyachLazy';
import '@/components/tasks/steklo/steklo.css';

/**
 * «Мяч выше отметки» — живая иллюстрация теории №9 (раздел «Квадратные
 * уравнения»): мяч летит вверх и падает, рядом в том же масштабе
 * растёт график h(t), промежуток над отметкой H отмечается на оси
 * времени. Заголовок и условие набираются на сборке; сама сцена —
 * ленивый кусок myach/Scena.tsx. Числа — lib/zadanie10/myach.ts,
 * тексты — MYACH10 в content/teoriya10.ts.
 */
export function Myach10() {
  const T = MYACH10;
  return (
    <section className="z10-my stk-glass" aria-labelledby="z10-my-zag">
      <div className="z10-my__text">
        <p className="stk-nad">{T.nad}</p>
        <h3 className="stk-h4" id="z10-my-zag">
          {T.zag}
        </h3>
        <p className="z10-my__lead">
          <Tex text={T.lead} />
        </p>
      </div>
      <MyachLazy />
    </section>
  );
}
