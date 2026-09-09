# -*- coding: utf-8 -*-
"""Генератор чертежей по стереометрии (SVG). Багаева Н.В. / гимназия «Сократ».
Стиль: изумрудные рёбра, штриховые невидимые, зелёная заливка, точки-вершины, жирные serif-подписи.
Вспомогательные построения (высота, апофема, ось, радиус, сечения) — терракотовые.
Проекция: кабинетная (x вправо, z вверх, y «вглубь» под 45° с коэффициентом 0.5)."""
import math, os, json, re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.varLib.instancer import instantiateVariableFont

# ---------- ПАЛИТРА ----------
# Тело фигуры — зелёная гамма
C_EDGE      = "#1B7A3E"   # видимые рёбра: самая уверенная линия
C_HIDDEN    = "#8CC6A3"   # невидимые рёбра: тот же зелёный, осветлённый, пунктиром
C_FILL      = "#1B7A3E"   # заливка граней
FILL_OP     = 0.09        # прозрачность заливки граней
C_VERTEX    = "#14532D"   # точки-вершины
C_LABEL     = "#14231A"   # подписи вершин

# Вспомогательные построения — терракотовый акцент
C_AUX       = "#E07A2F"   # высота, апофема, ось вращения, радиус, знак прямого угла
C_AUX_FILL  = "#E07A2F"   # заливка сечений
AUX_FILL_OP = 0.12        # прозрачность заливки сечений
C_AUX_LABEL = "#E07A2F"   # подписи вспомогательных величин: h, l, r, R

# ---------- метрика ----------
W=6; W_THIN=4; DASH="18,12"; DASH_THIN="14,10"; PT_R=9; FS=68; FS_SMALL=54
CANVAS=1000; PAD=0.10
K=0.5; ANG=math.radians(45)
# путь к Lora можно переопределить переменной окружения LORA_TTF
FONT_PATH=os.environ.get("LORA_TTF","/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf")
_font=None
def font():
    global _font
    if _font is None:
        f=TTFont(FONT_PATH)
        try: _font=instantiateVariableFont(f,{"wght":700})   # вариативная Lora
        except Exception: _font=f                            # статическое начертание
    return _font

# ---------- проекция ----------
def proj(p):
    x,y,z=p
    return (x+K*math.cos(ANG)*y, -(z+K*math.sin(ANG)*y))
VIEW=(K*math.cos(ANG),-1,K*math.sin(ANG))  # вектор к наблюдателю
def set_projection_angle(a):
    """Угол «глубины» кабинетной проекции. Обычно 45°, но отдельным фигурам
    его приходится менять: при 45° cos=sin, и диагональ куба AC1 ложится
    ровно на ребро AD (см. box)."""
    global ANG,VIEW
    ANG=a; VIEW=(K*math.cos(ANG),-1,K*math.sin(ANG))

def sub(a,b): return tuple(a[i]-b[i] for i in range(3))
def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b): return sum(a[i]*b[i] for i in range(3))
def mid(a,b): return tuple((a[i]+b[i])/2 for i in range(len(a)))

def regular_polygon(n,R,z=0):
    # Угол разворота основания вокруг вертикальной оси.
    # 5 и 6 развёрнуты относительно «круглых» 162° и 180°: при них кабинетная
    # проекция клала ребро основания ровно на боковое (шестиугольник) или на
    # вертикальное (пятиугольник) ребро — линии совпадали полностью.
    start={3:150,4:225,5:173,6:188.5,8:202.5}.get(n,180)
    return [(R*math.cos(math.radians(start+360*i/n)),R*math.sin(math.radians(start+360*i/n)),z) for i in range(n)]

def sub_label(name):
    """'A1' -> A с нижним индексом 1"""
    if len(name)>1 and name[1:].isdigit():
        return name[0],name[1:]
    return name,""

