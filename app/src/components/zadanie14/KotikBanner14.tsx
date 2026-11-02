import { assetUrl } from '@/lib/assetUrl';

const PAPKA = '/images/zadanie-14';

/** Слой картинки: WebP 480 / 754 по ширине и запасной PNG 480. */
function Sloy({
  imya,
  w,
  h,
  className,
}: {
  imya: 'oblako' | 'kot';
  w: number;
  h: number;
  className: string;
}) {
  const webp = (s: number) => `${assetUrl(`${PAPKA}/kotik-${imya}-${s}.webp`)} ${s}w`;
  return (
    <picture className={className}>
      <source
        type="image/webp"
        srcSet={`${webp(480)}, ${webp(754)}`}
        sizes="(max-width: 759px) 70vw, 340px"
      />
      <img
        src={assetUrl(`${PAPKA}/kotik-${imya}-480.png`)}
        width={w}
        height={h}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

/**
 * «Где-то в мире грустит один котик…» — баннер перед макетами
 * тригонометрической окружности. Слева подпись (HTML, не картинка) и
 * кнопка к макетам, справа котик под облаком. Картинка — два слоя:
 * облако медленно покачивается и «дышит», котик неподвижен; при
 * prefers-reduced-motion анимации нет. Подложка — «Стеклянная сцена»,
 * в тёмной схеме за котиком тёплое свечение.
 */
export function KotikBanner14({
  href,
  knopka = 'Выучить макеты →',
  className,
}: {
  href: string;
  knopka?: string;
  className?: string;
}) {
  return (
    <aside
      className={`z14-kotik${className ? ` ${className}` : ''}`}
      aria-label="Зачем учить макеты окружности"
    >
      <div className="z14-kotik__tekst">
        <p className="z14-kotik__podpis">
          Где-то в мире <span className="z14-kotik__akcent">грустит один котик</span>, когда ты не
          знаешь макеты тригонометрической окружности.
        </p>
        <a className="btn btn--primary z14-kotik__knopka" href={href}>
          {knopka}
        </a>
      </div>
      <div className="z14-kotik__kartinka" aria-hidden="true">
        <Sloy imya="oblako" w={480} h={166} className="z14-kotik__oblako" />
        <Sloy imya="kot" w={480} h={350} className="z14-kotik__kot" />
      </div>
    </aside>
  );
}

/**
 * Свёрнутый баннер: узкая полоска с котиком и той же кнопкой. Так
 * баннер выглядит в тренажёре окружности после первой проверки.
 */
export function KotikPolosa14({
  href,
  knopka = 'Выучить макеты →',
}: {
  href: string;
  knopka?: string;
}) {
  return (
    <aside className="z14-kotik-polosa" aria-label="Зачем учить макеты окружности">
      <span className="z14-kotik-polosa__kot" aria-hidden="true">
        <Sloy imya="kot" w={480} h={350} className="z14-kotik-polosa__kartinka" />
      </span>
      <p className="z14-kotik-polosa__tekst">Котик грустит, когда не знаешь макеты окружности.</p>
      <a className="btn btn--secondary btn--sm" href={href}>
        {knopka}
      </a>
    </aside>
  );
}
