"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { buttons, cards, inputs, wordmark } from "@/lib/design-system";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const canvasRef = useRef(null);

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
      speed: Math.random() * 0.3 + 0.1,
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
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    };
  }, []);

  async function handleMagicLink() {
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("⚠ please enter your email address");
      return;
    }

    setLoadingAction("magic");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoadingAction("");

    if (error) {
      if (/rate limit|too many/i.test(error.message || "")) {
        setErrorMessage("⚠ too many attempts — please try again in a few minutes");
      } else {
        setErrorMessage("⚠ something went wrong — please try again");
      }
      return;
    }

    setSuccessMessage("✓ magic link sent — Check your email for your login link.");
  }

  async function handleGoogle() {
    setErrorMessage("");
    setSuccessMessage("");
    setLoadingAction("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    setLoadingAction("");

    if (error) {
      if (/rate limit|too many/i.test(error.message || "")) {
        setErrorMessage("⚠ too many attempts — please try again in a few minutes");
      } else {
        setErrorMessage("⚠ something went wrong — please try again");
      }
    }
  }

  async function handlePasswordAuth(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (mode === "signup") {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        setErrorMessage(
          "username can only contain letters, numbers and underscores"
        );
        return;
      }
      if (password.length < 8) {
        setErrorMessage("password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("passwords do not match");
        return;
      }
    }

    setLoadingAction("password");

    const authCall =
      mode === "login"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });

    const { data, error } = await authCall;
    setLoadingAction("");

    if (error) {
      if (/rate limit|too many/i.test(error.message || "")) {
        setErrorMessage("⚠ too many attempts — please try again in a few minutes");
      } else {
        setErrorMessage("⚠ something went wrong — please try again");
      }
      return;
    }

    if (mode === "signup") {
      if (data?.user?.id) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username: username.toLowerCase(),
          display_name: username,
          email: email,
        });

        if (profileError) {
          setErrorMessage(profileError.message);
          return;
        }
      }
      setSuccessMessage("✓ account created — check your email to confirm");
      return;
    }

    router.push("/dashboard");
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email) {
      setErrorMessage("⚠ please enter your email address");
      return;
    }

    setLoadingAction("reset");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoadingAction("");

    if (error) {
      if (/rate limit|too many/i.test(error.message || "")) {
        setErrorMessage("⚠ too many attempts — please try again in a few minutes");
      } else {
        setErrorMessage("⚠ something went wrong — please try again");
      }
      return;
    }

    setSuccessMessage("// reset_link_sent — check your email.");
  }

  const magicSent = successMessage.startsWith("✓ magic link sent");
  const resetSent = successMessage.startsWith("// reset_link_sent");
  const isUsernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const showUsernameRuleError =
    mode === "signup" && username.length > 0 && !isUsernameValid;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0f12] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(255,255,255,0.06)] bg-[#111318]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div style={wordmark.container}>
            <div style={wordmark.icon}>&gt;_</div>
            <span style={wordmark.text}>
              Scop<span style={wordmark.accent}>r</span>
            </span>
          </div>
          <Link
            href="/"
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: "0.75rem",
              color: "rgba(74, 222, 128, 0.6)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4ADE80")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(74, 222, 128, 0.6)")
            }
          >
            ← back to home
          </Link>
        </div>
      </nav>

      <main className="relative isolate z-10 flex min-h-screen items-center justify-center px-6 pt-24">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4ADE80] opacity-[0.06] blur-3xl"
        />

        <div
          className="relative z-10 w-full max-w-[420px] overflow-hidden"
          style={cards.accent}
        >
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[#111318] px-4 py-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-[#ff5f57]" />
              <div className="h-2 w-2 rounded-full bg-[#febc2e]" />
              <div className="h-2 w-2 rounded-full bg-[#28c840]" />
            </div>
            <div className="font-mono text-[10px] text-[rgba(255,255,255,0.45)]">
              {mode === "signup"
                ? "// create your account"
                : "// sign in"}
            </div>
          </div>

          <div className="p-8" style={{ paddingBottom: "32px" }}>
            <div className="mb-6 flex rounded-[4px] border border-[rgba(255,255,255,0.08)] p-1">
              <button
                className={`flex-1 rounded-[4px] py-2 text-[11px] font-mono uppercase tracking-widest transition-all ${
                  mode === "login"
                    ? "bg-[#4ADE80] font-bold text-[#0a0a0a]"
                    : "bg-transparent text-[rgba(255,255,255,0.45)] hover:text-white"
                }`}
                onClick={() => {
                  setMode("login");
                  setShowPassword(false);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                type="button"
              >
                LOGIN
              </button>
              <button
                className={`flex-1 rounded-[4px] py-2 text-[11px] font-mono uppercase tracking-widest transition-all ${
                  mode === "signup"
                    ? "bg-[#4ADE80] font-bold text-[#0a0a0a]"
                    : "bg-transparent text-[rgba(255,255,255,0.45)] hover:text-white"
                }`}
                onClick={() => {
                  setMode("signup");
                  setShowPassword(false);
                  setSuccessMessage("");
                  setErrorMessage("");
                }}
                type="button"
              >
                SIGN UP
              </button>
            </div>

            <div className="mt-6">
              <h1 className="mb-2 font-mono text-[1.25rem] font-bold text-white">
                {mode === "login"
                  ? "// welcome back"
                  : "// let's get started"}
              </h1>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="flex justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
                  <span>Email address</span>
                </label>
                <input
                  className="placeholder:text-[rgba(255,255,255,0.35)]"
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => {
                    e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow =
                      "0 0 0 1px rgba(134, 148, 134, 0.2)";
                  }}
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  style={inputs.default}
                />
              </div>

              {mode === "login" ? (
                <>
                  {magicSent ? (
                    <div className="rounded-md border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] px-4 py-3">
                      <p className="font-mono text-sm text-[#4ADE80]">
                        ✓ magic link sent
                      </p>
                      <p className="mt-1 text-sm text-[rgba(255,255,255,0.72)]">
                        Check your email
                      </p>
                    </div>
                  ) : (
                    <button
                      className="text-sm"
                      onClick={handleMagicLink}
                      type="button"
                      style={buttons.primary}
                    >
                      {loadingAction !== "magic" ? (
                        <span style={{ color: "white", marginRight: "8px" }}>
                          ✦
                        </span>
                      ) : null}
                      <span className="font-mono">
                        {loadingAction === "magic"
                          ? "Sending..."
                          : "Send magic link"}
                      </span>
                    </button>
                  )}

                  <button
                    className="transition-colors hover:border-[rgba(74,222,128,0.4)]"
                    onClick={handleGoogle}
                    type="button"
                    style={buttons.ghost}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                      />
                      <path
                        fill="#34A853"
                        d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
                      />
                      <path
                        fill="#EA4335"
                        d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"
                      />
                    </svg>
                    {loadingAction === "google"
                      ? "Sending..."
                      : "Continue with Google"}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[rgba(255,255,255,0.08)]" />
                    </div>
                    <div className="relative mx-auto w-fit bg-[#1c1c1e] px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.45)]">
                      or
                    </div>
                  </div>

                  <button
                    className="px-3 transition-colors hover:border-[rgba(74,222,128,0.45)] hover:text-[#4ADE80]"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                    style={buttons.secondary}
                  >
                    {"// sign in with password"}{" "}
                    <span
                      className={`ml-2 inline-block transition-transform duration-200 ${
                        showPassword ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </>
              ) : null}

              {mode === "login" ? (
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: showPassword ? "200px" : "0px" }}
                >
                  <form className="space-y-4 pt-2" onSubmit={handlePasswordAuth}>
                    <div className="space-y-2">
                      <label className="flex justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
                        <span>Password</span>
                        <button
                          className="normal-case tracking-normal text-[rgba(74,222,128,0.7)] transition-colors hover:text-[#4ADE80]"
                          onClick={handleForgotPassword}
                          type="button"
                        >
                          {loadingAction === "reset"
                            ? "Sending..."
                            : "forgot password?"}
                        </button>
                      </label>
                      <input
                        className="placeholder:text-[rgba(255,255,255,0.35)]"
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={(e) => {
                          e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow =
                            "0 0 0 1px rgba(134, 148, 134, 0.2)";
                        }}
                        placeholder="••••••••"
                        type="password"
                        value={password}
                        style={inputs.default}
                      />
                    </div>

                    {resetSent ? (
                      <div className="rounded-md border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] px-4 py-3">
                        <p className="font-mono text-sm text-[#4ADE80]">
                          {"// reset_link_sent ✓"}
                        </p>
                        <p className="mt-1 text-sm text-[rgba(255,255,255,0.72)]">
                          Check your email
                        </p>
                      </div>
                    ) : null}

                    <button
                      className="mt-2 transition-all hover:border-[rgba(74,222,128,0.6)] hover:bg-[rgba(74,222,128,0.08)]"
                      type="submit"
                      style={buttons.secondary}
                    >
                      {loadingAction === "password" ? "Sending..." : "Sign in →"}
                    </button>
                  </form>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handlePasswordAuth}>
                  <div className="space-y-2">
                    <label className="flex justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
                      <span>Username</span>
                    </label>
                    <input
                      className="placeholder:text-[rgba(255,255,255,0.35)]"
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={(e) => {
                        e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow =
                          "0 0 0 1px rgba(134, 148, 134, 0.2)";
                      }}
                      placeholder="your_handle"
                      type="text"
                      value={username}
                      style={inputs.default}
                    />
                    {isUsernameValid && username.length > 0 ? (
                      <p className="font-mono text-xs text-[#4ADE80]">
                        ✓ username available
                      </p>
                    ) : null}
                    {showUsernameRuleError ? (
                      <p className="font-mono text-xs text-[#ff6b6b]">
                        {"// error: username can only contain letters, numbers and "}
                        underscores
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
                      <span>Create a password</span>
                    </label>
                    <input
                      className="placeholder:text-[rgba(255,255,255,0.35)]"
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => {
                        e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow =
                          "0 0 0 1px rgba(134, 148, 134, 0.2)";
                      }}
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      style={inputs.default}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between px-1 font-mono text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.45)]">
                      <span>Confirm your password</span>
                    </label>
                    <input
                      className="placeholder:text-[rgba(255,255,255,0.35)]"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={(e) => {
                        e.target.style.boxShadow = "0 0 0 1px #4ADE80";
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow =
                          "0 0 0 1px rgba(134, 148, 134, 0.2)";
                      }}
                      placeholder="••••••••"
                      type="password"
                      value={confirmPassword}
                      style={inputs.default}
                    />
                  </div>

                  <button
                    className="mt-2"
                    type="submit"
                    style={buttons.primary}
                  >
                    {loadingAction === "password"
                      ? "Sending..."
                      : "Create my account →"}
                  </button>

                  {successMessage === "✓ account created — check your email to confirm" ? (
                    <div className="rounded-md border border-[rgba(74,222,128,0.3)] bg-[rgba(74,222,128,0.06)] px-4 py-3">
                      <p className="font-mono text-sm text-[#4ADE80]">
                        ✓ account created — check your email to confirm
                      </p>
                      <p className="mt-1 text-sm text-[rgba(255,255,255,0.72)]">
                        You&apos;re all set.
                      </p>
                    </div>
                  ) : null}
                </form>
              )}

              {errorMessage ? (
                <p className="font-mono text-xs text-[#ff6b6b]">
                  {errorMessage}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
