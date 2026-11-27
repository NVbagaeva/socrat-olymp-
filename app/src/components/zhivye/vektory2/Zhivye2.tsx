import { DEYSTVIYA2 } from '@/content/zhivye2';
import { ZhivayaKartochka } from '../Kartochka';
import { DeystviyaLazy } from './Lazy2';

/**
 * Живая сцена справочника №2 (векторы): стеклянная карточка, сама
 * сцена — ленивым куском. Раздел «Действия с векторами».
 */
export function ZhivyeDeystviya2() {
  const T = DEYSTVIYA2;
  return (
    <ZhivayaKartochka id="zv2-deystviya" nad={T.nad} zag={T.zag} lead={T.lead}>
      <DeystviyaLazy />
    </ZhivayaKartochka>
  );
}
