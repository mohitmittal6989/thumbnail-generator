const Groq = require("groq-sdk");

const sanitizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

// Fast fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * 1. Fetch real-world Wikipedia knowledge snippet for known entities
 */
const fetchWikipediaSnippet = async (query) => {
  try {
    const cleanQuery = query.replace(/[^\w\s-]/g, " ").trim();
    if (!cleanQuery) return null;

    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&utf8=1`;
    const response = await fetchWithTimeout(url, {}, 3000);
    if (!response.ok) return null;

    const data = await response.json();
    const firstResult = data.query?.search?.[0];
    if (!firstResult) return null;

    const snippet = firstResult.snippet.replace(/<\/?[^>]+(>|$)/g, "");
    return {
      title: firstResult.title,
      snippet: snippet.slice(0, 250)
    };
  } catch {
    return null;
  }
};

/**
 * 2. LLM Semantic Analysis (Groq) to understand topic domain and visual anchors
 */
const analyzeTopicWithGroq = async (topic, extraPrompt, webSnippet = "") => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  try {
    const completion = await groq.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: "You are a visual researcher. Break down the video topic into authentic real-world visual components. Identify the exact physical subject, authentic environment, and key visual details in 2 concise sentences."
        },
        {
          role: "user",
          content: `Topic: "${topic}"\n${extraPrompt ? `Extra Details: "${extraPrompt}"\n` : ""}${webSnippet ? `Web Knowledge: ${webSnippet}` : ""}`
        }
      ]
    });

    const output = completion.choices?.[0]?.message?.content;
    return output ? sanitizeText(output) : null;
  } catch (error) {
    console.error("Groq topic intelligence error:", error.message || error);
    return null;
  }
};

/**
 * Main function: Researches and understands the title context & extra creative direction using Groq
 */
const getTopicContext = async (topic, extraPrompt = "") => {
  const cleanTopic = sanitizeText(topic);
  if (!cleanTopic) {
    return {
      topic: "",
      context: "",
      source: "none"
    };
  }

  // 1. Try Wikipedia Entity Search + Groq Synthesis
  const wiki = await fetchWikipediaSnippet(cleanTopic);
  const wikiSnippet = wiki ? `${wiki.title}: ${wiki.snippet}` : "";
  const groqAnalysis = await analyzeTopicWithGroq(cleanTopic, extraPrompt, wikiSnippet);

  if (groqAnalysis) {
    return {
      topic: cleanTopic,
      context: groqAnalysis,
      source: wiki ? "wikipedia_and_groq" : "groq_domain_reasoning"
    };
  }

  // 2. Direct programmatic fallback
  return {
    topic: cleanTopic,
    context: `Authentic real-world representation of ${cleanTopic}${extraPrompt ? `, specifically featuring: ${extraPrompt}` : ""}`,
    source: "direct_fallback"
  };
};

module.exports = {
  getTopicContext,
  fetchWikipediaSnippet,
  analyzeTopicWithGroq
};
