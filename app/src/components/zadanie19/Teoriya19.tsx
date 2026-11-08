import { Badge } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { TeoriyaShell } from '@/components/tasks/teoriya/TeoriyaShell';
import { VkladkiGlavy16 } from '@/components/zadanie16/VkladkiGlavy16';
import { GLAVY_19, type Glava19, type Podmetod19 } from '@/content/teoriya19';
import { BLOKI_19, PROGRESS_19 } from '@/content/zadanie19';
import { grafik, pryamaya, scena, tochka } from '@/lib/zadanie19/risunok';
import { Chart } from '@/components/graph/Chart';
import { Kartochka } from './Chasti19';
import { Opornaya, Rabota, Razbor } from './Bloki19';

/** Заголовок подметода большой главы: метка, название, строка-пояснение. */
function PodmetodZagolovok({ g, p, vkladka }: { g: Glava19; p: Podmetod19; vkladka: string }) {
  return (
    <header className="z19-podmetod" id={`${g.id}-${vkladka}-${p.id}`}>
      <p className="z19-podmetod__metka">{p.metka}</p>
      <h4 className="z19-podmetod__title">
        <Tex text={p.title} />
      </h4>
      {p.lead === undefined ? null : (
        <p className="z19-podmetod__lead">
          <Tex text={p.lead} />
        </p>
      )}
    </header>
  );
}

function Punkty({ g, nomer }: { g: Glava19; nomer: number }) {
  return (
    <div className="z16-punkty">
      {g.teoriya.map((p, i) => {
        const pm =
          p.podmetod !== undefined && p.podmetod !== g.teoriya[i - 1]?.podmetod
            ? g.podmetody?.find((m) => m.id === p.podmetod)
            : undefined;
        return (
          <div className="z16-punkt" key={p.id}>
            {pm === undefined ? null : <PodmetodZagolovok g={g} p={pm} vkladka="teoriya" />}
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
        );
      })}
    </div>
  );
}

/**
 * Вкладка «Разбор»: разборы и опорные. У главы с подметодами — по
 * подметодам, под их заголовками; нумерация сквозная по главе.
 */
function RazborTelo({ g }: { g: Glava19 }) {
  const gruppy =
    g.podmetody === undefined
      ? [{ p: undefined, razbory: g.razbory, opornye: g.opornye }]
      : g.podmetody
          .map((p) => ({
            p,
            razbory: g.razbory.filter((r) => r.podmetod === p.id),
            opornye: g.opornye.filter((o) => o.podmetod === p.id),
          }))
          .filter((gr) => gr.razbory.length + gr.opornye.length > 0);
  return (
    <div className="z16-punkty">
      {gruppy.map(({ p, razbory, opornye }) => (
        <div className="z19-gruppa" key={p?.id ?? 'vse'}>
          {p === undefined ? null : <PodmetodZagolovok g={g} p={p} vkladka="razbor" />}
          {razbory.length === 0 ? null : (
            <>
              <h4 className="z16-punkt__title">{BLOKI_19.razbory}</h4>
              <div className="z16-grid">
                {razbory.map((r) => (
                  <Razbor r={r} no={g.razbory.indexOf(r) + 1} key={r.id} />
                ))}
              </div>
            </>
          )}
          {opornye.length === 0 ? null : (
            <>
              <h4 className="z16-punkt__title">{BLOKI_19.opornye}</h4>
              <div className="z16-grid">
                {opornye.map((o) => (
                  <Opornaya o={o} no={g.opornye.indexOf(o) + 1} key={o.id} />
                ))}
              </div>
            </>
          )}
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
  return (
    <div className="z16-glava">
      {lead}
      <VkladkiGlavy16
        paneli={[
          { id: 'teoriya', label: BLOKI_19.teoriya, telo: <Punkty g={g} nomer={nomer} /> },
          { id: 'razbor', label: BLOKI_19.razbor, telo: <RazborTelo g={g} /> },
          {
            id: 'rabota',
            label: BLOKI_19.rabota(g.zadachi.length),
            telo: <Rabota zadachi={g.zadachi} podmetody={g.podmetody} />,
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
