import type { Metadata } from 'next';
import {
  Opornye11List,
  type BlokKartochka,
  type FiltrKnopka,
} from '@/components/tasks/zadanie11/Opornye11List';
import { Opornye11Shell } from '@/components/tasks/zadanie11/Opornye11Shell';
import { OPORNYE } from '@/content/opornye';
import { tasksPage } from '@/content/tasks';
import { OPORNYE_11, O_ZADANII_11, ZADANIE11, zadanie11Title } from '@/content/zadanie11';
import { BLOKI } from '@/lib/zadanie11/prep/bloki';
import type { RazdelBloka } from '@/lib/zadanie11/prep/types';
import { SECTIONS } from '@/lib/zadanie11/taxonomy';

export const metadata: Metadata = {
  title: zadanie11Title(OPORNYE.title),
};

/**
 * Вкладка «Опорные задачи» №11: разминка и блоки навыков. Список
 * лёгкий — без задач: они собираются на странице блока. Фильтр
 * раздела показывает блоки раздела и те, что нужны перед ним
 * (O_ZADANII_11.pered).
 */
export default function Opornye11Tab() {
  const listHref = `${tasksPage.href}/${ZADANIE11.slug}/${OPORNYE.tail}`;
  const bloki: BlokKartochka[] = BLOKI.map((b) => {
    const filtry: RazdelBloka[] = [b.razdel];
    for (const s of SECTIONS) {
      if ((O_ZADANII_11.pered[s.id] ?? []).includes(b.nazvanie) && !filtry.includes(s.id)) {
        filtry.push(s.id);
      }
    }
    return {
      id: b.id,
      slug: b.slug,
      razdel: b.razdel,
      nazvanie: b.nazvanie,
      total: b.zadachi.length,
      filtry,
    };
  });
  const filtry: FiltrKnopka[] = [
    ...SECTIONS.filter((s) => bloki.some((b) => b.filtry.includes(s.id))).map((s) => ({
      id: s.id,
      label: OPORNYE_11.filtr[s.id] ?? s.nazvanie,
    })),
    { id: 'OB', label: OPORNYE_11.obshchie },
  ];
  return (
    <Opornye11Shell listHref={listHref} totals={bloki.map((b) => ({ id: b.id, total: b.total }))}>
      <Opornye11List bloki={bloki} filtry={filtry} listHref={listHref} />
    </Opornye11Shell>
  );
}
