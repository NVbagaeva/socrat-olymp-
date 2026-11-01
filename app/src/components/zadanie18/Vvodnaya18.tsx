'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { ProgressBar } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { VKLADKA_KARTOCHKI } from '@/content/kartochkiUi';
import { VVODNAYA_18, ZADANIE18 } from '@/content/zadanie18';
import { SOBRANNYE } from '@/content/zadanie18/spisok';
import { assetUrl } from '@/lib/assetUrl';
import { ZADANIYA } from '@/lib/paths';
import { kPovtoreniyu, neznakomyh, status18, useProgress18 } from '@/lib/zadanie18/progress';

/* Кнопки плашки открывают общую вкладку «Карточки» сразу с сессией:
   ?nabor=… разбирает components/kartochki/Kartochki.tsx. */
const KARTOCHKI = `${ZADANIYA}/${ZADANIE18.slug}/${VKLADKA_KARTOCHKI.tail}`;

/* ── Картинки ───────────────────────────────────────────────────── */

/** Ширины и натуральные размеры — как в scripts/build-vvodnaya-18.mjs. */
const KARTINKI = {
  'treugolnik-centr': { width: 1220, height: 1200, widths: [220, 440] },
  stomatolog: { width: 934, height: 560, widths: [360, 720] },
  payalnik: { width: 1042, height: 508, widths: [360, 720] },
} as const;
type Kartinka = keyof typeof KARTINKI;

/**
 * Декоративная картинка: AVIF и WebP двух ширин, место под неё
 * зарезервировано размерами. Смысл передаёт текст рядом — alt пустой.
 */
function Kartinka({
  name,
  sizes,
  className,
  lazy = true,
}: {
  name: Kartinka;
  sizes: string;
  className: string;
  lazy?: boolean;
}) {
  const k = KARTINKI[name];
  const file = (w: number, ext: string) =>
    assetUrl(`/images/zadaniya/18/vvodnaya/${name}-${w}.${ext}`);
  const set = (ext: string) => k.widths.map((w) => `${file(w, ext)} ${w}w`).join(', ');
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={file(k.widths[0], 'webp')}
        srcSet={set('webp')}
        sizes={sizes}
        width={k.width}
        height={k.height}
        alt=""
        decoding="async"
        {...(lazy ? { loading: 'lazy' as const } : {})}
      />
    </picture>
  );
}

/**
 * Круглая миниатюра для превью строки: квадратный кадр 36px (1x/2x),
 * готовится тем же скриптом (…-mini-36/72). Декор — alt пустой.
 */
