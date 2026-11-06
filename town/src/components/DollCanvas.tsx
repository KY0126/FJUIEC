import { useEffect, useRef } from 'react';
import { drawDoll, Outfit } from './outfit';

export default function DollCanvas({ name, outfit, size }: { name: string; outfit: Outfit; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawDoll(ref.current, name, outfit);
  }, [name, outfit]);
  return (
    <canvas
      ref={ref}
      width={64}
      height={64}
      style={{ width: size, height: size, imageRendering: size >= 64 ? "pixelated" : "auto" }}
      aria-label={`${name}的穿搭`}
    />
  );
}
