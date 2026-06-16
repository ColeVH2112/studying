// Vitest setup: install the minimal browser globals the app touches, so route
// components can be render-smoke-tested in the node environment without jsdom.
// Runs before any test module is imported (vite.config test.setupFiles).

class MemStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

const g = globalThis as unknown as Record<string, unknown>;

if (!g.localStorage) g.localStorage = new MemStorage();
if (!g.matchMedia) g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
if (!g.IntersectionObserver) {
  g.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}
