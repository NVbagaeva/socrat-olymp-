import { ZNAKI15 } from '@/content/zhivye15';
import { ZhivayaKartochka } from '../Kartochka';
import { ZnakiLazy } from './ZnakiLazy';

/**
 * «Как меняется знак произведения» — живая сцена теории №15
 * (неравенства, глава «Метод интервалов»): стеклянная карточка, сама
 * сцена — ленивым куском.
 */
export function ZhivyeZnaki15() {
  const T = ZNAKI15;
  return (
    <ZhivayaKartochka id="zv15-znaki" nad={T.nad} zag={T.zag} lead={T.lead}>
      <ZnakiLazy />
    </ZhivayaKartochka>
  );
}
