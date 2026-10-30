import { GLAVY_19 } from '@/content/teoriya19';
import { Tex } from '@/components/ui/Tex';
import { BLOKI_19, RABOTA_19, TRENAZHER_19, UROVNI_19 } from '@/content/zadanie19';
import { zadaniyaView } from './Bloki19';
import { Bank19 } from './Bank19';

/**
 * Вкладка «Тренажёр» №19: банк заданий открытых глав с фильтрами по
 * методу и уровню. Задания набраны на сервере; фильтры, проверка и
 * решения — в браузере (Bank19).
 */
export function Trenazher19({ vkladka }: { vkladka: string }) {
  const glavy = GLAVY_19.filter((g) => g.metod !== undefined && g.zadachi.length > 0);
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <p className="z16-glava__lead">{TRENAZHER_19.lead}</p>
      <Bank19
        metody={glavy.map((g) => ({
          metod: g.metod!,
          title: `${BLOKI_19.metod(g.metod!)}. ${g.title}`,
        }))}
        urovni={Object.entries(UROVNI_19).map(([id, title]) => ({ id, title }))}
        zadaniya={glavy.flatMap((g) =>
          zadaniyaView(g.zadachi).map((z) => ({ ...z, metod: g.metod! })),
        )}
        primer={<Tex text={RABOTA_19.primer} />}
      />
    </>
  );
}
