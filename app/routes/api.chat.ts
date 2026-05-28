import type { Route } from "./+types/api.chat";

// This is the backend proxy for the future "Self: After Dark" model via SillyTavern.
// For now, it acts as a generic OpenAI-compatible chat completion proxy.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const SILLY_TAVERN_API_URL = process.env.SILLY_TAVERN_API_URL || "http://127.0.0.1:5000/v1/chat/completions";
  const SILLY_TAVERN_API_KEY = process.env.SILLY_TAVERN_API_KEY || "";

  try {
    const body = await request.json();

    // Proxy the request to the SillyTavern/Local LLM endpoint
    const response = await fetch(SILLY_TAVERN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SILLY_TAVERN_API_KEY}`
      },
      body: JSON.stringify({
        messages: body.messages,
        model: body.model || "self-after-dark",
        temperature: 0.9,
        max_tokens: 500,
        stream: false // set to true if implementing SSE later
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM responded with status: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Chat API proxy failed:", error);
    // Graceful fallback for now
    return Response.json({
      choices: [
        {
          message: {
            role: "assistant",
            content: "*Sigh*... The SillyTavern backend is currently sleeping. Please configure the Self: After Dark model backend to continue our chat."
          }
        }
      ]
    }, { status: 503 });
  }
}
