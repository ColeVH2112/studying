// Render-layer guard: every seed problem must render its math and prose without
// a KaTeX parse error, with display blocks centered and the **Pattern:** /
// **Interview follow-ups:** blocks bold. Catches the multi-line `$$` desync
// regression (see normalizeDisplayMath). No JSX so this stays a .test.ts.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathMarkdown, normalizeDisplayMath } from './MathMarkdown';
import { problems, generators } from '../content';
import { materialize } from '../engine/materialize';

function render(md: string): string {
  return renderToStaticMarkup(createElement(MathMarkdown, { children: md }));
}

describe('normalizeDisplayMath', () => {
  it('puts $$ fences on their own lines', () => {
    expect(normalizeDisplayMath('text\n$$a=b$$\nmore')).toContain('\n$$\na=b\n$$\n');
  });
  it('leaves inline math untouched', () => {
    expect(normalizeDisplayMath('worth $x$ here')).toBe('worth $x$ here');
  });
});

describe('seed content renders cleanly', () => {
  const samples: Array<{ name: string; md: string; display: boolean }> = [
    ...problems.map((p) => ({ name: `${p.id} statement`, md: p.statement, display: false })),
    ...problems.map((p) => ({ name: `${p.id} solution`, md: p.solution, display: true })),
    ...generators.map((g) => {
      const inst = materialize({ kind: 'generator', problem: g }, 0);
      return { name: `${g.id} solution`, md: inst.solution, display: true };
    }),
  ];

  for (const s of samples) {
    it(`${s.name}: no KaTeX error`, () => {
      const html = render(s.md);
      expect(html).not.toContain('katex-error');
    });
  }

  it('every solution renders display math as a centered block and bold Pattern/Follow-ups', () => {
    for (const p of problems) {
      const html = render(p.solution);
      expect(html, p.id).toContain('katex-display');
      expect((html.match(/<strong>/g) ?? []).length, p.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('preserves escaped literal dollars in the ruin statement (not parsed as math)', () => {
    const ruin = problems.find((p) => p.id === 'ruin-2-of-5')!;
    const html = render(ruin.statement);
    expect(html).not.toContain('katex'); // the statement has no real math, only \$ literals
    expect(html).toContain('$2');
    expect(html).toContain('$5');
  });
});
