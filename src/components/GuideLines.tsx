import type { ShootingPart } from '../types';

interface Props {
  part: ShootingPart;
}

export default function GuideLines({ part }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Center crosshair */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />

      {part === 'face' ? (
        /* Face oval guide */
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[60%] h-[55%] border-2 border-dashed border-white/40 rounded-[50%]" />
      ) : (
        /* Body guide */
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[70%] h-[85%] border-2 border-dashed border-white/40 rounded-lg" />
      )}
    </div>
  );
}
