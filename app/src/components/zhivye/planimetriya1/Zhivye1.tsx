import { SUMMA1, VPISANNYY1 } from '@/content/zhivye1';
import { ZhivayaKartochka } from '../Kartochka';
import { SummaUglovLazy, VpisannyyLazy } from './Lazy1';

/**
 * Живые сцены справочника №1 (планиметрия): стеклянные карточки, сами
 * сцены — ленивыми кусками. Разделы «Треугольник» и «Окружность».
 */
export function ZhivayaSumma1() {
  const T = SUMMA1;
  return (
    <ZhivayaKartochka id="zv1-summa" nad={T.nad} zag={T.zag} lead={T.lead}>
      <SummaUglovLazy />
    </ZhivayaKartochka>
  );
}

export function ZhivoyVpisannyy1() {
  const T = VPISANNYY1;
  return (
    <ZhivayaKartochka id="zv1-vpisannyy" nad={T.nad} zag={T.zag} lead={T.lead}>
      <VpisannyyLazy />
    </ZhivayaKartochka>
  );
}
