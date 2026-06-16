// Render smoke: every route component renders to markup without throwing on a
// clean (empty) store. Effects (IntersectionObserver, timers) don't run under
// server rendering, but render-time crashes — bad props, undefined access — do
// surface here. No JSX so this stays a .test.ts.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Feed } from './Feed';
import { DrillMode } from './DrillMode';
import { StatsView } from './StatsView';
import { SettingsView } from './SettingsView';
import { TechniquesIndex, TechniquePage } from './TechniquePage';

const TODAY = '2026-06-16';

describe('route components render on an empty store', () => {
  it('Feed renders new problem cards', () => {
    const html = renderToStaticMarkup(createElement(Feed, { today: TODAY }));
    expect(html).toContain('card');
    expect(html).toContain('new'); // every seed item is "new" on a fresh store
  });

  it('DrillMode renders the preset picker', () => {
    const html = renderToStaticMarkup(createElement(DrillMode, { today: TODAY }));
    expect(html).toContain('Optiver pace');
    expect(html).toContain('Sprint');
  });

  it('StatsView renders the streak + data controls', () => {
    const html = renderToStaticMarkup(createElement(StatsView, { today: TODAY }));
    expect(html).toContain('day streak');
    expect(html).toContain('Export backup');
  });

  it('SettingsView renders topic toggles', () => {
    const html = renderToStaticMarkup(createElement(SettingsView, { today: TODAY }));
    expect(html).toContain('Topics in the feed');
    expect(html).toContain('New per session');
  });

  it('TechniquesIndex lists technique pages', () => {
    const html = renderToStaticMarkup(createElement(TechniquesIndex, {}));
    expect(html).toContain('Techniques');
    expect(html).toContain('backward-induction');
  });

  it('TechniquePage renders a known page and a missing one', () => {
    const ok = renderToStaticMarkup(createElement(TechniquePage, { id: 'optional-stopping' }));
    expect(ok).toContain('Optional stopping');
    const missing = renderToStaticMarkup(createElement(TechniquePage, { id: 'no-such-technique' }));
    expect(missing).toContain('No page for');
  });
});
