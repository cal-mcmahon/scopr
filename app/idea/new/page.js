"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { wordmark } from "@/lib/design-system";

const DESC_MIN = 20;
const DESC_MAX = 500;
const NAME_MAX = 50;
const CATEGORY_MAX = 80;

export default function IdeaCapturePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [description, setDescription] = useState("");
  const [ideaName, setIdeaName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    async function guard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      setCheckingAuth(false);
    }
    guard();
  }, [router]);

  const descLen = description.length;
  const nameLen = ideaName.length;
  const descOk = descLen >= DESC_MIN && descLen <= DESC_MAX;
  const nameOk = ideaName.trim().length > 0 && nameLen <= NAME_MAX;
  const submitDisabled = !descOk || !nameOk || loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitDisabled) return;
    setSaveError("");
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("⚠ please sign in again to save your idea");
        return;
      }

      const basePayload = {
        user_id: user.id,
        title: ideaName.trim(),
        description: description.trim(),
        status: null,
        confidence_score: null,
      };
      const trimmedCat = category.trim();
      const payload =
        trimmedCat.length > 0 ? { ...basePayload, category: trimmedCat } : basePayload;

      let { data, error } = await supabase.from("ideas").insert(payload).select("id").single();

      if (error && trimmedCat.length > 0 && /category|column|schema cache/i.test(error.message || "")) {
        const retry = await supabase.from("ideas").insert(basePayload).select("id").single();
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        setSaveError("⚠ we couldn’t save your idea — please try again in a moment");
        return;
      }

      if (!data?.id) {
        setSaveError("⚠ we couldn’t save your idea — please try again in a moment");
        return;
      }

      router.push(`/idea/${data.id}/questions`);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111318] text-[#e2e2e9]">
        <p className="font-mono text-sm text-[#4ADE80]">{"// loading..."}</p>
      </div>
    );
  }

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
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    maxWidth: "420px",
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden text-[#e2e2e9] font-sans"
      style={{ fontFamily: "var(--font-geist-sans), Inter, sans-serif", position: "relative", zIndex: 1 }}
    >
      <nav className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <Link
          href="/dashboard"
          className="font-mono text-xs tracking-wide text-[rgba(74,222,128,0.75)] transition-colors hover:text-[#4ADE80] sm:text-sm"
        >
          ← back to dashboard
        </Link>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="mb-10">
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <li className="flex items-center gap-2 text-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[#4ADE80] bg-[#4ADE80]/15 font-mono text-xs font-bold text-[#4ADE80]">
                1
              </span>
              <span className="font-medium text-white">Your idea</span>
              <span className="font-mono text-[10px] text-[#4ADE80] sm:ml-1">active</span>
            </li>
            <li className="hidden h-px flex-1 bg-[rgba(255,255,255,0.08)] sm:block" aria-hidden />
            <li className="flex items-center gap-2 text-sm text-[rgba(188,202,187,0.5)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[rgba(255,255,255,0.12)] font-mono text-xs">
                2
              </span>
              <span>7 questions</span>
            </li>
            <li className="hidden h-px flex-1 bg-[rgba(255,255,255,0.08)] sm:block" aria-hidden />
            <li className="flex items-center gap-2 text-sm text-[rgba(188,202,187,0.5)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[rgba(255,255,255,0.12)] font-mono text-xs">
                3
              </span>
              <span>Your decision</span>
            </li>
          </ol>
        </section>

        <section className="mb-10 text-center sm:text-left">
          <p className="font-mono text-sm text-[#4ADE80]">{"// new idea"}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What&apos;s your idea?
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[rgba(188,202,187,0.85)]">
            Describe it in plain English. One sentence is enough.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          {saveError ? (
            <p className="rounded-md border border-[rgba(255,107,107,0.35)] bg-[rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[#ffb4ab]" role="alert">
              {saveError}
            </p>
          ) : null}
          <div>
            <label htmlFor="idea-description" className="sr-only">
              Describe your idea
            </label>
            <div
              className="relative rounded-md border border-[rgba(255,255,255,0.08)] transition-shadow focus-within:border-[#4ADE80]/50 focus-within:shadow-[0_0_0_1px_rgba(74,222,128,0.35),0_0_24px_rgba(74,222,128,0.12)]"
              style={{
                background: "rgba(26, 27, 33, 0.85)",
                backdropFilter: "blur(8px)",
              }}
            >
              <textarea
                id="idea-description"
                value={description}
                onChange={(e) => {
                  setSaveError("");
                  setDescription(e.target.value.slice(0, DESC_MAX));
                }}
                placeholder="e.g. An app that tells you what to cook based on what's in your fridge"
                rows={6}
                className="w-full resize-y rounded-md bg-transparent px-4 py-4 font-sans text-[0.9375rem] leading-relaxed text-[#e2e2e9] placeholder:text-[rgba(188,202,187,0.35)] focus:outline-none"
                aria-describedby="desc-count desc-hint"
              />
              <div
                id="desc-count"
                className="pointer-events-none absolute bottom-3 right-3 font-mono text-[11px] text-[rgba(188,202,187,0.5)]"
              >
                {descLen}/{DESC_MAX}
              </div>
            </div>
            <p id="desc-hint" className="mt-2 text-left font-mono text-[11px] text-[rgba(188,202,187,0.45)]">
              {descLen > 0 && descLen < DESC_MIN
                ? `⚠ add at least ${DESC_MIN - descLen} more character${DESC_MIN - descLen === 1 ? "" : "s"}`
                : "\u00a0"}
            </p>
          </div>

          <div>
            <label
              htmlFor="idea-name"
              className="mb-2 block text-left text-sm font-medium text-[rgba(188,202,187,0.9)]"
            >
              Give your idea a name
            </label>
            <input
              id="idea-name"
              type="text"
              value={ideaName}
              onChange={(e) => {
                setSaveError("");
                setIdeaName(e.target.value.slice(0, NAME_MAX));
              }}
              placeholder="e.g. FridgeChef"
              maxLength={NAME_MAX}
              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#1a1b21] px-4 py-3 font-sans text-[0.9375rem] text-[#e2e2e9] placeholder:text-[rgba(188,202,187,0.35)] transition-shadow focus:border-[#4ADE80]/50 focus:outline-none focus:shadow-[0_0_0_1px_rgba(74,222,128,0.35),0_0_20px_rgba(74,222,128,0.1)]"
              style={{ backdropFilter: "blur(8px)" }}
            />
            <p className="mt-1.5 text-right font-mono text-[11px] text-[rgba(188,202,187,0.45)]">
              {nameLen}/{NAME_MAX}
            </p>
          </div>

          <div>
            <label
              htmlFor="idea-category"
              className="mb-2 block text-left text-sm font-medium text-[rgba(188,202,187,0.9)]"
            >
              Category <span className="font-normal text-[rgba(188,202,187,0.5)]">(optional)</span>
            </label>
            <input
              id="idea-category"
              type="text"
              value={category}
              onChange={(e) => {
                setSaveError("");
                setCategory(e.target.value.slice(0, CATEGORY_MAX));
              }}
              placeholder="e.g. Food & drink, health, productivity"
              maxLength={CATEGORY_MAX}
              className="w-full rounded-md border border-[rgba(255,255,255,0.08)] bg-[#1a1b21] px-4 py-3 font-sans text-[0.9375rem] text-[#e2e2e9] placeholder:text-[rgba(188,202,187,0.35)] transition-shadow focus:border-[#4ADE80]/50 focus:outline-none focus:shadow-[0_0_0_1px_rgba(74,222,128,0.35),0_0_20px_rgba(74,222,128,0.1)]"
              style={{ backdropFilter: "blur(8px)" }}
            />
            <p className="mt-1.5 text-right font-mono text-[11px] text-[rgba(188,202,187,0.45)]">
              {category.length}/{CATEGORY_MAX}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={submitDisabled}
              style={{
                ...ctaStyle,
                cursor: submitDisabled ? "not-allowed" : "pointer",
                opacity: submitDisabled ? 1 : 1,
              }}
            >
              {loading ? (
                <span className="font-mono text-[0.8125rem] normal-case tracking-normal text-[#0a0a0a]">
                  {"// getting ready..."}
                </span>
              ) : (
                "Start validation →"
              )}
            </button>
            <p className="font-mono text-sm text-[#4ADE80]/90">{"// takes about 60 seconds"}</p>
          </div>
        </form>
      </main>
    </div>
  );
}
