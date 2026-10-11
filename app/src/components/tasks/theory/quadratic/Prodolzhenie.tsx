'use client';

import { useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Button, GlassBadge, HandNote } from '@/components/ui';
import { razgovor } from '@/content/theoryQuadratic';
import { ForwardIcon } from './ForwardIcon';
import { Strelka } from './Strelka';

/**
 * Вторая половина разговора: пока свёрнута, на её месте стоит плашка
 * «Разговор продолжается…».
 *
 * Кнопка раскрывает продолжение прямо во врезке — никуда не ведёт и
 * новых страниц не заводит. Сами реплики в разметке всегда: свёрнутое
 * состояние обрезает их по высоте, а не убирает из страницы, иначе
 * поиск по странице их не найдёт.
 *
 * Плашка уходит, когда продолжение раскрыто: разговор продолжается
 * ровно там, где она стояла. Фокус переходит на раскрытые реплики —
 * иначе с клавиатуры он остался бы на исчезнувшей кнопке.
 */
export function Prodolzhenie({ children }: { children: ReactNode }) {
  const [otkryto, setOtkryto] = useState(false);
  const telo = useRef<HTMLDivElement>(null);
  const { plashka } = razgovor;

  return (
    <div className={clsx('prodolzh', otkryto && 'is-otkryto')}>
      {otkryto ? null : (
        <div className="prodolzh__plashka">
          <GlassBadge className="prodolzh__znachok" glif="kniga" />

          <div className="prodolzh__text">
            <p className="prodolzh__title">{plashka.title}</p>
            <p className="prodolzh__lead">{plashka.text}</p>
          </div>

          <div className="prodolzh__deystvie">
            <Button
              className="prodolzh__knopka"
              variant="secondary"
              aria-expanded={false}
              aria-controls="razgovor-dalshe"
              onClick={() => {
                setOtkryto(true);
                /* Реплики уже в разметке, поэтому фокус ставится сразу
                   после перерисовки — ждать их появления не нужно. */
                window.requestAnimationFrame(() => telo.current?.focus());
              }}
            >
              {plashka.knopka}
              <ForwardIcon />
            </Button>

            <span className="prodolzh__zametka">
              <HandNote>{plashka.zametka}</HandNote>
              <Strelka
                className="prodolzh__strelka"
                d="M 96 22 C 80 46 54 66 26 74"
                ostriyo="M 42 64 L 24 76 L 42 84"
              />
            </span>
          </div>

          {/* Искры — декор плашки, как на макете. */}
          <Iskra className="prodolzh__iskra prodolzh__iskra--verh" />
          <Iskra className="prodolzh__iskra prodolzh__iskra--niz" />
          <Iskra className="prodolzh__iskra prodolzh__iskra--kray" />
        </div>
      )}

      <div className="prodolzh__telo" id="razgovor-dalshe" ref={telo} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

/** Искра: четырёхлучевая звёздочка, цвет берёт у места вставки. */
function Iskra({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 1c.8 5.4 4.8 9.4 10.2 10.2C16.8 12 12.8 16 12 21.4 11.2 16 7.2 12 1.8 11.2 7.2 10.4 11.2 6.4 12 1z"
        fill="currentColor"
      />
    </svg>
  );
}
