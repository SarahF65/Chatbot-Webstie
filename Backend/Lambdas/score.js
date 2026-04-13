import { saveSession } from "./matrixService.js";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { sessionId, answers } = body;

    const principleScores = {
      beneficence: 2,
      "non-maleficence": -1,
      trust: 1,
      justice: 2,
      autonomy: 1,
      transparency: 0,
    };

    const overallIndex =
      Object.values(principleScores).reduce((sum, val) => sum + val, 0);

    const result = {
      overallIndex,
      conclusion:
        overallIndex >= 4
          ? "Your technology shows promising ethical readiness, but some areas may still need improvement."
          : "Your technology may require further ethical review before deployment.",
      matrix: {
        overall: principleScores,
      },
    };

    await saveSession(sessionId, {
      answers,
      result,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("score error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Scoring failed",
      }),
    };
  }
};