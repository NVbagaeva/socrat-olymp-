/**
 * База, задание №16: независимый пересчёт ответа.
 *
 * Разбор (razbory-*.ts) идёт по свойствам степеней, корней, логарифмов и
 * тригонометрии и считает точно, в дробях. Здесь — другой путь: запись
 * TeX читается как обычное выражение и считается «в лоб» числами Math
 * (степени, корни, логарифмы через Math.log, синус угла в радианах).
 * Итог округляется до записи бланка. Расхождение двух путей ловит
 * pnpm test:baza.
 */

/* ── Разбор записи: рекурсивный спуск ──────────────────────────── */

class Chtenie {
  private i = 0;

  constructor(private readonly s: string) {}

  private propusk(): void {
    for (;;) {
      const rest = this.s.slice(this.i);
      const m = /^(\s+|\\,|\\left|\\right)/.exec(rest);
      if (m === null) return;
      this.i += m[0].length;
    }
  }

  private smotri(): string {
    this.propusk();
    return this.s.slice(this.i);
  }

  private beri(lit: string): boolean {
    if (this.smotri().startsWith(lit)) {
      this.i += lit.length;
      return true;
    }
    return false;
  }

  private nado(lit: string): void {
    if (!this.beri(lit)) throw new Error(`ожидалось «${lit}» в «${this.s}» на ${this.i}`);
  }

  konec(): boolean {
    return this.smotri() === '';
  }

  /** Сумма: слагаемые через + и −. */
  summa(): number {
    let x = this.proizvedenie();
    for (;;) {
      if (this.beri('+')) x += this.proizvedenie();
      else if (this.beri('-')) x -= this.proizvedenie();
      else return x;
    }
  }

  /** Произведение: через \cdot, «:» и подряд (2\sqrt{3}). */
  private proizvedenie(): number {
    let x = this.unarnoe();
    for (;;) {
      if (this.beri('\\cdot')) x *= this.unarnoe();
      else if (this.beri(':')) x /= this.unarnoe();
      else if (/^(\d|\\frac|\\dfrac|\\sqrt|\\log|\\sin|\\cos|\\mathrm|\()/.test(this.smotri())) {
        x *= this.unarnoe();
      } else return x;
    }
  }

  private unarnoe(): number {
    if (this.beri('-')) return -this.unarnoe();
    return this.stepen();
  }

  private stepen(): number {
    const osn = this.pervichnoe();
    if (this.smotri().startsWith('^\\circ')) return osn;
    if (this.beri('^')) return osn ** this.pokazatel();
    return osn;
  }

  /** Показатель: {…} или одна цифра. */
  private pokazatel(): number {
    if (this.beri('{')) {
      const x = this.summa();
      this.nado('}');
      return x;
    }
    const m = /^\d/.exec(this.smotri());
    if (m === null) throw new Error(`нет показателя в «${this.s}»`);
    this.i += 1;
    return Number(m[0]);
  }

  private gruppa(): number {
    this.nado('{');
    const x = this.summa();
    this.nado('}');
    return x;
  }

  /** Угол в градусах: число и ^\circ. */
  private ugol(): number {
    const g = this.chislo();
    this.nado('^\\circ');
    return (g * Math.PI) / 180;
  }

  private chislo(): number {
    const m = /^\d+(,\d+)?/.exec(this.smotri());
    if (m === null) throw new Error(`нет числа в «${this.s}» на ${this.i}`);
    this.i += m[0].length;
    return Number(m[0].replace(',', '.'));
  }

  private pervichnoe(): number {
    if (this.beri('\\frac') || this.beri('\\dfrac')) {
      const a = this.gruppa();
      return a / this.gruppa();
    }
    if (this.beri('\\sqrt')) return Math.sqrt(this.gruppa());
    if (this.beri('\\log_')) {
      const osn = this.smotri().startsWith('{') ? this.gruppa() : this.chislo();
      return Math.log(this.stepen()) / Math.log(osn);
    }
    if (this.beri('\\sin')) return Math.sin(this.ugol());
    if (this.beri('\\cos')) return Math.cos(this.ugol());
    if (this.beri('\\mathrm{tg}')) return Math.tan(this.ugol());
    if (this.beri('\\mathrm{ctg}')) return 1 / Math.tan(this.ugol());
    if (this.beri('(')) {
      const x = this.summa();
      this.nado(')');
      return x;
    }
    if (this.smotri().startsWith('{')) return this.gruppa();
    return this.chislo();
  }
}

/** Значение записи TeX числами Math. */
export function poschitat(zapis: string): number {
  const c = new Chtenie(zapis);
  const x = c.summa();
  if (!c.konec()) throw new Error(`не дочитано: «${zapis}»`);
  return x;
}

/**
 * Условие задач 25–27: «Найдите f(α), если g(α) = …, A° < α < B°».
 * Угол восстанавливается обратной функцией в нужной четверти, и f
 * считается от самого угла.
 */
export function poschitatUslovie(text: string): number {
  const m =
    /^Найдите \$(\\sin|\\cos|\\mathrm\{tg\}\\,)\\alpha\$, если \$(\\sin|\\cos)\\alpha=(.+)\$, \$(\d+)\^\\circ<\\alpha<(\d+)\^\\circ\$\.$/.exec(
      text,
    );
  if (m === null) throw new Error(`не условие на четверть: «${text}»`);
  const [, nayti = '', dano = '', znachenie = '', ot = '0', doo = '0'] = m;
  const v = poschitat(znachenie);
  const a = Number(ot);
  const b = Number(doo);
  const vnutri = (g: number) => {
    const x = ((g % 360) + 360) % 360;
    return x > a && x < b ? x : null;
  };
  const gradusy = (r: number) => (r * 180) / Math.PI;
  const kandidaty =
    dano === '\\cos'
      ? [gradusy(Math.acos(v)), -gradusy(Math.acos(v))]
      : [gradusy(Math.asin(v)), 180 - gradusy(Math.asin(v))];
  const ugol = kandidaty.map(vnutri).find((x) => x !== null);
  if (ugol === undefined || ugol === null) throw new Error(`угол не в четверти: «${text}»`);
  const r = (ugol * Math.PI) / 180;
  if (nayti === '\\sin') return Math.sin(r);
  if (nayti === '\\cos') return Math.cos(r);
  return Math.tan(r);
}

/**
 * Число → запись бланка: до шести знаков после запятой, без лишних
 * нулей, минус «−». Ответы №16 — конечные дроби, не длиннее четырёх
 * знаков, так что округление снимает только погрешность Math.
 */
export function vZapis(x: number): string {
  const r = Math.round(x * 1e6) / 1e6;
  if (!Number.isFinite(r)) throw new Error(`не число: ${x}`);
  const s = Math.abs(r)
    .toFixed(6)
    .replace(/\.?0+$/, '')
    .replace('.', ',');
  return r < 0 && s !== '0' ? `−${s}` : s;
}
