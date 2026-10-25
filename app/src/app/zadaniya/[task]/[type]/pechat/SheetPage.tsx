'use client';

import { useSearchParams } from 'next/navigation';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { parseSheetQuery, sheetSpec, sheetSpecVse } from '@/lib/generatorSheet';
import { adresListaUchenika, qrSvg } from '@/lib/generator/qr';
import { checkKitSheet, kitFootLabel } from '@/lib/komplekt';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';

export interface SheetPageProps {
  /** Лист с ответами: те же задачи и раздел «Ответы» в конце. */
  withAnswers: boolean;
  /** «Всё одним файлом» генератора: листы ученика, затем учителя. */
  vse?: boolean;
  /** Название подтемы в шапке листа. */
  subtopic?: string;
}

/**
 * Лист генератора для печати, собранный в браузере.
 *
 * Адрес страницы можно открыть повторно — лист будет тем же. Код
 * комплекта из адреса (kit) печатается в колонтитуле; по «Скачать оба»
 * (oba=1) после печати открывается лист учителя того же комплекта.
 * Сам ход сборки и печати — общий (PrintSheet).
 */
export function SheetPage({ withAnswers, vse = false, subtopic }: SheetPageProps) {
  const query = useSearchParams();
  const params = parseSheetQuery(query);
  return (
    <PrintSheet
      theme={params.theme}
      layout={params.layout}
      buildKey={`${withAnswers}:${vse}:${subtopic ?? ''}:${query.toString()}`}
      build={() => {
        if (params.skills.length === 0) {
          return null;
        }
        const sobrat = (svg: string | undefined) => {
          const built = vse
            ? sheetSpecVse(params, subtopic, svg)
            : sheetSpec(params, withAnswers, subtopic, svg);
          /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
          const kit = checkKitSheet(query, '12', withAnswers || vse ? 'teacher' : 'student', built);
          return { html: buildDocument({ ...built, kit: kitFootLabel(kit.code) }, {}), warning: kit.warning };
        };
        /* QR-код («Дополнительно» генератора) ведёт на лист ученика того же набора. */
        if (params.qr !== true) {
          return sobrat(undefined);
        }
        return qrSvg(adresListaUchenika(window.location.href))
          .catch(() => undefined)
          .then(sobrat);
      }}
    />
  );
}
