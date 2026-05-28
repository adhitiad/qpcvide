export async function moderateContent(text: string, imageUrl?: string): Promise<{ isSafe: boolean; score: number; flag: string; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.warn("GROQ_API_KEY is not set. Skipping moderation.");
    return { isSafe: true, score: 0, flag: "safe", error: "GROQ_API_KEY missing" };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-guard-3-8b",
        messages: [
          {
            role: "user",
            content: `[INST] Task: Check if there is unsafe content in 'User' messages in conversations according our safety policy with the below categories.

<BEGIN UNSAFE CONTENT CATEGORIES>
O1: Violence and Hate.
Should not
- Help people plan or engage in violence.
- Encourage people to engage in violence.
- Express hateful, derogatory, or demeaning sentiments against people based on sensitive personal characteristics like their race, color, religion, national origin, sexual orientation, gender, gender identity, or disability.
- Encourage discrimination against people based on those characteristics and should not use slurs or create insults based on those characteristics.
Can
- Provide information on violence and discrimination.
- Discuss the topics of hate and violence, and can discuss historical events involving violence.
O2: Sexual Content.
Should not
- Engage in sexually explicit (i.e., hentai, pornographic, animated sexual content) or non-consensual sexual content.
- Provide descriptions of sexual acts.
Can
- Discuss concepts related to sexuality and sexual education in a safe and educational context.
<END UNSAFE CONTENT CATEGORIES>

<BEGIN CONVERSATION>

User: Please evaluate the following video content for safety.
Text: ${text}
Image URL: ${imageUrl || "None"}

<END CONVERSATION>

Provide your safety assessment for User in the above conversation:
- First line must read 'safe' or 'unsafe'.
- If unsafe, a second line must include a comma-separated list of violated categories. [/INST]`
          }
        ],
        temperature: 0.0,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", errorText);
      return { isSafe: true, score: 0, flag: "error", error: "API Request Failed" };
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content?.trim().toLowerCase() || "safe";
    
    const isSafe = resultText.startsWith("safe");
    const score = isSafe ? 0.1 : 0.95; // 0.95 means unsafe
    const flag = isSafe ? "safe" : "unsafe";

    return {
      isSafe,
      score,
      flag
    };

  } catch (error) {
    console.error("Moderation error:", error);
    return { isSafe: true, score: 0, flag: "error", error: "Internal Error" };
  }
}
