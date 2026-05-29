import type { Route } from "./+types/api.suggest-summary";
import { data } from "react-router";
import { requireAdmin } from "../lib/auth.server";
import Groq from "groq-sdk";

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
      return data(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const prompt = `Buat ringkasan 2-3 kalimat untuk video dengan judul dan deskripsi berikut:\n\nJudul: ${title}\nDeskripsi: ${description}`;

    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = response.choices[0].message.content;

    return data({ summary });
  } catch (error) {
    console.error("Summary generation error:", error);
    return data({ error: "Internal server error" }, { status: 500 });
  }
}
