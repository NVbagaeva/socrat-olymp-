/**
 * Тела вращения — задел на следующий этап (цилиндр, конус, усечённый
 * конус, шар и их комбинации с многогранниками).
 *
 * Здесь описан только интерфейс и одна чистая формула — какая
 * половина окружности основания ближе к зрителю. Сами тела не
 * собраны: сценарий с телом вращения валидатор пока отклоняет.
 *
 * Как это ляжет в ядро:
 *
 *   — окружность основания — `Okruzhnost` (центр и два
 *     перпендикулярных радиус-вектора); в параллельной проекции она
 *     эллипс, и рисуется дугами `DugaEllipsa`;
 *   — видимая и невидимая половины эллипса разделены точками касания
 *     контурных образующих: это `polovinyOkruzhnosti`;
 *   — контурные образующие цилиндра и конуса — обычные отрезки
 *     `LiniyaTela`, но их концы зависят от ракурса, поэтому тело
 *     отдаёт их через `linii(kam)` на каждом кадре;
 *   — для заслонения тело отдаёт выпуклые части `chasti`: цилиндр —
 *     вписанная призма с 48 гранями, конус — пирамида, шар —
 *     многогранник; линии самого тела считаются точно, по формулам,
 *     а не по этим граням;
 *   — комбинация (шар в кубе, призма в цилиндре) — просто несколько
 *     тел в сцене; внешнее помечается прозрачным: его части не
 *     заслоняют линии внутреннего тела, но свои невидимые линии оно
 *     прячет само.
 */

import { type V, add, cross, dot, len, norm, scale, sub } from './vec';
import type { LiniyaTela, RisuemoeTelo } from './tela';
import type { Kamera } from './vidimost';

/** Окружность в пространстве: центр и два перпендикулярных радиуса. */
export interface Okruzhnost {
  centr: V;
  /** Радиус-векторы одной длины, перпендикулярные друг другу. */
  u: V;
  v: V;
}

/** Дуга окружности по параметру t ∈ [t0, t1] (радианы) с видимостью. */
export interface DugaEllipsa {
  krug: Okruzhnost;
  t0: number;
  t1: number;
  vidno: boolean;
  id: string;
}

/** Контур тела вращения при данном ракурсе. */
export interface KonturVrashcheniya {
  obrazuyushchie: LiniyaTela[];
  dugi: DugaEllipsa[];
}

/** Тело вращения: то же рисуемое тело, плюс прозрачность в комбинации. */
export interface TeloVrashcheniya extends RisuemoeTelo {
  vid: 'cilindr' | 'konus' | 'usechennyy-konus' | 'shar';
  /** Внешнее тело комбинации: сквозь него видно внутреннее. */
  prozrachnoe?: boolean;
  kontur(kam: Kamera): KonturVrashcheniya;
}

/** Точка окружности по параметру. */
export function tochkaOkruzhnosti(o: Okruzhnost, t: number): V {
  return add(o.centr, add(scale(o.u, Math.cos(t)), scale(o.v, Math.sin(t))));
}

/**
 * Ближняя и дальняя половины окружности при взгляде по k (к зрителю,
 * параллельная проекция). Делят окружность точки, где касательная
 * параллельна k в проекции — концы контурных образующих. Ближняя
 * половина — та, где радиус смотрит к зрителю (с её стороны тело не
 * загораживает основание). Возвращаются промежутки параметра.
 */
export function polovinyOkruzhnosti(
  o: Okruzhnost,
  k: V,
): { blizhnyaya: [number, number]; dalnyaya: [number, number] } {
  // Проекция k на плоскость окружности: максимум dot(радиус, k).
  const n = norm(cross(o.u, o.v));
  const kp = sub(k, scale(n, dot(k, n)));
  if (len(kp) < 1e-12) {
    // Смотрим вдоль оси: окружность видна целиком, делить нечего.
    return { blizhnyaya: [0, 2 * Math.PI], dalnyaya: [0, 0] };
  }
  const tMax = Math.atan2(dot(kp, o.v), dot(kp, o.u));
  return {
    blizhnyaya: [tMax - Math.PI / 2, tMax + Math.PI / 2],
    dalnyaya: [tMax + Math.PI / 2, tMax + (3 * Math.PI) / 2],
  };
}
