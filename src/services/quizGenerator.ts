import { GoogleGenAI, Type } from '@google/genai';

// We initialize dynamically, expecting API key to be available server-side or passed through a backend proxy.
// Given the environment constraints, we can use the backend proxy for Gemini calls.
const API_URL = '/api/gemini/quiz';

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: "Facile" | "Moyen" | "Difficile" | "Mixte" | "Examen";
  chapter: string;
  subject: string;
  class: string;
  series: string;
  confidence_score: number;
}

export interface QuizGenerationRequest {
  level: string; // e.g. "Lycée", "Collège"
  schoolClass: string; // e.g. "Terminale", "3e"
  series: string; // e.g. "D", "A4", "G2"
  subject: string;
  chapter?: string;
  numberOfQuestions: number;
  difficulty: string;
  mode: "Normal" | "BEPC" | "BAC" | "Remédiation" | "Examen";
  previousWeaknesses?: string[];
}

export interface AIQuizResponse {
  questions: QuizQuestion[];
  recommendation?: string;
  estimatedSuccessProbability?: number; // 0-100%
}

export const generateQuiz = async (request: QuizGenerationRequest): Promise<AIQuizResponse> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errText = '';
      try { 
        const errData = await response.json(); 
        errText = errData.error;
      } catch(e) {}
      throw new Error(errText || "Erreur réseau (" + response.status + ")");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la génération du quiz:", error);
    throw error;
  }
};
