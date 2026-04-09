import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You are Scopr's AI — a brilliant, encouraging friend who knows 
about startups and building products. You are warm, direct, 
specific and honest. You never use jargon. You make the person 
feel capable and excited.

You are generating a launch pack for a validated startup idea. 
The founder has already received a "Build it" decision. Now you 
need to give them everything they need to start.

Return a JSON object only — no markdown, no preamble, 
no explanation outside the JSON.

{
  "one_pager": "<a beautifully written one page summary of the idea. 
    Include: the problem, the solution, the target user, the moat, 
    the business model. Written warmly and specifically. 
    Minimum 300 words.>",
  "mvp_scope": "<the smallest version of this product that proves 
    the idea works. Be specific about what to build first and what 
    to leave for later. Include recommended tech stack if relevant. 
    Minimum 300 words.>",
  "prd": "<a full product requirements document. Include: vision, 
    core user flow, key screens, success metrics for MVP. 
    Be specific to this idea. Minimum 400 words.>"
}

Always be specific to the idea. Never be generic. 
Make the person feel seen and capable.`;

function extractTextFromClaudeResponse(content = []) {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseLaunchPackJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Claude did not return valid JSON.");
    }
    return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const rawIdeaId = body?.idea_id ?? body?.ideaId;
    const ideaId = typeof rawIdeaId === "string" ? rawIdeaId.trim() : rawIdeaId;

    if (!ideaId) {
      return Response.json({ error: "Missing idea_id" }, { status: 400 });
    }

    const { data: existingPack, error: existingError } = await supabaseAdmin
      .from("launch_packs")
      .select("id, one_pager, mvp_scope, prd")
      .eq("idea_id", ideaId)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    if (existingPack?.one_pager && existingPack?.mvp_scope && existingPack?.prd) {
      return Response.json({
        success: true,
        launch_pack: {
          one_pager: existingPack.one_pager,
          mvp_scope: existingPack.mvp_scope,
          prd: existingPack.prd,
        },
      });
    }

    const { data: idea, error: ideaError } = await supabaseAdmin
      .from("ideas")
      .select("id, title, description")
      .eq("id", ideaId)
      .single();

    if (ideaError || !idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }

    const { data: decisionRow, error: decisionError } = await supabaseAdmin
      .from("decisions")
      .select("market_score, founder_score, full_plan, decision")
      .eq("idea_id", ideaId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (decisionError) {
      throw decisionError;
    }

    if (!decisionRow || decisionRow.decision !== "build") {
      return Response.json(
        { error: "Launch pack is only available for a build decision." },
        { status: 400 }
      );
    }

    const { data: answers, error: answersError } = await supabaseAdmin
      .from("quiz_answers")
      .select("question_number, question, answer")
      .eq("idea_id", ideaId)
      .order("question_number", { ascending: true });

    if (answersError) {
      throw answersError;
    }

    if (!answers || answers.length < 7) {
      return Response.json({ error: "Missing quiz answers" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured.");
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const fullPlan =
      typeof decisionRow.full_plan === "string" ? decisionRow.full_plan : "";
    const marketScore = decisionRow.market_score;
    const founderScore = decisionRow.founder_score;

    const userPrompt = `
Idea title: ${idea.title || "Untitled idea"}
Idea description: ${idea.description || "No description provided"}

Market score: ${marketScore}
Founder score: ${founderScore}

Full plan (context from earlier analysis):
${fullPlan || "Not provided."}

Founder answers:
${answers
  .map(
    (item) =>
      `Q${item.question_number}: ${item.question}\nA${item.question_number}: ${item.answer || ""}`
  )
  .join("\n\n")}
`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      temperature: 0.45,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText = extractTextFromClaudeResponse(response.content);
    const parsed = parseLaunchPackJson(responseText);

    const one_pager = typeof parsed.one_pager === "string" ? parsed.one_pager : "";
    const mvp_scope = typeof parsed.mvp_scope === "string" ? parsed.mvp_scope : "";
    const prd = typeof parsed.prd === "string" ? parsed.prd : "";

    if (!one_pager.trim() || !mvp_scope.trim() || !prd.trim()) {
      throw new Error("Incomplete launch pack from model.");
    }

    const { error: insertError } = await supabaseAdmin.from("launch_packs").insert({
      idea_id: ideaId,
      one_pager,
      mvp_scope,
      prd,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: row } = await supabaseAdmin
          .from("launch_packs")
          .select("one_pager, mvp_scope, prd")
          .eq("idea_id", ideaId)
          .single();
        if (row) {
          return Response.json({
            success: true,
            launch_pack: {
              one_pager: row.one_pager,
              mvp_scope: row.mvp_scope,
              prd: row.prd,
            },
          });
        }
      }
      throw insertError;
    }

    return Response.json({
      success: true,
      launch_pack: { one_pager, mvp_scope, prd },
    });
  } catch (error) {
    console.error("Launch pack route failed:", error);
    return Response.json(
      { error: "⚠ Something went wrong — your idea is safe. Try again in a moment." },
      { status: 500 }
    );
  }
}
