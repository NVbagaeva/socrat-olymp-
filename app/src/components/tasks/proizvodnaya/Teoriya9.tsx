import { clsx } from 'clsx';
import { Fragment, type ReactNode } from 'react';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { Tex } from '@/components/ui/Tex';
import {
  RAZDELY_TEORII_9,
  podpunkty9,
  type PBlock,
  type PExample,
} from '@/content/theoryProizvodnaya';
import { generate, opornayaSeed } from '@/lib/proizvodnaya/generate';
import { prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { renderFigura } from '@/lib/proizvodnaya/render';
import { stsena, type StsenaId } from '@/lib/proizvodnaya/stseny';
import type { Generated } from '@/lib/proizvodnaya/types';
import { WarnIcon } from '../theory/VerdictIcons';
import { FiguraSvg9 } from './FiguraSvg9';
import { Display9, Primer9, PrimerIzZadachi } from './Primer9';

/** Рисунок сцены теории: движок рисует в режиме, заданном сценой. */
function Stsena9({ id, className, label }: { id: StsenaId; className?: string; label?: string }) {
  const s = stsena(id);
  const svg = renderFigura(s.fig, { rezhim: s.rezhim });
  return (
    <FiguraSvg9
      svg={svg}
      label={label ?? s.fig.alt ?? 'Рисунок'}
      {...(className === undefined ? {} : { className })}
    />
  );
}

/** Сгенерированный разобранный пример прототипа группы; нет прототипа — null. */
function zadachaGruppy(block: Extract<PBlock, { type: 'proto' }>): Generated | null {
  const proto = prototypesOfGroup(block.gruppa)[block.nomer];
  if (proto === undefined) {
    return null;
  }
  try {
    return generate(proto.id, opornayaSeed(proto.id));
  } catch {
    return null;
  }
}

function RuchnoyPrimer({ block }: { block: PExample }) {
  const s = stsena(block.figure);
  const svg = renderFigura(s.fig, { rezhim: s.rezhim });
  return (
    <Primer9
      title={<Tex text={block.title} />}
      uslovie={block.condition}
      svg={svg}
      alt={s.fig.alt ?? 'Рисунок к примеру'}
      shagi={block.steps.map((step) => ({
        label: step.label,
        check: step.check === true,
        stroki: [...(step.paras ?? []), ...(step.lines ?? []).map((line) => `$${line}$`)],
      }))}
      answer={block.answer}
    />
  );
}

/* Блок — обычная функция разметки, а не компонент: вложенные блоки
   (подраздел) зовут её же, ключ стоит на Fragment вокруг. */
function renderBlock(block: PBlock): ReactNode {
  switch (block.type) {
    case 'text':
      return (
        <div className={clsx('rich-text', block.lead === true && 'rich-text--lead')}>
          {block.paras.map((para) => (
            <p className="rich-p" key={para}>
              <Tex text={para} />
            </p>
          ))}
        </div>
      );

    case 'main-formula':
      return (
        <div className={clsx('rich-main', block.figure !== undefined && 'rich-main--figure')}>
          <div className="rich-main__frame">
            <span className="rich-main__chip">
              <Tex text={block.chip} />
            </span>
            <div className="rich-main__body">
              <Display9 tex={block.formula} className="rich-main__formula" />
              <p className="rich-main__note">
                <Tex text={block.note} />
              </p>
            </div>
          </div>
          {block.figure === undefined ? null : (
            <Stsena9 id={block.figure} className="rich-main__figure" />
          )}
        </div>
      );

    case 'steps':
      return (
        <ol className="rich-steps">
          {block.items.map((item) => (
            <li className="rich-step" key={item.no}>
              <span className="rich-step__no" aria-hidden="true">
                {item.no}
              </span>
              <div className="rich-step__body">
                <h4 className="rich-step__title">
                  <span className="sr-only">Шаг {item.no}. </span>
                  <Tex text={item.title} />
                </h4>
                {(item.paras ?? []).map((para) => (
                  <p className="rich-p" key={para}>
                    <Tex text={para} />
                  </p>
                ))}
                {item.boxed === undefined ? null : (
                  <Display9 tex={item.boxed} className="rich-step__boxed" />
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    case 'remember':
      return (
        <section className="nofn-note nofn-note--warm rich-remember">
          <h4 className="nofn-note__title">
            <WarnIcon />
            {block.title ?? 'Запомни'}
          </h4>
          {block.paras.map((para) => (
            <p className="nofn-note__text" key={para}>
              <Tex text={para} />
            </p>
          ))}
        </section>
      );

    case 'memo':
      return (
        <ol className="rich-memo">
          {block.items.map((item) => (
            <li key={item}>
              <Tex text={item} />
            </li>
          ))}
        </ol>
      );

    case 'sub':
      return (
        <section className="rich-sub z9-sub" id={block.id}>
          <h4 className="rich-sub__title">
            <span className="rich-sub__no">{block.no}</span>
            <Tex text={block.title} />
          </h4>
          {block.blocks.map((inner, index) => (
            <Fragment key={index}>{renderBlock(inner)}</Fragment>
          ))}
        </section>
      );

    case 'example':
      return <RuchnoyPrimer block={block} />;

    case 'proto': {
      const task = zadachaGruppy(block);
      return task === null ? null : (
        <PrimerIzZadachi task={task} title={<Tex text={block.title} />} />
      );
    }

    case 'pair':
      return (
        <div className="z9-pair">
          {block.items.map((item) => (
            <figure className="z9-pair__item" key={item.figure}>
              <Stsena9 id={item.figure} />
              <figcaption className="z9-pair__caption">
                <Tex text={item.caption} />
              </figcaption>
            </figure>
          ))}
        </div>
      );

    case 'figure':
      return (
        <figure className="z9-figure">
          <Stsena9 id={block.figure} />
          {block.caption === undefined ? null : (
            <figcaption className="z9-pair__caption">
              <Tex text={block.caption} />
            </figcaption>
          )}
        </figure>
      );

    case 'table':
      return (
        <div className="z9-tabl">
          <table className="z9-tabl__table">
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th scope="col" key={cell}>
                    <Tex text={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th scope="row" key={cell}>
                        <Tex text={cell} />
                      </th>
                    ) : (
                      <td key={cell}>
                        <Tex text={cell} />
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Вкладка «Теория» задания №9: шесть разделов подряд и «Содержание»
 * рядом — та же оболочка, что у теории №2 и №4 (липкая полоса ниже
 * 1024 px, правая колонка на широком экране). Разметка разделов —
 * блоки теории линейной функции: рамка с формулой, шаги, разобранные
 * примеры, плашки «Запомни». Тексты — content/theoryProizvodnaya.ts,
 * рисунки — lib/proizvodnaya/stseny.ts.
 */
export function Teoriya9({ vkladka }: { vkladka: string }) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_9.map((razdel) => [
      razdel.id,
      <div className="rich z9-teoriya" key={razdel.id}>
        {razdel.blocks.map((block, index) => (
          <Fragment key={index}>{renderBlock(block)}</Fragment>
        ))}
      </div>,
    ]),
  );
  const razdely = RAZDELY_TEORII_9.map((razdel) => ({
    id: razdel.id,
    title: razdel.title,
    podpunkty: podpunkty9(razdel),
  }));

  /* Декор колонки содержания — наклон касательной без подписи:
     рядом стоит подпись словами, сам рисунок для скринридера — украшение. */
  const dekor = stsena('naklon-vverh');
  const dekorSvg = renderFigura(
    { ...dekor.fig, alt: '', pomoshch: undefined },
    { rezhim: 'student' },
  );
  return (
    <TeoriyaShell
      vkladka={vkladka}
      razdely={razdely}
      tela={tela}
      dekor={{
        kartinka: <span className="z9-dekor" dangerouslySetInnerHTML={{ __html: dekorSvg }} />,
        note: 'Производная — это наклон: куда идёт график, такой и знак.',
      }}
      trackKey="9"
    />
  );
}
