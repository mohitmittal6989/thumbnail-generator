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
 * 2. Fetch real-time web intelligence using Google Search Grounding with Gemini
 */
const fetchGeminiWebGrounding = async (topic, extraPrompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = [
    `You are a visual research specialist analyzing a YouTube video topic to ensure the thumbnail image accurately reflects the real-world subject.`,
    `Video Topic: "${topic}"`,
    extraPrompt ? `Extra Creative Direction: "${extraPrompt}"` : "",
    `Provide concise visual intelligence in 2-3 sentences covering:`,
    `1. The exact physical subject, real-world objects, entities, or people.`,
    `2. Authentic real-world visual hallmarks, real colors, textures, and iconic details.`,
    `3. The most natural setting/environment (e.g. rustic bakery kitchen, modern developer desk, racetrack, studio).`,
    `Be direct, factual, and strictly focused on physical visual reality.`
  ].filter(Boolean).join("\n");

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 250
          }
        })
      },
      5500
    );

    if (!response.ok) return null;

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidateText ? sanitizeText(candidateText) : null;
  } catch {
    return null;
  }
};

/**
 * 3. Fallback LLM Semantic Analysis (Groq) to understand topic domain and visual anchors
 */
const analyzeTopicWithGroq = async (topic, extraPrompt, webSnippet = "") => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

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
  } catch {
    return null;
  }
};

/**
 * Main function: Researches and understands the title context & extra creative direction from the web
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

  // 1. Try Gemini Real-time Google Search Grounding
  const webGrounding = await fetchGeminiWebGrounding(cleanTopic, extraPrompt);
  if (webGrounding) {
    return {
      topic: cleanTopic,
      context: webGrounding,
      source: "google_search_grounding"
    };
  }

  // 2. Try Wikipedia Entity Search + Groq Synthesis
  const wiki = await fetchWikipediaSnippet(cleanTopic);
  const wikiSnippet = wiki ? `${wiki.title}: ${wiki.snippet}` : "";
  const groqAnalysis = await analyzeTopicWithGroq(cleanTopic, extraPrompt, wikiSnippet);

  if (groqAnalysis) {
    return {
      topic: cleanTopic,
      context: groqAnalysis,
      source: wiki ? "wikipedia_and_llm" : "llm_domain_reasoning"
    };
  }

  // 3. Fallback direct context
  return {
    topic: cleanTopic,
    context: `Authentic real-world representation of ${cleanTopic}${extraPrompt ? `, specifically featuring: ${extraPrompt}` : ""}`,
    source: "direct_fallback"
  };
};

module.exports = {
  getTopicContext,
  fetchWikipediaSnippet,
  fetchGeminiWebGrounding
};
