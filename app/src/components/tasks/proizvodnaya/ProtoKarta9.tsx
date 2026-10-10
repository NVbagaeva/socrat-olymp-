'use client';

import { clsx } from 'clsx';
import { Suspense, lazy, useId, useState } from 'react';

const PrimerKlient = lazy(() => import('./PrimerKlient'));

export interface ProtoKarta9Props {
  /** Код прототипа: 9.2.1. */
  code: string;
  /** Название, набранное KaTeX на сервере. */
  titleHtml: string;
  /** Подпись справа, когда карточка закрыта. */
  label?: string;
  /** Заголовок примера внутри. */
  primerTitle: string;
}

/**
 * Карточка типа задания: код и название, по клику раскрывается
 * разобранный пример. Кнопка — настоящая (button с aria-expanded):
 * работает с клавиатуры. Пример собирается в браузере при первом
 * раскрытии (PrimerKlient), поэтому страница лёгкая.
 */
export function ProtoKarta9({ code, titleHtml, label = 'Пример', primerTitle }: ProtoKarta9Props) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const panel = useId();
  return (
    <li className={clsx('z9-proto', open && 'is-open')}>
      <button
        type="button"
        className="z9-proto__btn"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => {
          setOpen(!open);
          setOpened(true);
        }}
      >
        <span className="z9-proto__code">{code}</span>
        <span className="z9-proto__title" dangerouslySetInnerHTML={{ __html: titleHtml }} />
        <span className="z9-proto__hint">{open ? 'Свернуть' : label}</span>
        <svg className="z9-proto__chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="z9-proto__panel" id={panel} hidden={!open}>
        {opened ? (
          <Suspense fallback={<p className="z9-about__hint">Строим рисунок…</p>}>
            <PrimerKlient id={code} title={primerTitle} />
          </Suspense>
        ) : null}
      </div>
    </li>
  );
}
