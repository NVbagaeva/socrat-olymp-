/**
 * «Функция как отображение»: два множества и стрелки между ними.
 *
 * Это схема, а не чертёж функции, поэтому движок graph/ здесь ни при
 * чём: он рисует координатную плоскость. Линии и стрелки сделаны теми
 * же средствами, что значки проекта — обводка currentColor, заливки
 * нет, цвет задаёт место вставки.
 */

const ROWS = [74, 110, 146, 182];
/* Нижние индексы — юникодные: так они и выглядят индексами, и
   читаются вслух, и совпадают с подписями на чертежах движка. */
const SUB = ['₁', '₂', '₃', '₄'];

export interface MappingDiagramProps {
  setX: string;
  setY: string;
}

function Dot({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="3.5" fill="currentColor" stroke="none" />;
}

export function MappingDiagram({ setX, setY }: MappingDiagramProps) {
  return (
    <svg
      className="mapping__art"
      viewBox="0 0 360 230"
      role="img"
      aria-label="Схема: каждому элементу множества X соответствует ровно один элемент множества Y"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <text className="mapping__set" x="82" y="26" textAnchor="middle">
        {setX}
      </text>
      <text className="mapping__set" x="278" y="26" textAnchor="middle">
        {setY}
      </text>

      {/* Оба множества на одной светлой холодной заливке, контуры
          одинаковые: разными их делают подписи, а не цвет. */}
      <ellipse cx="82" cy="128" rx="52" ry="88" fill="var(--color-surface)" />
      <ellipse cx="278" cy="128" rx="52" ry="88" fill="var(--color-surface)" />

      {ROWS.map((y, index) => (
        <g key={y}>
          <text className="mapping__point" x="96" y={y + 5} textAnchor="end">
            <tspan fontStyle="italic">x</tspan>
            {SUB[index]}
          </text>
          <Dot x={108} y={y} />
          {/* Стрелка: от аргумента к его значению. */}
          <path d={`M116 ${y}h128`} />
          <path d={`m238 ${y - 5} 6 5-6 5`} />
          <Dot x={252} y={y} />
          <text className="mapping__point" x="264" y={y + 5}>
            <tspan fontStyle="italic">y</tspan>
            {SUB[index]}
          </text>
        </g>
      ))}
    </svg>
  );
}
