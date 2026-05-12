import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Eye, FileText, Plus } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Espace professeur — GaAlBrain IA" },
      { name: "description", content: "Vue d'ensemble de tes classes : zones de blocage, scores moyens et alertes." },
    ],
  }),
  component: TeacherDashboard,
});

const students = [
  { name: "Alice Dupont", email: "alice@ex.com", score: 82, sessions: 18, trend: [60, 65, 70, 76, 82], gaps: ["Laplace"] },
  { name: "Marc Bernard", email: "marc@ex.com", score: 62, sessions: 12, trend: [70, 65, 60, 58, 62], gaps: ["Dijkstra", "Récursivité"] },
  { name: "Sonia Lopez", email: "sonia@ex.com", score: 58, sessions: 9, trend: [50, 55, 52, 56, 58], gaps: ["Laplace", "Graphes"] },
  { name: "Karim Naïr", email: "karim@ex.com", score: 74, sessions: 15, trend: [65, 68, 70, 72, 74], gaps: ["Photosynthèse"] },
  { name: "Élise Roy", email: "elise@ex.com", score: 88, sessions: 22, trend: [78, 80, 82, 86, 88], gaps: [] },
];

function TeacherDashboard() {
  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg)" }}>
      <AppSidebar role="teacher" />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-8 py-5 border-b" style={{ background: "#fff", borderColor: "var(--border)" }}>
          <div>
            <h1 className="h2-display" style={{ fontSize: 28 }}>Tableau de bord professeur</h1>
            <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Vue globale de tes classes</p>
          </div>
          <button className="btn-primary inline-flex items-center gap-2"><Plus size={18} /> Créer une classe</button>
        </header>

        <div className="p-8 flex flex-col gap-6">
          <div className="rounded-xl p-5 flex items-start gap-4" style={{ background: "var(--red-light)", borderLeft: "4px solid var(--red)" }}>
            <AlertTriangle size={22} style={{ color: "var(--red)", flexShrink: 0 }} />
            <div className="flex-1">
              <div style={{ fontWeight: 500 }}>Zones de blocage communes détectées</div>
              <div className="text-[13px] mt-1" style={{ color: "var(--text-secondary)" }}>3 étudiants bloquent sur Transformée de Laplace · 2 sur Algorithme de Dijkstra</div>
            </div>
            <button className="text-[13px] flex-shrink-0" style={{ color: "var(--red)", fontWeight: 500 }}>Voir le détail →</button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat value="24" label="Étudiants actifs" />
            <Stat value="87" label="Sessions ce mois" />
            <Stat value="68" label="Score moyen classe" />
            <Stat value="4" label="Concepts bloquants" />
          </div>

          <div className="card-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="h3-display">Mes étudiants</h3>
              <select className="text-[13px] px-3 py-1.5 rounded-lg" style={{ background: "#fff", border: "1px solid var(--border)" }}>
                <option>Toutes les classes</option><option>Classe A</option><option>Classe B</option>
              </select>
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_60px] gap-3 pb-3 border-b text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
              <span>Étudiant</span><span>Score</span><span>Évaluations</span><span>Trend</span><span>Lacunes</span><span></span>
            </div>
            {students.map((s, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1.5fr_60px] gap-3 py-4 items-center border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style={{ background: "var(--purple-mid)" }}>{s.name.split(" ").map(n => n[0]).join("")}</div>
                  <div className="min-w-0">
                    <div className="text-[14px] truncate" style={{ fontWeight: 500 }}>{s.name}</div>
                    <div className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>{s.email}</div>
                  </div>
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: s.score > 70 ? "var(--green)" : s.score > 40 ? "var(--orange)" : "var(--red)" }}>{s.score}</span>
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{s.sessions} sessions</span>
                <MiniTrend points={s.trend} />
                <div className="flex flex-wrap gap-1">
                  {s.gaps.length === 0 ? <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>—</span> :
                    s.gaps.map((g, j) => <span key={j} className="px-2 py-0.5 rounded text-[11px]" style={{ background: "var(--red-light)", color: "var(--red)" }}>{g}</span>)}
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/teacher/student/$id" params={{ id: String(i + 1) }}><Eye size={16} style={{ color: "var(--text-muted)" }} /></Link>
                  <FileText size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
            <div className="card-white">
              <h3 className="h3-display mb-1">Carte cognitive de la classe</h3>
              <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Niveau moyen de maîtrise par concept</p>
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { t: "Entropie", s: 82 }, { t: "Récursivité", s: 78 }, { t: "Photosynthèse", s: 70 },
                  { t: "Loi d'Ohm", s: 75 }, { t: "Dijkstra", s: 48 }, { t: "Graphes", s: 52 },
                  { t: "Laplace", s: 32 }, { t: "Mécanique Q.", s: 28 }, { t: "OOP", s: 80 },
                ].map((c, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-full" style={{
                    background: c.s > 70 ? "var(--green-light)" : c.s > 40 ? "var(--orange-light)" : "var(--red-light)",
                    color: c.s > 70 ? "var(--green)" : c.s > 40 ? "var(--orange)" : "var(--red)",
                    fontSize: c.s > 70 ? 15 : c.s > 40 ? 13 : 12,
                    fontWeight: 500,
                  }}>{c.t}</span>
                ))}
              </div>
              <p className="text-[11px] mt-4" style={{ color: "var(--text-muted)" }}>Taille = nombre d'étudiants évalués sur ce concept</p>
            </div>
            <div className="card-white">
              <h3 className="h3-display mb-4">Points d'intervention prioritaires</h3>
              <div className="flex flex-col gap-3">
                {[
                  { c: "Transformée de Laplace", n: 8 },
                  { c: "Algorithme Dijkstra", n: 5 },
                  { c: "Mécanique quantique", n: 4 },
                  { c: "Analyse complexe", n: 3 },
                  { c: "Graphes pondérés", n: 3 },
                ].map((x, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span style={{ fontWeight: 500 }}>{x.c}</span>
                      <span style={{ color: "var(--text-muted)" }}>{x.n}/24 en lacune</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(x.n / 24) * 100}%`, background: "var(--red)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-white">
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: "var(--purple-dark)", lineHeight: 1 }}>{value}</div>
      <div className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

function MiniTrend({ points }: { points: number[] }) {
  const w = 60, h = 24;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i * w) / (points.length - 1));
  const ys = points.map((p) => h - ((p - min) / range) * h);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const rising = points[points.length - 1] > points[0];
  return (
    <svg width={w} height={h}><path d={path} fill="none" stroke={rising ? "var(--green)" : "var(--red)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}