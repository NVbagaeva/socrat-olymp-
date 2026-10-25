'use client';

import { useSearchParams } from 'next/navigation';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { parseSheetQuery, sheetSpec } from '@/lib/generatorSheet';
import { withPrintFigures } from '@/lib/sheet/figureRules.js';
import { sheetWithSpace, spaceOfQuery } from '@/lib/sheetSpace';
import { checkKitSheet, kitFootLabel } from '@/lib/komplekt';
import { PrintSheet } from '@/components/tasks/generator/PrintSheet';

export interface SheetPageProps {
  /** Лист с ответами: те же задачи и раздел «Ответы» в конце. */
  withAnswers: boolean;
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
export function SheetPage({ withAnswers, subtopic }: SheetPageProps) {
  const query = useSearchParams();
  const params = parseSheetQuery(query);
  return (
    <PrintSheet
      theme={params.theme}
      layout={params.layout}
      buildKey={`${withAnswers}:${subtopic ?? ''}:${query.toString()}`}
      build={() => {
        if (params.skills.length === 0) {
          return null;
        }
        const built = sheetSpec(params, withAnswers, subtopic);
        /* Код комплекта — в колонтитул; отпечаток условий — в «Мои комплекты». */
        const kit = checkKitSheet(query, '12', withAnswers ? 'teacher' : 'student', built);
        /* На лист — сборка в печатном профиле рисунков (figureRules.js):
           отпечаток комплекта — по обычной, как у напечатанных раньше. */
        /* Место для решения (sp=) — только у листа ученика. */
        const printed = sheetWithSpace(
          withPrintFigures(() => sheetSpec(params, withAnswers, subtopic)),
          spaceOfQuery(query),
          !withAnswers,
          () => sheetSpec(params, true, subtopic),
        );
        return {
          html: buildDocument({ ...printed, kit: kitFootLabel(kit.code) }, {}),
          warning: kit.warning,
        };
      }}
    />
  );
}
