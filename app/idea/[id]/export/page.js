"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function IdeaExportPlaceholderPage() {
  const params = useParams();
  const ideaId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return (
    <div className="min-h-screen bg-[#111318] px-6 py-16 text-[#e2e2e9]">
      <Link
        href={ideaId ? `/idea/${ideaId}/launch` : "/dashboard"}
        className="font-mono text-sm text-[#4ADE80] underline-offset-4 hover:underline"
      >
        {"← back to launch pack"}
      </Link>
      <p className="mt-10 font-mono text-[#4ADE80]">{"// export markdown — coming soon"}</p>
    </div>
  );
}
