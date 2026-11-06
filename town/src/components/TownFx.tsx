// 日夜切換：門市打烊後（19:00–05:30）整張地圖蓋一層夜色，18:00–19:00 與 05:30–06:30 漸變
import { PixiComponent } from '@pixi/react';
import * as PIXI from 'pixi.js';

const T = 32;
const MAP_W = 80 * T;
const MAP_H = 40 * T;

// 0＝白天、1＝夜晚；18:00–19:00 黃昏漸暗，05:30–06:30 清晨漸亮
export function nightLevel(now: number) {
  const h = ((now / 1000) % 1440) / 60;
  if (h >= 19 || h < 5.5) return 1;
  if (h >= 18) return h - 18;
  if (h < 6.5) return 6.5 - h;
  return 0;
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
    const tint = new PIXI.Graphics();
    tint.beginFill(0x0a1430);
    tint.drawRect(0, 0, MAP_W, MAP_H);
    tint.endFill();
    tint.alpha = 0;
    root.addChild(tint);

    let cur = nightLevel(Date.now());
    const tick = () => {
      const target = lightMode === 'day' ? 0 : lightMode === 'night' ? 1 : nightLevel(Date.now());
      cur += (target - cur) * 0.06; // 約 1 秒平順過渡
      tint.alpha = 0.4 * cur;
    };
    PIXI.Ticker.shared.add(tick);
    root._tick = tick;
    return root;
  },
  willUnmount: (root: FxRoot) => {
    if (root._tick) PIXI.Ticker.shared.remove(root._tick);
  },
});
