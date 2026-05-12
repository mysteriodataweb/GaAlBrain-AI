import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Users, Briefcase, CheckCircle, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field } from "./auth.login";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Inscription — GaAlBrain IA" },
      { name: "description", content: "Crée ton compte GaAlBrain IA et démarre ta première évaluation cognitive en moins de 2 minutes." },
    ],
  }),
  component: RegisterPage,
});

type RoleKey = "student" | "teacher" | "pro";

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<RoleKey>("student");

  return (
    <AuthLayout
      title="Commence à te connaître vraiment."
      subtitle="Crée ton profil cognitif en moins de 2 minutes."
      bullets={[
        { icon: GraduationCap, text: "Évalue ta compréhension sur n'importe quel sujet" },
        { icon: Users, text: "Obtiens ta cartographie cognitive personnalisée" },
        { icon: Briefcase, text: "Suis ton évolution dans le temps" },
      ]}
    >
      <p className="label-eyebrow mb-3" style={{ color: "var(--orange)" }}>Inscription</p>
      <h2 className="h2-display mb-2">Crée ton compte.</h2>

      <div className="flex items-center justify-center gap-2 my-5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="w-2.5 h-2.5 rounded-full" style={{ background: n <= step ? "var(--purple-mid)" : "var(--border)" }} />
        ))}
      </div>

      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-4">
          <Field label="Nom complet"><input required placeholder="Prénom Nom" className="auth-input" /></Field>
          <Field label="Email"><input required type="email" placeholder="ton@email.com" className="auth-input" /></Field>
          <Field label="Mot de passe">
            <div className="relative">
              <input required type={showPwd ? "text" : "password"} placeholder="••••••••" className="auth-input pr-10" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Field label="Confirmer le mot de passe"><input required type="password" placeholder="••••••••" className="auth-input" /></Field>
          <button type="submit" className="btn-primary w-full mt-2">Continuer →</button>
          <p className="text-center text-[14px]" style={{ color: "var(--text-secondary)" }}>
            Déjà un compte ?{" "}<Link to="/auth/login" style={{ color: "var(--orange)", fontWeight: 500 }}>Se connecter</Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="flex flex-col gap-3">
          <RoleCard active={role === "student"} onClick={() => setRole("student")} icon={GraduationCap} color="purple" title="Étudiant" sub="École, université, formation" />
          <RoleCard active={role === "teacher"} onClick={() => setRole("teacher")} icon={Users} color="orange" title="Professeur" sub="Évaluer et suivre mes élèves" />
          <RoleCard active={role === "pro"} onClick={() => setRole("pro")} icon={Briefcase} color="green" title="Professionnel" sub="Formation continue, montée en compétence" />
          {role === "student" && <Field label="Domaine d'étude"><input className="auth-input" placeholder="Ex : Informatique, Droit, Médecine…" /></Field>}
          {role === "teacher" && <>
            <Field label="Matière enseignée"><input className="auth-input" placeholder="Ex : Mathématiques" /></Field>
            <Field label="Établissement"><input className="auth-input" placeholder="Nom de l'établissement" /></Field>
          </>}
          <button type="submit" className="btn-primary w-full mt-2">Continuer →</button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center flex flex-col items-center gap-4 py-4">
          <CheckCircle size={48} style={{ color: "var(--green)" }} strokeWidth={1.5} />
          <h3 className="h3-display">Compte créé avec succès !</h3>
          <p style={{ color: "var(--text-secondary)" }}>Ta première session d'évaluation t'attend.</p>
          <button onClick={() => navigate({ to: role === "teacher" ? "/teacher" : "/dashboard" })} className="btn-primary w-full mt-2">
            Accéder à mon espace →
          </button>
        </div>
      )}
    </AuthLayout>
  );
}

function RoleCard({ active, onClick, icon: Icon, color, title, sub }: {
  active: boolean; onClick: () => void; icon: typeof GraduationCap; color: "purple" | "orange" | "green"; title: string; sub: string;
}) {
  const map = {
    purple: { border: "var(--purple-mid)", bg: "var(--purple-light)", icon: "var(--purple-dark)" },
    orange: { border: "var(--orange)", bg: "var(--orange-light)", icon: "var(--orange)" },
    green: { border: "var(--green)", bg: "var(--green-light)", icon: "var(--green)" },
  }[color];
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all"
      style={{
        background: active ? map.bg : "#fff",
        border: `2px solid ${active ? map.border : "var(--border)"}`,
      }}>
      <Icon size={24} strokeWidth={1.6} style={{ color: map.icon }} />
      <div>
        <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>{title}</div>
        <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{sub}</div>
      </div>
    </button>
  );
}