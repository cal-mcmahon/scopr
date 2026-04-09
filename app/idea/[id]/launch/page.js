"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { wordmark } from "@/lib/design-system";

const generatingMessages = [
  "// writing your one pager...",
  "// scoping your MVP...",
  "// drafting your product spec...",
  "// almost ready...",
];

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
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

/** First two complete sentences; no ellipsis mid-sentence. */
function firstTwoSentencesFromFullPlan(text) {
  if (typeof text !== "string") return "";
  const t = text.trim();
  if (!t) return "";
  const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1]}`.trim();
  return parts[0] || t;
}

export default function IdeaLaunchPackPage() {
  const params = useParams();
  const router = useRouter();
  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const previewRef = useRef(null);

  const [phase, setPhase] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [marketScore, setMarketScore] = useState(null);
  const [founderScore, setFounderScore] = useState(null);
  const [fullPlan, setFullPlan] = useState("");
  const [decisionSummary, setDecisionSummary] = useState(null);
  const [launchPack, setLaunchPack] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [typedHeroSubtext, setTypedHeroSubtext] = useState("");

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

    async function init() {
      setPhase("loading");
      setErrorMessage("");

      try {
        const [ideaRes, decisionRes, packRes] = await Promise.all([
          supabase.from("ideas").select("title").eq("id", ideaId).single(),
          supabase
            .from("decisions")
            .select("market_score, founder_score, full_plan, decision_summary, decision")
            .eq("idea_id", ideaId)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("launch_packs")
            .select("one_pager, mvp_scope, prd")
            .eq("idea_id", ideaId)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        if (ideaRes.error) throw ideaRes.error;
        if (decisionRes.error) throw decisionRes.error;

        const title =
          typeof ideaRes.data?.title === "string" ? ideaRes.data.title.trim() : "";
        setIdeaTitle(title || "Untitled idea");

        const dec = decisionRes.data;
        if (!dec || dec.decision !== "build") {
          router.replace(`/idea/${ideaId}/decision`);
          return;
        }

        setMarketScore(clampScore(dec.market_score));
        setFounderScore(clampScore(dec.founder_score));
        setFullPlan(typeof dec.full_plan === "string" ? dec.full_plan : "");
        setDecisionSummary(
          typeof dec.decision_summary === "string" && dec.decision_summary.trim()
            ? dec.decision_summary.trim()
            : null
        );

        if (
          packRes.data?.one_pager &&
          packRes.data?.mvp_scope &&
          packRes.data?.prd &&
          !packRes.error
        ) {
          setLaunchPack({
            one_pager: packRes.data.one_pager,
            mvp_scope: packRes.data.mvp_scope,
            prd: packRes.data.prd,
          });
          setPhase("ready");
          return;
        }

        if (cancelled) return;
        setPhase("generating");

        const res = await fetch("/api/idea/launch-pack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea_id: ideaId }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data?.success || !data?.launch_pack) {
          throw new Error(data?.error || "Launch pack failed");
        }
        setLaunchPack(data.launch_pack);
        setPhase("ready");
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorMessage(
            "⚠ Something went wrong preparing your launch pack. Give it another go."
          );
          setPhase("error");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [ideaId, router]);

  useEffect(() => {
    if (phase !== "generating") return;
    const timer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % generatingMessages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (selectedCard && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCard]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  useEffect(() => {
    const heroSubtext =
      "Everything you need to start — already done. Pick your starting point and go.";
    if (phase !== "ready") {
      setTypedHeroSubtext("");
      return;
    }
    setTypedHeroSubtext("");
    let index = 0;
    let intervalId;
    const delayId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setTypedHeroSubtext(heroSubtext.slice(0, index));
        if (index >= heroSubtext.length) {
          window.clearInterval(intervalId);
        }
      }, 35);
    }, 500);
    return () => {
      window.clearTimeout(delayId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [phase]);

  const ideaTitleLine = ideaTitle?.trim() ? ideaTitle.trim() : "Untitled idea";

  const previewContent =
    selectedCard === "one_pager"
      ? launchPack?.one_pager
      : selectedCard === "mvp"
        ? launchPack?.mvp_scope
        : selectedCard === "prd"
          ? launchPack?.prd
          : "";

  const previewTitle =
    selectedCard === "one_pager"
      ? "Your idea in one page"
      : selectedCard === "mvp"
        ? "What to build first"
        : selectedCard === "prd"
          ? "Your product spec"
          : "";

  async function handleCopy() {
    if (!previewContent) return;
    try {
      await navigator.clipboard.writeText(previewContent);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const scoreBar = (score, color) => (
    <div className="mt-3 h-2 w-full overflow-hidden rounded-sm bg-[rgba(255,255,255,0.08)]">
      <div
        className="h-full rounded-sm transition-all duration-500"
        style={{
          width: `${score === null ? 0 : score}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );

  const cardBase =
    "rounded-sm border p-5 text-left transition-colors duration-200";
  const cardIdle = "border-[rgba(255,255,255,0.06)] bg-[rgba(26,27,33,0.6)]";

  const scoprSaysDisplay = useMemo(() => {
    if (decisionSummary) return decisionSummary;
    return firstTwoSentencesFromFullPlan(fullPlan);
  }, [decisionSummary, fullPlan]);

  const interactivePackCard = (selected) =>
    [
      "rounded-sm border border-[rgba(255,255,255,0.06)] border-l-2 p-5 text-left transition-colors duration-200",
      selected
        ? "border-l-[#4ADE80] bg-[rgba(74,222,128,0.06)] hover:border-l-[#4ADE80]"
        : "border-l-[rgba(74,222,128,0.4)] hover:border-l-[rgba(74,222,128,0.8)]",
    ].join(" ");

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#e2e2e9]">

      {phase === "loading" ? (
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <p className="text-center font-mono text-base text-[#4ADE80] sm:text-lg">
            {"// loading your launch pack..."}
          </p>
        </div>
      ) : null}

      {phase === "error" ? (
        <main className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
          <p className="text-base text-[#f97373] sm:text-lg">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              setPhase("loading");
              window.location.reload();
            }}
            className="mt-6 rounded-sm border border-[rgba(74,222,128,0.3)] bg-transparent px-4 py-2 font-mono text-sm text-[#4ADE80] transition hover:bg-[rgba(26,27,33,0.4)]"
          >
            {"// try again →"}
          </button>
        </main>
      ) : null}

      {phase === "generating" ? (
        <>
          <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
              <div style={wordmark.icon}>&gt;_</div>
              <span style={wordmark.text}>
                Scop<span style={wordmark.accent}>r</span>
              </span>
            </Link>
            <Link
              href={`/idea/${ideaId}/decision`}
              className="font-mono text-xs text-[rgba(188,202,187,0.6)] underline-offset-4 hover:text-[#e2e2e9] hover:underline sm:text-sm"
            >
              {"// back to decision →"}
            </Link>
          </nav>

          <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-3xl flex-col items-center justify-center px-4 sm:px-6">
            <p className="font-mono text-base text-[#4ADE80] sm:text-lg">
              {"// preparing your launch pack..."}
            </p>
            <div className="relative mt-6 min-h-[2.5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={generatingMessages[messageIndex]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="text-center font-mono text-sm text-[rgba(188,202,187,0.6)] sm:text-base"
                >
                  {generatingMessages[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="mt-8 h-[2px] w-full max-w-md overflow-hidden rounded-sm bg-[rgba(74,222,128,0.18)]">
              <motion.div
                className="h-full w-1/3 bg-[#4ADE80]"
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              />
            </div>
          </main>
        </>
      ) : null}

      {phase === "ready" ? (
        <>
          <style jsx global>{`
            @keyframes blink {
              0%,
              100% {
                opacity: 1;
              }
              50% {
                opacity: 0;
              }
            }
          `}</style>
          <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <Link
          href={`/idea/${ideaId}/decision`}
          className="font-mono text-xs text-[rgba(188,202,187,0.6)] underline-offset-4 hover:text-[#e2e2e9] hover:underline sm:text-sm"
        >
          {"// back to decision →"}
        </Link>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="mx-auto max-w-4xl">
          <p className="font-mono text-sm text-[#4ADE80]">
            {"// your launch pack is ready"}
            <span
              aria-hidden
              style={{
                animation: "blink 1s step-end infinite",
                width: "10px",
                height: "1em",
                background: "#4ADE80",
                display: "inline-block",
                verticalAlign: "middle",
                marginLeft: "4px",
              }}
            />
          </p>
          <h1
            className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#e2e2e9] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, system-ui, sans-serif" }}
          >
            {`${ideaTitleLine} is worth `}
            <span
              style={{
                background: "linear-gradient(135deg, #4ADE80 0%, #22c55e 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {"building."}
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[rgba(188,202,187,0.85)] sm:text-lg">
            {typedHeroSubtext}
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className="rounded-sm border border-[rgba(255,255,255,0.06)] p-5"
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">{"// market score"}</p>
            <p className="mt-2 font-mono text-4xl font-bold text-[#4ADE80]">
              {marketScore === null ? "—" : marketScore}
            </p>
            {scoreBar(marketScore, "#4ADE80")}
          </div>
          <div
            className="rounded-sm border border-[rgba(255,255,255,0.06)] p-5"
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">{"// founder score"}</p>
            <p className="mt-2 font-mono text-4xl font-bold text-[#4ADE80]">
              {founderScore === null ? "—" : founderScore}
            </p>
            {scoreBar(founderScore, "#4ADE80")}
          </div>
          <div
            className="rounded-sm border border-[rgba(255,255,255,0.06)] p-5"
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <p className="font-mono text-xs text-[rgba(188,202,187,0.6)]">{"// decision"}</p>
            <p className="mt-2 text-2xl font-bold text-[#4ADE80]">Build it</p>
            <div className="mt-8 h-2 w-full overflow-hidden rounded-sm bg-[rgba(255,255,255,0.08)]">
              <div className="h-full w-full rounded-sm bg-[#4ADE80]" />
            </div>
          </div>
        </section>

        {scoprSaysDisplay ? (
          <div
            className="mx-auto mt-6 max-w-6xl border-l-[3px] border-[#4ADE80] px-5 py-4"
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderLeft: "3px solid #4ADE80",
            }}
          >
            <p className="font-mono text-xs text-[#4ADE80]">{"// scopr says"}</p>
            <div
              className="scopr-says-scroll mt-3 max-h-[120px] overflow-y-auto pr-1 text-sm leading-relaxed text-[#e2e2e9]/95 sm:text-base"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(74, 222, 128, 0.35) rgba(255, 255, 255, 0.06)" }}
            >
              <p className="whitespace-pre-wrap">{scoprSaysDisplay}</p>
            </div>
          </div>
        ) : null}

        <p className="mx-auto mt-10 max-w-6xl font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(188,202,187,0.5)] sm:text-xs">
          YOUR LAUNCH PACK — CLICK ANY CARD TO PREVIEW
        </p>

        <div
          className="mx-auto mt-6 grid max-w-6xl gap-4"
          style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
        >
          <button
            type="button"
            onClick={() => setSelectedCard(selectedCard === "one_pager" ? null : "one_pager")}
            className={`${interactivePackCard(selectedCard === "one_pager")} cursor-pointer text-left`}
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <span className="text-2xl" aria-hidden>
              📋
            </span>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">Your idea in one page</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              {`Everything about ${ideaTitleLine}, written up clearly. Share it with anyone.`}
            </p>
            <p className="mt-4 font-mono text-xs text-[#4ADE80]">{"// read it →"}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCard(selectedCard === "mvp" ? null : "mvp")}
            className={`${interactivePackCard(selectedCard === "mvp")} cursor-pointer text-left`}
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <span className="text-2xl" aria-hidden>
              🎯
            </span>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">What to build first</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              Your MVP — the smallest version that proves the idea works.
            </p>
            <p className="mt-4 font-mono text-xs text-[#4ADE80]">{"// read it →"}</p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCard(selectedCard === "prd" ? null : "prd")}
            className={`${interactivePackCard(selectedCard === "prd")} cursor-pointer text-left`}
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <span className="text-2xl" aria-hidden>
              📐
            </span>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">Your product spec</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              A full PRD. What it does, who it&apos;s for, how it works.
            </p>
            <p className="mt-4 font-mono text-xs text-[#4ADE80]">{"// read it →"}</p>
          </button>

        </div>

        <div
          className="mx-auto mt-4 grid max-w-6xl gap-4"
          style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
        >
          <div
            className={`${cardBase} ${cardIdle} border-l-0 opacity-50`}
            style={{
              pointerEvents: "none",
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl" aria-hidden>
                ✨
              </span>
              <span className="rounded-sm bg-[rgba(239,159,39,0.2)] px-2 py-0.5 font-mono text-[10px] text-[#EF9F27]">
                v2
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">What it could look like</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              A visual concept of your product.
            </p>
            <p className="mt-4 font-mono text-xs text-[rgba(188,202,187,0.35)]">
              {"// coming in v2"}
            </p>
          </div>

          <div
            className={`${cardBase} ${cardIdle} border-l-0 opacity-50`}
            style={{
              pointerEvents: "none",
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl" aria-hidden>
                💬
              </span>
              <span className="rounded-sm bg-[rgba(136,135,128,0.25)] px-2 py-0.5 font-mono text-[10px] text-[#888780]">
                v3
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">Start building in Cursor</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              Ready-to-paste prompts. Open Cursor, paste prompt 1, go.
            </p>
            <p className="mt-4 font-mono text-xs text-[rgba(188,202,187,0.35)]">
              {"// coming in v3"}
            </p>
          </div>

          <div
            className={`${cardBase} ${cardIdle} border-l-0 opacity-50`}
            style={{
              pointerEvents: "none",
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl" aria-hidden>
                🐙
              </span>
              <span className="rounded-sm bg-[rgba(136,135,128,0.25)] px-2 py-0.5 font-mono text-[10px] text-[#888780]">
                v3
              </span>
            </div>
            <h3 className="mt-2 font-semibold text-[#e2e2e9]">Your GitHub repo</h3>
            <p className="mt-2 text-sm text-[rgba(188,202,187,0.6)]">
              Project structure, README and files — ready to go.
            </p>
            <p className="mt-4 font-mono text-xs text-[rgba(188,202,187,0.35)]">
              {"// coming in v3"}
            </p>
          </div>
        </div>

        {selectedCard && previewContent ? (
          <div
            ref={previewRef}
            className="mx-auto mt-10 max-w-6xl rounded-sm border border-[rgba(255,255,255,0.06)] p-6 sm:p-8"
            style={{
              background: "rgba(26, 27, 33, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <p className="font-mono text-sm text-[#4ADE80]">{`// ${previewTitle}`}</p>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-sm border border-[rgba(74,222,128,0.3)] bg-transparent px-3 py-1.5 font-mono text-xs text-[#4ADE80] transition hover:bg-[rgba(26,27,33,0.8)]"
              >
                {copied ? "// copied ✓" : "// copy →"}
              </button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[#e2e2e9]/95 sm:text-base">
              {paragraphsFromText(previewContent).map((p, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto mt-12 flex max-w-6xl flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-sm px-6 py-3 font-mono text-sm"
              style={{
                backgroundColor: "#4ADE80",
                color: "#0a0a0a",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 0 20px rgba(74,222,128,0.25)",
              }}
            >
              {"// ready to build? →"}
            </Link>
            <Link
              href={`/idea/${ideaId}/export`}
              className="inline-flex items-center justify-center rounded-sm border border-[rgba(74,222,128,0.3)] bg-transparent px-6 py-3 font-mono text-sm text-[#4ADE80] transition hover:bg-[rgba(26,27,33,0.5)]"
              style={{ textDecoration: "none" }}
            >
              {"// export as markdown →"}
            </Link>
          </div>
          <p className="font-mono text-xs text-[#4ADE80]/80 sm:text-right">saved to: Build it</p>
        </div>
      </main>
        </>
      ) : null}
    </div>
  );
}
