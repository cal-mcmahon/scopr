"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { wordmark } from "@/lib/design-system";

function TerminalComment({ text }: { text: string }) {
  return (
    <p className="font-mono text-[0.875rem] leading-normal text-[#4ADE80]">
      {text}
      <span
        aria-hidden="true"
        className="terminal-cursor"
        style={{ fontSize: "0.75rem" }}
      >
        █
      </span>
    </p>
  );
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctaStyle = {
    backgroundColor: "#4ADE80",
    color: "#0a0a0a",
    fontFamily: '"Space Grotesk", sans-serif',
    fontWeight: 700,
    fontSize: "0.875rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    borderRadius: "2px",
    height: "48px",
    padding: "0 32px",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textDecoration: "none",
  } as const;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      radius: Math.random() * 1.8 + 0.8,
      speed: Math.random() * 0.35 + 0.15,
    }));

    let rafId = 0;
    const draw = () => {
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (const particle of particles) {
        particle.y -= particle.speed;
        if (particle.y < -4) {
          particle.y = canvas.clientHeight + 4;
          particle.x = Math.random() * canvas.clientWidth;
        }
        context.beginPath();
        context.fillStyle = "rgba(74, 222, 128, 0.20)";
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    window.addEventListener("resize", setupCanvas);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", setupCanvas);
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div
        className="pointer-events-none fixed left-0 top-0 z-50 h-0.5 w-full bg-[#4ADE80]"
        aria-hidden
      />

      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#0b0f12]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div style={wordmark.container}>
            <div style={wordmark.icon}>&gt;_</div>
            <span style={wordmark.text}>
              Scop<span style={wordmark.accent}>r</span>
            </span>
          </div>
          <Link
            href="/waitlist"
            style={ctaStyle}
          >
            Get started →
          </Link>
        </div>
      </header>

      <main className="relative pt-24">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
        <div className="relative z-10">
          <section className="px-6 pb-16 pt-10">
          <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <TerminalComment text="// no coding required" />
              <h1
  className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl"
  style={{ fontFamily: "var(--font-space-grotesk)" }}
>
  <span className="text-white">Lots of ideas. No idea where to start.</span>
</h1>
<p className="...">
  Scopr tells you which one is <span style={{
    background: 'linear-gradient(to right, #4ADE80, #dcfce7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline',
  }}>worth building</span> — in 60 seconds.
</p>
              <div className="mt-8">
                <Link href="/waitlist" style={ctaStyle}>
                  Validate my idea →
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(19,24,31,0.95),rgba(10,13,18,0.95))] p-5 shadow-[0_24px_100px_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[0.85rem] leading-7 text-[#d7e3eb]">
{`~ scopr validate --idea "An app for new dads during pregnancy"
[SYSTEM] Initialising validation engine...
[ANALYSIS] Market size: Large. Competition: Medium.
[FOUNDER] Fit score: High. Enjoyment signal: Strong.
[DECISION] BUILD_IT — confidence 91.4%
// VALIDATION_COMPLETE (47.2s)
~ SCOPE_READY_FOR_EXPORT_█`}
              </pre>
            </div>
          </div>
          </section>

          <section className="px-6 py-14">
          <div className="mx-auto w-full max-w-6xl">
            <TerminalComment text="// how it works" />
            <h2
              className="mt-3 text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Three steps. That's it.
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6">
                <p className="font-mono text-xs text-[#4ADE80]">01</p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Share your idea
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Describe it in plain English. One sentence is enough. No
                  technical knowledge needed.
                </p>
              </article>
              <article className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6">
                <p className="font-mono text-xs text-[#4ADE80]">02</p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Answer 7 simple questions
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  We'll ask about the problem, who has it, and why you're the
                  right person to solve it.
                </p>
              </article>
              <article className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6">
                <p className="font-mono text-xs text-[#4ADE80]">03</p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Get your decision
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  A clear AI decision tells you whether to build it, refine it,
                  or come back to it later.
                </p>
              </article>
            </div>
          </div>
          </section>

          <section className="px-6 py-14">
          <div className="mx-auto w-full max-w-6xl">
            <TerminalComment text="// your decision, instantly" />
            <h2
              className="text-4xl font-bold tracking-tight text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              No more guessing
            </h2>
            <p className="mt-3 text-lg text-white/70">
              Every idea gets one of three honest outcomes.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="landing-card-hover rounded-2xl border border-[#4ADE80]/30 bg-[linear-gradient(180deg,rgba(74,222,128,0.12),rgba(17,19,24,0.35))] p-6">
                <p className="font-mono text-xs tracking-wide text-[#4ADE80]">
                  PROBABILITY: HIGH
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Build it
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Your idea has real potential. We'll show you exactly how to
                  get started.
                </p>
              </article>
              <article className="landing-card-hover rounded-2xl border border-[#f59e0b]/30 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(17,19,24,0.35))] p-6">
                <p className="font-mono text-xs tracking-wide text-[#fbbf24]">
                  PROBABILITY: MEDIUM
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Needs refinement
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  A few gaps to work through first. We'll tell you what to
                  focus on.
                </p>
              </article>
              <article className="landing-card-hover rounded-2xl border border-[#9ca3af]/30 bg-[linear-gradient(180deg,rgba(156,163,175,0.10),rgba(17,19,24,0.35))] p-6">
                <p className="font-mono text-xs tracking-wide text-[#d1d5db]">
                  PROBABILITY: LOW
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  Revisit later
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  Not the right time. We'll save it and remind you when to come
                  back.
                </p>
              </article>
            </div>
          </div>
          </section>

          <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(16,22,30,0.95),rgba(8,11,16,0.95))] p-10 text-center">
            <p className="font-mono text-[0.875rem] leading-normal text-[#4ADE80]">
              // now open
              <span
                aria-hidden="true"
                style={{
                  fontSize: "0.75rem",
                  color: "#4ADE80",
                  animation: "terminal-blink 600ms steps(1, end) infinite",
                  marginLeft: "2px",
                }}
              >
                █
              </span>
            </p>
            <h2
              className="mx-auto mt-5 max-w-2xl text-4xl font-bold leading-tight text-white"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Your idea is waiting. Take 60 seconds to find out if it's worth it.
            </h2>
            <div className="mt-8">
              <Link href="/waitlist" style={ctaStyle}>
                Validate my idea →
              </Link>
            </div>
          </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-white">© 2026 Scopr</span>
            <span className="font-mono text-xs text-[#4ADE80]">
              scopr — idea validation engine
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://x.com/tryscopr"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              X
            </a>
            <a
              href="https://threads.net/@tryscopr"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white"
            >
              Threads
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
