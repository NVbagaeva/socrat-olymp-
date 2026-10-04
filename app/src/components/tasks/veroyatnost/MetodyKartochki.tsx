'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';
import { markSectionRead } from '@/lib/theoryRead';
import { READ_DWELL_MS } from '@/lib/topicProgress';

/** Куда метод ведёт тренироваться: адрес, счётчик и, если тренировок
    несколько, название набора — иначе кнопки не различить. */
export interface TrenirovkaMetoda {
  href: string;
  /** Строка счётчика «задач в банке: N» — посчитана на сервере. */
  schet: string;
  /** Название набора. Не задано — строка счётчика идёт одна. */
  nazvanie?: ReactNode;
}

/** Карточка метода, собранная на сервере: формула уже набрана KaTeX. */
export interface KartochkaMetoda {
  id: string;
  nomer: number;
  /** Название: строка или уже набранная формулами разметка. */
  nazvanie: ReactNode;
  /** Название обычным текстом — для подписи кнопки (aria-label). */
  nazvanieText?: string;
  opisanie: ReactNode;
  /** Плашка с формулой; null — у метода формулы нет. */
  formula: ReactNode | null;
  /**
   * Тренировки метода: обычно одна, но метод может отрабатываться
   * несколькими наборами — тогда у каждого своя кнопка и свой счётчик.
   */
  trenirovki: TrenirovkaMetoda[];
  /**
   * Содержимое четырёх блоков окна по ключам разделов. Ключа нет —
   * в блоке стоит «Материал готовится», как было у №4 и №5 до того,
   * как автор пришлёт тексты.
   */
  bloki?: Partial<Record<keyof typeof METODY_KARTOCHKI.modal.razdely, ReactNode>>;
}

export interface MetodyKartochkiProps {
  items: readonly KartochkaMetoda[];
  /**
   * Ключ прочитанных методов: «methods:12:rational». Метод отмечается
   * прочитанным, когда его окно было открыто не меньше READ_DWELL_MS и
   * прокручено до конца. Не задан — ничего не отмечается (задания №4
   * и №5).
   */
  trackKey?: string;
}

/** Ближайший предок с собственной прокруткой — тело окна. */
function scroller(node: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = node.parentElement;
  while (current !== null) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Следит за открытым окном метода: время открытия и дочитано ли до
 * конца. Окно без прокрутки дочитано сразу, ему нужно только время.
 */
function useReadWatch(id: string | null, body: RefObject<HTMLDivElement | null>, trackKey?: string) {
  useEffect(() => {
    if (id === null || trackKey === undefined) {
      return undefined;
    }
    const key = trackKey;
    const metod = id;
    const opened = performance.now();
    let ended = false;
    let fired = false;

    function check() {
      const node = body.current;
      if (node === null || fired) {
        return;
      }
      const box = scroller(node) ?? document.documentElement;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) {
        ended = true;
      }
      if (ended && performance.now() - opened >= READ_DWELL_MS) {
        fired = true;
        markSectionRead(key, metod);
      }
    }

    const timer = window.setInterval(check, 500);
    /* Прокрутка внутри окна до window не всплывает: слушаем захватом. */
    document.addEventListener('scroll', check, { capture: true, passive: true });
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('scroll', check, { capture: true });
    };
  }, [id, body, trackKey]);
}

/**
 * Сетка карточек методов и модалка метода — вкладка «Ключевые методы
 * решения» заданий №4 и №5.
 *
 * Карточка — кнопка: номер в кружке, название, подпись и, где есть,
 * формула в плашке. По нажатию открывается модалка с четырьмя
 * блоками — «Как узнать такую задачу», «Алгоритм», «Разобранный
 * пример», «Типичная ошибка». У заданий №4 и №5 текстов блоков пока
 * нет, и в каждом стоит «Материал готовится»; подтема «Квадратичная
 * функция» передаёт готовые тексты. Ниже — счётчик задач банка и
 * кнопка тренировки: одна или несколько, если метод отрабатывается
 * не одним набором.
 *
 * Все слова — из content/veroyatnost-metody.ts, сами методы — из
 * lib/veroyatnost/metody4.ts и metody5.ts через страницу; в разметке
 * строк нет.
 */
