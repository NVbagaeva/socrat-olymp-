import { AVATAR_OPTIONS, DEFAULT_AVATAR, type AvatarConfig } from '@/lib/avatar';

const byId = <T extends { id: string }>(options: readonly T[], id: string) =>
  options.find((option) => option.id === id);

export function AvatarIllustration({
  config,
  size = 64,
  label,
}: {
  config: AvatarConfig | null;
  size?: number;
  label?: string;
}) {
  const avatar = config ?? DEFAULT_AVATAR;
  const skin = byId(AVATAR_OPTIONS.skin, avatar.skin)?.color ?? '#d99a72';
  const hair = byId(AVATAR_OPTIONS.hairColor, avatar.hairColor)?.color ?? '#704437';
  const outfit = byId(AVATAR_OPTIONS.outfit, avatar.outfit)?.color ?? '#5373ca';
  const background = byId(AVATAR_OPTIONS.background, avatar.background)?.color ?? '#cceaf4';
  const decorative = label === undefined;

  return (
    <svg
      className="avatar-illustration"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <circle cx="60" cy="60" r="60" fill={background} />
      <circle cx="22" cy="25" r="3" fill="#fff" opacity=".72" />
      <circle cx="99" cy="40" r="2" fill="#fff" opacity=".75" />
      <path d="M17 120c3-18 17-29 43-29s40 11 43 29" fill={outfit} />
      <path d="M48 83h24v21H48z" fill={skin} />
      {avatar.hair === 'long' || avatar.hair === 'bob' ? (
        <path d="M28 58c-5 7-5 29 1 40l10 2 4-32zm64 0c5 7 5 29-1 40l-10 2-4-32z" fill={hair} />
      ) : null}
      {avatar.hair === 'braids' ? (
        <g fill="none" stroke={hair} strokeWidth="8" strokeLinecap="round">
          <path d="M36 54c-8 9 3 12-4 20s4 12-2 20" />
          <path d="M84 54c8 9-3 12 4 20s-4 12 2 20" />
        </g>
      ) : null}
      {avatar.hair === 'ponytail' ? (
        <path d="M77 36c18-8 25 7 19 19-3 7-10 10-13 18l-8-5 4-13c-7-6-9-12-2-19z" fill={hair} />
      ) : null}
      {avatar.hair === 'bun' ? <circle cx="60" cy="24" r="13" fill={hair} /> : null}
      <path
        d="M36 49c0-20 11-31 24-31s24 11 24 31v15c0 19-11 31-24 31S36 83 36 64z"
        fill={skin}
      />
      <ellipse cx="34" cy="61" rx="5" ry="8" fill={skin} />
      <ellipse cx="86" cy="61" rx="5" ry="8" fill={skin} />
      <path d="M45 55l8-2m14 0 8 2" stroke="#513c3b" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="49" cy="62" rx="2.2" ry="3" fill="#3a3338" />
      <ellipse cx="71" cy="62" rx="2.2" ry="3" fill="#3a3338" />
      <path d="M60 63l-2 8 4 1" fill="none" stroke="#b66e5e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M54 78c3 3 9 3 12 0" fill="none" stroke="#9d4e58" strokeWidth="2" strokeLinecap="round" />
      {avatar.hair === 'curls' ? (
        <g fill={hair}>
          <circle cx="38" cy="38" r="10" />
          <circle cx="50" cy="27" r="11" />
          <circle cx="63" cy="25" r="12" />
          <circle cx="76" cy="30" r="11" />
          <circle cx="84" cy="41" r="9" />
          <circle cx="34" cy="49" r="7" />
          <path d="M36 45c1 9 2 13 6 17l-6-2zM78 43l8 4-4 12-5-7z" />
        </g>
      ) : avatar.hair === 'waves' ? (
        <path
          d="M35 52c-3-18 7-34 24-34 18 0 28 14 26 35-5-7-10-10-15-11-7 8-19 9-27 5-2 3-4 5-8 5z"
          fill={hair}
        />
      ) : avatar.hair === 'bob' ? (
        <path
          d="M34 55c-5-20 5-37 26-37s31 17 26 37l-8 6-4-16c-9 6-20 7-31 2l-4 14z"
          fill={hair}
        />
      ) : avatar.hair === 'ponytail' ? (
        <path
          d="M36 53c-4-21 7-35 24-35s28 14 24 35c-6-8-11-12-17-14-8 7-20 10-31 7z"
          fill={hair}
        />
      ) : avatar.hair === 'braids' ? (
        <path
          d="M35 51c-3-20 8-33 25-33s28 13 25 33c-5-5-10-8-15-11-9 7-22 10-35 11z"
          fill={hair}
        />
      ) : avatar.hair === 'bun' ? (
        <path
          d="M35 53c-4-20 7-35 25-35s29 15 25 35c-5-6-10-9-15-11-9 7-22 10-35 11z"
          fill={hair}
        />
      ) : avatar.hair === 'long' ? (
        <path
          d="M35 53c-4-21 7-35 25-35s29 14 25 35c-6-6-12-10-18-12-9 7-20 10-32 12z"
          fill={hair}
        />
      ) : (
        <path d="M36 53c-4-20 6-35 24-35s28 15 24 35c-7-7-14-10-21-10-8 0-17 3-27 10z" fill={hair} />
      )}
      {avatar.hair === 'short' ? (
        <path
          d="M36 53c2 9 0 16-3 21-4-19 0-42 20-50 16-7 32 3 35 19-9-5-18-7-26-5-9 1-18 7-26 15z"
          fill={hair}
        />
      ) : null}
      {avatar.hair === 'long' ? (
        <g fill={hair}>
          <path d="M36 49c-5 13-3 34 2 50l8-1-2-42z" />
          <path d="M83 47c6 13 4 37-1 52l-8-1 3-42z" />
        </g>
      ) : null}
      {avatar.accessory === 'glasses' ? (
        <g fill="none" stroke="#384c73" strokeWidth="2.6">
          <circle cx="49" cy="63" r="8" />
          <circle cx="71" cy="63" r="8" />
          <path d="M57 62h6M41 61l-6-2m44 2 6-2" />
        </g>
      ) : null}
      {avatar.accessory === 'headphones' ? (
        <g fill="none" stroke="#626b97" strokeWidth="5" strokeLinecap="round">
          <path d="M35 55V48a25 25 0 0 1 50 0v7" />
          <path d="M35 54v12m50-12v12" strokeWidth="7" />
        </g>
      ) : null}
      {avatar.accessory === 'cap' ? (
        <g fill="#f2a84b" stroke="#c88438" strokeWidth="1.5">
          <path d="M34 42c3-16 13-24 27-24 12 0 22 8 25 22-15-5-33-4-52 2z" />
          <path d="M35 41c22-5 40-5 54 1-10 7-36 9-54 1z" />
        </g>
      ) : null}
      {avatar.accessory === 'bow' ? (
        <g fill="#e36e90" stroke="#bd4b70" strokeWidth="1.4">
          <path d="M72 29c-10-10-20-8-17 1 1 4 6 7 13 7-2 9 9 8 12 2 3-6-1-9-8-10z" />
          <circle cx="69" cy="34" r="3" fill="#f5c96d" />
        </g>
      ) : null}
      {avatar.accessory === 'flower' ? (
        <g transform="translate(81 39)">
          <circle cy="-5" r="4" fill="#f07d8e" /><circle cx="5" cy="-1" r="4" fill="#f07d8e" />
          <circle cx="3" cy="5" r="4" fill="#f07d8e" /><circle cx="-4" cy="5" r="4" fill="#f07d8e" />
          <circle cx="-5" cy="-1" r="4" fill="#f07d8e" /><circle r="3" fill="#f7cc63" />
        </g>
      ) : null}
      {avatar.accessory === 'crown' ? (
        <path
          d="M42 27l4-12 9 8 5-13 6 13 9-8 4 12z"
          fill="#f1bd50"
          stroke="#c78c2f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}
