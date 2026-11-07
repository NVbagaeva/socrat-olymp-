"""Независимая проверка ответов прототипов шпаргалки (задания 1-3).
Каждый ответ считается построением в координатах, а не той формулой,
что стоит в решении. Запуск: python3 proverka.py"""
import math, itertools
import numpy as np
R=math.radians; D=math.degrees
def ang(P,V,Q):
    a=np.array(P)-np.array(V); b=np.array(Q)-np.array(V)
    return D(math.acos(np.dot(a,b)/np.linalg.norm(a)/np.linalg.norm(b)))
def foot(P,A,B):
    P,A,B=map(np.array,(P,A,B)); d=B-A; return A+d*np.dot(P-A,d)/np.dot(d,d)
def inter(P1,P2,Q1,Q2):
    P1,P2,Q1,Q2=map(np.array,(P1,P2,Q1,Q2)); M=np.array([P2-P1,Q1-Q2]).T
    t=np.linalg.solve(M,Q1-P1); return P1+t[0]*(P2-P1)
res={}
# 1.1 острые 72 и 18, угол между высотой и медианой из C
A=(0,0); B=(10,0); C=(10*math.cos(R(72))**2, 10*math.cos(R(72))*math.sin(R(72)))
assert abs(ang(A,C,B)-90)<1e-9 and abs(ang(C,A,B)-72)<1e-9
res['1.1']=ang(foot(C,A,B),C,((A[0]+B[0])/2,0))
# 1.2 A=52, B,C острые; высоты BD, CE, O; угол DOE
A=np.array((0,0)); C=np.array((5,0)); Bang=70  # любое: B, C острые
c=5*math.sin(R(180-52-Bang))/math.sin(R(Bang)); B=np.array((c*math.cos(R(52)),c*math.sin(R(52))))
Dp=foot(B,A,C); E=foot(C,A,B); O=inter(B,Dp,C,E); res['1.2']=ang(Dp,O,E)
# 1.3 AC=BC, AB=10, высота AH, BH=4 -> cos BAC
# подбираем вершину C на серединном перпендикуляре так, чтобы BH=4
def bh(h):
    A=np.array((0,0)); B=np.array((10,0)); C=np.array((5,h)); H=foot(A,B,C); return np.linalg.norm(H-B)
lo,hi=0.1,100
for _ in range(200):
    m=(lo+hi)/2
    (lo,hi)=(m,hi) if bh(m)>4 else (lo,m)  # BH убывает с ростом высоты
h=(lo+hi)/2; A=(0,0); B=(10,0); C=(5,h); assert abs(bh(h)-4)<1e-9; H=foot(A,B,C); assert np.dot(H-np.array(B),np.array(C)-np.array(B))>0; res['1.3']=math.cos(R(ang(B,A,C)))
# 1.4 угол ACO=24, CA касательная, CO пересекает окружность в B, D; дуга AD внутри угла
r=1; O=np.array((0,0)); Cc=np.array((-r/math.sin(R(24)),0))
# точка касания: угол OAC = 90
tA=math.acos(r/np.linalg.norm(Cc))  # угол AOC
Ap=np.array((-math.cos(tA), math.sin(tA)))*r; Dd=np.array((r,0))
assert abs(ang(Cc,Ap,O)-90)<1e-9 and abs(ang(O,Cc,Ap)-24)<1e-9
res['1.4']=ang(Ap,O,Dd)
# 1.5 прямоугольная трапеция около окружности, P=52, большая боковая 15 -> r
# строим: высота h=2r, боковые h и 15, основания b1>b2, b1-b2=sqrt(225-h^2), b1+b2=h+15 (Пито), P=2(h+15)
h=52/2-15; r=h/2; d=math.sqrt(225-h*h); b1=(h+15+d)/2; b2=(h+15-d)/2
# проверка касания: окружность центр (r,r) радиус r касается наклонной стороны
P1=np.array((b1,0)); P2=np.array((b2,h)); ctr=np.array((r,r))
w=P2-P1; u=ctr-P1; dist=abs(w[0]*u[1]-w[1]*u[0])/np.linalg.norm(w)
assert abs(dist-r)<1e-9 and abs(b1+b2+h+15-52)<1e-9; res['1.5']=r
# 1.6 AB=5√3, C=120 -> R
Rr=1.0; A=(Rr*math.cos(R(210)),Rr*math.sin(R(210))); B=(Rr*math.cos(R(330)),Rr*math.sin(R(330))); C=(0,-Rr)
assert abs(ang(A,C,B)-120)<1e-9; k=5*math.sqrt(3)/math.dist(A,B); res['1.6']=Rr*k
# 2.1 по рисунку: a (5,5)->(9,7), b (10,4)->(8,1), c (1,1)->(4,5)
v=lambda s,e: np.array(e)-np.array(s)
a=v((5,5),(9,7)); b=v((10,4),(8,1)); c=v((1,1),(4,5)); res['2.1']=np.linalg.norm(0.5*a+1.5*b-c)
# 2.2 a (1,1)->(6,3), b (3,7)->(9,5)
a=v((1,1),(6,3)); b=v((3,7),(9,5)); res['2.2']=float(a@b)
# 2.3 a (1,5)->(5,4), b (9,1)->(7,4), c (1,1)->(4,3)
a=v((1,5),(5,4)); b=v((9,1),(7,4)); c=v((1,1),(4,3)); res['2.3']=float((a-b)@c)
# 2.4 a (4,1)->(1,5), b (6,1)->(9,5)
a=v((4,1),(1,5)); b=v((6,1),(9,5)); res['2.4']=float(a@b/np.linalg.norm(a)/np.linalg.norm(b))
# объём выпуклой оболочки по точкам (через триангуляцию тетраэдрами из ConvexHull)
def tet(a,b,c,d):
    a,b,c,d=map(np.array,(a,b,c,d)); return abs(np.linalg.det(np.array([b-a,c-a,d-a])))/6
