import numpy as np, pyworld as pw, soundfile as sf, sys
SR=24000; FP=5.0; fpS=1000/FP
SY=list(np.load('segs_m.npy',allow_pickle=True))
# (syllable, start, dur, midi)  F 大調、男聲
NOTES=[(0,.2,.2,62),(1,.4,.2,60),(2,.6,.4,60),(3,1.0,.2,57),(4,1.2,.2,60),(5,1.4,.2,60),(6,1.6,.2,57),(7,1.8,.2,55),(8,2.0,.2,60),(9,2.2,.4,65),
       (10,2.6,.2,60),(11,2.8,.3,65),(12,3.2,.2,62),(13,3.4,.4,65)]
CONS=[0,12,10,10,3,12,10,3,0,10,0,14,4,0]
TONE=0.4; rng=np.random.default_rng(3)
def analyze(y):
    y=np.ascontiguousarray(y,dtype=np.float64)
    f0,t=pw.harvest(y,SR,f0_floor=70,f0_ceil=400,frame_period=FP); return f0,pw.cheaptrick(y,f0,t,SR),pw.d4c(y,f0,t,SR)
A=[analyze(y) for y in SY]
def render(detune=0.0,shift=0.0,only=None):
    NF=int(4.6*fpS)+1; FFT=A[0][1].shape[1]
    SP=np.full((NF,FFT),1e-12); AP=np.ones((NF,FFT)); V=np.zeros(NF); TGT=np.zeros(NF); RES=np.zeros(NF); VIB=np.zeros(NF)
    for idx,t0,d,m in NOTES:
        if only is not None and idx not in only: continue
        f0,sp,ap=A[idx]
        en=np.log(sp.sum(1)+1e-20); ok=np.where(en>en.max()-9)[0]; b0,b1=ok[0],ok[-1]
        v0=min(b0+CONS[idx],b1-5); vow=np.arange(v0,b1+1); cons=list(range(b0,v0))
        vv=f0[v0:b1+1]; med=np.median(vv[vv>0]) if (vv>0).any() else 1
        e=np.mean(sp[vow]); sp=sp/e*1e-3
        s=int(round((t0+shift)*fpS)); n=int(round(d*fpS))
        nc=len(cons); s_c=max(0,s-int(nc*0.6))
        for k,c in enumerate(cons): SP[s_c+k]=sp[c]; AP[s_c+k]=ap[c]
        vs=s_c+nc; nv=s+n-vs-1          # 1 frame gap = 分句
        src=np.interp(np.linspace(0,1,nv),np.linspace(0,1,len(vow)),vow)
        for k in range(nv):
            fi=src[k]; a=int(fi); b=min(a+1,b1); w=fi-a; i=vs+k
            if i>=NF: break
            SP[i]=np.exp((1-w)*np.log(sp[a])+w*np.log(sp[b])); AP[i]=(1-w)*ap[a]+w*ap[b]
            fo=f0[min(int(round(fi)),b1)]; RES[i]=12*np.log2(fo/med) if fo>0 else 0
            TGT[i]=m; V[i]=1
            if d>=0.4 and k>0.18*fpS: VIB[i]=1
        # 收尾：每個字最後 15 ms 收乾淨；遊 用 10 ms 俐落切掉
        r=3 if idx!=13 else 2; end=min(vs+nv,NF); SP[end-r:end]*=np.linspace(1,.02,r)[:,None]
    T=TGT+TONE*np.clip(RES,-5,5)
    for i in range(len(T)):
        if V[i]:
            w=[T[j] for j in range(max(0,i-4),min(len(T),i+5)) if V[j]]; T[i]=np.mean(w)
    t=np.arange(NF)/fpS
    walk=np.cumsum(rng.normal(0,.6,NF)); walk=(walk-np.convolve(walk,np.ones(40)/40,'same'))*0.03
    cents=T*100+VIB*18*np.sin(2*np.pi*5.2*t)+walk+detune
    f0=np.where(V>0,440*2**((cents/100-69)/12),0.0)
    SP=np.maximum(SP,1e-12); return np.nan_to_num(pw.synthesize(f0,SP,AP,SR,FP))
lead=render()
dbl=render(detune=8,shift=0.010,only=[10,11,12,13])
y=lead.copy(); n=min(len(y),len(dbl)); y[:n]+=0.5*dbl[:n]
y/=np.max(np.abs(y))*1.05
sf.write('vocal_m.wav',y,SR); print('ok',len(y)/SR)
