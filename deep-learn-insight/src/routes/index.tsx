import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ForWho } from "@/components/landing/ForWho";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { Footer } from "@/components/landing/Footer";

const TITLE = "GaAlBrain IA — Révèle ce que tu comprends vraiment";
const DESCRIPTION =
  "GaAlBrain IA cartographie ta compréhension réelle. Upload ton cours, soumets ton code, choisis un sujet — l'IA socratique évalue ce que tu sais vraiment.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text-primary)" }}>
      <Navbar />
      <main>
        <Hero />
        <section id="features">
          <HowItWorks />
        </section>
        <ForWho />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
