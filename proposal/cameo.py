import os as _os
ROOT = _os.path.dirname(_os.path.abspath(__file__))
"""維多利亞剪影浮雕頭像：白兔（側身、懷錶）、愛麗絲（側臉長髮、蝴蝶結）、柴郡貓（樹枝上的笑臉、尾巴漸隱）
SIL = 剪影色；CUT = 鏤空色（等於底色），兩色互換即可做出四種材質。"""
import math, json

def rabbit(S, C):
    return f'''
<path d="M58 86 C58 74 70 62 86 60 C90 46 95 26 103 10 C107 2 116 3 115 12 C113 30 108 46 104 60
 C110 44 121 24 129 16 C135 10 142 16 137 25 C131 41 121 56 112 66 C122 74 124 88 119 99
 C134 106 145 122 147 144 C150 168 148 190 151 212 L71 212 C73 188 74 160 81 140
 C84 128 86 116 82 108 C76 106 68 103 63 98 C59 94 57 90 58 86Z" fill="{S}"/>
<path d="M98 120 C88 124 76 128 64 128" fill="none" stroke="{S}" stroke-width="12" stroke-linecap="round"/>
<path d="M53 112 C50 106 56 102 60 106" fill="none" stroke="{S}" stroke-width="3"/>
<circle cx="52" cy="127" r="15" fill="{S}"/><circle cx="52" cy="127" r="10.5" fill="{C}"/>
<path d="M52 127 L52 120 M52 127 L57 130" stroke="{S}" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="77" cy="77" r="3.6" fill="{C}"/>
<path d="M106 18 C104 32 101 44 99 54" fill="none" stroke="{C}" stroke-width="3" stroke-linecap="round"/>
<path d="M84 140 C96 150 116 150 132 140" fill="none" stroke="{C}" stroke-width="2.5"/>
<path d="M108 146 L106 206" fill="none" stroke="{C}" stroke-width="2" stroke-dasharray="1 0"/>
<circle cx="101" cy="160" r="2.8" fill="{C}"/><circle cx="101" cy="174" r="2.8" fill="{C}"/><circle cx="101" cy="188" r="2.8" fill="{C}"/>
<path d="M66 99 C70 101 74 101 77 99" fill="none" stroke="{C}" stroke-width="1.6"/>
'''

def alice(S, C):
    return f'''
<path d="M96 40 C106 40 113 45 116 52 C119 57 119 62 119 66 C120 70 122 73 127 78 C125 80 122 80 121 81
 C123 83 123 85 120 86 C122 88 122 90 120 92 C120 95 118 97 116 98 C112 101 109 102 107 104
 C106 109 106 114 108 120 C114 126 124 130 132 133 C146 140 152 160 152 212 L48 212
 C50 196 52 182 58 168 C48 156 46 140 52 126 C44 112 46 94 52 84 C54 58 74 40 96 40Z" fill="{S}"/>
<path d="M58 60 C44 46 36 60 46 66 C38 74 46 84 58 70 Z" fill="{S}"/>
<path d="M58 60 C58 46 46 42 44 52" fill="none" stroke="{C}" stroke-width="2"/><circle cx="57" cy="63" r="3" fill="{C}"/><path d="M46 66 C50 64 54 64 57 63" fill="none" stroke="{C}" stroke-width="1.6"/>
<path d="M108 66 C110 64 113 64 115 66" fill="none" stroke="{C}" stroke-width="2" stroke-linecap="round"/><path d="M80 44 C92 42 106 44 114 52" fill="none" stroke="{C}" stroke-width="2.2"/>
<path d="M108 117 C114 130 124 136 136 138" fill="none" stroke="{C}" stroke-width="2.5"/>
<path d="M110 120 C104 132 104 140 112 144 C118 140 120 134 118 128" fill="none" stroke="{C}" stroke-width="2"/>
<path d="M134 150 C126 160 126 176 132 188" fill="none" stroke="{C}" stroke-width="2"/>
<path d="M70 72 C64 90 64 110 70 126 M80 70 C74 94 76 116 82 134 M62 140 C58 156 60 170 64 182" fill="none" stroke="{C}" stroke-width="1.6" opacity=".75"/>
'''

