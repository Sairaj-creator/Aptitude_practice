import { createHash } from "node:crypto";
import { z } from "zod";

const GROQ_MODEL = "llama3-8b-8192";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export function normalizeQuestionText(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

export function questionHash(text: string) {
  return createHash("sha256").update(normalizeQuestionText(text)).digest("hex");
}

export function dedupeGeneratedQuestions<T extends { text: string }>(questions: T[], existingHashes: Set<string>) {
  const seen = new Set(existingHashes);
  const accepted: Array<T & { normalizedHash: string }> = [];

  for (const question of questions) {
    const normalizedHash = questionHash(question.text);
    if (!seen.has(normalizedHash)) {
      seen.add(normalizedHash);
      accepted.push({ ...question, normalizedHash });
    }
  }

  return accepted;
}

// Zod schema for a single generated question
const GeneratedQuestionSchema = z.object({
  text: z.string().min(10),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(10),
  shortTrick: z.string().min(5),
  commonMistake: z.string().min(5),
  formula: z.string(),
  estimatedTimeSec: z.number().int().min(15).max(300),
  companyTags: z.array(z.string())
});

type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

const SYSTEM_PROMPT = `You are an expert aptitude test creator for Indian engineering campus placement exams (TCS, Infosys, Wipro, Accenture). 
Generate questions in strict JSON format only. Each question must have exactly 4 options and one correct answer that is an exact match to one of the options.
Return a JSON object with a "questions" array. No markdown, no explanation outside JSON.`;

function buildUserPrompt(topicName: string, difficulty: string, count: number): string {
  const difficultyDesc: Record<string, string> = {
    EASY: "basic, single-step problems suitable for beginners",
    MEDIUM: "moderate 2-3 step problems requiring formula application",
    HARD: "complex multi-step problems with tricky edge cases",
    EXPERT: "very challenging problems combining multiple concepts"
  };

  return `Generate exactly ${count} ${difficulty} difficulty aptitude questions on the topic: "${topicName}".
Difficulty description: ${difficultyDesc[difficulty] ?? "moderate"}.

Return JSON in this exact format:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Step-by-step explanation of why this is correct.",
      "shortTrick": "Quick mental shortcut or trick to solve this type.",
      "commonMistake": "What students often get wrong here.",
      "formula": "Relevant formula if any, else 'N/A'",
      "estimatedTimeSec": 60,
      "companyTags": ["TCS NQT", "Infosys"]
    }
  ]
}

Ensure correctAnswer is EXACTLY one of the four options strings. No duplicate questions.`;
}

export type GenerationResult = {
  generated: number;
  accepted: number;
  rejected: number;
  questions: Array<GeneratedQuestion & { normalizedHash: string }>;
  error?: string;
};

export async function generateQuestionsBatch(
  topicName: string,
  difficulty: string,
  count: number = 10,
  existingHashes: Set<string> = new Set()
): Promise<GenerationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { generated: 0, accepted: 0, rejected: 0, questions: [], error: "GROQ_API_KEY not set" };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(topicName, difficulty, count) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { generated: 0, accepted: 0, rejected: 0, questions: [], error: `Groq API error: ${response.status} ${err}` };
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { questions?: unknown[] };
    const rawQuestions = parsed.questions ?? [];

    // Validate each question with Zod
    const validQuestions: GeneratedQuestion[] = [];
    let rejected = 0;

    for (const raw of rawQuestions) {
      const result = GeneratedQuestionSchema.safeParse(raw);
      if (result.success && result.data.options.includes(result.data.correctAnswer)) {
        validQuestions.push(result.data);
      } else {
        rejected++;
      }
    }

    const deduped = dedupeGeneratedQuestions(validQuestions, existingHashes);

    return {
      generated: rawQuestions.length,
      accepted: deduped.length,
      rejected: rejected + (validQuestions.length - deduped.length),
      questions: deduped
    };
  } catch (error) {
    return {
      generated: 0,
      accepted: 0,
      rejected: 0,
      questions: [],
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
