import numpy as np, wave, sys
SR=48000; T=4.6
def z(t=T): return np.zeros(int(SR*t))
rng=np.random.default_rng(7)
def hz(n): return 440*2**((n-69)/12)
N={'C3':48,'D3':50,'E3':52,'F3':53,'G3':55,'A3':57,'B3':59,'G2':43,'F2':41,'C4':60,'D4':62,'E4':64,'F4':65,'G4':67,'A4':69,'B4':71,'C5':72,'D5':74,'E5':76}
def lp(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*=1/np.sqrt(1+(f/fc)**4); return np.fft.irfft(X,len(x))
def bp(x,lo,hi):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); X*=((f>lo)&(f<hi)); return np.fft.irfft(X,len(x))
def env(n,a=.02,r=.06,sus=1):
    e=np.ones(n)*sus; A=int(a*SR); R=int(r*SR)
    e[:A]=np.linspace(0,sus,A) if A else e[:A]
    if R and R<n: e[-R:]*=np.linspace(1,0,R)
    return e
def reed(f,d,amp=1,a=.02,r=.06,musette=True):
    n=int(d*SR); t=np.arange(n)/SR; y=np.zeros(n)
    dets=[0,-14,13] if musette else [0]
    for c in dets:
        ff=f*2**(c/1200); ph=rng.random()*6.28
        for k in range(1,14):
            if ff*k>9000: break
            w=(1/k)*(1.25 if k%2 else .8)*(0.6 if k==1 else 1)
            y+=w*np.sin(2*np.pi*ff*k*t+ph*k)
    y/=len(dets)
    return amp*y*env(n,a,r)
def add(buf,s,t0):
    i=int(t0*SR); j=min(len(buf),i+len(s)); buf[i:j]+=s[:j-i]
# ---------- accordion ----------
acc=z(); bass=z()
CH={'C':['C4','E4','G4'],'G7':['B3','F4','G4'],'G':['B3','D4','G4'],'F':['C4','F4','A4']}
RT={'C':('C3','G2'),'G7':('G2','D3'),'G':('G2','D3'),'F':('F2','C3')}
# pickup: swell G chord
s=sum(reed(hz(N[n]),.22,.5,a=.18,r=.03) for n in CH['G']); add(acc,s,0.0)
seq=[(0.2,'C'),(0.6,'C'),(1.0,'C'),(1.4,'G7'),(1.8,'C'),(2.2,'C'),(2.6,'G')]
for k,(t0,c) in enumerate(seq):
    root=RT[c][k%2] if c!='G' else 'G2'
    add(bass,reed(hz(N[root]),.16,.9,a=.006,r=.05,musette=False),t0)
    if t0<2.6:
        st=sum(reed(hz(N[n]),.11,.42,a=.006,r=.04) for n in CH[c]); add(acc,st,t0+.2)
# sustained section 2.8–4.6: legato chords, soft
for t0,d,c in [(2.8,.2,'G'),(3.0,.4,'C'),(3.4,.2,'F')]:
    add(acc,sum(reed(hz(N[n]),d+.03,.30,a=.03,r=.03) for n in CH[c]),t0)
    add(bass,reed(hz(N[RT[c][0]]),d+.03,.45,a=.03,r=.03,musette=False),t0)
# final chord with bellows shake
n=int(1.0*SR); t=np.arange(n)/SR
fin=sum(reed(hz(N[x]),1.0,.34,a=.04,r=.55) for x in ['C4','E4','G4','C5'])+reed(hz(N['C3']),1.0,.5,a=.04,r=.55,musette=False)
shake=1-.35*(0.5+0.5*np.sin(2*np.pi*7*t))*np.clip((t-.15)/.2,0,1)
add(acc,fin*shake,3.6)
acc=lp(acc,4500); bass=lp(bass,1800)
# bellows breath at start
br=bp(rng.standard_normal(int(.25*SR)),300,2500)*np.linspace(0,1,int(.25*SR))**2*.25; add(acc,br,0)
# ---------- swiss cowbell (one hit on 咿) ----------
def cowbell(f0=620):
    n=int(1.2*SR); t=np.arange(n)/SR; y=np.zeros(n)
    for r,a,dc in [(1,1,5),(1.51,.7,7),(2.08,.5,9),(2.73,.35,12),(3.62,.2,16),(4.4,.12,20)]:
        y+=a*np.sin(2*np.pi*f0*r*t+rng.random()*6)*np.exp(-dc*t)
    y+=bp(rng.standard_normal(n),1500,7000)*np.exp(-90*t)*.6
    return y
