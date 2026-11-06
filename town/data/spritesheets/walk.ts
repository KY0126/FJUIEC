// 角色專屬走路圖（ChatGPT 生成後切成 3 欄 × 4 列、每格 64px）。
// meta.scale = 2：畫面上仍是 32×32 的角色，但用 2 倍解析度，放大鏡頭時比較清楚。
import { SpritesheetData } from './types';

const F = 64;
const rows = ['down', 'left', 'right', 'up'] as const;
const frames: SpritesheetData['frames'] = {};
rows.forEach((dir, r) => {
  ['', '2', '3'].forEach((suffix, c) => {
    frames[`${dir}${suffix}`] = {
      frame: { x: c * F, y: r * F, w: F, h: F },
      sourceSize: { w: F, h: F },
      spriteSourceSize: { x: 0, y: 0 },
    };
  });
});

export const data: SpritesheetData = {
  frames,
  meta: { scale: '2' },
  animations: {
    left: ['left', 'left2', 'left3'],
    right: ['right', 'right2', 'right3'],
    up: ['up', 'up2', 'up3'],
    down: ['down', 'down2', 'down3'],
  },
};
