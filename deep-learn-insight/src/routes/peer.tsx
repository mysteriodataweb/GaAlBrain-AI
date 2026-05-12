import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/peer")({
  head: () => ({
    meta: [
      { title: "Peer Challenge — GaAlBrain IA" },
      { name: "description", content: "Apprends en expliquant. L'IA observe deux pairs et évalue chaque explication." },
    ],
  }),
  component: Peer,
});

function Peer() {
  const [stage, setStage] = useState<"setup" | "active" | "results">("setup");
  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg)" }}>
      <AppSidebar role="student" />
      <div className="flex-1 min-w-0 p-8">
        <div className="max-w-[700px] mx-auto">
          <span className="inline-block label-eyebrow px-3 py-1 rounded-full mb-4" style={{ background: "var(--green-light)", color: "var(--green)" }}>Peer challenge</span>
          <h1 className="h2-display mb-2">Apprends en expliquant</h1>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Explique un concept à un pair. L'IA observe les deux et évalue la qualité de chaque explication.</p>

          {stage === "setup" && (
            <div className="card-white">
              <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>Quel concept allons-nous explorer ?</label>
              <input className="auth-input mb-3" placeholder="Ex : récursivité, entropie..." />
              <div className="flex flex-wrap gap-2 mb-6">
                {["Récursivité", "Entropie", "Graphes", "OOP"].map((p) => <button key={p} className="px-3 py-1 rounded-full text-[12px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{p}</button>)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)", background: "var(--purple-light)" }}>
                  <div className="text-[11px] uppercase mb-2" style={{ color: "var(--purple-dark)", fontWeight: 500 }}>Participant A</div>
                  <div style={{ fontWeight: 500 }}>Toi (Alice)</div>
                </div>
                <div className="rounded-xl p-4" style={{ border: "1px solid var(--border)" }}>
                  <div className="text-[11px] uppercase mb-2" style={{ color: "var(--text-muted)", fontWeight: 500 }}>Participant B</div>
                  <input className="auth-input" placeholder="Email de ton pair" />
                </div>
              </div>
              <button onClick={() => setStage("active")} className="btn-primary w-full">Lancer le challenge</button>
            </div>
          )}

          {stage === "active" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-white">
                <div className="text-[12px] uppercase mb-2" style={{ color: "var(--purple-dark)", fontWeight: 500 }}>Ton explication</div>
                <textarea rows={6} className="auth-input resize-none mb-3" placeholder="Explique le concept dans tes propres mots..." />
                <button onClick={() => setStage("results")} className="btn-primary w-full">Envoyer mon explication</button>
              </div>
              <div className="card-white" style={{ background: "var(--bg)", border: "1px dashed var(--border)" }}>
                <div className="text-[12px] uppercase mb-2" style={{ color: "var(--orange)", fontWeight: 500 }}>Explication de ton pair</div>
                <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>En attente de l'envoi…</p>
              </div>
              <div className="md:col-span-2 rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--purple-light)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: "var(--purple-mid)" }}>G</div>
                <span style={{ color: "var(--purple-dark)" }}>GaAlBrain IA observe les deux explications…</span>
              </div>
            </div>
          )}

          {stage === "results" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResultPanel name="Toi (Alice)" score={82} color="var(--green)" feedback="Explication structurée, exemples concrets, bonne reformulation du second principe." solid={["Entropie", "Système isolé"]} gaps={["Cycle de Carnot"]} winner />
              <ResultPanel name="Pair (B)" score={61} color="var(--orange)" feedback="Compréhension intuitive mais formulation imprécise sur les échanges thermiques." solid={["Énergie"]} gaps={["Entropie", "Système ouvert"]} />
              <button onClick={() => setStage("setup")} className="md:col-span-2 btn-outline">Nouveau challenge</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ name, score, color, feedback, solid, gaps, winner }: any) {
  return (
    <div className="card-white">
      <div className="flex items-center justify-between mb-3">
        <div style={{ fontWeight: 500 }}>{name}</div>
        {winner && <Trophy size={20} style={{ color: "var(--green)" }} />}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 40, color, lineHeight: 1 }}>{score}</div>
      <p className="text-[13px] mt-3 mb-4" style={{ color: "var(--text-secondary)" }}>{feedback}</p>
      <div className="text-[11px] uppercase mb-1.5" style={{ color: "var(--green)" }}>Solides</div>
      <div className="flex flex-wrap gap-1.5 mb-3">{solid.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--green-light)", color: "var(--green)" }}>{t}</span>)}</div>
      <div className="text-[11px] uppercase mb-1.5" style={{ color: "var(--red)" }}>Lacunes</div>
      <div className="flex flex-wrap gap-1.5">{gaps.map((t: string, i: number) => <span key={i} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--red-light)", color: "var(--red)" }}>{t}</span>)}</div>
    </div>
  );
}