export function buildAthenaPrompt(userMessage, context = []) {
    return [
      {
        role: "system",
        content: `
  You are Athena, an AI ethics assistant.
  
  Guide the user through evaluating their project based on:
  - Privacy
  - Bias
  - Transparency
  - Safety
  - Accountability
  
  Ask one clear follow-up question at a time.
  
  Be concise.
        `,
      },
      ...context,
      {
        role: "user",
        content: userMessage,
      },
    ];
  }