# ---------- сцена ----------
class Scene:
    def __init__(s,title):
        s.title=title; s.pts={}; s.faces=[]; s.edges=[]; s.extra=[]; s.labels={}; s.raw=[]; s.fillpoly=None
        s.point_marks=set(); s.small=set(); s.label_dir={}
        s.ang=None   # None — общий угол проекции; иначе свой для этой фигуры
    def P(s,name,p,label=True,small=False,ldir=None):
        s.pts[name]=p
        if label: s.labels[name]=name
        s.point_marks.add(name)
        if small: s.small.add(name)
        if ldir: s.label_dir[name]=ldir
    def face(s,*names): s.faces.append(list(names))
    def seg(s,a,b,kind="auto",thin=False):
        """kind: 'auto' — по видимости граней, 'solid', 'dash' — всегда штрих,
        'aux' — вспомогательное построение (терракотовый штрих поверх рёбер)"""
        s.edges.append((a,b,kind,thin))
    def hull2d(s):
        P=[proj(s.pts[k]) for k in s.pts if k in s.hull_names] if hasattr(s,'hull_names') else [proj(s.pts[k]) for k in s.pts]
        P=sorted(set(P))
        if len(P)<3: return P
        def cr(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
        lo=[]; 
        for p in P:
            while len(lo)>=2 and cr(lo[-2],lo[-1],p)<=0: lo.pop()
            lo.append(p)
        up=[]
        for p in reversed(P):
            while len(up)>=2 and cr(up[-2],up[-1],p)<=0: up.pop()
            up.append(p)
        return lo[:-1]+up[:-1]
    def visible_faces(s):
        pts3=[s.pts[k] for f in s.faces for k in f]
        if not pts3: return {}
        c=tuple(sum(p[i] for p in pts3)/len(pts3) for i in range(3))
        vis={}
        for f in s.faces:
            a,b,cc=[s.pts[k] for k in f[:3]]
            n=cross(sub(b,a),sub(cc,a))
            fc=tuple(sum(s.pts[k][i] for k in f)/len(f) for i in range(3))
            if dot(n,sub(fc,c))<0: n=tuple(-x for x in n)
            vis[tuple(f)]=dot(n,VIEW)>1e-9
        return vis
    def edge_visible(s,a,b,vis):
        for f,v in vis.items():
            if a in f and b in f:
                i,j=f.index(a),f.index(b)
                if abs(i-j)==1 or abs(i-j)==len(f)-1:
                    if v: return True
        return False

# ---------- SVG ----------
def text_path(txt,x,y,size,anchor="middle",color=None):
    f=font(); gs=f.getGlyphSet(); cmap=f.getBestCmap(); upem=f['head'].unitsPerEm
    sc=size/upem; adv=0; paths=[]
    for ch in txt:
        g=cmap.get(ord(ch)); 
        if g is None: continue
        pen=SVGPathPen(gs); gs[g].draw(pen); paths.append((pen.getCommands(),adv)); adv+=gs[g].width
    width=adv*sc; x0=x-width/2 if anchor=="middle" else (x-width if anchor=="end" else x)
    out=[]
    for d,a in paths:
        out.append(f'<path transform="translate({x0+a*sc:.1f},{y:.1f}) scale({sc:.5f},{-sc:.5f})" d="{d}" fill="{color or C_LABEL}"/>')
    return "".join(out)

def render(scene,outline=False):
    prev=ANG
    if getattr(scene,"ang",None) is not None: set_projection_angle(scene.ang)
    try: return _render(scene,outline)
    finally: set_projection_angle(prev)

def _render(scene,outline=False):
    s=scene; vis=s.visible_faces()
    pts2={k:proj(v) for k,v in s.pts.items()}
    if not pts2: pts2={'_c':proj((0,0,0))}
    xs=[p[0] for p in pts2.values()]; ys=[p[1] for p in pts2.values()]
    for r in s.raw:  # raw bbox hints
        if r[0]=="bbox": xs+=[r[1],r[3]]; ys+=[r[2],r[4]]
    minx,maxx,miny,maxy=min(xs),max(xs),min(ys),max(ys)
    w=maxx-minx; h=maxy-miny; size=max(w,h)*(1+2*PAD)*1.12
    sc=CANVAS/size; ox=CANVAS/2-(minx+maxx)/2*sc; oy=CANVAS/2-(miny+maxy)/2*sc
    T=lambda p:(p[0]*sc+ox,p[1]*sc+oy)
    c2=tuple(sum(p[i] for p in pts2.values())/len(pts2) for i in range(2))
    pts2.pop('_c',None)
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}" width="{CANVAS}" height="{CANVAS}">',
         f'<title>{s.title}</title>']
    # заливка силуэта
    hull=s.fillpoly or s.hull2d()
    if hull:
        out.append('<polygon points="'+" ".join(f"{T(p)[0]:.1f},{T(p)[1]:.1f}" for p in hull)+f'" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>')
    for r in s.raw:
        if r[0]=="svg": out.append(r[1](T,sc))
    # рёбра: сначала штриховые, потом сплошные
    solid=[]; dashed=[]; aux=[]
    for a,b,kind,thin in s.edges:
        if kind=="aux": aux.append((a,b,thin)); continue
        v = kind=="solid" or (kind=="auto" and s.edge_visible(a,b,vis))
        (solid if v else dashed).append((a,b,thin))
    for a,b,thin in dashed:
        p,q=T(pts2[a]),T(pts2[b]); wd=W_THIN if thin else W
        out.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{C_HIDDEN}" stroke-width="{wd}" stroke-dasharray="{DASH_THIN if thin else DASH}" stroke-linecap="round"/>')
    for a,b,thin in solid:
        p,q=T(pts2[a]),T(pts2[b]); wd=W_THIN if thin else W
        out.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{C_EDGE}" stroke-width="{wd}" stroke-linecap="round"/>')
    # вспомогательные линии рисуются последними, чтобы не тонуть под рёбрами
    for a,b,thin in aux:
        p,q=T(pts2[a]),T(pts2[b]); wd=W_THIN if thin else W
        out.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{C_AUX}" stroke-width="{wd}" stroke-dasharray="{DASH_THIN if thin else DASH}" stroke-linecap="round"/>')
    for r in s.raw:
        if r[0]=="svgtop": out.append(r[1](T,sc))
    # точки
    for k in sorted(s.point_marks):
        p=T(pts2[k]); rr=PT_R*(0.8 if k in s.small else 1)
        out.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{rr}" fill="{C_VERTEX}" stroke="#fff" stroke-width="2.5"/>')
    # подписи: место подбирается так, чтобы буква ни на что не наезжала
    segs=_segments_of("\n".join(out))
    boxes=[]
    for k,txt in s.labels.items():
        p=T(pts2[k]); fs=FS_SMALL if k in s.small else FS
        if k in s.label_dir: dx,dy=s.label_dir[k]
        else:
            dx,dy=pts2[k][0]-c2[0],pts2[k][1]-c2[1]; L=math.hypot(dx,dy) or 1; dx,dy=dx/L,dy/L
        base,idx=sub_label(txt)
        x,y,box=_place(p[0],p[1],(dx,dy),fs,_label_w(base,idx,fs),segs,boxes)
        boxes.append(box)
        col = C_AUX_LABEL if k.startswith("_") else C_LABEL   # h, l, r, R — вспомогательные
        if outline:
            out.append(text_path(base,x,y,fs,color=col))
            if idx: out.append(text_path(idx,x+fs*0.42,y+fs*0.22,fs*0.6,"start",color=col))
        else:
            t=f'<text x="{x:.1f}" y="{y:.1f}" font-family="Lora, Georgia, serif" font-weight="700" font-size="{fs}" fill="{col}" text-anchor="middle">{base}'
            if idx: t+=f'<tspan font-size="{fs*0.6:.0f}" baseline-shift="-25%">{idx}</tspan>'
            out.append(t+'</text>')
    out.append('</svg>')
    return "\n".join(out)

# ---------- вспомогательные построения ----------
def right_angle(s,O,dirA,dirB,size=0.09):
    """квадратик прямого угла в точке O между 3D-направлениями dirA и dirB (единичные)"""
    o=s.pts[O]
    def f(T,sc):
        a=tuple(o[i]+dirA[i]*size for i in range(3)); b=tuple(o[i]+dirB[i]*size for i in range(3)); c=tuple(o[i]+(dirA[i]+dirB[i])*size for i in range(3))
        pa,pb,pc=T(proj(a)),T(proj(b)),T(proj(c))
        return f'<polyline points="{pa[0]:.1f},{pa[1]:.1f} {pc[0]:.1f},{pc[1]:.1f} {pb[0]:.1f},{pb[1]:.1f}" fill="none" stroke="{C_AUX}" stroke-width="3"/>'
    s.raw.append(("svgtop",f))

# ---------- расстановка подписей ----------
# Ширина знаков Lora Bold в долях кегля. Нужна, чтобы прикинуть габарит
# подписи БЕЗ обращения к шрифту: тогда <text> и контурная версия расставляют
# буквы одинаково. Считать 0.62 на любой знак нельзя — «M» почти вдвое шире «l».
_ADV={"A":0.668,"B":0.661,"C":0.688,"D":0.759,"E":0.624,"F":0.571,"G":0.754,
      "H":0.807,"S":0.598,"O":0.769,"M":0.972,"h":0.621,"l":0.312,"r":0.48,
      "R":0.686,"0":0.636,"1":0.406,"2":0.533,"3":0.56,"4":0.547,"5":0.54,
      "6":0.575,"7":0.469,"8":0.572,"9":0.576}
def _label_w(base,idx,fs):
    w=sum(_ADV.get(c,0.7) for c in base)*fs
    return w + sum(_ADV.get(c,0.7) for c in idx)*fs*0.6

