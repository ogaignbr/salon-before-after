export default function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Horizontal lines (3x3 grid = 2 horizontal + 2 vertical) */}
      <div className="absolute top-1/3 left-0 right-0 h-px bg-red-500/60" />
      <div className="absolute top-2/3 left-0 right-0 h-px bg-red-500/60" />
      {/* Vertical lines */}
      <div className="absolute left-1/3 top-0 bottom-0 w-px bg-red-500/60" />
      <div className="absolute left-2/3 top-0 bottom-0 w-px bg-red-500/60" />
    </div>
  );
}
