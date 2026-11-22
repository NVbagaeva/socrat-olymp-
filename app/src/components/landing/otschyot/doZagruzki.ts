/**
 * Отсчёт до загрузки кода. Сайт — статический экспорт: в HTML лежат
 * числа на момент сборки. Этот маленький скрипт стоит сразу за плашкой
 * и ещё до первой отрисовки подставляет настоящие — ученик не видит ни
 * вчерашнего числа дней, ни нулей. Потом плашку подхватывает React
 * (EgeOtschyotKlient.tsx) и ведёт секунды.
 *
 * Скрипт не тянет модули, поэтому расчёт здесь записан второй раз, одной
 * функцией-строкой. Что он считает то же, что lib/egeCountdown.ts,
 * проверяет scripts/check-ege-countdown.mjs — на тысячах моментов.
 *
 * Если за время от сборки сменилась фаза или цель (в HTML «дни», а уже
 * последние сутки), разметка другая и подставлять некуда: плашка
 * помечается data-eo-zhdyot и до React держит место пустым. Если
 * сменился только день — прячется одна фраза дня (data-eo-ustarel).
 */

import type { EgeCel } from '@/config/ege-countdown';
import { mskMoment } from '@/lib/egeCountdown';

/** (now, [[старт экзамена, начало года], …]) → [цель, фаза, д, ч, м, с, доля] | null */
export const RASCHYOT_JS =
  'function(n,T){var D=864e5,M=108e5,e=Math.floor((n+M)/D),i,t,c,o,s;' +
  'for(i=0;i<T.length;i++){t=T[i];c=Math.floor((t[0]+M)/D);if(e>c)continue;' +
  "if(e==c)return[i,'segodnya',0,0,0,0,1];o=t[0]-n;s=Math.floor(o/1e3);" +
  "return[i,o>=D?'dni':'sutki',Math.floor(s/86400),Math.floor(s%86400/3600)," +
  'Math.floor(s%3600/60),s%60,Math.min(1,Math.max(0,(n-t[1])/(t[0]-t[1])))]}return null}';

const SLOVA = {
  d: ['день', 'дня', 'дней'],
  h: ['час', 'часа', 'часов'],
  m: ['минута', 'минуты', 'минут'],
  s: ['секунда', 'секунды', 'секунд'],
  v: ['остался', 'осталось', 'осталось'],
};

export function tochkiCeley(celi: readonly EgeCel[]): [number, number][] {
  return celi.map((c) => [mskMoment(c.data, c.vremya), mskMoment(c.nachaloGoda)]);
}

export function skriptDoZagruzki(celi: readonly EgeCel[]): string {
  return (
    '(function(){var r=document.currentScript&&document.currentScript.previousElementSibling;' +
    "if(!r||!r.hasAttribute('data-eo'))return;" +
    `var s=(${RASCHYOT_JS})(Date.now(),${JSON.stringify(tochkiCeley(celi))}),a=r.dataset;` +
    "if(!s||s[0]!=a.eoCel||s[1]!=a.eoFaza){r.setAttribute('data-eo-zhdyot','');return}" +
    "if(s[2]!=a.eoDni)r.setAttribute('data-eo-ustarel','');" +
    `var W=${JSON.stringify(SLOVA)},` +
    'P=function(n,f){var t=n%100,o=n%10;return f[t>10&&t<15?2:o==1?0:o>1&&o<5?1:2]},' +
    'Z=function(q,v){r.querySelectorAll(q).forEach(function(x){x.textContent=v})},' +
    "N={d:s[2],h:s[3],m:s[4],s:s[5]},k,z=function(n){return(n<10?'0':'')+n};" +
    "for(k in N){Z('[data-eo-n=\"'+k+'\"]',k=='d'?N[k]:z(N[k]));Z('[data-eo-w=\"'+k+'\"]',P(N[k],W[k]))}" +
    "if(s[1]=='dni')Z('[data-eo-w=\"v\"]',P(s[2],W.v));" +
    'Z(\'[data-eo-n="p"]\',Math.floor(s[6]*100));' +
    "r.style.setProperty('--eo-p',s[6])})()"
  );
}
