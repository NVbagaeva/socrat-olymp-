'use client';

import { clsx } from 'clsx';
import {
  useEffect,
  useRef,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import './vitrina.css';

/**
 * Бегущая строка карточек витрины (vitrina.css, .vit-beg). Набор и его
 * копии едут справа налево; лента сдвигается ровно на один набор
 * (число карточек --n × ширина карточки), поэтому склейка не видна.
 * С одной копией это ровно −50 % ленты. Копий больше одной, когда
 * набор короче ширины ленты (stereo: три миниатюры).
 *
 * Скорость — в CSS (--vit-beg-skorost, px/с), длительность — от ширины
 * набора. Копии — aria-hidden и inert. Пауза: наведение, палец на
 * карточке, фокус с клавиатуры, блок вне экрана (IntersectionObserver).
 * prefers-reduced-motion — обычная лента с прокруткой, без копий.
 *
 * Элементы — содержимое <li>, по одному на карточку; копии — те же
 * элементы (в SVG у копий должны быть свои id — см. StereoChast).
 */
export function Begushchaya({
  elementy,
  kopii,
  className,
}: {
  elementy: readonly { key: string; node: ReactNode }[];
  /** Копии набора: по одной на каждую. По умолчанию — одна, тот же набор. */
  kopii?: readonly (readonly { key: string; node: ReactNode }[])[];
  className?: string;
}) {
  const ramka = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ramka.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([z]) => {
      if (z?.isIntersecting) delete el.dataset.vne;
      else el.dataset.vne = '';
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const palec = (est: boolean) => (e: PointerEvent) => {
    const el = ramka.current;
    if (!el || e.pointerType === 'mouse') return;
    if (est) el.dataset.palec = '';
    else delete el.dataset.palec;
  };

  /* Фокус с клавиатуры на карточке за краем: ставим ленту так, чтобы
     карточка была посередине (лента стоит на паузе — :focus-visible). */
  const kFokusu = (e: FocusEvent<HTMLOListElement>) => {
    const el = ramka.current;
    const lenta = el?.firstElementChild as HTMLElement | null;
    const li = (e.target as HTMLElement).closest('li');
    if (!el || !lenta || !li) return;
    el.scrollLeft = 0;
    const anim = lenta.getAnimations?.()[0];
    const dlit = anim?.effect?.getComputedTiming().duration;
    if (!anim || typeof dlit !== 'number' || dlit <= 0) return;
    const r = el.getBoundingClientRect();
    const k = li.getBoundingClientRect();
    if (k.left >= r.left && k.right <= r.right) return;
    const nabor = e.currentTarget.offsetWidth;
    const x = li.offsetLeft - (el.clientWidth - k.width) / 2;
    anim.currentTime = ((((x % nabor) + nabor) % nabor) / nabor) * dlit;
  };

  const spisok = (
    el: readonly { key: string; node: ReactNode }[],
    kopiya: boolean,
    key: string,
  ) => (
    <ol
      key={key}
      className="vit-beg__nabor"
      {...(kopiya ? { 'aria-hidden': true, inert: true } : { onFocus: kFokusu })}
    >
      {el.map((x) => (
        <li key={x.key} className="vit-beg__el">
          {x.node}
        </li>
      ))}
    </ol>
  );

  return (
    <div
      ref={ramka}
      className={clsx('vit-beg', className)}
      onPointerDown={palec(true)}
      onPointerUp={palec(false)}
      onPointerCancel={palec(false)}
      onPointerLeave={palec(false)}
    >
      <div className="vit-beg__lenta" style={{ '--n': elementy.length } as CSSProperties}>
        {spisok(elementy, false, 'n')}
        {(kopii ?? [elementy]).map((k, i) => spisok(k, true, `k${i}`))}
      </div>
    </div>
  );
}
