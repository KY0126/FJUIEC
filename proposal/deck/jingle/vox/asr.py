import sherpa_onnx, soundfile as sf, numpy as np, sys
from scipy.signal import resample_poly
M='./models/sherpa-onnx-paraformer-zh-small-2024-03-09/'
r=sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=M+'model.int8.onnx',tokens=M+'tokens.txt',num_threads=4)
for f in sys.argv[1:]:
    y,sr=sf.read(f); y=y.mean(1) if y.ndim>1 else y
    y=resample_poly(y,16000,sr).astype(np.float32)
    s=r.create_stream(); s.accept_waveform(16000,y); r.decode_stream(s); print(f,'→',s.result.text)
