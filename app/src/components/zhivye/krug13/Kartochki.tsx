import { DELENIE13, UGOL13 } from '@/content/zhivye13';
import { ZhivayaKartochka } from '../Kartochka';
import { DelenieLazy, UgolLazy } from './Lazy';

/**
 * Живые сцены тригонометрической окружности (теория №13): стеклянные
 * карточки, сцены — ленивыми кусками. Заменили KrugZhivoy14 и KrugDelenie14.
 */

export function ZhivoyUgol13() {
  const T = UGOL13;
  return (
    <ZhivayaKartochka id="zv13-ugol" nad={T.nad} zag={T.zag} lead={T.lead}>
      <UgolLazy />
    </ZhivayaKartochka>
  );
}

export function ZhivoeDelenie13() {
  const T = DELENIE13;
  return (
    <ZhivayaKartochka id="zv13-delenie" nad={T.nad} zag={T.zag} lead={T.lead}>
      <DelenieLazy />
    </ZhivayaKartochka>
  );
}
