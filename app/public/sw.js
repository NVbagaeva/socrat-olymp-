/* Service worker сайта «Будет на ЕГЭ» — только для web push
   (docs/kabinet-uvedomleniya.md, PR 3г).

   Регистрируется по кнопке «Включить на этом устройстве» в настройках
   уведомлений. Загрузку страниц не трогает: обработчика fetch нет, кеша
   нет.

   В push — только тип события и ссылка (В-5): {t, u, za?, pozdno?}.
   Заголовок — по типу, без названия ДЗ и имён; подробности — на сайте.
   Проверка — scripts/check-uvedomleniya.mjs. */

'use strict';

var ZAGOLOVKI = {
  dz_novoe: 'Новое ДЗ',
  dz_izmeneno: 'ДЗ изменено',
  dz_vozvrat: 'ДЗ вернули на доработку',
  dz_kommentariy: 'Комментарий учителя к ДЗ',
  dz_sdano: 'ДЗ сдано',
  dz_ne_sdali: 'Дедлайн прошёл: не все сдали ДЗ',
};
var TEKST = 'Подробности — на сайте.';
var ZAPASNOY_ADRES = '/kabinet/uvedomleniya/';

function zagolovok(d) {
  if (d.t === 'dz_napominanie') {
    return d.za === 3 ? 'До дедлайна ДЗ меньше 3 часов' : 'До дедлайна ДЗ меньше суток';
  }
  if (d.t === 'dz_srok') {
    return d.pozdno === true ? 'Срок ДЗ прошёл — сдать ещё можно' : 'Срок ДЗ прошёл';
  }
  return ZAGOLOVKI[d.t] || 'Новое уведомление';
}

/* Только адрес этого сайта: чужой — в центр уведомлений. */
function adres(u) {
  try {
    var url = new URL(typeof u === 'string' ? u : ZAPASNOY_ADRES, self.location.origin);
    if (url.origin !== self.location.origin) return ZAPASNOY_ADRES;
    return url.pathname + url.search;
  } catch (e) {
    return ZAPASNOY_ADRES;
  }
}

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  var d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = {};
  }
  var u = adres(d.u);
  event.waitUntil(
    self.registration.showNotification(zagolovok(d), {
      body: TEKST,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      lang: 'ru',
      tag: (d.t || 'uved') + ':' + u,
      data: { u: u },
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var u = adres(event.notification.data && event.notification.data.u);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (spisok) {
      for (var i = 0; i < spisok.length; i++) {
        var c = spisok[i];
        if (new URL(c.url).origin === self.location.origin && 'focus' in c) {
          return (c.navigate ? c.navigate(u) : Promise.resolve(c)).then(function (cc) {
            return (cc || c).focus();
          });
        }
      }
      return self.clients.openWindow(u);
    }),
  );
});
