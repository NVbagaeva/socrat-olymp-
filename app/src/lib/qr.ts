/**
 * QR-код ссылки как разметка SVG — в браузере, без внешних сервисов
 * (библиотека qrcode-generator, MIT, без зависимостей). Модули —
 * один путь цвета currentColor: в цветной и ч/б печати он одинаковый.
 */

import qrcode from 'qrcode-generator';

export function qrSvg(text: string, title = 'QR-код'): string {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return (
    `<svg class="qr" viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="${title}" ` +
    `xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">` +
    `<rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>` +
    `<path d="${d}" fill="currentColor"/></svg>`
  );
}
