// Stats — SPEC §8.3. Per-topic table, 7-day due forecast, daily streak, totals,
// drill PB trend, and data export / import / reset (§10).

import { useMemo, useRef, useState } from 'react';
import type { TopicId } from '../types';
import { addDays, diffDays } from '../engine/dates';
import { downloadExport, parseImport } from '../engine/storage';
import { applyImport, buildExport, resetAll, useApp } from '../store';
import { generators, problems } from '../content';

const topicOfId = new Map<string, TopicId>();
for (const p of problems) topicOfId.set(p.id, p.topic);
for (const g of generators) topicOfId.set(g.id, g.topic);

export function StatsView({ today }: { today: string }) {
  const app = useApp();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const perTopic = useMemo(() => {
    const acc = new Map<TopicId, { attempts: number; correct: number; hints: number; lapses: number }>();
    for (const r of app.reviews) {
      const t = topicOfId.get(r.problemId);
      if (!t) continue;
      const cur = acc.get(t) ?? { attempts: 0, correct: 0, hints: 0, lapses: 0 };
      for (const h of r.history) {
        cur.attempts += 1;
        if (h.grade >= 1) cur.correct += 1; // grade 0 is the only "wrong" outcome
        cur.hints += h.hintsUsed;
      }
      cur.lapses += r.lapses;
      acc.set(t, cur);
    }
    return [...acc.entries()].sort((a, b) => b[1].attempts - a[1].attempts);
  }, [app.reviews]);

  const forecast = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(today, i), count: 0, label: i === 0 ? 'today' : `+${i}` }));
    for (const r of app.reviews) {
      const d = diffDays(today, r.due); // days from today to due
      if (d <= 0) (days[0] as { count: number }).count += 1; // overdue + due today
      else if (d < 7) (days[d] as { count: number }).count += 1;
    }
    return days;
  }, [app.reviews, today]);
  const maxForecast = Math.max(1, ...forecast.map((d) => d.count));

  const streak = useMemo(() => computeStreak(app.reviews.flatMap((r) => r.history.map((h) => h.date)), today), [app.reviews, today]);

  const totals = useMemo(() => {
    const attempts = app.reviews.reduce((a, r) => a + r.history.length, 0);
    const dueNow = app.reviews.filter((r) => diffDays(r.due, today) >= 0).length;
    return { learned: app.reviews.length, attempts, dueNow, drills: app.drills.length };
  }, [app.reviews, app.drills, today]);

  const drillTrend = useMemo(() => app.drills.slice(-20), [app.drills]);
  const maxDrill = Math.max(1, ...drillTrend.map((d) => d.correct));

  function doExport() {
    downloadExport(buildExport(), today);
    setMsg('Exported backup JSON.');
  }
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      const res = parseImport(text);
      if (res.ok) { applyImport(res.blob); setMsg('Imported and replaced local data.'); }
      else setMsg(`Import failed: ${res.error}`);
    });
    e.target.value = '';
  }
  function doReset() {
    if (confirm('Erase all QuantFeed progress on this device? This cannot be undone (export first).')) {
      resetAll();
      setMsg('All data reset.');
    }
  }

  return (
    <div className="scroll-route">
      <div className="page">
        <h1 className="page__title">Stats</h1>

        <div className="stat-grid">
          <div className="stat"><div className="v">{streak}</div><div className="k">day streak</div></div>
          <div className="stat"><div className="v">{totals.learned}</div><div className="k">problems started</div></div>
          <div className="stat"><div className="v">{totals.attempts}</div><div className="k">total attempts</div></div>
          <div className="stat"><div className="v">{totals.dueNow}</div><div className="k">due now</div></div>
        </div>

        <h2>Due forecast</h2>
        <div className="forecast" role="img" aria-label="reviews due over the next 7 days">
          {forecast.map((d) => (
            <div key={d.date} className="forecast__bar">
              <span className="forecast__lbl">{d.count}</span>
              <div className="forecast__fill" style={{ height: `${(d.count / maxForecast) * 100}%` }} />
              <span className="forecast__lbl">{d.label}</span>
            </div>
          ))}
        </div>

        <h2>By topic</h2>
        {perTopic.length === 0 ? (
          <p className="muted">No attempts yet — answer some problems in the <a href="#feed">feed</a>.</p>
        ) : (
          <table className="table">
            <thead><tr><th>topic</th><th>attempts</th><th>accuracy</th><th>avg hints</th><th>lapses</th></tr></thead>
            <tbody>
              {perTopic.map(([t, v]) => (
                <tr key={t}>
                  <td>{t.replace(/-/g, ' ')}</td>
                  <td className="num">{v.attempts}</td>
                  <td className="num">{v.attempts > 0 ? Math.round((v.correct / v.attempts) * 100) : 0}%</td>
                  <td className="num">{v.attempts > 0 ? (v.hints / v.attempts).toFixed(1) : '0.0'}</td>
                  <td className="num">{v.lapses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2>Drill PB trend</h2>
        {drillTrend.length === 0 ? (
          <p className="muted">No drills yet — try the <a href="#drill">Optiver pace</a>.</p>
        ) : (
          <div className="spark" role="img" aria-label="recent drill scores">
            {drillTrend.map((d, i) => (
              <div key={i} className="spark__bar" title={`${d.preset}: ${d.correct}/${d.total}`}
                style={{ height: `${(d.correct / maxDrill) * 100}%` }} />
            ))}
          </div>
        )}

        <hr className="divider" />
        <h2>Data</h2>
        <p className="muted">All progress lives in this browser. Export a backup or move it to another device.</p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={doExport}>Export backup</button>
          <button type="button" className="btn btn--quiet" onClick={() => fileRef.current?.click()}>Import backup</button>
          <button type="button" className="btn btn--quiet" onClick={doReset}>Reset all</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onPickFile} />
        </div>
        {msg && <p className="muted" role="status" style={{ marginTop: 'var(--sp-3)' }}>{msg}</p>}
      </div>
    </div>
  );
}

/** Consecutive days ending today (or yesterday, if today not yet studied). */
function computeStreak(dates: string[], today: string): number {
  const set = new Set(dates);
  if (set.size === 0) return 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) { streak += 1; cursor = addDays(cursor, -1); }
  return streak;
}
