"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { wordmark } from "@/lib/design-system";

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function fallbackHeadline(decision) {
  if (decision === "build") return "your idea is ready to build";
  if (decision === "refine") return "your idea needs a little work";
  if (decision === "revisit") return "your idea is worth keeping";
  return "your decision is ready";
}

function paragraphsFromText(text) {
  if (typeof text !== "string") return [];
  const raw = text.trim();
  if (!raw) return [];

  return raw
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default function IdeaDecisionPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const particleCanvasRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [decisionRow, setDecisionRow] = useState(null);

  const decision = decisionRow?.decision;
  const decisionConfig = useMemo(() => {
    if (decision === "build") {
      return {
        header: "// you're ready to build",
        accent: "#4ADE80",
        opening: "Your idea has real potential and you're the right person to build it.",
        cta: { label: "// ready to build? →", href: `/idea/${ideaId}/launch`, kind: "primary" },
      };
    }

    if (decision === "refine") {
      return {
        header: "// almost there",
        accent: "#EF9F27",
        opening: "Your idea has something real in it. Here's exactly what to work on.",
        cta: { label: "// let's refine it →", href: `/idea/${ideaId}/questions`, kind: "secondary" },
      };
    }

    return {
      header: "// your idea isn't gone",
      accent: "#888780",
      opening: "The timing isn't right — but your idea is worth keeping.",
      cta: { label: "// back to dashboard →", href: "/dashboard", kind: "secondary" },
    };
  }, [decision, ideaId]);

  useEffect(() => {
    async function guard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.replace("/auth");
    }
    guard();
  }, [router]);

  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;

    async function loadDecision() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [decisionRes, ideaRes] = await Promise.all([
          supabase
            .from("decisions")
            .select(
              [
                "decision",
                "decision_headline",
                "decision_summary",
                "market_score",
                "founder_score",
                "market_analysis",
                "founder_analysis",
                "next_step",
                "full_plan",
              ].join(",")
            )
            .eq("idea_id", ideaId)
            .single(),
          supabase.from("ideas").select("title").eq("id", ideaId).single(),
        ]);

        if (decisionRes.error) throw decisionRes.error;
        if (ideaRes.error) throw ideaRes.error;

        if (cancelled) return;
        setDecisionRow(decisionRes.data || null);
        setIdeaTitle(typeof ideaRes.data?.title === "string" ? ideaRes.data.title : "");
      } catch (err) {
        console.error(err);
        if (!cancelled) setErrorMessage("⚠ Something went wrong fetching your decision. Try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDecision();
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.25 + 0.1,
    }));

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -4) {
          p.y = window.innerHeight + 4;
          p.x = Math.random() * window.innerWidth;
        }
        ctx.beginPath();
        ctx.fillStyle = `${decisionConfig.accent}33`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, [decisionConfig.accent]);

  const decisionHeadline =
    typeof decisionRow?.decision_headline === "string" && decisionRow.decision_headline.trim()
      ? decisionRow.decision_headline.trim()
      : fallbackHeadline(decisionRow?.decision);

  const decisionSummary =
    typeof decisionRow?.decision_summary === "string" && decisionRow.decision_summary.trim()
      ? decisionRow.decision_summary.trim()
      : null;

  const marketScore = clampScore(decisionRow?.market_score);
  const founderScore = clampScore(decisionRow?.founder_score);

  const marketAnalysis =
    typeof decisionRow?.market_analysis === "string" && decisionRow.market_analysis.trim()
      ? decisionRow.market_analysis.trim()
      : null;
  const founderAnalysis =
    typeof decisionRow?.founder_analysis === "string" && decisionRow.founder_analysis.trim()
      ? decisionRow.founder_analysis.trim()
      : null;
  const nextStep =
    typeof decisionRow?.next_step === "string" && decisionRow.next_step.trim()
      ? decisionRow.next_step.trim()
      : null;
  const fullPlan =
    typeof decisionRow?.full_plan === "string" && decisionRow.full_plan.trim()
      ? decisionRow.full_plan.trim()
      : null;

  const ideaTitleLine = ideaTitle?.trim() ? ideaTitle.trim() : "Untitled idea";

  const pillStyle = {
    backgroundColor: `${decisionConfig.accent}33`,
    borderColor: `${decisionConfig.accent}66`,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#111318] text-[#e2e2e9]">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <canvas ref={particleCanvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="font-mono text-xs text-[rgba(188,202,187,0.6)] underline-offset-4 hover:text-[#e2e2e9] hover:underline sm:text-sm"
        >
          {"// back to dashboard"}
        </Link>
      </nav>

      {isLoading ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-4xl items-center justify-center px-4 sm:px-6">
          <p className="text-center font-mono text-base sm:text-lg" style={{ color: decisionConfig.accent }}>
            {"// loading your decision..."}
          </p>
        </main>
      ) : errorMessage ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-4xl items-center justify-center px-4 sm:px-6">
          <div className="max-w-xl text-center">
            <p className="text-base text-[#f97373] sm:text-lg">{errorMessage}</p>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="mt-5 rounded-sm border border-[rgba(255,255,255,0.08)] bg-transparent px-4 py-2 font-mono text-xs text-[#e2e2e9] transition hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(26,27,33,0.4)] sm:text-sm"
            >
              {"// try again →"}
            </button>
          </div>
        </main>
      ) : !decisionRow ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-4xl items-center justify-center px-4 sm:px-6">
          <p className="text-center font-mono text-base text-[rgba(188,202,187,0.6)] sm:text-lg">
            {"⚠ We couldn't find a decision for this idea yet."}
          </p>
        </main>
      ) : (
        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <section className="mx-auto max-w-4xl">
            <p className="font-mono text-sm" style={{ color: decisionConfig.accent }}>
              {decisionConfig.header}
            </p>
            <p className="mt-3 font-mono text-xs text-[rgba(188,202,187,0.6)]">{`// idea: ${ideaTitleLine}`}</p>

            <h1
              className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl"
              style={{ fontFamily: "var(--font-space-grotesk), Inter, system-ui, sans-serif" }}
            >
              {decisionHeadline}
            </h1>

            <p className="mt-4 text-lg text-[#e2e2e9]/90 sm:text-xl">{decisionConfig.opening}</p>
            {decisionSummary ? (
              <p className="mt-3 text-sm leading-relaxed text-[rgba(188,202,187,0.6)] sm:text-base">
                {decisionSummary}
              </p>
            ) : null}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-sm border px-4 py-3"
                style={{ ...pillStyle, backdropFilter: "blur(8px)" }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">Market</p>
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">/100</p>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4">
                  <p className="font-mono text-2xl font-bold" style={{ color: decisionConfig.accent }}>
                    {marketScore === null ? "—" : String(marketScore)}
                  </p>
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">score</p>
                </div>
              </div>

              <div
                className="rounded-sm border px-4 py-3"
                style={{ ...pillStyle, backdropFilter: "blur(8px)" }}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">Founder</p>
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">/100</p>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-4">
                  <p className="font-mono text-2xl font-bold" style={{ color: decisionConfig.accent }}>
                    {founderScore === null ? "—" : String(founderScore)}
                  </p>
                  <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">score</p>
                </div>
              </div>
            </div>
          </section>

          {(marketAnalysis || founderAnalysis) && (
            <section className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-2">
              {marketAnalysis ? (
                <article
                  className="rounded-sm border border-[rgba(255,255,255,0.06)] border-l-[3px] p-6"
                  style={{
                    borderLeftColor: decisionConfig.accent,
                    background: "rgba(26, 27, 33, 0.4)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <p className="font-mono text-sm" style={{ color: decisionConfig.accent }}>
                    {"// market analysis"}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#e2e2e9]/90">
                    {marketAnalysis}
                  </p>
                </article>
              ) : null}

              {founderAnalysis ? (
                <article
                  className="rounded-sm border border-[rgba(255,255,255,0.06)] border-l-[3px] p-6"
                  style={{
                    borderLeftColor: decisionConfig.accent,
                    background: "rgba(26, 27, 33, 0.4)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <p className="font-mono text-sm" style={{ color: decisionConfig.accent }}>
                    {"// founder analysis"}
                  </p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#e2e2e9]/90">
                    {founderAnalysis}
                  </p>
                </article>
              ) : null}
            </section>
          )}

          {nextStep ? (
            <section className="mx-auto mt-10 max-w-4xl">
              <p className="font-mono text-sm" style={{ color: decisionConfig.accent }}>
                {"// your next step"}
              </p>
              <div
                className="mt-4 rounded-sm border border-[rgba(255,255,255,0.06)] border-l-[3px] p-6"
                style={{
                  borderLeftColor: decisionConfig.accent,
                  background: "rgba(26, 27, 33, 0.4)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <p className="text-lg font-semibold leading-relaxed text-[#e2e2e9] sm:text-xl">
                  {nextStep}
                </p>
              </div>
            </section>
          ) : null}

          {fullPlan ? (
            <section className="mx-auto mt-10 max-w-4xl">
              <p className="font-mono text-sm" style={{ color: decisionConfig.accent }}>
                {"// your full plan"}
              </p>
              <div
                className="mt-4 rounded-sm border border-[rgba(255,255,255,0.06)] p-6"
                style={{
                  background: "rgba(26, 27, 33, 0.28)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="space-y-4 text-sm leading-relaxed text-[#e2e2e9]/90 sm:text-base">
                  {paragraphsFromText(fullPlan).map((p, idx) => (
                    <p key={idx} className="whitespace-pre-wrap">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="mx-auto mt-12 flex max-w-4xl justify-start">
            {decision === "build" ? (
              <Link
                href={decisionConfig.cta.href}
                className="inline-flex items-center justify-center rounded-sm px-6 py-4 font-mono text-sm font-bold text-[#0a0a0a] transition hover:brightness-110"
                style={{
                  backgroundColor: decisionConfig.accent,
                  boxShadow: `0 0 24px ${decisionConfig.accent}33`,
                }}
              >
                {decisionConfig.cta.label}
              </Link>
            ) : (
              <Link
                href={decisionConfig.cta.href}
                className="inline-flex items-center justify-center rounded-sm border px-6 py-4 font-mono text-sm transition hover:bg-[rgba(26,27,33,0.4)]"
                style={{
                  borderColor: `${decisionConfig.accent}66`,
                  color: decisionConfig.accent,
                  backgroundColor: "transparent",
                }}
              >
                {decisionConfig.cta.label}
              </Link>
            )}
          </section>
        </main>
      )}
    </div>
  );
}
