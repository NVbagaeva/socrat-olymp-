import { Tex } from '@/components/ui/Tex';
import { Display } from '@/components/tasks/theory/rich/parts';
import { TeoriyaShell } from '@/components/tasks/veroyatnost/teoriya/TeoriyaShell';
import { WarnIcon } from '@/components/tasks/theory/VerdictIcons';
import { RAZDELY_TEORII_1, TEORIYA_1_TEKSTY, type Razdel1 } from '@/content/teoriya1';
import { PROGRESS_1 } from '@/content/zadanie1';
import { renderPlan } from '@/lib/planimetriya/render';
import { risunokTeorii } from '@/lib/planimetriya/teoriya';
import { Fakt, Kartochka1 } from './Kartochka1';

/** Раздел справочника: лид, карточки, факты, плашка «Запомни». */
function Razdel({ r, trenazher }: { r: Razdel1; trenazher?: (proto: number) => string }) {
  return (
    <div className="qth">
      <p className="qth__lead">
        <Tex text={r.lead} />
      </p>
      {r.kartochki.length === 0 ? null : (
        <ul className="qth__cards">
          {r.kartochki.map((k) => (
            <Kartochka1 k={k} trenazher={trenazher} key={k.id} />
          ))}
        </ul>
      )}
      {r.fakty === undefined ? null : (
        <ul className="z1-fakty">
          {r.fakty.map((f) => (
            <Fakt f={f} trenazher={trenazher} key={f.no} />
          ))}
        </ul>
      )}
      {r.dlya17 === undefined ? null : (
        <details className="z1-dlya17">
          <summary className="z1-dlya17__summary">{TEORIYA_1_TEKSTY.dlya17}</summary>
          <p className="z1-dlya17__lead">{TEORIYA_1_TEKSTY.dlya17Lead}</p>
          <ol className="z1-dlya17__list">
            {r.dlya17.map((f) => (
              <li value={f.no} key={f.no}>
                <Tex text={f.tekst} />
                {f.formula === undefined ? null : <Display tex={f.formula} />}
              </li>
            ))}
          </ol>
        </details>
      )}
      <section className="nofn-note nofn-note--warm qth__note">
        <h4 className="nofn-note__title">
          <WarnIcon />
          {TEORIYA_1_TEKSTY.zapomni}
        </h4>
        {r.zapomni.map((t) => (
          <p className="nofn-note__text qth__note-text" key={t}>
            <Tex text={t} />
          </p>
        ))}
      </section>
    </div>
  );
}

/**
 * Вкладка «Теория» задания №1: тринадцать разделов справочника подряд,
 * содержание рядом — оболочка теории №4 и №2 (TeoriyaShell). Карточки
 * — разметка теории №12 (qth-card) с чертежами движка планиметрии;
 * на шести карточках чертёж живой. В конце — лайфхаки для №1 и
 * свёрнутая панель фактов для №17.
 */
export function Teoriya1({
  vkladka,
  spravochnik,
  trenazher,
}: {
  vkladka: string;
  /** Адрес печатного справочника. */
  spravochnik: string;
  trenazher?: (proto: number) => string;
}) {
  const tela = Object.fromEntries(
    RAZDELY_TEORII_1.map((r) => [r.id, <Razdel r={r} trenazher={trenazher} key={r.id} />]),
  );
  const dekor = risunokTeorii('centralnyy-vpisannyy');
  return (
    <>
      <p className="z1-skachat">
        <a className="btn btn--secondary" href={spravochnik}>
          {TEORIYA_1_TEKSTY.skachat}
        </a>
      </p>
      <TeoriyaShell
        vkladka={vkladka}
        razdely={RAZDELY_TEORII_1}
        tela={tela}
        dekor={{
          kartinka: (
            <span
              className="pl-wrap z1-dekor"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: renderPlan(dekor.scena, { ...dekor.optsii, shirina: 200, vysota: 140 }),
              }}
            />
          ),
          note: 'Вписанный угол — половина центрального: с этого начинаются все задачи на окружность.',
        }}
        trackKey={PROGRESS_1.teoriyaKey}
      />
    </>
  );
}
