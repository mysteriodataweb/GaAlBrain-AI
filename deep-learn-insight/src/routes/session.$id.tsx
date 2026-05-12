import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Loader2, MessageCircle, Send, Square } from "lucide-react";
import { useEndSession, useSession, useSendMessage } from "@/hooks/useApi";

export const Route = createFileRoute("/session/$id")({
  head: () => ({
    meta: [
      { title: "Evaluation en cours - GaAlBrain IA" },
      { name: "description", content: "Session d'evaluation socratique en cours." },
    ],
  }),
  component: Arena,
});

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

function Arena() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessionResponse, isLoading: sessionLoading } = useSession(id);
  const sendMessageMutation = useSendMessage();
  const endSessionMutation = useEndSession();

  const [confidence, setConfidence] = useState(65);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pasteSuspected, setPasteSuspected] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const session = sessionResponse?.data?.session;
  const isSessionActive = session?.status === "active";

  useEffect(() => {
    const sessionData = sessionResponse?.data;
    if (!sessionData) return;

    if (Array.isArray(sessionData.messages) && sessionData.messages.length > 0) {
      setMessages(
        sessionData.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.created_at,
        })),
      );
      return;
    }

    setMessages([
      {
        role: "assistant",
        content: "Session chargee, mais aucune question n'a ete trouvee.",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [sessionResponse]);

  useEffect(() => {
    const createdAt = session?.created_at;
    const durationMinutes = session?.duration_minutes || 15;
    if (!createdAt) return;

    const updateElapsed = () => {
      const start = new Date(createdAt).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(elapsed);
      
      const remaining = Math.max(0, durationMinutes * 60 - elapsed);
      setTimeRemaining(remaining);
      
      // Auto-end session when time is up
      if (remaining === 0 && isSessionActive && !endSessionMutation.isPending) {
        endSession();
      }
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [session?.created_at, session?.duration_minutes, isSessionActive, endSessionMutation.isPending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoadingQuestion]);

  const statusLabel = useMemo(() => {
    if (!session) return "";
    if (session.status === "completed") return "Terminee";
    if (session.status === "abandoned") return "Abandonnee";
    return "Evaluation active";
  }, [session]);

  const send = async () => {
    if (!input.trim() || !id || !isSessionActive) return;

    const content = input.trim();
    const wasPasteSuspected = pasteSuspected;
    setMessages((current) => [
      ...current,
      { role: "user", content, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setPasteSuspected(false);
    setIsLoadingQuestion(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        sessionId: id,
        data: {
          content,
          confidenceBet: confidence,
          isPasteSuspected: wasPasteSuspected,
        },
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.data.question,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Erreur:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Erreur lors du traitement. Reessaie dans un instant.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const endSession = async () => {
    if (!id || endSessionMutation.isPending) return;
    if (!isSessionActive) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }

    try {
      await endSessionMutation.mutateAsync(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["session", id] }),
      ]);
      navigate({ to: "/dashboard", replace: true });
    } catch (error: any) {
      console.error("Erreur fin de session:", error);
      const details = error?.response?.data?.error || error?.message || "";
      alert(`Impossible de terminer la session pour le moment${details ? `: ${details}` : ""}`);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "var(--purple-mid)" }} />
          <p style={{ color: "var(--text-secondary)" }}>Chargement de la session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p style={{ color: "var(--text-muted)" }}>Session non trouvee</p>
          <Link to="/session/setup" className="text-purple mt-4">Creer une nouvelle session</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--bg)" }}>
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b sticky top-0 z-10" style={{ background: "#fff", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--purple-dark)" }}>GaAlBrain IA</Link>
          <span className="px-2 py-0.5 rounded text-[11px] truncate max-w-[180px]" style={{ background: "var(--purple-light)", color: "var(--purple-dark)" }}>{session.concept}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full label-eyebrow" style={{ background: timeRemaining !== null && timeRemaining < 300 ? "var(--red)" : "var(--purple-light)", color: timeRemaining !== null && timeRemaining < 300 ? "#fff" : "var(--purple-mid)" }}>
          <Clock3 size={14} /> {timeRemaining !== null ? formatDuration(timeRemaining) : formatDuration(elapsedSeconds)} · {statusLabel}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-[13px]" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Session #{id.substring(0, 8)}</span>
          <button
            onClick={endSession}
            disabled={endSessionMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px]"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              cursor: endSessionMutation.isPending ? "not-allowed" : "pointer",
              opacity: endSessionMutation.isPending ? 0.6 : 1,
            }}
          >
            {endSessionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
            {isSessionActive ? "Terminer" : "Tableau de bord"}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageCircle size={48} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
              <p style={{ color: "var(--text-muted)" }}>En attente de la premiere question...</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={`flex gap-3 items-start ${msg.role === "assistant" ? "max-w-[88%]" : "justify-end max-w-[88%] ml-auto"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                  style={{ background: "var(--purple-mid)" }}
                >
                  G
                </div>
              )}
              <div
                className="rounded-2xl px-4 py-3 text-[14px]"
                style={{
                  background: msg.role === "assistant" ? "#f5f5f8" : "var(--purple-mid)",
                  color: msg.role === "assistant" ? "var(--text-primary)" : "#fff",
                  maxWidth: "100%",
                  wordWrap: "break-word",
                }}
              >
                <div>{msg.content}</div>
                <div
                  className="mt-1 text-[11px]"
                  style={{ color: msg.role === "assistant" ? "var(--text-muted)" : "rgba(255,255,255,0.72)" }}
                >
                  {formatMessageTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoadingQuestion && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ background: "var(--purple-mid)" }}>
              G
            </div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-2 text-[13px]" style={{ background: "#f5f5f8", color: "var(--text-secondary)" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--purple-mid)" }} />
              Analyse de ton raisonnement...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-4" style={{ background: "#fff", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="label-eyebrow" style={{ color: "var(--text-muted)" }}>Confiance</span>
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => setConfidence(+e.target.value)}
            className="flex-1"
            disabled={!isSessionActive}
            style={{ accentColor: confidence < 34 ? "var(--green)" : confidence < 67 ? "var(--orange)" : "var(--red)" }}
          />
          <span style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)", width: 36 }}>{confidence}%</span>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={() => setPasteSuspected(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                send();
              }
            }}
            placeholder={isSessionActive ? "Tape ta reponse ici..." : "Cette session est terminee."}
            rows={2}
            className="flex-1 auth-input resize-none"
            disabled={isLoadingQuestion || !isSessionActive}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoadingQuestion || !isSessionActive}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: input.trim() && !isLoadingQuestion && isSessionActive ? "var(--purple-mid)" : "var(--border)",
              color: "#fff",
              cursor: input.trim() && !isLoadingQuestion && isSessionActive ? "pointer" : "not-allowed",
            }}
          >
            {isLoadingQuestion ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatMessageTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
