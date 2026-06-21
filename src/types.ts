// src/types.ts
// Canonical data model. SPEC §5 — do not drift. Auxiliary types (QueueItem,
// Settings, drill/mental-math shapes) live below the canonical block and exist to
// serve the engines and UI; the canonical block is reproduced exactly.

// ---------------------------------------------------------------------------
// Canonical (SPEC §5)
// ---------------------------------------------------------------------------

export type TopicId =
  | 'brainteasers' | 'probability' | 'combinatorics' | 'expected-value'
  | 'bayes' | 'markov-chains' | 'martingales' | 'distributions'
  | 'calculus' | 'linear-algebra' | 'statistics' | 'stochastic-processes'
  | 'options-intuition' | 'market-making' | 'mental-math';

export type TechniqueId = string; // kebab-case, must match a file in content/techniques/

export type AnswerSpec =
  | { type: 'numeric'; value: number; tolerance?: number; display?: string }
    // display: canonical form shown in solution, e.g. "20/19"
  | { type: 'multiple-choice'; options: string[]; correctIndex: number }
  | { type: 'self-graded' }; // proofs, market-making banter, estimation defenses

export interface Problem {
  id: string;                    // kebab-case, globally unique
  topic: TopicId;
  techniques: TechniqueId[];     // 1–3
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 phone-screen warmup … 5 final-round
  source: 'original' | 'classic-rewrite';
  statement: string;             // markdown + KaTeX ($...$, $$...$$)
  hints: [string, string, string]; // exactly 3, per §6.3
  solution: string;              // per §6.4
  answer: AnswerSpec;
  estMinutes: number;
  followUps?: string[];
}

export interface GeneratedInstance {
  statement: string; hints: [string, string, string];
  solution: string; answer: AnswerSpec;
}

export interface GeneratorProblem {
  id: string; topic: TopicId; techniques: TechniqueId[];
  difficulty: 1 | 2 | 3 | 4 | 5; estMinutes: number;
  generate(rng: () => number): GeneratedInstance; // fresh numbers each review
}

export type Grade = 0 | 1 | 2 | 3; // Failed | Hard | Good | Easy

export interface ReviewState {
  problemId: string;             // Problem.id or GeneratorProblem.id
  ease: number;                  // start 2.5, clamp [1.3, 3.0]
  intervalDays: number;          // 0 = unlearned
  due: string;                   // ISO date (yyyy-mm-dd)
  reps: number;
  lapses: number;
  history: Array<{ date: string; grade: Grade; hintsUsed: 0|1|2|3; ms: number }>;
}

export interface DrillResult {
  date: string; preset: string; total: number; correct: number;
  seconds: number; perCategory: Record<string, { n: number; correct: number }>;
}

// ---------------------------------------------------------------------------
// Auxiliary (engine + UI support)
// ---------------------------------------------------------------------------

/** A unit of content the feed can present — either a static Problem or a
 *  GeneratorProblem. Discriminated by `kind`. */
export type ContentItem =
  | { kind: 'static'; problem: Problem }
  | { kind: 'generator'; problem: GeneratorProblem };

/** Common metadata shared by both content kinds (used by the feed builder /
 *  interleaver without caring about the concrete shape). */
export interface ContentMeta {
  id: string;
  topic: TopicId;
  techniques: TechniqueId[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estMinutes: number;
}

export type DueReason =
  | { kind: 'new' }
  | { kind: 'review'; overdueDays: number }
  | { kind: 'ahead' }     // pulled from future reviews to keep the feed infinite
  | { kind: 'practice' }; // recycled extra practice when nothing scheduled remains

/** What `buildFeed` emits, one per card the user will scroll through (§7.2). */
export interface QueueItem {
  item: ContentItem;
  reason: DueReason;
  /** Present iff this item already has SRS history. */
  state?: ReviewState;
}

/** Persisted user settings (SPEC §8.5, §7.2). */
export interface Settings {
  enabledTopics: TopicId[];
  newPerSession: number; // default 8
  newRatio: number;      // due:new ratio, default 3 (one new after every 3 due)
}

// ---------------------------------------------------------------------------
// Mental-math / drill (SPEC §7.4, §8.2)
// ---------------------------------------------------------------------------

export type MentalMathCategory =
  | 'mul-2x2' | 'addsub-3' | 'div-2dp' | 'percent-of'
  | 'frac-to-dec' | 'dec-to-frac' | 'square-2';

export interface MentalMathItem {
  prompt: string;
  answer: string;            // canonical correct string shown after the fact
  value: number;             // exact numeric answer, for grading
  tolerance?: number;        // absolute tolerance (rounded categories); default near-exact
  category: MentalMathCategory;
}

export interface DrillPreset {
  id: string;
  label: string;
  total: number;
  seconds: number;
  categories: MentalMathCategory[];
}

// ---------------------------------------------------------------------------
// Persistence envelope (SPEC §10)
// ---------------------------------------------------------------------------

export interface ExportBlob {
  version: 1;
  reviews: ReviewState[];
  drills: DrillResult[];
  settings: Settings;
}
