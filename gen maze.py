COLS, ROWS = 54, 44
# rectangles in fine cells (c0,c1,r0,r1) inclusive, taken from the pixel scan of the original
RECTS = [
 (0,23,0,3),(30,53,0,3),          # top wall, gap = Выход D
 (0,3,10,13),(0,3,20,43),         # left wall: gap rows 4-9 = Выход B, gap rows 14-19 = Вход
 (50,53,10,43),                   # right wall: gap rows 4-9 = Выход A
 (0,43,40,43),                    # bottom wall, gap cols 44-49 = Выход C
 (20,23,4,13),                    # vertical from top
 (10,13,10,23),                   # vertical left-inner
 (30,51,10,13),                   # long horizontal right
 (10,33,20,23),(40,51,20,23),     # second row
 (30,33,20,29),                   # short vertical
 (10,43,30,33),                   # third row
 (40,43,30,41),                   # vertical to bottom
]
def cells():
    w=set()
    for c0,c1,r0,r1 in RECTS:
        for c in range(c0,c1+1):
            for r in range(r0,r1+1): w.add((c,r))
    return w

def boundary_loops(w):
    # directed edges around each cell (clockwise), interior edges cancel
    edges={}
    for (c,r) in w:
        for a,b in (((c,r),(c+1,r)),((c+1,r),(c+1,r+1)),((c+1,r+1),(c,r+1)),((c,r+1),(c,r))):
            if (b,a) in edges: del edges[(b,a)]
            else: edges[(a,b)]=True
    nxt={}
    for a,b in edges: nxt.setdefault(a,[]).append(b)
    loops=[]
    used=set()
    for e in list(edges):
        if e in used: continue
        a,b=e; loop=[a]; used.add(e); cur=b; prev=a
        while cur!=loop[0]:
            loop.append(cur)
            cands=nxt[cur]
            # prefer turning consistently: pick candidate not already used
            for n in cands:
                if (cur,n) not in used:
                    used.add((cur,n)); prev,cur=cur,n; break
        loops.append(loop)
    return loops

def simplify(loop):
    out=[]
    n=len(loop)
    for i in range(n):
        p,q,r=loop[i-1],loop[i],loop[(i+1)%n]
        if (q[0]-p[0],q[1]-p[1])!=(r[0]-q[0],r[1]-q[1]): out.append(q)
    return out

U=12; OX=130; OY=80
def P(c,r): return (OX+c*U, OY+r*U)

def path_d(loops):
    d=[]
    for lp in loops:
        pts=[P(*v) for v in simplify(lp)]
        d.append('M'+' L'.join(f'{x},{y}' for x,y in pts)+' Z')
    return ' '.join(d)

w=cells(); loops=boundary_loops(w); D=path_d(loops)
W=OX*2+COLS*U; Hh=OY*2+ROWS*U

import random; random.seed(7)
parts=[]
for _ in range(60):
    x=random.uniform(OX-30,OX+COLS*U+30); y=random.uniform(OY-30,OY+ROWS*U+30)
    if random.random()<0.5:
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1.2,3.2):.1f}" fill="#ffb14a" opacity="{random.uniform(.4,.9):.2f}" filter="url(#soft)"/>')
    else:
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{random.uniform(1,2.5):.1f}" fill="#bfe0ff" opacity="{random.uniform(.5,1):.2f}" filter="url(#soft)"/>')

# sparkle stars at some corners
sparks=[]
for (c,r) in [(0,0),(53,0),(24,0),(30,0),(20,13),(0,43),(43,43),(50,43),(30,29),(40,30),(10,23),(50,10)]:
    x,y=P(c,r); sparks.append(f'<use href="#star" x="{x}" y="{y}"/>')

# entrance spider
sx,sy=P(2,17); sx+=0; sy+=0
legs=''.join(f'<path d="M0,0 q{dx*0.5:.1f},{dy*0.5-4:.1f} {dx},{dy}" />' for dx,dy in
             [(-14,-9),(-15,-2),(-14,6),(-11,12),(14,-9),(15,-2),(14,6),(11,12)])

labels=[('Вход',P(-1.2,17),'end'),('Выход B',P(-1.2,7),'end'),('Выход D',P(27,-2.2),'middle'),('Выход A',P(55.2,7),'start'),('Выход C',P(47,46.6),'middle')]
def L(t):
    if ' ' in t:
        w,l=t.rsplit(' ',1)
        return f'{w} <tspan font-family="Latin Modern Roman, Cambria Math, Times New Roman, serif" font-style="italic" font-weight="400" font-size="26">{l}</tspan>'
    return t
