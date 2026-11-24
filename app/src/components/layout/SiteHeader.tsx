import { SaytPanel } from './SaytPanel';
import { Shapka, type ShapkaProps } from './Shapka';

export type SiteHeaderProps = Omit<ShapkaProps, 'kabinet'>;

/**
 * Шапка публичных страниц (Shapka) и под ней нижняя панель телефона —
 * как в приложении; на главных её нет. У оболочки кабинета панель своя,
 * она берёт Shapka напрямую.
 */
export function SiteHeader(props: SiteHeaderProps) {
  return (
    <>
      <Shapka {...props} />
      <SaytPanel />
    </>
  );
}
