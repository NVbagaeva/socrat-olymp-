/**
 * Рисуемое тело — то, что кладётся в сцену чертежа.
 *
 * Сцена не знает, какое у неё тело: многогранник, фигура из кубиков,
 * а на следующих этапах цилиндр, конус, шар и их комбинации. Она
 * спрашивает у тела две вещи:
 *
 *   — chasti: выпуклые части, которыми тело заслоняет линии — свои
 *     и чужие (вспомогательные отрезки, рёбра соседнего тела);
 *   — linii(kam, chuzhie): свои линии для данной камеры, уже
 *     разбитые на видимые и невидимые куски. У многогранника это
 *     рёбра; у тела вращения — контурные образующие и дуги эллипсов
 *     (см. vrashchenie.ts), и они зависят от ракурса.
 *
 * Поэтому видимость в комбинации тел считается одинаково: линии
 * каждого тела проверяются ещё и против частей остальных тел.
 */

import { type V, lerp } from './vec';
import type { Telo } from './telo';
import { type Kamera, kuskiOtrezka, rebroVidno } from './vidimost';
import type { DugaEllipsa } from './vrashchenie';

/** Кусок линии тела с видимостью. id — имя ребра («A-B») для ссылок. */
export interface LiniyaTela {
  a: V;
  b: V;
  vidno: boolean;
  id: string;
}

export interface RisuemoeTelo {
  /** Что это за тело — для описания и проверки. */
  vid: string;
  chasti: Telo[];
  linii(kam: Kamera, chuzhie?: readonly Telo[]): LiniyaTela[];
  /** Дуги эллипсов (основания тел вращения). У многогранника — нет. */
  dugi?(kam: Kamera, chuzhie?: readonly Telo[]): DugaEllipsa[];
  /** Характерный размер — для допусков. */
  razmer: number;
}

/** Именованное ребро: концы и имя для ссылок из решения. */
export interface ImennoeRebro {
  a: V;
  b: V;
  id: string;
}

/** Разбить отрезок на куски по видимости против набора частей. */
function kuski(a: V, b: V, id: string, chasti: readonly Telo[], kam: Kamera, eps: number) {
  if (chasti.length === 0) {
    return [{ a, b, vidno: true, id }];
  }
  return kuskiOtrezka(a, b, chasti, kam, eps).map((k) => ({
    a: lerp(a, b, k.t0),
    b: lerp(a, b, k.t1),
    vidno: k.vidno,
    id,
  }));
}

/**
 * Выпуклый многогранник. Своё ребро невидимо, если обе его грани
 * повёрнуты от зрителя (точное правило); чужие тела закрывают его
 * по лучу.
 */
export function vypuklyy(
  telo: Telo,
  imya: (a: V, b: V) => string,
  razmer: number,
  vid = 'mnogogrannik',
): RisuemoeTelo {
  return {
    vid,
    chasti: [telo],
    razmer,
    linii(kam, chuzhie = []) {
      const eps = razmer * 1e-7;
      const out: LiniyaTela[] = [];
      for (const r of telo.rebra) {
        const id = imya(r.a, r.b);
        if (!rebroVidno(telo, r, kam)) {
          out.push({ a: r.a, b: r.b, vidno: false, id });
          continue;
        }
        out.push(...kuski(r.a, r.b, id, chuzhie, kam, eps));
      }
      return out;
    },
  };
}

/**
 * Невыпуклый многогранник — набор выпуклых частей и рёбра его
 * поверхности. Каждое ребро проверяется лучом против всех частей
 * (своих и чужих): своё ребро на видимой грани своя часть не
 * закрывает — луч от него сразу уходит наружу.
 */
export function izChastey(
  chasti: Telo[],
  rebra: readonly ImennoeRebro[],
  razmer: number,
  vid = 'sostavnoy',
): RisuemoeTelo {
  return {
    vid,
    chasti,
    razmer,
    linii(kam, chuzhie = []) {
      const eps = razmer * 1e-7;
      const vse = [...chasti, ...chuzhie];
      return rebra.flatMap((r) => kuski(r.a, r.b, r.id, vse, kam, eps));
    },
  };
}