def _segments_of(svg):
    """Отрезки всего, что уже нарисовано: линии, эллипсы, дуги, многоугольники.
    Разбираем собственный вывод — так подписи видят и то, что рисуют
    сырые вставки тел вращения."""
    segs=[]
    for m in re.finditer(r'<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"',svg):
        a,b,c,d=map(float,m.groups()); segs.append(((a,b),(c,d)))
    for m in re.finditer(r'<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([\d.]+)" ry="([\d.]+)"',svg):
        cx,cy,rx,ry=map(float,m.groups())
        P=[(cx+rx*math.cos(2*math.pi*i/72), cy+ry*math.sin(2*math.pi*i/72)) for i in range(73)]
        segs+=list(zip(P,P[1:]))
    for m in re.finditer(r'<path d="M ([-\d.]+) ([-\d.]+) A ([\d.]+) ([\d.]+) 0 0 ([01]) ([-\d.]+) ([-\d.]+)"',svg):
        x1,y1,rx,ry,sw,x2,_=(float(m.group(1)),float(m.group(2)),float(m.group(3)),
                             float(m.group(4)),m.group(5),float(m.group(6)),m.group(7))
        cx=(x1+x2)/2
        P=[]
        for i in range(37):
            t=math.pi*i/36
            a=math.pi-t if sw=='0' else math.pi+t
            P.append((cx+rx*math.cos(a), y1+ry*math.sin(a)))
        segs+=list(zip(P,P[1:]))
    for m in re.finditer(r'<polygon points="([^"]+)"',svg):
        pts=[tuple(map(float,q.split(','))) for q in m.group(1).split()]
        segs+=list(zip(pts,pts[1:]+pts[:1]))
    return segs

def _hits(box,segs,boxes):
    x0,y0,x1,y1=box
    for (a,b) in segs:
        if max(a[0],b[0])<x0 or min(a[0],b[0])>x1 or max(a[1],b[1])<y0 or min(a[1],b[1])>y1:
            continue
        for i in range(21):
            t=i/20.0; px=a[0]+(b[0]-a[0])*t; py=a[1]+(b[1]-a[1])*t
            if x0<=px<=x1 and y0<=py<=y1: return True
    for c in boxes:
        if min(x1,c[2])-max(x0,c[0])>0 and min(y1,c[3])-max(y0,c[1])>0: return True
    return False

def _place(px,py,pref,fs,w,segs,boxes):
    """Предпочтительное направление пробуем первым; отходим по кругу, только
    если там уже что-то нарисовано. Чертежи без конфликтов не меняются."""
    a0=math.atan2(pref[1],pref[0])
    cands=[0.0]
    for k in range(1,13): cands += [k*math.pi/12, -k*math.pi/12]
    best=None
    for mul in (1.0,1.25,1.55):
        for da in cands:
            a=a0+da; d=fs*0.95*mul
            x=px+math.cos(a)*d; y=py+math.sin(a)*d+fs*0.35
            box=(x-w/2-3, y-0.72*fs-3, x+w/2+3, y+0.06*fs+3)
            if not (0<box[0] and box[2]<CANVAS and 0<box[1] and box[3]<CANVAS): continue
            if not _hits(box,segs,boxes): return x,y,box
            if best is None: best=(x,y,box)
    return best

def unit(v):
    L=math.sqrt(dot(v,v)); return tuple(x/L for x in v)

# ---------- ФИГУРЫ ----------
LET="ABCDEFGH"
def pyramid(n,R=1.0,h=1.5,names=None,build=None,title="",base_pts=None):
    s=Scene(title); base=base_pts or regular_polygon(n,R)
    names=names or list(LET[:n])
    for nm,p in zip(names,base): s.P(nm,p)
    s.P("S",(0,0,h),ldir=(0,-1))
    s.face(*names)
    for i in range(n): s.face(names[i],names[(i+1)%n],"S")
    for i in range(n): s.seg(names[i],names[(i+1)%n]); s.seg(names[i],"S")
    if build:
        s.P("O",(0,0,0),small=True,ldir=(1,0.6)); s.seg("S","O","aux",thin=True)
        if "apothem" in build:
            fi=n//2 if n%2==0 else (0 if n==3 else 1)
            # передняя грань: ребро с минимальной y
            j=min(range(n),key=lambda i:(base[i][1]+base[(i+1)%n][1]))
            m=mid(base[j],base[(j+1)%n]); s.P("M",m,small=True,ldir=(0.3,1)); s.seg("S","M","aux",thin=True); s.seg("O","M","aux",thin=True)
            right_angle(s,"O",(0,0,1),unit(sub(m,(0,0,0))))
            right_angle(s,"M",unit(sub((0,0,h),m)),unit(sub(base[(j+1)%n],m)),0.07)
        elif "height" in build:
            right_angle(s,"O",(0,0,1),unit(sub(base[0],(0,0,0))))
            s.seg("O",names[0],"aux",thin=True)
    return s

def pyramid_edge_perp(n=4,R=1.0,h=1.5,title=""):
    s=Scene(title); base=regular_polygon(n,R); names=list(LET[:n])
    for nm,p in zip(names,base): s.P(nm,p)
    top=(base[n-1][0],base[n-1][1],h)  # над задней вершиной D
    s.P("S",top,ldir=(0,-1))
    s.face(*names)
    for i in range(n): s.face(names[i],names[(i+1)%n],"S")
    for i in range(n): s.seg(names[i],names[(i+1)%n]); s.seg(names[i],"S")
    right_angle(s,names[n-1],(0,0,1),unit(sub(base[0],base[n-1])),0.1)
    return s

def frustum(n,R1=1.0,R2=0.55,h=1.0,title=""):
    s=Scene(title); b=regular_polygon(n,R1); t=regular_polygon(n,R2,h)
    nb=list(LET[:n]); nt=[x+"1" for x in nb]
    # Подписи разводим радиально от центра СВОЕЙ грани: у усечённой пирамиды
    # верхние вершины кучкуются около общего центра фигуры, и подписи наезжали.
    def radial(pts3,centre3):
        c=proj(centre3); out=[]
        for q in pts3:
            e=proj(q); dx,dy=e[0]-c[0],e[1]-c[1]; L=math.hypot(dx,dy) or 1
            out.append((dx/L,dy/L))
        return out
    for nm,p,d in zip(nb,b,radial(b,(0,0,0))): s.P(nm,p,ldir=d)
    for nm,p,d in zip(nt,t,radial(t,(0,0,h))): s.P(nm,p,ldir=d)
    s.face(*nb); s.face(*nt)
    for i in range(n):
        j=(i+1)%n; s.face(nb[i],nb[j],nt[j],nt[i]); s.seg(nb[i],nb[j]); s.seg(nt[i],nt[j]); s.seg(nb[i],nt[i])
    return s

def tetrahedron(title=""):
    R=1.0; h=R*math.sqrt(2)  # правильный тетраэдр: ребро a=R√3, высота a√(2/3)
    return pyramid(3,R,h,title=title)

