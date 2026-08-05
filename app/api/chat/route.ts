import { NextRequest, NextResponse } from "next/server";
import { createVertex } from "@ai-sdk/google-vertex";
import { generateText, embed } from "ai";
import { createClient } from "@supabase/supabase-js";

const vertexEmbedding = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT!,
  location: "us-central1",
});

const vertexChat = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT!,
  location: process.env.GOOGLE_VERTEX_LOCATION ?? "us",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

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

    const context = chunks && chunks.length > 0
      ? chunks.map((c: any) => `Source: ${c.source}\n${c.content}`).join("\n\n")
      : "No relevant sources found in medical literature.";

    // Generate response with Gemini
    const { text } = await generateText({
      model: vertexChat("gemini-3.5-flash"),
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
