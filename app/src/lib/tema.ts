/**
 * Тема сайта: светлая (по умолчанию) или тёмная «ночное стекло».
 *
 * Всё делает один маленький скрипт TEMA_SCRIPT в <head>, без кода в
 * бандле страниц (бюджет первой загрузки, scripts/check-first-load.mjs):
 * - до первой отрисовки ставит <html data-tema="dark"> по выбору из
 *   localStorage (ключ `tema`) — без белой вспышки — и меняет meta
 *   color-scheme и theme-color. Запрет браузеру затемнять страницу самому
 *   (docs/launch-audit.md, B12) действует в обеих темах: `only light` и
 *   `only dark`;
 * - обслуживает переключатель в шапке (components/tema/TemaSwitch.tsx):
 *   щелчок или Enter/пробел меняют тему, aria-checked и подсказку; после
 *   переходов внутри сайта новая шапка сверяется сама (MutationObserver);
 * - на время смены ставит data-tema-smena — плавный переход цветов
 *   200 мс (base.css; при data-motion-level='reduce' — без перехода).
 *
 * Листы на печать (адреса …/pechat/…) всегда светлые: скрипт там тёмную
 * тему не ставит, а в CSS тёмные значения не действуют при
 * data-sheet-theme на <html> (tokens.css).
 *
 * ?tema=dark или ?tema=light в адресе включает тему и запоминает её —
 * для проверок и ссылок.
 *
 * Скрипт — одна строка без подстановок `${…}` (см. lib/motion.ts).
 * Цвета theme-color — те же, что THEME_COLOR; проверка — pnpm test:tema.
 */
export type Tema = 'light' | 'dark';

export const TEMA_KEY = 'tema';

/** Цвет панели браузера: светлая — --ice, тёмная — --noch-bg. */
export const THEME_COLOR: Record<Tema, string> = { light: '#f5f9ff', dark: '#0a1430' };

export const TEMA_SCRIPT =
  "(function(){try{var d=document,h=d.documentElement,s=localStorage,q=location.search.match(/[?&]tema=(dark|light)/);if(q)s.setItem('tema',q[1]);var meta=function(t){var m=d.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',t==='dark'?'#0a1430':'#f5f9ff');var c=d.querySelector('meta[name=color-scheme]');if(c)c.setAttribute('content','only '+t)};var sync=function(){var t=h.getAttribute('data-tema')==='dark';d.querySelectorAll('.tema-switch').forEach(function(b){var v=t?'true':'false';if(b.getAttribute('aria-checked')!==v)b.setAttribute('aria-checked',v);var n=t?'Включить светлую тему':'Включить тёмную тему';if(b.title!==n)b.title=n})};var list=location.pathname.indexOf('/pechat/')>-1;var set=function(t){if(list)t='light';if(t==='dark')h.setAttribute('data-tema','dark');else h.removeAttribute('data-tema');meta(t);sync()};set(s.getItem('tema')==='dark'?'dark':'light');d.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.tema-switch');if(!b)return;var t=h.getAttribute('data-tema')==='dark'?'light':'dark';h.setAttribute('data-tema-smena','');set(t);try{s.setItem('tema',t)}catch(x){}setTimeout(function(){h.removeAttribute('data-tema-smena')},260)});var go=function(){sync();new MutationObserver(sync).observe(d.body,{childList:true,subtree:true})};if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',go);else go()}catch(e){}})()";
