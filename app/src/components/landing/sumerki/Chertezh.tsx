/**
 * Чертёж, проступающий из темноты за кристаллом: координатные оси с
 * засечками, кривая с касательной и проекциями точки касания на оси,
 * пунктирные проекции рёбер фигуры на «пол». Линии в 1 px при любом
 * масштабе (vector-effect), прозрачность задаёт sumerki.css. Никаких
 * формул — только построение. Декоративный.
 */
export function Chertezh() {
  return (
    <svg className="sm-chertezh" viewBox="0 0 1200 700" preserveAspectRatio="xMaxYMid slice">
      <g className="sm-chertezh__osi">
        <path d="M640 600H1180M700 660V60" />
        <path d="M1172 594l8 6-8 6M694 68l6-8 6 8" />
        <path d="M760 596v8M820 596v8M880 596v8M940 596v8M1000 596v8M1060 596v8M1120 596v8M696 540h8M696 480h8M696 420h8M696 360h8M696 300h8M696 240h8M696 180h8M696 120h8" />
      </g>
      <g className="sm-chertezh__setka">
        <path d="M760 80V600M880 80V600M1000 80V600M1120 80V600M700 180H1180M700 300H1180M700 420H1180" />
      </g>
      {/* Кривая из двух кубических кусков, стык — (960, 240). Касательная
          в стыке идёт вдоль направления к контрольной точке (860, 300):
          наклон −0,6 — это настоящая касательная, не просто линия. */}
      <path
        className="sm-chertezh__krivaya"
        d="M716 560C800 520 860 300 960 240S1100 280 1170 120"
      />
      <path className="sm-chertezh__kasatelnaya" d="M790 342L1130 138" />
      <path className="sm-chertezh__proekciya" d="M960 240V600M960 240H700" />
      <circle className="sm-chertezh__tochka" cx="960" cy="240" r="4" />
      {/* Проекции рёбер фигуры на пол. */}
      <path
        className="sm-chertezh__proekciya"
        d="M860 150L800 640M1040 150L1100 640M950 140V660M720 640H1180"
      />
      <ellipse className="sm-chertezh__orbita" cx="950" cy="360" rx="330" ry="250" />
    </svg>
  );
}
