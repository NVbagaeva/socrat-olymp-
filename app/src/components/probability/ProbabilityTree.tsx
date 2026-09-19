import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';

/**
 * Дерево вероятностей — метод 4.
 *
 * Дерево растёт сверху вниз: одно испытание — один уровень. Подходящие
 * пути усилены, остальные приглушены; под листьями стоят произведения,
 * под деревом — сумма.
 *
 * Структура приходит плоским списком ветвей со ссылкой на родителя —
 * так её удобно держать в JSON-модели задачи.
 *
 * Ветви могут быть разной глубины: у длинной серии испытаний до конца
 * раскрывают только нужный путь, остальные ветви обрываются листьями.
 * Произведение стоит под своим листом, на его глубине.
 */

export interface TreeBranch {
  id: string;
  /** Родительская ветка; null — ветка растёт из корня. */
  parent: string | null;
  /** Подпись ветки: «с мясом», «попал». */
  label: string;
  /** Вероятность самой ветки. В каждом разветвлении сумма равна 1. */
  p: number;
  /**
   * Как подписать вероятность, если десятичная запись некрасива:
   * «11/25» у выбора без возвращения. Нет — пишется число.
   */
  pLabel?: string;
}

export interface ProbabilityTreeProps {
  /** Подписи уровней сверху вниз: «1-й пирожок», «2-й пирожок». */
  levels?: readonly string[];
  branches: readonly TreeBranch[];
  /**
   * Подходящие пути — по идентификатору листа. Как и подсветка у
   * остальных компонентов, приходит вместе с решением, не раньше.
   */
  highlightedPaths?: readonly string[];
  /** Произведения под листьями. */
  showProducts?: boolean;
  /** Строка суммы под деревом. */
  showSum?: boolean;
  /** Пока только сверху вниз — другого направления референс не знает. */
  direction?: 'top-to-bottom';
  state?: RisunokState;
  alt?: string;
  className?: string;
}

/* Шаг между листьями подстраивается под самую длинную подпись ветки:
   «не выиграл» просит больше места, чем «попал». */
const LEAF_GAP_MIN = 88;
const LEAF_GAP_MAX = 122;
const ZNAK = 7.5;
const LEVEL_H = 96;
const TOP = 42;
const PAD_X = 20;
/* Когда уровни подписаны, слева нужно место под их названия:
   иначе подпись уровня наезжает на крайнюю ветку. */
const PAD_LEVELS = 104;

function chislo(value: number): string {
  /* Хвосты вида 0,6400000000000001 — от двоичной дроби, а не от задачи. */
  return String(Math.round(value * 1e9) / 1e9).replace('.', ',');
}

/**
 * Произведение под листом: до четырёх знаков. У ветвей с дробными
 * вероятностями (10/24 · 11/25) произведение бесконечно — тогда
 * пишется приближение со знаком ≈; у подходящих путей оно конечно
 * по построению задачи.
 */
function proizv(value: number): string {
  const kratko = Math.round(value * 1e4) / 1e4;
  const tochno = Math.abs(kratko - value) < 1e-9;
  return (tochno ? '' : '≈ ') + chislo(kratko);
}

