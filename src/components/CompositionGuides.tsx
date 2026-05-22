interface Props {
  grid: boolean;
  thirds: boolean;
  diagonal: boolean;
}

export default function CompositionGuides({ grid, thirds, diagonal }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {grid && <GridLines rows={8} cols={6} color="bg-white/25" />}
      {thirds && <GridLines rows={3} cols={3} color="bg-[#6B4CFF]/70" />}
      {diagonal && (
        <>
          <div className="absolute left-1/2 top-1/2 h-px w-[142%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-amber-300/70" />
          <div className="absolute left-1/2 top-1/2 h-px w-[142%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-amber-300/70" />
        </>
      )}
    </div>
  );
}

function GridLines({ rows, cols, color }: { rows: number; cols: number; color: string }) {
  return (
    <>
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div
          key={`h${rows}-${i}`}
          className={`absolute left-0 right-0 ${color}`}
          style={{ top: `${((i + 1) / rows) * 100}%`, height: '1px' }}
        />
      ))}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div
          key={`v${cols}-${i}`}
          className={`absolute top-0 bottom-0 ${color}`}
          style={{ left: `${((i + 1) / cols) * 100}%`, width: '1px' }}
        />
      ))}
    </>
  );
}
