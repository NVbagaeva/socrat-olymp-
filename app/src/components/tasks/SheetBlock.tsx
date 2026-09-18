import type { ReactNode } from 'react';
import { Solid } from '@/components/solid/Solid';
import type { SheetItem } from '@/content/shpargalki';
import { SHEETS } from '@/lib/solid/drawings';

export interface SheetBlockProps {
  items: readonly SheetItem[];
  /**
   * Формулы, свёрстанные KaTeX на сборке: ключ — сама запись в TeX.
   * В браузер уходит готовая разметка, а не библиотека.
   */
  formulas: Record<string, string>;
}

function Formula({ tex, html, display }: { tex: string; html?: string; display: boolean }) {
  if (html === undefined) {
    /* Формулы нет в наборе — значит её забыли свёрстать. Молчать
       нельзя: на странице останется пустое место. */
    throw new Error(`Формула не свёрстана: ${tex}`);
  }
  const className = display ? 'sheet__formula sheet__formula--block' : 'sheet__formula';
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Блок «Что нужно помнить»: пункты шпаргалки с чертежами.
 *
 * Текст пунктов — авторский, из домашней работы; формулы набраны
 * KaTeX; чертежи рисует движок solid/ по тем же моделям, что и банк
 * чертежей. Ничего из этого здесь не сочиняется.
 */
export function SheetBlock({ items, formulas }: SheetBlockProps): ReactNode {
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
              <span className="sheet__fig">
                <Solid model={model} />
              </span>
            ) : null}
            <span className="sheet__text">
              {item.pieces.map((piece, k) =>
                piece.kind === 'текст' ? (
                  <span key={k}>{piece.value}</span>
                ) : (
                  <Formula
                    key={k}
                    tex={piece.value}
                    html={formulas[piece.value]}
                    display={piece.kind === 'формула-строкой'}
                  />
                ),
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
