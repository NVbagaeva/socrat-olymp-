/**
 * Доступ по тарифу: какой тариф открыт и до какого момента. Строку
 * пишет только база (таблица public.dostup, миграция
 * 20261114120000_otkrytaya_registraciya.sql): пробный доступ — сама при
 * подтверждении почты, оплату — администратор. Браузер её только читает
 * и изменить не может (RLS).
 */

import type { Rol } from '@/lib/tarify/config';
import { getClient } from './client';

export interface Dostup {
  tarif: Rol;
  /** До какого момента открыт полный доступ (ISO). */
  doKogda: string;
  istochnik: 'probnyy' | 'oplata';
  /** Срок ещё идёт. */
  aktiven: boolean;
}

interface DostupRow {
  tarif: Rol;
  do_kogda: string;
  istochnik: 'probnyy' | 'oplata';
}

/** Доступ текущего пользователя; null — строки нет (пробный не включался). */
export async function loadDostup(now: Date = new Date()): Promise<Dostup | null> {
  const supabase = await getClient();
  const { data, error } = await supabase
    .from('dostup')
    .select('tarif, do_kogda, istochnik')
    .maybeSingle<DostupRow>();
  if (error || data === null) return null;
  return {
    tarif: data.tarif,
    doKogda: data.do_kogda,
    istochnik: data.istochnik,
    aktiven: new Date(data.do_kogda).getTime() > now.getTime(),
  };
}
