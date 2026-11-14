import { Svernut } from '../../karta';
import { OZadanii45Karta } from './OZadanii45Karta';
import { FORMULY5, SHAPKA5, TIPY5_OPASNO } from '@/content/veroyatnost5';
import { O_ZADANII_5, V_ZADANII_4 } from '@/content/veroyatnost-o-zadanii';
import { typesetText } from '@/lib/tex';
import { BANK_5 } from '@/lib/veroyatnost/index';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { metodyHref45 } from '@/lib/veroyatnost/trening/links';

/**
 * «О задании» №5: общая карта №4 и №5 (OZadanii45Karta) и прежние тексты
 * №5 — «Что это за задание», «Какие задачи встречаются» со списком
 * методов и плашкой про №4, «Важно понимать» (утверждены автором).
 */
export function OZadanii5Karta() {
  const { o, zadachi, vazhno } = O_ZADANII_5;
  return (
    <OZadanii45Karta
      zadanie={5}
      shapka={{
        ...SHAPKA5,
        fakty: SHAPKA5.fakty(BANK_5.length),
        opasno: SHAPKA5.opasno.map((line) => typesetText(line)),
      }}
      opasnoTipov={TIPY5_OPASNO}
      formuly={FORMULY5}
      ob={
        /* Прежние тексты «О задании» — утверждены автором, без правок. */
        <Svernut title={SHAPKA5.obZadanii} className="z45-ob">
          <div className="z45-ob__setka">
            <section className="z45-ob__blok">
              <h4 className="stk-h4">{o.title}</h4>
              {o.text.map((abzats) => (
                <p key={abzats}>{abzats}</p>
              ))}
            </section>
            <section className="z45-ob__blok">
              <h4 className="stk-h4">{zadachi.title}</h4>
              <p>{zadachi.text}</p>
              <ul className="z45-ob__metody">
                {METODY_5.map((m) => (
                  <li key={m.id}>{m.nazvanie}</li>
                ))}
              </ul>
              <div className="z45-ob__plashka">
                <p>
                  <b>{V_ZADANII_4.title}</b>
                </p>
                <p>{V_ZADANII_4.text}</p>
                <p>
                  <a className="stk-ssylka" href={V_ZADANII_4.href}>
                    {V_ZADANII_4.ssylka}
                  </a>
                </p>
              </div>
              <p>
                {zadachi.razbor.do}
                <a className="stk-ssylka" href={metodyHref45(5)}>
                  {zadachi.razbor.ssylka}
                </a>
                {zadachi.razbor.posle}
              </p>
            </section>
            <section className="z45-ob__blok">
              <h4 className="stk-h4">{vazhno.title}</h4>
              <p>{vazhno.text}</p>
            </section>
          </div>
        </Svernut>
      }
    />
  );
}
