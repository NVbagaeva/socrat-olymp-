import Link from 'next/link';
import { REPETITORY_7 } from '@/content/zadanie7';

const T = REPETITORY_7;

/**
 * Вкладка «Для репетиторов» №7 — пока заглушка. Серии уроков
 * добавятся списком в content/uroki7.ts: сборка листов урока
 * (lib/zadanie7/sborka.ts — modelUroka, urokQuery) и печатный лист
 * (?kod=…&u=…) уже готовы и берут задачи из того же банка.
 */
export function Repetitory7({ base }: { base: string }) {
  return (
    <section className="z7-rep">
      <h2 className="t-h3">{T.lead}</h2>
      <p>{T.tekst}</p>
      <p className="z7-rep__ssylki">
        <Link className="btn btn--primary" href={`${base}/generator/`}>
          {T.generator}
        </Link>
        <Link className="btn btn--secondary" href={`${base}/shpargalka/`}>
          {T.shpargalka}
        </Link>
      </p>
    </section>
  );
}
