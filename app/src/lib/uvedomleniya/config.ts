/**
 * Флаг уведомлений (docs/kabinet-uvedomleniya.md). Значение считает
 * next.config.ts из Variable NEXT_PUBLIC_UVEDOMLENIYA: «1» — колокольчик
 * в шапке и страница уведомлений (только при включённом входе). База
 * держит свой флаг (kabinet_flags.uvedomleniya): пока он выключен,
 * уведомления не пишутся и колокольчик пуст.
 */

export const UVEDOMLENIYA_ON = process.env.UVEDOMLENIYA_ON === '1';

/**
 * Web push (PR 3г): Variable NEXT_PUBLIC_UVEDOMLENIYA_PUSH — «1»: в
 * настройках блок «Push на этом устройстве» и manifest для экрана «Домой».
 * Строки очереди для push база пишет только при "push" в
 * kabinet_flags.uvedomleniya_kanaly.
 */
export const UVEDOMLENIYA_PUSH_ON = process.env.UVEDOMLENIYA_PUSH_ON === '1';
