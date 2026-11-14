'use client';

import { useMemo } from 'react';
import type { GruppaVybora } from '@/components/tasks/trening';
import { TrenazherBanka } from '@/components/tasks/trening/bank/TrenazherBanka';
import { shagiIzEtapov, voprosyIzRazbora } from '@/components/tasks/trening/bank/shagi';
import type { RazdelBanka } from '@/components/tasks/trening/bank/types';
import { tekstyTrenazheraBanka } from '@/content/treningBanka';
import { KLYUCH_BAZY } from '@/lib/baza/bank';
import { brauzerRazdela } from '@/lib/baza/dannye';
import { prochitat } from '@/lib/baza/secret';
import type { Resheno, ZadachaLite } from '@/lib/baza/types';
import { levelInfo } from '@/lib/level';
import type { KatalogBanka } from '@/lib/trening/bank';

const GRUPP: Record<number, string> = { 1: 'одной', 2: 'двух', 3: 'трёх', 4: 'четырёх', 5: 'пяти' };

/**
 * Тренажёр задания базы — общий тренажёр по банку (как у №6, №7, №10
 * профиля): режимы, выбор тем, подсказка-вопросы, разбор по шагам,
 * работа над ошибками. Раздел базы подключается данными: банк и
 * прототипы грузятся по номеру задания (lib/baza/dannye.ts).
 */
export function TrenazherBazy({
  slug,
  base,
  gruppy,
  nazvaniyaTekst,
  katalog,
}: {
  slug: string;
  base: string;
  gruppy: GruppaVybora[];
  nazvaniyaTekst: Record<string, string>;
  katalog: KatalogBanka;
}) {
  const razdel = useMemo<RazdelBanka<ZadachaLite, Resheno>>(() => {
    const b = brauzerRazdela(slug);
    return {
      /* Раздел закладок, истории и сессии — свой у базы. */
      razdel: `baza-${slug}`,
      klyuch: KLYUCH_BAZY,
      log: b.log,
      vybor: b.vybor,
      zagruzka: b.zagruzka,
      T: tekstyTrenazheraBanka({
        nomer: Number(slug),
        grupp: GRUPP[gruppy.length] ?? 'нескольких',
        istochniki: { vse: 'Все', fipi: 'Исходные', new: 'Сгенерированные' },
      }),
      proverit: prochitat,
      pod: () => null,
      shagi: (s) => shagiIzEtapov(s.etapy),
      voprosy: (s) => voprosyIzRazbora(s.hints),
      zadachaHref: (id) =>
        `${levelInfo('base').bankBase}/${slug}/trenazher/?zadacha=${encodeURIComponent(id)}`,
      /* Все задачи строит генератор: выбора «исходные / сгенерированные» нет. */
      bezIstochnika: true,
    };
  }, [slug, gruppy.length]);
  return (
    <TrenazherBanka
      razdel={razdel}
      base={base}
      gruppy={gruppy}
      nazvaniyaTekst={nazvaniyaTekst}
      katalog={katalog}
    />
  );
}
