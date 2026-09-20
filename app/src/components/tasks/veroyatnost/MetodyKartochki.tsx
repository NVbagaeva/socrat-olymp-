'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui';
import { METODY_KARTOCHKI } from '@/content/veroyatnost-metody';

/** Карточка метода, собранная на сервере: формула уже набрана KaTeX. */
export interface KartochkaMetoda {
  id: string;
  nomer: number;
  nazvanie: string;
  opisanie: string;
  /** Плашка с формулой; null — у метода формулы нет. */
  formula: ReactNode | null;
  /** Строка счётчика «задач в банке: N» — посчитана на сервере. */
  schet: string;
  /** Адрес тренажёра: с уже выбранным этим методом, если такой ярлык есть. */
  href: string;
}

export interface MetodyKartochkiProps {
  items: readonly KartochkaMetoda[];
}

/**
 * Сетка карточек методов и модалка метода — вкладка «Ключевые методы
 * решения» заданий №4 и №5.
 *
 * Карточка — кнопка: номер в кружке, название, подпись и, где есть,
 * формула в плашке. По нажатию открывается модалка с четырьмя
 * блоками — «Как узнать такую задачу», «Алгоритм», «Разобранный
 * пример», «Типичная ошибка». Тексты блоков автор пришлёт отдельно,
 * пока в каждом стоит «Материал готовится». Ниже — счётчик задач
 * банка по методу и ссылка на тренажёр с этим методом.
 *
 * Все слова — из content/veroyatnost-metody.ts, сами методы — из
 * lib/veroyatnost/metody4.ts и metody5.ts через страницу; в разметке
 * строк нет.
 */
export function MetodyKartochki({ items }: MetodyKartochkiProps) {
  const [otkryt, setOtkryt] = useState<string | null>(null);
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
              aria-label={`${METODY_KARTOCHKI.otkryt}: ${m.nazvanie}`}
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
        footer={
          tekushchiy === null ? undefined : (
            <>
              <span className="vmetod-modal__schet">{tekushchiy.schet}</span>
              <Link className="btn btn--primary" href={tekushchiy.href}>
                {modal.trenirovka}
              </Link>
            </>
          )
        }
      >
        {tekushchiy === null ? null : (
          <div className="vmetod-modal__body">
            {tekushchiy.formula === null ? null : (
              <div className="vmetod__formula vmetod-modal__formula">{tekushchiy.formula}</div>
            )}
            {Object.values(modal.razdely).map((razdel) => (
              <section key={razdel} className="vmetod-modal__block">
                <h3 className="vmetod-modal__sub">{razdel}</h3>
                <p className="vmetod-modal__soon">{modal.gotovitsya}</p>
              </section>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
