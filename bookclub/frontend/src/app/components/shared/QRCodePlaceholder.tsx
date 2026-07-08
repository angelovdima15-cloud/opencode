interface QRCodePlaceholderProps {
  code: string;
  size?: number;
}

export function QRCodePlaceholder({ code, size = 140 }: QRCodePlaceholderProps) {
  const cellSize = 6;
  const grid = 19;
  const seed = code.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const cells: boolean[][] = Array.from({ length: grid }, (_, r) =>
    Array.from({ length: grid }, (_, c) => {
      // Corner finder patterns
      if ((r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7)) {
        const isOuterBorder = (r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= grid - 7 && (r === grid - 7 || r === grid - 1 || c === 0 || c === 6));
        const isInnerBox = (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r >= 2 && r <= 4 && c >= grid - 5 && c <= grid - 3) ||
          (r >= grid - 5 && r <= grid - 3 && c >= 2 && c <= 4);
        return isOuterBorder || isInnerBox;
      }
      // Data cells — pseudo-random based on seed
      return ((seed * (r + 1) * (c + 1) * 7 + r * 13 + c * 17) % 11) > 4;
    })
  );

  return (
    <div
      className="flex flex-col items-center gap-3"
    >
      <div
        className="rounded-2xl p-3"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 0 30px rgba(124, 58, 237, 0.3)",
          border: "2px solid rgba(124, 58, 237, 0.4)",
        }}
      >
        <svg width={grid * cellSize} height={grid * cellSize} xmlns="http://www.w3.org/2000/svg">
          {cells.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize - 1}
                  height={cellSize - 1}
                  fill="#0F0F0F"
                  rx={1}
                />
              ) : null
            )
          )}
        </svg>
      </div>
      <span className="text-xs font-mono" style={{ color: "#8888AA" }}>{code}</span>
    </div>
  );
}
