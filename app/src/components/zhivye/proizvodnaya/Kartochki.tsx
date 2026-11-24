import { MODUL8_T, SEKUSHCHAYA8, SKOROST8_T } from '@/content/zhivye8';
import { ZhivayaKartochka } from '../Kartochka';
import { ModulLazy, SekushchayaLazy, SkorostLazy } from './Lazy';

/**
 * Живые сцены блока «Понятие производной» (теория №8) — стеклянные
 * карточки: заголовок и условие на сборке, сама сцена — ленивым куском.
 * Заменили прежние рисунки со слайдером (ZhivyeRisunki9).
 */

export function ZhivayaSekushchaya8() {
  const T = SEKUSHCHAYA8;
  return (
    <ZhivayaKartochka id="zv8-sekushchaya" nad={T.nad} zag={T.zag} lead={T.lead}>
      <SekushchayaLazy />
    </ZhivayaKartochka>
  );
}

export function ZhivayaSkorost8() {
  const T = SKOROST8_T;
  return (
    <ZhivayaKartochka id="zv8-skorost" nad={T.nad} zag={T.zag} lead={T.lead}>
      <SkorostLazy />
    </ZhivayaKartochka>
  );
}

export function ZhivoyModul8() {
  const T = MODUL8_T;
  return (
    <ZhivayaKartochka id="zv8-modul" nad={T.nad} zag={T.zag} lead={T.lead}>
      <ModulLazy />
    </ZhivayaKartochka>
  );
}
