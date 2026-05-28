import type { Route } from "./+types/api.select-thumbnail";
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
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return data({ error: "Images array is required" }, { status: 400 });
    }

    // Call Groq Vision API to determine the best thumbnail
    // Llama-3 Vision (llama-3.2-90b-vision-preview or similar)
    const prompt = "Anda adalah asisten kurasi thumbnail video. Dari gambar-gambar berikut, berikan indeks (0 sampai N-1) dari gambar yang paling estetis, menarik perhatian, dan memiliki pencahayaan terbaik. Kembalikan HANYA format JSON seperti ini: {\"bestIndex\": 0}";

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.map(url => ({
            type: "image_url",
            image_url: { url }
          }))
        ]
      }
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Vision API Error:", err);
      return data({ error: "Failed to process images" }, { status: 500 });
    }

    const json = await response.json();
    const content = json.choices[0].message.content;
    const parsed = JSON.parse(content);

    return data({ bestIndex: parsed.bestIndex || 0 });
  } catch (error) {
    console.error("Thumbnail selection error:", error);
    return data({ error: "Internal server error" }, { status: 500 });
  }
}
