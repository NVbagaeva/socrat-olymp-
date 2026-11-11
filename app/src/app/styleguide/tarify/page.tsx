import type { Metadata } from 'next';
import { MyagkayaStena } from '@/components/tarify/Bloki';
import { KnopkaTarifa, Plashka } from '@/components/tarify/Plashka';
import { plashki, type Rol, type Srok } from '@/lib/tarify/config';
import '@/components/tarify/tarify.css';
import './vitrina.css';

/* Служебная витрина тарифов: выбранное оформление (вариант Б «Ночная
   сцена») на настоящих текстах из lib/tarify/config.ts, состояния кнопок
   и «мягкая стена». В поиск не попадает, из меню не видна. */
export const metadata: Metadata = {
  title: 'Будет на ЕГЭ — витрина тарифов',
  robots: { index: false, follow: false },
};

const PRIMERY: { rol: Rol; srok: Srok; podpis: string }[] = [
  { rol: 'uchenik', srok: 'd30', podpis: 'Ученик, 30 дней' },
  { rol: 'repetitor', srok: 'ege', podpis: 'Репетитор, до ЕГЭ' },
];

/** Порядок разметки, как на странице: платная первой. */
function poryadok(rol: Rol) {
  const [besplatno, probnyy, platnyy] = plashki(rol);
  return [platnyy, besplatno, probnyy];
}

export default function Page() {
  const [, probnyy, platnyy] = plashki('uchenik');
  return (
    <main className="tfv tf tf--b">
      <div className="tf-aura" aria-hidden="true">
        <span className="tf-aura__siniy" />
        <span className="tf-aura__teplyy" />
        <span className="tf-aura__terra" />
      </div>
      <header className="tfv__shapka">
        <p className="tfv__nad">Служебная страница</p>
        <h1>Тарифы: плашки, кнопки, мягкая стена</h1>
        <p className="tfv__lid">
          Оформление — вариант Б «Ночная сцена». Тексты и цены — из lib/tarify/config.ts.
        </p>
      </header>

      {PRIMERY.map((primer) => (
        <section key={primer.rol} className="tfv__blok">
          <div className="tfv__podpis">
            <h2>{primer.podpis}</h2>
          </div>
          <div className="tf-ryad">
            {poryadok(primer.rol).map((plashka) => (
              <Plashka key={plashka.id} plashka={plashka} rol={primer.rol} srok={primer.srok} />
            ))}
          </div>
        </section>
      ))}

      <section className="tfv__blok">
        <div className="tfv__podpis">
          <h2>Кнопки: оплата выключена и включена</h2>
          <p>
            Справа — как кнопки будут выглядеть при NEXT_PUBLIC_PAYMENTS_ENABLED=1. Здесь это
            неактивный макет без ссылки: пока флаг выключен, на сайте нет ни одной активной кнопки
            оплаты.
          </p>
        </div>
        <div className="tfv__knopki">
          <div className="tfv__stolbec">
            <p className="tfv__metka">Флаг выключен</p>
            <KnopkaTarifa plashka={probnyy} rol="uchenik" srok="d30" oplata={false} />
            <KnopkaTarifa plashka={platnyy} rol="uchenik" srok="d30" oplata={false} />
          </div>
          <div className="tfv__stolbec">
            <p className="tfv__metka">Флаг включён (макет)</p>
            <KnopkaTarifa plashka={probnyy} rol="uchenik" srok="d30" oplata predprosmotr />
            <KnopkaTarifa plashka={platnyy} rol="uchenik" srok="d30" oplata predprosmotr />
          </div>
        </div>
      </section>

      <section className="tfv__blok">
        <div className="tfv__podpis">
          <h2>Мягкая стена</h2>
          <p>
            Карточка, когда бесплатные задачи на день закончились. На боевых страницах не включена.
          </p>
        </div>
        <div className="tfv__stena">
          <MyagkayaStena />
        </div>
      </section>
    </main>
  );
}
