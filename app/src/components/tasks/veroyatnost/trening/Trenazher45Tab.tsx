import { TabScrollOnMount } from '../../TabScroll';
import type { GruppaVybora } from '../../trening';
import { GRUPPY4_TON } from '@/content/veroyatnost4';
import { typesetText } from '@/lib/tex';
import {
  bank4Pool,
  bank5Pool,
  bezRazborov,
  uznayMetodPool,
  versiyaRazborov,
} from '@/lib/veroyatnost/pool';
import { katalog45 } from '@/lib/veroyatnost/trening/katalog';
import { trenazherHref45, type Zadanie45 } from '@/lib/veroyatnost/trening/links';
import { MetodKartinka } from '../MetodKartinka';
import { navykKind, navykiZadaniya } from '../metody';
import { Trenazher45, type Trenazher45Props } from './Trenazher45';
import type { Ton } from '../../steklo';

const TONY: Ton[] = ['blue', 'navy', 'orange', 'terra', 'green'];

/** Тон группы (метода): у №4 — из текстов раздела, у №5 — по кругу. */
export function tonMetoda(zadanie: Zadanie45, metod: string, i: number): Ton {
  return (zadanie === 4 ? GRUPPY4_TON[metod] : undefined) ?? TONY[i % TONY.length] ?? 'blue';
}

/**
 * Группы выбора тем №4 и №5: метод — группа (значок — его объёмная
 * иллюстрация, как есть), прототипы метода — типы. Метод без задач в
 * банке группы не получает.
 */
export function gruppy45(zadanie: Zadanie45): GruppaVybora[] {
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  return navykiZadaniya(zadanie).flatMap((m, i): GruppaVybora[] => {
    const kinds = pool.kinds.filter((k) => navykKind(k) === m.id);
    if (kinds.length === 0) return [];
    return [
      {
        id: m.id,
        nazvanie: m.nazvanie,
        znakHtml: '',
        znak: <MetodKartinka zadanie={zadanie} metod={m.id} nazvanie="" />,
        ton: tonMetoda(zadanie, m.id, i),
        tipy: kinds.map((k) => ({ id: k.id, nazvanieHtml: typesetText(k.title) })),
      },
    ];
  });
}

/**
 * Вкладка «Тренажёр» №4 и №5 в «Стеклянной сцене»: стартовые режимы
 * (вперемешку, выбрать методы, работа над ошибками, «Узнай метод»),
 * выбор тем строками методов, экран задачи, итоги. Банк страницы — как
 * и прежде: условия, отпечатки ответов, картинки; разборы — файлами.
 */
export function Trenazher45Tab({
  zadanie,
  preset = null,
}: {
  zadanie: Zadanie45;
  preset?: Trenazher45Props['preset'];
}) {
  const pool = zadanie === 4 ? bank4Pool() : bank5Pool();
  const nazvaniyaTekst = Object.fromEntries(pool.kinds.map((k) => [k.id, k.title]));
  return (
    <section className="trainer z45-trening trn-host" aria-labelledby={`z${zadanie}-trening-title`}>
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id={`z${zadanie}-trening-title`}>
        Тренажёр
      </h2>
      <TabScrollOnMount />
      <Trenazher45
        zadanie={zadanie}
        base={trenazherHref45(zadanie)}
        pool={bezRazborov(pool)}
        versiyaRazborov={versiyaRazborov(pool)}
        uznay={uznayMetodPool(zadanie)}
        gruppy={gruppy45(zadanie)}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog45(zadanie)}
        preset={preset}
      />
    </section>
  );
}
