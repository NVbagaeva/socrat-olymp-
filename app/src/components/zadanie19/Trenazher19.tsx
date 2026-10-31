import { GLAVY_19 } from '@/content/teoriya19';
import { BLOKI_19 } from '@/content/zadanie19';
import { typesetKrupno } from '@/lib/tex';
import { zadaniyaView } from './Bloki19';
import { Trenazher19Klient } from './Trenazher19Klient';

/**
 * Вкладка «Тренажёр» №19: банк заданий открытых глав на общей оболочке
 * сессии. Условия, подсказки и решения набираются на сервере; выбор
 * тренировки, проверка и сохранение — в браузере (Trenazher19Klient).
 */
export function Trenazher19({ vkladka, base }: { vkladka: string; base: string }) {
  const bank = GLAVY_19.filter((g) => g.metod !== undefined && g.zadachi.length > 0).flatMap((g) =>
    zadaniyaView(g.zadachi).map((v, i) => ({
      ...v,
      metod: g.metod!,
      metodTitle: `${BLOKI_19.metod(g.metod!)}. ${g.title}`,
      uslovieHtml: typesetKrupno(g.zadachi[i]!.uslovie),
    })),
  );
  return (
    <>
      <h2 className="t-h2 vtab__title">{vkladka}</h2>
      <Trenazher19Klient base={base} bank={bank} />
    </>
  );
}
