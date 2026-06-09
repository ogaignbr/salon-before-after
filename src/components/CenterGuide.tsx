interface Props {
  className?: string;
  subtle?: boolean;
}

export default function CenterGuide({ className = '', subtle = false }: Props) {
  const opacity = subtle ? 'opacity-70' : 'opacity-95';

  return (
    <div className={`pointer-events-none absolute inset-0 z-30 ${opacity} ${className}`} aria-hidden="true">
      <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]" />
      <div className="absolute left-0 top-1/2 h-[3px] w-full -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]" />
    </div>
  );
}
