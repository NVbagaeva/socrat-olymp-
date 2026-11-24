import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import '@/components/tasks/steklo/steklo.css';
import './zhivye-obolochka.css';

/**
 * Стеклянная карточка живой сцены: надзаголовок, заголовок и условие
 * набираются на сборке (KaTeX на сервере), внутри — ленивая сцена.
 * Стили оболочки грузятся со страницей, стили сцены — вместе с ней.
 */
export function ZhivayaKartochka({
  id,
  nad,
  zag,
  lead,
  children,
}: {
  id: string;
  nad: string;
  zag: string;
  /** Условие: текст с формулами в $…$. */
  lead: string;
  children: ReactNode;
}) {
  return (
    <section className="zv stk-glass" aria-labelledby={`${id}-zag`}>
      <div className="zv-text">
        <p className="stk-nad">{nad}</p>
        <h3 className="stk-h4" id={`${id}-zag`}>
          {zag}
        </h3>
        <p className="zv-lead">
          <Tex text={lead} />
        </p>
      </div>
      {children}
    </section>
  );
}
