import { KRUG6 } from '@/content/zhivye6';
import { ZhivayaKartochka } from '../Kartochka';
import { KrugLazy } from './KrugLazy';

/**
 * «Откуда берутся серии корней» — живая сцена теории №6 (уравнения,
 * раздел 8): стеклянная карточка, сама сцена — ленивым куском.
 * Заменила прежний ZhivoyKrug7.
 */
export function ZhivoyKrug6() {
  const T = KRUG6;
  return (
    <ZhivayaKartochka id="zv6-krug" nad={T.nad} zag={T.zag} lead={T.lead}>
      <KrugLazy />
    </ZhivayaKartochka>
  );
}
