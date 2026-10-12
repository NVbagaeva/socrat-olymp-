'use client';

import { useId, useState } from 'react';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';

const PDF = SPRAVOCHNIK_1.pdf;

/**
 * «Скачать PDF» справочника и переключатель «с примерами / без».
 * Кнопка открывает печатную страницу (/zadaniya/1/pechat/spravochnik/)
 * в новой вкладке; без примеров — с ?primery=0. Выбор в адресе этой
 * страницы не хранится.
 */
export function SkachatPdf1({ adres }: { adres: string }) {
  const [sPrimerami, setSPrimerami] = useState(true);
  const id = useId();
  return (
    <div className="spr1-pdf">
      <a
        className="btn btn--primary spr1-pdf__knopka"
        href={sPrimerami ? adres : `${adres}?primery=0`}
        target="_blank"
        rel="noopener"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="spr1-pdf__ikonka">
          <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
        </svg>
        {PDF.knopka}
      </a>
      <label className="spr1-pdf__vybor" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="spr1-pdf__switch"
          checked={sPrimerami}
          onChange={(e) => setSPrimerami(e.target.checked)}
        />
        <span>{PDF.sPrimerami}</span>
      </label>
    </div>
  );
}
