import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Play, Users, BookOpen, BarChart2, Settings,
  Bell, FileText, type LucideIcon,
} from "lucide-react";

type Item = { to: string; label: string; icon: LucideIcon; badge?: number };

const studentItems: Item[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/session/setup", label: "Nouvelle session", icon: Play },
  { to: "/peer", label: "Peer Challenge", icon: Users },
  { to: "/dashboard", label: "Mes évaluations", icon: BookOpen },
  { to: "/dashboard", label: "Ma progression", icon: BarChart2 },
];

const teacherItems: Item[] = [
  { to: "/teacher", label: "Vue d'ensemble", icon: LayoutDashboard },
  { to: "/teacher", label: "Mes classes", icon: Users },
  { to: "/teacher", label: "Performances", icon: BarChart2 },
  { to: "/teacher", label: "Alertes", icon: Bell, badge: 3 },
  { to: "/teacher", label: "Rapports", icon: FileText },
];

export function AppSidebar({ role = "student" }: { role?: "student" | "teacher" }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = role === "teacher" ? teacherItems : studentItems;
  const name = role === "teacher" ? "Dr. Martin" : "Alice Dupont";
  const roleLabel = role === "teacher" ? "Professeur" : "Étudiant";

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 w-[240px] flex-shrink-0"
      style={{ background: "#fff", borderRight: "1px solid var(--border)" }}
    >
      <Link
        to="/"
        className="px-6 py-6 block"
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--purple-dark)" }}
      >
        GaAlBrain IA
      </Link>
      <div className="h-px mx-4" style={{ background: "var(--border)" }} />
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {items.map((it, i) => {
          const active = i === 0 && (path === it.to);
          const Icon = it.icon;
          return (
            <Link
              key={i}
              to={it.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] transition-colors"
              style={{
                background: active ? "var(--purple-light)" : "transparent",
                color: active ? "var(--purple-dark)" : "var(--text-secondary)",
                borderLeft: active ? "3px solid var(--purple-mid)" : "3px solid transparent",
                fontWeight: 500,
              }}
            >
              <Icon size={18} strokeWidth={1.7} />
              <span className="flex-1">{it.label}</span>
              {it.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--red)", color: "#fff" }}>
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="h-px mx-4" style={{ background: "var(--border)" }} />
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: "var(--purple-dark)" }}>
          {name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>{roleLabel}</div>
        </div>
        <Settings size={16} strokeWidth={1.7} style={{ color: "var(--text-muted)" }} />
      </div>
    </aside>
  );
}