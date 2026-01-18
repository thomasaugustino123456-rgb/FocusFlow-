
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, QuizQuestion, QuizResult, StudyGuide } from "./types";

// Always use the recommended initialization with direct process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `
You are the "Starty Coach" inside the FocusFlow app. 
Your goal is to help students with deep research and problem-solving.
Be extremely friendly, supportive, and use simple language.
Use emojis frequently.
Always provide deep, well-researched answers.
`;

export const breakDownTask = async (taskName: string): Promise<AIResponse> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Break down this task into 3-6 tiny steps: "${taskName}"`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          missionName: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          focusTimeMinutes: { type: Type.NUMBER },
          xpReward: { type: Type.NUMBER },
          encouragement: { type: Type.STRING }
        },
        required: ["missionName", "steps", "focusTimeMinutes", "xpReward", "encouragement"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const generateStudyGuide = async (unitTitle: string, unitDescription: string): Promise<StudyGuide> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a comprehensive but easy-to-read study guide for the unit: "${unitTitle}". Description: "${unitDescription}". Target audience: teenagers/students.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["heading", "content"]
            }
          },
          keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "summary", "sections", "keyTakeaways"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const generateLessonQuiz = async (topic: string): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a fun 10-question multiple choice quiz for teens on the topic: "${topic}". Keep it encouraging and clear.`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const evaluateQuiz = async (topic: string, questions: QuizQuestion[], userAnswers: string[]): Promise<QuizResult> => {
  const prompt = `Topic: ${topic}. Questions and user answers: ${JSON.stringify(questions.map((q, i) => ({ q: q.question, ans: userAnswers[i], correct: q.correctAnswer })))}. 
  Evaluate the performance. Total questions is 10.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "Evaluate quiz results. Be friendly and supportive. If the score is low, be very empathetic. If high, be celebratory.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          corrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                userAnswer: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING }
              }
            }
          }
        },
        required: ["score", "total", "feedback", "corrections"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const analyzeLabQuery = async (query: string, errorMessage?: string): Promise<{ correctedQuery: string; explanation: string }> => {
  const prompt = errorMessage 
    ? `The user tried to run this query: "${query}" but got this error: "${errorMessage}". Help them fix it! Fix the syntax if it's SQL or explain what went wrong.`
    : `The user wants to know if this code/query is correct or how to improve it: "${query}". Provide a cleaner or more efficient version and explain why.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are the Starty Coach. Help the user fix their code or SQL query in the FocusFlow Lab. Be encouraging and clear. Use emojis. If it's a simple mistake, explain it kindly.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          correctedQuery: { type: Type.STRING, description: "The fixed or improved code." },
          explanation: { type: Type.STRING, description: "A friendly explanation of the fix." }
        },
        required: ["correctedQuery", "explanation"]
      }
    }
  });
  return JSON.parse(response.text.trim());
};

export const askCoach = async (prompt: string, history: { role: 'user' | 'assistant', content: string }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: [
      ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text || "I couldn't find an answer, but let's keep trying! 🦉";
  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({
      title: chunk.web?.title || "Research Source",
      uri: chunk.web?.uri || ""
    }))
    .filter((s: any) => s.uri) || [];

  return { text, sources };
};
