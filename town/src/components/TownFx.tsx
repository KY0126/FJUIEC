// 日夜切換（右半夜晚圖淡入、左半加夜色）與右半的動態海浪、潮汐
import { PixiComponent } from '@pixi/react';
import * as PIXI from 'pixi.js';

const T = 32;
const HX = 40 * T; // 花蓮區左邊界（像素）
const MAP_H = 40 * T;
const SEA_Y = 930; // 海浪動畫從這條線往下（含浪花線）
const SEA_X0 = 2 * T;
const SEA_X1 = 38 * T;
const DAY = '/ai-town/assets/hualien/day.png';
const NIGHT = '/ai-town/assets/hualien/night.png';
const TIDE_SECONDS = 720; // 潮汐：小鎮 12 小時一個循環（現實 12 分鐘）
const SWELL_SECONDS = 10; // 湧浪：約 10 秒一波

// 0＝白天、1＝夜晚；18:00–19:00 黃昏漸暗，05:30–06:30 清晨漸亮
export function nightLevel(now: number) {
  const h = ((now / 1000) % 1440) / 60;
  if (h >= 19 || h < 5.5) return 1;
  if (h >= 18) return h - 18;
  if (h < 6.5) return 6.5 - h;
  return 0;
}

function noiseTexture() {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const img = g.createImageData(S, S);
  const P = Math.PI * 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      // 用幾組不同方向、可無縫重複的正弦波疊出水面起伏
      const v =
        128 +
        45 * Math.sin((P * x) / 64 + 1.2 * Math.sin((P * y) / 128)) +
        35 * Math.sin((P * y) / 32 + 0.8 * Math.sin((P * x) / 128)) +
        20 * Math.sin((P * (x + y)) / 85.3);
      const i = (y * S + x) * 4;
      const b = Math.max(0, Math.min(255, v));
      img.data[i] = img.data[i + 1] = b;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = PIXI.Texture.from(c);
  tex.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  return tex;
}

// 日夜按鈕：auto＝跟著小鎮時鐘，day／night＝固定（只改畫面，不影響角色作息）
export type LightMode = 'auto' | 'day' | 'night';
let lightMode: LightMode = 'auto';
export function setLightMode(m: LightMode) {
  lightMode = m;
}

type FxRoot = PIXI.Container & { _tick?: () => void };

export const TownFx = PixiComponent('TownFx', {
  create: () => {
    const root: FxRoot = new PIXI.Container();
    root.eventMode = 'none';

    // 左半沒有夜晚圖，先蓋一層深藍夜色
    const tint = new PIXI.Graphics();
    tint.beginFill(0x0a1430);
    tint.drawRect(0, 0, HX, MAP_H);
    tint.endFill();
    tint.alpha = 0;
    root.addChild(tint);

    const night = new PIXI.Container();
    night.alpha = 0;
    root.addChild(night);

    const sea = new PIXI.Container();
    root.addChild(sea);
    const seaNight = new PIXI.Container();
    seaNight.alpha = 0;

    const disp = new PIXI.Sprite(noiseTexture());
    disp.scale.set(2);
    disp.renderable = false;
    root.addChild(disp);
    const filter = new PIXI.DisplacementFilter(disp, 7);

    PIXI.Assets.load([DAY, NIGHT])
      .then((res: Record<string, PIXI.Texture>) => {
        const dayTex = res[DAY];
        const nightTex = res[NIGHT];
        const nightSprite = new PIXI.Sprite(nightTex);
        nightSprite.x = HX;
        night.addChild(nightSprite);
        const frame = new PIXI.Rectangle(SEA_X0, SEA_Y, SEA_X1 - SEA_X0, MAP_H - SEA_Y);
        const sd = new PIXI.Sprite(new PIXI.Texture(dayTex.baseTexture, frame));
        const sn = new PIXI.Sprite(new PIXI.Texture(nightTex.baseTexture, frame));
        for (const s of [sd, sn]) {
          s.x = HX + SEA_X0;
          s.y = SEA_Y;
        }
        sea.addChild(sd);
        seaNight.addChild(sn);
        sea.addChild(seaNight);
        sea.filters = [filter];
      })
      .catch((e) => console.log('花蓮日夜圖載入失敗', e));

    let cur = nightLevel(Date.now());
    const tick = () => {
      const now = Date.now();
      const target = lightMode === 'day' ? 0 : lightMode === 'night' ? 1 : nightLevel(now);
      cur += (target - cur) * 0.06; // 約 1 秒平順過渡
      const n = cur;
      tint.alpha = 0.45 * n;
      night.alpha = n;
      seaNight.alpha = n;
      // 水面流動
      disp.x = (now / 45) % 512;
      disp.y = (now / 80) % 512;
      // 湧浪（小幅前後）＋潮汐（慢慢漲退），往上＝漲潮蓋住沙灘
      const sec = now / 1000;
      const swell = Math.sin(((sec % SWELL_SECONDS) / SWELL_SECONDS) * Math.PI * 2) * 3;
      const tide = (Math.sin(((sec % TIDE_SECONDS) / TIDE_SECONDS) * Math.PI * 2) - 1) * 8;
      sea.y = tide + swell;
    };
    PIXI.Ticker.shared.add(tick);
    root._tick = tick;
    return root;
  },
  willUnmount: (root: FxRoot) => {
    if (root._tick) PIXI.Ticker.shared.remove(root._tick);
  },
});
