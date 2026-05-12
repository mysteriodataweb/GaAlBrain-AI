const cols = [
  { title: "Produit", links: ["Comment ça marche", "Pour les étudiants", "Pour les profs", "Pour les pros"] },
  { title: "Ressources", links: ["Documentation", "Blog", "FAQ"] },
  { title: "Légal", links: ["Confidentialité", "CGU", "Contact"] },
];

export function Footer() {
  return (
    <footer style={{ background: "#141218", padding: "60px 0 40px" }}>
      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "#fff", marginBottom: 12 }}>
            GaAlBrain IA
          </div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, maxWidth: 280 }}>
            Révèle ce que tu comprends vraiment.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="label-eyebrow mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>{c.title}</div>
            <ul className="flex flex-col gap-2.5">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }} className="hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-7xl px-6 mt-12 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          © {new Date().getFullYear()} GaAlBrain IA. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
