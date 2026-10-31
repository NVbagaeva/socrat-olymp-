import { Tex } from '@/components/ui/Tex';
import { BLOKI_19, RABOTA_19 } from '@/content/zadanie19';
import type { Opornaya19, Razbor19, Zadacha19 } from '@/content/teoriya19/tipy';
import { Etapy19, Otvet19, Risunok, Uslovie19 } from './Chasti19';
import { Rabota19, type Zadanie19View } from './Rabota19';

/**
 * Блоки главы метода, набранные на сервере: разобранный пример,
 * опорная задача и тренировочная работа. Оформление — карточки №16.
 */

export function Razbor({ r, no }: { r: Razbor19; no: number }) {
  return (
    <article className="z16-card z19-card z16-card--primer z16-shir--6 z19-razbor" id={r.id}>
      <p className="z16-metka">{`${BLOKI_19.razbor} ${no}`}</p>
      <h5 className="z16-card__title">
        <Tex text={r.title} zagolovok />
      </h5>
      <Uslovie19 text={r.uslovie} />
      <p className="z19-pochemu">
        <span className="z19-pochemu__label">{BLOKI_19.pochemu}.</span> <Tex text={r.pochemu} />
      </p>
      <Etapy19 etapy={r.etapy} />
      {r.drugoy === undefined ? null : (
        <section className="z19-drugoy">
          <p className="z16-metka">{BLOKI_19.drugoy}</p>
          <Etapy19 etapy={[r.drugoy]} />
        </section>
      )}
      <Otvet19 tex={r.otvet} bukva={r.bukva} />
    </article>
  );
}

export function Opornaya({ o, no }: { o: Opornaya19; no: number }) {
  return (
    <section className="z16-card z19-card z16-card--algoritm z16-shir--3 z19-opornaya" id={o.id}>
      <p className="z16-metka">{`Опорная ${no}`}</p>
      <h5 className="z16-card__title">
        <Tex text={o.title} zagolovok />
      </h5>
      <Uslovie19 text={o.uslovie} />
      <ol className="z16-shagi">
        {o.shagi.map((s) => (
          <li key={s}>
            <Tex text={s} />
          </li>
        ))}
      </ol>
      {o.risunok === undefined ? null : <Risunok r={o.risunok} />}
      <Otvet19 tex={o.otvet} bukva={o.bukva} />
    </section>
  );
}

/** Задания банка → вид для тренировочной работы: всё набрано на сервере. */
export function zadaniyaView(zadachi: readonly Zadacha19[]): Zadanie19View[] {
  return zadachi.map((z) => ({
    id: z.id,
    uroven: z.uroven,
    otvet: z.otvet,
    uslovie: <Uslovie19 text={z.uslovie} />,
    podskazka: (
      <p className="z16-card__text">
        <Tex text={z.podskazka} />
      </p>
    ),
    reshenie: (
      <>
        <Etapy19 etapy={z.reshenie} />
        <Otvet19 tex={z.otvet} bukva={z.bukva} />
      </>
    ),
  }));
}

export function Rabota({ zadachi }: { zadachi: readonly Zadacha19[] }) {
  return <Rabota19 zadaniya={zadaniyaView(zadachi)} primer={<Tex text={RABOTA_19.primer} />} />;
}
