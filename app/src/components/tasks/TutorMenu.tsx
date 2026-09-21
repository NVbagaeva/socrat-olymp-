'use client';

import { useCallback, useEffect, useId, useRef } from 'react';
import { useDismiss } from '@/lib/dismiss';
import { NavIcon } from '@/components/ui';
import type { ReactNode, RefObject } from 'react';
import type { TutorMaterial } from '@/content/sections';

export interface TutorMenuProps {
  /** Материалы темы: сколько записано в конфиге, столько и карточек. */
  items: TutorMaterial[];
  /** Подпись кнопки в ленте вкладок. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Лента вкладок: кнопка встаёт последней внутри неё. */
  children: ReactNode;
  /** Узел ленты нужен и снаружи — по нему подводят активную вкладку. */
  stripRef: RefObject<HTMLDivElement | null>;
}

/** Ширина меню на широком экране: примерно две колонки содержимого. */
const MENU_MAX = 560;
/** Отступ носика от края меню: ближе он утыкается в скругление. */
const NOSE_EDGE = 20;
/* Растушёвка по краям ленты: под ней кнопка читалась бы наполовину
   выцветшей, поэтому подводим её с этим отступом. То же число стоит
   в TopicTabs у подводки активной вкладки. */
const STRIP_FADE = 32;

/** Строка вкладок, лента и кнопка — всё берётся от узла меню: на
    первой отрисовке ссылка на обёртку ещё не проставлена. */
function parts(node: HTMLElement) {
  const row = node.parentElement;
  return {
    row,
    strip: row?.querySelector<HTMLElement>('.topic-tabs') ?? null,
    button: row?.querySelector<HTMLElement>('.topic-tabs__more') ?? null,
  };
}

/** Кнопка не должна остаться за кромкой ленты: меню без неё висит
    непонятно от чего. Лента доводится мгновенно — меню появляется
    сразу на месте, без догоняющего сдвига. */
function reveal(strip: HTMLElement, button: HTMLElement): void {
  const box = strip.getBoundingClientRect();
  const rect = button.getBoundingClientRect();
  let shift = 0;
  if (rect.right > box.right - STRIP_FADE) {
    shift = rect.right - box.right + STRIP_FADE;
  } else if (rect.left < box.left + STRIP_FADE) {
    shift = rect.left - box.left - STRIP_FADE;
  }
  if (shift !== 0) {
    strip.scrollBy({ left: shift, behavior: 'auto' });
  }
}

/**
 * Подводка меню под кнопку.
 *
 * Считается в пикселях и пишется прямо в стиль узла: кнопка стоит
 * внутри ленты, которая прокручивается вбок, поэтому её место в строке
 * заранее не известно. За правый край меню не выпускаем — сдвигаем
 * влево, а носик оставляем над кнопкой.
 */
function place(node: HTMLElement): void {
  const { row, button } = parts(node);
  if (row === null || button === null) {
    return;
  }
  const rowBox = row.getBoundingClientRect();
  const btnBox = button.getBoundingClientRect();

  const width = Math.min(MENU_MAX, rowBox.width);
  const start = btnBox.left - rowBox.left;
  const left = Math.max(0, Math.min(start, rowBox.width - width));
  const nose = Math.max(NOSE_EDGE, Math.min(start + btnBox.width / 2 - left, width - NOSE_EDGE));

  node.style.width = `${width}px`;
  node.style.left = `${left}px`;
  node.style.setProperty('--nose', `${nose}px`);
}

/** Лист с текстом и лист с подписью PDF: две иконки материалов. */
function sheet(kind: TutorMaterial['icon']): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      {kind === 'pdf' ? (
        <text x="12" y="17">
          PDF
        </text>
      ) : (
        <path d="M9 13h6M9 16h4" />
      )}
    </svg>
  );
}

/**
 * «Для репетиторов» в ленте вкладок: кнопка и меню под ней.
 *
 * Содержимого у раздела нет — есть два файла для скачивания, и ради
 * них вкладка не открывается. Кнопка стоит на том же, шестом месте
 * ленты, но переключает не панель, а меню под собой.
 *
 * Лента прокручивается вбок и подрезает всё, что из неё торчит,
 * поэтому меню лежит не в ней, а рядом — в общей обёртке строки.
 */
export function TutorMenu({
  items,
  label,
  open,
  onOpenChange,
  children,
  stripRef,
}: TutorMenuProps) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement | null>(null);

  /* Меню считает своё место в момент появления, а не в эффекте: так
     оно встаёт под кнопку сразу, без промежуточного кадра. Ссылка на
     обработчик постоянная — иначе React отцеплял бы узел на каждой
     отрисовке и подводка шла бы по кругу. */
  const attach = useCallback((node: HTMLDivElement | null) => {
    menu.current = node;
    if (node === null) {
      return;
    }
    const { strip, button: more } = parts(node);
    if (strip !== null && more !== null) {
      reveal(strip, more);
    }
    place(node);
  }, []);

  /* Закрытие: Escape, щелчок мимо меню. Переход на другую вкладку
     закрывает его снаружи — там же, где меняется сама вкладка. */
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  useDismiss({ open, onClose: close, menu, trigger: button });

  /* Ширина окна и сдвиг ленты меняют место кнопки: меню идёт за ней,
     а не остаётся висеть в стороне. */
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const again = () => {
      const node = menu.current;
      if (node !== null) {
        place(node);
      }
    };
    const strip = stripRef.current;
    window.addEventListener('resize', again);
    strip?.addEventListener('scroll', again, { passive: true });
    return () => {
      window.removeEventListener('resize', again);
      strip?.removeEventListener('scroll', again);
    };
  }, [open, stripRef]);

  return (
    <div className="topic-tabs-row">
      <div className="topic-tabs" ref={stripRef}>
        {children}
        <button
          type="button"
          className="topic-tabs__more"
          ref={button}
          aria-expanded={open}
          aria-controls={`${id}-menu`}
          onClick={() => onOpenChange(!open)}
        >
          <span className="topic-tabs__more-in">
            <span className="tabs__ico" aria-hidden="true">
              <NavIcon name="materials" />
            </span>
            <span className="tabs__text">{label}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
      </div>

      {open ? (
        <div className="tmenu" id={`${id}-menu`} ref={attach} role="group" aria-label={label}>
          <ul className="tmenu__list">
            {items.map((item) => {
              const inside = (
                <>
                  <span className="tutor-card__icon" aria-hidden="true">
                    {sheet(item.icon)}
                  </span>
                  <span className="tutor-card__text">
                    <span className="tutor-card__title">{item.title}</span>
                    <span className="tutor-card__lead">{item.lead}</span>
                  </span>
                  <span className="tutor-card__go" aria-hidden="true">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path d="M12 4v10m0 0l-4-4m4 4l4-4" />
                      <path d="M5 19h14" />
                    </svg>
                  </span>
                </>
              );

              return (
                <li key={item.id}>
                  {/* Файла ещё нет: карточка приглушена, не ссылка и не
                      берёт фокус — нажимать в ней нечего. */}
                  {item.file === undefined ? (
                    <div className="tutor-card tutor-card--soon" aria-disabled="true">
                      {inside}
                    </div>
                  ) : (
                    <a className="tutor-card" href={item.file} download>
                      {inside}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
