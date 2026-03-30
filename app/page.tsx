"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const HERO_HEADLINE =
  "You have a rough idea. Scopr turns it into a polished app plan in 60 seconds.";

function TerminalComment({ text }: { text: string }) {
  return (
    <p className="font-mono text-xs text-[#4ADE80]">
      {text}
      <span aria-hidden="true" className="terminal-cursor">
        █
      </span>
    </p>
  );
}

export default function Home() {
  const [typedHeadline, setTypedHeadline] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [secondsCount, setSecondsCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let charIndex = 0;
    const interval = window.setInterval(() => {
      charIndex += 1;
      setTypedHeadline(HERO_HEADLINE.slice(0, charIndex));

      if (charIndex >= HERO_HEADLINE.length) {
        window.clearInterval(interval);
        setIsTypingDone(true);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const durationMs = 1500;
    const endValue = 60;
    const start = performance.now();
    let rafId = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setSecondsCount(Math.round(endValue * progress));

      if (progress < 1) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

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

    const particleCount = 40;
    const particles = Array.from({ length: particleCount }, () => ({
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
        context.fillStyle = "rgba(74, 222, 128, 0.15)";
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
    <div className="min-h-screen bg-[#111318] text-white">
      <div
        style={{
          height: "2px",
          backgroundColor: "#4ADE80",
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
        }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50"
      >
        Skip to content
      </a>

      <header className="border-b border-white/5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#FFFFFF",
              }}
            >
              Scop
              <span style={{ color: "#4ADE80", fontFamily: "monospace" }}>
                r
              </span>
            </span>
          </div>

          <Link
            href="/waitlist"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#4ADE80] px-4 text-sm font-medium text-[#0B1220] transition-colors hover:bg-[#4ADE80]/90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-6 scroll-smooth">
        <section className="relative overflow-hidden pt-16 pb-5 md:pt-20 md:pb-6">
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          />
          <div className="relative z-10 max-w-2xl">
            <TerminalComment text="// validate your idea in 60 seconds" />

            <h1 className="mt-4 min-h-[6rem] text-4xl font-semibold leading-tight tracking-tight text-white">
              {typedHeadline}
              {!isTypingDone && (
                <span aria-hidden="true" className="typewriter-cursor ml-1">
                  |
                </span>
              )}
            </h1>

            <p className="mt-5 text-lg leading-7 text-white/70">
              Answer 7 questions. Get a market verdict. Know if it&apos;s worth
              building.
            </p>

            <Link
              href="/waitlist"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-[#4ADE80] px-6 text-base font-medium text-[#0B1220] transition-colors hover:bg-[#4ADE80]/90"
            >
              Analyse my idea free
            </Link>

            <p className="mt-4 text-sm text-white/65">
              <span className="font-mono text-[#4ADE80]">{secondsCount}</span>{" "}
              seconds to your verdict
            </p>
          </div>
        </section>

        <section id="how-it-works" className="py-6 md:py-7 scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <TerminalComment text="// powered by ai" />
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white/90">
              How it works
            </h2>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="lift-card accent-green-soft rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <p className="font-mono text-xs text-[#4ADE80]">01</p>
                <h3 className="text-lg font-semibold text-white">
                  Drop in your idea
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Share your startup concept in one clear sentence.
                </p>
              </div>
              <div className="lift-card accent-green-soft rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <p className="font-mono text-xs text-[#4ADE80]">02</p>
                <h3 className="text-lg font-semibold text-white">
                  Answer 7 quick questions
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Add context on customer pain, market, and distribution.
                </p>
              </div>
              <div className="lift-card accent-green-soft rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <p className="font-mono text-xs text-[#4ADE80]">03</p>
                <h3 className="text-lg font-semibold text-white">
                  Get your verdict
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Receive a fast recommendation on what to do next.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="ai-decisions"
          className="py-12 md:py-14 border-y border-white/5 scroll-mt-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <TerminalComment text="// your verdict" />
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white/90">
              AI decisions
            </h2>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <div className="lift-card accent-green rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <h3 className="text-lg font-semibold text-white">Build it</h3>
                <p className="mt-2 text-sm text-white/60">
                  Your idea has strong market signals. Time to build.
                </p>
              </div>
              <div className="lift-card accent-amber rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <h3 className="text-lg font-semibold text-white">
                  Needs refinement
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  A few gaps to address before committing.
                </p>
              </div>
              <div className="lift-card accent-gray rounded-xl border border-white/10 border-l-2 bg-[#1c1c1e] p-8">
                <h3 className="text-lg font-semibold text-white">
                  Revisit later
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  Not the right moment. We&apos;ll remind you when to revisit.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <section
          id="final-cta"
          className="py-16 md:py-20 border-b border-white/5 scroll-mt-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto max-w-2xl text-center md:text-left">
              <TerminalComment text="// ready to build?" />
              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white">
                You have a rough idea. Scopr turns it into a polished app plan
                in 60 seconds.
              </h2>
              <div className="mt-10">
                <Link
                  href="/waitlist"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-[#4ADE80] px-6 text-base font-medium text-[#0B1220] transition-colors hover:bg-[#4ADE80]/90"
                >
                  Analyse my idea free
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
