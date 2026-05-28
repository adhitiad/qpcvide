import type { Route } from "./+types/api.suggest-summary";
import { data } from "react-router";
import { requireAdmin } from "../lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return data({ error: "GROQ_API_KEY is not configured" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return data({ error: "Title and description are required" }, { status: 400 });
    }

    const prompt = `Buat ringkasan 2-3 kalimat untuk video dengan judul dan deskripsi berikut:\n\nJudul: ${title}\nDeskripsi: ${description}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return data({ error: "Failed to generate summary" }, { status: 500 });
    }

    const json = await response.json();
    const summary = json.choices[0].message.content;

    return data({ summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    return data({ error: "Internal server error" }, { status: 500 });
  }
}
