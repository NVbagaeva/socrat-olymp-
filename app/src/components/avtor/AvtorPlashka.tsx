import { clsx } from 'clsx';
import Link from 'next/link';
import { AVTOR_PLASHKA } from '@/content/avtorPlashka';
import './avtor-plashka.css';

/**
 * Миниатюра фото автора, имя и одна строка — ссылкой на «Об авторе».
 * Фото то же, что на «Об авторе», только обрезано по лицу и уменьшено
 * (scripts/build-avtor-miniatyura.mjs): 3 КБ и 8 КБ для двойной
 * плотности. Ниже первого экрана грузится лениво.
 *
 * vid: «steklo» — стеклянная плашка; «stroka» — без подложки, в строку
 * с другим текстом.
 */
export function AvtorPlashka({
  vid = 'steklo',
  lenivo = true,
  className,
}: {
  vid?: 'steklo' | 'stroka';
  lenivo?: boolean;
  className?: string;
}) {
  const a = AVTOR_PLASHKA;
  return (
    <Link className={clsx('avtor-pl', `avtor-pl--${vid}`, className)} href={a.href}>
      <img
        className="avtor-pl__foto"
        src={a.foto.src}
        srcSet={`${a.foto.src} 1x, ${a.foto.src2x} 2x`}
        alt=""
        width={48}
        height={48}
        loading={lenivo ? 'lazy' : 'eager'}
        decoding="async"
      />
      <span className="avtor-pl__tekst">
        <span className="avtor-pl__imya">{a.imya}</span>
        <span className="avtor-pl__kto">{a.kto}</span>
      </span>
      <svg className="avtor-pl__strelka" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M5 12h13M12 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
