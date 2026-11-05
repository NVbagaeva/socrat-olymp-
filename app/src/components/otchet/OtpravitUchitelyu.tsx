'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { OTCHET_KNOPKA as T } from '@/content/otchet';
import {
  otpravitUchitelyu,
  zapomnennoeImya,
  zapomnitImya,
  type OtvetOtpravki,
} from '@/lib/otchet/otpravka';
import type { Otchet } from '@/lib/otchet/types';
import './otchet.css';

export interface OtpravitUchitelyuProps {
  /** Собрать результат с введённым именем — в момент отправки. */
  sobrat: (imya: string) => Otchet;
}

/**
 * «Отправить результат учителю» на экране итогов: имя и фамилия
 * (запоминаются только в браузере ученика) и кнопка. Как именно
 * результат уходит — решает lib/otchet/otpravka.ts.
 */
export function OtpravitUchitelyu({ sobrat }: OtpravitUchitelyuProps) {
  const id = useId();
  /* Итоги рисуются только в браузере (после тренировки), поэтому имя
     из памяти можно взять сразу. */
  const [imya, setImya] = useState(() => (typeof window === 'undefined' ? '' : zapomnennoeImya()));
  const [oshibka, setOshibka] = useState(false);
  const [idet, setIdet] = useState(false);
  const [otvet, setOtvet] = useState<OtvetOtpravki | null>(null);

  async function otpravit(e: FormEvent) {
    e.preventDefault();
    if (idet) return;
    const chistoe = imya.trim();
    if (chistoe.length < 2) {
      setOshibka(true);
      return;
    }
    setOshibka(false);
    zapomnitImya(chistoe);
    setIdet(true);
    try {
      setOtvet(await otpravitUchitelyu(sobrat(chistoe)));
    } finally {
      setIdet(false);
    }
  }

  const soobshchenie =
    otvet === null
      ? null
      : otvet.itog === 'skopirovano'
        ? T.skopirovano
        : otvet.itog === 'podelilsya'
          ? T.podelilsya
          : otvet.itog === 'otpravleno'
            ? T.otpravleno
            : otvet.itog === 'vruchnuyu'
              ? T.vruchnuyu
              : null;

  return (
    <section className="otp" aria-labelledby={`${id}-t`}>
      <h4 className="otp__title" id={`${id}-t`}>
        {T.title}
      </h4>
      <p className="otp__lead">{T.lead}</p>
      <form className="otp__form" onSubmit={(e) => void otpravit(e)} noValidate>
        <label className="otp__label" htmlFor={`${id}-i`}>
          {T.imya}
        </label>
        <div className="otp__row">
          <Input
            id={`${id}-i`}
            className="otp__input"
            value={imya}
            placeholder={T.imyaPlaceholder}
            autoComplete="name"
            maxLength={80}
            required
            state={oshibka ? 'error' : 'default'}
            aria-describedby={`${id}-h`}
            onChange={(e) => {
              setImya(e.target.value);
              if (oshibka) setOshibka(false);
            }}
          />
          <Button type="submit" loading={idet} className="otp__btn">
            {T.otpravit}
          </Button>
        </div>
        <p className={oshibka ? 'otp__hint otp__hint--error' : 'otp__hint'} id={`${id}-h`}>
          {oshibka ? T.imyaPusto : T.imyaPamyat}
        </p>
      </form>
      {soobshchenie === null ? null : (
        <div className="otp__status" role="status">
          <p>{soobshchenie}</p>
          {otvet?.itog === 'vruchnuyu' && otvet.ssylka !== undefined ? (
            <Input
              readOnly
              aria-label={T.ssylka}
              value={otvet.ssylka}
              onFocus={(e) => e.currentTarget.select()}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