# 3.1 AB=8, BC=6, BB1=5, многогранник A,B,C,B1
A,B,C,B1=(0,0,0),(8,0,0),(8,6,0),(8,0,5); res['3.1']=tet(A,B,C,B1)
# 3.2 боковая поверхность отсечённой призмы (наклонная призма, произвольный треугольник)
rng=np.random.default_rng(1)
P=rng.normal(size=(3,3)); P[:,2]=0; e=np.array((0.7,0.4,3.0))
def lat(tri):
    s=0
    for i in range(3):
        p,q=tri[i],tri[(i+1)%3]; s+=np.linalg.norm(np.cross(q-p,e))
    return s
big=lat(P); M=(P[0]+P[2])/2; N=(P[1]+P[2])/2; small=lat([M,N,P[2]]); res['3.2']=46*small/big
# 3.3 правильная SABCD, V=84, E середина SB -> V(EABC)
a=2.0; hh=3.0; A,B,C,Dd=(0,0,0),(a,0,0),(a,a,0),(0,a,0); S=(a/2,a/2,hh); E=tuple((np.array(S)+np.array(B))/2)
res['3.3']=84*tet(E,A,B,C)/(tet(S,A,B,C)+tet(S,A,C,Dd))
# 3.4 конус вершиной вниз, жидкость до 1/3 высоты, V=5 -> долить
cone=lambda Rr,h: math.pi*Rr*Rr*h/3
Rr,h=2.0,6.0; res['3.4']=5*cone(Rr,h)/cone(Rr/3,h/3)-5
# 3.5 полная поверхность отсечённого конуса, 2:3 от вершины, S=50
full=lambda Rr,h: math.pi*Rr*(Rr+math.hypot(Rr,h))
Rr,h=3.0,7.0; k=2/5; res['3.5']=50*full(Rr*k,h*k)/full(Rr,h)
# 3.6 сфера около конуса, центр = центр основания, l=17√2 -> R
# вершина и окружность основания на сфере радиуса R, центр в центре основания: h=R, r=R
l=17*math.sqrt(2); res['3.6']=l/math.sqrt(2)
otv={'1.1':54,'1.2':128,'1.3':0.4,'1.4':114,'1.5':5.5,'1.6':5,'2.1':8.5,'2.2':26,'2.3':10,'2.4':0.28,
     '3.1':40,'3.2':23,'3.3':21,'3.4':130,'3.5':8,'3.6':17}
ok=True
for k_,x in res.items():
    good=abs(x-otv[k_])<1e-6
    # ответ ЕГЭ: целое или конечная десятичная дробь
    s=f"{otv[k_]:.10g}"; fin=len(s.split('.')[-1])<=4 if '.' in s else True
    ok&=good and fin
    print(f"{k_}: расчёт {x:.9f}  в шпаргалке {otv[k_]}  {'OK' if good else 'ОШИБКА'}")
