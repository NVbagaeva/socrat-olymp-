'use client';

import { clsx } from 'clsx';
import { useRef, useSyncExternalStore, type ReactNode } from 'react';
import { IkMinus, IkPlyus, IkPovorot, IkSverkhu } from '../metodika/Ikonki';
import { useVrashchenie, ZUM_MAX, ZUM_MIN, type Vid } from './useVrashchenie';
import './vrashchenie.css';

export const SLOVA_VIDA = {
  plus: 'Крупнее',
  minus: 'Мельче',
  sbrosit: 'Сбросить вид',
  sverhu: 'Вид сверху',
  sboku: 'Вид сбоку',
  palcem: 'Крутите фигуру пальцем',
  myshyu: 'Крутите фигуру мышью',
  oblast: (alt: string) =>
    `${alt}. Фигуру можно вращать: перетащите её, стрелки клавиатуры, «+» и «−» — масштаб.`,
};

export interface VrashchaemyyChertezhProps {
  /** Ракурс по умолчанию. */
  az: number;
  el: number;
  /** Новый вид — перерисовать кадр. Масштаб применяется сам (CSS), кадр его не учитывает. */
  onVid: (vid: Vid) => void;
  /** Описание фигуры для читалки. */
  alt: string;
  /** Без кнопки «Сверху»: плоская сцена или вид сверху бессмыслен. */
  bezSverkhu?: boolean;
  /** Кадр чертежа: SVG или слой с подписями. */
  children: ReactNode;
  className?: string;
  /** Под областью чертежа: кнопки шагов, переключатели. */
  pod?: ReactNode;
}

function podpiskaNaUkazatel(izmenilos: () => void): () => void {
  const mq = window.matchMedia('(pointer: coarse)');
  mq.addEventListener('change', izmenilos);
  return () => mq.removeEventListener('change', izmenilos);
}

/**
 * Окно вращаемого чертежа: область жестов, масштаб, кнопки вида в
 * одном месте (столбик справа: «+», «−», «Сбросить вид», «Сверху») и
 * подсказка «Крутите фигуру пальцем» до первого поворота. Кадр рисует
 * владелец чертежа в onVid; здесь — только жесты и рамка.
 */
export function VrashchaemyyChertezh({
  az,
  el,
  onVid,
  alt,
  bezSverkhu = false,
  children,
  className,
  pod,
}: VrashchaemyyChertezhProps) {
  const oblast = useRef<HTMLDivElement>(null);
  const v = useVrashchenie({ oblast, az, el, onVid });
  const palec = useSyncExternalStore(
    podpiskaNaUkazatel,
    () => window.matchMedia('(pointer: coarse)').matches,
    () => true,
  );
  return (
    <div className={clsx('vr', className)}>
      <div className="vr__okno">
        <div
          ref={oblast}
          className="vr__oblast"
          role="group"
          tabIndex={0}
          aria-label={SLOVA_VIDA.oblast(alt)}
          onKeyDown={v.onKeyDown}
        >
          <div className="vr__kholst" style={{ transform: `scale(${v.vid.zum})` }}>
            {children}
          </div>
        </div>
        <div className="vr__knopki" role="group" aria-label="Вид чертежа">
          <button
            type="button"
            className="vr__btn"
            aria-label={SLOVA_VIDA.plus}
            title={SLOVA_VIDA.plus}
            disabled={v.vid.zum >= ZUM_MAX - 1e-6}
            onClick={v.plus}
          >
            <IkPlyus />
          </button>
          <button
            type="button"
            className="vr__btn"
            aria-label={SLOVA_VIDA.minus}
            title={SLOVA_VIDA.minus}
            disabled={v.vid.zum <= ZUM_MIN + 1e-6}
            onClick={v.minus}
          >
            <IkMinus />
          </button>
          <button
            type="button"
            className="vr__btn"
            aria-label={SLOVA_VIDA.sbrosit}
            title={SLOVA_VIDA.sbrosit}
            disabled={!v.izmenyon}
            onClick={v.sbrosit}
          >
            <IkPovorot />
          </button>
          {bezSverkhu ? null : (
            <button
              type="button"
              className={clsx('vr__btn', v.sverkhu && 'is-on')}
              aria-label={v.sverkhu ? SLOVA_VIDA.sboku : SLOVA_VIDA.sverhu}
              aria-pressed={v.sverkhu}
              title={v.sverkhu ? SLOVA_VIDA.sboku : SLOVA_VIDA.sverhu}
              onClick={v.sverhu}
            >
              <IkSverkhu />
            </button>
          )}
        </div>
      </div>
      <p className={clsx('vr__podskazka', v.povernul && 'is-hidden')} aria-hidden={v.povernul}>
        {palec ? SLOVA_VIDA.palcem : SLOVA_VIDA.myshyu}
      </p>
      {pod}
    </div>
  );
}
