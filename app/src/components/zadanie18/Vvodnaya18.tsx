'use client';

import { ProgressBar } from '@/components/ui';
import { Tex } from '@/components/ui/Tex';
import { VVODNAYA_18 } from '@/content/zadanie18';
import { SOBRANNYE } from '@/content/zadanie18/spisok';
import { status18, useProgress18 } from '@/lib/zadanie18/progress';

/** Якорь блока карточек: кнопка «Учить схемы» ведёт к нему. */
export const YAKOR_KARTOCHEK = 'uchit-skhemy';

/**
 * Вводная плашка вкладки: зачем схемы (две аналогии), как работать с
 * вкладкой и общий прогресс. Заметнее обычной плашки теории: синяя
 * рамка в цвет «Запомни», значок-циркуль и полоса прогресса.
 */
export function Vvodnaya18() {
  const progress = useProgress18();
  const n = SOBRANNYE.length;
  const x = SOBRANNYE.filter((s) => status18(progress[s.id]) === 'known').length;
  return (
    <section className="z18-vv" aria-labelledby="z18-vv-title">
      <div className="z18-vv__ikonka" aria-hidden="true">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Циркуль и линейка: инструменты геометра. */}
          <path d="M24 5.5v3" />
          <circle cx="24" cy="12" r="3.4" />
          <path d="M22.4 15.2 13 40.5M25.6 15.2 35 40.5" />
          <path d="M16.6 31c4.6 2.4 10.2 2.4 14.8 0" />
          <path d="M6 43.5h36" />
          <path
            d="M10 43.5v-2.4M16 43.5v-1.6M22 43.5v-2.4M28 43.5v-1.6M34 43.5v-2.4M40 43.5v-1.6"
            strokeWidth="1.6"
          />
        </svg>
      </div>
      <div className="z18-vv__telo">
        <p className="z18-vv__metka">{VVODNAYA_18.metka}</p>
        <h2 id="z18-vv-title" className="z18-vv__title">
          {VVODNAYA_18.title}
        </h2>
        <div className="z18-vv__tekst">
          {VVODNAYA_18.abzacy.map((a, i) => (
            <p key={i}>
              <Tex text={a} />
            </p>
          ))}
        </div>

        <div className="z18-vv__niz">
          <div className="z18-vv__kak">
            <p className="z18-vv__kak-title">{VVODNAYA_18.kakRabotat}</p>
            <ol className="z18-vv__shagi">
              {VVODNAYA_18.shagi.map((s, i) => (
                <li key={i}>
                  <span className="z18-vv__shag-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="z18-vv__progress">
            <p className="z18-vv__progress-tekst">
              <strong>{VVODNAYA_18.progress(x, n)}</strong> {VVODNAYA_18.progressPodpis}
            </p>
            <ProgressBar value={n === 0 ? 0 : (x / n) * 100} label={VVODNAYA_18.progress(x, n)} />
            <a className="btn btn--primary btn--sm z18-vv__uchit" href={`#${YAKOR_KARTOCHEK}`}>
              {VVODNAYA_18.uchit}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
