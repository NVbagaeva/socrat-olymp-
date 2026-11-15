import { levelInfo, type Level } from '@/lib/level';
import { EgeOtschyotKlient, type VidOtschyota } from './EgeOtschyotKlient';
import './otschyot.css';

/* Момент сборки: модуль выполняется один раз, когда страница собирается
   в HTML. Со своим «сейчас» браузер разбирается сам. */
const SBORKA = Date.now();

/**
 * Обратный отсчёт до ЕГЭ по математике. Даты и подписи —
 * config/ege-countdown.ts, расчёт — lib/egeCountdown.ts, фразы дня —
 * content/egeFrazy.ts. Три вида плашки показаны на /styleguide/otschyot/.
 *
 * Серверная обёртка нужна ради одного числа: момент сборки уходит
 * в клиентский компонент пропсом, и первый его проход в браузере
 * совпадает с HTML.
 */
export function EgeOtschyot({
  vid = 'koltso',
  level = 'profile',
  demo,
}: {
  vid?: VidOtschyota;
  level?: Level;
  /** Стайлгайд: момент, который плашка считает «сейчас». */
  demo?: number;
}) {
  return (
    <EgeOtschyotKlient
      sborka={SBORKA}
      vid={vid}
      hrefKnopki={levelInfo(level).variant}
      demo={demo}
    />
  );
}

/** Полоса главной с плашкой — между первым экраном и «Мы взяли на себя…». */
export function OtschyotSection({ level }: { level: Level }) {
  return (
    <section className="otschyot-band" aria-label="Обратный отсчёт до ЕГЭ">
      <div className="wrap">
        <EgeOtschyot level={level} />
      </div>
    </section>
  );
}
