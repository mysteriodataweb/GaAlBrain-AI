import { createFileRoute, Link } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/teacher/student/$id")({
  head: () => ({
    meta: [
      { title: "Détail étudiant — GaAlBrain IA" },
      { name: "description", content: "Vue détaillée du profil cognitif d'un étudiant." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { id } = Route.useParams();
  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg)" }}>
      <AppSidebar role="teacher" />
      <div className="flex-1 min-w-0">
        <div className="px-8 pt-6 text-[13px]" style={{ color: "var(--text-muted)" }}>
          <Link to="/teacher" style={{ color: "var(--text-secondary)" }}>Dashboard</Link> / <Link to="/teacher" style={{ color: "var(--text-secondary)" }}>Mes classes</Link> / Alice Dupont
        </div>
        <div className="p-8 flex flex-col gap-6">
          <div className="card-white flex items-center gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl" style={{ background: "var(--purple-dark)" }}>AD</div>
            <div className="flex-1">
              <h1 className="h2-display" style={{ fontSize: 24 }}>Alice Dupont</h1>
              <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>alice@ex.com</div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--purple-light)", color: "var(--purple-dark)" }}>Étudiant</span>
            </div>
            <div className="text-right text-[13px]" style={{ color: "var(--text-secondary)" }}>
              <div>23 sessions · Score moyen <strong style={{ color: "var(--green)" }}>74</strong></div>
              <div className="mt-1" style={{ color: "var(--green)" }}>En progression · +14pts ce mois</div>
            </div>
            <button className="btn-primary">Exporter rapport PDF</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-white">
              <h3 className="h3-display mb-4">Évolution</h3>
              <Mini />
            </div>
            <div className="card-white">
              <h3 className="h3-display mb-4">Carte cognitive</h3>
              {[
                { l: "Solides", c: "var(--green)", bg: "var(--green-light)", t: ["Entropie", "ATP", "Récursivité"] },
                { l: "Partiels", c: "var(--orange)", bg: "var(--orange-light)", t: ["Laplace", "Graphes"] },
                { l: "Lacunes", c: "var(--red)", bg: "var(--red-light)", t: ["Mécanique Q."] },
              ].map((s, i) => (
                <div key={i} className="mb-3">
                  <div className="label-eyebrow mb-2" style={{ color: s.c }}>{s.l}</div>
                  <div className="flex flex-wrap gap-1.5">{s.t.map((x, j) => <span key={j} className="px-3 py-1 rounded-full text-[12px]" style={{ background: s.bg, color: s.c }}>{x}</span>)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-white">
            <h3 className="h3-display mb-4">Sessions détaillées · #{id}</h3>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 pb-3 border-b text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
              <span>Concept</span><span>Date</span><span>Score</span><span>Confiance</span><span>Calibration</span><span>Rounds</span>
            </div>
            {[
              { c: "Thermodynamique", d: "10 mai", sc: 82, cf: 75, cal: "+7", r: 12 },
              { c: "Récursivité", d: "8 mai", sc: 76, cf: 80, cal: "-4", r: 10 },
              { c: "Dijkstra", d: "5 mai", sc: 58, cf: 70, cal: "-12", r: 8 },
            ].map((r, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 py-3 border-b items-center text-[13px]" style={{ borderColor: "var(--border)" }}>
                <span style={{ fontWeight: 500 }}>{r.c}</span>
                <span style={{ color: "var(--text-muted)" }}>{r.d}</span>
                <span style={{ fontWeight: 700, color: r.sc > 70 ? "var(--green)" : "var(--orange)" }}>{r.sc}</span>
                <span>{r.cf}%</span>
                <span style={{ color: r.cal.startsWith("-") ? "var(--red)" : "var(--green)" }}>{r.cal}pts</span>
                <span>{r.r}</span>
              </div>
            ))}
          </div>

          <div className="card-white">
            <h3 className="h3-display mb-3">Note du professeur</h3>
            <textarea rows={4} placeholder="Ajouter une note sur cet étudiant..." className="auth-input resize-none" />
            <button className="btn-primary mt-3">Sauvegarder la note</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini() {
  const points = [55, 60, 58, 65, 70, 68, 74];
  const w = 400, h = 140, pad = 12;
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1));
  const ys = points.map((p) => h - pad - ((p - 40) / 50) * (h - 2 * pad));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
      <path d={path} fill="none" stroke="#5C00C8" strokeWidth="2" strokeLinecap="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill="#3B0094" />)}
    </svg>
  );
}