# MASTER_PROMPT.md
## Placement Preparation Platform — Full Implementation Specification

> This document is a complete build specification for an AI IDE (Cursor, Claude Code, Windsurf, Copilot Agent). Assume zero prior context. Do not invent architecture not specified here.

---

## 1. PROJECT OVERVIEW

Build a premium, focused **Placement Preparation Web Application** for engineering students preparing for campus placements, service-based company drives, and product-based company interviews. This is not a social platform and not a generic LMS — it is a practice, analytics, and mastery-tracking system.

### Core Principles
- Every student's progress is fully independent.
- Topics unlock progressively: Easy → Medium → Hard → Expert.
- Every question includes explanation, trick, common mistake, and formula.
- The platform supports **generic aptitude/reasoning/verbal prep** AND **company-specific exam simulators**, of which **TCS NQT is a first-class, dedicated module** (not just a generic "company" entry).

---

## 2. TECH STACK

**Frontend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Hook Form, Zod, TanStack Query, Recharts, Lucide Icons

**Backend:** Next.js Server Actions + API Routes (no separate backend service)

**Database:** Supabase PostgreSQL + Prisma ORM

**Auth:** Supabase Auth (Google login, email login, email verification, forgot password)

**Deployment:** Vercel + Supabase

**State:** Zustand (only where React Query/Server state is insufficient)

---

## 3. SITE / NAVIGATION STRUCTURE

```
Landing Page
Auth (Login / Signup / Verify / Forgot Password)
Dashboard
├── Subjects (Quant / Reasoning / Verbal)
│   └── Topics → Difficulty Levels → Practice
├── Mock Tests
├── Adaptive Test Mode
├── Company Preparation
│   ├── TCS NQT (dedicated module — see Section 6)
│   ├── Infosys
│   ├── Wipro
│   ├── Accenture
│   ├── Capgemini
│   ├── Cognizant
│   ├── Amazon / Microsoft / Google / Adobe / Flipkart
│   └── Goldman Sachs / JPMorgan
├── Analytics
├── Bookmarks & Revision Queue
├── Profile
├── Settings
└── Admin (future)
```

**Key requirement:** TCS NQT must appear as its **own top-level navigation entry** under "Company Preparation" — not nested inside a generic "select a company" dropdown — because its exam structure, sections, and scoring differ fundamentally from a standard topic-wise practice flow.

---

## 4. SUBJECTS (Generic Practice Pool)

**Quantitative Aptitude:** Numbers, LCM & HCF, Ratio & Proportion, Average, Ages, Percentages, Profit & Loss, Mixtures & Alligations, SI, CI, Time-Speed-Distance, Boats & Streams, Trains, Races, Work & Wages, Pipes & Cisterns, Algebra, Geometry, Mensuration 2D/3D, Trigonometry, Progressions, Logarithms, Permutation & Combination, Probability, Clocks, Calendars, Simplification, Approximation, Data Interpretation

**Logical Reasoning:** Number/Letter/Symbol Series, Coding-Decoding, Blood Relations, Directions, Analogies, Classification, Logical Deduction, Statement & Conclusion/Assumption/Argument, Course of Action, Theme Detection, Venn Diagrams, Puzzles, Seating Arrangement, Data Sufficiency, Assertion & Reason

**Verbal Ability:** Synonyms, Antonyms, Spotting Errors, Sentence Correction/Improvement/Formation, Ordering of Words, Vocabulary, Para Jumbles, Reading Comprehension, Cloze Test, Idioms, One Word Substitution, Voice, Speech, Articles, Prepositions, Fill in the Blanks

---

## 5. LEARNING FLOW & MASTERY GATING

Each topic is independently gated:

```
Easy (locked by default, Easy always unlocked)
 └─ pass threshold (e.g. 80% accuracy, min 10 Qs) → unlocks Medium
     └─ pass threshold → unlocks Hard
         └─ pass threshold → unlocks Expert
```

Progression is stored per-user, per-topic in the `Progress` table (see Section 9).

---

## 6. TCS NQT — DEDICATED MODULE (SEPARATE SECTION)

TCS NQT (National Qualifier Test) gets its **own route, own data model extensions, own UI, and own scoring engine**, distinct from generic practice/mock tests, because its structure is standardized and sectioned with fixed timers per section.

### 6.1 Route Structure
```
/company-prep/tcs-nqt
├── /overview          → exam pattern, eligibility, cutoffs info
├── /foundation         → Numerical Ability, Reasoning Ability, Verbal Ability
├── /advanced           → Advanced Quant, Advanced Reasoning
├── /programming-logic  → MCQ-based programming fundamentals
├── /coding             → 2 coding questions (compiler-based)
├── /full-mock          → complete simulated NQT exam, sectioned & timed
├── /results/[attemptId]
└── /analytics          → TCS-NQT-specific performance dashboard
```

