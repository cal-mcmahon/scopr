"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { buttons, wordmark } from "@/lib/design-system";

const loadingMessages = [
  "// reading your answers...",
  "// checking the market signals...",
  "// thinking about founder fit...",
  "// writing your decision...",
  "// almost ready...",
];

export default function IdeaGeneratingPage() {
  const params = useParams();
  const router = useRouter();
  const hasRequestedRef = useRef(false);

  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const runAnalysis = useCallback(async () => {
    if (!ideaId) {
      setIsLoading(false);
      setErrorMessage("⚠ something went wrong — your answers are safe");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/idea/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea_id: ideaId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Analysis failed");
      }

      router.replace(`/idea/${ideaId}/decision`);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      setErrorMessage("⚠ something went wrong — your answers are safe");
    }
  }, [ideaId, router]);

  useEffect(() => {
    if (!ideaId || hasRequestedRef.current) return;
    hasRequestedRef.current = true;
    runAnalysis();
  }, [ideaId, runAnalysis]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  const retryStyle = {
    ...buttons.secondary,
    width: "auto",
    minWidth: "auto",
    height: "auto",
    minHeight: "auto",
    padding: "10px 14px",
    textTransform: "none",
    letterSpacing: "0.02em",
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-[#e2e2e9]">

      <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <div />
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-3xl items-center justify-center px-4 sm:px-6">
        {errorMessage ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <p
              className="font-mono text-base text-[#4ADE80] sm:text-lg"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={runAnalysis}
              style={retryStyle}
              className="transition hover:border-[#4ADE80] hover:bg-[#111318]"
            >
              {"// try again \u2192"}
            </button>
          </div>
        ) : (
          <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
            <p
              className="font-mono text-base text-[#4ADE80] sm:text-lg"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              {"// analysing your idea"}
            </p>

            <div className="relative min-h-[2.5rem]">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessages[messageIndex]}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="font-mono text-sm text-[#4ADE80] sm:text-base"
                  style={{ fontFamily: '"JetBrains Mono", monospace' }}
                >
                  {loadingMessages[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="h-[2px] w-full max-w-md overflow-hidden rounded-sm bg-[rgba(74,222,128,0.18)]">
              <motion.div
                className="h-full w-1/3 bg-[#4ADE80]"
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
