// Techniques — SPEC §8.4. An index of technique pages, and the per-technique page
// rendered from its markdown.

import { MathMarkdown } from './MathMarkdown';
import { problemsForTechnique, techniqueIds, techniqueTitle, techniques } from '../content';

export function TechniquesIndex() {
  return (
    <div className="scroll-route">
      <div className="page">
        <h1 className="page__title">Techniques</h1>
        <p className="lead">The unit of learning is the technique, not the problem. Each page: what it is, when it fires, a worked micro-example.</p>
        <div className="tech-index">
          {techniqueIds.map((id) => {
            const count = problemsForTechnique(id).length;
            return (
              <a key={id} className="tech-card" href={`#techniques/${id}`}>
                <h3>{techniqueTitle(id)}</h3>
                <span className="count">{id}</span>
                <div className="count">{count} problem{count === 1 ? '' : 's'}</div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function TechniquePage({ id }: { id: string }) {
  const md = techniques[id];
  return (
    <div className="scroll-route">
      <div className="page">
        <p><a href="#techniques">← all techniques</a></p>
        {md ? (
          <MathMarkdown>{md}</MathMarkdown>
        ) : (
          <div className="empty">
            <h2>No page for “{id}”.</h2>
            <p>This technique doesn’t have a page yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
