import { NextRequest, NextResponse } from "next/server";
import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, embed } from "ai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a health education assistant for MyPMOS, a companion app for people with Polyendocrine Metabolic Ovarian Syndrome (PMOS, formerly known as PCOS).

Your role is to:
- Explain medical terms and concepts in plain, friendly language
- Help users understand what their provider may have told them
- Summarize what peer-reviewed research says about PMOS topics
- Encourage users to bring questions to their healthcare provider

You must NEVER:
- Diagnose or suggest a diagnosis
- Interpret a specific user's lab results or symptoms
- Recommend, adjust, or comment on specific medications for the user
- Tell a user whether their specific situation is or isn't serious

When a question requires clinical judgment about someone's specific situation, say:
"That's a great question to bring to your provider — they know your full health picture and can give you personalized guidance."

Always cite the source of information when retrieved from medical literature. If information isn't in your sources, say so honestly rather than guessing.

If a user expresses distress or mentions eating disorder behaviors, respond with warmth and direct them to the National Alliance for Eating Disorders helpline: 1-866-662-1235.

Tone: warm, supportive, clear. You are a knowledgeable friend, not a clinician.`;

// Resolve config at REQUEST time, never at module load. Creating the Vertex /
// Supabase clients at the top level made Next evaluate them during the build's
// page-data collection, which crashed the whole deploy when any env var was
// missing. Keep all env access + client creation inside the handler.
function getConfig() {
  // On Vercel there is no ADC file, so pass the service-account creds directly.
  // GOOGLE_VERTEX_CREDENTIALS = the full service-account JSON (as a string).
  const rawCreds = process.env.GOOGLE_VERTEX_CREDENTIALS;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawCreds || !supabaseUrl || !supabaseKey) return null;

  let credentials: { project_id?: string; client_email?: string; private_key?: string };
  try {
    credentials = JSON.parse(rawCreds);
  } catch {
    return null;
  }
  const project = process.env.GOOGLE_VERTEX_PROJECT || credentials.project_id;
  if (!project) return null;
  const location = process.env.GOOGLE_VERTEX_LOCATION || "us-central1";
  const chatModel = process.env.GOOGLE_VERTEX_CHAT_MODEL || "gemini-2.5-flash";
  return { credentials, project, location, chatModel, supabaseUrl, supabaseKey };
}

export async function POST(req: NextRequest) {
  const cfg = getConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "The chat assistant isn't set up yet. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const auth = { googleAuthOptions: { credentials: cfg.credentials, projectId: cfg.project } };
    // Embeddings live in us-central1 (matches the ingestion script); chat uses
    // the configured location.
    const vertexEmbedding = createVertex({ project: cfg.project, location: "us-central1", ...auth });
    const vertexChat = createVertex({ project: cfg.project, location: cfg.location, ...auth });
    const supabase = createClient(cfg.supabaseUrl, cfg.supabaseKey);

    // Embed the user's question
    const { embedding } = await embed({
      model: vertexEmbedding.textEmbeddingModel("gemini-embedding-001"),
      value: lastMessage,
    });

    // Retrieve relevant chunks from Supabase
    const { data: chunks, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.6,
      match_count: 5,
    });

    if (error) console.error("Retrieval error:", error);

    const context =
      chunks && chunks.length > 0
        ? chunks.map((c: any) => `Source: ${c.source}\n${c.content}`).join("\n\n")
        : "No relevant sources found in medical literature.";

    // Generate response with Gemini (via Vertex)
    const { text } = await generateText({
      model: vertexChat(cfg.chatModel),
      system: SYSTEM_PROMPT + `\n\nRelevant information from medical literature:\n${context}`,
      messages,
    });

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
