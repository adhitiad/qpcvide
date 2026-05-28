import type { Route } from "./+types/api.suggest-tags";
import { data } from "react-router";
import { requireAdmin } from "../lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  // Just to check if feature is enabled via GET request
  const hasKey = !!process.env.GROQ_API_KEY;
  return data({ enabled: hasKey });
}

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

    if (!title) {
      return data({ error: "Title is required" }, { status: 400 });
    }

    const prompt = `Berikan daftar tag dan kategori yang relevan untuk video dengan judul dan deskripsi berikut. Kembalikan HANYA JSON murni tanpa markdown, tanpa penjelasan, persis dengan struktur ini: {"tags": ["tag1", "tag2"], "categories": ["cat1", "cat2"]}\n\nJudul: ${title}\nDeskripsi: ${description || "Tidak ada deskripsi."}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return data({ error: "Failed to fetch suggestions from AI" }, { status: 502 });
    }

    const json = await response.json();
    const content = json.choices[0]?.message?.content || "{}";
    
    // Parse the JSON string from the AI
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON from Groq:", content);
      return data({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    return data({
      tags: Array.isArray(parsedContent.tags) ? parsedContent.tags : [],
      categories: Array.isArray(parsedContent.categories) ? parsedContent.categories : [],
    });

  } catch (error) {
    console.error("Suggest tags error:", error);
    return data({ error: "Internal Server Error" }, { status: 500 });
  }
}
