import { Badge } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { VkladkiGlavy16 } from '@/components/zadanie16/VkladkiGlavy16';
import { GLAVY_19, type Glava19 } from '@/content/teoriya19';
import { BLOKI_19, PROGRESS_19 } from '@/content/zadanie19';
import { grafik, pryamaya, scena, tochka } from '@/lib/zadanie19/risunok';
import { Chart } from '@/components/graph/Chart';
import { Kartochka } from './Chasti19';
import { Opornaya, Rabota, Razbor } from './Bloki19';

function Punkty({ g, nomer }: { g: Glava19; nomer: number }) {
  return (
    <div className="z16-punkty">
      {g.teoriya.map((p, i) => (
        <div className="z16-punkt" key={p.id}>
          <h4 className="z16-punkt__title" id={`${g.id}-${p.id}`}>
            <span className="z16-punkt__no">{`${nomer}.${i + 1}`}</span>
            <Tex text={p.title} />
          </h4>
          <div className="z16-grid">
            {p.kartochki.map((k, j) => (
              <Kartochka k={k} key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Тело главы: у метода — вкладки «Теория · Разбор · Тренировочная работа». */
function Telo({ g, nomer }: { g: Glava19; nomer: number }) {
  if (g.skoro) {
    return (
      <div className="z16-glava z16-glava--skoro">
        <Badge tone="neutral">{BLOKI_19.skoro}</Badge>
        <p className="z16-glava__lead">{BLOKI_19.skoroText}</p>
      </div>
    );
  }
  const lead =
    g.lead === undefined ? null : (
      <p className="z16-glava__lead">
        <Tex text={g.lead} />
      </p>
    );
  if (g.metod === undefined) {
    return (
      <div className="z16-glava">
        {lead}
        <Punkty g={g} nomer={nomer} />
      </div>
    );
  }
  const razbor = (
    <div className="z16-punkty">
      <h4 className="z16-punkt__title">{BLOKI_19.razbory}</h4>
      <div className="z16-grid">
        {g.razbory.map((r, i) => (
          <Razbor r={r} no={i + 1} key={r.id} />
        ))}
      </div>
      <h4 className="z16-punkt__title">{BLOKI_19.opornye}</h4>
      <div className="z16-grid">
        {g.opornye.map((o, i) => (
          <Opornaya o={o} no={i + 1} key={o.id} />
        ))}
      </div>
    </div>
  );
  return (
    <div className="z16-glava">
      {lead}
      <VkladkiGlavy16
        paneli={[
          { id: 'teoriya', label: BLOKI_19.teoriya, telo: <Punkty g={g} nomer={nomer} /> },
          { id: 'razbor', label: BLOKI_19.razbor, telo: razbor },
          {
            id: 'rabota',
            label: BLOKI_19.rabota(g.zadachi.length),
            telo: <Rabota zadachi={g.zadachi} />,
          },
        ]}
      />
    </div>
  );
}

/** Значок колонки содержания: «уголок» и пучок прямых через точку. */
function Dekor() {
  return (
    <Chart
      className="z19-dekor"
      scene={scena(
        { x: [-3, 4], y: [-1, 4] },
        {
          curves: [
            grafik((x) => Math.abs(x - 1)),
            pryamaya(0.5, 1, 'lineB'),
            pryamaya(-0.3, 1.9, 'lineC'),
          ],
          points: [tochka(3, 2, null)],
        },
        '',
      )}
    />
  );
}

/**
 * Вкладка «Теория» задания №19: главы подряд, содержание рядом —
 * общая оболочка теории (TeoriyaShell), как у №16. Главы методов,
 * которые ещё пишутся, — «Скоро» с замком.
 */
export function Teoriya19({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    GLAVY_19.map((g, i) => [g.id, <Telo g={g} nomer={i + 1} key={g.id} />]),
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={GLAVY_19.map((g) => ({
        id: g.id,
        title: g.metod === undefined ? g.title : `${BLOKI_19.metod(g.metod)}. ${g.title}`,
        ...(g.skoro ? { skoro: true } : {}),
      }))}
      tela={tela}
      dekor={{ kartinka: <Dekor />, note: 'Неподвижный график и подвижная прямая' }}
      trackKey={PROGRESS_19.teoriyaKey}
    />
  );
}
