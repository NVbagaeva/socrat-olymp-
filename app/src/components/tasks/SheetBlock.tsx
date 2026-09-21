import type { ReactNode } from 'react';
import { Solid } from '@/components/solid/Solid';
import { FigureZoom } from '@/components/ui';
import type { SheetItem } from '@/content/shpargalki';
import type { AtomVykladki } from '@/lib/tex';
import { formulaKey } from '@/lib/zadanie3/formulas';
import { VykladkaKlient } from './veroyatnost/VykladkaKlient';
/* Напрямую из sheets, а не из сборного drawings: тот собирает
   чертежи разделов из данных прототипов и тянет за собой весь
   банк — вместе с формулами ответов и разборами. */
import { SHEETS } from '@/lib/solid/drawings/sheets';

export interface SheetBlockProps {
  items: readonly SheetItem[];
  /**
   * Формулы, свёрстанные KaTeX на сборке: ключ — сама запись в TeX.
   * В браузер уходит готовая разметка, а не библиотека.
   */
  formulas: Record<string, string>;
  /**
   * Блочные формулы выкладкой: атомы со знаками. Строки из них
   * собирает браузер по ширине колонки — правилом тетради, тем же,
   * что у разборов задач.
   */
  vykladki: Record<string, AtomVykladki[][]>;
}

function Formula({ tex, html }: { tex: string; html?: string }) {
  if (html === undefined) {
    /* Формулы нет в наборе — значит её забыли свёрстать. Молчать
       нельзя: на странице останется пустое место. */
    throw new Error(`Формула не свёрстана: ${tex}`);
  }
  return <span className="sheet__formula" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Блок «Что нужно помнить»: пункты шпаргалки с чертежами.
 *
 * Текст пунктов — авторский, из домашней работы; формулы набраны
 * KaTeX; чертежи рисует движок solid/ по тем же моделям, что и банк
 * чертежей. Ничего из этого здесь не сочиняется.
 */
export function SheetBlock({ items, formulas, vykladki }: SheetBlockProps): ReactNode {
  return (
    <ul className="sheet">
      {items.map((item, index) => {
        const model = item.chertezh === undefined ? undefined : SHEETS[item.chertezh];
        if (item.chertezh !== undefined && model === undefined) {
          throw new Error(`Нет чертежа ${item.chertezh}`);
        }
        return (
          <li className="sheet__item" key={index}>
            {model !== undefined ? (
              <FigureZoom className="sheet__fig" label={model.alt}>
                <Solid model={model} />
              </FigureZoom>
            ) : null}
            <span className="sheet__text">
              {item.pieces.map((piece, k) => {
                if (piece.kind === 'текст') {
                  return <span key={k}>{piece.value}</span>;
                }
                if (piece.kind === 'формула-строкой') {
                  const vykladka = vykladki[piece.value];
                  if (vykladka === undefined) {
                    throw new Error(`Формула не разобрана на атомы: ${piece.value}`);
                  }
                  return (
                    <VykladkaKlient key={k} className="sheet__formula--block" vykladka={vykladka} />
                  );
                }
                return (
                  <Formula
                    key={k}
                    tex={piece.value}
                    html={formulas[formulaKey(piece.value, false)]}
                  />
                );
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
