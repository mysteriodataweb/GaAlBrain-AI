import { FileText } from "lucide-react";

export function UploadCard() {
  return (
    <div className="flex flex-col h-full">
      <span
        className="label-eyebrow self-start px-2.5 py-1 rounded-md mb-3"
        style={{ background: "var(--purple-light)", color: "var(--purple-dark)" }}
      >
        Cours uploadé
      </span>
      <h3 className="h3-display mb-3" style={{ fontSize: 16 }}>Évalue ta compréhension</h3>
      <div className="flex items-center gap-2 mb-2">
        <FileText size={20} style={{ color: "var(--purple-dark)" }} strokeWidth={1.5} />
        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>thermodynamique_L2.pdf</span>
      </div>
      <div className="h-px w-full mb-3" style={{ background: "var(--border)" }} />
      <div
        className="rounded-lg p-2.5 mb-2 text-[12px] leading-snug"
        style={{ background: "var(--purple-light)", color: "var(--text-primary)" }}
      >
        Tu affirmes que l'entropie augmente toujours. Que se passe-t-il dans un réfrigérateur ?
      </div>
      <div
        className="rounded-lg p-2.5 self-end max-w-[85%] text-[12px] leading-snug"
        style={{ background: "var(--purple-dark)", color: "#fff" }}
      >
        Le système n'est pas isolé, donc...
      </div>
      <div className="mt-auto pt-3">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--purple-light)" }}>
          <div
            className="h-full progress-bar-fill rounded-full"
            style={{ background: "var(--purple-mid)", ["--target-w" as any]: "68%" }}
          />
        </div>
        <div className="mt-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          Compréhension : 68%
        </div>
      </div>
    </div>
  );
}
