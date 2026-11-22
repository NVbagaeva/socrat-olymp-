'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HELP, HOWTO_HREF } from '@/content/onboarding';
import { useDismiss } from '@/lib/dismiss';
import { requestIntro, useOnboarding } from '@/lib/onboarding';
import { TourButtons } from './TourButtons';

/**
 * Кнопка «?» в правом нижнем углу: туры (начать, продолжить с того же
 * шага, начать заново) и инструкция. Пока идёт тур,
 * кнопки нет — тур закрывается своим крестиком. На телефоне в кабинете
 * кнопка стоит над нижней панелью навигации (onboarding.css).
 *
 * Место кнопки — только CSS (position: fixed и токены --fab-*), JS
 * координат не считает. Кнопка выводится порталом прямо в body: внутри
 * предка с transform, filter или backdrop-filter fixed прилипает
 * к нему, а не к экрану, и кнопка ездит вместе с ним.
 */
/**
 * Телефон: пока человек листает вниз и читает, кнопка уходит — иначе
 * она лежит поверх карточек (docs/audit-prodazhi.md, E6). Стоит
 * прокрутить вверх или дойти до самого верха — кнопка снова на месте.
 * Скрытие — атрибутом data-skryta, сама прозрачность — в onboarding.css.
 */
function useSkrytPriProkrutke(
  root: React.RefObject<HTMLDivElement | null>,
  open: boolean,
  /** Меняется, когда кнопка появляется после тура: узел новый. */
  tur: unknown,
) {
  useEffect(() => {
    const uzel = root.current;
    const telefon = window.matchMedia('(max-width: 767.98px)');
    let proshlyy = window.scrollY;
    let kadr = 0;
    const obnovit = () => {
      kadr = 0;
      const node = uzel;
      if (!node) return;
      const y = window.scrollY;
      const vniz = y - proshlyy;
      if (Math.abs(vniz) < 8) return;
      const skryt = telefon.matches && !open && vniz > 0 && y > 120;
      node.toggleAttribute('data-skryta', skryt);
      proshlyy = y;
    };
    const onScroll = () => {
      if (kadr === 0) kadr = window.requestAnimationFrame(obnovit);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (kadr !== 0) window.cancelAnimationFrame(kadr);
      uzel?.removeAttribute('data-skryta');
    };
    /* tur — только чтобы взять новый узел после тура. */
  }, [root, open, tur]);
}

export function HelpFab() {
  const state = useOnboarding();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss({ open, onClose: close, menu: root, trigger: button });
  useSkrytPriProkrutke(root, open, state.active);

  if (state.active !== null) return null;

  return createPortal(
    <div className="help-fab" ref={root}>
      {open ? (
        <div className="help-fab__menu" id={menuId} role="menu" aria-label={HELP.title}>
          <TourButtons className="help-fab__item" menuitem onRun={() => setOpen(false)} />
          <button
            type="button"
            role="menuitem"
            className="help-fab__item"
            onClick={() => {
              setOpen(false);
              requestIntro();
            }}
          >
            {HELP.intro}
          </button>
          <Link
            role="menuitem"
            className="help-fab__item"
            href={HOWTO_HREF}
            onClick={() => setOpen(false)}
          >
            {HELP.howto}
          </Link>
        </div>
      ) : null}
      <button
        ref={button}
        type="button"
        className="help-fab__button"
        aria-label={HELP.button}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.4-2.8 4.2" />
          <circle cx="12" cy="18" r="0.6" />
        </svg>
      </button>
    </div>,
    document.body,
  );
}
