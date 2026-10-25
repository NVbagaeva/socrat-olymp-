import katex from 'katex';
import { Tex } from '@/components/ui/Tex';
import type { RazborStereo as Razbor } from '@/lib/stereo/razbory3';
import { ORTHO_AZIMUTH, ORTHO_ELEVATION, orthoAt } from '@/lib/solid/project';
import { renderSolid } from '@/lib/solid/render';
import { typeset } from '@/lib/tex';
import { RAZBOR_STEREO } from '@/content/stereo/tipy';
import { RazborKlient, type ShagHtml } from './RazborKlient';

/** Наибольший шаг среди элементов чертежа. */
function shagovNaChertezhe(razbor: Razbor): number {
  const m = razbor.model();
  const items = [
    ...(m.lines ?? []),
    ...(m.sections ?? []),
    ...(m.angles ?? []),
    ...(m.marks ?? []),
    ...(m.measures ?? []),
    ...(m.notes ?? []),
  ];
  return Math.max(0, ...items.map((x) => x.shag ?? 0));
}

/**
 * Разобранный пример типа задачи — в оформлении разборов №12 (условие,
 * рисунок слева, шаги справа, «Ответ» внизу), но рисунок живой: его
 * можно повернуть, а шаг решения выделяет на нём свои элементы.
 * Формулы набираются KaTeX на сборке.
 */
export function RazborStereo({ razbor, title }: { razbor: Razbor; title: string }) {
  const model = razbor.model();
  const n = shagovNaChertezhe(razbor);
  const svg = renderSolid(model, {
    view: orthoAt(ORTHO_AZIMUTH, ORTHO_ELEVATION),
    ustoychivo: true,
    ...(n > 0 ? { shag: 0 } : {}),
  });
  const shagi: ShagHtml[] = razbor.shagi.map((s) => ({
    ...(s.punkt === undefined ? {} : { punkt: s.punkt }),
    chto: typeset(s.chto),
    telo:
      s.zachem.map((p) => `<p class="rich-example__para">${typeset(p)}</p>`).join('') +
      (s.formuly ?? [])
        .map(
          (f) =>
            `<div class="stereo-razbor__formula">${katex.renderToString(f, {
              throwOnError: true,
              displayMode: true,
            })}</div>`,
        )
        .join(''),
  }));
  const istochnik =
    razbor.fipi === undefined ? RAZBOR_STEREO.proshlye : `${RAZBOR_STEREO.fipi} · ${razbor.fipi}`;
  return (
    <article className="rich-example rich-example--wide stereo-razbor">
      <div className="rich-example__head">
        <h3 className="rich-example__title">
          <Tex text={title} />
        </h3>
        <p className="stereo-razbor__istochnik">{istochnik}</p>
        <p className="rich-example__condition">
          <Tex text={razbor.uslovie} />
        </p>
      </div>
      <RazborKlient
        model={model}
        svg={svg}
        azimuth={ORTHO_AZIMUTH}
        elevation={ORTHO_ELEVATION}
        shagovChertezha={n}
        shagi={shagi}
      />
      <p className="rich-example__answer">
        {RAZBOR_STEREO.otvet}:{' '}
        <Tex text={razbor.otvetTex ?? `$${String(razbor.otvet).replace('.', '{,}')}$`} />
      </p>
    </article>
  );
}
