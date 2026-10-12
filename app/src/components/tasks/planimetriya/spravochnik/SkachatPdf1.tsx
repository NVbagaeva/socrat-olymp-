'use client';

import { useId, useState } from 'react';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';
import './SkachatPdf1.css';
import type { PdfSpravochnika } from '@/content/spravochnik1/pdf';

const PDF = SPRAVOCHNIK_1.pdf;

/** Имя файла для атрибута download: последняя часть адреса без версии. */
function imyaFayla(href: string): string {
  return href.split(/[?#]/)[0]?.split('/').pop() ?? 'spravochnik.pdf';
}

/**
 * «Скачать справочник» — главная кнопка: отдаёт готовый PDF
 * (scripts/build-pdf-spravochnik-1.mjs), под ней «PDF, A4, N страниц»
 * и переключатель «С примерами».
 *
 * Ссылка с атрибутом download — браузер сохраняет файл и вкладка сайта
 * остаётся на месте; там, где download не слушают (просмотрщик PDF
 * открывается сам), файл уходит в новую вкладку (target="_blank"), и
 * сайт по-прежнему в своей вкладке.
 *
 * pechat — адрес печатной страницы: ссылка «Открыть для печати» (там
 * окно печати браузера). sPrimerami задан — выбор сделан снаружи
 * (печатная страница), переключателя нет.
 */
export function SkachatPdf1({
  fayly,
  pechat,
  sPrimerami: izvne,
}: {
  fayly: { sPrimerami: PdfSpravochnika; bezPrimerov: PdfSpravochnika };
  pechat?: string;
  sPrimerami?: boolean;
}) {
  const [svoy, setSvoy] = useState(true);
  const sPrimerami = izvne ?? svoy;
  const id = useId();
  const fayl = sPrimerami ? fayly.sPrimerami : fayly.bezPrimerov;
  return (
    <div className="spr1-pdf">
      <a
        className="spr1-pdf__knopka"
        href={fayl.href}
        download={imyaFayla(fayl.href)}
        target="_blank"
        rel="noopener"
        type="application/pdf"
        aria-label={PDF.skachatAria}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="spr1-pdf__ikonka">
          <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
        </svg>
        {PDF.skachat}
      </a>
      <div className="spr1-pdf__nizhe">
        <span className="spr1-pdf__podpis">{PDF.podpis(fayl.stranic)}</span>
        {izvne !== undefined ? null : (
          <label className="spr1-pdf__vybor" htmlFor={id}>
            <input
              id={id}
              type="checkbox"
              role="switch"
              className="spr1-pdf__switch"
              checked={svoy}
              onChange={(e) => setSvoy(e.target.checked)}
            />
            <span>{PDF.sPrimerami}</span>
          </label>
        )}
        {pechat === undefined ? null : (
          <a className="spr1-pdf__pechat" href={sPrimerami ? pechat : `${pechat}?primery=0`}>
            {PDF.pechat}
          </a>
        )}
      </div>
    </div>
  );
}
