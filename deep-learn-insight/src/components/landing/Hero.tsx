import { Carousel } from "./Carousel";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ minHeight: "90vh", paddingTop: 80, paddingBottom: 80 }}
    >
      {/* decorative shapes */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: -80, right: -120, width: 480, height: 320,
          background: "#E87C1A", opacity: 0.15,
          transform: "rotate(12deg)", borderRadius: 12,
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: -100, left: -140, width: 420, height: 280,
          background: "#3B0094", opacity: 0.08,
          transform: "rotate(-8deg)", borderRadius: 12,
        }}
      />
      <svg aria-hidden className="absolute inset-0 w-full h-full pointer-events-none opacity-40" style={{ zIndex: 0 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0H0V60" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-6 grid lg:grid-cols-[3fr_2fr] gap-12 items-center" style={{ zIndex: 1 }}>
        <div>
          <p className="label-eyebrow mb-5" style={{ color: "var(--orange)" }}>
            Nouvelle ère de l'apprentissage
          </p>
          <h1 className="h1-display mb-6">
            Apprends. Prouve ce que tu comprends vraiment.
          </h1>
          <p className="mb-8 max-w-xl" style={{ fontSize: 18, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            GaAlBrain IA ne te donne pas les réponses. Il révèle si tu comprends vraiment.
            Upload ton cours, soumet ton code, choisis un sujet — l'IA cartographie tes
            zones de compréhension avec précision chirurgicale.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <a href="#cta" className="btn-primary">Tester maintenant</a>
            <a href="#how" className="btn-outline">Voir comment ça marche</a>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Étudiants · Enseignants · Professionnels
          </p>
        </div>
        <div className="lg:self-stretch flex items-center">
          <Carousel />
        </div>
      </div>
    </section>
  );
}
