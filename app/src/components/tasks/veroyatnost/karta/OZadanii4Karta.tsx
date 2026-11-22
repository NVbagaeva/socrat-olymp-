import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { Svernut } from '../../karta';
import { navykiZadaniya } from '../metody';
import { OZadanii45Karta } from './OZadanii45Karta';
import { FORMULY4, SHAPKA4, TIPY4_OPASNO } from '@/content/veroyatnost4';
import { FOTO_4, O_ZADANII_4, STATISTIKA_4, V_ZADANII_5 } from '@/content/veroyatnost-o-zadanii';
import { bezVersii } from '@/lib/assetUrl';
import { typesetText } from '@/lib/tex';
import { BANK_4 } from '@/lib/veroyatnost/index';
import { metodyHref45 } from '@/lib/veroyatnost/trening/links';

/**
 * «О задании» №4: общая карта №4 и №5 (OZadanii45Karta) и прежние тексты
 * №4 — статистика, «Какие задачи встречаются» с плашкой про №5, «Важно
 * понимать», «Немного истории» с фотографией (утверждены автором).
 */

/** Лежит ли фотография на месте (смотрится на сборке). */
function fotoEst(): boolean {
  try {
    return fs.statSync(path.join(process.cwd(), 'public', bezVersii(FOTO_4.src))).isFile();
  } catch {
    return false;
  }
}

export function OZadanii4Karta() {
  const { istoriya, reshaemost, zadachi, vazhno } = O_ZADANII_4;
  const metodov = navykiZadaniya(4).filter((m) => BANK_4.some((p) => p.blok === m.id)).length;
  return (
    <OZadanii45Karta
      zadanie={4}
      shapka={{
        ...SHAPKA4,
        fakty: SHAPKA4.fakty(BANK_4.length, metodov),
        opasno: SHAPKA4.opasno.map((line) => typesetText(line)),
      }}
      opasnoTipov={TIPY4_OPASNO}
      formuly={FORMULY4}
      ob={
        <>
          {/* Прежние тексты «О задании» — утверждены автором, без правок. */}
          <Svernut title={SHAPKA4.obZadanii} className="z45-ob">
            <div className="z45-ob__setka">
              <section className="z45-ob__blok">
                <p className="z45-ob__stat">
                  <b>{STATISTIKA_4.znachenie}</b> {STATISTIKA_4.podpis(STATISTIKA_4.god)}
                </p>
                <p className="z45-ob__istochnik">{STATISTIKA_4.istochnik}</p>
                <p>{reshaemost.text}</p>
              </section>
              <section className="z45-ob__blok">
                <h4 className="stk-h4">{zadachi.title}</h4>
                <p>{zadachi.text}</p>
                <div className="z45-ob__plashka">
                  <p>
                    <b>{V_ZADANII_5.title}</b>
                  </p>
                  <p>{V_ZADANII_5.text}</p>
                  <p>
                    <a className="stk-ssylka" href={V_ZADANII_5.href}>
                      {V_ZADANII_5.ssylka}
                    </a>
                  </p>
                </div>
                <p>
                  {zadachi.razbor.do}
                  <a className="stk-ssylka" href={metodyHref45(4)}>
                    {zadachi.razbor.ssylka}
                  </a>
                  {zadachi.razbor.posle}
                </p>
              </section>
              <section className="z45-ob__blok">
                <h4 className="stk-h4">{vazhno.title}</h4>
                <p>{vazhno.text}</p>
              </section>
              <section className="z45-ob__blok z45-ob__istoriya">
                <h4 className="stk-h4">{istoriya.title}</h4>
                <p>{istoriya.text}</p>
                {fotoEst() ? (
                  <figure className="z45-ob__foto">
                    {/* Фотография — как есть, целиком. */}
                    <Image
                      src={FOTO_4.src}
                      alt={FOTO_4.alt}
                      width={FOTO_4.width}
                      height={FOTO_4.height}
                      sizes="(max-width: 720px) 100vw, 640px"
                    />
                    <figcaption>{istoriya.podpis}</figcaption>
                  </figure>
                ) : null}
              </section>
            </div>
          </Svernut>
        </>
      }
    />
  );
}
