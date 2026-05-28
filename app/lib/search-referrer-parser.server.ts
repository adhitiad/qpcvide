export interface ParsedReferrer {
  searchEngine: string | null;
  searchKeywords: string | null;
}

export function parseSearchReferrer(referrerUrl: string): ParsedReferrer {
  if (!referrerUrl) {
    return { searchEngine: null, searchKeywords: null };
  }

  try {
    const url = new URL(referrerUrl);
    const hostname = url.hostname.toLowerCase();
    
    let searchEngine: string | null = null;
    let searchKeywords: string | null = null;

    if (hostname.includes("google.")) {
      searchEngine = "google";
      searchKeywords = url.searchParams.get("q");
    } else if (hostname.includes("bing.com")) {
      searchEngine = "bing";
      searchKeywords = url.searchParams.get("q");
    } else if (hostname.includes("yahoo.com")) {
      searchEngine = "yahoo";
      searchKeywords = url.searchParams.get("p");
    } else if (hostname.includes("yandex.")) {
      searchEngine = "yandex";
      searchKeywords = url.searchParams.get("text");
    } else if (hostname.includes("duckduckgo.com")) {
      searchEngine = "duckduckgo";
      searchKeywords = url.searchParams.get("q");
    }

    if (searchKeywords) {
      searchKeywords = searchKeywords.trim().toLowerCase();
    }

    return { searchEngine, searchKeywords };
  } catch (e) {
    // Invalid URL
    return { searchEngine: null, searchKeywords: null };
  }
}
