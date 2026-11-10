import sherpa_onnx, soundfile as sf, numpy as np, sys
K='./models/kokoro-multi-lang-v1_0/'
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
  model=K+'model.onnx',voices=K+'voices.bin',tokens=K+'tokens.txt',data_dir=K+'espeak-ng-data',dict_dir=K+'dict',lexicon=K+'lexicon-us-en.txt,'+K+'lexicon-zh.txt'),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg); print('speakers',tts.num_speakers)
mode=sys.argv[1]
if mode=='test':
    for sid in [49,50,51,52]:
        a=tts.generate('一分钟找到自己的欧洲，永信旅游。',sid=sid,speed=1.0); sf.write(f'm{sid}.wav',a.samples,a.sample_rate)
else:
    sid=int(sys.argv[2]); L=sys.argv[3].split(',')
    out=[]
    for ch in L:
        a=tts.generate(ch+'。',sid=sid,speed=0.9); y=np.array(a.samples); e=np.where(np.abs(y)>np.abs(y).max()*.02)[0]; out.append(y[e[0]:e[-1]])
    print('sr',a.sample_rate)
    np.save('segs_m.npy',np.array(out,dtype=object),allow_pickle=True)
