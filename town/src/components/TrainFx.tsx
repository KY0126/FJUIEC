// 鐵軌上的列車動畫（進站、停靠、出站）
import { PixiComponent } from '@pixi/react';
import * as PIXI from 'pixi.js';

export type Travel = { playerId: string; to: string; departAt: number; arriveAt: number; boarded: boolean };

const T = 32;
const RAIL_X = 40 * T + 9; // 鐵軌在花蓮區最左邊兩格
const STOP_Y: Record<string, number> = { daxue: 32 * T, hualien: 6 * T }; // 列車車頭停靠位置
const MAP_H = 40 * T;
const CAR_W = 46;
const CAR_H = 92;
const GAP = 6;
const CARS = 4;
const TRAIN_LEN = CARS * (CAR_H + GAP);
const MOVE_MS = 8000; // 進站、出站各 8 秒
const APPROACH_MS = 6000; // 發車前 6 秒列車先進站停靠

function drawTrain() {
  // 車頭在 y=0、車身往上（-y）延伸；往下開時車頭在前
  const g = new PIXI.Graphics();
  for (let i = 0; i < CARS; i++) {
    const y = -(i + 1) * (CAR_H + GAP) + GAP;
    g.beginFill(0x2b2b2b, 0.35).drawRoundedRect(3, y + 4, CAR_W, CAR_H, 8).endFill(); // 影子
    g.beginFill(0xf4f2ec).lineStyle(2, 0x3a3a44).drawRoundedRect(0, y, CAR_W, CAR_H, i === 0 ? 16 : 6).endFill();
    g.lineStyle(0);
    g.beginFill(0xe8742c).drawRect(4, y + 10, 5, CAR_H - 20).endFill(); // 橘色腰帶
    g.beginFill(0xe8742c).drawRect(CAR_W - 9, y + 10, 5, CAR_H - 20).endFill();
    for (let w = 0; w < 4; w++) {
      g.beginFill(0x1f3a6b).drawRect(13, y + 12 + w * 19, CAR_W - 26, 12).endFill(); // 車窗
      g.beginFill(0x9fc4e8, 0.6).drawRect(14, y + 13 + w * 19, 6, 4).endFill();
    }
    g.beginFill(0x8a8f99).drawRect(CAR_W / 2 - 8, y + 2, 16, 4).endFill(); // 車頂集電設備
  }
  // 車頭燈
  g.beginFill(0xfff3b0).drawCircle(10, -10, 4).drawCircle(CAR_W - 10, -10, 4).endFill();
  return g;
}

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const easeIn = (t: number) => t * t;
const clamp = (t: number) => Math.max(0, Math.min(1, t));

type Run = { from: string; to: string; departAt: number; arriveAt: number; boarded: boolean; seenAt: number };
type Root = PIXI.Container & { _tick?: () => void; _runs?: Map<string, Run>; _trains?: Map<string, PIXI.Container> };

// 回傳 [車頭 y, 方向(1 往下, -1 往上)]，不需要顯示時回傳 null
function headY(r: Run, now: number): [number, number] | null {
  const south = r.to === 'hualien'; // 往右半＝往下開；往左半＝往上開
  const dir = south ? 1 : -1;
  const offStart = south ? -TRAIN_LEN : MAP_H + TRAIN_LEN; // 進入目的地時從畫面外開進來
  const offEnd = south ? MAP_H + TRAIN_LEN : -TRAIN_LEN; // 離開出發站時開出畫面
  const fromStop = STOP_Y[r.from];
  const toStop = STOP_Y[r.to];
  const fromEntry = south ? MAP_H + TRAIN_LEN : -TRAIN_LEN; // 進出發站時從反方向開進來
  if (!r.boarded) {
    // 候車中：發車前列車進站停靠
    const t = clamp(1 - (r.departAt - now) / APPROACH_MS);
    if (r.departAt - now > APPROACH_MS) return null;
    return [fromEntry + (fromStop - fromEntry) * easeOut(t), dir];
  }
  if (now - r.departAt < MOVE_MS) {
    const t = clamp((now - r.departAt) / MOVE_MS);
    return [fromStop + (offEnd - fromStop) * easeIn(t), dir];
  }
  if (r.arriveAt - now < MOVE_MS && now < r.arriveAt) {
    const t = clamp(1 - (r.arriveAt - now) / MOVE_MS);
    return [offStart + (toStop - offStart) * easeOut(t), dir];
  }
  if (now >= r.arriveAt && now - r.arriveAt < 4000) return [toStop, dir]; // 到站後停靠 4 秒
  if (now - r.arriveAt >= 4000 && now - r.arriveAt < 4000 + MOVE_MS) {
    const t = clamp((now - r.arriveAt - 4000) / MOVE_MS);
    const away = south ? MAP_H + TRAIN_LEN : -TRAIN_LEN;
    return [toStop + (away - toStop) * easeIn(t), dir];
  }
  return null;
}

export const TrainFx = PixiComponent('TrainFx', {
  create: () => {
    const root: Root = new PIXI.Container();
    root.eventMode = 'none';
    root._runs = new Map();
    root._trains = new Map();
    const tick = () => {
      const now = Date.now();
      for (const [id, r] of root._runs!) {
        let train = root._trains!.get(id);
        const pos = headY(r, now);
        if (!pos) {
          if (train) train.visible = false;
          if (now > r.arriveAt + 4000 + MOVE_MS) {
            root._runs!.delete(id);
            if (train) {
              root.removeChild(train);
              train.destroy({ children: true });
              root._trains!.delete(id);
            }
          }
          continue;
        }
        if (!train) {
          train = new PIXI.Container();
          train.addChild(drawTrain());
          root.addChild(train);
          root._trains!.set(id, train);
        }
        train.visible = true;
        train.x = RAIL_X;
        train.y = pos[0];
        train.scale.y = pos[1]; // 往上開時翻轉，車頭朝上
      }
    };
    PIXI.Ticker.shared.add(tick);
    root._tick = tick;
    return root;
  },
  applyProps: (root: Root, _old: any, props: { travels: Travel[] }) => {
    const now = Date.now();
    const present = new Set<string>();
    for (const t of props.travels ?? []) {
      const key = `${t.playerId}-${t.to}`;
      present.add(key);
      const from = t.to === 'hualien' ? 'daxue' : 'hualien';
      root._runs!.set(key, { from, to: t.to, departAt: t.departAt, arriveAt: t.arriveAt, boarded: t.boarded, seenAt: now });
    }
    // 候車中被取消的班次直接移除；已上車的保留到站動畫
    for (const [key, r] of root._runs!) {
      if (!present.has(key) && !r.boarded) {
        root._runs!.delete(key);
        const train = root._trains!.get(key);
        if (train) {
          root.removeChild(train);
          train.destroy({ children: true });
          root._trains!.delete(key);
        }
      }
    }
  },
  willUnmount: (root: Root) => {
    if (root._tick) PIXI.Ticker.shared.remove(root._tick);
  },
});
