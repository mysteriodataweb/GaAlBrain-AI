import { Link } from "@tanstack/react-router";

export function Navbar() {
  return (
    <header
      className="sticky top-0 z-[100] backdrop-blur-md border-b"
      style={{ backgroundColor: "rgba(236, 237, 242, 0.78)", borderColor: "var(--border)" }}
    >
      <nav className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display font-extrabold text-xl tracking-tight"
          style={{ color: "var(--purple-dark)", fontFamily: "'Syne', sans-serif", fontWeight: 800 }}
        >
          GaAlBrain IA
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li><a href="#how" className="hover:text-[var(--purple-dark)] transition-colors">Comment ça marche</a></li>
          <li><a href="#for-who" className="hover:text-[var(--purple-dark)] transition-colors">Pour qui ?</a></li>
          <li><a href="#features" className="hover:text-[var(--purple-dark)] transition-colors">Fonctionnalités</a></li>
        </ul>
        <div className="flex items-center gap-3">
          <Link to="/session/setup" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
            Commencer l'évaluation
          </Link>
        </div>
      </nav>
    </header>
  );
}
