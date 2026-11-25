'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from 'react';

/** Сколько подмен сейчас идёт без привязки прокрутки. */
let bezPrivyazkiIdet = 0;
/** Сколько держать привязку выключенной: сцена досчитывает ширину и KaTeX. */
const BEZ_PRIVYAZKI_MS = 300;

/**
 * Выключить привязку прокрутки (overflow-anchor) у страницы. Если верх
 * места сцены над экраном, точка привязки браузера — внутри заглушки;
 * когда заглушку убирают, WebKit сдвигает страницу на её высоту, а когда
 * сцена вырастает — ещё на прибавку. Возвращает функцию, которая включит
 * привязку обратно через пару кадров (сцена досчитывает ширину и KaTeX).
 */
function vyklyuchitPrivyazku(): () => void {
  const html = document.documentElement;
  bezPrivyazkiIdet += 1;
  html.style.overflowAnchor = 'none';
  let vernuto = false;
  return () => {
    if (vernuto) return;
    vernuto = true;
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        window.setTimeout(() => {
          bezPrivyazkiIdet -= 1;
          if (bezPrivyazkiIdet === 0) html.style.removeProperty('overflow-anchor');
        }, BEZ_PRIVYAZKI_MS),
      ),
    );
  };
}

/**
 * Ленивая живая сцена: код сцены приходит отдельным куском, когда блок
 * подходит к экрану (за 600 px) или страницу отправляют на печать.
 *
 * Высота сцены зависит от ширины и переносов текста и с высотой заглушки
 * точно не совпадает. Если блок, который читатель уже пролистал, вырастет,
 * вырастет и страница над экраном: браузер сдвинет прокрутку (Safari —
 * больше, чем она выросла), текст на экране прыгнет. Поэтому сразу после
 * подмены, до отрисовки:
 *
 *   — заглушка была целиком над экраном — место держит её высоту (лишнее
 *     обрезано). Высота возвращается, когда блок показался на экране или
 *     подошёл к нему на 600 px снизу; сверху — только когда читатель
 *     возвращается к блоку (до этого блок уходил дальше 600 px), и тогда
 *     прокрутка сдвигается ровно на прибавку — текст на экране на месте;
 *   — иначе сцена растёт вниз от своего верха.
 *
 * Привязка прокрутки выключена с прихода кода и до этого решения
 * (vyklyuchitPrivyazku): иначе WebKit сдвинет страницу ещё при вставке.
 *
 * `zagruzit` — функция с import() конкретной сцены: путь должен стоять в
 * коде буквально, чтобы сборщик выделил сцену в свой кусок. `pechat` —
 * грузить сцену при печати (и тогда же снять придержанную высоту).
 */
export function useLenivayaScena<P>(
  zagruzit: () => Promise<{ default: ComponentType<P> }>,
  { pechat = true }: { pechat?: boolean } = {},
): { yakor: RefObject<HTMLDivElement | null>; Scena: ComponentType<P> | null } {
  const yakor = useRef<HTMLDivElement>(null);
  const [Scena, setScena] = useState<ComponentType<P> | null>(null);
  /** Высота заглушки перед подменой, px. */
  const vysotaZaglushki = useRef(0);
  /** Снять придержанную высоту (есть, пока место придержано). */
  const otpustit = useRef<((pered: boolean) => void) | null>(null);
  /* Привязка прокрутки выключена до вставки сцены: вернуть её. */
  const vernutPrivyazku = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = yakor.current;
    if (el === null) return undefined;
    let alive = true;
    let nachato = false;
    const nachat = () => {
      if (nachato) return;
      nachato = true;
      void zagruzit().then((mod) => {
        if (!alive) return;
        vysotaZaglushki.current = el.getBoundingClientRect().height;
        vernutPrivyazku.current = vyklyuchitPrivyazku();
        setScena(() => mod.default);
      });
    };
    const pered = () => {
      nachat();
      otpustit.current?.(true);
    };
    if (pechat) window.addEventListener('beforeprint', pered);
    const blizko =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (zapisi) => {
              if (zapisi.some((z) => z.isIntersecting)) {
                blizko?.disconnect();
                nachat();
              }
            },
            { rootMargin: '600px 0px' },
          );
    if (blizko === null) nachat();
    else blizko.observe(el);
    return () => {
      alive = false;
      blizko?.disconnect();
      if (pechat) window.removeEventListener('beforeprint', pered);
      vernutPrivyazku.current?.();
      vernutPrivyazku.current = null;
    };
  }, [zagruzit, pechat]);

  /* Сцена только что встала на место заглушки: DOM уже новый, кадр ещё
     не нарисован, верх блока — там же, где был верх заглушки. */
  useLayoutEffect(() => {
    const el = yakor.current;
    if (Scena === null || el === null) return undefined;
    const vernut = vernutPrivyazku.current;
    vernutPrivyazku.current = null;
    const bylo = vysotaZaglushki.current;
    const verh = el.getBoundingClientRect().top;
    if (verh + bylo > 0 || typeof IntersectionObserver === 'undefined') {
      vernut?.();
      return undefined;
    }
    /* Заглушка была над экраном: держим её высоту. */
    el.style.height = `${bylo}px`;
    el.style.overflow = 'hidden';
    let zhdat: IntersectionObserver | null = null;
    let naEkrane: IntersectionObserver | null = null;
    /* Блок хоть раз уходил дальше 600 px от окна: подход к нему — это
       читатель возвращается, а не только что пролистал его вниз. */
    let uhodil = false;
    const snyat = (kompensirovat: boolean) => {
      zhdat?.disconnect();
      naEkrane?.disconnect();
      otpustit.current = null;
      const vernutSnyatie = vyklyuchitPrivyazku();
      el.style.removeProperty('height');
      el.style.removeProperty('overflow');
      const pribavka = el.getBoundingClientRect().height - bylo;
      if (kompensirovat && pribavka !== 0) window.scrollBy(0, pribavka);
      vernutSnyatie();
    };
    otpustit.current = () => snyat(false);
    zhdat = new IntersectionObserver(
      (zapisi) => {
        const z = zapisi[zapisi.length - 1];
        if (z === undefined) return;
        if (!z.isIntersecting) {
          uhodil = true;
          return;
        }
        /* Нижний край над окном — блок над экраном: прокрутку сдвигаем на
           прибавку, чтобы текст на экране остался на месте. Сразу после
           подмены этого не делаем — читатель листает вниз. */
        const nad = el.getBoundingClientRect().bottom <= (z.rootBounds?.top ?? 0);
        if (nad && !uhodil) return;
        snyat(nad);
      },
      { rootMargin: '600px 0px' },
    );
    /* Блок показался на экране — сцена растёт вниз, без сдвига прокрутки. */
    naEkrane = new IntersectionObserver((zapisi) => {
      if (zapisi.some((z) => z.isIntersecting)) snyat(false);
    });
    zhdat.observe(el);
    naEkrane.observe(el);
    vernut?.();
    return () => {
      zhdat?.disconnect();
      naEkrane?.disconnect();
      otpustit.current = null;
    };
  }, [Scena]);

  return { yakor, Scena };
}
