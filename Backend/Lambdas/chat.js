import { generateResponse } from "./aiService.js";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { sessionId, userMessage, uiState } = body;

    const reply = await generateResponse([
      {
        role: "system",
        content:
          "You are Athena, an AI ethics assistant helping users evaluate whether their technology is ethically ready to deploy.",
      },
      {
        role: "user",
        content: `Current UI state: ${uiState}\nUser message: ${userMessage}`,
      },
    ]);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uiState: "CHAT",
        botMessage: reply,
      }),
    };
  } catch (error) {
    console.error("chat error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Chat failed",
      }),
    };
  }
};