/**
 * Карточки ключевых схем №18 в общей колоде (content/kartochki/18-*.ts):
 * у каждой схемы две карточки — «Узнай схему по чертежу» (тип «по
 * чертежу») и «Вспомни следствия» (тип «свойство»). Модуль без React:
 * его берут и колода на сборке, и прогресс схем в браузере.
 */

export const NOMER_18 = 18;

/** Подтемы колоды — два режима карточек. */
export const PODTEMA_UZNAY = 'uznay';
export const PODTEMA_VSPOMNI = 'vspomni';

export const kartochkaUznay = (skhema: string) => `18-${skhema}-chertezh`;
export const kartochkaVspomni = (skhema: string) => `18-${skhema}-sledstviya`;

/** Обе карточки схемы. */
export function kartochkiSkhemy(skhema: string): readonly [string, string] {
  return [kartochkaUznay(skhema), kartochkaVspomni(skhema)];
}

/** Хвост адреса страницы схемы внутри раздела: туда ведёт «Повторить теорию». */
export const stranitsaSkhemy = (skhema: string) => `skhemy/${skhema}/`;
