import type { ReactNode } from 'react';
import { KlassicheskayaVeroyatnost } from './KlassicheskayaVeroyatnost';
import { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';
import { VidySobytiy } from './VidySobytiy';

/**
 * Свёрстанные разделы теории задания №4 по идентификатору из конфига.
 *
 * Конфиг хранит ключ, а не разметку: так список разделов остаётся
 * данными, а вкладка не знает, какой из них уже написан. Нет тела —
 * раздел показывает строку «Материал готовится».
 */
export const telaRazdelov4: Record<string, ReactNode> = {
  'vidy-sobytiy': <VidySobytiy />,
  klassicheskaya: <KlassicheskayaVeroyatnost />,
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
