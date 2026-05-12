export function CtaFinal() {
  return (
    <section
      id="cta"
      className="relative overflow-hidden"
      style={{ background: "var(--purple-dark)", paddingTop: 100, paddingBottom: 100 }}
    >
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: -60, right: -100, width: 440, height: 280,
          background: "#E87C1A", opacity: 0.15,
          transform: "rotate(14deg)", borderRadius: 12,
        }}
      />
      <div className="relative mx-auto max-w-3xl px-6 text-center" style={{ color: "#fff" }}>
        <h2 className="h2-display mb-5" style={{ color: "#fff" }}>
          Prêt à savoir ce que tu sais vraiment ?
        </h2>
        <p className="mb-8 mx-auto" style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 560 }}>
          Uploade un cours. Soumets un code. Entre un sujet. GaAlBrain IA fait le reste.
        </p>
        <a href="#" className="btn-primary" style={{ padding: "16px 36px", fontSize: 16 }}>
          Commencer maintenant
        </a>
        <p className="mt-5" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
          Gratuit · Sans carte bancaire · Pour étudiants, profs et pros
        </p>
      </div>
    </section>
  );
}
