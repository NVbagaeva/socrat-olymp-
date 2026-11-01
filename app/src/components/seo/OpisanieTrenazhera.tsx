import Link from 'next/link';
import { OPISANIE, type VidBloka } from '@/content/opisanieBlokov';
import type { PrimerZadachi } from '@/lib/primery/primery';
import { quizLd } from '@/lib/schema';
import { JsonLd } from './JsonLd';
import '@/components/variant/sectionStyles';
import '@/components/variant/variant.css';
import './opisanie.css';

export interface SsylkaBloka {
  href: string;
  label: string;
}

export interface OpisanieTrenazheraProps {
  /** Номер задания; у «Собрать вариант» — 0. */
  no: number;
  vid: VidBloka;
  /** Примеры задач из банка (lib/primery/primery.ts): условие и рисунок. */
  primery: readonly PrimerZadachi[];
  /** Ссылки на соседние вкладки и страницы раздела. */
  ssylki: readonly SsylkaBloka[];
  /** Режимы тренажёра — обычными ссылками, чтобы их страницы были достижимы. */
  rezhimy?: readonly SsylkaBloka[];
  /** Адрес страницы — для разметки Quiz. */
  href: string;
  /** Название страницы — для разметки Quiz. */
  nazvanie?: string;
}

/**
 * Статический блок под тренажёром или генератором: виден без
 * JavaScript, в HTML сборки. Что это за инструмент, 2–3 примера задач
 * из банка (без ответов) и ссылки на теорию, опорные задачи и режимы.
 * Оформление — карточки задач «Собрать вариант» (var-task).
 */
export function OpisanieTrenazhera({
  no,
  vid,
  primery,
  ssylki,
  rezhimy,
  href,
  nazvanie,
}: OpisanieTrenazheraProps) {
  const t = OPISANIE[vid];
  const id = `opisanie-${vid}`;
  return (
    <section className="opisanie" aria-labelledby={id}>
      {vid === 'trenazher' && primery.length > 0 ? (
        <JsonLd
          data={quizLd(
            nazvanie ?? `Тренажёр задания ${no} ЕГЭ профиль`,
            href,
            no,
            primery.map((p) => ({ uslovie: p.uslovieHtml.replace(/<[^>]+>/g, ' ') })),
          )}
        />
      ) : null}
      <h2 id={id} className="t-h3 opisanie__title">
        {t.title}
      </h2>
      <p className="opisanie__lead">{t.tekst(no)}</p>

      {rezhimy === undefined || rezhimy.length === 0 ? null : (
        <nav className="opisanie__nav" aria-label={OPISANIE.rezhimy}>
          <h3 className="t-h4">{OPISANIE.rezhimy}</h3>
          <ul className="opisanie__links">
            {rezhimy.map((r) => (
              <li key={r.href}>
                <Link href={r.href}>{r.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {primery.length === 0 ? null : (
        <>
          <h3 className="t-h4 opisanie__sub">{OPISANIE.primery}</h3>
          <p className="opisanie__note">
            {vid === 'variant' ? OPISANIE.primeryLeadVariant : OPISANIE.primeryLead}
          </p>
          <ol className="var-paper__tasks opisanie__tasks">
            {primery.map((p, i) => (
              <li key={i} className="var-task">
                {p.podtip === '' ? null : (
                  <div className="var-task__bar">
                    <span className="var-task__meta">{p.podtip}</span>
                  </div>
                )}
                <div className="var-task__body">
                  <span className="var-task__no">{i + 1}</span>
                  <div
                    className="var-task__text"
                    dangerouslySetInnerHTML={{ __html: p.uslovieHtml }}
                  />
                  {p.risunok === null ? null : (
                    <div
                      className={
                        p.risunok.below === true ? 'var-task__fig is-below' : 'var-task__fig'
                      }
                      dangerouslySetInnerHTML={{ __html: p.risunok.svg }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {ssylki.length === 0 ? null : (
        <nav className="opisanie__nav" aria-label={OPISANIE.dalshe}>
          <h3 className="t-h4">{OPISANIE.dalshe}</h3>
          <ul className="opisanie__links">
            {ssylki.map((s) => (
              <li key={s.href}>
                <Link href={s.href}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
