export default function GridOverlay() {
  const rows = 8;
  const cols = 6;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Horizontal lines */}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div
          key={`h${i}`}
          className="absolute left-0 right-0 bg-red-500/40"
          style={{ top: `${((i + 1) / rows) * 100}%`, height: '0.5px' }}
        />
      ))}
      {/* Vertical lines */}
      {Array.from({ length: cols - 1 }, (_, i) => (
        <div
          key={`v${i}`}
          className="absolute top-0 bottom-0 bg-red-500/40"
          style={{ left: `${((i + 1) / cols) * 100}%`, width: '0.5px' }}
        />
      ))}
    </div>
  );
}
