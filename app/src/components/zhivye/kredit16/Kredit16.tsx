import { KREDIT16 } from '@/content/zhivye16';
import { ZhivayaKartochka } from '../Kartochka';
import { KreditLazy } from './KreditLazy';

/**
 * «Как гасится кредит» — живая сцена теории №16 (экономическая задача,
 * глава «Две схемы кредита»): стеклянная карточка, сама сцена — ленивым
 * куском.
 */
export function ZhivoyKredit16() {
  const T = KREDIT16;
  return (
    <ZhivayaKartochka id="zv16-kredit" nad={T.nad} zag={T.zag} lead={T.lead}>
      <KreditLazy />
    </ZhivayaKartochka>
  );
}
