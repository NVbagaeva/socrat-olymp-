import type { Metadata } from 'next';
import Link from 'next/link';
import { EgeOtschyot } from '@/components/landing/otschyot/EgeOtschyot';
import type { VidOtschyota } from '@/components/landing/otschyot/EgeOtschyotKlient';
import { EGE_CELI } from '@/config/ege-countdown';
import { mskMoment } from '@/lib/egeCountdown';
import '../../landing.css';
import './otschyot-demo.css';

/* Варианты плашки обратного отсчёта до ЕГЭ и все её состояния. Состояния
   показаны подменой «сейчас» (проп demo): время в них идёт, но от
   выбранного момента. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — обратный отсчёт до ЕГЭ',
  robots: { index: false, follow: false },
};

const VIDY: { vid: VidOtschyota; nazvanie: string; opisanie: string }[] = [
  {
    vid: 'koltso',
    nazvanie: '1. Стеклянное кольцо',
    opisanie:
      'Стоит на главной. Число дней — в стеклянной линзе, вокруг — кольцо «пройдено учебного года».',
  },
  {
    vid: 'karty',
    nazvanie: '2. Стеклянные карточки цифр',
    opisanie: 'Дни, часы, минуты и секунды — карточками, цифры перелистываются. Год — полосой.',
  },
  {
    vid: 'lenta',
    nazvanie: '3. Стеклянная лента',
    opisanie:
      'Низкая горизонтальная лента: занимает меньше всего места, прогресс — по нижнему краю.',
  },
];

const ege = mskMoment(EGE_CELI[0]?.data ?? '2027-06-07', EGE_CELI[0]?.vremya);
const CHAS = 3600_000;
const SUTKI = 24 * CHAS;

const SOSTOYANIYA: { id: string; nazvanie: string; demo: number }[] = [
  { id: 'za-200', nazvanie: 'За 200 дней', demo: ege - 200 * SUTKI - 5 * CHAS },
  { id: 'za-21', nazvanie: 'За 21 день («остался»)', demo: ege - 21 * SUTKI - 3 * CHAS },
  { id: 'za-1', nazvanie: 'За 1 день', demo: ege - SUTKI - 2 * CHAS },
  { id: 'sutki', nazvanie: 'Последние сутки', demo: ege - 13 * CHAS - 25 * 60_000 },
  { id: 'segodnya', nazvanie: 'День экзамена (за 5 минут до начала)', demo: ege - 5 * 60_000 },
  { id: 'posle', nazvanie: 'После экзамена — отсчёт до пересдачи', demo: ege + 3 * SUTKI },
];

export default function Page() {
  return (
    <div className="glavnaya eo-demo">
      <main className="wrap">
        <p className="eo-demo__nazad">
          <Link href="/styleguide/">← Design System</Link>
        </p>
        <h1 className="eo-demo__h1">Обратный отсчёт до ЕГЭ</h1>
        <p className="eo-demo__lead">
          Три варианта плашки для главной в «Стеклянной сцене». Даты и подписи —{' '}
          <code>src/config/ege-countdown.ts</code>.
        </p>

        {VIDY.map((v) => (
          <section className="eo-demo__blok" id={v.vid} key={v.vid}>
            <h2>{v.nazvanie}</h2>
            <p>{v.opisanie}</p>
            <EgeOtschyot vid={v.vid} />
          </section>
        ))}

        <h2 className="eo-demo__h2">Состояния</h2>
        {SOSTOYANIYA.map((s) => (
          <section className="eo-demo__blok" id={s.id} key={s.id}>
            <h3>{s.nazvanie}</h3>
            <div className="eo-demo__ryad">
              {VIDY.map((v) => (
                <EgeOtschyot key={v.vid} vid={v.vid} demo={s.demo} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
