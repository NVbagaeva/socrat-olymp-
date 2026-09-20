import type { ReactNode } from 'react';
import { KlassicheskayaVeroyatnost } from './KlassicheskayaVeroyatnost';
import { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';
import { VidySobytiy } from './VidySobytiy';

/**
 * Свёрстанные разделы теории по идентификатору из конфига.
 *
 * Конфиг хранит ключ, а не разметку: так список разделов остаётся
 * данными, а вкладка не знает, какой из них уже написан. Нет тела —
 * раздел показывает строку «Материал готовится». Заголовок с номером
 * рисует оболочка, поэтому своего у разделов нет.
 */
export const telaRazdelov4: Record<string, ReactNode> = {
  'vidy-sobytiy': <VidySobytiy />,
  klassicheskaya: <KlassicheskayaVeroyatnost />,
};

/** Разделы теории задания №5: пока один — координатная прямая. */
export const telaRazdelov5: Record<string, ReactNode> = {
  'koordinatnaya-pryamaya': <KoordinatnayaPryamaya />,
};

export { TeoriyaShell, type TeoriyaShellProps } from './TeoriyaShell';
export { ProverSebya, type ProverSebyaProps } from './ProverSebya';
export { ProverPonimanie, type ProverPonimaniyaProps } from './ProverPonimanie';
export { VariantyOtveta, type VariantyOtvetaProps, type VariantSostoyanie } from './VariantyOtveta';
export { VidySobytiy } from './VidySobytiy';
export { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';
export { KlassicheskayaVeroyatnost } from './KlassicheskayaVeroyatnost';
export { KostIcon, KrugiIcon, TreugolnikIcon, ZakladkaIcon, ZvenoIcon } from './IkonkiTeorii';
