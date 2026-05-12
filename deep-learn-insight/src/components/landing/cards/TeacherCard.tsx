export function TeacherCard() {
  const rows = [
    { name: "Alice", value: 85, color: "var(--green)" },
    { name: "Marc", value: 62, color: "var(--orange)" },
    { name: "Sonia", value: 58, color: "var(--orange)" },
  ];
  return (
    <div className="flex flex-col h-full">
      <span
        className="label-eyebrow self-start px-2.5 py-1 rounded-md mb-3"
        style={{ background: "var(--purple-dark)", color: "#fff" }}
      >
        Vue professeur
      </span>
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Radiographie de ta classe</h3>
      <div className="flex flex-col gap-2 mb-3">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-secondary)" }}>
              <span>{r.name}</span><span>{r.value}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
              <div className="h-full progress-bar-fill rounded-full" style={{ background: r.color, ["--target-w" as any]: `${r.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-px w-full mb-2" style={{ background: "var(--border)" }} />
      <div className="text-[11px] mb-1.5" style={{ color: "var(--text-secondary)" }}>Zone de blocage commune :</div>
      <span className="self-start px-2 py-1 rounded-md text-[11px] font-medium mb-2" style={{ background: "#FBEAEA", color: "#B8231A" }}>
        Transformée de Laplace
      </span>
      <button className="mt-auto self-start text-[11px] font-medium" style={{ color: "var(--purple-dark)" }}>
        Intervenir sur ce point →
      </button>
    </div>
  );
}
