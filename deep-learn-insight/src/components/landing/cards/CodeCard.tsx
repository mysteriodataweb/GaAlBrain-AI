export function CodeCard() {
  return (
    <div className="flex flex-col h-full">
      <span
        className="label-eyebrow self-start px-2.5 py-1 rounded-md mb-3"
        style={{ background: "#141218", color: "#fff" }}
      >
        Code soumis
      </span>
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Comprends-tu ton propre code ?</h3>
      <pre
        className="rounded-lg p-2.5 mb-3 overflow-hidden"
        style={{
          background: "#1a1a2e",
          color: "#a8e6a3",
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
{`def fibonacci(n):
  if n <= 1: return n
  return fib(n-1) + fib(n-2)`}
      </pre>
      <div
        className="rounded-r-lg p-2.5 mb-2 text-[12px] leading-snug"
        style={{
          background: "var(--orange-light)",
          borderLeft: "2px solid var(--orange)",
          color: "var(--text-primary)",
        }}
      >
        Pourquoi cette implémentation est-elle inefficace pour n &gt; 40 ?
      </div>
      <div
        className="mt-auto inline-block self-start px-2 py-1 rounded-md text-[11px]"
        style={{ background: "var(--bg)", color: "var(--text-secondary)" }}
      >
        Complexité algorithmique · O(2ⁿ)
      </div>
    </div>
  );
}
