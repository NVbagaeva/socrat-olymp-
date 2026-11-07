import re,sys,math
s=open(sys.argv[1]).read()
pics=[m for m in re.finditer(r'\\begin\{tikzpicture\}(\[[^\]]*\])?(.*?)\\end\{tikzpicture\}',s,re.S)]
num=r'-?\d*\.?\d+'
def coords(body):
    c={}
    for m in re.finditer(r'\\coordinate \((\w+)\) at \(('+num+r'),('+num+r')\)',body): c[m.group(1)]=(float(m.group(2)),float(m.group(3)))
    for m in re.finditer(r'\\coordinate \((\w+)\) at \(('+num+r'):('+num+r')\)',body):
        a,r=float(m.group(2)),float(m.group(3)); c[m.group(1)]=(r*math.cos(math.radians(a)),r*math.sin(math.radians(a)))
    for m in re.finditer(r'\(('+num+r'):('+num+r')\) coordinate \((\w+)\)',body):
        a,r=float(m.group(1)),float(m.group(2)); c[m.group(3)]=(r*math.cos(math.radians(a)),r*math.sin(math.radians(a)))
    if r'\tri' in body: c.update({'A':(0,0),'B':(1.2,2),'C':(4,0)})
    if r'\pyr' in body: c.update({'A':(0,0),'B':(2.6,0),'C':(3.4,0.7),'D':(0.8,0.7),'O':(1.7,0.35),'S':(1.7,2.5),'K':(1.3,0)})
    return c
for k,m in enumerate(pics):
    opt=m.group(1) or ''; body=m.group(2)
    sc=re.search(r'scale=('+num+')',opt); sc=float(sc.group(1)) if sc else 1
    c=coords(body)
    line=s[:m.start()].count('\n')+1
    for a in re.finditer(r'\\pic\[([^\]]*)\] \{angle=(\w+)--(\w+)--(\w+)\}',body):
        P,V,Q=a.group(2),a.group(3),a.group(4); rr=re.search(r'angle radius=('+num+')mm',a.group(1)).group(1)
        if all(x in c for x in (P,V,Q)):
            d=lambda X,Y: math.dist(c[X],c[Y])*sc*10
            short=min(d(P,V),d(Q,V))
            v1=(c[P][0]-c[V][0],c[P][1]-c[V][1]); v2=(c[Q][0]-c[V][0],c[Q][1]-c[V][1])
            th=(math.degrees(math.atan2(v2[1],v2[0])-math.atan2(v1[1],v1[0])))%360
            print(f"L{line} sc={sc} {P}{V}{Q} r={rr}mm short={short:.1f}mm 15%={0.15*short:.1f} th={th:.0f}")
        else: print(f"L{line} sc={sc} {P}{V}{Q} r={rr}mm ??")
