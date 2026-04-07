"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buttons, wordmark } from "@/lib/design-system";

const questions = [
  "What problem does your idea solve?",
  "Who specifically experiences this problem?",
  "What transformation does the user get — what changes for them?",
  "How are people solving this problem today?",
  "Why would someone choose your idea over existing alternatives?",
  "Why are you the right person to build this?",
  "Would you enjoy working on this for 6–12 months? Tell us why.",
];

export default function IdeaQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const particleCanvasRef = useRef(null);

  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const storageKey = ideaId ? `scopr_answers_${ideaId}` : null;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState(() => questions.map(() => ""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [ideaTitle, setIdeaTitle] = useState(null); // null = still loading
  const [draftSavedVisible, setDraftSavedVisible] = useState(false);

  // Auth guard
  useEffect(() => {
    async function guard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
      }
    }
    guard();
  }, [router]);

  // Idea title for top bar
  useEffect(() => {
    if (!ideaId) return;
    let cancelled = false;
    async function loadTitle() {
      const { data } = await supabase.from("ideas").select("title").eq("id", ideaId).single();
      if (!cancelled) {
        setIdeaTitle(typeof data?.title === "string" ? data.title : "");
      }
    }
    loadTitle();
    return () => {
      cancelled = true;
    };
  }, [ideaId]);

  // Particle canvas — same pattern as idea/new (40 dots, #4ADE80 @ 20%, slow upward drift)
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
      speed: Math.random() * 0.3 + 0.1,
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
        ctx.fillStyle = "rgba(74, 222, 128, 0.20)";
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
  }, []);

  // Load any saved draft for this idea
  useEffect(() => {
    if (!ideaId || !storageKey) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed.answers) && parsed.answers.length === questions.length) {
        setAnswers(parsed.answers);
      }

      if (
        typeof parsed.currentQuestion === "number" &&
        parsed.currentQuestion >= 0 &&
        parsed.currentQuestion < questions.length
      ) {
        setCurrentQuestion(parsed.currentQuestion);
      }
    } catch {
      // Ignore malformed drafts
    }
  }, [ideaId, storageKey]);

  const saveDraftToStorage = (nextAnswers, nextQuestionIndex) => {
    if (!storageKey) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers: nextAnswers,
          currentQuestion: nextQuestionIndex,
        })
      );
    } catch {
      // If localStorage fails, carry on without drafts
    }
  };

  const handleAnswerChange = (value) => {
    setErrorMessage("");
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQuestion] = value;
      return next;
    });
  };

  const handleBack = () => {
    setErrorMessage("");
    setCurrentQuestion((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleSaveDraftClick = () => {
    saveDraftToStorage(answers, currentQuestion);
    setDraftSavedVisible(true);
  };

  useEffect(() => {
    if (!draftSavedVisible) return;
    const t = window.setTimeout(() => setDraftSavedVisible(false), 2000);
    return () => window.clearTimeout(t);
  }, [draftSavedVisible]);

  const handleNextOrSubmit = async () => {
    setErrorMessage("");

    const trimmed = (answers[currentQuestion] || "").trim();
    if (!trimmed) {
      setErrorMessage("⚠ Give this one a quick answer before you move on.");
      return;
    }

    const isLastQuestion = currentQuestion === questions.length - 1;

    if (!isLastQuestion) {
      const nextIndex = currentQuestion + 1;
      const nextAnswers = [...answers];
      saveDraftToStorage(nextAnswers, nextIndex);
      setCurrentQuestion(nextIndex);
      return;
    }

    if (!ideaId) {
      setErrorMessage("⚠ We lost track of your idea. Head back and open it again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = questions.map((question, index) => ({
        idea_id: ideaId,
        question_number: index + 1,
        question,
        answer: answers[index] || "",
      }));

      const { error } = await supabase.from("quiz_answers").insert(payload);

      if (error) {
        throw error;
      }

      if (storageKey && typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }

      router.push(`/idea/${ideaId}/generating`);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "⚠ Something went wrong saving your answers. Give it another go in a moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionNumber = currentQuestion + 1;
  const isLastQuestion = questionNumber === questions.length;
  const ideaTitleLine =
    ideaTitle === null ? "…" : ideaTitle.trim().length > 0 ? ideaTitle.trim() : "Untitled idea";

  const saveDraftNavStyle = {
    ...buttons.secondary,
    width: "auto",
    minWidth: "auto",
    height: "auto",
    minHeight: "auto",
    padding: "6px 14px",
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#111318] text-[#e2e2e9]">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ pointerEvents: "none" }}
        aria-hidden
      >
        <canvas
          ref={particleCanvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ pointerEvents: "none" }}
          aria-hidden
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={handleSaveDraftClick}
            disabled={isSubmitting}
            style={saveDraftNavStyle}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            {"// SAVE DRAFT"}
          </button>
          <p
            className={`pointer-events-none absolute right-0 top-full z-[60] mt-1 whitespace-nowrap font-mono text-xs text-[#4ADE80] transition-opacity duration-300 sm:text-sm ${
              draftSavedVisible ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {"// draft saved ✓"}
          </p>
        </div>
      </nav>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-3xl flex-col items-stretch justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex w-full flex-row items-start justify-between gap-4">
          <p className="shrink-0 font-mono text-sm text-[#4ADE80]">
            {`// question ${questionNumber} of ${questions.length}`}
          </p>
          <p
            className="min-w-0 flex-1 truncate text-right font-mono text-sm text-[#4ADE80]"
            title={ideaTitleLine === "…" ? undefined : ideaTitleLine}
          >
            {`// idea: ${ideaTitleLine}`}
          </p>
        </div>

        <div className="rounded-sm border border-[rgba(255,255,255,0.06)] bg-[rgba(26,27,33,0.4)] p-6 shadow-lg backdrop-blur-md sm:p-8">
          <h1
            className="w-full text-2xl font-bold leading-snug text-[#e2e2e9] sm:text-3xl"
            style={{ fontFamily: "var(--font-space-grotesk), Inter, system-ui, sans-serif" }}
          >
            {questions[currentQuestion]}
          </h1>
          <p className="mt-3 text-sm text-[rgba(188,202,187,0.6)]">
            Answer in your own words. No perfect phrasing needed.
          </p>

          <div className="mt-6">
            <textarea
              rows={4}
              className="min-h-[4.5rem] w-full resize-y rounded-md border border-[rgba(255,255,255,0.06)] bg-[rgba(26,27,33,0.8)] px-3 py-2 text-sm text-[#e2e2e9] outline-none ring-0 transition focus:border-[#4ADE80] focus:ring-2 focus:ring-[#4ADE80]/60"
              value={answers[currentQuestion] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write like you're explaining it to a friend."
            />
          </div>

          {errorMessage && (
            <p className="mt-4 text-sm text-[#f97373]">{errorMessage}</p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            {currentQuestion > 0 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="rounded-sm border border-[rgba(74,222,128,0.3)] bg-transparent px-3 py-2 font-mono text-xs text-[#4ADE80] transition hover:border-[#4ADE80] hover:bg-[#111318] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
              >
                {"BACK ←"}
              </button>
            )}

            <button
              type="button"
              onClick={handleNextOrSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-sm bg-[#4ADE80] px-4 py-2 font-mono text-xs font-bold text-[#0a0a0a] transition hover:bg-[#3ad070] disabled:cursor-wait disabled:opacity-80 sm:text-sm"
            >
              {isSubmitting
                ? "// ANALYSING..."
                : isLastQuestion
                  ? "GET MY DECISION →"
                  : "NEXT →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
