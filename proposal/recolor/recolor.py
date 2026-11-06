import numpy as np, sys
from PIL import Image, ImageDraw
PAPER=np.array([0xFB,0xF7,0xEF],float); INK=np.array([0x2B,0x2B,0x33],float)
FAM={ # hue center (deg) -> target color
 'blue':(212,(0x2F,0x4C,0x6E)),'orange':(18,(0xC9,0x82,0x2E)),'red':(2,(0xA3,0x47,0x3C)),
 'green':(140,(0x4E,0x7A,0x3E)),'teal':(180,(0x3F,0x7A,0x8C)),'purple':(285,(0x8A,0x73,0x98)),
 'yellow':(45,(0xC9,0x9A,0x2E)),'pink':(330,(0xA8,0x5A,0x76))}
def recolor(src,dst,pad=8,frame=(0xEF,0xE7,0xD8),border=(0xE2,0xD7,0xC2)):
    im0=Image.open(src).convert('RGB'); s0=im0.width/760
    arr=np.asarray(im0).astype(int); nz=np.where((255-arr).max(2)>10)
    y0,y1,x0,x1=nz[0].min(),nz[0].max(),nz[1].min(),nz[1].max(); m=int(14*s0)
    im0=im0.crop((max(x0-m,0),max(y0-m,0),min(x1+m,im0.width),min(y1+m,im0.height)))
    a=np.asarray(im0).astype(float)
    mx=a.max(2); mn=a.min(2); ch=mx-mn
    out=np.empty_like(a)
    # gray family: map by luminance
    L=a.mean(2); t=np.clip((255-L)/(255-11),0,1)[...,None]
    out[:]=PAPER*(1-t)+INK*t
    col=ch>22
    # hue
    r,g,b=a[...,0],a[...,1],a[...,2]
    with np.errstate(invalid='ignore',divide='ignore'):
        h=np.where(mx==r,((g-b)/ch)%6,np.where(mx==g,(b-r)/ch+2,(r-g)/ch+4))*60
    h=np.nan_to_num(h)
    names=list(FAM); centers=np.array([FAM[n][0] for n in names])
    d=np.abs(((h[...,None]-centers)+180)%360-180); idx=d.argmin(-1)
    tgt=np.array([FAM[n][1] for n in names],float)[idx]
    # mix amount relative to white: use max channel distance from white normalised by pure colour's distance
    dist=(255-mn)  # how far from white the most-saturated channel is
    # estimate full-colour distance for this hue family: use max over image of dist per family as reference
    amt=np.zeros_like(L)
    for k,n in enumerate(names):
        m=col&(idx==k)
        if not m.any(): continue
        ref=np.percentile(dist[m],97) if m.sum()>50 else dist[m].max()
        amt[m]=np.clip(dist[m]/max(ref,1),0,1)
    am=amt[...,None]
    colored=PAPER*(1-am)+tgt*am
    out=np.where(col[...,None],colored,out)
    im=Image.fromarray(np.clip(out,0,255).astype('uint8'))
    W,H=im.size; s=s0
    P=int(pad*s); R=int(12*s)
    canvas=Image.new('RGB',(W+2*P,H+2*P),frame)
    mask=Image.new('L',(W,H),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,W-1,H-1],R,fill=255)
    canvas.paste(im,(P,P),mask)
    ImageDraw.Draw(canvas).rounded_rectangle([P,P,P+W-1,P+H-1],R,outline=border,width=max(2,int(1.5*s)))
    canvas.save(dst)
if __name__=='__main__':
    recolor(sys.argv[1],sys.argv[2])
