import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/layout';
import { PosleOtpravki } from '@/components/uchitelyam/PosleOtpravki';
import { USLUGA_HREF, uchitelyam } from '@/content/uchitelyam';
import '@/components/uchitelyam/usluga.css';

export const metadata: Metadata = {
  title: 'Заявка не ушла — Материалы под ключ',
  robots: { index: false },
};

/** Страница после отправки формы без скриптов: обработчик переводит сюда. */
export default function Page() {
  return (
    <>
      <SiteHeader currentHref={USLUGA_HREF} />
      <main className="svc-doc">
        <div className="wrap">
          <div className="svc-doc__in svc-form__done">
            <PosleOtpravki vid="oshibka" />
          </div>
        </div>
      </main>
      <SiteFooter links={uchitelyam.podval.links} />
    </>
  );
}
