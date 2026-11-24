/**
 * Тема сайта: светлая (по умолчанию) или тёмная «ночное стекло».
 *
 * Выбор хранится в localStorage под ключом `tema` и ставится на <html>
 * атрибутом data-tema="dark" скриптом TEMA_SCRIPT в <head> — до первой
 * отрисовки, без белой вспышки. Тот же скрипт меняет meta color-scheme
 * и theme-color: запрет браузеру затемнять страницу самому
 * (docs/launch-audit.md, B12) действует в обеих темах — `only light`
 * и `only dark`.
 *
 * Пока переключатель виден не всем: его показывает атрибут
 * data-tema-vidna, который скрипт ставит, если к адресу добавили
 * ?tema=dark (или ?tema=light) — для проверки. Метка хранится в
 * localStorage (`tema-proverka`).
 *
 * Скрипт — одна строка без подстановок `${…}` (см. lib/motion.ts).
 */
export type Tema = 'light' | 'dark';

export const TEMA_KEY = 'tema';
export const TEMA_ATTR = 'data-tema';
export const TEMA_PROVERKA_KEY = 'tema-proverka';
export const TEMA_VIDNA_ATTR = 'data-tema-vidna';

/** Цвет панели браузера: светлая — --ice, тёмная — --noch-bg. */
export const THEME_COLOR: Record<Tema, string> = { light: '#f5f9ff', dark: '#0a1430' };

export const TEMA_SCRIPT =
  "(function(){try{var d=document.documentElement,s=localStorage,q=location.search.match(/[?&]tema=(dark|light)/);if(q){s.setItem('tema',q[1]);s.setItem('tema-proverka','1')}var t=s.getItem('tema')==='dark'?'dark':'light';if(t==='dark')d.setAttribute('data-tema','dark');if(s.getItem('tema-proverka')==='1')d.setAttribute('data-tema-vidna','');var m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',t==='dark'?'#0a1430':'#f5f9ff');var c=document.querySelector('meta[name=color-scheme]');if(c)c.setAttribute('content','only '+t)}catch(e){}})()";

/** Текущая тема — по атрибуту на <html>. */
export function tekushchayaTema(): Tema {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute(TEMA_ATTR) === 'dark' ? 'dark' : 'light';
}

/** Включает тему: атрибут, meta, хранилище, плавный переход цветов. */
export function postavitTemu(tema: Tema): void {
  const d = document.documentElement;
  /* Переход 200 мс — только на время смены (base.css, data-tema-smena);
     при data-motion-level='reduce' CSS его не включает. */
  d.setAttribute('data-tema-smena', '');
  if (tema === 'dark') d.setAttribute(TEMA_ATTR, 'dark');
  else d.removeAttribute(TEMA_ATTR);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', THEME_COLOR[tema]);
  document.querySelector('meta[name=color-scheme]')?.setAttribute('content', `only ${tema}`);
  try {
    localStorage.setItem(TEMA_KEY, tema);
  } catch {
    /* Закрытое хранилище — тема живёт до перезагрузки. */
  }
  window.setTimeout(() => d.removeAttribute('data-tema-smena'), 260);
  window.dispatchEvent(new CustomEvent('tema', { detail: tema }));
}
