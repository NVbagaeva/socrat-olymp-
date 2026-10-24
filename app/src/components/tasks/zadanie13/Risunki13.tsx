/**
 * Векторные рисунки теории №13: свои, по смыслу как в рабочей тетради.
 * Числа считаются здесь же, чтобы рисунок совпадал с подписью:
 * у первого платежа основной долг больше нуля, у последнего —
 * переплата тоже больше нуля.
 */

const W = 360;
const H = 210;

interface Stolbik {
  dolg: number;
  pereplata: number;
}

/** Дифференцированный: S = 8, n = 8, r = 10 %. */
function stolbikiDif(): Stolbik[] {
  const n = 8;
  return Array.from({ length: n }, (_, i) => ({ dolg: 1, pereplata: ((n - i) / n) * 8 * 0.1 }));
}

/** Аннуитет: S = 8, n = 8, r = 10 %. */
function stolbikiAnn(): Stolbik[] {
  const n = 8;
  const k = 1.1;
  const S = 8;
  const X = (S * k ** n * (k - 1)) / (k ** n - 1);
  let debt = S;
  return Array.from({ length: n }, () => {
    const pereplata = debt * (k - 1);
    const dolg = X - pereplata;
    debt -= dolg;
    return { dolg, pereplata };
  });
}

function Diagramma({ title, data, max }: { title: string; data: Stolbik[]; max: number }) {
  const left = 30;
  const bottom = H - 34;
  const top = 34;
  const step = (W - left - 12) / data.length;
  const bar = step * 0.62;
  const scale = (bottom - top) / max;
  return (
    <svg className="z13-ris" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <text className="z13-ris__title" x={W / 2} y={18} textAnchor="middle">
        {title}
      </text>
      <line className="z13-ris__os" x1={left} y1={bottom} x2={W - 8} y2={bottom} />
      <line className="z13-ris__os" x1={left} y1={bottom} x2={left} y2={top - 6} />
      {data.map((s, i) => {
        const x = left + 6 + i * step;
        const hd = s.dolg * scale;
        const hp = s.pereplata * scale;
        return (
          <g key={i}>
            <rect className="z13-ris__dolg" x={x} y={bottom - hd} width={bar} height={hd} rx={2} />
            <rect
              className="z13-ris__pereplata"
              x={x}
              y={bottom - hd - hp}
              width={bar}
              height={hp}
              rx={2}
            />
            <text className="z13-ris__podpis" x={x + bar / 2} y={bottom + 14} textAnchor="middle">
              {i + 1}
            </text>
          </g>
        );
      })}
      <text className="z13-ris__podpis" x={W / 2 + 10} y={H - 4} textAnchor="middle">
        месяц
      </text>
    </svg>
  );
}

export function DveShemy() {
  const dif = stolbikiDif();
  const ann = stolbikiAnn();
  const max =
    Math.max(...dif.map((s) => s.dolg + s.pereplata), ...ann.map((s) => s.dolg + s.pereplata)) *
    1.05;
  return (
    <div className="z13-ris-para">
      <Diagramma title="Дифференцированный платёж" data={dif} max={max} />
      <Diagramma title="Аннуитет" data={ann} max={max} />
      <p className="z13-ris-legenda">
        <span className="z13-ris-metka z13-ris-metka--dolg" aria-hidden="true" /> сумма изменения
        долга
        <span className="z13-ris-metka z13-ris-metka--pereplata" aria-hidden="true" /> переплата
      </p>
    </div>
  );
}

/** Лесенка долга: точки «долг на начало → долг с процентами → долг на конец». */
function Lesenka({
  title,
  tochki,
  podpisi,
}: {
  title: string;
  tochki: number[];
  podpisi: string[];
}) {
  const left = 16;
  const right = 16;
  const top = 26;
  const bottom = H - 24;
  const max = Math.max(...tochki) * 1.08;
  const step = (W - left - right) / (tochki.length - 1);
  const y = (v: number) => bottom - (v / max) * (bottom - top);
  const pts = tochki.map((v, i) => [left + i * step, y(v)] as const);
  return (
    <svg className="z13-ris" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      <line className="z13-ris__os" x1={left} y1={bottom} x2={W - right} y2={bottom} />
      {pts.slice(1).map(([x, yy], i) => {
        const [px, py] = pts[i] ?? [0, 0];
        const up = (tochki[i + 1] ?? 0) > (tochki[i] ?? 0);
        return (
          <line
            key={i}
            className={up ? 'z13-ris__vverh' : 'z13-ris__vniz'}
            x1={px}
            y1={py}
            x2={x}
            y2={yy}
          />
        );
      })}
      {pts.map(([x, yy], i) => (
        <g key={i}>
          <circle className="z13-ris__tochka" cx={x} cy={yy} r={3.2} />
          <text
            className="z13-ris__podpis"
            x={x}
            y={i % 2 === 1 ? yy - 8 : yy + 16}
            textAnchor="middle"
          >
            {podpisi[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function LesenkaDif() {
  const t = [1000, 1100, 750, 825, 500, 550, 250, 275, 0];
  return (
    <Lesenka title="Лесенка долга: дифференцированный платёж" tochki={t} podpisi={t.map(String)} />
  );
}

export function LesenkaAnn() {
  const t = [2100, 2310, 1100, 1210, 0];
  return <Lesenka title="Лесенка долга: аннуитет" tochki={t} podpisi={t.map(String)} />;
}
