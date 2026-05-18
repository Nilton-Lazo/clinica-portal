export function DataGridSkeleton(props: { columns: number; rows?: number }) {
  const rowCount = props.rows ?? 8;
  const cols = props.columns;

  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden>
      {Array.from({ length: rowCount }).map((_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: cols }).map((__, col) => (
            <div
              key={col}
              className="h-4 flex-1 animate-pulse rounded bg-(--color-surface-hover)"
              style={col === 0 ? { maxWidth: "5rem" } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
