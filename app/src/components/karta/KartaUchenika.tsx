'use client';

/**
 * Карта текущего ученика: журналы из браузера (со входом — слитые с
 * аккаунтом), имя из сессии, закладки разделов, ДЗ под картой. Гостю —
 * то же из данных браузера и плашка «Войдите…».
 */

import { useMemo } from 'react';
import { KARTA_HREF } from '@/components/karta/KabinetRaskladka';
import { useSessionUser } from '@/lib/auth/session';
import { razdelInfo } from '@/lib/karta/katalog';
import { useZhurnaly } from '@/lib/karta/zhurnaly';
import { bookmarkId, bookmarks, isBookmarked, toggleBookmark } from '@/lib/zakladki';
import { KartaDz } from './KartaDz';
import { KartaEkran } from './KartaEkran';
import type { ZakladkiKarty } from './KartaPanel';

export function KartaUchenika({ debug = false }: { debug?: boolean }) {
  const user = useSessionUser();
  const zhurnaly = useZhurnaly();
  const spisok = bookmarks.use();

  const zakladki = useMemo<ZakladkiKarty>(
    () => ({
      est: (no) => isBookmarked(spisok, bookmarkId(String(no), 'razdel', 'karta')),
      pereklyuchit: (no) =>
        bookmarks.update((cur) =>
          toggleBookmark(cur, {
            id: bookmarkId(String(no), 'razdel', 'karta'),
            section: String(no),
            place: 'razdel',
            ref: 'karta',
            title: `№${no} ${razdelInfo(no).nazvanie}`,
            href: `${KARTA_HREF}#${no}`,
          }),
        ),
    }),
    [spisok],
  );

  return (
    <KartaEkran
      zhurnaly={zhurnaly}
      imya={user?.name ?? ''}
      gost={user === null}
      zakladki={zakladki}
      debug={debug}
    >
      {user === null ? null : <KartaDz />}
    </KartaEkran>
  );
}
