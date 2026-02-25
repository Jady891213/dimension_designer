
import { GoogleGenAI, Type } from "@google/genai";
import { DimensionNode, AppContext } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHierarchy = async (tree: DimensionNode[], context: AppContext) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        As a financial system expert, analyze this dimension hierarchy for the context: 
        Scenario: ${context.scenario}, Version: ${context.version}, Years: ${context.years.join(', ')}, Periods: ${context.periods.join(', ')}.
        
        The hierarchy data (JSON): ${JSON.stringify(tree)}
        
        Check for:
        1. Temporal inconsistencies (nodes active in parent but inactive themselves).
        2. Logical naming conventions.
        3. Structural depth issues.
        
        Provide a list of recommendations and potential issues in JSON format.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  nodeCode: { type: Type.STRING },
                  severity: { type: Type.STRING, description: 'High, Medium, Low' },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                },
                required: ["nodeCode", "severity", "message"]
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    // Extract text directly from property
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return null;
  }
};