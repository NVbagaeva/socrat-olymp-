import { clsx } from 'clsx';
import type { ReactNode } from 'react';
import { Tex } from '@/components/ui/Tex';
import { katex } from '@/lib/graph/katex';
import { renderFigura, type RezhimRisunka } from '@/lib/proizvodnaya/render';
import type { Generated, Shag } from '@/lib/proizvodnaya/types';
import { FiguraSvg9 } from './FiguraSvg9';

/** Выносная формула: KaTeX на сборке. */
export function Display9({ tex, className }: { tex: string; className?: string }) {
  return (
    <span
      className={clsx('rich-formula', className)}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

const CHECK = 'Проверка на здравый смысл';
const ANSWER = 'Ответ';

/** Строка шага из одной формулы — «$…$» целиком: показывается выносной. */
function odnaFormula(line: string): string | null {
  const m = /^\$([^$]+)\$$/.exec(line.trim());
  return m === null ? null : (m[1] as string);
}

/** «**Ответ: -0,5**» → «$-0{,}5$»; не число — как есть. */
export function otvetTex(line: string | undefined): string {
  const raw = (line ?? '').replace(/\*\*/g, '').replace(/^Ответ:\s*/, '').trim();
  return /^-?\d+([.,]\d+)?$/.test(raw) ? `$${raw.replace(/[.,]/, '{,}')}$` : raw;
}

export interface PrimerShag {
  label: string;
  stroki: string[];
  check: boolean;
}

/** Этапы разбора прототипа: «Шаг n. …», проверка и ответ отдельно. */
export function razbitShagi(shagi: readonly Shag[]): { shagi: PrimerShag[]; answer: string } {
  const out: PrimerShag[] = [];
  let answer = '';
  let n = 0;
  for (const s of shagi) {
    if (s.zagolovok === ANSWER) {
      answer = otvetTex(s.stroki[0]);
      continue;
    }
    if (s.zagolovok === CHECK) {
      out.push({ label: CHECK, stroki: s.stroki, check: true });
      continue;
    }
    n += 1;
    out.push({ label: `Шаг ${n}. ${s.zagolovok}`, stroki: s.stroki, check: false });
  }
  return { shagi: out, answer };
}

/** Тело шага: формулы строкой — выносными, остальное — абзацами. */
export function StrokiShaga({ stroki }: { stroki: readonly string[] }) {
  return (
    <>
      {stroki.map((line, i) => {
        const tex = odnaFormula(line);
        return tex === null ? (
          <p className="rich-p" key={i}>
            <Tex text={line} />
          </p>
        ) : (
          <div className="rich-lines" key={i}>
            <Display9 tex={tex} />
          </div>
        );
      })}
    </>
  );
}

export interface Primer9Props {
  title: ReactNode;
  /** Условие: строка с $…$. */
  uslovie: string;
  /** Готовый SVG рисунка (режим на усмотрение вызывающего); null — рисунка нет. */
  svg: string | null;
  alt: string;
  shagi: readonly PrimerShag[];
  /** Готовое «$…$» ответа. */
  answer: string;
  className?: string;
}

/**
 * Разобранный пример в стиле теории линейной функции: условие,
 * рисунок и этапы «Шаг 1…», блок «Проверка на здравый смысл» и
 * ответ. Разметка — классы .rich-example (topic.css): та же, что у
 * примеров теории №12.
 */
export function Primer9({ title, uslovie, svg, alt, shagi, answer, className }: Primer9Props) {
  return (
    <article className={clsx('rich-example z9-primer', svg === null && 'z9-primer--bez', className)}>
      <div className="rich-example__head">
        <h4 className="rich-example__title">{title}</h4>
        <p className="rich-example__condition">
          <Tex text={uslovie} />
        </p>
      </div>
      <div className="rich-example__grid z9-primer__grid">
        {svg === null ? null : <FiguraSvg9 className="rich-example__figure" svg={svg} label={alt} />}
        <ol className="rich-example__steps">
          {shagi.map((item) => (
            <li
              className={clsx('rich-example__step', item.check && 'is-check')}
              key={item.label}
            >
              <span className="rich-example__label">{item.label}</span>
              <StrokiShaga stroki={item.stroki} />
            </li>
          ))}
        </ol>
      </div>
      <p className="rich-example__answer">
        Ответ: <Tex text={answer} />
      </p>
    </article>
  );
}

/** Пример из сгенерированной задачи: рисунок в режиме учителя (все построения). */
export function PrimerIzZadachi({
  task,
  title,
  rezhim = 'teacher',
  className,
}: {
  task: Generated;
  title: ReactNode;
  rezhim?: RezhimRisunka;
  className?: string;
}) {
  const { shagi, answer } = razbitShagi(task.shagi);
  const svg = task.risunok === null ? null : renderFigura(task.risunok, { rezhim });
  return (
    <Primer9
      title={title}
      uslovie={task.uslovie}
      svg={svg}
      alt={`Рисунок к задаче ${task.prototype}`}
      shagi={shagi}
      answer={answer}
      {...(className === undefined ? {} : { className })}
    />
  );
}
