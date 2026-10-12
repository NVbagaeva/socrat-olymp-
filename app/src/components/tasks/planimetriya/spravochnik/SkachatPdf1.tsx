'use client';

import { useEffect, useId, useState } from 'react';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';
import type { PdfSpravochnika } from '@/content/spravochnik1/pdf';
import { useVyborPdf1 } from './vyborPdf1';
import './SkachatPdf1.css';

const PDF = SPRAVOCHNIK_1.pdf;

/** Якорь панели: по нему кнопка в липкой строке понимает, видна ли панель. */
const PANEL_ID = 'spr1-pdf-panel';

type Fayly = { sPrimerami: PdfSpravochnika; bezPrimerov: PdfSpravochnika };

/** Имя файла для атрибута download: последняя часть адреса без версии. */
function imyaFayla(href: string): string {
  return href.split(/[?#]/)[0]?.split('/').pop() ?? 'spravochnik.pdf';
}

function IkonkaSkachat({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
    </svg>
  );
}

/**
 * Панель «Скачать справочник» под подзаголовком справочника: светлая
 * карточка во всю ширину контента. Слева главная кнопка — готовый PDF
 * (scripts/build-pdf-spravochnik-1.mjs), под ней «PDF · A4 · N страниц»;
 * справа от кнопки, по её центру, — переключатель «С примерами» и
 * второстепенная кнопка «Открыть для печати» (там окно печати).
 * На телефоне — столбиком: кнопка во всю ширину, ниже переключатель
 * и печать одной строкой.
 *
 * Ссылка с атрибутом download — браузер сохраняет файл, вкладка сайта
 * остаётся на месте; там, где download не слушают (просмотрщик PDF),
 * файл уходит в новую вкладку (target="_blank").
 *
 * sPrimerami задан — выбор сделан снаружи (печатная страница):
 * переключателя нет. pechat не задан — нет кнопки печати.
 */
export function SkachatPdf1({
  fayly,
  pechat,
  sPrimerami: izvne,
}: {
  fayly: Fayly;
  pechat?: string;
  sPrimerami?: boolean;
}) {
  const [vybor, setVybor] = useVyborPdf1();
  const sPrimerami = izvne ?? vybor;
  const id = useId();
  const fayl = sPrimerami ? fayly.sPrimerami : fayly.bezPrimerov;
  return (
    <section
      className={izvne === undefined ? 'spr1-pdf' : 'spr1-pdf spr1-pdf--prostaya'}
      id={izvne === undefined ? PANEL_ID : undefined}
      aria-label={PDF.panel}
    >
      <div className="spr1-pdf__glavnoe">
        <a
          className="spr1-pdf__knopka"
          href={fayl.href}
          download={imyaFayla(fayl.href)}
          target="_blank"
          rel="noopener"
          type="application/pdf"
          aria-label={PDF.skachatAria}
        >
          <IkonkaSkachat className="spr1-pdf__ikonka" />
          {PDF.skachat}
        </a>
        <span className="spr1-pdf__podpis no-math-check">{PDF.podpis(fayl.stranic)}</span>
      </div>
      {izvne !== undefined ? null : (
        <label className="spr1-pdf__vybor" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            role="switch"
            className="spr1-pdf__switch"
            checked={vybor}
            onChange={(e) => setVybor(e.target.checked)}
          />
          <span>{PDF.sPrimerami}</span>
        </label>
      )}
      {pechat === undefined ? null : (
        <a
          className="btn btn--secondary spr1-pdf__pechat"
          aria-label={PDF.pechat}
          href={sPrimerami ? pechat : `${pechat}?primery=0`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="spr1-pdf__ikonka"
          >
            <path d="M7 9V4h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v6H7z" />
          </svg>
          <span className="spr1-pdf__pechat-dlinno">{PDF.pechat}</span>
          <span className="spr1-pdf__pechat-korotko" aria-hidden="true">
            {PDF.pechatKorotko}
          </span>
        </a>
      )}
    </section>
  );
}

/**
 * Маленькая синяя кнопка «Скачать» в липкой строке «Содержание» (и у
 * заголовка колонки содержания на компьютере). Появляется, когда
 * панель «Скачать справочник» ушла за верх экрана: скачать можно с
 * любого места. Файл — тот же, что выбран переключателем панели.
 */
export function SkachatIkonka1({ fayly }: { fayly: Fayly }) {
  const [vybor] = useVyborPdf1();
  const [vidno, setVidno] = useState(false);
  useEffect(() => {
    const panel = document.getElementById(PANEL_ID);
    if (panel === null || typeof IntersectionObserver === 'undefined') return undefined;
    const nablyudatel = new IntersectionObserver(([z]) => {
      if (z === undefined) return;
      setVidno(!z.isIntersecting && z.boundingClientRect.bottom < 0);
    });
    nablyudatel.observe(panel);
    return () => nablyudatel.disconnect();
  }, []);
  const fayl = vybor ? fayly.sPrimerami : fayly.bezPrimerov;
  return (
    <a
      className="spr1-pdf-mini"
      href={fayl.href}
      download={imyaFayla(fayl.href)}
      target="_blank"
      rel="noopener"
      type="application/pdf"
      aria-label={PDF.skachatAria}
      title={PDF.skachatPodskazka(fayl.stranic)}
      hidden={!vidno}
    >
      <IkonkaSkachat className="spr1-pdf-mini__ikonka" />
    </a>
  );
}