function Mini({ name }: { name: 'stomatolog' | 'payalnik' }) {
  const file = (w: number, ext: string) =>
    assetUrl(`/images/zadaniya/18/vvodnaya/${name}-mini-${w}.${ext}`);
  const set = (ext: string) => `${file(36, ext)} 1x, ${file(72, ext)} 2x`;
  return (
    <picture className="z18-vv__mini">
      <source type="image/avif" srcSet={set('avif')} />
      <img
        src={file(36, 'webp')}
        srcSet={set('webp')}
        width={36}
        height={36}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

/* ── Значки ─────────────────────────────────────────────────────── */

/** Линейный значок 24×24 в стиле NavIcon: обводка 1.6, скругления. */
function Znachok({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const ZNACHKI = {
  /* Лампочка с лучами: «почему». */
  lampa: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 6a5 5 0 0 0-3 9c.6.5 1 1.2 1 2v1h4v-1c0-.8.4-1.5 1-2a5 5 0 0 0-3-9Z" />
      <path d="M12 1.5v1.5M4.6 4.6l1.1 1.1M19.4 4.6l-1.1 1.1M2 11.5h1.5M20.5 11.5H22" />
    </>
  ),
  /* Лупа: «узнать схему». */
  lupa: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 5.6 5.6" />
    </>
  ),
  /* Список шагов: «как работать». */
  spisok: (
    <>
      <path d="M10 6h10M10 12h10M10 18h10" />
      <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="3" />
    </>
  ),
  /* Треугольник с вершинами: интерактивный чертёж. */
  chertezh: (
    <>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <circle cx="12" cy="4" r="1.6" fill="currentColor" />
      <circle cx="3.5" cy="19" r="1.6" fill="currentColor" />
      <circle cx="20.5" cy="19" r="1.6" fill="currentColor" />
    </>
  ),
  /* Карандаш: «докажи сам». */
  karandash: (
    <>
      <path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5 4 20Z" />
      <path d="m14.5 6 3 3" />
    </>
  ),
  /* Стопка карточек: «закрепи на карточках». */
  kartochki: (
    <>
      <rect x="3" y="7" width="13" height="13" rx="2" />
      <path d="M7 4h11a2 2 0 0 1 2 2v11" />
      <path d="M7 12.5l2 2 3.5-3.5" />
    </>
  ),
  /* Шеврон строки аккордеона. */
  shevron: <path d="m6 9 6 6 6-6" />,
} as const;
const ZNACHKI_SHAGOV = [ZNACHKI.chertezh, ZNACHKI.karandash, ZNACHKI.kartochki] as const;

/* ── Аккордеон ──────────────────────────────────────────────────── */

/** Длительность раскрытия, мс (200–250 по ТЗ). */
const DLIT = 220;
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

/* ── Мини-превью строк (≥ 768px) ───────────────────────────────── */

/** Две истории: миниатюры стоматолога и паяльника внахлёст. */
const PREVYU_ZACHEM = (
  <span className="z18-vv__prevyu-para">
    <Mini name="stomatolog" />
    <Mini name="payalnik" />
  </span>
);

/** Чертёж 64×40: в большом треугольнике выделен маленький подобный —
    «спрятанная схема»; на ховере строки он загорается терракотой. */
const PREVYU_DAET = (
  <svg className="z18-vv__prevyu-svg" viewBox="0 0 64 40" width="64" height="40">
    <path className="z18-vv__prevyu-bolshoy" d="M24 4 4 36h56L24 4Z" />
    <path className="z18-vv__prevyu-malyy" d="M24 4 14 20h28L24 4Z" />
  </svg>
);

/** Три шага 1 · 2 · 3, соединённые линией. */
const PREVYU_KAK = (
  <svg className="z18-vv__prevyu-svg" viewBox="0 0 64 40" width="64" height="40">
    <path className="z18-vv__prevyu-liniya" d="M10 20h44" />
    {[10, 32, 54].map((x, i) => (
      <g key={x}>
        <circle className="z18-vv__prevyu-shag" cx={x} cy="20" r="8" />
        <text className="z18-vv__prevyu-no" x={x} y="20">
          {i + 1}
        </text>
      </g>
    ))}
  </svg>
);

/* ── Аккордеон ──────────────────────────────────────────────────── */

/**
 * Строка-аккордеон на нативных <details>/<summary>: клавиатура, поиск
 * по странице, состояние «развёрнуто» для скринридера (summary сам
 * сообщает expanded/collapsed) и работа без JS — от браузера, текст
 * лежит в HTML. Скрипт только добавляет плавность: высота и
 * прозрачность тела за DLIT мс. При prefers-reduced-motion — обычное
 * мгновенное раскрытие.
 *
 * Строка: [плитка со значком] [название + подзаголовок] [мини-превью]
 * [стрелка]. Вид «открыто» (плитка насыщеннее, подзаголовок и превью
 * прячутся, стрелка вверх) задаёт [open]; пока блок закрывается,
 * data-zakryvaetsya снимает этот вид сразу, не дожидаясь конца анимации.
 */
function Blok({
  id,
  ton,
  ikonka,
  title,
  podzag,
  prevyu,
  children,
}: {
  id: string;
  /** Оттенок плитки: тёплый, синий, синий → терракота. */
  ton: 'teplo' | 'siniy' | 'gradient';
  ikonka: ReactNode;
  title: string;
  podzag: string;
  prevyu: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const telo = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const zakryvaetsya = useRef(false);

  const onClick = (e: MouseEvent<HTMLElement>) => {
    const d = ref.current;
    const b = telo.current;
    if (
      d === null ||
      b === null ||
      typeof b.animate !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    e.preventDefault();
    /* Текущая высота и прозрачность — с них и продолжаем, даже если
       нажали посреди предыдущей анимации. У закрытого <details> Chrome
       всё равно раскладывает тело (content-visibility: hidden) и отдаёт
       полную высоту — считаем 0. */
    const ot = d.open ? b.getBoundingClientRect().height : 0;
    const opacity = d.open ? getComputedStyle(b).opacity : '0';
    anim.current?.cancel();
    const otkryt = !d.open || zakryvaetsya.current;
    if (otkryt) {
      zakryvaetsya.current = false;
      delete d.dataset.zakryvaetsya;
      d.open = true;
      const k = b.scrollHeight;
      anim.current = b.animate(
        [
          { height: `${ot}px`, opacity },
          { height: `${k}px`, opacity: 1 },
        ],
        { duration: DLIT, easing: EASE },
      );
      anim.current.onfinish = () => {
        anim.current = null;
      };
    } else {
      zakryvaetsya.current = true;
      d.dataset.zakryvaetsya = '';
      anim.current = b.animate(
        [
          { height: `${ot}px`, opacity },
          { height: '0px', opacity: 0 },
        ],
        { duration: DLIT, easing: EASE },
      );
      anim.current.onfinish = () => {
        d.open = false;
        zakryvaetsya.current = false;
        delete d.dataset.zakryvaetsya;
        anim.current = null;
      };
    }
  };

  return (
    <details ref={ref} className={`z18-vv__blok z18-vv__blok--${ton}`}>
      <summary className="z18-vv__blok-stroka" onClick={onClick}>
        <span className="z18-vv__plitka" aria-hidden="true">
          <Znachok>{ikonka}</Znachok>
        </span>
        <span className="z18-vv__blok-tekst">
          <span className="z18-vv__blok-title" id={`${id}-title`}>
            {title}
          </span>
          <span className="z18-vv__blok-podzag">
            <span>{podzag}</span>
          </span>
        </span>
        <span className="z18-vv__prevyu" aria-hidden="true">
          {prevyu}
        </span>
        <span className="z18-vv__blok-shevron" aria-hidden="true">
          <Znachok>{ZNACHKI.shevron}</Znachok>
        </span>
      </summary>
      <div ref={telo} className="z18-vv__blok-telo">
        <div className="z18-vv__blok-vnutri">{children}</div>
      </div>
    </details>
  );
}

/**
 * Свёрнутые строки — одной высоты, даже когда на телефоне название или
 * подзаголовок переносятся по-разному. Высота текста самой высокой
 * строки (название + подзаголовок, даже если подзаголовок сейчас
 * спрятан) ставится всем как --tekst-h. Пересчёт — при смене ширины и
 * после загрузки шрифтов; без JS строки просто своей высоты.
 */
function useRovnyeStroki(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const box = ref.current;
    if (box === null) return;
    let shirina = -1;
    const izmerit = () => {
      const vysoty = [...box.querySelectorAll<HTMLElement>('.z18-vv__blok-tekst')].map((t) => {
        const title = t.querySelector<HTMLElement>('.z18-vv__blok-title');
        const podzag = t.querySelector<HTMLElement>('.z18-vv__blok-podzag > span');
        return (title?.offsetHeight ?? 0) + (podzag?.scrollHeight ?? 0);
      });
      box.style.setProperty('--tekst-h', `${Math.ceil(Math.max(0, ...vysoty))}px`);
    };
    const ro = new ResizeObserver(([e]) => {
      const w = e?.contentRect.width ?? 0;
      if (w === shirina) return;
      shirina = w;
      izmerit();
    });
    ro.observe(box);
    void document.fonts?.ready.then(izmerit);
    return () => ro.disconnect();
  }, [ref]);
}

/* ── Карточка ───────────────────────────────────────────────────── */

/**
 * Вводная карточка вкладки «Ключевые схемы» в «Стеклянной сцене».
 * Сразу видны метка, заголовок, треугольник и вывод; объяснение
 * разложено по трём строкам-аккордеонам (все свёрнуты): аналогии про
 * знания и инструменты, что даёт узнанная схема, как работать с
 * вкладкой. Под треугольником — общий прогресс и запуск карточек.
 */
export function Vvodnaya18() {
  const progress = useProgress18();
  const n = SOBRANNYE.length;
  const x = SOBRANNYE.filter((s) => status18(progress, s.id) === 'known').length;
  /* Время берётся один раз при монтировании: на сервере прогресс пуст,
     и счётчики совпадают с первой отрисовкой в браузере. */
  const [seychas] = useState(() => Date.now());
  const ids = SOBRANNYE.map((s) => s.id);
  const segodnya = kPovtoreniyu(ids, progress, seychas);
  const nezn = neznakomyh(ids, progress);
  const vsego = ids.length * 2;
  const v = VVODNAYA_18;
  const bloki = useRef<HTMLDivElement>(null);
  useRovnyeStroki(bloki);
  return (
    <section className="z18-vv" aria-labelledby="z18-vv-title">
      {/* Две колонки на компьютере: слева текст и аккордеон, справа
          одна группа — треугольник и прогресс. На планшете и телефоне
          обёртки колонок растворяются (display: contents), и порядок
          задают области сетки карточки. */}
      <div className="z18-vv__levaya">
        <div className="z18-vv__zagolovok">
          <p className="z18-vv__metka">{v.metka}</p>
          <h2 id="z18-vv-title" className="z18-vv__title">
            {v.title}
          </h2>
        </div>

        <p className="z18-vv__vyvod">{v.vyvod}</p>

        <div ref={bloki} className="z18-vv__bloki">
          <Blok
            id="z18-vv-zachem"
            ton="teplo"
            ikonka={ZNACHKI.lampa}
            title={v.bloki.zachem.title}
            podzag={v.bloki.zachem.podzag}
            prevyu={PREVYU_ZACHEM}
          >
            <div className="z18-vv__analogii">
              {v.analogii.map((a) => (
                <article key={a.kartinka} className="z18-vv__analogiya">
                  <Kartinka
                    name={a.kartinka}
                    className="z18-vv__analogiya-kartinka"
                    sizes="(min-width: 768px) 340px, 90vw"
                  />
                  <h3 className="z18-vv__analogiya-title">{a.title}</h3>
                  <p className="z18-vv__analogiya-tekst">{a.text}</p>
                </article>
              ))}
            </div>
            <p className="z18-vv__oba">
              <Tex text={v.obaNuzhny} />
            </p>
          </Blok>

          <Blok
            id="z18-vv-daet"
            ton="siniy"
            ikonka={ZNACHKI.lupa}
            title={v.bloki.daet.title}
            podzag={v.bloki.daet.podzag}
            prevyu={PREVYU_DAET}
          >
            <div className="z18-vv__tekst">
              {v.daet.map((a, i) => (
                <p key={i}>
                  <Tex text={a} />
                </p>
              ))}
            </div>
          </Blok>

          <Blok
            id="z18-vv-kak"
            ton="gradient"
            ikonka={ZNACHKI.spisok}
            title={v.bloki.kak.title}
            podzag={v.bloki.kak.podzag}
            prevyu={PREVYU_KAK}
          >
            <ol className="z18-vv__shagi">
              {v.shagi.map((s, i) => (
                <li key={i}>
                  <span className="z18-vv__shag-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="z18-vv__shag-ikonka">
                    <Znachok>{ZNACHKI_SHAGOV[i]}</Znachok>
                  </span>
                  <span className="z18-vv__shag-tekst">{s}</span>
                </li>
              ))}
            </ol>
            <p className="z18-vv__pochemu">
              <Tex text={v.pochemu} />
            </p>
          </Blok>
        </div>
      </div>

      <div className="z18-vv__pravaya">
        <div className="z18-vv__scena">
          <Kartinka
            name="treugolnik-centr"
            className="z18-vv__glavnaya"
            sizes="(min-width: 1024px) 210px, (min-width: 768px) 150px, 163px"
            lazy={false}
          />
        </div>

        <div className="z18-vv__progress">
          <p className="z18-vv__progress-tekst">
            <strong>{v.progress(x, n)}</strong> {v.progressPodpis}
          </p>
          <ProgressBar value={n === 0 ? 0 : (x / n) * 100} label={v.progress(x, n)} />
          <p className="z18-vv__segodnya">{v.segodnya(segodnya)}</p>
          <div className="z18-vv__knopki">
            <Link className="btn btn--primary btn--sm" href={`${KARTOCHKI}?nabor=segodnya`}>
              {v.uchit}
            </Link>
            {nezn > 0 && nezn < vsego ? (
              <Link className="btn btn--secondary btn--sm" href={`${KARTOCHKI}?nabor=neznakomye`}>
                {v.neznakomye(nezn)}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
