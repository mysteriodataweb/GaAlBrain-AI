import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Connexion — GaAlBrain IA" },
      { name: "description", content: "Connecte-toi à GaAlBrain IA pour reprendre ton parcours d'évaluation cognitive." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<"student" | "teacher" | "pro">("student");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: role === "teacher" ? "/teacher" : "/dashboard" });
  };

  return (
    <AuthLayout title="Reprends là où tu t'étais arrêté." subtitle="Ton empreinte cognitive t'attend.">
      <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Connexion</p>
      <h2 className="h2-display mb-2">Bon retour.</h2>
      <p className="mb-6" style={{ color: "var(--text-secondary)" }}>Entre tes identifiants pour continuer.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Adresse email">
          <input type="email" required placeholder="ton@email.com" className="auth-input" />
        </Field>
        <Field label="Mot de passe">
          <div className="relative">
            <input type={showPwd ? "text" : "password"} required placeholder="••••••••" className="auth-input pr-10" />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <a href="#" className="text-right text-[14px] -mt-2" style={{ color: "var(--orange)" }}>Mot de passe oublié ?</a>

        <div>
          <p className="label-eyebrow mb-2" style={{ color: "var(--text-muted)" }}>Je suis</p>
          <div className="flex gap-2">
            {(["student", "teacher", "pro"] as const).map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className="flex-1 px-3 py-2 rounded-full text-[13px] transition-colors"
                style={{
                  background: role === r ? "var(--purple-light)" : "#fff",
                  border: `1.5px solid ${role === r ? "var(--purple-mid)" : "var(--border)"}`,
                  color: role === r ? "var(--purple-dark)" : "var(--text-secondary)",
                  fontWeight: 500,
                }}>
                {r === "student" ? "Étudiant" : r === "teacher" ? "Professeur" : "Professionnel"}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full mt-2">Se connecter</button>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <button type="button" className="btn-outline w-full flex items-center justify-center gap-2" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
          <GoogleIcon /> Continuer avec Google
        </button>

        <p className="text-center text-[14px] mt-4" style={{ color: "var(--text-secondary)" }}>
          Pas encore de compte ?{" "}
          <Link to="/auth/register" style={{ color: "var(--orange)", fontWeight: 500 }}>S'inscrire</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
      {children}
    </label>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C33.9 6.9 29.2 5 24 5 16.3 5 9.7 9 6.3 14.7z"/><path fill="#4CAF50" d="M24 43c5.1 0 9.7-2 13.2-5.1l-6.1-5.2c-1.9 1.4-4.3 2.3-7.1 2.3-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.5 38.9 16.2 43 24 43z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.1 5.2c-.4.4 6.6-4.8 6.6-14.5 0-1.2-.1-2.3-.4-3.5z"/></svg>
  );
}