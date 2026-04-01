export const analyzeImageWithGroq = async (base64Image, mimeType, prompt) => {
  const apiKey = process.env.REACT_APP_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ API key not found. Please set REACT_APP_GROQ_API_KEY.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      // We use the meta-llama/llama-4-scout-17b-16e-instruct vision model because we are passing image data.
      // llama-3.3-70b-versatile is a text-only model and cannot accept images directly.
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API Error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  // LLaMA models frequently wrap JSON in markdown backticks even in JSON mode
  content = content.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error("Failed to parse JSON from Groq:", content);
    throw new Error("Invalid JSON response from Groq API");
  }
};