/**
 * Подвал окна метода: счётчик задач и кнопка тренировки.
 *
 * Тренировка одна — строка счётчика и кнопка стоят так же, как
 * стояли у заданий №4 и №5: разметка та же до последнего класса.
 * Тренировок несколько — каждая идёт своей строкой с названием
 * набора, чтобы кнопки различались не только порядком.
 */
function Podval({ trenirovki }: { trenirovki: TrenirovkaMetoda[] }) {
  const { modal } = METODY_KARTOCHKI;
  const odna = trenirovki[0];

  if (trenirovki.length <= 1) {
    return odna === undefined ? null : (
      <>
        <span className="vmetod-modal__schet">{odna.schet}</span>
        <Link className="btn btn--primary" href={odna.href}>
          {modal.trenirovka}
        </Link>
      </>
    );
  }

  return (
    <ul className="vmetod-modal__trenirovki">
      {trenirovki.map((item) => (
        <li className="vmetod-modal__trenirovka" key={item.href}>
          <span className="vmetod-modal__schet">
            {item.nazvanie === undefined ? null : (
              <span className="vmetod-modal__nabor">{item.nazvanie}</span>
            )}
            {item.schet}
          </span>
          <Link className="btn btn--primary" href={item.href}>
            {modal.trenirovka}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function MetodyKartochki({ items, trackKey }: MetodyKartochkiProps) {
  const [otkryt, setOtkryt] = useState<string | null>(null);
  const body = useRef<HTMLDivElement | null>(null);
  useReadWatch(otkryt, body, trackKey);
  const tekushchiy = items.find((m) => m.id === otkryt) ?? null;
  const { modal } = METODY_KARTOCHKI;

  return (
    <>
      <ul className="vmetody__grid">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className="vmetod"
              onClick={() => setOtkryt(m.id)}
              aria-haspopup="dialog"
              aria-label={`${METODY_KARTOCHKI.otkryt}: ${m.nazvanieText ?? (typeof m.nazvanie === 'string' ? m.nazvanie : '')}`}
            >
              <span className="vmetod__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="vmetod__title">{m.nazvanie}</span>
              <span className="vmetod__sut">{m.opisanie}</span>
              {m.formula === null ? null : <span className="vmetod__formula">{m.formula}</span>}
            </button>
          </li>
        ))}
      </ul>

      <Modal
        open={tekushchiy !== null}
        onClose={() => setOtkryt(null)}
        title={
          tekushchiy === null ? (
            ''
          ) : (
            <span className="vmetod-modal__title">
              <span className="vmetod__no" aria-hidden="true">
                {tekushchiy.nomer}
              </span>
              {tekushchiy.nazvanie}
            </span>
          )
        }
        description={tekushchiy?.opisanie}
        closeLabel={modal.zakryt}
        className="vmetod-modal"
        footer={tekushchiy === null ? undefined : <Podval trenirovki={tekushchiy.trenirovki} />}
      >
        {tekushchiy === null ? null : (
          <div className="vmetod-modal__body" ref={body}>
            {tekushchiy.formula === null ? null : (
              <div className="vmetod__formula vmetod-modal__formula">{tekushchiy.formula}</div>
            )}
            {(Object.keys(modal.razdely) as (keyof typeof modal.razdely)[]).map((klyuch) => (
              <section key={klyuch} className="vmetod-modal__block">
                <h3 className="vmetod-modal__sub">{modal.razdely[klyuch]}</h3>
                {tekushchiy.bloki?.[klyuch] ?? (
                  <p className="vmetod-modal__soon">{modal.gotovitsya}</p>
                )}
              </section>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
