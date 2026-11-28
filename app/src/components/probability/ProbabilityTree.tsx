import { clsx } from 'clsx';
import type { RisunokState } from './OutcomeTiles';
import labelsLib from '@/lib/graph/labels.js';
import { Znaki } from './Znaki';
import {
  chisloVetvi as chislo,
  LEVEL_H,
  PAD_X,
  raskladkaDereva,
  type SobytieRaskladki,
} from './derevoRaskladka';

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
  /** Заготовка: ветви без вероятностей — ученик подписывает их сам. */
  blank?: boolean;
  /** Подпись корня — случайный опыт: «S» (задание №6). */
  rootLabel?: string;
  /** Подписи листьев — имена исходов курсивом: a, b, c (задание №6). */
  leafLabelsMath?: boolean;
  /**
   * События — овалы вокруг подряд стоящих листьев с подписью под
   * овалом: «Событию A благоприятствуют исходы a, b, c» (задание №6).
   */
  events?: readonly SobytieRaskladki[];
  /**
   * Дерево по шагам (подсказка-вопросы): видны только первые `urovney`
   * уровней. Раскладка считается по всему дереву — ветви не прыгают,
   * когда появляются следующие. Нет — дерево целиком.
   */
  urovney?: number;
  /** Подписи вероятностей — только у первых `sVeroyatnostyami` уровней. */
  sVeroyatnostyami?: number;
  state?: RisunokState;
  alt?: string;
  className?: string;
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
  blank = false,
  rootLabel,
  leafLabelsMath = false,
  events,
  urovney,
  sVeroyatnostyami,
  state = 'default',
  alt,
  className,
}: ProbabilityTreeProps) {
  void direction;

  /* Уровень ветви (с нуля): число её предков. */
  const roditeli = new Map(branches.map((b) => [b.id, b.parent]));
  const uroven = (id: string): number => {
    let n = 0;
    let tek = roditeli.get(id) ?? null;
    while (tek !== null) {
      n += 1;
      tek = roditeli.get(tek) ?? null;
    }
    return n;
  };
  const vidnaVetv = (id: string): boolean => urovney === undefined || uroven(id) < urovney;
  const sP = (id: string): boolean =>
    sVeroyatnostyami === undefined || uroven(id) < sVeroyatnostyami;

  const r = raskladkaDereva({ branches, levels, showProducts, showSum, events });
  const { listya, glubina, proizvedenie, x, y, koren, width, height } = r;
  const vsegoUrovney = r.urovney;
  const detiEst = new Set(branches.map((b) => b.parent));

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

  /* Подпись развилки стоит сбоку от узла и у крайней ветки может выйти
     за раскладку («машина опоздала» слева): поле рисунка расширяется под
     неё, иначе подпись обрезалась бы краем SVG. Жирный выделенного пути —
     с запасом. */
  let minX = 0;
  let maxX = width;
  branches.forEach((b, i) => {
    if (!vidnaVetv(b.id)) {
      return;
    }
    const otr = r.otrezki[i];
    if (otr === undefined) {
      return;
    }
    /* Оценка сверху: кириллица в жирном с запасной гарнитурой — до 0,7 кегля на знак. */
    const w = Math.max(labelsLib.pointTextWidth(b.label, 14) * 1.12, b.label.length * 10);
    const list = !detiEst.has(b.id);
    const [l, rr] = list
      ? [otr.x2 - w / 2, otr.x2 + w / 2]
      : otr.x2 < otr.x1
        ? [otr.x2 - 12 - w, otr.x2 - 12]
        : [otr.x2 + 12, otr.x2 + 12 + w];
    minX = Math.min(minX, l - 4);
    maxX = Math.max(maxX, rr + 4);
  });
  const sdvig = Math.ceil(-minX);
  const shirina = Math.ceil(maxX) + sdvig;

  const summa = [...podhodit].reduce((s, id) => s + (proizvedenie.get(id) ?? 0), 0);
  const slagaemye = [...podhodit].map((id) => chislo(proizvedenie.get(id) ?? 0));

  return (
    <svg
      data-engine="veroyatnost"
      className={clsx('pr-tree', `pr-is-${state}`, className)}
      viewBox={`0 0 ${shirina} ${height}`}
      width={shirina}
      height={height}
      role="img"
      aria-label={
        alt ??
        `Дерево вероятностей: ${vsegoUrovney} ${vsegoUrovney === 1 ? 'уровень' : 'уровня'}, ` +
          `${listya.length} путей`
      }
    >
      <g transform={sdvig === 0 ? undefined : `translate(${sdvig} 0)`}>
        {/* Подписи уровней слева */}
        {levels === undefined
          ? null
          : levels.slice(0, Math.min(vsegoUrovney, urovney ?? vsegoUrovney)).map((label, i) => (
              <text key={i} className="pr-level" x={PAD_X} y={y(i) - LEVEL_H / 2}>
                {label}
              </text>
            ))}

        {/* Ветки. Рисуются до узлов, чтобы точки легли поверх линий. */}
        {branches.map((b, i) => {
          if (!vidnaVetv(b.id)) {
            return null;
          }
          const otr = r.otrezki[i] as (typeof r.otrezki)[number];
          const metka = r.metki[i] as (typeof r.metki)[number];
          const { x1: px, y1: py, x2: bx, y2: by } = otr;
          const list = !detiEst.has(b.id);
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
              <line x1={px} y1={py} x2={bx} y2={by} />
              {/* Вероятность стоит сбоку от ветки, со стороны её наклона:
                поверх линии она читалась бы хуже. В заготовке её нет. */}
              {blank || !sP(b.id) ? null : (
                <text
                  className="pr-math pr-branch-p"
                  x={metka.x}
                  y={metka.y}
                  textAnchor={metka.anchor}
                >
                  {metka.text}
                </text>
              )}
              <circle className="pr-node" cx={bx} cy={by} r="5" />
              {/* У листа подпись снизу — под ним ничего нет. У развилки
                снизу расходятся ветки, поэтому подпись уходит вбок. */}
              <text
                className={clsx(
                  'pr-branch-label',
                  list && leafLabelsMath && 'pr-math pr-leaf-name',
                )}
                x={list ? bx : bx + (vlevo ? -12 : 12)}
                y={list ? by + 22 : by + 4}
                textAnchor={list ? 'middle' : vlevo ? 'end' : 'start'}
              >
                {b.label}
              </text>
            </g>
          );
        })}

        <circle className="pr-node pr-node--root" cx={koren.x} cy={koren.y} r="6" />
        {rootLabel === undefined ? null : (
          <text className="pr-math pr-root-label" x={koren.x} y={koren.y - 13} textAnchor="middle">
            {rootLabel}
          </text>
        )}

        {/* События — овалы вокруг своих листьев, имя под овалом. */}
        {r.ovaly.map((ov) => (
          <g key={`ov${ov.name}`} className="pr-event">
            <ellipse cx={ov.cx} cy={ov.cy} rx={ov.rx} ry={ov.ry} />
            <text className="pr-math pr-event-name" x={ov.lx} y={ov.ly} textAnchor="middle">
              {ov.name}
            </text>
          </g>
        ))}

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
                y={y(glubina.get(b.id) ?? vsegoUrovney - 1) + 44}
                textAnchor="middle"
              >
                <Znaki text={proizv(proizvedenie.get(b.id) ?? 0)} />
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
      </g>
    </svg>
  );
}
