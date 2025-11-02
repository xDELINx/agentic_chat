import axios from "axios";

/**
 * webSearch(query): simple, pluggable tool function.
 * - By default this is a SIMULATED search (quick mock).
 * - Replace implementation with a real search API (Bing / SerpAPI / Google CSE) by adding API key and parsing.
 */
export const webSearch = async (query: string): Promise<string> => {
  // If you have a real search API, implement here and return summarized results.
  // Example placeholder: do a quick DuckDuckGo HTML scrape (simple) — this is fragile.
  try {
    // QUICK MOCK: call DuckDuckGo's HTML search and extract a few snippets (no API key)
    const url = `https://duckduckgo.com/html?q=${encodeURIComponent(query)}`;
    const r = await axios.get(url, { responseType: "text" });
    const html = r.data as string;

    // crude snippet extraction - grab first <a class="result__a"> text content
    const snippets: string[] = [];
    const regex = /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/gms;
    let m;
    while ((m = regex.exec(html)) && snippets.length < 5) {
      // strip HTML tags
      const s = m[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (s) snippets.push(s);
    }

    if (snippets.length) {
      return `Search results (top ${snippets.length}) for "${query}":\n- ${snippets.join("\n- ")}\n(links omitted)`;
    }

    // fallback simulated output
    return `Simulated search results summary for "${query}": (no real results parsed).`;
  } catch (e: any) {
    console.warn("webSearch: real search failed or blocked, returning simulated output", e.message || e);
    return `Simulated search for "${query}": brief summary placeholder.`;
  }
};