def cat(S, C):
    dots=''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{S}"/>' for x,y,r in [(170,182,3.4),(160,190,2.8),(150,195,2.2),(141,198,1.7),(133,200,1.2)])
    return f'''
<path d="M14 166 C60 156 120 154 196 146" fill="none" stroke="{S}" stroke-width="8" stroke-linecap="round"/>
<path d="M150 150 C158 138 166 134 174 136" fill="none" stroke="{S}" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="170" cy="132" rx="8" ry="4" transform="rotate(-30 170 132)" fill="{S}"/>
<ellipse cx="34" cy="172" rx="8" ry="4" transform="rotate(20 34 172)" fill="{S}"/>
<ellipse cx="128" cy="140" rx="44" ry="17" fill="{S}"/>
<path d="M168 144 C186 152 186 172 172 180" fill="none" stroke="{S}" stroke-width="9" stroke-linecap="round"/>
{dots}
<path d="M50 98 C48 72 56 54 62 34 L84 58 C94 54 106 54 116 58 L138 34 C144 54 152 72 150 98
 C148 126 128 144 100 144 C72 144 52 126 50 98Z" fill="{S}"/>
<path d="M64 102 C78 132 122 132 136 102 C118 116 82 116 64 102Z" fill="{C}"/>
<path d="M80 114 L82 122 M90 117 L91 126 M100 118 L100 127 M110 117 L109 126 M120 114 L118 122" stroke="{S}" stroke-width="2"/>
<path d="M72 86 C78 76 90 76 94 86 C88 82 78 82 72 86Z" fill="{C}"/>
<path d="M106 86 C110 76 122 76 128 86 C122 82 112 82 106 86Z" fill="{C}"/>
<path d="M90 64 L92 74 M100 62 L100 74 M110 64 L108 74" stroke="{C}" stroke-width="3" stroke-linecap="round"/>
<path d="M96 96 L104 96 L100 100Z" fill="{C}"/>
<path d="M108 134 C116 136 128 136 136 132 M148 132 C154 136 160 136 166 134" fill="none" stroke="{C}" stroke-width="2.4" stroke-linecap="round"/>
'''

CHAR={'rabbit':rabbit,'alice':alice,'cat':cat}

# 材質：field 底、sil 剪影、ring 外框、deep 深色線、acc 點綴
TIER={
 'start':  dict(name='啟程', mat='剪紙',     field='#F3EBDD', sil='#4E4438', ring='#D9CCB2', deep='#6B5B45', light='#F7F1E5', acc='#B5534A'),
 'silver': dict(name='銀',   mat='銀浮雕',   field='#E3E8EE', sil='#4F5D6B', ring='#A9B4BF', deep='#3E4955', light='#EEF1F4', acc='#B5534A'),
 'gold':   dict(name='金',   mat='金浮雕',   field='#F3E6C4', sil='#6E5216', ring='#C9A24A', deep='#5E4612', light='#F6EDD3', acc='#9C5B3C'),
 'crystal':dict(name='晶鑽', mat='藍白浮雕瓷', field='#7E9FC3', sil='#F7F4EE', ring='#5F82AA', deep='#2F4C6E', light='#E7EEF6', acc='#C98A84'),
}

def star(cx,cy,r,f):
    return f'<path d="M{cx} {cy-r} Q{cx+r*.2:.1f} {cy-r*.2:.1f} {cx+r} {cy} Q{cx+r*.2:.1f} {cy+r*.2:.1f} {cx} {cy+r} Q{cx-r*.2:.1f} {cy+r*.2:.1f} {cx-r} {cy} Q{cx-r*.2:.1f} {cy-r*.2:.1f} {cx} {cy-r}Z" fill="{f}"/>'
