// Hash router (no router lib, per SPEC §3): #feed #drill #stats #techniques #settings.

import { useEffect, useState } from 'react';
import { todayISO } from './today';
import { Feed } from './components/Feed';
import { DrillMode } from './components/DrillMode';
import { StatsView } from './components/StatsView';
import { TechniquesIndex, TechniquePage } from './components/TechniquePage';
import { SettingsView } from './components/SettingsView';

type Route =
  | { name: 'feed' }
  | { name: 'drill' }
  | { name: 'stats' }
  | { name: 'techniques'; id?: string }
  | { name: 'settings' };

function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  const [head, sub] = path.split('/');
  switch (head) {
    case 'drill': return { name: 'drill' };
    case 'stats': return { name: 'stats' };
    case 'techniques': return { name: 'techniques', ...(sub ? { id: sub } : {}) };
    case 'settings': return { name: 'settings' };
    case 'feed':
    case '':
    default: return { name: 'feed' };
  }
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

const NAV: Array<{ href: string; label: string; match: Route['name'] }> = [
  { href: '#feed', label: 'feed', match: 'feed' },
  { href: '#drill', label: 'drill', match: 'drill' },
  { href: '#stats', label: 'stats', match: 'stats' },
  { href: '#techniques', label: 'techniques', match: 'techniques' },
  { href: '#settings', label: 'settings', match: 'settings' },
];

export function App() {
  const route = useHashRoute();
  const today = todayISO();

  return (
    <div className="app">
      <nav className="nav" aria-label="Primary">
        <span className="nav__brand">QuantFeed <small>quant interview trainer</small></span>
        <div className="nav__links">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`nav__link${route.name === n.match ? ' nav__link--active' : ''}`}
              aria-current={route.name === n.match ? 'page' : undefined}
            >
              {n.label}
            </a>
          ))}
        </div>
      </nav>

      <main className="route">
        {route.name === 'feed' && <Feed key={today} today={today} />}
        {route.name === 'drill' && <DrillMode today={today} />}
        {route.name === 'stats' && <StatsView today={today} />}
        {route.name === 'techniques' && (
          route.id ? <TechniquePage id={route.id} /> : <TechniquesIndex />
        )}
        {route.name === 'settings' && <SettingsView today={today} />}
      </main>
    </div>
  );
}
