'use client';

import { useId, useRef } from 'react';
import { Checkbox, FieldLabel, FieldMessage, Input, Radio, Select } from '@/components/ui';
import { CELI, sroki, stavki, uchitelyam, urovni } from '@/content/uchitelyam';
import { cel } from '@/lib/metrika';
import {
  poschitat,
  prichinyBezSrochnosti,
  type Srochnost,
  type Uroven,
} from '@/lib/usluga/raschet';
import { useZakaz } from './ZakazProvider';

const { kalkulyator: t, nadbavki } = uchitelyam;

export const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

/** Строка «6 120 ₽ · 10 рабочих дней после оплаты» — её же видит форма. */
export function itogStroka(r: ReturnType<typeof poschitat>): [string, string] {
  const srok =
    r.rabochihDney !== null ? t.srokRabochih(r.rabochihDney) : t.srokChasov(r.chasov ?? 0);
  return [rub(r.itogo), srok];
}

/** Экран 5, вторая половина: калькулятор. Состояние общее с формой. */
export function Kalkulyator() {
  const { zakaz, izmenit, zagruzka } = useZakaz();
  const id = useId();
  const tronut = useRef(false);
  const r = poschitat(zakaz, stavki, sroki);
  const [itogo, srok] = itogStroka(r);
  const mesto = zagruzka?.srochnoeSvobodno ?? true;

  const menyat = (chto: Parameters<typeof izmenit>[0]) => {
    if (!tronut.current) {
      tronut.current = true;
      cel(CELI.kalkulyator);
    }
    izmenit(chto);
  };

  const srochnye: { id: Exclude<Srochnost, 'bazovyy'>; label: string }[] = [
    { id: '48', label: t.srok48 },
    { id: '24', label: t.srok24 },
  ];

  return (
    <section className="band band--soft" id="raschet" aria-labelledby="raschet-title">
      <div className="wrap svc-calc">
        <div>
          <h2 className="svc-h2" id="raschet-title">
            {t.title}
          </h2>
          <p className="svc-sub">{t.lead}</p>

          <div className="svc-calc__fields">
            <div className="field">
              <FieldLabel htmlFor={`${id}-n`}>{t.zadach}</FieldLabel>
              <Input
                id={`${id}-n`}
                type="number"
                inputMode="numeric"
                min={1}
                max={300}
                value={zakaz.zadach}
                onChange={(e) => menyat({ zadach: Number(e.target.value) })}
                aria-describedby={`${id}-n-msg`}
              />
              <FieldMessage id={`${id}-n-msg`}>{t.zadachPodskazka}</FieldMessage>
            </div>

            <div className="field">
              <FieldLabel htmlFor={`${id}-u`}>{t.uroven}</FieldLabel>
              <Select
                id={`${id}-u`}
                value={zakaz.uroven}
                onChange={(e) => menyat({ uroven: e.target.value as Uroven })}
              >
                {urovni.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nazvanie}
                  </option>
                ))}
              </Select>
            </div>

            <div className="field">
              <FieldLabel htmlFor={`${id}-v`}>{t.variantov}</FieldLabel>
              <Input
                id={`${id}-v`}
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={zakaz.variantov}
                disabled={zakaz.uroven === 'nabor'}
                onChange={(e) => menyat({ variantov: Number(e.target.value) })}
                aria-describedby={zakaz.uroven === 'nabor' ? `${id}-v-msg` : undefined}
              />
              {zakaz.uroven === 'nabor' ? (
                <FieldMessage id={`${id}-v-msg`}>{t.variantovNabor}</FieldMessage>
              ) : null}
            </div>

            <div className="field">
              <FieldLabel htmlFor={`${id}-c`}>{t.chertezhey}</FieldLabel>
              <Input
                id={`${id}-c`}
                type="number"
                inputMode="numeric"
                min={0}
                value={zakaz.slozhnyhChertezhey}
                onChange={(e) => menyat({ slozhnyhChertezhey: Number(e.target.value) })}
                aria-describedby={`${id}-c-msg`}
              />
              <FieldMessage id={`${id}-c-msg`}>{t.chertezheyPodskazka}</FieldMessage>
            </div>
          </div>

          <Checkbox checked={zakaz.rukopis} onChange={(e) => menyat({ rukopis: e.target.checked })}>
            {t.rukopis}
          </Checkbox>

          <fieldset className="svc-srok">
            <legend className="field__label">{t.srochnost}</legend>
            <Radio
              name={`${id}-srok`}
              checked={zakaz.srochnost === 'bazovyy'}
              onChange={() => menyat({ srochnost: 'bazovyy' })}
            >
              {t.srokBazovyy}
            </Radio>
            {srochnye.map((s) => {
              const prichiny = prichinyBezSrochnosti(zakaz, s.id, mesto);
              return (
                <div key={s.id}>
                  <Radio
                    name={`${id}-srok`}
                    checked={zakaz.srochnost === s.id}
                    disabled={prichiny.length > 0}
                    onChange={() => menyat({ srochnost: s.id })}
                  >
                    {s.label}
                  </Radio>
                  {prichiny.length > 0 ? (
                    <p className="svc-srok__why">{prichiny.map((p) => t.prichiny[p]).join('; ')}</p>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
        </div>

        <div className="svc-itog" aria-live="polite">
          <ul className="svc-itog__stroki">
            {r.stroki.map((st) => (
              <li key={st.chto}>
                <span>{st.chto}</span>
                <b>{rub(st.summa)}</b>
              </li>
            ))}
            {r.srochnost > 0 ? (
              <li>
                <span>{t.srochnostStroka}</span>
                <b>{rub(r.srochnost)}</b>
              </li>
            ) : null}
          </ul>
          <p className="svc-itog__sum">
            <span>{t.itogo}</span>
            <b>{itogo}</b>
          </p>
          <p className="svc-itog__srok">{srok}</p>
          <ul className="svc-itog__usloviya">
            <li>{r.predoplata === 'polnaya' ? t.predoplataPolnaya : t.predoplataPolovina}</li>
            {r.soglasovanie ? <li>{t.soglasovanie}</li> : null}
          </ul>
          <a
            className="btn btn--primary btn--lg svc-itog__btn"
            href="#zakaz"
            onClick={() => cel(CELI.zakazat)}
          >
            {t.zakazat}
          </a>
          <p className="svc-itog__otdelno">{t.otdelno}</p>
        </div>
      </div>

      <div className="wrap svc-nadbavki">
        <h3>{nadbavki.title}</h3>
        <table className="svc-table">
          <tbody>
            {nadbavki.items.map(([chto, skolko]) => (
              <tr key={chto}>
                <th scope="row">{chto}</th>
                <td>{skolko}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="svc-note-line">{nadbavki.podpis}</p>
      </div>
    </section>
  );
}
