/**
 * Адреса экранов прогресса — одним местом (CLAUDE.md). Страницы
 * статические: всё, что меняется, — в параметрах адреса.
 */

export const PROGRESS_HREF = {
  klass: '/kabinet/progress/klass/',
  uchenik: '/kabinet/progress/uchenik/',
  zadacha: '/kabinet/progress/zadacha/',
  variant: '/kabinet/progress/variant/',
  pechat: '/kabinet/progress/pechat/',
  statistika: '/kabinet/statistika/',
} as const;

const q = (params: Record<string, string | null | undefined>) =>
  Object.entries(params)
    .filter((e): e is [string, string] => typeof e[1] === 'string' && e[1] !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

export const progressKlassHref = (classId: string) => `${PROGRESS_HREF.klass}?${q({ id: classId })}`;

export const progressUchenikHref = (studentId: string, classId?: string | null) =>
  `${PROGRESS_HREF.uchenik}?${q({ id: studentId, klass: classId })}`;

export const progressZadachaHref = (studentId: string, id: string) =>
  `${PROGRESS_HREF.zadacha}?${q({ u: studentId, id })}`;

export const progressVariantHref = (studentId: string, id: string) =>
  `${PROGRESS_HREF.variant}?${q({ u: studentId, id })}`;

/** Свой вариант ученика: без u. */
export const moyVariantHref = (id: string) => `${PROGRESS_HREF.variant}?${q({ id })}`;

export const progressPechatHref = (
  p: { u?: string; klass?: string; from: string; to: string; z?: number | null },
) => `${PROGRESS_HREF.pechat}?${q({ u: p.u, klass: p.klass, from: p.from, to: p.to, z: p.z == null ? null : String(p.z) })}`;
