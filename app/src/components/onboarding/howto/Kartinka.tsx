import { clsx } from 'clsx';
import type { HowtoKartinka, HowtoSnimok } from '@/content/kakPolzovatsya';

/**
 * Файлы страницы, которые есть в сборке: путь → адрес с версией.
 * Считает серверная страница (app/kak-polzovatsya/page.tsx): общая
 * таблица версий первой загрузки от этих файлов не растёт, а картинки,
 * которой нет, страница просто не показывает.
 */
export type HowtoFaily = Readonly<Record<string, string>>;

/** Пары размеров файлов: шапка, карточки и «start», значки шагов. */
const RAZMERY = {
  shapka: [280, 560],
  karta: [180, 360],
  znachok: [96, 192],
} as const;

export type KartinkaRazmer = keyof typeof RAZMERY;

const PAPKA = '/images/kak-polzovatsya';

/** Путь картинки: /images/kak-polzovatsya/bank-96.webp. */
export function kartinkaPut(id: HowtoKartinka, w: number): string {
  return `${PAPKA}/${id}-${w}.webp`;
}

/** Путь снимка страницы: /images/kak-polzovatsya/shagi/bank.webp. */
export function snimokPut(id: HowtoSnimok): string {
  return `${PAPKA}/shagi/${id}.webp`;
}

/** Обе картинки размера есть в сборке. */
export function estKartinka(faily: HowtoFaily, id: HowtoKartinka, razmer: KartinkaRazmer): boolean {
  const [a, b] = RAZMERY[razmer];
  return faily[kartinkaPut(id, a)] !== undefined && faily[kartinkaPut(id, b)] !== undefined;
}

export function kartinkaSrc(
  faily: HowtoFaily,
  id: HowtoKartinka,
  razmer: KartinkaRazmer,
): { src: string; srcSet: string } | null {
  const [a, b] = RAZMERY[razmer];
  const sa = faily[kartinkaPut(id, a)];
  const sb = faily[kartinkaPut(id, b)];
  if (sa === undefined || sb === undefined) return null;
  return { src: sa, srcSet: `${sa} ${a}w, ${sb} ${b}w` };
}

/**
 * Стеклянная картинка страницы: два файла, браузер берёт нужный по
 * плотности экрана. Размер задан — вёрстка не прыгает; загрузка ленивая.
 * Картинки нет в сборке — ничего не рисуется.
 */
export function Kartinka({
  faily,
  id,
  razmer,
  px,
  alt,
  className,
}: {
  faily: HowtoFaily;
  id: HowtoKartinka;
  razmer: KartinkaRazmer;
  /** Ширина на странице, CSS-пиксели. */
  px: number;
  alt: string;
  className?: string;
}) {
  const s = kartinkaSrc(faily, id, razmer);
  if (s === null) return null;
  return (
    <img
      className={clsx('howto-kart', className)}
      src={s.src}
      srcSet={s.srcSet}
      sizes={`${px}px`}
      width={px}
      height={px}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  );
}
