import { OTREZOK12 } from '@/content/zhivye12';
import { ZhivayaKartochka } from '../Kartochka';
import { OtrezokLazy } from './OtrezokLazy';

/**
 * «Где прячется наибольшее и наименьшее» — живая сцена теории №12
 * (раздел «Наибольшее и наименьшее на отрезке»): стеклянная карточка,
 * сама сцена — ленивым куском.
 */
export function ZhivoyOtrezok12() {
  const T = OTREZOK12;
  return (
    <ZhivayaKartochka id="zv12-otrezok" nad={T.nad} zag={T.zag} lead={T.lead}>
      <OtrezokLazy />
    </ZhivayaKartochka>
  );
}