# проверка исходных задач базы (числа из базы)
base={'1.1 (№29)':abs(90-2*84),'1.2 (№37)':180-44,'1.3 (№121)':2/8,'1.4 (№159)':90+28,'1.5 (№179)':(40/2-11)/2,
      '1.6 (№211)':3*math.sqrt(2)/(2*math.sin(R(135)))}
for k_,x in base.items(): print('база',k_,round(x,9))
print('ВСЁ ВЕРНО' if ok else 'ЕСТЬ ОШИБКИ')

# ---- формулы теории: случайные фигуры, точность 1e-9 ----
rng=np.random.default_rng(7); bad=[]
def chk(name, cond):
    if not cond: bad.append(name)
for _ in range(300):
    A,B,C=[rng.uniform(-5,5,2) for _ in range(3)]
    a=np.linalg.norm(B-C); b=np.linalg.norm(A-C); c=np.linalg.norm(A-B)
    if min(a,b,c)<0.3: continue
    al,be,ga=ang(B,A,C),ang(A,B,C),ang(A,C,B)
    S=abs((B-A)[0]*(C-A)[1]-(B-A)[1]*(C-A)[0])/2
    if S<0.5: continue
    p=(a+b+c)/2; Rr=a*b*c/(4*S)
    chk('сумма углов', abs(al+be+ga-180)<1e-7)
    chk('Герон', abs(S-math.sqrt(p*(p-a)*(p-b)*(p-c)))<1e-7)
    chk('S=½ab sinγ', abs(S-0.5*a*b*math.sin(R(ga)))<1e-7)
    chk('теорема синусов', abs(a/math.sin(R(al))-2*Rr)<1e-6)
    chk('теорема косинусов', abs(c*c-(a*a+b*b-2*a*b*math.cos(R(ga))))<1e-6)
    M=(A+C)/2; Gc=(A+B+C)/3; chk('медианы 2:1', abs(np.linalg.norm(B-Gc)/np.linalg.norm(Gc-M)-2)<1e-7)
    L=A+(C-A)*c/(c+a); chk('биссектриса', abs(ang(A,B,L)-ang(L,B,C))<1e-6)
    if max(al,be,ga)<89:  # остроугольный: угол между высотами
        Dp=foot(B,A,C); E=foot(C,A,B); O=inter(B,Dp,C,E); chk('∠DOE=180−A', abs(ang(Dp,O,E)-(180-al))<1e-6)
for _ in range(300):  # прямоугольный, C = 90
    a,b=rng.uniform(0.5,5,2); C=np.array((0,0)); A=np.array((b,0)); B=np.array((0,a)); c=math.hypot(a,b)
    M=(A+B)/2; H=foot(C,A,B)
    chk('∠ACM=∠A', abs(ang(A,C,M)-ang(C,A,B))<1e-7); chk('∠ACH=∠B', abs(ang(A,C,H)-ang(C,B,A))<1e-7)
    chk('h=ab/c', abs(np.linalg.norm(H-C)-a*b/c)<1e-9); chk('r=(a+b−c)/2', abs(a*b/(a+b+c)-(a+b-c)/2)<1e-9)
for _ in range(300):  # параллелограмм, четырёхугольник
    P,Q,T=[rng.uniform(-5,5,2) for _ in range(3)]; Rq=Q+T-P
    a=np.linalg.norm(T-P); b=np.linalg.norm(Q-P); d1=np.linalg.norm(Rq-P); d2=np.linalg.norm(Q-T)
    chk('d1²+d2²=2(a²+b²)', abs(d1*d1+d2*d2-2*(a*a+b*b))<1e-7)
# вписанный угол = половине центрального; касательная–хорда
for _ in range(300):
    t1,t2,t3=sorted(rng.uniform(0,360,3)); pt=lambda t: np.array((math.cos(R(t)),math.sin(R(t))))
    A,B,C=pt(t1),pt(t2),pt(t3); arcAB=t2-t1  # дуга AB, не содержащая C
    chk('вписанный', abs(ang(A,C,B)-arcAB/2)<1e-6)
    tang=np.array((-A[1],A[0]))  # касательная в A (направление к B по дуге)
    chk('касательная–хорда', abs(ang(A+tang,A,B)-arcAB/2)<1e-6)
