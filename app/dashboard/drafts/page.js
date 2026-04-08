"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardDraftsPlaceholderPage() {
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-[#111318] px-6 py-16 text-[#e2e2e9]">
      <Link
        href="/dashboard"
        className="font-mono text-sm text-[#4ADE80] underline-offset-4 hover:underline"
      >
        ← back to dashboard
      </Link>
      <p className="mt-10 font-mono text-[#4ADE80]">{"// all drafts — coming soon"}</p>
    </div>
  );
}
