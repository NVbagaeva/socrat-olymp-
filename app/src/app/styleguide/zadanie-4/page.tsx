import type { Metadata } from 'next';
import { typeset } from '@/lib/tex';
import { naborRazbora } from '@/lib/veroyatnost/nabor';
import { promezhutok } from '@/lib/veroyatnost/pryamaya';
import { DemoKartochka } from './DemoKartochka';
import { PRIMERY } from './primery';
import '@/app/zadaniya/veroyatnost.css';
import './zadanie-4.css';

/* Служебная витрина карточки задания №4: три задачи на координатной
   прямой с разными числами. Ответы здесь видны намеренно — страница
   разработки, в меню не входит и не индексируется. В самом разделе
   сайта разбор уезжает в браузер закрытым. */

export const metadata: Metadata = {
  title: 'Карточка задания №4 — витрина',
  robots: { index: false, follow: false },
};

const TOCHNOST = 1e-9;

export default function Zadanie4Vitrina() {
  const kartochki = PRIMERY.map((primer, i) => {
    /* Те же проверки, что у банка: два пути к ответу сходятся,
       последний шаг равен ответу, промежуток лежит в отрезке.
       Не сошлось — падает сборка, а не ученик. */
    if (Math.abs(primer.otvet - primer.proverka) > TOCHNOST) {
      throw new Error(`${primer.id}: ответ ${primer.otvet} ≠ проверка ${primer.proverka}`);
    }
    const posledniy = primer.shagi[primer.shagi.length - 1];
    if (posledniy?.value === undefined || Math.abs(posledniy.value - primer.otvet) > TOCHNOST) {
      throw new Error(`${primer.id}: последний шаг не равен ответу`);
    }
    if (primer.pryamaya !== undefined) {
      promezhutok(primer.pryamaya);
    }
    return {
      primer,
      razbor: naborRazbora(primer.shagi, primer.pryamaya, true),
      sleduyushchaya: PRIMERY[i + 1]?.id,
    };
  });

  return (
    <main className="z4">
      <p className="t-label z4__kicker">Задание №4 · служебная витрина</p>
      <h1 className="t-h2">Карточка задачи и координатная прямая</h1>
      <p className="z4__lead">
        Один компонент рисунка на все задачи типа «Координатная прямая»: параметры — концы отрезка
        распределения, границы благоприятного промежутка, строгость неравенств и подписи. Ниже три
        задачи с разными числами: с обеими границами, с нестрогими неравенствами и с промежутком без
        верхней границы.
      </p>

      <ol className="z4__list">
        {kartochki.map(({ primer, razbor, sleduyushchaya }) => (
          <li className="z4__item" key={primer.id}>
            <DemoKartochka
              id={primer.id}
              nomer={primer.nomer}
              uslovie={typeset(primer.uslovie)}
              illyustratsiya={primer.illyustratsiya}
              razbor={razbor}
              sleduyushchaya={sleduyushchaya}
            />
            <p className="z4__chem">{primer.chem}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
