// Content validator — SPEC §11. Zod-validates every content module, asserts id
// uniqueness, three-hint ladders, that tagged techniques exist as files, finite
// numeric answers, and that each solution contains the **Pattern:** block.
// Exits non-zero on any failure.

import { readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { problems, generators } from '../content/index';
import type { AnswerSpec, GeneratedInstance } from '../src/types';

const TECH_DIR = resolve(process.cwd(), 'content/techniques');

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// ---- zod schemas mirroring §5 ----

const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

// Closed TopicId union mirroring §5 / src/types.ts. Kept in sync by hand.
const topicId = z.enum([
  'brainteasers', 'probability', 'combinatorics', 'expected-value',
  'bayes', 'markov-chains', 'martingales', 'distributions',
  'calculus', 'linear-algebra', 'statistics', 'stochastic-processes',
  'options-intuition', 'market-making', 'mental-math',
]);

const answerSchema: z.ZodType<AnswerSpec> = z.union([
  z.object({ type: z.literal('numeric'), value: z.number(), tolerance: z.number().optional(), display: z.string().optional() }),
  z.object({ type: z.literal('multiple-choice'), options: z.array(z.string()).min(2), correctIndex: z.number().int().nonnegative() }),
  z.object({ type: z.literal('self-graded') }),
]);

const hintsSchema = z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]);

const problemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  topic: topicId,
  techniques: z.array(z.string()).min(1).max(3),
  difficulty,
  source: z.union([z.literal('original'), z.literal('classic-rewrite')]),
  statement: z.string().min(1),
  hints: hintsSchema,
  solution: z.string().min(1),
  answer: answerSchema,
  estMinutes: z.number().positive(),
  followUps: z.array(z.string()).optional(),
});

// ---- helpers ----

const techniqueFiles = new Set(
  existsSync(TECH_DIR)
    ? readdirSync(TECH_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''))
    : [],
);

function checkAnswer(id: string, answer: AnswerSpec): void {
  if (answer.type === 'numeric' && !Number.isFinite(answer.value)) {
    fail(`${id}: numeric answer value is not finite (${answer.value})`);
  }
  if (answer.type === 'multiple-choice') {
    if (answer.correctIndex < 0 || answer.correctIndex >= answer.options.length) {
      fail(`${id}: multiple-choice correctIndex ${answer.correctIndex} out of range`);
    }
  }
}

function checkTechniques(id: string, techniques: string[]): void {
  for (const t of techniques) {
    if (!techniqueFiles.has(t)) {
      fail(`${id}: technique "${t}" has no page in content/techniques/${t}.md`);
    }
  }
}

function checkSolution(id: string, solution: string): void {
  if (!solution.includes('**Pattern:**')) {
    fail(`${id}: solution is missing the "**Pattern:**" block (§6.4)`);
  }
  if (!solution.includes('**Interview follow-ups:**')) {
    fail(`${id}: solution is missing the "**Interview follow-ups:**" block (§6.4)`);
  }
}

// ---- uniqueness across static + generator ----

const ids = [...problems.map((p) => p.id), ...generators.map((g) => g.id)];
const seen = new Set<string>();
for (const id of ids) {
  if (seen.has(id)) fail(`duplicate id: ${id}`);
  seen.add(id);
}

// ---- static problems ----

for (const p of problems) {
  const parsed = problemSchema.safeParse(p);
  if (!parsed.success) {
    fail(`${p.id ?? '(unknown)'}: schema error — ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
    continue;
  }
  checkAnswer(p.id, p.answer);
  checkTechniques(p.id, p.techniques);
  checkSolution(p.id, p.solution);
}

// ---- generators (instantiate and validate one instance) ----

const SEEDS = [0.123, 0.5, 0.871, 0.04];
for (const g of generators) {
  if (!/^[a-z0-9-]+$/.test(g.id)) fail(`${g.id}: id must be kebab-case`);
  if (!topicId.safeParse(g.topic).success) fail(`${g.id}: invalid topic "${g.topic}" (not a §5 TopicId)`);
  if (g.techniques.length < 1 || g.techniques.length > 3) fail(`${g.id}: techniques must be 1–3`);
  checkTechniques(g.id, g.techniques);
  for (const s of SEEDS) {
    let inst: GeneratedInstance;
    try {
      let x = s;
      inst = g.generate(() => { x = (x * 9301 + 49297) % 233280 / 233280; return x; });
    } catch (e) {
      fail(`${g.id}: generate() threw — ${(e as Error).message}`);
      break;
    }
    if (inst.hints.length !== 3) fail(`${g.id}: generated instance has ${inst.hints.length} hints, expected 3`);
    checkAnswer(g.id, inst.answer);
    checkSolution(g.id, inst.solution);
  }
}

// ---- report ----

if (errors.length > 0) {
  console.error(`\n✗ Content validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ Content valid: ${problems.length} static problem(s), ${generators.length} generator(s), ${techniqueFiles.size} technique page(s).`);
