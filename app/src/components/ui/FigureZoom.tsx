'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Modal } from './Modal';
import { PinchZoom } from './PinchZoom';

export interface FigureZoomProps {
  /** Чертёж: элемент движка solid/ или graph/. */
  children: ReactNode;
  /** Чем подписан чертёж: заголовок окна и подпись кнопки. */
  label: string;
  className?: string;
  /**
   * Масштаб двумя пальцами и перетаскивание в окне (PinchZoom). По
   * умолчанию выключен: чертежам тренажёров хватает окна на весь экран.
   */
  pinch?: boolean;
}

/**
 * Чертёж, который открывается на весь экран.
 *
 * Один компонент на оба движка: и стереометрия, и графики отдают
 * SVG, поэтому увеличенный чертёж — тот же самый узел, нарисованный
 * крупнее. Ни данные, ни сами движки для этого не меняются.
 *
 * На телефоне чертёж в карточке — 220 пикселей, и у куба с восемью
 * подписанными вершинами подписи уходят в шесть пикселей. Тап
 * открывает его во весь экран.
 *
 * Окно — общий Modal: от него и перехват фокуса, и закрытие по
 * Escape, по крестику и тапом по фону. Своего окна здесь нет.
 *
 * Масштаб щипком и перетаскивание — по флагу `pinch` (онлайн-вариант:
 * мелкие рисунки на телефоне); без флага окно как было.
 */
export function FigureZoom({ children, label, className, pinch = false }: FigureZoomProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Кнопка, а не div с обработчиком: чертёж должен открываться
          и с клавиатуры, и голосовым управлением. */}
      <button
        type="button"
        className={clsx('figzoom', className)}
        onClick={() => setOpen(true)}
        aria-label={`${label}. Открыть чертёж во весь экран`}
      >
        <ErrorBoundary what="рисунок">{children}</ErrorBoundary>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        className="figzoom-modal"
        closeLabel="Закрыть чертёж"
        title={label}
      >
        {/* Тот же чертёж, нарисованный крупнее: штриховые линии
            остаются штриховыми, подписи — подписями, потому что это
            вектор, а не увеличенная картинка. */}
        {pinch ? (
          <PinchZoom>
            <span className="figzoom__big">
              <ErrorBoundary what="рисунок">{children}</ErrorBoundary>
            </span>
          </PinchZoom>
        ) : (
          <span className="figzoom__big">
            <ErrorBoundary what="рисунок">{children}</ErrorBoundary>
          </span>
        )}
      </Modal>
    </>
  );
}
