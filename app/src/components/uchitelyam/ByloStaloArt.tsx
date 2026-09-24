import { clsx } from 'clsx';
import { uchitelyam } from '@/content/uchitelyam';

const { art } = uchitelyam.hero;
const { kartinki } = uchitelyam;

export interface ByloStaloArtProps {
  /** hero — первый экран лендинга; anons — блок на главной, меньше и без ярлыков. */
  vid: 'hero' | 'anons';
  className?: string;
}

/**
 * Картинка «было → стало»: рукописный лист, стрелка, веер свёрстанных
 * вариантов и рукописная реплика. Утверждена мокапом этапа 1.
 * Вся графика декоративная: смысл передаёт подпись figure.
 */
export function ByloStaloArt({ vid, className }: ByloStaloArtProps) {
  const hero = vid === 'hero';
  const listy = hero ? kartinki.listy : kartinki.listy.slice(0, 3);
  return (
    <figure className={clsx('svc-ba', `svc-ba--${vid}`, className)} aria-label={art.label}>
      {hero ? <span className="svc-chip svc-chip--before">{art.before}</span> : null}
      <img
        className="svc-before"
        src={kartinki.ishodnik}
        width={kartinki.shirina}
        height={kartinki.vysota}
        alt=""
        decoding="async"
      />
      <svg className="svc-arrow" width="120" height="70" viewBox="0 0 120 70" aria-hidden="true">
        <path d="M4 60 C30 64 70 50 108 16" />
        <path d="M92 14 L109 15 L106 32" />
      </svg>
      {hero ? (
        <div className="svc-fan__tabs" aria-hidden="true">
          {art.tabs.map((tab) => (
            <span key={tab}>{tab}</span>
          ))}
        </div>
      ) : null}
      <div className="svc-fan" aria-hidden="true">
        {[...listy].reverse().map((src) => (
          <img
            key={src}
            src={src}
            width={kartinki.shirina}
            height={kartinki.vysota}
            alt=""
            decoding="async"
          />
        ))}
      </div>
      {hero ? <span className="svc-chip svc-chip--after">{art.after}</span> : null}
      <span className="hand-note svc-note" aria-hidden="true">
        {art.note[0]}
        <br />
        {art.note[1]}
      </span>
    </figure>
  );
}
