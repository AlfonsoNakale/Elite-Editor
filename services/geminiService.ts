
import { GoogleGenAI, Type } from "@google/genai";
import { PolishedResponse, Tone } from "../types";

const GET_SYSTEM_INSTRUCTION = (tone: Tone) => `
Act as a World-Class Professional Editor and Communication Coach. Your goal is to function exactly like a high-end version of Grammarly, but with better context awareness.

The user has requested a **${tone}** tone. 

The input you receive may contain HTML formatting (like <b>, <i>, <ul>, <li>, etc.). 

Whenever you receive a draft email or text, perform the following steps:
1. Strict Grammar & Spelling Check: Correct all typos, punctuation errors, and grammatical inconsistencies immediately.
2. Clarity & Flow: Streamline sentence structure. Remove passive voice where active voice is stronger. Eliminate fluff and redundancy.
3. Tone Polish: Ensure the tone is strictly **${tone}**. 
   - If 'Professional': Balanced, confident, and polite.
   - If 'Formal': Highly respectful, structured, and traditional.
   - If 'Casual': Relaxed, approachable, and conversational (but still polished).
   - If 'Assertive': Direct, firm, and decisive without being rude.
   - If 'Friendly': Warm, inclusive, and enthusiastic.
   - If 'Diplomatic': Highly tactful, cautious, and sensitive to interpersonal dynamics.
4. Intent Preservation: Do NOT add new information or change the core meaning of the message. Keep the user's voice, just make it the best version of it within the requested tone.
5. Formatting Preservation: YOU MUST preserve all HTML tags and structure. Return the 'polishedText' as valid HTML that maintains the original formatting.

You must return the response in a structured JSON format with two properties:
- 'polishedText': A clean, copy-paste-ready version of the edited text (as HTML).
- 'summaryOfChanges': A brief array of bullet points describing the improvements made.
`;

export const polishText = async (text: string, tone: Tone): Promise<PolishedResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: text,
      config: {
        systemInstruction: GET_SYSTEM_INSTRUCTION(tone),
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            polishedText: {
              type: Type.STRING,
              description: "The complete, polished version of the input text in HTML format.",
            },
            summaryOfChanges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of changes made to the text.",
            },
          },
          required: ["polishedText", "summaryOfChanges"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as PolishedResponse;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to polish text. Please try again.");
  }
};