export function ProbabilityTree({
  levels,
  branches,
  highlightedPaths,
  showProducts = false,
  showSum = false,
  direction = 'top-to-bottom',
  state = 'default',
  alt,
  className,
}: ProbabilityTreeProps) {
  void direction;

  const dlinnaya = branches.reduce((m, b) => Math.max(m, b.label.length), 0);
  const LEAF_GAP = Math.max(LEAF_GAP_MIN, Math.min(LEAF_GAP_MAX, Math.round(dlinnaya * ZNAK) + 28));

  const deti = new Map<string | null, TreeBranch[]>();
  for (const b of branches) {
    const spisok = deti.get(b.parent) ?? [];
    spisok.push(b);
    deti.set(b.parent, spisok);
  }
  const detiU = (id: string | null): TreeBranch[] => deti.get(id) ?? [];

  /* Листья в порядке обхода — они и задают горизонтальную раскладку. */
  const listya: TreeBranch[] = [];
  const glubina = new Map<string, number>();
  const proizvedenie = new Map<string, number>();
  const obhod = (b: TreeBranch, d: number, p: number): void => {
    glubina.set(b.id, d);
    const pp = p * b.p;
    proizvedenie.set(b.id, pp);
    const sled = detiU(b.id);
    if (sled.length === 0) {
      listya.push(b);
      return;
    }
    for (const c of sled) {
      obhod(c, d + 1, pp);
    }
  };
  for (const b of detiU(null)) {
    obhod(b, 0, 1);
  }

  /* x узла: у листа — свой столбец, у ветки — середина её поддерева. */
  const x = new Map<string, number>();
  const sleva = levels === undefined ? PAD_X : PAD_LEVELS;
  listya.forEach((b, i) => x.set(b.id, sleva + LEAF_GAP / 2 + i * LEAF_GAP));
  const postavit = (b: TreeBranch): number => {
    const est = x.get(b.id);
    if (est !== undefined) {
      return est;
    }
    const sled = detiU(b.id).map(postavit);
    const seredina = (Math.min(...sled) + Math.max(...sled)) / 2;
    x.set(b.id, seredina);
    return seredina;
  };
  for (const b of detiU(null)) {
    postavit(b);
  }

  const urovney = Math.max(...[...glubina.values()], 0) + 1;
  const y = (d: number): number => TOP + (d + 1) * LEVEL_H;
  const koren = { x: sleva + (listya.length * LEAF_GAP) / 2, y: TOP };

  const podhodit = new Set(highlightedPaths ?? []);
  /* Путь усилен, если он ведёт к подходящему листу. */
  const naPuti = new Set<string>();
  if (highlightedPaths !== undefined) {
    const roditel = new Map(branches.map((b) => [b.id, b.parent]));
    for (const leaf of podhodit) {
      let tek: string | null = leaf;
      while (tek !== null) {
        naPuti.add(tek);
        tek = roditel.get(tek) ?? null;
      }
    }
  }

  const width = sleva + listya.length * LEAF_GAP + PAD_X;
  const height = y(urovney - 1) + (showProducts ? 46 : 20) + (showSum ? 38 : 0);

  const summa = [...podhodit].reduce((s, id) => s + (proizvedenie.get(id) ?? 0), 0);
  const slagaemye = [...podhodit].map((id) => chislo(proizvedenie.get(id) ?? 0));

  return (
    <svg
      className={clsx('pr-tree', `pr-is-${state}`, className)}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={
        alt ??
        `Дерево вероятностей: ${urovney} ${urovney === 1 ? 'уровень' : 'уровня'}, ` +
          `${listya.length} путей`
      }
    >
      {/* Подписи уровней слева */}
      {levels === undefined
        ? null
        : levels.slice(0, urovney).map((label, i) => (
            <text key={i} className="pr-level" x={PAD_X} y={y(i) - LEVEL_H / 2}>
              {label}
            </text>
          ))}

      {/* Ветки. Рисуются до узлов, чтобы точки легли поверх линий. */}
      {branches.map((b) => {
        const d = glubina.get(b.id) ?? 0;
        const bx = x.get(b.id) ?? 0;
        const roditel = branches.find((p) => p.id === b.parent);
        const px = roditel === undefined ? koren.x : (x.get(roditel.id) ?? 0);
        const py = roditel === undefined ? koren.y : y(glubina.get(roditel.id) ?? 0);
        const list = detiU(b.id).length === 0;
        const vlevo = bx < px;
        const usilen = naPuti.has(b.id);
        const priglushen = highlightedPaths !== undefined && !usilen;
        return (
          <g
            key={b.id}
            className={clsx(
              'pr-branch',
              usilen && 'pr-branch--highlighted',
              priglushen && 'pr-branch--dimmed',
            )}
          >
            <line x1={px} y1={py} x2={bx} y2={y(d)} />
            {/* Вероятность стоит сбоку от ветки, со стороны её наклона:
                поверх линии она читалась бы хуже. */}
            <text
              className="pr-math pr-branch-p"
              x={(px + bx) / 2 + (vlevo ? -10 : 10)}
              y={(py + y(d)) / 2}
              textAnchor={vlevo ? 'end' : 'start'}
            >
              {b.pLabel ?? chislo(b.p)}
            </text>
            <circle className="pr-node" cx={bx} cy={y(d)} r="5" />
            {/* У листа подпись снизу — под ним ничего нет. У развилки
                снизу расходятся ветки, поэтому подпись уходит вбок. */}
            <text
              className="pr-branch-label"
              x={list ? bx : bx + (vlevo ? -12 : 12)}
              y={list ? y(d) + 22 : y(d) + 4}
              textAnchor={list ? 'middle' : vlevo ? 'end' : 'start'}
            >
              {b.label}
            </text>
          </g>
        );
      })}

      <circle className="pr-node pr-node--root" cx={koren.x} cy={koren.y} r="6" />

      {/* Произведения под листьями */}
      {showProducts
        ? listya.map((b) => (
            <text
              key={`p${b.id}`}
              className={clsx(
                'pr-math pr-leaf',
                podhodit.has(b.id) && 'pr-leaf--highlighted',
                highlightedPaths !== undefined && !podhodit.has(b.id) && 'pr-leaf--dimmed',
              )}
              x={x.get(b.id) ?? 0}
              y={y(glubina.get(b.id) ?? urovney - 1) + 44}
              textAnchor="middle"
            >
              {proizv(proizvedenie.get(b.id) ?? 0)}
            </text>
          ))
        : null}

      {/* Сумма по подходящим путям */}
      {showSum && highlightedPaths !== undefined ? (
        <text className="pr-math pr-total" x={width / 2} y={height - 12} textAnchor="middle">
          {slagaemye.length > 1
            ? `P = ${slagaemye.join(' + ')} = ${chislo(summa)}`
            : `P = ${chislo(summa)}`}
        </text>
      ) : null}
    </svg>
  );
}
