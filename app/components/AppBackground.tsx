"use client";

import { useEffect, useRef } from "react";

export default function AppBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      radius: Math.random() * 1.6 + 0.7,
      speed: Math.random() * 0.28 + 0.12,
    }));

    let rafId = 0;
    const draw = () => {
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -4) {
          p.y = canvas.clientHeight + 4;
          p.x = Math.random() * canvas.clientWidth;
        }
        context.beginPath();
        context.fillStyle = "rgba(74, 222, 128, 0.20)";
        context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#111318] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(74,222,128,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(71,85,105,0.2),transparent_35%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <main className="relative isolate z-10 min-h-screen">
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

        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}

