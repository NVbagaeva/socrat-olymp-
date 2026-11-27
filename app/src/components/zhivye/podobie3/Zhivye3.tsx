import { PODOBIE3 } from '@/content/zhivye3';
import { ZhivayaKartochka } from '../Kartochka';
import { PodobieLazy } from './Lazy3';

/**
 * Живая сцена №3 (стереометрия): стеклянная карточка, сама сцена —
 * ленивым куском. Глава «Изменение размеров и подобие».
 */
export function ZhivoePodobie3() {
  const T = PODOBIE3;
  return (
    <ZhivayaKartochka id="zv3-podobie" nad={T.nad} zag={T.zag} lead={T.lead}>
      <PodobieLazy />
    </ZhivayaKartochka>
  );
}
