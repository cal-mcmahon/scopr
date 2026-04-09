"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buttons, inputs, wordmark } from "@/lib/design-system";

const TAGLINE =
  "Got lots of ideas but no idea where to start?";

const MONO =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function TerminalComment({ text }) {
  return (
    <p className="text-xs text-[#4ADE80]" style={{ fontFamily: MONO }}>
      {text}
      <span aria-hidden="true" className="terminal-cursor">
        █
      </span>
    </p>
  );
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [typedTagline, setTypedTagline] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedTagline(TAGLINE.slice(0, index));
      if (index >= TAGLINE.length) window.clearInterval(timer);
    }, 35);
    return () => window.clearInterval(timer);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("Please enter a valid email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from("waitlist")
        .insert([{ email: trimmed }]);

      if (insertError) {
        const msg = insertError.message || "";
        if (
          insertError.code === "23505" ||
          /duplicate|unique|already exists/i.test(msg)
        ) {
          setError("You're already on the list.");
          return;
        }
        setError(msg || "Something went wrong.");
        return;
      }

      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-white">
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

      <main className="relative isolate z-10 flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center py-10">
          <div className="mb-5">
            <TerminalComment text={"// early access"} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                ...wordmark.icon,
                width: "56px",
                height: "56px",
                fontSize: "1.1rem",
                borderRadius: "12px",
                boxShadow:
                  "0 0 20px rgba(74, 222, 128, 0.2), 0 0 40px rgba(74, 222, 128, 0.08)",
              }}
            >
              &gt;_
            </div>
            <span style={{ ...wordmark.text, fontSize: "4rem" }}>
              Scop<span style={wordmark.accent}>r</span>
            </span>
          </div>

          <p className="mt-8 text-lg leading-7 text-white/85">{typedTagline}</p>

          <p className="mt-5 text-sm text-white/60">
          Join the waitlist and be first to find out.
          </p>

          {!isSuccess ? (
            <form
              onSubmit={onSubmit}
              className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            >
              <label className="sr-only" htmlFor="waitlist-email">
                Email
              </label>
              <input
                id="waitlist-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={(e) => {
                  e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "0 0 0 1px rgba(134, 148, 134, 0.2)";
                }}
                placeholder="your@email.com"
                autoComplete="email"
                inputMode="email"
                disabled={isSubmitting}
                className="placeholder:text-white/40"
                style={inputs.default}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="disabled:opacity-70"
                style={buttons.primary}
              >
                {isSubmitting ? "Joining..." : "Join the waitlist →"}
              </button>
            </form>
          ) : (
            <div className="mt-10">
              <TerminalComment text={"// you're in"} />
              <p className="mt-2 text-sm text-white/60">
                We&apos;ll let you know the moment you can start validating your
                ideas.
              </p>
            </div>
          )}

          {error ? (
            <p className="mt-4 text-sm text-white/70" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-8 text-sm text-white/45">
            Join people turning their ideas into real products.
          </p>

          <nav className="mt-12 flex items-center gap-6 text-sm text-white/45">
            <a
              href="https://x.com/tryscopr"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white/70"
            >
              X
            </a>
            <a
              href="https://threads.net/@tryscopr"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white/70"
            >
              Threads
            </a>
            <a
              href="https://github.com/cal-mcmahon/scopr"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-white/70"
            >
              GitHub
            </a>
          </nav>
        </div>
      </main>
    </div>
  );
}
