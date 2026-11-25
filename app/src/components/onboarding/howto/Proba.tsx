'use client';

import { clsx } from 'clsx';
import katex from 'katex';
import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { AnswerInput } from '@/components/tasks/otvet/AnswerInput';
import { Ikonka } from '@/components/tasks/steklo';
import { PodskazkaVoprosy, type VoprosPodskazki } from '@/components/tasks/trening/PodskazkaVoprosy';
import { HOWTO, HOWTO_HREFS } from '@/content/kakPolzovatsya';
import '@/components/tasks/steklo/steklo.css';
import '@/components/tasks/trening/trening.css';
import 'katex/dist/katex.min.css';

const P = HOWTO.proba;

function tex(s: string): string {
  return katex.renderToString(s, { throwOnError: false });
}

/** Три вопроса подсказки — как в тренажёре: по одному, с вариантами. */
const VOPROSY: VoprosPodskazki[] = [
  {
    voprosHtml: 'Сколько всего шаров в коробке?',
    variantyHtml: [tex('6'), tex('10'), tex('4')],
    verno: 1,
    kommentariyHtml: `${tex('4+6=10')}.`,
  },
  {
    voprosHtml: 'Сколько из них подходят — синих?',
    variantyHtml: [tex('4'), tex('6'), tex('10')],
    verno: 0,
  },
  {
    voprosHtml: 'Что на что делим?',
    variantyHtml: [`${tex('4')} на ${tex('10')}`, `${tex('4')} на ${tex('6')}`, `${tex('6')} на ${tex('10')}`],
    verno: 0,
    kommentariyHtml: `Подходящие на все: ${tex('\\dfrac{4}{10}')}.`,
  },
];

const USLOVIE = P.uslovieHtml.replace(/\d+/g, (d) => tex(d));
const RESHENIE = tex('P=\\dfrac{4}{10}=0{,}4');

/** «0,4» и «0.4» (пробелы не мешают) — верно. */
function verno(v: string): boolean {
  return /^0[.,]4$/.test(v.replace(/\s+/g, ''));
}

/**
 * «Попробуй подсказку»: одна задача тренажёра на странице. Подсказка —
 * тот же PodskazkaVoprosy и те же стили, что в тренажёре.
 */
export default function Proba({ title }: { title: string }) {
  const [value, setValue] = useState('');
  const [sost, setSost] = useState<'vvod' | 'verno' | 'neverno'>('vvod');
  const [otkryta, setOtkryta] = useState(false);
  const [otkryto, setOtkryto] = useState(1);
  const [mimo, setMimo] = useState<number[]>([]);

  const proverit = () => {
    if (value.trim() === '') return;
    setSost(verno(value) ? 'verno' : 'neverno');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      proverit();
    }
  };
  const zanovo = () => {
    setValue('');
    setSost('vvod');
    setOtkryta(false);
    setOtkryto(1);
    setMimo([]);
  };
  const gotovo = sost === 'verno';

  return (
    <section className="proba" aria-labelledby="howto-proba">
      <h2 className="howto__h" id="howto-proba">
        {title}
      </h2>
      <div
        className={clsx(
          'trn-ekran proba__ekran',
          sost === 'verno' && 'trn-ekran--verno',
          sost === 'neverno' && 'trn-ekran--razbor',
        )}
      >
        <article className="trn-zadacha stk-glass proba__zadacha">
          <p
            className="trn-uslovie trn-uslovie--tekst"
            dangerouslySetInnerHTML={{ __html: USLOVIE }}
          />
          <div className="trn-otvetnaya">
            <label className="trn-pole">
              <span className="stk-podpis">{P.otvet}</span>
              <span className="trn-pole__ryad">
                <AnswerInput
                  className="trn-input"
                  placeholder={P.placeholder}
                  value={value}
                  state={gotovo ? 'success' : 'default'}
                  readOnly={gotovo}
                  onChange={(v) => {
                    setValue(v);
                    if (sost === 'neverno') setSost('vvod');
                  }}
                  onKeyDown={onKey}
                />
                {gotovo ? null : (
                  <button
                    type="button"
                    className="stk-btn stk-btn--primary stk-btn--lg"
                    onClick={proverit}
                    disabled={value.trim() === ''}
                  >
                    {P.proverit}
                  </button>
                )}
              </span>
            </label>

            {sost === 'neverno' ? (
              /* Неверно — мягко, янтарём, без красного. */
              <div className="trn-verdikt trn-verdikt--razbor" role="status">
                <span className="trn-verdikt__ico">
                  <Ikonka name="lampa" />
                </span>
                <span className="trn-verdikt__text">
                  <span>{P.neverno}</span>
                </span>
              </div>
            ) : null}

            {gotovo ? (
              <div className="trn-verdikt trn-verdikt--da" role="status">
                <span className="trn-verdikt__ico">
                  <Ikonka name="da" />
                </span>
                <span className="trn-verdikt__text">
                  <b>{P.verno}</b>
                  <span dangerouslySetInnerHTML={{ __html: RESHENIE }} />
                </span>
              </div>
            ) : null}

            {gotovo ? null : otkryta ? (
              <div className="trn-podskazka trn-podskazka--voprosy" role="note">
                <PodskazkaVoprosy
                  voprosy={VOPROSY}
                  otkryto={otkryto}
                  mimo={mimo}
                  onVerno={() => {
                    setOtkryto((n) => n + 1);
                    setMimo([]);
                  }}
                  onMimo={(j) => setMimo((m) => [...m, j])}
                  labels={P.voprosy}
                />
              </div>
            ) : (
              <button
                type="button"
                className="trn-podskazka-knopka"
                onClick={() => setOtkryta(true)}
              >
                <Ikonka name="lampa" /> {P.podskazka}
              </button>
            )}

            {gotovo ? (
              <div className="proba__dalshe">
                <Link className="btn btn--primary" href={HOWTO_HREFS.trenazher}>
                  {P.trenazher}
                </Link>
                <button type="button" className="btn btn--secondary" onClick={zanovo}>
                  {P.zanovo}
                </button>
              </div>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
