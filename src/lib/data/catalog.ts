import { slugify } from "@/lib/utils";
import type { Difficulty } from "@/lib/mastery";

export type SubjectCatalogItem = {
  name: string;
  slug: string;
  topics: string[];
};

export const subjectCatalog: SubjectCatalogItem[] = [
  {
    name: "Quantitative Aptitude",
    slug: "quantitative-aptitude",
    topics: [
      "Numbers",
      "LCM and HCF",
      "Ratio and Proportion",
      "Average",
      "Ages",
      "Percentages",
      "Profit and Loss",
      "Mixtures and Alligations",
      "Simple Interest",
      "Compound Interest",
      "Time Speed Distance",
      "Boats and Streams",
      "Trains",
      "Races",
      "Work and Wages",
      "Pipes and Cisterns",
      "Algebra",
      "Geometry",
      "Mensuration 2D and 3D",
      "Trigonometry",
      "Progressions",
      "Logarithms",
      "Permutation and Combination",
      "Probability",
      "Clocks",
      "Calendars",
      "Simplification",
      "Approximation",
      "Data Interpretation"
    ]
  },
  {
    name: "Logical Reasoning",
    slug: "logical-reasoning",
    topics: [
      "Number Series",
      "Letter Series",
      "Symbol Series",
      "Coding Decoding",
      "Blood Relations",
      "Directions",
      "Analogies",
      "Classification",
      "Logical Deduction",
      "Statement and Conclusion",
      "Statement and Assumption",
      "Course of Action",
      "Theme Detection",
      "Venn Diagrams",
      "Puzzles",
      "Seating Arrangement",
      "Data Sufficiency",
      "Assertion and Reason"
    ]
  },
  {
    name: "Verbal Ability",
    slug: "verbal-ability",
    topics: [
      "Synonyms",
      "Antonyms",
      "Spotting Errors",
      "Sentence Correction",
      "Sentence Improvement",
      "Sentence Formation",
      "Ordering of Words",
      "Vocabulary",
      "Para Jumbles",
      "Reading Comprehension",
      "Cloze Test",
      "Idioms",
      "One Word Substitution",
      "Voice",
      "Speech",
      "Articles",
      "Prepositions",
      "Fill in the Blanks"
    ]
  }
];

export const companyConfigs = [
  { companyName: "Infosys", totalQuestions: 60, timeLimitSec: 4500 },
  { companyName: "Wipro", totalQuestions: 55, timeLimitSec: 3600 },
  { companyName: "Accenture", totalQuestions: 90, timeLimitSec: 5400 },
  { companyName: "Capgemini", totalQuestions: 75, timeLimitSec: 4500 },
  { companyName: "Cognizant", totalQuestions: 70, timeLimitSec: 4200 },
  { companyName: "IBM", totalQuestions: 60, timeLimitSec: 3600 },
  { companyName: "Oracle", totalQuestions: 65, timeLimitSec: 3900 },
  { companyName: "Amazon", totalQuestions: 80, timeLimitSec: 5400 },
  { companyName: "Microsoft", totalQuestions: 75, timeLimitSec: 5400 },
  { companyName: "Google", totalQuestions: 75, timeLimitSec: 5400 },
  { companyName: "Adobe", totalQuestions: 70, timeLimitSec: 4800 },
  { companyName: "Flipkart", totalQuestions: 70, timeLimitSec: 4800 },
  { companyName: "Goldman Sachs", totalQuestions: 80, timeLimitSec: 5400 },
  { companyName: "JPMorgan", totalQuestions: 80, timeLimitSec: 5400 }
];

export type PracticeQuestion = {
  id: string;
  topicSlug: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  shortTrick: string;
  commonMistake: string;
  formula: string;
  difficulty: Difficulty;
  estimatedTimeSec: number;
  companyTags: string[];
};

export const sampleQuestions: PracticeQuestion[] = [
  {
    id: "percentages-easy-1",
    topicSlug: "percentages",
    text: "A value increases from 80 to 100. What is the percentage increase?",
    options: ["20%", "25%", "30%", "40%"],
    correctAnswer: "25%",
    explanation: "Increase is 20 on a base of 80, so percentage increase is 20 / 80 x 100 = 25%.",
    shortTrick: "Change / original x 100.",
    commonMistake: "Using the new value as the denominator gives 20%, which is not the increase from the original value.",
    formula: "Percentage change = change / original x 100",
    difficulty: "EASY",
    estimatedTimeSec: 45,
    companyTags: ["TCS NQT", "Infosys", "Wipro"]
  },
  {
    id: "ratio-medium-1",
    topicSlug: "ratio-and-proportion",
    text: "A:B = 3:5 and B:C = 10:7. What is A:C?",
    options: ["3:7", "6:7", "7:6", "5:7"],
    correctAnswer: "6:7",
    explanation: "Make B equal in both ratios. A:B = 6:10 and B:C = 10:7, so A:C = 6:7.",
    shortTrick: "Equalize the common term first.",
    commonMistake: "Directly combining 3 and 7 ignores that B has different values.",
    formula: "If A:B and B:C are given, scale B to a common value.",
    difficulty: "MEDIUM",
    estimatedTimeSec: 60,
    companyTags: ["TCS NQT", "Accenture"]
  },
  {
    id: "series-easy-1",
    topicSlug: "number-series",
    text: "Find the next number: 3, 6, 12, 24, ?",
    options: ["30", "36", "42", "48"],
    correctAnswer: "48",
    explanation: "Each term is multiplied by 2.",
    shortTrick: "Check multiplication before complex differences.",
    commonMistake: "Looking only at additive differences and missing the doubling pattern.",
    formula: "Geometric sequence: next = current x common ratio",
    difficulty: "EASY",
    estimatedTimeSec: 30,
    companyTags: ["TCS NQT", "Cognizant"]
  },
  {
    id: "verbal-easy-1",
    topicSlug: "synonyms",
    text: "Choose the closest synonym of 'concise'.",
    options: ["Lengthy", "Brief", "Vague", "Ordinary"],
    correctAnswer: "Brief",
    explanation: "Concise means giving much information clearly in few words.",
    shortTrick: "Concise writing is compact writing.",
    commonMistake: "Confusing concise with vague; concise is short but clear.",
    formula: "Vocabulary by usage context",
    difficulty: "EASY",
    estimatedTimeSec: 25,
    companyTags: ["TCS NQT", "Infosys"]
  }
];

export function getSubject(slug: string) {
  return subjectCatalog.find((subject) => subject.slug === slug);
}

export function topicSlug(topic: string) {
  return slugify(topic);
}
