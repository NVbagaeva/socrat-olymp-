'use client';

import { useSearchParams } from 'next/navigation';
import { buildDocument } from '@/lib/sheet/sheet.js';
import { buildWork, workSheetSpec } from '@/lib/ves12/build';
import { withPrintFigures } from '@/lib/sheet/figureRules.js';
import { codeOutdated, parseWorkQuery } from '@/lib/ves12/work';
import type { Ves12Catalog } from '@/lib/ves12/types';
import { zachyotText } from '@/content/ves12';
import { PrintSheet } from '../generator/PrintSheet';

export interface ZachyotSheetProps {
  catalog: Ves12Catalog;
  /** Лист учителя: варианты, таблица ответов, шкала, решения. */
  withAnswers: boolean;
}

/**
 * Зачётная работа для печати: все варианты из адреса работы. Лист
 * ученика и лист учителя по одному адресу содержат одни и те же задачи.
 */
export function ZachyotSheet({ catalog, withAnswers }: ZachyotSheetProps) {
  const query = useSearchParams();
  return (
    <PrintSheet
      theme="color"
      layout="single"
      buildKey={`${withAnswers}:${query.toString()}`}
      build={() => {
        const params = parseWorkQuery(query);
        if (params === null) {
          return null;
        }
        /* Рисунки — в печатном профиле (figureRules.js): клетка 7 мм,
           подписи не мельче 10 pt. Задачи от профиля не зависят. */
        const spec = withPrintFigures(() =>
          workSheetSpec(params, buildWork(params, catalog), withAnswers),
        );
        return {
          html: buildDocument({ ...spec, kit: `Работа ${params.code}` }, {}),
          warning: codeOutdated(params.code) ? zachyotText.outdated : null,
        };
      }}
    />
  );
}
