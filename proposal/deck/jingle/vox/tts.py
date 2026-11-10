import sherpa_onnx, soundfile as sf, sys
M='./models/matcha-icefall-zh-baker/'
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
  acoustic_model=M+'model-steps-3.onnx',vocoder='./models/voc.onnx',lexicon=M+'lexicon.txt',tokens=M+'tokens.txt',dict_dir=M+'dict'),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg)
for name,text in [('tag','一分钟找到自己的欧洲'),('brand','永信旅游'),('yi','咿'),('you','呦'),('syl','一。分。钟。找。到。自。己。的。欧。洲。永。信。旅。游。')]:
    a=tts.generate(text,sid=0,speed=1.0); sf.write('/home/claude/work/jingle/vox/'+name+'.wav',a.samples,a.sample_rate); print(name,a.sample_rate,len(a.samples)/a.sample_rate)
import numpy as np
L=list('一分钟找到自己的欧洲永信旅游')+['咿','呦']
out=[]
for ch in L:
    a=tts.generate(ch,sid=0,speed=0.9); y=np.array(a.samples); e=np.where(np.abs(y)>np.abs(y).max()*.02)[0]; out.append(y[e[0]:e[-1]]); print(ch,round((e[-1]-e[0])/a.sample_rate,2),end=' | ')
np.save('segs.npy',np.array(out,dtype=object),allow_pickle=True)