def key(cx,cy,col):
    return (f'<g transform="translate({cx-20} {cy-9})"><circle cx="9" cy="9" r="7" fill="none" stroke="{col}" stroke-width="4"/>'
            f'<path d="M16 9 H40 M33 9 V16 M38 9 V14" stroke="{col}" stroke-width="4" stroke-linecap="round"/></g>')
def rose(cx,cy,r,f,c):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}"/><path d="M{cx} {cy} m-{r*.45:.1f} 0 a{r*.45:.1f} {r*.45:.1f} 0 1 1 {r*.9:.1f} 0 a{r*.3:.1f} {r*.3:.1f} 0 1 1 -{r*.6:.1f} 0" fill="none" stroke="{c}" stroke-width="1.6"/>')

def ornaments(t):
    T=TIER[t]; c=120; o=[]
    if t=='start':
        o.append(f'<circle cx="{c}" cy="{c}" r="96" fill="none" stroke="{T["ring"]}" stroke-width="8"/>')
        o.append(f'<circle cx="{c}" cy="{c}" r="105" fill="none" stroke="{T["deep"]}" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round"/>')
    elif t=='silver':
        o.append(f'<circle cx="{c}" cy="{c}" r="96" fill="none" stroke="{T["ring"]}" stroke-width="9"/>')
        o.append(f'<circle cx="{c}" cy="{c}" r="106" fill="none" stroke="{T["deep"]}" stroke-width="1.6"/>')
        for i,s in enumerate('♠♥♦♣'):
            a=math.radians(-45+90*i); x=c+106*math.cos(a); y=c+106*math.sin(a)
            col=T['acc'] if s in '♥♦' else T['deep']
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="11" fill="{T["light"]}" stroke="{T["ring"]}" stroke-width="2"/><text x="{x:.1f}" y="{y+5:.1f}" text-anchor="middle" font-size="15" fill="{col}" font-family="DejaVu Sans,sans-serif">{s}</text>')
    elif t=='gold':
        o.append(f'<circle cx="{c}" cy="{c}" r="96" fill="none" stroke="{T["ring"]}" stroke-width="11"/>')
        o.append(f'<circle cx="{c}" cy="{c}" r="108" fill="none" stroke="{T["deep"]}" stroke-width="4.5" stroke-dasharray="0.1 9.4" stroke-linecap="round"/>')
        o.append(f'<rect x="{c-30}" y="4" width="60" height="26" rx="13" fill="{T["light"]}" stroke="{T["ring"]}" stroke-width="2.5"/>'+key(c,17,T['ring']))
    else:
        o.append(f'<circle cx="{c}" cy="{c}" r="96" fill="none" stroke="{T["ring"]}" stroke-width="11"/>')
        o.append(f'<circle cx="{c}" cy="{c}" r="96" fill="none" stroke="#F7F4EE" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>')
        o.append(f'<circle cx="{c}" cy="{c}" r="108" fill="none" stroke="{T["deep"]}" stroke-width="2"/>')
        for s in (-1,1):   # 白色月桂浮雕
            for k in range(3):
                a=math.radians(90+s*(20+k*18)); x=c+104*math.cos(a); y=c+104*math.sin(a)
                o.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="4" ry="8.5" transform="rotate({math.degrees(a)+90*s+20*s:.0f} {x:.1f} {y:.1f})" fill="#F7F4EE" stroke="{T["ring"]}" stroke-width=".8"/>')
        o.append(f'<rect x="{c-30}" y="4" width="60" height="26" rx="13" fill="{T["light"]}" stroke="{T["ring"]}" stroke-width="2.5"/>')
        o.append(rose(c-12,17,7,T['acc'],'#F7F4EE')+rose(c+12,17,7,'#F7F4EE',T['acc'])+star(c,17,5,T['deep']))
    return ''.join(o)

