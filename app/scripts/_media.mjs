import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright'; import { bezBanneraCookieVsyudu } from './lib/cookie-notice.mjs'; import { welcomeSeen } from './lib/onboarding.mjs';
import { requireSrc } from './lib/load-ts.mjs';
bezBanneraCookieVsyudu(chromium);
const { vychislit, str } = requireSrc('lib/ustnyySchet/chislo.ts');
const OUT=path.join(import.meta.dirname,'..','out'); const DST=process.env.DST; fs.mkdirSync(DST,{recursive:true});
const T={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
const srv=http.createServer((q,r)=>{let f=path.join(OUT,decodeURIComponent(q.url.split('?')[0]));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':T[path.extname(f)]??'application/octet-stream'});fs.createReadStream(f).pipe(r);});
await new Promise(r=>srv.listen(0,r)); const B=`http://localhost:${srv.address().port}`;
const b=await chromium.launch();
export async function shot(name,url,w,{full=true,wait=null,dark=false}={}){const ctx=await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:2,colorScheme:dark?'dark':'light'});await welcomeSeen(ctx);const p=await ctx.newPage();await p.goto(B+url,{waitUntil:'networkidle'});if(wait)await p.locator(wait).first().waitFor();await p.waitForTimeout(900);await p.screenshot({path:`${DST}/${name}.png`,fullPage:full});await ctx.close();}
/** Видео → GIF: обрезка по прямоугольнику (css px), 12 к/с, ширина W. */
export async function gif(name,w,h,fn,{crop=null,width=640}={}){const vd=fs.mkdtempSync('/tmp/claude-0/vid');const ctx=await b.newContext({viewport:{width:w,height:h},recordVideo:{dir:vd,size:{width:w,height:h}}});await welcomeSeen(ctx);const p=await ctx.newPage();const c=await fn(p,B);const v=await p.video().path();await ctx.close();const cr=c??crop;const vf=(cr?`crop=${Math.round(cr.width)}:${Math.round(cr.height)}:${Math.round(cr.x)}:${Math.round(cr.y)},`:'')+`fps=12,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4`;execFileSync('ffmpeg',['-y','-loglevel','error','-ss','0.8','-i',v,'-vf',vf,`${DST}/${name}.gif`]);}
export const korni = async (p)=>{const e=await p.locator('.us-igra__vopros').getAttribute('data-expr');const e2=e.includes('-sqrt(')?e.replace('-sqrt(','+sqrt('):e.replace('+sqrt(','-sqrt(');return [str(vychislit(e)),str(vychislit(e2))].map(x=>x.replace('.',','));};
export const otvet = async (p)=>str(vychislit(await p.locator('.us-igra__vopros,.us-vyzov [data-expr]').first().getAttribute('data-expr'))).replace('.',',');
const scen = await import(process.env.SCEN);
await scen.default({shot,gif,korni,otvet,B});
await b.close(); srv.close();