lab=''.join(f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="{a}" dominant-baseline="middle">{L(t)}</text>' for t,(x,y),a in labels)

svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {Hh}" width="{W}" height="{Hh}" font-family="Inter, Segoe UI, Arial, Helvetica, sans-serif">
<defs>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#7fb4f4"/>
    <stop offset="0.3" stop-color="#4a8ceb"/>
    <stop offset="0.55" stop-color="#2f6fd8"/>
    <stop offset="0.8" stop-color="#2358bd"/>
    <stop offset="1" stop-color="#4d8fe8"/>
  </linearGradient>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="#ffffff" stop-opacity="0.22"/>
    <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    <stop offset="1" stop-color="#ffffff" stop-opacity="0.15"/>
  </linearGradient>
  <radialGradient id="warm" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#ffb347" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#ff8c1a" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation="3.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="bigglow" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
  <filter id="soft"><feGaussianBlur stdDeviation="0.8"/></filter>
  <filter id="inner" x="-10%" y="-10%" width="120%" height="120%">
    <feGaussianBlur stdDeviation="6"/>
  </filter>
  <clipPath id="clipwall"><path d="{D}" clip-rule="evenodd"/></clipPath>
  <symbol id="star" overflow="visible">
    <g fill="#fff3d6" filter="url(#glow)">
      <path d="M0,-11 L2,-2 L11,0 L2,2 L0,11 L-2,2 L-11,0 L-2,-2 Z" fill="#fff8e8"/>
      <circle r="2.2" fill="#ffd28a"/>
    </g>
  </symbol>
  <symbol id="spider" overflow="visible">
    <g stroke="#ff9a2e" stroke-width="2.2" fill="none" stroke-linecap="round" filter="url(#glow)">{legs}</g>
    <ellipse rx="7.5" ry="8.5" fill="#ff8c1a" filter="url(#glow)"/>
    <ellipse cx="-1" cy="-3" rx="3" ry="3.2" fill="#ffe0b0" opacity="0.8"/>
    <circle cy="-11" r="4" fill="#ff8c1a" filter="url(#glow)"/>
  </symbol>
</defs>

<!-- ambient warm glow behind the maze -->


<!-- particles -->
<g>{''.join(parts)}</g>

<!-- outer orange halo of walls -->
<path d="{D}" fill="none" stroke="#ffa53a" stroke-width="6" stroke-linejoin="round" opacity="0.45" filter="url(#bigglow)" fill-rule="evenodd"/>

<!-- glass body -->
<path d="{D}" fill="url(#glass)" fill-rule="evenodd" stroke="none"/>

<!-- inner bevel: light sheen on inside edges -->
<g clip-path="url(#clipwall)">
  <path d="{D}" fill="none" stroke="#123c8f" stroke-width="10" opacity="0.35" filter="url(#inner)" fill-rule="evenodd" transform="translate(3,3)"/>
  <ellipse cx="{OX+COLS*U*0.3:.0f}" cy="{OY+ROWS*U*0.25:.0f}" rx="{COLS*U*0.35:.0f}" ry="{ROWS*U*0.3:.0f}" fill="#ffffff" opacity="0.10" filter="url(#bigglow)"/>
  <ellipse cx="{OX+COLS*U*0.75:.0f}" cy="{OY+ROWS*U*0.8:.0f}" rx="{COLS*U*0.25:.0f}" ry="{ROWS*U*0.25:.0f}" fill="#ffc37a" opacity="0.14" filter="url(#bigglow)"/>
  <path d="{D}" fill="none" stroke="#ffffff" stroke-width="9" opacity="0.16" filter="url(#inner)" fill-rule="evenodd"/>
  <path d="{D}" fill="url(#sheen)" fill-rule="evenodd"/>
  <path d="{D}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.5" stroke-linejoin="round" fill-rule="evenodd"
        style="stroke-dasharray:0" transform="translate(1.2,1.2)"/>
</g>

<!-- warm rim light -->
<path d="{D}" fill="none" stroke="#ffb347" stroke-width="2.4" stroke-linejoin="round" filter="url(#glow)" fill-rule="evenodd"/>
<path d="{D}" fill="none" stroke="#fff1d6" stroke-width="0.8" stroke-linejoin="round" opacity="0.9" fill-rule="evenodd"/>

<!-- sparkles -->
<g>{''.join(sparks)}</g>

<!-- spider at the entrance -->
<use href="#spider" x="{sx:.0f}" y="{sy:.0f}"/>

<!-- labels -->
<g font-size="22" font-weight="500" fill="#000000">{lab}</g>
</svg>'''
open('/home/claude/labirint_glass.svg','w').write(svg)
print(W,Hh,len(loops))
