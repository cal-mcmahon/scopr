"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { wordmark } from "@/lib/design-system";

export default function IdeaDecisionPlaceholderPage() {
  const params = useParams();
  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="min-h-screen bg-[#111318] text-[#e2e2e9]">
      <nav className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318]/90 px-4 py-4 backdrop-blur-xl sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2" style={wordmark.container}>
          <div style={wordmark.icon}>&gt;_</div>
          <span style={wordmark.text}>
            Scop<span style={wordmark.accent}>r</span>
          </span>
        </Link>
        <div />
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-2xl items-center justify-center px-4 text-center sm:px-6">
        <div className="space-y-3 font-mono text-[#4ADE80]">
          <p>{"// decision screen placeholder"}</p>
          <p className="text-sm text-[rgba(188,202,187,0.6)]">{`idea id: ${ideaId || "unknown"}`}</p>
        </div>
      </main>
    </div>
  );
}