### 6.2 Exam Pattern to Simulate
TCS NQT has two variants the platform must support via a toggle: **NQT Foundation-only** and **NQT Foundation + Advanced**.

| Section | Sub-section | Questions | Time |
|---|---|---|---|
| Foundation | Numerical Ability | 26 | 40 min |
| Foundation | Reasoning Ability | 30 | 50 min |
| Foundation | Verbal Ability | 24 | 30 min |
| Advanced (optional) | Advanced Quant | 20 | 30 min |
| Advanced (optional) | Advanced Reasoning | 20 | 30 min |
| Advanced (optional) | Programming Logic (MCQ) | 10 | 15 min |
| Advanced (optional) | Coding | 2 | 60 min |

The above values must be stored in a configurable `ExamPatternConfig` table/JSON (not hardcoded), since TCS periodically revises pattern/timing — an admin should be able to update section counts/timers without a code deploy.

### 6.3 Data Model Additions (Prisma)

```prisma
model TcsNqtSection {
  id          String   @id @default(cuid())
  name        String   // "Numerical Ability", "Reasoning Ability", etc.
  category    TcsNqtCategory // FOUNDATION | ADVANCED
  questionCount Int
  timeLimitSec  Int
  order       Int
  questions   TcsNqtQuestion[]
}

enum TcsNqtCategory {
  FOUNDATION
  ADVANCED
  CODING
}

model TcsNqtQuestion {
  id            String   @id @default(cuid())
  sectionId     String
  section       TcsNqtSection @relation(fields: [sectionId], references: [id])
  questionText  String
  options       Json?        // null for coding questions
  correctAnswer String?
  explanation   String
  shortTrick    String?
  difficulty    Difficulty
  isCoding      Boolean  @default(false)
  starterCode   String?      // for coding questions
  testCases     Json?        // for coding questions
  tags          String[]
  createdAt     DateTime @default(now())
}

model TcsNqtAttempt {
  id             String   @id @default(cuid())
  userId         String
  variant        TcsNqtVariant // FOUNDATION_ONLY | FOUNDATION_PLUS_ADVANCED
  startedAt      DateTime @default(now())
  completedAt    DateTime?
  sectionResults Json     // per-section score, accuracy, time taken
  overallScore   Float?
  status         AttemptStatus
}

enum TcsNqtVariant {
  FOUNDATION_ONLY
  FOUNDATION_PLUS_ADVANCED
}

enum AttemptStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

### 6.4 UI Requirements Specific to TCS NQT

- **Overview page:** exam pattern table, eligibility criteria, cutoff history (static/admin-editable content), "Start Full Mock" CTA.
- **Sectioned test runner:** unlike generic mock tests, sections are **locked in sequence** — student cannot go back to a previous section once submitted (mirrors real NQT behavior), with an explicit warning modal before section submission.
- **Per-section auto-submit timer**, visually distinct countdown per section (not one global timer).
- **Section transition screen:** "Numerical Ability complete. Reasoning Ability begins in 3... 2... 1..." with brief instructions specific to the next section.
- **Coding section:** embedded code editor (Monaco or CodeMirror) with language selector (C, C++, Java, Python), run-against-sample-testcases, and submit.
- **Results page:** section-wise breakdown (score, accuracy, time used vs allotted), overall percentile estimate (based on historical distribution if available), weak-section flags feeding into the Revision Queue.
- **Analytics page (TCS-NQT-specific):** trend across multiple full-mock attempts, section-wise improvement graph, comparison against average NQT cutoff benchmarks.

### 6.5 API Endpoints (TCS NQT)

```
GET    /api/tcs-nqt/pattern                 → current section config
POST   /api/tcs-nqt/attempt/start           → { variant } → creates attempt, returns first section
POST   /api/tcs-nqt/attempt/:id/section/:sectionId/submit → scores section, unlocks next
GET    /api/tcs-nqt/attempt/:id/status
POST   /api/tcs-nqt/attempt/:id/coding/run       → executes code against sample cases
POST   /api/tcs-nqt/attempt/:id/coding/submit
GET    /api/tcs-nqt/attempt/:id/result
GET    /api/tcs-nqt/analytics
```

### 6.6 Why This Is Separate From Generic "Company Preparation"

Generic company prep (Infosys, Wipro, etc.) can reuse the standard mock-test engine with a custom question-distribution config. **TCS NQT cannot**, because:
1. It has strict per-section sequential locking (no backward navigation across sections).
2. It has a coding component requiring a code execution sandbox.
3. It has two distinct variants (Foundation-only vs Foundation+Advanced) that change the entire flow.
4. It needs its own analytics benchmarked against known NQT cutoffs, not generic aptitude accuracy.

This justifies a fully separate route, schema, and scoring engine rather than parameterizing the generic mock-test system.

---

## 7. OTHER COMPANY PREPARATION (Generic Engine)

Infosys, Wipro, Accenture, Capgemini, Cognizant, IBM, Oracle, Amazon, Microsoft, Google, Adobe, Flipkart, Goldman Sachs, JPMorgan each get a config entry:

```prisma
model CompanyTestConfig {
  id           String @id @default(cuid())
  companyName  String @unique
  topicWeights Json   // { topicId: percentageWeight }
  totalQuestions Int
  timeLimitSec Int
}
```

These reuse the standard `Test` / `TestQuestion` / `Answer` models (Section 9) — no dedicated schema needed, unlike TCS NQT.

---

## 8. PRACTICE MODE REQUIREMENTS

Every question record includes: question text, 4 options, correct answer, detailed explanation, short trick, common mistake, formula used, difficulty, estimated time, topic, subtopic, company relevance tags.

**On correct answer:** show why correct, shortcut, alternative method.
**On wrong answer:** show correct answer, step-by-step explanation, why the chosen option was wrong, common mistake, memory trick, related concepts, and a "practice similar" recommendation. Users must acknowledge the explanation before continuing.

---

## 9. CORE DATABASE SCHEMA (Prisma — abbreviated)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  progress  Progress[]
  attempts  TestAttempt[]
  tcsAttempts TcsNqtAttempt[]
  bookmarks Bookmark[]
  createdAt DateTime @default(now())
}

model Subject { id String @id @default(cuid()); name String; topics Topic[] }

model Topic {
  id        String @id @default(cuid())
  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id])
  name      String
  questions Question[]
}

model Question {
  id            String @id @default(cuid())
  topicId       String
  topic         Topic @relation(fields: [topicId], references: [id])
  text          String
  options       Json
  correctAnswer String
  explanation   String
  shortTrick    String?
  commonMistake String?
  formula       String?
  difficulty    Difficulty
  estimatedTimeSec Int
  companyTags   String[]
}

enum Difficulty { EASY MEDIUM HARD EXPERT }

model Progress {
  id         String @id @default(cuid())
  userId     String
  user       User @relation(fields: [userId], references: [id])
  topicId    String
  difficulty Difficulty
  accuracy   Float
  questionsSolved Int
  unlocked   Boolean @default(false)
  mastered   Boolean @default(false)
  @@unique([userId, topicId, difficulty])
}

model TestAttempt { id String @id @default(cuid()); userId String; score Float; createdAt DateTime @default(now()) }
model Bookmark { id String @id @default(cuid()); userId String; questionId String }
```

