import { Upload, MessageSquare, Map, BarChart2 } from "lucide-react";
import { useInView } from "./useInView";

const steps = [
  {
    n: "01", Icon: Upload, iconColor: "var(--purple-dark)", numBg: "var(--purple-light)",
    title: "Tu soumets ton contenu",
    desc: "Uploade ton cours en PDF, entre un sujet libre, ou soumets ton code via ZIP ou lien GitHub. GaAlBrain IA s'adapte à ce que tu sais déjà.",
  },
  {
    n: "02", Icon: MessageSquare, iconColor: "var(--orange)", numBg: "var(--orange-light)",
    title: "L'IA te questionne",
    desc: "Pas de réponses. Que des questions ciblées. L'IA socratique sonde ton raisonnement en profondeur — elle cherche ce que tu comprends vraiment, pas ce que tu récites.",
  },
  {
    n: "03", Icon: Map, iconColor: "var(--purple-dark)", numBg: "var(--purple-light)",
    title: "La carte se révèle",
    desc: "Concept par concept, ta zone de compréhension se dessine. Points forts, lacunes, angles morts — tout est visible, avec les sources pour combler chaque zone faible.",
  },
  {
    n: "04", Icon: BarChart2, iconColor: "var(--orange)", numBg: "var(--orange-light)",
    title: "Tu progresses, mesuré",
    desc: "Courbe d'évolution cognitive, heatmap d'activité, recommandations personnalisées. Pour l'étudiant comme pour le professeur.",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="how" style={{ background: "#fff", paddingTop: 100, paddingBottom: 100 }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <h2 className="h2-display mb-3">De l'upload au diagnostic — en 4 étapes</h2>
          <p style={{ fontSize: 18, color: "var(--text-secondary)" }}>
            Un processus simple. Un résultat précis.
          </p>
        </div>
        <div ref={ref} className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            aria-hidden
            className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-px pointer-events-none"
            style={{
              borderTop: "1px dashed var(--border)",
              transform: "translateY(-50%)",
            }}
          />
          {steps.map(({ n, Icon, iconColor, numBg, title, desc }, i) => (
            <article
              key={n}
              className={`card-base relative fade-in-up ${inView ? "in-view" : ""}`}
              style={{ padding: "32px 24px", animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon size={28} strokeWidth={1.5} style={{ color: iconColor }} />
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 42,
                    color: numBg, lineHeight: 1,
                  }}
                >
                  {n}
                </span>
              </div>
              <h3 className="h3-display mb-3">{title}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
                {desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
