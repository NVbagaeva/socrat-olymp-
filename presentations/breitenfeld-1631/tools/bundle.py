import base64, io, re, os, sys
from PIL import Image
R=sys.argv[1]; OUT=sys.argv[2]
def b64(data, mime): return 'data:%s;base64,%s'%(mime, base64.b64encode(data).decode())
cache={}
def img(rel):
    if rel in cache: return cache[rel]
    p=os.path.join(R,'assets/img',os.path.basename(rel)); im=Image.open(p)
    name=os.path.basename(rel)
    if name=='paper-grain.png':
        d=open(p,'rb').read(); cache[rel]=b64(d,'image/png'); return cache[rel]
    mx=1800 if name in ('hero.png','map_start.png') else 1400
    if name.startswith('estrella'): mx=520
    if max(im.size)>mx: im.thumbnail((mx,mx), Image.LANCZOS)
    buf=io.BytesIO()
    im.save(buf,'WEBP',quality=84,method=6)
    cache[rel]=b64(buf.getvalue(),'image/webp'); return cache[rel]
css=open(os.path.join(R,'assets/css/style.css')).read()
css=re.sub(r'url\(\.\./fonts/([^)]+)\)', lambda m: 'url(%s)'%b64(open(os.path.join(R,'assets/fonts',m.group(1)),'rb').read(),'font/woff2'), css)
css=re.sub(r'url\(\.\./img/([^)]+)\)', lambda m: 'url(%s)'%img(m.group(1)), css)
html=open(os.path.join(R,'index.html')).read()
html=html.replace('<link rel="stylesheet" href="assets/css/style.css">','<style>\n'+css+'\n</style>')
def js(rel):
    t=open(os.path.join(R,rel)).read().replace('</script','<\\/script')
    t=re.sub(r'assets/img/[A-Za-z0-9_.-]+', lambda m: img(m.group(0)), t)
    return '<script>\n'+t+'\n</script>'
for rel in ['assets/vendor/gsap.min.js','assets/vendor/three.min.js','assets/data/europe.js','assets/js/scene3d.js','assets/js/app.js']:
    tag='<script src="%s"></script>'%rel; assert tag in html, tag
    html=html.replace(tag, js(rel).replace('\\','\\\\') if False else js(rel))
html=re.sub(r'assets/img/[A-Za-z0-9_.-]+', lambda m: img(m.group(0)), html)
assert 'assets/' not in re.sub(r'data:[^"\')]+','',html), [m for m in re.findall(r'.{30}assets/.{30}', re.sub(r'data:[^"\')]+','',html))][:5]
open(OUT,'w').write(html); print(OUT, round(os.path.getsize(OUT)/1e6,1),'MB')
