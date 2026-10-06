/**
 * Нажатие на вкладку темы до того, как страница «оживёт».
 *
 * На слабой сети код страницы едет секунды. Разметка вкладок видна
 * сразу, а нажатия на них до загрузки кода уходят в пустоту, и ученик
 * жмёт снова и снова. Эта крошечная вставка (≈1 КБ) стоит сразу за лентой
 * вкладок (TopicTabs) и делает три вещи:
 *   1. запоминает нажатую вкладку (window.__tabTap);
 *   2. сразу подсвечивает её и крутит ожидание на ней;
 *   3. когда TopicTabs оживает, он берёт запомненное нажатие и открывает
 *      вкладку: повторно жать не нужно.
 * Работает только с кнопками-вкладками: у вкладок-ссылок переход настоящий.
 * Идентификатор вкладки — хвост id после «-tab-» (см. components/ui/Tabs).
 * Если страница так и не ожила, ожидание само гаснет через 20 с.
 */
export const TAB_TAP_SCRIPT = `(function(){var w=window;if(w.__tabTapInit)return;w.__tabTapInit=1;w.__tabTap=null;
document.addEventListener('click',function(e){
if(w.__tabsReady)return;
var t=e.target&&e.target.closest?e.target.closest('button[role="tab"]'):null;
if(!t||t.disabled)return;
var m=/-tab-([a-z0-9-]+)$/.exec(t.id||'');if(!m)return;
w.__tabTap=m[1];
var all=t.parentNode.querySelectorAll('[role="tab"]');
for(var i=0;i<all.length;i++){all[i].setAttribute('aria-selected',all[i]===t?'true':'false');all[i].removeAttribute('data-busy');}
t.setAttribute('data-busy','true');
document.documentElement.setAttribute('data-tabs-pending','true');
setTimeout(function(){document.documentElement.removeAttribute('data-tabs-pending');t.removeAttribute('data-busy');},20000);
},true);})();`;

interface TapWindow {
  __tabTap?: string | null;
  __tabsReady?: boolean;
}

/**
 * Забрать запомненное нажатие и убрать временную подсветку. Вызывается
 * один раз, когда TopicTabs ожил. Возвращает вкладку, на которую жали, или null.
 */
export function takePendingTabTap(): string | null {
  const w = window as unknown as TapWindow;
  const pending = w.__tabTap ?? null;
  w.__tabTap = null;
  w.__tabsReady = true;
  document.documentElement.removeAttribute('data-tabs-pending');
  document.querySelectorAll('[role="tab"][data-busy]').forEach((node) => {
    node.removeAttribute('data-busy');
  });
  return pending;
}
