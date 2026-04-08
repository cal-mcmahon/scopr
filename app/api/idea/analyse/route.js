import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT = `You are Scopr's AI — a brilliant, encouraging friend who happens to 
know a lot about startups and building products. You are warm, direct, 
specific and honest. You never use jargon. You never give generic advice. 
You always make the person feel seen.

You are analysing a startup idea based on the founder's answers to 
7 questions. You must return a JSON object only — no markdown, 
no preamble, no explanation outside the JSON.

The JSON must follow this exact structure:
{
  "market_score": <integer 1-100>,
  "founder_score": <integer 1-100>,
  "decision": <"build" | "refine" | "revisit">,
  "decision_headline": <one punchy sentence, warm and specific to their idea>,
  "decision_summary": <2-3 sentences, feels like a smart co-founder speaking, 
    specific to their idea, never generic>,
  "market_analysis": <2-3 sentences on the market signals from Q1-5>,
  "founder_analysis": <2-3 sentences on the founder fit from Q6-7>,
  "next_step": <one clear, specific, actionable next step — not generic>,
  "full_plan": <a detailed plan for getting started, written warmly and 
    specifically for this idea — minimum 200 words>
}

Decision rules:
- "build": Q1-5 show strong market signals AND Q6-7 show strong founder fit
- "refine": addressable gaps in Q1-5 that can be fixed in 2-4 weeks, 
  AND Q7 is strong (founder has enthusiasm)
- "revisit": structural issues OR Q7 is low — if the founder wouldn't 
  enjoy this for 6-12 months, ALWAYS revisit, never refine

Scores:
- market_score: 1-100 based on Q1-5 answers
- founder_score: 1-100 based on Q6-7 answers

Always be specific to the idea. Never be generic. Make the person feel seen.`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractTextFromClaudeResponse(content = []) {
  return content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseDecisionJson(rawText) {
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

    console.log("[analyse] received body:", body);
    console.log("[analyse] received idea_id:", ideaId);

    if (!ideaId) {
      return Response.json({ error: "Missing idea_id" }, { status: 400 });
    }

    const { data: idea, error: ideaError } = await supabaseAdmin
      .from("ideas")
      .select("id, title, description")
      .eq("id", ideaId)
      .single();

    console.log("[analyse] idea query response:", { idea, ideaError });

    if (ideaError || !idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
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

    const userPrompt = `
Idea title: ${idea.title || "Untitled idea"}
Idea description: ${idea.description || "No description provided"}

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
      max_tokens: 2200,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText = extractTextFromClaudeResponse(response.content);
    const parsed = parseDecisionJson(responseText);

    const marketScore = Math.max(1, Math.min(100, Number(parsed.market_score) || 1));
    const founderScore = Math.max(1, Math.min(100, Number(parsed.founder_score) || 1));
    const decision = ["build", "refine", "revisit"].includes(parsed.decision)
      ? parsed.decision
      : "revisit";
    const fullPlan = typeof parsed.full_plan === "string" ? parsed.full_plan : "";

    const { data: insertedDecision, error: insertError } = await supabaseAdmin
      .from("decisions")
      .insert({
        idea_id: ideaId,
        market_score: marketScore,
        founder_score: founderScore,
        decision,
        full_plan: fullPlan,
      })
      .select("id")
      .single();

    if (insertError || !insertedDecision) {
      throw insertError || new Error("Failed to save decision.");
    }

    const { error: updateIdeaError } = await supabaseAdmin
      .from("ideas")
      .update({ status: decision })
      .eq("id", ideaId);

    if (updateIdeaError) {
      throw updateIdeaError;
    }

    return Response.json({ success: true, decision_id: insertedDecision.id });
  } catch (error) {
    console.error("Analyse route failed:", error);
    return Response.json(
      { error: "⚠ something went wrong — your answers are safe" },
      { status: 500 }
    );
  }
}
