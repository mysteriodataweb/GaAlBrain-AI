export function PeerCard() {
  return (
    <div className="flex flex-col h-full">
      <span
        className="label-eyebrow self-start px-2.5 py-1 rounded-md mb-3"
        style={{ background: "var(--green-light)", color: "var(--green)" }}
      >
        Peer challenge
      </span>
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Explique à ton pair</h3>
      <div className="flex items-center justify-center gap-3 my-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ background: "var(--purple-dark)" }}>A</div>
        <svg width="40" height="2"><line x1="0" y1="1" x2="40" y2="1" stroke="var(--text-muted)" strokeDasharray="3 3" /></svg>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium" style={{ background: "var(--orange)" }}>B</div>
      </div>
      <div
        className="rounded-lg p-2.5 mb-3 text-[11px] leading-snug text-center"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        L'IA observe et évalue les deux explications
      </div>
      <div className="flex flex-col gap-1.5 mb-2">
        <span className="px-2 py-1 rounded-md text-[10px] font-medium" style={{ background: "var(--green-light)", color: "var(--green)" }}>A — Solide : 82%</span>
        <span className="px-2 py-1 rounded-md text-[10px] font-medium" style={{ background: "var(--orange-light)", color: "var(--orange)" }}>B — Partiel : 61%</span>
      </div>
      <div className="mt-auto text-[10px]" style={{ color: "var(--text-muted)" }}>Teaching Effect activé</div>
    </div>
  );
}
