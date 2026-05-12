export function ProgressCard() {
  // 5x7 heatmap intensities
  const intensities = [
    [0.2, 0.4, 0.7, 0.9, 1.0, 0.6, 0.3],
    [0.3, 0.5, 0.6, 0.8, 0.9, 0.7, 0.4],
    [0.1, 0.3, 0.5, 0.7, 0.8, 0.5, 0.2],
    [0.4, 0.6, 0.7, 0.9, 1.0, 0.8, 0.5],
    [0.2, 0.4, 0.6, 0.7, 0.9, 0.6, 0.3],
  ];
  const heat = (v: number) => {
    if (v < 0.25) return "#E8F5EE";
    if (v < 0.5) return "#A8DDC0";
    if (v < 0.75) return "#5BB58C";
    return "#1A7A4A";
  };
  return (
    <div className="flex flex-col h-full">
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Ta progression dans le temps</h3>
      <div className="rounded-lg p-2 mb-2" style={{ background: "var(--bg)" }}>
        <svg viewBox="0 0 200 60" className="w-full h-16">
          <polyline
            points="5,50 40,40 75,42 110,25 145,22 180,8"
            fill="none"
            stroke="var(--purple-mid)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {[5, 40, 75, 110, 145, 180].map((x, i) => {
            const y = [50, 40, 42, 25, 22, 8][i];
            return <circle key={i} cx={x} cy={y} r="2.5" fill="var(--purple-dark)" />;
          })}
        </svg>
        <div className="flex justify-between text-[9px] mt-1 px-1" style={{ color: "var(--text-muted)" }}>
          <span>S1</span><span>S2</span><span>S3</span><span>S4</span><span>S5</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {intensities.flat().map((v, i) => (
          <div key={i} className="rounded-sm" style={{ aspectRatio: "1", background: heat(v) }} />
        ))}
      </div>
      <div className="mt-auto text-[10px]" style={{ color: "var(--text-muted)" }}>
        Sessions régulières · +14pts ce mois
      </div>
    </div>
  );
}
