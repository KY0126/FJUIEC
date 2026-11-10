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
# ---------- 新版：F 大調、男聲、永信 旅遊、全體俐落收 ----------
N.update({'F3':53,'A3':57,'C4':60,'D4':62,'F4':65,'A4':69,'C5':72,'Bb3':58,'Bb2':46,'E3':52,'G3':55,'C3':48,'F2':41,'C2':36,'E4':64,'G4':67})
acc=z(); bass=z(); perc=z()
CH={'F':['A3','C4','F4'],'C7':['Bb3','C4','E4'],'C':['G3','C4','E4'],'Bb':['Bb3','D4','F4']}
RT={'F':('F2','C3'),'C7':('C3','G3'),'C':('C3','G3'),'Bb':('Bb2','F3')}
CUT=3.8
# pickup：手風琴拉開風箱（C 和弦漸強）
add(acc,sum(reed(hz(N[n]),.22,.5,a=.18,r=.03) for n in CH['C']),0.0)
br=bp(rng.standard_normal(int(.25*SR)),300,2500)*np.linspace(0,1,int(.25*SR))**2*.25; add(acc,br,0)
# 標語：波卡「蹦恰」 0.2–2.6
seq=[(0.2,'F'),(0.6,'F'),(1.0,'F'),(1.4,'C7'),(1.8,'C7'),(2.2,'F')]
for k,(t0,c) in enumerate(seq):
    add(bass,reed(hz(N[RT[c][k%2]]),.16,.9,a=.006,r=.05,musette=False),t0)
    add(acc,sum(reed(hz(N[n]),.11,.42,a=.006,r=.04) for n in CH[c]),t0+.2)
# 永信 旅遊：手風琴跟著人聲的節奏重音（不蓋過人聲）
for t0,d,c in [(2.6,.18,'C'),(2.8,.28,'F'),(3.2,.18,'Bb')]:
    add(acc,sum(reed(hz(N[n]),d,.30,a=.01,r=.03) for n in CH[c]),t0)
    add(bass,reed(hz(N[RT[c][0]]),d,.55,a=.01,r=.03,musette=False),t0)
# 遊：全體一起重拍，3.8 秒同時收（指揮收音）
d=CUT-3.4
hit=sum(reed(hz(N[x]),d,.42,a=.005,r=.012) for x in ['A3','C4','F4','A4'])+reed(hz(N['F2']),d,.9,a=.005,r=.012,musette=False)
add(acc,hit,3.4)
n=int(.25*SR); t=np.arange(n)/SR
kick=np.sin(2*np.pi*(55+80*np.exp(-30*t))*t)*np.exp(-14*t)
add(perc,kick*.9,3.4)
cut_n=int(.012*SR); sn=bp(rng.standard_normal(cut_n*6),900,6000)*np.exp(-np.arange(cut_n*6)/SR*220)  # 收音那一下的小擦音
add(perc,sn*.35,CUT-0.004)
acc=lp(acc,4500); bass=lp(bass,1800)
# 空間尾巴：極短、很小聲，聽起來是在房間裡收的，不是剪掉
def tail(x,t0,dur=.22,lvl=.12):
    seg=x[int((t0-.08)*SR):int(t0*SR)].copy(); n=int(dur*SR)
    ir=rng.standard_normal(n)*np.exp(-np.arange(n)/SR*28); y=np.convolve(seg,ir)[:len(seg)+n]
    return lp(y,3000)/np.max(np.abs(y))*np.max(np.abs(seg))*lvl
# ---------- 寫字聲：每一筆一聲，時間跟影片同一份 strokes.json ----------
import json
pen=z()
for st in json.load(open('strokes.json')):
    n=max(int(st['d']*SR),int(.012*SR)); t=np.arange(n)/SR
    nz=bp(rng.standard_normal(n+400),1800,6500)[:n]
    grain=0.6+0.4*np.abs(np.sin(2*np.pi*(30+rng.random()*25)*t+rng.random()*6))
    e=env(n,.004,min(.012,st['d']*.4))*grain*(0.7+0.3*min(1,st['len']/600))
    lvl=1.0 if st['char']==0 else 0.25
    add(pen,nz*e*lvl*.5,st['t'])
    tk=int(.006*SR); add(pen,bp(rng.standard_normal(tk+200),2500,8000)[:tk]*np.exp(-np.arange(tk)/SR*900)*lvl*.6,st['t'])
def norm(x,p): return x/np.max(np.abs(x))*p
inst=acc*0.55+bass*0.45+perc*0.5+pen*0.5
from scipy.signal import resample_poly
import soundfile as sf
vx,vsr=sf.read('vox/vocal_m.wav'); vx=resample_poly(vx,SR,vsr)[:len(inst)]; vx=np.pad(vx,(0,len(inst)-len(vx)))
vx=vx/np.sqrt(np.mean(vx**2))*np.sqrt(np.mean(inst**2))*2.6
def finish(x):
    c=int(CUT*SR); g=np.ones(len(x)); r=int(.012*SR); g[c:c+r]=np.linspace(1,0,r); g[c+r:]=0
    y=x*g; tl=tail(x,CUT); y[c:c+len(tl)]+=tl[:len(y)-c]; return y
def save(name,x):
    x=norm(x,.89); st=np.stack([x,x],1)
    w=wave.open(name,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype('<i2').tobytes()); w.close()
save('jingle_伴奏.wav',finish(inst))
save('jingle_完整版.wav',finish(inst*0.85+vx))
print('ok')