bell=z(); add(bell,cowbell()*.55,2.2)
# ---------- pen (tagline only): char i written 0.2i..0.2i+0.2 ----------
pen=z()
for i in range(10):
    n=int(.2*SR); t=np.arange(n)/SR
    nz=bp(rng.standard_normal(n),1800,6500)
    grain=0.55+0.45*np.abs(np.sin(2*np.pi*(35+rng.random()*20)*t+rng.random()*6))
    sub=np.ones(n)
    for g in rng.choice(np.arange(3,n//400-3),2,replace=False)*400: sub[g:g+int(.012*SR)]*=.08   # pen lifts between sub-strokes
    e=env(n,.008,.03)*sub*grain
    lvl=1.0 if i==0 else 0.25   # 先大聲，開唱後壓 12 dB
    add(pen,nz*e*lvl*.5,0.2*i)
# ---------- guide melody: whistle ----------
MEL=[(0.2,.2,'A4'),(0.4,.2,'G4'),(0.6,.2,'G4'),(0.8,.2,'E4'),(1.0,.2,'G4'),(1.2,.2,'G4'),(1.4,.2,'E4'),(1.6,.2,'D4'),(1.8,.2,'G4'),(2.0,.2,'C5'),
     (2.2,.2,'E5'),(2.4,.4,'C5'),(2.8,.2,'G4'),(3.0,.4,'C5'),(3.4,.2,'A4'),(3.6,1.0,'SLIDE')]
def whistle(f_arr,amp=1,a=.015,r=.04):
    n=len(f_arr); t=np.arange(n)/SR
    vib=1+.006*np.sin(2*np.pi*5.5*t)*np.clip(t/.15,0,1)
    ph=2*np.pi*np.cumsum(f_arr*vib)/SR
    y=np.sin(ph)+.12*np.sin(2*ph)+bp(rng.standard_normal(n),f_arr.mean()*.8,f_arr.mean()*1.3)*.05
    return amp*y*env(n,a,r)
mel=z()
for t0,d,nn in MEL:
    n=int(d*SR)
    if nn=='SLIDE':
        f=np.full(n,hz(N['C5'])); k=int(.12*SR); f[:k]=np.linspace(hz(N['A4']),hz(N['C5']),k)
        y=whistle(f,1,.015,.5)
    else:
        f=np.full(n,hz(N[nn]))
        if nn=='E5': f[:int(.03*SR)]=np.linspace(hz(N['C5']),hz(N['E5']),int(.03*SR))  # 翻嗓
        y=whistle(f,1,.012,.03)
    add(mel,y*(.75 if t0 in (2.2,2.4) else 1.0),t0)   # 咿呦比品牌名小
def norm(x,p): return x/np.max(np.abs(x))*p
inst=acc*0.55+bass*0.45+bell*0.35+pen*0.5
# 品牌名那段讓伴奏再退一點
g=np.ones(len(inst)); t=np.arange(len(inst))/SR; g[(t>=2.8)]=0.8
inst*=g
def save(name,x,count_in=False):
    if count_in:
        cl=z(1.6)
        for k in range(4):
            n=int(.05*SR); tt=np.arange(n)/SR; add(cl,np.sin(2*np.pi*(1500 if k==0 else 1000)*tt)*np.exp(-60*tt)*.6,k*0.4)
        x=np.concatenate([cl,x])
    x=norm(x,.89); st=np.stack([x,x],1)
    w=wave.open(name,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
save('jingle_伴奏.wav',inst)
save('jingle_示意版.wav',inst+mel*0.42)
save('jingle_錄音導引.wav',inst+mel*0.42,count_in=True)
print('ok')
