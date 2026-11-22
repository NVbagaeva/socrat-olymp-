import type { ReactNode } from 'react';
import { assetUrl } from '@/lib/assetUrl';
import type { Razbor } from '@/lib/veroyatnost/razbor';
import { risunok45, shagi45 } from '../trening/shagi45';
import type { Shag } from '../../steklo';

/** Картинка к задаче — как есть: целиком, прозрачный фон на стекле. */
export function Kartinka45({ path, alt }: { path: string; alt: string }) {
  return (
    <img className="z45-kartinka" src={assetUrl(path)} alt={alt} loading="lazy" decoding="async" />
  );
}

/** Разобранный пример: шаги, рисунок метода под ними, ответ. */
export function primerIzRazbora(
  razbor: Razbor,
  metodLabel: string,
  risunokLabel: string,
): { shagi: Shag[]; posle: ReactNode; otvet: string } {
  return {
    shagi: shagi45(razbor),
    posle: (
      <>
        {razbor.metod === '' ? null : (
          <p className="z45-metod">
            <b>{metodLabel}:</b> {razbor.metod}
          </p>
        )}
        {risunok45(razbor, true, risunokLabel)}
      </>
    ),
    otvet: razbor.otvet,
  };
}
