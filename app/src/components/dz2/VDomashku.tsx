'use client';

/**
 * Кнопка «В домашку»: видна только учителю, при флаге новой выдачи ДЗ и
 * только в разделах выдачи (docs/kabinet-dz2.md). Кладёт элемент в
 * корзину; повторное нажатие того же элемента обновляет его. Рядом —
 * ссылка «Открыть корзину» со счётом.
 */

import Link from 'next/link';
import { useState } from 'react';
import { clsx } from 'clsx';
import { DZ2 } from '@/content/dz2';
import { AUTH_ENABLED } from '@/lib/auth/config';
import { useSessionUser } from '@/lib/auth/session';
import { dz2Razdel } from '@/lib/dz2/config';
import { korzina, useKorzina } from '@/lib/dz2/korzina';
import { DZ2_HREF } from '@/lib/dz2/links';
import type { ElementKorziny } from '@/lib/dz2/model';
import './dz2.css';

export function useUchitelDz2(taskNo: number): boolean {
  const user = useSessionUser();
  return AUTH_ENABLED && user !== null && user.role === 'tutor' && dz2Razdel(taskNo);
}

export function VDomashku({
  taskNo,
  klyuch,
  element,
  className,
  disabled = false,
}: {
  taskNo: number;
  /** Ключ элемента в корзине — по нему видно, что он уже там. */
  klyuch: string;
  /** Собрать элемент: опорные собирают задачи сразу. */
  element: () => ElementKorziny | Promise<ElementKorziny>;
  className?: string;
  disabled?: boolean;
}) {
  const vidno = useUchitelDz2(taskNo);
  const k = useKorzina();
  const [idet, setIdet] = useState(false);
  const [oshibka, setOshibka] = useState(false);
  if (!vidno) return null;
  const uzhe = k.elementy.some((e) => e.key === klyuch);

  async function dobavit() {
    setIdet(true);
    setOshibka(false);
    try {
      korzina.dobavit(await element());
    } catch {
      setOshibka(true);
    } finally {
      setIdet(false);
    }
  }

  return (
    <span className={clsx('dz2-knopka', className)}>
      <button
        type="button"
        className={clsx('btn btn--sm', uzhe ? 'btn--ghost' : 'btn--secondary', 'dz2-knopka__glavnaya')}
        title={DZ2.knopka.podskazka}
        onClick={() => void dobavit()}
        disabled={disabled || idet}
        aria-pressed={uzhe}
      >
        {idet ? DZ2.knopka.sobiraem : uzhe ? `✓ ${DZ2.knopka.dobavleno}` : `+ ${DZ2.knopka.dobavit}`}
      </button>
      {k.elementy.length > 0 ? (
        <Link className="dz2-knopka__korzina" href={DZ2_HREF.vydat}>
          {DZ2.knopka.otkryt} ({k.elementy.length})
        </Link>
      ) : null}
      {oshibka ? (
        <span className="dz2-knopka__oshibka" role="alert">
          {DZ2.knopka.oshibka}
        </span>
      ) : null}
    </span>
  );
}
