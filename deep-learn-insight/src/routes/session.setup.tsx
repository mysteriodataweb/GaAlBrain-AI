import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Code2, Lightbulb, Upload, BookOpen, Target, Clock, AlertTriangle, FileCheck2, X, Check, Loader2 } from "lucide-react";
import { useCreateSession, useCreateSessionWithFile } from "@/hooks/useApi";

export const Route = createFileRoute("/session/setup")({
  head: () => ({
    meta: [
      { title: "Nouvelle session — GaAlBrain IA" },
      { name: "description", content: "Configure ta session d'évaluation cognitive en 3 étapes." },
    ],
  }),
  component: Setup,
});

type ContentType = "doc" | "code" | "generic" | null;

// Dummy user ID for testing without auth
const DUMMY_USER_ID = "test-user-123";

function Setup() {
  const navigate = useNavigate();
  const createSessionMutation = useCreateSession();
  const createSessionWithFileMutation = useCreateSessionWithFile();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<ContentType>(null);
  const [confidence, setConfidence] = useState(50);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [concept, setConcept] = useState<string>("");
  const [githubUrl, setGithubUrl] = useState<string>("");
  const [duration, setDuration] = useState(15);

  const isLoading = createSessionMutation.isPending || createSessionWithFileMutation.isPending;

  const handleStartSession = async () => {
    if (!type || !concept.trim()) return;

    try {
      let response;

      if (type === "doc" && file) {
        response = await createSessionWithFileMutation.mutateAsync({
          concept,
          inputType: "document",
          file,
          confidence,
          duration,
          userId: DUMMY_USER_ID,
        });
      } else if (type === "code" && githubUrl.trim()) {
        response = await createSessionMutation.mutateAsync({
          concept,
          inputType: "code",
          githubUrl,
          confidence,
          duration,
          userId: DUMMY_USER_ID,
        });
      } else {
        response = await createSessionMutation.mutateAsync({
          concept,
          inputType: "generic",
          confidence,
          duration,
          userId: DUMMY_USER_ID,
        });
      }

      // Rediriger vers la session
      navigate({ to: "/session/$id", params: { id: response.data.sessionId } });
    } catch (error) {
      console.error("Erreur création session:", error);
      alert("Erreur lors de la création de la session");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-[600px] mx-auto px-6 pt-20 pb-16">
        <Stepper step={step} />

        {step === 1 && (
          <div className="mt-8">
            <p className="label-eyebrow mb-2" style={{ color: "var(--orange)" }}>Étape 1 sur 3</p>
            <h2 className="h2-display mb-6">Que veux-tu évaluer ?</h2>
            <div className="flex flex-col gap-3">
              <TypeCard active={type === "doc"} onClick={() => setType("doc")} icon={FileText} iconColor="var(--purple-dark)" border="var(--purple-mid)" bg="var(--purple-light)" title="Cours ou document" desc="Uploade un PDF, DOCX ou TXT. L'IA génère les questions depuis ton cours." tag="PDF · DOCX · TXT" />
              <TypeCard active={type === "code"} onClick={() => setType("code")} icon={Code2} iconColor="#141218" border="#141218" bg="#F5F5F8" title="Code source" desc="Soumets ton code ZIP ou un lien GitHub. L'IA évalue si tu comprends vraiment ce que tu as écrit." tag="ZIP · GitHub" />
              <TypeCard active={type === "generic"} onClick={() => setType("generic")} icon={Lightbulb} iconColor="var(--orange)" border="var(--orange)" bg="var(--orange-light)" title="Sujet libre" desc="Entre n'importe quel concept. GaAlBrain construit l'évaluation depuis sa base de connaissances." tag="Sans fichier" />
            </div>

            {type === "doc" && (
              <div className="mt-5 rounded-xl p-10 text-center" style={{ border: "2px dashed var(--border)" }}>
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck2 size={20} style={{ color: "var(--green)" }} />
                    <span style={{ fontWeight: 500 }}>{file.name}</span>
                    <button onClick={() => { setFile(null); setFileName(null); }} className="p-1"><X size={16} style={{ color: "var(--text-muted)" }} /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 mx-auto cursor-pointer">
                    <Upload size={36} style={{ color: "var(--purple-mid)" }} />
                    <span style={{ fontWeight: 500 }}>Glisse ton fichier ici</span>
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>ou clique pour parcourir · PDF, DOCX, TXT · Max 10MB</span>
                    <input type="file" accept=".pdf,.docx,.txt" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setFileName(f.name); }}} hidden />
                  </label>
                )}
              </div>
            )}
            {type === "code" && (
              <div className="mt-5">
                <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>Lien GitHub</label>
                <input className="auth-input" placeholder="https://github.com/username/repository" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
              </div>
            )}
            {type === "generic" && (
              <div className="mt-5">
                <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>Concept à évaluer</label>
                <input className="auth-input" placeholder="Ex : récursivité en Python, thermodynamique, droit des contrats..." value={concept} onChange={(e) => setConcept(e.target.value)} />
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Algorithmique", "Physique", "Biologie", "Droit", "Économie", "Maths"].map((p) => (
                    <button key={p} type="button" onClick={() => setConcept(p)} className="px-3 py-1 rounded-full text-[12px]" style={{ background: "#fff", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            <button disabled={!type} onClick={() => setStep(2)} className="btn-primary w-full mt-6" style={{ opacity: type ? 1 : 0.4, cursor: type ? "pointer" : "not-allowed" }}>Continuer</button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-8">
            <p className="label-eyebrow mb-2" style={{ color: "var(--orange)" }}>Étape 2 sur 3</p>
            <h2 className="h2-display mb-6">Sur quoi et à quel point ?</h2>
            <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>Concept principal</label>
            <input className="auth-input mb-6" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="Ex: Thermodynamique" />
            <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>À quel point tu maîtrises ce concept ?</label>
            <input type="range" min={0} max={100} value={confidence} onChange={(e) => setConfidence(+e.target.value)} className="w-full" style={{ accentColor: confidence < 34 ? "var(--green)" : confidence < 67 ? "var(--orange)" : "var(--red)" }} />
            <div className="text-center my-3" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 48, color: "var(--purple-dark)" }}>{confidence}%</div>
            <p className="text-center text-[13px]" style={{ color: "var(--text-secondary)" }}>{confidence < 34 ? "J'explore" : confidence < 67 ? "Je connais les bases" : "Je maîtrise"}</p>
            {confidence > 80 && (
              <div className="mt-4 p-4 rounded-xl flex items-start gap-3" style={{ background: "var(--orange-light)", border: "1px solid var(--orange)" }}>
                <AlertTriangle size={20} style={{ color: "var(--orange)", flexShrink: 0 }} />
                <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>Attention : l'évaluation sera particulièrement approfondie à ce niveau de confiance.</p>
              </div>
            )}

            <div className="mt-6">
              <label className="text-[13px] block mb-2" style={{ fontWeight: 500 }}>Combien de temps tu as ?</label>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className="px-4 py-2 rounded-lg text-[13px] transition-all"
                    style={{
                      background: duration === d ? "var(--purple-mid)" : "#fff",
                      color: duration === d ? "#fff" : "var(--text-primary)",
                      border: `1px solid ${duration === d ? "var(--purple-mid)" : "var(--border)"}`,
                      fontWeight: 500,
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(3)} className="btn-primary w-full mt-6">Continuer →</button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <p className="label-eyebrow mb-2" style={{ color: "var(--orange)" }}>Étape 3 sur 3</p>
            <h2 className="h2-display mb-6">Prêt ?</h2>
            <div className="card-white">
              <h3 className="h3-display mb-4">Récapitulatif de ta session</h3>
              <div className="flex flex-col gap-3 text-[14px]">
                <Row icon={FileText} text={`Type : ${type === "doc" ? "Document" : type === "code" ? "Code" : "Sujet libre"}`} />
                <Row icon={BookOpen} text={`Concept : ${concept}`} />
                <Row icon={Target} text={`Confiance déclarée : ${confidence}%`} />
                <Row icon={Clock} text={`Durée définie : ${duration} min`} />
              </div>
              <div className="h-px my-4" style={{ background: "var(--border)" }} />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>L'IA ne te donnera jamais les réponses directement. Elle évalue ton raisonnement par des questions ciblées.</p>
            </div>
            <button onClick={handleStartSession} disabled={isLoading || !concept.trim()} className="btn-primary w-full mt-6 flex items-center justify-center gap-2" style={{ opacity: isLoading || !concept.trim() ? 0.6 : 1, cursor: isLoading || !concept.trim() ? "not-allowed" : "pointer" }}>
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLoading ? "Création..." : "Commencer l'évaluation →"}
            </button>
            <button onClick={() => setStep(1)} className="block mx-auto mt-3 text-[14px]" style={{ color: "var(--text-secondary)" }}>Modifier</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n, i) => (
        <div key={n}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium"
            style={{
              background: n < step ? "var(--green)" : n === step ? "var(--purple-mid)" : "#fff",
              color: n <= step ? "#fff" : "var(--text-muted)",
              border: n > step ? "1px solid var(--border)" : "none",
            }}>
            {n < step ? <Check size={14} /> : `0${n}`}
          </div>
          {i < 2 && <div className="flex-1 h-px" style={{ background: "var(--border)" }} />}
        </div>
      ))}
    </div>
  );
}

function TypeCard({ active, onClick, icon: Icon, iconColor, border, bg, title, desc, tag }: any) {
  return (
    <button onClick={onClick} className="text-left p-5 rounded-2xl transition-all"
      style={{ background: active ? bg : "#fff", border: `2px solid ${active ? border : "var(--border)"}` }}>
      <Icon size={28} strokeWidth={1.6} style={{ color: iconColor }} />
      <h3 className="h3-display mt-3" style={{ fontSize: 18 }}>{title}</h3>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6 }}>{desc}</p>
      <span className="text-[11px] mt-2 inline-block px-2 py-1 rounded" style={{ background: "var(--border)", color: "var(--text-muted)" }}>{tag}</span>
    </button>
  );
}

function Row({ icon: Icon, text }: any) {
  return <div className="flex items-center gap-3"><Icon size={18} style={{ color: "var(--purple-mid)" }} /><span>{text}</span></div>;
}