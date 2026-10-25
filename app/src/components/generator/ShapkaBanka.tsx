'use client';

import { useEffect, useState } from 'react';
import { GEN_UI } from '@/content/generatorUi';
import type { ShapkaBanka as Shapka } from '@/lib/generator/obshchiy/bank';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';

/** «2026-10-24» → «24.10.2026». */
function data(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Строки шапки листа из банка задач (№6, №7, №10) по «Дополнительно»
 * общего генератора: вид работы, поле «Фамилия, имя» с датой, учитель и
 * QR-код листа ученика. Шапку прежнего адреса лист рисует сам.
 */
export function ShapkaBanka({
  shapka,
  avtor,
  fio,
  uchenik,
}: {
  shapka: Shapka;
  /** Учитель по умолчанию — автор материалов. */
  avtor: string;
  /** «Фамилия, имя ____ Дата ____»: дата, если задана, встаёт вместо линии. */
  fio: string;
  uchenik: boolean;
}) {
  const [qr, setQr] = useState<string | null>(null);
  useEffect(() => {
    if (!shapka.qr) return undefined;
    let alive = true;
    void qrSvg(adresListaUchenika(window.location.href)).then((svg) => {
      if (alive) setQr(svg);
    });
    return () => {
      alive = false;
    };
  }, [shapka.qr]);
  return (
    <div className="gen-shapka">
      <div className="gen-shapka__text">
        {shapka.kind !== '' ? <p className="gen-shapka__vid">{shapka.kind}</p> : null}
        {uchenik ? (
          <p className="gen-shapka__fio">
            {shapka.date === '' ? fio : fio.replace(/Дата\s+_+\s*$/, `Дата ${data(shapka.date)}`)}
          </p>
        ) : shapka.date !== '' ? (
          <p className="gen-shapka__fio">Дата {data(shapka.date)}</p>
        ) : null}
        <p className="gen-shapka__uchitel">
          {GEN_UI.dop.uchitel}: {shapka.uchitel ?? avtor}
        </p>
      </div>
      {shapka.qr && qr !== null ? (
        <div
          className="gen-shapka__qr"
          role="img"
          aria-label={GEN_UI.dop.qr}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
      ) : null}
    </div>
  );
}
