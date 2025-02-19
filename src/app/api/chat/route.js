const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = "https://api.openai.com/v1/chat/completions";

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Format the prompt for OpenAI
const formatPrompt = (message) => {
  return [{
    role: "user",
    content: message
  }];
};

export async function POST(req) {
  try {
    const { message } = await req.json();
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: formatPrompt(message),
          max_tokens: 512,
          temperature: 0.7,
          top_p: 0.95,
        }),
      });

      const data = await response.json();
      console.log(data);

      // Check if we hit rate limits
      if (data.error?.type === "rate_limit_exceeded") {
        console.log(`Rate limit hit, attempt ${retries + 1} of ${maxRetries}`);
        await sleep(1000);
        retries++;
        continue;
      }

      // If we got a valid response
      if (data.choices?.[0]?.message?.content) {
        let cleanResponse = data.choices[0].message.content.trim();

        // If response is empty or too short, ask for clarification
        if (!cleanResponse || cleanResponse.length < 5) {
          cleanResponse = "I understand. Could you please provide more details or rephrase that?";
        }

        return new Response(JSON.stringify({
          response: cleanResponse
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // If we got here, something else went wrong
      throw new Error('Invalid response format from API');
    }

    // If we exhausted all retries
    throw new Error('Model is still loading after maximum retries');

  } catch (error) {
    console.error('Error:', error);
    
    // Provide more specific error messages
    let errorMessage = "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
    
    if (error.message.includes("loading")) {
      errorMessage = "I'm still warming up. Please try again in a few seconds.";
    } else if (error.message.includes("rate limit")) {
      errorMessage = "I've been thinking too much! Please wait a moment before trying again.";
    } else if (error.message.includes("invalid")) {
      errorMessage = "I didn't quite catch that. Could you rephrase your question?";
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 