import Script from 'next/script';
import { site } from '@/content/site';

/**
 * Счётчик Яндекс Метрики на всех страницах. §7.2 документа услуги.
 *
 * Номер счётчика — site.metrika.id. Пустой — счётчика на сайте нет
 * совсем: ни скрипта, ни запросов к Яндексу.
 *
 * Вебвизор выключен: он записывает ввод в поля, а в форме заказа
 * вводят имя и почту. Карта кликов и отказы — без содержимого полей.
 */
export function Metrika() {
  const id = Number(site.metrika.id);
  if (!id) {
    return null;
  }
  const init = JSON.stringify({
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
  return (
    <>
      <Script id="metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${id},"init",${init});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
