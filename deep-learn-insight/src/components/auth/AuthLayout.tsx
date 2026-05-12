import { Link } from "@tanstack/react-router";
import { Brain, TrendingUp, Users, type LucideIcon } from "lucide-react";

type Bullet = { icon: LucideIcon; text: string };

export function AuthLayout({
  title,
  subtitle,
  bullets,
  children,
}: {
  title: string;
  subtitle: string;
  bullets?: Bullet[];
  children: React.ReactNode;
}) {
  const defaultBullets: Bullet[] = bullets ?? [
    { icon: Brain, text: "Cartographie de ta compréhension" },
    { icon: TrendingUp, text: "Courbe d'évolution dans le temps" },
    { icon: Users, text: "Défis peer-to-peer" },
  ];
  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--bg)" }}>
      <div
        className="md:w-[45%] relative overflow-hidden flex flex-col p-8 md:p-12"
        style={{ background: "var(--purple-dark)", color: "#fff", minHeight: 240 }}
      >
        <div aria-hidden className="absolute pointer-events-none" style={{ top: -60, right: -80, width: 320, height: 220, background: "var(--orange)", opacity: 0.15, transform: "rotate(12deg)", borderRadius: 12 }} />
        <div aria-hidden className="absolute pointer-events-none" style={{ bottom: -80, left: -100, width: 320, height: 220, background: "#fff", opacity: 0.06, transform: "rotate(-10deg)", borderRadius: 12 }} />
        <Link to="/" className="relative z-10" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff" }}>
          GaAlBrain IA
        </Link>
        <div className="flex-1 flex flex-col justify-center relative z-10 max-w-md">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 36, lineHeight: 1.15, color: "#fff" }}>{title}</h2>
          <p className="mt-4" style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{subtitle}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {defaultBullets.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                <Icon size={20} strokeWidth={1.6} />
                <span style={{ fontSize: 15 }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  );
}