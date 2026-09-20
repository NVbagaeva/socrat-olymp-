'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui';
import { METODY_02_5 } from '@/content/veroyatnost-metody';

/** Карточка метода, собранная на сервере: формула уже набрана KaTeX. */
export interface Kartochka5 {
  id: string;
  nomer: number;
  nazvanie: string;
  opisanie: string;
  /** Плашка с формулой; null — у метода формулы нет. */
  formula: ReactNode | null;
  /** Строка счётчика «задач в банке: N» — посчитана на сервере. */
  schet: string;
  /** Адрес тренажёра с уже выбранным этим методом. */
  href: string;
}

export interface MetodyKartochki5Props {
  items: readonly Kartochka5[];
}

/**
 * Сетка карточек методов задания №5 и модалка метода.
 *
 * Карточка — кнопка: номер в кружке, название, подпись и, где есть,
 * формула в плашке. По нажатию открывается модалка с четырьмя
 * блоками — «Как узнать такую задачу», «Алгоритм», «Разобранный
 * пример», «Типичная ошибка». Тексты блоков автор пришлёт отдельно,
 * пока в каждом стоит «Материал готовится». Ниже — счётчик задач
 * банка по методу и ссылка на тренажёр с этим методом.
 *
 * Все слова — из content/veroyatnost-metody.ts, сами методы — из
 * lib/veroyatnost/metody5.ts через страницу; в разметке строк нет.
 */
export function MetodyKartochki5({ items }: MetodyKartochki5Props) {
  const [otkryt, setOtkryt] = useState<string | null>(null);
  const tekushchiy = items.find((m) => m.id === otkryt) ?? null;
  const { modal } = METODY_02_5;

  return (
    <>
      <ul className="z5-metody__grid">
        {items.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className="z5-metod"
              onClick={() => setOtkryt(m.id)}
              aria-haspopup="dialog"
              aria-label={`${METODY_02_5.otkryt}: ${m.nazvanie}`}
            >
              <span className="z5-metod__no" aria-hidden="true">
                {m.nomer}
              </span>
              <span className="z5-metod__title">{m.nazvanie}</span>
              <span className="z5-metod__sut">{m.opisanie}</span>
              {m.formula === null ? null : <span className="z5-metod__formula">{m.formula}</span>}
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
            <span className="z5-modal__title">
              <span className="z5-metod__no" aria-hidden="true">
                {tekushchiy.nomer}
              </span>
              {tekushchiy.nazvanie}
            </span>
          )
        }
        description={tekushchiy?.opisanie}
        closeLabel={modal.zakryt}
        className="z5-modal"
        footer={
          tekushchiy === null ? undefined : (
            <>
              <span className="z5-modal__schet">{tekushchiy.schet}</span>
              <Link className="btn btn--primary" href={tekushchiy.href}>
                {modal.trenirovka}
              </Link>
            </>
          )
        }
      >
        {tekushchiy === null ? null : (
          <div className="z5-modal__body">
            {tekushchiy.formula === null ? null : (
              <div className="z5-metod__formula z5-modal__formula">{tekushchiy.formula}</div>
            )}
            {Object.values(modal.razdely).map((razdel) => (
              <section key={razdel} className="z5-modal__block">
                <h3 className="z5-modal__sub">{razdel}</h3>
                <p className="z5-modal__soon">{modal.gotovitsya}</p>
              </section>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
