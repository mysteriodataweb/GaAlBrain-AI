import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertOctagon, AlertTriangle, CheckCircle, Copy, ExternalLink, Loader2, Shield } from "lucide-react";
import { useSession, useSessionEvaluation } from "@/hooks/useApi";

export const Route = createFileRoute("/session/$id/results")({
  head: () => ({
    meta: [
      { title: "Resultats - GaAlBrain IA" },
      { name: "description", content: "Synthese de ta session et plan de remediation." },
    ],
  }),
  component: Results,
});

function Results() {
  const { id } = Route.useParams();
  const { data: sessionResponse, isLoading: sessionLoading } = useSession(id);
  const { data: evaluationResponse, isLoading: evaluationLoading } = useSessionEvaluation(id);

  const session = sessionResponse?.data.session;
  const evaluation = evaluationResponse?.data.evaluation;
  const score = Math.round(Number(evaluation?.integrity_score ?? session?.integrity_score ?? 0));
  const color = score > 70 ? "var(--green)" : score > 40 ? "var(--orange)" : "var(--red)";
  const r = 54;
  const c = 2 * Math.PI * r;

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <Loader2 size={42} className="animate-spin mx-auto mb-4" style={{ color: "var(--purple-mid)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Preparation du bilan...</p>
        </div>
      </div>
    );
  }

  const solid = toArray(evaluation?.solid_concepts);
  const partial = toArray(evaluation?.partial_concepts);
  const gaps = toArray(evaluation?.gap_concepts);
  const recommendations = toArray(evaluation?.recommendations);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <div className="text-center">
          <CheckCircle size={56} style={{ color, margin: "0 auto" }} strokeWidth={1.4} />
          <h1 className="h1-display mt-4" style={{ fontSize: 36 }}>Session terminee.</h1>
          <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
            {evaluation?.summary || `Bilan pour ${session?.concept || "cette session"}.`}
          </p>
        </div>

        <div className="card-white text-center mt-8" style={{ padding: 40 }}>
          <div className="flex justify-center">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={r} fill="none" stroke="var(--bg)" strokeWidth="8" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c - (c * score) / 100} strokeLinecap="round" transform="rotate(-90 65 65)" />
              <text x="65" y="74" textAnchor="middle" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 40, fill: "var(--purple-dark)" }}>{score}</text>
            </svg>
          </div>
          <div className="text-[13px] mt-2" style={{ color: "var(--text-muted)" }}>Score d'integrite</div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <span>Confiance declaree : {session?.confidence_declared ?? "-"}%</span>
            <span>·</span>
            <span>Ecart : {formatDelta(evaluation?.calibration_gap)}</span>
            <span>·</span>
            <span>{evaluation?.calibration_label || "Calibration en attente"}</span>
          </div>
        </div>

        {evaluationLoading && (
          <div className="card-white text-center mt-6" style={{ padding: 24 }}>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Bilan en cours de generation. Les resultats complets vont s'afficher des que c'est pret.
            </p>
          </div>
        )}

        <div className="card-white mt-6" style={{ padding: 32 }}>
          <h3 className="h3-display mb-4">Carte cognitive</h3>
          <CategorySection icon={Shield} color="var(--green)" bg="var(--green-light)" label="Solides" tags={solid} empty="Aucun concept solide confirme" />
          <CategorySection icon={AlertTriangle} color="var(--orange)" bg="var(--orange-light)" label="A approfondir" tags={partial} empty="Aucun concept partiel detecte" />
          <CategorySection icon={AlertOctagon} color="var(--red)" bg="var(--red-light)" label="Lacunes detectees" tags={gaps} empty="Aucune lacune explicite detectee" />
        </div>

        <div className="card-white mt-6" style={{ padding: 32 }}>
          <h3 className="h3-display mb-1">Plan de remediation</h3>
          <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
            {evaluation?.metacognition_note || "Ressources suggerees a partir du bilan cognitif."}
          </p>
          <div className="flex flex-col gap-3">
            {recommendations.length > 0 ? (
              recommendations.map((item: any, index) => (
                <RemediationCard
                  key={index}
                  concept={item.concept || session?.concept || "Concept"}
                  type={item.resource_type || "Exercice"}
                  query={item.search_query || `${session?.concept || "concept"} exercices corriges`}
                  reason={item.why || "Consolider ce point avec une ressource ciblee."}
                />
              ))
            ) : (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Aucune recommandation detaillee disponible.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link to="/session/setup" className="btn-primary">Nouvelle session</Link>
          <Link to="/dashboard" className="btn-outline">Voir mon tableau de bord</Link>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ icon: Icon, color, bg, label, tags, empty }: any) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: bg }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} />
        <span className="label-eyebrow" style={{ color }}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.length > 0 ? tags.map((tag: string, i: number) => (
          <span key={i} className="px-3 py-1 rounded-full text-[12px]" style={{ background: "#fff", color }}>{tag}</span>
        )) : <span className="text-[13px]" style={{ color }}>{empty}</span>}
      </div>
    </div>
  );
}

function RemediationCard({ concept, type, query, reason }: { concept: string; type: string; query: string; reason: string }) {
  return (
    <div className="rounded-xl p-5" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--red-light)", color: "var(--red)" }}>{concept}</span>
        <span className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--purple-light)", color: "var(--purple-dark)" }}>{type}</span>
      </div>
      <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>{reason}</p>
      <div className="flex items-center gap-2">
        <input readOnly value={query} className="flex-1 px-3 py-2 rounded-lg text-[13px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
        <button className="p-2 rounded-lg" style={{ border: "1px solid var(--border)" }} onClick={() => navigator.clipboard?.writeText(query)}><Copy size={14} style={{ color: "var(--text-secondary)" }} /></button>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px]" style={{ color: "var(--orange)", border: "1px solid var(--orange)" }}>
          <ExternalLink size={14} /> Rechercher
        </a>
      </div>
    </div>
  );
}

function toArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatDelta(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return `${numberValue > 0 ? "+" : ""}${Math.round(numberValue)} pts`;
}
