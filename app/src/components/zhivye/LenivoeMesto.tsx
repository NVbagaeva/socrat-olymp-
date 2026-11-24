'use client';

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';

/**
 * Место ленивой сцены: код приходит отдельным куском, когда блок в
 * 600 px от экрана (или страницу отправляют на печать); до этого —
 * `zaglushka`.
 *
 * Заглушку меняем на сцену, только когда верх блока не выше экрана.
 * Высоты заглушки и сцены не совпадают до пикселя, и если поменять,
 * пока блок частью или целиком выше экрана (пролистали, пока кусок
 * грузился), всё под ним сдвинется: браузер поправит прокрутку
 * (overflow-anchor), а без этого уедет то, что на экране. Поэтому
 * пришедший кусок ждёт, пока читатель вернётся к началу блока или
 * страницу отправят на печать.
 *
 * `zagruzit` — функция с import() конкретной сцены, объявленная вне
 * компонента: путь должен стоять в коде буквально, чтобы сборщик выделил
 * сцену в свой кусок.
 */
export function LenivoeMesto<P extends object>({
  zagruzit,
  className,
  zaglushka,
  props,
}: {
  zagruzit: () => Promise<{ default: ComponentType<P> }>;
  className: string;
  zaglushka: ReactNode;
  props?: P;
}) {
  const yakor = useRef<HTMLDivElement>(null);
  const [Scena, setScena] = useState<ComponentType<P> | null>(null);

  useEffect(() => {
    const el = yakor.current;
    if (el === null) return undefined;
    let alive = true;
    let nachato = false;
    let pechat = false;
    let gotovo: ComponentType<P> | null = null;
    let io: IntersectionObserver | null = null;

    const ubrat = () => {
      io?.disconnect();
      window.removeEventListener('scroll', pokazat);
      window.removeEventListener('beforeprint', naPechat);
    };
    function pokazat() {
      if (!alive || gotovo === null) return;
      if (!pechat && el!.getBoundingClientRect().top < 0) return;
      const s = gotovo;
      gotovo = null;
      ubrat();
      setScena(() => s);
    }
    const nachat = () => {
      if (nachato) return;
      nachato = true;
      void zagruzit().then((mod) => {
        gotovo = mod.default;
        pokazat();
      });
    };
    function naPechat() {
      pechat = true;
      nachat();
      pokazat();
    }

    window.addEventListener('beforeprint', naPechat);
    window.addEventListener('scroll', pokazat, { passive: true });
    if (typeof IntersectionObserver === 'undefined') {
      naPechat();
    } else {
      io = new IntersectionObserver((z) => z.some((x) => x.isIntersecting) && nachat(), {
        rootMargin: '600px 0px',
      });
      io.observe(el);
    }
    return () => {
      alive = false;
      ubrat();
    };
  }, [zagruzit]);

  return (
    <div ref={yakor} className={className}>
      {Scena === null ? zaglushka : <Scena {...((props ?? {}) as P)} />}
    </div>
  );
}
