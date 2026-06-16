// App-side content access. Re-exports the problem/generator registry and loads
// technique markdown via Vite's glob import (raw strings, bundled at build).

import { problems, generators } from '../content/index';
import type { GeneratorProblem, Problem, TechniqueId } from './types';

export { problems, generators };

const rawTechniques = import.meta.glob('../content/techniques/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** technique id (kebab filename) → markdown source. */
export const techniques: Record<TechniqueId, string> = Object.fromEntries(
  Object.entries(rawTechniques).map(([path, md]) => {
    const id = path.split('/').pop()!.replace(/\.md$/, '');
    return [id, md];
  }),
);

export const techniqueIds: TechniqueId[] = Object.keys(techniques).sort();

/** First non-empty line of a technique page (its `# Title`), for the index. */
export function techniqueTitle(id: TechniqueId): string {
  const md = techniques[id] ?? '';
  const first = md.split('\n').find((l) => l.trim().startsWith('#'));
  return first ? first.replace(/^#+\s*/, '').trim() : id;
}

/** Problem ids tagged with a given technique (static + generators). */
export function problemsForTechnique(id: TechniqueId): string[] {
  const out: string[] = [];
  for (const p of problems) if (p.techniques.includes(id)) out.push(p.id);
  for (const g of generators) if (g.techniques.includes(id)) out.push(g.id);
  return out;
}

/** All content as a flat list of {id, topic, techniques, ...} for lookups. */
export function findStatic(id: string): Problem | undefined {
  return problems.find((p) => p.id === id);
}
export function findGenerator(id: string): GeneratorProblem | undefined {
  return generators.find((g) => g.id === id);
}
