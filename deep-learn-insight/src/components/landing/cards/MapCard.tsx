export function MapCard() {
  const cells: { color: string; label: string }[] = [
    { color: "var(--green)", label: "Entropie" },
    { color: "var(--green)", label: "Énergie" },
    { color: "var(--orange)", label: "Carnot" },
    { color: "var(--green)", label: "Chaleur" },
    { color: "#E0DEE8", label: "?" },
    { color: "var(--orange)", label: "Exergie" },
    { color: "#E0DEE8", label: "?" },
    { color: "#E0DEE8", label: "?" },
    { color: "#E0DEE8", label: "?" },
  ];
  return (
    <div className="flex flex-col h-full">
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Ta carte de compréhension</h3>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {cells.map((c, i) => (
          <div
            key={i}
            className="rounded-lg flex items-center justify-center text-[9px] font-medium"
            style={{
              width: "100%",
              aspectRatio: "1",
              background: c.color,
              color: c.color === "#E0DEE8" ? "var(--text-muted)" : "#fff",
            }}
            title={c.label}
          >
            {c.label.length > 6 ? c.label.slice(0, 4) + "…" : c.label}
          </div>
        ))}
      </div>
      <div className="text-center my-2">
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 26, color: "var(--purple-dark)" }}>
          Intégrité : 71%
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between text-[10px]" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--green)" }} />Solide</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "var(--orange)" }} />Partiel</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#E0DEE8" }} />Lacune</span>
      </div>
    </div>
  );
}
