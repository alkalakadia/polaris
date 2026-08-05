import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
import { createVertex } from "@ai-sdk/google-vertex";
import { embedMany } from "ai";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import PDFParser from "pdf2json";

function extractTextFromPDF(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataReady", (data: any) => {
      const text = data.Pages.flatMap((page: any) =>
        page.Texts.map((t: any) => {try {return decodeURIComponent(t.R.map((r: any) => r.T).join(""));} catch { return t.R.map((r: any) => r.T).join("");
          } })
      ).join(" ");
      resolve(text);
    });
    parser.on("pdfParser_dataError", reject);
    parser.loadPDF(filePath);
  });
}

const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT!,
  location: process.env.GOOGLE_VERTEX_LOCATION ?? "us-central1",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
  }
  return chunks;
}

async function ingestPDF(filePath: string) {
  console.log(`Processing ${filePath}...`);
  const text = await extractTextFromPDF(filePath);
  const chunks = chunkText(text);
  const source = path.basename(filePath);

  // Embed in batches of 20
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const { embeddings } = await embedMany({
      model: vertex.textEmbeddingModel("gemini-embedding-001"),
      values: batch,
    });

    for (let j = 0; j < batch.length; j++) {
      const { error } = await supabase.from("documents").insert({
        content: batch[j],
        embedding: embeddings[j],
        source,
        chunk_index: i + j,
      });
      if (error) console.error("Insert error:", error);
    }
    console.log(`  Chunks ${i + 1}–${Math.min(i + batchSize, chunks.length)} of ${chunks.length} done`);
  }
}

async function main() {
  const corpusDir = "./corpus";
  const files = fs.readdirSync(corpusDir).filter(f => f.endsWith(".pdf"));
  if (files.length === 0) {
    console.log("No PDFs found in ./corpus");
    return;
  }
  for (const file of files) {
    await ingestPDF(path.join(corpusDir, file));
  }
  console.log("Ingestion complete!");
}

main().catch(console.error);
