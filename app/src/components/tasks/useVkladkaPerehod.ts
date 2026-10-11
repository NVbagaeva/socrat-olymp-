'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { MouseEvent } from 'react';

/**
 * Плавный переход между вкладками раздела (View Transitions браузера).
 *
 * Обычный клик по вкладке перехватывается: браузер снимает страницу
 * «до», Next.js переходит по адресу, и, как только новая вкладка
 * отрисована (сменился адрес), браузер снимает «после» и анимирует
 * названное в styles/perehody.css: таблетку активной вкладки и панель
 * содержимого.
 *
 * Почему не <ViewTransition> из React: в Next.js 15 он есть только в
 * экспериментальной сборке React, а переводить на неё весь сайт ради
 * анимации вкладок нельзя. Как перейдём на Next.js 16 — заменить на
 * него (см. навык vercel-react-view-transitions).
 *
 * Перехода нет, и ссылка работает как обычная, если:
 *   - браузер не умеет View Transitions;
 *   - включено «уменьшить движение»;
 *   - клик с Ctrl / Cmd / Shift / Alt или не левой кнопкой (открыть в
 *     новой вкладке и т. п.);
 *   - вкладка уже открыта.
 */

/* Ожидание отрисовки новой вкладки — одно на страницу. Модульная
   переменная, а не ref: ленту в части разделов рисует страница, а не
   общий layout, и после перехода это уже другой экземпляр хука. */
let zhdem: (() => void) | null = null;

function zavershit() {
  const z = zhdem;
  zhdem = null;
  z?.();
}

/** Адрес без хвостового «/»: /zadaniya/10/teoriya/ и /zadaniya/10/teoriya — одно. */
function bezSlesha(adres: string): string {
  return adres.length > 1 ? adres.replace(/\/+$/, '') : adres;
}

/* Браузер сам обрывает зависший переход, но ждать его несколько секунд
   с замершим экраном нельзя: если адрес так и не сменился, отпускаем. */
const ZAPAS_MS = 1500;

export function useVkladkaPerehod() {
  const router = useRouter();
  const pathname = usePathname();

  /* Адрес сменился — новая вкладка отрисована: можно снимать «после». */
  useEffect(() => {
    zavershit();
  }, [pathname]);

  return (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    if (typeof document.startViewTransition !== 'function') {
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    if (bezSlesha(href.split(/[?#]/)[0] ?? href) === bezSlesha(pathname)) {
      return;
    }
    e.preventDefault();
    document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          zavershit();
          zhdem = resolve;
          window.setTimeout(() => {
            if (zhdem === resolve) {
              zavershit();
            }
          }, ZAPAS_MS);
          router.push(href);
        }),
    );
  };
}
