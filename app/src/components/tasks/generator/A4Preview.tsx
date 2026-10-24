'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './a4-preview.css';

/** Ширина и высота листа A4 при 96 точках на дюйм. */
const A4_W = 794;
const A4_H = 1123;

/**
 * Лист в своей ширине (A4), уменьшенный под ширину места: на телефоне
 * видна вся страница целиком — маленькая копия печатного листа, без
 * прокрутки вбок и обрезки. Масштаб считается по ширине контейнера
 * (ResizeObserver), высота контейнера — высота листа после масштаба.
 * Увеличение — двумя пальцами (масштаб страницы браузера не запрещён)
 * и кнопкой «Во весь экран»: лист на весь экран по страницам A4 с
 * листанием «Назад / Дальше».
 */
function useMasshtab(shirina: number) {
  const outer = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [razmer, setRazmer] = useState<{ k: number; h: number }>({ k: 1, h: 0 });
  useEffect(() => {
    const o = outer.current;
    const p = page.current;
    if (o === null || p === null) return;
    const izmerit = () => {
      const k = Math.min(1, o.clientWidth / shirina);
      setRazmer({ k, h: p.offsetHeight * k });
    };
    const ro = new ResizeObserver(izmerit);
    ro.observe(o);
    ro.observe(p);
    return () => ro.disconnect();
  }, [shirina]);
  return { outer, page, ...razmer };
}

function List({ children, className }: { children: ReactNode; className?: string }) {
  const { outer, page, k, h } = useMasshtab(A4_W);
  return (
    <div ref={outer} className="a4p__mesto" style={h > 0 ? { height: h } : undefined}>
      <div
        ref={page}
        className={clsx('a4p__list', className)}
        style={{ width: A4_W, transform: `scale(${k})` }}
      >
        {children}
      </div>
    </div>
  );
}

function VesEkran({
  children,
  className,
  onClose,
}: {
  children: ReactNode;
  className?: string;
  onClose: () => void;
}) {
  const { outer, page, k, h } = useMasshtab(A4_W);
  const scroller = useRef<HTMLDivElement>(null);
  const [str, setStr] = useState(0);
  const vsego = Math.max(1, Math.ceil(h / (A4_H * k || 1)));

  useEffect(() => {
    const prezhniy = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', esc);
    return () => {
      document.body.style.overflow = prezhniy;
      window.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  function kStranitse(n: number) {
    const s = scroller.current;
    if (s === null) return;
    const i = Math.min(vsego - 1, Math.max(0, n));
    s.scrollTo({ top: i * A4_H * k, behavior: 'smooth' });
  }

  return createPortal(
    <div className="a4p-ekran" role="dialog" aria-modal="true" aria-label="Лист во весь экран">
      <div className="a4p-ekran__bar">
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => kStranitse(str - 1)}
          disabled={str <= 0}
        >
          ← Назад
        </button>
        <span className="a4p-ekran__str">
          Стр. {str + 1} из {vsego}
        </span>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => kStranitse(str + 1)}
          disabled={str >= vsego - 1}
        >
          Дальше →
        </button>
        <button
          type="button"
          className="btn btn--primary btn--sm a4p-ekran__close"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
      <div
        ref={scroller}
        className="a4p-ekran__scroll"
        onScroll={(e) => setStr(Math.round(e.currentTarget.scrollTop / (A4_H * k || 1)))}
      >
        <div ref={outer} className="a4p__mesto" style={h > 0 ? { height: h } : undefined}>
          <div
            ref={page}
            className={clsx('a4p__list a4p__list--stranicy', className)}
            style={{
              width: A4_W,
              transform: `scale(${k})`,
              backgroundSize: `100% ${A4_H}px`,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function A4Preview({
  children,
  className,
  label = 'Во весь экран',
}: {
  children: ReactNode;
  /** Класс листа: оформление задач внутри (gv2-a4, z11-a4). */
  className?: string;
  label?: string;
}) {
  const [ekran, setEkran] = useState(false);
  const zakryt = useCallback(() => setEkran(false), []);
  return (
    <div className="a4p">
      <List className={className}>{children}</List>
      <button type="button" className="a4p__open" onClick={() => setEkran(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
        </svg>
        {label}
      </button>
      {ekran ? (
        <VesEkran className={className} onClose={zakryt}>
          {children}
        </VesEkran>
      ) : null}
    </div>
  );
}
