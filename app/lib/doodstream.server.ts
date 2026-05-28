const DOODSTREAM_API_URL = "https://doodapi.co/api";

function getApiKey() {
  const key = process.env.DOODSTREAM_API_KEY;
  if (!key) {
    console.warn("DOODSTREAM_API_KEY is not defined in environment variables");
  }
  return key;
}

export async function getFileInfo(fileCode: string) {
  const key = getApiKey();
  if (!key) return null;

  try {
    const response = await fetch(`${DOODSTREAM_API_URL}/file/info?key=${key}&file_code=${fileCode}`);
    if (!response.ok) {
      throw new Error(`Doodstream API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch Doodstream file info", error);
    return null;
  }
}

export async function remoteUpload(videoUrl: string, title?: string) {
  const key = getApiKey();
  if (!key) return null;

  try {
    let url = `${DOODSTREAM_API_URL}/upload/url?key=${key}&url=${encodeURIComponent(videoUrl)}`;
    if (title) {
      url += `&title=${encodeURIComponent(title)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Doodstream API error: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to trigger remote upload to Doodstream", error);
    return null;
  }
}
