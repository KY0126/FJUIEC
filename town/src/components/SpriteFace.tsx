// 永信旅人小鎮：用原版像素小人的正面站姿當頭像（正式頭像生成前的暫代）
import { SPRITE_OF } from '../../data/ystravel';

export default function SpriteFace({ name, size }: { name: string; size: number }) {
  const pos = SPRITE_OF[name];
  if (!pos) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full bg-brown-700 text-xs text-brown-100"
      >
        {name.slice(-1)}
      </span>
    );
  }
  const k = size / 32; // 一格 32px
  return (
    <span
      title={name}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        backgroundImage: 'url(/ai-town/assets/32x32folk.png)',
        backgroundSize: `${384 * k}px ${256 * k}px`,
        backgroundPosition: `-${(pos[0] + 32) * k}px -${pos[1] * k}px`,
        imageRendering: 'pixelated',
      }}
      className="shrink-0 rounded-full bg-brown-700"
    />
  );
}
