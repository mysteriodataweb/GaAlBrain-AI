import { GraduationCap, Users, Briefcase, Check } from "lucide-react";
import { useInView } from "./useInView";

const profiles = [
  {
    Icon: GraduationCap, color: "var(--purple-mid)", badge: "Étudiant",
    badgeBg: "var(--purple-light)", badgeColor: "var(--purple-dark)",
    title: "Entraîne-toi. Mesure-toi vraiment.",
    items: [
      "Upload ton cours et évalue ta compréhension avant l'exam",
      "Soumets ton code et prouve que tu le comprends",
      "Suis ta progression semaine après semaine",
      "Reçois des ressources ciblées sur tes lacunes",
    ],
    cta: "Commencer gratuitement",
  },
  {
    Icon: Users, color: "var(--orange)", badge: "Professeur",
    badgeBg: "var(--orange-light)", badgeColor: "var(--orange)",
    title: "Vois ce que ta classe comprend vraiment.",
    items: [
      "Cartographie des zones de blocage par étudiant",
      "Moyenne de compréhension par concept sur toute la classe",
      "Alertes automatiques : 3 étudiants bloquent sur X",
      "Export rapport PDF par étudiant ou par module",
    ],
    cta: "Voir la démo professeur",
  },
  {
    Icon: Briefcase, color: "var(--green)", badge: "Professionnel",
    badgeBg: "var(--green-light)", badgeColor: "var(--green)",
    title: "Formation continue. Résultats mesurables.",
    items: [
      "Évalue la maîtrise réelle après chaque formation",
      "Suivi d'équipe : qui a vraiment compris quoi",
      "Idéal pour onboarding technique et montée en compétence",
      "Rapports d'évolution par collaborateur",
    ],
    cta: "Demander une démo",
  },
];

export function ForWho() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="for-who" style={{ background: "var(--bg)", paddingTop: 100, paddingBottom: 100 }}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="h2-display text-center mb-14">Un outil. Trois usages.</h2>
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profiles.map((p, i) => (
            <article
              key={p.badge}
              className={`card-base flex flex-col fade-in-up ${inView ? "in-view" : ""}`}
              style={{
                padding: 28,
                borderLeft: `4px solid ${p.color}`,
                animationDelay: `${i * 0.1}s`,
                transition: "transform 0.25s ease, border-color 0.25s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <p.Icon size={32} strokeWidth={1.5} style={{ color: p.color, marginBottom: 16 }} />
              <span
                className="label-eyebrow self-start px-2.5 py-1 rounded-md mb-4"
                style={{ background: p.badgeBg, color: p.badgeColor }}
              >
                {p.badge}
              </span>
              <h3 className="h3-display mb-5">{p.title}</h3>
              <ul className="flex flex-col gap-3 mb-8">
                {p.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5" style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <Check size={18} strokeWidth={2} style={{ color: p.color, flexShrink: 0, marginTop: 3 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href="#cta" className="btn-outline mt-auto self-start" style={{ padding: "12px 24px", fontSize: 14 }}>
                {p.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