def avatar(ch,t,uid='u',size=240):
    T=TIER[t]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="{size}" height="{size}" role="img">'
            f'<defs><clipPath id="cp-{uid}"><circle cx="120" cy="120" r="92"/></clipPath></defs>'
            f'<circle cx="120" cy="120" r="96" fill="{T["field"]}"/>'
            f'<circle cx="120" cy="120" r="84" fill="none" stroke="{T["sil"]}" stroke-width="1" opacity=".25"/>'
            f'<g clip-path="url(#cp-{uid})"><g transform="translate(20 18)">{CHAR[ch](T["sil"],T["field"])}</g></g>'
            + ornaments(t) + '</svg>')

if __name__=='__main__':
    D=ROOT + '/'
    rows=[('rabbit','白兔','經典收藏家（精準）','側身、懷錶'),('alice','愛麗絲','從容探索家（均衡）','側臉長髮、蝴蝶結'),('cat','柴郡貓','慢遊生活家（留白）','樹上的笑臉、漸隱的尾巴')]
    tiers=['start','silver','gold','crystal']
    tdesc={'start':'剪紙｜羊皮紙細框','silver':'銀浮雕｜撲克牌花色','gold':'金浮雕｜金鑰匙','crystal':'藍白浮雕瓷｜月桂與玫瑰'}
    h=['<!doctype html><html><head><meta charset=utf8><style>body{margin:0;font-family:"Noto Sans CJK TC",sans-serif;background:#F3ECDF;color:#2B2B33}',
       '#fig{width:1500px;padding:30px 36px;box-sizing:border-box;display:flex;flex-direction:column;gap:16px;background:#F3ECDF}',
       'h1{margin:0;font-size:28px;color:#2F4C6E}.sub{font-size:16px;color:#6B6457;margin-top:-6px}',
       '.g{display:grid;grid-template-columns:230px repeat(4,1fr);gap:8px 14px;align-items:center}',
       '.th{text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center}.th b{font-size:20px}.th small{font-size:13px;color:#6B6457}',
       '.sw{display:flex;gap:4px}.sw i{width:16px;height:16px;border-radius:4px;display:block;border:1px solid #0002}',
       '.rh{display:flex;flex-direction:column;gap:4px}.rh b{font-size:24px;color:#2F4C6E}.rh span{font-size:15px;color:#6B6457}',
       '.cell{display:grid;place-items:center}.foot{font-size:13.5px;color:#6B6457;border-top:1px solid #E0D5BF;padding-top:10px}</style></head><body><div id="fig">',
       '<h1>歐洲旅人護照：維多利亞剪影浮雕，三種旅人 × 四種材質</h1><div class="sub">剪影是《愛麗絲夢遊仙境》出版年代（1865）流行的肖像形式；角色終身不變，升級時從剪紙換成銀、金，最後是藍白浮雕瓷。</div><div class="g"><div></div>']
    for t in tiers:
        T=TIER[t]; sw=''.join(f'<i style="background:{x}"></i>' for x in [T['field'],T['sil'],T['ring'],T['acc']])
        h.append(f'<div class="th"><b style="color:{T["deep"]}">{T["name"]}</b><small>{tdesc[t]}</small><div class="sw">{sw}</div></div>')
    for ch,nm,role,feat in rows:
        h.append(f'<div class="rh"><b>{nm}</b><span>{role}</span><span style="font-size:13px">辨識重點：{feat}</span></div>')
        for t in tiers: h.append(f'<div class="cell">{avatar(ch,t,uid=ch+t,size=210)}</div>')
    h.append('</div><div class="foot">原創剪影造型，角色取自《愛麗絲夢遊仙境》（公共領域），參考田尼爾原版插圖的姿態；不使用迪士尼版造型。頭像可在護照頁選擇不顯示。</div></div></body></html>')
    open(D+'cameo_overview.html','w',encoding='utf8').write(''.join(h))
