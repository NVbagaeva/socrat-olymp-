import type { ReactNode } from 'react';
import { KakIzobrazhatSobytiya } from './KakIzobrazhatSobytiya';
import { ProtivopolozhnoeSobytiye4 } from './ProtivopolozhnoeSobytiye4';
import { KlassicheskayaVeroyatnost } from './KlassicheskayaVeroyatnost';
import { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';
import { VidySobytiy } from './VidySobytiy';
import { NezavisimyeSobytiya5, SovmestnyeSobytiya5 } from './Sobytiya5';
import { GlavaMetoda4 } from './metody/GlavaMetoda4';
import { glavaMetoda } from '@/lib/paths-teoriya';
import { KLYUCHEVYE_4 } from '@/lib/veroyatnost/metody4';

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
  'kak-izobrazhat': <KakIzobrazhatSobytiya />,
  protivopolozhnoe: <ProtivopolozhnoeSobytiye4 />,
  /* Главы ключевых методов: ключ — glavaMetoda(id метода). */
  ...Object.fromEntries(
    KLYUCHEVYE_4.map((m) => [glavaMetoda(m.id), <GlavaMetoda4 key={m.id} metod={m.id} />]),
  ),
};

/** Разделы теории задания №5. */
export const telaRazdelov5: Record<string, ReactNode> = {
  'koordinatnaya-pryamaya': <KoordinatnayaPryamaya />,
  nezavisimye: <NezavisimyeSobytiya5 />,
  sovmestnye: <SovmestnyeSobytiya5 />,
};

export { TeoriyaShell, type TeoriyaShellProps } from '@/components/tasks/teoriya/TeoriyaShell';
export { ProverSebya, type ProverSebyaProps } from './ProverSebya';
export { ProverPonimanie, type ProverPonimaniyaProps } from './ProverPonimanie';
export { VariantyOtveta, type VariantyOtvetaProps, type VariantSostoyanie } from './VariantyOtveta';
export { VidySobytiy } from './VidySobytiy';
export { KoordinatnayaPryamaya } from './KoordinatnayaPryamaya';
export { KlassicheskayaVeroyatnost } from './KlassicheskayaVeroyatnost';
export { KakIzobrazhatSobytiya } from './KakIzobrazhatSobytiya';
export { KostIcon, KrugiIcon, TreugolnikIcon, ZakladkaIcon, ZvenoIcon } from './IkonkiTeorii';
