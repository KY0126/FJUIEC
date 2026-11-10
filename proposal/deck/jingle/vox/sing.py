import numpy as np, pyworld as pw, soundfile as sf
SR=22050; FP=5.0; fpS=1000/FP
SY=list(np.load('segs.npy',allow_pickle=True))
NOTES=[(i,0.2+0.2*i,.2,m,0) for i,m in enumerate([69,67,67,64,67,67,64,62,67,72])]
NOTES+=[(14,2.2,.2,76,1),(15,2.4,.4,72,1),(10,2.8,.2,67,0),(11,3.0,.4,72,0),(12,3.4,.2,69,0),(13,3.6,1.0,72,2)]
rng=np.random.default_rng(3)
CONS=[0,12,10,10,3,12,10,3,0,10,0,14,4,0,0,0]
def analyze(y):
    y=np.ascontiguousarray(y,dtype=np.float64)
    f0,t=pw.harvest(y,SR,f0_floor=80,f0_ceil=500,frame_period=FP)
    sp=pw.cheaptrick(y,f0,t,SR); ap=pw.d4c(y,f0,t,SR); return f0,sp,ap
TONE=0.4
def render(detune=0.0,shift=0.0,only=None):
    NF=int(4.6*fpS)+1; FFT=None
    A=[analyze(y) for y in SY]; FFT=A[0][1].shape[1]
    SP=np.full((NF,FFT),1e-12); AP=np.ones((NF,FFT)); F0=np.zeros(NF); TGT=np.zeros(NF); RES=np.zeros(NF); VIB=np.zeros(NF); HEAD=np.zeros(NF)
    for idx,t0,d,m,kind in NOTES:
        if only is not None and idx not in only: continue
        f0,sp,ap=A[idx]
        en=np.log(sp.sum(1)+1e-20); ok=np.where(en>en.max()-9)[0]; b0,b1=ok[0],ok[-1]
        v0=b0+CONS[idx]; v1=b1
        cons=list(range(b0,v0)); vv=f0[v0:v1+1]; med=np.median(vv[vv>0]) if (vv>0).any() else 1
        vow=np.arange(v0,v1+1)
        # vowel energy normalise
        e=np.mean(sp[vow]); sp=sp/e*1e-3
        s=int(round((t0+shift)*fpS)); n=int(round(d*fpS))
        nc=len(cons); s_c=max(0,s-int(nc*0.5)); 
        for k,c in enumerate(cons):
            if s_c+k<NF: SP[s_c+k]=sp[c]; AP[s_c+k]=ap[c]
        vs=s_c+nc; nv=s+n-vs
        if kind==2: nv-=0
        src=np.interp(np.linspace(0,1,nv),np.linspace(0,1,len(vow)),vow)
        # keep the vowel onset natural: first 40% mapped linearly over first 25% of note
        for k in range(nv):
            fi=src[k]; a=int(fi); b=min(a+1,v1); w=fi-a
            if vs+k>=NF: break
            SP[vs+k]=np.exp((1-w)*np.log(sp[a])+w*np.log(sp[b])); AP[vs+k]=(1-w)*ap[a]+w*ap[b]
            fo=f0[min(int(round(fi)),v1)]; RES[vs+k]=(12*np.log2(fo/med) if fo>0 else 0)
            TGT[vs+k]=m; F0[vs+k]=1
            if d>=0.4 and k>0.15*fpS: VIB[vs+k]=1
            if kind==1: HEAD[vs+k]=1
        # 遊: slide A4->C5 in first 0.12 s, release fade over last 0.45 s
        if False:   # 信：四聲，尾巴往下掉
            g=int(nv*.4); TGT[vs+nv-g:vs+nv]=72-np.linspace(0,3.5,g)**1.3
        if False:   # 永：三聲，先往下壓
            g=int(nv*.6); TGT[vs:vs+g]=67-1.5*np.sin(np.linspace(0,np.pi,g))
        if kind==2:
            g=int(.12*fpS); TGT[vs:vs+g]=np.linspace(69,72,g)
            fade=int(.45*fpS); en=min(s+n,NF); SP[en-fade:en]*=np.linspace(1,0,fade)[:,None]**2
        # leave 1 frame breath gap between notes
    # portamento: smooth target over voiced runs
    T=TGT+TONE*np.clip(RES,-6,6); k=5
    for i in range(len(T)):
        if F0[i]:
            w=[T[j] for j in range(max(0,i-k),min(len(T),i+k+1)) if F0[j]]; T[i]=np.mean(w)
    t=np.arange(NF)/fpS
    walk=np.cumsum(rng.normal(0,.6,NF)); walk=(walk-np.convolve(walk,np.ones(40)/40,'same'))*0.03
    cents=(T*100+VIB*25*np.sin(2*np.pi*5.5*t)+walk+detune)
    f0=np.where(F0>0,440*2**((cents/100-69)/12),0.0)
    AP=np.where(HEAD[:,None]>0,AP**0.6,AP)
    SP=np.maximum(SP,1e-12); y=pw.synthesize(f0,SP,AP,SR,FP); y=np.nan_to_num(y)
    return y
lead=render()
dbl=render(detune=9,shift=0.012,only=[10,11,12,13])
y=lead.copy(); y[:len(dbl)]+=0.55*dbl[:len(y)]
# 咿呦 quieter
tt=np.arange(len(y))/SR; y[(tt>=2.15)&(tt<2.8)]*=0.72
y/=np.max(np.abs(y))*1.05
sf.write('vocal_22k.wav',y,SR); print(len(y)/SR)