def prism(n,R=1.0,h=1.6,skew=(0,0),diag=False,section=False,title="",names=None,base_pts=None):
    s=Scene(title); b=base_pts or regular_polygon(n,R); t=[(p[0]+skew[0],p[1]+skew[1],h) for p in b]
    nb=names or list(LET[:n]); nt=[x+"1" for x in nb]
    for nm,p in zip(nb,b): s.P(nm,p)
    for nm,p in zip(nt,t): s.P(nm,p)
    s.face(*nb); s.face(*nt)
    for i in range(n):
        j=(i+1)%n; s.face(nb[i],nb[j],nt[j],nt[i]); s.seg(nb[i],nb[j]); s.seg(nt[i],nt[j]); s.seg(nb[i],nt[i])
    if diag or section:
        k=n//2; a,c=nb[0],nb[k]; a1,c1=nt[0],nt[k]
        if section:
            s.seg(a,c,"aux",thin=True); s.seg(a1,c1,"aux",thin=True); s.seg(a,c1,"aux",thin=True)
            def f(T,sc):
                P=[T(proj(s.pts[x])) for x in (a,c,c1,a1)]
                return '<polygon points="'+" ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in P)+f'" fill="{C_AUX_FILL}" fill-opacity="{AUX_FILL_OP}" stroke="none"/>'
            s.raw.append(("svg",f))
        else:
            s.seg(a,c1,"aux",thin=True); s.seg(a,c,"aux",thin=True)
    return s

def box(a=1.6,b=1.0,c=1.1,cube=False,diag=False,section=False,title="",rot=0.0):
    """rot — поворот вокруг вертикальной оси, градусы."""
    if cube: a=b=c=1.2
    s=Scene(title)
    _r=math.radians(rot); _co,_si=math.cos(_r),math.sin(_r)
    def _rt(x,y): return (x*_co-y*_si, x*_si+y*_co)
    pts={k:_rt(*v)+(0,) for k,v in
         {"A":(-a/2,-b/2),"B":(a/2,-b/2),"C":(a/2,b/2),"D":(-a/2,b/2)}.items()}
    for k,v in pts.items(): s.P(k,v); s.P(k+"1",(v[0],v[1],c))
    nb=["A","B","C","D"]; nt=[x+"1" for x in nb]
    s.face(*nb); s.face(*nt)
    for i in range(4):
        j=(i+1)%4; s.face(nb[i],nb[j],nt[j],nt[i]); s.seg(nb[i],nb[j]); s.seg(nt[i],nt[j]); s.seg(nb[i],nt[i])
    if section:
        s.seg("A","C","aux",thin=True); s.seg("A1","C1","aux",thin=True)
        def f(T,sc):
            P=[T(proj(s.pts[x])) for x in ("A","C","C1","A1")]
            return '<polygon points="'+" ".join(f"{p[0]:.1f},{p[1]:.1f}" for p in P)+f'" fill="{C_AUX_FILL}" fill-opacity="{AUX_FILL_OP}" stroke="none"/>'
        s.raw.append(("svg",f))
    if diag:
        s.seg("A","C1","aux",thin=True); s.seg("A","C","aux",thin=True)
        # у куба a=c, и при 45° диагональ AC1 совпадает с ребром AD — разводим углом
        if cube: s.ang=math.radians(60)
        right_angle(s,"C",(0,0,1),unit(sub(s.pts["A"],s.pts["C"])),0.1)
    return s

def parallelepiped(title="",skew=(0.35,0.15)):
    s=Scene(title); a,b,c=1.6,1.0,1.1
    base={"A":(-a/2,-b/2,0),"B":(a/2,-b/2,0),"C":(a/2,b/2,0),"D":(-a/2,b/2,0)}
    for k,v in base.items(): s.P(k,v); s.P(k+"1",(v[0]+skew[0],v[1]+skew[1],c))
    nb=["A","B","C","D"]; nt=[x+"1" for x in nb]
    s.face(*nb); s.face(*nt)
    for i in range(4):
        j=(i+1)%4; s.face(nb[i],nb[j],nt[j],nt[i]); s.seg(nb[i],nb[j]); s.seg(nt[i],nt[j]); s.seg(nb[i],nt[i])
    return s

def truncated_prism(title=""):
    s=Scene(title); b=regular_polygon(3,1.0); hs=[1.6,1.1,1.35]
    nb=["A","B","C"]; nt=["A1","B1","C1"]
    for nm,p in zip(nb,b): s.P(nm,p)
    for nm,p,h in zip(nt,b,hs): s.P(nm,(p[0],p[1],h))
    s.face(*nb); s.face(*nt)
    for i in range(3):
        j=(i+1)%3; s.face(nb[i],nb[j],nt[j],nt[i]); s.seg(nb[i],nb[j]); s.seg(nt[i],nt[j]); s.seg(nb[i],nt[i])
    return s

# ---------- тела вращения (2D, эллипсы с отношением осей 0.36) ----------
EL=0.36

def polygon_on_base_ellipse(n,R,z=0,start=None):
    """Вершины правильного n-угольника, лежащие РОВНО на той кривой, которой
    рисуется основание тела вращения.

    Основание рисуется условным эллипсом (оси по экрану, ry = rx*EL), а
    настоящая проекция горизонтальной окружности — эллипс, наклонённый примерно
    на 7° и на 6% более широкий. Поэтому вершины, посчитанные через proj(),
    с нарисованной кривой расходились до 22px на холсте 1000. Здесь берём точки,
    проекция которых попадает точно на условный эллипс."""
    st = {3:150,4:225,5:173,6:188.5,8:202.5}.get(n,180) if start is None else start
    Kc=K*math.cos(ANG); Ks=K*math.sin(ANG); k=EL/Ks
    pts=[]
    for i in range(n):
        a=math.radians(st+360*i/n)
        pts.append((R*math.cos(a)-Kc*k*R*math.sin(a), k*R*math.sin(a), z))
    return pts

def ellipse_arc(cx,cy,rx,ry,front,w=W):
    """Половина эллипса от левой точки к правой.
    front=True  — БЛИЖНЯЯ к зрителю половина: сплошная, цветом рёбер.
    front=False — ДАЛЬНЯЯ половина: пунктир цветом невидимых рёбер.

    Ось y на экране направлена вниз, а точки, удалённые от зрителя, проекция
    поднимает выше. Значит дальняя половина — ВЕРХНЯЯ, и рисует её sweep=1
    (дуга идёт через верх), а ближнюю, нижнюю, — sweep=0."""
    sweep = 0 if front else 1
    style = (f'stroke="{C_EDGE}" stroke-width="{w}"' if front
             else f'stroke="{C_HIDDEN}" stroke-width="{w}" stroke-dasharray="{DASH}"')
    return (f'<path d="M {cx-rx:.1f} {cy:.1f} A {rx:.1f} {ry:.1f} 0 0 {sweep} {cx+rx:.1f} {cy:.1f}" fill="none" '
            + style + ' stroke-linecap="round"/>')

