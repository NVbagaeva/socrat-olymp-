import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SpravochnikPdf1 } from '@/components/tasks/planimetriya/spravochnik/SpravochnikPdf1';
import { SPRAVOCHNIK_1 } from '@/content/spravochnik1/tipy';
import { zadanie1Title } from '@/content/zadanie1';
import { specSpravochnika1 } from '@/lib/planimetriya/spravochnik-pdf';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/planimetriya/planimetriya.css';
import '../pechat1.css';
import './spravochnik1-pdf.css';

export const metadata: Metadata = {
  title: zadanie1Title(SPRAVOCHNIK_1.title),
  robots: { index: false },
};

/**
 * «Скачать PDF» справочника по планиметрии: лист A4 книжный в две
 * колонки через конвейер листов генератора. Описание листа (карточки
 * с формулами KaTeX и чертежами движка) собирается на сборке; с
 * примерами или без — по адресу (?primery=0), раскладка и окно печати
 * — в браузере. Оболочки сайта нет.
 */
export default function Spravochnik1PdfPage() {
  return (
    <>
      <script
        id="spr1-spec"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: specSpravochnika1() }}
      />
      <Suspense fallback={null}>
        <SpravochnikPdf1 />
      </Suspense>
    </>
  );
}
