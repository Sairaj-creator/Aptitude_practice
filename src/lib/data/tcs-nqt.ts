import type { Difficulty } from "@/lib/mastery";

export type TcsNqtCategory = "FOUNDATION" | "ADVANCED" | "CODING";
export type TcsNqtVariant = "FOUNDATION_ONLY" | "FOUNDATION_PLUS_ADVANCED";
export type AttemptStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";

export type TcsNqtSectionConfig = {
  id: string;
  name: string;
  slug: string;
  category: TcsNqtCategory;
  questionCount: number;
  timeLimitSec: number;
  order: number;
  instructions: string;
};

export type TcsNqtQuestion = {
  id: string;
  sectionId: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string;
  shortTrick?: string;
  difficulty: Difficulty;
  isCoding: boolean;
  starterCode?: string;
  testCases?: Array<{ input: string; expectedOutput: string }>;
  tags: string[];
};

export const tcsNqtPattern: TcsNqtSectionConfig[] = [
  {
    id: "numerical-ability",
    name: "Numerical Ability",
    slug: "numerical-ability",
    category: "FOUNDATION",
    questionCount: 26,
    timeLimitSec: 40 * 60,
    order: 1,
    instructions: "Accuracy and speed both matter. Finish approximations before longer arithmetic."
  },
  {
    id: "reasoning-ability",
    name: "Reasoning Ability",
    slug: "reasoning-ability",
    category: "FOUNDATION",
    questionCount: 30,
    timeLimitSec: 50 * 60,
    order: 2,
    instructions: "Lock the given conditions before trying answer options."
  },
  {
    id: "verbal-ability",
    name: "Verbal Ability",
    slug: "verbal-ability",
    category: "FOUNDATION",
    questionCount: 24,
    timeLimitSec: 30 * 60,
    order: 3,
    instructions: "Read for grammar signals and eliminate choices with clear errors."
  },
  {
    id: "advanced-quant",
    name: "Advanced Quant",
    slug: "advanced-quant",
    category: "ADVANCED",
    questionCount: 20,
    timeLimitSec: 30 * 60,
    order: 4,
    instructions: "Pick solvable sets first. Avoid spending too long on one high effort item."
  },
  {
    id: "advanced-reasoning",
    name: "Advanced Reasoning",
    slug: "advanced-reasoning",
    category: "ADVANCED",
    questionCount: 20,
    timeLimitSec: 30 * 60,
    order: 5,
    instructions: "Use tables for puzzles and mark impossible positions immediately."
  },
  {
    id: "programming-logic",
    name: "Programming Logic",
    slug: "programming-logic",
    category: "ADVANCED",
    questionCount: 10,
    timeLimitSec: 15 * 60,
    order: 6,
    instructions: "Trace code with variable state. Watch integer division and loop boundaries."
  },
  {
    id: "coding",
    name: "Coding",
    slug: "coding",
    category: "CODING",
    questionCount: 2,
    timeLimitSec: 60 * 60,
    order: 7,
    instructions: "Run samples before submission. Edge cases count even when samples pass."
  }
];

export const tcsNqtQuestions: TcsNqtQuestion[] = [
  {
    id: "tcs-num-1",
    sectionId: "numerical-ability",
    questionText: "If 35% of a number is 140, what is the number?",
    options: ["350", "375", "400", "425"],
    correctAnswer: "400",
    explanation: "Number = 140 / 0.35 = 400.",
    shortTrick: "Divide by the decimal percentage.",
    difficulty: "EASY",
    isCoding: false,
    tags: ["percentage", "foundation"]
  },
  {
    id: "tcs-reason-1",
    sectionId: "reasoning-ability",
    questionText: "Pointing to a boy, Riya says, 'He is the son of my only brother.' How is the boy related to Riya?",
    options: ["Brother", "Son", "Nephew", "Uncle"],
    correctAnswer: "Nephew",
    explanation: "The boy is the son of Riya's brother, so he is Riya's nephew.",
    shortTrick: "A brother's son is a nephew.",
    difficulty: "MEDIUM",
    isCoding: false,
    tags: ["blood-relations", "foundation", "needs-review"]
  },
  {
    id: "tcs-verbal-1",
    sectionId: "verbal-ability",
    questionText: "Choose the sentence with correct subject verb agreement.",
    options: [
      "The list of items are on the desk.",
      "The list of items is on the desk.",
      "The list of items were on the desk.",
      "The list of items have been on the desk."
    ],
    correctAnswer: "The list of items is on the desk.",
    explanation: "The subject is 'list', which is singular.",
    shortTrick: "Ignore the prepositional phrase between subject and verb.",
    difficulty: "EASY",
    isCoding: false,
    tags: ["grammar", "foundation"]
  },
  {
    id: "tcs-adv-quant-1",
    sectionId: "advanced-quant",
    questionText: "How many ways can the letters of LEVEL be arranged?",
    options: ["20", "30", "60", "120"],
    correctAnswer: "30",
    explanation: "LEVEL has 5 letters with L repeated twice and E repeated twice. Arrangements = 5! / (2! x 2!) = 30.",
    shortTrick: "Divide factorial by repeated counts.",
    difficulty: "HARD",
    isCoding: false,
    tags: ["permutation", "advanced"]
  },
  {
    id: "tcs-adv-reason-1",
    sectionId: "advanced-reasoning",
    questionText: "If all Zins are Bors and no Bor is a Cal, which conclusion follows?",
    options: ["Some Zins are Cals", "No Zin is a Cal", "All Cals are Zins", "Some Bors are not Zins"],
    correctAnswer: "No Zin is a Cal",
    explanation: "All Zins belong inside Bors, and Bors do not overlap with Cals.",
    shortTrick: "Draw nested sets and exclusions.",
    difficulty: "HARD",
    isCoding: false,
    tags: ["syllogism", "advanced"]
  },
  {
    id: "tcs-prog-logic-1",
    sectionId: "programming-logic",
    questionText: "What is printed by: for(i=1; i<=3; i++) sum += i; if sum starts at 0?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "6",
    explanation: "The loop adds 1 + 2 + 3.",
    shortTrick: "Trace the loop boundary inclusively.",
    difficulty: "EASY",
    isCoding: false,
    tags: ["loops", "advanced"]
  },
  {
    id: "tcs-coding-1",
    sectionId: "coding",
    questionText: "Read an integer n and print the sum of numbers from 1 to n.",
    options: null,
    correctAnswer: null,
    explanation: "Use n x (n + 1) / 2 or iterate safely.",
    difficulty: "EASY",
    isCoding: true,
    starterCode: "n = int(input())\nprint(n * (n + 1) // 2)",
    testCases: [
      { input: "5", expectedOutput: "15" },
      { input: "10", expectedOutput: "55" }
    ],
    tags: ["implementation", "coding"]
  }
];
