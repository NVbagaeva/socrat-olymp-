import { site } from '@/content/site';

/**
 * «Начать бесплатно» в публичной шапке — основная кнопка, только от
 * 768px (site.css, .site-head__start). На телефоне её в шапке нет: она
 * на первом экране главной (HeroSection), а в шапке остаются «Войти»
 * и бургер. Куда ведёт — startHref() в content/site.ts.
 */
export function StartButton() {
  return (
    <a className="btn btn--primary btn--sm site-head__start" href={site.headerActions.signup.href}>
      {site.headerActions.signup.label}
    </a>
  );
}
