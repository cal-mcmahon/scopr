"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buttons, wordmark } from "@/lib/design-system";

function formatIdeaDate(value) {
  if (!value) return "// --.--.--";
  const d = new Date(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `// ${day}.${month}.${year}`;
}

function confidenceLabel(value) {
  if (value === null || value === undefined) return "[CONFIDENCE: --%]";
  return `[CONFIDENCE: ${Math.round(Number(value))}%]`;
}

function IdeaCard({ idea, color }) {
  return (
    <div
      className={`landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6 border-l-[3px] transition-all cursor-pointer group ${color.borderLeft}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-headline font-bold text-[#e2e2e9] transition-colors ${color.hoverText}`}>
          {idea.title || "Untitled idea"}
        </h4>
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${color.confidence}`}>
          {confidenceLabel(idea.confidence_score)}
        </span>
      </div>
      <p className="text-[rgba(188,202,187,0.6)] text-sm mb-4 leading-relaxed">
        {idea.description || "No details added yet."}
      </p>
      <div className={`font-mono text-[10px] opacity-60 ${color.date}`}>
        {formatIdeaDate(idea.created_at)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("there");
  const [avatarLetter, setAvatarLetter] = useState("S");
  const [typedSubheading, setTypedSubheading] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [buildIdeas, setBuildIdeas] = useState([]);
  const [refineIdeas, setRefineIdeas] = useState([]);
  const [revisitIdeas, setRevisitIdeas] = useState([]);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .single();

      const name =
        profile?.display_name ||
        profile?.username ||
        user?.email?.split("@")[0] ||
        "there";
      setDisplayName(name);
      setAvatarLetter((profile?.username || name || "S").charAt(0).toUpperCase());

      const { data: ideas } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const allIdeas = ideas || [];
      setBuildIdeas(allIdeas.filter((i) => i.status === "build"));
      setRefineIdeas(allIdeas.filter((i) => i.status === "refine"));
      setRevisitIdeas(allIdeas.filter((i) => i.status === "revisit"));
      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  useEffect(() => {
    const fullText = "What idea are we looking at today?";
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedSubheading(fullText.slice(0, index));
      if (index >= fullText.length) window.clearInterval(timer);
    }, 35);
    return () => window.clearInterval(timer);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#111318] flex items-center justify-center">
        <p className="font-mono text-[#4ADE80] text-base text-center">
          // loading your ideas...
        </p>
      </div>
    );
  }

  const totalIdeas = buildIdeas.length + refineIdeas.length + revisitIdeas.length;
  const primaryButtonStyle = {
    ...buttons.primary,
    width: "auto",
    padding: "0 24px",
    textDecoration: "none",
  };
  const secondaryButtonStyle = {
    ...buttons.secondary,
    textDecoration: "none",
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f12] text-[#e2e2e9] font-body selection:bg-primary selection:text-on-primary-container">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <style jsx global>{`
        .signature-gradient {
          background: linear-gradient(135deg, #6bfb9a 0%, #4ade80 100%);
        }
        @keyframes drift {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 0.55;
          }
          100% {
            transform: translateY(-100px) translateX(20px);
            opacity: 0;
          }
        }
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #4ade80;
          border-radius: 50%;
          pointer-events: none;
          animation: drift 8s infinite linear;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <div className="particle" style={{ left: "8%", top: "88%", animationDelay: "0s" }} />
        <div className="particle" style={{ left: "15%", top: "72%", animationDelay: "1.5s" }} />
        <div className="particle" style={{ left: "22%", top: "95%", animationDelay: "3.2s" }} />
        <div className="particle" style={{ left: "30%", top: "78%", animationDelay: "0.8s" }} />
        <div className="particle" style={{ left: "38%", top: "90%", animationDelay: "2.6s" }} />
        <div className="particle" style={{ left: "45%", top: "68%", animationDelay: "4.1s" }} />
        <div className="particle" style={{ left: "53%", top: "92%", animationDelay: "1.1s" }} />
        <div className="particle" style={{ left: "60%", top: "76%", animationDelay: "3.7s" }} />
        <div className="particle" style={{ left: "68%", top: "86%", animationDelay: "0.4s" }} />
        <div className="particle" style={{ left: "75%", top: "70%", animationDelay: "2.2s" }} />
        <div className="particle" style={{ left: "82%", top: "94%", animationDelay: "4.6s" }} />
        <div className="particle" style={{ left: "90%", top: "80%", animationDelay: "1.9s" }} />
      </div>

      <nav className="bg-[#111318] backdrop-blur-xl font-['Inter'] font-bold tracking-tight text-[#e2e2e9] sticky top-0 z-50 border-b border-[rgba(255,255,255,0.06)]/10 flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-8">
          <div style={wordmark.container}>
            <div style={wordmark.icon}>&gt;_</div>
            <span style={wordmark.text}>
              Scop<span style={wordmark.accent}>r</span>
            </span>
          </div>
          <div className="hidden md:flex gap-6">
            <span
              onClick={() => setActiveTab("dashboard")}
              className={`font-mono cursor-pointer transition-all duration-200 ${
                activeTab === "dashboard" ? "text-white" : "text-[#888780] hover:text-white"
              }`}
            >
              Dashboard
            </span>
            <span
              onClick={() => setActiveTab("build")}
              className={`font-mono px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
                activeTab === "build" ? "text-[#4ADE80]" : "text-[#888780] hover:text-[#4ADE80]"
              }`}
            >
              Build
            </span>
            <span
              onClick={() => setActiveTab("refine")}
              className={`font-mono px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
                activeTab === "refine" ? "text-[#EF9F27]" : "text-[#888780] hover:text-[#EF9F27]"
              }`}
            >
              Refine
            </span>
            <span
              onClick={() => setActiveTab("revisit")}
              className={`font-mono px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
                activeTab === "revisit"
                  ? "text-[#888780] brightness-125"
                  : "text-[#888780] hover:brightness-125"
              }`}
            >
              Revisit
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/idea/new" style={primaryButtonStyle}>
            New idea →
          </Link>
          <button onClick={handleSignOut} className="cursor-pointer" aria-label="Sign out">
            <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.06)]/20 bg-[#33353a] flex items-center justify-center text-[#4ADE80] font-mono text-xs">
              {avatarLetter}
            </div>
          </button>
        </div>
      </nav>

      <div className="flex relative z-10">
        <aside
          className="hidden lg:flex h-[calc(100vh-72px)] w-64 flex-col gap-4 font-mono text-sm uppercase tracking-widest border-r border-[rgba(255,255,255,0.06)]/10 rounded-2xl backdrop-blur-md border border-[#9ca3af]/30 overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg,rgba(156,163,175,0.06),rgba(17,19,24,0.20))",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="p-6" />
          <nav className="flex flex-col gap-1 px-2">
            <a
              className={`py-3 px-4 flex items-center gap-3 transition-all ${
                activeTab === "dashboard"
                  ? "text-[#4ADE80] bg-[#1a1b21]/30 border-l-2 border-[#4ADE80]"
                  : "text-[#888780] hover:text-[#4ADE80] border-l-2 border-transparent hover:border-l-2 hover:border-[#4ADE80]"
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("dashboard");
              }}
            >
              <span className="text-sm">⊞</span>
              Dashboard
            </a>
            <a
              className={`py-3 px-4 flex items-center gap-3 transition-colors ${
                activeTab === "build"
                  ? "text-[#4ADE80] bg-[#1a1b21]/30 border-l-2 border-[#4ADE80]"
                  : "text-[#888780] hover:text-[#4ADE80] border-l-2 border-transparent hover:border-l-2 hover:border-[#4ADE80]"
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("build");
              }}
            >
              <span className="text-sm">→</span>
              Build
            </a>
            <a
              className={`py-3 px-4 flex items-center gap-3 transition-colors ${
                activeTab === "refine"
                  ? "text-[#EF9F27] bg-[#1a1b21]/30 border-l-2 border-[#EF9F27]"
                  : "text-[#888780] hover:text-[#EF9F27] border-l-2 border-transparent hover:border-l-2 hover:border-[#EF9F27]"
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("refine");
              }}
            >
              <span className="text-sm">✏</span>
              Refine
            </a>
            <a
              className={`py-3 px-4 flex items-center gap-3 transition-colors ${
                activeTab === "revisit"
                  ? "text-[#888780] bg-[#1a1b21]/30 border-l-2 border-[#888780] brightness-125"
                  : "text-[#888780] hover:text-[#888780] border-l-2 border-transparent hover:border-l-2 hover:border-[#888780] brightness-125"
              }`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("revisit");
              }}
            >
              <span className="text-sm">↺</span>
              Revisit
            </a>
          </nav>
          <div className="mt-auto p-4">
            <Link
              href="/idea/new"
              className="w-full block"
              style={secondaryButtonStyle}
            >
              Validate a new idea →
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-h-screen p-6 md:p-12 overflow-x-hidden relative">
          <section className="mb-16 max-w-4xl relative">
            <h1
              className="font-mono text-4xl md:text-6xl font-bold tracking-tight mb-4 select-none"
              style={{
                background: "linear-gradient(to right, #4ADE80, #dcfce7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {`// hello, ${displayName}`}
            </h1>
            <p className="text-white/85 text-xl md:text-2xl font-headline mb-8">
              {typedSubheading}
            </p>
            <Link
              href="/idea/new"
              style={{
                ...buttons.primary,
                width: "auto",
                display: "inline-flex",
                padding: "0 32px",
                fontSize: "1rem",
                boxShadow: "0 0 20px rgba(74,222,128,0.2)",
                textDecoration: "none",
              }}
            >
              Validate a new idea <span>→</span>
            </Link>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div
              className="landing-card-hover p-6 rounded-2xl border border-[#9ca3af]/30"
              style={{
                background: "linear-gradient(180deg,rgba(156,163,175,0.10),rgba(17,19,24,0.35))",
              }}
            >
              <div className="text-[#d1d5db] font-mono text-xs mb-2">// TOTAL_IDEAS</div>
              <div className="text-4xl font-headline font-extrabold">{totalIdeas}</div>
              <div className="text-[rgba(188,202,187,0.6)] text-sm mt-1">Across all lifecycle stages</div>
            </div>
            <div
              className="landing-card-hover p-6 rounded-2xl border border-[#4ADE80]/30"
              style={{
                background: "linear-gradient(180deg,rgba(74,222,128,0.12),rgba(17,19,24,0.35))",
              }}
            >
              <div className="text-[#4ADE80] font-mono text-xs mb-2">// READY_TO_BUILD</div>
              <div className="text-4xl font-headline font-extrabold text-[#4ADE80]">{buildIdeas.length}</div>
              <div className="text-[rgba(188,202,187,0.6)] text-sm mt-1">High confidence signals</div>
            </div>
            <div
              className="landing-card-hover p-6 rounded-2xl border border-[#f59e0b]/30"
              style={{
                background: "linear-gradient(180deg,rgba(245,158,11,0.12),rgba(17,19,24,0.35))",
              }}
            >
              <div className="text-[#EF9F27] font-mono text-xs mb-2">// IN_REFINEMENT</div>
              <div className="text-4xl font-headline font-extrabold text-[#EF9F27]">{refineIdeas.length}</div>
              <div className="text-[rgba(188,202,187,0.6)] text-sm mt-1">Awaiting more data</div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="space-y-6">
              <header className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                  <h3 className="font-headline font-bold text-[#e2e2e9] uppercase tracking-wider text-sm">Build</h3>
                </div>
                <span className="bg-[#282a2f] px-2 py-0.5 rounded font-mono text-xs text-[#4ADE80]">
                  {buildIdeas.length}
                </span>
              </header>
              <div className="space-y-4">
                {buildIdeas.length > 0 ? (
                  buildIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      color={{
                        borderLeft: "border-l-[#4ADE80]",
                        hoverRight: "hover:border-r-[#4ADE80]/40",
                        hoverText: "group-hover:text-[#4ADE80]",
                        confidence: "text-[#4ADE80] bg-[#4ADE80]/10",
                        date: "text-[#4ADE80]",
                      }}
                    />
                  ))
                ) : (
                  <div
                    className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6 border-l-[3px] border-l-[#4ADE80] flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-4xl text-[#4ADE80] mb-4 opacity-50">⏳</span>
                    <div className="text-[#4ADE80] font-mono text-sm">// no ideas ready to build yet</div>
                    <p className="text-[rgba(188,202,187,0.6)] text-xs mt-2 max-w-[200px]">
                      Validate an idea and get a Build decision to see it here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <header className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#EF9F27]" />
                  <h3 className="font-headline font-bold text-[#e2e2e9] uppercase tracking-wider text-sm">Refine</h3>
                </div>
                <span className="bg-[#282a2f] px-2 py-0.5 rounded font-mono text-xs text-[#EF9F27]">
                  {refineIdeas.length}
                </span>
              </header>
              <div className="space-y-4">
                {refineIdeas.length > 0 ? (
                  refineIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      color={{
                        borderLeft: "border-l-[#EF9F27]",
                        hoverRight: "hover:border-r-[#EF9F27]/40",
                        hoverText: "group-hover:text-[#EF9F27]",
                        confidence: "text-[#EF9F27] bg-[#EF9F27]/10",
                        date: "text-[#EF9F27]",
                      }}
                    />
                  ))
                ) : (
                  <div
                    className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6 border-l-[3px] border-l-[#EF9F27] flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-4xl text-[#EF9F27] mb-4 opacity-50">⏳</span>
                    <div className="text-[#EF9F27] font-mono text-sm">// no ideas needing refinement yet</div>
                    <p className="text-[rgba(188,202,187,0.6)] text-xs mt-2 max-w-[200px]">
                      Ideas that need a bit of work will show up here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <header className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#888780]" />
                  <h3 className="font-headline font-bold text-[#e2e2e9] uppercase tracking-wider text-sm">Revisit</h3>
                </div>
                <span className="bg-[#282a2f] px-2 py-0.5 rounded font-mono text-xs text-[#888780]">
                  {revisitIdeas.length}
                </span>
              </header>
              <div className="space-y-4">
                {revisitIdeas.length > 0 ? (
                  revisitIdeas.map((idea) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      color={{
                        borderLeft: "border-l-[#888780]",
                        hoverRight: "hover:border-r-[#888780]/40",
                        hoverText: "group-hover:text-[#888780]",
                        confidence: "text-[#888780] bg-[#888780]/10",
                        date: "text-[#888780]",
                      }}
                    />
                  ))
                ) : (
                  <div
                    className="landing-card-hover rounded-2xl border border-[#4ADE80]/20 bg-[linear-gradient(180deg,rgba(74,222,128,0.07),rgba(74,222,128,0.02))] p-6 border-l-[3px] border-l-[#888780] flex flex-col items-center justify-center text-center"
                  >
                    <span className="text-4xl text-[#888780] mb-4 opacity-50">⏳</span>
                    <div className="text-[#888780] font-mono text-sm">// no ideas here yet</div>
                    <p className="text-[rgba(188,202,187,0.6)] text-xs mt-2 max-w-[200px]">
                      Save ideas that aren't ready for validation just yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.06)]/10 px-6 py-4 flex justify-between items-center z-50"
        style={{ background: "rgba(26, 27, 33, 0.4)", backdropFilter: "blur(8px)" }}
      >
        <div className="flex flex-col items-center text-[#4ADE80]">
          <span>⊞</span>
          <span className="text-[10px] font-mono mt-1">DASH</span>
        </div>
        <div className="flex flex-col items-center text-[#888780]">
          <span>→</span>
          <span className="text-[10px] font-mono mt-1">BUILD</span>
        </div>
        <Link href="/idea/new" className="bg-[#4ADE80] text-[#00210c] p-3 rounded-full -mt-12 shadow-lg">
          <span>+</span>
        </Link>
        <div className="flex flex-col items-center text-[#888780]">
          <span>✏</span>
          <span className="text-[10px] font-mono mt-1">REFINE</span>
        </div>
        <div className="flex flex-col items-center text-[#888780]">
          <span>↺</span>
          <span className="text-[10px] font-mono mt-1">HISTORY</span>
        </div>
      </div>
    </div>
  );
}
