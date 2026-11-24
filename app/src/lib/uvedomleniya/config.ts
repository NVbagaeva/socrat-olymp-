/**
 * Флаг уведомлений (docs/kabinet-uvedomleniya.md). Значение считает
 * next.config.ts из Variable NEXT_PUBLIC_UVEDOMLENIYA: «1» — колокольчик
 * в шапке и страница уведомлений (только при включённом входе). База
 * держит свой флаг (kabinet_flags.uvedomleniya): пока он выключен,
 * уведомления не пишутся и колокольчик пуст.
 */

export const UVEDOMLENIYA_ON = process.env.UVEDOMLENIYA_ON === '1';
