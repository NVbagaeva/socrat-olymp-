# Радиусы дуг углов (15 % короткой стороны, 1,5–3 мм) и подписи за дугой.
# Запуск: python3 dugi_uglov.py shpargalka_1-3.tex
import re,sys,math
exec(open(__file__.replace('dugi_uglov.py','list.py')).read().split("for k,m in enumerate(pics):")[0].replace("s=open(sys.argv[1]).read()","s=open(sys.argv[1]).read()"))
MIN,MAX,K=1.5,3.0,0.15
manual={'RXQ':7.6,'DAE':13.0,'EOD':4.7}  # короткие стороны, мм (точки из пересечений)
manual_th={'RXQ':123,'DAE':52,'EOD':128}
out=[];pos=0
for m in pics:
    opt=m.group(1) or ''; body=m.group(2)
    sc=re.search(r'scale=('+num+')',opt); sc=float(sc.group(1)) if sc else 1
    c=coords(body); arcs=[]
    def repl(a):
        P,V,Q=a.group(2),a.group(3),a.group(4)
        if all(x in c for x in (P,V,Q)):
            d=lambda X,Y: math.dist(c[X],c[Y])*sc*10
            short=min(d(P,V),d(Q,V))
            a1=math.degrees(math.atan2(c[P][1]-c[V][1],c[P][0]-c[V][0])); a2=math.degrees(math.atan2(c[Q][1]-c[V][1],c[Q][0]-c[V][0]))
            th=(a2-a1)%360; bis=(a1+th/2)%360
        else:
            short=manual[P+V+Q]; th=manual_th[P+V+Q]; bis=None
        r=min(MAX,max(MIN,K*short))
        same=[x for x in arcs if x[0]==V]
        if same: r=same[-1][1]+0.5
        arcs.append((V,r,th,bis))
        opts=re.sub(r'angle radius=('+num+')mm',f'angle radius={r:.1f}mm',a.group(1))
        return f'\\pic[{opts}] {{angle={P}--{V}--{Q}}}'
    body2=re.sub(r'\\pic\[([^\]]*)\] \{angle=(\w+)--(\w+)--(\w+)\}',repl,body)
    def lab(n):
        V,dirr=n.group(1),float(n.group(2))
        cands=[x for x in arcs if x[0]==V]
        if not cands: return n.group(0)
        def dd(x): return 0 if x[3] is None else min(abs((dirr-x[3]+180)%360-180),360)
        x=min(cands,key=dd)
        if x[3] is not None and dd(x)>40: return n.group(0)
        r,th=x[1],x[2]
        Dmm=max(r+1.7,1.25/math.sin(math.radians(min(th,180)/2)))
        return f'($({V})+({n.group(2)}:{Dmm/(10*sc):.2f})$)'
    body2=re.sub(r'\(\$\((\w+)\)\+\(('+num+r'):('+num+r')\)\$\)',lab,body2)
    out.append(s[pos:m.start(2)]); out.append(body2); pos=m.end(2)
out.append(s[pos:])
open(sys.argv[1],'w').write(''.join(out))
