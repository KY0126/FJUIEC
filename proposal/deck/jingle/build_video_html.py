import json,re,math,sys
H='./hanzi-writer-data/'
V='./video/'
chars='一分鐘找到自己的歐洲'
WIN=[(0,.2),(.2,.2),(.4,.4),(.8,.2),(1.0,.2),(1.2,.2),(1.4,.2),(1.6,.2),(1.8,.2),(2.0,.4)]   # 每字寫的時間，比唱早一拍
LOGO=[(2.30,.07),(2.37,.06),(2.43,.06),(2.49,.06),(2.55,.07),(2.60,.18),(2.80,.25),(3.20,.18),(3.40,.25),(3.62,.18)]
UL='2.40s'; END='3.95s'
strokes=[];data=[]
for i,c in enumerate(chars):
    md=json.load(open(H+c+'.json'))['medians']
    L=[sum(math.dist(a,b) for a,b in zip(m,m[1:]))+40 for m in md]; w=[l**0.8 for l in L]; n=len(md)
    t,win=WIN[i]; gapf=0.12 if n>1 else 0; usable=win*(1-gapf); gap=(win*gapf/(n-1)) if n>1 else 0
    out=[]
    for k,m in enumerate(md):
        d=max(0.008,usable*w[k]/sum(w)); out.append((round(t,4),round(d,4))); strokes.append({'char':i,'t':round(t,4),'d':round(d,4),'len':L[k]}); t+=d+gap
    data.append({'md':md,'tim':out})
json.dump(strokes,open('strokes.json','w'))
s=open(V+'wide_01k.html').read()
s=re.sub(r'const HW=.*?;\n','const HW='+json.dumps(data)+';\n',s,count=1,flags=re.S)
it=iter(LOGO)
s=re.sub(r'animation-delay:[\d.]+s;animation-duration:[\d.]+s"/>(?=<path|</mask>)',lambda m:'animation-delay:%.2fs;animation-duration:%.2fs"/>'%next(it),s)
s=re.sub(r'animation:ul [\d.]+s ease-out [\d.]+s both','animation:ul .2s ease-out '+UL+' both',s)
s=re.sub(r'animation:mapIn \.6s ease-in-out [\d.]+s both','animation:mapIn .6s ease-in-out '+END+' both',s)
open(V+'wide_01m.html','w').write(s); print(len(strokes))
