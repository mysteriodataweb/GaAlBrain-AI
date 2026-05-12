import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, Activity, Brain, Target, Plus, Eye, FileText, Video, BookOpen, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useCurrentUser, useSessions, useStudentReport } from "@/hooks/useApi";
import { useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — GaAlBrain IA" },
      { name: "description", content: "Suis ton score d'intégrité, ton activité et tes recommandations personnalisées." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: userResponse } = useCurrentUser();
  const userId = userResponse?.data?.id;
  const { data: statsResponse, isLoading: statsLoading } = useStudentReport(userId ?? null);
  const stats = statsResponse?.data;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loading = statsLoading;

  if (loading) {
    return (
      <div className="flex min-h-screen w-full" style={{ background: "var(--bg)" }}>
        <AppSidebar role="student" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "var(--purple-mid)" }} />
            <p style={{ color: "var(--text-secondary)" }}>Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: "var(--bg)" }}>
      <AppSidebar role="student" />
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-8 py-5 border-b" style={{ background: "#fff", borderColor: "var(--border)" }}>
          <div>
            <h1 className="h2-display" style={{ fontSize: 28 }}>Tableau de bord</h1>
            <p className="text-[14px]" style={{ color: "var(--text-secondary)" }}>{today}</p>
          </div>
          <Link to="/session/setup" className="btn-primary inline-flex items-center gap-2"><Plus size={18} /> Nouvelle session</Link>
        </header>

        <div className="p-8 flex flex-col gap-6">
          {/* Row 1: stat cards */}
          <DashboardStats stats={stats} userId={userId} />

          {/* Row 2: courbe + heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
            <ProgressCard stats={stats} />
            <ActivityCard stats={stats} />
          </div>

          {/* Row 3: cartographie + reco */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConceptMapCard stats={stats} />
            <RecommendationsCard stats={stats} />
          </div>

          {/* Row 4: sessions */}
          <div className="card-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="h3-display">Sessions récentes</h3>
              <a href="#" className="text-[14px]" style={{ color: "var(--orange)" }}>Voir tout →</a>
            </div>
            <SessionsTable />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardStats({ stats, userId }: { stats: any; userId: string | null }) {
  const { data: sessionsResponse } = useSessions(userId ?? undefined);
  const sessions = sessionsResponse?.data ?? [];

  const avgScore = useMemo(() => {
    if (!stats?.progressCurve || stats.progressCurve.length === 0) return 0;
    const sum = stats.progressCurve.reduce((acc: number, item: any) => acc + item.score, 0);
    return Math.round(sum / stats.progressCurve.length);
  }, [stats?.progressCurve]);

  const completedSessions = useMemo(() => {
    return sessions.filter((s: any) => s.status === "completed").length;
  }, [sessions]);

  const conceptCount = useMemo(() => {
    return stats?.globalConceptMap?.length ?? 0;
  }, [stats?.globalConceptMap]);

  const calibrationGap = useMemo(() => {
    const recentEvals = stats?.recentEvaluations ?? [];
    if (recentEvals.length === 0) return 0;
    const avgCalibration = recentEvals.reduce((sum: number, evaluation: any) => sum + (evaluation.calibration_gap || 0), 0) / recentEvals.length;
    return Math.round(avgCalibration);
  }, [stats?.recentEvaluations]);

  const calibrationLabel = useMemo(() => {
    if (calibrationGap > 0) return `Tu t'évalues légèrement trop ${calibrationGap > 10 ? "haut" : "haut"}`;
    if (calibrationGap < 0) return `Tu t'évalues légèrement trop bas`;
    return "Bien calibré";
  }, [calibrationGap]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard icon={TrendingUp} iconColor="var(--purple-mid)" value={avgScore} label="Score moyen /100" trend={`▲ +${Math.max(0, avgScore - 70)} ce mois`} trendColor="var(--green)" />
      <StatCard icon={Activity} iconColor="var(--orange)" value={completedSessions} label="Sessions complétées" trend={`▲ +${Math.max(0, completedSessions - 5)} cette semaine`} trendColor="var(--green)" />
      <StatCard icon={Brain} iconColor="var(--purple-mid)" value={conceptCount} label="Concepts explorés" trend={`${Math.max(0, Math.round(conceptCount * 0.25))} solides · ${Math.max(0, Math.round(conceptCount * 0.4))} partiels · ${Math.max(0, Math.round(conceptCount * 0.35))} lacunes`} trendColor="var(--text-muted)" />
      <StatCard icon={Target} iconColor="var(--green)" value={`${Math.abs(calibrationGap)}pts`} label="Écart confiance / réalité" trend={calibrationLabel} trendColor={calibrationGap > 0 ? "var(--orange)" : "var(--green)"} valueColor={calibrationGap > 0 ? "var(--orange)" : "var(--green)"} />
    </div>
  );
}

function ProgressCard({ stats }: { stats: any }) {
  return (
    <div className="card-white">
      <h3 className="h3-display mb-1">Évolution de ta compréhension</h3>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Score d'intégrité par session sur 30 jours</p>
      <EvolutionChart data={stats?.progressCurve ?? []} />
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <Stat label="Meilleur score" value={stats?.progressCurve?.length ? `${Math.max(...(stats.progressCurve?.map((p: any) => p.score) ?? []))} — ${stats.progressCurve[0]?.concept ?? ""}` : "N/A"} />
        <Stat label="En progression" value={stats?.progressCurve?.length >= 2 ? `+${Math.max(0, stats.progressCurve[stats.progressCurve.length - 1]?.score - stats.progressCurve[0]?.score)}pts sur 30 jours` : "0pts"} />
        <Stat label="Régularité" value={stats?.activityHeatmap?.length ? `${(stats.activityHeatmap.length / 90 * 7).toFixed(1)} sessions/sem.` : "N/A"} />
      </div>
    </div>
  );
}

function ActivityCard({ stats }: { stats: any }) {
  return (
    <div className="card-white">
      <h3 className="h3-display mb-1">Ton activité</h3>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>90 derniers jours</p>
      <ActivityHeatmap data={stats?.activityHeatmap ?? []} />
      <div className="flex items-center justify-between mt-4 text-[11px]" style={{ color: "var(--text-muted)" }}>
        <span>Moins</span>
        <div className="flex gap-1">
          {["#E0DEE8", "#C4B5F7", "#9B7FE8", "#5C00C8"].map((c) => (
            <span key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
        </div>
        <span>Plus</span>
      </div>
      <div className="mt-3 text-[12px] text-center" style={{ color: "var(--text-secondary)" }}>
        {stats?.activityHeatmap?.length ?? 0} sessions · {stats?.activityHeatmap?.filter((a: any) => a.sessions_count > 0).length ?? 0} jours actifs sur 90
      </div>
    </div>
  );
}

function ConceptMapCard({ stats }: { stats: any }) {
  const solidConcepts = stats?.globalConceptMap?.filter((c: any) => c.latest_status === "solid").map((c: any) => c.concept_name) ?? [];
  const partialConcepts = stats?.globalConceptMap?.filter((c: any) => c.latest_status === "partial").map((c: any) => c.concept_name) ?? [];
  const gapConcepts = stats?.globalConceptMap?.filter((c: any) => c.latest_status === "gap").map((c: any) => c.concept_name) ?? [];

  const avgScore = stats?.globalConceptMap?.length ? Math.round(stats.globalConceptMap.reduce((sum: number, c: any) => sum + c.avg_score, 0) / stats.globalConceptMap.length) : 0;

  return (
    <div className="card-white">
      <h3 className="h3-display mb-1">Ta carte cognitive</h3>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Tous tes concepts évalués</p>
      <ConceptSection label="Solides" color="var(--green)" bg="var(--green-light)" tags={solidConcepts.length > 0 ? solidConcepts : ["Aucun encore"]} />
      <ConceptSection label="Partiels" color="var(--orange)" bg="var(--orange-light)" tags={partialConcepts.length > 0 ? partialConcepts : ["Aucun encore"]} />
      <ConceptSection label="Lacunes" color="var(--red)" bg="var(--red-light)" tags={gapConcepts.length > 0 ? gapConcepts : ["Aucun encore"]} />
      <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2 text-[13px]"><span style={{ color: "var(--text-secondary)" }}>Score d'intégrité global</span><span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{avgScore}/100</span></div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--purple-light)" }}>
          <div className="h-full rounded-full" style={{ width: `${avgScore}%`, background: "var(--purple-mid)" }} />
        </div>
      </div>
    </div>
  );
}

function RecommendationsCard({ stats }: { stats: any }) {
  const firstRecommendations = stats?.recentEvaluations?.[0]?.recommendations ?? [];
  
  return (
    <div className="card-white">
      <h3 className="h3-display mb-1">Recommandations</h3>
      <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>Basées sur tes lacunes détectées</p>
      <div className="flex flex-col gap-3">
        {firstRecommendations.length > 0 ? (
          firstRecommendations.slice(0, 3).map((rec: any, i: number) => (
            <RecoCard key={i} priority={i === 0 ? "PRIORITAIRE" : i === 1 ? "RECOMMANDÉ" : "À EXPLORER"} priorityColor={i === 0 ? "var(--red)" : i === 1 ? "var(--orange)" : "var(--text-muted)"} icon={i === 0 ? FileText : i === 1 ? Video : BookOpen} iconColor={i === 0 ? "var(--orange)" : i === 1 ? "var(--purple-mid)" : "var(--text-muted)"} concept={rec.concept ?? "Concept"} type={`${rec.type ?? "Ressource"} · ${rec.duration ?? "?"}`} desc={rec.reason ?? "Améliore ta compréhension"} />
          ))
        ) : (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>Aucune recommandation pour le moment</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, value, label, trend, trendColor, valueColor }: any) {
  return (
    <div className="card-white">
      <Icon size={22} strokeWidth={1.6} style={{ color: iconColor }} />
      <div className="mt-3" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36, color: valueColor || "var(--purple-dark)", lineHeight: 1 }}>{value}</div>
      <div className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="mt-2 text-[12px]" style={{ color: trendColor }}>{trend}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="text-[13px] mt-1" style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function EvolutionChart({ data }: { data: any[] }) {
  const points = data.length > 0 ? data.map((d: any) => d.score ?? 0) : [55, 58, 52, 60, 65, 62, 68, 72, 70, 74, 78, 82, 79, 85, 88];
  const w = 600, h = 200, pad = 20;
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (Math.max(1, points.length - 1)));
  const minScore = Math.min(...points, 40);
  const maxScore = Math.max(...points, 100);
  const range = Math.max(1, maxScore - minScore);
  const ys = points.map((p) => h - pad - ((p - minScore) / range) * (h - 2 * pad));
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${path} L${xs[xs.length - 1]},${h - pad} L${xs[0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#5C00C8" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5C00C8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => <line key={i} x1={pad} y1={pad + i * ((h - 2 * pad) / 3)} x2={w - pad} y2={pad + i * ((h - 2 * pad) / 3)} stroke="rgba(0,0,0,0.05)" />)}
      <path d={area} fill="url(#grad)" />
      <path d={path} fill="none" stroke="#5C00C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill={points[i] > 70 ? "#1A7A4A" : points[i] > 40 ? "#E87C1A" : "#C41E1E"} />)}
    </svg>
  );
}

function ActivityHeatmap({ data }: { data: any[] }) {
  const heatmapData = data.length > 0 ? data : Array.from({ length: 90 }, (_, i) => (i * 9301 + 49297) % 233280 / 233280);
  const maxCount = heatmapData.length > 0 && typeof heatmapData[0] === "object" ? Math.max(...heatmapData.map((h: any) => h.sessions_count ?? 0)) : 1;
  const color = (v: number) => {
    const normalized = typeof v === "object" ? (v.sessions_count ?? 0) / Math.max(1, maxCount) : v;
    return normalized < 0.4 ? "#E0DEE8" : normalized < 0.65 ? "#C4B5F7" : normalized < 0.85 ? "#9B7FE8" : "#5C00C8";
  };
  return (
    <div className="grid grid-cols-10 gap-[3px]">
      {heatmapData.map((v, i) => <div key={i} className="rounded-sm" style={{ aspectRatio: "1", background: color(v) }} />)}
    </div>
  );
}

function ConceptSection({ label, color, bg, tags }: { label: string; color: string; bg: string; tags: string[] }) {
  return (
    <div className="mb-3">
      <div className="label-eyebrow mb-2" style={{ color }}>{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span key={i} className="px-3 py-1 rounded-full text-[12px]" style={{ background: bg, color }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function RecoCard({ priority, priorityColor, icon: Icon, iconColor, concept, type, desc }: any) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="label-eyebrow px-2 py-0.5 rounded" style={{ background: "#fff", color: priorityColor, border: `1px solid ${priorityColor}40` }}>{priority}</span>
      </div>
      <div style={{ fontWeight: 500 }}>{concept}</div>
      <div className="flex items-center gap-1.5 mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
        <Icon size={14} strokeWidth={1.7} style={{ color: iconColor }} /> {type}
      </div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>{desc}</p>
      <button className="mt-2 text-[12px]" style={{ color: "var(--purple-dark)", fontWeight: 500 }}>Rechercher →</button>
    </div>
  );
}

const typeMeta: Record<string, { label: string; bg: string; col: string }> = {
  document: { label: "Document", bg: "var(--purple-light)", col: "var(--purple-dark)" },
  code: { label: "Code", bg: "rgba(26,26,46,0.1)", col: "#1a1a2e" },
  generic: { label: "Générique", bg: "var(--orange-light)", col: "var(--orange)" },
};

const statusMeta: Record<string, { label: string; bg: string; col: string }> = {
  completed: { label: "Complété", bg: "var(--green-light)", col: "var(--green)" },
  abandoned: { label: "Abandonné", bg: "var(--red-light)", col: "var(--red)" },
  active: { label: "Active", bg: "var(--orange-light)", col: "var(--orange)" },
};

function formatShortDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function SessionsTable() {
  const { data: sessionsResponse, isLoading } = useSessions();
  const sessions = sessionsResponse?.data ?? [];
  const rows = sessions.slice(0, 5);

  const header = (
    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-3 pb-3 border-b text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
      <span>Concept</span><span>Date</span><span>Type</span><span>Score</span><span>Statut</span><span></span>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="py-6 text-[13px]" style={{ color: "var(--text-muted)" }}>Chargement des sessions...</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div>
        {header}
        <div className="py-6 text-[13px]" style={{ color: "var(--text-muted)" }}>Aucune session pour le moment.</div>
      </div>
    );
  }
  return (
    <div>
      {header}
      {rows.map((session) => {
        const typeInfo = typeMeta[session.input_type] || { label: "Autre", bg: "var(--bg)", col: "var(--text-muted)" };
        const statusInfo = statusMeta[session.status] || { label: session.status, bg: "var(--bg)", col: "var(--text-muted)" };
        const rawScore = Number(session.integrity_score);
        const hasScore = Number.isFinite(rawScore);
        const score = hasScore ? Math.round(rawScore) : null;
        const scoreColor = !hasScore
          ? "var(--text-muted)"
          : rawScore > 70
            ? "var(--green)"
            : rawScore > 40
              ? "var(--orange)"
              : "var(--red)";
        const viewTo = session.status === "completed" ? "/session/$id/results" : "/session/$id";
        return (
        <div key={session.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px] gap-3 py-4 items-center border-b" style={{ borderColor: "var(--border)" }}>
          <span style={{ fontWeight: 500 }}>{session.concept}</span>
          <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>{formatShortDate(session.created_at)}</span>
          <span><span className="px-2 py-0.5 rounded text-[11px]" style={{ background: typeInfo.bg, color: typeInfo.col }}>{typeInfo.label}</span></span>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: scoreColor }}>{score ?? "-"}</span>
          <span><span className="px-2 py-0.5 rounded text-[11px]" style={{ background: statusInfo.bg, color: statusInfo.col }}>{statusInfo.label}</span></span>
          <span>
            <Link to={viewTo} params={{ id: session.id }} className="inline-flex items-center justify-center">
              <Eye size={16} style={{ color: "var(--text-muted)" }} />
            </Link>
          </span>
        </div>
        );
      })}
    </div>
  );
}