# стереометрия: тетраэдр ABCB1, призма через среднюю линию, конус в шаре
for _ in range(100):
    a,b,c=rng.uniform(1,9,3)
    chk('V_ABCB1=abc/6', abs(tet((0,0,0),(a,0,0),(a,b,0),(a,0,c))-a*b*c/6)<1e-9)
    P=rng.normal(size=(3,3)); P[:,2]=0; e=rng.normal(size=3); e[2]=abs(e[2])+1
    def lat(tri):
        return sum(np.linalg.norm(np.cross(tri[(i+1)%3]-tri[i],e)) for i in range(3))
    M=(P[0]+P[2])/2; N=(P[1]+P[2])/2; chk('S_бок×½', abs(lat([M,N,P[2]])/lat(P)-0.5)<1e-9)
    Rr=rng.uniform(1,5); chk('l=R√2', abs(math.hypot(Rr,Rr)-Rr*math.sqrt(2))<1e-12)
print('Формулы теории:', 'все верны' if not bad else 'ОШИБКИ: '+', '.join(sorted(set(bad))))

# ---- добавленные формулы (вторая редакция теории) ----
bad2=[]
exp={  # таблица со с. 20: sin, cos, tg, ctg
 30:(0.5, math.sqrt(3)/2, math.sqrt(3)/3, math.sqrt(3)),
 45:(math.sqrt(2)/2, math.sqrt(2)/2, 1, 1),
 60:(math.sqrt(3)/2, 0.5, math.sqrt(3), math.sqrt(3)/3),
 90:(1, 0, None, 0),
 120:(math.sqrt(3)/2, -0.5, -math.sqrt(3), -math.sqrt(3)/3),
 135:(math.sqrt(2)/2, -math.sqrt(2)/2, -1, -1),
 150:(0.5, -math.sqrt(3)/2, -math.sqrt(3)/3, -math.sqrt(3))}
for x,(sn,cs,tg,ctg) in exp.items():
    t=math.radians(x)
    if abs(math.sin(t)-sn)>1e-12 or abs(math.cos(t)-cs)>1e-12: bad2.append(f'таблица {x}')
    if tg is not None and abs(math.tan(t)-tg)>1e-9: bad2.append(f'tg {x}')
    if abs(math.cos(t)/math.sin(t)-ctg)>1e-9: bad2.append(f'ctg {x}')
for _ in range(300):
    a,b=rng.uniform(0.5,5,2); C=np.array((0,0)); A=np.array((b,0)); B=np.array((0,a)); H=foot(C,A,B)
    if abs(np.linalg.norm(H-C)**2-np.linalg.norm(A-H)*np.linalg.norm(H-B))>1e-9: bad2.append('h²=AH·HB')
    al=ang(C,A,B); be=ang(A,B,C)
    if abs(al+be-90)>1e-9: bad2.append('сумма острых')
    # ctg A = прилежащий / противолежащий
    if abs(1/math.tan(math.radians(al))-b/a)>1e-9: bad2.append('ctg')
for _ in range(300):  # биссектрисы параллелограмма
    A=np.array((0.,0.)); u=rng.uniform(0.3,3); Dq=np.array((rng.uniform(1,5),0.)); B=np.array((rng.uniform(-2,2),u)); C=B+Dq
    bis=lambda V,P,Q: (P-V)/np.linalg.norm(P-V)+(Q-V)/np.linalg.norm(Q-V)
    dA=bis(A,B,Dq); dB=bis(B,A,C); dC=bis(C,B,Dq)
    if abs(dA@dB)>1e-9: bad2.append('AK⊥BL')
    if abs(dA[0]*dC[1]-dA[1]*dC[0])>1e-9: bad2.append('AK∥CN')
    # K = пересечение биссектрисы из A с прямой BC; AB = BK
    t=(B[1])/dA[1]; K=A+t*dA
    if abs(np.linalg.norm(B-A)-np.linalg.norm(K-B))>1e-9: bad2.append('AB=BK')
    # ромб: диагонали — биссектрисы
    s_=np.linalg.norm(B-A); Dr=np.array((s_,0.)); Cr=B+Dr
    if abs(ang(B,A,Cr)-ang(Cr,A,Dr))>1e-7: bad2.append('ромб')
print('Добавленные формулы:', 'все верны' if not bad2 else 'ОШИБКИ: '+', '.join(sorted(set(bad2))))
