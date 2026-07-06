import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters")
});

export const signupSchema = authSchema.extend({
  name: z.string().min(2, "Enter your name")
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const tcsVariantSchema = z.object({
  variant: z.enum(["FOUNDATION_ONLY", "FOUNDATION_PLUS_ADVANCED"])
});

export const tcsSectionSubmissionSchema = z.object({
  answers: z.record(z.string(), z.string()),
  timeTakenSec: z.number().int().nonnegative()
});

export const codingRunSchema = z.object({
  language: z.enum(["c", "cpp", "java", "python"]),
  code: z.string().min(1),
  questionId: z.string().optional()
});
