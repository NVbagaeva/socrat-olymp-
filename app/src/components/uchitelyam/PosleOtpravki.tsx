'use client';

import { ErrorState, SuccessState } from '@/components/ui';
import { POCHTA_ZAKAZOV, USLUGA_HREF, uchitelyam } from '@/content/uchitelyam';
import { poiskSnimok, useKlientskoe } from '@/lib/usluga/klient';

const { uspeh, oshibka } = uchitelyam;

/**
 * Экраны для отправки без скриптов: обработчик переводит сюда
 * с ?id=… или ?code=…. Со скриптами форма показывает то же самое
 * на месте и сюда не ведёт.
 */
export function PosleOtpravki({ vid }: { vid: 'uspeh' | 'oshibka' }) {
  const poisk = useKlientskoe(poiskSnimok, '');
  const v = new URLSearchParams(poisk).get(vid === 'uspeh' ? 'id' : 'code') ?? '';
  const param = /^[A-Za-z0-9_:-]{1,40}$/.test(v) ? v : '';

  if (vid === 'uspeh') {
    return (
      <SuccessState
        title={uspeh.title}
        description={
          <>
            {param ? `${uspeh.nomer(param)} ` : null}
            {uspeh.text('вашу почту')}
            <br />
            <br />
            {uspeh.spam}
          </>
        }
      />
    );
  }
  const kod = param.startsWith('field') ? 'field' : param;
  return (
    <ErrorState
      title={oshibka.title}
      description={
        <>
          {oshibka.prichiny[kod] ? <b>{oshibka.prichiny[kod]} </b> : null}
          {oshibka.pochta} <a href={`mailto:${POCHTA_ZAKAZOV}`}>{POCHTA_ZAKAZOV}</a>{' '}
          {oshibka.pochtaKonec}
        </>
      }
      action={
        <a className="btn btn--secondary" href={`${USLUGA_HREF}#zakaz`}>
          {oshibka.ewe}
        </a>
      }
    />
  );
}