*(Full schema with all remaining entities — QuestionPool, RevisionQueue, AIQuestionGenerationLog, Notifications, Sessions, Settings — follows the same normalized pattern with indexes on userId, topicId, and difficulty.)*

---

## 10. AI QUESTION GENERATION (Cache-First)

```
Request → Check DB pool → Enough questions? 
  → Yes: serve from cache
  → No: generate batch (~25 Qs via Gemini Flash, strict JSON) → validate → store → serve
```

Never regenerate duplicate questions; dedupe by normalized question hash before insert.

---

## 11. ADAPTIVE MODE

3 correct in a row → increase difficulty. 2 wrong in a row → decrease difficulty. Persist progression permanently per topic.

---

## 12. ANALYTICS DASHBOARD

Overall accuracy, topic-wise accuracy, weak/strong topics, average time, trend graphs, completion heatmap, difficulty distribution, daily/weekly/monthly practice volume — plus the **TCS NQT-specific analytics** described in Section 6.4.

---

## 13. BUILD PHASES

**Phase 1:** Auth, Dashboard, Subjects, Topics, Practice Mode
**Phase 2:** Mock Test, Analytics, Review, Bookmarks
**Phase 3:** Adaptive Mode, AI Question Generation, Caching
**Phase 4:** TCS NQT dedicated module (schema, sectioned runner, coding sandbox), other company configs, Admin, Revision Planner

Note: TCS NQT is scheduled as its own deliverable in Phase 4 precisely because of its coding-sandbox and sequential-locking requirements — it should not be built as an afterthought bolted onto generic mock tests.

---

## 14. NON-FUNCTIONAL REQUIREMENTS

**Security:** input validation, SQL injection prevention via Prisma, rate limiting, auth middleware, CSRF/XSS prevention, secrets in env vars.
**Performance:** server components, lazy loading, code splitting, DB indexes, caching, pagination, streaming, memoization.
**Testing:** Vitest for unit/integration, Playwright for E2E — including a dedicated E2E suite for the TCS NQT sectioned-timer flow (section auto-submit, no-backward-navigation, coding sandbox execution).

---

*(This document intentionally keeps prose concise per section while remaining fully specified — expand any section's schema/API/UI detail on request, e.g. full Prisma file, full API reference, or full component library.)*
