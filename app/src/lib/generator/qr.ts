/**
 * QR-код адреса — SVG без полей, тянется по размеру контейнера. Его
 * ставят лист печати и предпросмотр генератора («Дополнительно»):
 * ученик сканирует код и открывает свой лист. Библиотека грузится,
 * только когда QR включён.
 */
export async function qrSvg(url: string): Promise<string> {
  const { default: qrcode } = await import('qrcode-generator');
  /* Уровень L: адрес набора длинный, так модули крупнее при тех же 20 мм. */
  const qr = qrcode(0, 'L');
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ cellSize: 1, margin: 0, scalable: true });
}

/** Адрес листа ученика по адресу любого листа набора — для QR-кода. */
export function adresListaUchenika(href: string): string {
  const url = new URL(href);
  url.pathname = url.pathname.replace(/\/pechat\/(?:otvety|vse)\/?$/, '/pechat/');
  url.searchParams.delete('kit');
  url.searchParams.delete('oba');
  return url.toString();
}
