import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GLAVY_15, GLAVY_3 } from '@/content/stereo/glavy';
import { RAZBOR_STEREO, TIPY_15, TIPY_3 } from '@/content/stereo/tipy';
import { STEREO, type StereoNo } from '@/content/stereo/zadaniya';
import { ZADANIYA } from '@/lib/paths';
import { razbor3, RAZBORY_3, type RazborStereo as Razbor } from '@/lib/stereo/razbory3';
import { razbor15, RAZBORY_15 } from '@/lib/stereo/razbory15';
import { RazborStereo } from './RazborStereo';

const DANNYE = {
  '3': { tipy: TIPY_3, glavy: GLAVY_3, razbor: razbor3, vse: RAZBORY_3 },
  '15': { tipy: TIPY_15, glavy: GLAVY_15, razbor: razbor15, vse: RAZBORY_15 },
} as const;

/** Типы задания, у которых есть разбор: параметры статических страниц. */
export function tipySRazborom(no: StereoNo): { tip: string }[] {
  return DANNYE[no].vse.map((r: Razbor) => ({ tip: r.tip }));
}

/** Название типа для заголовка окна. */
export function nazvanieTipa(no: StereoNo, tip: string): string | undefined {
  return DANNYE[no].tipy.find((t) => t.id === tip)?.title;
}

/**
 * Страница разбора типа (карточка вкладки «О задании»): задача по шагам
 * на живом чертеже, ссылки назад к типам, в главу теории и в тренажёр.
 * Лента вкладок остаётся на «О задании» — это её продолжение.
 */
export function RazborStranitsa({ no, tip }: { no: StereoNo; tip: string }) {
  const d = DANNYE[no];
  const razbor = d.razbor(tip);
  const t = d.tipy.find((item) => item.id === tip);
  if (razbor === undefined || t === undefined) {
    notFound();
  }
  const glava = d.glavy.find((g) => g.id === t.glava);
  const base = `${ZADANIYA}/${STEREO[no].slug}`;
  return (
    <>
      <p className="stereo-razbor__back">
        <Link className="razdely-vse" href={`${base}/#tipy`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m15 6-6 6 6 6" />
          </svg>
          {RAZBOR_STEREO.nazad}
        </Link>
      </p>
      <RazborStereo razbor={razbor} title={t.title} />
      <div className="stereo-razbor__foot">
        {glava === undefined ? null : (
          <Link className="btn btn--secondary" href={`${base}/teoriya/#teoriya-${glava.id}`}>
            {RAZBOR_STEREO.glava} {glava.nomer}. {glava.title}
          </Link>
        )}
        <Link className="btn btn--primary" href={`${base}/trenazher/`}>
          {RAZBOR_STEREO.trenazher}
        </Link>
      </div>
    </>
  );
}
