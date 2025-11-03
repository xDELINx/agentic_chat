import axios from "axios";

export const webSearch = async (query: string): Promise<string> => {
  try {
    const url = `https://duckduckgo.com/html?q=${encodeURIComponent(query)}`;
    const r = await axios.get(url, { responseType: "text" });
    const html = r.data as string;

    const snippets: string[] = [];
    const regex = /<a[^>]*class="result__a"[^>]*>(.*?)<\/a>/gms;
    let m;
    while ((m = regex.exec(html)) && snippets.length < 5) {
      const s = m[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      if (s) snippets.push(s);
    }

    if (snippets.length) {
      return `Search results (top ${snippets.length}) for "${query}":\n- ${snippets.join("\n- ")}\n(links omitted)`;
    }

    return `Simulated search results summary for "${query}": (no real results parsed).`;
  } catch (e: any) {
    console.warn("webSearch: real search failed or blocked, returning simulated output", e.message || e);
    return `Simulated search for "${query}": brief summary placeholder.`;
  }
};
