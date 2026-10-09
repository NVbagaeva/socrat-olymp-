import { clsx } from 'clsx';
import { Tex } from '@/components/ui/Tex';
import { katex } from '@/lib/graph/katex';

/* Куски разметки разделов теории блоками: их же берёт разобранный
   пример на вкладке «О задании» (RichExampleBlock). */

/** Выносная формула: KaTeX на сборке, крупные дроби. */
export function Display({ tex, className }: { tex: string; className?: string }) {
  return (
    <span
      className={clsx('rich-formula', className)}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, displayMode: true }),
      }}
    />
  );
}

export function Paras({ paras, className }: { paras: string[] | undefined; className?: string }) {
  if (paras === undefined) {
    return null;
  }
  return (
    <>
      {paras.map((para) => (
        <p className={clsx('rich-p', className)} key={para}>
          <Tex text={para} />
        </p>
      ))}
    </>
  );
}

export function Lines({ lines }: { lines: string[] | undefined }) {
  if (lines === undefined) {
    return null;
  }
  return (
    <div className="rich-lines">
      {lines.map((line) => (
        <Display tex={line} key={line} />
      ))}
    </div>
  );
}

