'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';
import type { PdfSpravochnika } from '@/content/spravochnik1/pdf';
import { Nazad1 } from './Nazad1';
import { SkachatPdf1 } from './SkachatPdf1';

const PDF = SPRAVOCHNIK_1.pdf;

/** Кусок потока — разбор (лист «без примеров» их снимает). */
function razbor(item: string): boolean {
  return item.startsWith('<div class="sheet-item spr1p-pr"');
}

/**
 * Шрифты листа — до раскладки. paginate.js ждёт document.fonts.ready,
 * но шрифт начинает грузиться, только когда им что-то набрано: KaTeX
 * и заголовки догрузились бы посреди раскладки, текст подрос бы, и
 * обмеренная колонка вылезла бы за край. Поэтому весь поток один раз
 * кладётся в скрытый блок и ждём шрифты ещё раз.
 */
async function shriftyGotovy(items: string[]): Promise<void> {
  const box = document.createElement('div');
  box.setAttribute('aria-hidden', 'true');
  box.style.cssText = 'position:absolute;left:-9999mm;top:0;width:90mm;visibility:hidden';
  box.innerHTML = items.join('');
  document.body.appendChild(box);
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  await document.fonts.ready;
  box.remove();
}

/**
 * Печатный справочник №1 в браузере — конвейер листов генератора
 * (SheetPage1): описание листа собрано на сервере
 * (lib/planimetriya/spravochnik-pdf.ts) и лежит в <script id="spr1-spec">,
 * здесь из него по адресу (?primery=0) снимаются разборы, раскладку
 * делает paginate.js, затем открывается окно печати: «Сохранить как PDF».
 */
export function SpravochnikPdf1({
  fayly,
  teoriya,
  zadanie,
}: {
  fayly: { sPrimerami: PdfSpravochnika; bezPrimerov: PdfSpravochnika };
  /** Вкладка «Теория» и раздел задания №1: «Назад» и хлебные крошки. */
  teoriya: string;
  zadanie: string;
}) {
  const query = useSearchParams();
  const sPrimerami = query.get('primery') !== '0';
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.sheetTheme = 'color';
    root.dataset.sheetLayout = 'single';
    return () => {
      delete root.dataset.sheetTheme;
      delete root.dataset.sheetLayout;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    import('@/lib/sheet/paginate.js')
      .then(async () => {
        const istochnik = document.getElementById('spr1-spec');
        if (!alive || istochnik === null) return;
        const spec = JSON.parse(istochnik.textContent ?? '{}') as { items: string[] };
        if (!sPrimerami) spec.items = spec.items.filter((x) => !razbor(x));
        await shriftyGotovy(spec.items);
        if (!alive) return;
        let s = document.getElementById('sheet-spec');
        if (s === null) {
          s = document.createElement('script');
          s.id = 'sheet-spec';
          s.setAttribute('type', 'application/json');
          document.body.appendChild(s);
        }
        s.textContent = JSON.stringify(spec).replace(/<\//g, '<\\/');
        window.sheetPagination = undefined;
        window.sheetPaginate?.();
        timer = window.setInterval(() => {
          if (window.sheetPagination !== undefined) {
            window.clearInterval(timer);
            setDone(true);
            if (window.sheetPagination.error === undefined) window.print();
          }
        }, 100);
      })
      .catch((e: unknown) => {
        window.sheetPagination = { error: String(e) };
      });
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [sPrimerami]);

  return (
    <>
      <Nazad1 teoriya={teoriya} zadanie={zadanie} />
      <div className="z1-print-bar spr1p-bar" data-print-bar>
        <span className="spr1p-bar__vybor" role="group" aria-label={PDF.vybor}>
          <a className="spr1p-bar__var" href="./" aria-current={sPrimerami ? 'true' : undefined}>
            {PDF.sPrimerami}
          </a>
          <a
            className="spr1p-bar__var"
            href="./?primery=0"
            aria-current={sPrimerami ? undefined : 'true'}
          >
            {PDF.bezPrimerov}
          </a>
        </span>
        <SkachatPdf1 fayly={fayly} sPrimerami={sPrimerami} />
        <span className="spr1p-bar__pechat">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.print()}
            disabled={!done}
          >
            {done ? PDF.knopka : PDF.gotovim}
          </button>
          <span className="z1-print-bar__lead">{PDF.lead}</span>
        </span>
      </div>
      <div id="sheet-measure" />
      <div id="sheet-pages" />
    </>
  );
}
