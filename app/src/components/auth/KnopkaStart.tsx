import { site } from '@/content/site';

/**
 * «Начать бесплатно» в публичной шапке. Только от 768px: на телефоне
 * в шапке одна кнопка («Войти» или кружок аккаунта) и бургер, а
 * «Начать бесплатно» стоит на первом экране главной (HeroSection).
 * Куда ведёт — site.headerActions.signup (переключатель регистрации
 * в lib/auth/config.ts).
 */
export function KnopkaStart() {
  return (
    <a className="btn btn--primary btn--sm site-head__start" href={site.headerActions.signup.href}>
      {site.headerActions.signup.label}
    </a>
  );
}