def cylinder(build=None,title=""):
    s=Scene(title); r,h=1.0,1.9
    s.pts["_bl"]=(-r,0,0); s.pts["_br"]=(r,0,0); s.pts["_tl"]=(-r,0,h); s.pts["_tr"]=(r,0,h)
    s.raw.append(("bbox",-r,-h*0-r*EL*0.5- (r*EL),0,0))
    s.raw.append(("bbox",-r,-h-r*EL,r,r*EL))
    s.fillpoly=[]
    def body(T,sc):
        L,R,TL,TR=T(proj((-r,0,0))),T(proj((r,0,0))),T(proj((-r,0,h))),T(proj((r,0,h)))
        rx=(R[0]-L[0])/2; ry=rx*EL; cxb,cyb=(L[0]+R[0])/2,L[1]; cxt,cyt=(TL[0]+TR[0])/2,TL[1]
        o=[f'<path d="M {L[0]:.1f} {L[1]:.1f} L {TL[0]:.1f} {TL[1]:.1f} A {rx:.1f} {ry:.1f} 0 1 1 {TR[0]:.1f} {TR[1]:.1f} L {R[0]:.1f} {R[1]:.1f} A {rx:.1f} {ry:.1f} 0 0 1 {L[0]:.1f} {L[1]:.1f} Z" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>']
        o.append(ellipse_arc(cxb,cyb,rx,ry,False)); o.append(ellipse_arc(cxb,cyb,rx,ry,True))
        o.append(f'<ellipse cx="{cxt:.1f}" cy="{cyt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{C_EDGE}" stroke-width="{W}"/>')
        o.append(f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{TL[0]:.1f}" y2="{TL[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
        o.append(f'<line x1="{R[0]:.1f}" y1="{R[1]:.1f}" x2="{TR[0]:.1f}" y2="{TR[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
        if build=="section":
            o.append(f'<polygon points="{L[0]:.1f},{L[1]:.1f} {R[0]:.1f},{R[1]:.1f} {TR[0]:.1f},{TR[1]:.1f} {TL[0]:.1f},{TL[1]:.1f}" fill="{C_AUX_FILL}" fill-opacity="{AUX_FILL_OP}" stroke="none"/>')
            o.append(f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{R[0]:.1f}" y2="{R[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        if build in ("axis","section"):
            o.append(f'<line x1="{cxb:.1f}" y1="{cyb:.1f}" x2="{cxt:.1f}" y2="{cyt:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        if build=="axis":
            o.append(f'<line x1="{cxb:.1f}" y1="{cyb:.1f}" x2="{R[0]:.1f}" y2="{R[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        return "\n".join(o)
    s.raw.append(("svg",body))
    if build in ("axis","section"):
        s.P("O",(0,0,0),small=True,ldir=(-0.3,1)); s.P("O1",(0,0,h),small=True,ldir=(0,-1))
    if build=="section":
        s.P("A",(-r,0,0),ldir=(-1,0.4)); s.P("B",(r,0,0),ldir=(1,0.4)); s.P("B1",(r,0,h),ldir=(1,-0.3)); s.P("A1",(-r,0,h),ldir=(-1,-0.3))
    if build=="axis":
        s.P("A",(r,0,0),ldir=(1,0.5)); s.P("A1",(r,0,h),ldir=(1,-0.3))
        s.labels["_r"]="r"; s.pts["_r"]=(r/2,0,0); s.small.add("_r"); s.label_dir["_r"]=(0,-1.1)
        s.labels["_l"]="l"; s.pts["_l"]=(r,0,h/2); s.small.add("_l"); s.label_dir["_l"]=(1.1,0)
    return s

def cone(build=None,truncated=False,title=""):
    s=Scene(title); r,h=1.0,2.0; r2=0.5; h2=1.1
    s.raw.append(("bbox",-r,-(h if not truncated else h2)-0.05,r,r*EL))
    s.fillpoly=[]
    def body(T,sc):
        L,R=T(proj((-r,0,0))),T(proj((r,0,0))); rx=(R[0]-L[0])/2; ry=rx*EL; cx,cy=(L[0]+R[0])/2,L[1]
        o=[]
        if truncated:
            TL,TR=T(proj((-r2,0,h2))),T(proj((r2,0,h2))); rx2=(TR[0]-TL[0])/2; ry2=rx2*EL; cxt,cyt=(TL[0]+TR[0])/2,TL[1]
            o.append(f'<path d="M {L[0]:.1f} {L[1]:.1f} L {TL[0]:.1f} {TL[1]:.1f} A {rx2:.1f} {ry2:.1f} 0 1 1 {TR[0]:.1f} {TR[1]:.1f} L {R[0]:.1f} {R[1]:.1f} A {rx:.1f} {ry:.1f} 0 0 1 {L[0]:.1f} {L[1]:.1f} Z" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>')
            o.append(ellipse_arc(cx,cy,rx,ry,False)); o.append(ellipse_arc(cx,cy,rx,ry,True))
            o.append(f'<ellipse cx="{cxt:.1f}" cy="{cyt:.1f}" rx="{rx2:.1f}" ry="{ry2:.1f}" fill="none" stroke="{C_EDGE}" stroke-width="{W}"/>')
            o.append(f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{TL[0]:.1f}" y2="{TL[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
            o.append(f'<line x1="{R[0]:.1f}" y1="{R[1]:.1f}" x2="{TR[0]:.1f}" y2="{TR[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
            if build=="axis":
                o.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{cxt:.1f}" y2="{cyt:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
                o.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{R[0]:.1f}" y2="{R[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
                o.append(f'<line x1="{cxt:.1f}" y1="{cyt:.1f}" x2="{TR[0]:.1f}" y2="{TR[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        else:
            S=T(proj((0,0,h)))
            o.append(f'<path d="M {L[0]:.1f} {L[1]:.1f} L {S[0]:.1f} {S[1]:.1f} L {R[0]:.1f} {R[1]:.1f} A {rx:.1f} {ry:.1f} 0 0 1 {L[0]:.1f} {L[1]:.1f} Z" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>')
            o.append(ellipse_arc(cx,cy,rx,ry,False)); o.append(ellipse_arc(cx,cy,rx,ry,True))
            o.append(f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
            o.append(f'<line x1="{R[0]:.1f}" y1="{R[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>')
            if build=="section":
                o.append(f'<polygon points="{L[0]:.1f},{L[1]:.1f} {R[0]:.1f},{R[1]:.1f} {S[0]:.1f},{S[1]:.1f}" fill="{C_AUX_FILL}" fill-opacity="{AUX_FILL_OP}" stroke="none"/>')
                o.append(f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{R[0]:.1f}" y2="{R[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
            if build in ("axis","section"):
                o.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
            if build=="axis":
                o.append(f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{R[0]:.1f}" y2="{R[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        return "\n".join(o)
    s.raw.append(("svg",body))
    if truncated:
        s.pts["_t"]=(0,0,h2)
        if build=="axis":
            s.P("O",(0,0,0),small=True,ldir=(-0.3,1)); s.P("O1",(0,0,h2),small=True,ldir=(-0.4,-1)); s.P("A",(r,0,0),ldir=(1,0.4)); s.P("A1",(r2,0,h2),ldir=(1,-0.4))
    else:
        s.P("S",(0,0,h),ldir=(0,-1))
        if build in ("axis","section"): s.P("O",(0,0,0),small=True,ldir=(-0.3,1))
        if build=="axis":
            s.P("A",(r,0,0),ldir=(1,0.4))
            s.labels["_h"]="h"; s.pts["_h"]=(0,0,h/2); s.small.add("_h"); s.label_dir["_h"]=(-1.1,0)
            s.labels["_l"]="l"; s.pts["_l"]=(r/2,0,h/2); s.small.add("_l"); s.label_dir["_l"]=(1.1,0)
        if build=="section": s.P("A",(-r,0,0),ldir=(-1,0.4)); s.P("B",(r,0,0),ldir=(1,0.4))
    return s

def sphere(build=None,title=""):
    s=Scene(title); R=1.0
    s.raw.append(("bbox",-R,-R,R,R)); s.fillpoly=[]
    def body(T,sc):
        C=T(proj((0,0,0))); rr=R*sc
        o=[f'<circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="{C_EDGE}" stroke-width="{W}"/>']
        o.append(ellipse_arc(C[0],C[1],rr,rr*EL,False)); o.append(ellipse_arc(C[0],C[1],rr,rr*EL,True))
        if build=="section":
            zc=0.55*R; rs=math.sqrt(R*R-zc*zc); Cs=T(proj((0,0,zc)))
            # Эллипс сечения центрально-симметричен, а касательные окружности шара
            # на концах хорды зеркальны — совпасть они не могут, и эллипс вылезал
            # за контур на ~8px. Обрезаем сечение по шару: геометрия точная,
            # а стык приходится ровно на очерк.
            o.append(f'<clipPath id="sph"><circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}"/></clipPath>')
            o.append(f'<g clip-path="url(#sph)"><ellipse cx="{Cs[0]:.1f}" cy="{Cs[1]:.1f}" rx="{rs*sc:.1f}" ry="{rs*sc*EL:.1f}" fill="{C_AUX_FILL}" fill-opacity="{AUX_FILL_OP}" stroke="{C_AUX}" stroke-width="{W_THIN}"/></g>')
            o.append(f'<line x1="{C[0]:.1f}" y1="{C[1]:.1f}" x2="{Cs[0]:.1f}" y2="{Cs[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
            A=T(proj((rs,0,zc)))
            o.append(f'<line x1="{C[0]:.1f}" y1="{C[1]:.1f}" x2="{A[0]:.1f}" y2="{A[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
            o.append(f'<line x1="{Cs[0]:.1f}" y1="{Cs[1]:.1f}" x2="{A[0]:.1f}" y2="{A[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        if build=="radius":
            A=T(proj((R*0.6,0,R*0.8)))
            o.append(f'<line x1="{C[0]:.1f}" y1="{C[1]:.1f}" x2="{A[0]:.1f}" y2="{A[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>')
        return "\n".join(o)
    s.raw.append(("svg",body))
    if build:
        s.P("O",(0,0,0),small=True,ldir=(-0.4,1))
    if build=="section":
        zc=0.55*R; rs=math.sqrt(R*R-zc*zc)
        s.P("O1",(0,0,zc),small=True,ldir=(-0.5,-1)); s.P("A",(rs,0,zc),ldir=(1,-0.3))
        s.labels["_R"]="R"; s.pts["_R"]=(rs/2,0,zc/2); s.small.add("_R"); s.label_dir["_R"]=(1.1,0.5)
    if build=="radius":
        s.P("A",(R*0.6,0,R*0.8),ldir=(0.9,-0.8))
        s.labels["_R"]="R"; s.pts["_R"]=(R*0.3,0,R*0.4); s.small.add("_R"); s.label_dir["_R"]=(-1.2,0.2)
    return s

# ---------- комбинации ----------
def sphere_in_cube(title=""):
    s=box(cube=True,title=title); a=1.2; R=a/2; c=(0,0,a/2)
    def f(T,sc):
        C=T(proj(c)); rr=R*sc
        return (f'<circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}" fill="{C_EDGE}" fill-opacity="0.08" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>'
                + ellipse_arc(C[0],C[1],rr,rr*EL,False,W_THIN) + ellipse_arc(C[0],C[1],rr,rr*EL,True,W_THIN))
    s.raw.append(("svgtop",f)); s.P("O",c,small=True,ldir=(0.4,1))
    return s

def cube_in_sphere(title=""):
    # Куб развёрнут на 40° вокруг вертикальной оси. Без разворота вершины
    # ложатся на четыре разных расстояния от центра (в долях радиуса
    # 0.54, 0.79, 0.93, 1.10), то есть две вылезают за очерк шара, а
    # остальные заметно утоплены. При 40° все шесть вершин очерка попадают
    # на окружность с точностью 1–3%, причём радиус остаётся точным a√3/2.
    s=box(cube=True,title=title,rot=40); a=1.2; R=a*math.sqrt(3)/2; c=(0,0,a/2)
    s.raw.append(("bbox",-R,-a/2-R,R,-a/2+R))
    def f(T,sc):
        C=T(proj(c)); rr=R*sc
        return f'<circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}" fill="{C_FILL}" fill-opacity="0.06" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>'+ellipse_arc(C[0],C[1],rr,rr*EL,False,W_THIN)+ellipse_arc(C[0],C[1],rr,rr*EL,True,W_THIN)
    s.raw.insert(0,("svg",f)); s.P("O",c,small=True,ldir=(0.4,1)); s.seg("A","C1","aux",thin=True)
    s.ang=math.radians(60)   # та же причина, что и в box(cube=True,diag=True)
    return s

def sphere_in_cylinder(title=""):
    s=cylinder(title=title); r,h=1.0,1.9
    # цилиндр под шар: высота = 2r -> перестроим
    s=Scene(title); r=1.0; h=2*r; s.raw.append(("bbox",-r,-h-r*EL,r,r*EL)); s.fillpoly=[]
    def body(T,sc):
        L,R_,TL,TR=T(proj((-r,0,0))),T(proj((r,0,0))),T(proj((-r,0,h))),T(proj((r,0,h)))
        rx=(R_[0]-L[0])/2; ry=rx*EL; cxb,cyb=(L[0]+R_[0])/2,L[1]; cxt,cyt=(TL[0]+TR[0])/2,TL[1]
        C=T(proj((0,0,r))); rr=r*sc
        o=[f'<path d="M {L[0]:.1f} {L[1]:.1f} L {TL[0]:.1f} {TL[1]:.1f} A {rx:.1f} {ry:.1f} 0 1 1 {TR[0]:.1f} {TR[1]:.1f} L {R_[0]:.1f} {R_[1]:.1f} A {rx:.1f} {ry:.1f} 0 0 1 {L[0]:.1f} {L[1]:.1f} Z" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>',
           ellipse_arc(cxb,cyb,rx,ry,False),ellipse_arc(cxb,cyb,rx,ry,True),
           f'<ellipse cx="{cxt:.1f}" cy="{cyt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{C_EDGE}" stroke-width="{W}"/>',
           f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{TL[0]:.1f}" y2="{TL[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>',
           f'<line x1="{R_[0]:.1f}" y1="{R_[1]:.1f}" x2="{TR[0]:.1f}" y2="{TR[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>',
           f'<circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}" fill="{C_EDGE}" fill-opacity="0.08" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>',
           ellipse_arc(C[0],C[1],rr,rr*EL,False,W_THIN),ellipse_arc(C[0],C[1],rr,rr*EL,True,W_THIN)]
        return "\n".join(o)
    s.raw.append(("svg",body)); s.P("O",(0,0,r),small=True,ldir=(0.5,1))
    return s

def sphere_in_cone(title=""):
    s=Scene(title); r,h=1.0,2.2; l=math.hypot(r,h); rho=r*h/(r+l)  # радиус вписанного шара
    s.raw.append(("bbox",-r,-h-0.05,r,r*EL)); s.fillpoly=[]
    def body(T,sc):
        L,R_=T(proj((-r,0,0))),T(proj((r,0,0))); rx=(R_[0]-L[0])/2; ry=rx*EL; cx,cy=(L[0]+R_[0])/2,L[1]; S=T(proj((0,0,h))); C=T(proj((0,0,rho))); rr=rho*sc
        o=[f'<path d="M {L[0]:.1f} {L[1]:.1f} L {S[0]:.1f} {S[1]:.1f} L {R_[0]:.1f} {R_[1]:.1f} A {rx:.1f} {ry:.1f} 0 0 1 {L[0]:.1f} {L[1]:.1f} Z" fill="{C_FILL}" fill-opacity="{FILL_OP}" stroke="none"/>',
           ellipse_arc(cx,cy,rx,ry,False),ellipse_arc(cx,cy,rx,ry,True),
           f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>',
           f'<line x1="{R_[0]:.1f}" y1="{R_[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W}" stroke-linecap="round"/>',
           f'<circle cx="{C[0]:.1f}" cy="{C[1]:.1f}" r="{rr:.1f}" fill="{C_EDGE}" fill-opacity="0.08" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>',
           ellipse_arc(C[0],C[1],rr,rr*EL,False,W_THIN),ellipse_arc(C[0],C[1],rr,rr*EL,True,W_THIN),
           f'<line x1="{cx:.1f}" y1="{cy:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_AUX}" stroke-width="{W_THIN}" stroke-dasharray="{DASH_THIN}"/>']
        return "\n".join(o)
    s.raw.append(("svg",body)); s.P("S",(0,0,h),ldir=(0,-1)); s.P("O",(0,0,rho),small=True,ldir=(1,0.2)); s.P("O1",(0,0,0),small=True,ldir=(-0.4,1))
    return s

def pyramid_in_cone(title=""):
    r=1.0; h=1.9
    s=pyramid(4,1.0,h,title=title,base_pts=polygon_on_base_ellipse(4,r))
    def f(T,sc):
        L,R_=T(proj((-r,0,0))),T(proj((r,0,0))); rx=(R_[0]-L[0])/2; ry=rx*EL; cx,cy=(L[0]+R_[0])/2,L[1]; S=T(proj((0,0,h)))
        return "\n".join([ellipse_arc(cx,cy,rx,ry,False,W_THIN),ellipse_arc(cx,cy,rx,ry,True,W_THIN),
            f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>',f'<line x1="{R_[0]:.1f}" y1="{R_[1]:.1f}" x2="{S[0]:.1f}" y2="{S[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>'])
    s.raw.append(("svg",f)); s.raw.append(("bbox",-r,-h,r,r*EL)); s.P("O",(0,0,0),small=True,ldir=(0.6,1)); s.seg("S","O","aux",thin=True)
    return s

def prism_in_cylinder(title=""):
    r,h=1.0,1.6
    s=prism(6,r,h,title=title,base_pts=polygon_on_base_ellipse(6,r))
    def f(T,sc):
        L,R_,TL,TR=T(proj((-r,0,0))),T(proj((r,0,0))),T(proj((-r,0,h))),T(proj((r,0,h))); rx=(R_[0]-L[0])/2; ry=rx*EL
        cxb,cyb=(L[0]+R_[0])/2,L[1]; cxt,cyt=(TL[0]+TR[0])/2,TL[1]
        return "\n".join([ellipse_arc(cxb,cyb,rx,ry,False,W_THIN),ellipse_arc(cxb,cyb,rx,ry,True,W_THIN),
            f'<ellipse cx="{cxt:.1f}" cy="{cyt:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="none" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>',
            f'<line x1="{L[0]:.1f}" y1="{L[1]:.1f}" x2="{TL[0]:.1f}" y2="{TL[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>',f'<line x1="{R_[0]:.1f}" y1="{R_[1]:.1f}" x2="{TR[0]:.1f}" y2="{TR[1]:.1f}" stroke="{C_EDGE}" stroke-width="{W_THIN}"/>'])
    s.raw.append(("svg",f)); s.raw.append(("bbox",-r,-h-r*EL,r,r*EL))
    return s

# ---------- каталог ----------
CATALOG=[
 ("piramidy","piramida_3ug",lambda:pyramid(3,1.0,1.4,title="Треугольная пирамида"),"Треугольная пирамида"),
 ("piramidy","piramida_3ug_visota",lambda:pyramid(3,1.0,1.4,build=["height"],title="Треугольная пирамида с высотой"),"Треугольная пирамида с высотой SO"),
 ("piramidy","piramida_3ug_apofema",lambda:pyramid(3,1.0,1.4,build=["apothem"],title="Правильная треугольная пирамида с апофемой"),"Правильная треугольная пирамида с апофемой SM"),
 ("piramidy","tetraedr",lambda:tetrahedron("Правильный тетраэдр"),"Правильный тетраэдр"),
 ("piramidy","piramida_4ug",lambda:pyramid(4,1.0,1.5,title="Четырёхугольная пирамида"),"Правильная четырёхугольная пирамида"),
 ("piramidy","piramida_4ug_visota",lambda:pyramid(4,1.0,1.5,build=["height"],title="Четырёхугольная пирамида с высотой"),"Четырёхугольная пирамида с высотой SO"),
 ("piramidy","piramida_4ug_apofema",lambda:pyramid(4,1.0,1.5,build=["apothem"],title="Четырёхугольная пирамида с апофемой"),"Четырёхугольная пирамида с высотой и апофемой"),
 ("piramidy","piramida_4ug_rebro_perp",lambda:pyramid_edge_perp(4,1.0,1.5,"Пирамида с боковым ребром, перпендикулярным основанию"),"Пирамида, боковое ребро SD ⟂ основанию"),
 ("piramidy","piramida_5ug",lambda:pyramid(5,1.0,1.5,title="Пятиугольная пирамида"),"Правильная пятиугольная пирамида"),
 ("piramidy","piramida_5ug_visota",lambda:pyramid(5,1.0,1.5,build=["height"],title="Пятиугольная пирамида с высотой"),"Пятиугольная пирамида с высотой SO"),
 ("piramidy","piramida_6ug",lambda:pyramid(6,1.0,1.6,title="Шестиугольная пирамида"),"Правильная шестиугольная пирамида"),
 ("piramidy","piramida_6ug_apofema",lambda:pyramid(6,1.0,1.6,build=["apothem"],title="Шестиугольная пирамида с апофемой"),"Шестиугольная пирамида с высотой и апофемой"),
 ("piramidy","piramida_usech_3ug",lambda:frustum(3,title="Усечённая треугольная пирамида"),"Усечённая треугольная пирамида"),
 ("piramidy","piramida_usech_4ug",lambda:frustum(4,title="Усечённая четырёхугольная пирамида"),"Усечённая четырёхугольная пирамида"),
 ("piramidy","piramida_usech_6ug",lambda:frustum(6,1.0,0.55,0.9,title="Усечённая шестиугольная пирамида"),"Усечённая шестиугольная пирамида"),
 ("prizmy","prizma_3ug_pryamaya",lambda:prism(3,1.0,1.6,title="Прямая треугольная призма"),"Прямая треугольная призма"),
 ("prizmy","prizma_3ug_naklonnaya",lambda:prism(3,1.0,1.5,skew=(0.45,0.2),title="Наклонная треугольная призма"),"Наклонная треугольная призма"),
 ("prizmy","prizma_4ug_pryamaya",lambda:prism(4,1.0,1.6,title="Прямая четырёхугольная призма"),"Прямая четырёхугольная призма"),
 ("prizmy","parallelepiped_pryamougolnyi",lambda:box(title="Прямоугольный параллелепипед"),"Прямоугольный параллелепипед"),
 ("prizmy","parallelepiped_diagonal",lambda:box(diag=True,title="Прямоугольный параллелепипед с диагональю"),"Прямоугольный параллелепипед с диагональю AC₁"),
 ("prizmy","parallelepiped_diag_sechenie",lambda:box(section=True,title="Диагональное сечение параллелепипеда"),"Диагональное сечение ACC₁A₁"),
 ("prizmy","parallelepiped_naklonnyi",lambda:parallelepiped("Наклонный параллелепипед"),"Наклонный параллелепипед"),
 ("prizmy","kub",lambda:box(cube=True,title="Куб"),"Куб"),
 ("prizmy","kub_diagonal",lambda:box(cube=True,diag=True,title="Куб с диагональю"),"Куб с диагональю AC₁"),
 ("prizmy","prizma_5ug",lambda:prism(5,1.0,1.6,title="Пятиугольная призма"),"Правильная пятиугольная призма"),
 ("prizmy","prizma_6ug",lambda:prism(6,1.0,1.6,title="Шестиугольная призма"),"Правильная шестиугольная призма"),
 ("prizmy","prizma_6ug_diag_sechenie",lambda:prism(6,1.0,1.6,section=True,title="Диагональное сечение шестиугольной призмы"),"Шестиугольная призма, сечение ADD₁A₁"),
 ("prizmy","prizma_usechennaya",lambda:truncated_prism("Усечённая призма"),"Усечённая треугольная призма"),
 ("tela_vrashcheniya","cilindr",lambda:cylinder(title="Цилиндр"),"Цилиндр"),
 ("tela_vrashcheniya","cilindr_os_radius",lambda:cylinder("axis","Цилиндр с осью, радиусом и образующей"),"Цилиндр: ось OO₁, радиус r, образующая l"),
 ("tela_vrashcheniya","cilindr_osevoe_sechenie",lambda:cylinder("section","Осевое сечение цилиндра"),"Осевое сечение цилиндра ABB₁A₁"),
 ("tela_vrashcheniya","konus",lambda:cone(title="Конус"),"Конус"),
 ("tela_vrashcheniya","konus_visota_obrazuyushchaya",lambda:cone("axis",title="Конус с высотой и образующей"),"Конус: высота h, образующая l"),
 ("tela_vrashcheniya","konus_osevoe_sechenie",lambda:cone("section",title="Осевое сечение конуса"),"Осевое сечение конуса SAB"),
 ("tela_vrashcheniya","konus_usechennyi",lambda:cone(truncated=True,title="Усечённый конус"),"Усечённый конус"),
 ("tela_vrashcheniya","konus_usechennyi_os",lambda:cone("axis",truncated=True,title="Усечённый конус с осью"),"Усечённый конус с осью и радиусами"),
 ("tela_vrashcheniya","shar",lambda:sphere(title="Шар"),"Шар"),
 ("tela_vrashcheniya","shar_radius",lambda:sphere("radius","Шар с центром и радиусом"),"Шар с центром O и радиусом R"),
 ("tela_vrashcheniya","shar_sechenie",lambda:sphere("section","Сечение шара плоскостью"),"Сечение шара плоскостью"),
 ("kombinacii","shar_v_kube",lambda:sphere_in_cube("Шар, вписанный в куб"),"Шар, вписанный в куб"),
 ("kombinacii","kub_v_share",lambda:cube_in_sphere("Куб, вписанный в шар"),"Куб, вписанный в шар"),
 ("kombinacii","shar_v_cilindre",lambda:sphere_in_cylinder("Шар, вписанный в цилиндр"),"Шар, вписанный в цилиндр"),
 ("kombinacii","shar_v_konuse",lambda:sphere_in_cone("Шар, вписанный в конус"),"Шар, вписанный в конус"),
 ("kombinacii","piramida_v_konuse",lambda:pyramid_in_cone("Пирамида, вписанная в конус"),"Пирамида, вписанная в конус"),
 ("kombinacii","prizma_v_cilindre",lambda:prism_in_cylinder("Призма, вписанная в цилиндр"),"Призма, вписанная в цилиндр"),
]

if __name__=="__main__":
    import sys
    out=sys.argv[1] if len(sys.argv)>1 else "out"
    meta=[]
    for folder,name,fn,title in CATALOG:
        d=os.path.join(out,folder); os.makedirs(d,exist_ok=True)
        s=fn()
        open(os.path.join(d,name+".svg"),"w").write(render(s))
        open(os.path.join(d,name+"_outline.svg"),"w").write(render(s,outline=True))
        meta.append(dict(folder=folder,name=name,title=title))
    json.dump(meta,open(os.path.join(out,"catalog.json"),"w"),ensure_ascii=False,indent=1)
    print(len(meta),"figures")
