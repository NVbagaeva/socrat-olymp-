'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';

export interface FigureZoomProps {
  /** Чертёж: элемент движка solid/ или graph/. */
  children: ReactNode;
  /** Чем подписан чертёж: заголовок окна и подпись кнопки. */
  label: string;
  className?: string;
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
 * Масштаб щипком и перетаскивание сюда намеренно не входят: чертёж
 * и так занимает весь экран, а жесты — отдельная работа.
 */
export function FigureZoom({ children, label, className }: FigureZoomProps) {
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
        {children}
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
        <span className="figzoom__big">{children}</span>
      </Modal>
    </>
  );
}
