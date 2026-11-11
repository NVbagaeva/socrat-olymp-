import type { Metadata } from 'next';
import { Plashka } from '@/components/tarify/Plashka';
import { plashki, type Rol, type Srok } from '@/lib/tarify/config';
import '@/components/tarify/tarify.css';
import './vitrina.css';

/* Служебная витрина тарифов: варианты оформления плашек на настоящих
   текстах из lib/tarify/config.ts. В поиск не попадает, из меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — витрина тарифов',
  robots: { index: false, follow: false },
};

const VARIANTY: { vid: 'a' | 'b'; nazvanie: string; opisanie: string; rol: Rol; srok: Srok }[] = [
  {
    vid: 'a',
    nazvanie: 'Вариант А — «Светлое стекло»',
    opisanie:
      'Все три плашки из матового стекла. Главная крупнее, в тёплом оттенке и с оранжевым свечением. Пример: ученик, 30 дней.',
    rol: 'uchenik',
    srok: 'd30',
  },
  {
    vid: 'b',
    nazvanie: 'Вариант Б — «Ночная сцена»',
    opisanie:
      'Главная плашка — тёмное синее стекло с тёплым свечением по кромке, соседние — светлые. Пример: репетитор, до ЕГЭ.',
    rol: 'repetitor',
    srok: 'ege',
  },
];

export default function Page() {
  return (
    <main className="tfv">
      <header className="tfv__shapka">
        <p className="tfv__nad">Служебная страница</p>
        <h1>Тарифы: два варианта плашек</h1>
      </header>

      {VARIANTY.map((variant) => (
        <section key={variant.vid} className={`tf tf--${variant.vid} tfv__variant`}>
          <div className="tf-aura" aria-hidden="true">
            <span className="tf-aura__siniy" />
            <span className="tf-aura__teplyy" />
            <span className="tf-aura__terra" />
          </div>
          <div className="tfv__podpis">
            <h2>{variant.nazvanie}</h2>
            <p>{variant.opisanie}</p>
          </div>
          <div className="tf-ryad">
            {plashki(variant.rol).map((plashka) => (
              <Plashka key={plashka.id} plashka={plashka} rol={variant.rol} srok={variant.srok} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
