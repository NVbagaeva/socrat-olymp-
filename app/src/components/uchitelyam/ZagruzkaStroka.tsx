'use client';

import { clsx } from 'clsx';
import { uchitelyam } from '@/content/uchitelyam';
import { denMesyac } from '@/lib/usluga/zagruzka';
import { useZakaz } from './ZakazProvider';

const { zagruzka: t } = uchitelyam;

/** Строка «когда начну»: дата старта и срочное место. §4.3. */
export function ZagruzkaStroka({ className }: { className?: string }) {
  const { zagruzka } = useZakaz();
  const svobodno = zagruzka?.srochnoeSvobodno ?? true;
  return (
    <div
      className={clsx('svc-status', !svobodno && 'svc-status--busy', className)}
      aria-live="polite"
    >
      <b>{zagruzka?.start ? t.start(denMesyac(zagruzka.start)) : t.startBezDaty}</b>
      <span>{svobodno ? t.svobodno : t.zanyato}</span>
    </div>
  );
}
