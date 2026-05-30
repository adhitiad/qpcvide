import Groq from "groq-sdk";

// Telegram Bot Integration for Auiso

/**
 * Sends a notification to a Telegram group/channel about a newly uploaded video.
 * @param video The newly created video object containing title, slug, synopsis, and thumbnail
 * @param appUrl The base URL of the application (e.g., https://auiso.com)
 */
export async function sendNewVideoNotification(
  video: {
    title: string;
    slug: string;
    synopsis: string;
    thumbnail?: string | null;
  },
  appUrl: string,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing. Skipping Telegram notification.",
    );
    return;
  }

  const videoUrl = `${appUrl}/video/${video.slug}`;
  const caption = await generateAICaption(video, videoUrl);

  try {
    if (video.thumbnail) {
      // Send Photo with Caption
      const apiUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          photo: video.thumbnail,
          caption: caption,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        // Fallback to text message if photo sending fails
        console.error("Failed to send Telegram photo:", await response.text());
        await sendTextMessage(token, chatId, caption);
      }
    } else {
      // Send Text only if no thumbnail
      await sendTextMessage(token, chatId, caption);
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
}

async function sendTextMessage(token: string, chatId: string, text: string) {
  const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
    }),
  });
}

async function generateAICaption(
  video: { title: string; synopsis: string },
  videoUrl: string,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  const fallbackCaption = `🎬 **Video Baru Telah Rilis!**\n\n📌 **${video.title}**\n\nTonton sekarang juga di Auiso:\n🔗 ${videoUrl}`;

  if (!apiKey) return fallbackCaption;

  try {
    const groq = new Groq({ apiKey });
    const prompt = `Anda adalah copywriter handal untuk channel Telegram platform Auiso (situs video dewasa premium).\nBuat 1 pesan pengumuman (caption) singkat bergaya clickbait, inovatif, dan sangat menarik perhatian (menggunakan emoji yang pas) untuk mempromosikan rilis video berikut.\n\nJudul Video: ${video.title}\nSinopsis: ${video.synopsis}\nLink Nonton: ${videoUrl}\n\nATURAN:\n- Harus dalam bahasa Indonesia yang luwes (casual, slightly sensual but not vulgar).\n- Sertakan judul video yang di-bold (**Judul**).\n- Pesan maksimal 4-5 baris saja agar mudah dibaca di layar HP.\n- PASTIKAN memberikan link nonton di akhir pesan persis seperti ini: 🔗 ${videoUrl}\n- Jangan pernah menambahkan hashtag berlebihan, cukup 1 atau 2 hashtag yang relevan.\n- Keluarkan HANYA hasil akhir pesannya saja tanpa kata pembuka/penutup dari Anda. Jangan gunakan kata-kata seperti "Berikut adalah captionnya".`;

    const response = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiCaption = response.choices[0]?.message?.content?.trim();
    return aiCaption || fallbackCaption;
  } catch (error) {
    console.error("Failed to generate AI caption for Telegram:", error);
    return fallbackCaption;
  }
}
