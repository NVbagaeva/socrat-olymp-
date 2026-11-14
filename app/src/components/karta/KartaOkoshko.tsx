import { clsx } from 'clsx';
import Link from 'next/link';
import { KARTA_TEKST } from '@/content/karta/teksty';
import { oZadaniiHref, trenazherHref } from '@/lib/karta/katalog';
import type { SostoyanieOblasti } from '@/lib/karta/model';
import { nomerRazdela } from '@/content/struktura';

/**
 * Окошко над областью: название раздела и «тропинка» тем-городов.
 * Тема ведёт в тренажёр сразу с ней, стрелка — на вкладку «О задании».
 * Окошко стоит над островом и едет вместе с картой (место считает CSS
 * из переменных вида --k, --x, --y).
 */
export function KartaOkoshko({
  oblast,
  nazvanie,
  mesto,
  onZakryt,
}: {
  oblast: SostoyanieOblasti;
  nazvanie: string;
  /** Точка на карте, над которой стоит окошко. */
  mesto: { x: number; y: number };
  onZakryt: () => void;
}) {
  const { no } = oblast;
  /* no — номер хранения раздела (ключ области); на экран — номер ЕГЭ. */
  const nomer = nomerRazdela(no);
  const net = oblast.sostoyanie === 'skoro';
  return (
    <div
      className="karta-okoshko"
      style={{ '--mx': mesto.x, '--my': mesto.y } as React.CSSProperties}
      data-karta-ne-holst=""
      role="dialog"
      aria-label={`№${nomer} ${nazvanie}`}
    >
      <div className="karta-okoshko__telo stk-glass">
        <div className="karta-okoshko__shapka">
          {net ? (
            <span className="karta-okoshko__nazvanie">
              №{nomer} {nazvanie}
            </span>
          ) : (
            <Link className="karta-okoshko__nazvanie" href={oZadaniiHref(no)} data-okoshko-fokus="">
              <span>
                №{nomer} {nazvanie}
              </span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
              <span className="sr-only">— {KARTA_TEKST.oZadanii}</span>
            </Link>
          )}
          <button
            type="button"
            className="karta-okoshko__zakryt"
            onClick={onZakryt}
            aria-label={KARTA_TEKST.zakryt}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {oblast.sostoyanie === 'skoro' || oblast.sostoyanie === 'pozzhe' ? (
          <p className="karta-okoshko__zametka">
            {oblast.sostoyanie === 'skoro' ? KARTA_TEKST.skoro : KARTA_TEKST.pozzhe}
          </p>
        ) : (
          <ol className="karta-tropinka">
            {oblast.gruppy.map((g) => {
              const tekushchaya = g.id === oblast.tekushchaya;
              const href = trenazherHref(no, g.id);
              const vid =
                g.sostoyanie === 'osvoeno' ? 'osvoeno' : tekushchaya ? 'tekushchaya' : 'pusto';
              const telo = (
                <>
                  <span className="karta-gorod__tochka" aria-hidden="true">
                    {g.sostoyanie === 'osvoeno' ? (
                      <svg viewBox="0 0 24 24">
                        <path d="M6.5 12.5l3.6 3.6 7.4-8" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="karta-gorod__imya">{g.nazvanie}</span>
                  <span className="sr-only">
                    {' — '}
                    {tekushchaya ? KARTA_TEKST.gorod.tekushchaya : KARTA_TEKST.gorod[g.sostoyanie]}
                    {g.povtorit ? ', стоит повторить' : ''}
                  </span>
                </>
              );
              return (
                <li
                  key={g.id}
                  className={clsx(
                    'karta-gorod',
                    `karta-gorod--${vid}`,
                    g.povtorit && 'is-povtorit',
                  )}
                >
                  {href === null ? (
                    <span className="karta-gorod__ssylka">{telo}</span>
                  ) : (
                    <Link className="karta-gorod__ssylka" href={href}>
                      {telo}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <span className="karta-okoshko__hvost" aria-hidden="true" />
    </div>
  );
}
