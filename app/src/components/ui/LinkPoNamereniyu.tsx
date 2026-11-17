'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useRef,
  type ComponentProps,
  type FocusEvent,
  type PointerEvent,
  type TouchEvent,
} from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'prefetch' | 'href'> & { href: string };

/**
 * Ссылка, которая подгружает следующую страницу по намерению, а не по
 * появлению на экране (docs/launch-audit.md, B2).
 *
 * Обычный <Link> заранее скачивает данные каждой видимой ссылки: лента
 * вкладок раздела тянула в фоне 3–4 МБ (одна «Теория» №3 и №11 —
 * 2,5–2,7 МБ), банк заданий — 1,6 МБ. На мобильном тарифе это трафик
 * ученика, а на телефоне — ещё и секунды занятого главного потока
 * после загрузки страницы.
 *
 * Здесь предзагрузка начинается при наведении мыши, фокусе с
 * клавиатуры или касании пальцем — за 100–300 мс до перехода, этого
 * хватает, чтобы переход остался быстрым. Одна ссылка подгружается один
 * раз.
 */
export function LinkPoNamereniyu({ href, onPointerEnter, onFocus, onTouchStart, ...rest }: Props) {
  const router = useRouter();
  const sdelano = useRef(false);
  const podgruzit = () => {
    if (sdelano.current) return;
    sdelano.current = true;
    router.prefetch(href);
  };
  return (
    <Link
      {...rest}
      href={href}
      prefetch={false}
      onPointerEnter={(e: PointerEvent<HTMLAnchorElement>) => {
        podgruzit();
        onPointerEnter?.(e);
      }}
      onFocus={(e: FocusEvent<HTMLAnchorElement>) => {
        podgruzit();
        onFocus?.(e);
      }}
      onTouchStart={(e: TouchEvent<HTMLAnchorElement>) => {
        podgruzit();
        onTouchStart?.(e);
      }}
    />
  );
}
